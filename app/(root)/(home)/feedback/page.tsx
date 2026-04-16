'use client';

import { useState } from 'react';
import { Bug, Lightbulb, Star, BookOpen, Send, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

const categories = [
  { id: 'bug',      label: 'Bug report',     icon: Bug },
  { id: 'feature',  label: 'Feature idea',   icon: Lightbulb },
  { id: 'experience', label: 'Experience',   icon: Star },
  { id: 'lecture',  label: 'Lecture quality', icon: BookOpen },
];

export default function FeedbackPage() {
  const { toast } = useToast();
  const [category, setCategory] = useState('experience');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!subject.trim() || !details.trim()) {
      toast({ title: 'Please fill in subject and details' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, rating, subject, details }),
      });
      if (!res.ok) throw new Error('Failed');
      setSubmitted(true);
    } catch {
      toast({ title: 'Failed to submit. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <section className="flex size-full flex-col items-center justify-center gap-6 text-text-1">
        <div className="flex size-20 items-center justify-center rounded-full bg-amber-5 border border-amber-1">
          <Check size={36} className="text-amber-1" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-1 mb-2">Thank you!</h1>
          <p className="text-text-3">Your feedback has been received and will help us improve.</p>
        </div>
        <button
          onClick={() => { setSubmitted(false); setSubject(''); setDetails(''); setRating(0); }}
          className="rounded-xl border border-amber-1 bg-amber-5 px-6 py-2.5 text-sm font-semibold text-amber-1 hover:bg-amber-1 hover:text-black transition-all"
        >
          Submit another
        </button>
      </section>
    );
  }

  return (
    <section className="flex size-full flex-col gap-6 text-text-1 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-text-1">Share your feedback</h1>
        <p className="mt-1 text-sm text-text-3">Help us improve the platform — all responses are saved securely.</p>
      </div>

      {/* Category picker */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {categories.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setCategory(id)}
            className={cn(
              'flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all',
              category === id
                ? 'border-amber-1 bg-amber-5 text-amber-1'
                : 'border-border-1 bg-surface-1 text-text-3 hover:border-border-2 hover:text-text-2'
            )}
          >
            <Icon size={22} className={category === id ? 'text-amber-1' : 'text-text-3'} />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>

      {/* Star rating */}
      <div>
        <label className="mb-2 block text-sm font-medium text-text-2">Rate your experience</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              className="transition-transform hover:scale-110"
            >
              <Star
                size={28}
                className={cn(
                  'transition-colors',
                  star <= (hoverRating || rating) ? 'text-amber-1 fill-amber-1' : 'text-border-2'
                )}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Subject */}
      <div>
        <label className="mb-2 block text-sm font-medium text-text-2">Subject</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Brief description of your feedback..."
          className="w-full rounded-xl border border-border-1 bg-surface-1 px-4 py-3 text-sm text-text-1 placeholder:text-text-3 focus:border-amber-1 focus:outline-none transition-colors"
        />
      </div>

      {/* Details */}
      <div>
        <label className="mb-2 block text-sm font-medium text-text-2">Details</label>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Tell us more about your experience, what went wrong, or your idea..."
          rows={5}
          className="w-full rounded-xl border border-border-1 bg-surface-1 px-4 py-3 text-sm text-text-1 placeholder:text-text-3 focus:border-amber-1 focus:outline-none transition-colors resize-none"
        />
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="flex items-center justify-center gap-2 rounded-xl bg-amber-1 px-6 py-3 text-sm font-bold text-black hover:bg-amber-4 disabled:opacity-50 transition-all w-full sm:w-auto"
      >
        <Send size={16} />
        {submitting ? 'Submitting...' : 'Submit feedback'}
      </button>
    </section>
  );
}
