
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Product, AdStatus } from '../types';
// import { listingService } from '../services/listingService'; // Direct Firestore usage below
import ProductCard from '../components/product/ProductCard';
import Spinner from '../components/ui/Spinner';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { CATEGORIES, CURRENCY_SYMBOL } from '../constants';
import Button from '../components/ui/Button';
// import { useOutletContext } from 'react-router-dom'; // No longer needed for dataUpdateTrigger
import { db, collection, query, where, orderBy, onSnapshot, Timestamp } from '../../firebaseConfig';
import { listingService } from '../services/listingService'; // For getCategoryName, getSubcategoryName

// Helper to convert Firestore doc to Product, converting Timestamps
const fromFirestoreToProduct = (snapshot: any): Product => {
  const data = snapshot.data();
  return {
    ...data,
    id: snapshot.id,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : data.createdAt,
  } as Product;
};

const HomePage: React.FC = () => {
  // dataUpdateTrigger removed from context and usage
  const [allListings, setAllListings] = useState<Product[]>([]);
  const [filteredListings, setFilteredListings] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [isFilterVisible, setIsFilterVisible] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    const q = query(
      collection(db, 'listings'), 
      where('status', '==', AdStatus.ACTIVE)
      // Sorting by 'createdAt' is default, can be adjusted by 'sortBy' state later if client-side sort is not enough
    );

    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const activeListings = querySnapshot.docs.map(fromFirestoreToProduct);
        setAllListings(activeListings);
        setIsLoading(false);
      }, 
      (err) => {
        console.error("Error fetching active listings:", err);
        setError('Не удалось загрузить объявления.');
        setIsLoading(false);
      }
    );
    
    return () => unsubscribe(); // Cleanup listener on component unmount
  }, []); // Empty dependency array means this runs once on mount to set up listener

  const subcategoriesForFilter = useMemo(() => {
    if (!selectedCategory) return [];
    const category = CATEGORIES.find(cat => cat.id === selectedCategory);
    return category ? category.subcategories : [];
  }, [selectedCategory]);

  const applyFiltersAndSort = useCallback(() => {
    let listingsToFilter = [...allListings];

    if (searchTerm) {
      listingsToFilter = listingsToFilter.filter(
        (p) =>
          p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedCategory) {
      listingsToFilter = listingsToFilter.filter(p => p.category === selectedCategory);
    }
    if (selectedSubcategory) {
      listingsToFilter = listingsToFilter.filter(p => p.subcategory === selectedSubcategory);
    }
    const min = parseFloat(minPrice);
    const max = parseFloat(maxPrice);
    if (!isNaN(min)) {
      listingsToFilter = listingsToFilter.filter(p => p.price >= min);
    }
    if (!isNaN(max)) {
      listingsToFilter = listingsToFilter.filter(p => p.price <= max);
    }
    
    switch (sortBy) {
        case 'price_asc':
            listingsToFilter.sort((a, b) => a.price - b.price);
            break;
        case 'price_desc':
            listingsToFilter.sort((a, b) => b.price - a.price);
            break;
        case 'newest':
        default:
            listingsToFilter.sort((a, b) => b.createdAt - a.createdAt); // Already sorted by Firestore if using createdAt desc
            break;
    }
    setFilteredListings(listingsToFilter);
  }, [allListings, searchTerm, selectedCategory, selectedSubcategory, minPrice, maxPrice, sortBy]);


  useEffect(() => {
    // Initial sort/filter when allListings populates or filters change
    applyFiltersAndSort();
  }, [allListings, applyFiltersAndSort]); // Rerun when allListings changes due to onSnapshot

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
    setSelectedSubcategory(''); 
  };
  
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedSubcategory('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
  };

  if (isLoading && !allListings.length) return <Spinner fullPage />;
  if (error) return <div className="text-center text-red-500 dark:text-red-400 p-8">{error}</div>;

  const categoryOptions = [
    { value: '', label: 'Все категории' },
    ...CATEGORIES.map(cat => ({ value: cat.id, label: cat.name }))
  ];

  const subcategoryOptions = [
    { value: '', label: 'Все подкатегории' },
    ...subcategoriesForFilter.map(sub => ({ value: sub.id, label: sub.name }))
  ];

  const sortOptions = [
    { value: 'newest', label: 'Сначала новые'},
    { value: 'price_asc', label: 'Цена: по возрастанию'},
    { value: 'price_desc', label: 'Цена: по убыванию'},
  ];

  return (
    <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-8">
      <div className="bg-light-secondary dark:bg-dark-secondary p-4 sm:p-6 rounded-xl shadow-md mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary">Фильтры</h2>
          <Button variant="ghost" onClick={() => setIsFilterVisible(!isFilterVisible)} size="sm">
            {isFilterVisible ? <><i className="fa-solid fa-chevron-up mr-2"></i>Свернуть</> : <><i className="fa-solid fa-chevron-down mr-2"></i>Развернуть</>}
          </Button>
        </div>
        {isFilterVisible && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-end">
            <Input
              label="Поиск по названию/описанию"
              placeholder="Что ищете?"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              wrapperClassName="mb-0"
            />
            <Select
              label="Категория"
              options={categoryOptions}
              value={selectedCategory}
              onChange={handleCategoryChange}
              placeholder="Все категории"
              wrapperClassName="mb-0"
            />
            <Select
              label="Подкатегория"
              options={subcategoryOptions}
              value={selectedSubcategory}
              onChange={(e) => setSelectedSubcategory(e.target.value)}
              disabled={!selectedCategory || subcategoriesForFilter.length === 0}
              placeholder="Все подкатегории"
              wrapperClassName="mb-0"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                label={`Цена от (${CURRENCY_SYMBOL})`}
                type="number"
                placeholder="Мин."
                value={minPrice}
                min="0"
                onChange={(e) => setMinPrice(e.target.value)}
                wrapperClassName="mb-0"
              />
              <Input
                label={`Цена до (${CURRENCY_SYMBOL})`}
                type="number"
                placeholder="Макс."
                value={maxPrice}
                min="0"
                onChange={(e) => setMaxPrice(e.target.value)}
                wrapperClassName="mb-0"
              />
            </div>
            <Select
              label="Сортировать по"
              options={sortOptions}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'price_asc' | 'price_desc')}
              placeholder="Сначала новые"
              wrapperClassName="mb-0"
            />
            <Button onClick={resetFilters} variant="secondary" className="w-full md:col-span-1 lg:col-span-1 xl:col-span-1 h-11">
              <i className="fa-solid fa-arrows-rotate mr-2"></i> Сбросить
            </Button>
          </div>
        )}
      </div>
      
      {isLoading && <div className="flex justify-center my-4"><Spinner /></div>}

      {!isLoading && filteredListings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {filteredListings.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        !isLoading && (
          <div className="text-center py-12">
            <i className="fa-solid fa-box-open text-6xl text-slate-400 dark:text-slate-500 mb-4"></i>
            <p className="text-xl text-slate-600 dark:text-slate-300">По вашему запросу ничего не найдено.</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Попробуйте изменить параметры фильтрации или <Button variant="link" onClick={resetFilters}>сбросить фильтры</Button>.</p>
          </div>
        )
      )}
    </div>
  );
};

export default HomePage;