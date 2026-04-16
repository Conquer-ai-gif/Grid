'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, Send, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function LectureAssistant({ lectureId }: { lectureId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! Ask me anything about this lecture.' },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const q = input.trim();
    if (!q || isLoading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: q }]);
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai?action=qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, lecture_id: lectureId }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer ?? 'No answer found.' }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="fixed bottom-24 right-6 z-50 flex size-12 items-center justify-center rounded-full bg-amber-1 hover:bg-amber-4 transition-all shadow-lg"
        title="Ask AI Assistant"
      >
        <Bot size={20} className="text-black" />
      </button>

      {isOpen && (
        <div className="fixed bottom-40 right-6 z-50 flex w-80 flex-col rounded-2xl bg-surface-1 border border-border-1 shadow-2xl overflow-hidden max-h-[500px]">
          <div className="flex items-center justify-between bg-surface-2 border-b border-border-1 px-4 py-3">
            <div className="flex items-center gap-2">
              <Bot size={16} className="text-amber-1" />
              <span className="text-sm font-semibold text-text-1">Lecture Assistant</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-text-3 hover:text-text-1 transition-colors">
              <X size={15} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px] max-h-[320px]">
            {messages.map((msg, i) => (
              <div key={i} className={cn('max-w-[90%] rounded-xl px-3 py-2 text-sm',
                msg.role === 'user'
                  ? 'ml-auto bg-amber-1 text-black font-medium'
                  : 'bg-surface-2 border border-border-1 text-text-2'
              )}>
                {msg.content}
              </div>
            ))}
            {isLoading && (
              <div className="bg-surface-2 border border-border-1 rounded-xl px-3 py-2 text-sm text-text-3 max-w-[90%]">
                <span className="animate-pulse">Thinking...</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="flex items-center gap-2 border-t border-border-1 p-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask about this lecture..."
              className="flex-1 rounded-lg bg-surface-2 border border-border-1 px-3 py-2 text-sm text-text-1 placeholder:text-text-3 focus:outline-none focus:border-amber-1 transition-colors"
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="flex size-8 items-center justify-center rounded-lg bg-amber-1 disabled:opacity-40 hover:bg-amber-4 transition-all text-white"
            >
              <Send size={13} className="text-black" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
