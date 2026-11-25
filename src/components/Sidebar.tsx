import React from 'react';
import {
  Clock,
  FileText,
  FolderKanban,
  Lightbulb,
  CheckSquare,
  Image as ImageIcon,
  Network,
  Search,
  Sparkles,
  Settings,
  Plus,
  Zap,
  Lock,
  BookOpen,
  UploadCloud,
  X,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { ActiveView } from '../types';

interface SidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  onOpenQuickCapture: () => void;
  notesCount: number;
  tasksPendingCount: number;
  encryptionEnabled: boolean;
  onOpenReadwiseSync?: () => void;
  onOpenMassUpload?: () => void;
  onOpenGuide?: () => void;
  // Mobile & Collapse Responsive State
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  onOpenQuickCapture,
  notesCount,
  tasksPendingCount,
  encryptionEnabled,
  onOpenReadwiseSync,
  onOpenMassUpload,
  onOpenGuide,
  isMobileOpen = false,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const navItems: { id: ActiveView; label: string; icon: React.ElementType; badge?: number | string }[] = [
    { id: 'today', label: 'Today', icon: Clock },
    { id: 'notes', label: 'Notes', icon: FileText, badge: notesCount },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'ideas', label: 'Ideas', icon: Lightbulb },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, badge: tasksPendingCount > 0 ? tasksPendingCount : undefined },
    { id: 'media', label: 'Media', icon: ImageIcon },
    { id: 'knowledge', label: 'Knowledge', icon: Network },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'ai', label: 'Ask AI', icon: Sparkles },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleSelectView = (view: ActiveView) => {
    setActiveView(view);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-30 md:hidden transition-opacity duration-300 animate-in fade-in"
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        id="rocn-sidebar"
        className={`
          fixed md:static inset-y-0 left-0 z-40
          bg-[#0d0e12] border-r border-[#1e222b] flex flex-col h-screen select-none shrink-0
          transition-all duration-300 ease-in-out
          ${isCollapsed ? 'md:w-18' : 'md:w-64'}
          ${isMobileOpen ? 'translate-x-0 w-72 shadow-2xl' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Brand Header */}
        <div className="p-3.5 border-b border-[#1e222b] flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2b3342] to-[#151820] border border-[#3b4557] flex items-center justify-center shadow-inner shrink-0">
              <span className="font-bold text-sm tracking-wider text-white font-mono-code">R</span>
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-bold text-sm tracking-tight text-white font-display">ROCNpad</h1>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1c222e] text-[#60a5fa] border border-[#2d3748] font-mono-code">
                    v1.2
                  </span>
                </div>
                <p className="text-[11px] text-[#6b7280] font-mono-code tracking-tight">Personal OS</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Desktop Collapse Button */}
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="hidden md:flex p-1.5 rounded-lg text-[#64748b] hover:text-white hover:bg-[#161a22] transition-colors"
                title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              >
                {isCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
              </button>
            )}

            {/* Mobile Close Button */}
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-[#64748b] hover:text-white hover:bg-[#161a22] transition-colors"
              title="Close Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Capture Primary Button */}
        <div className="p-3">
          <button
            id="btn-quick-capture-primary"
            onClick={() => {
              onOpenQuickCapture();
              if (onCloseMobile) onCloseMobile();
            }}
            className={`
              w-full bg-[#1b2230] hover:bg-[#263145] text-white border border-[#334155] rounded-lg
              py-2.5 flex items-center transition-all shadow-sm group active:scale-[0.99]
              ${isCollapsed ? 'justify-center px-2' : 'justify-between px-3.5'}
            `}
            title="New Quick Capture"
          >
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors shrink-0">
                <Plus className="w-3.5 h-3.5" />
              </div>
              {!isCollapsed && <span className="text-xs font-semibold tracking-wide">+ NEW CAPTURE</span>}
            </div>
            {!isCollapsed && (
              <kbd className="text-[10px] bg-[#0f131a] text-[#94a3b8] px-1.5 py-0.5 rounded border border-[#263040] font-mono-code">
                ⌘K
              </kbd>
            )}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-2 py-1.5 space-y-0.5 overflow-y-auto">
          {!isCollapsed && (
            <div className="text-[10px] font-semibold text-[#525d6e] uppercase tracking-wider px-3 py-1 font-mono-code">
              System Views
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => handleSelectView(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`
                  w-full flex items-center rounded-md text-xs font-medium transition-colors
                  ${isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'}
                  ${
                    isActive
                      ? 'bg-[#181d26] text-white font-semibold shadow-xs border border-[#2d3748]'
                      : 'text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-[#13161c]'
                  }
                `}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-[#64748b]'}`} />
                  {!isCollapsed && <span>{item.label}</span>}
                </div>
                {!isCollapsed && item.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono-code ${
                      isActive ? 'bg-blue-500/20 text-blue-300' : 'bg-[#171b22] text-[#64748b]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Ingest & Integrations */}
          {(onOpenReadwiseSync || onOpenMassUpload) && (
            <div className="pt-3 mt-2 border-t border-[#1a1e27] space-y-1">
              {!isCollapsed && (
                <div className="text-[10px] font-semibold text-[#525d6e] uppercase tracking-wider px-3 py-1 font-mono-code">
                  Integrations
                </div>
              )}

              {onOpenReadwiseSync && (
                <button
                  onClick={() => {
                    onOpenReadwiseSync();
                    if (onCloseMobile) onCloseMobile();
                  }}
                  title={isCollapsed ? 'Readwise Sync' : undefined}
                  className={`
                    w-full flex items-center rounded-md text-xs text-[#9ca3af] hover:text-amber-300 hover:bg-[#151922] transition-colors group
                    ${isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-1.5'}
                  `}
                >
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="w-4 h-4 text-amber-400/80 group-hover:text-amber-400 shrink-0" />
                    {!isCollapsed && <span>Readwise Sync</span>}
                  </div>
                  {!isCollapsed && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono-code">
                      v2
                    </span>
                  )}
                </button>
              )}

              {onOpenMassUpload && (
                <button
                  onClick={() => {
                    onOpenMassUpload();
                    if (onCloseMobile) onCloseMobile();
                  }}
                  title={isCollapsed ? 'Notebook Ingest' : undefined}
                  className={`
                    w-full flex items-center rounded-md text-xs text-[#9ca3af] hover:text-blue-300 hover:bg-[#151922] transition-colors group
                    ${isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-1.5'}
                  `}
                >
                  <div className="flex items-center gap-2.5">
                    <UploadCloud className="w-4 h-4 text-blue-400/80 group-hover:text-blue-400 shrink-0" />
                    {!isCollapsed && <span>Notebook Ingest</span>}
                  </div>
                  {!isCollapsed && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-mono-code">
                      bulk
                    </span>
                  )}
                </button>
              )}

              {onOpenGuide && (
                <button
                  onClick={() => {
                    onOpenGuide();
                    if (onCloseMobile) onCloseMobile();
                  }}
                  title={isCollapsed ? 'System Guide' : undefined}
                  className={`
                    w-full flex items-center rounded-md text-xs text-[#9ca3af] hover:text-white hover:bg-[#151922] transition-colors group
                    ${isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-1.5'}
                  `}
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-indigo-400/80 group-hover:text-indigo-300 shrink-0" />
                    {!isCollapsed && <span>System Guide</span>}
                  </div>
                  {!isCollapsed && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono-code">
                      tour
                    </span>
                  )}
                </button>
              )}
            </div>
          )}
        </nav>

        {/* Privacy & Engine Status Footer */}
        <div className="p-3 border-t border-[#1e222b] bg-[#0a0b0e]/60 space-y-2 text-xs">
          {!isCollapsed ? (
            <>
              <div className="flex items-center justify-between text-[11px] text-[#6b7280] font-mono-code">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span className="text-[#9ca3af]">LOCAL VAULT</span>
                </div>
                <span className="text-emerald-400 text-[10px] font-semibold">100% PRIVATE</span>
              </div>

              <div className="bg-[#12151c] p-2 rounded border border-[#1e222b] flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-[#94a3b8]">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>AI Provider</span>
                </div>
                <span className="text-[10px] font-mono-code text-[#cbd5e1] bg-[#1a202c] px-1.5 py-0.5 rounded">
                  Gemini 3.7
                </span>
              </div>
            </>
          ) : (
            <div className="flex justify-center" title="Local Vault: 100% Private">
              <Lock className="w-4 h-4 text-emerald-400" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
