import 'plyr/dist/plyr.css';

import Plyr from 'plyr';

export class VideoModal {
  private player: Plyr | null = null;
  private observer: MutationObserver;

  constructor() {
    // Initialize MutationObserver
    this.observer = new MutationObserver(this.handleDOMChanges.bind(this));

    // Start observing
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Also try initial setup in case elements are already present
    this.initializeAssetPreviews();
  }

  private handleDOMChanges(mutations: MutationRecord[]) {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length) {
        // Check if any of the added nodes are our target elements
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            // Check for elements within the added node
            const previews = node.querySelectorAll('[wized="asset_image_preview"]');
            if (previews.length > 0) {
              this.setupPreviewElements(previews);
            }
          }
        });
      }
    }
  }

  public addToHead(): void {
    // Check if Plyr CSS is already added
    if (!document.querySelector('link[href*="plyr.css"]')) {
      const plyrCss = document.createElement('link');
      plyrCss.href = 'https://cdn.plyr.io/3.7.8/plyr.css';
      plyrCss.rel = 'stylesheet';
      document.head.appendChild(plyrCss);
    }
  }

  private initializeAssetPreviews(): void {
    const assetPreviews = document.querySelectorAll('[wized="asset_image_preview"]');
    console.log('Initial preview elements found:', assetPreviews.length);
    this.setupPreviewElements(assetPreviews);
  }

  private setupPreviewElements(elements: NodeListOf<Element>): void {
    elements.forEach((preview) => {
      // Check if we've already set up this element
      if (preview.hasAttribute('data-video-modal-initialized')) {
        return;
      }

      // Mark as initialized
      preview.setAttribute('data-video-modal-initialized', 'true');

      const parentAnchor = preview.closest('a');
      if (parentAnchor) {
        parentAnchor.addEventListener('click', (e) => {
          e.preventDefault();
          const videoUrl = preview.getAttribute('presigned');
          if (videoUrl) {
            console.log('Opening video:', videoUrl);
            this.openVideoModal(videoUrl);
          } else {
            console.warn('No presigned URL found for video preview', preview);
          }
        });
      } else {
        preview.addEventListener('click', () => {
          const videoUrl = preview.getAttribute('presigned');
          if (videoUrl) {
            this.openVideoModal(videoUrl);
          } else {
            console.warn('No presigned URL found for video preview', preview);
          }
        });
      }
    });
  }

  private openVideoModal(videoUrl: string): void {
    // Create modal wrapper
    const wrapper = document.createElement('div');
    Object.assign(wrapper.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '9999',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.80)',
    });

    // Create video element
    const video = document.createElement('video');
    video.setAttribute('video', 'video-element');
    video.className = 'plyr';
    video.setAttribute('playsinline', '');
    video.setAttribute('src', videoUrl);

    Object.assign(video.style, {
      borderRadius: 'none',
      boxShadow: 'none',
      margin: 'none',
      maxWidth: '80vw',
      maxHeight: '80vh',
      objectFit: 'contain',
    });

    wrapper.appendChild(video);

    // Define player controls
    const controls = [
      'play-large',
      'restart',
      'rewind',
      'play',
      'fast-forward',
      'progress',
      'current-time',
      'duration',
      'mute',
      'volume',
      'captions',
      'settings',
      'pip',
      'airplay',
      'fullscreen',
    ];

    // Initialize player
    this.player = new Plyr(video, {
      autoplay: true,
      muted: true,
      controls,
    });

    // Create close button
    const closeButton = document.createElement('button');
    Object.assign(closeButton.style, {
      position: 'absolute',
      top: '22px',
      right: '22px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '0',
      zIndex: '10000',
    });
    closeButton.setAttribute('aria-label', 'Close video preview');
    closeButton.innerHTML = `<svg width="18" height="17" viewBox="0 0 18 17" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clip-path="url(#clip0_4859_787)">
        <path opacity="0.4" d="M3.99996 4.03523e-05L8.94971 4.94979L13.8995 4.03523e-05L17.435 3.53557L12.4852 8.48532L17.435 13.4351L13.8995 16.9706L8.94971 12.0209L3.99996 16.9706L0.464426 13.4351L5.41417 8.48532L0.464426 3.53557L3.99996 4.03523e-05Z" fill="black"/>
        <path d="M3.99996 1.41435L8.94971 6.36409L13.8995 1.41435L16.0208 3.53567L11.071 8.48541L16.0208 13.4352L13.8995 15.5565L8.94971 10.6067L3.99996 15.5565L1.87864 13.4352L6.82839 8.48541L1.87864 3.53567L3.99996 1.41435Z" fill="white"/>
      </g>
      <defs>
        <clipPath id="clip0_4859_787">
          <rect width="18" height="17" fill="white"/>
        </clipPath>
      </defs>
    </svg>`;

    // Setup cleanup function
    const cleanup = () => {
      if (this.player) {
        this.player.destroy();
        this.player = null;
      }
      wrapper.remove();
      document.removeEventListener('keydown', handleEscape);
    };

    // Add event listeners
    closeButton.onclick = cleanup;
    wrapper.addEventListener('click', (e) => {
      if (e.target === wrapper) cleanup();
    });

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cleanup();
    };

    document.addEventListener('keydown', handleEscape);
    wrapper.appendChild(closeButton);
    document.body.appendChild(wrapper);
  }

  // Add a cleanup method
  public destroy(): void {
    this.observer.disconnect();
    if (this.player) {
      this.player.destroy();
      this.player = null;
    }
  }
}
