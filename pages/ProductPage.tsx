
import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import { useParams, useNavigate, Link, useLocation, useOutletContext } from 'react-router-dom';
import { Product, Message, TelegramUser } from '../types';
import { listingService } from '../services/listingService'; // Keep for category names, contactInfo formatting
import { chatService } from '../services/chatService'; // Keep for sendMessage, markMessagesAsRead
import Spinner from '../components/ui/Spinner';
import { CURRENCY_SYMBOL, DEFAULT_PLACEHOLDER_IMAGE } from '../constants';
import Button from '../components/ui/Button';
import Textarea from '../components/ui/Textarea';
import Input from '../components/ui/Input'; 
import { db, doc, onSnapshot, collection, query, where, orderBy, Timestamp } from '../../firebaseConfig';

interface OutletContextType {
  currentUserId?: string;
  currentUserFull?: TelegramUser | null;
  // dataUpdateTrigger removed
}

// Helper to convert Firestore doc to Product, converting Timestamps
const fromFirestoreToProduct = (snapshot: any): Product => {
  const data = snapshot.data();
  return {
    ...data,
    id: snapshot.id,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : data.createdAt,
  } as Product;
};

// Helper to convert Firestore doc to Message, converting Timestamps
const fromFirestoreToMessage = (snapshot: any): Message => {
  const data = snapshot.data();
  return {
    ...data,
    id: snapshot.id,
    timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toMillis() : data.timestamp,
  } as Message;
};


const ProductPage: React.FC = () => {
  const { id: productId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUserId } = useOutletContext<OutletContextType>();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [newMessageText, setNewMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [showChat, setShowChat] = useState(false);


  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.get('openChat') === 'true' && currentUserId) { 
      setShowChat(true);
    }
  }, [location.search, currentUserId]);


  // Product real-time listener
  useEffect(() => {
    if (!productId) {
      setError("ID товара не найден.");
      setIsLoadingProduct(false);
      return;
    }
    setIsLoadingProduct(true);
    setError(null);

    const productDocRef = doc(db, 'listings', productId);
    const unsubscribeProduct = onSnapshot(productDocRef, 
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          setProduct(fromFirestoreToProduct(docSnapshot));
        } else {
          setError("Товар не найден.");
          setProduct(null);
        }
        setIsLoadingProduct(false);
      },
      (err) => {
        console.error("Error fetching product:", err);
        setError("Не удалось загрузить информацию о товаре.");
        setIsLoadingProduct(false);
      }
    );
    return () => unsubscribeProduct();
  }, [productId]);

  // Messages real-time listener
  useEffect(() => {
    if (!productId || !currentUserId || !product || product.userId === currentUserId || !showChat) {
      // Don't fetch messages if no product, no current user, it's user's own ad, or chat is not shown
      if (product && product.userId === currentUserId) setMessages([]); // Clear messages if own ad
      return;
    }

    setIsLoadingMessages(true);
    const q = query(
      collection(db, 'messages'),
      where('adId', '==', productId),
      // To get messages between current user and seller:
      // This is tricky with Firestore's OR limitations. Usually, you structure data for this.
      // A common way: store participants array: `participants: [userId1, userId2]`
      // Then query: `where('participants', 'array-contains', currentUserId)`
      // For now, simpler query and local filter (less efficient for many messages):
      orderBy('timestamp', 'asc')
    );

    const unsubscribeMessages = onSnapshot(q,
      (querySnapshot) => {
        const fetchedMessages = querySnapshot.docs
            .map(fromFirestoreToMessage)
            .filter(msg => (msg.senderId === currentUserId && msg.receiverId === product.userId) || (msg.senderId === product.userId && msg.receiverId === currentUserId) );
        
        setMessages(fetchedMessages);
        if (fetchedMessages.some(msg => msg.receiverId === currentUserId && !msg.read)) {
            chatService.markMessagesAsRead(productId, currentUserId); // Mark as read
        }
        setIsLoadingMessages(false);
      },
      (err) => {
        console.error("Error fetching messages:", err);
        // Handle error display for messages if needed
        setIsLoadingMessages(false);
      }
    );
    return () => unsubscribeMessages();
  }, [productId, currentUserId, product, showChat]); // Re-run if product changes (to get seller ID) or showChat changes


  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !product || !currentUserId || product.userId === currentUserId) return;
    setIsSendingMessage(true);
    try {
      // sendMessage will use serverTimestamp, UI will update via onSnapshot
      await chatService.sendMessage(product.id, currentUserId, product.userId, newMessageText.trim());
      setNewMessageText('');
    } catch (err) {
      console.error("Failed to send message:", err);
      // Show error to user, e.g., set an error state
    } finally {
      setIsSendingMessage(false);
    }
  };


  if (isLoadingProduct) return <Spinner fullPage />;
  if (error) return <div className="text-center text-red-500 dark:text-red-400 p-8">{error} <Button onClick={() => navigate('/')}>На главную</Button></div>;
  if (!product) return <div className="text-center text-slate-600 dark:text-slate-300 p-8">Товар не найден. <Button onClick={() => navigate('/')}>На главную</Button></div>;

  const images = product.images && product.images.length > 0 ? product.images : [`${DEFAULT_PLACEHOLDER_IMAGE}${product.id}`];
  const isOwnAd = currentUserId && product.userId === currentUserId;

  return (
    <div className="container mx-auto px-2 sm:px-4 py-8">
      <Button onClick={() => navigate(-1)} variant="ghost" size="sm" className="mb-4">
        <i className="fa-solid fa-arrow-left mr-2"></i> Назад
      </Button>
      <div className="bg-light-primary dark:bg-dark-primary shadow-xl rounded-lg overflow-hidden">
        <div className="md:flex">
          {/* Image Gallery */}
          <div className="md:w-1/2 p-4">
            <div className="relative aspect-w-4 aspect-h-3 mb-2">
              <img 
                src={images[currentImageIndex]} 
                alt={product.title} 
                className="w-full h-full object-contain rounded-lg max-h-[500px]"
                onError={(e) => { (e.target as HTMLImageElement).src = `${DEFAULT_PLACEHOLDER_IMAGE}${product.id}`; }}
              />
            </div>
            {images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto p-1">
                {images.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`${product.title} - ${index + 1}`}
                    className={`w-20 h-20 object-cover rounded cursor-pointer border-2 ${index === currentImageIndex ? 'border-sky-500 dark:border-dark-accent' : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'}`}
                    onClick={() => setCurrentImageIndex(index)}
                    onError={(e) => { (e.target as HTMLImageElement).src = `${DEFAULT_PLACEHOLDER_IMAGE}${product.id}${index}`; }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="md:w-1/2 p-6 flex flex-col">
            <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">{product.title}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              {listingService.getCategoryName(product.category)} &raquo; {listingService.getSubcategoryName(product.category, product.subcategory)}
            </p>
            <p className="text-3xl font-extrabold text-sky-600 dark:text-dark-accent mb-6">
              {product.price.toLocaleString('uk-UA')} {CURRENCY_SYMBOL}
            </p>
            
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">Описание</h2>
                <p className="text-slate-700 dark:text-dark-text-secondary whitespace-pre-wrap leading-relaxed">{product.description}</p>
            </div>

            <div className="mt-auto">
              <Input
                label="Контакт продавца"
                value={product.contactInfo || 'Не указано'}
                readOnly
                wrapperClassName="mb-4"
                className="bg-slate-100 dark:bg-slate-700 cursor-default"
              />
              {currentUserId ? ( 
                isOwnAd ? (
                  <Button onClick={() => navigate(`/edit-listing/${product.id}`)} variant="secondary" className="w-full" leftIcon={<i className="fa-solid fa-edit"/>}>
                      Редактировать объявление
                    </Button>
                ) : (
                  <Button onClick={() => setShowChat(s => !s)} variant="primary" className="w-full" leftIcon={<i className="fa-solid fa-comments"/>}>
                    {showChat ? 'Скрыть чат' : 'Написать продавцу'}
                  </Button>
                )
              ) : (
                 <p className="text-sm text-center text-slate-500 dark:text-slate-400">Войдите, чтобы связаться с продавцом.</p>
              )}
            </div>
          </div>
        </div>
        
        {currentUserId && !isOwnAd && showChat && (
          <div className="border-t border-slate-200 dark:border-slate-700 p-4 sm:p-6">
            <h2 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">Чат с продавцом</h2>
             {isLoadingMessages && <div className="flex justify-center my-2"><Spinner size="sm"/></div>}
            {!isLoadingMessages && messages.length === 0 && <p className="text-center text-sm text-slate-500 dark:text-slate-400">Сообщений пока нет. Начните диалог первым!</p>}
            {!isLoadingMessages && messages.length > 0 && (
                <div className="max-h-96 overflow-y-auto mb-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-3">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-xl ${msg.senderId === currentUserId ? 'bg-sky-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-light-text-primary dark:text-dark-text-primary'}`}>
                        <p className="text-sm">{msg.text}</p>
                        <p className={`text-xs mt-1 ${msg.senderId === currentUserId ? 'text-sky-200 text-right' : 'text-slate-500 dark:text-slate-400 text-left'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                    </div>
                ))}
                </div>
            )}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Textarea
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                placeholder="Ваше сообщение..."
                rows={2}
                className="flex-grow"
                wrapperClassName="mb-0 flex-grow"
                required
              />
              <Button type="submit" isLoading={isSendingMessage} disabled={!newMessageText.trim()} className="self-end h-full">
                <i className="fa-solid fa-paper-plane"></i>
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductPage;