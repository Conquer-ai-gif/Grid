import { supabaseAdmin } from '@/lib/supabase';
import { clerkClient } from '@clerk/nextjs/server';

export default async function AdminUsers() {
  const { data: attendees } = await supabaseAdmin
    .from('attendance').select('user_id').order('joined_at', { ascending: false }).limit(50);

  const uniqueIds = [...new Set(attendees?.map((a: { user_id: string }) => a.user_id) ?? [])];
  let users: Array<{ id: string; name: string; email: string; role: string }> = [];
  try {
    const clerkUsers = await Promise.all(uniqueIds.slice(0, 20).map((id) => clerkClient.users.getUser(id as string)));
    users = clerkUsers.map((u) => ({
      id: u.id,
      name: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.id,
      email: u.emailAddresses[0]?.emailAddress ?? '—',
      role: (u.publicMetadata as { role?: string })?.role ?? 'participant',
    }));
  } catch { /* Clerk throttle */ }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-text-1">Users & Roles</h1>
      <div className="rounded-xl border border-border-1 bg-surface-1 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border-1 bg-surface-2">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-amber-1">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-amber-1">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-amber-1">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-amber-1">User ID</th>
            </tr>
          </thead>
          <tbody>
            {!users.length ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-text-3">No users found yet</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className="border-b border-border-1 hover:bg-surface-2 transition-colors">
                <td className="px-4 py-3 text-text-2 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-text-3">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${u.role === 'admin' ? 'border-red-500/40 bg-red-500/10 text-red-400' : u.role === 'lecturer' ? 'border-amber-1 bg-amber-5 text-amber-1' : 'border-border-1 bg-surface-2 text-text-3'}`}>{u.role}</span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-text-3">{u.id.slice(0, 20)}...</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
