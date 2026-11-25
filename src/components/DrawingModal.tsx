import React, { useRef, useState, useEffect } from 'react';
import { X, Eraser, PenTool, RotateCcw, Check, Download } from 'lucide-react';

interface DrawingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
}

export const DrawingModal: React.FC<DrawingModalProps> = ({ isOpen, onClose, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#3b82f6');
  const [lineWidth, setLineWidth] = useState(3);
  const [mode, setMode] = useState<'pen' | 'eraser'>('pen');
  const [history, setHistory] = useState<ImageData[]>([]);

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#e2e8f0', '#ef4444'];

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#101216';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // save initial state
        setHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)]);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.strokeStyle = mode === 'eraser' ? '#101216' : color;
    ctx.lineWidth = mode === 'eraser' ? lineWidth * 4 : lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      setHistory((prev) => [...prev.slice(-15), ctx.getImageData(0, 0, canvas.width, canvas.height)]);
    }
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newHistory = [...history];
    newHistory.pop(); // remove current state
    const previousState = newHistory[newHistory.length - 1];
    ctx.putImageData(previousState, 0, 0);
    setHistory(newHistory);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#101216';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)]);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#14161d] border border-[#262c3a] rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-3 border-b border-[#202533] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PenTool className="w-4 h-4 text-blue-400" />
            <h3 className="font-semibold text-sm text-white font-display">ROCN Canvas Sketchpad</h3>
          </div>
          <button onClick={onClose} className="text-[#94a3b8] hover:text-white p-1 rounded hover:bg-[#1f2430]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-2.5 bg-[#0e1015] border-b border-[#202533] flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Tools */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setMode('pen')}
              className={`p-1.5 rounded flex items-center gap-1 ${
                mode === 'pen' ? 'bg-blue-600/30 text-blue-400 border border-blue-500/50' : 'text-[#94a3b8] hover:bg-[#1a1e28]'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Pen</span>
            </button>
            <button
              onClick={() => setMode('eraser')}
              className={`p-1.5 rounded flex items-center gap-1 ${
                mode === 'eraser' ? 'bg-blue-600/30 text-blue-400 border border-blue-500/50' : 'text-[#94a3b8] hover:bg-[#1a1e28]'
              }`}
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>Eraser</span>
            </button>
            <div className="h-4 w-px bg-[#262c3a] mx-1" />
            <button
              onClick={handleUndo}
              disabled={history.length <= 1}
              className="p-1.5 rounded text-[#94a3b8] hover:bg-[#1a1e28] disabled:opacity-40 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Undo</span>
            </button>
            <button
              onClick={handleClear}
              className="p-1.5 rounded text-[#94a3b8] hover:text-rose-400 hover:bg-[#1a1e28]"
            >
              Clear
            </button>
          </div>

          {/* Colors & Width */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setColor(c);
                    setMode('pen');
                  }}
                  className={`w-5 h-5 rounded-full border transition-transform ${
                    color === c && mode === 'pen' ? 'scale-125 border-white' : 'border-transparent hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            <div className="h-4 w-px bg-[#262c3a] mx-1" />

            <div className="flex items-center gap-1 text-[#94a3b8]">
              <span className="text-[10px] font-mono-code">Size:</span>
              <input
                type="range"
                min="1"
                max="16"
                value={lineWidth}
                onChange={(e) => setLineWidth(Number(e.target.value))}
                className="w-16 h-1 bg-[#262c3a] rounded appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 p-3 flex items-center justify-center bg-[#0b0c10] overflow-hidden">
          <canvas
            ref={canvasRef}
            width={720}
            height={420}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="border border-[#232938] rounded-lg shadow-inner cursor-crosshair touch-none bg-[#101216]"
          />
        </div>

        {/* Actions Footer */}
        <div className="p-3 border-t border-[#202533] flex items-center justify-between bg-[#0e1015]">
          <span className="text-[11px] text-[#64748b] font-mono-code">Saved to local vault object store</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs text-[#94a3b8] hover:bg-[#1a1e28] font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-1.5 shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Attach Sketch</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
