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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Layout><LibraryPage /></Layout>} />
        <Route path="/book/:id" element={<Layout><BookPage /></Layout>} />
        <Route path="/insights" element={<Layout><Insights /></Layout>} />
        <Route path="/worldmap" element={<Layout><WorldMap /></Layout>} />
        <Route path="/profile" element={<Layout><Profile /></Layout>} />
        <Route path="/my-library" element={<Layout><MyLibraryPage /></Layout>} />
        <Route path="/settings" element={<Layout><Settings /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;