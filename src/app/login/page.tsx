
'use client';

import { LoginForm } from './login-form';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Grape } from 'lucide-react';

export default function LoginPage() {

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-14rem)] items-center justify-center px-4 py-8 md:py-16">
      <div className="w-full max-w-md">
        <Card className="p-4 md:p-6 transition-all duration-300">
            <CardHeader className="text-center">
                <div className="mx-auto mb-4 inline-block rounded-full bg-primary/10 p-3">
                    <Grape className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="font-headline text-3xl">
                    Bem-vindo de volta
                </CardTitle>
                <CardDescription>
                    Entre na sua conta para continuar a sua jornada de descobertas.
                </CardDescription>
            </CardHeader>
            <LoginForm />
        </Card>
      </div>
    </div>
  );
}
