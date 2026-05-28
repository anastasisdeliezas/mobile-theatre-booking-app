import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TheatresPage from './pages/TheatresPage';
import ShowsPage from './pages/ShowsPage';
import ShowtimesPage from './pages/ShowtimesPage';
import ReservationsPage from './pages/ReservationsPage';
import UsersPage from './pages/UsersPage';
import MessagesPage from './pages/MessagesPage';
import NewsletterPage from './pages/NewsletterPage';
import ReviewsPage from './pages/ReviewsPage';
import PromosPage from './pages/PromosPage';
import AdminLayout from './layouts/AdminLayout';
import './styles.css';

function Protected() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <AdminLayout />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
  <AuthProvider>
  <BrowserRouter
    future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }}
  >
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Protected />}>
        <Route index element={<DashboardPage />} />
        <Route path="theatres" element={<TheatresPage />} />
        <Route path="shows" element={<ShowsPage />} />
        <Route path="showtimes" element={<ShowtimesPage />} />
        <Route path="reservations" element={<ReservationsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="reviews" element={<ReviewsPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="newsletter" element={<NewsletterPage />} />
        <Route path="promos" element={<PromosPage />} />
      </Route>
    </Routes>
  </BrowserRouter>
</AuthProvider>
  </React.StrictMode>
);
