import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  CheckSquare,
  Tag,
  Folder,
  Calendar,
  Share2,
  Trash2,
  Pin,
  Star,
  Download,
  Bold,
  Italic,
  Code,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Link,
  Check,
  RotateCcw,
  Maximize2,
  Minimize2,
  Wand2,
  FileDown,
  Layers,
  ArrowUpRight,
  Eye,
  Edit3,
  Play,
  Pause,
  Clock,
  Mic,
  PenTool,
  Lock,
  BookOpen,
} from 'lucide-react';
import { NoteObject, Project, TaskItem } from '../types';
import { aiService, SummarizeResult, CleanupResult, ExtractResult, ConnectResult } from '../services/aiService';
import { ReadingModeModal } from './ReadingModeModal';

interface NoteEditorProps {
  note: NoteObject | null;
  allNotes: NoteObject[];
  projects: Project[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateNote: (updated: NoteObject) => void;
  onDeleteNote: (id: string) => void;
  onSelectNoteById: (id: string) => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  allNotes,
  projects,
  isOpen,
  onClose,
  onUpdateNote,
  onDeleteNote,
  onSelectNoteById,
}) => {
  if (!isOpen || !note) return null;

  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [tags, setTags] = useState<string[]>(note.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [project, setProject] = useState(note.project || '');
  const [isStarred, setIsStarred] = useState(!!note.isStarred);
  const [pinned, setPinned] = useState(!!note.pinned);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isReadingModeOpen, setIsReadingModeOpen] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState('Saved locally');

  // AI Operation States
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [aiSummary, setAiSummary] = useState<SummarizeResult | null>(
    note.summary ? { summary: note.summary, keyTakeaways: note.keyTakeaways || [], suggestedTags: [] } : null
  );
  const [extractedData, setExtractedData] = useState<ExtractResult | null>(null);
  const [relatedSuggestions, setRelatedSuggestions] = useState<ConnectResult | null>(null);

  // Audio Playback
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    setTags(note.tags || []);
    setProject(note.project || '');
    setIsStarred(!!note.isStarred);
    setPinned(!!note.pinned);
    setAiSummary(
      note.summary ? { summary: note.summary, keyTakeaways: note.keyTakeaways || [], suggestedTags: [] } : null
    );
    setExtractedData(null);
    setRelatedSuggestions(null);
  }, [note.id]);

  // Continuous Debounced Autosave
  const triggerAutosave = (newTitle: string, newContent: string, newTags: string[], newProj: string) => {
    setAutosaveStatus('Saving...');
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = window.setTimeout(() => {
      const updated: NoteObject = {
        ...note,
        title: newTitle.trim() || 'Untitled Note',
        content: newContent,
        tags: newTags,
        project: newProj || undefined,
        isStarred,
        pinned,
        summary: aiSummary?.summary,
        keyTakeaways: aiSummary?.keyTakeaways,
        updatedAt: new Date().toISOString(),
      };
      onUpdateNote(updated);
      setAutosaveStatus('Saved locally');
    }, 450);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    triggerAutosave(val, content, tags, project);
  };

  const handleContentChange = (val: string) => {
    setContent(val);
    triggerAutosave(title, val, tags, project);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().replace(/^#/, '');
      if (val && !tags.includes(val)) {
        const next = [...tags, val];
        setTags(next);
        setTagInput('');
        triggerAutosave(title, content, next, project);
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const next = tags.filter((t) => t !== tagToRemove);
    setTags(next);
    triggerAutosave(title, content, next, project);
  };

  const handleProjectChange = (newProj: string) => {
    setProject(newProj);
    triggerAutosave(title, content, tags, newProj);
  };

  const handleToggleStar = () => {
    const next = !isStarred;
    setIsStarred(next);
    onUpdateNote({ ...note, isStarred: next, updatedAt: new Date().toISOString() });
  };

  const handleTogglePin = () => {
    const next = !pinned;
    setPinned(next);
    onUpdateNote({ ...note, pinned: next, updatedAt: new Date().toISOString() });
  };

  // Formatting helpers
  const insertFormatting = (prefix: string, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    const before = content.substring(0, start);
    const after = content.substring(end);

    const replacement = `${prefix}${selected || 'text'}${suffix}`;
    const newContent = `${before}${replacement}${after}`;
    handleContentChange(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 10);
  };

  // AI Operations
  const handleAISummarize = async () => {
    setIsSummarizing(true);
    try {
      const res = await aiService.summarizeNote({ ...note, title, content, tags });
      setAiSummary(res);
      if (res.suggestedTags?.length) {
        const merged = Array.from(new Set([...tags, ...res.suggestedTags]));
        setTags(merged);
        triggerAutosave(title, content, merged, project);
      }
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleAICleanup = async () => {
    setIsCleaning(true);
    try {
      const res = await aiService.cleanUpNote({ title, content });
      setTitle(res.title);
      setContent(res.cleanedContent);
      if (res.tags?.length) {
        const merged = Array.from(new Set([...tags, ...res.tags]));
        setTags(merged);
        triggerAutosave(res.title, res.cleanedContent, merged, project);
      } else {
        triggerAutosave(res.title, res.cleanedContent, tags, project);
      }
    } finally {
      setIsCleaning(false);
    }
  };

  const handleAIExtract = async () => {
    setIsExtracting(true);
    try {
      const res = await aiService.extractEntities({ title, content });
      setExtractedData(res);
      // If tasks extracted, add them to note tasks
      if (res.tasks?.length) {
        const newTasks: TaskItem[] = res.tasks.map((t, idx) => ({
          id: `task_${Date.now()}_${idx}`,
          text: t.text,
          completed: false,
          due: t.due || null,
          priority: t.priority || 'normal',
        }));
        const existing = note.tasks || [];
        const merged = [...existing, ...newTasks];
        onUpdateNote({ ...note, tasks: merged, updatedAt: new Date().toISOString() });
      }
    } finally {
      setIsExtracting(false);
    }
  };

  const handleAIConnect = async () => {
    setIsConnecting(true);
    try {
      const res = await aiService.findConnections({ ...note, title, content, tags, project }, allNotes);
      setRelatedSuggestions(res);
    } finally {
      setIsConnecting(false);
    }
  };

  // Export single note
  const exportNote = (format: 'md' | 'txt' | 'json') => {
    let output = '';
    let mime = 'text/plain';
    let filename = `${title.replace(/\s+/g, '_')}.${format}`;

    if (format === 'json') {
      output = JSON.stringify(note, null, 2);
      mime = 'application/json';
    } else if (format === 'md') {
      output = `# ${title}\n\nDate: ${new Date(note.createdAt).toLocaleString()}\nTags: ${tags.join(', ')}\nProject: ${project}\n\n${content}`;
      mime = 'text/markdown';
    } else {
      output = `${title}\n\nDate: ${new Date(note.createdAt).toLocaleString()}\n\n${content}`;
    }

    const blob = new Blob([output], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleTaskCompleted = (taskId: string) => {
    const updatedTasks = (note.tasks || []).map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    onUpdateNote({ ...note, tasks: updatedTasks, updatedAt: new Date().toISOString() });
  };

  return (
    <div
      className={`fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center transition-all ${
        isFullScreen ? 'p-0' : 'p-3 sm:p-6'
      }`}
    >
      <div
        className={`bg-[#0f1117] border border-[#232938] rounded-xl overflow-hidden shadow-2xl flex flex-col transition-all ${
          isFullScreen ? 'w-full h-full rounded-none' : 'w-full max-w-5xl h-[92vh]'
        }`}
      >
        {/* Top Header Controls */}
        <div className="px-4 py-2.5 bg-[#0b0c10] border-b border-[#1d222e] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1 rounded text-[#94a3b8] hover:text-white hover:bg-[#1a1e28] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-[#232938]" />

            {/* Note Type Badge */}
            <span className="text-[11px] font-mono-code uppercase px-2 py-0.5 rounded bg-[#181d28] text-blue-400 border border-[#293245]">
              {note.type}
            </span>

            {/* Autosave badge */}
            <div className="flex items-center gap-1.5 text-[10px] font-mono-code text-[#64748b]">
              <Lock className="w-2.5 h-2.5 text-emerald-400" />
              <span>{autosaveStatus}</span>
            </div>
          </div>

          {/* Quick Actions & AI Toolbar */}
          <div className="flex items-center gap-1.5">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#151922] p-0.5 rounded border border-[#252c3d]">
              <button
                onClick={() => setViewMode('edit')}
                className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 ${
                  viewMode === 'edit' ? 'bg-blue-600 text-white shadow-xs' : 'text-[#8b98b0] hover:text-white'
                }`}
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 ${
                  viewMode === 'preview' ? 'bg-blue-600 text-white shadow-xs' : 'text-[#8b98b0] hover:text-white'
                }`}
              >
                <Eye className="w-3 h-3" />
                <span>Preview</span>
              </button>
            </div>

            <div className="h-4 w-px bg-[#232938] mx-1" />

            {/* AI Action Menu */}
            <button
              onClick={handleAISummarize}
              disabled={isSummarizing}
              className="px-2.5 py-1 rounded bg-[#161c28] hover:bg-[#20283a] text-xs text-blue-400 border border-[#2c374d] flex items-center gap-1 font-medium transition-colors disabled:opacity-50"
              title="Summarize Note"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">{isSummarizing ? 'Summarizing...' : 'Summarize'}</span>
            </button>

            <button
              onClick={handleAICleanup}
              disabled={isCleaning}
              className="px-2.5 py-1 rounded bg-[#161c28] hover:bg-[#20283a] text-xs text-indigo-400 border border-[#2c374d] flex items-center gap-1 font-medium transition-colors disabled:opacity-50"
              title="Clean up raw thoughts into structured Markdown"
            >
              <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">{isCleaning ? 'Cleaning...' : 'Clean Up'}</span>
            </button>

            <button
              onClick={handleAIExtract}
              disabled={isExtracting}
              className="px-2.5 py-1 rounded bg-[#161c28] hover:bg-[#20283a] text-xs text-emerald-400 border border-[#2c374d] flex items-center gap-1 font-medium transition-colors disabled:opacity-50"
              title="Extract tasks, people, and dates"
            >
              <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">{isExtracting ? 'Extracting...' : 'Extract'}</span>
            </button>

            <button
              onClick={handleAIConnect}
              disabled={isConnecting}
              className="px-2.5 py-1 rounded bg-[#161c28] hover:bg-[#20283a] text-xs text-amber-400 border border-[#2c374d] flex items-center gap-1 font-medium transition-colors disabled:opacity-50"
              title="Find related notes in vault"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">{isConnecting ? 'Linking...' : 'Connect'}</span>
            </button>

            <div className="h-4 w-px bg-[#232938] mx-1" />

            {/* Star & Pin */}
            <button
              onClick={handleToggleStar}
              className={`p-1.5 rounded transition-colors ${
                isStarred ? 'text-amber-400 bg-amber-500/10' : 'text-[#64748b] hover:text-white'
              }`}
              title="Star Note"
            >
              <Star className="w-4 h-4 fill-current" />
            </button>

            <button
              onClick={handleTogglePin}
              className={`p-1.5 rounded transition-colors ${
                pinned ? 'text-blue-400 bg-blue-500/10' : 'text-[#64748b] hover:text-white'
              }`}
              title="Pin Note"
            >
              <Pin className="w-4 h-4" />
            </button>

            {/* Distraction-Free Reading Mode */}
            <button
              onClick={() => setIsReadingModeOpen(true)}
              className="p-1.5 rounded text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10 transition-colors"
              title="Distraction-Free Reading Mode"
            >
              <BookOpen className="w-4 h-4" />
            </button>

            {/* Export Dropdown */}
            <div className="relative group">
              <button className="p-1.5 rounded text-[#64748b] hover:text-white hover:bg-[#1a1e28]">
                <FileDown className="w-4 h-4" />
              </button>
              <div className="absolute right-0 top-full mt-1 hidden group-hover:flex flex-col bg-[#141822] border border-[#262f42] rounded-lg shadow-xl py-1 z-50 min-w-[130px] text-xs">
                <button
                  onClick={() => exportNote('md')}
                  className="px-3 py-1.5 text-left text-[#cbd5e1] hover:bg-[#202838]"
                >
                  Export Markdown
                </button>
                <button
                  onClick={() => exportNote('txt')}
                  className="px-3 py-1.5 text-left text-[#cbd5e1] hover:bg-[#202838]"
                >
                  Export Plain Text
                </button>
                <button
                  onClick={() => exportNote('json')}
                  className="px-3 py-1.5 text-left text-[#cbd5e1] hover:bg-[#202838]"
                >
                  Export JSON Object
                </button>
              </div>
            </div>

            {/* Delete */}
            <button
              onClick={() => {
                if (confirm('Delete this note permanently from your local vault?')) {
                  onDeleteNote(note.id);
                  onClose();
                }
              }}
              className="p-1.5 rounded text-[#64748b] hover:text-rose-400 hover:bg-rose-500/10"
              title="Delete Note"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-1.5 rounded text-[#64748b] hover:text-white"
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Markdown Toolbar (visible in Edit mode) */}
        {viewMode === 'edit' && (
          <div className="px-4 py-1.5 bg-[#0e1015] border-b border-[#1c212c] flex flex-wrap items-center gap-1 text-xs text-[#8590a6]">
            <button
              onClick={() => insertFormatting('**', '**')}
              className="p-1 rounded hover:bg-[#1a1f2c] hover:text-white"
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => insertFormatting('*', '*')}
              className="p-1 rounded hover:bg-[#1a1f2c] hover:text-white"
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => insertFormatting('# ')}
              className="p-1 rounded hover:bg-[#1a1f2c] hover:text-white"
              title="Heading 1"
            >
              <Heading1 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => insertFormatting('## ')}
              className="p-1 rounded hover:bg-[#1a1f2c] hover:text-white"
              title="Heading 2"
            >
              <Heading2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => insertFormatting('- ')}
              className="p-1 rounded hover:bg-[#1a1f2c] hover:text-white"
              title="Bullet List"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => insertFormatting('1. ')}
              className="p-1 rounded hover:bg-[#1a1f2c] hover:text-white"
              title="Numbered List"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => insertFormatting('- [ ] ')}
              className="p-1 rounded hover:bg-[#1a1f2c] hover:text-white"
              title="Checklist Item"
            >
              <CheckSquare className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => insertFormatting('> ')}
              className="p-1 rounded hover:bg-[#1a1f2c] hover:text-white"
              title="Quote"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => insertFormatting('```\n', '\n```')}
              className="p-1 rounded hover:bg-[#1a1f2c] hover:text-white"
              title="Code Block"
            >
              <Code className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => insertFormatting('[', '](url)')}
              className="p-1 rounded hover:bg-[#1a1f2c] hover:text-white"
              title="Link"
            >
              <Link className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Metadata Strip: Project, Tags, Date */}
        <div className="px-6 py-3 bg-[#0c0e14] border-b border-[#1a1f2b] flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Project & Tags */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Project Picker */}
            <div className="flex items-center gap-1.5 bg-[#141822] px-2.5 py-1 rounded-md border border-[#232b3b]">
              <Folder className="w-3 h-3 text-blue-400" />
              <select
                value={project}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="bg-transparent text-[#cbd5e1] text-xs focus:outline-none"
              >
                <option value="" className="bg-[#12141a] text-gray-400">No Project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#12141a] text-white">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags Pills */}
            <div className="flex flex-wrap items-center gap-1">
              {tags.map((t) => (
                <span
                  key={t}
                  className="bg-[#161c28] text-blue-300 text-[11px] font-mono-code px-2 py-0.5 rounded border border-[#273347] flex items-center gap-1"
                >
                  #{t}
                  <button onClick={() => handleRemoveTag(t)} className="hover:text-white">
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                placeholder="+ tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="bg-transparent text-[11px] text-[#cbd5e1] placeholder:text-[#4b5563] focus:outline-none w-16 px-1"
              />
            </div>
          </div>

          {/* Timestamp */}
          <div className="flex items-center gap-2 text-[#64748b] font-mono-code text-[11px]">
            <Calendar className="w-3 h-3" />
            <span>Captured: {new Date(note.createdAt).toLocaleString()}</span>
          </div>
        </div>

        {/* Editor Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Document Area */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
            {/* Title Input */}
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Untitled Document"
              className="w-full bg-transparent text-2xl sm:text-3xl font-bold tracking-tight text-white focus:outline-none placeholder:text-[#374151] font-display"
            />

            {/* Voice Audio Player if Voice Note */}
            {note.type === 'voice' && (
              <div className="p-4 rounded-xl bg-[#121620] border border-[#263145] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-blue-400" />
                    <span className="font-semibold text-xs text-white">Voice Recording</span>
                    {note.audioDuration && (
                      <span className="text-[11px] font-mono-code text-[#64748b]">
                        ({note.audioDuration}s)
                      </span>
                    )}
                  </div>
                  {note.mediaUrl && (
                    <audio ref={audioRef} src={note.mediaUrl} controls className="h-8 max-w-[240px]" />
                  )}
                </div>
                {note.audioTranscript && (
                  <div className="text-xs text-[#cbd5e1] italic bg-[#0a0c10] p-2.5 rounded border border-[#1e2535]">
                    “{note.audioTranscript}”
                  </div>
                )}
              </div>
            )}

            {/* Attached Media / Drawing Preview */}
            {note.mediaUrl && note.type !== 'voice' && (
              <div className="rounded-xl overflow-hidden border border-[#232938] bg-[#0c0e14] max-w-2xl">
                <img
                  src={note.mediaUrl}
                  alt={note.title}
                  className="w-full max-h-[420px] object-contain bg-[#101218]"
                />
              </div>
            )}

            {/* Tasks / Checklists in Note */}
            {note.tasks && note.tasks.length > 0 && (
              <div className="p-4 rounded-xl bg-[#11141c] border border-[#222938] space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold text-white">
                  <div className="flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-blue-400" />
                    <span>Action Tasks ({note.tasks.filter((t) => t.completed).length}/{note.tasks.length})</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {note.tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => toggleTaskCompleted(task.id)}
                      className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors ${
                        task.completed
                          ? 'bg-[#151922]/50 border-[#1f2533] text-[#64748b] line-through'
                          : 'bg-[#151924] border-[#293245] text-[#e2e8f0] hover:border-blue-500/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 text-xs">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border ${
                            task.completed ? 'bg-blue-600 border-blue-500 text-white' : 'border-[#475569]'
                          }`}
                        >
                          {task.completed && <Check className="w-3 h-3" />}
                        </div>
                        <span>{task.text}</span>
                      </div>

                      {task.priority === 'high' && (
                        <span className="text-[10px] text-rose-400 font-mono-code px-1.5 py-0.5 rounded bg-rose-500/10">
                          HIGH
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Editor Canvas or Live Markdown Preview */}
            {viewMode === 'edit' ? (
              <div className="editor-canvas min-h-[300px]">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Start capturing your thoughts, notes, code, or knowledge objects..."
                  className="w-full bg-transparent text-sm text-[#e2e8f0] focus:outline-none resize-none leading-relaxed min-h-[380px] font-mono-code"
                />
              </div>
            ) : (
              <div className="prose prose-invert max-w-none text-sm text-[#cbd5e1] leading-relaxed space-y-4 whitespace-pre-wrap font-sans">
                {content || <span className="text-[#64748b] italic">Empty document.</span>}
              </div>
            )}
          </div>

          {/* AI Insights & Relationships Sidebar Panel */}
          {(aiSummary || extractedData || relatedSuggestions) && (
            <div className="w-80 border-l border-[#1d222e] bg-[#0c0e14] p-4 overflow-y-auto space-y-5 hidden md:block text-xs">
              {/* Executive Summary Card */}
              {aiSummary && (
                <div className="p-3.5 rounded-lg bg-[#141822] border border-[#273245] space-y-2">
                  <div className="flex items-center gap-1.5 text-blue-400 font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Executive Summary</span>
                  </div>
                  <p className="text-[#cbd5e1] leading-relaxed">{aiSummary.summary}</p>
                  {aiSummary.keyTakeaways?.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <div className="text-[10px] uppercase font-mono-code text-[#64748b]">Key Takeaways</div>
                      <ul className="list-disc list-inside text-[#94a3b8] space-y-0.5">
                        {aiSummary.keyTakeaways.map((t, idx) => (
                          <li key={idx}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Extracted Entities */}
              {extractedData && (
                <div className="p-3.5 rounded-lg bg-[#141822] border border-[#273245] space-y-2.5">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Extracted Metadata</span>
                  </div>

                  {extractedData.people?.length > 0 && (
                    <div>
                      <span className="text-[10px] font-mono-code text-[#64748b]">PEOPLE:</span>
                      <div className="text-[#cbd5e1]">{extractedData.people.join(', ')}</div>
                    </div>
                  )}

                  {extractedData.projects?.length > 0 && (
                    <div>
                      <span className="text-[10px] font-mono-code text-[#64748b]">PROJECTS:</span>
                      <div className="text-[#cbd5e1]">{extractedData.projects.join(', ')}</div>
                    </div>
                  )}

                  {extractedData.facts?.length > 0 && (
                    <div>
                      <span className="text-[10px] font-mono-code text-[#64748b]">KEY SPECS:</span>
                      <ul className="list-disc list-inside text-[#94a3b8] space-y-0.5">
                        {extractedData.facts.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Suggested Connections */}
              {relatedSuggestions && (
                <div className="p-3.5 rounded-lg bg-[#141822] border border-[#273245] space-y-2.5">
                  <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Related Notes in Vault</span>
                  </div>

                  <div className="space-y-2">
                    {relatedSuggestions.relatedNotes.map((rel, idx) => {
                      const relNote = allNotes.find((n) => n.id === rel.noteId);
                      return (
                        <div
                          key={idx}
                          onClick={() => relNote && onSelectNoteById(relNote.id)}
                          className="p-2 rounded bg-[#0a0c10] border border-[#1f2535] hover:border-amber-500/50 cursor-pointer transition-colors space-y-1"
                        >
                          <div className="font-semibold text-[#e2e8f0] flex items-center justify-between">
                            <span>{relNote?.title || rel.noteId}</span>
                            <ArrowUpRight className="w-3 h-3 text-amber-400" />
                          </div>
                          <p className="text-[11px] text-[#94a3b8]">{rel.relationReason}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Distraction-Free Reading Mode Modal */}
      <ReadingModeModal
        isOpen={isReadingModeOpen}
        note={note}
        onClose={() => setIsReadingModeOpen(false)}
      />
    </div>
  );
};
