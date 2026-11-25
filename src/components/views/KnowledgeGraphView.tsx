import React, { useState, useEffect, useRef } from 'react';
import {
  Network,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Search,
  Layers,
  ArrowRight,
  Filter,
  FileText,
  Tag,
  Folder,
} from 'lucide-react';
import { NoteObject, Project } from '../../types';

interface KnowledgeGraphViewProps {
  notes: NoteObject[];
  projects: Project[];
  onSelectNote: (note: NoteObject) => void;
}

interface GraphNode {
  id: string;
  name: string;
  type: 'note' | 'project' | 'tag';
  color: string;
  radius: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  originalData?: NoteObject | Project | string;
}

interface GraphLink {
  source: string;
  target: string;
  type: 'project_member' | 'tag_shared' | 'direct_link';
}

export const KnowledgeGraphView: React.FC<KnowledgeGraphViewProps> = ({
  notes,
  projects,
  onSelectNote,
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'notes' | 'projects' | 'tags'>('all');

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const simulationRef = useRef<number | null>(null);

  // Build graph model
  useEffect(() => {
    const newNodes: GraphNode[] = [];
    const newLinks: GraphLink[] = [];
    const tagSet = new Set<string>();

    const width = 800;
    const height = 550;

    // 1. Project nodes
    projects.forEach((p, idx) => {
      const angle = (idx / (projects.length || 1)) * 2 * Math.PI;
      newNodes.push({
        id: `proj_${p.id}`,
        name: p.name,
        type: 'project',
        color: p.color || '#3b82f6',
        radius: 16,
        x: width / 2 + Math.cos(angle) * 180,
        y: height / 2 + Math.sin(angle) * 180,
        vx: 0,
        vy: 0,
        originalData: p,
      });
    });

    // 2. Note nodes & Tag collection
    notes.forEach((n, idx) => {
      const angle = (idx / (notes.length || 1)) * 2 * Math.PI;
      const dist = 100 + (idx % 3) * 60;
      const noteNodeId = `note_${n.id}`;

      newNodes.push({
        id: noteNodeId,
        name: n.title || 'Untitled',
        type: 'note',
        color: n.type === 'idea' ? '#f59e0b' : n.type === 'task' ? '#3b82f6' : '#94a3b8',
        radius: 10,
        x: width / 2 + Math.cos(angle) * dist + (Math.random() - 0.5) * 40,
        y: height / 2 + Math.sin(angle) * dist + (Math.random() - 0.5) * 40,
        vx: 0,
        vy: 0,
        originalData: n,
      });

      // Link note to project
      if (n.project) {
        newLinks.push({
          source: noteNodeId,
          target: `proj_${n.project}`,
          type: 'project_member',
        });
      }

      // Collect tags
      n.tags?.forEach((t) => {
        tagSet.add(t);
        newLinks.push({
          source: noteNodeId,
          target: `tag_${t}`,
          type: 'tag_shared',
        });
      });
    });

    // 3. Tag nodes
    Array.from(tagSet).forEach((t, idx) => {
      const angle = (idx / (tagSet.size || 1)) * 2 * Math.PI;
      newNodes.push({
        id: `tag_${t}`,
        name: `#${t}`,
        type: 'tag',
        color: '#818cf8',
        radius: 8,
        x: width / 2 + Math.cos(angle) * 260 + (Math.random() - 0.5) * 20,
        y: height / 2 + Math.sin(angle) * 260 + (Math.random() - 0.5) * 20,
        vx: 0,
        vy: 0,
        originalData: t,
      });
    });

    setNodes(newNodes);
    setLinks(newLinks);
  }, [notes, projects]);

  // Simple organic physics step
  useEffect(() => {
    if (nodes.length === 0) return;

    let iterations = 0;
    const runSimulation = () => {
      if (iterations > 60) return;
      iterations++;

      setNodes((currentNodes) => {
        const next = currentNodes.map((n) => ({ ...n }));

        // Repulsion between nodes
        for (let i = 0; i < next.length; i++) {
          for (let j = i + 1; j < next.length; j++) {
            const dx = next[j].x - next[i].x;
            const dy = next[j].y - next[i].y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            if (dist < 180) {
              const force = (180 - dist) / dist * 0.04;
              next[i].x -= dx * force;
              next[i].y -= dy * force;
              next[j].x += dx * force;
              next[j].y += dy * force;
            }
          }
        }

        // Attraction along links
        links.forEach((link) => {
          const s = next.find((n) => n.id === link.source);
          const t = next.find((n) => n.id === link.target);
          if (s && t) {
            const dx = t.x - s.x;
            const dy = t.y - s.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const targetDist = link.type === 'project_member' ? 90 : 130;
            const force = (dist - targetDist) * 0.03;
            s.x += (dx / dist) * force;
            s.y += (dy / dist) * force;
            t.x -= (dx / dist) * force;
            t.y -= (dy / dist) * force;
          }
        });

        return next;
      });

      simulationRef.current = requestAnimationFrame(runSimulation);
    };

    simulationRef.current = requestAnimationFrame(runSimulation);

    return () => {
      if (simulationRef.current) cancelAnimationFrame(simulationRef.current);
    };
  }, [links]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const filteredNodes = nodes.filter((n) => {
    const matchesSearch = n.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      filterType === 'all' ||
      (filterType === 'notes' && n.type === 'note') ||
      (filterType === 'projects' && n.type === 'project') ||
      (filterType === 'tags' && n.type === 'tag');
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#0a0c10]">
      {/* Top Header */}
      <div className="p-6 pb-4 border-b border-[#1c212c] bg-[#0d0f14]/80 backdrop-blur-md z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-white font-display">KNOWLEDGE GRAPH</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#181d28] text-blue-400 border border-[#2b354a] font-mono-code">
              {nodes.length} Nodes / {links.length} Links
            </span>
          </div>
          <p className="text-xs text-[#717c91] font-mono-code mt-0.5">
            2D Neural map showing connections between notes, projects, and thematic tags
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-[#13161f] border border-[#202736] rounded-lg p-0.5 text-xs text-[#94a3b8]">
            <button
              onClick={() => setZoom((z) => Math.min(z + 0.15, 2.5))}
              className="p-1.5 hover:text-white rounded hover:bg-[#1f2533]"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 font-mono-code text-[11px]">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.max(z - 0.15, 0.4))}
              className="p-1.5 hover:text-white rounded hover:bg-[#1f2533]"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              className="p-1.5 hover:text-white rounded hover:bg-[#1f2533]"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Filter Type */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="bg-[#13161f] border border-[#202736] text-xs text-[#cbd5e1] rounded-lg px-2.5 py-1.5 font-mono-code focus:outline-none"
          >
            <option value="all">All Nodes</option>
            <option value="notes">Notes Only</option>
            <option value="projects">Projects Only</option>
            <option value="tags">Tags Only</option>
          </select>
        </div>
      </div>

      {/* Main Canvas & Inspector View */}
      <div className="flex-1 flex relative overflow-hidden" ref={containerRef}>
        {/* SVG Interactive Canvas */}
        <div
          className="flex-1 cursor-grab active:cursor-grabbing relative overflow-hidden"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <svg className="w-full h-full">
            <g transform={`translate(${pan.x + 80}, ${pan.y + 40}) scale(${zoom})`}>
              {/* Links */}
              {links.map((link, idx) => {
                const s = nodes.find((n) => n.id === link.source);
                const t = nodes.find((n) => n.id === link.target);
                if (!s || !t) return null;

                const isConnectedToSelected =
                  selectedNode && (s.id === selectedNode.id || t.id === selectedNode.id);

                return (
                  <line
                    key={idx}
                    x1={s.x}
                    y1={s.y}
                    x2={t.x}
                    y2={t.y}
                    stroke={
                      isConnectedToSelected
                        ? '#60a5fa'
                        : link.type === 'project_member'
                        ? '#222d42'
                        : '#1a2233'
                    }
                    strokeWidth={isConnectedToSelected ? 2 : 1}
                    strokeDasharray={link.type === 'tag_shared' ? '3,3' : undefined}
                    opacity={isConnectedToSelected ? 0.9 : 0.6}
                  />
                );
              })}

              {/* Nodes */}
              {filteredNodes.map((node) => {
                const isSelected = selectedNode?.id === node.id;

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNode(node);
                    }}
                    className="cursor-pointer group"
                  >
                    {/* Pulsing ring if selected */}
                    {isSelected && (
                      <circle
                        r={node.radius + 6}
                        fill="none"
                        stroke="#60a5fa"
                        strokeWidth="2"
                        className="animate-pulse"
                      />
                    )}

                    {/* Node circle */}
                    <circle
                      r={node.radius}
                      fill={node.color}
                      stroke="#141822"
                      strokeWidth="2"
                      className="transition-transform group-hover:scale-125"
                    />

                    {/* Node label */}
                    <text
                      dy={node.radius + 12}
                      textAnchor="middle"
                      fill={isSelected ? '#ffffff' : '#94a3b8'}
                      fontSize="10"
                      fontFamily="monospace"
                      className="pointer-events-none select-none group-hover:fill-white font-medium"
                    >
                      {node.name.length > 20 ? `${node.name.slice(0, 18)}...` : node.name}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Legend Overlay */}
          <div className="absolute bottom-4 left-4 bg-[#11141c]/90 border border-[#1f2636] rounded-lg p-2.5 backdrop-blur-sm text-[10px] font-mono-code space-y-1 text-[#8590a6]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>Project / Tasks</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Ideas & Sparks</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
              <span>Tags (#thematic)</span>
            </div>
          </div>
        </div>

        {/* Right Node Inspector */}
        {selectedNode && (
          <div className="w-80 border-l border-[#1d222e] bg-[#0c0e14] p-5 space-y-4 overflow-y-auto z-10 shrink-0">
            <div className="border-b border-[#1d2331] pb-3 space-y-1">
              <div className="text-[10px] font-mono-code text-[#64748b] uppercase">
                {selectedNode.type} Node
              </div>
              <h3 className="font-bold text-sm text-white font-display">{selectedNode.name}</h3>
            </div>

            {selectedNode.type === 'note' && (
              <div className="space-y-3">
                <div className="p-3 bg-[#12151d] rounded-lg border border-[#1e2533] text-xs text-[#cbd5e1] font-mono-code line-clamp-6 leading-relaxed">
                  {(selectedNode.originalData as NoteObject)?.content}
                </div>

                <button
                  onClick={() => onSelectNote(selectedNode.originalData as NoteObject)}
                  className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <span>Open Full Note</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {selectedNode.type === 'project' && (
              <div className="space-y-2 text-xs text-[#94a3b8]">
                <p>{(selectedNode.originalData as Project)?.description}</p>
                <div className="text-[11px] font-mono-code text-[#64748b]">
                  Connected Notes: {links.filter((l) => l.target === selectedNode.id).length}
                </div>
              </div>
            )}

            {selectedNode.type === 'tag' && (
              <div className="space-y-2 text-xs text-[#94a3b8]">
                <p>Thematic tag indexing cross-document ideas.</p>
                <div className="text-[11px] font-mono-code text-[#64748b]">
                  Notes with this tag: {links.filter((l) => l.target === selectedNode.id).length}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
