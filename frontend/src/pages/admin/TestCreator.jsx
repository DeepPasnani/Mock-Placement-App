import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { testsAPI, uploadAPI } from '../../services/api';
import { Btn, Input, Select, Textarea, Alert, ImageUpload, Tabs, Spinner } from '../../components/shared/UI';
import Editor from '@monaco-editor/react';
import { Plus, Trash2, ChevronLeft, Save, Eye, X } from 'lucide-react';
import toast from 'react-hot-toast';

const genId = () => `tmp_${Date.now()}_${Math.random().toString(36).slice(2)}`;

const DEFAULT_TEST = {
  title: '', description: '', status: 'draft',
  startTime: '', endTime: '', durationMinutes: 90,
  settings: {
    shuffleQuestions: true, shuffleOptions: true,
    showResults: 'after_submit', passingScore: 40,
    negativeMarking: false, negativeFraction: 0.25,
    allowedBranches: '', allowedLanguages: ['python', 'javascript', 'java', 'cpp'],
  },
  sections: [],
};

const DEFAULT_APT_Q = () => ({
  _id: genId(), type: 'mcq', text: '', imageUrl: '',
  options: ['', '', '', ''], optionImages: ['', '', '', ''],
  correctAnswer: 0, explanation: '', marks: 2, difficulty: 'medium',
});

const DEFAULT_CODE_Q = () => ({
  _id: genId(), title: '', description: '', imageUrl: '',
  inputFormat: '', outputFormat: '', constraints: '',
  sampleInput: '', sampleOutput: '', explanation: '',
  testCases: [{ input: '', output: '', isHidden: false }],
  starterCode: { python: '# Write your solution here\n', javascript: '// Write your solution here\n', java: 'public class Solution {\n    public static void main(String[] args) {\n        // Write your solution\n    }\n}\n', cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution\n    return 0;\n}\n' },
  timeLimit: 2, memoryLimit: 256, marks: 10, difficulty: 'medium', tags: '',
});

// ── Aptitude Question Editor ───────────────────────────────────────────────────
function AptQEditor({ q, onChange, onRemove }) {
  const update = (f, v) => onChange({ ...q, [f]: v });
  const updateOption = (i, v) => { const o = [...q.options]; o[i] = v; update('options', o); };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
      <div className="flex justify-between items-center mb-3">
        <div className="flex gap-3 flex-wrap">
          <Select value={q.type} onChange={e => update('type', e.target.value)} className="w-40 text-sm py-1.5">
            <option value="mcq">MCQ (Single)</option>
            <option value="msq">MSQ (Multi)</option>
            <option value="truefalse">True / False</option>
            <option value="fillblank">Fill in Blank</option>
            <option value="numerical">Numerical</option>
          </Select>
          <Input type="number" value={q.marks} onChange={e => update('marks', +e.target.value)} min={1} max={20} className="w-20 text-sm py-1.5" placeholder="Marks" />
          <Select value={q.difficulty} onChange={e => update('difficulty', e.target.value)} className="w-28 text-sm py-1.5">
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </Select>
        </div>
        <Btn variant="danger" size="sm" onClick={onRemove} className="shrink-0"><Trash2 size={13}/></Btn>
      </div>

      <Textarea value={q.text} onChange={e => update('text', e.target.value)} placeholder="Enter question text. You can include formulas like (a+b)² = a²+2ab+b²" rows={3} className="mb-3 text-sm" />

      <ImageUpload value={q.imageUrl} onChange={async (file) => {
        if (typeof file === 'string') { update('imageUrl', file); return; }
        try { const r = await uploadAPI.image(file); update('imageUrl', r.url); } catch { toast.error('Image upload failed'); }
      }} label="Attach Image to Question" />

      {(q.type === 'mcq' || q.type === 'msq') && (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-medium text-gray-500">Options — {q.type === 'msq' ? 'check all correct answers' : 'select the correct answer'}</p>
          {q.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type={q.type === 'msq' ? 'checkbox' : 'radio'}
                name={`correct_${q._id}`}
                checked={q.type === 'msq' ? (Array.isArray(q.correctAnswer) && q.correctAnswer.includes(i)) : q.correctAnswer === i}
                onChange={() => {
                  if (q.type === 'msq') {
                    const ca = Array.isArray(q.correctAnswer) ? [...q.correctAnswer] : [];
                    const idx = ca.indexOf(i);
                    if (idx > -1) ca.splice(idx, 1); else ca.push(i);
                    update('correctAnswer', ca);
                  } else update('correctAnswer', i);
                }}
                className="accent-accent w-4 h-4 shrink-0 cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-500 w-5 shrink-0">{String.fromCharCode(65+i)}.</span>
              <input value={opt} onChange={e => updateOption(i, e.target.value)} placeholder={`Option ${String.fromCharCode(65+i)}`}
                className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-brand" />
            </div>
          ))}
          <Btn variant="ghost" size="sm" onClick={() => onChange({ ...q, options: [...q.options, ''] })}>+ Add Option</Btn>
        </div>
      )}

      {q.type === 'truefalse' && (
        <div className="flex gap-4 mt-3">
          {['True', 'False'].map(v => (
            <label key={v} className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="radio" checked={q.correctAnswer === v} onChange={() => update('correctAnswer', v)} className="accent-accent" /> {v}
            </label>
          ))}
        </div>
      )}

      {(q.type === 'fillblank' || q.type === 'numerical') && (
        <Input value={q.correctAnswer || ''} onChange={e => update('correctAnswer', e.target.value)} placeholder={q.type === 'numerical' ? 'Correct numeric answer' : 'Correct answer text'} className="mt-3 w-64 text-sm" />
      )}

      <Textarea value={q.explanation} onChange={e => update('explanation', e.target.value)} placeholder="Explanation shown after submission (optional)" rows={2} className="mt-3 text-sm" />
    </div>
  );
}

// ── Coding Problem Editor ─────────────────────────────────────────────────────
function CodeQEditor({ q, onChange, onRemove }) {
  const [tab, setTab] = useState('desc');
  const [codeLang, setCodeLang] = useState('python');
  const update = (f, v) => onChange({ ...q, [f]: v });
  const TABS = [{ id: 'desc', label: 'Description' }, { id: 'io', label: 'I/O & Format' }, { id: 'tests', label: 'Test Cases' }, { id: 'code', label: 'Starter Code' }, { id: 'settings', label: 'Settings' }];

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-3 flex-wrap items-center">
          <Input value={q.title} onChange={e => update('title', e.target.value)} placeholder="Problem Title" className="w-60 text-sm py-1.5" />
          <Input type="number" value={q.marks} onChange={e => update('marks', +e.target.value)} min={1} className="w-20 text-sm py-1.5" placeholder="Marks" />
          <Select value={q.difficulty} onChange={e => update('difficulty', e.target.value)} className="w-28 text-sm py-1.5">
            <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
          </Select>
          <Input value={q.tags} onChange={e => update('tags', e.target.value)} placeholder="Tags (e.g. arrays, dp)" className="w-44 text-sm py-1.5" />
        </div>
        <Btn variant="danger" size="sm" onClick={onRemove}><Trash2 size={13}/></Btn>
      </div>

      <div className="flex gap-1 mb-4 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${tab === t.id ? 'bg-brand text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'desc' && (
        <div className="space-y-3">
          <Textarea value={q.description} onChange={e => update('description', e.target.value)} placeholder="Full problem description. Explain the task clearly. You can use markdown formatting.\n\nExample: Given an array of integers, find two numbers that add up to a target sum..." rows={7} className="text-sm font-mono" />
          <ImageUpload value={q.imageUrl} onChange={async (file) => {
            if (typeof file === 'string') { update('imageUrl', file); return; }
            try { const r = await uploadAPI.image(file); update('imageUrl', r.url); } catch { toast.error('Upload failed'); }
          }} label="Attach Diagram / Figure" />
        </div>
      )}

      {tab === 'io' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Textarea label="Input Format" value={q.inputFormat} onChange={e => update('inputFormat', e.target.value)} placeholder="Describe the input format line by line:\n• First line: integer N\n• Next line: N space-separated integers" rows={5} className="text-sm" />
          <Textarea label="Output Format" value={q.outputFormat} onChange={e => update('outputFormat', e.target.value)} placeholder="Describe the expected output:\n• Single integer: the answer" rows={5} className="text-sm" />
          <Textarea label="Constraints" value={q.constraints} onChange={e => update('constraints', e.target.value)} placeholder="1 ≤ N ≤ 10^5&#10;-10^9 ≤ arr[i] ≤ 10^9&#10;Time: O(N log N)" rows={4} className="text-sm" />
          <Textarea label="Explanation (shown after submit)" value={q.explanation} onChange={e => update('explanation', e.target.value)} placeholder="Explain the approach, time complexity, etc." rows={4} className="text-sm" />
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Sample Input</label>
            <textarea value={q.sampleInput} onChange={e => update('sampleInput', e.target.value)} rows={4} placeholder="5&#10;2 7 11 15 9" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono outline-none focus:border-brand bg-gray-900 text-green-300 resize-y" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Sample Output</label>
            <textarea value={q.sampleOutput} onChange={e => update('sampleOutput', e.target.value)} rows={4} placeholder="0 4" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono outline-none focus:border-brand bg-gray-900 text-green-300 resize-y" />
          </div>
        </div>
      )}

      {tab === 'tests' && (
        <div>
          <Alert type="info" className="mb-3">Hidden test cases are used for final grading. Visible ones serve as examples for students.</Alert>
          <div className="space-y-3">
            {q.testCases.map((tc, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-gray-500">Test Case {i+1}</span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                      <input type="checkbox" checked={tc.isHidden} onChange={e => { const t=[...q.testCases]; t[i]={...t[i],isHidden:e.target.checked}; update('testCases',t); }} className="accent-brand" />
                      Hidden (grading only)
                    </label>
                    <button onClick={() => update('testCases', q.testCases.filter((_,j)=>j!==i))} className="text-red-500 hover:text-red-700"><Trash2 size={13}/></button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <textarea value={tc.input} onChange={e => { const t=[...q.testCases]; t[i]={...t[i],input:e.target.value}; update('testCases',t); }} rows={3} placeholder="Input" className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-mono outline-none focus:border-brand bg-gray-900 text-green-300 resize-y" />
                  <textarea value={tc.output} onChange={e => { const t=[...q.testCases]; t[i]={...t[i],output:e.target.value}; update('testCases',t); }} rows={3} placeholder="Expected Output" className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-mono outline-none focus:border-brand bg-gray-900 text-green-300 resize-y" />
                </div>
              </div>
            ))}
          </div>
          <Btn variant="outline" size="sm" className="mt-3" onClick={() => update('testCases', [...q.testCases, { input: '', output: '', isHidden: false }])}>
            <Plus size={13}/> Add Test Case
          </Btn>
        </div>
      )}

      {tab === 'code' && (
        <div>
          <div className="flex gap-2 mb-3">
            {Object.keys(q.starterCode).map(lang => (
              <button key={lang} onClick={() => setCodeLang(lang)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${codeLang === lang ? 'bg-brand text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
                {lang}
              </button>
            ))}
          </div>
          <Editor height="200px" language={codeLang === 'cpp' ? 'cpp' : codeLang === 'java' ? 'java' : codeLang}
            value={q.starterCode[codeLang]} theme="vs-dark"
            onChange={v => update('starterCode', { ...q.starterCode, [codeLang]: v || '' })}
            options={{ minimap: { enabled: false }, fontSize: 13, lineNumbers: 'on', scrollBeyondLastLine: false }}
          />
        </div>
      )}

      {tab === 'settings' && (
        <div className="grid grid-cols-2 gap-4">
          <Input label="Time Limit (seconds)" type="number" min={1} max={30} value={q.timeLimit} onChange={e => update('timeLimit', +e.target.value)} hint="Max execution time per test case" />
          <Input label="Memory Limit (MB)" type="number" min={32} max={512} value={q.memoryLimit} onChange={e => update('memoryLimit', +e.target.value)} hint="Max memory usage" />
        </div>
      )}
    </div>
  );
}

// ── Main Test Creator ─────────────────────────────────────────────────────────
export default function TestCreator() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(DEFAULT_TEST);
  const [activeSection, setActiveSection] = useState(0);
  const isEdit = !!id;

  const { isLoading: loadingTest } = useQuery(
    ['test', id], () => testsAPI.get(id),
    {
      enabled: !!id,
      onSuccess: (data) => {
        setForm({
          title: data.title, description: data.description, status: data.status,
          startTime: data.start_time ? data.start_time.slice(0,16) : '',
          endTime:   data.end_time   ? data.end_time.slice(0,16)   : '',
          durationMinutes: data.duration_minutes,
          settings: data.settings || DEFAULT_TEST.settings,
          sections: (data.sections || []).map(s => ({
            ...s,
            questions: (s.questions || []).map(q => ({ ...q, _id: q.id || genId() })),
          })),
        });
      },
    }
  );

  const saveMut = useMutation(
    (payload) => isEdit ? testsAPI.update(id, payload) : testsAPI.create(payload),
    {
      onSuccess: () => {
        toast.success(isEdit ? 'Test updated!' : 'Test created!');
        qc.invalidateQueries('tests');
        navigate('/admin/tests');
      },
      onError: (e) => toast.error(e.response?.data?.error || 'Save failed'),
    }
  );

  const upd = (f, v) => setForm(p => ({ ...p, [f]: v }));
  const updSettings = (f, v) => setForm(p => ({ ...p, settings: { ...p.settings, [f]: v } }));

  const addSection = (type) => {
    const sec = { _id: genId(), name: type === 'aptitude' ? 'Aptitude' : 'Coding', type, questions: [] };
    setForm(p => ({ ...p, sections: [...p.sections, sec] }));
    setActiveSection(form.sections.length);
  };

  const updateSection = (si, f, v) => {
    setForm(p => { const s = [...p.sections]; s[si] = { ...s[si], [f]: v }; return { ...p, sections: s }; });
  };

  const addQuestion = (si) => {
    setForm(p => {
      const s = [...p.sections];
      s[si].questions = [...s[si].questions, s[si].type === 'aptitude' ? DEFAULT_APT_Q() : DEFAULT_CODE_Q()];
      return { ...p, sections: s };
    });
  };

  const updateQuestion = (si, qi, q) => {
    setForm(p => { const s = [...p.sections]; s[si].questions = s[si].questions.map((qq, i) => i === qi ? q : qq); return { ...p, sections: s }; });
  };

  const removeQuestion = (si, qi) => {
    setForm(p => { const s = [...p.sections]; s[si].questions = s[si].questions.filter((_, i) => i !== qi); return { ...p, sections: s }; });
  };

  const removeSection = (si) => {
    setForm(p => { const s = p.sections.filter((_, i) => i !== si); return { ...p, sections: s }; });
    setActiveSection(Math.max(0, activeSection - 1));
  };

  const handleSave = (status) => {
    if (!form.title.trim()) { toast.error('Test title is required'); setStep(0); return; }
    const payload = {
      title: form.title, description: form.description,
      status: status || form.status,
      startTime: form.startTime || null, endTime: form.endTime || null,
      durationMinutes: form.durationMinutes,
      settings: form.settings,
      sections: form.sections.map(s => ({
        id: s.id, name: s.name, type: s.type,
        questions: s.questions.map(q => ({ ...q, imageUrl: q.imageUrl || q.image_url })),
      })),
    };
    saveMut.mutate(payload);
  };

  if (loadingTest) return <div className="flex justify-center py-20"><Spinner size={32} className="text-brand"/></div>;

  const STEPS = ['Configuration', 'Questions', 'Review & Publish'];

  const totalQ = form.sections.reduce((n, s) => n + s.questions.length, 0);
  const totalM = form.sections.reduce((n, s) => n + s.questions.reduce((m, q) => m + (q.marks || 0), 0), 0);
  const sec = form.sections[activeSection];

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/tests')} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><ChevronLeft size={20}/></button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{isEdit ? 'Edit Test' : 'Create New Test'}</h1>
            {form.title && <p className="text-sm text-gray-500">{form.title}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          <Btn variant="ghost" onClick={() => handleSave('draft')} disabled={saveMut.isLoading}><Save size={14}/> Save Draft</Btn>
          <Btn variant="primary" onClick={() => handleSave('published')} disabled={saveMut.isLoading}>{saveMut.isLoading ? 'Saving…' : 'Publish'}</Btn>
        </div>
      </div>

      {/* Step nav */}
      <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl">
        {STEPS.map((s, i) => (
          <button key={s} onClick={() => setStep(i)}
            className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all ${step === i ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {i+1}. {s}
          </button>
        ))}
      </div>

      {/* Step 0: Config */}
      {step === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          <h2 className="font-semibold text-gray-900 text-base mb-1">Test Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Test Title *" value={form.title} onChange={e => upd('title', e.target.value)} placeholder="e.g. Campus Placement Drive – Round 1" />
            <Select label="Status" value={form.status} onChange={e => upd('status', e.target.value)}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </Select>
          </div>
          <Textarea label="Description / Instructions" value={form.description} onChange={e => upd('description', e.target.value)} placeholder="Instructions shown to students before starting the test..." rows={3} />
          <div className="grid grid-cols-3 gap-4">
            <Input label="Start Date & Time" type="datetime-local" value={form.startTime} onChange={e => upd('startTime', e.target.value)} />
            <Input label="End Date & Time" type="datetime-local" value={form.endTime} onChange={e => upd('endTime', e.target.value)} />
            <Input label="Duration (minutes)" type="number" min={10} max={480} value={form.durationMinutes} onChange={e => upd('durationMinutes', +e.target.value)} />
          </div>

          <div className="border-t border-gray-100 pt-5">
            <h3 className="font-semibold text-gray-800 text-sm mb-4">Test Settings</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Input label="Passing Score (%)" type="number" min={0} max={100} value={form.settings.passingScore} onChange={e => updSettings('passingScore', +e.target.value)} />
              <Select label="Show Results" value={form.settings.showResults} onChange={e => updSettings('showResults', e.target.value)}>
                <option value="after_submit">After Submission</option>
                <option value="after_end">After Test Ends</option>
                <option value="manual">Manual (Admin)</option>
                <option value="never">Never (Admin Only)</option>
              </Select>
              <Input label="Allowed Branches (blank = all)" value={form.settings.allowedBranches} onChange={e => updSettings('allowedBranches', e.target.value)} placeholder="CSE, IT, ECE" />
            </div>
            <div className="flex gap-6 mt-4 flex-wrap">
              {[['shuffleQuestions','Shuffle Questions'],['shuffleOptions','Shuffle Options'],['negativeMarking','Negative Marking']].map(([f,l])=>(
                <label key={f} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.settings[f]} onChange={e => updSettings(f, e.target.checked)} className="accent-brand w-4 h-4" /> {l}
                </label>
              ))}
              {form.settings.negativeMarking && (
                <Input label="Deduction (fraction)" type="number" step={0.25} min={0} max={1} value={form.settings.negativeFraction} onChange={e => updSettings('negativeFraction', +e.target.value)} className="w-32" />
              )}
            </div>
            <div className="mt-4">
              <p className="text-xs font-medium text-gray-500 mb-2">Allowed Coding Languages</p>
              <div className="flex gap-4">
                {['python','javascript','java','cpp'].map(lang => (
                  <label key={lang} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.settings.allowedLanguages?.includes(lang)}
                      onChange={e => { const al = form.settings.allowedLanguages || []; updSettings('allowedLanguages', e.target.checked ? [...al, lang] : al.filter(l => l !== lang)); }}
                      className="accent-brand" /> {lang}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Btn variant="primary" onClick={() => setStep(1)}>Next: Add Questions →</Btn>
          </div>
        </div>
      )}

      {/* Step 1: Questions */}
      {step === 1 && (
        <div>
          {/* Section tabs */}
          <div className="flex gap-2 mb-4 flex-wrap items-center">
            {form.sections.map((s, i) => (
              <div key={s._id || s.id} className="flex items-center gap-1">
                <button onClick={() => setActiveSection(i)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all border ${activeSection === i ? 'bg-brand text-white border-brand' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                  {s.name} ({s.questions.length})
                </button>
                <button onClick={() => removeSection(i)} className="text-gray-400 hover:text-red-500 p-0.5"><X size={13}/></button>
              </div>
            ))}
            <div className="flex gap-1 ml-1">
              <Btn variant="ghost" size="sm" onClick={() => addSection('aptitude')}>+ Aptitude</Btn>
              <Btn variant="ghost" size="sm" onClick={() => addSection('coding')}>+ Coding</Btn>
            </div>
          </div>

          {form.sections.length === 0 && (
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
              <p className="text-gray-400 mb-4">No sections yet. Add an Aptitude or Coding section to begin.</p>
              <div className="flex gap-3 justify-center">
                <Btn variant="outline" onClick={() => addSection('aptitude')}><Plus size={14}/> Aptitude Section</Btn>
                <Btn variant="outline" onClick={() => addSection('coding')}><Plus size={14}/> Coding Section</Btn>
              </div>
            </div>
          )}

          {sec && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex gap-3 mb-5 items-center">
                <Input value={sec.name} onChange={e => updateSection(activeSection, 'name', e.target.value)} placeholder="Section name" className="w-48 text-sm" />
                <Select value={sec.type} onChange={e => updateSection(activeSection, 'type', e.target.value)} className="w-36 text-sm">
                  <option value="aptitude">Aptitude</option>
                  <option value="coding">Coding</option>
                </Select>
                <span className="text-sm text-gray-400">{sec.questions.length} questions · {sec.questions.reduce((m,q)=>m+(q.marks||0),0)} marks</span>
              </div>

              {sec.questions.map((q, qi) => (
                <div key={q._id || q.id}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-gray-400">Q{qi+1}</span>
                  </div>
                  {sec.type === 'aptitude'
                    ? <AptQEditor q={q} onChange={nq => updateQuestion(activeSection, qi, nq)} onRemove={() => removeQuestion(activeSection, qi)} />
                    : <CodeQEditor q={q} onChange={nq => updateQuestion(activeSection, qi, nq)} onRemove={() => removeQuestion(activeSection, qi)} />
                  }
                </div>
              ))}

              <button onClick={() => addQuestion(activeSection)}
                className="w-full border-2 border-dashed border-gray-300 rounded-xl py-4 text-sm text-gray-500 hover:border-brand hover:text-brand transition-all flex items-center justify-center gap-2 mt-2">
                <Plus size={16}/> Add {sec.type === 'aptitude' ? 'Aptitude Question' : 'Coding Problem'}
              </button>
            </div>
          )}

          <div className="flex justify-between mt-4">
            <Btn variant="ghost" onClick={() => setStep(0)}>← Back</Btn>
            <Btn variant="primary" onClick={() => setStep(2)}>Review & Publish →</Btn>
          </div>
        </div>
      )}

      {/* Step 2: Review */}
      {step === 2 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-semibold text-gray-900 text-base mb-5">Review & Publish</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[['Title', form.title || 'Untitled'], ['Duration', `${form.durationMinutes} min`], ['Questions', totalQ], ['Total Marks', totalM]].map(([k,v])=>(
              <div key={k} className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="text-xs text-gray-400 mb-1">{k}</div>
                <div className="text-xl font-bold text-gray-900">{v}</div>
              </div>
            ))}
          </div>
          {form.sections.map(s => (
            <div key={s._id || s.id} className="mb-4 border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
                <span className="font-semibold text-gray-800 text-sm">{s.name}</span>
                <span className="text-xs text-gray-500">{s.questions.length} questions · {s.questions.reduce((m,q)=>m+(q.marks||0),0)} marks</span>
              </div>
              {s.questions.map((q,i) => (
                <div key={q._id||q.id} className="flex items-center gap-3 px-4 py-2.5 border-t border-gray-100 text-sm">
                  <span className="text-gray-400 text-xs w-6">Q{i+1}</span>
                  <span className="flex-1 text-gray-800 truncate">{s.type==='coding' ? q.title : q.text || '(empty)'}</span>
                  <span className="text-xs text-gray-400">{q.marks}m</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${q.difficulty==='easy'?'bg-green-100 text-green-700':q.difficulty==='hard'?'bg-red-100 text-red-700':'bg-yellow-100 text-yellow-700'}`}>{q.difficulty}</span>
                </div>
              ))}
            </div>
          ))}
          <div className="flex gap-3 justify-end mt-6">
            <Btn variant="ghost" onClick={() => setStep(1)}>← Edit Questions</Btn>
            <Btn variant="ghost" onClick={() => handleSave('draft')} disabled={saveMut.isLoading}><Save size={14}/> Save as Draft</Btn>
            <Btn variant="primary" onClick={() => handleSave('published')} disabled={saveMut.isLoading}>
              {saveMut.isLoading ? 'Publishing…' : '🚀 Publish Test'}
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}
