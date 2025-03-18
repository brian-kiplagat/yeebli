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
import type { EventData } from '../utils/eventStatus';
import type { User } from './types';

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
    this.initializeFormSubmission();
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

    // Update elements with message data
    if (timestamp) {
      timestamp.textContent = new Date(message.timestamp).toLocaleString();
    }
    if (messageText) {
      messageText.textContent = message.text;
    }
    if (deleteButton) {
      deleteButton.style.display = message.senderId === 'current_user_id' ? 'block' : 'none';
      // Add click handler for delete
      deleteButton.addEventListener('click', () => this.deleteMessage(message.id));
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
    if (!this.chatForm) return;

    this.chatForm.addEventListener('submit', async (e: Event) => {
      e.preventDefault();

      const form = e.target as HTMLFormElement;
      const messageInput = form.querySelector<HTMLInputElement>('input[type="text"]');

      if (!messageInput || !messageInput.value.trim()) return;

      try {
        const userString = localStorage.getItem('user');
        if (!userString) throw new Error('User not found');
        const userObject = JSON.parse(userString) as User;
        await this.sendMessage(userObject.id.toString(), messageInput.value.trim());
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
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    const messagesRef = collection(this.db, 'events', this.eventData.id.toString(), 'messages');

    const docRef = await addDoc(messagesRef, {
      senderId,
      text,
      timestamp: serverTimestamp(),
    });

    return docRef.id;
  }

  /**
   * Delete a message from the chat
   * @param messageId - The ID of the message to delete
   */
  private async deleteMessage(messageId: string): Promise<void> {
    try {
      console.log('Deleting:', messageId);
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
      console.error('Error deleting message:', error);
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
