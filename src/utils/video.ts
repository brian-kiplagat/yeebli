import Plyr from 'plyr';

export class Video {
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
    video.setAttribute('src', media_url);
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
      'restart', // Restart playback
      'rewind', // Rewind by the seek time (default 10 seconds)
      'play', // Play/pause playback
      'fast-forward', // Fast forward by the seek time (default 10 seconds)
      'progress', // The progress bar and scrubber for playback and buffering
      'current-time', // The current time of playback
      'duration', // The full duration of the media
      'mute', // Toggle mute
      'volume', // Volume control
      'captions', // Toggle captions
      'settings', // Settings menu
      'pip', // Picture-in-picture (currently Safari only)
      'airplay', // Airplay (currently Safari only)
      'download', // Show a download button
      'fullscreen', // Toggle fullscreen
    ];

    const player = new Plyr(video, { autoplay: true, muted: true, controls });

    const cleanup = () => {
      context.remove();
      player.destroy();
      document.removeEventListener('keydown', handleEscape);
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cleanup();
    };

    //closeButton.onclick = cleanup;

    document.addEventListener('keydown', handleEscape);
  }
}
