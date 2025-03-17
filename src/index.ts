import { Countdown } from '$utils/countdown';
import { initializeFileUpload } from '$utils/fileUpload';
import { greetUser } from '$utils/greet';
import { RouteGuard } from '$utils/routeGuards';
import { Video } from '$utils/video';
import { VideoModal } from '$utils/videoModal';

import type { EventData } from './utils/eventStatus';
import { EventStatus } from './utils/eventStatus';

/**
 * Add Plyr CSS and JS to the head
 */
function addToHead(): void {
  // Check if Plyr CSS is already added
  if (!document.querySelector('link[href*="plyr.css"]')) {
    const plyrCss = document.createElement('link');
    plyrCss.href = 'https://cdn.plyr.io/3.7.8/plyr.css';
    plyrCss.rel = 'stylesheet';
    document.head.appendChild(plyrCss);
  }
}

const initializeApp = async () => {
  console.log('Initializing app');

  greetUser();

  // Get auth tokens from cookies
  const cookies = document.cookie.split(';');
  const authToken = cookies.find((cookie) => cookie.trim().startsWith('token='))?.split('=')[1];
  const user = cookies.find((cookie) => cookie.trim().startsWith('user='))?.split('=')[1];

  // Set auth token for RouteGuard (even if null) and let it handle the auth check
  RouteGuard.setAuthToken(authToken || '');
  await RouteGuard.checkAccess();

  // Only continue with initialization if we have valid auth
  if (authToken && user) {
    //if pathname is /host/dashboard-host-view-assets, then initialize the file upload
    if (window.location.pathname === '/host/dashboard-host-view-assets') {
      initializeFileUpload(authToken);
      // Initialize Webflow
      const videoModal = new VideoModal();
      videoModal.addToHead();
    }

    //if pathname is /eventPage, then init the player
    if (window.location.pathname === '/eventpage') {
      // Add Plyr CSS and JS to the head
      addToHead();
      // Get event code from URL
      const urlParams = new URLSearchParams(window.location.search);
      const eventCode = urlParams.get('code');

      if (!eventCode) {
        console.error('No event code found in URL');
        return;
      }

      try {
        // Fetch event data
        const response = await fetch(`https://api.3themind.com/v1/event/${eventCode}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch event data');
        }

        const eventData: EventData = await response.json();
        console.log('Event data:', eventData);

        const video = document.querySelector('[wized="video_player"]') as HTMLElement;
        setupMetadata(eventData);
        if (!video) {
          console.error('No video found');
          return;
        }
        // Initialize countdown with event data
        initializeCountdown(eventData, video);
      } catch (error) {
        console.error('Error fetching event data:', error);
      }
    }
  }
};

// Initialize Webflow
window.Webflow ||= [];
window.Webflow.push(() => {
  console.log('Webflow loaded');
  // Check if DOM is already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
  } else {
    // DOM is already loaded, run initialization immediately
    initializeApp();
  }
});

const setupMetadata = (eventData: EventData) => {
  const event_page_name = document.querySelector('[wized="event_page_name"]');

  if (event_page_name) {
    event_page_name.textContent = eventData.event_name;
  } else {
    console.error('No event_page_name found');
  }
};

const initializePlayer = (video: HTMLElement, eventData: EventData) => {
  console.log({ video, eventData });

  // Use the presigned URL from the asset
  const videoUrl = eventData.asset.presignedUrl;

  const player = new Video(videoUrl, video);
  console.log('Player instance:', player);
  return { player, videoElement: video };
};

const initializeCountdown = (eventData: EventData, videoElement: HTMLElement) => {
  const countdownElement = document.querySelector<HTMLElement>('[wized="countdown_timer"]');
  const countdown_wrapper = document.querySelector<HTMLElement>('[wized="countdown_wrapper"]');
  const event_finished_wrapper = document.querySelector<HTMLElement>(
    '[wized="event_finished_wrapper"]'
  );

  // Check each element individually and log specific errors
  if (!countdownElement) {
    console.error('Missing element: [wized="countdown_timer"]');
    return;
  }
  if (!countdown_wrapper) {
    console.error('Missing element: [wized="countdown_wrapper"]');
    return;
  }
  if (!event_finished_wrapper) {
    console.error('Missing element: [wized="event_finished_wrapper"]');
    return;
  }

  const eventStartDate = new Date(eventData.event_date + ' ' + eventData.start_time);
  const eventEndDate = new Date(eventData.event_date + ' ' + eventData.end_time);
  const now = new Date();

  // Initialize event status handler
  const eventStatus = new EventStatus();

  // Hide all elements initially
  countdown_wrapper.style.display = 'none';
  videoElement.style.display = 'none';
  event_finished_wrapper.style.display = 'none';

  // If event has ended
  if (now > eventEndDate) {
    event_finished_wrapper.style.display = 'block';
    eventStatus.updateStatus(eventData, 'ended');
  }
  // If event is ongoing
  else if (now > eventStartDate) {
    videoElement.style.display = 'flex';
    eventStatus.updateStatus(eventData, 'live');
    initializePlayer(videoElement, eventData);
  }
  // If event hasn't started
  else {
    countdown_wrapper.style.display = 'block';
    eventStatus.updateStatus(eventData, 'early');
    const countdown = new Countdown(countdownElement, eventStartDate, {
      threshold: '0',
      reset: 'false',
      onEnd: () => {
        countdown_wrapper.style.display = 'none';
        videoElement.style.display = 'flex';
        initializePlayer(videoElement, eventData);
        eventStatus.updateStatus(eventData, 'live');
        // Set up end time check
        const endCheckInterval = setInterval(() => {
          if (new Date() > eventEndDate) {
            clearInterval(endCheckInterval);
            videoElement.style.display = 'none';
            event_finished_wrapper.style.display = 'block';
            eventStatus.updateStatus(eventData, 'ended');
          }
        }, 1000);
      },
    });

    countdown.start();
  }
};
