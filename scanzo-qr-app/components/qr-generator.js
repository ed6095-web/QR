// QR Generator Component
class QRGenerator {
    constructor() {
        this.canvas = null;
        this.currentQRData = null;
    }

    async generate(content, options = {}) {
        const defaultOptions = {
            width: 256,
            height: 256,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff'
            },
            errorCorrectionLevel: 'M'
        };

        const finalOptions = { ...defaultOptions, ...options };
        
        try {
            if (!this.canvas) {
                this.canvas = document.getElementById('qr-canvas');
            }

            await QRCode.toCanvas(this.canvas, content, finalOptions);
            this.currentQRData = this.canvas.toDataURL();
            
            return {
                success: true,
                canvas: this.canvas,
                dataURL: this.currentQRData
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async generateMultiple(content, maxSize = 2000) {
        // Split large content into multiple QR codes
        const chunks = this.splitContent(content, maxSize);
        const qrCodes = [];

        for (let i = 0; i < chunks.length; i++) {
            const chunkData = {
                index: i,
                total: chunks.length,
                data: chunks[i],
                checksum: this.calculateChecksum(content)
            };

            const chunkContent = `SCANZO_MULTI:${JSON.stringify(chunkData)}`;
            const result = await this.generate(chunkContent);
            
            if (result.success) {
                qrCodes.push({
                    index: i,
                    dataURL: result.dataURL
                });
            }
        }

        return qrCodes;
    }

    splitContent(content, maxSize) {
        const chunks = [];
        for (let i = 0; i < content.length; i += maxSize) {
            chunks.push(content.substring(i, i + maxSize));
        }
        return chunks;
    }

    calculateChecksum(content) {
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(16);
    }

    downloadQR(filename = null) {
        if (!this.currentQRData) {
            throw new Error('No QR code to download');
        }

        const link = document.createElement('a');
        link.download = filename || `qr-code-${Date.now()}.png`;
        link.href = this.currentQRData;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    getQRAsBlob() {
        return new Promise((resolve) => {
            this.canvas.toBlob(resolve, 'image/png');
        });
    }
}
