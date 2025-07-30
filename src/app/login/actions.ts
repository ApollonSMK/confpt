
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
    full_name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
    email: z.string().email('Por favor, insira um email válido.'),
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
    confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
    message: "As senhas não correspondem.",
    path: ["confirmPassword"],
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
        options: {
            data: {
                full_name: formData.full_name,
            }
        }
    });
    
    if (error) {
        console.error("Supabase Signup Error:", JSON.stringify(error, null, 2));
        if (error.message.includes('User already registered')) {
            return { error: 'Já existe uma conta com este endereço de email.' };
        }
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
