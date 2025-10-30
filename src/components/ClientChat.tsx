import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';

interface User {
  name: string;
  phone?: string;
  email?: string;
  role: string;
}

interface Message {
  id: number;
  text: string;
  sender: 'client' | 'support';
  time: string;
}

interface ClientChatProps {
  user: User;
  onLogout: () => void;
}

const ClientChat = ({ user, onLogout }: ClientChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: `Здравствуйте, ${user.name}! Чем могу помочь?`,
      sender: 'support',
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const now = new Date();
      const newMsg: Message = {
        id: messages.length + 1,
        text: newMessage,
        sender: 'client',
        time: now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([...messages, newMsg]);
      setNewMessage('');

      setTimeout(() => {
        const supportMsg: Message = {
          id: messages.length + 2,
          text: 'Спасибо за сообщение! Специалист ответит в ближайшее время.',
          sender: 'support',
          time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, supportMsg]);
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-background dark flex flex-col">
      <header className="bg-card border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 bg-primary">
            <AvatarFallback className="text-primary-foreground font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold text-foreground">{user.name}</h2>
            <p className="text-xs text-muted-foreground">{user.phone}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onLogout}>
          <Icon name="LogOut" size={20} />
        </Button>
      </header>

      <ScrollArea className="flex-1 p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 animate-fade-in ${
                message.sender === 'client' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <Avatar className={`w-8 h-8 ${message.sender === 'support' ? 'bg-secondary' : 'bg-primary'}`}>
                <AvatarFallback className="text-xs">
                  {message.sender === 'support' ? (
                    <Icon name="Headphones" size={16} />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </AvatarFallback>
              </Avatar>
              <div
                className={`flex flex-col ${
                  message.sender === 'client' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`rounded-2xl px-4 py-2 max-w-md ${
                    message.sender === 'client'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                </div>
                <span className="text-xs text-muted-foreground mt-1">{message.time}</span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="bg-card border-t border-border p-4">
        <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex gap-2">
          <Input
            type="text"
            placeholder="Введите сообщение..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="icon" className="shrink-0">
            <Icon name="Send" size={20} />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ClientChat;
