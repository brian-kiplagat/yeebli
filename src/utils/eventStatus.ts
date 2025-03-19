import { formatDate } from './reusables';

export interface EventData {
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
  host: Host;
  event_code: string;
}
export interface Host {
  id: number;
  name: string;
  email: string;
  profile_image: string;
}
export interface Asset {
  id: number;
  asset_name: string;
  asset_type: string;
  asset_url: string;
  asset_size: number;
  duration: number | null;
  hls_url: string | null;
  processing_status: string;
  created_at: string;
  updated_at: string;
  user_id: number;
  presignedUrl: string;
}

export class EventStatus {
  private event_status_text: HTMLElement | null;
  private event_status_wrapper: HTMLElement | null;
  private chat_collumn: HTMLElement | null;
  private interested_wrapper: HTMLElement | null;
  private event_ending_expiry: HTMLElement | null;

  constructor() {
    this.event_status_text = document.querySelector<HTMLElement>('[wized="event_status_text"]');
    this.event_status_wrapper = document.querySelector<HTMLElement>(
      '[wized="event_status_wrapper"]'
    );
    this.chat_collumn = document.querySelector<HTMLElement>('[wized="chat_collumn"]');
    this.interested_wrapper = document.querySelector<HTMLElement>('[wized="interested_wrapper"]');
    this.event_ending_expiry = document.querySelector<HTMLElement>('[wized="event_ending_expiry"]');
  }

  updateStatus(eventData: EventData, status: 'ended' | 'live' | 'early', countdown?: number): void {
    if (!this.event_status_text || !this.event_status_wrapper) return;

    switch (status) {
      case 'ended': {
        const endDate = new Date(eventData.event_date + 'T' + eventData.end_time + 'Z');
        this.event_status_text.textContent = `Event Ended ${formatDate(endDate, 'DD MMM YYYY HH:mm')}`;
        this.event_status_wrapper.classList.remove('case_live', 'case_early');
        this.event_status_wrapper.classList.add('case_ended');
        if (this.chat_collumn) this.chat_collumn.style.display = 'none';
        if (this.interested_wrapper) this.interested_wrapper.style.display = 'flex';
        if (this.event_ending_expiry) this.event_ending_expiry.style.display = 'none';
        break;
      }
      case 'live':
        this.event_status_text.textContent = countdown
          ? `Event ending in ${countdown}`
          : 'Event is live';
        this.event_status_wrapper.classList.remove('case_ended', 'case_early');
        this.event_status_wrapper.classList.add('case_live');
        if (this.chat_collumn) this.chat_collumn.style.display = 'flex';
        if (this.interested_wrapper) this.interested_wrapper.style.display = 'flex';
        break;
      case 'early': {
        const startDate = new Date(eventData.event_date + 'T' + eventData.start_time + 'Z');
        this.event_status_text.textContent = `Event starts ${formatDate(startDate, 'DD MMM YYYY HH:mm')}`;
        this.event_status_wrapper.classList.remove('case_ended', 'case_live');
        this.event_status_wrapper.classList.add('case_early');
        if (this.chat_collumn) this.chat_collumn.style.display = 'none';
        if (this.interested_wrapper) this.interested_wrapper.style.display = 'flex';
        if (this.event_ending_expiry) this.event_ending_expiry.style.display = 'none';
        break;
      }
    }
  }
}
