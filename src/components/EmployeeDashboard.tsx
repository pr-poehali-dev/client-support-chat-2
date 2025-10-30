import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';

interface User {
  name: string;
  role: string;
}

interface EmployeeDashboardProps {
  user: User;
  onLogout: () => void;
}

const EmployeeDashboard = ({ user, onLogout }: EmployeeDashboardProps) => {
  const [activeTab, setActiveTab] = useState('chats');

  const mockChats = [
    { id: 1, client: 'Иван Петров', lastMessage: 'Здравствуйте, нужна помощь', time: '14:23', unread: 2 },
    { id: 2, client: 'Мария Сидорова', lastMessage: 'Спасибо за помощь!', time: '13:45', unread: 0 },
    { id: 3, client: 'Алексей Козлов', lastMessage: 'Когда будет ответ?', time: '12:10', unread: 1 },
  ];

  const mockQCScores = [
    { date: '2024-01-15', category: 'Качество обслуживания', score: 95, comment: 'Отличная работа' },
    { date: '2024-01-10', category: 'Скорость ответа', score: 88, comment: 'Хорошо, но можно быстрее' },
    { date: '2024-01-05', category: 'Решение проблем', score: 92, comment: 'Высокий уровень' },
  ];

  const mockJiraTasks = [
    { id: 'TASK-123', title: 'Ошибка в оплате', status: 'В работе', priority: 'high' },
    { id: 'TASK-124', title: 'Вопрос по доставке', status: 'Открыта', priority: 'medium' },
    { id: 'TASK-125', title: 'Возврат товара', status: 'Ожидает ОКК', priority: 'low' },
  ];

  const mockNews = [
    { id: 1, title: 'Обновление системы', date: '15.01.2024', text: 'Внедрены новые функции чата' },
    { id: 2, title: 'Изменения в регламенте', date: '10.01.2024', text: 'Обновлен порядок обработки заявок' },
  ];

  return (
    <div className="min-h-screen bg-background dark">
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 bg-primary">
                <AvatarFallback className="text-primary-foreground font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold text-foreground">{user.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {user.role === 'admin' ? 'Супер Администратор' : 'Сотрудник'}
                </p>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onLogout}>
            <Icon name="LogOut" size={20} />
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="chats" className="gap-2">
              <Icon name="MessageSquare" size={16} />
              Чаты
            </TabsTrigger>
            <TabsTrigger value="qc" className="gap-2">
              <Icon name="BarChart3" size={16} />
              Оценки QC
            </TabsTrigger>
            <TabsTrigger value="jira" className="gap-2">
              <Icon name="ListTodo" size={16} />
              Jira
            </TabsTrigger>
            <TabsTrigger value="news" className="gap-2">
              <Icon name="Newspaper" size={16} />
              Новости
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chats">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Users" size={20} />
                  Активные чаты с клиентами
                </CardTitle>
                <CardDescription>Список текущих обращений</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {mockChats.map((chat) => (
                      <div
                        key={chat.id}
                        className="flex items-center gap-4 p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors cursor-pointer"
                      >
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
                          <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{chat.time}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="qc">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="TrendingUp" size={20} />
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
          </TabsContent>

          <TabsContent value="jira">
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
                    {mockJiraTasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono text-muted-foreground">{task.id}</span>
                              <Badge
                                variant={
                                  task.priority === 'high'
                                    ? 'destructive'
                                    : task.priority === 'medium'
                                    ? 'default'
                                    : 'secondary'
                                }
                              >
                                {task.priority === 'high'
                                  ? 'Высокий'
                                  : task.priority === 'medium'
                                  ? 'Средний'
                                  : 'Низкий'}
                              </Badge>
                            </div>
                            <h4 className="font-semibold text-foreground">{task.title}</h4>
                          </div>
                          <Badge variant="outline">{task.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="news">
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
                      <p className="text-sm text-muted-foreground">{news.text}</p>
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
