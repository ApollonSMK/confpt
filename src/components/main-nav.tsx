'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Grape, Menu, Search, User } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Button } from './ui/button';
import { useState } from 'react';

const navLinks = [
  { href: '/', label: 'Início' },
  { href: '/discoveries', label: 'Descobertas' },
  { href: '/confrarias', label: 'Confrarias' },
  { href: '/submit', label: 'Submeter' },
];

export function MainNav() {
  const pathname = usePathname();
  const [isSheetOpen, setSheetOpen] = useState(false);

  const NavContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <nav
      className={cn(
        'flex items-center space-x-6 lg:space-x-8',
        isMobile && 'flex-col space-x-0 space-y-4 pt-8'
      )}
    >
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={() => setSheetOpen(false)}
          className={cn(
            'text-sm font-medium transition-colors hover:text-primary border-b-2',
            pathname === link.href ? 'text-primary border-primary' : 'text-muted-foreground border-transparent',
            isMobile && 'text-lg'
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <div className='bg-primary text-primary-foreground p-2 rounded-full'>
                <Grape className="h-6 w-6" />
            </div>
            <span className="font-bold font-headline text-lg">Confrarias Portugal</span>
          </Link>
        </div>
        <div className="hidden md:flex flex-1 items-center justify-center space-x-4">
          <NavContent />
        </div>
        <div className="hidden md:flex items-center justify-end space-x-2">
            <Button variant="ghost" size="icon">
                <Search />
            </Button>
            <Button>
                <User className='mr-2' />
                Entrar
            </Button>
        </div>
        <div className="md:hidden flex flex-1 justify-end">
          <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <NavContent isMobile />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
