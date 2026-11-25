import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { AuthGate } from './components/AuthGate';
import { TodayView } from './components/views/TodayView';
import { NotesView } from './components/views/NotesView';
import { ProjectsView } from './components/views/ProjectsView';
import { IdeasView } from './components/views/IdeasView';
import { TasksView } from './components/views/TasksView';
import { MediaView } from './components/views/MediaView';
import { KnowledgeGraphView } from './components/views/KnowledgeGraphView';
import { UniversalSearchView } from './components/views/UniversalSearchView';
import { AIIntelligenceView } from './components/views/AIIntelligenceView';
import { SettingsView } from './components/views/SettingsView';
import { NoteEditor } from './components/NoteEditor';
import { QuickCaptureModal } from './components/QuickCaptureModal';
import { DrawingModal } from './components/DrawingModal';
import { VoiceRecorderModal } from './components/VoiceRecorderModal';
import { CommandPalette } from './components/CommandPalette';
import { ReadingModeModal } from './components/ReadingModeModal';
import { ReadwiseSyncModal } from './components/ReadwiseSyncModal';
import { MassUploadModal } from './components/MassUploadModal';
import { WelcomeGuideModal } from './components/WelcomeGuideModal';
import { storage } from './services/storage';
import { NoteObject, Project, UserSettings, ActiveView, NoteType, TaskItem } from './types';
import { Lock, Unlock, ShieldAlert, Menu, Plus, Search, Sparkles, Command } from 'lucide-react';

function AppContent() {
  const [notes, setNotes] = useState<NoteObject[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    theme: 'dark',
    aiEnabled: true,
    localModelEnabled: true,
    fontSize: 'normal',
    isPinProtected: false,
  });
  const [activeView, setActiveView] = useState<ActiveView>('today');
  const [selectedNote, setSelectedNote] = useState<NoteObject | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [readingModeNote, setReadingModeNote] = useState<NoteObject | null>(null);

  // Mobile and responsive layout state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Modals state
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isDrawingModalOpen, setIsDrawingModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isReadwiseModalOpen, setIsReadwiseModalOpen] = useState(false);
  const [isMassUploadOpen, setIsMassUploadOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // PIN lock state
  const [isLocked, setIsLocked] = useState(false);
  const [pinEntry, setPinEntry] = useState('');
  const [pinError, setPinError] = useState(false);

  // Initial Load from Storage & First-Time Visitor Guide check
  useEffect(() => {
    const initApp = async () => {
      const storedSettings = await storage.getSettings();
      setSettings(storedSettings);
      if (storedSettings.isPinProtected && storedSettings.pinCode) {
        setIsLocked(true);
      }

      const storedProjects = await storage.getProjects();
      setProjects(storedProjects);

      const storedNotes = await storage.getNotes();
      setNotes(storedNotes);

      // Check if user has seen opening guide before
      const hasSeenGuide = localStorage.getItem('rocn_seen_welcome_guide');
      if (!hasSeenGuide) {
        setIsGuideOpen(true);
      }
    };

    initApp();
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CMD/Ctrl + K -> Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      // CMD/Ctrl + N -> Quick Capture
      else if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === 'n') {
        e.preventDefault();
        setIsQuickCaptureOpen(true);
      }
      // CMD/Ctrl + Shift + V -> Voice Recorder
      else if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        setIsVoiceModalOpen(true);
      }
      // CMD/Ctrl + Shift + D -> Drawing Canvas
      else if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        setIsDrawingModalOpen(true);
      }
      // Escape -> close open top modal
      else if (e.key === 'Escape') {
        if (isCommandPaletteOpen) setIsCommandPaletteOpen(false);
        else if (isQuickCaptureOpen) setIsQuickCaptureOpen(false);
        else if (isVoiceModalOpen) setIsVoiceModalOpen(false);
        else if (isDrawingModalOpen) setIsDrawingModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, isQuickCaptureOpen, isVoiceModalOpen, isDrawingModalOpen]);

  // Note CRUD Operations
  const handleSaveNote = async (updatedNote: NoteObject) => {
    await storage.saveNote(updatedNote);
    setNotes((prev) => {
      const idx = prev.findIndex((n) => n.id === updatedNote.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updatedNote;
        return next;
      }
      return [updatedNote, ...prev];
    });
    if (selectedNote?.id === updatedNote.id) {
      setSelectedNote(updatedNote);
    }
  };

  const handleDeleteNote = async (id: string) => {
    await storage.deleteNote(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (selectedNote?.id === id) {
      setSelectedNote(null);
      setIsEditorOpen(false);
    }
  };

  const handleSelectNote = (note: NoteObject) => {
    setSelectedNote(note);
    setIsEditorOpen(true);
  };

  const handleSelectNoteById = (id: string) => {
    const target = notes.find((n) => n.id === id);
    if (target) {
      setSelectedNote(target);
      setIsEditorOpen(true);
    }
  };

  // Quick Capture Creation Handler
  const handleQuickCaptureSave = async (data: {
    title: string;
    content: string;
    type: NoteType;
    tags: string[];
    project?: string;
    mediaUrl?: string;
    mediaMimeType?: string;
    codeLanguage?: string;
    tasks?: { id: string; text: string; completed: boolean; priority?: 'high' | 'normal' | 'low' }[];
  }) => {
    const newNote: NoteObject = {
      id: `note_${Date.now()}`,
      title: data.title || 'Untitled',
      content: data.content,
      type: data.type,
      tags: data.tags,
      project: data.project,
      mediaUrl: data.mediaUrl,
      mediaMimeType: data.mediaMimeType,
      codeLanguage: data.codeLanguage,
      tasks: data.tasks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await handleSaveNote(newNote);
  };

  // Drawing Save Handler
  const handleDrawingSave = async (dataUrl: string) => {
    const newDrawingNote: NoteObject = {
      id: `note_sketch_${Date.now()}`,
      title: `Canvas Sketch ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      content: 'Hand-drawn sketch diagram captured via ROCNpad Canvas.',
      type: 'drawing',
      mediaUrl: dataUrl,
      mediaMimeType: 'image/png',
      tags: ['sketch', 'visual'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await handleSaveNote(newDrawingNote);
  };

  // Voice Save Handler (with Auto Tasks and Multilingual Translation support)
  const handleVoiceSave = async (voiceData: {
    audioUrl: string;
    duration: number;
    transcript: string;
    title?: string;
    tasks?: TaskItem[];
    translation?: string;
    targetLanguage?: string;
  }) => {
    const formattedDate = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const noteTitle = voiceData.title?.trim() || `Voice Memo ${formattedDate}`;

    let noteContent = voiceData.transcript;
    if (voiceData.translation) {
      noteContent += `\n\n---\n**Translation (${voiceData.targetLanguage || 'Translated'}):**\n${voiceData.translation}`;
    }

    const tags = ['voice', 'memo'];
    if (voiceData.tasks && voiceData.tasks.length > 0) {
      tags.push('action');
    }
    if (voiceData.translation) {
      tags.push('translation');
    }

    const newVoiceNote: NoteObject = {
      id: `note_voice_${Date.now()}`,
      title: noteTitle,
      content: noteContent,
      type: 'voice',
      mediaUrl: voiceData.audioUrl,
      audioDuration: voiceData.duration,
      audioTranscript: voiceData.transcript,
      tasks: voiceData.tasks,
      tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await handleSaveNote(newVoiceNote);
  };

  // Task Toggle
  const handleToggleTask = async (noteId: string, taskId: string) => {
    const parent = notes.find((n) => n.id === noteId);
    if (!parent) return;

    const updatedTasks = (parent.tasks || []).map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );

    const updatedNote: NoteObject = {
      ...parent,
      tasks: updatedTasks,
      updatedAt: new Date().toISOString(),
    };

    await handleSaveNote(updatedNote);
  };

  // Task Adder directly to vault
  const handleAddTaskToVault = async (
    taskText: string,
    priority: 'high' | 'normal' | 'low',
    projectId?: string
  ) => {
    const newTaskNote: NoteObject = {
      id: `note_task_${Date.now()}`,
      title: taskText,
      content: `Action item: ${taskText}`,
      type: 'task',
      project: projectId,
      tasks: [
        {
          id: `task_${Date.now()}`,
          text: taskText,
          completed: false,
          priority,
        },
      ],
      tags: ['action', 'task'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await handleSaveNote(newTaskNote);
  };

  // Project Handlers
  const handleSaveProject = async (p: Project) => {
    await storage.saveProject(p);
    setProjects((prev) => {
      const idx = prev.findIndex((proj) => proj.id === p.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = p;
        return next;
      }
      return [...prev, p];
    });
  };

  const handleDeleteProject = async (id: string) => {
    await storage.deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  // Settings Handlers
  const handleUpdateSettings = async (newSettings: UserSettings) => {
    await storage.saveSettings(newSettings);
    setSettings(newSettings);
  };

  // Export / Import Handlers
  const handleExportJSON = async () => {
    const jsonStr = await storage.exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rocnpad_vault_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportMarkdown = async () => {
    const mdZipStr = await storage.exportMarkdownFiles();
    const blob = new Blob([mdZipStr], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rocnpad_archive_${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = async (importedData: any) => {
    await storage.importData(importedData);
    const reloadedNotes = await storage.getNotes();
    const reloadedProjects = await storage.getProjects();
    setNotes(reloadedNotes);
    setProjects(reloadedProjects);
  };

  const handleClearVault = async () => {
    await storage.clearVault();
    setNotes([]);
    setProjects([]);
  };

  // Batch import notes from Readwise or Mass Upload
  const handleBatchImportNotes = async (importedNotes: NoteObject[]) => {
    for (const note of importedNotes) {
      await storage.saveNote(note);
    }
    const freshNotes = await storage.getNotes();
    setNotes(freshNotes);
  };

  // PIN Unlock Check
  const handleUnlockPIN = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinEntry === settings.pinCode) {
      setIsLocked(false);
      setPinEntry('');
      setPinError(false);
    } else {
      setPinError(true);
      setPinEntry('');
    }
  };

  // Lock Screen Render
  if (isLocked) {
    return (
      <div className="fixed inset-0 bg-[#080a0f] flex items-center justify-center p-4 z-50">
        <div className="bg-[#12141c] border border-[#232a3b] rounded-2xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center space-y-5">
          <div className="w-12 h-12 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Lock className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white font-display tracking-tight">ROCNpad Protected</h2>
            <p className="text-xs text-[#717c91] font-mono-code">Enter your vault passcode to decrypt</p>
          </div>

          <form onSubmit={handleUnlockPIN} className="w-full space-y-4">
            <input
              type="password"
              maxLength={6}
              autoFocus
              placeholder="••••"
              value={pinEntry}
              onChange={(e) => setPinEntry(e.target.value)}
              className="w-full text-center text-2xl tracking-widest font-mono-code bg-[#0a0c10] border border-[#262f42] rounded-xl py-3 text-white focus:outline-none focus:border-blue-500"
            />

            {pinError && (
              <div className="text-xs text-rose-400 font-mono-code flex items-center justify-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Incorrect passcode</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs font-mono-code shadow-md active:scale-95 transition-all"
            >
              Unlock Vault
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#080a0f] text-[#e2e8f0]">
      {/* Sidebar Navigation with Mobile & Collapse support */}
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
        notesCount={notes.length}
        tasksPendingCount={notes.flatMap((n) => n.tasks || []).filter((t) => !t.completed).length}
        encryptionEnabled={settings.isPinProtected || false}
        onOpenReadwiseSync={() => setIsReadwiseModalOpen(true)}
        onOpenMassUpload={() => setIsMassUploadOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* Main Active View Container - expands to full width when sidebar is collapsed */}
      <main className="flex-1 min-w-0 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Top Navigation Bar (Shown on small screens < md) */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0d0f14] border-b border-[#1c212c] shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 rounded-lg bg-[#141822] hover:bg-[#1e2535] text-[#94a3b8] hover:text-white border border-[#222b3b] transition-colors focus:outline-none"
              aria-label="Open System Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white font-display">ROCNpad</span>
              <span className="text-[10px] uppercase font-mono-code px-2 py-0.5 rounded bg-[#161c28] text-blue-400 border border-[#222c3e]">
                {activeView}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveView('search')}
              className="p-2 rounded-lg bg-[#141822] hover:bg-[#1e2535] text-[#94a3b8] hover:text-white border border-[#222b3b] transition-colors"
              title="Search Knowledge"
              aria-label="Search"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="p-2 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 transition-colors"
              title="Command Palette"
              aria-label="Command Palette"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Floating Quick Capture Button (Mobile-First Input) */}
        <button
          onClick={() => setIsQuickCaptureOpen(true)}
          className="md:hidden fixed bottom-6 right-6 z-30 w-13 h-13 rounded-full bg-blue-600 hover:bg-blue-500 active:scale-95 text-white shadow-2xl shadow-blue-900/60 border border-blue-400/40 flex items-center justify-center transition-all duration-200 group"
          aria-label="Quick Capture Thought or Note"
          title="Quick Capture"
        >
          <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-200" />
          <span className="sr-only">Quick Capture</span>
        </button>

        {activeView === 'today' && (
          <TodayView
            notes={notes}
            projects={projects}
            onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
            onSelectNote={handleSelectNote}
            onToggleTask={handleToggleTask}
          />
        )}

        {activeView === 'notes' && (
          <NotesView
            notes={notes}
            projects={projects}
            onSelectNote={handleSelectNote}
            onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
            onOpenReadwiseSync={() => setIsReadwiseModalOpen(true)}
            onOpenMassUpload={() => setIsMassUploadOpen(true)}
            onOpenReadingMode={(note) => setReadingModeNote(note)}
          />
        )}

        {activeView === 'projects' && (
          <ProjectsView
            projects={projects}
            notes={notes}
            onSelectNote={handleSelectNote}
            onSaveProject={handleSaveProject}
            onDeleteProject={handleDeleteProject}
          />
        )}

        {activeView === 'ideas' && (
          <IdeasView
            notes={notes}
            projects={projects}
            onSelectNote={handleSelectNote}
            onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
            onUpdateNote={handleSaveNote}
          />
        )}

        {activeView === 'tasks' && (
          <TasksView
            notes={notes}
            projects={projects}
            onSelectNote={handleSelectNote}
            onToggleTask={handleToggleTask}
            onAddTaskToVault={handleAddTaskToVault}
          />
        )}

        {activeView === 'media' && (
          <MediaView notes={notes} onSelectNote={handleSelectNote} />
        )}

        {activeView === 'knowledge' && (
          <KnowledgeGraphView
            notes={notes}
            projects={projects}
            onSelectNote={handleSelectNote}
          />
        )}

        {activeView === 'search' && (
          <UniversalSearchView
            notes={notes}
            projects={projects}
            onSelectNote={handleSelectNote}
          />
        )}

        {activeView === 'ai' && (
          <AIIntelligenceView
            notes={notes}
            projects={projects}
            onSelectNote={handleSelectNote}
          />
        )}

        {activeView === 'settings' && (
          <SettingsView
            settings={settings}
            notes={notes}
            onUpdateSettings={handleUpdateSettings}
            onExportJSON={handleExportJSON}
            onExportMarkdown={handleExportMarkdown}
            onImportBackup={handleImportBackup}
            onClearVault={handleClearVault}
            onOpenReadwiseSync={() => setIsReadwiseModalOpen(true)}
            onOpenGuide={() => setIsGuideOpen(true)}
          />
        )}
      </main>

      {/* Note Editor Overlay Modal */}
      {selectedNote && isEditorOpen && (
        <NoteEditor
          note={selectedNote}
          allNotes={notes}
          projects={projects}
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setSelectedNote(null);
          }}
          onUpdateNote={handleSaveNote}
          onDeleteNote={handleDeleteNote}
          onSelectNoteById={handleSelectNoteById}
        />
      )}

      {/* Distraction-Free Reading Mode Modal */}
      {readingModeNote && (
        <ReadingModeModal
          note={readingModeNote}
          isOpen={!!readingModeNote}
          onClose={() => setReadingModeNote(null)}
        />
      )}

      {/* Readwise Sync Modal */}
      <ReadwiseSyncModal
        isOpen={isReadwiseModalOpen}
        onClose={() => setIsReadwiseModalOpen(false)}
        token={settings.readwiseToken}
        onImportNotes={handleBatchImportNotes}
      />

      {/* Notebook Mass Ingest Modal */}
      <MassUploadModal
        isOpen={isMassUploadOpen}
        onClose={() => setIsMassUploadOpen(false)}
        projects={projects}
        onImportNotes={handleBatchImportNotes}
      />

      {/* Welcome & First-Time Onboarding Guide */}
      <WelcomeGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
      />

      {/* Quick Capture Modal */}
      <QuickCaptureModal
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
        onSave={handleQuickCaptureSave}
        projects={projects}
        onOpenDrawingModal={() => setIsDrawingModalOpen(true)}
        onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
      />

      {/* Drawing Canvas Modal */}
      <DrawingModal
        isOpen={isDrawingModalOpen}
        onClose={() => setIsDrawingModalOpen(false)}
        onSave={handleDrawingSave}
      />

      {/* Voice Recorder Modal */}
      <VoiceRecorderModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onSave={handleVoiceSave}
      />

      {/* Command Palette (Cmd+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectView={setActiveView}
        onTriggerQuickCapture={() => setIsQuickCaptureOpen(true)}
        onTriggerVoiceModal={() => setIsVoiceModalOpen(true)}
        onTriggerDrawingModal={() => setIsDrawingModalOpen(true)}
        onTriggerRecap={() => setActiveView('today')}
        onTriggerLookBack={() => setActiveView('ai')}
        onExportJSON={handleExportJSON}
        onExportMarkdown={handleExportMarkdown}
        onTriggerReadwiseSync={() => setIsReadwiseModalOpen(true)}
        onTriggerMassUpload={() => setIsMassUploadOpen(true)}
        onTriggerGuide={() => setIsGuideOpen(true)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthGate>
      <AppContent />
    </AuthGate>
  );
}
