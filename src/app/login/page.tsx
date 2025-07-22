
'use client';

import { useState } from 'react';
import { LoginForm } from './login-form';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Grape, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-14rem)] items-center justify-center px-4 py-8 md:py-16">
      <div className="w-full max-w-md">
        <Card className="p-4 md:p-6 transition-all duration-300">
            <CardHeader className="text-center">
                <div className="mx-auto mb-4 inline-block rounded-full bg-primary/10 p-3">
                    {isSignUp ? <UserPlus className="h-8 w-8 text-primary" /> : <Grape className="h-8 w-8 text-primary" />}
                </div>
                <CardTitle className="font-headline text-3xl">
                    {isSignUp ? 'Criar Conta' : 'Bem-vindo de volta'}
                </CardTitle>
                <CardDescription>
                    {isSignUp ? 'Junte-se à nossa comunidade de confrades.' : 'Entre na sua conta para continuar a sua jornada.'}
                </CardDescription>
            </CardHeader>
            <LoginForm isSignUp={isSignUp} />
            <CardFooter className="flex-col gap-4 pt-6">
                <div className="relative w-full">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">
                            {isSignUp ? 'Já tem conta?' : 'Não tem conta?'}
                        </span>
                    </div>
                </div>
                 <Button variant="outline" className="w-full" onClick={() => setIsSignUp(!isSignUp)}>
                    {isSignUp ? 'Entrar' : 'Aderir'}
                </Button>
            </CardFooter>
        </Card>
      </div>
    </div>
  );
}
