import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Transactions from './pages/Transactions';
import Users from './pages/Users';
import Reports from './pages/Reports';
import Billings from './pages/Billings';
import Login from './pages/Login';
import Register from './pages/Register';
import Alert from './components/Alert';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuthStore } from './store/auth';

const queryClient = new QueryClient();

function App() {
  const { initializeTestAccounts } = useAuthStore();

  useEffect(() => {
    // Initialize test accounts when the app starts
    initializeTestAccounts();
  }, [initializeTestAccounts]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Alert />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={
                <ProtectedRoute allowedRoles={['admin', 'staff', 'vendor']}>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="products" element={
                <ProtectedRoute allowedRoles={['admin', 'staff', 'vendor']}>
                  <Products />
                </ProtectedRoute>
              } />
              <Route path="orders" element={
                <ProtectedRoute allowedRoles={['admin', 'staff', 'vendor']}>
                  <Orders />
                </ProtectedRoute>
              } />
              <Route path="transactions" element={
                <ProtectedRoute allowedRoles={['admin', 'staff']}>
                  <Transactions />
                </ProtectedRoute>
              } />
              <Route path="users" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Users />
                </ProtectedRoute>
              } />
              <Route path="billings" element={
                <ProtectedRoute allowedRoles={['admin', 'staff', 'vendor']}>
                  <Billings />
                </ProtectedRoute>
              } />
              <Route path="reports" element={
                <ProtectedRoute allowedRoles={['admin', 'staff']}>
                  <Reports />
                </ProtectedRoute>
              } />
            </Route>
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;