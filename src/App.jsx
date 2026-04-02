import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar.jsx';
import Footer from './components/Footer.jsx';
import BottomNav from './components/BottomNav.jsx';
import useCurrentUser from './hooks/useCurrentUser.js';

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
// lazy pages

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading } = useCurrentUser();
  // auth gate

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 dark:text-slate-200">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

const App = () => {
  return (
    <Router>
      <Navbar />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 dark:text-slate-200">Loading...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/category/:name" element={<CategoryPage />} />
          <Route path="/product/:id" element={<ProductPage />} />
<Route path="/search" element={<MobileSearchPage />} />
<Route path="/search-results" element={<SearchResultsPage />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <ProtectedRoute requireAdmin>
                <AdminProducts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <ProtectedRoute requireAdmin>
                <AdminCategories />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/banners"
            element={
              <ProtectedRoute requireAdmin>
                <AdminBanners />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute requireAdmin>
                <AdminOrders />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Footer />
      <BottomNav />
    </Router>
  );
};
// routes

export default App;
