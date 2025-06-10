
import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ADMIN_PASSWORD, APP_NAME } from '../../constants';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Logo from '../../components/ui/Logo';

interface AdminLoginPageProps {
  onLoginSuccess: () => void;
}

const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      if (password === ADMIN_PASSWORD) {
        onLoginSuccess();
        navigate('/admin/dashboard');
      } else {
        setError('Неверный пароль. Попробуйте снова.');
      }
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-light-secondary dark:bg-dark-secondary p-4">
      <div className="w-full max-w-md bg-light-primary dark:bg-dark-primary p-8 rounded-xl shadow-2xl">
        <div className="text-center mb-8">
          <Logo className="text-3xl justify-center" />
          <h2 className="mt-2 text-xl font-semibold text-light-text-primary dark:text-dark-text-primary">
            Панель Администратора
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            id="password"
            name="password"
            type="password"
            label="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error}
            autoComplete="current-password"
            placeholder="Введите пароль администратора"
            required
          />
          {error && <p className="text-sm text-red-500 text-center -mt-2">{error}</p>}
          <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full">
            Войти
          </Button>
        </form>
         <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          Забыли пароль? Обратитесь к системному администратору.
        </p>
      </div>
    </div>
  );
};

export default AdminLoginPage;