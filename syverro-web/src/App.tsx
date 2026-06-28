// src/App.tsx

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LibraryPage from './pages/LibraryPage';
import BookPage from './pages/BookPage';
import Insights from './pages/Insights';
import WorldMap from './pages/WorldMap';
import Profile from './pages/Profile';
import MyLibraryPage from './pages/MyLibraryPage';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import { useAuthStore } from './store/authStore';
import AdminRoute from './pages/Admin/AdminRoute';
import AdminDashboard from './pages/Admin/Dashboard';
import AdminUsers from './pages/Admin/Users';
import AdminBooks from './pages/Admin/Books';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Login />;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Layout><LibraryPage /></Layout>} />
        <Route path="/book/:id" element={<Layout><BookPage /></Layout>} />
        <Route path="/worldmap" element={<Layout><WorldMap /></Layout>} />
        <Route path="/insights" element={<ProtectedRoute><Layout><Insights /></Layout></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
        <Route path="/my-library" element={<ProtectedRoute><Layout><MyLibraryPage /></Layout></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />

        {/* ===== АДМИН-МАРШРУТЫ (ВНУТРИ ROUTES) ===== */}
        <Route path="/admin" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
        <Route path="/admin/users" element={
          <AdminRoute requiredRole="admin">
            <AdminUsers />
          </AdminRoute>
        } />
        <Route path="/admin/books" element={
          <AdminRoute requiredRole="moderator">
            <AdminBooks />
          </AdminRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;