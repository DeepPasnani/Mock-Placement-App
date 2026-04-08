import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { testsAPI } from '../../services/api';
import { Btn, Badge, Table, ConfirmModal, Spinner } from '../../components/shared/UI';
import { Plus, Edit2, Trash2, Copy, Eye, Clock, BarChart2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function AdminTests() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState(null);
  const { data, isLoading } = useQuery('tests', testsAPI.list);

  const deleteMut = useMutation(testsAPI.delete, {
    onSuccess: () => { toast.success('Test deleted'); qc.invalidateQueries('tests'); },
  });
  const dupMut = useMutation(testsAPI.duplicate, {
    onSuccess: () => { toast.success('Test duplicated'); qc.invalidateQueries('tests'); },
  });

  const tests = data?.tests || [];

  const columns = [
    {
      key: 'title', label: 'Test',
      render: (t) => (
        <div>
          <div className="font-medium text-gray-900">{t.title}</div>
          <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-3">
            <span className="flex items-center gap-1"><Clock size={10}/> {t.duration_minutes} min</span>
            <span>{t.section_count || 0} sections</span>
            <span>{t.submission_count || 0} submissions</span>
          </div>
        </div>
      ),
    },
    {
      key: 'status', label: 'Status',
      render: (t) => <Badge color={t.status === 'published' ? 'green' : t.status === 'archived' ? 'gray' : 'yellow'}>{t.status}</Badge>,
    },
    {
      key: 'start_time', label: 'Schedule',
      render: (t) => t.start_time ? (
        <div className="text-xs text-gray-600">
          <div>{format(new Date(t.start_time), 'dd MMM yyyy, HH:mm')}</div>
          <div className="text-gray-400">to {t.end_time ? format(new Date(t.end_time), 'dd MMM HH:mm') : '—'}</div>
        </div>
      ) : <span className="text-gray-400 text-xs">No schedule</span>,
    },
    {
      key: 'actions', label: '',
      render: (t) => (
        <div className="flex gap-1.5 justify-end">
          <Link to={`/admin/results/${t.id}`}><Btn variant="ghost" size="sm"><BarChart2 size={13}/></Btn></Link>
          <Link to={`/admin/tests/${t.id}/edit`}><Btn variant="ghost" size="sm"><Edit2 size={13}/></Btn></Link>
          <Btn variant="ghost" size="sm" onClick={() => dupMut.mutate(t.id)} title="Duplicate"><Copy size={13}/></Btn>
          <Btn variant="danger" size="sm" onClick={() => setDeleteId(t.id)}><Trash2 size={13}/></Btn>
        </div>
      ),
    },
  ];

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size={32} className="text-brand"/></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tests</h1>
          <p className="text-sm text-gray-500 mt-0.5">{tests.length} total</p>
        </div>
        <Link to="/admin/tests/new">
          <Btn variant="primary"><Plus size={15}/> Create Test</Btn>
        </Link>
      </div>

      {tests.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-16 text-center">
          <BarChart2 size={44} className="mx-auto text-gray-300 mb-3"/>
          <h3 className="text-lg font-medium text-gray-700 mb-1">No tests yet</h3>
          <p className="text-gray-400 text-sm mb-5">Create your first placement test to get started.</p>
          <Link to="/admin/tests/new"><Btn variant="primary"><Plus size={15}/> Create Your First Test</Btn></Link>
        </div>
      ) : (
        <Table columns={columns} data={tests} emptyMessage="No tests found." />
      )}

      <ConfirmModal
        isOpen={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMut.mutate(deleteId)}
        title="Delete Test" confirmLabel="Delete"
        message="Are you sure? This will permanently delete the test and all its submissions. This cannot be undone."
      />
    </div>
  );
}
