import { useEffect, useMemo, useState } from 'react';
import { DollarSign, Calendar, User, CheckCircle, XCircle, Clock, Search } from 'lucide-react';
import { PageContainer, DashboardHeader } from '@/components/shared';

const API_BASE_URL = 'https://telemedicine-be.onrender.com';

interface PaymentItem {
  id: string;
  amount: string | number;
  method: string;
  status: 'PENDING' | 'PAID' | 'FAILED';
  createdAt: string;
  appointment?: { id: string; appointmentDate?: string };
  patient?: { user?: { fullName?: string } };
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    minimumFractionDigits: 0,
  }).format(amount);
};

const PaymentsPage = () => {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [hospital, setHospital] = useState<any>(null);
  const [paymentPhone, setPaymentPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).token : null;
      const userId = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).id : null;
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
      const [hospitalsRes, paymentsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/hospitals`, { headers }),
        fetch(`${API_BASE_URL}/payments`, { headers }),
      ]);
      const hospitalsData = await hospitalsRes.json();
      const paymentsData = await paymentsRes.json();
      const myHospital = (hospitalsData.data || []).find((h: any) => h.adminId === userId);
      setHospital(myHospital || null);
      if (myHospital?.paymentPhone) setPaymentPhone(myHospital.paymentPhone);
      setPayments(paymentsData.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const savePaymentPhone = async () => {
    if (!hospital?.id) return;
    if (paymentPhone && !/^07\d{8}$/.test(paymentPhone)) {
      alert('Invalid Rwandan phone number. Use 07XXXXXXXX');
      return;
    }
    try {
      setSaving(true);
      const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).token : null;
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
      const res = await fetch(`${API_BASE_URL}/hospitals/${hospital.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ paymentPhone: paymentPhone || null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to save payment phone');
      }
      await fetchAll();
    } catch (e: any) {
      alert(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const filteredPayments = useMemo(() => {
    if (!search) return payments;
    const s = search.toLowerCase();
    return payments.filter((p) => {
      const patient = p.patient?.user?.fullName?.toLowerCase() || '';
      const method = p.method?.toLowerCase() || '';
      const status = p.status?.toLowerCase() || '';
      return patient.includes(s) || method.includes(s) || status.includes(s) || p.id.toLowerCase().includes(s);
    });
  }, [payments, search]);

  return (
    <PageContainer>
      <DashboardHeader
        icon={DollarSign}
        title="Payments"
        subtitle="Manage hospital payment settings and view payment history"
        onRefresh={fetchAll}
        loading={loading}
      />

      {/* Payment Phone Settings */}
      <div className="mb-6 p-4 rounded-lg border border-gray-200 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hospital Mobile Money Number (hidden from patients)
            </label>
            <input
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="07XXXXXXXX"
              value={paymentPhone}
              onChange={(e) => setPaymentPhone(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Only Hospital Admins can edit this. Patients will not see this number.
            </p>
          </div>
          <button
            onClick={savePaymentPhone}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 p-4 rounded-lg border border-gray-200 bg-white flex items-center gap-3">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 outline-none"
          placeholder="Search by patient, method, status, or payment ID..."
        />
      </div>

      {/* Payments Table */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="grid grid-cols-6 gap-4 p-4 bg-gray-50 text-sm font-semibold text-gray-700">
          <div>Payment</div>
          <div>Patient</div>
          <div>Amount</div>
          <div>Method</div>
          <div>Status</div>
          <div>Date</div>
        </div>
        <div>
          {filteredPayments.length === 0 ? (
            <div className="p-10 text-center text-gray-500">No payments found</div>
          ) : (
            filteredPayments.map((p) => {
              const date = p.appointment?.appointmentDate || p.createdAt;
              const statusBadge =
                p.status === 'PAID'
                  ? 'text-green-700 bg-green-50 border border-green-200'
                  : p.status === 'PENDING'
                  ? 'text-yellow-700 bg-yellow-50 border border-yellow-200'
                  : 'text-red-700 bg-red-50 border border-red-200';
              const StatusIcon = p.status === 'PAID' ? CheckCircle : p.status === 'PENDING' ? Clock : XCircle;
              return (
                <div key={p.id} className="grid grid-cols-6 gap-4 p-4 border-t text-sm items-center">
                  <div className="truncate">{p.id}</div>
                  <div className="truncate flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    {p.patient?.user?.fullName || '—'}
                  </div>
                  <div className="font-semibold">{formatCurrency(Number(p.amount || 0))}</div>
                  <div>{p.method}</div>
                  <div>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusBadge}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {p.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    {new Date(date).toLocaleString()}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default PaymentsPage;


