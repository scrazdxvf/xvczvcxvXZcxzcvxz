
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useOutletContext, useLocation } from 'react-router-dom';
import ProductForm from '../components/product/ProductForm';
import { listingService } from '../services/listingService';
import { Product, AdStatus, TelegramUser } from '../types';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';

interface OutletContextType {
  currentUserId?: string;
  currentUserFull?: TelegramUser | null;
}

const EditListingPage: React.FC = () => {
  const navigate = useNavigate();
  const { id: productId } = useParams<{ id: string }>();
  const { currentUserId } = useOutletContext<OutletContextType>();
  const location = useLocation();
  
  const queryParams = new URLSearchParams(location.search);
  const isAdminEdit = queryParams.get('admin') === 'true'; // Check if admin is editing

  const [initialProduct, setInitialProduct] = useState<Product | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) {
      setError("ID объявления не указан.");
      setIsLoading(false);
      return;
    }
    if (!currentUserId && !isAdminEdit) { // Regular user needs ID to check ownership
        setError("Не удалось определить пользователя. Авторизация не пройдена.");
        setIsLoading(false);
        return;
    }

    const fetchProduct = async () => {
      setIsLoading(true);
      try {
        const product = await listingService.getListingById(productId);
        if (product) {
          if (isAdminEdit || product.userId === currentUserId) { // Admin can edit any, user can edit own
            setInitialProduct(product);
          } else {
             setError("У вас нет прав для редактирования этого объявления.");
          }
        } else {
          setError("Объявление не найдено.");
        }
      } catch (err) {
        console.error("Failed to fetch product for editing:", err);
        setError("Не удалось загрузить объявление для редактирования.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [productId, currentUserId, isAdminEdit]);

  const handleSubmit = async (productData: Product) => { 
    setIsSubmitting(true);
    setError(null);
    if (!initialProduct) return;

    try {
      let finalStatus = productData.status; // Keep status from form if admin is editing and potentially changed it
      
      if (!isAdminEdit) { // If user is editing
        // If it was active and user edits, send to pending for re-moderation.
        // If it was rejected/pending, send to pending.
         finalStatus = AdStatus.PENDING;
      }
      
      const updatedProductData: Product = {
        ...productData,
        status: finalStatus, 
      };

      await listingService.updateListing(initialProduct.id, updatedProductData);
      
      if (isAdminEdit) {
        navigate('/admin/manage-listings'); // Admin goes back to management page
      } else {
        navigate(`/my-listings`); // User goes back to their listings
      }

    } catch (err) {
      console.error("Failed to update listing:", err);
      setError('Не удалось обновить объявление. Пожалуйста, попробуйте еще раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || (!isAdminEdit && !currentUserId && !initialProduct)) return <Spinner fullPage />; // Show spinner if user context still loading for non-admin
  
  if (error) {
    return (
        <div className="container mx-auto px-2 sm:px-4 py-8 text-center">
            <p className="text-red-500 dark:text-red-400 p-4 mb-4 bg-red-100 dark:bg-red-900 rounded-md">{error}</p>
            <Button onClick={() => navigate(isAdminEdit ? '/admin/manage-listings' : '/my-listings')}>
                {isAdminEdit ? 'К управлению объявлениями' : 'К моим объявлениям'}
            </Button>
        </div>
    );
  }
  
  if (!initialProduct) {
      return (
          <div className="container mx-auto px-2 sm:px-4 py-8 text-center">
              <p className="text-slate-600 dark:text-slate-300 p-8">Объявление не найдено или у вас нет прав на его редактирование.</p>
          </div>
      );
  }


  return (
    <div className="container mx-auto px-2 sm:px-4 py-8">
      <Button onClick={() => navigate(-1)} variant="ghost" size="sm" className="mb-4">
        <i className="fa-solid fa-arrow-left mr-2"></i> Назад
      </Button>
      <ProductForm
        initialProduct={initialProduct}
        onSubmit={handleSubmit as (data: Omit<Product, 'id' | 'createdAt' | 'status' | 'userId'> | Product) => Promise<void>}
        isSubmitting={isSubmitting}
        submitButtonText={isAdminEdit ? "Сохранить (Админ)" : "Сохранить и отправить на проверку"}
      />
      {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
    </div>
  );
};

export default EditListingPage;
