import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { StoreProvider } from '../context/StoreContext';
import { SellerAuthProvider } from '../context/SellerAuthContext';
import { AdminAuthProvider } from '../admin/AdminAuthContext';
import ScrollToTop from '../components/ScrollToTop';
import CompareBar from '../components/CompareBar';
import { Toaster } from '../components/ui/toaster';
import { ErrorBoundary } from '../components/ErrorState';
import { storefrontRoutes } from './routes/storefrontRoutes';
import { adminRoutes } from './routes/adminRoutes';
import ServerErrorPage from '../pages/ServerErrorPage';
import NetworkErrorPage from '../pages/NetworkErrorPage';
import NotFoundPage from '../pages/NotFoundPage';

export function AppRouter() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <AdminAuthProvider>
          <SellerAuthProvider>
            <ScrollToTop />
            <Routes>
              {/* Storefront routes (public, customer, seller) */}
              {storefrontRoutes()}
              {/* Admin panel routes */}
              {adminRoutes()}
              {/* Error / fallback routes */}
              <Route path="/500" element={<ServerErrorPage />} />
              <Route path="/network-error" element={<NetworkErrorPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            <CompareBar />
            <Toaster />
          </SellerAuthProvider>
        </AdminAuthProvider>
      </StoreProvider>
    </ErrorBoundary>
  );
}
