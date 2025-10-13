import { useState } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/UI/Button';

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      await login(data);
      toast.success('Login realizado com sucesso!');
      router.push('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Erro no login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">🤖 AfiliBot</h2>
          <p className="mt-2 text-gray-600">Entre na sua conta</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              {...register('email', { required: 'Email é obrigatório' })}
              type="email"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="seu@email.com"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Senha</label>
            <input
              {...register('password', { required: 'Senha é obrigatória' })}
              type="password"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Sua senha"
            />
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
          </div>

          <Button type="submit" loading={loading} className="w-full">
            Entrar
          </Button>

          <div className="text-center text-sm text-gray-600">
            <p><strong>Admin:</strong> admin@affiliatebot.com / admin123</p>
          </div>
        </form>
      </div>
    </div>
  );
}