import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { usersAPI, testsAPI } from '../../services/api';
import { StatCard, Badge, Spinner } from '../../components/shared/UI';
import { FileText, Users, CheckSquare, TrendingUp, Plus, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AdminDashboard() {
  const { data: stats, isLoading: loadingStats } = useQuery('admin-stats', usersAPI.stats, { refetchInterval: 60000 });
  const { data: testsData } = useQuery('tests', testsAPI.list);

  if (loadingStats) return <div className="flex items-center justify-center h-64"><Spinner size={32} className="text-brand" /></div>;

  const s = stats || {};
  const recentTests = testsData?.tests?.slice(0, 5) || [];

  return (
    <div>
      <div className="flex justify-between items-center mb-7">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Overview of your placement platform</p>
        </div>
        <Link to="/admin/tests/new"
          className="btn-primary flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-brand text-white hover:bg-brand-dark font-medium transition-colors">
          <Plus size={15} /> Create Test
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Tests" value={s.tests ? Object.values(s.tests).reduce((a,b)=>a+b,0) : 0} icon={FileText} color="blue" sub={`${s.tests?.published || 0} published`} />
        <StatCard label="Students" value={s.users?.student || 0} icon={Users} color="green" sub="registered" />
        <StatCard label="Submissions" value={s.submissions?.total || 0} icon={CheckSquare} color="purple" sub="total attempts" />
        <StatCard label="Avg Score" value={`${s.submissions?.avgPercentage || 0}%`} icon={TrendingUp} color="yellow" sub="across all tests" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tests */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">Recent Tests</h3>
            <Link to="/admin/tests" className="text-xs text-brand hover:underline flex items-center gap-1">View all <ArrowRight size={12} /></Link>
          </div>
          {recentTests.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              <FileText size={32} className="mx-auto mb-2 opacity-40" />
              No tests yet. <Link to="/admin/tests/new" className="text-brand hover:underline">Create one →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTests.map(t => (
                <div key={t.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <div className="min-w-0 mr-3">
                    <Link to={`/admin/tests/${t.id}/edit`} className="font-medium text-sm text-gray-900 hover:text-brand truncate block">{t.title}</Link>
                    <span className="text-xs text-gray-400">{t.duration_minutes} min · {t.section_count || 0} sections</span>
                  </div>
                  <Badge color={t.status === 'published' ? 'green' : t.status === 'archived' ? 'gray' : 'yellow'}>{t.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Submissions */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">Recent Submissions</h3>
            <Link to="/admin/results" className="text-xs text-brand hover:underline flex items-center gap-1">View all <ArrowRight size={12} /></Link>
          </div>
          {!s.recentSubmissions?.length ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              <CheckSquare size={32} className="mx-auto mb-2 opacity-40" />
              No submissions yet.
            </div>
          ) : (
            <div className="space-y-3">
              {s.recentSubmissions.slice(0, 6).map(sub => {
                const pct = sub.max_score > 0 ? Math.round((sub.score / sub.max_score) * 100) : 0;
                return (
                  <div key={sub.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                    <div className="min-w-0 mr-3">
                      <div className="text-sm font-medium text-gray-900 truncate">{sub.user_name}</div>
                      <div className="text-xs text-gray-400 truncate">{sub.test_title}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-sm font-bold ${pct >= 40 ? 'text-accent' : 'text-red-500'}`}>{pct}%</div>
                      <div className="text-xs text-gray-400">{formatDistanceToNow(new Date(sub.submitted_at), { addSuffix: true })}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
