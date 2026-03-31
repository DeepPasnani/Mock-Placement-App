import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { submissionsAPI } from '../../services/api';
import { Badge, ProgressBar, Spinner } from '../../components/shared/UI';
import { Award, ArrowRight, Clock } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

export default function StudentResults() {
  const { data, isLoading } = useQuery('my-submissions', submissionsAPI.getMy);
  const subs = (data?.submissions || []).filter(s => s.status === 'submitted' || s.status === 'auto_submitted');

  if (isLoading) return <div className="flex justify-center py-24"><Spinner size={36} className="text-brand"/></div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Results</h1>
        <p className="text-gray-500 mt-1 text-sm">{subs.length} test{subs.length !== 1 ? 's' : ''} completed</p>
      </div>

      {subs.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
          <Award size={48} className="mx-auto text-gray-300 mb-4"/>
          <h3 className="text-lg font-semibold text-gray-600 mb-1">No results yet</h3>
          <p className="text-gray-400 text-sm mb-4">Complete a test to see your results here.</p>
          <Link to="/student" className="text-brand text-sm hover:underline">Browse available tests →</Link>
        </div>
      )}

      <div className="space-y-4">
        {subs.map(sub => {
          const pct = sub.max_score > 0 ? Math.round((sub.score / sub.max_score) * 100) : 0;
          const passed = pct >= (sub.test_settings?.passingScore || 40);
          const timeTaken = sub.time_taken_seconds;
          const m = timeTaken ? Math.floor(timeTaken / 60) : null;
          const s = timeTaken ? timeTaken % 60 : null;

          return (
            <div key={sub.id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-gray-900 text-base">{sub.test_title}</h3>
                    <Badge color={passed ? 'green' : 'red'}>{passed ? 'Pass' : 'Fail'}</Badge>
                    {sub.status === 'auto_submitted' && <Badge color="yellow">Auto-submitted</Badge>}
                  </div>
                  <div className="flex gap-4 text-xs text-gray-400 mt-1">
                    <span>{sub.submitted_at ? format(new Date(sub.submitted_at), 'dd MMM yyyy, HH:mm') : '—'}</span>
                    {m !== null && <span className="flex items-center gap-0.5"><Clock size={11}/> {m}m {s}s</span>}
                    <span>{formatDistanceToNow(new Date(sub.submitted_at || sub.started_at), { addSuffix: true })}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <ProgressBar value={sub.score} max={sub.max_score} color={passed ? 'bg-accent' : 'bg-red-400'} className="flex-1 max-w-xs" />
                    <span className="text-xs text-gray-500">{sub.score}/{sub.max_score} marks</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-4xl font-extrabold ${passed ? 'text-accent' : 'text-red-500'}`}>{pct}%</div>
                  <Link to={`/student/results/${sub.id}`} className="text-xs text-brand hover:underline flex items-center gap-0.5 justify-end mt-1">
                    Details <ArrowRight size={11}/>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
