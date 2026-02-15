
export enum QuestionType {
  MCQ = 'MCQ',
  TRUE_FALSE = 'TRUE_FALSE',
  SHORT_ANSWER = 'SHORT_ANSWER',
  LONG_ANSWER = 'LONG_ANSWER'
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[]; // For MCQ
  correctAnswer: string;
  explanation: string;
  marks: number;
}

export interface QuestionPaper {
  title: string;
  grade: string;
  subject: string;
  language: string;
  durationMinutes: number;
  totalMarks: number;
  instructions: string[];
  questions: Question[];
}

export interface SavedPaper extends QuestionPaper {
  id: string;
  createdAt: number;
}

export interface AppState {
  step: 'upload' | 'configure' | 'generate' | 'preview' | 'history';
  files: FileData[];
  config: PaperConfig;
  generatedPaper: QuestionPaper | null;
  history: SavedPaper[];
  loading: boolean;
  error: string | null;
}

export interface FileData {
  id: string;
  name: string;
  type: string;
  base64: string;
}

export interface PaperConfig {
  grade: string;
  subject: string;
  difficulty: Difficulty;
  numMcq: number;
  numTf: number;
  numShort: number;
  numLong: number;
  language: string;
}
