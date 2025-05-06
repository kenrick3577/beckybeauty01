import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import ShopPage from './pages/ShopPage';
import CartPage from './pages/CartPage';
import AppointmentsPage from './pages/AppointmentsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import AuthGuard from './components/layout/AuthGuard';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/appointments" element={<AuthGuard><AppointmentsPage /></AuthGuard>} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/profile" element={<AuthGuard><ProfilePage /></AuthGuard>} />
              <Route path="/admin" element={<AuthGuard requireAdmin><AdminPage /></AuthGuard>} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}