import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  FileText,
  Sparkles,
  Lightbulb,
  CheckSquare,
  Network,
  Settings,
  Download,
  Mic,
  PenTool,
  Clock,
  FolderPlus,
  Compass,
  BookOpen,
  UploadCloud,
} from 'lucide-react';
import { ActiveView } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectView: (view: ActiveView) => void;
  onTriggerQuickCapture: () => void;
  onTriggerVoiceModal: () => void;
  onTriggerDrawingModal: () => void;
  onTriggerRecap: () => void;
  onTriggerLookBack: () => void;
  onExportJSON: () => void;
  onExportMarkdown: () => void;
  onTriggerReadwiseSync?: () => void;
  onTriggerMassUpload?: () => void;
  onTriggerGuide?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectView,
  onTriggerQuickCapture,
  onTriggerVoiceModal,
  onTriggerDrawingModal,
  onTriggerRecap,
  onTriggerLookBack,
  onExportJSON,
  onExportMarkdown,
  onTriggerReadwiseSync,
  onTriggerMassUpload,
  onTriggerGuide,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isOpen]);

  const commands = [
    {
      id: 'cmd_quick_capture',
      title: 'New Quick Capture',
      category: 'Creation',
      icon: FileText,
      shortcut: 'N',
      action: () => {
        onTriggerQuickCapture();
        onClose();
      },
    },
    {
      id: 'cmd_readwise_sync',
      title: 'Sync Readwise & Reader Highlights',
      category: 'Ingest & Sync',
      icon: BookOpen,
      shortcut: 'R',
      action: () => {
        if (onTriggerReadwiseSync) onTriggerReadwiseSync();
        onClose();
      },
    },
    {
      id: 'cmd_mass_ingest',
      title: 'Notebook Ingest (Bulk Markdown / Photos)',
      category: 'Ingest & Sync',
      icon: UploadCloud,
      shortcut: 'U',
      action: () => {
        if (onTriggerMassUpload) onTriggerMassUpload();
        onClose();
      },
    },
    {
      id: 'cmd_voice_memo',
      title: 'Record Voice Memo',
      category: 'Creation',
      icon: Mic,
      shortcut: 'V',
      action: () => {
        onTriggerVoiceModal();
        onClose();
      },
    },
    {
      id: 'cmd_sketch',
      title: 'Open Canvas Sketchpad',
      category: 'Creation',
      icon: PenTool,
      shortcut: 'D',
      action: () => {
        onTriggerDrawingModal();
        onClose();
      },
    },
    {
      id: 'cmd_ask_ai',
      title: 'Ask Your Knowledge Base',
      category: 'Intelligence',
      icon: Sparkles,
      shortcut: 'A',
      action: () => {
        onSelectView('ai');
        onClose();
      },
    },
    {
      id: 'cmd_recap_today',
      title: "Generate Today's Recap (My Day)",
      category: 'Intelligence',
      icon: Clock,
      shortcut: 'R',
      action: () => {
        onTriggerRecap();
        onClose();
      },
    },
    {
      id: 'cmd_lookback',
      title: 'Run Look Back Reflection (Weekly/Monthly Review)',
      category: 'Intelligence',
      icon: Compass,
      shortcut: 'L',
      action: () => {
        onTriggerLookBack();
        onClose();
      },
    },
    {
      id: 'cmd_view_today',
      title: 'Go to Today Stream',
      category: 'Navigation',
      icon: Clock,
      action: () => {
        onSelectView('today');
        onClose();
      },
    },
    {
      id: 'cmd_view_notes',
      title: 'Go to All Notes',
      category: 'Navigation',
      icon: FileText,
      action: () => {
        onSelectView('notes');
        onClose();
      },
    },
    {
      id: 'cmd_view_ideas',
      title: 'Go to Ideas & Sparks',
      category: 'Navigation',
      icon: Lightbulb,
      action: () => {
        onSelectView('ideas');
        onClose();
      },
    },
    {
      id: 'cmd_view_tasks',
      title: 'Go to Action Tasks',
      category: 'Navigation',
      icon: CheckSquare,
      action: () => {
        onSelectView('tasks');
        onClose();
      },
    },
    {
      id: 'cmd_view_knowledge',
      title: 'Open Knowledge Relationship Graph',
      category: 'Navigation',
      icon: Network,
      action: () => {
        onSelectView('knowledge');
        onClose();
      },
    },
    {
      id: 'cmd_search_all',
      title: 'Universal Deep Search',
      category: 'Navigation',
      icon: Search,
      action: () => {
        onSelectView('search');
        onClose();
      },
    },
    {
      id: 'cmd_export_json',
      title: 'Export Local Vault (Full JSON Backup)',
      category: 'Data & Vault',
      icon: Download,
      action: () => {
        onExportJSON();
        onClose();
      },
    },
    {
      id: 'cmd_export_md',
      title: 'Export All as Markdown Documents',
      category: 'Data & Vault',
      icon: Download,
      action: () => {
        onExportMarkdown();
        onClose();
      },
    },
    {
      id: 'cmd_guide',
      title: 'Open ROCNpad Operating Guide & Overview',
      category: 'System',
      icon: Sparkles,
      action: () => {
        if (onTriggerGuide) onTriggerGuide();
        onClose();
      },
    },
    {
      id: 'cmd_settings',
      title: 'Open Settings (BYOK, Storage, Privacy)',
      category: 'System',
      icon: Settings,
      action: () => {
        onSelectView('settings');
        onClose();
      },
    },
  ];

  const filteredCommands = commands.filter(
    (c) =>
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
      <div className="bg-[#13151b] border border-[#262c3b] rounded-xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-100">
        {/* Search input header */}
        <div className="p-3 border-b border-[#1f2533] flex items-center gap-2.5 bg-[#0e1015]">
          <Search className="w-4 h-4 text-[#60a5fa]" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, action, or navigate..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-[#4b5563] focus:outline-none font-mono-code"
          />
          <kbd className="text-[10px] bg-[#1a202c] text-[#94a3b8] px-1.5 py-0.5 rounded border border-[#2d3748] font-mono-code">
            ESC
          </kbd>
        </div>

        {/* Command list */}
        <div className="max-h-80 overflow-y-auto p-1.5 space-y-0.5">
          {filteredCommands.length === 0 ? (
            <div className="p-4 text-center text-xs text-[#64748b] font-mono-code">
              No matching commands found.
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  onClick={cmd.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors text-left ${
                    isSelected
                      ? 'bg-[#1e2533] text-white border border-[#37445c]'
                      : 'text-[#9ca3af] hover:bg-[#161a22] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-1.5 rounded ${
                        isSelected ? 'bg-blue-600/30 text-blue-400' : 'bg-[#171b23] text-[#64748b]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-medium">{cmd.title}</div>
                      <div className="text-[10px] text-[#525d6e] font-mono-code">{cmd.category}</div>
                    </div>
                  </div>

                  {cmd.shortcut && (
                    <kbd className="text-[10px] bg-[#11141a] text-[#818cf8] px-1.5 py-0.5 rounded border border-[#232938] font-mono-code">
                      {cmd.shortcut}
                    </kbd>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-2 border-t border-[#1f2533] bg-[#0a0c10] flex items-center justify-between text-[10px] text-[#64748b] font-mono-code">
          <span>↑↓ to navigate</span>
          <span>↵ to execute</span>
        </div>
      </div>
    </div>
  );
};
