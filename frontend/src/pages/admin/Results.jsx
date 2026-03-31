import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { submissionsAPI, testsAPI } from '../../services/api';
import { Table, Badge, Spinner, Btn } from '../../components/shared/UI';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Download } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminResults() {
  const { testId } = useParams();
  const [selectedTest, setSelectedTest] = useState(testId || '');

  const { data: testsData } = useQuery('tests', testsAPI.list);
  const { data: subData, isLoading } = useQuery(
    ['submissions', selectedTest],
    () => submissionsAPI.getForTest(selectedTest),
    { enabled: !!selectedTest }
  );

  const tests = testsData?.tests || [];
  const subs = subData?.submissions || [];

  const exportCSV = () => {
    const rows = [['Name', 'Email', 'Roll No', 'Branch', 'Score', 'Max', 'Percentage', 'Status', 'Submitted At']];
    subs.forEach(s => {
      const pct = s.max_score > 0 ? Math.round((s.score / s.max_score) * 100) : 0;
      rows.push([s.user_name, s.user_email, s.roll_number || '', s.branch || '', s.score, s.max_score, `${pct}%`, pct >= 40 ? 'Pass' : 'Fail', s.submitted_at ? format(new Date(s.submitted_at), 'dd/MM/yyyy HH:mm') : '']);
    });
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `results_${selectedTest}.csv`; a.click();
  };

  const test = tests.find(t => t.id === selectedTest);
  const scored = subs.filter(s => s.status === 'submitted' && s.max_score > 0);
  const avgPct = scored.length ? Math.round(scored.reduce((a, s) => a + (s.score / s.max_score * 100), 0) / scored.length) : 0;
  const passCount = scored.filter(s => (s.score / s.max_score * 100) >= 40).length;

  // Score distribution for chart
  const buckets = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  const dist = buckets.slice(0, -1).map((b, i) => ({
    range: `${b}-${buckets[i+1]}`,
    count: scored.filter(s => { const p = (s.score / s.max_score) * 100; return p >= b && p < buckets[i+1]; }).length,
    passing: b >= 40,
  }));

  const columns = [
    { key: 'rank', label: '#', render: (_, i) => <span className="font-mono text-gray-400 text-xs">{i+1}</span> },
    { key: 'user_name', label: 'Student', render: s => (
      <div><div className="font-medium text-gray-900">{s.user_name}</div><div className="text-xs text-gray-400">{s.user_email}</div></div>
    )},
    { key: 'roll_number', label: 'Roll / Branch', render: s => <span className="text-xs text-gray-600">{s.roll_number || '—'} {s.branch ? `· ${s.branch}` : ''}</span> },
    { key: 'score', label: 'Score', render: s => <span className="font-bold text-gray-900">{s.score}/{s.max_score}</span> },
    { key: 'pct', label: '%', render: s => {
      const pct = s.max_score > 0 ? Math.round((s.score / s.max_score) * 100) : 0;
      return <span className={`font-semibold ${pct >= 40 ? 'text-accent' : 'text-red-500'}`}>{pct}%</span>;
    }},
    { key: 'status', label: 'Result', render: s => {
      const pct = s.max_score > 0 ? Math.round((s.score / s.max_score) * 100) : 0;
      return <Badge color={pct >= 40 ? 'green' : 'red'}>{pct >= 40 ? 'Pass' : 'Fail'}</Badge>;
    }},
    { key: 'time', label: 'Time Taken', render: s => {
      if (!s.time_taken_seconds) return '—';
      const m = Math.floor(s.time_taken_seconds / 60), sec = s.time_taken_seconds % 60;
      return <span className="text-xs text-gray-500">{m}m {sec}s</span>;
    }},
    { key: 'submitted_at', label: 'Submitted', render: s => s.submitted_at ? <span className="text-xs text-gray-500">{format(new Date(s.submitted_at), 'dd MMM, HH:mm')}</span> : '—' },
  ];

  // inject rank index for table
  const rankedSubs = subs.map((s, i) => ({ ...s, _rank: i }));

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Results</h1>
        {selectedTest && subs.length > 0 && (
          <Btn variant="ghost" onClick={exportCSV}><Download size={14}/> Export CSV</Btn>
        )}
      </div>

      {/* Test selector */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Select Test to View Results</label>
        <select value={selectedTest} onChange={e => setSelectedTest(e.target.value)}
          className="w-full md:w-96 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-brand">
          <option value="">— Select a test —</option>
          {tests.map(t => <option key={t.id} value={t.id}>{t.title} ({t.submission_count || 0} submissions)</option>)}
        </select>
      </div>

      {!selectedTest && (
        <div className="text-center py-16 text-gray-400">Select a test above to view its results.</div>
      )}

      {selectedTest && isLoading && <div className="flex justify-center py-16"><Spinner size={32} className="text-brand"/></div>}

      {selectedTest && !isLoading && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Submissions', value: subs.length },
              { label: 'Average Score',     value: `${avgPct}%` },
              { label: 'Pass Count',        value: passCount },
              { label: 'Pass Rate',         value: scored.length ? `${Math.round((passCount/scored.length)*100)}%` : '—' },
            ].map(c => (
              <div key={c.label} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                <div className="text-xs text-gray-400 mb-1">{c.label}</div>
                <div className="text-2xl font-bold text-gray-900">{c.value}</div>
              </div>
            ))}
          </div>

          {/* Score distribution chart */}
          {scored.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
              <h3 className="font-semibold text-gray-800 mb-4 text-sm">Score Distribution</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={dist} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip formatter={(v) => [`${v} students`]} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {dist.map((d, i) => <Cell key={i} fill={d.passing ? '#0e9f6e' : '#ef4444'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-4 justify-center mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-accent rounded-sm inline-block"/>&nbsp;Pass (≥40%)</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-400 rounded-sm inline-block"/>&nbsp;Fail (&lt;40%)</span>
              </div>
            </div>
          )}

          <Table columns={columns} data={rankedSubs} emptyMessage="No submissions for this test yet." />
        </>
      )}
    </div>
  );
}
