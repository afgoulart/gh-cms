'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
  {
    name: 'Home',
    href: '/',
    icon: '🏠',
  },
  {
    name: 'Posts',
    href: '/posts',
    icon: '📝',
  },
  {
    name: 'Novo Post',
    href: '/posts/new',
    icon: '➕',
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-navy text-white min-h-screen">
      <div className="p-6">
        <h1 className="text-xl font-bold text-accent">GitHub CMS</h1>
        <p className="text-secondary text-sm mt-1">Gerencie seu conteúdo</p>
      </div>

      <nav className="mt-8">
        <ul className="space-y-2 px-4">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-250 ${
                    isActive
                      ? 'bg-accent text-navy font-medium'
                      : 'text-light hover:bg-navy-light hover:text-white'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}