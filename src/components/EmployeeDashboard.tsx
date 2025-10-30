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
  const [transferOperator, setTransferOperator] = useState('');
  const [closeReason, setCloseReason] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chats, setChats] = useState([
    { id: 1, client: 'Иван Петров', phone: '+7 (999) 123-45-67', lastMessage: 'Здравствуйте, нужна помощь', time: '14:23', unread: 2, status: 'active', messages: [
      { id: 1, sender: 'client', text: 'Здравствуйте, нужна помощь', time: '14:20' },
      { id: 2, sender: 'client', text: 'У меня проблема с заказом', time: '14:23' }
    ]},
    { id: 2, client: 'Мария Сидорова', phone: '+7 (999) 234-56-78', lastMessage: 'Спасибо за помощь!', time: '13:45', unread: 0, status: 'closed', messages: [] },
    { id: 3, client: 'Алексей Козлов', phone: '+7 (999) 345-67-89', lastMessage: 'Когда будет ответ?', time: '12:10', unread: 1, status: 'active', messages: [
      { id: 1, sender: 'client', text: 'Когда будет ответ?', time: '12:10' }
    ]},
  ]);
  const [openChatId, setOpenChatId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState('');
  const [employees, setEmployees] = useState([
    { id: 1, username: 'operator1', password: 'operator', name: 'Иван Петров', role: 'operator', status: 'online' as const, chats: 15, avgScore: 92, responseTime: 2.1 },
    { id: 2, username: 'operator2', password: 'okk', name: 'Мария Сидорова', role: 'okk', status: 'online' as const, chats: 12, avgScore: 88, responseTime: 3.5 },
    { id: 3, username: 'operator3', password: 'admin', name: 'Алексей Козлов', role: 'operator', status: 'break' as const, chats: 8, avgScore: 95, responseTime: 1.8 },
  ]);

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
    };
    return accessMatrix[section as keyof typeof accessMatrix]?.includes(user.role) || false;
  };

  useEffect(() => {
    if (operatorStatus === 'online' && (user.role === 'operator' || user.role === 'okk')) {
      const interval = setInterval(() => {
        const shouldReceiveNewChat = Math.random() > 0.8;
        if (shouldReceiveNewChat) {
          const newChatId = Date.now();
          const clients = ['Дмитрий Новиков', 'Елена Васильева', 'Сергей Морозов', 'Ольга Кузнецова', 'Павел Соколов'];
          const messages = ['Добрый день!', 'Помогите разобраться', 'У меня вопрос', 'Срочно нужна помощь', 'Не получается оформить заказ'];
          const messageText = messages[Math.floor(Math.random() * messages.length)];
          const currentTime = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
          const newChat = {
            id: newChatId,
            client: clients[Math.floor(Math.random() * clients.length)],
            phone: `+7 (999) ${Math.floor(100 + Math.random() * 900)}-${Math.floor(10 + Math.random() * 90)}-${Math.floor(10 + Math.random() * 90)}`,
            lastMessage: messageText,
            time: currentTime,
            unread: 1,
            status: 'active',
            messages: [{ id: 1, sender: 'client', text: messageText, time: currentTime }]
          };
          setChats(prev => [newChat, ...prev]);
        }
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [operatorStatus, user.role]);

  const handleSendMessage = (chatId: number) => {
    if (!messageText.trim()) return;
    const currentTime = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        const newMessage = { id: (chat.messages?.length || 0) + 1, sender: 'operator', text: messageText, time: currentTime };
        return {
          ...chat,
          messages: [...(chat.messages || []), newMessage],
          lastMessage: messageText,
          time: currentTime,
          unread: 0
        };
      }
      return chat;
    }));
    setMessageText('');
  };

  const handleOpenChat = (chatId: number) => {
    setOpenChatId(chatId);
    setChats(prev => prev.map(chat => 
      chat.id === chatId ? { ...chat, unread: 0 } : chat
    ));
  };

  const handleEmployeeStatusChange = (employeeId: number, newStatus: 'online' | 'break' | 'lunch' | 'training' | 'dnd') => {
    setEmployees(prev => prev.map(emp => 
      emp.id === employeeId ? { ...emp, status: newStatus } : emp
    ));
  };

  const handleCloseChat = (chatId: number, reason: string) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId ? { ...chat, status: 'closed' } : chat
    ));
    setSelectedChat(null);
    setCloseReason('');
  };

  const handlePostponeChat = (chatId: number, date: string, time: string) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId ? { ...chat, status: 'postponed' } : chat
    ));
    setSelectedChat(null);
    setPostponeDate('');
    setPostponeTime('');
  };

  const handleTransferChat = (chatId: number, operatorId: string) => {
    setChats(prev => prev.filter(chat => chat.id !== chatId));
    setSelectedChat(null);
    setTransferOperator('');
  };

  const handleEscalateChat = (chatId: number) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId ? { ...chat, status: 'escalated' } : chat
    ));
    setSelectedChat(null);
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
  if (hasAccess('chats')) availableTabs.push({ value: 'chats', label: 'Чаты', icon: 'MessageSquare' });
  if (hasAccess('myScores')) availableTabs.push({ value: 'myScores', label: 'Мои оценки', icon: 'Award' });
  if (hasAccess('results')) availableTabs.push({ value: 'results', label: 'Результаты', icon: 'TrendingUp' });
  if (hasAccess('jira')) availableTabs.push({ value: 'jira', label: 'Jira', icon: 'ListTodo' });
  if (hasAccess('knowledge')) availableTabs.push({ value: 'knowledge', label: 'База знаний', icon: 'BookOpen' });
  if (hasAccess('news')) availableTabs.push({ value: 'news', label: 'Новости', icon: 'Newspaper' });
  if (hasAccess('qcPortal')) availableTabs.push({ value: 'qcPortal', label: 'Портал QC', icon: 'ClipboardCheck' });
  if (hasAccess('monitoring')) availableTabs.push({ value: 'monitoring', label: 'Мониторинг', icon: 'Monitor' });
  if (hasAccess('allChats')) availableTabs.push({ value: 'allChats', label: 'Все чаты', icon: 'Database' });
  if (hasAccess('employeeManagement')) availableTabs.push({ value: 'employeeManagement', label: 'Сотрудники', icon: 'Users' });
  if (hasAccess('corporateChats')) availableTabs.push({ value: 'corporateChats', label: 'Корп. чаты', icon: 'Building2' });

  return (
    <div className="min-h-screen bg-background dark flex">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-card border-r border-border transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          {sidebarOpen && <h1 className="font-bold text-lg text-foreground">КЦ Система</h1>}
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Icon name={sidebarOpen ? "PanelLeftClose" : "PanelLeftOpen"} size={20} />
          </Button>
        </div>
        
        <ScrollArea className="flex-1 p-2">
          <div className="space-y-1">
            {availableTabs.map((tab) => (
              <Button
                key={tab.value}
                variant={activeTab === tab.value ? "secondary" : "ghost"}
                className={`w-full justify-start gap-2 ${!sidebarOpen && 'justify-center'}`}
                onClick={() => setActiveTab(tab.value)}
              >
                <Icon name={tab.icon as any} size={18} />
                {sidebarOpen && <span>{tab.label}</span>}
              </Button>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border space-y-3">
          {(user.role === 'operator' || user.role === 'okk') && sidebarOpen && (
            <Select value={operatorStatus} onValueChange={setOperatorStatus}>
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(operatorStatus)}`} />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="online">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-secondary" />
                    На линии
                  </div>
                </SelectItem>
                <SelectItem value="break">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    Перерыв
                  </div>
                </SelectItem>
                <SelectItem value="lunch">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    Обед
                  </div>
                </SelectItem>
                <SelectItem value="training">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    Обучение
                  </div>
                </SelectItem>
                <SelectItem value="dnd">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-destructive" />
                    Не беспокоить
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          )}
          
          <div className={`flex items-center gap-3 ${!sidebarOpen && 'flex-col'}`}>
            <Avatar className="w-10 h-10 bg-primary">
              <AvatarFallback className="text-primary-foreground font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-foreground text-sm truncate">{user.name}</h2>
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
                  </CardTitle>
                  <CardDescription>
                    Список текущих обращений • Новые чаты автоматически распределяются на операторов со статусом "На линии"
                  </CardDescription>
                  <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex items-center gap-2 text-sm">
                      <Icon name="Info" size={16} className="text-primary" />
                      <span className="text-foreground">
                        Автораспределение активно. Чаты назначаются оператору с наименьшей нагрузкой.
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {chats.filter(c => c.status === 'active').map((chat) => (
                        <div
                          key={chat.id}
                          className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center gap-4 mb-3 cursor-pointer" onClick={() => handleOpenChat(chat.id)}>
                            <Avatar className="w-12 h-12 bg-secondary">
                              <AvatarFallback>{chat.client.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-foreground">{chat.client}</h4>
                                {chat.unread > 0 && (
                                  <Badge variant="default" className="text-xs">
                                    {chat.unread}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">{chat.phone}</p>
                              <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                            </div>
                            <span className="text-xs text-muted-foreground">{chat.time}</span>
                          </div>

                          {openChatId === chat.id && (
                            <div className="mb-3 p-3 border border-border rounded-lg bg-muted/30">
                              <div className="space-y-2 max-h-60 overflow-y-auto mb-3">
                                {chat.messages?.map((msg) => (
                                  <div key={msg.id} className={`flex ${msg.sender === 'operator' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] p-2 rounded-lg ${msg.sender === 'operator' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border'}`}>
                                      <p className="text-sm">{msg.text}</p>
                                      <p className="text-xs opacity-70 mt-1">{msg.time}</p>
                                    </div>
                                  </div>
                                ))}
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

                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setSelectedChat(chat.id)}>
                                  <Icon name="UserCog" size={14} className="mr-1" />
                                  Перевести
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Перевести чат</DialogTitle>
                                  <DialogDescription>Выберите оператора для передачи чата</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <Select value={transferOperator} onValueChange={setTransferOperator}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Выберите оператора" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="op1">Оператор 1 (На линии)</SelectItem>
                                      <SelectItem value="op2">Оператор 2 (На линии)</SelectItem>
                                      <SelectItem value="op3">Оператор 3 (На линии)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button className="w-full" onClick={() => handleTransferChat(chat.id, transferOperator)}>
                                    Перевести чат
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}

          {hasAccess('myScores') && activeTab === 'myScores' && (
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Award" size={20} />
                    Мои оценки QC
                  </CardTitle>
                  <CardDescription>Результаты проверки качества работы</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockQCScores.map((score, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-foreground">{score.category}</h4>
                            <p className="text-xs text-muted-foreground">{score.date}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-2xl font-bold ${
                                score.score >= 90
                                  ? 'text-secondary'
                                  : score.score >= 80
                                  ? 'text-primary'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              {score.score}
                            </span>
                            <Icon
                              name={score.score >= 90 ? 'ThumbsUp' : 'CheckCircle'}
                              size={20}
                              className={score.score >= 90 ? 'text-secondary' : 'text-primary'}
                            />
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{score.comment}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {hasAccess('results') && activeTab === 'results' && (
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="BarChart3" size={20} />
                    Результаты работы
                  </CardTitle>
                  <CardDescription>Статистика и показатели эффективности</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {mockResults.map((result, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-foreground">{result.metric}</h4>
                            <p className="text-xs text-muted-foreground">{result.period}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-bold text-primary">{result.value}</span>
                            <span className="text-sm text-muted-foreground"> / {result.target}</span>
                          </div>
                        </div>
                        <Progress value={(result.value / result.target) * 100} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {hasAccess('jira') && activeTab === 'jira' && (
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Ticket" size={20} />
                    Портал Jira
                  </CardTitle>
                  <CardDescription>Создавайте и отслеживайте задания</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Icon name="Plus" size={18} />
                        Создать новое задание
                      </h4>
                      <div className="space-y-3">
                        <Input placeholder="Название задания" />
                        <Textarea placeholder="Описание задания" rows={3} />
                        <Button className="w-full">
                          <Icon name="Send" size={16} className="mr-2" />
                          Создать задание
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Icon name="List" size={18} />
                        Мои задания
                      </h4>
                      {jiraTasks.map((task) => (
                        <div
                          key={task.id}
                          className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-mono text-muted-foreground">{task.id}</span>
                              </div>
                              <h4 className="font-semibold text-foreground">{task.title}</h4>
                              <p className="text-xs text-muted-foreground mt-1">Исполнитель: {task.assignee}</p>
                            </div>
                            <Badge variant="outline">{task.status}</Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <span className="text-xs text-muted-foreground">Приоритет:</span>
                            <Select value={task.priority} onValueChange={(val: any) => handleTaskPriorityChange(task.id, val)}>
                              <SelectTrigger className="h-7 w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="high">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-destructive" />
                                    Высокий
                                  </div>
                                </SelectItem>
                                <SelectItem value="medium">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                    Средний
                                  </div>
                                </SelectItem>
                                <SelectItem value="low">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                    Низкий
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <Badge className={getPriorityColor(task.priority)}>
                              {getPriorityLabel(task.priority)}
                            </Badge>
                          </div>
                          {user.role === 'okk' || user.role === 'admin' ? (
                            <Button variant="outline" size="sm" className="mt-2">
                              <Icon name="Edit" size={14} className="mr-1" />
                              Обработать
                            </Button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {hasAccess('knowledge') && activeTab === 'knowledge' && (
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="BookOpen" size={20} />
                    База знаний
                  </CardTitle>
                  <CardDescription>Инструкции и руководства для работы</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <Input placeholder="Поиск в базе знаний..." className="w-full" />
                  </div>
                  <div className="space-y-3">
                    {mockKnowledge.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <Badge variant="outline">{item.category}</Badge>
                              <span className="flex items-center gap-1">
                                <Icon name="Eye" size={12} />
                                {item.views} просмотров
                              </span>
                            </div>
                          </div>
                          <Icon name="ChevronRight" size={20} className="text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {hasAccess('news') && activeTab === 'news' && (
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Megaphone" size={20} />
                    Новости и объявления
                  </CardTitle>
                  <CardDescription>Важная информация для сотрудников</CardDescription>
                  {user.role === 'admin' && (
                    <Button className="mt-4">
                      <Icon name="Plus" size={16} className="mr-2" />
                      Добавить новость
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockNews.map((news) => (
                      <div
                        key={news.id}
                        className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-foreground">{news.title}</h4>
                          <span className="text-xs text-muted-foreground">{news.date}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{news.text}</p>
                        <p className="text-xs text-muted-foreground">Автор: {news.author}</p>
                        {user.role === 'admin' && (
                          <div className="flex gap-2 mt-3">
                            <Button variant="outline" size="sm">
                              <Icon name="Edit" size={14} className="mr-1" />
                              Изменить
                            </Button>
                            <Button variant="outline" size="sm">
                              <Icon name="Trash2" size={14} className="mr-1" />
                              Удалить
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {hasAccess('qcPortal') && activeTab === 'qcPortal' && (
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="ClipboardCheck" size={20} />
                    Портал QC
                  </CardTitle>
                  <CardDescription>Оценка качества работы операторов</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Icon name="Plus" size={18} />
                        Добавить оценку
                      </h4>
                      <div className="space-y-3">
                        <Input placeholder="Выберите оператора" />
                        <Input placeholder="Категория оценки" />
                        <Input type="number" placeholder="Балл (0-100)" />
                        <Textarea placeholder="Комментарий" rows={3} />
                        <Button className="w-full">
                          <Icon name="Save" size={16} className="mr-2" />
                          Сохранить оценку
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Icon name="History" size={18} />
                        Последние оценки
                      </h4>
                      {mockQCScores.map((score, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-foreground">{score.category}</h4>
                              <p className="text-xs text-muted-foreground">
                                {score.operator} • {score.date}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">{score.comment}</p>
                            </div>
                            <span className="text-2xl font-bold text-primary">{score.score}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {hasAccess('monitoring') && activeTab === 'monitoring' && (
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Monitor" size={20} />
                    Мониторинг операторов
                  </CardTitle>
                  <CardDescription>Текущая активность и показатели</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {employees.map((emp) => (
                      <div
                        key={emp.id}
                        className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="w-12 h-12 bg-primary">
                            <AvatarFallback>{emp.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div>
                              <p className="font-semibold text-foreground">{emp.name}</p>
                              <p className="text-xs text-muted-foreground">{getRoleName(emp.role)}</p>
                            </div>
                            <div>
                              <Select value={emp.status} onValueChange={(val: any) => handleEmployeeStatusChange(emp.id, val)}>
                                <SelectTrigger className="h-8">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${getStatusColor(emp.status)}`} />
                                    <SelectValue />
                                  </div>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="online">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-secondary" />
                                      На линии
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="break">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                      Перерыв
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="lunch">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                                      Обед
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="training">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                                      Обучение
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="dnd">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-destructive" />
                                      Не беспокоить
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Активных чатов</p>
                              <p className="text-lg font-bold text-foreground">{emp.chats}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Средний балл</p>
                              <p className="text-lg font-bold text-secondary">{emp.avgScore}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Время ответа</p>
                              <p className="text-lg font-bold text-primary">{emp.responseTime} мин</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {hasAccess('allChats') && activeTab === 'allChats' && (
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Database" size={20} />
                    Все чаты системы
                  </CardTitle>
                  <CardDescription>Полный список всех обращений клиентов</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex gap-2">
                    <Input placeholder="Поиск по клиенту, телефону..." className="flex-1" />
                    <Button variant="outline">
                      <Icon name="Filter" size={16} className="mr-2" />
                      Фильтры
                    </Button>
                  </div>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {mockChats.map((chat) => (
                        <div
                          key={chat.id}
                          className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:shadow-md transition-shadow cursor-pointer"
                        >
                          <Avatar className="w-12 h-12 bg-secondary">
                            <AvatarFallback>{chat.client.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-foreground">{chat.client}</h4>
                              <Badge variant={chat.status === 'active' ? 'default' : 'secondary'}>
                                {chat.status === 'active' ? 'Активный' : 'Закрыт'}
                              </Badge>
                              {chat.unread > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {chat.unread}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mb-1">{chat.phone}</p>
                            <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-muted-foreground block mb-2">{chat.time}</span>
                            <Button variant="ghost" size="sm">
                              <Icon name="ExternalLink" size={14} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}

          {hasAccess('employeeManagement') && activeTab === 'employeeManagement' && (
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="UserCog" size={20} />
                    Управление сотрудниками
                  </CardTitle>
                  <CardDescription>Управление учетными записями и ролями</CardDescription>
                  <Button className="mt-4">
                    <Icon name="UserPlus" size={16} className="mr-2" />
                    Добавить сотрудника
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {employees.map((emp) => (
                      <div
                        key={emp.id}
                        className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="w-12 h-12 bg-primary">
                            <AvatarFallback>{emp.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground">{emp.name}</h4>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                              <span>Логин: {emp.username}</span>
                              <span>•</span>
                              <span>Пароль: {emp.password}</span>
                            </div>
                            <Badge variant="outline" className="mt-2">
                              {emp.role === 'operator'
                                ? 'Оператор КЦ'
                                : emp.role === 'okk'
                                ? 'ОКК'
                                : 'Администратор'}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Icon name="Edit" size={14} className="mr-1" />
                              Изменить
                            </Button>
                            <Button variant="outline" size="sm">
                              <Icon name="Trash2" size={14} className="mr-1" />
                              Удалить
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {hasAccess('corporateChats') && activeTab === 'corporateChats' && (
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Building2" size={20} />
                    Корпоративные чаты
                  </CardTitle>
                  <CardDescription>Внутренние чаты команды (только администратор)</CardDescription>
                  <Button className="mt-4">
                    <Icon name="Plus" size={16} className="mr-2" />
                    Создать новый чат
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {corporateChats.map((chat) => (
                      <div
                        key={chat.id}
                        className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                            <Icon name="Users" size={24} className="text-secondary-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-foreground">{chat.title}</h4>
                              <Badge variant="secondary">{chat.members} участников</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-muted-foreground block mb-2">{chat.time}</span>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm">
                                <Icon name="MessageSquare" size={14} />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Icon name="UserPlus" size={14} />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Icon name="Settings" size={14} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default EmployeeDashboard;