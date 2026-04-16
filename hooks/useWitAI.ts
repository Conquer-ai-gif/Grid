'use client';

import { useState, useRef, useCallback } from 'react';
import { debounce } from '@/lib/utils';
import { IntentName } from '@/types';

interface WitResult {
  intent: IntentName;
  confidence: number;
}

interface UseWitAIOptions {
  lectureId: string;
  onIntent?: (result: WitResult) => void;
  debounceMs?: number;
}

export function useWitAI({ lectureId, onIntent, debounceMs = 800 }: UseWitAIOptions) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastIntent, setLastIntent] = useState<WitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const processText = useCallback(
    debounce(async (text: string) => {
      if (!text.trim() || !lectureId) return;

      // Cancel previous request
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setIsProcessing(true);
      setError(null);

      try {
        const res = await fetch('/api/wit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, lecture_id: lectureId }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) throw new Error('Wit.ai request failed');

        const data: WitResult = await res.json();
        setLastIntent(data);
        onIntent?.(data);
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        setIsProcessing(false);
      }
    }, debounceMs) as (text: string) => void,
    [lectureId, onIntent, debounceMs]
  );

  return { processText, isProcessing, lastIntent, error };
}
