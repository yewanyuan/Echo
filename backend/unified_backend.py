"""
Unified Backend for E-book Reader
Combines EPUB processing and AI services in a single server
"""

from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import json
import os
from openai import OpenAI
from dotenv import load_dotenv, find_dotenv
import logging
from datetime import datetime
import hashlib
import uuid
import ebooklib
from ebooklib import epub
from bs4 import BeautifulSoup
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="Echo Reader Unified Backend", version="2.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration class for easy API management
load_dotenv(find_dotenv())

class Config:
    """Configuration for AI services"""
    DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY")
    DEEPSEEK_BASE_URL = "https://api.deepseek.com"
    DEEPSEEK_MODEL = "deepseek-reasoner"

    # Max tokens for different operations
    MAX_TOKENS_SUMMARY = 1500  # Increased for complete book summaries
    MAX_TOKENS_CHAPTER = 1200  # Dedicated setting for chapter summaries
    MAX_TOKENS_ANALYSIS = 2000  # Increased for comprehensive analysis
    MAX_TOKENS_CHAT = 1000  # Increased for better chat responses

    # Temperature settings for different features
    TEMP_SUMMARY = 0.3  # Lower for factual summaries
    TEMP_ANALYSIS = 0.5  # Moderate for analytical content
    TEMP_CHAT = 0.7  # Higher for conversational responses

config = Config()

# Ensure API key is configured at startup
if not config.DEEPSEEK_API_KEY or config.DEEPSEEK_API_KEY == "your_api_key_here":
    raise RuntimeError("DEEPSEEK_API_KEY is not configured. Set it in .env or environment.")

# Initialize DeepSeek client
deepseek_client = OpenAI(
    api_key=config.DEEPSEEK_API_KEY,
    base_url=config.DEEPSEEK_BASE_URL
)

# In-memory storage for processed books (in production, use a database)
processed_books = {}

# ===================================
# EPUB Processing Functions
# ===================================

def parse_epub_file(file_content: bytes) -> dict:
    """Parse EPUB file and extract content"""
    try:
        # Create a temporary file to process the EPUB
        import tempfile
        with tempfile.NamedTemporaryFile(suffix='.epub', delete=False) as tmp_file:
            tmp_file.write(file_content)
            tmp_path = tmp_file.name

        book = epub.read_epub(tmp_path)

        # Extract metadata
        metadata = {
            'title': 'Unknown Title',
            'author': 'Unknown Author',
            'language': 'en',
            'publisher': '',
            'description': '',
            'publication_date': ''
        }

        # Extract title
        if book.get_metadata('DC', 'title'):
            metadata['title'] = book.get_metadata('DC', 'title')[0][0]

        # Extract author
        if book.get_metadata('DC', 'creator'):
            metadata['author'] = book.get_metadata('DC', 'creator')[0][0]

        # Extract language
        if book.get_metadata('DC', 'language'):
            metadata['language'] = book.get_metadata('DC', 'language')[0][0]

        # Extract chapters and content
        chapters = []
        full_text = ""
        toc = []

        # Process navigation
        if book.spine:
            chapter_count = 0
            for item_id, linear in book.spine:
                item = book.get_item_with_id(item_id)
                if item and item.get_type() == ebooklib.ITEM_DOCUMENT:
                    content = item.get_content().decode('utf-8', errors='ignore')
                    soup = BeautifulSoup(content, 'html.parser')

                    # Extract text
                    text = soup.get_text(separator='\n', strip=True)

                    # Try to find chapter title
                    title = None
                    for heading in soup.find_all(['h1', 'h2', 'h3']):
                        heading_text = heading.get_text(strip=True)
                        if heading_text:
                            title = heading_text
                            break

                    if not title:
                        title = f"Chapter {chapter_count + 1}"

                    # Clean and format HTML content
                    # Remove scripts and styles
                    for script in soup(["script", "style"]):
                        script.decompose()

                    # Convert to clean HTML
                    clean_html = str(soup)

                    chapters.append({
                        'id': item_id,
                        'title': title,
                        'content': clean_html,
                        'text': text[:10000]  # Limit for AI processing
                    })

                    full_text += text + "\n\n"
                    chapter_count += 1

        # Build table of contents
        if hasattr(book, 'toc'):
            def parse_toc_item(item, level=0):
                toc_entry = {
                    'title': str(item.title) if hasattr(item, 'title') else 'Unknown',
                    'href': str(item.href) if hasattr(item, 'href') else '',
                    'level': level
                }
                toc.append(toc_entry)

                if hasattr(item, 'subitems') and item.subitems:
                    for subitem in item.subitems:
                        parse_toc_item(subitem, level + 1)

            for item in book.toc:
                parse_toc_item(item)

        # Clean up temp file
        os.unlink(tmp_path)

        # Generate unique ID for this book
        book_id = str(uuid.uuid4())

        # Store processed book
        book_data = {
            'id': book_id,
            'metadata': metadata,
            'chapters': chapters[:50],  # Limit chapters for performance
            'toc': toc,
            'full_text': full_text[:30000]  # Limit for AI processing
        }

        processed_books[book_id] = book_data

        return book_data

    except Exception as e:
        logger.error(f"Error parsing EPUB: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to parse EPUB file: {str(e)}")

# ===================================
# AI Processing Functions
# ===================================

def call_deepseek_api(messages: List[Dict], max_tokens: int = 1000, temperature: float = 0.5, model: str = None) -> str:
    """Call DeepSeek API with error handling

    Args:
        messages: List of message dicts for the chat
        max_tokens: Maximum tokens for response
        temperature: Temperature for response generation
        model: Optional model override (defaults to config.DEEPSEEK_MODEL)
    """
    try:
        # Use provided model or default from config
        api_model = model if model else config.DEEPSEEK_MODEL

        logger.info(f"Calling DeepSeek API with model={api_model}, max_tokens={max_tokens}, temperature={temperature}")
        logger.info(f"Messages being sent: {json.dumps(messages, ensure_ascii=False)[:500]}...")  # Log first 500 chars

        response = deepseek_client.chat.completions.create(
            model=api_model,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
            stream=False
        )

        # Log the full response structure
        logger.info(f"Response object: {response}")

        if response.choices and len(response.choices) > 0:
            content = response.choices[0].message.content
            logger.info(f"DeepSeek API returned content of length: {len(content) if content else 0}")
            if content:
                logger.info(f"First 200 chars of content: {content[:200]}")
            else:
                logger.warning("DeepSeek API returned None or empty content")
                # Log more details about the response
                logger.warning(f"Choice object: {response.choices[0]}")
                logger.warning(f"Message object: {response.choices[0].message}")
        else:
            logger.error("No choices in response")
            content = None

        return content if content else ""
    except Exception as e:
        logger.error(f"DeepSeek API error: {e}")
        logger.error(f"Error type: {type(e)}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

# ===================================
# Pydantic Models
# ===================================

class BookContent(BaseModel):
    title: str
    author: Optional[str] = None
    full_text: str
    chapters: Optional[List[Dict[str, str]]] = None
    language: Optional[str] = "en"  # Add language parameter

class ChapterSummaryRequest(BaseModel):
    book_title: str
    chapters: List[Dict[str, str]]
    language: Optional[str] = "en"  # Add language parameter

class ContentAnalysisRequest(BaseModel):
    book_title: str
    content: str
    analysis_type: Optional[str] = "comprehensive"
    language: Optional[str] = "en"  # Add language parameter

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    book_context: Optional[Dict[str, str]] = None
    language: Optional[str] = "en"  # Add language parameter

class AIResponse(BaseModel):
    success: bool
    data: Optional[Dict] = None
    error: Optional[str] = None

# ===================================
# API Endpoints
# ===================================

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Echo Reader Unified Backend",
        "features": ["EPUB Processing", "AI Analysis"],
        "ai_model": config.DEEPSEEK_MODEL,
        "version": "2.0.0"
    }

# ===================================
# EPUB Processing Endpoints
# ===================================

@app.post("/upload-epub")
async def upload_epub(file: UploadFile = File(...)):
    """Upload and process EPUB file"""
    # Validate file type
    if not file.filename.endswith('.epub'):
        raise HTTPException(status_code=400, detail="Only EPUB files are supported")

    # Read file content
    content = await file.read()

    # Parse EPUB
    book_data = parse_epub_file(content)

    # Also prepare for AI processing
    if book_data:
        # Store for AI features
        book_data['uploaded_at'] = datetime.now().isoformat()

    return book_data

@app.get("/book/{book_id}")
async def get_book(book_id: str):
    """Get processed book by ID"""
    if book_id not in processed_books:
        raise HTTPException(status_code=404, detail="Book not found")
    return processed_books[book_id]

# ===================================
# AI Feature Endpoints
# ===================================

@app.post("/api/upload-book")
async def upload_book_for_ai(file: UploadFile = File(...)):
    """Upload book for AI processing (supports EPUB)"""
    if file.filename.endswith('.epub'):
        content = await file.read()
        book_data = parse_epub_file(content)

        # Prepare for AI
        return AIResponse(
            success=True,
            data={
                "title": book_data['metadata']['title'],
                "author": book_data['metadata']['author'],
                "full_text": book_data['full_text'],
                "chapters": [{"title": ch['title'], "content": ch['text']} for ch in book_data['chapters']]
            }
        )
    else:
        raise HTTPException(status_code=400, detail="Unsupported file format")

@app.post("/api/book-summary")
async def generate_book_summary(request: BookContent):
    """Generate a comprehensive summary of the entire book"""
    try:
        # Debug logging
        logger.info(f"Book summary request - Language: {request.language}")

        # Language-specific prompts - DIRECT, NO CONVERSATIONAL TONE
        if request.language == "zh":
            system_prompt = """你是一位专业的文学分析专家。直接提供书籍的全面摘要。
不要使用对话语气，不要说"当然"、"好的"等词语。
直接开始摘要内容。使用清晰的段落分隔。
避免使用markdown符号如###、**等。"""

            user_prompt = f"""书名：{request.title}
作者：{request.author or '未知'}

基于以下内容提供这本书的全面摘要：

{request.full_text[:10000]}

摘要应包含以下部分（用段落分隔）：

概述和主要情节

关键角色

主要主题

写作风格和语调

结论和意义"""
        else:
            system_prompt = """You are a professional literary analyst. Provide a direct, comprehensive summary of the book.
Do not use conversational tone. Do not say "Of course", "Certainly", or similar phrases.
Start directly with the summary content. Use clear paragraph breaks.
Avoid markdown symbols like ###, **, etc."""

            user_prompt = f"""Book Title: {request.title}
Author: {request.author or 'Unknown'}

Provide a comprehensive summary of this book based on the following content:

{request.full_text[:10000]}

The summary should include these sections (separated by paragraphs):

Overview and main plot

Key characters

Major themes

Writing style and tone

Conclusion and significance"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        summary = call_deepseek_api(messages, config.MAX_TOKENS_SUMMARY, config.TEMP_SUMMARY)

        return AIResponse(
            success=True,
            data={
                "summary": summary,
                "book_title": request.title,
                "generated_at": datetime.now().isoformat()
            }
        )
    except Exception as e:
        logger.error(f"Error generating book summary: {e}")
        return AIResponse(success=False, error=str(e))

@app.post("/api/chapter-summaries")
async def generate_chapter_summaries(request: ChapterSummaryRequest):
    """Generate summaries for individual chapters - using deepseek-chat for faster generation"""
    try:
        # Debug logging
        logger.info(f"Chapter summaries request - Language: {request.language}")
        logger.info(f"Total chapters received: {len(request.chapters)}")

        summaries = []

        # Filter out non-chapter entries
        def is_actual_chapter(chapter_title):
            """Check if this is an actual chapter vs metadata pages"""
            title_lower = chapter_title.lower()
            # Common non-chapter patterns in both English and Chinese
            non_chapter_patterns = [
                # Chinese patterns
                '书名页', '标题页', '扉页', '赠献页', '献词', '序言', '序', '前言',
                '目录', '致谢', '后记', '跋', '附录', '版权', '封底',
                # English patterns
                'title page', 'dedication', 'preface', 'foreword', 'introduction',
                'contents', 'table of contents', 'acknowledgments', 'epilogue',
                'appendix', 'copyright', 'about the author', 'cover'
            ]

            # Check if title matches non-chapter patterns
            for pattern in non_chapter_patterns:
                if pattern in title_lower:
                    logger.info(f"Skipping non-chapter: {chapter_title}")
                    return False

            # Check if it's a numbered chapter (1, 2, 3... or Chapter 1, etc.)
            import re
            if re.match(r'^(chapter\s+)?\d+$|^第?\d+章?$', title_lower):
                return True

            # If title is very short and not a number, it might be metadata
            if len(chapter_title.strip()) < 2:
                return False

            return True

        # Language-specific prompts - DIRECT, NO CONVERSATIONAL TONE
        if request.language == "zh":
            system_prompt = """你是章节摘要专家。
            直接提供清晰、简洁的摘要，字数不超过三百字。
            不要使用对话语气。
            避免使用markdown符号。"""
        else:
            system_prompt = """You are an expert at summarizing book chapters.
            Provide direct, clear, concise summaries, and the word count should not exceed 300 words.
            Do not use conversational tone.
            Avoid markdown symbols."""

        # Process only actual chapters, limit to 25
        actual_chapters = [ch for ch in request.chapters if is_actual_chapter(ch.get('title', ''))]
        logger.info(f"Actual chapters to process: {len(actual_chapters)}")

        for chapter in actual_chapters[:25]:  # Limit to first 25 actual chapters
            # Extract chapter content with fallback handling
            chapter_content = chapter.get('content', chapter.get('text', ''))

            # Log chapter details
            logger.info(f"Processing chapter: '{chapter.get('title', 'Unknown')}' - Content length: {len(chapter_content) if chapter_content else 0}")

            # Log if content is empty
            if not chapter_content or len(chapter_content.strip()) < 25:
                logger.warning(f"Chapter '{chapter.get('title', 'Unknown')}' has no or minimal content - skipping")
                # Add placeholder for empty chapters
                summaries.append({
                    "chapter_title": chapter.get('title', 'Unknown'),
                    "summary": ""  # Empty summary for chapters without content
                })
                continue

            if request.language == "zh":
                user_prompt = f"""书籍：{request.book_title}
章节：{chapter['title']}

内容：
{chapter_content[:3000]}

直接提供这一章的摘要，包括：
主要事件
角色发展
关键揭示或情节要点
与整体叙述的联系"""
            else:
                user_prompt = f"""Book: {request.book_title}
Chapter: {chapter['title']}

Content:
{chapter_content[:3000]}

Directly provide a summary of this chapter including:
Main events
Character developments
Key revelations or plot points
Connection to overall narrative"""

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]

            try:
                # Use deepseek-chat model specifically for chapter summaries (faster)
                summary = call_deepseek_api(messages, config.MAX_TOKENS_CHAPTER, config.TEMP_SUMMARY, model="deepseek-chat")

                # Check if summary is valid
                if not summary or len(summary.strip()) < 10:
                    logger.warning(f"Empty or very short summary returned for chapter: {chapter['title']}")
                    logger.warning(f"Summary content: '{summary}'")
                    # Try with a simpler prompt
                    if request.language == "zh":
                        simple_prompt = f"请用一段话总结这一章的主要内容：\n\n{chapter_content[:1500]}"
                    else:
                        simple_prompt = f"Please summarize this chapter in one paragraph:\n\n{chapter_content[:1500]}"

                    messages_simple = [
                        {"role": "system", "content": "You are a book summarizer. Provide a brief summary."},
                        {"role": "user", "content": simple_prompt}
                    ]

                    summary = call_deepseek_api(messages_simple, config.MAX_TOKENS_CHAPTER, 0.5, model="deepseek-chat")
                    logger.info(f"Retry with simple prompt for chapter: {chapter['title']}")

                # Log success
                logger.info(f"Generated summary for chapter: {chapter['title']} - Length: {len(summary) if summary else 0}")

            except Exception as api_error:
                logger.error(f"Failed to generate summary for chapter '{chapter['title']}': {api_error}")
                summary = ""

            # Only add non-empty summaries
            if summary and summary.strip():
                summaries.append({
                    "chapter_title": chapter['title'],
                    "summary": summary.strip()
                })
            else:
                logger.warning(f"Skipping chapter '{chapter['title']}' due to empty summary")

        # Log final results
        logger.info(f"Total summaries generated: {len(summaries)}")

        if len(summaries) == 0:
            logger.warning("No summaries were generated - all chapters may have been filtered out or had no content")

        return AIResponse(
            success=True,
            data={
                "book_title": request.book_title,
                "chapter_summaries": summaries,
                "generated_at": datetime.now().isoformat()
            }
        )
    except Exception as e:
        logger.error(f"Error generating chapter summaries: {e}")
        return AIResponse(success=False, error=str(e))

@app.post("/api/content-analysis")
async def analyze_content(request: ContentAnalysisRequest):
    """Perform deep content analysis"""
    try:
        # Debug logging
        logger.info(f"Content analysis request - Language: {request.language}")

        # Language-specific prompts with structured format - DIRECT, NO CONVERSATIONAL TONE
        if request.language == "zh":
            system_prompt = """你是专业的文学评论家。
            直接提供学术级别的文本分析。
            不要使用对话语气，不要说"当然"、"好的"等词语。

            格式规则：
            - 使用清晰、自然的语言
            - 用 ## 来标记章节标题
            - 使用编号列表（1. 2. 3.）
            - 每个编号点独占一行
            - 避免特殊字符如【】或—
            - 专业但易读的语气"""

            user_prompt = f"""书籍：{request.book_title}

分析内容：
{request.content[:10000]}

直接提供以下结构化部分的文学分析：

## 类型
分析文本的类型，如小说、诗歌、戏剧等。以及属于教育类、推理类、历史类等哪个子类型。

## 主要主题及发展
分析核心主题以及它们如何发展演变。

## 角色及性格
分析主要角色、动机、发展弧线和关系。

## 写作风格及技巧
分析写作风格、叙述技巧和文学手法。

## 象征主义与文学手法
识别并分析象征、隐喻和其他文学手法。

## 历史文化背景
如相关，讨论历史和文化背景及影响。"""
        else:
            system_prompt = """You are a professional literary critic.
            Provide direct, academic-level analysis of the text.
            Do not use conversational tone. Do not say "Of course", "Certainly", or similar phrases.

            Formatting rules:
            - Use clear, natural language
            - Structure with ## for section headings
            - Use numbered lists (1. 2. 3.)
            - Each numbered point on its own line
            - Avoid special characters like 【】or —
            - Professional yet readable tone"""

            user_prompt = f"""Book: {request.book_title}

Content for analysis:
{request.content[:10000]}

Directly provide literary analysis with these structured sections:

##Type
Analyze the types of text, such as novels, poems, dramas, etc. And which subtype does it belong to, such as education, reasoning, history, etc.

## Major Themes and Development
Analyze core themes and how they develop and evolve.

## Characters and Personalities
Analyze main characters, motivations, development arcs, and relationships.

## Writing Style and Techniques
Analyze writing style, narrative techniques, and literary approaches.

## Symbolism and Literary Devices
Identify and analyze symbols, metaphors, and other literary devices.

## Historical and Cultural Context
If relevant, discuss historical and cultural context and influence."""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        analysis = call_deepseek_api(messages, config.MAX_TOKENS_ANALYSIS, config.TEMP_ANALYSIS)

        return AIResponse(
            success=True,
            data={
                "analysis_type": request.analysis_type,
                "analysis": analysis,
                "book_title": request.book_title,
                "generated_at": datetime.now().isoformat()
            }
        )
    except Exception as e:
        logger.error(f"Error analyzing content: {e}")
        return AIResponse(success=False, error=str(e))

@app.post("/api/chat")
async def chat_with_assistant(request: ChatRequest):
    """Interactive chat about the book - supports multi-turn conversation"""
    try:
        messages = []

        # Language-specific system prompts
        if request.language == "zh":
            # Add system prompt with book context if available
            if request.book_context:
                system_prompt = f"""你是一位知识渊博的阅读助手，正在帮助讨论《{request.book_context.get('title', '未知')}》这本书。
            你对文学有深入的理解，可以讨论主题、角色、情节要点并提供见解。

            重要的沟通风格：
            - 像书友会讨论一样自然对话
            - 避免过多的markdown格式或特殊符号
            - 使用简单的格式：段落之间用换行分隔
            - 列举要点时，使用简单的数字（1、2、3）分行
            - 不要在回复中使用【】、—或###等字符
            - 写作时就像在进行友好、智慧的对话
            - 保持吸引力并鼓励对文本的深入思考

            当前上下文：用户正在阅读"{request.book_context.get('current_chapter', '这本书')}"。"""
            else:
                system_prompt = """你是一位知识渊博的阅读助手。
            帮助用户理解和讨论书籍、文学和阅读。

            重要的沟通风格：
            - 像书友会讨论一样自然对话
            - 避免过多的markdown格式或特殊符号
            - 使用简单的格式：段落之间用换行分隔
            - 列举要点时，使用简单的数字（1、2、3）分行
            - 不要在回复中使用【】、—或###等字符
            - 写作时就像在进行友好、智慧的对话
            - 保持帮助性、吸引力并鼓励对文本的深入思考。"""
        else:
            # Add system prompt with book context if available
            if request.book_context:
                system_prompt = f"""You are a knowledgeable reading assistant helping discuss the book "{request.book_context.get('title', 'Unknown')}".
            You have deep understanding of literature and can discuss themes, characters, plot points, and provide insights.

            IMPORTANT communication style:
            - Be conversational and natural, like a book club discussion
            - Avoid excessive markdown formatting or special symbols
            - Use simple formatting: paragraphs separated by line breaks
            - When listing points, use simple numbers (1, 2, 3) on separate lines
            - Don't use characters like 【】, —, or ### in your responses
            - Write as if you're having a friendly, intelligent conversation
            - Be engaging and encourage deeper thinking about the text

            Current context: The user is reading "{request.book_context.get('current_chapter', 'the book')}"."""
            else:
                system_prompt = """You are a knowledgeable reading assistant.
            Help users understand and discuss books, literature, and reading in general.

            IMPORTANT communication style:
            - Be conversational and natural, like a book club discussion
            - Avoid excessive markdown formatting or special symbols
            - Use simple formatting: paragraphs separated by line breaks
            - When listing points, use simple numbers (1, 2, 3) on separate lines
            - Don't use characters like 【】, —, or ### in your responses
            - Write as if you're having a friendly, intelligent conversation
            - Be helpful, engaging, and encourage deeper thinking about texts."""

        messages.append({"role": "system", "content": system_prompt})

        # Add conversation history
        for msg in request.messages:
            messages.append({
                "role": msg.role,
                "content": msg.content
            })

        # Get response from DeepSeek
        response = call_deepseek_api(messages, config.MAX_TOKENS_CHAT, config.TEMP_CHAT)

        return AIResponse(
            success=True,
            data={
                "response": response,
                "timestamp": datetime.now().isoformat()
            }
        )
    except Exception as e:
        logger.error(f"Error in chat: {e}")
        return AIResponse(success=False, error=str(e))

@app.post("/api/ask-question")
async def ask_single_question(book_title: str, question: str):
    """Simple endpoint for one-off questions about a book"""
    try:
        system_prompt = f"""You are an expert on the book "{book_title}".
        Answer questions accurately based on the book's content, themes, and context."""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": question}
        ]

        answer = call_deepseek_api(messages, config.MAX_TOKENS_CHAT, config.TEMP_CHAT)

        return AIResponse(
            success=True,
            data={
                "question": question,
                "answer": answer,
                "book_title": book_title
            }
        )
    except Exception as e:
        logger.error(f"Error answering question: {e}")
        return AIResponse(success=False, error=str(e))

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Echo Reader Unified Backend...")
    logger.info(f"EPUB Processing: Enabled")
    logger.info(f"AI Model: {config.DEEPSEEK_MODEL}")
    logger.info(f"API Base URL: {config.DEEPSEEK_BASE_URL}")
    uvicorn.run(app, host="0.0.0.0", port=8000)
