
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
import { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { regions } from '@/lib/data';


const loginSchema = z.object({
    email: z.string().email('Por favor, insira um email válido.'),
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
});

const signUpSchema = z.object({
  fullName: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  region: z.string().nonempty('Por favor, selecione uma região.'),
  email: z.string().email('Por favor, insira um email válido.'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
});

interface LoginFormProps {
  isSignUp: boolean;
  setIsSignUp: (isSignUp: boolean) => void;
}

export function LoginForm({ isSignUp, setIsSignUp }: LoginFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const currentSchema = isSignUp ? signUpSchema : loginSchema;
  type FormValues = z.infer<typeof currentSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(currentSchema),
    defaultValues: {
      email: '',
      password: '',
      fullName: '',
      region: '',
    },
  });

  useEffect(() => {
    form.reset({
      email: '',
      password: '',
      fullName: '',
      region: '',
    });
  }, [isSignUp, form]);

  async function onSubmit(values: FormValues) {
    setLoading(true);

    const result = isSignUp 
        ? await signup(values as z.infer<typeof signUpSchema>) 
        : await login(values as z.infer<typeof loginSchema>);

    if (result && result.error) {
      toast({
        title: 'Erro de autenticação',
        description: result.error,
        variant: 'destructive',
      });
    } else {
        toast({
            title: isSignUp ? 'Adesão concluída!' : 'Sessão iniciada!',
            description: isSignUp ? 'Bem-vindo(a) à nossa irmandade!' : 'Bem-vindo(a) de volta!',
        });
    }
    setLoading(false);
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <CardContent className="space-y-4">
          {isSignUp && (
            <>
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="O seu nome de confrade" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Região Favorita</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione a sua região do coração" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
              />
            </>
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
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSignUp ? 'Aderir à Irmandade' : 'Entrar'}
          </Button>
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={() => setIsSignUp(!isSignUp)}
            disabled={loading}
          >
            {isSignUp
              ? 'Já é um membro? Inicie sessão.'
              : 'Ainda não é membro? Adira aqui.'}
          </Button>
        </CardFooter>
      </form>
    </FormProvider>
  );
}
