import React, { useState } from 'react';
import {
  Lightbulb,
  Sparkles,
  Plus,
  ArrowRight,
  Zap,
  TrendingUp,
  Tag,
  Star,
  CheckCircle2,
  Layers,
  Wand2,
} from 'lucide-react';
import { NoteObject, Project } from '../../types';
import { aiService } from '../../services/aiService';

interface IdeasViewProps {
  notes: NoteObject[];
  projects: Project[];
  onSelectNote: (note: NoteObject) => void;
  onOpenQuickCapture: () => void;
  onUpdateNote: (updated: NoteObject) => void;
}

export const IdeasView: React.FC<IdeasViewProps> = ({
  notes,
  projects,
  onSelectNote,
  onOpenQuickCapture,
  onUpdateNote,
}) => {
  const [selectedIdea, setSelectedIdea] = useState<NoteObject | null>(null);
  const [isExpanding, setIsExpanding] = useState(false);
  const [expandedOutput, setExpandedOutput] = useState<string | null>(null);

  // Filter notes that are of type 'idea' or tagged with idea/spark
  const ideaNotes = notes.filter(
    (n) =>
      n.type === 'idea' ||
      n.tags?.some((t) => ['idea', 'spark', 'concept', 'innovation'].includes(t.toLowerCase()))
  );

  const handleExpandIdeaWithAI = async (idea: NoteObject) => {
    setIsExpanding(true);
    setExpandedOutput(null);
    try {
      const prompt = `You are the ROCN Knowledge & Systems Architect. Expand this idea spark into an actionable exploration outline:
Idea Title: ${idea.title}
Raw Context: ${idea.content}

Provide:
1. Core Value Proposition & Novelty
2. Technical & Architectural Feasibility (How to build it locally/minimally)
3. 3 Unanswered Questions to validate next
4. Immediate First Step Prototype`;

      const response = await aiService.queryKnowledgeBase(prompt, [idea]);
      setExpandedOutput(response.answer);
    } finally {
      setIsExpanding(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#0b0c10]">
      {/* Top Header */}
      <div className="p-6 pb-4 border-b border-[#1c212c] bg-[#0d0f14]/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-white font-display">IDEAS & SPARKS</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#1e1b14] text-amber-400 border border-[#3d3319] font-mono-code">
              {ideaNotes.length} Concept{ideaNotes.length === 1 ? '' : 's'}
            </span>
          </div>
          <p className="text-xs text-[#717c91] font-mono-code mt-0.5">
            Idea incubator: Capture sudden realizations, explore architecture, and refine concepts
          </p>
        </div>

        <button
          onClick={onOpenQuickCapture}
          className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Spark</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="p-6 max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ideas Grid */}
        <div className="lg:col-span-2 space-y-4">
          {ideaNotes.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-[#1f2533] rounded-2xl bg-[#0d0f14]/50 space-y-3">
              <Lightbulb className="w-8 h-8 text-amber-500/50 mx-auto" />
              <h4 className="text-sm font-semibold text-white">No ideas logged yet</h4>
              <p className="text-xs text-[#64748b] max-w-sm mx-auto">
                Whenever a creative or technical spark strikes, capture it right away.
              </p>
              <button
                onClick={onOpenQuickCapture}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow-md active:scale-95 transition-all inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Capture Spark</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ideaNotes.map((idea) => {
                const proj = projects.find((p) => p.id === idea.project);
                const isSelected = selectedIdea?.id === idea.id;

                return (
                  <div
                    key={idea.id}
                    onClick={() => setSelectedIdea(idea)}
                    className={`p-5 rounded-xl border transition-all cursor-pointer shadow-sm space-y-3 flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#181a24] border-amber-500/80 ring-1 ring-amber-500/40'
                        : 'bg-[#12141a] hover:bg-[#161a22] border-[#1e2330] hover:border-[#333d52]'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="p-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            <Lightbulb className="w-3.5 h-3.5" />
                          </span>
                          {proj && (
                            <span className="text-[11px] text-[#94a3b8] font-mono-code">{proj.name}</span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#64748b] font-mono-code">
                          {new Date(idea.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm text-white font-display leading-tight">{idea.title}</h3>
                      <p className="text-xs text-[#94a3b8] line-clamp-3 font-mono-code leading-relaxed">
                        {idea.content}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#1b202c] flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {idea.tags?.slice(0, 2).map((t) => (
                          <span key={t} className="text-[10px] text-amber-400/80 font-mono-code">
                            #{t}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectNote(idea);
                        }}
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-mono-code"
                      >
                        <span>Open</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Idea Incubator & AI Expansion Studio */}
        <div className="bg-[#11131a] border border-[#1e2330] rounded-xl p-5 space-y-4">
          {selectedIdea ? (
            <div className="space-y-4">
              <div className="border-b border-[#1d2331] pb-3 space-y-1">
                <div className="flex items-center gap-1.5 text-amber-400 font-mono-code text-[11px] uppercase">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Idea Incubator</span>
                </div>
                <h3 className="font-bold text-base text-white font-display">{selectedIdea.title}</h3>
              </div>

              <div className="text-xs text-[#cbd5e1] font-mono-code bg-[#0b0c10] p-3 rounded-lg border border-[#1a1f2c] leading-relaxed max-h-48 overflow-y-auto">
                {selectedIdea.content}
              </div>

              {/* AI Expansion Action */}
              <button
                onClick={() => handleExpandIdeaWithAI(selectedIdea)}
                disabled={isExpanding}
                className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-amber-500/20 to-indigo-500/20 hover:from-amber-500/30 hover:to-indigo-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Wand2 className="w-4 h-4" />
                <span>{isExpanding ? 'Architecting...' : 'AI Expand Architecture & Steps'}</span>
              </button>

              {/* Expansion Result Box */}
              {expandedOutput && (
                <div className="p-3.5 rounded-lg bg-[#0e1017] border border-[#232938] space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 text-blue-400 font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Feasibility & Architecture</span>
                  </div>
                  <div className="text-[#cbd5e1] whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto font-mono-code">
                    {expandedOutput}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-[#64748b] space-y-2">
              <Sparkles className="w-8 h-8 text-amber-500/30 mx-auto" />
              <p>Select an idea to trigger the AI Incubator and generate full technical breakdowns.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
