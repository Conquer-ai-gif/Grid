'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useCall } from '@stream-io/video-react-sdk';
import { useRole } from '@/hooks/useRole';
import { throttle } from '@/lib/utils';
import { Pen, Eraser, Trash2, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DrawEvent {
  type: 'draw' | 'erase' | 'clear';
  x?: number;
  y?: number;
  x2?: number;
  y2?: number;
  color?: string;
  size?: number;
}

interface WhiteboardPanelProps {
  lectureId: string;
  canDraw?: boolean;
}

export function WhiteboardPanel({ lectureId, canDraw = false }: WhiteboardPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const batchRef = useRef<DrawEvent[]>([]);
  const call = useCall();
  const { isLecturer } = useRole();

  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState('#FFFFFF');
  const [size, setSize] = useState(3);

  const canActuallyDraw = canDraw || isLecturer;

  // Flush batch to API + Stream every 500ms
  const flushBatch = useCallback(
    throttle(async () => {
      if (batchRef.current.length === 0) return;
      const events = batchRef.current.splice(0);

      // Persist to Supabase via API
      fetch('/api/whiteboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: events.map((e) => ({
            lecture_id: lectureId,
            event_type: e.type,
            payload: e,
            timestamp_ms: Date.now(),
          })),
        }),
      }).catch(console.error);

      // Broadcast via Stream custom event for real-time sync
      if (call) {
        call.sendCustomEvent({ type: 'whiteboard.update', events }).catch(console.error);
      }
    }, 500),
    [lectureId, call]
  );

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const drawOnCanvas = useCallback((event: DrawEvent) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    if (event.type === 'clear') {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    ctx.lineWidth = event.size ?? 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (event.type === 'erase') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = event.color ?? '#FFFFFF';
    }

    if (event.x !== undefined && event.y !== undefined && event.x2 !== undefined && event.y2 !== undefined) {
      ctx.beginPath();
      ctx.moveTo(event.x, event.y);
      ctx.lineTo(event.x2, event.y2);
      ctx.stroke();
    }
  }, []);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canActuallyDraw) return;
    isDrawing.current = true;
    lastPos.current = getPos(e);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current || !canActuallyDraw || !lastPos.current) return;
    const pos = getPos(e);
    const evt: DrawEvent = {
      type: tool === 'eraser' ? 'erase' : 'draw',
      x: lastPos.current.x,
      y: lastPos.current.y,
      x2: pos.x,
      y2: pos.y,
      color,
      size,
    };
    drawOnCanvas(evt);
    batchRef.current.push(evt);
    flushBatch();
    lastPos.current = pos;
  };

  const handleEnd = () => {
    isDrawing.current = false;
    lastPos.current = null;
  };

  const handleClear = () => {
    if (!isLecturer) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
    const evt: DrawEvent = { type: 'clear' };
    batchRef.current.push(evt);
    flushBatch();
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `whiteboard-${lectureId}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  // Listen for remote whiteboard events via Stream
  useEffect(() => {
    if (!call) return;
    const unsub = call.on('custom', (event: { type?: string; events?: DrawEvent[] }) => {
      if (event.type === 'whiteboard.update' && Array.isArray(event.events)) {
        event.events.forEach(drawOnCanvas);
      }
    });
    return () => { if (typeof unsub === 'function') unsub(); };
  }, [call, drawOnCanvas]);

  return (
    <div className="flex flex-col gap-2">
      {/* Toolbar */}
      <div className="flex items-center gap-2 rounded-xl bg-dark-3 p-2">
        <button
          onClick={() => setTool('pen')}
          className={cn('rounded-lg p-2', tool === 'pen' ? 'bg-blue-1' : 'hover:bg-dark-4')}
          title="Pen"
        >
          <Pen size={16} className="text-white" />
        </button>
        <button
          onClick={() => setTool('eraser')}
          className={cn('rounded-lg p-2', tool === 'eraser' ? 'bg-blue-1' : 'hover:bg-dark-4')}
          title="Eraser"
        >
          <Eraser size={16} className="text-white" />
        </button>

        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="size-8 cursor-pointer rounded border-none bg-transparent"
          title="Color"
        />

        <input
          type="range"
          min={1}
          max={20}
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          className="w-20"
          title="Brush size"
        />

        {isLecturer && (
          <button
            onClick={handleClear}
            className="ml-auto rounded-lg p-2 hover:bg-red-500/20"
            title="Clear board"
          >
            <Trash2 size={16} className="text-red-400" />
          </button>
        )}

        <button onClick={handleDownload} className="rounded-lg p-2 hover:bg-dark-4" title="Download">
          <Download size={16} className="text-white" />
        </button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={1280}
        height={720}
        className={cn(
          'w-full rounded-xl bg-dark-4',
          canActuallyDraw ? 'cursor-crosshair' : 'cursor-not-allowed'
        )}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        style={{ touchAction: 'none' }}
      />

      {!canActuallyDraw && (
        <p className="text-center text-xs text-sky-1">Drawing permission not granted</p>
      )}
    </div>
  );
}
