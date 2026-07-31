export interface MoodOption {
  id: string;
  emoji: string;
  label: string;
  color: string;
  bgColor: string;
}

export interface DiaryEntry {
  id: string;
  createdAt: string;
  mood?: string;
  diaryText: string;
  imageBase64: string;
  aiLetter?: string;
}

export interface AnalyzeRequest {
  diaryText: string;
  imageBase64: string;
  mood?: string;
}

export interface AnalyzeResponse {
  success: boolean;
  letter?: string;
  error?: string;
}

export interface CanvasRef {
  getImageBase64: () => string;
  isEmpty: () => boolean;
  clear: () => void;
  undo: () => void;
  redo: () => void;
}
