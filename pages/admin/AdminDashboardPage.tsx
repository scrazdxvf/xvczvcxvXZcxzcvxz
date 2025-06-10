
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom'; // Removed useOutletContext as dataUpdateTrigger is gone
import { listingService } from '../../services/listingService';
import { Product, AdStatus } from '../../types';
import Spinner from '../../components/ui/Spinner';
// Removed LS_VISITED_USERS_KEY, LS_USER_SESSIONS_KEY, USER_ONLINE_THRESHOLD_MS
import { db, collection, query, where, orderBy, onSnapshot, getCountFromServer, Timestamp } from '../../../firebaseConfig';


interface Stats {
  totalActive: number;
  totalPending: number;
  totalRejected: number;
  totalListings: number;
  // totalUniqueVisitors and usersOnline removed
}

// Helper to convert Firestore doc to Product, converting Timestamps
const fromFirestoreToProduct = (snapshot: any): Product => {
  const data = snapshot.data();
  return {
    ...data,
    id: snapshot.id,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : data.createdAt,
  } as Product;
};


const AdminDashboardPage: React.FC = () => {
  // dataUpdateTrigger removed
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recentPending, setRecentPending] = useState<Product[]>([]);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch counts using getCountFromServer for efficiency
      const listingsCol = collection(db, 'listings');
      const activeSnapshot = await getCountFromServer(query(listingsCol, where('status', '==', AdStatus.ACTIVE)));
      const pendingSnapshot = await getCountFromServer(query(listingsCol, where('status', '==', AdStatus.PENDING)));
      const rejectedSnapshot = await getCountFromServer(query(listingsCol, where('status', '==', AdStatus.REJECTED)));
      const totalSnapshot = await getCountFromServer(listingsCol);

      setStats({
        totalActive: activeSnapshot.data().count,
        totalPending: pendingSnapshot.data().count,
        totalRejected: rejectedSnapshot.data().count,
        totalListings: totalSnapshot.data().count,
      });

      // Fetch recent pending listings for display (limited)
      const recentPendingQuery = query(
        collection(db, 'listings'), 
        where('status', '==', AdStatus.PENDING), 
        orderBy('createdAt', 'desc'), 
        // limit(5) // Not applying limit here, using onSnapshot below
      );
      // For recent pending, use onSnapshot to keep it live
      // This part will be handled by the onSnapshot effect below
      
    } catch (error) {
      console.error("Error fetching admin dashboard counts:", error);
    } finally {
      setIsLoading(false); // Counts are loaded, list loading might still be happening via onSnapshot
    }
  }, []);

  useEffect(() => {
    fetchDashboardData(); // Fetch initial counts

    // Listener for recent pending listings
    const recentPendingQuery = query(
        collection(db, 'listings'), 
        where('status', '==', AdStatus.PENDING), 
        orderBy('createdAt', 'desc')
        // limit(5) // Firestore limit can be added here if desired
      );
    const unsubscribeRecentPending = onSnapshot(recentPendingQuery, (querySnapshot) => {
        const pending = querySnapshot.docs.map(fromFirestoreToProduct).slice(0,5); // Manual slice if no limit in query
        setRecentPending(pending);
        // Also update the pending count in stats if it changes
        setStats(prevStats => prevStats ? {...prevStats, totalPending: querySnapshot.size } : null);
        setIsLoading(false); // Ensure loading is false after first snapshot
    }, (error) => {
        console.error("Error fetching recent pending listings:", error);
        setIsLoading(false);
    });
    
    // Listener for all listings to update counts dynamically
    const allListingsQuery = collection(db, 'listings');
    const unsubscribeAllListings = onSnapshot(allListingsQuery, async () => {
        // Re-fetch counts when any listing changes. This could be optimized if it causes too many reads.
        // A simpler way for counts if full list isn't needed here:
        // just update from the querySnapshot.size of specific status queries.
        // For dashboard, re-fetching counts is okay.
        fetchDashboardData();
    });


    return () => {
        unsubscribeRecentPending();
        unsubscribeAllListings();
    };
  }, [fetchDashboardData]);


  if (isLoading || !stats) return <Spinner fullPage />;

  const StatCard: React.FC<{ title: string; value: number | string; icon: string; color: string; linkTo?: string; tooltip?: string }> = 
    ({ title, value, icon, color, linkTo, tooltip }) => (
    <div 
        className={`bg-light-primary dark:bg-dark-secondary p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow ${linkTo ? 'cursor-pointer' : ''}`}
        title={tooltip}
    >
      {linkTo ? (
        <Link to={linkTo} className="block">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</p>
              <p className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">{value}</p>
            </div>
            <div className={`p-3 rounded-full ${color.replace('text-', 'bg-')} bg-opacity-20`}>
              <i className={`${icon} ${color} text-2xl`}></i>
            </div>
          </div>
        </Link>
      ) : (
         <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</p>
            <p className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">{value}</p>
          </div>
          <div className={`p-3 rounded-full ${color.replace('text-', 'bg-')} bg-opacity-20`}>
            <i className={`${icon} ${color} text-2xl`}></i>
          </div>
        </div>
      )}
    </div>
  );


  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-8">Панель Администратора</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8"> {/* Adjusted grid for fewer stats */}
        <StatCard title="Активные объявления" value={stats.totalActive} icon="fa-solid fa-check-circle" color="text-green-500" linkTo="/admin/manage-listings?status=active" />
        <StatCard title="На модерации" value={stats.totalPending} icon="fa-solid fa-clock" color="text-yellow-500" linkTo="/admin/moderation" />
        <StatCard title="Отклоненные" value={stats.totalRejected} icon="fa-solid fa-times-circle" color="text-red-500" linkTo="/admin/manage-listings?status=rejected" />
        <StatCard title="Всего объявлений" value={stats.totalListings} icon="fa-solid fa-list-alt" color="text-sky-500 dark:text-dark-accent" linkTo="/admin/manage-listings" />
        {/* Removed Unique Visitors and Users Online cards */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-light-primary dark:bg-dark-secondary p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">Недавние объявления на модерацию</h2>
          {recentPending.length > 0 ? (
            <ul className="space-y-3">
              {recentPending.map(p => (
                <li key={p.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
                  <div>
                    <Link to={`/product/${p.id}`} target="_blank" className="font-medium text-sky-600 dark:text-dark-accent hover:underline">{p.title}</Link>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(p.createdAt).toLocaleString('uk-UA')} - {p.price} ₴
                    </p>
                  </div>
                  <Link to={`/admin/moderation#listing-${p.id}`}>
                    <span className="text-xs font-semibold px-2 py-1 bg-yellow-400 text-yellow-800 rounded-full">Проверить</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 dark:text-slate-400">Нет объявлений, ожидающих модерации.</p>
          )}
          {stats.totalPending > 0 && 
            <Link to="/admin/moderation" className="mt-4 inline-block text-sm text-sky-600 dark:text-dark-accent hover:underline font-medium">
              Смотреть все ({stats.totalPending}) <i className="fa-solid fa-arrow-right ml-1"></i>
            </Link>
          }
        </div>

        <div className="bg-light-primary dark:bg-dark-secondary p-6 rounded-xl shadow-lg">
           <h2 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">Быстрые действия</h2>
            <div className="space-y-3">
                 <Link to="/admin/moderation" className="flex items-center p-3 bg-slate-50 dark:bg-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
                    <i className="fa-solid fa-gavel text-xl text-sky-500 dark:text-dark-accent mr-3"></i>
                    <span>Перейти к модерации объявлений</span>
                </Link>
                 <Link to="/admin/manage-listings" className="flex items-center p-3 bg-slate-50 dark:bg-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
                    <i className="fa-solid fa-folder-open text-xl text-sky-500 dark:text-dark-accent mr-3"></i>
                    <span>Управление всеми объявлениями</span>
                </Link>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;