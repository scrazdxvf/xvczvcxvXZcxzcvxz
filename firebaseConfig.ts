// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase_app_module"; // Updated path
import { 
  getFirestore, 
  Timestamp, 
  serverTimestamp, 
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
  onSnapshot, 
  writeBatch, 
  FieldValue,
  getCountFromServer
} from "firebase_firestore_module"; // Updated path


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// IMPORTANT: REPLACE WITH YOUR ACTUAL FIREBASE PROJECT CONFIGURATION
const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // Replace with your API key
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com", // Replace
  projectId: "YOUR_PROJECT_ID", // Replace
  storageBucket: "YOUR_PROJECT_ID.appspot.com", // Replace
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // Replace
  appId: "YOUR_APP_ID", // Replace
  measurementId: "YOUR_MEASUREMENT_ID" // Optional: Replace
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db = getFirestore(app);

// Export Firebase services and utilities
export { 
  db, 
  Timestamp, 
  serverTimestamp,
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
  onSnapshot,
  writeBatch,
  getCountFromServer
};
export type { FieldValue };


// Firestore Data Converter for Timestamps
// This helps ensure that Timestamps are handled correctly when fetching/saving data.
// However, for simplicity in this refactor, we'll often convert Timestamps to numbers (millis) 
// after fetching and use serverTimestamp() or Timestamp.fromDate(new Date()) when writing.
// If you need more complex objects, you can use converters.
/*
export const genericConverter = <T>() => ({
  toFirestore(data: T): DocumentData {
    // Convert any Date objects to Timestamps, etc.
    return data as DocumentData;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): T {
    const data = snapshot.data(options)!;
    // Convert any Timestamps to Dates, etc.
    // Example: if (data.createdAt instanceof Timestamp) data.createdAt = data.createdAt.toMillis();
    return data as T;
  }
});
*/

/*
Reminder for setting up Firestore Security Rules (in Firebase Console > Firestore Database > Rules):
For development, you can start with open rules, BUT **THIS IS NOT SECURE FOR PRODUCTION**.

Example (VERY INSECURE - for initial testing only):
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}

A slightly more secure starting point (still needs refinement):
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Listings can be read by anyone, written only by owner or admin (you'd need user auth for owner)
    match /listings/{listingId} {
      allow read: if true;
      // For write: you'll need to implement Firebase Authentication and check request.auth.uid
      // allow write: if request.auth != null && (request.auth.uid == resource.data.userId || get(/databases/$(database)/documents/admins/$(request.auth.uid)).exists);
      allow write: if true; // Placeholder, very insecure
    }
    // Messages only accessible by sender/receiver (again, needs auth)
    match /messages/{messageId} {
      // allow read, write: if request.auth != null && (request.auth.uid == resource.data.senderId || request.auth.uid == resource.data.receiverId);
      allow read, write: if true; // Placeholder, very insecure
    }
    // Add other collections and rules as needed
  }
}

**YOU MUST SECURE YOUR DATA WITH PROPER RULES BEFORE GOING TO PRODUCTION.**
*/