import { Routes, Route } from 'react-router-dom';
import SignInPage from './pages/SignInPage';
import DashboardPage from './pages/DashboardPage';
import MainDashboardPage from './pages/MainDashboardPage';
import AccountDetailsPage from './pages/AccountDetailsPage';
import PayAndTransferPage from './pages/PayAndTransferPage';
import ActivityPage from './pages/ActivityPage';
import TransferPage from './pages/TransferPage';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<SignInPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/main-dashboard" element={<MainDashboardPage />} />
      <Route path="/account" element={<AccountDetailsPage />} />
      <Route path="/pay-transfer" element={<PayAndTransferPage />} />
      <Route path="/activity" element={<ActivityPage />} />
      <Route path="/transfer" element={<TransferPage />} />
    </Routes>
  );
}

export default App;
