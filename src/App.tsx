import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import WizardTravelRequest from './pages/WizardTravelRequest';
import ApproverDashboard from './pages/ApproverDashboard';
import AccountabilityForm from './pages/AccountabilityForm';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/solicitar" element={<WizardTravelRequest />} />
            <Route path="/aprovacoes" element={<ApproverDashboard />} />
            <Route path="/prestacao-contas" element={<AccountabilityForm />} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
