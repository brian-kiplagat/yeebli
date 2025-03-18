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

  constructor(eventData: EventData) {
    // Initialize Firebase if not already initialized
    const app = initializeApp(firebaseConfig);
    this.db = getFirestore(app);
    this.eventData = eventData;
  }

  /**
   * Initialize chat for the event
   * @param onMessageUpdate - Callback for when messages are updated
   */
  init(onMessageUpdate: (messages: ChatMessage[]) => void) {
    // Subscribe to messages
    this.unsubscribe = this.subscribeToMessages(onMessageUpdate);
  }

  /**
   * Subscribe to chat messages for the event
   * @param callback - Function to be called when messages are updated
   * @returns Unsubscribe function
   */
  private subscribeToMessages(callback: (messages: ChatMessage[]) => void) {
    const messagesRef = collection(this.db, 'events', this.eventData.event_code, 'messages');
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
      callback(messages);
    });
  }

  /**
   * Send a new message to the event chat
   * @param senderId - The ID of the message sender
   * @param text - The message text
   * @returns The ID of the new message
   */
  async sendMessage(senderId: string, text: string): Promise<string> {
    const messagesRef = collection(this.db, 'events', this.eventData.event_code, 'messages');

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
