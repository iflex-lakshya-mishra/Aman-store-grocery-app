import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar.jsx';
import Footer from './components/Footer.jsx';
import BottomNav from './components/BottomNav.jsx';
import useCurrentUser from './hooks/useCurrentUser.js';

const Account = lazy(() => import('./pages/Account.jsx'));
const Home = lazy(() => import('./pages/Home.jsx'));
const CategoryPage = lazy(() => import('./pages/CategoryPage.jsx'));
const ProductPage = lazy(() => import('./pages/ProductPage.jsx'));
const MobileSearchPage = lazy(() => import('./pages/MobileSearchPage.jsx'));
const SearchResultsPage = lazy(() => import('./pages/SearchResultsPage.jsx'));
const Cart = lazy(() => import('./pages/Cart.jsx'));
const Orders = lazy(() => import('./pages/Orders.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'));
const AdminProducts = lazy(() => import('./pages/AddProduct.jsx'));
const AdminCategories = lazy(() => import('./pages/AdminCategories.jsx'));
const AdminBanners = lazy(() => import('./pages/AdminBanners.jsx'));
const AdminOrders = lazy(() => import('./pages/AdminOrders.jsx'));
const AdminLogin = lazy(() => import('./pages/AdminLogin.jsx'));

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 dark:text-slate-200">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
  </div>
);

const ProtectedRoute = ({ children, requireAdmin = false, user, loading }) => {
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (requireAdmin && !user.isAdmin) return <Navigate to="/" replace />;
  return children;
};

const App = () => {
  const { user, loading } = useCurrentUser();

  return (
    <Router>
      <Navbar />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/category/:name" element={<CategoryPage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/search" element={<MobileSearchPage />} />
          <Route path="/search-results" element={<SearchResultsPage />} />
          <Route path="/cart" element={<ProtectedRoute user={user} loading={loading}><Cart /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute user={user} loading={loading}><Orders /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute user={user} loading={loading}><Orders /></ProtectedRoute>} />
          <Route path="/account" element={<ProtectedRoute user={user} loading={loading}><Account /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<ProtectedRoute user={user} loading={loading} requireAdmin><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/products" element={<ProtectedRoute user={user} loading={loading} requireAdmin><AdminProducts /></ProtectedRoute>} />
          <Route path="/admin/categories" element={<ProtectedRoute user={user} loading={loading} requireAdmin><AdminCategories /></ProtectedRoute>} />
          <Route path="/admin/banners" element={<ProtectedRoute user={user} loading={loading} requireAdmin><AdminBanners /></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute user={user} loading={loading} requireAdmin><AdminOrders /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Footer />
      <BottomNav />
    </Router>
  );
};

export default App;
