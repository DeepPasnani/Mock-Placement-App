import { useState, useRef, forwardRef } from 'react';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';

// ── Button ────────────────────────────────────────────────────────────────────
export function Btn({ variant = 'primary', size = 'md', className = '', children, ...props }) {
  const base = 'inline-flex items-center gap-1.5 rounded-lg font-medium transition-all duration-150 cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed border-0 outline-none';
  const variants = {
    primary: 'bg-brand text-white hover:bg-brand-dark',
    danger:  'bg-red-600 text-white hover:bg-red-700',
    ghost:   'bg-transparent text-gray-600 border border-gray-200 hover:bg-gray-50',
    success: 'bg-accent text-white hover:bg-green-700',
    outline: 'bg-transparent text-brand border border-brand hover:bg-brand-light',
    warning: 'bg-yellow-500 text-white hover:bg-yellow-600',
  };
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' };
  return (
    <button className={`${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`} {...props}>
      {children}
    </button>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
export const Input = forwardRef(({ label, error, hint, className = '', ...props }, ref) => (
  <div className="w-full">
    {label && <label className="block text-xs font-medium text-gray-500 mb-1">{label}{props.required && <span className="text-red-500 ml-0.5">*</span>}</label>}
    <input ref={ref} className={`w-full px-3 py-2 border rounded-lg text-sm bg-white text-gray-900 outline-none transition-colors placeholder:text-gray-400 ${error ? 'border-red-400 focus:ring-2 focus:ring-red-100' : 'border-gray-200 focus:border-brand focus:ring-2 focus:ring-brand/10'} ${className}`} {...props} />
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    {hint && !error && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
));

// ── Select ────────────────────────────────────────────────────────────────────
export function Select({ label, className = '', children, ...props }) {
  return (
    <div className="w-full">
      {label && <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>}
      <select className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 ${className}`} {...props}>
        {children}
      </select>
    </div>
  );
}

// ── Textarea ──────────────────────────────────────────────────────────────────
export function Textarea({ label, hint, className = '', ...props }) {
  return (
    <div className="w-full">
      {label && <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>}
      <textarea className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 resize-vertical font-inherit ${className}`} {...props} />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ isOpen, onClose, title, children, width = 'max-w-2xl', footer }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`bg-white rounded-2xl w-full ${width} max-h-[90vh] flex flex-col shadow-2xl`}>
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 shrink-0">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-gray-100 shrink-0 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}

// ── Alert ─────────────────────────────────────────────────────────────────────
export function Alert({ type = 'info', children, className = '' }) {
  const styles = {
    info:    { bg: 'bg-blue-50 border-blue-200 text-blue-800',    Icon: Info },
    error:   { bg: 'bg-red-50 border-red-200 text-red-800',       Icon: AlertTriangle },
    success: { bg: 'bg-green-50 border-green-200 text-green-800', Icon: CheckCircle },
    warning: { bg: 'bg-yellow-50 border-yellow-200 text-yellow-800', Icon: AlertTriangle },
  };
  const { bg, Icon } = styles[type] || styles.info;
  return (
    <div className={`flex gap-2 items-start text-sm px-4 py-3 rounded-xl border ${bg} ${className}`}>
      <Icon size={15} className="shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ color = 'gray', children }) {
  const colors = {
    green:  'bg-green-100 text-green-800',
    blue:   'bg-blue-100 text-blue-800',
    red:    'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    gray:   'bg-gray-100 text-gray-700',
    purple: 'bg-purple-100 text-purple-800',
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[color] || colors.gray}`}>{children}</span>;
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, icon: Icon, color = 'blue', sub }) {
  const colors = {
    blue:   { bg: 'bg-blue-50',   icon: 'text-brand' },
    green:  { bg: 'bg-green-50',  icon: 'text-accent' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600' },
    yellow: { bg: 'bg-yellow-50', icon: 'text-yellow-600' },
    red:    { bg: 'bg-red-50',    icon: 'text-red-600' },
  };
  const { bg, icon } = colors[color] || colors.blue;
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        {Icon && <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center`}><Icon size={22} className={icon} /></div>}
      </div>
    </div>
  );
}

// ── Table ─────────────────────────────────────────────────────────────────────
export function Table({ columns, data, emptyMessage = 'No data found.' }) {
  if (!data?.length) return (
    <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400 text-sm">{emptyMessage}</div>
  );
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>{columns.map(c => <th key={c.key} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{c.label}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((row, i) => (
              <tr key={row.id || i} className="hover:bg-gray-50 transition-colors">
                {columns.map(c => <td key={c.key} className="px-4 py-3 text-sm text-gray-700">{c.render ? c.render(row) : row[c.key]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Confirm Dialog ────────────────────────────────────────────────────────────
export function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Delete', variant = 'danger' }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} width="max-w-md"
      footer={<><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn variant={variant} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Btn></>}>
      <p className="text-sm text-gray-600">{message}</p>
    </Modal>
  );
}

// ── Loading Spinner ───────────────────────────────────────────────────────────
export function Spinner({ size = 20, className = '' }) {
  return (
    <svg className={`animate-spin ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// ── Image Upload ──────────────────────────────────────────────────────────────
export function ImageUpload({ value, onChange, label = 'Add Image', uploading = false }) {
  const fileRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // If onChange returns a promise (API upload), await it; otherwise treat as base64
    if (onChange.length > 0) {
      onChange(file);
    } else {
      const reader = new FileReader();
      reader.onload = ev => onChange(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {value && (
        <div className="relative inline-block">
          <img src={value} alt="uploaded" className="max-h-48 rounded-lg border border-gray-200 object-contain" />
          <button onClick={() => onChange('')} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 transition-colors">
            <X size={11} />
          </button>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <Btn variant="ghost" size="sm" onClick={() => fileRef.current?.click()} className="w-fit" disabled={uploading}>
        {uploading ? <Spinner size={13} /> : '📎'} {label}
      </Btn>
    </div>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────────────
export function ProgressBar({ value, max, color = 'bg-brand', className = '' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className={`w-full h-2 bg-gray-100 rounded-full overflow-hidden ${className}`}>
      <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${active === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          {t.label}
        </button>
      ))}
    </div>
  );
}
