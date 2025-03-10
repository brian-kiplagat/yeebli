import 'plyr/dist/plyr.css';

import Hls from 'hls.js';
import Plyr from 'plyr';

export class Video {
  private player: Plyr | null = null;
  private hls: Hls | null = null;
  private test_url = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

  constructor(
    public media_url: string,
    public context: HTMLElement
  ) {
    this.setupVideo(media_url, context);
  }

  private setupVideo(media_url: string, context: HTMLElement): void {
    context.setAttribute('video', 'video-wrapper');

    const video = document.createElement('video');
    video.setAttribute('video', 'video-element');
    video.className = 'plyr';
    video.setAttribute('playsinline', '');
    //reset some video classes
    video.style.borderRadius = 'none';
    video.style.boxShadow = 'none';
    video.style.margin = 'none';

    Object.assign(video.style, {
      '--shadow-color': 'none',
    });
    context.appendChild(video);

    const controls = [
      'play-large', // The large play button in the center

      'mute', // Toggle mute
      'volume', // Volume control
      'captions', // Toggle captions

      'fullscreen', // Toggle fullscreen
    ];

    // Check if the video URL is an HLS stream (.m3u8)
    if (Hls.isSupported() && media_url.endsWith('.m3u8')) {
      // Create Hls instance
      this.hls = new Hls();
      this.hls.loadSource(media_url);
      this.hls.attachMedia(video);

      // Handle HLS manifest parsed event
      this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('HLS manifest parsed successfully');
        this.player = new Plyr(video, { autoplay: true, muted: true, controls });
        video.play();
      });

      // Handle HLS errors
      this.hls.on(Hls.Events.ERROR, (_, data) => {
        console.error('HLS error:', data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log('Network error, attempting to recover...');
              this.hls?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('Media error, attempting to recover...');
              this.hls?.recoverMediaError();
              break;
            default:
              console.error('Fatal HLS error, destroying...');
              this.cleanup();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Fallback for Safari which has native HLS support
      video.src = media_url;
      this.player = new Plyr(video, { autoplay: true, muted: true, controls });
      video.addEventListener('loadedmetadata', () => {
        video.play();
      });
    } else {
      // Regular video playback
      video.setAttribute('src', media_url);
      this.player = new Plyr(video, { autoplay: true, muted: true, controls });
      console.log('Regular video player initialized');
    }

    const cleanup = () => {
      if (this.hls) {
        this.hls.destroy();
        this.hls = null;
      }
      if (this.player) {
        this.player.destroy();
        this.player = null;
      }
      context.remove();
      document.removeEventListener('keydown', handleEscape);
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cleanup();
    };

    document.addEventListener('keydown', handleEscape);
  }

  private cleanup(): void {
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
    if (this.player) {
      this.player.destroy();
      this.player = null;
    }
    this.context.remove();
  }
}
