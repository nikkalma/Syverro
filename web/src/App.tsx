import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Layout from './components/Layout';

import Login from './pages/Login';
import Register from './pages/Register';
import LibraryPage from './pages/LibraryPage';
import Insights from './pages/Insights';
import WorldMap from './pages/WorldMap';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import BookPage from './pages/BookPage';
import MyLibraryPage from './pages/MyLibraryPage';

import AdminRoute from './pages/Admin/AdminRoute';
import AdminDashboard from './pages/Admin/Dashboard';
import AdminUsers from "./pages/Admin/Users";
import AdminBooks from "./pages/Admin/Books";
import AdminAuthors from "./pages/Admin/Authors";
import AdminGenres from "./pages/Admin/Genres";
import AdminLogs from "./pages/Admin/Logs";
import AdminSettings from "./pages/Admin/Settings";
import AdminModeration from "./pages/Admin/Moderation/ModerationPage";
import AdminMetadata from "./pages/Admin/Metadata/MetadataPage";
import BookEnrichmentPage from "./pages/Admin/Metadata/BookEnrichmentPage";


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

          <Route path="/book/:id" element={<BookPage />} />

          <Route path="/my-library" element={<MyLibraryPage />} />


          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          <Route 
 path="/admin/users" 
 element={
   <AdminRoute>
     <AdminUsers />
   </AdminRoute>
 }
/>

<Route 
 path="/admin/books" 
 element={
   <AdminRoute>
     <AdminBooks />
   </AdminRoute>
 }
/>

<Route 
 path="/admin/authors" 
 element={
   <AdminRoute>
     <AdminAuthors />
   </AdminRoute>
 }
/>

<Route 
 path="/admin/genres" 
 element={
   <AdminRoute>
     <AdminGenres />
   </AdminRoute>
 }
/>

<Route 
 path="/admin/logs" 
 element={
   <AdminRoute>
     <AdminLogs />
   </AdminRoute>
 }
/>

<Route 
 path="/admin/settings" 
 element={
   <AdminRoute>
     <AdminSettings />
   </AdminRoute>
 }
/>

<Route 
 path="/admin/moderation" 
 element={
   <AdminRoute>
     <AdminModeration />
   </AdminRoute>
 }
/>

<Route 
 path="/admin/metadata" 
 element={
   <AdminRoute>
     <AdminMetadata />
   </AdminRoute>
 }
/>

<Route 
 path="/admin/books/:id/enrichment" 
 element={
   <AdminRoute>
     <BookEnrichmentPage />
   </AdminRoute>
 }
/>

        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
