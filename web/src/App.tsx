import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

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

import StudioRoute from './pages/Studio/StudioRoute';
import StudioHome from './pages/Studio/Dashboard';
import StudioUsers from "./pages/Studio/Users";
import StudioBooks from "./pages/Studio/Books";
import {
  BookWorkspaceLayout,
  Overview as BookOverview,
  Identity as BookIdentity,
  Editorial as BookEditorial,
  Knowledge as BookKnowledge,
  Preview as BookPreview,
} from "./pages/Studio/Books/BookWorkspace";
import StudioAuthorsLayout from "./pages/Studio/Authors";
import AuthorList from "./pages/Studio/Authors/AuthorList";
import {
  AuthorEditorLayout,
  Overview,
  Identity,
  Timeline,
  Works,
  Quotes,
  Media,
  Seo,
  Sources,
  Publications,
  AIProposals,
} from "./pages/Studio/Authors/AuthorEditor";
import StudioGenres from "./pages/Studio/Genres";
import StudioTaxonomy from "./pages/Studio/Taxonomy";
import StudioEntities from "./pages/Studio/Entities";
import EntityWorkspace from "./pages/Studio/Entities/EntityWorkspace";
import EntityOverview from "./pages/Studio/Entities/sections/Overview";
import EntityIdentity from "./pages/Studio/Entities/sections/Identity";
import ActivityLog from "./pages/Studio/Logs";
import StudioSettings from "./pages/Studio/Settings";
import ModerationQueue from "./pages/Studio/Moderation/ModerationPage";
import MetadataWorkspace from "./pages/Studio/Metadata/MetadataPage";
import BookEnrichmentPage from "./pages/Studio/Metadata/BookEnrichmentPage";


function AdminRedirect() {
  const location = useLocation();
  const studioPath = '/studio' + location.pathname.replace('/admin', '') + location.search + location.hash;
  return <Navigate to={studioPath} replace />;
}

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
        <Route path="/profile" element={<Layout hideSidebar><Profile /></Layout>} />
        <Route path="/settings" element={<Layout><Settings /></Layout>} />
        <Route path="/book/:id" element={<Layout><BookPage /></Layout>} />
        <Route path="/author/:slug" element={<Layout><AuthorPage /></Layout>} />
        <Route path="/my-library" element={<Layout><MyLibraryPage /></Layout>} />

        <Route path="/admin" element={<Navigate to="/studio" replace />} />
        <Route path="/admin/*" element={<AdminRedirect />} />

        <Route path="/studio" element={<StudioRoute />}>
          <Route index element={<StudioHome />} />
          <Route path="users" element={<StudioUsers />} />
          <Route path="books" element={<StudioBooks />} />
          <Route path="books/:id/workspace" element={<BookWorkspaceLayout />}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<BookOverview />} />
            <Route path="identity" element={<BookIdentity />} />
            <Route path="editorial" element={<BookEditorial />} />
            <Route path="knowledge" element={<BookKnowledge />} />
            <Route path="preview" element={<BookPreview />} />
            <Route path="*" element={<Navigate to="overview" replace />} />
          </Route>
          <Route path="genres" element={<StudioGenres />} />
          <Route path="taxonomy" element={<StudioTaxonomy />} />
          <Route path="entities" element={<StudioEntities />} />
          <Route path="entities/new" element={<EntityWorkspace />}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<EntityOverview />} />
          </Route>
          <Route path="entities/:id" element={<EntityWorkspace />}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<EntityOverview />} />
            <Route path="identity" element={<EntityIdentity />} />
            <Route path="*" element={<Navigate to="overview" replace />} />
          </Route>
          <Route path="moderation" element={<ModerationQueue />} />
          <Route path="metadata" element={<MetadataWorkspace />} />
          <Route path="logs" element={<ActivityLog />} />
          <Route path="settings" element={<StudioSettings />} />
          <Route path="books/:id/enrichment" element={<BookEnrichmentPage />} />

          <Route path="authors" element={<StudioAuthorsLayout />}>
            <Route index element={<Navigate to="list" replace />} />
            <Route path="list" element={<AuthorList />} />
            <Route path="new" element={<Navigate to="/studio/authors/list" replace />} />

            <Route path=":id/edit" element={<AuthorEditorLayout />}>
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview" element={<Overview />} />
              <Route path="identity" element={<Identity />} />
              <Route path="timeline" element={<Timeline />} />
              <Route path="works" element={<Works />} />
              <Route path="quotes" element={<Quotes />} />
              <Route path="media" element={<Media />} />
              <Route path="seo" element={<Seo />} />
              <Route path="sources" element={<Sources />} />
              <Route path="publications" element={<Publications />} />
              <Route path="ai" element={<AIProposals />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
