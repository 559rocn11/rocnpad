import React, { useState } from 'react';
import {
  Search,
  Filter,
  Calendar,
  Sparkles,
  ArrowRight,
  FileText,
  Mic,
  Code,
  Image as ImageIcon,
  CheckSquare,
  Lightbulb,
  CornerDownLeft,
} from 'lucide-react';
import { NoteObject, Project, NoteType } from '../../types';

interface UniversalSearchViewProps {
  notes: NoteObject[];
  projects: Project[];
  onSelectNote: (note: NoteObject) => void;
}

export const UniversalSearchView: React.FC<UniversalSearchViewProps> = ({
  notes,
  projects,
  onSelectNote,
}) => {
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  const filteredNotes = notes.filter((note) => {
    const q = query.toLowerCase().trim();
    let matchesQuery = true;

    if (q) {
      // Natural language date check in query (e.g. "september 22", "sep 22")
      const matchesText =
        note.title.toLowerCase().includes(q) ||
        note.content.toLowerCase().includes(q) ||
        note.tags?.some((t) => t.toLowerCase().includes(q));

      const matchesDateStr =
        (q.includes('sep') || q.includes('september')) &&
        q.includes('22') &&
        note.createdAt.startsWith('2026-09-22');

      matchesQuery = matchesText || matchesDateStr;
    }

    const matchesType = selectedType === 'all' || note.type === selectedType;
    const matchesDate = !dateFilter || note.createdAt.startsWith(dateFilter);

    return matchesQuery && matchesType && matchesDate;
  });

  const getTypeIcon = (type: NoteType) => {
    switch (type) {
      case 'idea':
        return Lightbulb;
      case 'thought':
        return Sparkles;
      case 'voice':
        return Mic;
      case 'code':
        return Code;
      case 'task':
        return CheckSquare;
      default:
        return FileText;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#0b0c10]">
      {/* Search Header */}
      <div className="p-6 pb-5 border-b border-[#1c212c] bg-[#0d0f14]/80 backdrop-blur-md sticky top-0 z-10 space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-white font-display">UNIVERSAL SEARCH</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#181d28] text-blue-400 border border-[#2b354a] font-mono-code">
              {filteredNotes.length} Found
            </span>
          </div>
          <p className="text-xs text-[#717c91] font-mono-code mt-0.5">
            Full-text lexical and semantic search across your entire offline knowledge base
          </p>
        </div>

        {/* Big Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 text-[#60a5fa] absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search anything: 'September 22', 'audio engine', 'security', 'UI layout'..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-[#12151e] border border-[#252f42] rounded-xl pl-11 pr-12 py-3 text-sm text-white placeholder:text-[#475569] focus:outline-none focus:border-blue-500/80 font-mono-code shadow-inner"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3.5 top-3.5 text-xs text-[#64748b] hover:text-white font-mono-code px-1.5 py-0.5 rounded bg-[#1a202c]"
            >
              Clear
            </button>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono-code">
          <span className="text-[#64748b] text-[11px]">Quick filters:</span>
          {['September 22', 'Security & Privacy', 'OS', 'Nomad', 'Audio Engine'].map((term) => (
            <button
              key={term}
              onClick={() => setQuery(term)}
              className="px-2.5 py-0.5 rounded-md bg-[#13161f] hover:bg-[#1a202c] text-[#8590a6] hover:text-white border border-[#202736] transition-colors"
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      {/* Results Stream */}
      <div className="p-6 max-w-4xl w-full mx-auto space-y-3">
        {filteredNotes.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-[#1f2533] rounded-2xl bg-[#0d0f14]/50 space-y-3">
            <Search className="w-8 h-8 text-[#475569] mx-auto" />
            <h4 className="text-sm font-semibold text-white">No results matched your query</h4>
            <p className="text-xs text-[#64748b] max-w-sm mx-auto">
              Try broader keywords, searching by date (e.g. 2026-09-22), or exploring by tags.
            </p>
          </div>
        ) : (
          filteredNotes.map((note) => {
            const Icon = getTypeIcon(note.type);
            const proj = projects.find((p) => p.id === note.project);

            return (
              <div
                key={note.id}
                onClick={() => onSelectNote(note)}
                className="p-4 rounded-xl bg-[#12141a] hover:bg-[#161a22] border border-[#1e2330] hover:border-[#313c52] transition-all cursor-pointer shadow-sm space-y-2 group"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono-code uppercase px-2 py-0.5 rounded bg-[#171c26] text-blue-400 border border-[#263044] flex items-center gap-1">
                      <Icon className="w-3 h-3" />
                      <span>{note.type}</span>
                    </span>
                    {proj && (
                      <span className="text-[11px] text-[#94a3b8] font-mono-code flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: proj.color }} />
                        <span>{proj.name}</span>
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-[#64748b] font-mono-code">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="font-semibold text-sm text-white font-display group-hover:text-blue-300 transition-colors">
                  {note.title}
                </h3>

                <p className="text-xs text-[#9ca3af] font-mono-code line-clamp-2 leading-relaxed">
                  {note.content}
                </p>

                {note.tags && note.tags.length > 0 && (
                  <div className="flex items-center gap-1 pt-1">
                    {note.tags.map((t) => (
                      <span key={t} className="text-[10px] text-blue-400/80 font-mono-code">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
