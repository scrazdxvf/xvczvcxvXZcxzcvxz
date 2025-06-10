
import React, { useState, useEffect, useCallback } from 'react';
import { Product, AdStatus } from '../../types';
import { listingService } from '../../services/listingService'; // For approve/reject, category names
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Textarea from '../../components/ui/Textarea';
import { CURRENCY_SYMBOL, DEFAULT_PLACEHOLDER_IMAGE } from '../../constants';
import { Link } from 'react-router-dom'; // Removed useOutletContext
import { db, collection, query, where, orderBy, onSnapshot, Timestamp } from '../../../firebaseConfig';

// Helper to convert Firestore doc to Product, converting Timestamps
const fromFirestoreToProduct = (snapshot: any): Product => {
  const data = snapshot.data();
  return {
    ...data,
    id: snapshot.id,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : data.createdAt,
  } as Product;
};

const AdminModerationQueuePage: React.FC = () => {
  // dataUpdateTrigger removed
  const [pendingListings, setPendingListings] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [listingToReject, setListingToReject] = useState<Product | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);


  useEffect(() => {
    setIsLoading(true);
    setError(null);
    const q = query(
      collection(db, 'listings'), 
      where('status', '==', AdStatus.PENDING),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const listings = querySnapshot.docs.map(fromFirestoreToProduct);
        setPendingListings(listings);
        setIsLoading(false);
      },
      (err) => {
        console.error("Error fetching pending listings:", err);
        setError('Не удалось загрузить объявления для модерации.');
        setIsLoading(false);
      }
    );
    
    return () => unsubscribe(); // Cleanup listener
  }, []);


  const handleApprove = async (id: string) => {
    setProcessingId(id);
    setIsProcessing(true);
    try {
      await listingService.approveListing(id);
      // Real-time update handled by onSnapshot, no need to manually re-fetch
    } catch (err) {
      console.error("Failed to approve listing:", err);
      setError("Ошибка при одобрении объявления.");
    } finally {
      setIsProcessing(false);
      setProcessingId(null);
    }
  };

  const openRejectionModal = (product: Product) => {
    setListingToReject(product);
    setRejectionReason('');
    setShowRejectionModal(true);
  };

  const handleReject = async () => {
    if (!listingToReject || !rejectionReason.trim()) return;
    setProcessingId(listingToReject.id);
    setIsProcessing(true);
    try {
      await listingService.rejectListing(listingToReject.id, rejectionReason.trim());
      // Real-time update handled by onSnapshot
      setShowRejectionModal(false);
      setListingToReject(null);
    } catch (err) {
      console.error("Failed to reject listing:", err);
      setError("Ошибка при отклонении объявления.");
    } finally {
      setIsProcessing(false);
      setProcessingId(null);
    }
  };
  
  useEffect(() => {
    if (window.location.hash && pendingListings.length > 0) {
      const id = window.location.hash.substring(1); 
      const element = document.getElementById(id); 
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('ring-2', 'ring-sky-500', 'dark:ring-dark-accent', 'shadow-2xl');
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-sky-500', 'dark:ring-dark-accent', 'shadow-2xl');
        }, 3000);
      }
    }
  }, [pendingListings]);


  if (isLoading && pendingListings.length === 0) return <Spinner fullPage />;
  if (error && !isLoading) return <div className="text-center text-red-500 dark:text-red-400 p-8">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-6">Модерация объявлений</h1>
      
      {isLoading && pendingListings.length > 0 && <div className="flex justify-center my-4"><Spinner /></div>}

      {!isLoading && pendingListings.length === 0 ? (
        <div className="text-center py-12 bg-light-secondary dark:bg-dark-secondary rounded-lg">
          <i className="fa-solid fa-thumbs-up text-6xl text-green-500 dark:text-green-400 mb-4"></i>
          <p className="text-xl text-slate-600 dark:text-slate-300">Все объявления проверены!</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Новых объявлений для модерации нет.</p>
        </div>
      ) : (
        !isLoading && (
          <div className="space-y-6">
            {pendingListings.map(product => (
              <div key={product.id} id={`listing-${product.id}`} className="bg-light-primary dark:bg-dark-secondary shadow-lg rounded-lg p-4 sm:p-6 transition-all duration-300">
                <div className="flex flex-col sm:flex-row gap-4">
                  <img 
                    src={product.images && product.images.length > 0 ? product.images[0] : `${DEFAULT_PLACEHOLDER_IMAGE}${product.id}`} 
                    alt={product.title} 
                    className="w-full sm:w-40 h-40 object-cover rounded-md flex-shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).src = `${DEFAULT_PLACEHOLDER_IMAGE}${product.id}`; }}
                  />
                  <div className="flex-grow">
                    <Link to={`/product/${product.id}`} target="_blank" rel="noopener noreferrer">
                      <h2 className="text-xl font-semibold text-sky-600 dark:text-dark-accent hover:underline mb-1">{product.title}</h2>
                    </Link>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                      {listingService.getCategoryName(product.category)} &raquo; {listingService.getSubcategoryName(product.category, product.subcategory)}
                    </p>
                    <p className="text-lg font-bold text-light-text-primary dark:text-dark-text-primary mb-2">
                      {product.price.toLocaleString('uk-UA')} {CURRENCY_SYMBOL}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 line-clamp-3">{product.description}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Пользователь: {product.userId} | Контакт: {product.contactInfo || 'Не указан'} | Дата: {new Date(product.createdAt).toLocaleString('uk-UA')}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                  <Button variant="secondary" size="sm" onClick={() => window.open(`/product/${product.id}`, '_blank')} leftIcon={<i className="fa-solid fa-eye"/>}>
                      Открыть в новой вкладке
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={() => handleApprove(product.id)} 
                    isLoading={isProcessing && processingId === product.id && listingToReject?.id !== product.id}
                    disabled={isProcessing}
                    leftIcon={<i className="fa-solid fa-check"/>}
                    className="bg-green-500 hover:bg-green-600 focus:ring-green-500"
                  >
                    Одобрить
                  </Button>
                  <Button 
                    variant="danger" 
                    onClick={() => openRejectionModal(product)}
                    isLoading={isProcessing && processingId === product.id && listingToReject?.id === product.id}
                    disabled={isProcessing}
                    leftIcon={<i className="fa-solid fa-times"/>}
                  >
                    Отклонить
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      <Modal isOpen={showRejectionModal} onClose={() => setShowRejectionModal(false)} title={`Отклонить объявление: ${listingToReject?.title || ''}`}>
        {listingToReject && (
          <form onSubmit={(e) => { e.preventDefault(); handleReject(); }}>
            <Textarea
              label="Причина отклонения (обязательно)"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Укажите причину, по которой объявление отклоняется..."
              rows={4}
              required
              className="mb-4"
              wrapperClassName="mb-4"
            />
            <div className="flex justify-end space-x-3">
              <Button type="button" variant="secondary" onClick={() => setShowRejectionModal(false)} disabled={isProcessing && processingId === listingToReject.id}>
                Отмена
              </Button>
              <Button type="submit" variant="danger" isLoading={isProcessing && processingId === listingToReject.id} disabled={!rejectionReason.trim() || (isProcessing && processingId === listingToReject.id)}>
                Отклонить
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default AdminModerationQueuePage;