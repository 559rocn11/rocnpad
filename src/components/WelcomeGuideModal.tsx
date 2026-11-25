import React, { useState } from 'react';
import {
  X,
  Sparkles,
  BookOpen,
  Mic,
  Network,
  Lock,
  Zap,
  CheckCircle2,
  FolderKanban,
  FileText,
  UploadCloud,
  Layers,
  ArrowRight,
  ShieldCheck,
  Eye,
  Command,
} from 'lucide-react';

interface WelcomeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenQuickCapture?: () => void;
}

export const WelcomeGuideModal: React.FC<WelcomeGuideModalProps> = ({
  isOpen,
  onClose,
  onOpenQuickCapture,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'capture' | 'voice' | 'readwise' | 'graph' | 'privacy'>('overview');

  if (!isOpen) return null;

  const handleFinish = () => {
    localStorage.setItem('rocn_seen_welcome_guide', 'true');
    onClose();
  };

  const handleStartCapture = () => {
    handleFinish();
    if (onOpenQuickCapture) {
      onOpenQuickCapture();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-[#0f1219] border border-[#232a3b] rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1e2433] bg-[#0b0d13] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold font-mono-code shadow-md border border-blue-400/30">
              R
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-display">Welcome to ROCNpad</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono-code font-semibold">
                  Personal OS v1.2
                </span>
              </div>
              <p className="text-xs text-[#8e9bb0]">
                Your Sovereign, Offline-First Knowledge & Intelligence Operating System
              </p>
            </div>
          </div>

          <button
            onClick={handleFinish}
            className="p-1.5 rounded-lg text-[#64748b] hover:text-white hover:bg-[#1a1f2c] transition-colors"
            title="Close Guide"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#1c2230] bg-[#0c0e15] px-4 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'System Overview', icon: Sparkles },
            { id: 'capture', label: 'Multi-Modal Capture', icon: FileText },
            { id: 'voice', label: 'Voice & Tasks', icon: Mic },
            { id: 'readwise', label: 'Readwise & Ingest', icon: BookOpen },
            { id: 'graph', label: 'Knowledge Graph', icon: Network },
            { id: 'privacy', label: 'Privacy & Security', icon: Lock },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                    : 'border-transparent text-[#8a96a8] hover:text-white hover:bg-[#131720]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-[#cbd5e1] text-xs leading-relaxed">
          {activeTab === 'overview' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 via-indigo-950/20 to-transparent border border-blue-500/20">
                <h3 className="text-sm font-semibold text-white mb-1.5 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  What is ROCNpad and what does it do?
                </h3>
                <p className="text-[#9cb0cb] leading-relaxed">
                  ROCNpad is an unconstrained, high-velocity Personal Cognitive Workspace. It bridges raw
                  thought capture, long-term knowledge retention, project task planning, and AI synthesis
                  into a unified, 100% private vault stored directly on your machine.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-xl bg-[#12151e] border border-[#1f2637] space-y-1.5">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span>Instant Capture</span>
                  </div>
                  <p className="text-[#8e9bb0]">
                    Log atomic notes, thoughts, code snippets, canvas sketches, and voice notes without friction.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#12151e] border border-[#1f2637] space-y-1.5">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <Mic className="w-4 h-4 text-rose-400" />
                    <span>Voice Intelligence</span>
                  </div>
                  <p className="text-[#8e9bb0]">
                    Live speech transcription, Gemini action item extraction, and multilingual translation.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#12151e] border border-[#1f2637] space-y-1.5">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <BookOpen className="w-4 h-4 text-amber-400" />
                    <span>Readwise & Reading Mode</span>
                  </div>
                  <p className="text-[#8e9bb0]">
                    Sync books, articles, podcasts, and tweets with immersive distraction-free reading themes and auto-scroll.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#12151e] border border-[#1f2637] space-y-1.5">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <Network className="w-4 h-4 text-emerald-400" />
                    <span>Associative Graph</span>
                  </div>
                  <p className="text-[#8e9bb0]">
                    Interactive 2D/3D knowledge graph showing tag links, project clusters, and AI-discovered associations.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'capture' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                Multi-Modal Quick Capture Engine
              </h3>
              <p className="text-[#9cb0cb]">
                ROCNpad supports multiple capture formats designed for every type of insight:
              </p>

              <div className="space-y-2.5">
                <div className="p-3 rounded-lg bg-[#12151e] border border-[#1e2435] flex items-start gap-3">
                  <span className="font-mono-code px-2 py-0.5 rounded bg-[#192233] text-blue-300 font-semibold text-[10px] mt-0.5">
                    TEXT & MARKDOWN
                  </span>
                  <div>
                    <div className="font-semibold text-white">Full Markdown & Code Blocks</div>
                    <div className="text-[#8e9bb0]">
                      Headers, task checkboxes, code syntax highlighting, bold, italics, tables, and tags (`#topic`).
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#12151e] border border-[#1e2435] flex items-start gap-3">
                  <span className="font-mono-code px-2 py-0.5 rounded bg-[#192233] text-emerald-300 font-semibold text-[10px] mt-0.5">
                    CANVAS DRAW
                  </span>
                  <div>
                    <div className="font-semibold text-white">Interactive Visual Sketching</div>
                    <div className="text-[#8e9bb0]">
                      Draw wireframes, system diagrams, optical paths, and hand-drawn doodles directly into your vault.
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#12151e] border border-[#1e2435] flex items-start gap-3">
                  <span className="font-mono-code px-2 py-0.5 rounded bg-[#192233] text-purple-300 font-semibold text-[10px] mt-0.5">
                    PROJECT KANBAN
                  </span>
                  <div>
                    <div className="font-semibold text-white">Project Tagging & Checklists</div>
                    <div className="text-[#8e9bb0]">
                      Organize notes by project channel and manage atomic to-do tasks with priority flags.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'voice' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Mic className="w-4 h-4 text-rose-400" />
                Voice Memos, Auto-Task Extraction & Translation
              </h3>
              <p className="text-[#9cb0cb]">
                Record your stream-of-consciousness thoughts while walking or working. ROCNpad takes care of the rest:
              </p>

              <div className="space-y-3">
                <div className="p-3.5 rounded-lg bg-[#12151e] border border-[#1e2435] space-y-1">
                  <div className="font-semibold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Real-Time Speech-to-Text</span>
                  </div>
                  <p className="text-[#8e9bb0]">
                    Streams your words live into text and refines punctuation and technical vocabulary via Gemini.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-[#12151e] border border-[#1e2435] space-y-1">
                  <div className="font-semibold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Actionable Task Extraction</span>
                  </div>
                  <p className="text-[#8e9bb0]">
                    Gemini automatically scans the transcript for commitments (e.g. &quot;review camera specs by Friday&quot;)
                    and turns them into interactive tasks you can select with one tap.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-[#12151e] border border-[#1e2435] space-y-1">
                  <div className="font-semibold text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-400" />
                    <span>Multilingual Translation</span>
                  </div>
                  <p className="text-[#8e9bb0]">
                    Translate transcribed voice notes instantly into Spanish, French, German, Japanese, Chinese, and more.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'readwise' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                Readwise Sync & Distraction-Free Reading Mode
              </h3>
              <p className="text-[#9cb0cb]">
                Transform your saved reading highlights into connected, permanent knowledge:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-lg bg-[#12151e] border border-[#1e2435] space-y-1.5">
                  <div className="font-semibold text-amber-300">Readwise Integration</div>
                  <p className="text-[#8e9bb0]">
                    Connect your Readwise API key in Settings or click &quot;Readwise Sync&quot; to import books, articles,
                    podcasts, and tweets.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-[#12151e] border border-[#1e2435] space-y-1.5">
                  <div className="font-semibold text-blue-300">Distraction-Free Reading</div>
                  <p className="text-[#8e9bb0]">
                    Immerse yourself in notes with 5 custom color palettes (Obsidian, Nordic, Sepia, etc.), adjustable font
                    sizes, and auto-scroll.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'graph' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Network className="w-4 h-4 text-emerald-400" />
                Knowledge Graph & Associative Memory
              </h3>
              <p className="text-[#9cb0cb]">
                See how all your notes, projects, and ideas interconnect in real time:
              </p>

              <div className="p-4 rounded-lg bg-[#12151e] border border-[#1e2435] space-y-2">
                <div className="font-semibold text-white">Visual 2D & 3D Force-Directed Map</div>
                <p className="text-[#8e9bb0]">
                  Nodes represent notes and projects, while physics edges connect shared tags and bi-directional links (`[[Note Title]]`).
                  Click any node to zoom in, preview, or jump directly into the full editor.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                100% Private, Sovereign & Local-First
              </h3>
              <p className="text-[#9cb0cb]">
                ROCNpad is built with strict privacy and data ownership principles:
              </p>

              <div className="space-y-2.5">
                <div className="p-3 rounded-lg bg-[#12151e] border border-[#1e2435] flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-white">No Mandatory Accounts or Tracking</div>
                    <div className="text-[#8e9bb0]">Your notes never touch proprietary ad networks or tracking servers.</div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#12151e] border border-[#1e2435] flex items-center gap-3">
                  <Lock className="w-5 h-5 text-blue-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-white">Optional PIN Vault Lock</div>
                    <div className="text-[#8e9bb0]">Enable 4-digit PIN protection in Settings to secure your workspace.</div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#12151e] border border-[#1e2435] flex items-center gap-3">
                  <UploadCloud className="w-5 h-5 text-purple-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-white">Full JSON & Markdown Export</div>
                    <div className="text-[#8e9bb0]">One-click backup export anytime. Your knowledge is always yours to keep.</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#1e2433] bg-[#0b0d13] flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-[#64748b]">
            <Command className="w-3.5 h-3.5 text-[#94a3b8]" />
            <span>Shortcut: <kbd className="px-1.5 py-0.5 rounded bg-[#161c28] text-[#94a3b8] font-mono-code border border-[#222a3b]">⌘K</kbd> opens Command Palette</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleFinish}
              className="px-4 py-2 rounded-xl text-xs text-[#94a3b8] hover:text-white hover:bg-[#1a1f2c] font-medium transition-colors"
            >
              Skip Guide
            </button>
            <button
              onClick={handleStartCapture}
              className="px-5 py-2 rounded-xl text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold flex items-center gap-1.5 shadow-lg shadow-blue-900/40 transition-all active:scale-95"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
