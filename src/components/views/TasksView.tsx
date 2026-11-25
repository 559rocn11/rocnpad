import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Check,
  Calendar,
  AlertCircle,
  Folder,
  ArrowRight,
  Filter,
  FileText,
} from 'lucide-react';
import { NoteObject, Project, TaskItem } from '../../types';

interface TasksViewProps {
  notes: NoteObject[];
  projects: Project[];
  onSelectNote: (note: NoteObject) => void;
  onToggleTask: (noteId: string, taskId: string) => void;
  onAddTaskToVault: (taskText: string, priority: 'high' | 'normal' | 'low', projectId?: string) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  notes,
  projects,
  onSelectNote,
  onToggleTask,
  onAddTaskToVault,
}) => {
  const [filterStatus, setFilterStatus] = useState<'active' | 'completed' | 'all'>('active');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [newTaskInput, setNewTaskInput] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'normal' | 'high' | 'low'>('normal');
  const [newTaskProj, setNewTaskProj] = useState('');

  // Flatten all tasks from notes
  interface FlattenedTask extends TaskItem {
    parentNoteId: string;
    parentNoteTitle: string;
    project?: string;
  }

  const allTasks: FlattenedTask[] = notes.flatMap((note) =>
    (note.tasks || []).map((t) => ({
      ...t,
      parentNoteId: note.id,
      parentNoteTitle: note.title,
      project: note.project,
    }))
  );

  const filteredTasks = allTasks.filter((t) => {
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && !t.completed) ||
      (filterStatus === 'completed' && t.completed);

    const matchesPriority = filterPriority === 'all' || t.priority === filterPriority;
    const matchesProject = selectedProjectId === 'all' || t.project === selectedProjectId;

    return matchesStatus && matchesPriority && matchesProject;
  });

  const activeCount = allTasks.filter((t) => !t.completed).length;
  const completedCount = allTasks.filter((t) => t.completed).length;

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;

    onAddTaskToVault(newTaskInput.trim(), newTaskPriority, newTaskProj || undefined);
    setNewTaskInput('');
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#0b0c10]">
      {/* Header */}
      <div className="p-6 pb-4 border-b border-[#1c212c] bg-[#0d0f14]/80 backdrop-blur-md sticky top-0 z-10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight text-white font-display">ACTION TASKS</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#181d28] text-blue-400 border border-[#2b354a] font-mono-code">
                {activeCount} Pending / {completedCount} Done
              </span>
            </div>
            <p className="text-xs text-[#717c91] font-mono-code mt-0.5">
              Aggregated action items, deliverables, and checklists across all notes
            </p>
          </div>
        </div>

        {/* Quick Add Task Input */}
        <form onSubmit={handleCreateTask} className="flex flex-wrap items-center gap-2 bg-[#12141c] p-2 rounded-xl border border-[#1f2636]">
          <input
            type="text"
            placeholder="Add an actionable task..."
            value={newTaskInput}
            onChange={(e) => setNewTaskInput(e.target.value)}
            className="flex-1 bg-transparent px-2.5 py-1 text-xs text-white placeholder:text-[#4b5563] focus:outline-none font-mono-code"
          />

          <select
            value={newTaskPriority}
            onChange={(e) => setNewTaskPriority(e.target.value as any)}
            className="bg-[#181d28] text-xs text-[#cbd5e1] rounded px-2 py-1 border border-[#283244] focus:outline-none font-mono-code"
          >
            <option value="normal">Normal</option>
            <option value="high">High 🔥</option>
            <option value="low">Low</option>
          </select>

          <select
            value={newTaskProj}
            onChange={(e) => setNewTaskProj(e.target.value)}
            className="bg-[#181d28] text-xs text-[#cbd5e1] rounded px-2 py-1 border border-[#283244] focus:outline-none font-mono-code"
          >
            <option value="">No Project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={!newTaskInput.trim()}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1 shadow-sm active:scale-95 disabled:opacity-40"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </form>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Status Tabs */}
          <div className="flex items-center bg-[#12141c] border border-[#1e2433] rounded-lg p-0.5 font-mono-code">
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-3 py-1 rounded ${
                filterStatus === 'active' ? 'bg-[#232b3b] text-white font-semibold' : 'text-[#717c91]'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-3 py-1 rounded ${
                filterStatus === 'completed' ? 'bg-[#232b3b] text-white font-semibold' : 'text-[#717c91]'
              }`}
            >
              Completed ({completedCount})
            </button>
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded ${
                filterStatus === 'all' ? 'bg-[#232b3b] text-white font-semibold' : 'text-[#717c91]'
              }`}
            >
              All ({allTasks.length})
            </button>
          </div>

          {/* Priority */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-[#12141c] border border-[#1e2433] text-xs text-[#cbd5e1] rounded-lg px-2.5 py-1 font-mono-code focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority 🔥</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>

          {/* Project */}
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-[#12141c] border border-[#1e2433] text-xs text-[#cbd5e1] rounded-lg px-2.5 py-1 font-mono-code focus:outline-none"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tasks List */}
      <div className="p-6 max-w-4xl w-full mx-auto space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-[#1f2533] rounded-2xl bg-[#0d0f14]/50 space-y-3">
            <CheckSquare className="w-8 h-8 text-[#475569] mx-auto" />
            <h4 className="text-sm font-semibold text-white">No tasks match this filter</h4>
            <p className="text-xs text-[#64748b] max-w-sm mx-auto">
              Add new tasks using the bar above or inline checklist formatting inside any note.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTasks.map((task) => {
              const parentNote = notes.find((n) => n.id === task.parentNoteId);
              const proj = projects.find((p) => p.id === task.project);

              return (
                <div
                  key={task.id}
                  onClick={() => onToggleTask(task.parentNoteId, task.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 group ${
                    task.completed
                      ? 'bg-[#0f1118]/60 border-[#191e2b] text-[#556073]'
                      : 'bg-[#12141a] hover:bg-[#161a22] border-[#1e2330] hover:border-[#313c52] text-[#e2e8f0]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                        task.completed ? 'bg-blue-600 border-blue-500 text-white' : 'border-[#475569] group-hover:border-blue-400'
                      }`}
                    >
                      {task.completed && <Check className="w-3 h-3" />}
                    </div>

                    <span
                      className={`text-xs font-mono-code font-medium ${
                        task.completed ? 'line-through text-[#556073]' : 'text-white'
                      }`}
                    >
                      {task.text}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-xs font-mono-code">
                    {task.priority === 'high' && (
                      <span className="text-[10px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                        HIGH
                      </span>
                    )}

                    {proj && (
                      <span className="text-[11px] text-[#94a3b8] hidden sm:flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: proj.color }} />
                        <span>{proj.name}</span>
                      </span>
                    )}

                    {parentNote && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectNote(parentNote);
                        }}
                        className="text-[11px] text-[#64748b] hover:text-blue-400 flex items-center gap-1"
                        title="View Note Context"
                      >
                        <FileText className="w-3 h-3" />
                        <span className="hidden md:inline truncate max-w-[120px]">
                          {parentNote.title}
                        </span>
                      </button>
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
