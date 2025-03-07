import { initializeFileUpload } from '$utils/fileUpload';
import { greetUser } from '$utils/greet';
import { RouteGuard } from '$utils/routeGuards';
import { Video } from '$utils/video';

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

window.Webflow ||= [];
window.Webflow.push(async () => {
  const name = 'Yeebli';
  greetUser(name);

  // Get auth tokens from cookies
  const cookies = document.cookie.split(';');
  const authToken = cookies.find((cookie) => cookie.trim().startsWith('token='))?.split('=')[1];
  const user = cookies.find((cookie) => cookie.trim().startsWith('user='))?.split('=')[1];

  if (!authToken || !user) {
    console.error('No auth token or user found');
    return;
  }

  // Set auth token for both RouteGuard and FileUploader
  RouteGuard.setAuthToken(authToken);

  //if pathname is /host/dashboard-host-view-assets, then initialize the file upload
  if (window.location.pathname === '/host/dashboard-host-view-assets') {
    initializeFileUpload(authToken);
  }

  //if pathname is /eventPage, then init the player
  if (window.location.pathname === '/eventpage') {
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

      const video = document.querySelector('[wized="video_player"]');
      setupMetadata(eventData);
      if (!video) {
        console.error('No video found');
        return;
      }

      // Initialize player with event data
      initializePlayer(video as HTMLElement, eventData);
    } catch (error) {
      console.error('Error fetching event data:', error);
    }
  }
});

const addToHead = () => {
  /**Attach Plyr css to head */
  const plyrCss = document.createElement('link');
  plyrCss.href = 'https://cdn.plyr.io/3.7.8/plyr.css';
  plyrCss.rel = 'stylesheet';
  document.head.appendChild(plyrCss);
  /**Attach Plyr js to head */
};

const setupMetadata = (eventData: EventData) => {
  const event_page_name = document.querySelector('[wized="event_page_name"]');
  const event_page_date = document.querySelector('[wized="event_page_date"]');
  const event_page_start_time = document.querySelector('[wized="event_page_start"]');

  if (event_page_name) {
    event_page_name.textContent = eventData.event_name;
  } else {
    console.warn('No event_page_name found');
  }
  if (event_page_date) {
    event_page_date.textContent = eventData.event_date;
  } else {
    console.warn('No event_page_date found');
  }
  if (event_page_start_time) {
    event_page_start_time.textContent = eventData.start_time;
  } else {
    console.warn('No event_page_start_time found');
  }
};

const initializePlayer = (video: HTMLElement, eventData: EventData) => {
  console.log('Initializing player with video element:', video);
  console.log('Event data for player:', eventData);

  // Use the presigned URL from the asset
  const videoUrl = eventData.asset.presignedUrl;

  const player = new Video(videoUrl, video);
  console.log('Player instance:', player);
};
