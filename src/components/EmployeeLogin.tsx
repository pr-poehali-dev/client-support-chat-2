import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

interface EmployeeLoginProps {
  onLogin: (username: string, password: string) => void;
}

const EmployeeLogin = ({ onLogin }: EmployeeLoginProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && password.trim()) {
      onLogin(username, password);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username" className="text-foreground">
          Логин
        </Label>
        <div className="relative">
          <Icon name="UserCircle" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="username"
            type="text"
            placeholder="Введите логин"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="pl-10"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-foreground">
          Пароль
        </Label>
        <div className="relative">
          <Icon name="Lock" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Введите пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icon name={showPassword ? 'EyeOff' : 'Eye'} size={18} />
          </button>
        </div>
      </div>

      <div className="bg-muted/50 border border-border rounded-lg p-3 text-xs text-muted-foreground space-y-1">
        <div><Icon name="Info" size={14} className="inline mr-1" />Тестовые входы:</div>
        <div>• Оператор КЦ: operator / operator</div>
        <div>• ОКК: okk / okk</div>
        <div>• Администратор: admin / admin</div>
      </div>

      <Button type="submit" className="w-full" size="lg">
        <Icon name="LogIn" size={18} className="mr-2" />
        Войти
      </Button>
    </form>
  );
};

export default EmployeeLogin;