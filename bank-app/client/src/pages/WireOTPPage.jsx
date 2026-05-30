import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TransactionAuthFlow from '../components/TransactionAuthFlow';
import { api } from '../services/api';
import { useWireRecipientsStore } from '../store/wireRecipientsStore';

const WIRE_FEE = 30;

export default function WireOTPPage() {
  const navigate = useNavigate();

  const selectedRecipient   = useWireRecipientsStore((s) => s.selectedRecipient);
  const selectedFromAccount = useWireRecipientsStore((s) => s.selectedFromAccount);
  const amount              = useWireRecipientsStore((s) => s.amount);
  const memo                = useWireRecipientsStore((s) => s.memo);
  const setWireResult       = useWireRecipientsStore((s) => s.setWireResult);

  // Guard — must arrive via review page
  useEffect(() => {
    if (!selectedRecipient || !selectedFromAccount || !amount) {
      navigate('/wire-transfer/review', { replace: true });
    }
  }, [selectedRecipient, selectedFromAccount, amount, navigate]);

  if (!selectedRecipient || !selectedFromAccount || !amount) return null;

  const parsedAmount  = parseFloat(String(amount).replace(/[^0-9.]/g, '')) || 0;
  const recipientName = [
    selectedRecipient.firstName,
    selectedRecipient.lastName,
    selectedRecipient.businessName,
  ].filter(Boolean).join(' ') || 'Recipient';

  // Called by TransactionAuthFlow when NEXT is clicked
  const handleRequestOTP = async () => {
    const res = await api.post('/wire-transfers/request-otp', {});
    return res.wireOtpToken;
  };

  // Called by TransactionAuthFlow when VERIFY IDENTITY is clicked
  const handleVerify = async (wireOtpToken, wireOtpCode) => {
    const res = await api.post('/wire-transfers', {
      fromAccountId: selectedFromAccount.id  || selectedFromAccount._id,
      recipientId:   selectedRecipient._id   || selectedRecipient.id,
      amount:        parsedAmount,
      memo:          (memo || '').trim(),
      wireOtpToken,
      wireOtpCode,
    });

    setWireResult({
      referenceNumber: res.data?.referenceNumber || '—',
      amount:          parsedAmount,
      fee:             WIRE_FEE,
      total:           parsedAmount + WIRE_FEE,
      pendingReview:   res.pendingReview || false,
      recipientName,
      fromAccountName: selectedFromAccount.accountName,
      submittedAt:     new Date(),
    });

    navigate('/wire-transfer/success', { replace: true });
  };

  return (
    <TransactionAuthFlow
      pageTitle="Send Money"
      transactionType="Wire Transfer"
      amount={parsedAmount}
      recipient={recipientName}
      fromAccount={selectedFromAccount.accountName}
      onRequestOTP={handleRequestOTP}
      onVerify={handleVerify}
      onCancel={() => navigate('/wire-transfer/review')}
    />
  );
}
