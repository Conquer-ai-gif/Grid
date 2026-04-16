import Link from 'next/link';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';

interface AlertProps {
  title: string;
  iconUrl?: string;
}

const Alert = ({ title, iconUrl }: AlertProps) => {
  return (
    <section className="flex-center h-screen w-full bg-black">
      <div className="flex w-full max-w-[520px] flex-col gap-6 rounded-2xl border border-border-1 bg-surface-1 p-8">
        <div className="flex flex-col items-center gap-4">
          {iconUrl ? (
            <div className="flex size-16 items-center justify-center rounded-full bg-amber-5 border border-amber-1">
              <CheckCircle size={32} className="text-amber-1" />
            </div>
          ) : (
            <div className="flex size-16 items-center justify-center rounded-full bg-red-500/10 border border-red-500/30">
              <AlertTriangle size={32} className="text-red-400" />
            </div>
          )}
          <p className="text-center text-lg font-semibold text-text-1">{title}</p>
        </div>
        <Button asChild className="bg-amber-1 hover:bg-amber-4 text-black font-bold">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </section>
  );
};

export default Alert;
