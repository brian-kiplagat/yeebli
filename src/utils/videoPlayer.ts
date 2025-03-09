import 'plyr/dist/plyr.css';

import Hls from 'hls.js';
import Plyr from 'plyr';

interface EventData {
  asset: {
    presignedUrl: string;
  };
}

/**
 * Initializes a video player with HLS support and Plyr controls
 * @param video - The video element to initialize
 * @param eventData - Event data containing the video URL
 */
export const initializePlayer = (video: HTMLVideoElement, eventData: EventData) => {
  console.log('Initializing player with video element:', video);
  console.log('Event data for player:', eventData);

  // Use the presigned URL from the asset
  const videoUrl = eventData.asset.presignedUrl;

  // Check if the video URL is an HLS stream (.m3u8)
  if (Hls.isSupported() && videoUrl.endsWith('.m3u8')) {
    const hls = new Hls();
    hls.loadSource(videoUrl);
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      console.log('HLS manifest parsed successfully');
      video.play();
    });

    hls.on(Hls.Events.ERROR, (_, data) => {
      console.error('HLS error:', data);
    });
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    // Fallback for Safari, which supports HLS natively
    video.src = videoUrl;
    video.addEventListener('loadedmetadata', () => {
      video.play();
    });
  } else {
    console.error('HLS is not supported in this browser');
  }

  // Initialize Plyr
  new Plyr(video, {
    controls: ['play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'],
    autoplay: true,
    ratio: '16:9',
  });
};
