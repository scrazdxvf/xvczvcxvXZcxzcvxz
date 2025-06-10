
import React, { useState, useEffect, FormEvent } from 'react';
import { Product, AdStatus, TelegramUser } from '../../types';
import { CATEGORIES, CURRENCY_SYMBOL, DEFAULT_PLACEHOLDER_IMAGE, MAX_IMAGES_PER_AD } from '../../constants';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';
import CategorySelector from './CategorySelector';
import { useOutletContext } from 'react-router-dom';

interface ProductFormProps {
  initialProduct?: Product;
  onSubmit: (productData: Omit<Product, 'id' | 'createdAt' | 'status'> | Product) => Promise<void>;
  isSubmitting: boolean;
  submitButtonText?: string;
}

interface FormErrors {
  title?: string;
  description?: string;
  price?: string;
  category?: string;
  subcategory?: string;
  images?: string;
  contactInfo?: string;
  userId?: string; // For cases where user ID might be missing
}

interface OutletContextType {
  currentUserId?: string;
  currentUserFull?: TelegramUser | null;
}


const ProductForm: React.FC<ProductFormProps> = ({
  initialProduct,
  onSubmit,
  isSubmitting,
  submitButtonText = 'Разместить объявление'
}) => {
  const { currentUserId, currentUserFull } = useOutletContext<OutletContextType>();

  const [title, setTitle] = useState(initialProduct?.title || '');
  const [description, setDescription] = useState(initialProduct?.description || '');
  const [price, setPrice] = useState<string>(initialProduct?.price?.toString() || '');
  const [selectedCategory, setSelectedCategory] = useState(initialProduct?.category || '');
  const [selectedSubcategory, setSelectedSubcategory] = useState(initialProduct?.subcategory || '');
  const [images, setImages] = useState<string[]>(initialProduct?.images || []);
  // Default contactInfo to current user's Telegram username if available and creating a new ad
  const [contactInfo, setContactInfo] = useState(initialProduct?.contactInfo || (currentUserFull?.username ? `@${currentUserFull.username}` : ''));
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (initialProduct) {
      setTitle(initialProduct.title);
      setDescription(initialProduct.description);
      setPrice(initialProduct.price.toString());
      setSelectedCategory(initialProduct.category);
      setSelectedSubcategory(initialProduct.subcategory);
      setImages(initialProduct.images);
      setContactInfo(initialProduct.contactInfo || (currentUserFull?.username ? `@${currentUserFull.username}` : ''));
    } else {
      // For new ads, prefill contact if user context is available
      if (currentUserFull?.username && !contactInfo) {
        setContactInfo(`@${currentUserFull.username}`);
      }
    }
  }, [initialProduct, currentUserFull]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!currentUserId && !initialProduct?.userId) newErrors.userId = 'Не удалось определить пользователя. Попробуйте перезагрузить приложение.';
    if (!title.trim()) newErrors.title = 'Название обязательно';
    else if (title.trim().length < 5) newErrors.title = 'Название должно быть не менее 5 символов';
    if (!description.trim()) newErrors.description = 'Описание обязательно';
    else if (description.trim().length < 20) newErrors.description = 'Описание должно быть не менее 20 символов';
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) newErrors.price = 'Цена должна быть положительным числом';
    if (!selectedCategory) newErrors.category = 'Выберите категорию';
    const cat = CATEGORIES.find(c => c.id === selectedCategory);
    if (cat && cat.subcategories.length > 0 && !selectedSubcategory) {
      newErrors.subcategory = 'Выберите подкатегорию';
    }
    if (images.length === 0 || images.every(img => !img.trim())) newErrors.images = 'Добавьте хотя бы одну фото (ссылку)';
    if (!contactInfo.trim()) newErrors.contactInfo = 'Укажите контактную информацию (напр. Telegram username)';


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const finalUserId = initialProduct?.userId || currentUserId;
    if (!finalUserId) {
        setErrors(prev => ({...prev, userId: 'Не удалось определить пользователя для сохранения объявления.'}));
        return;
    }

    const productData = {
      title,
      description,
      price: parseFloat(price),
      category: selectedCategory,
      subcategory: selectedSubcategory,
      images: images.filter(img => img.trim()).length > 0 ? images.filter(img => img.trim()) : [`${DEFAULT_PLACEHOLDER_IMAGE}${Date.now()}`],
      userId: finalUserId, 
      contactInfo,
      ...(initialProduct ? { 
        id: initialProduct.id, 
        createdAt: initialProduct.createdAt, 
        status: initialProduct.status, // Status will be handled by service or EditPage logic
        rejectionReason: initialProduct.rejectionReason,
      } : {})
    };
    
    await onSubmit(productData as Product | Omit<Product, 'id' | 'createdAt' | 'status'> );
  };

  const handleImageInputChange = (index: number, value: string) => {
    const newImages = [...images];
    newImages[index] = value;
    setImages(newImages);
  };

  const addImageField = () => {
    if (images.length < MAX_IMAGES_PER_AD) {
      setImages([...images, '']);
    }
  };

  const removeImageField = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (images.length === 0) {
      setImages(['']);
    }
  }, []);


  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4 sm:p-6 bg-light-primary dark:bg-dark-primary rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-6">
        {initialProduct ? 'Редактировать объявление' : 'Новое объявление'}
      </h2>
      
      {errors.userId && <p className="my-2 text-sm text-red-500 text-center p-3 bg-red-100 dark:bg-red-900 rounded-md">{errors.userId}</p>}

      <Input
        id="title"
        name="title"
        label="Название товара/услуги"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={errors.title}
        placeholder="Например, iPhone 14 Pro Max 256GB"
        required
      />
      
      <Textarea
        id="description"
        name="description"
        label="Подробное описание"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        error={errors.description}
        placeholder="Опишите состояние, комплектацию, особенности товара..."
        rows={5}
        required
      />

      <Input
        id="price"
        name="price"
        type="number"
        label={`Цена (${CURRENCY_SYMBOL})`}
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        error={errors.price}
        placeholder="25000"
        min="0"
        step="any"
        required
      />

      <CategorySelector
        selectedCategory={selectedCategory}
        selectedSubcategory={selectedSubcategory}
        onCategoryChange={setSelectedCategory}
        onSubcategoryChange={setSelectedSubcategory}
        categoryError={errors.category}
        subcategoryError={errors.subcategory}
      />

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-dark-text-secondary mb-1">
          Фотографии (ссылки)
        </label>
        {images.map((imgUrl, index) => (
          <div key={index} className="flex items-center mb-2">
            <Input
              type="url"
              placeholder={`https://picsum.photos/600/400?random=${index + 1}`}
              value={imgUrl}
              onChange={(e) => handleImageInputChange(index, e.target.value)}
              wrapperClassName="flex-grow mb-0"
              className="mr-2"
            />
            {images.length > 1 && (images.length > 1 || imgUrl.trim() !== '') && (
              <Button type="button" variant="danger" size="sm" onClick={() => removeImageField(index)}>
                <i className="fa-solid fa-trash-can"></i>
              </Button>
            )}
          </div>
        ))}
        {images.length < MAX_IMAGES_PER_AD && (
          <Button type="button" variant="secondary" size="sm" onClick={addImageField} leftIcon={<i className="fa-solid fa-plus"></i>}>
            Добавить фото
          </Button>
        )}
        {errors.images && <p className="mt-1 text-xs text-red-500">{errors.images}</p>}
         <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Вставьте прямые ссылки на изображения. Используйте, например, picsum.photos или imgbb.com.</p>
      </div>

       <Input
        id="contactInfo"
        name="contactInfo"
        label="Контактная информация (например, ваш Telegram @username)"
        value={contactInfo}
        onChange={(e) => setContactInfo(e.target.value)}
        error={errors.contactInfo}
        placeholder="@your_telegram_username"
        required
      />
      
      <Button type="submit" variant="primary" size="lg" isLoading={isSubmitting} className="w-full" disabled={!currentUserId && !initialProduct?.userId}>
        {submitButtonText}
      </Button>
    </form>
  );
};

export default ProductForm;
