'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Clock, History, Video, User,
  BookOpen, Play, BarChart2, MessageSquare,
  GraduationCap, Settings, LucideIcon,
} from 'lucide-react';
import { sidebarLinks } from '@/constants';
import { useUserRole } from '@/hooks/useUserRole';
import { cn } from '@/lib/utils';

const iconMap: Record<string, LucideIcon> = {
  Home, Clock, History, Video, User,
  BookOpen, Play, BarChart2, MessageSquare, Settings,
};

const Sidebar = () => {
  const pathname = usePathname();
  const { role } = useUserRole();

  const visibleLinks = sidebarLinks.filter(
    (link) => !role || link.roles.includes(role)
  );

  return (
    <section className="sticky left-0 top-0 flex h-screen w-fit flex-col bg-surface-1 border-r border-border-1 p-4 pt-28 max-sm:hidden lg:w-[240px]">
      <div className="flex flex-1 flex-col gap-1">
        {visibleLinks.map((item) => {
          const isActive = pathname === item.route || pathname.startsWith(`${item.route}/`);
          const Icon = iconMap[item.icon] ?? Home;

          return (
            <Link
              href={item.route}
              key={item.label}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all',
                isActive
                  ? 'bg-amber-5 border border-amber-1 text-amber-1'
                  : 'text-text-3 hover:bg-surface-2 hover:text-text-2 border border-transparent'
              )}
            >
              <Icon size={18} className={isActive ? 'text-amber-1' : 'text-text-3'} />
              <p className={cn('text-sm font-medium max-lg:hidden', isActive ? 'text-amber-1' : 'text-text-3')}>
                {item.label}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Role badge at bottom */}
      {role && (
        <div className="mt-auto pt-4 border-t border-border-1 max-lg:hidden">
          <span className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
            role === 'lecturer'
              ? 'bg-amber-5 text-amber-1 border border-amber-1'
              : 'bg-surface-2 text-text-2 border border-border-1'
          )}>
            {role === 'lecturer'
              ? <><GraduationCap size={12} /> Lecturer</>
              : <><BookOpen size={12} /> Student</>}
          </span>
        </div>
      )}
    </section>
  );
};

export default Sidebar;
