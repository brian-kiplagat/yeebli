import { Chat } from '$utils/Chat';
import { Countdown } from '$utils/countdown';
import { initializeFileUpload } from '$utils/fileUpload';
import { formatDate } from '$utils/reusables';
import { RouteGuard } from '$utils/routeGuards';
import { Video } from '$utils/video';
import { VideoModal } from '$utils/videoModal';

import type { EventData } from './types/event';
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
  // Get auth tokens from cookies
  const cookies = document.cookie.split(';');
  const authToken = cookies.find((cookie) => cookie.trim().startsWith('token='))?.split('=')[1];
  const user = cookies.find((cookie) => cookie.trim().startsWith('user='))?.split('=')[1];
  //video can be watched by anyone
  //if pathname is /eventPage, then init the player
  if (window.location.pathname === '/events/event') {
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
  // Set auth token for RouteGuard (even if null) and let it handle the auth check
  RouteGuard.setAuthToken(authToken || '');
  const isAuthenticated = await RouteGuard.checkAccess();
  if (!isAuthenticated) {
    window.location.href = '/';
    return;
  }

  // Only continue with initialization if we have valid auth
  if (authToken && user) {
    //if pathname is /host/dashboard-host-view-assets, then initialize the file upload
    if (window.location.pathname === '/host/dashboard-host-view-assets') {
      initializeFileUpload(authToken);
      // Initialize Webflow
      const videoModal = new VideoModal();
      videoModal.addToHead();
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
  const event_page_description = document.querySelector('[wized="event_page_description"]');

  if (event_page_name) {
    event_page_name.textContent = eventData.event_name;
  } else {
    console.error('No event_page_name found');
  }
  if (event_page_description) {
    event_page_description.textContent = eventData.event_description;
  } else {
    console.error('No event_page_description found');
  }
};

const initializePlayer = (video: HTMLElement, eventData: EventData) => {
  console.log({ video, eventData });
  const videoUrl = eventData.asset.presignedUrl;
  const eventStatus = new EventStatus();
  const player = new Video(videoUrl, video, eventStatus, eventData);
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
  // Initialize event status handler
  const eventStatus = new EventStatus();
  // Sort dates and find the next upcoming date
  const now = new Date();
  const sortedDates = eventData.dates
    .map((date) => ({
      start: new Date(Number(date.date) * 1000),
      end: new Date(Number(date.date) * 1000 + eventData.asset.duration * 1000),
    }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const nextDate = sortedDates.find((date) => date.end > now);

  if (!nextDate) {
    // All dates have passed
    eventStatus.updateStatus(eventData, 'ended');
    event_finished_wrapper.style.display = 'block';
    videoElement.style.display = 'none';
    countdown_wrapper.style.display = 'none';
    return;
  }

  const eventStartDate = nextDate.start;
  const eventEndDate = nextDate.end;

  // Format dates for display in local timezone
  const formattedStartDate = formatDate(eventStartDate, 'DD MMM YYYY HH:mm');
  const formattedEndDate = formatDate(eventEndDate, 'DD MMM YYYY HH:mm');
  console.log({ formattedStartDate, formattedEndDate });

  // Hide all elements initially
  countdown_wrapper.style.display = 'none';
  videoElement.style.display = 'none';
  event_finished_wrapper.style.display = 'none';

  // Set up end time check function
  const setupEndTimeCheck = () => {
    const endCheckInterval = setInterval(() => {
      const now = new Date();
      const timeLeft = Math.round((eventEndDate.getTime() - now.getTime()) / 1000);

      if (timeLeft <= 20 && timeLeft > 0) {
        eventStatus.updateStatus(eventData, 'live', timeLeft);
      }
      if (now > eventEndDate) {
        clearInterval(endCheckInterval);
        videoElement.style.display = 'none';
        event_finished_wrapper.style.display = 'block';
        eventStatus.updateStatus(eventData, 'ended');
      }
    }, 1000);
  };

  if (eventData.status === 'cancelled') {
    //event is cancelled
    eventStatus.updateStatus(eventData, 'cancelled');
  } else if (eventData.status === 'suspended') {
    //event is suspended
    eventStatus.updateStatus(eventData, 'suspended');
  } else if (now > eventEndDate) {
    //event has ended
    event_finished_wrapper.style.display = 'block';
    eventStatus.updateStatus(eventData, 'ended');
  } else if (now > eventStartDate) {
    //event is ongoing
    videoElement.style.display = 'flex';
    eventStatus.updateStatus(eventData, 'live');
    initializePlayer(videoElement, eventData);
    setupEndTimeCheck();
    initializeChat(eventData);
  } else {
    //event hasn't started
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
        setupEndTimeCheck();
        initializeChat(eventData);
      },
    });

    countdown.start();
  }
};

const initializeChat = (eventData: EventData) => {
  const chat = new Chat(eventData);
  chat.init((messages) => {
    // Handle new messages here
    console.log('New messages:', messages);
  });
};
