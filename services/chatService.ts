import { Message } from '../types';
import { 
  db, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Timestamp,
  getDocs,
  writeBatch,
  FieldValue
} from '../../firebaseConfig'; // Updated path

const MESSAGES_COLLECTION = 'messages';

// Helper to convert Firestore doc to Message, converting Timestamps
const messageFromFirestore = (snapshot: any): Message => {
  const data = snapshot.data();
  return {
    ...data,
    id: snapshot.id,
    timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toMillis() : data.timestamp,
  } as Message;
};

export const chatService = {
  // For real-time messages in ProductPage chat, use onSnapshot directly in the component.
  // This function can be used for initial load if needed, but onSnapshot is preferred for chat.
  getMessagesForAd: async (adId: string, currentUserId: string): Promise<Message[]> => {
    if (!currentUserId) return [];
    
    // Firestore doesn't support OR queries on different fields easily.
    // Fetch messages where user is sender OR receiver for the ad.
    // This might require two queries and merging, or structuring data differently.
    // For now, we'll fetch based on adId and then filter locally, or use onSnapshot in component
    // with a query that's easier to manage for real-time.

    // A common approach for chat is to query by adId and order by timestamp.
    // Filtering by sender/receiver locally is less ideal for large datasets but simpler for now.
    const q = query(
      collection(db, MESSAGES_COLLECTION),
      where('adId', '==', adId),
      orderBy('timestamp', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs
        .map(messageFromFirestore)
        .filter(msg => msg.senderId === currentUserId || msg.receiverId === currentUserId);
  },

  sendMessage: async (adId: string, senderId: string, receiverId: string, text: string): Promise<Message> => {
    if (!senderId || !receiverId) {
        throw new Error("Sender and Receiver ID are required to send a message.");
    }
    const dataToSave = {
      adId,
      senderId,
      receiverId,
      text,
      timestamp: serverTimestamp() as FieldValue,
      read: false,
    };
    const docRef = await addDoc(collection(db, MESSAGES_COLLECTION), dataToSave);
    return {
        ...dataToSave,
        id: docRef.id,
        timestamp: Date.now(), // Placeholder, actual value set by serverTimestamp
        read: false,
    } as Message;
  },

  markMessagesAsRead: async (adId: string, readerId: string): Promise<void> => {
    if (!readerId) return;
    const q = query(
      collection(db, MESSAGES_COLLECTION),
      where('adId', '==', adId),
      where('receiverId', '==', readerId),
      where('read', '==', false)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.docs.forEach(docSnapshot => {
      batch.update(doc(db, MESSAGES_COLLECTION, docSnapshot.id), { read: true });
    });
    await batch.commit();
  },

  getUnreadMessagesCountForUser: async (userId: string): Promise<number> => {
    if (!userId) return 0;
    const q = query(
      collection(db, MESSAGES_COLLECTION),
      where('receiverId', '==', userId),
      where('read', '==', false)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  },

  // This can get complex with Firestore if you want a list of "chats" (like unique ad conversations).
  // A common way is to maintain a separate "chats" collection or denormalize last message info.
  // For now, this will get all Ad IDs the user has interacted with.
  getChatsForUser: async (userId: string): Promise<string[]> => {
    if (!userId) return [];
    
    const sentMessagesQuery = query(collection(db, MESSAGES_COLLECTION), where('senderId', '==', userId));
    const receivedMessagesQuery = query(collection(db, MESSAGES_COLLECTION), where('receiverId', '==', userId));

    const [sentSnapshot, receivedSnapshot] = await Promise.all([
      getDocs(sentMessagesQuery),
      getDocs(receivedMessagesQuery)
    ]);
    
    const adIds = new Set<string>();
    sentSnapshot.docs.forEach(doc => adIds.add(doc.data().adId));
    receivedSnapshot.docs.forEach(doc => adIds.add(doc.data().adId));
    
    return Array.from(adIds);
  }
};
