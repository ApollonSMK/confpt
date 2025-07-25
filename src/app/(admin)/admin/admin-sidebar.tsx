
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Grape, LayoutDashboard, FileCheck, Shield, BookOpen, Home, Users } from 'lucide-react';

const adminNavLinks = [
  { href: '/admin/dashboard', label: 'Visão Geral', icon: LayoutDashboard },
  { href: '/admin/submissions', label: 'Submissões', icon: FileCheck },
  { href: '/admin/confrarias', label: 'Confrarias', icon: Shield },
  { href: '/admin/discoveries', label: 'Descobertas', icon: BookOpen },
  { href: '/admin/users', label: 'Utilizadores', icon: Users },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-background border-r">
        <div className="flex items-center justify-center h-20 border-b gap-2">
             <div className='bg-primary text-primary-foreground p-2 rounded-lg shadow-md'>
                <Grape className="h-6 w-6" />
            </div>
            <span className="font-headline text-xl font-bold">Admin</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
            {adminNavLinks.map((link) => (
            <Link
                key={link.href}
                href={link.href}
                className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted',
                (pathname === link.href || (link.href !== '/admin/dashboard' && pathname.startsWith(link.href))) && 'bg-muted text-primary'
                )}
            >
                <link.icon className="h-4 w-4" />
                {link.label}
            </Link>
            ))}
        </nav>
        <div className="mt-auto p-4 border-t">
            <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted">
                <Home className="h-4 w-4" />
                Voltar ao Site
            </Link>
        </div>
    </aside>
  );
}
