import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Layout from './components/Layout';

import Login from './pages/Login';
import Register from './pages/Register';
import LibraryPage from './pages/LibraryPage';
import Insights from './pages/Insights';
import WorldMap from './pages/WorldMap';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

import AdminRoute from './pages/Admin/AdminRoute';
import AdminDashboard from './pages/Admin/Dashboard';


export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>

          <Route path="/" element={<LibraryPage />} />

          <Route path="/login" element={<Login />} />

          <Route path="/register" element={<Register />} />

          <Route path="/insights" element={<Insights />} />

          <Route path="/worldmap" element={<WorldMap />} />

          <Route path="/profile" element={<Profile />} />

          <Route path="/settings" element={<Settings />} />


          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
