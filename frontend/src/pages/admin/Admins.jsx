import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { usersAPI } from '../../services/api';
import { useStore } from '../../store';
import { Btn, Table, Badge, Modal, Input, Alert, ConfirmModal, Spinner } from '../../components/shared/UI';
import { ShieldPlus, Trash2, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function AdminAdmins() {
  const qc = useQueryClient();
  const { user: me } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', isSuperAdmin: false });
  const [formErr, setFormErr] = useState('');

  const isSuperAdmin = me?.is_super_admin === true;

  const { data, isLoading } = useQuery(['users', 'admin'], () => usersAPI.list({ role: 'admin' }));
  const createMut = useMutation(usersAPI.createAdmin, {
    onSuccess: () => { toast.success('Admin account created'); qc.invalidateQueries(['users', 'admin']); setShowAdd(false); setForm({ name: '', email: '', password: '', isSuperAdmin: false }); },
    onError: (e) => setFormErr(e.response?.data?.error || 'Failed to create admin'),
  });
  const deleteMut = useMutation(usersAPI.delete, {
    onSuccess: () => { toast.success('Admin removed'); qc.invalidateQueries(['users', 'admin']); },
  });

  const admins = data?.users || [];

  const handleCreate = () => {
    setFormErr('');
    if (!form.name || !form.email || !form.password) { setFormErr('All fields are required.'); return; }
    if (form.password.length < 8) { setFormErr('Password must be at least 8 characters.'); return; }
    createMut.mutate({
      name: form.name,
      email: form.email,
      password: form.password,
      isSuperAdmin: form.isSuperAdmin,
    });
  };

  const columns = [
    { key: 'name', label: 'Name', render: u => (
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 bg-brand-light rounded-full flex items-center justify-center text-brand font-bold text-sm shrink-0">
          {(u.name || u.email)[0].toUpperCase()}
        </div>
        <div>
          <div className="font-medium text-gray-900 text-sm">{u.name}</div>
          <div className="text-gray-500 text-xs">{u.email}</div>
        </div>
      </div>
    )},
    { key: 'role', label: 'Role', render: u => (
      u.is_super_admin ? (
        <Badge color="amber"><Shield size={12} className="mr-1"/> Super Admin</Badge>
      ) : (
        <Badge color="blue">Admin</Badge>
      )
    )},
    { key: 'created_at', label: 'Created', render: u => u.created_at ? <span className="text-xs text-gray-500">{format(new Date(u.created_at), 'dd MMM yyyy')}</span> : '—' },
    { key: 'actions', label: '', render: u => (u.is_super_admin && !isSuperAdmin) ? null : (
      u.id === me?.id ? null : <Btn variant="danger" size="sm" onClick={() => setDeleteId(u.id)}><Trash2 size={13}/></Btn>
    )},
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Accounts</h1>
          <p className="text-sm text-gray-500 mt-0.5">{admins.length} admins with platform access</p>
        </div>
        <Btn variant="primary" onClick={() => setShowAdd(true)}><ShieldPlus size={14}/> Add Admin</Btn>
      </div>

      <Alert type="warning" className="mb-5">
        Admin accounts can create/edit tests, view all student results, and manage users. Only grant access to trusted staff.
      </Alert>

      {isLoading ? <div className="flex justify-center py-16"><Spinner size={32} className="text-brand"/></div>
        : <Table columns={columns} data={admins} emptyMessage="No admin accounts found." />}

      <Modal isOpen={showAdd} onClose={() => { setShowAdd(false); setFormErr(''); }}
        title="Create Admin Account" width="max-w-md"
        footer={<><Btn variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Btn><Btn variant="primary" onClick={handleCreate} disabled={createMut.isLoading}>{createMut.isLoading ? 'Creating…' : 'Create Admin'}</Btn></>}>
        {formErr && <Alert type="error" className="mb-4">{formErr}</Alert>}
        <div className="space-y-4">
          <Input label="Full Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Dr. Jane Smith" />
          <Input label="Email Address *" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="placement@college.edu" />
          <Input label="Password *" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 8 characters" hint="Admin must change this after first login." />
          {isSuperAdmin && (
            <label className="flex items-center gap-2 mt-2">
              <input 
                type="checkbox" 
                checked={form.isSuperAdmin} 
                onChange={e => setForm(f => ({ ...f, isSuperAdmin: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-sm text-gray-700">Create as Super Admin</span>
            </label>
          )}
        </div>
      </Modal>

      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteMut.mutate(deleteId)}
        title="Remove Admin" message="This admin will lose all access to the platform. Their created tests will remain." confirmLabel="Remove Admin" />
    </div>
  );
}
