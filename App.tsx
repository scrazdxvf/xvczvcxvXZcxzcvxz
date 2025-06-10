
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useTheme } from './hooks/useTheme';
import { useUser } from './contexts/UserContext';
import Navbar from './components/layout/Navbar';
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import CreateListingPage from './pages/CreateListingPage';
import MyListingsPage from './pages/MyListingsPage';
import EditListingPage from './pages/EditListingPage';
import MessagesPage from './pages/MessagesPage';
import Spinner from './components/ui/Spinner';

import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminModerationQueuePage from './pages/admin/AdminModerationQueuePage';
import AdminManageListingsPage from './pages/admin/AdminManageListingsPage';
// Removed LISTINGS_STORAGE_KEY and CHAT_STORAGE_KEY imports as they are no longer needed for storage events


const App: React.FC = () => {
  const [theme] = useTheme();
  const { currentUser, isLoading: isUserLoading, error: userError } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  // dataUpdateTrigger removed, Firebase onSnapshot will handle real-time updates

  useEffect(() => {
    const adminLoggedIn = sessionStorage.getItem('isAdminLoggedIn');
    if (adminLoggedIn === 'true') {
      setIsAdmin(true);
    }
    setIsCheckingAdmin(false);
  }, []);

  // Storage event listener removed

  useEffect(() => {
    const errorOverlay = document.getElementById('telegram-sdk-error-overlay');
    const errorMessageElement = document.getElementById('telegram-sdk-error-message');
    const appLoadingIndicator = document.getElementById('app-loading-indicator');

    if ((isUserLoading || isCheckingAdmin) && appLoadingIndicator) {
      appLoadingIndicator.style.display = 'flex';
    } else if (appLoadingIndicator) {
      appLoadingIndicator.style.display = 'none';
    }

    if (userError && errorOverlay && errorMessageElement) {
      errorMessageElement.textContent = userError;
      errorOverlay.style.display = 'flex';
    } else if (errorOverlay) {
       if(!userError) errorOverlay.style.display = 'none';
    }
  }, [isUserLoading, isCheckingAdmin, userError]);

  const handleAdminLoginSuccess = () => {
    sessionStorage.setItem('isAdminLoggedIn', 'true');
    setIsAdmin(true);
    // dataUpdateTrigger removed
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('isAdminLoggedIn');
    setIsAdmin(false);
    // dataUpdateTrigger removed
  };
  
  const MainLayout: React.FC = () => (
    <>
      <Navbar currentUser={currentUser} isAdmin={isAdmin} onLogout={handleAdminLogout} />
      <main className="flex-grow bg-light-primary dark:bg-dark-primary text-light-text-primary dark:text-dark-text-primary pt-2 pb-16 md:pb-2">
        {/* dataUpdateTrigger removed from context */}
        <Outlet context={{ currentUserId: currentUser?.id, currentUserFull: currentUser }} />
      </main>
    </>
  );

  const AdminLayout: React.FC = () => (
    <>
      <Navbar currentUser={currentUser} isAdmin={isAdmin} onLogout={handleAdminLogout} />
      <main className="flex-grow bg-light-secondary dark:bg-dark-secondary text-light-text-primary dark:text-dark-text-primary pt-4 pb-16 md:pb-2">
         {/* dataUpdateTrigger removed from context */}
        <Outlet context={{ currentUserId: currentUser?.id, currentUserFull: currentUser, isAdmin }} />
      </main>
    </>
  );

  const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (isCheckingAdmin) {
      return <Spinner fullPage />;
    }
    return isAdmin ? <>{children}</> : <Navigate to="/admin/login" replace />;
  };

  if (isUserLoading || isCheckingAdmin) {
    return <Spinner fullPage />; 
  }
  
  return (
    <HashRouter>
      <div className={`min-h-screen flex flex-col theme-${theme}`}>
        <Routes>
          {/* User Facing Routes */}
          { (!isAdmin && (currentUser || !userError) ) && ( 
            <Route element={<MainLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/product/:id" element={<ProductPage />} />
              <Route path="/create-listing" element={<CreateListingPage />} />
              <Route path="/edit-listing/:id" element={<EditListingPage />} />
              <Route path="/my-listings" element={<MyListingsPage />} />
              <Route path="/messages" element={<MessagesPage />} />
            </Route>
          )}

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLoginPage onLoginSuccess={handleAdminLoginSuccess} />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedAdminRoute>
                <AdminLayout />
              </ProtectedAdminRoute>
            }
          >
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="moderation" element={<AdminModerationQueuePage />} />
            <Route path="manage-listings" element={<AdminManageListingsPage />} />
            <Route index element={<Navigate to="dashboard" replace />} /> 
          </Route>
          
           <Route 
            path="*" 
            element={
              isAdmin 
                ? <Navigate to="/admin/dashboard" replace /> 
                : (currentUser || !userError) 
                  ? <Navigate to="/" replace />
                  : <Navigate to="/admin/login" replace /> // Fallback if user is null and error (e.g. not in TG)
            } 
          />
        </Routes>
      </div>
    </HashRouter>
  );
};

export default App;