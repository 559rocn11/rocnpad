import React, { useState } from 'react';
import {
  FolderKanban,
  Plus,
  FileText,
  CheckSquare,
  Sparkles,
  ArrowRight,
  Trash2,
  Edit2,
  Layers,
  X,
  Check,
} from 'lucide-react';
import { Project, NoteObject } from '../../types';

interface ProjectsViewProps {
  projects: Project[];
  notes: NoteObject[];
  onSelectNote: (note: NoteObject) => void;
  onSaveProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
  onOpenQuickCaptureForProject?: (projectId: string) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  notes,
  onSelectNote,
  onSaveProject,
  onDeleteProject,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#3b82f6');

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316'];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const newProj: Project = {
      id: `proj_${Date.now()}`,
      name: newProjectName.trim(),
      description: newProjectDesc.trim() || 'Custom project collection',
      color: newProjectColor,
      createdAt: new Date().toISOString(),
    };

    onSaveProject(newProj);
    setNewProjectName('');
    setNewProjectDesc('');
    setIsCreatingProject(false);
    setSelectedProjectId(newProj.id);
  };

  const activeProject = projects.find((p) => p.id === selectedProjectId);
  const projectNotes = selectedProjectId
    ? notes.filter((n) => n.project === selectedProjectId)
    : [];

  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#0b0c10]">
      {/* Header */}
      <div className="p-6 pb-4 border-b border-[#1c212c] bg-[#0d0f14]/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-white font-display">PROJECTS</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#181d28] text-blue-400 border border-[#2b354a] font-mono-code">
              {projects.length} Active
            </span>
          </div>
          <p className="text-xs text-[#717c91] font-mono-code mt-0.5">
            Group thoughts, research, specs, and action items by domain
          </p>
        </div>

        <button
          onClick={() => setIsCreatingProject(true)}
          className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Project</span>
        </button>
      </div>

      {/* New Project Modal */}
      {isCreatingProject && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#13161f] border border-[#262e40] rounded-xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#202738] pb-3">
              <h3 className="font-bold text-sm text-white font-display">Create New Project</h3>
              <button onClick={() => setIsCreatingProject(false)} className="text-[#94a3b8] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-mono-code text-[#64748b] block mb-1">Project Name</label>
                <input
                  type="text"
                  placeholder="e.g. ROCN Field Intelligence"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full bg-[#0b0d13] border border-[#202738] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono-code"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono-code text-[#64748b] block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Objectives, scope, and technical aims..."
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full bg-[#0b0d13] border border-[#202738] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 resize-none font-mono-code"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono-code text-[#64748b] block mb-1.5">Color Accent</label>
                <div className="flex items-center gap-2">
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewProjectColor(c)}
                      className={`w-6 h-6 rounded-full border transition-transform ${
                        newProjectColor === c ? 'scale-125 border-white' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingProject(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-[#94a3b8] hover:bg-[#1a202c]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newProjectName.trim()}
                  className="px-4 py-1.5 rounded-lg text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold disabled:opacity-40"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Grid: Projects List + Selected Project Inspector */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Project Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.map((proj) => {
              const pNotes = notes.filter((n) => n.project === proj.id);
              const pTasks = pNotes.flatMap((n) => n.tasks || []);
              const completedTasks = pTasks.filter((t) => t.completed).length;
              const isSelected = selectedProjectId === proj.id;

              return (
                <div
                  key={proj.id}
                  onClick={() => setSelectedProjectId(isSelected ? null : proj.id)}
                  className={`p-5 rounded-xl border transition-all cursor-pointer shadow-sm space-y-4 relative overflow-hidden ${
                    isSelected
                      ? 'bg-[#151924] border-blue-500/70 ring-1 ring-blue-500/40'
                      : 'bg-[#12141a] hover:bg-[#161a22] border-[#1e2330] hover:border-[#313c52]'
                  }`}
                >
                  {/* Top Color Accent Strip */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: proj.color }}
                  />

                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-3.5 h-3.5 rounded-full"
                        style={{ backgroundColor: proj.color }}
                      />
                      <h3 className="font-bold text-sm text-white font-display">{proj.name}</h3>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete project "${proj.name}"? (Associated notes will be kept)`)) {
                          onDeleteProject(proj.id);
                          if (selectedProjectId === proj.id) setSelectedProjectId(null);
                        }
                      }}
                      className="text-[#475569] hover:text-rose-400 p-1"
                      title="Delete Project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-[#94a3b8] leading-relaxed line-clamp-2">
                    {proj.description}
                  </p>

                  {/* Stats & Progress */}
                  <div className="space-y-2 pt-2 border-t border-[#1a1f2b]">
                    <div className="flex items-center justify-between text-[11px] font-mono-code text-[#64748b]">
                      <span>{pNotes.length} Notes</span>
                      <span>
                        Tasks: {completedTasks}/{pTasks.length}
                      </span>
                    </div>

                    {pTasks.length > 0 && (
                      <div className="w-full h-1 bg-[#1c2230] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.round((completedTasks / pTasks.length) * 100)}%`,
                            backgroundColor: proj.color,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Project Inspector */}
        <div className="bg-[#10131a] border border-[#1e2433] rounded-xl p-5 space-y-4">
          {activeProject ? (
            <div className="space-y-4">
              <div className="border-b border-[#1d2331] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: activeProject.color }} />
                  <h3 className="font-bold text-base text-white font-display">{activeProject.name}</h3>
                </div>
                <p className="text-xs text-[#94a3b8] mt-1">{activeProject.description}</p>
              </div>

              {/* Notes list in this project */}
              <div className="space-y-2">
                <div className="text-[11px] font-mono-code text-[#64748b] uppercase">
                  Project Notes ({projectNotes.length})
                </div>

                {projectNotes.length === 0 ? (
                  <div className="text-xs text-[#475569] italic p-3 text-center border border-dashed border-[#1f2535] rounded-lg">
                    No notes assigned to this project yet.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                    {projectNotes.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => onSelectNote(n)}
                        className="p-2.5 rounded-lg bg-[#141721] hover:bg-[#1a1f2c] border border-[#212838] cursor-pointer transition-colors space-y-1 group"
                      >
                        <div className="font-semibold text-xs text-white group-hover:text-blue-300 flex items-center justify-between">
                          <span className="truncate">{n.title}</span>
                          <ArrowRight className="w-3 h-3 text-[#475569] group-hover:text-blue-400 shrink-0" />
                        </div>
                        <p className="text-[11px] text-[#8590a6] line-clamp-1 font-mono-code">{n.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-[#64748b] space-y-2">
              <FolderKanban className="w-8 h-8 text-[#334155] mx-auto" />
              <p>Select any project on the left to view its connected notes and progress telemetry.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
