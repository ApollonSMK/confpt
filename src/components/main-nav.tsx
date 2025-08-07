

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Grape, Menu, LogOut, UserRound, Home, BookOpen, Handshake, PlusCircle, ShieldCheck, UserCog, ShieldQuestion, Calendar, Map } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Button } from './ui/button';
import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { logout } from '@/app/login/actions';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { createClient } from '@/lib/supabase/client';
import { Skeleton } from './ui/skeleton';


const navLinks = [
  { href: '/', label: 'Início', icon: Home },
  { href: '/discoveries', label: 'Descobertas', icon: BookOpen },
  { href: '/confrarias', label: 'Confrarias', icon: Handshake },
  { href: '/events', label: 'Eventos', icon: Calendar },
];

interface MainNavProps {
    user: any | null;
    isAdmin: boolean;
}

export function MainNav({ user, isAdmin }: MainNavProps) {
  const pathname = usePathname();
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [managedConfrariaId, setManagedConfrariaId] = useState<number | null>(null);

  useEffect(() => {
    async function fetchManagedConfraria() {
      if (user) {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('confrarias')
          .select('id')
          .eq('responsible_user_id', user.id)
          .maybeSingle();

        if (data) {
          setManagedConfrariaId(data.id);
        }
         if (error) {
            console.error("Error fetching managed confraria:", error);
        }
      }
    }
    fetchManagedConfraria();
  }, [user]);

  const handleLogout = async () => {
    await logout();
  }
  
  const userFullName = user?.user_metadata?.full_name;
  const userInitial = userFullName ? userFullName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase();

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
            'text-sm font-medium transition-colors border-b-2 flex items-center gap-2',
            pathname === link.href ? 'text-primary-foreground border-secondary' : 'text-primary-foreground/80 border-transparent hover:text-primary-foreground',
            isMobile && 'text-lg p-2 rounded-md w-full justify-start'
          )}
        >
          <link.icon className="h-4 w-4" />
          {link.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary-foreground/20 bg-primary text-primary-foreground">
      <div className="container flex h-20 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <div className='bg-primary-foreground/10 p-2 rounded-full shadow-md'>
                <Grape className="h-6 w-6" />
            </div>
            <span className="font-bold font-headline text-xl">Confrarias Portugal</span>
          </Link>
        </div>

        <div className="hidden md:flex flex-1 items-center justify-center space-x-4">
           <NavContent />
        </div>
        
        <div className="flex items-center justify-end space-x-2 ml-auto">
            {user ? (
                <div className="flex items-center gap-2">
                    {isAdmin && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" asChild>
                                        <Link href="/admin/dashboard">
                                            <ShieldCheck className="h-6 w-6 text-secondary" />
                                        </Link>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Painel Administrativo</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-12 w-12 rounded-full ring-2 ring-transparent hover:ring-secondary focus-visible:ring-secondary">
                            <Avatar className="h-12 w-12 border-2 border-primary-foreground/50">
                            <AvatarImage src={user.user_metadata?.avatar_url} alt={userFullName || user.email} />
                            <AvatarFallback className="bg-primary/20 text-primary-foreground font-bold">{userInitial}</AvatarFallback>
                            </Avatar>
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{userFullName || 'Confrade'}</p>
                            <p className="text-xs leading-none text-muted-foreground">
                                {user.email}
                            </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild className="cursor-pointer">
                                <Link href="/profile">
                                    <UserCog className="mr-2 h-4 w-4" />
                                    <span>Meu Painel</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="cursor-pointer">
                                <Link href="/submit">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    <span>Submeter Descoberta</span>
                                </Link>
                            </DropdownMenuItem>
                            {managedConfrariaId && (
                                <DropdownMenuItem asChild className="cursor-pointer">
                                    <Link href={`/confrarias/${managedConfrariaId}/manage`}>
                                        <ShieldQuestion className="mr-2 h-4 w-4" />
                                        <span>Gerir Confraria</span>
                                    </Link>
                                </DropdownMenuItem>
                            )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Sair</span>
                        </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ) : (
                <Button asChild variant="secondary">
                    <Link href="/login">
                        <UserRound className='mr-2' />
                        Entrar
                    </Link>
                </Button>
            )}
             <div className="md:hidden">
              <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle Menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="pt-16 bg-primary text-primary-foreground border-l-primary-foreground/20">
                  <NavContent isMobile />
                </SheetContent>
              </Sheet>
            </div>
        </div>
      </div>
    </header>
  );
}
