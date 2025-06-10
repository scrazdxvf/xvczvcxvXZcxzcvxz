import { Product, AdStatus } from '../types';
import { CATEGORIES } from '../constants';
import { 
  db, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Timestamp,
  FieldValue
} from '../../firebaseConfig'; // Updated path

const LISTINGS_COLLECTION = 'listings';

// Helper to convert Firestore doc to Product, converting Timestamps
const fromFirestore = (snapshot: any): Product => {
  const data = snapshot.data();
  return {
    ...data,
    id: snapshot.id,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : data.createdAt,
    // Ensure other potential Timestamps are converted if any
  } as Product;
};

export const listingService = {
  // Use onSnapshot in components for real-time updates for lists.
  // These functions provide one-time fetches.

  getAllListings: async (): Promise<Product[]> => {
    const q = query(collection(db, LISTINGS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(fromFirestore);
  },

  getActiveListings: async (): Promise<Product[]> => {
    const q = query(
      collection(db, LISTINGS_COLLECTION), 
      where('status', '==', AdStatus.ACTIVE),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(fromFirestore);
  },

  getListingById: async (id: string): Promise<Product | undefined> => {
    const docRef = doc(db, LISTINGS_COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return fromFirestore(snapshot);
    }
    return undefined;
  },

  getListingsByUserId: async (userId: string): Promise<Product[]> => {
    const q = query(
      collection(db, LISTINGS_COLLECTION), 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(fromFirestore);
  },
  
  createListing: async (productData: Omit<Product, 'id' | 'createdAt' | 'status'>): Promise<Product> => {
    if (!productData.userId) {
      throw new Error("User ID is required to create a listing.");
    }
    const dataToSave = {
      ...productData,
      status: AdStatus.PENDING,
      createdAt: serverTimestamp() as FieldValue, // Firestore will set the timestamp
    };
    const docRef = await addDoc(collection(db, LISTINGS_COLLECTION), dataToSave);
    
    // To return the full product with ID and resolved timestamp, we'd ideally fetch it again
    // For now, returning optimistic data with placeholder createdAt.
    // Or, for more accuracy, fetch the doc after creation:
    // const newDocSnapshot = await getDoc(docRef);
    // return fromFirestore(newDocSnapshot);
    // For simplicity now, we'll return what we have and assume client updates onSnapshot
     return {
        ...productData,
        id: docRef.id,
        status: AdStatus.PENDING,
        createdAt: Date.now(), // Placeholder, actual value set by serverTimestamp
    } as Product;
  },

  updateListing: async (id: string, updates: Partial<Omit<Product, 'id' | 'userId'>>): Promise<Product | undefined> => {
    const docRef = doc(db, LISTINGS_COLLECTION, id);
    // Prevent userId from being changed with this generic update, handle separately if needed
    const { userId, ...safeUpdates } = updates as any; 
    await updateDoc(docRef, safeUpdates);
    // For consistency, one might fetch the doc again:
    // const updatedDoc = await getDoc(docRef);
    // return updatedDoc.exists() ? fromFirestore(updatedDoc) : undefined;
    // For now, assume onSnapshot will update UI or rely on optimistic updates
    const currentDoc = await getDoc(docRef);
    return currentDoc.exists() ? fromFirestore(currentDoc) : undefined;
  },

  deleteListing: async (id: string): Promise<boolean> => {
    const docRef = doc(db, LISTINGS_COLLECTION, id);
    await deleteDoc(docRef);
    return true; // Assume success, or check if doc existed before
  },

  getPendingListings: async (): Promise<Product[]> => {
    const q = query(
      collection(db, LISTINGS_COLLECTION), 
      where('status', '==', AdStatus.PENDING),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(fromFirestore);
  },

  approveListing: async (id: string): Promise<Product | undefined> => {
    return listingService.updateListing(id, { status: AdStatus.ACTIVE, rejectionReason: undefined });
  },

  rejectListing: async (id: string, reason: string): Promise<Product | undefined> => {
    return listingService.updateListing(id, { status: AdStatus.REJECTED, rejectionReason: reason });
  },

  getCategoryName: (categoryId: string): string => {
    return CATEGORIES.find(c => c.id === categoryId)?.name || categoryId;
  },

  getSubcategoryName: (categoryId:string, subcategoryId: string): string => {
    const category = CATEGORIES.find(c => c.id === categoryId);
    return category?.subcategories.find(sc => sc.id === subcategoryId)?.name || subcategoryId;
  }
};

// Note: For real-time updates on lists (e.g., HomePage, MyListingsPage),
// components should use `onSnapshot` directly from Firestore.
// Example in a component:
/*
useEffect(() => {
  const q = query(collection(db, 'listings'), where('status', '==', AdStatus.ACTIVE), orderBy('createdAt', 'desc'));
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const activeListings = querySnapshot.docs.map(fromFirestore);
    // set listings in component state
  });
  return () => unsubscribe(); // Cleanup listener
}, []);
*/
