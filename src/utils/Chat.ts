import { initializeApp } from 'firebase/app';
import {
  addDoc,
  collection,
  Firestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';

import { firebaseConfig } from '../config/firebase-config';
import type { ChatMessage } from '../types/chat';
import type { EventData } from '../utils/eventStatus';

export class Chat {
  private db: Firestore;
  private eventData: EventData;
  private unsubscribe: (() => void) | null = null;
  private chatForm: HTMLElement | null = null;
  private message_wrapper: HTMLElement | null = null;

  constructor(eventData: EventData) {
    // Initialize Firebase if not already initialized
    const app = initializeApp(firebaseConfig);
    this.db = getFirestore(app);
    this.eventData = eventData;
    this.findAndInitialiseElements();
    this.initializeFormSubmission();
  }

  /**
   * Initialize chat for the event
   * @param onMessageUpdate - Callback for when messages are updated
   */
  init(onMessageUpdate: (messages: ChatMessage[]) => void) {
    // Subscribe to messages
    this.unsubscribe = this.subscribeToMessages(onMessageUpdate);
  }

  /*Find and Intialise elemtns by wized attributes*/

  private findAndInitialiseElements() {
    this.chatForm = document.querySelector<HTMLElement>('[wized="chat_form"]');
    this.message_wrapper = document.querySelector<HTMLElement>('[wized="message_wrapper"]');

    if (!this.chatForm || !this.message_wrapper) {
      throw new Error('Chat elements not found');
    }
  }
  /**
   * Subscribe to chat messages for the event
   * @param callback - Function to be called when messages are updated
   * @returns Unsubscribe function
   */
  private subscribeToMessages(callback: (messages: ChatMessage[]) => void) {
    const messagesRef = collection(this.db, 'events', this.eventData.id.toString(), 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    return onSnapshot(q, (snapshot) => {
      const messages: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          senderId: data.senderId,
          text: data.text,
          timestamp: data.timestamp?.toDate() || new Date(),
        });
      });
      this.updateMessageList(messages);
      callback(messages);
    });
  }

  /**
   * Update the message list UI with new messages
   * @param messages - Array of chat messages
   */
  private updateMessageList(messages: ChatMessage[]): void {
    if (!this.message_wrapper) return;

    // Clear existing message clones
    const existingClones = this.message_wrapper.querySelectorAll('[CLONE="true"]');
    existingClones.forEach((clone) => clone.remove());

    // Create document fragment for batch DOM operations
    const fragment = document.createDocumentFragment();

    for (const message of messages) {
      const clone = this.message_wrapper.cloneNode(true) as HTMLElement;
      clone.setAttribute('CLONE', 'true');
      clone.setAttribute('data-id', message.id);

      // Find elements within the clone
      const timestamp = clone.querySelector<HTMLElement>('[wized="timestamp"]');
      const messageText = clone.querySelector<HTMLElement>('[wized="message_text"]');
      const deleteButton = clone.querySelector<HTMLElement>('[wized="delete_message"]');

      // Update elements with message data
      if (timestamp) {
        timestamp.textContent = new Date(message.timestamp).toLocaleString();
      }
      if (messageText) {
        messageText.textContent = message.text;
      }
      if (deleteButton) {
        // Only show delete button for user's own messages
        deleteButton.style.display = message.senderId === 'current_user_id' ? 'block' : 'none';
      }

      fragment.appendChild(clone);
    }

    // Single DOM operation to append all clones
    this.message_wrapper.appendChild(fragment);

    // Remove the original template
    this.message_wrapper.remove();

    // Scroll to bottom of messages
    this.message_wrapper.scrollTop = this.message_wrapper.scrollHeight;
  }

  /**
   * Initialize form submission handling
   */
  private initializeFormSubmission(): void {
    if (!this.chatForm) return;

    this.chatForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const form = e.target as HTMLFormElement;
      const messageInput = form.querySelector<HTMLInputElement>('input[type="text"]');

      if (!messageInput || !messageInput.value.trim()) return;

      try {
        await this.sendMessage('current_user_id', messageInput.value.trim());
        messageInput.value = ''; // Clear input after successful send
      } catch (error) {
        console.error('Error sending message:', error);
      }
    });
  }

  /**
   * Send a new message to the event chat
   * @param senderId - The ID of the message sender
   * @param text - The message text
   * @returns The ID of the new message
   */
  async sendMessage(senderId: string, text: string): Promise<string> {
    const messagesRef = collection(this.db, 'events', this.eventData.id.toString(), 'messages');

    const docRef = await addDoc(messagesRef, {
      senderId,
      text,
      timestamp: serverTimestamp(),
    });

    return docRef.id;
  }

  /**
   * Clean up subscriptions when done
   */
  cleanup() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}
