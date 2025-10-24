// Language Management
let currentLanguage = localStorage.getItem('language') || 'en';

document.addEventListener('DOMContentLoaded', function() {
    setLanguage(currentLanguage);
    loadSettings();
    initializeFileUpload();
});

function toggleLanguage() {
    currentLanguage = currentLanguage === 'en' ? 'zh' : 'en';
    setLanguage(currentLanguage);
    localStorage.setItem('language', currentLanguage);
}

function setLanguage(lang) {
    const elements = document.querySelectorAll('[data-en][data-zh]');

    elements.forEach(element => {
        const text = element.getAttribute(`data-${lang}`);

        if (element.tagName === 'TITLE') {
            document.title = text;
        } else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            element.placeholder = text;
        } else if (element.tagName === 'OPTION') {
            element.textContent = text;
        } else {
            element.textContent = text;
        }
    });

    const langToggle = document.getElementById('currentLang');
    if (langToggle) {
        langToggle.textContent = lang === 'en' ? 'EN' : '中文';
    }

    document.documentElement.lang = lang;

    if (lang === 'zh') {
        document.body.style.fontFamily = "'Noto Sans SC', 'Inter', sans-serif";
    } else {
        document.body.style.fontFamily = "'Inter', sans-serif";
    }
}

// Reading Settings
let readerSettings = {
    fontSize: 18,
    lineHeight: 1.8,
    fontFamily: 'sans-serif',
    readingWidth: 'medium',
    theme: 'light',
    alignment: 'justify',
    decorativeBorders: false,
    borderStyle: 'style1',
    customBackground: null, // Will store base64 image data
    backgroundOpacity: 100,
    frostedGlass: false,
    frostedGlassIntensity: 10 // Blur intensity in pixels
};

function loadSettings() {
    const savedSettings = localStorage.getItem('readerSettings');
    if (savedSettings) {
        readerSettings = JSON.parse(savedSettings);
        applySettings();
    }
}

function saveSettings() {
    localStorage.setItem('readerSettings', JSON.stringify(readerSettings));
}

function applySettings() {
    const bookContent = document.getElementById('bookContent');
    const allContainers = document.querySelectorAll('.container-reader');
    const readingArea = document.querySelector('.reading-area');
    const bookContentWrapper = document.querySelector('.book-content-wrapper');

    if (bookContent) {
        bookContent.style.fontSize = readerSettings.fontSize + 'px';
        bookContent.style.lineHeight = readerSettings.lineHeight;
        bookContent.style.textAlign = readerSettings.alignment;

        // Apply font family
        if (readerSettings.fontFamily === 'serif') {
            bookContent.style.fontFamily = "'Noto Serif', Georgia, serif";
        } else if (readerSettings.fontFamily === 'sans-serif') {
            bookContent.style.fontFamily = "'Inter', 'Noto Sans SC', sans-serif";
        } else if (readerSettings.fontFamily === 'monospace') {
            bookContent.style.fontFamily = "'Courier New', monospace";
        }
    }

    // Apply width to ALL container-reader elements (header, content, footer)
    allContainers.forEach(container => {
        container.className = 'container-reader ' + readerSettings.readingWidth;
    });

    // Apply theme
    if (readingArea) {
        readingArea.className = 'col-lg-10 col-md-9 reading-area theme-' + readerSettings.theme;
    }

    // Apply decorative borders
    if (bookContentWrapper) {
        // Apply width class for dynamic border positioning
        bookContentWrapper.classList.remove('width-narrow', 'width-medium', 'width-wide',
            'width-extra-wide', 'width-ultra-wide', 'width-super-wide', 'width-full');
        bookContentWrapper.classList.add('width-' + readerSettings.readingWidth);

        if (readerSettings.decorativeBorders) {
            bookContentWrapper.classList.add('decorative-borders');
            // Apply border style if set
            if (readerSettings.borderStyle) {
                bookContentWrapper.setAttribute('data-border-style', readerSettings.borderStyle);
            }
        } else {
            bookContentWrapper.classList.remove('decorative-borders');
        }

        // Apply custom background
        if (readerSettings.customBackground) {
            bookContentWrapper.style.backgroundImage = `url(${readerSettings.customBackground})`;
            bookContentWrapper.style.backgroundSize = 'cover';
            bookContentWrapper.style.backgroundPosition = 'center';
            bookContentWrapper.style.backgroundAttachment = 'fixed';
        } else {
            bookContentWrapper.style.backgroundImage = '';
        }

        // Apply background opacity
        bookContentWrapper.style.setProperty('--bg-opacity', readerSettings.backgroundOpacity / 100);

        // Apply frosted glass effect
        if (readerSettings.frostedGlass) {
            bookContentWrapper.classList.add('frosted-glass');
            bookContentWrapper.style.setProperty('--frosted-blur', readerSettings.frostedGlassIntensity + 'px');
        } else {
            bookContentWrapper.classList.remove('frosted-glass');
        }
    }

    // Update UI controls
    document.getElementById('fontSizeDisplay').textContent = readerSettings.fontSize + 'px';
    document.getElementById('lineHeight').value = readerSettings.lineHeight;
    document.getElementById('lineHeightDisplay').textContent = readerSettings.lineHeight;
    document.getElementById('fontFamily').value = readerSettings.fontFamily;
    document.getElementById('readingWidth').value = readerSettings.readingWidth;
    document.getElementById('decorativeBorders').checked = readerSettings.decorativeBorders;

    // Update border style if element exists
    const borderStyleSelect = document.getElementById('borderStyle');
    if (borderStyleSelect && readerSettings.borderStyle) {
        borderStyleSelect.value = readerSettings.borderStyle;
    }

    // Update background controls
    const backgroundOpacitySlider = document.getElementById('backgroundOpacity');
    const backgroundOpacityDisplay = document.getElementById('backgroundOpacityDisplay');
    const frostedGlassCheckbox = document.getElementById('frostedGlass');
    const frostedGlassIntensityControl = document.getElementById('frostedGlassIntensityControl');
    const frostedGlassIntensitySlider = document.getElementById('frostedGlassIntensity');
    const frostedGlassIntensityDisplay = document.getElementById('frostedGlassIntensityDisplay');
    const backgroundPreview = document.getElementById('backgroundPreview');
    const backgroundPreviewImage = document.getElementById('backgroundPreviewImage');

    if (backgroundOpacitySlider) {
        backgroundOpacitySlider.value = readerSettings.backgroundOpacity;
    }
    if (backgroundOpacityDisplay) {
        backgroundOpacityDisplay.textContent = readerSettings.backgroundOpacity + '%';
    }
    if (frostedGlassCheckbox) {
        frostedGlassCheckbox.checked = readerSettings.frostedGlass;
    }
    if (frostedGlassIntensityControl) {
        // Show/hide intensity control based on frosted glass state
        if (readerSettings.frostedGlass) {
            frostedGlassIntensityControl.classList.remove('d-none');
        } else {
            frostedGlassIntensityControl.classList.add('d-none');
        }
    }
    if (frostedGlassIntensitySlider) {
        frostedGlassIntensitySlider.value = readerSettings.frostedGlassIntensity;
    }
    if (frostedGlassIntensityDisplay) {
        frostedGlassIntensityDisplay.textContent = readerSettings.frostedGlassIntensity + 'px';
    }
    if (backgroundPreview && backgroundPreviewImage) {
        if (readerSettings.customBackground) {
            backgroundPreview.classList.remove('d-none');
            backgroundPreviewImage.style.backgroundImage = `url(${readerSettings.customBackground})`;
        } else {
            backgroundPreview.classList.add('d-none');
        }
    }

    // Update theme buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
        if (btn.dataset.theme === readerSettings.theme) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function changeFontSize(delta) {
    readerSettings.fontSize += delta * 2;
    readerSettings.fontSize = Math.max(12, Math.min(32, readerSettings.fontSize));
    applySettings();
    saveSettings();
}

function changeLineHeight() {
    readerSettings.lineHeight = parseFloat(document.getElementById('lineHeight').value);
    applySettings();
    saveSettings();
}

function changeFontFamily() {
    readerSettings.fontFamily = document.getElementById('fontFamily').value;
    applySettings();
    saveSettings();
}

function changeReadingWidth() {
    readerSettings.readingWidth = document.getElementById('readingWidth').value;
    applySettings();
    saveSettings();
}

function toggleDecorativeBorders() {
    readerSettings.decorativeBorders = document.getElementById('decorativeBorders').checked;
    applySettings();
    saveSettings();
}

function changeBorderStyle() {
    readerSettings.borderStyle = document.getElementById('borderStyle').value;
    applySettings();
    saveSettings();
}

function changeTheme(theme) {
    readerSettings.theme = theme;
    applySettings();
    saveSettings();

    // Also update EPUB theme if an EPUB is currently loaded
    if (currentBook && currentBook.type === 'epub') {
        applyEpubTheme();
    }
}

function changeAlignment(alignment) {
    readerSettings.alignment = alignment;
    applySettings();
    saveSettings();

    // Update active button
    document.querySelectorAll('.btn-group button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('button').classList.add('active');
}

function resetSettings() {
    readerSettings = {
        fontSize: 18,
        lineHeight: 1.8,
        fontFamily: 'sans-serif',
        readingWidth: 'medium',
        theme: 'light',
        alignment: 'justify',
        decorativeBorders: false,
        borderStyle: 'style1',
        customBackground: null,
        backgroundOpacity: 100,
        frostedGlass: false,
        frostedGlassIntensity: 10
    };
    applySettings();
    saveSettings();
}

// Background Customization Functions
function uploadBackgroundImage() {
    const fileInput = document.getElementById('backgroundUpload');
    const file = fileInput.files[0];

    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
        alert(currentLanguage === 'en'
            ? 'Please upload a valid image file.'
            : '请上传有效的图片文件。');
        return;
    }

    // Read file as base64
    const reader = new FileReader();
    reader.onload = function(e) {
        readerSettings.customBackground = e.target.result;
        applySettings();
        saveSettings();
    };
    reader.readAsDataURL(file);
}

function removeBackgroundImage() {
    readerSettings.customBackground = null;
    applySettings();
    saveSettings();

    // Reset file input
    const fileInput = document.getElementById('backgroundUpload');
    if (fileInput) {
        fileInput.value = '';
    }
}

function changeBackgroundOpacity() {
    const slider = document.getElementById('backgroundOpacity');
    readerSettings.backgroundOpacity = parseInt(slider.value);
    applySettings();
    saveSettings();
}

function toggleFrostedGlass() {
    readerSettings.frostedGlass = document.getElementById('frostedGlass').checked;
    applySettings();
    saveSettings();
}

function changeFrostedGlassIntensity() {
    const slider = document.getElementById('frostedGlassIntensity');
    readerSettings.frostedGlassIntensity = parseInt(slider.value);
    applySettings();
    saveSettings();
}

// File Upload and Processing
let currentBook = null;
let currentPage = 0;
let totalPages = 0;
let epubBook = null;
let epubRendition = null;
let pdfDocument = null;

function initializeFileUpload() {
    const fileInput = document.getElementById('fileUpload');

    fileInput.addEventListener('change', function(e) {
        const files = e.target.files;
        if (files.length > 0) {
            processFile(files[0]);
        }
    });

    // Drag and drop support
    const uploadBox = document.querySelector('.upload-box');

    uploadBox.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadBox.style.borderColor = 'var(--primary-pink)';
        uploadBox.style.background = 'linear-gradient(135deg, rgba(74, 144, 226, 0.15) 0%, rgba(233, 77, 138, 0.15) 100%)';
    });

    uploadBox.addEventListener('dragleave', function(e) {
        e.preventDefault();
        uploadBox.style.borderColor = 'var(--primary-blue)';
        uploadBox.style.background = 'var(--light-blue)';
    });

    uploadBox.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadBox.style.borderColor = 'var(--primary-blue)';
        uploadBox.style.background = 'var(--light-blue)';

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            processFile(files[0]);
        }
    });
}

function processFile(file) {
    const fileName = file.name;
    const fileExtension = fileName.split('.').pop().toLowerCase();

    // Supported formats
    const supportedFormats = ['epub', 'pdf', 'txt', 'html', 'htm'];
    const plannedFormats = ['mobi', 'azw3', 'fb2', 'djvu', 'doc', 'docx'];

    if (!supportedFormats.includes(fileExtension) && !plannedFormats.includes(fileExtension)) {
        alert(currentLanguage === 'en'
            ? 'Unsupported file format. Please upload EPUB, PDF, TXT, or HTML files.'
            : '不支持的文件格式。请上传 EPUB、PDF、TXT 或 HTML 文件。');
        return;
    }

    // Process based on file type
    if (fileExtension === 'txt') {
        processTxtFile(file);
    } else if (fileExtension === 'html' || fileExtension === 'htm') {
        processHtmlFile(file);
    } else if (fileExtension === 'pdf') {
        processPdfFile(file);
    } else if (fileExtension === 'epub') {
        processEpubFile(file);
    } else if (plannedFormats.includes(fileExtension)) {
        // For other formats, show a message
        alert(currentLanguage === 'en'
            ? `${fileExtension.toUpperCase()} format support is coming soon! For now, please try EPUB, PDF, TXT, or HTML files.`
            : `${fileExtension.toUpperCase()} 格式支持即将推出！目前请尝试 EPUB、PDF、TXT 或 HTML 文件。`);
    }
}

function processTxtFile(file) {
    const reader = new FileReader();

    reader.onload = function(e) {
        const content = e.target.result;
        displayBook(file.name, 'Unknown Author', content);
    };

    reader.readAsText(file);
}

function processHtmlFile(file) {
    const reader = new FileReader();

    reader.onload = function(e) {
        const content = e.target.result;
        displayBook(file.name, 'Unknown Author', content);
    };

    reader.readAsText(file);
}

function processPdfFile(file) {
    // Check if PDF.js is available
    if (typeof pdfjsLib === 'undefined') {
        alert(currentLanguage === 'en'
            ? 'PDF library not loaded. Please refresh the page and try again.'
            : 'PDF 库未加载。请刷新页面后重试。');
        return;
    }

    const reader = new FileReader();

    reader.onload = function(e) {
        const typedArray = new Uint8Array(e.target.result);

        // Set worker source
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        // Load PDF document
        pdfjsLib.getDocument(typedArray).promise.then(function(pdf) {
            pdfDocument = pdf;
            totalPages = pdf.numPages;
            currentPage = 1;

            // Display the PDF
            displayPdfBook(file.name, pdf);
        }).catch(function(error) {
            console.error('Error loading PDF:', error);
            alert(currentLanguage === 'en'
                ? 'Error loading PDF file. The file might be corrupted or password-protected.'
                : '加载 PDF 文件时出错。文件可能已损坏或受密码保护。');
        });
    };

    reader.readAsArrayBuffer(file);
}

function displayPdfBook(fileName, pdf) {
    // Hide welcome screen
    document.getElementById('welcomeScreen').classList.add('d-none');

    // Show reading content
    const readingContent = document.getElementById('readingContent');
    readingContent.classList.remove('d-none');
    readingContent.classList.add('fade-in');

    // Set book info
    document.getElementById('bookTitle').textContent = fileName.replace(/\.[^/.]+$/, "");

    // Get PDF metadata
    pdf.getMetadata().then(function(data) {
        const info = data.info;
        if (info.Title) {
            document.getElementById('bookTitle').textContent = info.Title;
        }
        if (info.Author) {
            document.getElementById('bookAuthor').textContent = info.Author;
        } else {
            document.getElementById('bookAuthor').textContent = 'Unknown Author';
        }
    });

    // Clear book content area
    const bookContent = document.getElementById('bookContent');
    bookContent.innerHTML = '<div id="pdfViewer" style="display: flex; flex-direction: column; align-items: center; gap: 20px;"></div>';

    // Store current book type
    currentBook = {
        type: 'pdf',
        document: pdf
    };

    // Render first page
    renderPdfPage(pdf, 1);

    // Generate table of contents if available
    pdf.getOutline().then(function(outline) {
        if (outline && outline.length > 0) {
            generatePdfTOC(outline, pdf);
        } else {
            const tocList = document.getElementById('tocList');
            tocList.innerHTML = '<p class="text-muted text-center py-4" data-en="No table of contents available" data-zh="无目录">No table of contents available</p>';
            setLanguage(currentLanguage);
        }
    });

    // Update UI
    document.getElementById('totalPages').textContent = `of ${totalPages}`;
    document.getElementById('currentPage').textContent = `Page 1`;
}

function renderPdfPage(pdf, pageNum) {
    currentPage = pageNum;

    pdf.getPage(pageNum).then(function(page) {
        // Calculate scale based on container width
        const container = document.getElementById('pdfViewer');
        const containerWidth = container ? container.clientWidth : 800;
        const viewport = page.getViewport({ scale: 1 });
        const scale = Math.min((containerWidth * 0.9) / viewport.width, 2.0);

        const scaledViewport = page.getViewport({ scale: scale });

        // Create canvas element
        const canvas = document.createElement('canvas');
        canvas.className = 'pdf-page-canvas';
        const context = canvas.getContext('2d');
        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;

        const renderContext = {
            canvasContext: context,
            viewport: scaledViewport
        };

        // Render the page
        page.render(renderContext).promise.then(function() {
            const pdfViewer = document.getElementById('pdfViewer');
            if (pdfViewer) {
                pdfViewer.innerHTML = '';
                pdfViewer.appendChild(canvas);
            }

            // Update navigation UI
            document.getElementById('currentPage').textContent = `Page ${pageNum}`;
            document.getElementById('totalPages').textContent = `of ${totalPages}`;
            document.getElementById('progressSlider').value = (pageNum / totalPages) * 100;
            document.getElementById('readingProgress').textContent = Math.round((pageNum / totalPages) * 100) + '%';

            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }).catch(function(error) {
        console.error('Error rendering PDF page:', error);
        alert(currentLanguage === 'en'
            ? 'Error rendering this page. Please try another page.'
            : '渲染此页面时出错。请尝试其他页面。');
    });
}

function generatePdfTOC(outline, pdf) {
    const tocList = document.getElementById('tocList');
    tocList.innerHTML = '';

    function addOutlineItems(items, level = 0) {
        items.forEach(item => {
            const tocItem = document.createElement('div');
            tocItem.className = 'toc-item';
            if (level > 0) {
                tocItem.style.paddingLeft = (level * 20 + 10) + 'px';
            }
            tocItem.textContent = item.title;

            // Handle click to navigate to page
            tocItem.onclick = function() {
                if (item.dest) {
                    pdf.getDestination(item.dest).then(function(dest) {
                        if (dest) {
                            pdf.getPageIndex(dest[0]).then(function(pageIndex) {
                                renderPdfPage(pdf, pageIndex + 1);
                            });
                        }
                    });
                } else if (typeof item.dest === 'string') {
                    // Try to extract page number from destination string
                    const match = item.dest.match(/\d+/);
                    if (match) {
                        renderPdfPage(pdf, parseInt(match[0]));
                    }
                }
            };

            tocList.appendChild(tocItem);

            // Add sub-items recursively
            if (item.items && item.items.length > 0) {
                addOutlineItems(item.items, level + 1);
            }
        });
    }

    addOutlineItems(outline);
}

function processEpubFile(file) {
    // Use FastAPI backend to parse EPUB
    processEpubViaBackend(file);
}

async function processEpubViaBackend(file) {
    try {
        // Show loading indicator
        showLoadingIndicator(currentLanguage === 'en' ? 'Processing EPUB file...' : '正在处理 EPUB 文件...');

        // Create form data
        const formData = new FormData();
        formData.append('file', file);

        // API endpoint - change this to your backend URL
        const API_URL = 'http://localhost:8000';

        // Upload to backend
        const response = await fetch(`${API_URL}/upload-epub`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to process EPUB file');
        }

        const bookData = await response.json();

        // Hide loading indicator
        hideLoadingIndicator();

        // Display the book
        displayEpubFromBackend(bookData, file.name);

    } catch (error) {
        hideLoadingIndicator();
        console.error('Error processing EPUB:', error);
        alert(currentLanguage === 'en'
            ? `Error processing EPUB file: ${error.message}\n\nMake sure the FastAPI backend is running on http://localhost:8000`
            : `处理 EPUB 文件时出错: ${error.message}\n\n请确保 FastAPI 后端正在 http://localhost:8000 上运行`);
    }
}

function showLoadingIndicator(message) {
    // Create loading overlay if it doesn't exist
    let overlay = document.getElementById('loadingOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loadingOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 10px;
            text-align: center;
        `;

        const spinner = document.createElement('div');
        spinner.className = 'spinner-border text-primary mb-3';
        spinner.setAttribute('role', 'status');

        const text = document.createElement('p');
        text.id = 'loadingText';
        text.className = 'mb-0';
        text.textContent = message;

        content.appendChild(spinner);
        content.appendChild(text);
        overlay.appendChild(content);
        document.body.appendChild(overlay);
    } else {
        overlay.style.display = 'flex';
        document.getElementById('loadingText').textContent = message;
    }
}

function hideLoadingIndicator() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

function displayEpubFromBackend(bookData, fileName) {
    // Hide welcome screen
    document.getElementById('welcomeScreen').classList.add('d-none');

    // Show reading content
    const readingContent = document.getElementById('readingContent');
    readingContent.classList.remove('d-none');
    readingContent.classList.add('fade-in');

    // Set book info
    document.getElementById('bookTitle').textContent = bookData.metadata.title || fileName.replace(/\.[^/.]+$/, "");
    document.getElementById('bookAuthor').textContent = bookData.metadata.author || 'Unknown Author';

    // Store current book data
    currentBook = {
        type: 'epub-backend',
        id: bookData.id,
        data: bookData,
        currentChapterIndex: 0
    };

    // Update AI Service with the book data
    if (window.AIService) {
        window.AIService.currentBookData = {
            title: bookData.metadata.title || fileName,
            author: bookData.metadata.author || 'Unknown Author',
            full_text: bookData.full_text || '',
            chapters: bookData.chapters ? bookData.chapters.map(ch => ({
                title: ch.title,
                content: ch.text || ch.content
            })) : []
        };
    }

    // Display first chapter
    displayEpubChapter(0);

    // Generate table of contents
    generateEpubTOCFromBackend(bookData.toc, bookData.chapters);

    // Update UI
    totalPages = bookData.chapters.length;
    document.getElementById('totalPages').textContent = `of ${totalPages} chapters`;
    document.getElementById('currentPage').textContent = 'Chapter 1';
    document.getElementById('readingProgress').textContent = '0%';
}

function displayEpubChapter(chapterIndex) {
    if (!currentBook || currentBook.type !== 'epub-backend') return;

    const chapters = currentBook.data.chapters;
    if (chapterIndex < 0 || chapterIndex >= chapters.length) return;

    const chapter = chapters[chapterIndex];
    currentBook.currentChapterIndex = chapterIndex;

    // Display chapter content
    const bookContent = document.getElementById('bookContent');
    bookContent.innerHTML = chapter.content;

    // Apply current settings
    applySettings();

    // Update progress
    const progress = Math.round(((chapterIndex + 1) / chapters.length) * 100);
    document.getElementById('readingProgress').textContent = progress + '%';
    document.getElementById('progressSlider').value = progress;
    document.getElementById('currentPage').textContent = `Chapter ${chapterIndex + 1}`;

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function generateEpubTOCFromBackend(toc, chapters) {
    const tocList = document.getElementById('tocList');
    tocList.innerHTML = '';

    if (toc && toc.length > 0) {
        toc.forEach((item, index) => {
            const tocItem = document.createElement('div');
            tocItem.className = 'toc-item';
            tocItem.style.paddingLeft = (item.level * 20 + 10) + 'px';
            tocItem.textContent = item.title;

            // Find matching chapter
            const chapterIndex = chapters.findIndex(ch =>
                ch.id.includes(item.href.replace('#', '')) ||
                ch.title === item.title
            );

            tocItem.onclick = function() {
                if (chapterIndex >= 0) {
                    displayEpubChapter(chapterIndex);
                }
            };

            tocList.appendChild(tocItem);

            // Add children if they exist
            if (item.children && item.children.length > 0) {
                item.children.forEach(child => {
                    const childItem = document.createElement('div');
                    childItem.className = 'toc-item toc-subitem';
                    childItem.style.paddingLeft = ((child.level || item.level + 1) * 20 + 10) + 'px';
                    childItem.textContent = child.title;

                    const childChapterIndex = chapters.findIndex(ch =>
                        ch.id.includes(child.href.replace('#', '')) ||
                        ch.title === child.title
                    );

                    childItem.onclick = function() {
                        if (childChapterIndex >= 0) {
                            displayEpubChapter(childChapterIndex);
                        }
                    };

                    tocList.appendChild(childItem);
                });
            }
        });
    } else {
        // Fallback: use chapter list
        chapters.forEach((chapter, index) => {
            const tocItem = document.createElement('div');
            tocItem.className = 'toc-item';
            tocItem.textContent = chapter.title;
            tocItem.onclick = function() {
                displayEpubChapter(index);
            };
            tocList.appendChild(tocItem);
        });
    }
}

function displayEpubBook(fileName) {
    // Hide welcome screen
    document.getElementById('welcomeScreen').classList.add('d-none');

    // Show reading content
    const readingContent = document.getElementById('readingContent');
    readingContent.classList.remove('d-none');
    readingContent.classList.add('fade-in');

    // Clear book content area
    const bookContent = document.getElementById('bookContent');
    bookContent.innerHTML = '<div id="epubViewer" style="height: 100vh; width: 100%;"></div>';

    // Get book metadata
    epubBook.loaded.metadata.then(function(metadata) {
        document.getElementById('bookTitle').textContent = metadata.title || fileName.replace(/\.[^/.]+$/, "");
        document.getElementById('bookAuthor').textContent = metadata.creator || 'Unknown Author';
    });

    // Render the book
    epubRendition = epubBook.renderTo("epubViewer", {
        width: "100%",
        height: "100%",
        spread: "none"
    });

    epubRendition.display();

    // Get total pages/locations
    epubBook.locations.generate(1024).then(function(locations) {
        totalPages = locations.length;
        document.getElementById('totalPages').textContent = `of ${totalPages}`;
        updateEpubProgress();
    });

    // Update progress on location change
    epubRendition.on('relocated', function(location) {
        updateEpubProgress();
    });

    // Generate table of contents
    epubBook.loaded.navigation.then(function(toc) {
        generateEpubTOC(toc.toc);
    });

    // Store current book type
    currentBook = {
        type: 'epub',
        book: epubBook,
        rendition: epubRendition
    };

    // Apply theme to EPUB rendition
    applyEpubTheme();
}

function updateEpubProgress() {
    if (!epubRendition || !epubBook.locations) return;

    const location = epubRendition.currentLocation();
    if (location && location.start) {
        const percentage = epubBook.locations.percentageFromCfi(location.start.cfi);
        const progress = Math.round(percentage * 100);

        document.getElementById('readingProgress').textContent = progress + '%';
        document.getElementById('progressSlider').value = progress;

        const currentPage = epubBook.locations.locationFromCfi(location.start.cfi);
        document.getElementById('currentPage').textContent = `Page ${currentPage + 1}`;
    }
}

function generateEpubTOC(toc) {
    const tocList = document.getElementById('tocList');
    tocList.innerHTML = '';

    if (toc && toc.length > 0) {
        toc.forEach(chapter => {
            const tocItem = document.createElement('div');
            tocItem.className = 'toc-item';
            tocItem.textContent = chapter.label;
            tocItem.onclick = function() {
                if (epubRendition) {
                    epubRendition.display(chapter.href);
                }
            };
            tocList.appendChild(tocItem);

            // Add sub-chapters if they exist
            if (chapter.subitems && chapter.subitems.length > 0) {
                chapter.subitems.forEach(subchapter => {
                    const subTocItem = document.createElement('div');
                    subTocItem.className = 'toc-item toc-subitem';
                    subTocItem.style.paddingLeft = '30px';
                    subTocItem.textContent = subchapter.label;
                    subTocItem.onclick = function() {
                        if (epubRendition) {
                            epubRendition.display(subchapter.href);
                        }
                    };
                    tocList.appendChild(subTocItem);
                });
            }
        });
    } else {
        tocList.innerHTML = '<p class="text-muted text-center py-4" data-en="No chapters found" data-zh="未找到章节">No chapters found</p>';
        setLanguage(currentLanguage);
    }
}

function applyEpubTheme() {
    if (!epubRendition) return;

    const themes = {
        light: {
            body: {
                'background': '#ffffff',
                'color': '#333333'
            }
        },
        sepia: {
            body: {
                'background': '#f4ecd8',
                'color': '#5c4a3a'
            }
        },
        dark: {
            body: {
                'background': '#1a1a2e',
                'color': '#e0e0e0'
            }
        },
        night: {
            body: {
                'background': '#0a0a0a',
                'color': '#cccccc'
            }
        }
    };

    epubRendition.themes.register(themes);
    epubRendition.themes.select(readerSettings.theme);

    // Apply font settings
    epubRendition.themes.fontSize(readerSettings.fontSize + 'px');
}

function displayBook(title, author, content) {
    // Hide welcome screen
    document.getElementById('welcomeScreen').classList.add('d-none');

    // Show reading content
    const readingContent = document.getElementById('readingContent');
    readingContent.classList.remove('d-none');
    readingContent.classList.add('fade-in');

    // Set book info
    document.getElementById('bookTitle').textContent = title.replace(/\.[^/.]+$/, "");
    document.getElementById('bookAuthor').textContent = author;

    // Process and display content
    const bookContent = document.getElementById('bookContent');

    // Split content into paragraphs
    const paragraphs = content.split(/\n\n+/);
    let formattedContent = '';

    paragraphs.forEach(para => {
        if (para.trim()) {
            formattedContent += `<p>${para.trim().replace(/\n/g, '<br>')}</p>`;
        }
    });

    bookContent.innerHTML = formattedContent;

    // Store current book data for AI
    currentBook = {
        type: 'text',
        title: title,
        author: author,
        content: content
    };

    // Update AI Service with the book data
    if (window.AIService) {
        window.AIService.currentBookData = {
            title: title,
            author: author,
            full_text: content,
            chapters: [] // Text files don't have chapters
        };
    }

    // Calculate pages (approximate)
    totalPages = Math.ceil(bookContent.scrollHeight / window.innerHeight);
    document.getElementById('totalPages').textContent = `of ${totalPages}`;
    document.getElementById('currentPage').textContent = 'Page 1';

    // Apply settings
    applySettings();

    // Generate TOC (simple version)
    generateTableOfContents(content);
}

function generateTableOfContents(content) {
    const tocList = document.getElementById('tocList');
    tocList.innerHTML = '';

    // Simple TOC based on numbered chapters or sections
    const lines = content.split('\n');
    let chapterNum = 1;

    lines.forEach((line, index) => {
        // Look for chapter markers
        if (line.match(/^(Chapter|CHAPTER|第.*章)/i) ||
            line.match(/^[IVX]+\.|^\d+\./) ||
            (line.length < 100 && line.length > 3 && /^[A-Z]/.test(line))) {

            const tocItem = document.createElement('div');
            tocItem.className = 'toc-item';
            tocItem.textContent = line.trim() || `Chapter ${chapterNum}`;
            tocItem.onclick = function() {
                scrollToSection(index);
            };
            tocList.appendChild(tocItem);
            chapterNum++;
        }
    });

    if (tocList.children.length === 0) {
        tocList.innerHTML = '<p class="text-muted text-center py-4" data-en="No chapters found" data-zh="未找到章节">No chapters found</p>';
        setLanguage(currentLanguage);
    }
}

function scrollToSection(lineIndex) {
    // Scroll to approximate position
    const bookContent = document.getElementById('bookContent');
    const paragraphs = bookContent.getElementsByTagName('p');

    if (paragraphs[lineIndex]) {
        paragraphs[lineIndex].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Navigation Functions
function previousPage() {
    if (currentBook && currentBook.type === 'epub' && epubRendition) {
        epubRendition.prev();
    } else if (currentBook && currentBook.type === 'epub-backend') {
        // Backend EPUB: go to previous chapter
        const prevIndex = currentBook.currentChapterIndex - 1;
        if (prevIndex >= 0) {
            displayEpubChapter(prevIndex);
        }
    } else if (currentBook && currentBook.type === 'pdf' && pdfDocument) {
        if (currentPage > 1) {
            currentPage--;
            renderPdfPage(pdfDocument, currentPage);
        }
    } else {
        window.scrollBy({
            top: -window.innerHeight * 0.8,
            behavior: 'smooth'
        });
        updateProgress();
    }
}

function nextPage() {
    if (currentBook && currentBook.type === 'epub' && epubRendition) {
        epubRendition.next();
    } else if (currentBook && currentBook.type === 'epub-backend') {
        // Backend EPUB: go to next chapter
        const nextIndex = currentBook.currentChapterIndex + 1;
        if (nextIndex < currentBook.data.chapters.length) {
            displayEpubChapter(nextIndex);
        }
    } else if (currentBook && currentBook.type === 'pdf' && pdfDocument) {
        if (currentPage < totalPages) {
            currentPage++;
            renderPdfPage(pdfDocument, currentPage);
        }
    } else {
        window.scrollBy({
            top: window.innerHeight * 0.8,
            behavior: 'smooth'
        });
        updateProgress();
    }
}

function updateProgress() {
    const scrollPercentage = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
    document.getElementById('progressSlider').value = scrollPercentage;
    document.getElementById('readingProgress').textContent = Math.round(scrollPercentage) + '%';
}

// Progress slider control
document.addEventListener('DOMContentLoaded', function() {
    const progressSlider = document.getElementById('progressSlider');

    if (progressSlider) {
        progressSlider.addEventListener('input', function() {
            const percentage = this.value;

            if (currentBook && currentBook.type === 'pdf' && pdfDocument) {
                // For PDF: jump to specific page
                const targetPage = Math.max(1, Math.ceil((percentage / 100) * totalPages));
                renderPdfPage(pdfDocument, targetPage);
            } else if (currentBook && currentBook.type === 'epub-backend') {
                // For backend EPUB: jump to specific chapter
                const targetChapter = Math.floor((percentage / 100) * currentBook.data.chapters.length);
                displayEpubChapter(targetChapter);
            } else if (currentBook && currentBook.type === 'epub' && epubBook && epubBook.locations) {
                // For frontend EPUB: jump to specific location
                const targetLocation = Math.floor((percentage / 100) * epubBook.locations.total);
                const cfi = epubBook.locations.cfiFromLocation(targetLocation);
                if (cfi && epubRendition) {
                    epubRendition.display(cfi);
                }
            } else {
                // For regular scrollable content
                const scrollTarget = (document.documentElement.scrollHeight - window.innerHeight) * (percentage / 100);
                window.scrollTo({
                    top: scrollTarget,
                    behavior: 'smooth'
                });
            }
        });
    }

    // Update progress on scroll
    window.addEventListener('scroll', function() {
        // Only update for non-PDF and non-EPUB books
        if (!currentBook || (currentBook.type !== 'pdf' && currentBook.type !== 'epub' && currentBook.type !== 'epub-backend')) {
            updateProgress();
        }
    });
});

// Sample Book Loading
function loadSampleBook(bookId) {
    let title, author, content;

    if (bookId === 'sample1') {
        title = currentLanguage === 'en' ? 'The Art of Reading' : '阅读的艺术';
        author = 'John Doe';
        content = currentLanguage === 'en' ? getSampleContentEN1() : getSampleContentZH1();
    } else if (bookId === 'sample2') {
        title = currentLanguage === 'en' ? 'Digital Literature' : '数字文学';
        author = 'Jane Smith';
        content = currentLanguage === 'en' ? getSampleContentEN2() : getSampleContentZH2();
    } else if (bookId === 'sample3') {
        title = currentLanguage === 'en' ? 'Modern Fiction' : '现代小说';
        author = 'Alex Johnson';
        content = currentLanguage === 'en' ? getSampleContentEN3() : getSampleContentZH3();
    }

    displayBook(title, author, content);
}

function getSampleContentEN1() {
    return `Chapter 1: The Beginning

Reading is more than just decoding words on a page. It is an art form that requires practice, patience, and passion. When we read, we open ourselves to new worlds, new ideas, and new perspectives.

The journey of a reader is one of constant discovery. Each book we encounter offers us a chance to learn something new about the world or about ourselves. Great readers are not born; they are made through consistent practice and genuine curiosity.

Chapter 2: The Practice

To become a skilled reader, one must read regularly. Like any art form, reading improves with practice. Start with books that interest you, and gradually expand your horizons to include different genres and styles.

Don't be afraid to challenge yourself with difficult texts. Sometimes the most rewarding reading experiences come from books that push us beyond our comfort zones.

Chapter 3: The Reward

The rewards of reading are manifold. Books expand our vocabulary, improve our writing skills, and enhance our critical thinking abilities. They offer us escape, entertainment, and enlightenment.

Most importantly, reading connects us with other minds across time and space. When we read, we engage in a conversation with authors, both living and dead, from all corners of the globe.`;
}

function getSampleContentZH1() {
    return `第一章：开始

阅读不仅仅是解码页面上的文字。它是一种需要练习、耐心和热情的艺术形式。当我们阅读时，我们向新世界、新思想和新视角敞开心扉。

读者的旅程是一个不断发现的过程。我们遇到的每一本书都为我们提供了一个了解世界或了解自己的机会。伟大的读者不是天生的；他们是通过持续的练习和真正的好奇心造就的。

第二章：实践

要成为一名熟练的读者，必须定期阅读。像任何艺术形式一样，阅读随着练习而提高。从你感兴趣的书开始，逐渐扩展你的视野，包括不同的体裁和风格。

不要害怕用困难的文本挑战自己。有时最有价值的阅读体验来自于那些推动我们超越舒适区的书籍。

第三章：回报

阅读的回报是多方面的。书籍扩展了我们的词汇量，提高了我们的写作技巧，并增强了我们的批判性思维能力。它们为我们提供了逃避、娱乐和启迪。

最重要的是，阅读将我们与跨越时空的其他思想联系起来。当我们阅读时，我们与来自全球各个角落的在世和已故作者进行对话。`;
}

function getSampleContentEN2() {
    return `Introduction: The Digital Age

We live in an age where literature has gone digital. E-books, audiobooks, and online articles have revolutionized how we consume written content. This transformation has made reading more accessible than ever before.

The digital revolution has democratized literature. Anyone with an internet connection can access millions of books from around the world. This unprecedented access has created new opportunities for both readers and writers.

Chapter 1: New Possibilities

Digital literature offers features impossible in print: searchable text, adjustable fonts, instant definitions, and the ability to carry an entire library in your pocket. These conveniences have made reading more flexible and personalized.

The rise of self-publishing has also transformed the literary landscape. Authors no longer need traditional publishers to reach readers. This has led to an explosion of diverse voices and stories.`;
}

function getSampleContentZH2() {
    return `引言：数字时代

我们生活在一个文学数字化的时代。电子书、有声读物和在线文章彻底改变了我们消费书面内容的方式。这种转变使阅读比以往任何时候都更容易获得。

数字革命使文学民主化。任何有互联网连接的人都可以访问来自世界各地的数百万本书。这种前所未有的访问为读者和作家创造了新的机会。

第一章：新的可能性

数字文学提供了印刷品无法实现的功能：可搜索的文本、可调节的字体、即时定义以及在口袋中携带整个图书馆的能力。这些便利使阅读更加灵活和个性化。

自出版的兴起也改变了文学景观。作家不再需要传统出版商来接触读者。这导致了多样化声音和故事的爆炸式增长。`;
}

function getSampleContentEN3() {
    return `Prologue

The city never sleeps, they say. But in the quiet hours before dawn, even the most vibrant metropolis holds its breath. This is when Sarah finds her peace, walking through empty streets with only her thoughts for company.

She had always been drawn to solitude. While others sought the comfort of crowds, she found meaning in moments of stillness. Her morning walks became a ritual, a meditation in motion through the urban landscape.

Chapter 1

The coffee shop on the corner was her first stop each morning. The owner, an elderly man named Marcus, always had her usual ready before she walked through the door. They rarely spoke, but their silent understanding was deeper than most conversations.

"Another early morning?" Marcus would ask, though he already knew the answer. Sarah would smile and nod, taking her cup with grateful hands. The warmth spreading through her fingers was like a promise that the day ahead held possibilities.`;
}

function getSampleContentZH3() {
    return `序言

他们说，这座城市从不睡觉。但在黎明前的安静时刻，即使是最充满活力的大都市也会屏住呼吸。这是莎拉找到平静的时候，她独自走在空荡荡的街道上，只有自己的思想作伴。

她一直被孤独所吸引。当别人寻求人群的安慰时，她在静止的时刻中找到意义。她的晨间散步成为一种仪式，一种在城市景观中运动的冥想。

第一章

街角的咖啡店是她每天早上的第一站。店主是一位名叫马库斯的老人，他总是在她走进门之前就准备好她常点的饮料。他们很少说话，但他们无声的理解比大多数对话都要深刻。

"又一个清晨？"马库斯会问，尽管他已经知道答案。莎拉会微笑着点头，用感激的双手接过她的杯子。温暖在她的手指间蔓延，就像是承诺新的一天充满可能性。`;
}

// ===================================
// AI Assistant Features
// ===================================

// AI State Management
let currentAIFeature = null;
let aiCache = {
    bookSummary: null,
    chapterSummaries: null,
    contentAnalysis: null,
    chatHistory: []
};

// Main AI Feature Selection Handler
function selectAIFeature(feature) {
    // Check if book is loaded
    if (!currentBook) {
        document.getElementById('aiNoBookState').classList.remove('d-none');
        hideAllAIPages();
        return;
    }

    // Hide no book state
    document.getElementById('aiNoBookState').classList.add('d-none');

    currentAIFeature = feature;

    // Remove active state from all cards
    document.querySelectorAll('.ai-feature-card').forEach(card => {
        card.classList.remove('active');
    });

    // Hide feature selection and show appropriate page
    document.getElementById('aiFeatureSelection').classList.add('d-none');
    hideAllAIPages();

    switch(feature) {
        case 'book-summary':
            document.getElementById('aiBookSummaryPage').classList.remove('d-none');
            loadBookSummary();
            break;
        case 'chapter-summary':
            document.getElementById('aiChapterSummaryPage').classList.remove('d-none');
            loadChapterSummaries();
            break;
        case 'content-analysis':
            document.getElementById('aiContentAnalysisPage').classList.remove('d-none');
            loadContentAnalysis();
            break;
        case 'chat':
            document.getElementById('aiFullscreenChat').classList.remove('d-none');
            loadChatInterface();
            break;
    }
}

// Hide all AI pages
function hideAllAIPages() {
    document.getElementById('aiBookSummaryPage').classList.add('d-none');
    document.getElementById('aiChapterSummaryPage').classList.add('d-none');
    document.getElementById('aiContentAnalysisPage').classList.add('d-none');
    document.getElementById('aiFullscreenChat').classList.add('d-none');
}

// Back to AI feature selection
function backToAISelection() {
    hideAllAIPages();
    document.getElementById('aiFeatureSelection').classList.remove('d-none');
    currentAIFeature = null;
}

// Exit Fullscreen Chat (now just calls backToAISelection)
function exitFullscreenChat() {
    backToAISelection();
}

// Clear Chat History
function clearChatHistory() {
    if (confirm(currentLanguage === 'en'
        ? 'Clear all chat history?'
        : '清除所有聊天记录？')) {
        aiCache.chatHistory = [];
        loadChatInterface();
    }
}

// Refresh AI Content
function refreshAIContent() {
    if (!currentAIFeature) return;

    // Clear cache for current feature
    switch(currentAIFeature) {
        case 'book-summary':
            aiCache.bookSummary = null;
            loadBookSummary();
            break;
        case 'chapter-summary':
            aiCache.chapterSummaries = null;
            loadChapterSummaries();
            break;
        case 'content-analysis':
            aiCache.contentAnalysis = null;
            loadContentAnalysis();
            break;
    }
}

// Load Book Summary
async function loadBookSummary() {
    const container = document.getElementById('aiBookSummaryContent');

    // Check cache first - if already generated, display it directly
    if (aiCache.bookSummary) {
        displayBookSummary(aiCache.bookSummary);
        return;
    }

    // Show start button instead of immediately executing
    container.innerHTML = `
        <div class="text-center py-5">
            <i class="bi bi-file-text" style="font-size: 3rem; color: var(--primary-blue); opacity: 0.3;"></i>
            <h5 class="mt-3 mb-2">${currentLanguage === 'en' ? 'Generate Full Book Summary' : '生成全书摘要'}</h5>
            <p class="text-muted mb-4">${currentLanguage === 'en'
                ? 'Click the button below to generate a comprehensive summary of this book using DeepSeek AI.'
                : '点击下面的按钮使用 DeepSeek AI 生成这本书的全面摘要。'}</p>
            <button class="btn btn-primary btn-lg" onclick="executeBookSummary()">
                <i class="bi bi-play-circle me-2"></i>
                <span>${currentLanguage === 'en' ? 'Start Generation' : '开始生成'}</span>
            </button>
            <p class="text-muted small mt-3"><i class="bi bi-clock me-1"></i>${currentLanguage === 'en'
                ? 'Estimated time: 30-60 seconds'
                : '预计时间：30-60 秒'}</p>
        </div>
    `;
}

// Execute Book Summary generation
async function executeBookSummary() {
    const container = document.getElementById('aiBookSummaryContent');

    // Show loading state
    container.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border spinner-border-sm text-primary mb-2" role="status"></div>
            <p class="text-muted small mb-0">${currentLanguage === 'en' ? 'Generating summary with DeepSeek AI...' : '使用 DeepSeek AI 生成摘要...'}</p>
            <small class="text-muted">This may take 30-60 seconds</small>
        </div>
    `;

    try {
        // Check if AIService is available
        if (typeof window.AIService === 'undefined') {
            // Fallback to simulated content if AI service is not available
            setTimeout(() => {
                const summary = {
                    overview: currentLanguage === 'en'
                        ? 'This book explores the fundamental concepts and practices of reading in the digital age. It examines how technology has transformed our relationship with literature while maintaining the core values of deep reading and comprehension.'
                        : '本书探讨了数字时代阅读的基本概念和实践。它探讨了技术如何改变我们与文学的关系，同时保持深度阅读和理解的核心价值观。',
                    keyPoints: currentLanguage === 'en'
                        ? [
                            'Reading as a cultivated skill requiring practice',
                            'Digital transformation of literature and accessibility',
                            'The importance of challenging oneself with diverse texts',
                            'Connection between readers and authors across time'
                        ]
                        : [
                            '阅读是一种需要练习的培养技能',
                            '文学的数字化转型和可访问性',
                            '用多样化文本挑战自己的重要性',
                            '读者和作者跨越时空的联系'
                        ],
                    pageCount: currentLanguage === 'en' ? 'Estimated 3 chapters' : '预计 3 章'
                };

                aiCache.bookSummary = summary;
                displayBookSummary(summary);
            }, 1500);
            return;
        }

        // Use actual AI service with language parameter
        const summaryText = await window.AIService.generateBookSummary(currentLanguage);

        if (summaryText) {
            const summary = {
                overview: summaryText,
                keyPoints: [], // AI response will include key points in the text
                pageCount: currentBook?.data?.chapters ?
                    `${currentBook.data.chapters.length} ${currentLanguage === 'en' ? 'chapters' : '章节'}` :
                    currentLanguage === 'en' ? 'Unknown' : '未知'
            };

            aiCache.bookSummary = summary;
            displayBookSummary(summary);
        } else {
            throw new Error('Failed to generate summary');
        }
    } catch (error) {
        console.error('Error generating book summary:', error);
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>
                ${currentLanguage === 'en'
                    ? 'Failed to generate summary. Please ensure the AI backend is running.'
                    : '生成摘要失败。请确保 AI 后端正在运行。'}
            </div>
        `;
    }
}

function displayBookSummary(summary) {
    const container = document.getElementById('aiBookSummaryContent');

    // Clean and format the summary text
    let formattedSummary = summary.overview || summary;

    // Remove markdown artifacts and unwanted symbols
    formattedSummary = formattedSummary
        // Remove "Of course", "Certainly" and similar conversational starters
        .replace(/^(Of course[,.]?|Certainly[,.]?|Sure[,.]?|当然[,，。]?|好的[,，。]?)\s*/gi, '')
        // Remove markdown headers
        .replace(/^###\s+/gm, '')
        .replace(/^##\s+/gm, '')
        .replace(/^#\s+/gm, '')
        // Remove asterisks but keep the text
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        // Remove special characters
        .replace(/【|】|—{2,}/g, '')
        // Clean up numbered lists
        .replace(/^\d+\.\s+/gm, '')
        // Convert line breaks to proper paragraphs
        .split(/\n\n+/)
        .filter(p => p.trim())
        .map(p => `<p class="mb-3">${p.trim()}</p>`)
        .join('');

    // If there are key points, format them
    let keyPointsHtml = '';
    if (summary.keyPoints && summary.keyPoints.length > 0) {
        keyPointsHtml = `
            <h6 class="mb-2 mt-4"><i class="bi bi-list-check me-2"></i>${currentLanguage === 'en' ? 'Key Points' : '要点'}</h6>
            <ul class="mb-3">
                ${summary.keyPoints.map(point => `<li>${point}</li>`).join('')}
            </ul>
        `;
    }

    container.innerHTML = `
        <div class="ai-summary-section" style="line-height: 1.8;">
            ${formattedSummary}
            ${keyPointsHtml}
            ${summary.pageCount ? `<p class="text-muted small mb-0"><i class="bi bi-info-circle me-1"></i>${summary.pageCount}</p>` : ''}
        </div>
    `;
}

// Load Chapter Summaries - Integrated with ToC module
async function loadChapterSummaries() {
    const container = document.getElementById('aiChapterSummaryContent');

    // Check cache first - if already generated, display it directly
    if (aiCache.chapterSummaries) {
        displayChapterSummaries(aiCache.chapterSummaries);
        return;
    }

    // Show start button instead of immediately executing
    container.innerHTML = `
        <div class="text-center py-5">
            <i class="bi bi-list-columns" style="font-size: 3rem; color: var(--primary-blue); opacity: 0.3;"></i>
            <h5 class="mt-3 mb-2">${currentLanguage === 'en' ? 'Generate Chapter Summaries' : '生成章节摘要'}</h5>
            <p class="text-muted mb-4">${currentLanguage === 'en'
                ? 'Click the button below to generate summaries for all chapters using DeepSeek AI.'
                : '点击下面的按钮使用 DeepSeek AI 生成所有章节的摘要。'}</p>
            <button class="btn btn-primary btn-lg" onclick="executeChapterSummaries()">
                <i class="bi bi-play-circle me-2"></i>
                <span>${currentLanguage === 'en' ? 'Start Generation' : '开始生成'}</span>
            </button>
            <p class="text-muted small mt-3"><i class="bi bi-clock me-1"></i>${currentLanguage === 'en'
                ? 'Estimated time: 30-60 seconds'
                : '预计时间：30-60 秒'}</p>
        </div>
    `;
}

// Execute Chapter Summaries generation
async function executeChapterSummaries() {
    const container = document.getElementById('aiChapterSummaryContent');

    // Show loading state
    container.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border spinner-border-sm text-primary mb-2" role="status"></div>
            <p class="text-muted small mb-0">${currentLanguage === 'en' ? 'Analyzing chapters with DeepSeek AI...' : '使用 DeepSeek AI 分析章节...'}</p>
            <small class="text-muted">This may take 30-60 seconds</small>
        </div>
    `;

    try {
        // Use the chapters already parsed and displayed in ToC
        if (currentBook && currentBook.data && currentBook.data.chapters) {
            // The ToC has already identified all chapters - use that data directly
            const tocChapters = currentBook.data.chapters;

            // Filter out non-chapter entries based on ToC structure
            // ToC typically excludes title pages, prefaces, etc.
            const validChapters = tocChapters.filter(ch => {
                // Only process chapters that have meaningful content
                const hasContent = ch.text || ch.content;
                const hasTitle = ch.title && ch.title.trim();
                return hasTitle && hasContent && hasContent.length > 50;
            });

            if (validChapters.length === 0) {
                container.innerHTML = `
                    <div class="alert alert-warning">
                        <i class="bi bi-info-circle me-2"></i>
                        ${currentLanguage === 'en'
                            ? 'No chapters found with sufficient content for summarization.'
                            : '没有找到包含足够内容的章节进行摘要。'}
                    </div>
                `;
                return;
            }

            // Update AIService with the filtered chapters
            if (window.AIService) {
                window.AIService.currentBookData.chapters = validChapters.map(ch => ({
                    title: ch.title,
                    content: ch.text || ch.content
                }));
            }

            // Generate summaries using the AI service
            const summaries = await window.AIService.generateChapterSummaries(currentLanguage);
            console.log('Received summaries from AI service:', summaries);

            if (summaries && summaries.length > 0) {
                aiCache.chapterSummaries = summaries;
                displayChapterSummaries(summaries);
            } else {
                console.log('No summaries returned or empty array');
                // Show message if no summaries were generated
                container.innerHTML = `
                    <div class="alert alert-info">
                        <i class="bi bi-info-circle me-2"></i>
                        ${currentLanguage === 'en'
                            ? 'Unable to generate summaries. The chapters may not contain enough text.'
                            : '无法生成摘要。章节可能没有足够的文本内容。'}
                    </div>
                `;
            }
            return;
        }

        // Fallback if no book is loaded
        container.innerHTML = `
            <div class="alert alert-warning">
                <i class="bi bi-exclamation-triangle me-2"></i>
                ${currentLanguage === 'en'
                    ? 'Please load a book first to generate chapter summaries.'
                    : '请先加载书籍以生成章节摘要。'}
            </div>
        `;
    } catch (error) {
        console.error('Error generating chapter summaries:', error);
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>
                ${currentLanguage === 'en'
                    ? 'Failed to generate summaries. Please ensure the AI backend is running.'
                    : '生成摘要失败。请确保 AI 后端正在运行。'}
            </div>
        `;
    }
}

function displayChapterSummaries(chapters) {
    const container = document.getElementById('aiChapterSummaryContent');
    console.log('displayChapterSummaries called with:', chapters);

    // Handle both direct array and response object format
    let chaptersList = chapters;
    if (chapters && !Array.isArray(chapters)) {
        // If it's the response object from AI service
        if (chapters.chapter_summaries) {
            chaptersList = chapters.chapter_summaries.map(ch => ({
                title: ch.chapter_title,
                summary: ch.summary
            }));
        }
    }

    console.log('Chapters list after processing:', chaptersList);

    // Filter out any empty chapters
    const validChapters = chaptersList.filter(ch => ch && ch.title);
    console.log('Valid chapters:', validChapters);

    if (validChapters.length === 0) {
        container.innerHTML = `
            <div class="alert alert-warning">
                <i class="bi bi-exclamation-triangle me-2"></i>
                ${currentLanguage === 'en'
                    ? 'No chapter summaries available. The book may not have identifiable chapters.'
                    : '没有可用的章节摘要。这本书可能没有可识别的章节。'}
            </div>
        `;
        return;
    }

    // Use simple sequential numbering (1, 2, 3...)
    const chaptersHtml = validChapters.map((chapter, index) => {
        const sequentialNumber = index + 1;

        // More robust check for summary content
        let summaryText;
        if (chapter.summary === undefined || chapter.summary === null) {
            console.log(`Chapter ${sequentialNumber} has undefined/null summary`);
            summaryText = currentLanguage === 'en' ? 'Summary not available' : '摘要不可用';
        } else if (typeof chapter.summary === 'string' && chapter.summary.trim() !== '') {
            summaryText = chapter.summary;
        } else {
            console.log(`Chapter ${sequentialNumber} has empty or invalid summary:`, chapter.summary);
            summaryText = currentLanguage === 'en' ? 'Summary pending...' : '摘要生成中...';
        }

        console.log(`Chapter ${sequentialNumber}: title="${chapter.title}", summary="${summaryText.substring(0, 50)}..."`);

        return `
            <div class="ai-chapter-summary mb-3">
                <div class="d-flex align-items-start">
                    <div class="badge bg-primary me-2 mt-1" style="min-width: 32px;">${sequentialNumber}</div>
                    <div style="flex: 1;">
                        <h6 class="mb-1">${chapter.title}</h6>
                        <p class="text-muted small mb-0">${summaryText}</p>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = chaptersHtml;
}

// Load Content Analysis
async function loadContentAnalysis() {
    const container = document.getElementById('aiContentAnalysisContent');

    // Check cache first - if already generated, display it directly
    if (aiCache.contentAnalysis) {
        // Check if it's the new format with fullAnalysis
        if (aiCache.contentAnalysis.fullAnalysis) {
            displayContentAnalysisText(aiCache.contentAnalysis.fullAnalysis);
        } else {
            // Old format fallback
            displayContentAnalysis(aiCache.contentAnalysis);
        }
        return;
    }

    // Show start button instead of immediately executing
    container.innerHTML = `
        <div class="text-center py-5">
            <i class="bi bi-graph-up" style="font-size: 3rem; color: var(--primary-blue); opacity: 0.3;"></i>
            <h5 class="mt-3 mb-2">${currentLanguage === 'en' ? 'Generate Content Analysis' : '生成内容分析'}</h5>
            <p class="text-muted mb-4">${currentLanguage === 'en'
                ? 'Click the button below to perform a comprehensive analysis of this book using DeepSeek AI.'
                : '点击下面的按钮使用 DeepSeek AI 对这本书进行全面分析。'}</p>
            <button class="btn btn-primary btn-lg" onclick="executeContentAnalysis()">
                <i class="bi bi-play-circle me-2"></i>
                <span>${currentLanguage === 'en' ? 'Start Analysis' : '开始分析'}</span>
            </button>
            <p class="text-muted small mt-3"><i class="bi bi-clock me-1"></i>${currentLanguage === 'en'
                ? 'Estimated time: 30-60 seconds'
                : '预计时间：30-60 秒'}</p>
        </div>
    `;
}

// Execute Content Analysis generation
async function executeContentAnalysis() {
    const container = document.getElementById('aiContentAnalysisContent');

    // Show loading state
    container.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border spinner-border-sm text-primary mb-2" role="status"></div>
            <p class="text-muted small mb-0">${currentLanguage === 'en' ? 'Analyzing content with DeepSeek AI...' : '使用 DeepSeek AI 分析内容...'}</p>
            <small class="text-muted">This may take 30-60 seconds</small>
        </div>
    `;

    try {
        // Check if AIService is available and has book data
        if (typeof window.AIService !== 'undefined' && window.AIService.currentBookData) {
            // Pass language parameter for correct response language
            const analysisText = await window.AIService.analyzeContent('comprehensive', currentLanguage);

            if (analysisText) {
                // Display the AI analysis directly with proper formatting
                const analysis = {
                    fullAnalysis: analysisText
                };

                aiCache.contentAnalysis = analysis;
                displayContentAnalysisText(analysisText);
                return;
            }
        }

        // Fallback to simulated content with structured format
        setTimeout(() => {
            const structuredAnalysis = currentLanguage === 'en' ? `
## Major Themes and Development

The book explores several interconnected themes that evolve throughout the narrative:

1. **The Art of Reading** - Reading is presented not merely as a skill but as an art form requiring dedication and practice
2. **Digital Transformation** - The evolution of literature in the digital age and its impact on accessibility
3. **Personal Growth** - How reading shapes individual development and critical thinking
4. **Human Connection** - The timeless dialogue between readers and authors across generations

## Characters and Personalities

While this is primarily a non-fiction work, the narrative voice presents:
- An experienced guide sharing wisdom about the reading journey
- References to various literary figures and their contributions
- The reader as an active participant in the learning process

## Writing Style and Techniques

The author employs:
- Clear, accessible prose suitable for a broad audience
- Progressive chapter structure building from fundamentals to advanced concepts
- Balanced mix of theoretical insights and practical applications
- Engaging metaphors comparing reading to artistic practice

## Symbolism and Literary Devices

- **The Journey Metaphor** - Reading described as a continuous voyage of discovery
- **Light and Illumination** - Knowledge and understanding portrayed as enlightenment
- **Bridge Imagery** - Books as connectors between different worlds and perspectives

## Historical and Cultural Context

The work is firmly rooted in contemporary digital culture while acknowledging traditional reading practices. It addresses the tension between print and digital media, offering a balanced perspective on both formats' values.
            ` : `
## 主要主题及发展

本书探讨了几个相互关联的主题，这些主题贯穿整个叙述：

1. **阅读的艺术** - 阅读不仅仅是一种技能，而是需要奉献和练习的艺术形式
2. **数字化转型** - 数字时代文学的演变及其对可访问性的影响
3. **个人成长** - 阅读如何塑造个人发展和批判性思维
4. **人际联系** - 读者与作者跨越世代的永恒对话

## 角色及性格

虽然这主要是一部非虚构作品，但叙述声音呈现了：
- 一位经验丰富的向导分享关于阅读之旅的智慧
- 对各种文学人物及其贡献的引用
- 读者作为学习过程的积极参与者

## 写作风格及技巧

作者采用：
- 清晰、易懂的散文，适合广大读者
- 从基础到高级概念的渐进式章节结构
- 理论见解与实际应用的平衡结合
- 将阅读比作艺术实践的生动隐喻

## 象征主义与文学手法

- **旅程隐喻** - 阅读被描述为持续的发现之旅
- **光明与启迪** - 知识和理解被描绘为启蒙
- **桥梁意象** - 书籍作为不同世界和观点之间的连接器

## 历史文化背景

这部作品扎根于当代数字文化，同时承认传统阅读实践。它解决了印刷和数字媒体之间的紧张关系，对两种格式的价值提供了平衡的观点。
            `;

            const analysis = {
                fullAnalysis: structuredAnalysis
            };

            aiCache.contentAnalysis = analysis;
            displayContentAnalysisText(structuredAnalysis);
        }, 1500);
    } catch (error) {
        console.error('Error analyzing content:', error);
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>
                ${currentLanguage === 'en'
                    ? 'Failed to analyze content. Please ensure the AI backend is running.'
                    : '内容分析失败。请确保 AI 后端正在运行。'}
            </div>
        `;
    }
}

function displayContentAnalysis(analysis) {
    const container = document.getElementById('aiContentAnalysisContent');

    const themesHtml = analysis.themes.map(theme =>
        `<span class="badge bg-light text-dark me-1 mb-1">${theme}</span>`
    ).join('');

    container.innerHTML = `
        <div class="ai-analysis-section">
            <h6 class="mb-2"><i class="bi bi-tags me-2"></i>${currentLanguage === 'en' ? 'Themes' : '主题'}</h6>
            <div class="mb-3">${themesHtml}</div>

            <h6 class="mb-2"><i class="bi bi-book me-2"></i>${currentLanguage === 'en' ? 'Genre' : '类型'}</h6>
            <p class="mb-3">${analysis.genre}</p>

            <h6 class="mb-2"><i class="bi bi-bar-chart me-2"></i>${currentLanguage === 'en' ? 'Reading Level' : '阅读水平'}</h6>
            <p class="mb-3">${analysis.readingLevel}</p>

            <h6 class="mb-2"><i class="bi bi-music-note me-2"></i>${currentLanguage === 'en' ? 'Tone' : '语气'}</h6>
            <p class="mb-0">${analysis.tone}</p>
        </div>
    `;
}

// New function to display AI analysis text with proper formatting
function displayContentAnalysisText(analysisText) {
    const container = document.getElementById('aiContentAnalysisContent');

    // Format the AI response for better readability
    let formattedText = analysisText;

    // Remove markdown artifacts and strange symbols
    formattedText = formattedText.replace(/---\s*###/g, '###');
    formattedText = formattedText.replace(/---\s*\*\*/g, '**');
    formattedText = formattedText.replace(/【|】/g, '');

    // Convert markdown to HTML
    formattedText = formattedText
        // Headers
        .replace(/^### (.*?)$/gm, '<h6 class="mt-3 mb-2 text-primary">$1</h6>')
        .replace(/^## (.*?)$/gm, '<h5 class="mt-3 mb-2">$1</h5>')
        .replace(/^# (.*?)$/gm, '<h4 class="mt-3 mb-2">$1</h4>')
        // Bold
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Lists with proper line breaks
        .replace(/^\d+\.\s+(.*?)$/gm, '<li class="mb-2">$1</li>')
        .replace(/^[-•]\s+(.*?)$/gm, '<li class="mb-2">$1</li>')
        // Wrap consecutive list items
        .replace(/(<li.*?<\/li>\s*)+/g, function(match) {
            return '<ul class="mb-3">' + match + '</ul>';
        })
        // Paragraphs
        .replace(/\n\n/g, '</p><p class="mb-3">')
        .replace(/\n/g, '<br>');

    // Wrap in paragraph tags if not already wrapped
    if (!formattedText.startsWith('<')) {
        formattedText = '<p class="mb-3">' + formattedText + '</p>';
    }

    container.innerHTML = `
        <div class="ai-analysis-content" style="line-height: 1.8;">
            ${formattedText}
        </div>
    `;
}

// Load Chat Interface
function loadChatInterface() {
    const container = document.getElementById('aiChatContent');

    // Create chat interface
    const chatHtml = `
        <div class="chat-container fullscreen">
            <div class="chat-messages" id="chatMessages" style="flex: 1; overflow-y: auto; padding: 1rem; background: #f8f9fa; border-radius: 8px; margin-bottom: 1rem; max-height: calc(100vh - 350px);">
                ${aiCache.chatHistory.length === 0 ? `
                    <div class="text-center text-muted py-5">
                        <i class="bi bi-chat-dots" style="font-size: 3rem; opacity: 0.3;"></i>
                        <p class="mt-3 mb-0">${currentLanguage === 'en'
                            ? 'Start a conversation about this book...'
                            : '开始关于这本书的对话...'}</p>
                    </div>
                ` : renderChatMessages()}
            </div>
            <div class="chat-input-area">
                <div class="input-group">
                    <input type="text" class="form-control" id="chatInput"
                           placeholder="${currentLanguage === 'en' ? 'Ask a question about the book...' : '询问关于这本书的问题...'}"
                           onkeypress="if(event.key === 'Enter') sendChatMessage()">
                    <button class="btn btn-primary" type="button" onclick="sendChatMessage()">
                        <i class="bi bi-send"></i>
                    </button>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = chatHtml;

    // Scroll to bottom if there are messages
    if (aiCache.chatHistory.length > 0) {
        setTimeout(() => {
            const messagesContainer = document.getElementById('chatMessages');
            if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }, 100);
    }
}

function renderChatMessages() {
    // Get current theme colors for user messages
    const themeColors = {
        light: 'linear-gradient(135deg, #4A90E2 0%, #E94D8A 100%)',
        sepia: 'linear-gradient(135deg, #D4A574 0%, #C19A6B 100%)',
        green: 'linear-gradient(135deg, #66BB6A 0%, #43A047 100%)',
        pink: 'linear-gradient(135deg, #F06292 0%, #EC407A 100%)',
        lavender: 'linear-gradient(135deg, #BA68C8 0%, #AB47BC 100%)',
        cream: 'linear-gradient(135deg, #FFD54F 0%, #FFC107 100%)',
        dark: 'linear-gradient(135deg, #546E7A 0%, #455A64 100%)',
        night: 'linear-gradient(135deg, #5C6BC0 0%, #3F51B5 100%)'
    };

    const currentTheme = readerSettings.theme || 'light';
    const userBubbleColor = themeColors[currentTheme];

    return aiCache.chatHistory.map(msg => {
        if (msg.role === 'user') {
            return `
                <div class="chat-message user-message mb-3">
                    <div class="d-flex justify-content-end">
                        <div class="message-bubble" style="background: ${userBubbleColor}; color: white; padding: 0.75rem 1rem; border-radius: 18px 18px 4px 18px; max-width: 80%;">
                            ${msg.content}
                        </div>
                    </div>
                </div>
            `;
        } else {
            // Format assistant response for better readability
            let formattedContent = msg.content;

            // Remove markdown artifacts and strange symbols
            formattedContent = formattedContent.replace(/---\s*###/g, '###');
            formattedContent = formattedContent.replace(/---\s*\*\*/g, '**');
            formattedContent = formattedContent.replace(/【|】/g, '');
            formattedContent = formattedContent.replace(/—/g, '-');

            // Convert markdown to HTML for chat
            formattedContent = formattedContent
                // Headers (make them smaller for chat)
                .replace(/^### (.*?)$/gm, '<strong class="d-block mt-2">$1</strong>')
                .replace(/^## (.*?)$/gm, '<strong class="d-block mt-2">$1</strong>')
                .replace(/^# (.*?)$/gm, '<strong class="d-block mt-2">$1</strong>')
                // Bold
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                // Italic
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                // Numbered lists
                .replace(/^\d+\.\s+(.*?)$/gm, '<br>• $1')
                // Bullet lists
                .replace(/^[-•]\s+(.*?)$/gm, '<br>• $1')
                // Line breaks for paragraphs
                .replace(/\n\n/g, '<br><br>')
                .replace(/\n/g, '<br>');

            // Remove leading <br> if present
            formattedContent = formattedContent.replace(/^<br>/, '');

            return `
                <div class="chat-message assistant-message mb-3">
                    <div class="d-flex justify-content-start">
                        <div class="message-bubble" style="background: white; border: 1px solid #e0e0e0; padding: 0.75rem 1rem; border-radius: 18px 18px 18px 4px; max-width: 80%; line-height: 1.6;">
                            ${formattedContent}
                        </div>
                    </div>
                </div>
            `;
        }
    }).join('');
}

async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();

    if (!message) return;

    // Add user message
    aiCache.chatHistory.push({
        role: 'user',
        content: message
    });

    // Clear input
    input.value = '';

    // Refresh chat display
    loadChatInterface();

    // Show typing indicator
    const messagesContainer = document.getElementById('chatMessages');
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'chat-message assistant-message mb-3';
    typingIndicator.innerHTML = `
        <div class="d-flex justify-content-start">
            <div class="message-bubble" style="background: white; border: 1px solid #e0e0e0; padding: 0.75rem 1rem; border-radius: 18px 18px 18px 4px;">
                <div class="typing-indicator">
                    <span></span><span></span><span></span>
                </div>
                <small class="text-muted d-block mt-2">${currentLanguage === 'en' ? 'DeepSeek AI is thinking... (30-60 seconds)' : 'DeepSeek AI 正在思考... (30-60秒)'}</small>
            </div>
        </div>
    `;
    messagesContainer.appendChild(typingIndicator);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    try {
        // Check if AIService is available
        if (typeof window.AIService !== 'undefined' && window.AIService.currentBookData) {
            // Pass language parameter for chat
            const response = await window.AIService.sendChatMessage(message, aiCache.chatHistory, currentLanguage);

            if (response) {
                aiCache.chatHistory.push({
                    role: 'assistant',
                    content: response
                });

                loadChatInterface();
                return;
            }
        }

        // Fallback to simulated response
        setTimeout(() => {
            const responses = currentLanguage === 'en' ? [
                "That's an interesting question! Based on the content of this book, I'd say the main theme revolves around the transformative power of reading and continuous learning.",
                "Great observation! The author emphasizes that reading is not just about consuming information, but about engaging deeply with ideas and perspectives.",
                "From what I can see in the text, this topic is explored in detail in Chapter 2, where the author discusses the importance of practice and challenging yourself.",
                "That's a thoughtful question. The book suggests that the rewards of reading extend far beyond entertainment - they include personal growth, enhanced critical thinking, and connection with diverse voices."
            ] : [
                "这是一个有趣的问题！根据这本书的内容，我认为主题围绕着阅读和持续学习的变革力量。",
                "很好的观察！作者强调阅读不仅仅是消费信息，而是深入参与思想和观点。",
                "从我在文本中看到的，这个话题在第二章中有详细探讨，作者讨论了练习和挑战自己的重要性。",
                "这是一个深思熟虑的问题。这本书表明，阅读的回报远远超出娱乐 - 它们包括个人成长、增强批判性思维以及与多样化声音的联系。"
            ];

            const response = responses[Math.floor(Math.random() * responses.length)];

            aiCache.chatHistory.push({
                role: 'assistant',
                content: response
            });

            loadChatInterface();
        }, 1500);
    } catch (error) {
        console.error('Error sending chat message:', error);

        // Remove typing indicator and show error
        typingIndicator.innerHTML = `
            <div class="d-flex justify-content-start">
                <div class="message-bubble" style="background: #fee; border: 1px solid #fcc; padding: 0.75rem 1rem; border-radius: 18px 18px 18px 4px;">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    ${currentLanguage === 'en'
                        ? 'Failed to get response. Please ensure the AI backend is running.'
                        : '获取响应失败。请确保 AI 后端正在运行。'}
                </div>
            </div>
        `;
    }
}
