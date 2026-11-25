import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Type,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  BookOpen,
  List,
  ChevronUp,
  ChevronDown,
  Clock,
  Sparkles,
  AlignLeft,
  Settings2,
  HelpCircle,
} from 'lucide-react';
import { NoteObject, ReadingPreferences } from '../types';

interface ReadingModeModalProps {
  isOpen: boolean;
  note: NoteObject | null;
  onClose: () => void;
}

const DEFAULT_PREFERENCES: ReadingPreferences = {
  theme: 'obsidian',
  fontFamily: 'serif',
  fontSize: 'lg',
  lineHeight: 'relaxed',
  contentWidth: 'medium',
  autoScrollSpeed: 38, // px per sec
  enableZenHeader: true,
};

export const ReadingModeModal: React.FC<ReadingModeModalProps> = ({
  isOpen,
  note,
  onClose,
}) => {
  if (!isOpen || !note) return null;

  // Preferences State
  const [preferences, setPreferences] = useState<ReadingPreferences>(() => {
    try {
      const saved = localStorage.getItem('rocn_reading_preferences');
      return saved ? { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) } : DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  });

  // Auto-scroll States
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(preferences.autoScrollSpeed);
  const [scrollProgress, setScrollProgress] = useState(0);

  // UI Control Panel Toggles
  const [showSettings, setShowSettings] = useState(false);
  const [showToc, setShowToc] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isHudVisible, setIsHudVisible] = useState(true);

  // Speech Synthesis
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const hudTimeoutRef = useRef<number | null>(null);

  // Save preferences
  useEffect(() => {
    try {
      localStorage.setItem('rocn_reading_preferences', JSON.stringify({ ...preferences, autoScrollSpeed: scrollSpeed }));
    } catch {
      // ignore
    }
  }, [preferences, scrollSpeed]);

  // Compute Word Count & Estimated Reading Time
  const wordCount = useMemo(() => {
    if (!note.content) return 0;
    return note.content.trim().split(/\s+/).filter(Boolean).length;
  }, [note.content]);

  const totalMinutes = useMemo(() => {
    return Math.max(1, Math.ceil(wordCount / 220));
  }, [wordCount]);

  const remainingMinutes = useMemo(() => {
    const remainingFraction = 1 - (scrollProgress / 100);
    return Math.max(1, Math.ceil(totalMinutes * remainingFraction));
  }, [totalMinutes, scrollProgress]);

  // Extract Table of Contents from Markdown Headers
  const tocItems = useMemo(() => {
    if (!note.content) return [];
    const lines = note.content.split('\n');
    const items: { level: number; text: string; id: string }[] = [];
    
    lines.forEach((line) => {
      const match = line.match(/^(#{1,3})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        items.push({ level, text, id });
      }
    });
    return items;
  }, [note.content]);

  // Auto-scroll loop with requestAnimationFrame
  useEffect(() => {
    if (!isAutoScrolling) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      lastTimeRef.current = null;
      return;
    }

    const scrollStep = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaTime = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      if (containerRef.current) {
        const container = containerRef.current;
        const maxScroll = container.scrollHeight - container.clientHeight;
        
        if (container.scrollTop >= maxScroll - 2) {
          // Reached end of document
          setIsAutoScrolling(false);
          return;
        }

        container.scrollTop += scrollSpeed * deltaTime;
      }

      animFrameRef.current = requestAnimationFrame(scrollStep);
    };

    animFrameRef.current = requestAnimationFrame(scrollStep);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isAutoScrolling, scrollSpeed]);

  // Track Scroll Progress
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const maxScroll = scrollHeight - clientHeight;
    if (maxScroll <= 0) {
      setScrollProgress(100);
      return;
    }
    const progress = Math.min(100, Math.max(0, (scrollTop / maxScroll) * 100));
    setScrollProgress(progress);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Spacebar -> Toggle auto-scroll (unless typing in input)
      if (e.code === 'Space' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setIsAutoScrolling((prev) => !prev);
      }
      // Arrow Up -> Speed Up
      else if (e.code === 'ArrowUp' && (e.metaKey || e.ctrlKey || e.altKey)) {
        e.preventDefault();
        setScrollSpeed((prev) => Math.min(160, prev + 8));
      }
      // Arrow Down -> Speed Down
      else if (e.code === 'ArrowDown' && (e.metaKey || e.ctrlKey || e.altKey)) {
        e.preventDefault();
        setScrollSpeed((prev) => Math.max(12, prev - 8));
      }
      // F key -> Toggle Fullscreen
      else if (e.key === 'f' || e.key === 'F') {
        if (!(e.target instanceof HTMLInputElement)) {
          toggleFullScreen();
        }
      }
      // Escape -> Close
      else if (e.key === 'Escape') {
        if (showSettings) setShowSettings(false);
        else if (showToc) setShowToc(false);
        else onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSettings, showToc, onClose]);

  // Idle HUD auto-hide
  const handleMouseMove = () => {
    setIsHudVisible(true);
    if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current);
    if (isAutoScrolling) {
      hudTimeoutRef.current = window.setTimeout(() => {
        setIsHudVisible(false);
      }, 2800);
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullScreen(false);
    }
  };

  // Text to Speech
  const toggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser environment.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`${note.title}. ${note.content}`);
      utterance.rate = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Theme Styling Definitions
  const getThemeStyles = () => {
    switch (preferences.theme) {
      case 'sepia':
        return {
          bg: 'bg-[#181512]',
          text: 'text-[#e6dfd5]',
          heading: 'text-[#fbf6ee]',
          accent: 'text-[#d97706]',
          border: 'border-[#332a22]',
          muted: 'text-[#a89f91]',
          card: 'bg-[#211d18]',
          highlightBg: 'bg-[#3b3226]',
          progressBar: 'bg-[#d97706]',
        };
      case 'midnight':
        return {
          bg: 'bg-[#090e17]',
          text: 'text-[#cbd5e1]',
          heading: 'text-[#f8fafc]',
          accent: 'text-[#38bdf8]',
          border: 'border-[#1e293b]',
          muted: 'text-[#64748b]',
          card: 'bg-[#0f172a]',
          highlightBg: 'bg-[#1e293b]/70',
          progressBar: 'bg-[#38bdf8]',
        };
      case 'slate':
        return {
          bg: 'bg-[#0f172a]',
          text: 'text-[#e2e8f0]',
          heading: 'text-white',
          accent: 'text-[#60a5fa]',
          border: 'border-[#334155]',
          muted: 'text-[#94a3b8]',
          card: 'bg-[#1e293b]',
          highlightBg: 'bg-[#334155]/60',
          progressBar: 'bg-[#60a5fa]',
        };
      case 'obsidian':
      default:
        return {
          bg: 'bg-[#08090c]',
          text: 'text-[#d1d5db]',
          heading: 'text-[#f3f4f6]',
          accent: 'text-[#3b82f6]',
          border: 'border-[#1a1d26]',
          muted: 'text-[#6b7280]',
          card: 'bg-[#11131a]',
          highlightBg: 'bg-[#1c202d]',
          progressBar: 'bg-[#3b82f6]',
        };
    }
  };

  const themeStyle = getThemeStyles();

  // Typography Class Resolver
  const getFontFamilyClass = () => {
    switch (preferences.fontFamily) {
      case 'serif':
        return 'font-serif tracking-normal leading-[1.8]';
      case 'mono':
        return 'font-mono text-[14px] leading-[1.7]';
      case 'display':
        return 'font-display tracking-tight leading-[1.75]';
      case 'sans':
      default:
        return 'font-sans tracking-[-0.012em] leading-[1.75]';
    }
  };

  const getFontSizeClass = () => {
    switch (preferences.fontSize) {
      case 'sm':
        return 'text-[15px]';
      case 'lg':
        return 'text-[19px]';
      case 'xl':
        return 'text-[22px]';
      case '2xl':
        return 'text-[26px]';
      case 'md':
      default:
        return 'text-[17px]';
    }
  };

  const getContentWidthClass = () => {
    switch (preferences.contentWidth) {
      case 'narrow':
        return 'max-w-xl'; // ~576px
      case 'wide':
        return 'max-w-4xl'; // ~896px
      case 'full':
        return 'max-w-5xl';
      case 'medium':
      default:
        return 'max-w-2xl'; // ~672px
    }
  };

  // Scroll to section in TOC
  const scrollToHeader = (text: string) => {
    if (!containerRef.current) return;
    const elements = containerRef.current.querySelectorAll('h1, h2, h3, h4');
    for (let i = 0; i < elements.length; i++) {
      if (elements[i].textContent?.toLowerCase().includes(text.toLowerCase())) {
        elements[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
        setShowToc(false);
        break;
      }
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col ${themeStyle.bg} select-text transition-colors duration-300`}
      onMouseMove={handleMouseMove}
    >
      {/* Top Reading Progress Bar */}
      <div className="w-full h-1 bg-black/40 relative z-40 overflow-hidden">
        <div
          className={`h-full ${themeStyle.progressBar} transition-all duration-150 ease-out`}
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Floating Dynamic HUD Header (Auto-Hiding) */}
      <header
        className={`absolute top-0 left-0 right-0 z-30 transition-all duration-300 ${
          isHudVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        } backdrop-blur-md bg-[#08090c]/70 border-b ${themeStyle.border} px-5 py-3`}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Left: Reading Stats & TOC Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              title="Exit Reading Mode (Esc)"
              className="p-2 rounded-lg bg-[#141822] hover:bg-[#1f2638] text-[#94a3b8] hover:text-white border border-[#232b3e] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {tocItems.length > 0 && (
              <button
                onClick={() => setShowToc(!showToc)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono-code flex items-center gap-1.5 border transition-all ${
                  showToc
                    ? 'bg-blue-600/20 text-blue-400 border-blue-500/40'
                    : 'bg-[#141822] text-[#94a3b8] hover:text-white border-[#232b3e]'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Outline ({tocItems.length})</span>
              </button>
            )}

            <div className="hidden sm:flex items-center gap-3 text-xs font-mono-code text-[#64748b] border-l border-[#1f2638] pl-3">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#94a3b8]" />
                <span>~{remainingMinutes}m left</span>
              </span>
              <span>•</span>
              <span>{wordCount} words</span>
              <span>•</span>
              <span>{Math.round(scrollProgress)}%</span>
            </div>
          </div>

          {/* Center: Auto-Scroll Quick Controls */}
          <div className="flex items-center gap-2 bg-[#121620] border border-[#232c3f] rounded-full px-3 py-1 shadow-lg">
            <button
              onClick={() => setIsAutoScrolling(!isAutoScrolling)}
              title="Toggle Auto-Scroll (Spacebar)"
              className={`p-1.5 rounded-full transition-all ${
                isAutoScrolling
                  ? 'bg-emerald-500 text-white shadow-emerald-500/30 shadow-md animate-pulse'
                  : 'bg-[#1c2333] text-white hover:bg-[#283248]'
              }`}
            >
              {isAutoScrolling ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
            </button>

            <div className="flex items-center gap-1 text-[11px] font-mono-code text-[#94a3b8]">
              <span className="text-white font-semibold">{scrollSpeed}</span>
              <span className="text-[10px] text-[#64748b]">px/s</span>
            </div>

            <div className="flex items-center gap-0.5 border-l border-[#242e42] pl-1.5">
              <button
                onClick={() => setScrollSpeed((s) => Math.max(12, s - 6))}
                title="Decrease Speed (Ctrl+Down)"
                className="p-1 hover:text-white text-[#818ea8]"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
              <button
                onClick={() => setScrollSpeed((s) => Math.min(160, s + 6))}
                title="Increase Speed (Ctrl+Up)"
                className="p-1 hover:text-white text-[#818ea8]"
              >
                <ChevronUp className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Right: Tools & Settings */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSpeech}
              title={isSpeaking ? 'Stop Read Aloud' : 'Read Aloud with Voice'}
              className={`p-2 rounded-lg border transition-all ${
                isSpeaking
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-[#141822] text-[#94a3b8] hover:text-white border-[#232b3e]'
              }`}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              title="Typography & Appearance"
              className={`p-2 rounded-lg border transition-all ${
                showSettings
                  ? 'bg-blue-600/20 text-blue-400 border-blue-500/40'
                  : 'bg-[#141822] text-[#94a3b8] hover:text-white border-[#232b3e]'
              }`}
            >
              <Type className="w-4 h-4" />
            </button>

            <button
              onClick={toggleFullScreen}
              title="Toggle Fullscreen (F)"
              className="p-2 rounded-lg bg-[#141822] hover:bg-[#1f2638] text-[#94a3b8] hover:text-white border border-[#232b3e] transition-colors"
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Floating TOC Sidebar / Modal */}
      {showToc && (
        <aside className="absolute left-6 top-16 z-40 w-72 max-h-[75vh] overflow-y-auto rounded-xl bg-[#0e1117]/95 border border-[#222a3a] shadow-2xl p-4 backdrop-blur-xl animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-3 border-b border-[#1c2230] mb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white font-display uppercase tracking-wider">
              <List className="w-3.5 h-3.5 text-blue-400" />
              <span>Document Outline</span>
            </div>
            <button
              onClick={() => setShowToc(false)}
              className="text-[#64748b] hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1 text-xs">
            {tocItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => scrollToHeader(item.text)}
                style={{ paddingLeft: `${(item.level - 1) * 12 + 8}px` }}
                className="w-full text-left py-1.5 pr-2 rounded hover:bg-[#171d2b] text-[#94a3b8] hover:text-white truncate transition-colors font-mono-code"
              >
                {item.text}
              </button>
            ))}
          </div>
        </aside>
      )}

      {/* Typography & Appearance Popover Panel */}
      {showSettings && (
        <div className="absolute right-6 top-16 z-40 w-80 rounded-xl bg-[#0e1117]/95 border border-[#222a3a] shadow-2xl p-5 backdrop-blur-xl space-y-4 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-2 border-b border-[#1c2230]">
            <div className="flex items-center gap-2 text-xs font-bold text-white font-display uppercase tracking-wider">
              <Type className="w-3.5 h-3.5 text-blue-400" />
              <span>Typography & View</span>
            </div>
            <button
              onClick={() => setShowSettings(false)}
              className="text-[#64748b] hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Theme Preset */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono-code text-[#64748b] uppercase block">
              Color Canvas
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'obsidian', label: 'Obsidian Velvet', bg: 'bg-[#08090c] border-[#222]' },
                { id: 'sepia', label: 'Warm Sepia', bg: 'bg-[#181512] border-[#332a22]' },
                { id: 'midnight', label: 'Midnight Blue', bg: 'bg-[#090e17] border-[#1e293b]' },
                { id: 'slate', label: 'Clean Slate', bg: 'bg-[#0f172a] border-[#334155]' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setPreferences({ ...preferences, theme: t.id as any })}
                  className={`px-2.5 py-2 rounded-lg text-xs font-medium border text-left flex items-center gap-2 transition-all ${
                    preferences.theme === t.id
                      ? 'border-blue-500 text-white bg-blue-500/10'
                      : 'border-[#1f2535] text-[#94a3b8] hover:text-white bg-[#13161f]'
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full border ${t.bg}`} />
                  <span className="truncate">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Font Type */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono-code text-[#64748b] uppercase block">
              Typeface
            </label>
            <div className="grid grid-cols-4 gap-1 text-xs">
              {[
                { id: 'serif', label: 'Serif' },
                { id: 'sans', label: 'Sans' },
                { id: 'display', label: 'Display' },
                { id: 'mono', label: 'Mono' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setPreferences({ ...preferences, fontFamily: f.id as any })}
                  className={`py-1.5 rounded-lg border text-center transition-all ${
                    preferences.fontFamily === f.id
                      ? 'border-blue-500 text-white bg-blue-500/15 font-bold'
                      : 'border-[#1f2535] text-[#94a3b8] hover:text-white bg-[#13161f]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size & Line Height */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono-code text-[#64748b] uppercase block">
                Font Scale
              </label>
              <div className="flex items-center justify-between bg-[#13161f] border border-[#1f2535] rounded-lg p-1">
                {(['sm', 'md', 'lg', 'xl', '2xl'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setPreferences({ ...preferences, fontSize: s })}
                    className={`px-2 py-1 rounded text-xs transition-all ${
                      preferences.fontSize === s
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-[#8492a6] hover:text-white'
                    }`}
                  >
                    {s.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono-code text-[#64748b] uppercase block">
                Line Spacing
              </label>
              <div className="flex items-center justify-between bg-[#13161f] border border-[#1f2535] rounded-lg p-1">
                {(['tight', 'relaxed', 'loose'] as const).map((lh) => (
                  <button
                    key={lh}
                    onClick={() => setPreferences({ ...preferences, lineHeight: lh })}
                    className={`px-2 py-1 rounded text-xs capitalize transition-all ${
                      preferences.lineHeight === lh
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-[#8492a6] hover:text-white'
                    }`}
                  >
                    {lh}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Width of Reading Column */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono-code text-[#64748b] uppercase block">
              Column Width
            </label>
            <div className="grid grid-cols-4 gap-1 text-xs">
              {(['narrow', 'medium', 'wide', 'full'] as const).map((w) => (
                <button
                  key={w}
                  onClick={() => setPreferences({ ...preferences, contentWidth: w })}
                  className={`py-1.5 rounded-lg border text-center capitalize transition-all ${
                    preferences.contentWidth === w
                      ? 'border-blue-500 text-white bg-blue-500/15 font-bold'
                      : 'border-[#1f2535] text-[#94a3b8] hover:text-white bg-[#13161f]'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          {/* Speed slider in panel */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center text-[11px] font-mono-code text-[#64748b]">
              <span>Auto-Scroll Pace</span>
              <span className="text-white">{scrollSpeed} px/sec</span>
            </div>
            <input
              type="range"
              min={15}
              max={150}
              step={5}
              value={scrollSpeed}
              onChange={(e) => setScrollSpeed(Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Main Reading Canvas Viewport */}
      <main
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto pt-20 pb-36 px-6 sm:px-12 scroll-smooth"
      >
        <article
          ref={contentRef}
          className={`mx-auto ${getContentWidthClass()} ${getFontFamilyClass()} ${getFontSizeClass()} transition-all duration-200`}
        >
          {/* Note Metadata Header */}
          <header className="mb-10 pb-8 border-b border-white/5 space-y-4">
            {note.tags && note.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {note.tags.map((t) => (
                  <span
                    key={t}
                    className={`text-xs px-2.5 py-0.5 rounded-full ${themeStyle.highlightBg} ${themeStyle.accent} font-mono-code border border-white/5`}
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}

            <h1 className={`text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight ${themeStyle.heading} font-display leading-[1.2]`}>
              {note.title || 'Untitled Document'}
            </h1>

            <div className={`flex flex-wrap items-center gap-4 text-xs font-mono-code ${themeStyle.muted}`}>
              <span>Published: {new Date(note.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              {note.project && <span>• Project: {note.project}</span>}
              <span>• {wordCount} words (~{totalMinutes} min read)</span>
            </div>

            {/* Note Executive Summary if present */}
            {note.summary && (
              <div className={`p-4 rounded-xl ${themeStyle.card} border ${themeStyle.border} space-y-2 mt-4`}>
                <div className="flex items-center gap-1.5 text-xs font-bold font-mono-code text-blue-400 uppercase tracking-wide">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Key Summary</span>
                </div>
                <p className={`text-sm italic leading-relaxed ${themeStyle.text}`}>
                  {note.summary}
                </p>
              </div>
            )}
          </header>

          {/* Media Header (if attached) */}
          {note.mediaUrl && note.mediaMimeType?.startsWith('image/') && (
            <figure className="my-8 rounded-xl overflow-hidden border border-white/10 shadow-2xl">
              <img
                src={note.mediaUrl}
                alt={note.title}
                className="w-full max-h-[480px] object-cover"
                referrerPolicy="no-referrer"
              />
            </figure>
          )}

          {/* Main Long-form Document Body */}
          <div
            className={`space-y-6 ${themeStyle.text} whitespace-pre-wrap selection:bg-blue-500/30 selection:text-white`}
          >
            {note.content ? (
              note.content
            ) : (
              <p className="italic text-[#64748b]">No text content in this note.</p>
            )}
          </div>

          {/* Tasks checklist section if tasks exist */}
          {note.tasks && note.tasks.length > 0 && (
            <section className="mt-12 pt-8 border-t border-white/5 space-y-3">
              <h3 className={`text-lg font-bold ${themeStyle.heading} font-display`}>
                Action Items ({note.tasks.length})
              </h3>
              <div className="space-y-2">
                {note.tasks.map((t) => (
                  <div
                    key={t.id}
                    className={`flex items-center gap-3 p-3 rounded-lg ${themeStyle.card} border ${themeStyle.border} text-sm`}
                  >
                    <span
                      className={`w-4 h-4 rounded flex items-center justify-center text-[10px] border ${
                        t.completed
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold'
                          : 'border-[#3f4a61]'
                      }`}
                    >
                      {t.completed ? '✓' : ''}
                    </span>
                    <span className={t.completed ? 'line-through opacity-50' : ''}>{t.text}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* End of Note Marker */}
          <footer className="mt-20 pt-10 border-t border-white/5 text-center text-xs font-mono-code text-[#64748b]">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5">
              <span>✦ End of Record</span>
              <span>•</span>
              <button
                onClick={() => {
                  if (containerRef.current) {
                    containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="text-blue-400 hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Return to Top</span>
              </button>
            </div>
          </footer>
        </article>
      </main>

      {/* Floating Bottom HUD Controls */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-30 transition-all duration-300 ${
          isHudVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3 bg-[#0d1017]/90 backdrop-blur-xl border border-[#222b3d] rounded-full px-4 py-2 shadow-2xl text-xs font-mono-code text-[#94a3b8]">
          <button
            onClick={() => setIsAutoScrolling(!isAutoScrolling)}
            className={`px-3 py-1 rounded-full font-bold flex items-center gap-1.5 transition-all ${
              isAutoScrolling
                ? 'bg-emerald-500 text-white shadow-emerald-500/40 shadow-sm'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {isAutoScrolling ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isAutoScrolling ? 'Auto-Scrolling' : 'Start Auto-Scroll'}</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 border-l border-[#242d40] pl-3">
            <span>Pace:</span>
            <input
              type="range"
              min={15}
              max={150}
              step={5}
              value={scrollSpeed}
              onChange={(e) => setScrollSpeed(Number(e.target.value))}
              className="w-24 accent-blue-500"
            />
            <span className="text-white min-w-[35px]">{scrollSpeed} px</span>
          </div>

          <div className="border-l border-[#242d40] pl-3 flex items-center gap-2">
            <span className="text-white font-semibold">{Math.round(scrollProgress)}%</span>
            <span className="text-[10px] text-[#64748b]">read</span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded hover:text-white ml-1"
            title="Exit Reading Mode"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
