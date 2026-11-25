import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  FileCode,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Layers,
  Sparkles,
  Folder,
  Tag,
  Trash2,
  DownloadCloud,
} from 'lucide-react';
import { NoteObject, Project } from '../types';
import { aiService } from '../services/aiService';

interface MassUploadModalProps {
  isOpen: boolean;
  projects: Project[];
  onClose: () => void;
  onImportNotes: (newNotes: NoteObject[]) => void;
}

interface StagedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string;
  status: 'pending' | 'processing' | 'ready' | 'error';
  errorMessage?: string;
  mediaUrl?: string;
  mediaMimeType?: string;
}

export const MassUploadModal: React.FC<MassUploadModalProps> = ({
  isOpen,
  projects,
  onClose,
  onImportNotes,
}) => {
  if (!isOpen) return null;

  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [targetProject, setTargetProject] = useState<string>('');
  const [customTags, setCustomTags] = useState<string>('notebook-ingest, mass-upload');
  const [autoSummarizeWithAI, setAutoSummarizeWithAI] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFileList(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFileList(Array.from(e.target.files));
    }
  };

  const processFileList = (files: File[]) => {
    files.forEach((file) => {
      const fileId = `staged_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const isImage = file.type.startsWith('image/');

      if (isImage) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setStagedFiles((prev) => [
            ...prev,
            {
              id: fileId,
              name: file.name,
              size: file.size,
              type: 'image',
              content: `Visual attachment: ${file.name}\nSize: ${(file.size / 1024).toFixed(1)} KB`,
              mediaUrl: ev.target?.result as string,
              mediaMimeType: file.type,
              status: 'ready',
            },
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const text = (ev.target?.result as string) || '';
          setStagedFiles((prev) => [
            ...prev,
            {
              id: fileId,
              name: file.name,
              size: file.size,
              type: file.name.endsWith('.md')
                ? 'markdown'
                : file.name.endsWith('.json')
                ? 'json'
                : 'text',
              content: text,
              status: 'ready',
            },
          ]);
        };
        reader.readAsText(file);
      }
    });
  };

  const removeStagedFile = (id: string) => {
    setStagedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleIngestAll = async () => {
    if (stagedFiles.length === 0) return;
    setIsProcessing(true);
    setProgressPercent(10);

    const parsedTags = customTags
      .split(',')
      .map((t) => t.trim().toLowerCase().replace(/[^a-z0-9-]/g, ''))
      .filter(Boolean);

    const createdNotes: NoteObject[] = [];

    for (let i = 0; i < stagedFiles.length; i++) {
      const f = stagedFiles[i];
      const nowIso = new Date().toISOString();
      const title = f.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

      let summary: string | undefined = undefined;
      let keyTakeaways: string[] | undefined = undefined;

      if (autoSummarizeWithAI && f.content && f.type !== 'image') {
        try {
          const aiRes = await aiService.summarizeNote({
            id: `temp_${i}`,
            title,
            content: f.content.slice(0, 4000),
            type: 'note',
            tags: [],
            createdAt: nowIso,
            updatedAt: nowIso,
          });
          if (aiRes) {
            summary = aiRes.summary;
            keyTakeaways = aiRes.keyTakeaways;
          }
        } catch {
          // graceful AI fallback
        }
      }

      const note: NoteObject = {
        id: `note_ingest_${Date.now()}_${i}`,
        title: title.charAt(0).toUpperCase() + title.slice(1),
        content: f.content,
        type: f.type === 'image' ? 'photo' : 'note',
        tags: [...parsedTags, f.type],
        project: targetProject || undefined,
        mediaUrl: f.mediaUrl,
        mediaMimeType: f.mediaMimeType,
        summary,
        keyTakeaways,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      createdNotes.push(note);
      setProgressPercent(Math.round(((i + 1) / stagedFiles.length) * 100));
    }

    onImportNotes(createdNotes);
    setIsProcessing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#0e1117] border border-[#222a3a] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#1c2230] bg-[#11151f] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <DownloadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display tracking-tight">
                NOTEBOOK INGEST & MASS UPLOADER
              </h3>
              <p className="text-xs text-[#717c91] font-mono-code mt-0.5">
                Bulk ingest Markdown documents, research files, PDFs, text, and photos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#64748b] hover:text-white hover:bg-[#181e2b] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="p-8 border-2 border-dashed border-[#242d3f] hover:border-blue-500/60 rounded-xl bg-[#0a0c10]/60 hover:bg-[#10141f]/60 text-center cursor-pointer transition-all space-y-3 group"
          >
            <div className="w-12 h-12 rounded-full bg-[#161c28] group-hover:bg-blue-500/20 text-[#64748b] group-hover:text-blue-400 border border-[#222a3b] flex items-center justify-center mx-auto transition-colors">
              <UploadCloud className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <div className="text-sm font-semibold text-white">
                Drag and drop files here, or <span className="text-blue-400 underline">browse</span>
              </div>
              <div className="text-xs text-[#64748b] font-mono-code">
                Supports .md, .txt, .json, .csv, and images (.png, .jpg, .webp)
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".md,.txt,.json,.csv,image/*"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>

          {/* Staged files list */}
          {stagedFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono-code text-[#94a3b8]">
                <span>Files Ready for Ingest ({stagedFiles.length})</span>
                <button
                  onClick={() => setStagedFiles([])}
                  className="text-rose-400 hover:underline"
                >
                  Clear All
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {stagedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="p-3 rounded-lg bg-[#121620] border border-[#202738] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {file.type === 'image' ? (
                        <ImageIcon className="w-4 h-4 text-purple-400 shrink-0" />
                      ) : file.type === 'markdown' ? (
                        <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                      ) : (
                        <FileCode className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      <span className="text-white font-medium truncate">{file.name}</span>
                      <span className="text-[10px] text-[#64748b] font-mono-code">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>

                    <button
                      onClick={() => removeStagedFile(file.id)}
                      className="text-[#64748b] hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ingest Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-[#12151e] border border-[#1f2636]">
            <div>
              <label className="text-[11px] font-mono-code text-[#64748b] block mb-1">
                Attach to Project
              </label>
              <select
                value={targetProject}
                onChange={(e) => setTargetProject(e.target.value)}
                className="w-full bg-[#0a0c10] border border-[#202738] rounded-lg px-3 py-2 text-xs text-white font-mono-code focus:outline-none focus:border-blue-500"
              >
                <option value="">No Project (Inbox)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-mono-code text-[#64748b] block mb-1">
                Custom Tags (comma separated)
              </label>
              <input
                type="text"
                value={customTags}
                onChange={(e) => setCustomTags(e.target.value)}
                placeholder="notebook-ingest, research..."
                className="w-full bg-[#0a0c10] border border-[#202738] rounded-lg px-3 py-2 text-xs text-white font-mono-code focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-2 pt-2 border-t border-[#1e2536] flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-[#cbd5e1] cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSummarizeWithAI}
                  onChange={(e) => setAutoSummarizeWithAI(e.target.checked)}
                  className="accent-blue-500 rounded"
                />
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>Generate AI executive summary and key takeaways on ingest</span>
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1c2230] bg-[#11151f] flex items-center justify-between">
          <div className="text-xs font-mono-code text-[#64748b]">
            {isProcessing ? `Processing batch (${progressPercent}%)...` : `${stagedFiles.length} file(s) staged`}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-mono-code text-[#94a3b8] hover:text-white hover:bg-[#191f2c]"
            >
              Cancel
            </button>
            <button
              onClick={handleIngestAll}
              disabled={stagedFiles.length === 0 || isProcessing}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold font-mono-code flex items-center gap-1.5 shadow-md active:scale-95 transition-all disabled:opacity-40"
            >
              <DownloadCloud className="w-3.5 h-3.5" />
              <span>{isProcessing ? 'Ingesting...' : 'Ingest to Vault'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
