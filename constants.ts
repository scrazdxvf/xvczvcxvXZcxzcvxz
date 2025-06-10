

import { Category } from './types';

export const APP_NAME = "СКР БАРАХОЛКА";
export const CURRENCY_SYMBOL = "₴"; // Hryvnia
export const ADMIN_PASSWORD = "6664433grandtheftscrazo$";

export const ADMIN_TELEGRAM_IDS = ['5223134286', '1258306425']; // ID пользователей, которые могут войти в админку

export const CATEGORIES: Category[] = [
  {
    id: 'clothing',
    name: 'Одежда',
    icon: 'fa-solid fa-shirt',
    subcategories: [
      { id: 'sneakers', name: 'Кроссовки', icon: 'fa-solid fa-shoe-prints' },
      { id: 'pants', name: 'Штаны', icon: 'fa-solid fa-person-hiking' }, // Using a generic icon
      { id: 'hoodies', name: 'Худи', icon: 'fa-solid fa-user-secret' }, // Using a generic icon
      { id: 'sweatshirts', name: 'Свитшоты' },
      { id: 't-shirts', name: 'Футболки' },
      { id: 'jackets', name: 'Куртки' },
      { id: 'dresses', name: 'Платья' },
      { id: 'accessories', name: 'Аксессуары' },
    ],
  },
  {
    id: 'digital-goods',
    name: 'Цифровые товары',
    icon: 'fa-solid fa-laptop-code',
    subcategories: [
      { id: 'game-accounts', name: 'Аккаунты в играх', icon: 'fa-solid fa-gamepad' },
      { id: 'telegram-accounts', name: 'Telegram аккаунты', icon: 'fa-brands fa-telegram' },
      { id: 'telegram-stars', name: 'Telegram звёзды' },
      { id: 'subscriptions', name: 'Подписки', icon: 'fa-solid fa-credit-card' },
      { id: 'in-game-currency', name: 'Игровая валюта', icon: 'fa-solid fa-coins' },
      { id: 'software-licenses', name: 'Лицензии ПО' },
      { id: 'ebooks', name: 'Электронные книги' },
    ],
  },
  {
    id: 'vapes',
    name: 'Поды/Вейпы',
    icon: 'fa-solid fa-smoking',
    subcategories: [
      { id: 'vape-liquids', name: 'Жидкости для вейпов' },
      { id: 'cartridges', name: 'Картриджи' },
      { id: 'vape-devices', name: 'Вейпы' },
      { id: 'pod-systems', name: 'POD-системы' },
      { id: 'disposable-vapes', name: 'Одноразовые вейпы' },
    ],
  },
  {
    id: 'electronics',
    name: 'Техника',
    icon: 'fa-solid fa-mobile-screen-button',
    subcategories: [
      { id: 'phones', name: 'Телефоны', icon: 'fa-solid fa-mobile-alt' },
      { id: 'headphones', name: 'Наушники', icon: 'fa-solid fa-headphones' },
      { id: 'tablets', name: 'Планшеты', icon: 'fa-solid fa-tablet-alt' },
      { id: 'laptops', name: 'Ноутбуки', icon: 'fa-solid fa-laptop' },
      { id: 'tvs', name: 'Телевизоры', icon: 'fa-solid fa-tv' },
      { id: 'cameras', name: 'Фотоаппараты' },
      { id: 'smartwatches', name: 'Смарт-часы' },
    ],
  },
  {
    id: 'services',
    name: 'Услуги',
    icon: 'fa-solid fa-handshake-angle',
    subcategories: [
      { id: 'tutoring', name: 'Репетиторство' },
      { id: 'design', name: 'Дизайн' },
      { id: 'programming', name: 'Программирование' },
      { id: 'repairs', name: 'Ремонтные услуги' },
    ],
  },
  {
    id: 'other',
    name: 'Другое',
    icon: 'fa-solid fa-ellipsis',
    subcategories: [
      { id: 'various', name: 'Разное' },
    ],
  },
];

export const DEFAULT_PLACEHOLDER_IMAGE = 'https://picsum.photos/600/400?random=';
export const MAX_IMAGES_PER_AD = 5;
export const MOCK_DEV_USER_ID = '000000_dev_user'; // For development outside Telegram
