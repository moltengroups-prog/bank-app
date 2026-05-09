import { Routes, Route } from 'react-router-dom';
import SignInPage from './pages/SignInPage';
import DashboardPage from './pages/DashboardPage';
import MainDashboardPage from './pages/MainDashboardPage';
import AccountDetailsPage from './pages/AccountDetailsPage';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<SignInPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/main-dashboard" element={<MainDashboardPage />} />
      <Route path="/account" element={<AccountDetailsPage />} />
    </Routes>
  );
}

export default App;
