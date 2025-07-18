'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
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
import { Loader2 } from 'lucide-react';
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

const formSchema = z.union([loginSchema, signUpSchema]);

type FormValues = z.infer<typeof formSchema>;

interface LoginFormProps {
  isSignUp: boolean;
  setIsSignUp: (isSignUp: boolean) => void;
}

export function LoginForm({ isSignUp, setIsSignUp }: LoginFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(isSignUp ? signUpSchema : loginSchema),
    defaultValues: {
      email: '',
      password: '',
      ...(isSignUp && { fullName: '', region: '' }),
    },
  });

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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                <FormControl>
                  <Input placeholder="********" type="password" {...field} />
                </FormControl>
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
    </Form>
  );
}
