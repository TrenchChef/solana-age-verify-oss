export class Camera {
    private stream: MediaStream | null = null;
    private video: HTMLVideoElement;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    constructor(videoElement?: HTMLVideoElement) {
        this.video = videoElement || document.createElement('video');
        this.video.setAttribute('playsinline', 'true');
        this.video.style.display = videoElement ? 'block' : 'none';

        this.canvas = document.createElement('canvas');
        const ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) throw new Error('Could not get 2D context');
        this.ctx = ctx;
    }

    async start() {
        if (this.stream) return;

        this.stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'user'
            },
            audio: false
        });

        this.video.srcObject = this.stream;
        await new Promise<void>((resolve) => {
            this.video.onloadedmetadata = () => {
                this.video.play();
                resolve();
            };
        });

        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
    }

    async stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        this.video.srcObject = null;
    }

    captureFrame(): { data: Uint8ClampedArray; width: number; height: number; timestamp: number } {
        if (!this.stream) throw new Error('Camera not started');

        this.ctx.drawImage(this.video, 0, 0);
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

        return {
            data: imageData.data,
            width: imageData.width,
            height: imageData.height,
            timestamp: Date.now()
        };
    }
}
