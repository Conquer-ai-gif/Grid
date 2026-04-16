'use client';

import dynamic from 'next/dynamic';
import { useRef, useState, useCallback } from 'react';
import { useRole } from '@/hooks/useRole';
import { throttle } from '@/lib/utils';

// Excalidraw must be dynamically imported (no SSR) — it uses browser APIs
const Excalidraw = dynamic(
  () => import('@excalidraw/excalidraw').then((mod) => mod.Excalidraw),
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center text-text-2 text-sm">Loading whiteboard…</div> }
);

interface WhiteboardProps {
  lectureId: string;
  canDraw?: boolean;
}

export function Whiteboard({ lectureId, canDraw = false }: WhiteboardProps) {
  const { isLecturer } = useRole();
  const hasPermission = isLecturer || canDraw;
  const batchRef = useRef<unknown[]>([]);

  // Throttled flush — sends batched drawing events to API every 300ms
  const flushBatch = useCallback(
    throttle(async () => {
      if (batchRef.current.length === 0) return;
      const events = [...batchRef.current];
      batchRef.current = [];

      try {
        await fetch('/api/whiteboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            events: [{
              lecture_id: lectureId,
              event_type: 'draw',
              payload: { elements: events },
              timestamp_ms: Date.now(),
            }],
          }),
        });
      } catch {
        // Best-effort — drawing sync failures are non-critical
      }
    }, 300),
    [lectureId]
  );

  const handleChange = useCallback(
    (elements: readonly unknown[]) => {
      if (!hasPermission) return;
      batchRef.current = [...elements];
      flushBatch();
    },
    [hasPermission, flushBatch]
  );

  const handleClear = async () => {
    if (!isLecturer) return;
    try {
      await fetch('/api/whiteboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: [{
            lecture_id: lectureId,
            event_type: 'clear',
            payload: {},
            timestamp_ms: Date.now(),
          }],
        }),
      });
    } catch {
      // Best-effort
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full h-full min-h-[400px]">
      {/* Permission notice */}
      {!hasPermission && (
        <p className="text-center text-xs text-text-3 py-1">
          View only — lecturer controls drawing access
        </p>
      )}

      {/* Lecturer clear button */}
      {isLecturer && (
        <button
          onClick={handleClear}
          className="self-end rounded-lg bg-red-500/20 px-3 py-1 text-xs text-red-400 hover:bg-red-500/40 transition-all"
        >
          Clear Board
        </button>
      )}

      {/* Excalidraw canvas */}
      <div className="flex-1 rounded-xl overflow-hidden border border-border-1" style={{ minHeight: 380 }}>
        <Excalidraw
          onChange={handleChange}
          viewModeEnabled={!hasPermission}
          theme="dark"
          UIOptions={{
            canvasActions: {
              export: false,
              loadScene: false,
              saveToActiveFile: false,
              saveAsImage: isLecturer,
            },
          }}
        />
      </div>
    </div>
  );
}
