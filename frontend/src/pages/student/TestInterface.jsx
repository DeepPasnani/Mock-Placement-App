import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import { testsAPI, submissionsAPI } from '../../services/api';
import { useStore } from '../../store';
import Timer from '../../components/shared/Timer';
import { Btn, Modal, Alert, Spinner } from '../../components/shared/UI';
import Editor from '@monaco-editor/react';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Flag, Play, CheckCircle, XCircle, Terminal, Eye, EyeOff } from 'lucide-react';

const LANG_MAP = { python: 'python', javascript: 'javascript', java: 'java', cpp: 'cpp' };
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

export default function TestInterface() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useStore();

  const [answers, setAnswers] = useState({});
  const [codeSolutions, setCodeSolutions] = useState({});
  const [flagged, setFlagged] = useState(new Set());
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQ, setCurrentQ] = useState(0);
  const [activeLang, setActiveLang] = useState('python');
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [runLoading, setRunLoading] = useState(false);
  const [showPalette, setShowPalette] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const autoSaveRef = useRef(null);

  // Load test data
  const { data: testData, isLoading: loadingTest } = useQuery(['test-full', testId], () => testsAPI.get(testId));

  // Start test session
  const startMut = useMutation(submissionsAPI.start, {
    onSuccess: (data) => {
      setRemainingSeconds(data.remainingSeconds);
      setTestStarted(true);
      // Restore any saved answers
      if (data.submission?.answers) {
        try { setAnswers(JSON.parse(data.submission.answers) || {}); } catch {}
      }
      if (data.submission?.code_solutions) {
        try { setCodeSolutions(JSON.parse(data.submission.code_solutions) || {}); } catch {}
      }
    },
    onError: (e) => {
      toast.error(e.response?.data?.error || 'Failed to start test');
      navigate('/student');
    },
  });

  const saveMut = useMutation(submissionsAPI.save);

  const submitMut = useMutation(submissionsAPI.submit, {
    onSuccess: (result) => {
      clearInterval(autoSaveRef.current);
      navigate('/student/results', { state: { result, testTitle: testData?.title } });
      toast.success('Test submitted successfully!');
    },
    onError: (e) => {
      setSubmitting(false);
      toast.error(e.response?.data?.error || 'Submission failed. Please try again.');
    },
  });

  // Auto-start when test loads
  useEffect(() => {
    if (testData && !testStarted) {
      startMut.mutate(testId);
    }
  }, [testData]);

  // Auto-save every 30s
  useEffect(() => {
    if (!testStarted) return;
    autoSaveRef.current = setInterval(() => {
      saveMut.mutate({
        testId,
        answers,
        codeSolutions,
        flaggedQuestions: Array.from(flagged),
      });
    }, AUTO_SAVE_INTERVAL);
    return () => clearInterval(autoSaveRef.current);
  }, [testStarted, answers, codeSolutions, flagged]);

  // Prevent tab switch / page leave
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); e.returnValue = 'Are you sure? Your progress is auto-saved.'; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setConfirmSubmit(false);
    submitMut.mutate({
      testId,
      answers,
      codeSolutions,
      flaggedQuestions: Array.from(flagged),
    });
  }, [testId, answers, codeSolutions, flagged]);

  const handleRunCode = async () => {
    const q = section?.questions[currentQ];
    if (!q) return;
    const code = codeSolutions[q.id]?.[activeLang] || q.starter_code?.[activeLang] || '';
    if (!code.trim()) { toast.error('Write some code first.'); return; }
    setRunLoading(true);
    setRunResult(null);
    try {
      const result = await submissionsAPI.runCode({ code, language: activeLang, stdin: q.sample_input || '' });
      setRunResult(result);
    } catch { toast.error('Code execution failed.'); }
    setRunLoading(false);
  };

  if (loadingTest || !testStarted || remainingSeconds === null) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
        <Spinner size={36} className="text-brand" />
        <p className="text-gray-400 text-sm">
          {loadingTest ? 'Loading test…' : 'Starting your session…'}
        </p>
      </div>
    );
  }

  const test = testData;
  const section = test?.sections?.[currentSection];
  const q = section?.questions?.[currentQ];
  const isAptitude = section?.type === 'aptitude';
  const totalQ = test?.sections?.reduce((n, s) => n + s.questions.length, 0) || 0;
  const answeredCount = Object.keys(answers).length +
    Object.keys(codeSolutions).filter(k => Object.values(codeSolutions[k] || {}).some(c => c?.trim())).length;
  const allowedLangs = test?.settings?.allowedLanguages || ['python', 'javascript', 'java', 'cpp'];

  const navigateQ = (si, qi) => {
    setCurrentSection(si);
    setCurrentQ(qi);
    setRunResult(null);
  };

  const goNext = () => {
    if (currentQ < section.questions.length - 1) navigateQ(currentSection, currentQ + 1);
    else if (currentSection < test.sections.length - 1) navigateQ(currentSection + 1, 0);
  };

  const goPrev = () => {
    if (currentQ > 0) navigateQ(currentSection, currentQ - 1);
    else if (currentSection > 0) {
      const prevSec = test.sections[currentSection - 1];
      navigateQ(currentSection - 1, prevSec.questions.length - 1);
    }
  };

  const setAnswer = (qId, val) => setAnswers(a => ({ ...a, [qId]: val }));
  const setCode = (qId, lang, code) => setCodeSolutions(cs => ({ ...cs, [qId]: { ...(cs[qId] || {}), [lang]: code } }));
  const toggleFlag = (qId) => setFlagged(f => { const nf = new Set(f); nf.has(qId) ? nf.delete(qId) : nf.add(qId); return nf; });

  const isAnswered = (sec, q) =>
    sec.type === 'coding'
      ? Object.values(codeSolutions[q.id] || {}).some(c => c?.trim())
      : answers[q.id] !== undefined && answers[q.id] !== null && answers[q.id] !== '';

  if (!q) return null;

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white overflow-hidden">

      {/* ── Top Bar ──────────────────────────────────────────────────────────── */}
      <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 shrink-0 z-50">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-bold text-sm text-white truncate max-w-56">{test.title}</span>
          <span className="text-xs text-gray-500 hidden sm:block">{answeredCount}/{totalQ} answered</span>
        </div>

        <Timer totalSeconds={remainingSeconds} onExpire={handleSubmit} testId={testId} token={token} />

        <div className="flex items-center gap-2">
          <button onClick={() => setShowPalette(v => !v)} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hidden md:block">
            {showPalette ? <EyeOff size={16}/> : <Eye size={16}/>}
          </button>
          <Btn variant="success" onClick={() => setConfirmSubmit(true)}>
            <CheckCircle size={14}/> Submit
          </Btn>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Left: Section tabs + Question ─────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Section tabs */}
          <div className="flex gap-1 px-3 pt-2 pb-1 bg-gray-900 border-b border-gray-800 shrink-0 overflow-x-auto">
            {test.sections.map((sec, si) => (
              <button key={sec.id} onClick={() => navigateQ(si, 0)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${currentSection === si ? 'bg-brand text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
                {sec.name}
                <span className="ml-1.5 opacity-70">
                  ({sec.questions.filter(q => isAnswered(sec, q)).length}/{sec.questions.length})
                </span>
              </button>
            ))}
          </div>

          {/* Question area */}
          <div className="flex-1 overflow-y-auto">
            {isAptitude ? (
              /* ── Aptitude Question ── */
              <div className="max-w-3xl mx-auto p-5">
                {/* Question header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400">Q{currentQ + 1}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${q.difficulty === 'easy' ? 'bg-green-900 text-green-300' : q.difficulty === 'hard' ? 'bg-red-900 text-red-300' : 'bg-yellow-900 text-yellow-300'}`}>{q.difficulty}</span>
                    <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full font-medium">{q.marks} marks</span>
                    {q.type === 'msq' && <span className="text-xs bg-purple-900 text-purple-300 px-2 py-0.5 rounded-full">Multiple Select</span>}
                  </div>
                  <button onClick={() => toggleFlag(q.id)}
                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors ${flagged.has(q.id) ? 'bg-yellow-900 text-yellow-300' : 'text-gray-500 hover:bg-gray-800'}`}>
                    <Flag size={12}/> {flagged.has(q.id) ? 'Flagged' : 'Flag'}
                  </button>
                </div>

                <div className="bg-gray-800 rounded-2xl p-5 mb-4">
                  <p className="text-base leading-relaxed text-gray-100 whitespace-pre-wrap mb-3">{q.text}</p>
                  {q.image_url && <img src={q.image_url} alt="Question" className="max-w-full max-h-64 rounded-xl object-contain border border-gray-700" />}
                </div>

                {/* Options */}
                {(q.type === 'mcq' || q.type === 'msq') && (
                  <div className="space-y-2.5">
                    {(q.options || []).map((opt, i) => {
                      const sel = q.type === 'msq'
                        ? (Array.isArray(answers[q.id]) && answers[q.id].includes(i))
                        : answers[q.id] === i;
                      return (
                        <label key={i} className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${sel ? 'border-brand bg-brand/10' : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'}`}>
                          <input type={q.type === 'msq' ? 'checkbox' : 'radio'}
                            name={`q_${q.id}`} checked={sel}
                            onChange={() => {
                              if (q.type === 'msq') {
                                const cur = Array.isArray(answers[q.id]) ? [...answers[q.id]] : [];
                                const idx = cur.indexOf(i);
                                if (idx > -1) cur.splice(idx, 1); else cur.push(i);
                                setAnswer(q.id, cur);
                              } else setAnswer(q.id, i);
                            }}
                            className="mt-0.5 accent-brand shrink-0" />
                          <div>
                            <span className="text-sm text-gray-200">{String.fromCharCode(65 + i)}. {opt}</span>
                            {q.option_images?.[i] && <img src={q.option_images[i]} alt="" className="mt-2 max-h-20 rounded-lg object-contain" />}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}

                {q.type === 'truefalse' && (
                  <div className="flex gap-3">
                    {['True', 'False'].map(v => (
                      <label key={v} className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border cursor-pointer transition-all text-sm font-medium ${answers[q.id] === v ? 'border-brand bg-brand/10 text-brand' : 'border-gray-700 text-gray-300 hover:border-gray-600'}`}>
                        <input type="radio" name={`q_${q.id}`} checked={answers[q.id] === v} onChange={() => setAnswer(q.id, v)} className="accent-brand" /> {v}
                      </label>
                    ))}
                  </div>
                )}

                {(q.type === 'fillblank' || q.type === 'numerical') && (
                  <input value={answers[q.id] || ''} onChange={e => setAnswer(q.id, e.target.value)}
                    placeholder={q.type === 'numerical' ? 'Enter numeric answer' : 'Type your answer'}
                    className="w-full md:w-80 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white outline-none focus:border-brand" />
                )}

                {/* Nav + clear */}
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-800">
                  <div className="flex gap-2">
                    {isAnswered(section, q) && (
                      <button onClick={() => setAnswer(q.id, undefined)} className="text-xs text-gray-500 hover:text-red-400 transition-colors">
                        Clear response
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Btn variant="ghost" size="sm" onClick={goPrev} className="border-gray-700 text-gray-400 hover:bg-gray-800"><ChevronLeft size={14}/> Prev</Btn>
                    <Btn variant="primary" size="sm" onClick={goNext}>Next <ChevronRight size={14}/></Btn>
                  </div>
                </div>
              </div>
            ) : (
              /* ── Coding Problem ── */
              <div className="flex h-full">
                {/* Problem statement (left half) */}
                <div className="w-2/5 border-r border-gray-800 overflow-y-auto p-4 shrink-0 hidden lg:block">
                  <div className="flex items-center gap-2 mb-3">
                    <h2 className="font-bold text-base text-white">{q.title}</h2>
                    <button onClick={() => toggleFlag(q.id)} className={`ml-auto text-xs px-2 py-1 rounded-lg flex items-center gap-1 ${flagged.has(q.id) ? 'bg-yellow-900 text-yellow-300' : 'text-gray-500 hover:bg-gray-800'}`}>
                      <Flag size={11}/> {flagged.has(q.id) ? 'Flagged' : 'Flag'}
                    </button>
                  </div>
                  <div className="flex gap-2 mb-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${q.difficulty === 'easy' ? 'bg-green-900 text-green-300' : q.difficulty === 'hard' ? 'bg-red-900 text-red-300' : 'bg-yellow-900 text-yellow-300'}`}>{q.difficulty}</span>
                    <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full">{q.marks} marks</span>
                    {q.tags && q.tags.split(',').map(t => <span key={t} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{t.trim()}</span>)}
                  </div>

                  {q.image_url && <img src={q.image_url} alt="Problem" className="w-full max-h-48 object-contain rounded-xl mb-3 border border-gray-700" />}

                  <div className="text-sm leading-relaxed text-gray-200 whitespace-pre-wrap mb-4">{q.description}</div>

                  {q.constraints && (
                    <div className="bg-gray-800 rounded-xl p-3 mb-3 border-l-2 border-yellow-500">
                      <div className="text-xs font-semibold text-yellow-400 mb-1">CONSTRAINTS</div>
                      <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">{q.constraints}</pre>
                    </div>
                  )}

                  {q.input_format && (
                    <div className="mb-3">
                      <div className="text-xs font-semibold text-gray-400 mb-1">INPUT FORMAT</div>
                      <pre className="text-xs text-gray-300 bg-gray-800 rounded-lg p-2 whitespace-pre-wrap">{q.input_format}</pre>
                    </div>
                  )}
                  {q.output_format && (
                    <div className="mb-3">
                      <div className="text-xs font-semibold text-gray-400 mb-1">OUTPUT FORMAT</div>
                      <pre className="text-xs text-gray-300 bg-gray-800 rounded-lg p-2 whitespace-pre-wrap">{q.output_format}</pre>
                    </div>
                  )}

                  {q.sample_input && (
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div>
                        <div className="text-xs font-semibold text-gray-400 mb-1">SAMPLE INPUT</div>
                        <pre className="text-xs bg-gray-900 text-green-300 rounded-lg p-2.5 font-mono whitespace-pre-wrap border border-gray-700">{q.sample_input}</pre>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-400 mb-1">SAMPLE OUTPUT</div>
                        <pre className="text-xs bg-gray-900 text-green-300 rounded-lg p-2.5 font-mono whitespace-pre-wrap border border-gray-700">{q.sample_output}</pre>
                      </div>
                    </div>
                  )}
                </div>

                {/* Code editor (right half) */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Language selector + run */}
                  <div className="flex items-center justify-between px-3 py-2 bg-gray-900 border-b border-gray-800 shrink-0">
                    <div className="flex gap-1">
                      {allowedLangs.map(lang => (
                        <button key={lang} onClick={() => setActiveLang(lang)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${activeLang === lang ? 'bg-brand text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
                          {lang}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-2">
                        <Btn variant="ghost" size="sm" onClick={goPrev} className="border-gray-700 text-gray-400 py-1"><ChevronLeft size={13}/></Btn>
                        <Btn variant="ghost" size="sm" onClick={goNext} className="border-gray-700 text-gray-400 py-1"><ChevronRight size={13}/></Btn>
                      </div>
                      <Btn variant="success" size="sm" onClick={handleRunCode} disabled={runLoading}>
                        {runLoading ? <Spinner size={12} className="text-white"/> : <Play size={12}/>} Run
                      </Btn>
                    </div>
                  </div>

                  {/* Monaco Editor */}
                  <div className="flex-1 overflow-hidden">
                    <Editor
                      height="100%"
                      language={LANG_MAP[activeLang] || 'python'}
                      value={codeSolutions[q.id]?.[activeLang] ?? (q.starter_code?.[activeLang] || '')}
                      theme="vs-dark"
                      onChange={code => setCode(q.id, activeLang, code || '')}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        lineHeight: 22,
                        fontFamily: 'JetBrains Mono, Fira Code, monospace',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                        wordWrap: 'on',
                        padding: { top: 12 },
                      }}
                    />
                  </div>

                  {/* Run output panel */}
                  {runResult && (
                    <div className="border-t border-gray-800 bg-gray-950 shrink-0 max-h-44 overflow-y-auto">
                      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
                        <div className="flex items-center gap-2 text-xs">
                          <Terminal size={12} className="text-gray-400"/>
                          <span className={`font-semibold ${runResult.passed ? 'text-green-400' : 'text-red-400'}`}>
                            {runResult.status}
                          </span>
                          {runResult.time && <span className="text-gray-500">· {runResult.time}s</span>}
                        </div>
                        <button onClick={() => setRunResult(null)} className="text-gray-600 hover:text-gray-400 text-xs">✕</button>
                      </div>
                      <div className="p-3">
                        {runResult.stdout && (
                          <div className="mb-2">
                            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><CheckCircle size={10} className="text-green-400"/> Output</div>
                            <pre className="text-xs font-mono text-green-300 whitespace-pre-wrap">{runResult.stdout}</pre>
                          </div>
                        )}
                        {(runResult.stderr || runResult.compileOutput) && (
                          <div>
                            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><XCircle size={10} className="text-red-400"/> Error</div>
                            <pre className="text-xs font-mono text-red-300 whitespace-pre-wrap">{runResult.stderr || runResult.compileOutput}</pre>
                          </div>
                        )}
                        {!runResult.stdout && !runResult.stderr && !runResult.compileOutput && (
                          <pre className="text-xs text-gray-500 italic">(no output)</pre>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Question Palette ───────────────────────────────────────── */}
        {showPalette && (
          <div className="w-48 bg-gray-900 border-l border-gray-800 overflow-y-auto shrink-0 hidden md:block">
            <div className="p-3">
              <div className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Questions</div>
              {test.sections.map((sec, si) => (
                <div key={sec.id} className="mb-4">
                  <div className="text-xs font-semibold text-gray-600 mb-2">{sec.name}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {sec.questions.map((qq, qi) => {
                      const ans = isAnswered(sec, qq);
                      const cur = si === currentSection && qi === currentQ;
                      const flg = flagged.has(qq.id);
                      return (
                        <button key={qq.id} onClick={() => navigateQ(si, qi)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all border ${
                            cur  ? 'bg-brand border-brand text-white' :
                            ans  ? 'bg-green-900 border-green-700 text-green-300' :
                            flg  ? 'bg-yellow-900 border-yellow-700 text-yellow-300' :
                                   'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                          }`}>
                          {qi + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Legend */}
              <div className="mt-4 space-y-1.5">
                {[
                  ['bg-brand border-brand', 'Current'],
                  ['bg-green-900 border-green-700', 'Answered'],
                  ['bg-yellow-900 border-yellow-700', 'Flagged'],
                  ['bg-gray-800 border-gray-700', 'Not answered'],
                ].map(([cls, lbl]) => (
                  <div key={lbl} className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span className={`w-3 h-3 rounded border ${cls} inline-block shrink-0`}/>
                    {lbl}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Confirm Submit Modal ────────────────────────────────────────────── */}
      <Modal isOpen={confirmSubmit} onClose={() => !submitting && setConfirmSubmit(false)}
        title="Submit Test?" width="max-w-sm">
        <Alert type="warning" className="mb-4">
          This will permanently submit your test. You cannot make changes after submission.
        </Alert>
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            ['Answered', answeredCount, 'text-accent'],
            ['Remaining', totalQ - answeredCount, 'text-red-400'],
          ].map(([l, v, c]) => (
            <div key={l} className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-xs text-gray-400 mb-1">{l}</div>
              <div className={`text-3xl font-extrabold ${c}`}>{v}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 justify-end">
          <Btn variant="ghost" onClick={() => setConfirmSubmit(false)} disabled={submitting}>Continue Test</Btn>
          <Btn variant="success" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <><Spinner size={14} className="text-white"/> Submitting…</> : <><CheckCircle size={14}/> Confirm Submit</>}
          </Btn>
        </div>
      </Modal>
    </div>
  );
}
