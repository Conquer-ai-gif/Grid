import Link from 'next/link';
import { SignedIn, UserButton } from '@clerk/nextjs';
import { Zap } from 'lucide-react';
import MobileNav from './MobileNav';
import { NotificationBell } from './NotificationBell';

const Navbar = () => {
  return (
    <nav className="flex-between fixed z-50 w-full bg-surface-1 border-b border-border-1 px-6 py-4 lg:px-10">
      <Link href="/" className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-amber-1">
          <Zap size={16} className="text-black fill-black" />
        </div>
        <p className="text-xl font-bold text-text-1 max-sm:hidden tracking-tight">
          Yoom AI
        </p>
      </Link>

      <div className="flex-between gap-3">
        <SignedIn>
          <NotificationBell />
          <UserButton afterSignOutUrl="/sign-in" />
        </SignedIn>
        <MobileNav />
      </div>
    </nav>
  );
};

export default Navbar;
