'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, Home, Clock, History, Video, User, BookOpen, Play, BarChart2, MessageSquare, GraduationCap, Settings, LucideIcon } from 'lucide-react';
import { Sheet, SheetClose, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { sidebarLinks } from '@/constants';
import { useUserRole } from '@/hooks/useUserRole';
import { cn } from '@/lib/utils';

const iconMap: Record<string, LucideIcon> = {
  Home, Clock, History, Video, User,
  BookOpen, Play, BarChart2, MessageSquare, Settings,
};

const MobileNav = () => {
  const pathname = usePathname();
  const { role } = useUserRole();

  const visibleLinks = sidebarLinks.filter(
    (link) => !role || link.roles.includes(role)
  );

  return (
    <section className="w-full max-w-[264px]">
      <Sheet>
        <SheetTrigger asChild>
          <Menu size={28} className="cursor-pointer text-text-2 sm:hidden" />
        </SheetTrigger>
        <SheetContent side="left" className="border-none bg-surface-1 border-r border-border-1 flex flex-col">
          <Link href="/" className="flex items-center gap-2 mb-8">
            <Image
              src="/images/grid-logo.jpeg"
              alt="Grid"
              width={100}
              height={28}
              className="h-7 w-auto object-contain"
            />
          </Link>

          <div className="flex flex-col gap-1 flex-1">
            {visibleLinks.map((item) => {
              const isActive = pathname === item.route;
              const Icon = iconMap[item.icon] ?? Home;

              return (
                <SheetClose asChild key={item.route}>
                  <Link
                    href={item.route}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all',
                      isActive
                        ? 'bg-amber-5 border border-amber-1 text-amber-1'
                        : 'text-text-3 hover:bg-surface-2 border border-transparent'
                    )}
                  >
                    <Icon size={18} className={isActive ? 'text-amber-1' : 'text-text-3'} />
                    <span className={cn('text-sm font-medium', isActive ? 'text-amber-1' : 'text-text-3')}>
                      {item.label}
                    </span>
                  </Link>
                </SheetClose>
              );
            })}
          </div>

          {role && (
            <div className="pt-4 border-t border-border-1">
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
        </SheetContent>
      </Sheet>
    </section>
  );
};

export default MobileNav;
