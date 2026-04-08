import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { usersAPI } from '../../services/api';
import { Btn, Table, Badge, Modal, Input, Alert, ConfirmModal, Spinner } from '../../components/shared/UI';
import { UserPlus, Upload, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function AdminUsers() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  const { data, isLoading } = useQuery(['users', 'student', search], () => usersAPI.list({ role: 'student', search }), { debounce: 300 });
  const deleteMut = useMutation(usersAPI.delete, { onSuccess: () => { toast.success('User removed'); qc.invalidateQueries('users'); } });
  const toggleMut = useMutation(({ id, isActive }) => usersAPI.update(id, { isActive }), { onSuccess: () => { toast.success('Updated'); qc.invalidateQueries('users'); } });
  const importMut = useMutation(
    () => {
      const lines = csvText.trim().split('\n').slice(1); // skip header
      const students = lines.map(l => {
        const [name, email, branch, rollNumber] = l.split(',').map(s => s.trim().replace(/"/g, ''));
        return { name, email, branch, rollNumber };
      }).filter(s => s.email);
      return usersAPI.bulkImport({ students });
    },
    { onSuccess: (r) => { toast.success(`Created ${r.created} students`); qc.invalidateQueries('users'); setShowImport(false); setCsvText(''); } }
  );

  const users = data?.users || [];

  const columns = [
    { key: 'name', label: 'Student', render: u => (
      <div>
        <div className="font-medium text-gray-900">{u.name || '—'}</div>
        <div className="text-xs text-gray-400">{u.email}</div>
      </div>
    )},
    { key: 'roll_number', label: 'Roll / Branch', render: u => <span className="text-sm text-gray-600">{u.roll_number || '—'} {u.branch ? `· ${u.branch}` : ''}</span> },
    { key: 'login', label: 'Login', render: u => <Badge color={u.google_id ? 'blue' : 'gray'}>{u.google_id ? 'Google' : 'Email'}</Badge> },
    { key: 'status', label: 'Status', render: u => <Badge color={u.is_active ? 'green' : 'red'}>{u.is_active ? 'Active' : 'Inactive'}</Badge> },
    { key: 'last_login', label: 'Last Login', render: u => u.last_login ? <span className="text-xs text-gray-500">{format(new Date(u.last_login), 'dd MMM yyyy')}</span> : <span className="text-xs text-gray-400">Never</span> },
    { key: 'actions', label: '', render: u => (
      <div className="flex gap-1.5 justify-end">
        <button onClick={() => toggleMut.mutate({ id: u.id, isActive: !u.is_active })} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500" title={u.is_active ? 'Deactivate' : 'Activate'}>
          {u.is_active ? <ToggleRight size={16} className="text-accent"/> : <ToggleLeft size={16}/>}
        </button>
        <Btn variant="danger" size="sm" onClick={() => setDeleteId(u.id)}><Trash2 size={13}/></Btn>
      </div>
    )},
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-sm text-gray-500 mt-0.5">{data?.total || 0} registered</p>
        </div>
        <Btn variant="primary" onClick={() => setShowImport(true)}><Upload size={14}/> Bulk Import</Btn>
      </div>

      <div className="mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…"
          className="w-full md:w-80 px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand" />
      </div>

      {isLoading ? <div className="flex justify-center py-16"><Spinner size={32} className="text-brand"/></div>
        : <Table columns={columns} data={users} emptyMessage="No students found." />}

      {/* Bulk Import Modal */}
      <Modal isOpen={showImport} onClose={() => setShowImport(false)} title="Bulk Import Students"
        footer={<><Btn variant="ghost" onClick={() => setShowImport(false)}>Cancel</Btn><Btn variant="primary" onClick={() => importMut.mutate()} disabled={!csvText.trim() || importMut.isLoading}>{importMut.isLoading ? 'Importing…' : 'Import Students'}</Btn></>}>
        <Alert type="info" className="mb-4">Paste CSV with header row. Students receive a temporary password and must reset it.</Alert>
        <p className="text-xs text-gray-500 mb-2 font-mono bg-gray-50 p-2 rounded">name,email,branch,rollNumber<br/>Alice Smith,alice@college.edu,CSE,CS001<br/>Bob Jones,bob@college.edu,IT,IT042</p>
        <textarea value={csvText} onChange={e => setCsvText(e.target.value)} rows={10} placeholder="Paste CSV data here…"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono outline-none focus:border-brand resize-y" />
        {importMut.data && (
          <Alert type="success" className="mt-3">Created: {importMut.data.created} · Skipped: {importMut.data.skipped}</Alert>
        )}
      </Modal>

      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteMut.mutate(deleteId)}
        title="Remove Student" message="This will permanently delete the student and all their submissions." confirmLabel="Remove" />
    </div>
  );
}
