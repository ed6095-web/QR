// QR Scanner Component
class QRScanner {
    constructor() {
        this.codeReader = new ZXing.BrowserMultiFormatReader();
        this.isScanning = false;
        this.stream = null;
        this.videoElement = null;
        this.multiPartData = new Map();
    }

    async startCamera() {
        try {
            this.videoElement = document.getElementById('scanner-video');
            
            const constraints = {
                video: {
                    facingMode: 'environment', // Back camera
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.videoElement.srcObject = this.stream;
            this.isScanning = true;

            // Start scanning
            this.scanFromCamera();

            return { success: true };
        } catch (error) {
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        if (this.videoElement) {
            this.videoElement.srcObject = null;
        }
        
        this.isScanning = false;
    }

    async scanFromCamera() {
        if (!this.isScanning) return;

        try {
            const result = await this.codeReader.decodeOnceFromVideoDevice(
                undefined, 
                this.videoElement
            );
            
            if (result) {
                this.processResult(result.text);
            }
        } catch (error) {
            // Continue scanning even if no QR code is found
            if (this.isScanning) {
                setTimeout(() => this.scanFromCamera(), 100);
            }
        }
    }

    async scanFromFile(file) {
        try {
            const result = await this.codeReader.decodeFromInputVideoDevice(
                undefined,
                file
            );
            
            if (result) {
                this.processResult(result.text);
                return { success: true, data: result.text };
            }
        } catch (error) {
            return { 
                success: false, 
                error: 'No QR code found in image' 
            };
        }
    }

    processResult(data) {
        if (data.startsWith('SCANZO_MULTI:')) {
            this.handleMultiPartQR(data);
        } else {
            this.handleSingleQR(data);
        }
    }

    handleSingleQR(data) {
        const event = new CustomEvent('qrScanned', {
            detail: { data, type: 'single' }
        });
        document.dispatchEvent(event);
    }

    handleMultiPartQR(data) {
        try {
            const chunkData = JSON.parse(data.substring(13)); // Remove "SCANZO_MULTI:"
            const { index, total, data: chunkContent, checksum } = chunkData;

            if (!this.multiPartData.has(checksum)) {
                this.multiPartData.set(checksum, {
                    chunks: new Array(total).fill(null),
                    total: total,
                    received: 0
                });
            }

            const multiPart = this.multiPartData.get(checksum);
            
            if (multiPart.chunks[index] === null) {
                multiPart.chunks[index] = chunkContent;
                multiPart.received++;

                // Show progress
                const progress = (multiPart.received / multiPart.total) * 100;
                this.showProgress(progress, multiPart.received, multiPart.total);

                // Check if all chunks received
                if (multiPart.received === multiPart.total) {
                    const fullContent = multiPart.chunks.join('');
                    const calculatedChecksum = this.calculateChecksum(fullContent);
                    
                    if (calculatedChecksum === checksum) {
                        this.handleSingleQR(fullContent);
                        this.multiPartData.delete(checksum);
                        this.hideProgress();
                    } else {
                        this.showError('Data corruption detected. Please rescan all QR codes.');
                    }
                }
            }
        } catch (error) {
            this.showError('Invalid multi-part QR code format');
        }
    }

    calculateChecksum(content) {
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(16);
    }

    showProgress(percent, current, total) {
        // Create or update progress indicator
        let progressDiv = document.getElementById('scan-progress');
        
        if (!progressDiv) {
            progressDiv = document.createElement('div');
            progressDiv.id = 'scan-progress';
            progressDiv.className = 'scan-progress';
            progressDiv.innerHTML = `
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
                <div class="progress-text">
                    <span class="progress-label">Scanning multi-part QR code</span>
                    <span class="progress-count">0 / 0</span>
                </div>
            `;
            document.querySelector('.scanner-container').appendChild(progressDiv);
        }

        const fill = progressDiv.querySelector('.progress-fill');
        const count = progressDiv.querySelector('.progress-count');
        
        fill.style.width = `${percent}%`;
        count.textContent = `${current} / ${total}`;
    }

    hideProgress() {
        const progressDiv = document.getElementById('scan-progress');
        if (progressDiv) {
            progressDiv.remove();
        }
    }

    showError(message) {
        const event = new CustomEvent('scanError', {
            detail: { message }
        });
        document.dispatchEvent(event);
    }
}
