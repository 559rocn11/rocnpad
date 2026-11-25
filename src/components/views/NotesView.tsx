import React, { useState } from 'react';
import {
  FileText,
  Search,
  Plus,
  Filter,
  Grid,
  List,
  Pin,
  Star,
  Folder,
  Tag,
  ArrowUpDown,
  CheckSquare,
  Sparkles,
  Lightbulb,
  Mic,
  Code,
  Image as ImageIcon,
  PenTool,
  BookOpen,
  RefreshCw,
  UploadCloud,
} from 'lucide-react';
import { NoteObject, NoteType, Project } from '../../types';

interface NotesViewProps {
  notes: NoteObject[];
  projects: Project[];
  onSelectNote: (note: NoteObject) => void;
  onOpenQuickCapture: () => void;
  onOpenReadwiseSync?: () => void;
  onOpenMassUpload?: () => void;
  onOpenReadingMode?: (note: NoteObject) => void;
}

export const NotesView: React.FC<NotesViewProps> = ({
  notes,
  projects,
  onSelectNote,
  onOpenQuickCapture,
  onOpenReadwiseSync,
  onOpenMassUpload,
  onOpenReadingMode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');

  // Extract all unique tags
  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags || [])));

  // Filter & Sort
  const filteredNotes = notes
    .filter((n) => {
      const matchesSearch =
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType = selectedType === 'all' || n.type === selectedType;
      const matchesProj = selectedProject === 'all' || n.project === selectedProject;
      const matchesTag = selectedTag === 'all' || n.tags?.includes(selectedTag);

      return matchesSearch && matchesType && matchesProj && matchesTag;
    })
    .sort((a, b) => {
      // Pinned notes always on top
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return a.title.localeCompare(b.title);
    });

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

  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#0b0c10]">
      {/* Header & Controls */}
      <div className="p-6 pb-4 border-b border-[#1c212c] bg-[#0d0f14]/80 backdrop-blur-md sticky top-0 z-10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight text-white font-display">ALL NOTES</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#181d28] text-blue-400 border border-[#2b354a] font-mono-code">
                {filteredNotes.length} / {notes.length}
              </span>
            </div>
            <p className="text-xs text-[#717c91] font-mono-code mt-0.5">
              Knowledge objects, documents, and captures in your local vault
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Mass Ingest / Upload */}
            {onOpenMassUpload && (
              <button
                onClick={onOpenMassUpload}
                className="px-3 py-1.5 rounded-lg bg-[#161c28] hover:bg-[#20283a] text-[#94a3b8] hover:text-white text-xs font-mono-code border border-[#273248] flex items-center gap-1.5 transition-all shadow-xs"
                title="Mass Ingest Markdown & Media"
              >
                <UploadCloud className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Ingest</span>
              </button>
            )}

            {/* Readwise Sync */}
            {onOpenReadwiseSync && (
              <button
                onClick={onOpenReadwiseSync}
                className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono-code flex items-center gap-1.5 transition-all shadow-xs"
                title="Sync Highlights with Readwise"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                <span>Readwise</span>
              </button>
            )}

            {/* View Layout Toggle */}
            <div className="flex items-center bg-[#13161f] border border-[#202736] rounded-lg p-0.5">
              <button
                onClick={() => setViewLayout('grid')}
                className={`p-1.5 rounded ${viewLayout === 'grid' ? 'bg-[#232b3b] text-white' : 'text-[#717c91]'}`}
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewLayout('list')}
                className={`p-1.5 rounded ${viewLayout === 'list' ? 'bg-[#232b3b] text-white' : 'text-[#717c91]'}`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* + Capture */}
            <button
              onClick={onOpenQuickCapture}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Note</span>
            </button>
          </div>
        </div>

        {/* Search Bar & Filter Strip */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-[#64748b] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter notes by keyword, tag, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#12141c] border border-[#1f2636] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-[#4b5563] focus:outline-none focus:border-blue-500/60 font-mono-code"
            />
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-[#12141c] border border-[#1f2636] text-xs text-[#cbd5e1] rounded-lg px-2.5 py-1.5 focus:outline-none font-mono-code"
          >
            <option value="all">All Types</option>
            <option value="note">Notes</option>
            <option value="idea">Ideas</option>
            <option value="thought">Thoughts</option>
            <option value="task">Tasks</option>
            <option value="voice">Voice Memos</option>
            <option value="code">Code Snippets</option>
            <option value="photo">Photos</option>
            <option value="drawing">Drawings</option>
          </select>

          {/* Project Filter */}
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="bg-[#12141c] border border-[#1f2636] text-xs text-[#cbd5e1] rounded-lg px-2.5 py-1.5 focus:outline-none font-mono-code"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Tag Filter */}
          {allTags.length > 0 && (
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="bg-[#12141c] border border-[#1f2636] text-xs text-[#cbd5e1] rounded-lg px-2.5 py-1.5 focus:outline-none font-mono-code"
            >
              <option value="all">All Tags</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  #{tag}
                </option>
              ))}
            </select>
          )}

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#12141c] border border-[#1f2636] text-xs text-[#cbd5e1] rounded-lg px-2.5 py-1.5 focus:outline-none font-mono-code"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="title">Alphabetical</option>
          </select>
        </div>
      </div>

      {/* Notes Grid / List */}
      <div className="p-6">
        {filteredNotes.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-[#1f2533] rounded-2xl bg-[#0d0f14]/50 space-y-3">
            <FileText className="w-8 h-8 text-[#475569] mx-auto" />
            <h4 className="text-sm font-semibold text-white">No matching notes</h4>
            <p className="text-xs text-[#64748b] max-w-sm mx-auto">
              Try modifying your search or clearing active filters.
            </p>
          </div>
        ) : viewLayout === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map((note) => {
              const Icon = getTypeIcon(note.type);
              const proj = projects.find((p) => p.id === note.project);

              return (
                <div
                  key={note.id}
                  onClick={() => onSelectNote(note)}
                  className="p-4 rounded-xl bg-[#12141a] hover:bg-[#161a22] border border-[#1e2330] hover:border-[#313c52] transition-all cursor-pointer shadow-sm flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-2">
                    {/* Top row: Type badge, Project, Pin/Star */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono-code uppercase px-2 py-0.5 rounded bg-[#171c26] text-blue-400 border border-[#263044] flex items-center gap-1">
                          <Icon className="w-3 h-3" />
                          <span>{note.type}</span>
                        </span>
                        {proj && (
                          <span className="text-[11px] text-[#94a3b8] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: proj.color }} />
                            <span className="truncate max-w-[100px]">{proj.name}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-[#64748b]">
                        {onOpenReadingMode && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenReadingMode(note);
                            }}
                            className="p-1 rounded hover:bg-amber-500/10 hover:text-amber-400 transition-colors"
                            title="Distraction-Free Reading Mode"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {note.pinned && <Pin className="w-3 h-3 text-blue-400" />}
                        {note.isStarred && <Star className="w-3 h-3 text-amber-400 fill-current" />}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-sm text-white tracking-tight font-display group-hover:text-blue-300 transition-colors">
                      {note.title}
                    </h3>

                    {/* Content Snippet */}
                    <p className="text-xs text-[#9ca3af] leading-relaxed line-clamp-4 font-mono-code">
                      {note.content}
                    </p>

                    {/* Thumbnail if image */}
                    {note.mediaUrl && (
                      <div className="rounded-lg overflow-hidden border border-[#232938] max-h-36 bg-[#0a0c10]">
                        <img src={note.mediaUrl} alt={note.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  {/* Bottom row: Date & Tags */}
                  <div className="pt-2 border-t border-[#1a1f2b] flex items-center justify-between text-[11px] text-[#64748b] font-mono-code">
                    <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                    {note.tags && note.tags.length > 0 && (
                      <span className="text-blue-400 truncate max-w-[120px]">
                        #{note.tags[0]}
                        {note.tags.length > 1 ? ` +${note.tags.length - 1}` : ''}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="border border-[#1e2330] rounded-xl overflow-hidden divide-y divide-[#1a1f2b]">
            {filteredNotes.map((note) => {
              const Icon = getTypeIcon(note.type);
              const proj = projects.find((p) => p.id === note.project);

              return (
                <div
                  key={note.id}
                  onClick={() => onSelectNote(note)}
                  className="p-3.5 bg-[#12141a] hover:bg-[#161a22] flex items-center justify-between gap-4 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded bg-[#171c26] text-blue-400 border border-[#263044] shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-xs text-white truncate font-display">{note.title}</h4>
                        {note.pinned && <Pin className="w-3 h-3 text-blue-400 shrink-0" />}
                        {note.isStarred && <Star className="w-3 h-3 text-amber-400 fill-current shrink-0" />}
                      </div>
                      <p className="text-[11px] text-[#9ca3af] truncate font-mono-code mt-0.5">{note.content}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs shrink-0 font-mono-code">
                    {onOpenReadingMode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenReadingMode(note);
                        }}
                        className="p-1 rounded text-[#64748b] hover:text-amber-300 hover:bg-amber-500/10 transition-colors"
                        title="Distraction-Free Reading Mode"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {proj && (
                      <span className="text-[#94a3b8] hidden sm:flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: proj.color }} />
                        <span>{proj.name}</span>
                      </span>
                    )}
                    <span className="text-[#64748b] text-[11px]">{new Date(note.createdAt).toLocaleDateString()}</span>
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
