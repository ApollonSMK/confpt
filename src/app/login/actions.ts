
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

const signupSchema = z.object({
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

export async function signup(formData: z.infer<typeof signupSchema>) {
    const supabase = createServerClient();

    const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
    });
    
    if (error) {
        console.error("Supabase Signup Error:", JSON.stringify(error, null, 2));
        return { error: `Erro ao criar conta: ${error.message}` };
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
