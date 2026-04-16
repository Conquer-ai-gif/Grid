import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { LogOut, LayoutDashboard, Users, BookOpen, MessageSquare, Zap, BrainCircuit } from 'lucide-react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  // Every admin page is protected — if no valid cookie, go to login
  if (!isAdminAuthenticated()) {
    redirect('/admin/login');
  }

  const navLinks = [
    { href: '/admin',           label: 'Overview',          icon: LayoutDashboard },
    { href: '/admin/users',     label: 'Users & Roles',     icon: Users },
    { href: '/admin/lectures',  label: 'Lectures',          icon: BookOpen },
    { href: '/admin/feedback',  label: 'Feedback',          icon: MessageSquare },
    { href: '/admin/training',  label: 'AI Training Queue', icon: BrainCircuit },
  ];

  return (
    <div className="min-h-screen bg-black text-text-1">

      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border-1 bg-surface-1 px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex size-7 items-center justify-center rounded-lg bg-amber-1">
            <Zap size={14} className="fill-black text-black" />
          </div>
          <span className="text-sm font-bold text-amber-1 tracking-widest uppercase">
            Yoom AI Admin
          </span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/" className="text-xs text-text-3 hover:text-amber-1 transition-colors">
            ← Back to app
          </a>
          {/* Logout button */}
          <form action="/api/admin/auth" method="DELETE">
            <button
              type="button"
              onClick={async () => {
                await fetch('/api/admin/auth', { method: 'DELETE' });
                window.location.href = '/admin/login';
              }}
              className="flex items-center gap-1.5 text-xs text-text-3 hover:text-red-400 transition-colors"
            >
              <LogOut size={13} />
              Logout
            </button>
          </form>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-52 min-h-[calc(100vh-49px)] border-r border-border-1 bg-surface-1 p-4 flex-shrink-0">
          <div className="flex flex-col gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <a
                key={href}
                href={href}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-text-3 hover:bg-surface-2 hover:text-amber-1 transition-all"
              >
                <Icon size={15} />
                {label}
              </a>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 min-h-[calc(100vh-49px)]">{children}</main>
      </div>
    </div>
  );
}
