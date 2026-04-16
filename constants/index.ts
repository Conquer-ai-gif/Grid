export type SidebarLink = {
  route: string;
  label: string;
  icon: string;
  roles: ('student' | 'lecturer')[];
};

export const sidebarLinks: SidebarLink[] = [
  { route: '/',               label: 'Home',          icon: 'Home',         roles: ['student', 'lecturer'] },
  { route: '/upcoming',       label: 'Upcoming',      icon: 'Clock',        roles: ['student', 'lecturer'] },
  { route: '/previous',       label: 'Previous',      icon: 'History',      roles: ['student', 'lecturer'] },
  { route: '/recordings',     label: 'Recordings',    icon: 'Video',        roles: ['student', 'lecturer'] },
  { route: '/personal-room',  label: 'Personal Room', icon: 'User',         roles: ['lecturer'] },
  { route: '/courses',        label: 'Courses',       icon: 'BookOpen',     roles: ['student', 'lecturer'] },
  { route: '/replay',         label: 'Replay',        icon: 'Play',         roles: ['student', 'lecturer'] },
  { route: '/analytics',      label: 'Analytics',     icon: 'BarChart2',    roles: ['lecturer'] },
  { route: '/feedback',       label: 'Feedback',      icon: 'MessageSquare',roles: ['student', 'lecturer'] },
  { route: '/settings',       label: 'Settings',      icon: 'Settings',     roles: ['student', 'lecturer'] },
];

export const avatarImages = [
  '/images/avatar-1.jpeg',
  '/images/avatar-2.jpeg',
  '/images/avatar-3.png',
  '/images/avatar-4.png',
  '/images/avatar-5.png',
];
