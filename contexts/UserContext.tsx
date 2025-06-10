
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TelegramUser } from '../types';
import { MOCK_DEV_USER_ID } from '../constants'; // For development fallback
// Removed LS_VISITED_USERS_KEY, LS_USER_SESSIONS_KEY, USER_ACTIVITY_UPDATE_INTERVAL_MS

interface UserContextType {
  currentUser: TelegramUser | null;
  isLoading: boolean;
  error: string | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Extend Window interface for Telegram WebApp
declare global {
  interface Window {
    Telegram?: {
      WebApp: any; // Use 'any' for simplicity or define more specific types
    };
  }
}


export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<TelegramUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Removed updateUserActivity and trackUniqueVisitor functions as they were localStorage based.
    // Real user analytics would be server-side.

    const initTelegram = () => {
      const tg = window.Telegram?.WebApp;

      if (tg) {
        try {
          tg.ready(); 
          tg.expand(); 

          let resolvedUser: TelegramUser | null = null;

          if (tg.initDataUnsafe?.user) {
            const userData = tg.initDataUnsafe.user;
            resolvedUser = {
              id: userData.id.toString(),
              username: userData.username,
              firstName: userData.first_name,
              lastName: userData.last_name,
              isPremium: userData.is_premium,
              languageCode: userData.language_code,
            };
            setError(null);
            console.log("Telegram User Initialized:", resolvedUser);
          } else {
            setError("Telegram user data not found in initDataUnsafe. App functionality may be limited.");
            console.warn("Telegram user data not available. tg.initDataUnsafe:", tg.initDataUnsafe);
            if (process.env.NODE_ENV === 'development') {
                console.warn("DEVELOPMENT: initDataUnsafe.user is missing, using MOCK_DEV_USER_ID");
                resolvedUser = { id: MOCK_DEV_USER_ID, username: 'dev_user', firstName: 'Dev', lastName: 'User' };
            }
          }
          
          if (resolvedUser) {
            setCurrentUser(resolvedUser);
            // trackUniqueVisitor(resolvedUser.id); // Removed
            // updateUserActivity(resolvedUser.id); // Removed
          }

        } catch (e: any) {
            console.error("Error during Telegram SDK initialization:", e);
            setError(`Error initializing Telegram SDK: ${e.message}. Ensure the app is opened within Telegram.`);
            if (process.env.NODE_ENV === 'development') {
                console.warn("DEVELOPMENT: Error with SDK, using MOCK_DEV_USER_ID");
                const mockUser = { id: MOCK_DEV_USER_ID, username: 'dev_user', firstName: 'Dev', lastName: 'User' };
                setCurrentUser(mockUser);
                // trackUniqueVisitor(mockUser.id); // Removed
                // updateUserActivity(mockUser.id); // Removed
            }
        }
      } else {
        if (process.env.NODE_ENV === 'development' || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
           console.warn("Telegram WebApp SDK not found. Using MOCK_DEV_USER_ID for development.");
           const mockUser = { id: MOCK_DEV_USER_ID, username: 'dev_user', firstName: 'Dev', lastName: 'User' };
           setCurrentUser(mockUser);
           // trackUniqueVisitor(mockUser.id); // Removed
           // updateUserActivity(mockUser.id); // Removed
           setError(null);
        } else {
          setError("Telegram WebApp SDK not found. This application must be run inside a Telegram Mini App.");
          console.error("Telegram WebApp SDK not found.");
        }
      }
      setIsLoading(false);
    };

    if (window.Telegram?.WebApp) {
        initTelegram();
    } else {
        // Attempt to initialize after a short delay if SDK isn't immediately available
        const timeoutId = setTimeout(() => {
            initTelegram();
        }, 500); 
        return () => clearTimeout(timeoutId);
    }
  }, []);

  // Effect for periodic activity update removed as it was localStorage based.

  return (
    <UserContext.Provider value={{ currentUser, isLoading, error }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};