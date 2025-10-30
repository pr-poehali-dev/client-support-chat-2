import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const [messageText, setMessageText] = useState('');
  const [employees, setEmployees] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [newChatNotifications, setNewChatNotifications] = useState<number[]>([]);
  const [knowledgeArticles, setKnowledgeArticles] = useState<any[]>([]);
  const [isEditingArticle, setIsEditingArticle] = useState(false);
  const [currentArticle, setCurrentArticle] = useState<any>(null);
  const [shifts, setShifts] = useState<any[]>([]);
  const [isEditingShift, setIsEditingShift] = useState(false);
  const [currentShift, setCurrentShift] = useState<any>(null);

  const getRoleName = (role: string) => {
    switch (role) {
      case 'operator':
        return 'Оператор КЦ';
      case 'okk':
        return 'Сотрудник ОКК';
      case 'admin':
        return 'Администратор';
      default:
        return 'Сотрудник';
    }
  };

  const hasAccess = (section: string) => {
    const accessMatrix = {
      chats: ['operator', 'okk', 'admin'],
      myScores: ['operator', 'okk', 'admin'],
      knowledge: ['operator', 'okk', 'admin'],
      qcPortal: ['okk', 'admin'],
      monitoring: ['okk', 'admin'],
      allChats: ['admin'],
      employeeManagement: ['admin'],
      shifts: ['admin'],
      clientsDatabase: ['admin'],
      knowledgeEdit: ['admin'],
    };
    return accessMatrix[section as keyof typeof accessMatrix]?.includes(user.role) || false;
  };

  const getTimeRemaining = (deadline: string | null) => {
    if (!deadline) return null;
    const now = new Date().getTime();
    const end = new Date(deadline).getTime();
    const diff = end - now;
    
    if (diff <= 0) return { minutes: 0, seconds: 0, expired: true };
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return { minutes, seconds, expired: false };
  };

  useEffect(() => {
    const updateStatus = async () => {
      try {
        await fetch(CHAT_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'updateOperatorStatus',
            operatorName: user.name,
            status: operatorStatus,
          }),
        });
      } catch (error) {
        console.error('Failed to update operator status:', error);
      }
    };

    updateStatus();
  }, [operatorStatus, user.name]);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await fetch(`${CHAT_API_URL}?action=list&operatorName=${user.name}`);
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
          assignedAt: chat.assignedAt,
          deadline: chat.deadline,
          extensionRequested: chat.extensionRequested,
          extensionDeadline: chat.extensionDeadline,
          messages: []
        }));

        const waitingChats = formattedChats.filter((c: any) => c.status === 'waiting');
        const newWaitingChats = waitingChats.filter((c: any) => !newChatNotifications.includes(c.id));
        
        if (newWaitingChats.length > 0) {
          setNewChatNotifications(prev => [...prev, ...newWaitingChats.map((c: any) => c.id)]);
          
          if (Notification.permission === 'granted') {
            new Notification('Новый чат!', {
              body: `Поступил новый чат от клиента`,
              icon: '/favicon.ico'
            });
          }
        }

        setChats(formattedChats);
      } catch (error) {
        console.error('Failed to fetch chats:', error);
      }
    };

    fetchChats();
    const interval = setInterval(fetchChats, 3000);
    return () => clearInterval(interval);
  }, [user.name, newChatNotifications]);

  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!hasAccess('employeeManagement')) return;
    
    const fetchEmployees = async () => {
      try {
        const response = await fetch(`${CHAT_API_URL}?action=employees`);
        const data = await response.json();
        setEmployees(data.employees);
      } catch (error) {
        console.error('Failed to fetch employees:', error);
      }
    };

    fetchEmployees();
    const interval = setInterval(fetchEmployees, 5000);
    return () => clearInterval(interval);
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

  useEffect(() => {
    if (!hasAccess('knowledge')) return;
    
    const fetchKnowledge = async () => {
      try {
        const response = await fetch(`${CHAT_API_URL}?action=knowledge`);
        const data = await response.json();
        setKnowledgeArticles(data.articles);
      } catch (error) {
        console.error('Failed to fetch knowledge:', error);
      }
    };

    fetchKnowledge();
  }, [activeTab]);

  useEffect(() => {
    if (!hasAccess('shifts')) return;
    
    const fetchShifts = async () => {
      try {
        const response = await fetch(`${CHAT_API_URL}?action=shifts`);
        const data = await response.json();
        setShifts(data.shifts);
      } catch (error) {
        console.error('Failed to fetch shifts:', error);
      }
    };

    fetchShifts();
  }, [activeTab]);

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
      
      const response = await fetch(`${CHAT_API_URL}?action=messages&chatId=${chatId}`);
      const data = await response.json();
      const loadedMessages = data.messages.map((msg: any) => ({
        id: msg.id,
        sender: msg.senderType === 'client' ? 'client' : 'operator',
        text: msg.text,
        time: new Date(msg.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      }));
      
      setChats(prev => prev.map(chat => 
        chat.id === chatId ? { ...chat, messages: loadedMessages } : chat
      ));
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleSelectChat = async (chatId: number) => {
    setSelectedChat(chatId);
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

  const handleEmployeeStatusChange = async (employeeName: string, newStatus: string) => {
    try {
      await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateOperatorStatus',
          operatorName: employeeName,
          status: newStatus,
        }),
      });

      setEmployees(prev => prev.map(emp => 
        emp.name === employeeName ? { ...emp, status: newStatus } : emp
      ));
    } catch (error) {
      console.error('Failed to update employee status:', error);
    }
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

      setChats(prev => prev.filter(chat => chat.id !== chatId));
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
    } catch (error) {
      console.error('Failed to escalate chat:', error);
    }
  };

  const handleExtendChat = async (chatId: number) => {
    try {
      await fetch(CHAT_API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'extendChat',
          chatId
        }),
      });
    } catch (error) {
      console.error('Failed to extend chat:', error);
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

      setNewChatNotifications(prev => prev.filter(id => id !== chatId));
    } catch (error) {
      console.error('Failed to accept chat:', error);
    }
  };

  const handleSaveArticle = async () => {
    try {
      if (currentArticle.id) {
        await fetch(CHAT_API_URL, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'updateKnowledge',
            articleId: currentArticle.id,
            title: currentArticle.title,
            category: currentArticle.category,
            content: currentArticle.content
          }),
        });
      } else {
        await fetch(CHAT_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'createKnowledge',
            title: currentArticle.title,
            category: currentArticle.category,
            content: currentArticle.content,
            author: user.name
          }),
        });
      }

      const response = await fetch(`${CHAT_API_URL}?action=knowledge`);
      const data = await response.json();
      setKnowledgeArticles(data.articles);
      setIsEditingArticle(false);
      setCurrentArticle(null);
    } catch (error) {
      console.error('Failed to save article:', error);
    }
  };

  const handleSaveShift = async () => {
    try {
      if (currentShift.id) {
        await fetch(CHAT_API_URL, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'updateShift',
            shiftId: currentShift.id,
            employeeName: currentShift.employeeName,
            shiftDate: currentShift.shiftDate,
            startTime: currentShift.startTime,
            endTime: currentShift.endTime,
            shiftType: currentShift.shiftType
          }),
        });
      } else {
        await fetch(CHAT_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'createShift',
            employeeName: currentShift.employeeName,
            shiftDate: currentShift.shiftDate,
            startTime: currentShift.startTime,
            endTime: currentShift.endTime,
            shiftType: currentShift.shiftType
          }),
        });
      }

      const response = await fetch(`${CHAT_API_URL}?action=shifts`);
      const data = await response.json();
      setShifts(data.shifts);
      setIsEditingShift(false);
      setCurrentShift(null);
    } catch (error) {
      console.error('Failed to save shift:', error);
    }
  };

  const getStatusName = (status: string) => {
    const statusMap: Record<string, string> = {
      online: 'На линии',
      break: 'Перерыв',
      lunch: 'Обед',
      training: 'Обучение',
      dnd: 'Не беспокоить',
      offline: 'Не в сети',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      online: 'bg-green-500',
      break: 'bg-yellow-500',
      lunch: 'bg-orange-500',
      training: 'bg-blue-500',
      dnd: 'bg-destructive',
      offline: 'bg-muted',
    };
    return colorMap[status] || 'bg-muted';
  };

  const availableTabs = [];

  if (hasAccess('chats')) {
    availableTabs.push({ id: 'chats', icon: 'MessageSquare', label: 'Мои чаты' });
  }
  if (hasAccess('allChats')) {
    availableTabs.push({ id: 'allChats', icon: 'MessagesSquare', label: 'Все чаты' });
  }
  if (hasAccess('knowledge')) {
    availableTabs.push({ id: 'knowledge', icon: 'BookOpen', label: 'База знаний' });
  }
  if (hasAccess('employeeManagement')) {
    availableTabs.push({ id: 'employees', icon: 'Users', label: 'Сотрудники' });
  }
  if (hasAccess('shifts')) {
    availableTabs.push({ id: 'shifts', icon: 'Calendar', label: 'График смен' });
  }
  if (hasAccess('clientsDatabase')) {
    availableTabs.push({ id: 'clientsDatabase', icon: 'Database', label: 'База клиентов' });
  }

  const selectedChatData = chats.find(c => c.id === selectedChat);

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

      <main className="flex-1 overflow-hidden flex">
        {hasAccess('chats') && activeTab === 'chats' && (
          <>
            <div className="w-96 border-r border-border flex flex-col bg-card">
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold">Чаты</h2>
                  {newChatNotifications.length > 0 && (
                    <Badge variant="destructive">
                      {newChatNotifications.length} в очереди
                    </Badge>
                  )}
                </div>
                <Input placeholder="Поиск..." className="w-full" />
              </div>

              <ScrollArea className="flex-1">
                <div className="divide-y divide-border">
                  {chats.filter(c => c.status === 'active' || c.status === 'waiting').map((chat) => {
                    const timeRemaining = getTimeRemaining(chat.extensionRequested ? chat.extensionDeadline : chat.deadline);
                    const isMyChat = chat.assignedOperator === user.name;
                    const isSelected = selectedChat === chat.id;
                    
                    return (
                      <div
                        key={chat.id}
                        className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${isSelected ? 'bg-muted' : ''} ${newChatNotifications.includes(chat.id) ? 'bg-destructive/10' : ''}`}
                        onClick={() => handleSelectChat(chat.id)}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="w-10 h-10 bg-secondary flex-shrink-0">
                            <AvatarFallback>{chat.client.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-sm truncate">{chat.client}</h4>
                              {newChatNotifications.includes(chat.id) && (
                                <Badge variant="destructive" className="text-xs flex-shrink-0">
                                  Новый
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate mb-1">
                              {chat.phone || chat.email}
                            </p>
                            {timeRemaining && isMyChat && (
                              <div className="flex items-center gap-1">
                                <Icon name={timeRemaining.minutes < 3 ? 'AlertCircle' : 'Clock'} 
                                      size={12} 
                                      className={timeRemaining.minutes < 3 ? 'text-destructive' : 'text-muted-foreground'} />
                                <span className={`text-xs font-mono ${timeRemaining.minutes < 3 ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                                  {timeRemaining.minutes}:{String(timeRemaining.seconds).padStart(2, '0')}
                                </span>
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground flex-shrink-0">{chat.time}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            <div className="flex-1 flex flex-col bg-background">
              {selectedChatData ? (
                <>
                  <div className="p-4 border-b border-border bg-card">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12 bg-secondary">
                          <AvatarFallback>{selectedChatData.client.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-bold text-lg">{selectedChatData.client}</h3>
                          <p className="text-sm text-muted-foreground">ID {selectedChatData.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <Icon name="User" size={16} className="mr-1" />
                          Помощник
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="default">
                              <Icon name="CheckCircle" size={16} className="mr-1" />
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
                              <Button className="w-full" onClick={() => handleCloseChat(selectedChatData.id, closeReason)}>
                                Подтвердить закрытие
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>

                  <Tabs defaultValue="chat" className="flex-1 flex flex-col">
                    <div className="border-b border-border bg-card">
                      <TabsList className="w-full justify-start rounded-none h-auto p-0 bg-transparent">
                        <TabsTrigger value="chat" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                          Чат с клиентом
                        </TabsTrigger>
                        <TabsTrigger value="info" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                          Информация по задаче
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="chat" className="flex-1 flex flex-col mt-0 data-[state=inactive]:hidden">
                      <ScrollArea className="flex-1 p-4">
                        <div className="space-y-3">
                          {selectedChatData.messages?.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">Нет сообщений</p>
                          ) : (
                            selectedChatData.messages?.map((msg: any) => (
                              <div key={msg.id} className={`flex ${msg.sender === 'operator' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] p-3 rounded-lg ${msg.sender === 'operator' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border'}`}>
                                  <p className="text-sm">{msg.text}</p>
                                  <p className="text-xs opacity-70 mt-1">{msg.time}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </ScrollArea>

                      <div className="p-4 border-t border-border bg-card">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Введите сообщение..."
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(selectedChatData.id)}
                            className="flex-1"
                          />
                          <Button onClick={() => handleSendMessage(selectedChatData.id)}>
                            <Icon name="Send" size={18} />
                          </Button>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="info" className="flex-1 p-6 overflow-auto mt-0 data-[state=inactive]:hidden">
                      <div className="max-w-2xl space-y-6">
                        <div>
                          <h4 className="font-semibold mb-3">Основная информация</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs text-muted-foreground">Создана</Label>
                              <p className="text-sm font-medium">30 окт. 2025 в 18:26</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Назначена</Label>
                              <p className="text-sm font-medium">30 окт. 2025 в 18:26</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Проект</Label>
                              <p className="text-sm font-medium">КЦ Поток</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Специалист</Label>
                              <p className="text-sm font-medium text-blue-500">{selectedChatData.assignedOperator}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">ID задачи</Label>
                              <p className="text-sm font-medium">{selectedChatData.id}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Телефон</Label>
                              <p className="text-sm font-medium">{selectedChatData.phone || 'Не указан'}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Email</Label>
                              <p className="text-sm font-medium">{selectedChatData.email || 'Не указан'}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">IP адрес</Label>
                              <p className="text-sm font-medium font-mono">{selectedChatData.ipAddress}</p>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h4 className="font-semibold mb-3">Действия</h4>
                          <div className="flex gap-2 flex-wrap">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
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
                                  <Button className="w-full" onClick={() => handlePostponeChat(selectedChatData.id, postponeDate, postponeTime)}>
                                    Отложить чат
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Button variant="outline" size="sm" onClick={() => handleEscalateChat(selectedChatData.id)}>
                              <Icon name="AlertTriangle" size={14} className="mr-1" />
                              Эскалировать
                            </Button>

                            {selectedChatData.extensionRequested && (
                              <Button variant="destructive" size="sm" onClick={() => handleExtendChat(selectedChatData.id)}>
                                <Icon name="Clock" size={14} className="mr-1" />
                                Продлить +15 мин
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Icon name="MessageSquare" size={64} className="mx-auto mb-4 opacity-20" />
                    <p className="text-lg">Выберите чат для просмотра</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {hasAccess('employeeManagement') && activeTab === 'employees' && (
          <div className="flex-1 p-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Users" size={20} />
                  Управление сотрудниками
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {employees.map((employee: any) => (
                    <div key={employee.id} className="p-4 rounded-lg border border-border bg-card flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12 bg-secondary">
                          <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">{employee.name}</h4>
                          <p className="text-xs text-muted-foreground">{getRoleName(employee.role)}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(employee.status)}`}></div>
                            <span className="text-xs">{getStatusName(employee.status)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Select 
                          value={employee.status} 
                          onValueChange={(val) => handleEmployeeStatusChange(employee.name, val)}
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
                            <SelectItem value="offline">Не в сети</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                  {employees.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Icon name="Users" size={48} className="mx-auto mb-3 opacity-30" />
                      <p>Нет сотрудников</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {hasAccess('shifts') && activeTab === 'shifts' && (
          <div className="flex-1 p-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 justify-between">
                  <div className="flex items-center gap-2">
                    <Icon name="Calendar" size={20} />
                    График смен
                  </div>
                  <Button 
                    size="sm"
                    onClick={() => {
                      setCurrentShift({ employeeName: '', shiftDate: '', startTime: '', endTime: '', shiftType: 'morning' });
                      setIsEditingShift(true);
                    }}
                  >
                    <Icon name="Plus" size={16} className="mr-1" />
                    Добавить смену
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditingShift ? (
                  <div className="space-y-4 max-w-md">
                    <div>
                      <Label>Сотрудник</Label>
                      <Select 
                        value={currentShift?.employeeName || ''} 
                        onValueChange={(val) => setCurrentShift({...currentShift, employeeName: val})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите сотрудника" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map((emp: any) => (
                            <SelectItem key={emp.id} value={emp.name}>{emp.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Дата</Label>
                      <Input 
                        type="date"
                        value={currentShift?.shiftDate || ''} 
                        onChange={(e) => setCurrentShift({...currentShift, shiftDate: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Начало</Label>
                        <Input 
                          type="time"
                          value={currentShift?.startTime || ''} 
                          onChange={(e) => setCurrentShift({...currentShift, startTime: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>Конец</Label>
                        <Input 
                          type="time"
                          value={currentShift?.endTime || ''} 
                          onChange={(e) => setCurrentShift({...currentShift, endTime: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Тип смены</Label>
                      <Select 
                        value={currentShift?.shiftType || 'morning'} 
                        onValueChange={(val) => setCurrentShift({...currentShift, shiftType: val})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="morning">Утро</SelectItem>
                          <SelectItem value="day">День</SelectItem>
                          <SelectItem value="evening">Вечер</SelectItem>
                          <SelectItem value="night">Ночь</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveShift}>
                        <Icon name="Save" size={16} className="mr-1" />
                        Сохранить
                      </Button>
                      <Button variant="outline" onClick={() => {
                        setIsEditingShift(false);
                        setCurrentShift(null);
                      }}>
                        Отмена
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {shifts.map((shift: any) => (
                      <div key={shift.id} className="p-4 rounded-lg border border-border bg-card">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">{shift.employeeName}</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(shift.shiftDate).toLocaleDateString('ru-RU')} • {shift.startTime} - {shift.endTime}
                            </p>
                            <Badge className="mt-1">{shift.shiftType}</Badge>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setCurrentShift(shift);
                              setIsEditingShift(true);
                            }}
                          >
                            <Icon name="Edit" size={16} />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {shifts.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <Icon name="Calendar" size={48} className="mx-auto mb-3 opacity-30" />
                        <p>Нет запланированных смен</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {hasAccess('knowledge') && activeTab === 'knowledge' && (
          <div className="flex-1 p-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 justify-between">
                  <div className="flex items-center gap-2">
                    <Icon name="BookOpen" size={20} />
                    База знаний
                  </div>
                  {hasAccess('knowledgeEdit') && (
                    <Button 
                      size="sm"
                      onClick={() => {
                        setCurrentArticle({ title: '', category: '', content: '' });
                        setIsEditingArticle(true);
                      }}
                    >
                      <Icon name="Plus" size={16} className="mr-1" />
                      Создать статью
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditingArticle ? (
                  <div className="space-y-4 max-w-2xl">
                    <div>
                      <Label>Название</Label>
                      <Input 
                        value={currentArticle?.title || ''} 
                        onChange={(e) => setCurrentArticle({...currentArticle, title: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Категория</Label>
                      <Input 
                        value={currentArticle?.category || ''} 
                        onChange={(e) => setCurrentArticle({...currentArticle, category: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Содержание</Label>
                      <Textarea 
                        rows={10}
                        value={currentArticle?.content || ''} 
                        onChange={(e) => setCurrentArticle({...currentArticle, content: e.target.value})}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveArticle}>
                        <Icon name="Save" size={16} className="mr-1" />
                        Сохранить
                      </Button>
                      <Button variant="outline" onClick={() => {
                        setIsEditingArticle(false);
                        setCurrentArticle(null);
                      }}>
                        Отмена
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {knowledgeArticles.map((article: any) => (
                      <div key={article.id} className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">{article.title}</h4>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                              <span>{article.category}</span>
                              <span>Просмотры: {article.views}</span>
                            </div>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{article.content}</p>
                          </div>
                          {hasAccess('knowledgeEdit') && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setCurrentArticle(article);
                                setIsEditingArticle(true);
                              }}
                            >
                              <Icon name="Edit" size={16} />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {knowledgeArticles.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <Icon name="BookOpen" size={48} className="mx-auto mb-3 opacity-30" />
                        <p>Нет статей в базе знаний</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {hasAccess('clientsDatabase') && activeTab === 'clientsDatabase' && (
          <div className="flex-1 p-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Database" size={20} />
                  База данных клиентов
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-3">
                    {clients.map((client: any) => (
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
          </div>
        )}
      </main>
    </div>
  );
};

export default EmployeeDashboard;
