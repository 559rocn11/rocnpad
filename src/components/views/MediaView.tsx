import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Mic,
  PenTool,
  Code,
  Play,
  Pause,
  ExternalLink,
  Copy,
  Check,
  Maximize2,
  Filter,
} from 'lucide-react';
import { NoteObject, NoteType } from '../../types';

interface MediaViewProps {
  notes: NoteObject[];
  onSelectNote: (note: NoteObject) => void;
}

export const MediaView: React.FC<MediaViewProps> = ({ notes, onSelectNote }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'images' | 'audio' | 'sketches' | 'code'>('all');
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);

  // Filter media items
  const mediaNotes = notes.filter((n) => {
    if (activeTab === 'images') {
      return (n.type === 'photo' || n.type === 'screenshot') && n.mediaUrl;
    }
    if (activeTab === 'audio') {
      return n.type === 'voice';
    }
    if (activeTab === 'sketches') {
      return n.type === 'drawing' && n.mediaUrl;
    }
    if (activeTab === 'code') {
      return n.type === 'code';
    }
    return (
      n.type === 'photo' ||
      n.type === 'screenshot' ||
      n.type === 'voice' ||
      n.type === 'drawing' ||
      n.type === 'code' ||
      n.mediaUrl
    );
  });

  const handleCopyCode = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippetId(id);
    setTimeout(() => setCopiedSnippetId(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#0b0c10]">
      {/* Top Header */}
      <div className="p-6 pb-4 border-b border-[#1c212c] bg-[#0d0f14]/80 backdrop-blur-md sticky top-0 z-10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight text-white font-display">MEDIA & ATTACHMENTS</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#181d28] text-blue-400 border border-[#2b354a] font-mono-code">
                {mediaNotes.length} Artifacts
              </span>
            </div>
            <p className="text-xs text-[#717c91] font-mono-code mt-0.5">
              Visual captures, audio memos, drawings, and raw code snippets
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono-code">
          {[
            { id: 'all', label: 'All Artifacts' },
            { id: 'images', label: 'Photos & Screenshots' },
            { id: 'audio', label: 'Voice Memos' },
            { id: 'sketches', label: 'Drawings & Sketches' },
            { id: 'code', label: 'Code Snippets' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg border transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600/20 text-blue-400 border-blue-500/40 font-semibold'
                  : 'bg-[#12151d] text-[#717c91] border-[#1d232f] hover:text-[#e2e8f0]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="p-6 max-w-7xl mx-auto w-full">
        {mediaNotes.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-[#1f2533] rounded-2xl bg-[#0d0f14]/50 space-y-3">
            <ImageIcon className="w-8 h-8 text-[#475569] mx-auto" />
            <h4 className="text-sm font-semibold text-white">No media artifacts found</h4>
            <p className="text-xs text-[#64748b] max-w-sm mx-auto">
              Capture photos, record voice memos, sketch diagrams, or save code blocks.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {mediaNotes.map((note) => {
              const isVoice = note.type === 'voice';
              const isCode = note.type === 'code';
              const isDrawing = note.type === 'drawing';
              const isImage = (note.type === 'photo' || note.type === 'screenshot') && note.mediaUrl;

              return (
                <div
                  key={note.id}
                  onClick={() => onSelectNote(note)}
                  className="bg-[#12141a] hover:bg-[#151922] border border-[#1e2330] hover:border-[#313c52] rounded-xl overflow-hidden shadow-sm flex flex-col justify-between cursor-pointer transition-all group"
                >
                  {/* Media Content Preview */}
                  {isImage || isDrawing ? (
                    <div className="h-48 bg-[#090b0e] border-b border-[#1b202c] overflow-hidden flex items-center justify-center relative">
                      <img
                        src={note.mediaUrl}
                        alt={note.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 right-2 p-1 rounded-md bg-black/60 text-white backdrop-blur-xs">
                        {isDrawing ? <PenTool className="w-3.5 h-3.5" /> : <ImageIcon className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  ) : isVoice ? (
                    <div className="p-4 bg-[#0e1118] border-b border-[#1b202c] space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mic className="w-4 h-4 text-rose-400" />
                          <span className="text-xs font-semibold text-white">Voice Note</span>
                        </div>
                        {note.audioDuration && (
                          <span className="text-[10px] font-mono-code text-[#64748b]">
                            {note.audioDuration}s
                          </span>
                        )}
                      </div>
                      {note.mediaUrl && (
                        <audio
                          src={note.mediaUrl}
                          controls
                          className="w-full h-8 max-w-xs"
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                      {note.audioTranscript && (
                        <p className="text-[11px] text-[#94a3b8] italic line-clamp-2">
                          “{note.audioTranscript}”
                        </p>
                      )}
                    </div>
                  ) : isCode ? (
                    <div className="p-3 bg-[#0a0c10] border-b border-[#1b202c] space-y-2 relative">
                      <div className="flex items-center justify-between text-[11px] font-mono-code text-[#64748b]">
                        <span className="flex items-center gap-1 text-emerald-400">
                          <Code className="w-3 h-3" />
                          <span>{note.codeLanguage || 'code'}</span>
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyCode(note.id, note.content);
                          }}
                          className="p-1 rounded hover:bg-[#1a202c] text-[#8590a6] hover:text-white"
                          title="Copy Code"
                        >
                          {copiedSnippetId === note.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                      <pre className="text-[11px] font-mono-code text-[#cbd5e1] overflow-x-auto max-h-36 p-2 bg-[#06070a] rounded border border-[#181d28] leading-relaxed">
                        {note.content}
                      </pre>
                    </div>
                  ) : null}

                  {/* Card Footer Info */}
                  <div className="p-3.5 space-y-1 bg-[#12141a]">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-xs text-white font-display truncate group-hover:text-blue-300">
                        {note.title}
                      </h4>
                      <span className="text-[10px] font-mono-code text-[#64748b]">
                        {new Date(note.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {note.tags && note.tags.length > 0 && (
                      <div className="flex items-center gap-1 pt-1">
                        {note.tags.slice(0, 2).map((t) => (
                          <span key={t} className="text-[10px] text-[#64748b] font-mono-code">
                            #{t}
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
