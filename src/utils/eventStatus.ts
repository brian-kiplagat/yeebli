import type { EventData } from '../types/event';
import { formatDate } from './reusables';

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

  updateStatus(
    eventData: EventData,
    status: 'ended' | 'live' | 'early' | 'cancelled' | 'suspended',
    countdown?: number
  ): void {
    if (!this.event_status_text || !this.event_status_wrapper) return;

    switch (status) {
      case 'cancelled': {
        this.event_status_text.textContent = 'Event cancelled';
        this.event_status_wrapper.classList.remove('case_ended', 'case_live', 'case_early');
        this.event_status_wrapper.classList.add('case_cancelled');
        if (this.chat_collumn) this.chat_collumn.style.display = 'none';
        if (this.interested_wrapper) this.interested_wrapper.style.display = 'flex';
        if (this.event_ending_expiry) this.event_ending_expiry.style.display = 'none';
        break;
      }
      case 'suspended': {
        this.event_status_text.textContent = 'Event suspended';
        this.event_status_wrapper.classList.remove('case_ended', 'case_live', 'case_early');
        this.event_status_wrapper.classList.add('case_suspended');
        if (this.chat_collumn) this.chat_collumn.style.display = 'none';
        if (this.interested_wrapper) this.interested_wrapper.style.display = 'flex';
        if (this.event_ending_expiry) this.event_ending_expiry.style.display = 'none';
        break;
      }
      case 'ended': {
        const duration = eventData.asset.duration || 0;
        const nextDate = eventData.dates
          .map((date) => ({
            start: new Date(Number(date.date) * 1000),
            end: new Date(Number(date.date) * 1000 + duration * 1000),
          }))
          .sort((a, b) => a.start.getTime() - b.start.getTime())
          .find((date) => date.end > new Date());

        if (nextDate) {
          this.event_status_text.textContent = `Event Ended ${formatDate(nextDate.end, 'DD MMM YYYY HH:mm')}`;
        } else {
          this.event_status_text.textContent = 'Event Ended';
        }
        this.event_status_wrapper.classList.remove('case_live', 'case_early');
        this.event_status_wrapper.classList.add('case_ended');
        if (this.chat_collumn) this.chat_collumn.style.display = 'none';
        if (this.interested_wrapper) this.interested_wrapper.style.display = 'flex';
        if (this.event_ending_expiry) this.event_ending_expiry.style.display = 'none';
        break;
      }
      case 'live':
        this.event_status_text.textContent = countdown
          ? `Event ending in ${countdown} seconds`
          : 'Event is live';
        this.event_status_wrapper.classList.remove('case_ended', 'case_early');
        this.event_status_wrapper.classList.add('case_live');
        if (this.chat_collumn) this.chat_collumn.style.display = 'flex';
        if (this.interested_wrapper) this.interested_wrapper.style.display = 'flex';
        break;
      case 'early': {
        const nextDate = eventData.dates
          .map((date) => ({
            start: new Date(Number(date.date) * 1000),
            end: new Date(Number(date.date) * 1000 + eventData.asset.duration * 1000),
          }))
          .sort((a, b) => a.start.getTime() - b.start.getTime())
          .find((date) => date.end > new Date());

        if (nextDate) {
          this.event_status_text.textContent = `Event starts ${formatDate(nextDate.start, 'DD MMM YYYY HH:mm')}`;
        } else {
          this.event_status_text.textContent = 'Event starts soon';
        }
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
