import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

const schema = z.object({ email: z.string().email(), password: z.string().min(6) });

type FormData = z.infer<typeof schema>;

export function AuthPage() {
  const [session, setSession] = useState<any>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => setSession(sess));
    return () => sub.subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) toast.error(error.message);
  };

  const onSubmit = async (values: FormData) => {
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) toast.error(error.message); else toast.success('Giriş başarılı');
  };

  const onSignUp = async (values: FormData) => {
    const { error } = await supabase.auth.signUp(values);
    if (error) toast.error(error.message); else toast.success('Kayıt başarılı, e-postanı kontrol et');
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Giriş / Kayıt</h1>
      <button onClick={signInWithGoogle} className="w-full px-4 py-2 bg-neutral-800 rounded">Google ile Giriş</button>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <input placeholder="E-posta" className="w-full p-2 bg-neutral-900 border border-neutral-800 rounded" {...register('email')} />
        {errors.email && <div className="text-red-400 text-sm">{errors.email.message}</div>}
        <input type="password" placeholder="Şifre" className="w-full p-2 bg-neutral-900 border border-neutral-800 rounded" {...register('password')} />
        {errors.password && <div className="text-red-400 text-sm">{errors.password.message}</div>}
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 bg-indigo-600 rounded">Giriş</button>
          <button type="button" onClick={handleSubmit(onSignUp)} className="px-4 py-2 bg-neutral-800 rounded">Kayıt Ol</button>
        </div>
      </form>

      {session && (
        <div className="text-sm text-neutral-400">Giriş yapıldı: {session.user.email}</div>
      )}
    </div>
  );
}