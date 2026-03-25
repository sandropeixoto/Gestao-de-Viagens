import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import NotificationToast from './components/NotificationToast';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import WizardTravelRequest from './pages/WizardTravelRequest';
import ApproverDashboard from './pages/ApproverDashboard';
import AccountabilityForm from './pages/AccountabilityForm';
import AuthSSO from './pages/AuthSSO';
import AdminPanel from './pages/AdminPanel';
import Reports from './pages/Reports';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/auth/sso" element={<AuthSSO />} />

            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/solicitar" element={<WizardTravelRequest />} />
              <Route path="/aprovacoes" element={<ApproverDashboard />} />
              <Route path="/prestacao-contas" element={<AccountabilityForm />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/relatorios" element={<Reports />} />
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <NotificationToast />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
