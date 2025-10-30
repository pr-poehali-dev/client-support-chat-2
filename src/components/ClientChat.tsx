import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';

const CHAT_API_URL = 'https://functions.poehali.dev/a33a1e04-98e5-4c92-8585-2a7f74db1d36';

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
  senderName?: string;
  time: string;
}

interface ClientChatProps {
  user: User;
  onLogout: () => void;
}

const getClientIP = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return 'unknown';
  }
};

const ClientChat = ({ user, onLogout }: ClientChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatId, setChatId] = useState<number | null>(null);
  const [ipAddress, setIpAddress] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initChat = async () => {
      const ip = await getClientIP();
      setIpAddress(ip);

      try {
        const response = await fetch(CHAT_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'startChat',
            ipAddress: ip,
            name: user.name,
            email: user.email,
            phone: user.phone,
          }),
        });

        const data = await response.json();
        setChatId(data.chatId);

        const messagesResponse = await fetch(
          `${CHAT_API_URL}?action=messages&chatId=${data.chatId}`
        );
        const messagesData = await messagesResponse.json();

        const loadedMessages = messagesData.messages.map((msg: any) => ({
          id: msg.id,
          text: msg.text,
          sender: msg.senderType === 'client' ? 'client' : 'support',
          senderName: msg.senderName,
          time: new Date(msg.createdAt).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        }));

        setMessages(loadedMessages);
      } catch (error) {
        console.error('Failed to initialize chat:', error);
      } finally {
        setLoading(false);
      }
    };

    initChat();
  }, [user]);

  useEffect(() => {
    if (!chatId) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${CHAT_API_URL}?action=messages&chatId=${chatId}`);
        const data = await response.json();

        const loadedMessages = data.messages.map((msg: any) => ({
          id: msg.id,
          text: msg.text,
          sender: msg.senderType === 'client' ? 'client' : 'support',
          senderName: msg.senderName,
          time: new Date(msg.createdAt).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        }));

        setMessages(loadedMessages);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [chatId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId) return;

    try {
      await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sendMessage',
          chatId,
          senderType: 'client',
          senderName: user.name,
          message: newMessage,
        }),
      });

      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background dark flex items-center justify-center">
        <div className="text-muted-foreground">Загрузка чата...</div>
      </div>
    );
  }

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
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              Начните общение с оператором
            </div>
          )}
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
