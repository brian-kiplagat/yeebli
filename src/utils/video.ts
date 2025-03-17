import 'plyr/dist/plyr.css';

import Hls from 'hls.js';
import Plyr from 'plyr';

import type { EventData } from './eventStatus';
import { EventStatus } from './eventStatus';

export class Video {
  private player: Plyr | null = null;
  private hls: Hls | null = null;
  private test_url = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
  private readonly STORAGE_KEY: string;
  private progressInterval: number | null = null;

  constructor(
    public media_url: string,
    public context: HTMLElement,
    private eventStatus: EventStatus,
    private eventData: EventData
  ) {
    // Extract event code from URL if it exists
    const urlParams = new URLSearchParams(window.location.search);
    const eventCode = urlParams.get('code') || '';

    // Create a unique storage key based on the event code and video ID
    this.STORAGE_KEY = `video_progress_${eventCode}`;

    this.setupVideo(media_url, context);
  }

  private setupVideo(media_url: string, context: HTMLElement): void {
    context.setAttribute('video', 'video-wrapper');
    //media_url = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
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

    const startPlayback = (videoElement: HTMLVideoElement) => {
      this.player = new Plyr(videoElement, { autoplay: true, muted: true, controls });
      this.player.muted = true;

      // Restore last playback position
      const savedProgress = localStorage.getItem(this.STORAGE_KEY);
      if (savedProgress) {
        const progress = parseFloat(savedProgress);
        videoElement.currentTime = progress;
      }

      // Save progress periodically
      this.progressInterval = window.setInterval(() => {
        if (videoElement.currentTime > 0) {
          localStorage.setItem(this.STORAGE_KEY, videoElement.currentTime.toString());
        }
      }, 1000) as unknown as number;

      // Save progress on pause
      this.player.on('pause', () => {
        localStorage.setItem(this.STORAGE_KEY, videoElement.currentTime.toString());
      });
      this.player.on('ended', () => {
        console.log('Video ended');
      });

      const event_ending_in = document.querySelector<HTMLElement>('[wized="event_ending_in"]');
      const event_ending_expiry = document.querySelector<HTMLElement>(
        '[wized="event_ending_expiry"]'
      );
      this.player.on('timeupdate', () => {
        if (!this.player || !event_ending_in || !event_ending_expiry) return;
        const currentTime = this.player.currentTime || 0;
        const duration = this.player.duration || 0;
        const timeLeft = Math.round(duration - currentTime);
        if (timeLeft <= 10 && timeLeft > 0) {
          event_ending_expiry.style.display = 'flex';
          event_ending_in.textContent = `Event ends in ${timeLeft}`;
        }
        //if time left is 0 or less, show event ended
        if (timeLeft <= 0) {
          event_ending_expiry.style.display = 'flex';
          event_ending_in.textContent = 'Event ended';
        }
      });

      // Save progress before unload
      window.addEventListener('beforeunload', () => {
        localStorage.setItem(this.STORAGE_KEY, videoElement.currentTime.toString());
      });
    };

    // Check if the video URL is an HLS stream (.m3u8)
    if (Hls.isSupported() && media_url.endsWith('.m3u8')) {
      // Create Hls instance
      this.hls = new Hls();
      this.hls.loadSource(media_url);
      this.hls.attachMedia(video);

      // Handle HLS manifest parsed event
      this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('HLS manifest parsed successfully');
        startPlayback(video);
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

      video.addEventListener('loadedmetadata', () => {
        startPlayback(video);
      });
    } else {
      // Regular video playback
      video.setAttribute('src', media_url);
      startPlayback(video);
      console.log('Regular video player initialized');
    }

    const cleanup = () => {
      if (this.progressInterval) {
        clearInterval(this.progressInterval);
        this.progressInterval = null;
      }
      if (this.hls) {
        this.hls.destroy();
        this.hls = null;
      }
      if (this.player) {
        // Save final position before cleanup
        localStorage.setItem(this.STORAGE_KEY, video.currentTime.toString());
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
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
    if (this.player) {
      // Save final position before cleanup
      localStorage.setItem(this.STORAGE_KEY, this.player.currentTime.toString());
      this.player.destroy();
      this.player = null;
    }
    this.context.remove();
  }
}
