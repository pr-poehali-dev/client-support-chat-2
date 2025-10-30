import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

const CHAT_API_URL = 'https://functions.poehali.dev/a33a1e04-98e5-4c92-8585-2a7f74db1d36';

interface User {
  name: string;
  role: 'operator' | 'okk' | 'admin';
}

interface EmployeeDashboardProps {
  user: User;
  onLogout: () => void;
}

const EmployeeDashboard = ({ user, onLogout }: EmployeeDashboardProps) => {
  const [activeTab, setActiveTab] = useState('chats');
  const [operatorStatus, setOperatorStatus] = useState<'online' | 'break' | 'lunch' | 'training' | 'dnd'>('online');
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [postponeDate, setPostponeDate] = useState('');
  const [postponeTime, setPostponeTime] = useState('');
  const [closeReason, setCloseReason] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chats, setChats] = useState<any[]>([]);
  const [openChatId, setOpenChatId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState('');
  const [employees, setEmployees] = useState([
    { id: 1, username: 'operator1', password: 'operator', name: 'Иван Петров', role: 'operator', status: 'online' as const, chats: 15, avgScore: 92, responseTime: 2.1 },
    { id: 2, username: 'operator2', password: 'okk', name: 'Мария Сидорова', role: 'okk', status: 'online' as const, chats: 12, avgScore: 88, responseTime: 3.5 },
    { id: 3, username: 'operator3', password: 'admin', name: 'Алексей Козлов', role: 'operator', status: 'break' as const, chats: 8, avgScore: 95, responseTime: 1.8 },
  ]);
  const [clients, setClients] = useState<any[]>([]);
  const [newChatNotifications, setNewChatNotifications] = useState<number[]>([]);
  const [previousChatCount, setPreviousChatCount] = useState(0);

  const getRoleName = (role: string) => {
    switch (role) {
      case 'operator':
        return 'Оператор КЦ поток';
      case 'okk':
        return 'Сотрудник ОКК';
      case 'admin':
        return 'Супер Администратор';
      default:
        return 'Сотрудник';
    }
  };

  const hasAccess = (section: string) => {
    const accessMatrix = {
      chats: ['operator', 'okk', 'admin'],
      myScores: ['operator', 'okk', 'admin'],
      results: ['operator', 'okk', 'admin'],
      jira: ['operator', 'okk', 'admin'],
      knowledge: ['operator', 'okk', 'admin'],
      news: ['operator', 'okk', 'admin'],
      qcPortal: ['okk', 'admin'],
      monitoring: ['okk', 'admin'],
      allChats: ['admin'],
      employeeManagement: ['admin'],
      corporateChats: ['admin'],
      clientsDatabase: ['admin'],
    };
    return accessMatrix[section as keyof typeof accessMatrix]?.includes(user.role) || false;
  };

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await fetch(`${CHAT_API_URL}?action=list`);
        const data = await response.json();
        
        const formattedChats = data.chats.map((chat: any) => ({
          id: chat.id,
          client: chat.clientName || 'Клиент',
          phone: chat.phone || '',
          email: chat.email || '',
          ipAddress: chat.ipAddress || '',
          lastMessage: '',
          time: new Date(chat.updatedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          unread: 0,
          status: chat.status,
          assignedOperator: chat.assignedOperator,
          messages: []
        }));

        if (formattedChats.length > previousChatCount) {
          const newChats = formattedChats.slice(0, formattedChats.length - previousChatCount);
          setNewChatNotifications(prev => [...prev, ...newChats.map((c: any) => c.id)]);
          
          if (Notification.permission === 'granted') {
            new Notification('Новый чат!', {
              body: `Поступил новый чат от клиента`,
              icon: '/favicon.ico'
            });
          }
        }
        setPreviousChatCount(formattedChats.length);
        setChats(formattedChats);
      } catch (error) {
        console.error('Failed to fetch chats:', error);
      }
    };

    fetchChats();
    const interval = setInterval(fetchChats, 5000);
    return () => clearInterval(interval);
  }, [previousChatCount]);

  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!hasAccess('clientsDatabase')) return;
    
    const fetchClients = async () => {
      try {
        const response = await fetch(`${CHAT_API_URL}?action=clients`);
        const data = await response.json();
        setClients(data.clients);
      } catch (error) {
        console.error('Failed to fetch clients:', error);
      }
    };

    fetchClients();
    const interval = setInterval(fetchClients, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async (chatId: number) => {
    if (!messageText.trim()) return;
    
    try {
      await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sendMessage',
          chatId,
          senderType: 'operator',
          senderName: user.name,
          message: messageText,
        }),
      });

      setMessageText('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleOpenChat = async (chatId: number) => {
    setOpenChatId(chatId);
    setNewChatNotifications(prev => prev.filter(id => id !== chatId));

    try {
      const response = await fetch(`${CHAT_API_URL}?action=messages&chatId=${chatId}`);
      const data = await response.json();

      const loadedMessages = data.messages.map((msg: any) => ({
        id: msg.id,
        sender: msg.senderType === 'client' ? 'client' : 'operator',
        text: msg.text,
        time: new Date(msg.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      }));

      setChats(prev => prev.map(chat => 
        chat.id === chatId ? { ...chat, messages: loadedMessages, unread: 0 } : chat
      ));
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleEmployeeStatusChange = (employeeId: number, newStatus: 'online' | 'break' | 'lunch' | 'training' | 'dnd') => {
    setEmployees(prev => prev.map(emp => 
      emp.id === employeeId ? { ...emp, status: newStatus } : emp
    ));
  };

  const handleCloseChat = async (chatId: number, reason: string) => {
    try {
      await fetch(CHAT_API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateStatus',
          chatId,
          status: 'closed',
          assignedOperator: user.name
        }),
      });

      setChats(prev => prev.map(chat => 
        chat.id === chatId ? { ...chat, status: 'closed' } : chat
      ));
      setSelectedChat(null);
      setCloseReason('');
    } catch (error) {
      console.error('Failed to close chat:', error);
    }
  };

  const handlePostponeChat = async (chatId: number, date: string, time: string) => {
    try {
      await fetch(CHAT_API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateStatus',
          chatId,
          status: 'postponed',
          assignedOperator: user.name
        }),
      });

      setChats(prev => prev.map(chat => 
        chat.id === chatId ? { ...chat, status: 'postponed' } : chat
      ));
      setSelectedChat(null);
      setPostponeDate('');
      setPostponeTime('');
    } catch (error) {
      console.error('Failed to postpone chat:', error);
    }
  };

  const handleEscalateChat = async (chatId: number) => {
    try {
      await fetch(CHAT_API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateStatus',
          chatId,
          status: 'escalated',
          assignedOperator: user.name
        }),
      });

      setChats(prev => prev.map(chat => 
        chat.id === chatId ? { ...chat, status: 'escalated' } : chat
      ));
      setSelectedChat(null);
    } catch (error) {
      console.error('Failed to escalate chat:', error);
    }
  };

  const handleAcceptChat = async (chatId: number) => {
    try {
      await fetch(CHAT_API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateStatus',
          chatId,
          status: 'active',
          assignedOperator: user.name
        }),
      });

      setChats(prev => prev.map(chat => 
        chat.id === chatId ? { ...chat, status: 'active', assignedOperator: user.name } : chat
      ));
      setNewChatNotifications(prev => prev.filter(id => id !== chatId));
    } catch (error) {
      console.error('Failed to accept chat:', error);
    }
  };

  const mockQCScores = [
    { date: '2024-01-15', category: 'Качество обслуживания', score: 95, comment: 'Отличная работа', operator: 'Текущий оператор' },
    { date: '2024-01-10', category: 'Скорость ответа', score: 88, comment: 'Хорошо, но можно быстрее', operator: 'Текущий оператор' },
    { date: '2024-01-05', category: 'Решение проблем', score: 92, comment: 'Высокий уровень', operator: 'Текущий оператор' },
  ];

  const mockResults = [
    { metric: 'Обработано обращений', value: 127, target: 150, period: 'За месяц' },
    { metric: 'Средняя оценка', value: 4.8, target: 4.5, period: 'За месяц' },
    { metric: 'Время ответа (мин)', value: 2.3, target: 3.0, period: 'За месяц' },
  ];

  const [jiraTasks, setJiraTasks] = useState([
    { id: 'TASK-123', title: 'Ошибка в оплате', status: 'В работе', priority: 'high' as const, assignee: 'Оператор 1' },
    { id: 'TASK-124', title: 'Вопрос по доставке', status: 'Открыта', priority: 'medium' as const, assignee: 'Не назначен' },
    { id: 'TASK-125', title: 'Возврат товара', status: 'Ожидает ОКК', priority: 'low' as const, assignee: 'ОКК' },
  ]);

  const handleTaskPriorityChange = (taskId: string, newPriority: 'high' | 'medium' | 'low') => {
    setJiraTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, priority: newPriority } : task
    ));
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'bg-destructive text-destructive-foreground',
      medium: 'bg-yellow-500 text-white',
      low: 'bg-blue-500 text-white'
    };
    return colors[priority as keyof typeof colors] || 'bg-muted';
  };

  const getPriorityLabel = (priority: string) => {
    const labels = {
      high: 'Высокий',
      medium: 'Средний',
      low: 'Низкий'
    };
    return labels[priority as keyof typeof labels] || priority;
  };

  const mockKnowledge = [
    { id: 1, title: 'Как обработать возврат', category: 'Возвраты', views: 245 },
    { id: 2, title: 'Процедура оформления скидки', category: 'Скидки', views: 189 },
    { id: 3, title: 'Инструкция по работе с заказами', category: 'Заказы', views: 312 },
  ];

  const mockNews = [
    { id: 1, title: 'Обновление системы', date: '15.01.2024', text: 'Внедрены новые функции чата', author: 'Администратор' },
    { id: 2, title: 'Изменения в регламенте', date: '10.01.2024', text: 'Обновлен порядок обработки заявок', author: 'Администратор' },
  ];

  const mockMonitoring = [
    { id: 1, operator: 'Иван Петров', chats: 15, avgScore: 92, responseTime: 2.1, status: 'online' },
    { id: 2, operator: 'Мария Сидорова', chats: 12, avgScore: 88, responseTime: 3.5, status: 'online' },
    { id: 3, operator: 'Алексей Козлов', chats: 8, avgScore: 95, responseTime: 1.8, status: 'break' },
  ];

  const getStatusName = (status: string) => {
    const statusMap: Record<string, string> = {
      online: 'На линии',
      break: 'Перерыв',
      lunch: 'Обед',
      training: 'Обучение',
      dnd: 'Не беспокоить',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      online: 'bg-secondary',
      break: 'bg-yellow-500',
      lunch: 'bg-orange-500',
      training: 'bg-blue-500',
      dnd: 'bg-destructive',
    };
    return colorMap[status] || 'bg-muted';
  };

  const [corporateChats, setCorporateChats] = useState([
    { id: 1, title: 'Общий чат команды', members: 12, lastMessage: 'Всем хорошего дня!', time: '14:30' },
    { id: 2, title: 'Обновления системы', members: 8, lastMessage: 'Новая версия доступна', time: '12:15' },
  ]);

  const availableTabs = [];

  if (hasAccess('chats')) {
    availableTabs.push({ id: 'chats', icon: 'MessageSquare', label: 'Чаты' });
  }
  if (hasAccess('allChats')) {
    availableTabs.push({ id: 'allChats', icon: 'MessagesSquare', label: 'Все чаты' });
  }
  if (hasAccess('myScores')) {
    availableTabs.push({ id: 'myScores', icon: 'BarChart3', label: 'Мои оценки' });
  }
  if (hasAccess('results')) {
    availableTabs.push({ id: 'results', icon: 'TrendingUp', label: 'Результаты' });
  }
  if (hasAccess('jira')) {
    availableTabs.push({ id: 'jira', icon: 'ListTodo', label: 'Jira задачи' });
  }
  if (hasAccess('knowledge')) {
    availableTabs.push({ id: 'knowledge', icon: 'BookOpen', label: 'База знаний' });
  }
  if (hasAccess('news')) {
    availableTabs.push({ id: 'news', icon: 'Newspaper', label: 'Новости' });
  }
  if (hasAccess('qcPortal')) {
    availableTabs.push({ id: 'qcPortal', icon: 'Shield', label: 'Портал ОКК' });
  }
  if (hasAccess('monitoring')) {
    availableTabs.push({ id: 'monitoring', icon: 'Activity', label: 'Мониторинг' });
  }
  if (hasAccess('employeeManagement')) {
    availableTabs.push({ id: 'employees', icon: 'Users', label: 'Сотрудники' });
  }
  if (hasAccess('corporateChats')) {
    availableTabs.push({ id: 'corporateChats', icon: 'Building', label: 'Корп. чаты' });
  }
  if (hasAccess('clientsDatabase')) {
    availableTabs.push({ id: 'clientsDatabase', icon: 'Database', label: 'База клиентов' });
  }

  return (
    <div className="min-h-screen bg-background dark flex">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-card border-r border-border transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          {sidebarOpen && <h1 className="text-xl font-bold text-foreground">КЦ Поток</h1>}
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Icon name={sidebarOpen ? 'PanelLeftClose' : 'PanelLeftOpen'} size={20} />
          </Button>
        </div>

        <ScrollArea className="flex-1 px-2">
          <div className="space-y-1 py-2">
            {availableTabs.map(tab => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                className={`w-full ${!sidebarOpen && 'justify-center'} gap-2`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon name={tab.icon as any} size={18} />
                {sidebarOpen && <span>{tab.label}</span>}
                {tab.id === 'chats' && newChatNotifications.length > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {newChatNotifications.length}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border space-y-3">
          {(user.role === 'operator' || user.role === 'okk') && (
            <div className="space-y-2">
              <Label className={!sidebarOpen ? 'sr-only' : ''}>Статус</Label>
              <Select value={operatorStatus} onValueChange={(val) => setOperatorStatus(val as any)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">На линии</SelectItem>
                  <SelectItem value="break">Перерыв</SelectItem>
                  <SelectItem value="lunch">Обед</SelectItem>
                  <SelectItem value="training">Обучение</SelectItem>
                  <SelectItem value="dnd">Не беспокоить</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center gap-3">
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate text-foreground">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{getRoleName(user.role)}</p>
              </div>
            )}
          </div>
          
          <Button 
            variant="ghost" 
            className={`w-full gap-2 ${!sidebarOpen && 'justify-center'}`}
            onClick={onLogout}
          >
            <Icon name="LogOut" size={18} />
            {sidebarOpen && <span>Выход</span>}
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-6">

          {hasAccess('chats') && activeTab === 'chats' && (
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Users" size={20} />
                    Активные чаты с клиентами
                    {newChatNotifications.length > 0 && (
                      <Badge variant="destructive">
                        {newChatNotifications.length} новых
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Список текущих обращений • Новые чаты автоматически отображаются здесь
                  </CardDescription>
                  <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex items-center gap-2 text-sm">
                      <Icon name="Info" size={16} className="text-primary" />
                      <span className="text-foreground">
                        Система чатов работает в реальном времени
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {chats.filter(c => c.status === 'active' || c.status === 'waiting').map((chat) => (
                        <div
                          key={chat.id}
                          className={`p-4 rounded-lg border ${newChatNotifications.includes(chat.id) ? 'border-destructive bg-destructive/5' : 'border-border bg-card'} hover:shadow-md transition-shadow`}
                        >
                          <div className="flex items-center gap-4 mb-3 cursor-pointer" onClick={() => handleOpenChat(chat.id)}>
                            <Avatar className="w-12 h-12 bg-secondary">
                              <AvatarFallback>{chat.client.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-foreground">{chat.client}</h4>
                                {newChatNotifications.includes(chat.id) && (
                                  <Badge variant="destructive" className="text-xs">
                                    НОВЫЙ
                                  </Badge>
                                )}
                                {chat.status === 'waiting' && (
                                  <Badge variant="outline" className="text-xs">
                                    Ожидает
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">{chat.phone || chat.email}</p>
                              <p className="text-sm text-muted-foreground truncate">{chat.lastMessage || 'Нет сообщений'}</p>
                            </div>
                            <span className="text-xs text-muted-foreground">{chat.time}</span>
                          </div>

                          {chat.status === 'waiting' && (
                            <div className="mb-3">
                              <Button 
                                variant="default" 
                                size="sm" 
                                className="w-full"
                                onClick={() => handleAcceptChat(chat.id)}
                              >
                                <Icon name="Check" size={14} className="mr-1" />
                                Принять чат
                              </Button>
                            </div>
                          )}

                          {openChatId === chat.id && (
                            <div className="mb-3 p-3 border border-border rounded-lg bg-muted/30">
                              <div className="space-y-2 max-h-60 overflow-y-auto mb-3">
                                {chat.messages?.length === 0 ? (
                                  <p className="text-sm text-muted-foreground text-center py-4">Нет сообщений</p>
                                ) : (
                                  chat.messages?.map((msg: any) => (
                                    <div key={msg.id} className={`flex ${msg.sender === 'operator' ? 'justify-end' : 'justify-start'}`}>
                                      <div className={`max-w-[70%] p-2 rounded-lg ${msg.sender === 'operator' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border'}`}>
                                        <p className="text-sm">{msg.text}</p>
                                        <p className="text-xs opacity-70 mt-1">{msg.time}</p>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Input
                                  placeholder="Введите сообщение..."
                                  value={messageText}
                                  onChange={(e) => setMessageText(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(chat.id)}
                                />
                                <Button size="sm" onClick={() => handleSendMessage(chat.id)}>
                                  <Icon name="Send" size={16} />
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {chat.status === 'active' && (
                            <div className="flex gap-2 flex-wrap">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="default" size="sm" className="bg-secondary hover:bg-secondary/90" onClick={() => setSelectedChat(chat.id)}>
                                    <Icon name="CheckCircle" size={14} className="mr-1" />
                                    Завершить
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Завершить чат</DialogTitle>
                                    <DialogDescription>Укажите причину закрытия обращения</DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <Select value={closeReason} onValueChange={setCloseReason}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Выберите причину" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="resolved">Решено</SelectItem>
                                        <SelectItem value="no_response">Нет ответа клиента</SelectItem>
                                        <SelectItem value="spam">Спам</SelectItem>
                                        <SelectItem value="duplicate">Дубликат</SelectItem>
                                        <SelectItem value="other">Другое</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <Button className="w-full" onClick={() => handleCloseChat(chat.id, closeReason)}>
                                      Подтвердить закрытие
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>

                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" onClick={() => setSelectedChat(chat.id)}>
                                    <Icon name="Clock" size={14} className="mr-1" />
                                    Отложить
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Отложить чат</DialogTitle>
                                    <DialogDescription>Выберите дату и время возврата чата</DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label>Дата</Label>
                                      <Input type="date" value={postponeDate} onChange={(e) => setPostponeDate(e.target.value)} />
                                    </div>
                                    <div>
                                      <Label>Время</Label>
                                      <Input type="time" value={postponeTime} onChange={(e) => setPostponeTime(e.target.value)} />
                                    </div>
                                    <Button className="w-full" onClick={() => handlePostponeChat(chat.id, postponeDate, postponeTime)}>
                                      Отложить чат
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>

                              <Button variant="outline" size="sm" onClick={() => handleEscalateChat(chat.id)}>
                                <Icon name="AlertTriangle" size={14} className="mr-1" />
                                Эскалировать
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                      {chats.filter(c => c.status === 'active' || c.status === 'waiting').length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                          <Icon name="MessageSquare" size={48} className="mx-auto mb-3 opacity-30" />
                          <p>Нет активных чатов</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}

          {hasAccess('clientsDatabase') && activeTab === 'clientsDatabase' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Database" size={20} />
                  База данных клиентов
                </CardTitle>
                <CardDescription>
                  Информация о всех клиентах, которые обращались в поддержку
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-3">
                    {clients.map((client) => (
                      <div key={client.id} className="p-4 rounded-lg border border-border bg-card">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs text-muted-foreground">Имя</Label>
                            <p className="text-sm font-medium">{client.name || 'Не указано'}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Email</Label>
                            <p className="text-sm font-medium">{client.email || 'Не указано'}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Телефон</Label>
                            <p className="text-sm font-medium">{client.phone || 'Не указано'}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">IP-адрес</Label>
                            <p className="text-sm font-medium font-mono">{client.ipAddress}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Первое обращение</Label>
                            <p className="text-sm">{new Date(client.createdAt).toLocaleString('ru-RU')}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Последнее обращение</Label>
                            <p className="text-sm">{new Date(client.lastSeen).toLocaleString('ru-RU')}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {clients.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <Icon name="Database" size={48} className="mx-auto mb-3 opacity-30" />
                        <p>Нет данных о клиентах</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {hasAccess('employeeManagement') && activeTab === 'employees' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Users" size={20} />
                  Управление сотрудниками
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {employees.map((employee) => (
                    <div key={employee.id} className="p-4 rounded-lg border border-border bg-card flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12 bg-secondary">
                          <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">{employee.name}</h4>
                          <p className="text-xs text-muted-foreground">{getRoleName(employee.role)}</p>
                          <Badge className={`mt-1 ${getStatusColor(employee.status)}`}>
                            {getStatusName(employee.status)}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <Select 
                          value={employee.status} 
                          onValueChange={(val) => handleEmployeeStatusChange(employee.id, val as any)}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="online">На линии</SelectItem>
                            <SelectItem value="break">Перерыв</SelectItem>
                            <SelectItem value="lunch">Обед</SelectItem>
                            <SelectItem value="training">Обучение</SelectItem>
                            <SelectItem value="dnd">Не беспокоить</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {hasAccess('myScores') && activeTab === 'myScores' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="BarChart3" size={20} />
                  Мои оценки ОКК
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockQCScores.map((score, idx) => (
                    <div key={idx} className="p-4 rounded-lg border border-border bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">{score.category}</h4>
                          <p className="text-xs text-muted-foreground">{score.date}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-secondary">{score.score}%</div>
                        </div>
                      </div>
                      <Progress value={score.score} className="h-2" />
                      <p className="text-sm text-muted-foreground mt-2">{score.comment}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {hasAccess('results') && activeTab === 'results' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="TrendingUp" size={20} />
                  Мои результаты
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {mockResults.map((result, idx) => (
                    <div key={idx} className="p-4 rounded-lg border border-border bg-card">
                      <p className="text-xs text-muted-foreground mb-1">{result.metric}</p>
                      <div className="text-2xl font-bold text-foreground">{result.value}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <Progress value={(result.value / result.target) * 100} className="h-2 flex-1" />
                        <span className="text-xs text-muted-foreground">{result.target}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{result.period}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {hasAccess('jira') && activeTab === 'jira' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="ListTodo" size={20} />
                  Jira задачи
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {jiraTasks.map((task) => (
                    <div key={task.id} className="p-4 rounded-lg border border-border bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded">{task.id}</code>
                          <h4 className="font-semibold">{task.title}</h4>
                        </div>
                        <Badge className={getPriorityColor(task.priority)}>
                          {getPriorityLabel(task.priority)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Статус: {task.status}</span>
                        <span>Исполнитель: {task.assignee}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {hasAccess('knowledge') && activeTab === 'knowledge' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="BookOpen" size={20} />
                  База знаний
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockKnowledge.map((article) => (
                    <div key={article.id} className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition-shadow cursor-pointer">
                      <h4 className="font-semibold mb-1">{article.title}</h4>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{article.category}</span>
                        <span>Просмотры: {article.views}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {hasAccess('news') && activeTab === 'news' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Newspaper" size={20} />
                  Новости компании
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockNews.map((news) => (
                    <div key={news.id} className="p-4 rounded-lg border border-border bg-card">
                      <h4 className="font-semibold mb-1">{news.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{news.text}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{news.date}</span>
                        <span>{news.author}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </main>
    </div>
  );
};

export default EmployeeDashboard;
