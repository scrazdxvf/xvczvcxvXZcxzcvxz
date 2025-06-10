
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { chatService } from '../services/chatService'; // For getChatsForUser (initial adIds), getUnreadMessagesCountForUser (can be replaced by onSnapshot derived count)
import { listingService } from '../services/listingService'; // For getListingById
import { Product, Message, TelegramUser } from '../types';
import Spinner from '../components/ui/Spinner';
import { DEFAULT_PLACEHOLDER_IMAGE } from '../constants';
import { db, collection, query, where, orderBy, onSnapshot, Timestamp, getDocs } from '../../firebaseConfig';


interface ChatPreview {
  adId: string;
  adTitle: string;
  adImage: string;
  lastMessageText: string;
  lastMessageTimestamp: number | null;
  lastMessageSenderId?: string;
  unreadCount: number;
}

interface OutletContextType {
  currentUserId?: string;
  currentUserFull?: TelegramUser | null;
  // dataUpdateTrigger removed
}

// Helper to convert Firestore doc to Message, converting Timestamps
const fromFirestoreToMessage = (snapshot: any): Message => {
  const data = snapshot.data();
  return {
    ...data,
    id: snapshot.id,
    timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toMillis() : data.timestamp,
  } as Message;
};

const MessagesPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUserId } = useOutletContext<OutletContextType>();

  const [chatPreviews, setChatPreviews] = useState<ChatPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // This effect will set up listeners for each chat once adIds are known
  useEffect(() => {
    if (!currentUserId) {
      setIsLoading(false);
      setChatPreviews([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    // 1. Get all ad IDs the user has interacted with
    chatService.getChatsForUser(currentUserId).then(async adIds => {
      if (adIds.length === 0) {
        setChatPreviews([]);
        setIsLoading(false);
        return;
      }

      const unsubscribes: (() => void)[] = [];
      let initialPreviews: ChatPreview[] = [];

      // For each adId, fetch ad details and set up a listener for its messages
      for (const adId of adIds) {
        const adDetails = await listingService.getListingById(adId);
        if (!adDetails) continue;

        const q = query(
          collection(db, 'messages'),
          where('adId', '==', adId),
          // More complex filtering for sender/receiver needed here or client-side for true two-way chat view
          orderBy('timestamp', 'desc') // Get latest message first for preview easily
        );

        const unsubscribe = onSnapshot(q, (msgSnapshot) => {
          const messagesForAd = msgSnapshot.docs
            .map(fromFirestoreToMessage)
            .filter(msg => msg.senderId === currentUserId || msg.receiverId === currentUserId);
          
          messagesForAd.sort((a,b) => a.timestamp - b.timestamp); // sort ascending for correct last message

          const lastMessage = messagesForAd.length > 0 ? messagesForAd[messagesForAd.length - 1] : null;
          const unreadCount = messagesForAd.filter(msg => msg.receiverId === currentUserId && !msg.read).length;

          setChatPreviews(prev => {
            const updatedPreviews = prev.filter(p => p.adId !== adId); // Remove old preview for this ad
            updatedPreviews.push({
              adId,
              adTitle: adDetails.title,
              adImage: adDetails.images && adDetails.images.length > 0 ? adDetails.images[0] : `${DEFAULT_PLACEHOLDER_IMAGE}${adId}`,
              lastMessageText: lastMessage ? lastMessage.text : 'Нет сообщений',
              lastMessageTimestamp: lastMessage ? lastMessage.timestamp : null,
              lastMessageSenderId: lastMessage?.senderId,
              unreadCount,
            });
            // Sort previews by unread count then by last message timestamp
            return updatedPreviews.sort((a, b) => {
              if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
              if (b.unreadCount > 0 && a.unreadCount === 0) return 1;
              if (a.lastMessageTimestamp && b.lastMessageTimestamp) return b.lastMessageTimestamp - a.lastMessageTimestamp;
              if (a.lastMessageTimestamp) return -1;
              if (b.lastMessageTimestamp) return 1;
              return 0;
            });
          });
        }, (err) => {
          console.error(`Error fetching messages for ad ${adId}:`, err);
          // Potentially set an error state for this specific chat
        });
        unsubscribes.push(unsubscribe);
      }
       // Initial load might be done, or after all listeners are set up
      setIsLoading(false); 


      return () => {
        unsubscribes.forEach(unsub => unsub());
      };
    }).catch(err => {
      console.error("Failed to fetch chat ad IDs:", err);
      setError("Не удалось загрузить ваши чаты.");
      setIsLoading(false);
    });

  }, [currentUserId]);


  if (!currentUserId && !isLoading) {
     return (
      <div className="container mx-auto px-2 sm:px-4 py-8 text-center">
        <p className="text-xl text-slate-600 dark:text-slate-300">
          Пожалуйста, убедитесь, что вы вошли в систему через Telegram, чтобы просмотреть свои сообщения.
        </p>
      </div>
    );
  }

  if (isLoading && !chatPreviews.length) return <Spinner fullPage />;
  if (error && !isLoading) return <div className="text-center text-red-500 dark:text-red-400 p-8">{error}</div>;

  return (
    <div className="container mx-auto px-2 sm:px-4 py-8">
      <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-6">Мои сообщения</h1>
      
      {isLoading && chatPreviews.length === 0 && <div className="flex justify-center my-4"><Spinner /></div>}
      
      {!isLoading && chatPreviews.length === 0 ? (
        <div className="text-center py-12">
          <i className="fa-solid fa-comments-dollar text-6xl text-slate-400 dark:text-slate-500 mb-4"></i>
          <p className="text-xl text-slate-600 dark:text-slate-300">У вас пока нет активных чатов.</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Начните общение, написав продавцу интересующего вас товара.</p>
        </div>
      ) : (
        !isLoading && (
          <div className="space-y-4">
            {chatPreviews.map(preview => (
              <Link 
                key={preview.adId} 
                to={`/product/${preview.adId}?openChat=true`}
                className="block bg-light-secondary dark:bg-dark-secondary p-4 rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-4">
                  <img 
                    src={preview.adImage} 
                    alt={preview.adTitle} 
                    className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).src = `${DEFAULT_PLACEHOLDER_IMAGE}${preview.adId}`; }}
                  />
                  <div className="flex-grow overflow-hidden">
                    <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary truncate">{preview.adTitle}</h3>
                    <p className={`text-sm truncate ${preview.unreadCount > 0 ? 'font-bold text-sky-600 dark:text-dark-accent' : 'text-slate-500 dark:text-slate-400'}`}>
                      {preview.lastMessageSenderId === currentUserId ? "Вы: " : ""}
                      {preview.lastMessageText}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    {preview.lastMessageTimestamp && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">
                        {new Date(preview.lastMessageTimestamp).toLocaleDateString('uk-UA', { day:'numeric', month:'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                    {preview.unreadCount > 0 && (
                      <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                        {preview.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default MessagesPage;