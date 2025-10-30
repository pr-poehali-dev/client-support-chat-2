import { useState } from 'react';
import ClientLogin from '@/components/ClientLogin';
import EmployeeLogin from '@/components/EmployeeLogin';
import ClientChat from '@/components/ClientChat';
import EmployeeDashboard from '@/components/EmployeeDashboard';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

type UserRole = 'client' | 'employee' | 'admin' | null;

interface User {
  name: string;
  phone?: string;
  email?: string;
  role: UserRole;
}

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loginMode, setLoginMode] = useState<'client' | 'employee'>('client');

  const handleClientLogin = (name: string, phone: string, email?: string) => {
    setUser({ name, phone, email, role: 'client' });
  };

  const handleEmployeeLogin = (username: string, password: string) => {
    if (username === 'admin' && password === 'admin') {
      setUser({ name: 'Администратор', role: 'admin' });
    } else if (username && password) {
      setUser({ name: username, role: 'employee' });
    }
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (user) {
    if (user.role === 'client') {
      return <ClientChat user={user} onLogout={handleLogout} />;
    }
    return <EmployeeDashboard user={user} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-background dark flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4 animate-scale-in">
            <Icon name="MessageSquare" size={32} className="text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Поддержка клиентов</h1>
          <p className="text-muted-foreground">Мы всегда готовы помочь</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl">
          <div className="flex gap-2 mb-6 bg-muted p-1 rounded-xl">
            <Button
              variant={loginMode === 'client' ? 'default' : 'ghost'}
              className="flex-1 transition-all"
              onClick={() => setLoginMode('client')}
            >
              <Icon name="User" size={18} className="mr-2" />
              Клиент
            </Button>
            <Button
              variant={loginMode === 'employee' ? 'default' : 'ghost'}
              className="flex-1 transition-all"
              onClick={() => setLoginMode('employee')}
            >
              <Icon name="Briefcase" size={18} className="mr-2" />
              Сотрудник
            </Button>
          </div>

          {loginMode === 'client' ? (
            <ClientLogin onLogin={handleClientLogin} />
          ) : (
            <EmployeeLogin onLogin={handleEmployeeLogin} />
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          🔒 Ваши данные защищены и конфиденциальны
        </p>
      </div>
    </div>
  );
};

export default Index;