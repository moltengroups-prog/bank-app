import { Routes, Route } from 'react-router-dom';
import SignInPage from './pages/SignInPage';
import DashboardPage from './pages/DashboardPage';
import MainDashboardPage from './pages/MainDashboardPage';
import AccountDetailsPage from './pages/AccountDetailsPage';
import PayAndTransferPage from './pages/PayAndTransferPage';
import ActivityPage from './pages/ActivityPage';
import TransferPage from './pages/TransferPage';
import TransactionDetailsPage from './pages/TransactionDetailsPage';
import MenuPage from './pages/MenuPage';
import DepositChecksPage from './pages/DepositChecksPage';
import InvestPage from './pages/InvestPage';
import CommunicationsPage from './pages/CommunicationsPage';
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
      <Route path="/transaction-details" element={<TransactionDetailsPage />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/deposit-checks" element={<DepositChecksPage />} />
      <Route path="/invest" element={<InvestPage />} />
      <Route path="/communications" element={<CommunicationsPage />} />
    </Routes>
  );
}

export default App;
