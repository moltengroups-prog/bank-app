import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useInactivityTimeout } from './hooks/useInactivityTimeout';
import 'flag-icons/css/flag-icons.min.css';
import { connectSocket, getSocket } from './socket/socket.js';
import { useNotificationStore } from './store/notificationStore';
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
import StatementsAndDocumentsPage from './pages/StatementsAndDocumentsPage';
import GoPaperlessPage from './pages/GoPaperlessPage';
import SecurityCenterPage from './pages/SecurityCenterPage';
import BillPayPage from './pages/BillPayPage';
import AddPayeePage from './pages/AddPayeePage';
import CompanyPayeePage from './pages/CompanyPayeePage';
import BillPayPayeeDetailsPage from './pages/BillPayPayeeDetailsPage';
import PayBillPage from './pages/PayBillPage';
import ExternalTransferPage from './pages/ExternalTransferPage';
import WireTransferPage from './pages/WireTransferPage';
import WireStartPage from './pages/WireStartPage';
import WireAddRecipientPage from './pages/WireAddRecipientPage';
import WireAddRecipientDetailsPage from './pages/WireAddRecipientDetailsPage';
import WireAddRecipientBankDetailsPage from './pages/WireAddRecipientBankDetailsPage';
import WireAddRecipientReviewPage from './pages/WireAddRecipientReviewPage';
import WireAddRecipientConfirmPage from './pages/WireAddRecipientConfirmPage';
import WireAccountSelectPage from './pages/WireAccountSelectPage';
import WireRecipientSummaryPage from './pages/WireRecipientSummaryPage';
import WireAmountPage from './pages/WireAmountPage';
import WireReviewPage from './pages/WireReviewPage';
import WireSuccessPage from './pages/WireSuccessPage';
import ProductsOffersPage from './pages/ProductsOffersPage';
import EricaChatPage from './pages/EricaChatPage';
import LiveChatPage from './pages/LiveChatPage';
import AccountTransactionsPage from './pages/AccountTransactionsPage';
import OTPVerificationPage from './pages/OTPVerificationPage';
import PrivateRoute from './components/PrivateRoute';
import './App.css';

// Defined at module scope so its identity never changes between renders.
// If this were inside App(), every re-render would produce a new component
// type, causing React to unmount and remount every protected route subtree
// (resetting scroll, re-firing effects, and flickering balances).
function P({ children }) {
  return <PrivateRoute>{children}</PrivateRoute>;
}

function App() {
  useInactivityTimeout();

  // Stable selector — App only re-renders if subscribeToSocket changes
  // (it never does; Zustand methods are stable).  Without a selector,
  // useNotificationStore() would re-render App on every notification push,
  // which would recreate P and unmount every route.
  const subscribeToSocket = useNotificationStore((s) => s.subscribeToSocket);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = connectSocket();
    if (!socket) return;

    let unsubscribe;

    const doSubscribe = () => {
      // Idempotent: if already subscribed from a previous call, skip
      if (unsubscribe) return;
      unsubscribe = subscribeToSocket(getSocket());
    };

    if (socket.connected) {
      doSubscribe();
    } else {
      socket.once('connect', doSubscribe);
    }

    return () => {
      // Remove the pending once-handler so StrictMode's unmount→remount
      // cycle doesn't leave a stale listener that fires on the next connect.
      socket.off('connect', doSubscribe);
      unsubscribe?.();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Routes>
      {/* Public */}
      <Route path="/"           element={<SignInPage />} />
      <Route path="/verify-otp" element={<OTPVerificationPage />} />

      {/* Protected */}
      <Route path="/dashboard"           element={<P><DashboardPage /></P>} />
      <Route path="/main-dashboard"      element={<P><MainDashboardPage /></P>} />
      <Route path="/account"             element={<P><AccountDetailsPage /></P>} />
      <Route path="/pay-transfer"        element={<P><PayAndTransferPage /></P>} />
      <Route path="/activity"            element={<P><ActivityPage /></P>} />
      <Route path="/transfer"            element={<P><TransferPage /></P>} />
      <Route path="/transaction-details" element={<P><TransactionDetailsPage /></P>} />
      <Route path="/menu"                element={<P><MenuPage /></P>} />
      <Route path="/deposit-checks"      element={<P><DepositChecksPage /></P>} />
      <Route path="/invest"              element={<P><InvestPage /></P>} />
      <Route path="/communications"      element={<P><CommunicationsPage /></P>} />
      <Route path="/statements-documents" element={<P><StatementsAndDocumentsPage /></P>} />
      <Route path="/go-paperless"        element={<P><GoPaperlessPage /></P>} />
      <Route path="/security-center"     element={<P><SecurityCenterPage /></P>} />
      <Route path="/bill-pay"            element={<P><BillPayPage /></P>} />
      <Route path="/add-payee"           element={<P><AddPayeePage /></P>} />
      <Route path="/company-payee"       element={<P><CompanyPayeePage /></P>} />
      <Route path="/bill-pay-payee-details" element={<P><BillPayPayeeDetailsPage /></P>} />
      <Route path="/pay-bill"            element={<P><PayBillPage /></P>} />
      <Route path="/transfer/external"   element={<P><ExternalTransferPage /></P>} />
      <Route path="/wire-transfer"       element={<P><WireTransferPage /></P>} />
      <Route path="/wire-transfer/start" element={<P><WireStartPage /></P>} />
      <Route path="/wire-transfer/add-recipient"             element={<P><WireAddRecipientPage /></P>} />
      <Route path="/wire-transfer/add-recipient/details"     element={<P><WireAddRecipientDetailsPage /></P>} />
      <Route path="/wire-transfer/add-recipient/bank-details" element={<P><WireAddRecipientBankDetailsPage /></P>} />
      <Route path="/wire-transfer/add-recipient/review"      element={<P><WireAddRecipientReviewPage /></P>} />
      <Route path="/wire-transfer/add-recipient/confirm"     element={<P><WireAddRecipientConfirmPage /></P>} />
      <Route path="/wire-transfer/recipient-summary" element={<P><WireRecipientSummaryPage /></P>} />
      <Route path="/wire-transfer/account-select"    element={<P><WireAccountSelectPage /></P>} />
      <Route path="/wire-transfer/amount"            element={<P><WireAmountPage /></P>} />
      <Route path="/wire-transfer/review"            element={<P><WireReviewPage /></P>} />
      <Route path="/wire-transfer/success"           element={<P><WireSuccessPage /></P>} />
      <Route path="/products-offers"     element={<P><ProductsOffersPage /></P>} />
      <Route path="/erica-chat"          element={<P><EricaChatPage /></P>} />
      <Route path="/live-chat"           element={<P><LiveChatPage /></P>} />
      <Route path="/account-transactions" element={<P><AccountTransactionsPage /></P>} />
    </Routes>
  );
}

export default App;
