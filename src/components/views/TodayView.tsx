import React, { useState } from 'react';
import {
  Clock,
  Sparkles,
  Plus,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  FileText,
  Lightbulb,
  CheckSquare,
  Image as ImageIcon,
  Mic,
  Code,
  PenTool,
  Check,
  Play,
  RotateCcw,
  Layers,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { NoteObject, NoteType, Project, DailyRecapData } from '../../types';
import { aiService } from '../../services/aiService';
import { storage } from '../../services/storage';

interface TodayViewProps {
  notes: NoteObject[];
  projects: Project[];
  onOpenQuickCapture: () => void;
  onSelectNote: (note: NoteObject) => void;
  onToggleTask: (noteId: string, taskId: string) => void;
}

export const TodayView: React.FC<TodayViewProps> = ({
  notes,
  projects,
  onOpenQuickCapture,
  onSelectNote,
  onToggleTask,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [filterType, setFilterType] = useState<string>('all');
  const [isGeneratingRecap, setIsGeneratingRecap] = useState(false);
  const [dailyRecap, setDailyRecap] = useState<DailyRecapData | null>(null);

  // Filter notes belonging to selectedDate
  const dayNotes = notes
    .filter((n) => {
      const noteDay = n.createdAt.split('T')[0];
      const matchesDay = noteDay === selectedDate;
      const matchesType = filterType === 'all' || n.type === filterType;
      return matchesDay && matchesType;
    })
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const handleGenerateRecap = async () => {
    setIsGeneratingRecap(true);
    try {
      const recap = await aiService.generateDailyRecap(dayNotes, selectedDate);
      setDailyRecap(recap);
      await storage.saveRecap(recap);
    } finally {
      setIsGeneratingRecap(false);
    }
  };

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
    setDailyRecap(null);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
    setDailyRecap(null);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setDailyRecap(null);
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  const getTypeIcon = (type: NoteType) => {
    switch (type) {
      case 'idea':
        return Lightbulb;
      case 'thought':
        return Sparkles;
      case 'photo':
      case 'screenshot':
        return ImageIcon;
      case 'voice':
        return Mic;
      case 'code':
        return Code;
      case 'task':
        return CheckSquare;
      case 'drawing':
        return PenTool;
      default:
        return FileText;
    }
  };

  const getTypeBadgeColor = (type: NoteType) => {
    switch (type) {
      case 'idea':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'thought':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      case 'photo':
      case 'screenshot':
        return 'text-sky-400 bg-sky-500/10 border-sky-500/30';
      case 'voice':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'code':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'task':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'drawing':
        return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30';
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#0b0c10]">
      {/* Top Banner & Date Selector */}
      <div className="p-6 pb-4 border-b border-[#1c212c] bg-[#0d0f14]/80 backdrop-blur-md sticky top-0 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-white font-display">
              {isToday ? 'TODAY' : new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#181d28] text-blue-400 border border-[#2b354a] font-mono-code">
              {dayNotes.length} item{dayNotes.length === 1 ? '' : 's'}
            </span>
          </div>
          <p className="text-xs text-[#717c91] font-mono-code mt-0.5">
            Chronological stream of your thoughts and captured objects
          </p>
        </div>

        {/* Date Controls & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Day Navigator */}
          <div className="flex items-center bg-[#13161f] border border-[#202736] rounded-lg p-1 text-xs">
            <button
              onClick={handlePrevDay}
              className="p-1 rounded hover:bg-[#1f2533] text-[#94a3b8] hover:text-white"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className={`px-2 py-0.5 rounded text-xs font-mono-code font-semibold ${
                isToday ? 'text-blue-400 bg-blue-500/10' : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              {isToday ? 'TODAY' : selectedDate}
            </button>
            <button
              onClick={handleNextDay}
              className="p-1 rounded hover:bg-[#1f2533] text-[#94a3b8] hover:text-white"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Date Switcher for testing/demo (September 22 shortcut) */}
          <button
            onClick={() => setSelectedDate('2026-09-22')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono-code border transition-colors ${
              selectedDate === '2026-09-22'
                ? 'bg-blue-600/30 text-blue-300 border-blue-500/60 font-semibold'
                : 'bg-[#13161f] text-[#8590a6] border-[#202736] hover:text-white'
            }`}
            title="View September 22 activity logs"
          >
            Sep 22 Log
          </button>

          {/* My Day Recap Generator */}
          <button
            onClick={handleGenerateRecap}
            disabled={isGeneratingRecap || dayNotes.length === 0}
            className="px-3 py-1.5 rounded-lg bg-[#161d2b] hover:bg-[#202c42] text-blue-400 border border-[#2e3b52] text-xs font-medium flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-40"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>{isGeneratingRecap ? 'Synthesizing...' : 'My Day Recap'}</span>
          </button>

          {/* + New Capture */}
          <button
            onClick={onOpenQuickCapture}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Capture</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 max-w-4xl w-full mx-auto space-y-6">
        {/* Daily Recap Intelligence Box if generated */}
        {dailyRecap && (
          <div className="p-5 rounded-xl bg-gradient-to-br from-[#121622] to-[#0c0e14] border border-[#273347] shadow-xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between border-b border-[#1f2838] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
                <h3 className="font-bold text-sm text-white font-display tracking-tight">
                  {dailyRecap.headline}
                </h3>
              </div>
              <span className="text-[10px] font-mono-code text-[#64748b]">
                {dailyRecap.targetDate}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#0a0c10] border border-[#1b2230]">
                <div className="text-[10px] font-mono-code text-[#64748b] uppercase">Captured Objects</div>
                <div className="text-xl font-bold text-white font-mono-code mt-1">{dailyRecap.totalCaptured}</div>
                <div className="text-[11px] text-[#94a3b8] mt-0.5">Top: {dailyRecap.mostRepeatedTopic}</div>
              </div>

              <div className="p-3 rounded-lg bg-[#0a0c10] border border-[#1b2230]">
                <div className="text-[10px] font-mono-code text-[#64748b] uppercase">Tasks Progress</div>
                <div className="text-xl font-bold text-emerald-400 font-mono-code mt-1">
                  {dailyRecap.tasksSummary.completed} / {dailyRecap.tasksSummary.created + dailyRecap.tasksSummary.completed}
                </div>
                <div className="text-[11px] text-[#94a3b8] mt-0.5">Completed today</div>
              </div>

              <div className="p-3 rounded-lg bg-[#0a0c10] border border-[#1b2230]">
                <div className="text-[10px] font-mono-code text-[#64748b] uppercase">Key Ideas</div>
                <div className="text-xl font-bold text-amber-400 font-mono-code mt-1">{dailyRecap.ideasHad.length}</div>
                <div className="text-[11px] text-[#94a3b8] mt-0.5 truncate">{dailyRecap.ideasHad[0] || 'None logged'}</div>
              </div>
            </div>

            {dailyRecap.dailyReflection && (
              <div className="p-3 rounded-lg bg-[#0d1017] border border-[#1e2535] text-xs text-[#cbd5e1] leading-relaxed italic">
                “{dailyRecap.dailyReflection}”
              </div>
            )}
          </div>
        )}

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pb-2">
          {['all', 'note', 'idea', 'thought', 'task', 'voice', 'code', 'photo', 'drawing'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono-code transition-colors ${
                filterType === type
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 font-semibold'
                  : 'bg-[#12151d] text-[#717c91] border border-[#1d232f] hover:text-[#e2e8f0]'
              }`}
            >
              {type.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Timeline Stream */}
        {dayNotes.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-[#1f2533] rounded-2xl bg-[#0d0f14]/50 space-y-3">
            <Clock className="w-8 h-8 text-[#475569] mx-auto" />
            <h4 className="text-sm font-semibold text-white">No items captured for this day</h4>
            <p className="text-xs text-[#64748b] max-w-sm mx-auto">
              Start writing, paste a screenshot, record audio, or sketch an idea to populate your timeline.
            </p>
            <button
              onClick={onOpenQuickCapture}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md active:scale-95 transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Capture Thought</span>
            </button>
          </div>
        ) : (
          <div className="relative pl-6 border-l border-[#1f2636] space-y-6">
            {dayNotes.map((note) => {
              const Icon = getTypeIcon(note.type);
              const badgeStyle = getTypeBadgeColor(note.type);
              const timeStr = new Date(note.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });
              const proj = projects.find((p) => p.id === note.project);

              return (
                <div key={note.id} className="relative group">
                  {/* Timeline node dot */}
                  <div className="absolute -left-[31px] top-4 w-3.5 h-3.5 rounded-full bg-[#161a24] border-2 border-blue-500 group-hover:scale-125 transition-transform" />

                  {/* Card Container */}
                  <div
                    onClick={() => onSelectNote(note)}
                    className="p-4 rounded-xl bg-[#12141a] hover:bg-[#161a22] border border-[#1e2330] hover:border-[#313c52] transition-all cursor-pointer shadow-sm space-y-3"
                  >
                    {/* Header: Time, Type, Project */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-mono-code font-bold text-white">{timeStr}</span>
                        <span
                          className={`text-[10px] font-mono-code uppercase px-2 py-0.5 rounded border flex items-center gap-1 ${badgeStyle}`}
                        >
                          <Icon className="w-3 h-3" />
                          <span>{note.type}</span>
                        </span>
                        {proj && (
                          <span className="text-[11px] text-[#94a3b8] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: proj.color }} />
                            <span>{proj.name}</span>
                          </span>
                        )}
                      </div>

                      <ArrowRight className="w-3.5 h-3.5 text-[#475569] group-hover:text-blue-400 transition-colors" />
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-sm text-white tracking-tight font-display">
                      {note.title}
                    </h3>

                    {/* Content Snippet */}
                    <p className="text-xs text-[#9ca3af] leading-relaxed line-clamp-3 font-mono-code">
                      {note.content}
                    </p>

                    {/* Media thumbnail if exists */}
                    {note.mediaUrl && (
                      <div className="rounded-lg overflow-hidden border border-[#232938] max-w-sm max-h-48 bg-[#0a0c10]">
                        <img src={note.mediaUrl} alt={note.title} className="w-full h-full object-cover" />
                      </div>
                    )}

                    {/* Tasks summary */}
                    {note.tasks && note.tasks.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {note.tasks.slice(0, 3).map((t) => (
                          <div
                            key={t.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleTask(note.id, t.id);
                            }}
                            className="flex items-center gap-2 text-xs text-[#cbd5e1] hover:text-white"
                          >
                            <div
                              className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                                t.completed ? 'bg-blue-600 border-blue-500 text-white' : 'border-[#475569]'
                              }`}
                            >
                              {t.completed && <Check className="w-2.5 h-2.5" />}
                            </div>
                            <span className={t.completed ? 'line-through text-[#64748b]' : ''}>
                              {t.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tags */}
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 pt-1">
                        {note.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] font-mono-code text-[#64748b] bg-[#0c0e14] px-1.5 py-0.5 rounded border border-[#1b202c]"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
