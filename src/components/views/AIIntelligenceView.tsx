import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Compass,
  Clock,
  ArrowRight,
  BookOpen,
  HelpCircle,
  Zap,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Layers,
  MessageSquare,
} from 'lucide-react';
import { NoteObject, Project, QueryResult, LookBackReviewData } from '../../types';
import { aiService } from '../../services/aiService';

interface AIIntelligenceViewProps {
  notes: NoteObject[];
  projects: Project[];
  onSelectNote: (note: NoteObject) => void;
}

export const AIIntelligenceView: React.FC<AIIntelligenceViewProps> = ({
  notes,
  projects,
  onSelectNote,
}) => {
  const [activeTab, setActiveTab] = useState<'ask' | 'lookback'>('ask');

  // "Ask Your Knowledge" state
  const [askQuery, setAskQuery] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [chatHistory, setChatHistory] = useState<
    { query: string; answer: string; citedNoteIds: string[]; keyInsights?: string[] }[]
  >([
    {
      query: 'What was I working on around September 22?',
      answer:
        'Around September 22, your primary focus was building the ROCN nomadic operating system and audio engine pipeline. You captured requirements for local-first encrypted audio memos, offline-first notes indexing, and lightweight SQLite/IndexedDB syncing.',
      citedNoteIds: notes.filter((n) => n.createdAt.startsWith('2026-09-22')).map((n) => n.id),
      keyInsights: [
        'Local-first privacy architecture',
        'Real-time voice memo streaming with Web Audio',
        'Unified knowledge graph cross-linking',
      ],
    },
  ]);

  // "Look Back" state
  const [lookBackPeriod, setLookBackPeriod] = useState<'week' | 'month' | 'quarter'>('week');
  const [lookBackTheme, setLookBackTheme] = useState<string>(
    'What have I been thinking about, and which projects need attention?'
  );
  const [isGeneratingLookBack, setIsGeneratingLookBack] = useState(false);
  const [lookBackData, setLookBackData] = useState<LookBackReviewData | null>(null);

  const handleAskSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!askQuery.trim() || isAsking) return;

    const currentQ = askQuery.trim();
    setAskQuery('');
    setIsAsking(true);

    try {
      const res = await aiService.queryKnowledgeBase(currentQ, notes);
      setChatHistory((prev) => [
        ...prev,
        {
          query: currentQ,
          answer: res.answer,
          citedNoteIds: res.citedNoteIds,
          keyInsights: res.keyInsights,
        },
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  const handleRunLookBack = async () => {
    setIsGeneratingLookBack(true);
    try {
      const res = await aiService.generateLookBackReview(notes, lookBackPeriod, lookBackTheme);
      setLookBackData(res);
    } finally {
      setIsGeneratingLookBack(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#0b0c10]">
      {/* Top Header */}
      <div className="p-6 pb-4 border-b border-[#1c212c] bg-[#0d0f14]/80 backdrop-blur-md sticky top-0 z-10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight text-white font-display">
                ROCN INTELLIGENCE
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#181d28] text-blue-400 border border-[#2b354a] font-mono-code">
                Local-Grounded Engine
              </span>
            </div>
            <p className="text-xs text-[#717c91] font-mono-code mt-0.5">
              “What have I been thinking about?” — Neural synthesis grounded purely in your personal vault
            </p>
          </div>
        </div>

        {/* Intelligence Mode Tabs */}
        <div className="flex items-center gap-2 text-xs font-mono-code">
          <button
            onClick={() => setActiveTab('ask')}
            className={`px-3.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition-colors ${
              activeTab === 'ask'
                ? 'bg-blue-600/20 text-blue-400 border-blue-500/40 font-semibold'
                : 'bg-[#12151d] text-[#717c91] border-[#1d232f] hover:text-[#e2e8f0]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Ask Your Knowledge</span>
          </button>

          <button
            onClick={() => setActiveTab('lookback')}
            className={`px-3.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition-colors ${
              activeTab === 'lookback'
                ? 'bg-blue-600/20 text-blue-400 border-blue-500/40 font-semibold'
                : 'bg-[#12151d] text-[#717c91] border-[#1d232f] hover:text-[#e2e8f0]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Look Back & Reflection</span>
          </button>
        </div>
      </div>

      {/* Mode 1: Ask Your Knowledge */}
      {activeTab === 'ask' && (
        <div className="p-6 max-w-4xl w-full mx-auto flex-1 flex flex-col justify-between space-y-6">
          {/* Chat / Query Log */}
          <div className="space-y-6 flex-1">
            {chatHistory.map((item, idx) => (
              <div key={idx} className="space-y-3 animate-in fade-in duration-200">
                {/* User Query */}
                <div className="flex items-center gap-2 text-xs text-white font-mono-code font-bold bg-[#141822] p-3 rounded-lg border border-[#232b3b]">
                  <span className="text-blue-400">Q:</span>
                  <span>{item.query}</span>
                </div>

                {/* AI Grounded Answer */}
                <div className="p-5 rounded-xl bg-[#0f121a] border border-[#21293b] space-y-3">
                  <div className="flex items-center gap-1.5 text-xs text-blue-400 font-semibold font-display">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Vault Synthesis</span>
                  </div>

                  <p className="text-xs text-[#cbd5e1] leading-relaxed font-mono-code whitespace-pre-wrap">
                    {item.answer}
                  </p>

                  {/* Key Takeaways */}
                  {item.keyInsights && item.keyInsights.length > 0 && (
                    <div className="pt-2 border-t border-[#1b2230] space-y-1">
                      <span className="text-[10px] uppercase font-mono-code text-[#64748b]">
                        Key Takeaways:
                      </span>
                      <ul className="list-disc list-inside text-xs text-[#94a3b8] space-y-0.5 font-mono-code">
                        {item.keyInsights.map((insight, i) => (
                          <li key={i}>{insight}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Cited Notes */}
                  {item.citedNoteIds && item.citedNoteIds.length > 0 && (
                    <div className="pt-2 border-t border-[#1b2230] flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] uppercase font-mono-code text-[#64748b]">Citations:</span>
                      {item.citedNoteIds.map((id) => {
                        const note = notes.find((n) => n.id === id);
                        if (!note) return null;
                        return (
                          <button
                            key={id}
                            onClick={() => onSelectNote(note)}
                            className="px-2 py-0.5 rounded bg-[#161c28] hover:bg-[#20293a] text-[11px] text-blue-300 border border-[#263347] font-mono-code flex items-center gap-1"
                          >
                            <BookOpen className="w-3 h-3 text-blue-400" />
                            <span className="truncate max-w-[140px]">{note.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isAsking && (
              <div className="p-4 rounded-xl bg-[#0f121a] border border-[#21293b] flex items-center gap-3 text-xs text-blue-400 font-mono-code animate-pulse">
                <Sparkles className="w-4 h-4" />
                <span>Searching local vault notes and synthesizing response...</span>
              </div>
            )}
          </div>

          {/* Query Bar */}
          <div className="sticky bottom-4 bg-[#0d0f14]/90 backdrop-blur-md pt-2">
            {/* Suggestion Prompts */}
            <div className="flex flex-wrap items-center gap-1.5 pb-2 text-[11px] font-mono-code text-[#64748b]">
              <span>Try asking:</span>
              {[
                'What are my unresolved tasks?',
                'Summarize the ROCN vision notes',
                'What did I capture on September 22?',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setAskQuery(suggestion)}
                  className="px-2 py-0.5 rounded bg-[#13161f] hover:bg-[#1a202c] text-[#8590a6] hover:text-white border border-[#1f2533]"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <form onSubmit={handleAskSubmit} className="relative">
              <input
                type="text"
                placeholder="Ask your thoughts... (e.g. 'What have I learned about the audio engine?')"
                value={askQuery}
                onChange={(e) => setAskQuery(e.target.value)}
                className="w-full bg-[#131620] border border-[#273245] rounded-xl pl-4 pr-12 py-3 text-xs text-white placeholder:text-[#475569] focus:outline-none focus:border-blue-500/80 font-mono-code shadow-lg"
              />
              <button
                type="submit"
                disabled={!askQuery.trim() || isAsking}
                className="absolute right-2.5 top-2.5 p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-30 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Mode 2: Look Back & Review */}
      {activeTab === 'lookback' && (
        <div className="p-6 max-w-4xl w-full mx-auto space-y-6">
          {/* Look Back Controller */}
          <div className="p-5 rounded-xl bg-[#12151e] border border-[#232d3f] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-white font-display">Long-Term Review & Reflection</h3>
                <p className="text-xs text-[#8590a6] font-mono-code mt-0.5">
                  Synthesize trends, identify neglected goals, and track your mind's evolution.
                </p>
              </div>

              {/* Period Selector */}
              <div className="flex items-center bg-[#0d0f14] p-0.5 rounded-lg border border-[#1e2433] text-xs font-mono-code">
                {(['week', 'month', 'quarter'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setLookBackPeriod(period)}
                    className={`px-3 py-1 rounded capitalize ${
                      lookBackPeriod === period
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-[#717c91] hover:text-white'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Focus Theme */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono-code text-[#64748b]">Focus or Reflection Prompt</label>
              <input
                type="text"
                value={lookBackTheme}
                onChange={(e) => setLookBackTheme(e.target.value)}
                className="w-full bg-[#0a0c10] border border-[#1e2535] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono-code"
              />
            </div>

            <button
              onClick={handleRunLookBack}
              disabled={isGeneratingLookBack}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md active:scale-95 transition-all disabled:opacity-50"
            >
              <Compass className="w-4 h-4" />
              <span>{isGeneratingLookBack ? 'Synthesizing Vault History...' : 'Generate Look Back Report'}</span>
            </button>
          </div>

          {/* Look Back Results */}
          {lookBackData && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Executive Theme Card */}
              <div className="p-5 rounded-xl bg-[#0f121a] border border-[#21293b] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                    <h3 className="font-bold text-sm text-white font-display">Dominant Focus & Trajectory</h3>
                  </div>
                  <span className="text-[11px] font-mono-code text-[#64748b] uppercase">
                    {lookBackData.period}
                  </span>
                </div>
                <p className="text-xs text-[#cbd5e1] leading-relaxed font-mono-code">
                  {lookBackData.dominantFocus}
                </p>
              </div>

              {/* 3 Pillars Grid: Evolution, Neglected, Emerging */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono-code">
                {/* Evolution */}
                <div className="p-4 rounded-xl bg-[#0f121a] border border-[#21293b] space-y-2">
                  <div className="text-[10px] text-[#64748b] uppercase flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-blue-400" />
                    <span>How Thinking Evolved</span>
                  </div>
                  <p className="text-[#94a3b8] leading-relaxed">{lookBackData.howThinkingEvolved}</p>
                </div>

                {/* Neglected */}
                <div className="p-4 rounded-xl bg-[#0f121a] border border-[#21293b] space-y-2">
                  <div className="text-[10px] text-[#64748b] uppercase flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-rose-400" />
                    <span>Neglected Projects</span>
                  </div>
                  <ul className="list-disc list-inside text-[#94a3b8] space-y-1">
                    {lookBackData.neglectedProjects?.map((proj, i) => (
                      <li key={i}>{proj}</li>
                    ))}
                  </ul>
                </div>

                {/* Emerging Sparks */}
                <div className="p-4 rounded-xl bg-[#0f121a] border border-[#21293b] space-y-2">
                  <div className="text-[10px] text-[#64748b] uppercase flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Emerging Sparks</span>
                  </div>
                  <ul className="list-disc list-inside text-[#94a3b8] space-y-1">
                    {lookBackData.emergingSparks?.map((spark, i) => (
                      <li key={i}>{spark}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Recommended Next Actions */}
              {lookBackData.recommendedNextActions && lookBackData.recommendedNextActions.length > 0 && (
                <div className="p-4 rounded-xl bg-[#121622] border border-[#263145] space-y-2">
                  <div className="text-xs font-semibold text-white font-display">
                    Recommended Next Actions
                  </div>
                  <div className="space-y-1.5">
                    {lookBackData.recommendedNextActions.map((action, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-[#cbd5e1] font-mono-code">
                        <ArrowRight className="w-3 h-3 text-blue-400 shrink-0" />
                        <span>{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
