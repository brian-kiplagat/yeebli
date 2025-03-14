import { Countdown } from '$utils/countdown';
import { initializeFileUpload } from '$utils/fileUpload';
import { greetUser } from '$utils/greet';
import { RouteGuard } from '$utils/routeGuards';
import { Video } from '$utils/video';
import { VideoModal } from '$utils/videoModal';

interface Asset {
  id: number;
  asset_name: string;
  asset_type: string;
  asset_url: string;
  created_at: string;
  updated_at: string;
  user_id: number;
  presignedUrl: string;
}

interface EventData {
  id: number;
  event_name: string;
  event_description: string;
  event_date: string;
  start_time: string;
  end_time: string;
  asset_id: number;
  created_at: string;
  updated_at: string;
  host_id: number;
  asset: Asset;
}

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
  const event_status_wrapper = document.querySelector<HTMLElement>(
    '[wized="event_status_wrapper"]'
  );
  const event_status_text = document.querySelector<HTMLElement>('[wized="event_status_text"]');
  const chat_collumn = document.querySelector<HTMLElement>('[wized="chat_collumn"]');
  const interested_wrapper = document.querySelector<HTMLElement>('[wized="interested_wrapper"]');

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
  if (!event_status_wrapper) {
    console.error('Missing element: [wized="event_status_wrapper"]');
    return;
  }
  if (!event_status_text) {
    console.error('Missing element: [wized="event_status_text"]');
    return;
  }
  if (!chat_collumn) {
    console.error('Missing element: [wized="chat_collumn"]');
    return;
  }
  if (!interested_wrapper) {
    console.error('Missing element: [wized="interested_wrapper"]');
    return;
  }

  const eventStartDate = new Date(eventData.event_date + ' ' + eventData.start_time);
  const eventEndDate = new Date(eventData.event_date + ' ' + eventData.end_time);

  const now = new Date();

  // Hide all elements initially
  countdown_wrapper.style.display = 'none';
  videoElement.style.display = 'none';
  event_finished_wrapper.style.display = 'none';

  // If event has ended
  if (now > eventEndDate) {
    event_finished_wrapper.style.display = 'block';
    console.log('Event has ended, showing finished message');
    event_status_text.textContent = `Event Ended ${eventData.event_date} ${eventData.end_time}`;
    event_status_wrapper.classList.remove('case_live', 'case_early');
    event_status_wrapper.classList.add('case_ended');
    chat_collumn.style.display = 'none';
    interested_wrapper.style.display = 'flex';
  }
  // If event is ongoing (between start and end)
  else if (now > eventStartDate) {
    videoElement.style.display = 'flex';
    console.log('Event is ongoing, showing player');
    event_status_text.textContent = `Event is live`;
    event_status_wrapper.classList.remove('case_ended', 'case_early');
    event_status_wrapper.classList.add('case_live');
    chat_collumn.style.display = 'flex';
    interested_wrapper.style.display = 'flex';
    initializePlayer(videoElement, eventData);
  }
  // If event hasn't started yet
  else {
    countdown_wrapper.style.display = 'block';
    console.log('Event has not started, showing countdown');
    event_status_text.textContent = `Event starts ${eventData.event_date} ${eventData.start_time}`;
    event_status_wrapper.classList.remove('case_ended', 'case_live');
    event_status_wrapper.classList.add('case_early');
    chat_collumn.style.display = 'none';
    interested_wrapper.style.display = 'flex';
    const countdown = new Countdown(countdownElement, eventStartDate, {
      threshold: '0',
      reset: 'false',
      onEnd: () => {
        countdown_wrapper.style.display = 'none';
        videoElement.style.display = 'flex';
        // Initialize player when countdown ends
        initializePlayer(videoElement, eventData);
        event_status_wrapper.classList.remove('case_ended', 'case_early');
        event_status_wrapper.classList.add('case_live');
        chat_collumn.style.display = 'flex';
        // Set up end time check
        const endCheckInterval = setInterval(() => {
          if (new Date() > eventEndDate) {
            clearInterval(endCheckInterval);
            videoElement.style.display = 'none';
            event_finished_wrapper.style.display = 'block';
          }
        }, 1000);
      },
    });

    countdown.start();
    console.log('Countdown started');
  }
};
