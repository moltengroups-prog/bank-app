'use client';
import { useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import AdminTopbar from '../../../components/AdminTopbar.jsx';
import AdminStatsCard from '../../../components/AdminStatsCard.jsx';
import { useAnalyticsStore } from '../../../store/analyticsStore.js';

const fmt    = (n) => n == null ? '—' : Number(n).toLocaleString('en-US');
const fmtUSD = (n) => n == null ? '—' : '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const PIE_COLORS = ['#1d4ed8','#0ea5e9','#06b6d4','#14b8a6','#10b981','#84cc16','#eab308','#f97316'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2">
      <p className="text-xs font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-xs text-slate-600">
          <span style={{ color: p.color }}>{p.name}: </span>
          {p.name === 'Volume' ? fmtUSD(p.value) : fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export default function AnalyticsPage() {
  const { overview, loading, error, fetchOverview } = useAnalyticsStore();

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const stats = overview;

  const STAT_CARDS = [
    { label: 'Total Customers',  value: fmt(stats?.totalUsers),       color: 'blue' },
    { label: 'Active Accounts',  value: fmt(stats?.totalAccounts),    color: 'green' },
    { label: 'Total AUM',        value: fmtUSD(stats?.totalBalance),  color: 'purple' },
    { label: "Today's Volume",   value: fmtUSD(stats?.todayVolume),   color: 'green' },
    { label: 'Frozen Accounts',  value: fmt(stats?.frozenAccounts),   color: 'amber' },
    { label: 'Open Support',     value: fmt(stats?.openConversations),color: 'red' },
  ];

  const catData = (stats?.categoryBreakdown || []).map((c) => ({
    name:  c.category,
    value: Math.round(c.volume),
    count: c.count,
  }));

  const dailyData = (stats?.dailyVolume || []).map((d) => ({
    date:   d.date.slice(5),
    Volume: d.volume,
    Count:  d.count,
  }));

  return (
    <div className="flex-1 overflow-y-auto">
      <AdminTopbar
        title="Analytics"
        subtitle="Platform-wide operational metrics"
        actions={
          <button
            onClick={fetchOverview}
            className="text-xs px-3 py-1.5 border border-slate-200 rounded text-slate-600 hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            Refresh
          </button>
        }
      />

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
        {loading && !stats && (
          <div className="text-center py-12 text-sm text-slate-400">Loading analytics…</div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {stats && (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {STAT_CARDS.map((s) => <AdminStatsCard key={s.label} {...s} />)}
            </div>

            {/* Line + Bar charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
              <ChartCard title="30-Day Transfer Volume" subtitle="Daily cumulative transaction volume">
                {dailyData.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">No data yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={dailyData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(v) => '$' + (v / 1000).toFixed(0) + 'k'} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="Volume" stroke="#1d4ed8" strokeWidth={2} dot={false} name="Volume" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>

              <ChartCard title="Daily Transaction Count" subtitle="Number of transactions per day">
                {dailyData.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">No data yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={dailyData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="Count" fill="#3b82f6" radius={[2, 2, 0, 0]} name="Count" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>
            </div>

            {/* Category breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
              {/* Pie Chart */}
              <ChartCard title="Transaction Categories" subtitle="Volume distribution by category">
                {catData.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">No data yet</p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={catData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={70}
                          dataKey="value"
                          stroke="none"
                        >
                          {catData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => fmtUSD(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
                      {catData.map((c, i) => (
                        <div key={c.name} className="flex items-center gap-2 min-w-0">
                          <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <span className="text-[11px] text-slate-600 truncate capitalize flex-1">{c.name}</span>
                          <span className="text-[11px] text-slate-500 font-medium flex-shrink-0">{fmtUSD(c.value)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </ChartCard>

              {/* Category table */}
              <ChartCard title="Category Details" subtitle="Transaction count and volume">
                {catData.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">No data yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs min-w-[240px]">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
                          <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Count</th>
                          <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Volume</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {catData.map((c, i) => (
                          <tr key={c.name}>
                            <td className="py-2">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                <span className="capitalize text-slate-700">{c.name}</span>
                              </div>
                            </td>
                            <td className="py-2 text-right text-slate-600">{fmt(c.count)}</td>
                            <td className="py-2 text-right font-medium text-slate-800">{fmtUSD(c.value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </ChartCard>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
