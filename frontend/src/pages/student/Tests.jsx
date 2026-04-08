import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { testsAPI, submissionsAPI } from '../../services/api';
import { Btn, Badge, Spinner, ProgressBar } from '../../components/shared/UI';
import { Clock, Play, CheckCircle, Lock, Calendar, ClipboardList } from 'lucide-react';
import { format, isPast, isFuture } from 'date-fns';
import toast from 'react-hot-toast';

export default function StudentTests() {
  const navigate = useNavigate();
  const { data: testsData, isLoading: loadingTests } = useQuery('student-tests', testsAPI.list);
  const { data: mySubsData } = useQuery('my-submissions', submissionsAPI.getMy);

  const tests = testsData?.tests || [];
  const mySubs = mySubsData?.submissions || [];
  const getSubmission = (testId) => mySubs.find(s => s.test_id === testId);

  const handleStartTest = async (test) => {
    const now = new Date();
    if (test.start_time && isFuture(new Date(test.start_time))) {
      toast.error('This test has not started yet.');
      return;
    }
    if (test.end_time && isPast(new Date(test.end_time))) {
      toast.error('This test has ended.');
      return;
    }
    navigate(`/test/${test.id}`);
  };

  if (loadingTests) return (
    <div className="flex justify-center py-24"><Spinner size={36} className="text-primary" /></div>
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-white">Available Tests</h1>
        <p className="text-gray-500 mt-1 text-sm">
          {tests.length} test{tests.length !== 1 ? 's' : ''} available · Read instructions carefully before starting
        </p>
      </div>

      {tests.length === 0 && (
        <div className="glass rounded-2xl p-16 text-center">
          <ClipboardList size={48} className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-1">No tests available</h3>
          <p className="text-gray-500 text-sm">Tests published by your placement coordinator will appear here.</p>
        </div>
      )}

      <div className="space-y-4">
        {tests.map(test => {
          const sub = getSubmission(test.id);
          const submitted = sub?.status === 'submitted' || sub?.status === 'auto_submitted';
          const inProgress = sub?.status === 'in_progress';
          const now = new Date();
          const started  = !test.start_time || isPast(new Date(test.start_time));
          const notEnded = !test.end_time   || isFuture(new Date(test.end_time));
          const available = started && notEnded;

          const totalQ = (test.sections || []).reduce((n, s) => n + (s.section_count || 0), 0);
          const pct = submitted && sub.max_score > 0 ? Math.round((sub.score / sub.max_score) * 100) : null;
          const passed = pct !== null && pct >= (test.settings?.passingScore || 40);

          return (
            <div key={test.id} className="glass rounded-2xl p-6 hover:bg-surface-light/50 transition-all">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h2 className="text-lg font-bold text-white">{test.title}</h2>
                    {submitted && <Badge color={passed ? 'green' : 'red'}>{passed ? '✓ Passed' : '✗ Failed'}</Badge>}
                    {inProgress && <Badge color="yellow">In Progress</Badge>}
                    {!started && <Badge color="gray">Upcoming</Badge>}
                    {started && !notEnded && !submitted && <Badge color="red">Ended</Badge>}
                  </div>

                  {test.description && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{test.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                    <span className="flex items-center gap-1"><Clock size={13}/> {test.duration_minutes} minutes</span>
                    {test.start_time && (
                      <span className="flex items-center gap-1">
                        <Calendar size={13}/>
                        {format(new Date(test.start_time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), 'dd MMM yyyy, HH:mm')}
                        {test.end_time && ` – ${format(new Date(test.end_time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), 'HH:mm')}`}
                      </span>
                    )}
                    {test.settings?.passingScore && (
                      <span>Pass: {test.settings.passingScore}%</span>
                    )}
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {(test.sections || []).map(sec => (
                      <span key={sec.id} className={`text-xs font-medium px-2.5 py-1 rounded-full ${sec.type === 'coding' ? 'bg-secondary/20 text-secondary' : 'bg-purple-500/20 text-purple-400'}`}>
                        {sec.name} ({sec.questions?.length || 0} Q)
                      </span>
                    ))}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  {submitted ? (
                    <div>
                      <div className={`text-3xl font-extrabold mb-0.5 ${passed ? 'text-emerald-400' : 'text-red-400'}`}>
                        {pct}%
                      </div>
                      <div className="text-xs text-gray-500 mb-2">{sub.score}/{sub.max_score} marks</div>
                      <ProgressBar value={sub.score} max={sub.max_score} color={passed ? 'bg-emerald-500' : 'bg-red-400'} className="w-28" />
                    </div>
                  ) : inProgress ? (
                    <Btn variant="warning" onClick={() => handleStartTest(test)}>
                      <Play size={14}/> Resume
                    </Btn>
                  ) : available ? (
                    <Btn variant="primary" size="lg" onClick={() => handleStartTest(test)}>
                      <Play size={15}/> Start Test
                    </Btn>
                  ) : !started ? (
                    <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                      <Clock size={14}/> Not started
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                      <Lock size={14}/> Ended
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
