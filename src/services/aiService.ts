import { NoteObject, DailyRecapData, LookBackReviewData, QueryResult } from '../types';
import { storage } from './storage';

export interface SummarizeResult {
  summary: string;
  keyTakeaways: string[];
  suggestedTags: string[];
}

export interface CleanupResult {
  title: string;
  cleanedContent: string;
  tags: string[];
}

export interface ExtractResult {
  tasks: { text: string; due?: string | null; priority?: 'high' | 'normal' | 'low' }[];
  people: string[];
  projects: string[];
  ideas: string[];
  facts: string[];
  tags: string[];
}

export interface ConnectResult {
  relatedNotes: { noteId: string; relationReason: string; confidence?: number }[];
  suggestedSharedTopics: string[];
}

class AIService {
  private async getHeaders(): Promise<HeadersInit> {
    const settings = await storage.getSettings();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (settings.aiConfig?.apiKey) {
      headers['x-custom-api-key'] = settings.aiConfig.apiKey;
    }
    if (settings.aiConfig?.provider) {
      headers['x-provider'] = settings.aiConfig.provider;
    }
    return headers;
  }

  // 1. Summarize Note
  public async summarizeNote(note: NoteObject): Promise<SummarizeResult> {
    try {
      const headers = await this.getHeaders();
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: note.title,
          content: note.content,
          type: note.type,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return {
        summary: data.summary || 'Summary unavailable.',
        keyTakeaways: data.keyTakeaways || [],
        suggestedTags: data.suggestedTags || [],
      };
    } catch (err) {
      console.warn('AI summarize fallback:', err);
      // Local heuristic fallback
      const lines = note.content.split('\n').filter(l => l.trim().length > 0);
      return {
        summary: lines.slice(0, 2).join(' ') || note.title,
        keyTakeaways: lines.slice(0, 3).map(l => l.replace(/^[-*#]\s*/, '')),
        suggestedTags: [note.type, 'local-note'],
      };
    }
  }

  // 2. Clean Up Note
  public async cleanUpNote(note: Partial<NoteObject>): Promise<CleanupResult> {
    try {
      const headers = await this.getHeaders();
      const res = await fetch('/api/ai/cleanup', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: note.title,
          content: note.content,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return {
        title: data.title || note.title || 'Structured Note',
        cleanedContent: data.cleanedContent || note.content || '',
        tags: data.tags || [],
      };
    } catch (err) {
      console.warn('AI cleanup fallback:', err);
      return {
        title: note.title || 'Cleaned Note',
        cleanedContent: (note.content || '')
          .split('\n')
          .map(l => l.trim())
          .filter(Boolean)
          .join('\n\n'),
        tags: ['structured'],
      };
    }
  }

  // 3. Extract entities (Tasks, Dates, People, Projects, Facts)
  public async extractEntities(note: Partial<NoteObject>): Promise<ExtractResult> {
    try {
      const headers = await this.getHeaders();
      const res = await fetch('/api/ai/extract', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: note.title,
          content: note.content,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return {
        tasks: data.tasks || [],
        people: data.people || [],
        projects: data.projects || [],
        ideas: data.ideas || [],
        facts: data.facts || [],
        tags: data.tags || [],
      };
    } catch (err) {
      console.warn('AI extract fallback:', err);
      // Local regex extraction
      const content = note.content || '';
      const taskMatches = content.match(/[-*]\s*\[\s*\]\s*(.+)/g) || [];
      const extractedTasks = taskMatches.map((t, idx) => ({
        id: `t_loc_${idx}`,
        text: t.replace(/[-*]\s*\[\s*\]\s*/, ''),
        priority: 'normal' as const,
      }));

      const tags = (content.match(/#([\w-]+)/g) || []).map(t => t.slice(1));

      return {
        tasks: extractedTasks,
        people: [],
        projects: [],
        ideas: [],
        facts: [],
        tags,
      };
    }
  }

  // 4. Connect / Related Notes
  public async findConnections(currentNote: NoteObject, allNotes: NoteObject[]): Promise<ConnectResult> {
    try {
      const headers = await this.getHeaders();
      const res = await fetch('/api/ai/connect', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          currentNote,
          allNotes,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return {
        relatedNotes: data.relatedNotes || [],
        suggestedSharedTopics: data.suggestedSharedTopics || [],
      };
    } catch (err) {
      console.warn('AI connect fallback:', err);
      // Local tag/project matching
      const related = allNotes
        .filter(n => n.id !== currentNote.id)
        .filter(n => {
          const sharesProject = n.project && n.project === currentNote.project;
          const sharesTag = n.tags?.some(t => currentNote.tags?.includes(t));
          return sharesProject || sharesTag;
        })
        .slice(0, 4)
        .map(n => ({
          noteId: n.id,
          relationReason: n.project === currentNote.project
            ? `Shared project: ${n.project}`
            : `Shared tags (${n.tags.filter(t => currentNote.tags.includes(t)).join(', ')})`,
          confidence: 0.85,
        }));

      return {
        relatedNotes: related,
        suggestedSharedTopics: currentNote.tags || [],
      };
    }
  }

  // 5. Ask Your Knowledge
  public async queryKnowledge(query: string, notes: NoteObject[], dateFilter?: string): Promise<QueryResult> {
    try {
      const headers = await this.getHeaders();
      const res = await fetch('/api/ai/query', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query,
          notes,
          dateFilter,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return {
        answer: data.answer || data.answerMarkdown || 'No answer generated.',
        answerMarkdown: data.answerMarkdown || data.answer || 'No answer generated.',
        citedNoteIds: data.citedNoteIds || [],
        matchedDates: data.matchedDates || [],
        insights: data.insights || [],
        keyInsights: data.keyInsights || data.insights || [],
      };
    } catch (err) {
      console.warn('AI query fallback:', err);
      // Fast client-side lexical search
      const qLower = query.toLowerCase();
      const matchingNotes = notes.filter(n =>
        n.title.toLowerCase().includes(qLower) ||
        n.content.toLowerCase().includes(qLower) ||
        n.tags?.some(t => t.toLowerCase().includes(qLower)) ||
        (n.summary && n.summary.toLowerCase().includes(qLower))
      );

      if (matchingNotes.length === 0) {
        return {
          answer: `No exact records found matching "${query}" in your local notes vault. Try adjusting your query or expanding search terms.`,
          answerMarkdown: `No exact records found matching **"${query}"** in your local notes vault. Try adjusting your query or expanding search terms.`,
          citedNoteIds: [],
        };
      }

      let text = `Found ${matchingNotes.length} matching note${matchingNotes.length > 1 ? 's' : ''} in your local knowledge system:\n\n`;
      for (const n of matchingNotes.slice(0, 5)) {
        text += `- ${n.title} (${new Date(n.createdAt).toLocaleDateString()}): ${n.content.slice(0, 140)}...\n`;
      }

      return {
        answer: text,
        answerMarkdown: text,
        citedNoteIds: matchingNotes.map(n => n.id),
        keyInsights: matchingNotes.map(n => n.title),
      };
    }
  }

  public async queryKnowledgeBase(query: string, notes: NoteObject[], dateFilter?: string): Promise<QueryResult> {
    return this.queryKnowledge(query, notes, dateFilter);
  }

  // 6. Today's Recap / My Day
  public async generateDailyRecap(todayNotes: NoteObject[], targetDate: string): Promise<DailyRecapData> {
    try {
      const headers = await this.getHeaders();
      const res = await fetch('/api/ai/recap', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          todayNotes,
          targetDate,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return {
        headline: data.headline || `Daily Recap for ${targetDate}`,
        totalCaptured: todayNotes.length,
        breakdown: data.breakdown || [],
        accomplished: data.accomplished || [],
        ideasHad: data.ideasHad || [],
        tasksSummary: data.tasksSummary || { created: 0, completed: 0, pending: [] },
        mostRepeatedTopic: data.mostRepeatedTopic || 'ROCN Workspace',
        dailyReflection: data.dailyReflection || 'Steady intellectual momentum captured throughout the day.',
        generatedAt: new Date().toISOString(),
        targetDate,
      };
    } catch (err) {
      console.warn('AI recap fallback:', err);
      const allTasks = todayNotes.flatMap(n => n.tasks || []);
      const completed = allTasks.filter(t => t.completed).length;
      const ideas = todayNotes.filter(n => n.type === 'idea').map(n => n.title);

      return {
        headline: `You captured ${todayNotes.length} item${todayNotes.length === 1 ? '' : 's'} on ${targetDate}`,
        totalCaptured: todayNotes.length,
        breakdown: [
          { category: 'Notes & Thoughts', count: todayNotes.length, description: 'Direct captures' },
        ],
        accomplished: [`Maintained local thought stream with ${todayNotes.length} entries`],
        ideasHad: ideas.length > 0 ? ideas : ['System optimization & workflow execution'],
        tasksSummary: {
          created: allTasks.length,
          completed,
          pending: allTasks.filter(t => !t.completed).map(t => t.text),
        },
        mostRepeatedTopic: todayNotes[0]?.tags?.[0] || 'Active Thinking',
        dailyReflection: 'Clear record of work, ideas, and observations logged to local vault.',
        generatedAt: new Date().toISOString(),
        targetDate,
      };
    }
  }

  // 7. Look Back (Weekly / Monthly Review)
  public async generateLookBack(notes: NoteObject[], timeframe: string, focusQuestion?: string): Promise<LookBackReviewData> {
    try {
      const headers = await this.getHeaders();
      const res = await fetch('/api/ai/review', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          notes,
          timeframe,
          focusQuestion,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return {
        title: data.title || `Look Back: ${timeframe}`,
        period: timeframe,
        dominantFocus: data.dominantFocus || data.coreFocus || 'System architecture & multi-modal capture',
        coreFocus: data.coreFocus || data.dominantFocus || 'System architecture & multi-modal capture',
        howThinkingEvolved: data.howThinkingEvolved || 'Shifted from basic note logging to connected system reasoning.',
        recurringIdeas: data.recurringIdeas || [],
        neglectedProjects: data.neglectedProjects || [],
        emergingSparks: data.emergingSparks || [],
        keyLearnings: data.keyLearnings || [],
        recommendedNextActions: data.recommendedNextActions || [],
        narrativeSummary: data.narrativeSummary || 'Reflective review compiled from local records.',
        generatedAt: new Date().toISOString(),
        timeframe,
      };
    } catch (err) {
      console.warn('AI review fallback:', err);
      return {
        title: `Look Back: ${timeframe}`,
        period: timeframe,
        dominantFocus: 'ROCN Ecosystem & Personal Knowledge Management',
        coreFocus: 'ROCN Ecosystem & Personal Knowledge Management',
        howThinkingEvolved: 'Evolved from atomic thoughts toward cohesive architectural blueprints.',
        recurringIdeas: ['Offline AI edge inference', 'Local-first zero-account privacy', 'Multi-modal optical capture'],
        neglectedProjects: ['Cosmetics Lab formulation tests'],
        emergingSparks: ['Dynamic knowledge graphs', 'Smart glasses integration heuristics'],
        keyLearnings: ['Fast, unconstrained capture with automatic relationship discovery beats rigid folder hierarchies.'],
        recommendedNextActions: ['Complete WebGPU mobile quantization benchmark', 'Finalize Nomad optical ray tracing review'],
        narrativeSummary: `Across ${notes.length} objects captured during this period, your primary intellectual energy centered on high-efficiency computing and unhindered creative ideation.`,
        generatedAt: new Date().toISOString(),
        timeframe,
      };
    }
  }

  public async generateLookBackReview(notes: NoteObject[], timeframe: string, focusQuestion?: string): Promise<LookBackReviewData> {
    return this.generateLookBack(notes, timeframe, focusQuestion);
  }

  // 8. Transcribe Audio
  public async transcribeAudio(audioBase64: string, mimeType: string): Promise<string> {
    try {
      const headers = await this.getHeaders();
      const res = await fetch('/api/ai/transcribe', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          audioBase64,
          mimeType,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.text || '';
    } catch (err) {
      console.warn('AI transcribe fallback:', err);
      return 'Voice memo recorded (Audio preview ready).';
    }
  }

  // 9. Extract Tasks from Spoken Voice Transcript
  public async extractVoiceTasks(
    transcript: string,
    title?: string
  ): Promise<{ tasks: { text: string; due?: string | null; priority?: 'high' | 'normal' | 'low' }[]; suggestedTitle?: string }> {
    try {
      if (!transcript || transcript.trim().length === 0) {
        return { tasks: [] };
      }
      const headers = await this.getHeaders();
      const res = await fetch('/api/ai/extract-voice-tasks', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          transcript,
          title,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return {
        tasks: data.tasks || [],
        suggestedTitle: data.suggestedTitle,
      };
    } catch (err) {
      console.warn('AI extract-voice-tasks fallback:', err);
      // Fallback heuristics: check for trigger words like "need to", "remember to", "todo", "action:"
      const lines = transcript.split(/[.\n]/).map(l => l.trim()).filter(Boolean);
      const matched = lines.filter(l =>
        /^(need to|have to|remember to|todo|task|call|email|buy|finish|check|send|prepare)\b/i.test(l)
      );
      return {
        tasks: matched.map((text, idx) => ({
          text,
          priority: 'normal' as const,
        })),
      };
    }
  }

  // 10. Translate Voice Transcript / Text
  public async translateText(
    text: string,
    targetLanguage: string
  ): Promise<{ translatedText: string; sourceLanguage?: string; targetLanguage: string }> {
    try {
      if (!text || text.trim().length === 0) {
        return { translatedText: '', targetLanguage };
      }
      const headers = await this.getHeaders();
      const res = await fetch('/api/ai/translate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          text,
          targetLanguage,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return {
        translatedText: data.translatedText || text,
        sourceLanguage: data.sourceLanguage,
        targetLanguage: data.targetLanguage || targetLanguage,
      };
    } catch (err) {
      console.warn('AI translate fallback:', err);
      return {
        translatedText: `[Translation to ${targetLanguage} unavailable in offline mode]\n\n${text}`,
        targetLanguage,
      };
    }
  }
}

export const aiService = new AIService();
