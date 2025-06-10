
import React from 'react';
import { Link } from 'react-router-dom';
import { Product, AdStatus } from '../../types';
import { CURRENCY_SYMBOL, DEFAULT_PLACEHOLDER_IMAGE } from '../../constants';
import { listingService } from '../../services/listingService';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const imageUrl = product.images && product.images.length > 0 ? product.images[0] : `${DEFAULT_PLACEHOLDER_IMAGE}${product.id}`;
  
  const getStatusBadge = () => {
    switch (product.status) {
      case AdStatus.PENDING:
        return <span className="absolute top-2 right-2 bg-yellow-400 text-yellow-800 text-xs font-semibold px-2 py-1 rounded-full">На проверке</span>;
      case AdStatus.REJECTED:
        return <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full">Отклонено</span>;
      case AdStatus.ACTIVE:
         return <span className="absolute top-2 right-2 bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100 text-xs font-semibold px-2 py-1 rounded-full">Активно</span>; // Or no badge for active
      default:
        return null;
    }
  };

  return (
    <Link to={`/product/${product.id}`} className="block group">
      <div className="bg-light-secondary dark:bg-dark-secondary rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col h-full">
        <div className="relative aspect-w-16 aspect-h-9 overflow-hidden">
          <img 
            src={imageUrl} 
            alt={product.title} 
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" 
            onError={(e) => { (e.target as HTMLImageElement).src = `${DEFAULT_PLACEHOLDER_IMAGE}${product.id}`; }}
          />
          {getStatusBadge()}
        </div>
        <div className="p-4 flex flex-col flex-grow">
          <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-1 truncate group-hover:text-sky-600 dark:group-hover:text-dark-accent transition-colors">
            {product.title}
          </h3>
          <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mb-2">
            {listingService.getCategoryName(product.category)} &raquo; {listingService.getSubcategoryName(product.category, product.subcategory)}
          </p>
          <p className="text-xl font-bold text-sky-600 dark:text-dark-accent mb-3 mt-auto">
            {product.price.toLocaleString('uk-UA')} {CURRENCY_SYMBOL}
          </p>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {new Date(product.createdAt).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;