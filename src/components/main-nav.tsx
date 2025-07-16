'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Grape, Menu } from 'lucide-react';
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
        'flex items-center space-x-4 lg:space-x-6',
        isMobile && 'flex-col space-x-0 space-y-4 pt-8'
      )}
    >
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={() => setSheetOpen(false)}
          className={cn(
            'text-sm font-medium transition-colors hover:text-primary',
            pathname === link.href ? 'text-primary' : 'text-muted-foreground',
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
            <Grape className="h-6 w-6 text-primary" />
            <span className="font-bold font-headline text-lg">Confrarias Portugal</span>
          </Link>
        </div>
        <div className="hidden md:flex flex-1 items-center justify-end space-x-4">
          <NavContent />
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
