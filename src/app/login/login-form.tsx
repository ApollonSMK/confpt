
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, FormProvider } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CardContent, CardFooter } from '@/components/ui/card';
import { login, signup } from './actions';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
    email: z.string().email('Por favor, insira um email válido.'),
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
});

const signupSchema = z.object({
    full_name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
    email: z.string().email('Por favor, insira um email válido.'),
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
    confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
    message: "As senhas não correspondem.",
    path: ["confirmPassword"],
});


type LoginFormValues = z.infer<typeof loginSchema>;
type SignUpFormValues = z.infer<typeof signupSchema>;

interface LoginFormProps {
    isSignUp: boolean;
}

export function LoginForm({ isSignUp }: LoginFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const form = useForm<SignUpFormValues | LoginFormValues>({
    resolver: zodResolver(isSignUp ? signupSchema : loginSchema),
    defaultValues: isSignUp 
      ? { full_name: '', email: '', password: '', confirmPassword: '' }
      : { email: '', password: '' },
  });

  async function onSubmit(values: SignUpFormValues | LoginFormValues) {
    setLoading(true);

    const action = isSignUp ? signup : login;
    // @ts-ignore
    const result = await action(values);

    if (result && result.error) {
      toast({
        title: isSignUp ? 'Erro ao Criar Conta' : 'Erro de Autenticação',
        description: result.error,
        variant: 'destructive',
      });
    } else {
        toast({
            title: isSignUp ? 'Conta Criada!' : 'Sessão Iniciada!',
            description: isSignUp ? 'Bem-vindo(a)! A sua conta foi criada com sucesso.' : 'Bem-vindo(a) de volta!',
        });
    }
    setLoading(false);
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <CardContent className="space-y-4">
          {isSignUp && (
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Seu nome" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="seu@email.com" type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Senha</FormLabel>
                <div className="relative">
                    <FormControl>
                    <Input placeholder="********" type={showPassword ? 'text' : 'password'} {...field} className="pr-10" />
                    </FormControl>
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-primary"
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
           {isSignUp && (
             <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Confirmar Senha</FormLabel>
                     <div className="relative">
                        <FormControl>
                        <Input placeholder="********" type={showConfirmPassword ? 'text' : 'password'} {...field} className="pr-10"/>
                        </FormControl>
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-primary"
                            aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        >
                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>
                    <FormMessage />
                </FormItem>
                )}
            />
          )}
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <Button type="submit" className={cn("w-full", isSignUp && "mt-4")} size="lg" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSignUp ? 'Criar Conta' : 'Entrar'}
          </Button>
        </CardFooter>
      </form>
    </FormProvider>
  );
}
