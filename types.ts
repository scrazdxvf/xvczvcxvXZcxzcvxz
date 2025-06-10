

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
}

export interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
  icon: string; // Font Awesome class
}

export interface Subcategory {
  id: string;
  name: string;
  icon?: string;
}

export enum AdStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  REJECTED = 'rejected',
}

export interface Product {
  id: string; // Firestore document ID
  title: string;
  description: string;
  price: number;
  category: string; // Main category ID
  subcategory: string; // Subcategory ID
  images: string[]; // URLs or base64 strings
  userId: string; // Actual Telegram User ID or a mock ID for sample data
  status: AdStatus;
  rejectionReason?: string;
  createdAt: number; // Timestamp (milliseconds since epoch)
  contactInfo?: string; // e.g., Telegram username
}
// For Firestore, when creating, we might use Omit<Product, 'id' | 'createdAt'> and let Firestore generate ID and use serverTimestamp for createdAt.

export interface Message {
  id: string; // Firestore document ID
  adId: string;
  senderId: string; // Actual Telegram User ID
  receiverId: string; // Actual Telegram User ID
  text: string;
  timestamp: number; // Timestamp (milliseconds since epoch)
  read: boolean;
}

export interface User { // This is a generic User, could be used for seller profiles if extended
  id: string;
  username: string; // e.g. telegram username
  // other user details if needed
}

export interface TelegramUser {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  isPremium?: boolean;
  languageCode?: string;
}


// For mocked current user in sample data. Actual user will come from Telegram.
export const MOCK_SAMPLE_USER_ID = 'sampleUser123'; // Used for pre-filled data not belonging to the current TG user
export const MOCK_SELLER_ID_PREFIX = 'seller'; // Used for pre-filled data for other sellers