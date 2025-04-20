import { initializeApp } from 'firebase/app';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  Firestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';

import { firebaseConfig } from '../config/firebase-config';
import type { ChatMessage } from '../types/chat';
import type { EventData } from '../types/event';
import { formatChatDate, getLeadFromStorage, showError } from './reusables';

export class Chat {
  private db: Firestore;
  private eventData: EventData;
  private unsubscribe: (() => void) | null = null;
  private chatForm: HTMLElement | null = null;
  private message_wrapper: HTMLElement | null = null;
  private chat_body: HTMLElement | null = null;
  private message_chat_host_name: HTMLElement | null = null;

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
    this.chat_body = document.querySelector<HTMLElement>('[wized="chat_body"]');
    this.message_chat_host_name = document.querySelector<HTMLElement>(
      '[wized="message_chat_host_name"]'
    );
    if (
      !this.chatForm ||
      !this.message_wrapper ||
      !this.chat_body ||
      !this.message_chat_host_name
    ) {
      throw new Error('Chat elements not found');
    }
    this.message_chat_host_name.textContent = this.eventData.host.name;
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
      // Handle initial load
      if (snapshot.docChanges().length === snapshot.docs.length) {
        const messages: ChatMessage[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          senderId: doc.data().senderId,
          text: doc.data().text,
          timestamp: doc.data().timestamp?.toDate() || new Date(),
        }));
        this.initializeMessageList(messages);
        callback(messages);
        return;
      }

      // Handle real-time updates
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const message: ChatMessage = {
            id: change.doc.id,
            senderId: data.senderId,
            text: data.text,
            timestamp: data.timestamp?.toDate() || new Date(),
          };
          this.addNewMessage(message);
        } else if (change.type === 'removed') {
          // Remove the message from UI
          const messageElement = this.chat_body?.querySelector(`[data-id="${change.doc.id}"]`);
          messageElement?.remove();
        }
      });
    });
  }

  private initializeMessageList(messages: ChatMessage[]): void {
    if (!this.message_wrapper || !this.chat_body) return;

    // Clear chat body
    while (this.chat_body.firstChild) {
      this.chat_body.removeChild(this.chat_body.firstChild);
    }

    // Create all messages at once
    const fragment = document.createDocumentFragment();

    for (const message of messages) {
      const clone = this.createMessageElement(message);
      fragment.appendChild(clone);
    }

    this.chat_body.appendChild(fragment);

    // Remove the original template
    if (this.message_wrapper.parentNode) {
      this.message_wrapper.remove();
    }

    this.scrollToBottom();
  }

  private addNewMessage(message: ChatMessage): void {
    if (!this.message_wrapper || !this.chat_body) return;

    const messageElement = this.createMessageElement(message);
    this.chat_body.appendChild(messageElement);
    this.scrollToBottom();
  }

  private createMessageElement(message: ChatMessage): HTMLElement {
    if (!this.message_wrapper) {
      throw new Error('Message wrapper not found');
    }
    const clone = this.message_wrapper.cloneNode(true) as HTMLElement;
    clone.setAttribute('CLONE', 'true');
    clone.setAttribute('data-id', message.id);

    // Find elements within the clone
    const timestamp = clone.querySelector<HTMLElement>('[wized="timestamp"]');
    const messageText = clone.querySelector<HTMLElement>('[wized="message_text"]');
    const deleteButton = clone.querySelector<HTMLElement>('[wized="delete_message"]');
    const message_inner_wrapper = clone.querySelector<HTMLElement>(
      '[wized="message_inner_wrapper"]'
    );
    if (!message_inner_wrapper) {
      throw new Error('Message inner wrapper not found');
    }
    if (!messageText) {
      throw new Error('Message text not found');
    }
    if (!timestamp) {
      throw new Error('Timestamp not found');
    }
    if (!deleteButton) {
      throw new Error('Delete button not found');
    }
    // Update elements with message data
    if (timestamp) {
      timestamp.textContent = formatChatDate(message.timestamp);
    }
    if (messageText) {
      messageText.textContent = message.text;
    }
    if (deleteButton) {
      // Only show delete button if the looged in user is the host
      const lead = getLeadFromStorage();
      deleteButton.style.display = lead?.id === this.eventData.host_id ? 'block' : 'none';
      // Add click handler for delete
      deleteButton.addEventListener('click', () => this.deleteMessage(message.id));
    }
    // Add class that aligns the message to the right for current logged in lead, and to the left for other users
    const lead = getLeadFromStorage();
    if (message.senderId === lead?.id.toString()) {
      clone.classList.add('right');
      message_inner_wrapper?.classList.add('right');
      messageText?.classList.add('right');
    }

    return clone;
  }

  private scrollToBottom(): void {
    if (this.chat_body) {
      this.chat_body.scrollTop = this.chat_body.scrollHeight;
    }
  }

  /**
   * Initialize form submission handling
   */
  private initializeFormSubmission(): void {
    if (!this.chatForm) {
      throw new Error('Chat form not found');
    }

    // Remove all existing submit event listeners
    const oldForm = this.chatForm.cloneNode(true);
    if (this.chatForm.parentNode) {
      this.chatForm.parentNode.replaceChild(oldForm, this.chatForm);
      this.chatForm = oldForm as HTMLFormElement;
    }

    // Now attach your new submit listener
    this.chatForm.addEventListener('submit', async (e: Event) => {
      e.preventDefault();
      e.stopPropagation();

      const form = e.target as HTMLFormElement;
      const messageInput = form.querySelector<HTMLInputElement>('input[type="text"]');

      if (!messageInput || !messageInput.value.trim()) return;

      try {
        const lead = getLeadFromStorage();
        if (!lead || !lead.id) {
          throw new Error('Lead or lead id not found');
        }
        const isHost = lead.id === this.eventData.host_id;
        await this.sendMessage(String(lead.id), lead.name, messageInput.value.trim(), isHost);
        messageInput.value = ''; // Clear input after successful send
      } catch (error) {
        showError('An error occurred while sending this message');
        console.error(error);
      }
    });
  }

  /**
   * Send a new message to the event chat
   * @param senderId - The ID of the message sender
   * @param text - The message text
   * @returns The ID of the new message
   */
  async sendMessage(
    senderId: string,
    name: string,
    text: string,
    isHost: boolean
  ): Promise<string> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    if (!senderId) {
      throw new Error('Sender ID not found');
    }

    const messagesRef = collection(this.db, 'events', this.eventData.id.toString(), 'messages');

    const docRef = await addDoc(messagesRef, {
      senderId,
      name,
      text,
      timestamp: serverTimestamp(),
      isHost,
    });

    return docRef.id;
  }

  /**
   * Delete a message from the chat
   * @param messageId - The ID of the message to delete
   */
  private async deleteMessage(messageId: string): Promise<void> {
    try {
      const messageRef = doc(
        this.db,
        'events',
        this.eventData.id.toString(),
        'messages',
        messageId
      );
      await deleteDoc(messageRef);
      // The message will be automatically removed from the UI
      // through the Firestore snapshot listener
    } catch (error) {
      showError('An error occurred while deleting this message');
      console.error(error);
    }
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
