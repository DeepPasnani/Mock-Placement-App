import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { submissionsAPI } from '../../services/api';
import { Badge, ProgressBar, Spinner, Alert } from '../../components/shared/UI';
import { ChevronLeft, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function ResultDetail() {
  const { submissionId } = useParams();
  const { data, isLoading } = useQuery(['submission', submissionId], () => submissionsAPI.get(submissionId));

  if (isLoading) return <div className="flex justify-center py-24"><Spinner size={36} className="text-brand"/></div>;
  if (!data) return <div className="text-center py-16 text-gray-400">Submission not found.</div>;

  const sub = data.submission;
  const pct = sub.max_score > 0 ? Math.round((sub.score / sub.max_score) * 100) : 0;
  const passed = pct >= (sub.test_settings?.passingScore || 40);
  const showDetails = sub.test_settings?.showResults === 'after_submit';
  const codeResults = sub.code_results || {};
  const m = sub.time_taken_seconds ? Math.floor(sub.time_taken_seconds / 60) : null;
  const s = sub.time_taken_seconds ? sub.time_taken_seconds % 60 : null;

  return (
    <div>
      <Link to="/student/results" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand mb-6">
        <ChevronLeft size={16}/> Back to Results
      </Link>

      {/* Hero result card */}
      <div className={`rounded-2xl p-8 text-white mb-6 ${passed ? 'bg-gradient-to-br from-accent to-green-700' : 'bg-gradient-to-br from-red-500 to-red-700'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold mb-1">{sub.test_title}</h1>
            <p className="text-white/70 text-sm">{sub.submitted_at ? format(new Date(sub.submitted_at), 'dd MMM yyyy, HH:mm') : ''}</p>
          </div>
          <div className="text-right">
            <div className="text-6xl font-extrabold">{pct}%</div>
            <div className="text-white/80 text-sm mt-0.5">{sub.score}/{sub.max_score} marks</div>
          </div>
        </div>

        <div className="mt-6 flex gap-8 flex-wrap">
          <div><div className="text-white/60 text-xs mb-0.5">Result</div><div className="font-bold text-lg">{passed ? '🎉 Passed' : '📚 Failed'}</div></div>
          {m !== null && <div><div className="text-white/60 text-xs mb-0.5">Time Taken</div><div className="font-bold text-lg">{m}m {s}s</div></div>}
          {sub.test_settings?.passingScore && <div><div className="text-white/60 text-xs mb-0.5">Passing Score</div><div className="font-bold text-lg">{sub.test_settings.passingScore}%</div></div>}
          {sub.status === 'auto_submitted' && <div><div className="text-white/60 text-xs mb-0.5">Submitted</div><div className="font-bold text-lg">Auto (time up)</div></div>}
        </div>

        <div className="mt-4">
          <ProgressBar value={sub.score} max={sub.max_score} color="bg-white/60" className="h-2.5" />
        </div>
      </div>

      {/* Coding results (if any) */}
      {Object.keys(codeResults).length > 0 && showDetails && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-5">
          <h2 className="font-bold text-gray-900 mb-4">Coding Results</h2>
          {Object.entries(codeResults).map(([pid, r]) => (
            <div key={pid} className="mb-4 border border-gray-100 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-2.5 flex justify-between items-center">
                <span className="font-medium text-sm text-gray-700">Problem {pid.slice(0, 8)}…</span>
                <span className="text-sm font-bold text-brand">{r.earned || 0} marks</span>
              </div>
              {r.results && (
                <div className="divide-y divide-gray-50">
                  {r.results.filter(tc => !tc.hidden).map((tc, i) => (
                    <div key={i} className="px-4 py-2 flex items-start gap-3">
                      {tc.passed ? <CheckCircle size={15} className="text-accent mt-0.5 shrink-0"/> : <XCircle size={15} className="text-red-400 mt-0.5 shrink-0"/>}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-600 mb-1">Test Case {i+1} — {tc.status}</div>
                        {!tc.passed && tc.actual !== undefined && (
                          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                            <div><span className="text-gray-400">Expected: </span><span className="text-green-600">{tc.expected}</span></div>
                            <div><span className="text-gray-400">Got: </span><span className="text-red-500">{tc.actual || '(empty)'}</span></div>
                          </div>
                        )}
                        {tc.time && <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><Clock size={10}/> {tc.time}s</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {r.error && <div className="px-4 py-2 text-xs text-red-500">{r.error}</div>}
            </div>
          ))}
        </div>
      )}

      {!showDetails && (
        <Alert type="info">
          Detailed answer breakdown will be made available by your placement coordinator.
        </Alert>
      )}
    </div>
  );
}
