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
import AuthorPage from './pages/AuthorPage';
import AuthorsPage from './pages/AuthorsPage';
import GenresThemesPage from './pages/GenresThemesPage';
import AtmospheresPage from './pages/AtmospheresPage';
import CharactersPage from './pages/CharactersPage';
import QuotesPage from './pages/QuotesPage';
import CollectionsPage from './pages/CollectionsPage';
import MyLibraryPage from './pages/MyLibraryPage';

import AdminRoute from './pages/Admin/AdminRoute';
import AdminDashboard from './pages/Admin/Dashboard';
import AdminUsers from "./pages/Admin/Users";
import AdminBooks from "./pages/Admin/Books";
import AdminAuthors from "./pages/Admin/Authors";
import AdminGenres from "./pages/Admin/Genres";
import AdminTaxonomy from "./pages/Admin/Taxonomy";
import AdminLogs from "./pages/Admin/Logs";
import AdminSettings from "./pages/Admin/Settings";
import AdminModeration from "./pages/Admin/Moderation/ModerationPage";
import AdminMetadata from "./pages/Admin/Metadata/MetadataPage";
import BookEnrichmentPage from "./pages/Admin/Metadata/BookEnrichmentPage";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout><LibraryPage /></Layout>} />
        <Route path="/login" element={<Layout><Login /></Layout>} />
        <Route path="/register" element={<Layout><Register /></Layout>} />
        <Route path="/insights" element={<Layout><Insights /></Layout>} />
        <Route path="/authors" element={<Layout><AuthorsPage /></Layout>} />
        <Route path="/genres-themes" element={<Layout><GenresThemesPage /></Layout>} />
        <Route path="/atmospheres" element={<Layout><AtmospheresPage /></Layout>} />
        <Route path="/characters" element={<Layout><CharactersPage /></Layout>} />
        <Route path="/quotes" element={<Layout><QuotesPage /></Layout>} />
        <Route path="/collections" element={<Layout><CollectionsPage /></Layout>} />
        <Route path="/worldmap" element={<Layout><WorldMap /></Layout>} />
        <Route path="/profile" element={<Layout><Profile /></Layout>} />
        <Route path="/settings" element={<Layout><Settings /></Layout>} />
        <Route path="/book/:id" element={<Layout><BookPage /></Layout>} />
        <Route path="/author/:slug" element={<Layout><AuthorPage /></Layout>} />
        <Route path="/my-library" element={<Layout><MyLibraryPage /></Layout>} />

        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="/admin/books" element={<AdminRoute><AdminBooks /></AdminRoute>} />
        <Route path="/admin/authors" element={<AdminRoute><AdminAuthors /></AdminRoute>} />
        <Route path="/admin/genres" element={<AdminRoute><AdminGenres /></AdminRoute>} />
        <Route path="/admin/taxonomy" element={<AdminRoute><AdminTaxonomy /></AdminRoute>} />
        <Route path="/admin/logs" element={<AdminRoute><AdminLogs /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
        <Route path="/admin/moderation" element={<AdminRoute><AdminModeration /></AdminRoute>} />
        <Route path="/admin/metadata" element={<AdminRoute><AdminMetadata /></AdminRoute>} />
        <Route path="/admin/books/:id/enrichment" element={<AdminRoute><BookEnrichmentPage /></AdminRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
