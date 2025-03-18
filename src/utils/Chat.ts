import {
  addDoc,
  collection,
  Firestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';

import type { ChatMessage, EventChat } from '../types/chat';

export class Chat {
  private db: Firestore;
  private eventsCollection: string = 'events';
  private messagesSubcollection: string = 'messages';
  private unsubscribe: (() => void) | null = null;

  constructor(db: Firestore) {
    this.db = db;
  }

  /**
   * Initialize chat for an event
   * @param eventId - The ID of the event
   * @param onMessageUpdate - Callback for when messages are updated
   */
  init(eventId: string, onMessageUpdate: (messages: ChatMessage[]) => void) {
    // Subscribe to messages
    this.unsubscribe = this.subscribeToMessages(eventId, onMessageUpdate);
  }

  /**
   * Subscribe to chat messages for a specific event
   * @param eventId - The ID of the event
   * @param callback - Function to be called when messages are updated
   * @returns Unsubscribe function
   */
  private subscribeToMessages(eventId: string, callback: (messages: ChatMessage[]) => void) {
    const messagesRef = collection(
      this.db,
      this.eventsCollection,
      eventId,
      this.messagesSubcollection
    );
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
   * @param eventId - The ID of the event
   * @param senderId - The ID of the message sender
   * @param text - The message text
   * @returns The ID of the new message
   */
  async sendMessage(eventId: string, senderId: string, text: string): Promise<string> {
    const messagesRef = collection(
      this.db,
      this.eventsCollection,
      eventId,
      this.messagesSubcollection
    );

    const docRef = await addDoc(messagesRef, {
      senderId,
      text,
      timestamp: serverTimestamp(),
    });

    return docRef.id;
  }

  /**
   * Create a new event chat
   * @param event - The event details
   * @returns The ID of the new event
   */
  async createEvent(event: Omit<EventChat, 'id' | 'messages'>): Promise<string> {
    const eventsRef = collection(this.db, this.eventsCollection);
    const docRef = await addDoc(eventsRef, {
      ...event,
      messages: [],
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
