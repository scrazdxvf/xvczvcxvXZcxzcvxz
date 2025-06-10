
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Product, AdStatus } from '../../types';
import { listingService } from '../../services/listingService'; // For delete, category names
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { CURRENCY_SYMBOL, DEFAULT_PLACEHOLDER_IMAGE } from '../../constants';
import { Link, useNavigate, useLocation } from 'react-router-dom'; // Removed useOutletContext
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { db, collection, query, orderBy, onSnapshot, Timestamp } from '../../../firebaseConfig'; // No where for all

// Helper to convert Firestore doc to Product, converting Timestamps
const fromFirestoreToProduct = (snapshot: any): Product => {
  const data = snapshot.data();
  return {
    ...data,
    id: snapshot.id,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : data.createdAt,
  } as Product;
};

const AdminManageListingsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // dataUpdateTrigger removed

  const [allListingsMaster, setAllListingsMaster] = useState<Product[]>([]); // Master list from Firestore
  const [filteredListings, setFilteredListings] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [listingToProcess, setListingToProcess] = useState<Product | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AdStatus | ''>('');

  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

  useEffect(() => {
    const statusFromQuery = queryParams.get('status') as AdStatus | '';
    if (statusFromQuery && Object.values(AdStatus).includes(statusFromQuery)) {
        setStatusFilter(statusFromQuery);
    }
  }, [queryParams]);


  useEffect(() => {
    setIsLoading(true);
    setError(null);
    const q = query(collection(db, 'listings'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const listings = querySnapshot.docs.map(fromFirestoreToProduct);
        setAllListingsMaster(listings);
        setIsLoading(false);
      },
      (err) => {
        console.error("Error fetching all listings:", err);
        setError('Не удалось загрузить все объявления.');
        setIsLoading(false);
      }
    );
    
    return () => unsubscribe(); // Cleanup listener
  }, []);


  useEffect(() => {
    let listings = [...allListingsMaster];
    if (searchTerm) {
      listings = listings.filter(p => 
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.contactInfo && p.contactInfo.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (statusFilter) {
      listings = listings.filter(p => p.status === statusFilter);
    }
    setFilteredListings(listings); // Already sorted by Firestore query
  }, [allListingsMaster, searchTerm, statusFilter]);

  const handleDeleteClick = (product: Product) => {
    setListingToProcess(product);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!listingToProcess) return;
    setProcessingId(listingToProcess.id);
    setIsProcessing(true);
    try {
      await listingService.deleteListing(listingToProcess.id);
      // Real-time update handled by onSnapshot
      setShowDeleteModal(false);
      setListingToProcess(null);
    } catch (err) {
      console.error("Failed to delete listing:", err);
      setError("Ошибка при удалении объявления.");
    } finally {
      setIsProcessing(false);
      setProcessingId(null);
    }
  };
  
  const handleEdit = (product: Product) => {
    navigate(`/edit-listing/${product.id}?admin=true`); 
  };

  const statusOptions = [
    { value: '', label: 'Все статусы' },
    { value: AdStatus.ACTIVE, label: 'Активные' },
    { value: AdStatus.PENDING, label: 'На проверке' },
    { value: AdStatus.REJECTED, label: 'Отклоненные' },
  ];

  const getStatusBadgeColor = (status: AdStatus) => {
    switch (status) {
      case AdStatus.ACTIVE: return "bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100";
      case AdStatus.PENDING: return "bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100";
      case AdStatus.REJECTED: return "bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100";
      default: return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100";
    }
  };
  const getStatusText = (status: AdStatus) => {
    switch (status) {
      case AdStatus.ACTIVE: return "Активно";
      case AdStatus.PENDING: return "На проверке";
      case AdStatus.REJECTED: return "Отклонено";
      default: return status;
    }
  };


  if (isLoading && filteredListings.length === 0) return <Spinner fullPage />;
  if (error && !isLoading) return <div className="text-center text-red-500 dark:text-red-400 p-8">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-6">Управление объявлениями</h1>
      
      <div className="mb-6 p-4 bg-light-secondary dark:bg-dark-secondary rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input 
            placeholder="Поиск по названию, ID, контакту..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            wrapperClassName="mb-0"
          />
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as AdStatus | '')}
            placeholder="Все статусы"
            wrapperClassName="mb-0"
          />
        </div>
      </div>

      {isLoading && filteredListings.length === 0 && <div className="flex justify-center my-4"><Spinner /></div>}

      {!isLoading && filteredListings.length === 0 ? (
        <div className="text-center py-12">
          <i className="fa-solid fa-folder-open text-6xl text-slate-400 dark:text-slate-500 mb-4"></i>
          <p className="text-xl text-slate-600 dark:text-slate-300">Объявления не найдены.</p>
        </div>
      ) : (
        !isLoading && (
          <div className="overflow-x-auto bg-light-primary dark:bg-dark-primary shadow-md rounded-lg">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Товар</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Цена</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Пользователь</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Статус</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Дата</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredListings.map(product => (
                  <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img 
                            className="h-10 w-10 rounded-md object-cover" 
                            src={product.images && product.images.length > 0 ? product.images[0] : `${DEFAULT_PLACEHOLDER_IMAGE}${product.id}`} 
                            alt="" 
                            onError={(e) => { (e.target as HTMLImageElement).src = `${DEFAULT_PLACEHOLDER_IMAGE}${product.id}`; }}
                          />
                        </div>
                        <div className="ml-4">
                          <Link to={`/product/${product.id}`} target="_blank" className="text-sm font-medium text-sky-600 dark:text-dark-accent hover:underline truncate max-w-xs block" title={product.title}>
                            {product.title}
                          </Link>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{listingService.getCategoryName(product.category)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-light-text-primary dark:text-dark-text-primary">{product.price.toLocaleString('uk-UA')} {CURRENCY_SYMBOL}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      <div>{product.userId}</div>
                      {product.contactInfo && <div className="text-xs">{product.contactInfo}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(product.status)}`}>
                        {getStatusText(product.status)}
                      </span>
                      {product.status === AdStatus.REJECTED && product.rejectionReason && (
                        <div className="text-xs text-red-600 mt-1 truncate" title={product.rejectionReason}>Причина: {product.rejectionReason}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{new Date(product.createdAt).toLocaleDateString('uk-UA')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(product)} title="Редактировать" className="!p-1.5">
                        <i className="fa-solid fa-edit text-sky-600 dark:text-dark-accent"></i>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(product)} title="Удалить" className="!p-1.5" disabled={isProcessing && processingId === product.id}>
                        <i className="fa-solid fa-trash-can text-red-500"></i>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Подтвердить удаление">
        {listingToProcess && (
          <div>
            <p className="text-slate-700 dark:text-dark-text-secondary mb-4">
              Вы уверены, что хотите удалить объявление "{listingToProcess.title}"? Это действие необратимо.
            </p>
            <div className="flex justify-end space-x-3">
              <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={isProcessing && processingId === listingToProcess.id}>
                Отмена
              </Button>
              <Button variant="danger" onClick={confirmDelete} isLoading={isProcessing && processingId === listingToProcess.id} disabled={isProcessing && processingId === listingToProcess.id}>
                Удалить
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminManageListingsPage;