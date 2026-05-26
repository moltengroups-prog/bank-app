import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import LegalDisclosure from '../components/LegalDisclosure';
import StepIndicator from '../components/StepIndicator';
import StateSelect from '../components/StateSelect';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

function FormRow({ label, subtitle, placeholder, value, onChange, type = 'text', inputMode }) {
  return (
    <>
      <div className="flex items-center bg-white px-4 py-5 min-h-[60px]">
        <div className="w-36 flex-shrink-0">
          <p className="text-base text-gray-900 leading-snug">{label}</p>
          {subtitle && <p className="text-sm text-gray-400 leading-snug">{subtitle}</p>}
        </div>
        <input
          type={type}
          inputMode={inputMode}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="flex-1 min-w-0 text-right bg-transparent outline-none text-[#1a6bbf] placeholder-[#1a6bbf] text-base"
        />
      </div>
      <div className="border-b border-gray-100" />
    </>
  );
}

const REQUIRED = ['firstName', 'lastName', 'address', 'city', 'state', 'zipCode', 'phoneNumber'];

export default function BillPayPayeeDetailsPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '', lastName: '', nickname: '', identifyingInfo: '',
    address: '', addressTwo: '', city: '', state: '', zipCode: '', phoneNumber: '',
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));
  const canSave = REQUIRED.every(f => form[f].trim().length > 0);

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/bill-pay/payees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name:          `${form.firstName.trim()} ${form.lastName.trim()}`,
          nickname:      form.nickname.trim() || undefined,
          accountNumber: form.identifyingInfo.trim() || undefined,
          address:       form.address.trim(),
          addressTwo:    form.addressTwo.trim() || undefined,
          city:          form.city.trim(),
          state:         form.state,
          zipCode:       form.zipCode.trim(),
          phoneNumber:   form.phoneNumber.trim(),
          category:      'other',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save payee');
      navigate('/bill-pay', { replace: true });
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">
      <AppHeader showBackButton title="Add Payee" showSpacer />
      <div className="flex-1 pt-[64px] overflow-y-auto pb-24">
        <StepIndicator currentStep={2} totalSteps={3} />
        <p className="px-4 pb-5 text-base text-gray-800 leading-snug">Enter the person&#39;s information.</p>
        {error && <p className="px-4 pb-3 text-sm text-red-500">{error}</p>}
        <div>
          <FormRow label="First Name" placeholder="Enter payee first name" value={form.firstName} onChange={set('firstName')} />
          <FormRow label="Last Name" placeholder="Enter payee last name" value={form.lastName} onChange={set('lastName')} />
          <FormRow label="Nickname" subtitle="(Optional)" placeholder="Enter payee nickname" value={form.nickname} onChange={set('nickname')} />
          <FormRow label="Account #" subtitle="(Optional)" placeholder="Identifying Info" value={form.identifyingInfo} onChange={set('identifyingInfo')} />
          <FormRow label="Address" placeholder="Enter payee address" value={form.address} onChange={set('address')} />
          <FormRow label="Address Two" subtitle="(Optional)" placeholder="Enter payee address" value={form.addressTwo} onChange={set('addressTwo')} />
          <FormRow label="City" placeholder="Enter payee city" value={form.city} onChange={set('city')} />
          <StateSelect value={form.state} onChange={(abbr) => setForm(prev => ({ ...prev, state: abbr }))} />
          <FormRow label="ZIP Code" placeholder="Enter payee ZIP code" value={form.zipCode} onChange={set('zipCode')} type="text" inputMode="numeric" />
          <FormRow label="Phone Number" placeholder="Enter payee phone" value={form.phoneNumber} onChange={set('phoneNumber')} type="tel" inputMode="tel" />
        </div>
        <LegalDisclosure />
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-gray-100 border-t border-gray-200 px-4 py-3">
        <div className="flex gap-3">
          <button onClick={() => navigate(-1)} className="flex-1 py-4 bg-white border-2 border-[#002D72] text-[#002D72] font-bold text-sm tracking-widest rounded-full active:bg-gray-50">
            CANCEL
          </button>
          <button onClick={handleSave} disabled={!canSave || saving} className={`flex-1 py-4 font-bold text-sm tracking-widest rounded-full text-white bg-[#4A6FA5] transition-opacity ${canSave && !saving ? 'opacity-100 active:opacity-80' : 'opacity-50'}`}>
            {saving ? 'SAVING…' : 'SAVE'}
          </button>
        </div>
      </div>
    </div>
  );
}
