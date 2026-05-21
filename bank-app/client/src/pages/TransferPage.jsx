import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LegalDisclosure from '../components/LegalDisclosure';
import InsetDivider from '../components/InsetDivider';
import AppHeader from '../components/AppHeader';
import FdicBanner from '../components/FdicBanner';
import AccountPickerModal from '../components/AccountPickerModal';
import AmountInputModal from '../components/AmountInputModal';
import DatePickerModal from '../components/DatePickerModal';
import { transferService } from '../services/transferService';
import { useDashboardStore } from '../store/dashboardStore';
import { formatBalance } from '../utils/format';

const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const IconLightbulb = () => (
  <svg className="w-10 h-10 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

function TransferPage() {
  const navigate = useNavigate();
  const fetchAccounts = useDashboardStore((s) => s.fetchAccounts);

  const [fromModal, setFromModal]     = useState(false);
  const [toModal, setToModal]         = useState(false);
  const [amountModal, setAmountModal] = useState(false);
  const [dateModal, setDateModal]     = useState(false);

  const [fromAccount, setFromAccount]   = useState(null);
  const [toAccount, setToAccount]       = useState(null);
  const [amount, setAmount]             = useState('');
  const [selectedDate, setSelectedDate] = useState(null);

  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(null);
  const [checkVisible, setCheckVisible] = useState(false);

  // Trigger checkmark animation once success arrives
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setCheckVisible(true), 80);
      return () => clearTimeout(t);
    }
  }, [success]);

  const formatDate = (date) =>
    `${SHORT_MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;

  const formatSuccessDate = (date) =>
    `${SHORT_MONTHS[date.getMonth()]} ${date.getDate()}`;

  const accountLabel = (acc) =>
    acc ? `${acc.accountName} ${acc.maskedAccountNumber}` : null;

  const isReady = Boolean(
    fromAccount && toAccount && parseFloat(amount) > 0 && selectedDate
  );

  const handleSubmit = async () => {
    if (!isReady || loading) return;

    if (fromAccount.id === toAccount.id) {
      setError('Please choose two different accounts.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await transferService.internalTransfer(
        fromAccount.id,
        toAccount.id,
        parseFloat(amount)
      );
      setSuccess(res.data);
    } catch (err) {
      setError(err.message || 'Transfer failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    fetchAccounts(); // refresh balances in background
    navigate('/pay-transfer');
  };

  // ── Success / confirmation screen ─────────────────────────────────
  if (success) {
    const transferDate = selectedDate || new Date();

    return (
      <div className="flex flex-col h-screen bg-white font-sans">

        <AppHeader title="Transfer Details" showEricaRight ericaRightCount={3} />

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto pt-[64px] pb-28">

          {/* ── Check icon + heading ── */}
          <div className="bg-white flex flex-col items-center pt-10 pb-8 px-6">
            <div
              className={`
                w-[72px] h-[72px] rounded-full border-[2.5px] border-green-500
                flex items-center justify-center mb-6
                transition-all duration-500 ease-out
                ${checkVisible ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}
              `}
            >
              <svg
                className="w-9 h-9 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-[22px] font-extrabold text-gray-900 text-center leading-snug">
              Your transfer is scheduled
            </h1>
          </div>

          {/* ── Detail rows ── */}
          <div className="bg-white border-t border-b border-gray-200">

            {/* From */}
            <div className="flex items-start justify-between px-5 py-[18px]">
              <span className="text-[15px] text-gray-900 font-normal pt-0.5">From</span>
              <div className="text-right">
                <p className="text-[15px] text-gray-900 font-medium leading-snug">
                  {success.from.accountName}
                </p>
                <p className="text-[13px] text-gray-500 mt-0.5">
                  Available balance {formatBalance(success.from.availableBalance)}
                </p>
              </div>
            </div>

            <InsetDivider color={100} />

            {/* To */}
            <div className="flex items-start justify-between px-5 py-[18px]">
              <span className="text-[15px] text-gray-900 font-normal pt-0.5">To</span>
              <div className="text-right">
                <p className="text-[15px] text-gray-900 font-medium leading-snug">
                  {success.to.accountName}
                </p>
                <p className="text-[13px] text-gray-500 mt-0.5">
                  Available balance {formatBalance(success.to.availableBalance)}
                </p>
              </div>
            </div>

            <InsetDivider color={100} />

            {/* Amount */}
            <div className="flex items-center justify-between px-5 py-[18px]">
              <span className="text-[15px] text-gray-900 font-normal">Amount</span>
              <span className="text-[15px] text-gray-900 font-medium">
                ${Number(success.amount).toFixed(2)}
              </span>
            </div>

            <InsetDivider color={100} />

            {/* Date */}
            <div className="flex items-center justify-between px-5 py-[18px]">
              <span className="text-[15px] text-gray-900 font-normal">Date</span>
              <span className="text-[15px] text-gray-900">
                {formatSuccessDate(transferDate)}
              </span>
            </div>

            <InsetDivider color={100} />

            {/* Confirmation # */}
            <div className="flex items-center justify-between px-5 py-[18px]">
              <span className="text-[15px] text-gray-900 font-normal">Confirmation #</span>
              <span className="text-[14px] text-gray-700 font-mono tracking-wide">
                {success.referenceNumber || '—'}
              </span>
            </div>

          </div>

          {/* ── Legal / informational text ── */}
          <div className="bg-gray-50 px-5 pt-6 pb-8 space-y-4">
            <p className="text-[12px] text-gray-500 leading-[1.65]">
              Please make sure there are sufficient funds in the account from which you are
              transferring money in order to avoid a possible fee. For details, refer to your
              account agreement and applicable fee schedule.
            </p>
            <p className="text-[12px] text-gray-500 leading-[1.65]">
              A note to our credit card customers: To avoid late fees and additional interest
              charges, please make sure your payment covers at least your Total Minimum Payment Due
              and is made by the due date. Payments made after your due date, but before the receipt
              of your next bill, will be applied to the current bill.
            </p>
            <p className="text-[12px] text-gray-500 leading-[1.65]">
              You can edit or cancel this transfer by 11:59 PM ET the day before this transaction
              is scheduled.
            </p>
            <p className="text-[12px] text-gray-500 leading-[1.65]">
              You authorize us to adjust a scheduled payment to an account in order to avoid a
              payment of disputed transactions on that account.
            </p>
          </div>

        </div>

        {/* ── Fixed DONE button ── */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
          <div className="px-5 py-4">
            <button
              type="button"
              onClick={handleDone}
              className="w-full py-[17px] bg-[#002D72] text-white font-bold text-sm tracking-widest rounded-full active:bg-[#001d4a] transition-colors"
            >
              DONE
            </button>
          </div>
        </div>

      </div>
    );
  }

  // ── Transfer form ─────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">

      <AppHeader showBackButton title="Transfer" showEricaRight ericaRightCount={3} />

      {/* ══════════════════════════════════
          SCROLLABLE BODY
      ══════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto pt-[64px] pb-28">

        {/* ── FDIC disclaimer ── */}
        <div className="bg-white px-4 pt-4 pb-4">
          <FdicBanner label="Bank of Molten deposit products:" labelBold showInvestment />
        </div>

        <InsetDivider />

        {/* ── Error banner ── */}
        {error ? (
          <div className="mx-4 mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        ) : null}

        {/* ── From / To ── */}
        <div className="bg-white mt-4">
          <button
            type="button"
            onClick={() => setFromModal(true)}
            className="w-full flex items-center justify-between px-4 py-5 active:bg-gray-50"
          >
            <span className="text-base text-gray-900">From</span>
            <span className={`text-base ${fromAccount ? 'text-gray-900' : 'text-[#1a6bbf]'}`}>
              {accountLabel(fromAccount) || 'Choose account'}
            </span>
          </button>
          <InsetDivider color={200} />
          <button
            type="button"
            onClick={() => setToModal(true)}
            className="w-full flex items-center justify-between px-4 py-5 active:bg-gray-50"
          >
            <span className="text-base text-gray-900">To</span>
            <span className={`text-base ${toAccount ? 'text-gray-900' : 'text-[#1a6bbf]'}`}>
              {accountLabel(toAccount) || 'Choose account'}
            </span>
          </button>
        </div>

        <div className="h-5 bg-gray-100" />

        {/* ── Amount / Date ── */}
        <div className="bg-white">
          <button
            type="button"
            onClick={() => setAmountModal(true)}
            className="w-full flex items-center justify-between px-4 py-5 active:bg-gray-50"
          >
            <span className="text-base text-gray-900">Amount</span>
            <span className={`text-base ${amount ? 'text-gray-900' : 'text-[#1a6bbf]'}`}>
              {amount ? `$${amount}` : 'Enter amount'}
            </span>
          </button>
          <InsetDivider color={200} />
          <button
            type="button"
            onClick={() => setDateModal(true)}
            className="w-full flex items-center justify-between px-4 py-5 active:bg-gray-50"
          >
            <span className="text-base text-gray-900">Date</span>
            <span className={`text-base ${selectedDate ? 'text-gray-900' : 'text-[#1a6bbf]'}`}>
              {selectedDate ? formatDate(selectedDate) : 'Enter date'}
            </span>
          </button>
        </div>

        {/* ── Wire info banner ── */}
        <div className="mx-4 my-6 bg-white border border-gray-200 rounded-2xl px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center flex-shrink-0">
            <IconLightbulb />
          </div>
          <p className="text-sm text-gray-700">
            Transferring to another bank?{' '}
            <button type="button" onClick={() => navigate('/transfer/external')} className="text-[#1a6bbf] font-medium">
              External transfer.
            </button>
          </p>
        </div>

        {/* ── Legal & footer ── */}
        <LegalDisclosure />
      </div>

      {/* ══════════════════════════════════
          FIXED BOTTOM BUTTONS
      ══════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white">
        <InsetDivider color={200} />
        <div className="px-4 py-3 flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 py-4 border-2 border-[#1a6bbf] text-[#1a6bbf] font-bold text-sm tracking-widest rounded-full bg-white active:bg-gray-50"
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isReady || loading}
            className={`flex-1 py-4 font-bold text-sm tracking-widest rounded-full transition-colors ${
              isReady && !loading
                ? 'bg-[#002D72] text-white active:bg-[#001d4a]'
                : 'bg-slate-300 text-white cursor-not-allowed'
            }`}
          >
            {loading ? 'PROCESSING…' : 'NEXT'}
          </button>
        </div>
      </div>

      {/* ── Modals ── */}
      <AccountPickerModal
        open={fromModal}
        onClose={() => setFromModal(false)}
        title="From"
        selected={fromAccount}
        onSelect={(acc) => setFromAccount(acc)}
      />
      <AccountPickerModal
        open={toModal}
        onClose={() => setToModal(false)}
        title="To"
        selected={toAccount}
        onSelect={(acc) => setToAccount(acc)}
      />
      <AmountInputModal
        open={amountModal}
        onClose={() => setAmountModal(false)}
        value={amount}
        onDone={(val) => setAmount(val)}
      />
      <DatePickerModal
        open={dateModal}
        onClose={() => setDateModal(false)}
        selectedDate={selectedDate || new Date()}
        onDone={(date) => setSelectedDate(date)}
      />

    </div>
  );
}

export default TransferPage;
