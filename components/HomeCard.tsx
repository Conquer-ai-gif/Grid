'use client';

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface HomeCardProps {
  className?: string;
  icon: LucideIcon;
  title: string;
  description: string;
  handleClick?: () => void;
}

const HomeCard = ({ className, icon: Icon, title, description, handleClick }: HomeCardProps) => {
  return (
    <section
      className={cn(
        'bg-surface-2 border border-border-1 px-4 py-6 flex flex-col justify-between w-full xl:max-w-[270px] min-h-[220px] rounded-xl cursor-pointer hover:border-amber-1 hover:bg-amber-5 transition-all group',
        className
      )}
      onClick={handleClick}
    >
      <div className="flex size-12 items-center justify-center rounded-xl bg-surface-1 border border-border-1 group-hover:border-amber-1 transition-all">
        <Icon size={22} className="text-amber-1" />
      </div>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-lg font-bold text-text-1">{title}</h1>
        <p className="text-sm text-text-3">{description}</p>
      </div>
    </section>
  );
};

export default HomeCard;
