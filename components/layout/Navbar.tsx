
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import Logo from '../ui/Logo';
import Button from '../ui/Button';
import { Theme, TelegramUser } from '../../types';
import { chatService } from '../../services/chatService';
import { ADMIN_TELEGRAM_IDS } from '../../constants';

interface NavbarProps {
  currentUser?: TelegramUser | null; // Changed from currentUserId to full currentUser object
  isAdmin?: boolean;
  onLogout?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentUser, isAdmin, onLogout }) => {
  const [theme, toggleTheme] = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const currentUserId = currentUser?.id; // Extract ID for existing logic

  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (currentUserId && !isAdmin) { // Only fetch for regular users
        const count = await chatService.getUnreadMessagesCountForUser(currentUserId);
        setUnreadMessages(count);
      } else {
        setUnreadMessages(0); 
      }
    };
    fetchUnreadCount();
    const intervalId = setInterval(fetchUnreadCount, 5000);
    return () => clearInterval(intervalId);
  }, [currentUserId, isAdmin, location.pathname]);


  const navLinkClasses = "px-3 py-2 rounded-md text-sm font-medium transition-colors";
  const activeNavLinkClasses = "bg-sky-100 dark:bg-sky-700 text-sky-700 dark:text-sky-200";
  const inactiveNavLinkClasses = "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700";

  const getLinkClass = (path: string) => {
    const baseClass = location.pathname === path || (path !== '/' && location.pathname.startsWith(path))
      ? `${navLinkClasses} ${activeNavLinkClasses}`
      : `${navLinkClasses} ${inactiveNavLinkClasses}`;
    return `${baseClass} block md:inline-block`;
  };
  
  const handleAdminLogoutClick = () => {
    if (onLogout) {
      onLogout();
      navigate('/'); 
    }
  };

  const isPotentialAdmin = currentUser && ADMIN_TELEGRAM_IDS.includes(currentUser.id);

  return (
    <nav className="bg-light-primary dark:bg-dark-primary shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to={isAdmin ? "/admin/dashboard" : "/"} className="flex-shrink-0">
              <Logo />
            </Link>
          </div>
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {!isAdmin && (
              <Link to="/" className={getLinkClass('/')}>
                Главная
              </Link>
            )}
            {currentUserId && !isAdmin && (
              <>
                <Link to="/my-listings" className={getLinkClass('/my-listings')}>
                  Мои объявления
                </Link>
                <Link to="/messages" className={`${getLinkClass('/messages')} relative`}>
                  Сообщения
                  {unreadMessages > 0 && (
                    <span className="absolute top-0 right-0 -mt-1 -mr-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                      {unreadMessages}
                    </span>
                  )}
                </Link>
              </>
            )}
            {isAdmin && (
              <>
                <Link to="/admin/dashboard" className={getLinkClass('/admin/dashboard')}>
                  <i className="fa-solid fa-chart-line md:mr-2"></i>Панель
                </Link>
                <Link to="/admin/moderation" className={getLinkClass('/admin/moderation')}>
                  <i className="fa-solid fa-gavel md:mr-2"></i>Модерация
                </Link>
                <Link to="/admin/manage-listings" className={getLinkClass('/admin/manage-listings')}>
                  <i className="fa-solid fa-list-check md:mr-2"></i>Объявления
                </Link>
              </>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {currentUserId && !isAdmin && (
               <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/create-listing')}
                className="hidden sm:inline-flex"
                leftIcon={<i className="fa-solid fa-plus"></i>}
              >
                Разместить
              </Button>
            )}
            {isPotentialAdmin && !isAdmin && (
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate('/admin/login')}
                    className="hidden sm:inline-flex"
                    leftIcon={<i className="fa-solid fa-user-shield"></i>}
                >
                    Админ панель
                </Button>
            )}
            {isAdmin && onLogout && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAdminLogoutClick}
                className="text-sm hidden md:inline-flex"
                leftIcon={<i className="fa-solid fa-right-from-bracket"></i>}
              >
                Выйти
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-full"
            >
              {theme === Theme.LIGHT ? <i className="fa-solid fa-moon text-xl"></i> : <i className="fa-solid fa-sun text-xl"></i>}
            </Button>
            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Open main menu"
                className="p-2 rounded-full"
              >
                {isMobileMenuOpen ? <i className="fa-solid fa-times text-xl"></i> : <i className="fa-solid fa-bars text-xl"></i>}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-700">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
             {!isAdmin && (
              <Link to="/" className={getLinkClass('/')} onClick={() => setIsMobileMenuOpen(false)}>
                Главная
              </Link>
            )}
            {currentUserId && !isAdmin && (
              <>
                <Link to="/my-listings" className={getLinkClass('/my-listings')} onClick={() => setIsMobileMenuOpen(false)}>
                  Мои объявления
                </Link>
                <Link to="/messages" className={`${getLinkClass('/messages')} relative`} onClick={() => setIsMobileMenuOpen(false)}>
                  Сообщения
                  {unreadMessages > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                      {unreadMessages}
                    </span>
                  )}
                </Link>
                 <Button
                    variant="primary"
                    size="sm"
                    onClick={() => { navigate('/create-listing'); setIsMobileMenuOpen(false); }}
                    className="w-full mt-2"
                    leftIcon={<i className="fa-solid fa-plus"></i>}
                  >
                    Разместить объявление
                  </Button>
                 {isPotentialAdmin && (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => { navigate('/admin/login'); setIsMobileMenuOpen(false); }}
                        className="w-full mt-2"
                        leftIcon={<i className="fa-solid fa-user-shield"></i>}
                    >
                        Админ панель
                    </Button>
                 )}
              </>
            )}
            {isAdmin && (
              <>
                 <Link to="/admin/dashboard" className={getLinkClass('/admin/dashboard')} onClick={() => setIsMobileMenuOpen(false)}>
                  <i className="fa-solid fa-chart-line mr-2"></i>Панель
                </Link>
                <Link to="/admin/moderation" className={getLinkClass('/admin/moderation')} onClick={() => setIsMobileMenuOpen(false)}>
                  <i className="fa-solid fa-gavel mr-2"></i>Модерация
                </Link>
                <Link to="/admin/manage-listings" className={getLinkClass('/admin/manage-listings')} onClick={() => setIsMobileMenuOpen(false)}>
                  <i className="fa-solid fa-list-check mr-2"></i>Объявления
                </Link>
                {onLogout && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { handleAdminLogoutClick(); setIsMobileMenuOpen(false); }}
                    className="w-full mt-2 justify-start text-left"
                    leftIcon={<i className="fa-solid fa-right-from-bracket"></i>}
                  >
                    Выйти (Админ)
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
