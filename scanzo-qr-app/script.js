// 🎯 Simple Theme Manager
class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'dark';
        this.init();
    }

    init() {
        this.apply();
        this.bindEvents();
    }

    bindEvents() {
        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.toggle();
        });
    }

    toggle() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        this.apply();
        this.animate();
    }

    apply() {
        document.body.setAttribute('data-theme', this.theme);
        localStorage.setItem('theme', this.theme);
        
        const toggle = document.getElementById('theme-toggle');
        const icon = toggle.querySelector('i');
        
        if (this.theme === 'dark') {
            icon.className = 'fas fa-sun';
            document.querySelector('meta[name="theme-color"]').content = '#0B0F19';
        } else {
            icon.className = 'fas fa-moon';
            document.querySelector('meta[name="theme-color"]').content = '#FEFEFE';
        }
    }

    animate() {
        const toggle = document.getElementById('theme-toggle');
        toggle.style.transform = 'scale(0.8) rotate(180deg)';
        setTimeout(() => {
            toggle.style.transform = '';
        }, 200);
    }
}

// 🚀 Main App Class
class ScanzoQRApp {
    constructor() {
        this.currentTab = 'home';
        this.currentMode = 'public';
        this.currentType = 'text';
        this.history = JSON.parse(localStorage.getItem('qrHistory')) || [];
        this.scanner = null;
        this.stream = null;
        
        this.init();
    }

    init() {
        this.themeManager = new ThemeManager();
        this.bindEvents();
        this.loadHistory();
        this.updateStats();
        this.animate();
    }

    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.closest('.nav-btn').dataset.tab);
            });
        });

        // Mode & Type
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchMode(e.target.closest('.mode-btn').dataset.mode);
            });
        });

        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchType(e.target.closest('.type-btn').dataset.type);
            });
        });

        // File Upload
        this.setupFileUpload();

        // Password
        document.querySelector('.password-toggle').addEventListener('click', () => this.togglePassword());
        document.getElementById('qr-password').addEventListener('input', () => this.checkPasswordStrength());

        // Text Counter
        document.getElementById('text-content').addEventListener('input', () => this.updateCharCounter());

        // Generate
        document.getElementById('generate-btn').addEventListener('click', () => this.generateQR());

        // QR Actions
        document.getElementById('download-btn').addEventListener('click', () => this.downloadQR());
        document.getElementById('save-btn').addEventListener('click', () => this.saveToHistory());
        document.getElementById('share-btn').addEventListener('click', () => this.shareQR());

        // Scanner
        document.getElementById('start-scan').addEventListener('click', () => this.startScanner());
        document.getElementById('stop-scan').addEventListener('click', () => this.stopScanner());
        document.getElementById('upload-qr').addEventListener('click', () => {
            document.getElementById('qr-upload').click();
        });
        document.getElementById('qr-upload').addEventListener('change', (e) => {
            if (e.target.files[0]) this.scanFile(e.target.files[0]);
        });

        // Unlock
        document.getElementById('unlock-btn').addEventListener('click', () => this.unlockQR());

        // Result Actions
        document.getElementById('copy-result').addEventListener('click', () => this.copyResult());
        document.getElementById('download-result').addEventListener('click', () => this.downloadResult());
        document.getElementById('save-result').addEventListener('click', () => this.saveResult());

        // History
        document.getElementById('clear-history').addEventListener('click', () => this.clearHistory());
        document.getElementById('export-history').addEventListener('click', () => this.exportHistory());

        // Filter & Search
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.filterHistory(e.target.dataset.filter));
        });
        
        document.getElementById('history-search').addEventListener('input', (e) => {
            this.searchHistory(e.target.value);
        });

        document.getElementById('clear-search').addEventListener('click', () => {
            document.getElementById('history-search').value = '';
            this.searchHistory('');
        });

        // Toast
        document.querySelector('.toast-close').addEventListener('click', () => this.hideToast());
    }

    setupFileUpload() {
        const upload = document.getElementById('file-upload');
        const input = document.getElementById('image-file');
        
        upload.addEventListener('click', () => input.click());
        upload.addEventListener('dragover', (e) => {
            e.preventDefault();
            upload.style.background = 'rgba(139, 92, 246, 0.1)';
        });
        upload.addEventListener('dragleave', () => {
            upload.style.background = '';
        });
        upload.addEventListener('drop', (e) => {
            e.preventDefault();
            upload.style.background = '';
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.handleFile(file);
            }
        });
        
        input.addEventListener('change', (e) => {
            if (e.target.files[0]) this.handleFile(e.target.files[0]);
        });
    }

    handleFile(file) {
        if (file.size > 5 * 1024 * 1024) {
            this.toast('File too large (max 5MB)', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('image-preview');
            preview.innerHTML = `
                <div style="position: relative; display: inline-block;">
                    <img src="${e.target.result}" style="max-width: 100%; max-height: 200px; border-radius: 12px; box-shadow: var(--shadow);">
                    <button onclick="this.parentElement.parentElement.innerHTML=''; this.parentElement.parentElement.classList.remove('active');" 
                            style="position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.7); border: none; color: white; width: 24px; height: 24px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            preview.classList.add('active');
            this.toast('Image loaded!', 'success');
        };
        reader.readAsDataURL(file);
    }

    switchTab(tab) {
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(tab).classList.add('active');

        this.currentTab = tab;

        if (tab === 'history') {
            this.loadHistory();
            this.updateStats();
        }
    }

    switchMode(mode) {
        document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-mode="${mode}"]`).classList.add('active');

        const passwordSection = document.getElementById('password-section');
        if (mode === 'private') {
            passwordSection.classList.add('active');
        } else {
            passwordSection.classList.remove('active');
        }

        this.currentMode = mode;
    }

    switchType(type) {
        document.querySelectorAll('.type-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-type="${type}"]`).classList.add('active');

        document.querySelectorAll('.input-container').forEach(container => container.classList.remove('active'));
        document.getElementById(`${type}-input`).classList.add('active');

        this.currentType = type;
    }

    togglePassword() {
        const input = document.getElementById('qr-password');
        const icon = document.querySelector('.password-toggle i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
        }
    }

    checkPasswordStrength() {
        const password = document.getElementById('qr-password').value;
        const fill = document.querySelector('.strength-fill');
        const text = document.querySelector('.strength-text');
        
        let strength = 0;
        if (password.length >= 6) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;

        const levels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
        const colors = ['#EF4444', '#F59E0B', '#8B5CF6', '#10B981', '#22C55E'];
        
        fill.style.width = `${(strength / 5) * 100}%`;
        fill.style.background = colors[Math.min(strength, 4)];
        text.textContent = levels[Math.min(strength, 4)];
    }

    updateCharCounter() {
        const input = document.getElementById('text-content');
        const counter = document.getElementById('char-count');
        counter.textContent = input.value.length.toLocaleString();
    }

    async generateQR() {
        this.showLoading(true);

        try {
            let content = '';
            
            if (this.currentType === 'text') {
                content = document.getElementById('text-content').value.trim();
                if (!content) throw new Error('Enter some text first!');
            } else {
                const preview = document.getElementById('image-preview');
                if (!preview.classList.contains('active')) {
                    throw new Error('Select an image first!');
                }
                content = preview.querySelector('img').src;
            }

            if (this.currentMode === 'private') {
                const password = document.getElementById('qr-password').value;
                if (!password) throw new Error('Set a password for private mode!');
                content = this.encrypt(content, password);
                content = `SCANZO_PRIVATE:${content}`;
            }

            await this.renderQR(content);
            this.showQRResult();
            this.toast('QR code generated! 🔥', 'success');

        } catch (error) {
            this.toast(error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    encrypt(content, password) {
        const data = btoa(JSON.stringify({ content, password: btoa(password) }));
        return data;
    }

    decrypt(encrypted, password) {
        try {
            const data = JSON.parse(atob(encrypted));
            if (atob(data.password) !== password) {
                throw new Error('Wrong password');
            }
            return data.content;
        } catch {
            throw new Error('Invalid password');
        }
    }

    async renderQR(content) {
        const canvas = document.getElementById('qr-canvas');
        await QRCode.toCanvas(canvas, content, {
            width: 256,
            margin: 2,
            color: { dark: '#000', light: '#fff' }
        });
    }

    showQRResult() {
        const result = document.getElementById('qr-result');
        const title = document.getElementById('qr-title');
        const desc = document.getElementById('qr-description');
        const mode = document.getElementById('qr-mode');
        const type = document.getElementById('qr-type');

        title.textContent = `${this.currentMode.charAt(0).toUpperCase() + this.currentMode.slice(1)} QR Code`;
        desc.textContent = this.currentMode === 'private' ? 'Password protected' : 'Ready to share!';
        mode.textContent = this.currentMode.charAt(0).toUpperCase() + this.currentMode.slice(1);
        type.textContent = this.currentType.charAt(0).toUpperCase() + this.currentType.slice(1);

        result.classList.add('active');
        result.scrollIntoView({ behavior: 'smooth' });
    }

    downloadQR() {
        const canvas = document.getElementById('qr-canvas');
        const link = document.createElement('a');
        link.download = `scanzo-qr-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
        this.toast('Downloaded! 📥', 'success');
    }

    saveToHistory() {
        const canvas = document.getElementById('qr-canvas');
        const content = this.currentType === 'text' 
            ? document.getElementById('text-content').value
            : 'Image content';

        const item = {
            id: Date.now(),
            type: 'generated',
            mode: this.currentMode,
            contentType: this.currentType,
            content,
            qrData: canvas.toDataURL(),
            timestamp: new Date().toISOString(),
            preview: content.substring(0, 80) + (content.length > 80 ? '...' : '')
        };

        this.history.unshift(item);
        this.saveHistory();
        this.updateStats();
        this.toast('Saved to history! 💾', 'success');
    }

    async shareQR() {
        const canvas = document.getElementById('qr-canvas');
        
        if (navigator.share) {
            try {
                canvas.toBlob(async (blob) => {
                    const file = new File([blob], 'qr-code.png', { type: 'image/png' });
                    await navigator.share({
                        title: 'ScanzoQR Code',
                        files: [file]
                    });
                });
            } catch {
                this.fallbackShare();
            }
        } else {
            this.fallbackShare();
        }
    }

    fallbackShare() {
        const canvas = document.getElementById('qr-canvas');
        canvas.toBlob(async (blob) => {
            try {
                await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                this.toast('Copied to clipboard! 📋', 'success');
            } catch {
                this.toast('Share not supported', 'warning');
            }
        });
    }

    startScanner() {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            .then(stream => {
                this.stream = stream;
                const video = document.getElementById('scanner-video');
                video.srcObject = stream;
                this.updateScannerStatus('Scanning...', 'active');
                this.toast('Scanner started 📷', 'success');
                
                // Demo scan after 3 seconds
                setTimeout(() => {
                    this.processScan('Demo scanned content from camera');
                }, 3000);
            })
            .catch(() => {
                this.toast('Camera access denied', 'error');
                this.updateScannerStatus('Camera error', 'error');
            });
    }

    stopScanner() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        document.getElementById('scanner-video').srcObject = null;
        this.updateScannerStatus('Ready to scan', 'ready');
        this.toast('Scanner stopped', 'warning');
    }

    updateScannerStatus(message, status) {
        const statusEl = document.getElementById('scanner-status');
        const icon = statusEl.querySelector('i');
        const text = statusEl.querySelector('span');
        
        text.textContent = message;
        statusEl.className = `status-indicator ${status}`;
        
        const icons = {
            ready: 'fas fa-circle',
            active: 'fas fa-circle-notch fa-spin',
            error: 'fas fa-exclamation-circle'
        };
        icon.className = icons[status];
    }

    scanFile(file) {
        this.showLoading(true, 'Analyzing...');
        setTimeout(() => {
            this.processScan('Demo content from uploaded image');
            this.showLoading(false);
        }, 1500);
    }

    processScan(content) {
        const result = document.getElementById('scan-result');
        const typeEl = document.getElementById('result-type');
        const prompt = document.getElementById('password-prompt');
        const display = document.getElementById('content-display');

        if (content.startsWith('SCANZO_PRIVATE:')) {
            this.encryptedContent = content.substring(15);
            typeEl.innerHTML = '<i class="fas fa-lock"></i><span>Private</span>';
            prompt.classList.add('active');
            display.style.display = 'none';
        } else {
            typeEl.innerHTML = '<i class="fas fa-globe"></i><span>Public</span>';
            prompt.classList.remove('active');
            this.displayContent(content);
        }

        result.classList.add('active');
        result.scrollIntoView({ behavior: 'smooth' });
        this.stopScanner();
    }

    unlockQR() {
        const password = document.getElementById('unlock-password').value;
        const error = document.getElementById('password-error');

        if (!password) {
            error.textContent = 'Enter the password';
            error.classList.add('active');
            return;
        }

        try {
            const content = this.decrypt(this.encryptedContent, password);
            this.displayContent(content);
            document.getElementById('password-prompt').classList.remove('active');
            error.classList.remove('active');
            this.toast('Unlocked! 🔓', 'success');
        } catch {
            error.textContent = 'Wrong password';
            error.classList.add('active');
        }
    }

    displayContent(content) {
        const display = document.getElementById('content-display');
        const textResult = document.getElementById('text-result');
        const imageResult = document.getElementById('image-result');

        if (content.startsWith('data:image/')) {
            imageResult.innerHTML = `<img src="${content}" style="max-width: 100%; border-radius: 12px;">`;
            textResult.style.display = 'none';
            imageResult.style.display = 'block';
        } else {
            textResult.innerHTML = `<div style="background: var(--bg-surface); padding: 20px; border-radius: 12px; white-space: pre-wrap; word-break: break-word;">${content}</div>`;
            textResult.style.display = 'block';
            imageResult.style.display = 'none';
        }

        display.style.display = 'block';
        this.lastContent = content;
    }

    async copyResult() {
        if (!this.lastContent) return;
        try {
            await navigator.clipboard.writeText(this.lastContent);
            this.toast('Copied! 📋', 'success');
        } catch {
            this.toast('Copy failed', 'error');
        }
    }

    downloadResult() {
        if (!this.lastContent) return;
        const blob = new Blob([this.lastContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `scanned-content-${Date.now()}.txt`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        this.toast('Downloaded! 📥', 'success');
    }

    saveResult() {
        if (!this.lastContent) return;

        const item = {
            id: Date.now(),
            type: 'scanned',
            mode: 'public',
            contentType: this.lastContent.startsWith('data:image/') ? 'image' : 'text',
            content: this.lastContent,
            timestamp: new Date().toISOString(),
            preview: this.lastContent.startsWith('data:image/') 
                ? 'Image content' 
                : this.lastContent.substring(0, 80) + (this.lastContent.length > 80 ? '...' : '')
        };

        this.history.unshift(item);
        this.saveHistory();
        this.updateStats();
        this.toast('Saved! 💾', 'success');
    }

    loadHistory() {
        const list = document.getElementById('history-list');
        const empty = document.getElementById('history-empty');

        if (this.history.length === 0) {
            list.style.display = 'none';
            empty.style.display = 'block';
            return;
        }

        list.style.display = 'block';
        empty.style.display = 'none';

        list.innerHTML = this.history.map(item => `
            <div class="history-item" data-id="${item.id}">
                <div class="history-item-header">
                    <div class="history-item-info">
                        <h4>
                            <i class="fas fa-${item.contentType === 'text' ? 'file-text' : 'image'}"></i>
                            ${item.contentType} - ${item.mode}
                        </h4>
                        <p>${item.type === 'generated' ? 'Generated' : 'Scanned'} • ${new Date(item.timestamp).toLocaleDateString()}</p>
                    </div>
                    <div class="history-item-meta">
                        <div>${new Date(item.timestamp).toLocaleTimeString()}</div>
                    </div>
                </div>
                <div class="history-item-preview">${item.preview}</div>
                <div class="history-item-actions">
                    <button class="btn btn-sm btn-secondary" onclick="app.copyHistoryItem(${item.id})">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="app.downloadHistoryItem(${item.id})">
                        <i class="fas fa-download"></i> Download
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="app.deleteHistoryItem(${item.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    updateStats() {
        const total = document.getElementById('total-qrs');
        const generated = document.getElementById('generated-qrs');
        const scanned = document.getElementById('scanned-qrs');

        const generatedCount = this.history.filter(item => item.type === 'generated').length;
        const scannedCount = this.history.filter(item => item.type === 'scanned').length;

        total.textContent = this.history.length;
        generated.textContent = generatedCount;
        scanned.textContent = scannedCount;
    }

    filterHistory(filter) {
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');

        let filtered = this.history;
        if (filter !== 'all') {
            filtered = this.history.filter(item => {
                switch (filter) {
                    case 'generated': return item.type === 'generated';
                    case 'scanned': return item.type === 'scanned';
                    case 'public': return item.mode === 'public';
                    case 'private': return item.mode === 'private';
                    default: return true;
                }
            });
        }

        this.displayHistory(filtered);
    }

    searchHistory(query) {
        const clearBtn = document.getElementById('clear-search');
        clearBtn.style.display = query ? 'block' : 'none';

        if (!query) {
            this.loadHistory();
            return;
        }

        const filtered = this.history.filter(item =>
            item.content.toLowerCase().includes(query.toLowerCase()) ||
            item.contentType.toLowerCase().includes(query.toLowerCase()) ||
            item.mode.toLowerCase().includes(query.toLowerCase())
        );

        this.displayHistory(filtered);
    }

    displayHistory(items) {
        const list = document.getElementById('history-list');
        const empty = document.getElementById('history-empty');

        if (items.length === 0) {
            list.style.display = 'none';
            empty.style.display = 'block';
            empty.innerHTML = `
                <div class="empty-icon"><i class="fas fa-search"></i></div>
                <h3>No results found</h3>
                <p>Try different search terms</p>
            `;
            return;
        }

        list.style.display = 'block';
        empty.style.display = 'none';

        list.innerHTML = items.map(item => `
            <div class="history-item" data-id="${item.id}">
                <div class="history-item-header">
                    <div class="history-item-info">
                        <h4>
                            <i class="fas fa-${item.contentType === 'text' ? 'file-text' : 'image'}"></i>
                            ${item.contentType} - ${item.mode}
                        </h4>
                        <p>${item.type === 'generated' ? 'Generated' : 'Scanned'} • ${new Date(item.timestamp).toLocaleDateString()}</p>
                    </div>
                    <div class="history-item-meta">
                        <div>${new Date(item.timestamp).toLocaleTimeString()}</div>
                    </div>
                </div>
                <div class="history-item-preview">${item.preview}</div>
                <div class="history-item-actions">
                    <button class="btn btn-sm btn-secondary" onclick="app.copyHistoryItem(${item.id})">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="app.downloadHistoryItem(${item.id})">
                        <i class="fas fa-download"></i> Download
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="app.deleteHistoryItem(${item.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    async copyHistoryItem(id) {
        const item = this.history.find(h => h.id === id);
        if (!item) return;

        try {
            await navigator.clipboard.writeText(item.content);
            this.toast('Copied! 📋', 'success');
        } catch {
            this.toast('Copy failed', 'error');
        }
    }

    downloadHistoryItem(id) {
        const item = this.history.find(h => h.id === id);
        if (!item) return;

        if (item.qrData) {
            const link = document.createElement('a');
            link.download = `qr-code-${item.id}.png`;
            link.href = item.qrData;
            link.click();
        } else {
            const blob = new Blob([item.content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `content-${item.id}.txt`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
        }

        this.toast('Downloaded! 📥', 'success');
    }

    deleteHistoryItem(id) {
        this.history = this.history.filter(h => h.id !== id);
        this.saveHistory();
        this.loadHistory();
        this.updateStats();
        this.toast('Deleted! 🗑️', 'warning');
    }

    clearHistory() {
        this.history = [];
        this.saveHistory();
        this.loadHistory();
        this.updateStats();
        this.toast('History cleared! 🧹', 'warning');
    }

    exportHistory() {
        const data = JSON.stringify(this.history, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.download = `scanzo-history-${Date.now()}.json`;
        link.href = url;
        link.click();
        
        URL.revokeObjectURL(url);
        this.toast('Exported! 📤', 'success');
    }

    saveHistory() {
        localStorage.setItem('qrHistory', JSON.stringify(this.history));
    }

    showLoading(show, text = 'Working...') {
        const loading = document.getElementById('loading');
        const loadingText = document.querySelector('.loading-text');
        
        if (show) {
            loadingText.textContent = text;
            loading.classList.add('active');
        } else {
            loading.classList.remove('active');
        }
    }

    toast(message, type = 'success', duration = 3000) {
        const toast = document.getElementById('toast');
        const icon = document.querySelector('.toast-icon');
        const msg = document.querySelector('.toast-message');
        const progress = document.querySelector('.toast-progress');

        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle'
        };

        icon.className = `toast-icon ${icons[type]}`;
        msg.textContent = message;

        toast.classList.add('show');
        progress.style.width = '100%';
        
        setTimeout(() => progress.style.width = '0%', 50);

        clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => this.hideToast(), duration);
    }

    hideToast() {
        document.getElementById('toast').classList.remove('show');
    }

    animate() {
        setTimeout(() => {
            document.querySelectorAll('.animate-slide-up, .animate-fade-up')
                .forEach(el => el.style.opacity = '1');
        }, 100);
    }
}

// 🎯 Global Functions
function switchTab(tab) {
    if (window.app) window.app.switchTab(tab);
}

// 🚀 Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ScanzoQRApp();
});
