import Link from 'next/link';
import Image from 'next/image';
import { SignedIn, UserButton } from '@clerk/nextjs';
import MobileNav from './MobileNav';
import { NotificationBell } from './NotificationBell';

const Navbar = () => {
  return (
    <nav className="flex-between fixed z-50 w-full bg-surface-1 border-b border-border-1 px-6 py-4 lg:px-10">
      <Link href="/" className="flex items-center gap-2">
        <Image
          src="/images/grid-logo.jpeg"
          alt="Grid"
          width={120}
          height={32}
          className="h-8 w-auto object-contain"
          priority
        />
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
