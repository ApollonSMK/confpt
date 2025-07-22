
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { regions } from '@/lib/data';

const signUpSchema = z.object({
  email: z.string().email('Por favor, insira um email válido.'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

export async function login(formData: z.infer<typeof loginSchema>) {
  const supabase = createServerClient();

  const { error } = await supabase.auth.signInWithPassword(formData);

  if (error) {
    return { error: 'As credenciais fornecidas estão incorretas.' };
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function signup(formData: z.infer<typeof signUpSchema>) {
  const supabase = createServerClient();

  const { error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
        email_confirm: false, // Desativar confirmação de email para simplificar
    }
  });

  if (error) {
    console.error("Signup error:", error.message);
    if (error.message.includes('User already registered')) {
        return { error: 'Este email já está registado. Tente fazer login.'};
    }
    // Updated generic error to include the actual message from Supabase for better debugging.
    return { error: `Não foi possível criar a conta. Tente novamente. (${error.message})` };
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function logout() {
    const supabase = createServerClient();
    await supabase.auth.signOut();
    revalidatePath('/', 'layout');
    redirect('/login');
}
