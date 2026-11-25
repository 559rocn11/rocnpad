export type NoteType =
  | 'note'
  | 'thought'
  | 'photo'
  | 'screenshot'
  | 'drawing'
  | 'voice'
  | 'link'
  | 'code'
  | 'task'
  | 'idea'
  | 'file';

export interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
  due?: string | null;
  priority?: 'high' | 'normal' | 'low';
}

export interface NoteRelation {
  noteId: string;
  relationReason?: string;
  reason?: string;
  confidence?: number;
}

export interface NoteObject {
  id: string;
  title: string;
  content: string;
  type: NoteType;
  tags: string[];
  project?: string;
  people?: string[];
  location?: string;
  mediaUrl?: string; // base64 or object URL for images, sketches, audio
  mediaMimeType?: string;
  audioDuration?: number; // in seconds
  audioTranscript?: string;
  codeLanguage?: string;
  isStarred?: boolean;
  isArchived?: boolean;
  pinned?: boolean;
  tasks?: TaskItem[];
  backlinks?: string[]; // IDs of other notes linked
  connections?: NoteRelation[];
  summary?: string;
  keyTakeaways?: string[];
  extractedFacts?: string[];
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  icon?: string;
  createdAt: string;
}

export type AIProvider = 'gemini' | 'openai' | 'claude' | 'openrouter';

export interface AIProviderConfig {
  provider: AIProvider;
  apiKey: string;
  customEndpoint?: string;
  model?: string;
  useServerProxy: boolean;
}

export interface UserSettings {
  theme?: 'dark' | 'industrial-dark' | 'obsidian' | 'sepia' | 'minimal';
  encryptionEnabled?: boolean;
  vaultPin?: string;
  autoExtractOnSave?: boolean;
  aiConfig?: AIProviderConfig;
  userName?: string;
  customApiKey?: string;
  openaiKey?: string;
  claudeKey?: string;
  openrouterKey?: string;
  readwiseToken?: string;
  readwiseAutoSync?: boolean;
  lastReadwiseSync?: string;
  pinCode?: string;
  isPinProtected?: boolean;
  fontSize?: string;
  aiEnabled?: boolean;
  localModelEnabled?: boolean;
  readingPreferences?: ReadingPreferences;
}

export interface ReadingPreferences {
  theme: 'obsidian' | 'sepia' | 'midnight' | 'slate';
  fontFamily: 'serif' | 'sans' | 'display' | 'mono';
  fontSize: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  lineHeight: 'tight' | 'relaxed' | 'loose';
  contentWidth: 'narrow' | 'medium' | 'wide' | 'full';
  autoScrollSpeed: number; // pixels per second (15 to 160)
  enableZenHeader: boolean;
}

export interface ReadwiseHighlight {
  id: number | string;
  text: string;
  note?: string;
  location?: number | string;
  location_type?: string;
  highlighted_at?: string;
  url?: string;
  color?: string;
  tags?: { id: number; name: string }[];
}

export interface ReadwiseBook {
  user_book_id?: number;
  id: number | string;
  title: string;
  author: string;
  category: 'books' | 'articles' | 'tweets' | 'podcasts' | 'supplemental' | string;
  source?: string;
  num_highlights: number;
  last_highlight_at?: string;
  updated?: string;
  cover_image_url?: string;
  highlights_url?: string;
  source_url?: string;
  asin?: string;
  tags?: { id: number; name: string }[];
  document_note?: string;
  summary?: string;
  highlights?: ReadwiseHighlight[];
}

export interface DailyRecapData {
  headline: string;
  totalCaptured: number;
  breakdown: { category: string; count: number; description: string }[];
  accomplished: string[];
  ideasHad: string[];
  tasksSummary: {
    created: number;
    completed: number;
    pending: string[];
  };
  mostRepeatedTopic: string;
  dailyReflection: string;
  generatedAt: string;
  targetDate: string;
}

export interface LookBackReviewData {
  title?: string;
  period?: string;
  dominantFocus?: string;
  coreFocus?: string;
  howThinkingEvolved?: string;
  recurringIdeas?: string[];
  neglectedProjects?: string[];
  emergingSparks?: string[];
  keyLearnings?: string[];
  recommendedNextActions?: string[];
  narrativeSummary?: string;
  generatedAt?: string;
  timeframe?: string;
}

export interface QueryResult {
  answer: string;
  answerMarkdown?: string;
  citedNoteIds: string[];
  matchedDates?: string[];
  insights?: string[];
  keyInsights?: string[];
}

export type ActiveView =
  | 'today'
  | 'notes'
  | 'projects'
  | 'ideas'
  | 'tasks'
  | 'media'
  | 'knowledge'
  | 'search'
  | 'ai'
  | 'settings';
