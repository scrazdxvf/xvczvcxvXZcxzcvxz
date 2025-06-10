
import React, { useState, useEffect } from 'react';
import { CATEGORIES } from '../../constants';
import { Category, Subcategory } from '../../types';
import Select from '../ui/Select';

interface CategorySelectorProps {
  selectedCategory: string;
  selectedSubcategory: string;
  onCategoryChange: (categoryId: string) => void;
  onSubcategoryChange: (subcategoryId: string) => void;
  categoryError?: string;
  subcategoryError?: string;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategory,
  selectedSubcategory,
  onCategoryChange,
  onSubcategoryChange,
  categoryError,
  subcategoryError
}) => {
  const [currentCategory, setCurrentCategory] = useState<Category | undefined>(
    CATEGORIES.find(cat => cat.id === selectedCategory)
  );
  const [subcategories, setSubcategories] = useState<Subcategory[]>(currentCategory?.subcategories || []);

  useEffect(() => {
    const foundCategory = CATEGORIES.find(cat => cat.id === selectedCategory);
    setCurrentCategory(foundCategory);
    setSubcategories(foundCategory?.subcategories || []);
    if (foundCategory && !foundCategory.subcategories.find(sub => sub.id === selectedSubcategory)) {
      onSubcategoryChange(''); // Reset subcategory if not in new main category
    }
  }, [selectedCategory, selectedSubcategory, onSubcategoryChange]);

  const handleMainCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const categoryId = e.target.value;
    onCategoryChange(categoryId);
    onSubcategoryChange(''); // Reset subcategory when main category changes
  };

  const handleSubcategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSubcategoryChange(e.target.value);
  };

  const mainCategoryOptions = [
    { value: '', label: 'Выберите категорию', disabled: true },
    ...CATEGORIES.map(cat => ({ value: cat.id, label: cat.name }))
  ];

  const subCategoryOptions = [
    { value: '', label: 'Выберите подкатегорию', disabled: true },
    ...subcategories.map(sub => ({ value: sub.id, label: sub.name }))
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Select
        id="category"
        name="category"
        label="Категория"
        value={selectedCategory}
        onChange={handleMainCategoryChange}
        options={mainCategoryOptions}
        placeholder="Выберите категорию" // This placeholder is used by the Select component logic
        error={categoryError}
        required
      />
      {selectedCategory && subcategories.length > 0 && (
        <Select
          id="subcategory"
          name="subcategory"
          label="Подкатегория"
          value={selectedSubcategory}
          onChange={handleSubcategoryChange}
          options={subCategoryOptions}
          placeholder="Выберите подкатегорию" // This placeholder is used by the Select component logic
          disabled={!selectedCategory || subcategories.length === 0}
          error={subcategoryError}
          required
        />
      )}
    </div>
  );
};

export default CategorySelector;