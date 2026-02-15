
import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileUp, 
  Settings, 
  Sparkles, 
  Eye, 
  ChevronRight, 
  ChevronLeft, 
  Loader2, 
  AlertCircle,
  FileText,
  Printer,
  Download,
  Trash2,
  History,
  Clock,
  BookOpen,
  Plus,
  Languages,
  ChevronDown,
  CheckCircle2
} from 'lucide-react';
import { AppState, FileData, PaperConfig, Difficulty, QuestionPaper, QuestionType, Question, SavedPaper } from './types';
import { generateQuestionPaper } from './services/geminiService';

const INITIAL_CONFIG: PaperConfig = {
  grade: '10th Grade',
  subject: 'General Science',
  difficulty: Difficulty.MEDIUM,
  numMcq: 5,
  numTf: 5,
  numShort: 3,
  numLong: 2,
  language: 'English'
};

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Hindi', 'Bengali', 'Marathi', 'Gujarati', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Chinese', 'Japanese', 'Arabic', 'Portuguese', 'Russian'
];

const STORAGE_KEY = 'edugen_saved_papers';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return {
      step: 'upload',
      files: [],
      config: INITIAL_CONFIG,
      generatedPaper: null,
      history: saved ? JSON.parse(saved) : [],
      loading: false,
      error: null
    };
  });

  const [isPreviewAnswers, setIsPreviewAnswers] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.history));
  }, [state.history]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: FileData[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const base64 = await fileToBase64(file);
      newFiles.push({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type,
        base64: base64.split(',')[1]
      });
    }

    setState(prev => ({ ...prev, files: [...prev.files, ...newFiles], error: null }));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const removeFile = (id: string) => {
    setState(prev => ({ ...prev, files: prev.files.filter(f => f.id !== id) }));
  };

  const startGeneration = async () => {
    if (state.files.length === 0) {
      setState(prev => ({ ...prev, error: "Please upload at least one source document/image." }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const paper = await generateQuestionPaper(state.files, state.config);
      
      const newSavedPaper: SavedPaper = {
        ...paper,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: Date.now()
      };

      setState(prev => ({
        ...prev,
        generatedPaper: paper,
        history: [newSavedPaper, ...prev.history],
        step: 'preview',
        loading: false
      }));
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message || "An unexpected error occurred."
      }));
    }
  };

  const deleteFromHistory = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setState(prev => ({
      ...prev,
      history: prev.history.filter(p => p.id !== id)
    }));
  };

  const viewFromHistory = (paper: SavedPaper) => {
    setState(prev => ({
      ...prev,
      generatedPaper: paper,
      step: 'preview'
    }));
  };

  const handlePrint = (showAnswers: boolean) => {
    setIsPreviewAnswers(showAnswers);
    // Short timeout to allow React to update the DOM before printing
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const reset = () => {
    setState(prev => ({
      ...prev,
      step: 'upload',
      generatedPaper: null,
      error: null,
      files: []
    }));
    setIsPreviewAnswers(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={reset}>
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Sparkles className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">EduGen</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-500">
              <button 
                onClick={() => setState(prev => ({ ...prev, step: 'history' }))}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${state.step === 'history' ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50'}`}
              >
                <History className="w-4 h-4" />
                History
              </button>
              <div className="h-4 w-px bg-slate-200 mx-2" />
              <span className={`${state.step === 'upload' ? 'text-indigo-600 font-bold' : ''}`}>Source</span>
              <ChevronRight className="w-4 h-4" />
              <span className={`${state.step === 'configure' ? 'text-indigo-600 font-bold' : ''}`}>Setup</span>
              <ChevronRight className="w-4 h-4" />
              <span className={`${state.step === 'preview' ? 'text-indigo-600 font-bold' : ''}`}>Result</span>
            </nav>
            <button 
              onClick={reset}
              className="p-2 bg-indigo-600 text-white rounded-lg md:hidden"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 sm:px-6 lg:px-8">
        {state.error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 no-print">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{state.error}</p>
          </div>
        )}

        {state.loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="relative">
              <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mb-4" />
              <Sparkles className="w-6 h-6 text-amber-400 absolute top-0 right-0 animate-bounce" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">Generating Your Paper</h2>
            <p className="text-slate-500 max-w-md">Our AI is analyzing your documents to create unique, balanced questions. This usually takes 15-30 seconds.</p>
          </div>
        ) : (
          <>
            {state.step === 'history' && (
              <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                    <History className="w-8 h-8 text-indigo-600" />
                    Saved Papers
                  </h2>
                  <button 
                    onClick={reset}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    New Paper
                  </button>
                </div>

                {state.history.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-3xl p-20 text-center">
                    <div className="bg-slate-50 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Clock className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No history yet</h3>
                    <p className="text-slate-500 mb-8">Generate your first question paper to see it listed here.</p>
                    <button onClick={reset} className="text-indigo-600 font-bold hover:underline">Get started now &rarr;</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {state.history.map((paper) => (
                      <div 
                        key={paper.id} 
                        onClick={() => viewFromHistory(paper)}
                        className="group bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all cursor-pointer relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => deleteFromHistory(e, paper.id)}
                            className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="bg-indigo-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          <BookOpen className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-slate-900 mb-1 truncate pr-8">{paper.title}</h3>
                        <p className="text-sm text-slate-500 mb-4">{paper.subject} • {paper.grade}</p>
                        <div className="flex items-center justify-between text-xs font-medium text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(paper.createdAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Languages className="w-3 h-3" />
                            {paper.language || 'English'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {state.step === 'upload' && (
              <div className="max-w-3xl mx-auto">
                <div className="bg-white border-2 border-dashed border-slate-300 rounded-3xl p-10 text-center hover:border-indigo-400 transition-colors group">
                  <div className="bg-indigo-50 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-indigo-100 transition-colors">
                    <FileUp className="w-10 h-10 text-indigo-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Upload Knowledge Sources</h3>
                  <p className="text-slate-500 mb-8 max-w-sm mx-auto">Upload textbook PDFs, lecture notes, or images of handwritten pages to generate questions from them.</p>
                  
                  <label className="inline-flex items-center px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 cursor-pointer shadow-lg shadow-indigo-100 transition-all active:scale-95">
                    <span>Select Files</span>
                    <input 
                      type="file" 
                      className="hidden" 
                      multiple 
                      accept=".pdf,image/*"
                      onChange={handleFileUpload}
                    />
                  </label>
                  <p className="mt-4 text-xs text-slate-400">Supported formats: PDF, PNG, JPG (Max 10MB total)</p>
                </div>

                {state.files.length > 0 && (
                  <div className="mt-8">
                    <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-indigo-600" />
                      Uploaded Files ({state.files.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {state.files.map((file) => (
                        <div key={file.id} className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="bg-slate-100 p-2 rounded-lg shrink-0">
                              <FileText className="w-5 h-5 text-slate-600" />
                            </div>
                            <span className="text-sm font-medium text-slate-700 truncate">{file.name}</span>
                          </div>
                          <button 
                            onClick={() => removeFile(file.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="mt-10 flex justify-end">
                      <button 
                        onClick={() => setState(prev => ({ ...prev, step: 'configure' }))}
                        className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl"
                      >
                        Next: Configure Paper
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {state.step === 'configure' && (
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                  <button 
                    onClick={() => setState(prev => ({ ...prev, step: 'upload' }))}
                    className="p-3 text-slate-500 hover:bg-slate-100 rounded-2xl transition-all"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <h2 className="text-3xl font-bold text-slate-900">Paper Settings</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                      <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-indigo-600" />
                        Basic Information
                      </h3>
                      
                      <div className="space-y-5">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Subject / Topic</label>
                          <input 
                            type="text"
                            value={state.config.subject}
                            onChange={(e) => setState(prev => ({ ...prev, config: { ...prev.config, subject: e.target.value }}))}
                            placeholder="e.g. Thermodynamics, Modern History"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Grade Level</label>
                          <input 
                            type="text"
                            value={state.config.grade}
                            onChange={(e) => setState(prev => ({ ...prev, config: { ...prev.config, grade: e.target.value }}))}
                            placeholder="e.g. 10th Grade, College Freshman"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Target Language</label>
                          <div className="relative">
                            <select 
                              value={state.config.language}
                              onChange={(e) => setState(prev => ({ ...prev, config: { ...prev.config, language: e.target.value }}))}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all appearance-none pr-10"
                            >
                              {LANGUAGES.map(lang => (
                                <option key={lang} value={lang}>{lang}</option>
                              ))}
                            </select>
                            <ChevronDown className="w-5 h-5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Target Difficulty</label>
                          <div className="grid grid-cols-3 gap-2">
                            {Object.values(Difficulty).map((d) => (
                              <button
                                key={d}
                                onClick={() => setState(prev => ({ ...prev, config: { ...prev.config, difficulty: d }}))}
                                className={`py-3 rounded-xl text-sm font-bold border transition-all ${
                                  state.config.difficulty === d 
                                    ? 'bg-indigo-600 text-white border-indigo-600' 
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                                }`}
                              >
                                {d.charAt(0) + d.slice(1).toLowerCase()}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                      <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-600" />
                        Question Mix
                      </h3>
                      
                      <div className="space-y-6">
                        <NumberInput 
                          label="Multiple Choice"
                          value={state.config.numMcq}
                          onChange={(v) => setState(prev => ({ ...prev, config: { ...prev.config, numMcq: v }}))}
                        />
                        <NumberInput 
                          label="True / False"
                          value={state.config.numTf}
                          onChange={(v) => setState(prev => ({ ...prev, config: { ...prev.config, numTf: v }}))}
                        />
                        <NumberInput 
                          label="Short Answers"
                          value={state.config.numShort}
                          onChange={(v) => setState(prev => ({ ...prev, config: { ...prev.config, numShort: v }}))}
                        />
                        <NumberInput 
                          label="Long Descriptive"
                          value={state.config.numLong}
                          onChange={(v) => setState(prev => ({ ...prev, config: { ...prev.config, numLong: v }}))}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-12 flex justify-center">
                  <button 
                    onClick={startGeneration}
                    className="flex items-center gap-3 px-10 py-5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 hover:-translate-y-1"
                  >
                    <Sparkles className="w-6 h-6" />
                    Generate Question Paper
                  </button>
                </div>
              </div>
            )}

            {state.step === 'preview' && state.generatedPaper && (
              <div className="max-w-5xl mx-auto">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 no-print">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setState(prev => ({ ...prev, step: prev.history.length > 0 ? 'history' : 'configure' }))}
                      className="p-3 text-slate-500 hover:bg-slate-100 rounded-2xl transition-all"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h2 className="text-3xl font-bold text-slate-900">Paper Result</h2>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button 
                      onClick={() => handlePrint(false)}
                      className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all"
                    >
                      <FileText className="w-5 h-5 text-indigo-600" />
                      Download Paper
                    </button>
                    <button 
                      onClick={() => handlePrint(true)}
                      className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all"
                    >
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      Download Answers
                    </button>
                    <button 
                      onClick={reset}
                      className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg"
                    >
                      Start New
                    </button>
                  </div>
                </div>

                <PaperPreview 
                  paper={state.generatedPaper} 
                  showAnswers={isPreviewAnswers} 
                  onToggleAnswers={setIsPreviewAnswers} 
                />
              </div>
            )}
          </>
        )}
      </main>
      
      <footer className="bg-slate-50 py-8 border-t border-slate-200 no-print">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-slate-500">© 2024 EduGen AI. Designed for modern classrooms.</p>
        </div>
      </footer>
    </div>
  );
};

const NumberInput: React.FC<{ label: string, value: number, onChange: (v: number) => void }> = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm font-medium text-slate-700">{label}</span>
    <div className="flex items-center gap-3">
      <button 
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-all"
      >-</button>
      <span className="w-6 text-center font-bold text-slate-900">{value}</span>
      <button 
        onClick={() => onChange(value + 1)}
        className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-all"
      >+</button>
    </div>
  </div>
);

const PaperPreview: React.FC<{ 
  paper: QuestionPaper; 
  showAnswers: boolean; 
  onToggleAnswers: (val: boolean) => void; 
}> = ({ paper, showAnswers, onToggleAnswers }) => {

  const sections = useMemo(() => {
    const grouped = {
      [QuestionType.MCQ]: [] as Question[],
      [QuestionType.TRUE_FALSE]: [] as Question[],
      [QuestionType.SHORT_ANSWER]: [] as Question[],
      [QuestionType.LONG_ANSWER]: [] as Question[]
    };

    paper.questions.forEach(q => {
      if (grouped[q.type]) {
        grouped[q.type].push(q);
      }
    });

    return [
      { id: 'A', title: 'Multiple Choice Questions', type: QuestionType.MCQ, items: grouped[QuestionType.MCQ] },
      { id: 'B', title: 'True or False Questions', type: QuestionType.TRUE_FALSE, items: grouped[QuestionType.TRUE_FALSE] },
      { id: 'C', title: 'Short Answer Questions', type: QuestionType.SHORT_ANSWER, items: grouped[QuestionType.SHORT_ANSWER] },
      { id: 'D', title: 'Long Answer Questions', type: QuestionType.LONG_ANSWER, items: grouped[QuestionType.LONG_ANSWER] }
    ].filter(s => s.items.length > 0);
  }, [paper.questions]);

  let questionCounter = 1;

  return (
    <div className="space-y-8">
      <div className="no-print flex justify-center">
        <div className="bg-slate-200 p-1 rounded-2xl flex">
          <button 
            onClick={() => onToggleAnswers(false)}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${!showAnswers ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Question Paper
          </button>
          <button 
            onClick={() => onToggleAnswers(true)}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${showAnswers ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Answer Key
          </button>
        </div>
      </div>

      <div className="bg-white print:bg-white print:shadow-none print:border-none print:rounded-none print:p-0 rounded-[2rem] border border-slate-200 shadow-2xl p-8 sm:p-16 max-w-[850px] mx-auto min-h-[1100px] flex flex-col font-serif">
        <div className="text-center border-b-2 border-slate-900 pb-8 mb-8">
          <h1 className="text-3xl font-black uppercase tracking-widest mb-2">
            {showAnswers ? `ANSWER KEY: ${paper.title}` : paper.title}
          </h1>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm font-bold uppercase tracking-wider text-slate-600">
            <span>Subject: {paper.subject}</span>
            <span>Grade: {paper.grade}</span>
            <span>Language: {paper.language}</span>
            <span>Time: {paper.durationMinutes} Minutes</span>
            <span>Max Marks: {paper.totalMarks}</span>
          </div>
        </div>

        <div className="mb-10">
          <h3 className="text-lg font-bold underline mb-4 uppercase">General Instructions:</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm italic">
            {paper.instructions.map((inst, i) => (
              <li key={i}>{inst}</li>
            ))}
            {showAnswers ? (
              <li className="font-bold text-red-600 print:text-black">This document is for teacher use only. It contains the correct answers and explanations.</li>
            ) : (
              <>
                <li>Ensure you write your name and roll number clearly.</li>
                <li>All questions are compulsory unless mentioned otherwise.</li>
              </>
            )}
          </ul>
        </div>

        <div className="space-y-12 flex-1">
          {sections.map((section) => (
            <div key={section.id} className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="bg-slate-900 text-white px-4 py-1 text-lg font-bold shrink-0">SECTION {section.id}</div>
                <div className="flex-1 border-b border-slate-900 border-dashed"></div>
                <div className="text-lg font-bold uppercase tracking-wide shrink-0">{section.title}</div>
              </div>
              
              <div className="space-y-8">
                {section.items.map((q) => {
                  const currentIdx = questionCounter++;
                  return (
                    <div key={q.id} className="relative group page-break-inside-avoid">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold mr-4 shrink-0">{currentIdx}.</span>
                        <p className="flex-1 font-medium leading-relaxed">{q.text}</p>
                        <span className="font-bold ml-4 shrink-0">({q.marks})</span>
                      </div>

                      {q.type === QuestionType.MCQ && q.options && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 pl-10 mt-3">
                          {q.options.map((opt, i) => (
                            <div key={i} className="flex gap-2 text-sm">
                              <span className="font-bold">{String.fromCharCode(65 + i)})</span>
                              <span>{opt}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {q.type === QuestionType.TRUE_FALSE && (
                        <div className="flex gap-6 pl-10 mt-2 text-sm font-bold text-slate-400 italic">
                          <span>(True / False)</span>
                        </div>
                      )}

                      {showAnswers && (
                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl print:bg-slate-50 print:border-slate-300">
                          <p className="text-sm font-bold text-green-800 print:text-black mb-1">Correct Answer:</p>
                          <p className="text-sm text-green-700 print:text-black font-sans font-semibold underline">{q.correctAnswer}</p>
                          {q.explanation && (
                            <>
                              <p className="text-sm font-bold text-green-800 print:text-black mt-2 mb-1">Explanation:</p>
                              <p className="text-sm text-green-600 print:text-black italic font-sans">{q.explanation}</p>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-slate-200 text-center text-xs text-slate-400 font-sans italic">
          --- End of {showAnswers ? 'Answer Key' : 'Question Paper'} ---
        </div>
      </div>
    </div>
  );
};

export default App;
