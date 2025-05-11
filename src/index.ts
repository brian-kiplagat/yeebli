import { Chat } from '$utils/Chat';
import { Countdown } from '$utils/countdown';
import { initializeFileUpload } from '$utils/fileUpload';
import { MultiSelect } from '$utils/multiSelect';
import { formatDate, showError } from '$utils/reusables';
import { RouteGuard } from '$utils/routeGuards';
import type { TagEventDetail } from '$utils/types';
import { Video } from '$utils/video';
import { VideoModal } from '$utils/videoModal';

import type { EventData, EventDate, StreamResponse } from './types/event';
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
    //<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.css" />
    const notyfCss = document.createElement('link');
    notyfCss.href = 'https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.css';
    notyfCss.rel = 'stylesheet';
    document.head.appendChild(notyfCss);
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
    const event_id = urlParams.get('code');
    const email = urlParams.get('email');
    const token = urlParams.get('token');
    const isHost = urlParams.get('isHost');

    if (!event_id) {
      showError('Event Id not found.Ensure you have the correct event link');
      return;
    }

    try {
      // Fetch event data
      const response = await fetch(`https://api.3themind.com/v1/event/stream`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_id: Number(event_id),
          email: email,
          token: token,
          isHost: Boolean(isHost),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        showError(error.error || error.message || 'Failed to fetch event data');
        return;
      }

      const streamResponse: StreamResponse = await response.json();
      const eventData = streamResponse.event;
      const video = document.querySelector('[wized="video_player"]') as HTMLElement;
      setupMetadata(eventData);
      if (!video) {
        showError('We could not find a video for this event');
        return;
      }
      // Initialize countdown with event data
      initializeCountdown(eventData, video, streamResponse.selectedDates);
    } catch (error) {
      console.error('Error fetching event data:', error);
      showError('An error occurred while fetching this event');
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

  //setup multi select
  if (window.location.pathname === '/host/dashboard-host-update-lead') {
    document.addEventListener('tagEvent', (e: Event) => {
      const customEvent = e as CustomEvent<TagEventDetail>;
      const { options, selected } = customEvent.detail;

      // Transform options into MultiSelect format
      const tag_list = options.map((tag) => ({
        value: String(tag.id),
        label: tag.tag,
      }));

      // Get currently selected tag IDs
      let selected_tags = selected.map((item) => String(item.tag.id));

      const urlParams = new URLSearchParams(window.location.search);
      const lead_id = urlParams.get('code');

      const container = document.querySelector<HTMLElement>('[wized="tag_div"]');
      if (!container) {
        console.error('We could not find a tag div');
        return;
      }
      new MultiSelect({
        container: container,
        options: tag_list,
        selected: selected_tags,
        placeholder: 'Select or type to add tags',
        allowCreation: true,
        searchable: true,
        clearable: true,
        hideDropdownOnSelect: true,
        onChange: (selected) => {
          //compare the selected tags with the tag_list and get the removed tags
          const removed_tags = selected_tags.filter((tag) => !selected.includes(tag));
          const added_tags = selected.filter((tag) => !selected_tags.includes(tag));

          //for each, remove via api
          removed_tags.forEach(async (tag) => {
            await fetch(`https://api.3themind.com/v1/lead/tag/${tag}/lead/${lead_id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${authToken}` },
            });
          });

          //for each, add via api
          added_tags.forEach(async (tag) => {
            await fetch(`https://api.3themind.com/v1/lead/tag/assign`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${authToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ lead_id: Number(lead_id), tag_id: Number(tag) }),
            });
          });

          // Update selected_tags with the new selection
          selected_tags = [...selected];
        },
        onCreateOption: async (value) => {
          //post the tag to endpoint with code url apram and tag
          const urlParams = new URLSearchParams(window.location.search);
          const lead_id = urlParams.get('code');
          const response = await fetch(`https://api.3themind.com/v1/lead/tag`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${authToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ lead_id: Number(lead_id), tag: value }),
          });
          if (!response.ok) {
            showError('Failed to create tag');
            return { value, label: value }; // Return option even on error
          }
          return { value, label: value };
        },
      });
    });

    // map the tags to value and label
  }
};

// Initialize Webflow
window.Webflow ||= [];
window.Webflow.push(() => {
  // Check if DOM is already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
  } else {
    // DOM is already loaded, run initialization immediately
    initializeApp();
  }
});

const setupMetadata = (eventData: EventData) => {
  const event_page_name = document.querySelector<HTMLElement>('[wized="event_page_name"]');
  const event_page_description = document.querySelector<HTMLElement>(
    '[wized="event_page_description"]'
  );
  const event_schedule_callback = document.querySelector<HTMLElement>(
    '[wized="event_schedule_callback"]'
  );
  const lead_upgrade_now = document.querySelector<HTMLElement>('[wized="lead_upgrade_now"]');

  if (event_page_name) {
    event_page_name.textContent = eventData.event_name;
  }

  if (event_page_description) {
    event_page_description.textContent = eventData.event_description;
  }

  if (event_schedule_callback) {
    event_schedule_callback.addEventListener('click', () => {
      window.open(eventData.calendar_url, '_blank');
    });
    if (!eventData.calendar_url) {
      event_schedule_callback.style.display = 'none';
    }
  }

  if (lead_upgrade_now) {
    lead_upgrade_now.addEventListener('click', () => {
      window.open(eventData.calendar_url, '_blank');
    });
  }
};

const initializePlayer = (video: HTMLElement, eventData: EventData) => {
  const videoUrl = eventData.asset.presignedUrl;
  const eventStatus = new EventStatus();
  const player = new Video(videoUrl, video, eventStatus, eventData);
  return { player, videoElement: video };
};

const initializeCountdown = async (
  eventData: EventData,
  videoElement: HTMLElement,
  selectedDates: EventDate[]
) => {
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
  const now = new Date();

  const sortedDates = selectedDates
    .map((date) => ({
      start: new Date(Number(date.date) * 1000),
      end: new Date(Number(date.date) * 1000 + eventData.asset.duration * 1000),
    }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const nextDate = sortedDates.find((date) => date.end > now);

  if (!nextDate) {
    // All dates have passed
    eventStatus.updateStatus('ended');
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

  console.log({
    formattedStartDate,
    formattedEndDate,
    sortedDates,
    nextDate,
    eventStartDate,
    now,
    durationSeconds: eventData.asset.duration,
    eventEndDate,
  });

  // Hide all elements initially
  countdown_wrapper.style.display = 'none';
  videoElement.style.display = 'none';
  event_finished_wrapper.style.display = 'none';

  // End time check function to check by video duration if the event is ending
  const setupEndTimeCheck = () => {
    const endCheckInterval = setInterval(() => {
      const now = new Date();
      const timeLeft = Math.round((eventEndDate.getTime() - now.getTime()) / 1000);

      if (timeLeft <= 20 && timeLeft > 0) {
        eventStatus.updateStatus('live', timeLeft);
      }
      if (now > eventEndDate) {
        clearInterval(endCheckInterval);
        videoElement.style.display = 'none';
        event_finished_wrapper.style.display = 'block';
        eventStatus.updateStatus('ended', undefined, nextDate);
      }
    }, 1000);
  };

  if (eventData.status === 'cancelled') {
    //event is cancelled
    eventStatus.updateStatus('cancelled');
  } else if (eventData.status === 'suspended') {
    //event is suspended
    eventStatus.updateStatus('suspended');
  } else if (now > eventEndDate) {
    //event has ended
    event_finished_wrapper.style.display = 'block';
    eventStatus.updateStatus('ended', undefined, nextDate);
  } else if (now > eventStartDate) {
    //event is ongoing
    videoElement.style.display = 'flex';
    eventStatus.updateStatus('live');
    initializePlayer(videoElement, eventData);
    setupEndTimeCheck();
    initializeChat(eventData);
  } else {
    //event hasn't started
    countdown_wrapper.style.display = 'block';
    eventStatus.updateStatus('early', undefined, nextDate);
    const countdown = new Countdown(countdownElement, eventStartDate, {
      threshold: '0',
      reset: 'false',
      onEnd: () => {
        countdown_wrapper.style.display = 'none';
        videoElement.style.display = 'flex';
        initializePlayer(videoElement, eventData);
        eventStatus.updateStatus('live');
        setupEndTimeCheck();
        initializeChat(eventData);
      },
    });

    countdown.start();
  }
};

const initializeChat = (eventData: EventData) => {
  const chat = new Chat(eventData);
  chat.init(() => {
    // Handle new messages here
    //console.log('New messages:', messages);
  });
};
