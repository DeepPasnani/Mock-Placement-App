import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { submissionsAPI } from '../../services/api';
import { Badge, ProgressBar, Spinner } from '../../components/shared/UI';
import { Award, ArrowRight, Clock } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

export default function StudentResults() {
  const { data, isLoading } = useQuery('my-submissions', submissionsAPI.getMy);
  const subs = (data?.submissions || []).filter(s => s.status === 'submitted' || s.status === 'auto_submitted');

  if (isLoading) return <div className="flex justify-center py-24"><Spinner size={36} className="text-primary"/></div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-white">My Results</h1>
        <p className="text-gray-500 mt-1 text-sm">{subs.length} test{subs.length !== 1 ? 's' : ''} completed</p>
      </div>

      {subs.length === 0 && (
        <div className="glass rounded-2xl p-16 text-center">
          <Award size={48} className="mx-auto text-gray-600 mb-4"/>
          <h3 className="text-lg font-semibold text-gray-400 mb-1">No results yet</h3>
          <p className="text-gray-500 text-sm mb-4">Complete a test to see your results here.</p>
          <Link to="/student" className="text-primary text-sm hover:underline">Browse available tests →</Link>
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
            <div key={sub.id} className="glass rounded-2xl p-5 hover:bg-surface-light/50 transition-all">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white truncate">{sub.test_title}</h3>
                    <Badge color={passed ? 'green' : 'red'}>{passed ? '✓ Passed' : '✗ Failed'}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock size={12}/> 
                      {m !== null ? `${m}m ${s}s` : '—'}
                    </span>
                    <span>{format(new Date(sub.submitted_at), 'MMM d, HH:mm')}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className={`text-2xl font-bold ${passed ? 'text-emerald-400' : 'text-red-400'}`}>{pct}%</div>
                  <div className="text-xs text-gray-500">{sub.score}/{sub.max_score} marks</div>
                </div>

                <Link to={`/student/results/${sub.id}`} className="p-2 rounded-lg hover:bg-surface-light text-gray-400 hover:text-white transition-colors">
                  <ArrowRight size={18}/>
                </Link>
              </div>

              <div className="mt-3">
                <ProgressBar value={sub.score} max={sub.max_score} color={passed ? 'bg-emerald-500' : 'bg-red-400'} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
