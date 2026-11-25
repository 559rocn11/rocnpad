import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  FileText,
  Lightbulb,
  CheckSquare,
  Image as ImageIcon,
  Mic,
  Code,
  Link,
  Sparkles,
  PenTool,
  Upload,
  Send,
  Lock,
} from 'lucide-react';
import { NoteType, Project } from '../types';

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (noteData: {
    title: string;
    content: string;
    type: NoteType;
    tags: string[];
    project?: string;
    mediaUrl?: string;
    mediaMimeType?: string;
    codeLanguage?: string;
    tasks?: { id: string; text: string; completed: boolean; priority?: 'high' | 'normal' | 'low' }[];
  }) => void;
  projects: Project[];
  onOpenDrawingModal: () => void;
  onOpenVoiceModal: () => void;
}

export const QuickCaptureModal: React.FC<QuickCaptureModalProps> = ({
  isOpen,
  onClose,
  onSave,
  projects,
  onOpenDrawingModal,
  onOpenVoiceModal,
}) => {
  const [activeType, setActiveType] = useState<NoteType>('note');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [codeLanguage, setCodeLanguage] = useState('typescript');
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaMimeType, setMediaMimeType] = useState<string | undefined>(undefined);
  const [taskPriority, setTaskPriority] = useState<'normal' | 'high' | 'low'>('normal');

  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      resetForm();
    }
  }, [isOpen]);

  // Support paste from clipboard (e.g. screenshots!)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!isOpen) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              setMediaPreview(event.target?.result as string);
              setMediaMimeType(blob.type);
              setActiveType('screenshot');
              if (!title) setTitle(`Screenshot ${new Date().toLocaleTimeString()}`);
            };
            reader.readAsDataURL(blob);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, title]);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setTags([]);
    setTagInput('');
    setSelectedProject('');
    setMediaPreview(null);
    setMediaMimeType(undefined);
    setActiveType('note');
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().replace(/^#/, '');
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setMediaPreview(event.target?.result as string);
      setMediaMimeType(file.type);
      if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ''));
      setActiveType('photo');
    };
    reader.readAsDataURL(file);
  };

  const handleQuickSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim() && !title.trim() && !mediaPreview) return;

    let finalTitle = title.trim();
    if (!finalTitle) {
      if (activeType === 'idea') finalTitle = 'Idea Spark';
      else if (activeType === 'thought') finalTitle = 'Quick Thought';
      else if (activeType === 'task') finalTitle = 'Task Item';
      else if (activeType === 'code') finalTitle = 'Code Snippet';
      else if (activeType === 'link') finalTitle = 'Saved Bookmark';
      else finalTitle = content.slice(0, 30).trim() || 'Quick Capture';
    }

    const tasksList =
      activeType === 'task'
        ? [
            {
              id: `task_${Date.now()}`,
              text: content || finalTitle,
              completed: false,
              priority: taskPriority,
            },
          ]
        : undefined;

    onSave({
      title: finalTitle,
      content: content.trim(),
      type: activeType,
      tags,
      project: selectedProject || undefined,
      mediaUrl: mediaPreview || undefined,
      mediaMimeType,
      codeLanguage: activeType === 'code' ? codeLanguage : undefined,
      tasks: tasksList,
    });

    onClose();
  };

  if (!isOpen) return null;

  const captureTabs: { type: NoteType; label: string; icon: React.ElementType }[] = [
    { type: 'note', label: 'Note', icon: FileText },
    { type: 'thought', label: 'Thought', icon: Sparkles },
    { type: 'idea', label: 'Idea', icon: Lightbulb },
    { type: 'task', label: 'Task', icon: CheckSquare },
    { type: 'code', label: 'Code', icon: Code },
    { type: 'photo', label: 'Photo', icon: ImageIcon },
    { type: 'link', label: 'Bookmark', icon: Link },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#12141a] border border-[#262c3b] rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-3 border-b border-[#1f2533] flex items-center justify-between bg-[#0e1015]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <h2 className="font-semibold text-sm text-white font-display">ROCN Quick Capture</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenVoiceModal();
              }}
              className="px-2.5 py-1 rounded bg-[#1c222e] hover:bg-[#252e3e] text-xs text-blue-400 border border-[#2f394d] flex items-center gap-1.5 transition-colors"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Voice</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenDrawingModal();
              }}
              className="px-2.5 py-1 rounded bg-[#1c222e] hover:bg-[#252e3e] text-xs text-emerald-400 border border-[#2f394d] flex items-center gap-1.5 transition-colors"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Draw</span>
            </button>
            <button
              onClick={onClose}
              className="text-[#94a3b8] hover:text-white p-1 rounded hover:bg-[#1f2430]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Capture Type Tabs */}
        <div className="px-3 pt-2.5 pb-1 bg-[#0b0c10] border-b border-[#1c212c] flex items-center gap-1.5 overflow-x-auto">
          {captureTabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeType === tab.type;
            return (
              <button
                key={tab.type}
                onClick={() => setActiveType(tab.type)}
                className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0 ${
                  isSelected
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 font-semibold'
                    : 'text-[#8590a6] hover:text-[#e2e8f0] hover:bg-[#161a22]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleQuickSubmit} className="p-4 space-y-3.5">
          {/* Title input */}
          <input
            type="text"
            placeholder={
              activeType === 'idea'
                ? 'Idea spark title...'
                : activeType === 'task'
                ? 'Task headline...'
                : activeType === 'code'
                ? 'Snippet description...'
                : 'Title (optional)'
            }
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent border-b border-[#202533] pb-2 text-base font-semibold text-white placeholder:text-[#4b5563] focus:border-blue-500/80 focus:outline-none"
          />

          {/* Content TextArea */}
          <textarea
            ref={inputRef}
            rows={activeType === 'thought' ? 3 : 5}
            placeholder={
              activeType === 'idea'
                ? 'Describe the spark, potential impact, and why it matters...'
                : activeType === 'thought'
                ? 'What is on your mind right now?'
                : activeType === 'code'
                ? 'Paste or type code snippet...'
                : activeType === 'link'
                ? 'Paste URL and your notes on why you saved it...'
                : 'Type anything... Markdown, checklists, or paste images directly.'
            }
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                handleQuickSubmit();
              }
            }}
            className="w-full bg-[#0a0c10] border border-[#1e2330] rounded-lg p-3 text-xs text-[#e2e8f0] font-mono-code focus:border-blue-500/60 focus:outline-none resize-none placeholder:text-[#475569] leading-relaxed"
          />

          {/* Media / Screenshot Preview */}
          {mediaPreview && (
            <div className="relative rounded-lg border border-[#232a3b] p-2 bg-[#090b0e] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={mediaPreview} alt="Preview" className="w-16 h-12 object-cover rounded border border-[#1f2533]" />
                <span className="text-xs text-[#cbd5e1] font-mono-code">Image attached</span>
              </div>
              <button
                type="button"
                onClick={() => setMediaPreview(null)}
                className="text-rose-400 hover:text-rose-300 text-xs p-1"
              >
                Remove
              </button>
            </div>
          )}

          {/* Extra options bar (Projects, Code Language, Image Upload, Tags) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {/* Project selection */}
            <div className="flex items-center gap-1.5 bg-[#0a0c10] border border-[#1f2430] rounded-md px-2.5 py-1.5">
              <span className="text-[11px] text-[#6b7280] font-mono-code">Project:</span>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="bg-transparent text-[#cbd5e1] text-xs focus:outline-none flex-1"
              >
                <option value="" className="bg-[#12141a] text-gray-400">None</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#12141a] text-white">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Code Language or Priority */}
            {activeType === 'code' ? (
              <div className="flex items-center gap-1.5 bg-[#0a0c10] border border-[#1f2430] rounded-md px-2.5 py-1.5">
                <span className="text-[11px] text-[#6b7280] font-mono-code">Lang:</span>
                <select
                  value={codeLanguage}
                  onChange={(e) => setCodeLanguage(e.target.value)}
                  className="bg-transparent text-[#cbd5e1] text-xs focus:outline-none flex-1 font-mono-code"
                >
                  <option value="typescript" className="bg-[#12141a]">TypeScript</option>
                  <option value="javascript" className="bg-[#12141a]">JavaScript</option>
                  <option value="python" className="bg-[#12141a]">Python</option>
                  <option value="rust" className="bg-[#12141a]">Rust</option>
                  <option value="sql" className="bg-[#12141a]">SQL</option>
                  <option value="json" className="bg-[#12141a]">JSON</option>
                </select>
              </div>
            ) : activeType === 'task' ? (
              <div className="flex items-center gap-1.5 bg-[#0a0c10] border border-[#1f2430] rounded-md px-2.5 py-1.5">
                <span className="text-[11px] text-[#6b7280] font-mono-code">Priority:</span>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as any)}
                  className="bg-transparent text-[#cbd5e1] text-xs focus:outline-none flex-1 font-mono-code"
                >
                  <option value="normal" className="bg-[#12141a]">Normal</option>
                  <option value="high" className="bg-[#12141a]">High 🔥</option>
                  <option value="low" className="bg-[#12141a]">Low</option>
                </select>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-1.5 bg-[#0a0c10] hover:bg-[#141822] border border-[#1f2430] rounded-md px-2.5 py-1.5 text-[#94a3b8]"
              >
                <Upload className="w-3.5 h-3.5 text-blue-400" />
                <span>Attach Image / Screenshot</span>
              </button>
            )}

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Tags input */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-[#191f2b] text-blue-300 text-[11px] font-mono-code px-2 py-0.5 rounded border border-[#2b364c] flex items-center gap-1"
                >
                  #{tag}
                  <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-white">
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                placeholder="Add tags (press Enter)..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="bg-transparent text-[11px] text-[#cbd5e1] placeholder:text-[#4b5563] focus:outline-none py-1 min-w-[120px]"
              />
            </div>
          </div>

          {/* Footer & Submit */}
          <div className="pt-2 border-t border-[#1f2533] flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] text-[#64748b] font-mono-code">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>Auto-saved to local memory</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#64748b] font-mono-code hidden sm:inline">⌘ + Enter</span>
              <button
                type="submit"
                disabled={!content.trim() && !title.trim() && !mediaPreview}
                className="px-4 py-1.5 rounded-lg text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Save to Stream</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
