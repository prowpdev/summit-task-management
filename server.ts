import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// Persistent Database Directory & File
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: 'manager' | 'member';
  avatarUrl?: string;
  department: string;
  title: string;
}

interface SubtaskRecord {
  id: string;
  title: string;
  completed: boolean;
}

interface TaskRecord {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'in_review' | 'completed';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  category: 'Engineering' | 'Design' | 'Marketing' | 'Operations' | 'General';
  assigneeId: string;
  creatorId: string;
  dueDate: string;
  dueTime?: string;
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly';
  reminderMinutesBefore?: number;
  subtasks: SubtaskRecord[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface NotificationRecord {
  id: string;
  userId: string;
  senderId: string;
  senderName: string;
  taskId: string;
  taskTitle: string;
  type: 'assignment' | 'status_change' | 'due_reminder' | 'comment';
  message: string;
  read: boolean;
  createdAt: string;
}

interface DatabaseSchema {
  users: UserRecord[];
  tasks: TaskRecord[];
  notifications: NotificationRecord[];
}

// Seed initial dataset
const today = new Date();
const formatDate = (offsetDays: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

const defaultDb: DatabaseSchema = {
  users: [
    {
      id: 'usr-manager',
      name: 'Alex Morgan',
      email: 'alex.morgan@taskflow.dev',
      role: 'manager',
      department: 'Engineering Leadership',
      title: 'Engineering Director',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    },
    {
      id: 'usr-member-1',
      name: 'Sarah Chen',
      email: 'sarah.chen@taskflow.dev',
      role: 'member',
      department: 'Frontend Engineering',
      title: 'Staff UI Engineer',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
    },
    {
      id: 'usr-member-2',
      name: 'Marcus Vance',
      email: 'marcus.vance@taskflow.dev',
      role: 'member',
      department: 'Product Design',
      title: 'Lead Design Systems',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    },
    {
      id: 'usr-member-3',
      name: 'Elena Rostova',
      email: 'elena.rostova@taskflow.dev',
      role: 'member',
      department: 'Core Infrastructure',
      title: 'Senior Distributed Engineer',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    },
  ],
  tasks: [
    {
      id: 'task-101',
      title: 'Audit client API payload caching & rate limiters',
      description: 'Review endpoint serialization layers and implement token-bucket throttling for high-throughput client polling.',
      status: 'in_progress',
      priority: 'urgent',
      category: 'Engineering',
      assigneeId: 'usr-member-1',
      creatorId: 'usr-manager',
      dueDate: formatDate(0), // Today
      dueTime: '17:00',
      recurrence: 'weekly',
      reminderMinutesBefore: 60,
      subtasks: [
        { id: 'sub-1', title: 'Profile request payloads in development', completed: true },
        { id: 'sub-2', title: 'Verify authorization token header injection', completed: true },
        { id: 'sub-3', title: 'Benchmark memory overhead under concurrency', completed: false },
      ],
      tags: ['API', 'Security', 'Performance'],
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-102',
      title: 'Design token audit for light mode contrast ratios',
      description: 'Ensure all card backgrounds, text kickers, and priority labels meet strict WCAG AA 4.5:1 legibility ratios without pill containers.',
      status: 'todo',
      priority: 'high',
      category: 'Design',
      assigneeId: 'usr-member-2',
      creatorId: 'usr-manager',
      dueDate: formatDate(1), // Tomorrow
      dueTime: '14:30',
      recurrence: 'none',
      reminderMinutesBefore: 30,
      subtasks: [
        { id: 'sub-4', title: 'Check Slate-500 against white card surfaces', completed: true },
        { id: 'sub-5', title: 'Validate priority border and text badges', completed: false },
      ],
      tags: ['Design System', 'Accessibility', 'Tokens'],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-103',
      title: 'Setup automated database snapshot backups',
      description: 'Configure automated daily cron for state snapshotting and transactional rollbacks to safeguard persistent records.',
      status: 'in_review',
      priority: 'medium',
      category: 'Operations',
      assigneeId: 'usr-member-3',
      creatorId: 'usr-manager',
      dueDate: formatDate(3),
      dueTime: '12:00',
      recurrence: 'daily',
      reminderMinutesBefore: 120,
      subtasks: [
        { id: 'sub-6', title: 'Script JSON database atomic write mechanism', completed: true },
        { id: 'sub-7', title: 'Test recovery pipeline with dummy data', completed: true },
      ],
      tags: ['DevOps', 'Storage', 'Reliability'],
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-104',
      title: 'Release quarterly sprint release changelog',
      description: 'Document key milestones, drag-and-drop improvements, multi-user assignment features, and export release notes.',
      status: 'completed',
      priority: 'low',
      category: 'Marketing',
      assigneeId: 'usr-member-1',
      creatorId: 'usr-manager',
      dueDate: formatDate(-1), // Yesterday (completed)
      dueTime: '16:00',
      recurrence: 'monthly',
      reminderMinutesBefore: 60,
      subtasks: [
        { id: 'sub-8', title: 'Draft release summary blog post', completed: true },
        { id: 'sub-9', title: 'Share preview video with stakeholder leads', completed: true },
      ],
      tags: ['Release', 'Documentation'],
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'task-105',
      title: 'Draft architecture overview for multi-tenant scaling',
      description: 'Prepare documentation on centralizing API calls, database isolation, and notification broadcast workers for team review.',
      status: 'todo',
      priority: 'high',
      category: 'Engineering',
      assigneeId: 'usr-member-3',
      creatorId: 'usr-manager',
      dueDate: formatDate(4),
      dueTime: '18:00',
      recurrence: 'none',
      reminderMinutesBefore: 60,
      subtasks: [
        { id: 'sub-10', title: 'Define interface contract for data providers', completed: false },
        { id: 'sub-11', title: 'Benchmark real-time event distribution', completed: false },
      ],
      tags: ['Architecture', 'Docs'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-106',
      title: 'Weekly team engineering sync & retrospective',
      description: 'Recurring weekly touchpoint to review completed assignments, eliminate roadblocks, and plan next sprint backlog.',
      status: 'todo',
      priority: 'medium',
      category: 'General',
      assigneeId: 'usr-manager',
      creatorId: 'usr-manager',
      dueDate: formatDate(2),
      dueTime: '10:00',
      recurrence: 'weekly',
      reminderMinutesBefore: 15,
      subtasks: [
        { id: 'sub-12', title: 'Review in-progress pull requests', completed: false },
        { id: 'sub-13', title: 'Assign upcoming urgent backlog tasks', completed: false },
      ],
      tags: ['Sync', 'Weekly'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  notifications: [
    {
      id: 'notif-1',
      userId: 'usr-member-1',
      senderId: 'usr-manager',
      senderName: 'Alex Morgan',
      taskId: 'task-101',
      taskTitle: 'Audit client API payload caching & rate limiters',
      type: 'assignment',
      message: 'Alex Morgan (Manager) assigned you to: "Audit client API payload caching & rate limiters"',
      read: false,
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'notif-2',
      userId: 'usr-member-2',
      senderId: 'usr-manager',
      senderName: 'Alex Morgan',
      taskId: 'task-102',
      taskTitle: 'Design token audit for light mode contrast ratios',
      type: 'assignment',
      message: 'Alex Morgan (Manager) assigned you to: "Design token audit for light mode contrast ratios"',
      read: false,
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
  ],
};

function loadDatabase(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.tasks)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading DB_FILE, falling back to default:', err);
  }
  // Initialize default
  saveDatabase(defaultDb);
  return defaultDb;
}

function saveDatabase(data: DatabaseSchema): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing DB_FILE:', err);
  }
}

// In-memory reference synced to disk
let db = loadDatabase();

// SSE (Server-Sent Events) clients for immediate real-time notifications
const sseClients = new Set<{
  userId: string;
  res: Response;
}>();

function broadcastNotification(notification: NotificationRecord) {
  for (const client of sseClients) {
    if (client.userId === notification.userId || client.userId === 'all') {
      try {
        client.res.write(`data: ${JSON.stringify({ type: 'notification', payload: notification })}\n\n`);
      } catch (err) {
        console.error('Failed writing to SSE client:', err);
      }
    }
  }
}

function broadcastTaskUpdate(task: TaskRecord, action: 'created' | 'updated' | 'deleted') {
  for (const client of sseClients) {
    try {
      client.res.write(`data: ${JSON.stringify({ type: 'task_event', action, payload: task })}\n\n`);
    } catch (err) {
      console.error('Failed writing task event to SSE client:', err);
    }
  }
}

// Authentication middleware helper
let activeSessionUserId = 'usr-manager'; // Default active demo user

function getCurrentUser(req: Request): UserRecord {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim();
    const user = db.users.find(u => u.id === token || u.email === token);
    if (user) return user;
  }
  // Fallback to active demo session user
  const fallback = db.users.find(u => u.id === activeSessionUserId);
  return fallback || db.users[0];
}

// ======================== API ROUTES ========================

// 1. Auth Endpoints
app.get('/api/auth/me', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req);
  res.json({ success: true, data: currentUser });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email } = req.body;
  const user = db.users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
  if (!user) {
    return res.status(401).json({ success: false, error: 'User not found. Please register or choose a demo account.' });
  }
  activeSessionUserId = user.id;
  res.json({
    success: true,
    data: {
      user,
      token: user.id,
    },
  });
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, email, role, department, title } = req.body;
  if (!name || !email) {
    return res.status(400).json({ success: false, error: 'Name and email are required.' });
  }

  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ success: false, error: 'A user with this email already exists.' });
  }

  const newUser: UserRecord = {
    id: `usr-${Date.now()}`,
    name,
    email,
    role: role || 'member',
    department: department || 'General',
    title: title || 'Team Contributor',
    avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80`,
  };

  db.users.push(newUser);
  saveDatabase(db);
  activeSessionUserId = newUser.id;

  res.json({
    success: true,
    data: {
      user: newUser,
      token: newUser.id,
    },
  });
});

app.post('/api/auth/switch-user', (req: Request, res: Response) => {
  const { userId } = req.body;
  const user = db.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found.' });
  }
  activeSessionUserId = user.id;
  res.json({
    success: true,
    data: {
      user,
      token: user.id,
    },
  });
});

// 2. Users Endpoint
app.get('/api/users', (_req: Request, res: Response) => {
  res.json({ success: true, data: db.users });
});

app.get('/api/users/:id', (req: Request, res: Response) => {
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  res.json({ success: true, data: user });
});

// 3. Tasks Endpoints
app.get('/api/tasks', (req: Request, res: Response) => {
  const { q, category, priority, dateFilter, assigneeId } = req.query;
  let filtered = [...db.tasks];

  // Search filter
  if (q && typeof q === 'string') {
    const query = q.toLowerCase().trim();
    filtered = filtered.filter(
      t =>
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }

  // Category filter
  if (category && typeof category === 'string' && category !== 'all') {
    filtered = filtered.filter(t => t.category.toLowerCase() === category.toLowerCase());
  }

  // Priority filter
  if (priority && typeof priority === 'string' && priority !== 'all') {
    filtered = filtered.filter(t => t.priority.toLowerCase() === priority.toLowerCase());
  }

  // Assignee filter
  if (assigneeId && typeof assigneeId === 'string' && assigneeId !== 'all') {
    filtered = filtered.filter(t => t.assigneeId === assigneeId);
  }

  // Date horizon filter
  if (dateFilter && typeof dateFilter === 'string' && dateFilter !== 'all') {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const startWeekStr = startOfWeek.toISOString().split('T')[0];
    const endWeekStr = endOfWeek.toISOString().split('T')[0];

    if (dateFilter === 'today') {
      filtered = filtered.filter(t => t.dueDate === todayStr);
    } else if (dateFilter === 'this_week') {
      filtered = filtered.filter(t => t.dueDate >= startWeekStr && t.dueDate <= endWeekStr);
    } else if (dateFilter === 'overdue') {
      filtered = filtered.filter(t => t.status !== 'completed' && t.dueDate < todayStr);
    }
  }

  // Sort by updatedAt descending
  filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  res.json({ success: true, data: filtered });
});

app.get('/api/tasks/:id', (req: Request, res: Response) => {
  const task = db.tasks.find(t => t.id === req.params.id);
  if (!task) {
    return res.status(404).json({ success: false, error: 'Task not found' });
  }
  res.json({ success: true, data: task });
});

app.post('/api/tasks', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req);
  const {
    title,
    description,
    status,
    priority,
    category,
    assigneeId,
    dueDate,
    dueTime,
    recurrence,
    reminderMinutesBefore,
    subtasks,
    tags,
  } = req.body;

  if (!title) {
    return res.status(400).json({ success: false, error: 'Task title is required.' });
  }

  const targetAssigneeId = assigneeId || currentUser.id;

  const newTask: TaskRecord = {
    id: `task-${Date.now()}`,
    title: title.trim(),
    description: description ? description.trim() : '',
    status: status || 'todo',
    priority: priority || 'medium',
    category: category || 'General',
    assigneeId: targetAssigneeId,
    creatorId: currentUser.id,
    dueDate: dueDate || new Date().toISOString().split('T')[0],
    dueTime: dueTime || '17:00',
    recurrence: recurrence || 'none',
    reminderMinutesBefore: reminderMinutesBefore || 30,
    subtasks: Array.isArray(subtasks) ? subtasks : [],
    tags: Array.isArray(tags) ? tags : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.tasks.unshift(newTask);

  // Multi-user notification trigger:
  // If the creator assigns the task to someone else (e.g. manager assigning member),
  // immediately dispatch an assignment notification!
  if (targetAssigneeId !== currentUser.id) {
    const assignee = db.users.find(u => u.id === targetAssigneeId);
    const notification: NotificationRecord = {
      id: `notif-${Date.now()}`,
      userId: targetAssigneeId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      taskId: newTask.id,
      taskTitle: newTask.title,
      type: 'assignment',
      message: `${currentUser.name} (${currentUser.role === 'manager' ? 'Manager' : 'Team Lead'}) assigned you a task: "${newTask.title}"`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    db.notifications.unshift(notification);
    broadcastNotification(notification);
  }

  saveDatabase(db);
  broadcastTaskUpdate(newTask, 'created');

  res.json({ success: true, data: newTask });
});

app.put('/api/tasks/:id', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req);
  const taskIndex = db.tasks.findIndex(t => t.id === req.params.id);
  if (taskIndex === -1) {
    return res.status(404).json({ success: false, error: 'Task not found' });
  }

  const existing = db.tasks[taskIndex];
  const oldAssigneeId = existing.assigneeId;
  const oldStatus = existing.status;

  const updated: TaskRecord = {
    ...existing,
    ...req.body,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };

  // Check if status changed to 'completed' and recurrence is configured
  if (oldStatus !== 'completed' && updated.status === 'completed' && updated.recurrence !== 'none') {
    // Schedule next recurrence task
    const nextDate = new Date(updated.dueDate);
    if (updated.recurrence === 'daily') {
      nextDate.setDate(nextDate.getDate() + 1);
    } else if (updated.recurrence === 'weekly') {
      nextDate.setDate(nextDate.getDate() + 7);
    } else if (updated.recurrence === 'monthly') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }

    const nextTask: TaskRecord = {
      ...updated,
      id: `task-${Date.now() + 1}`,
      status: 'todo',
      dueDate: nextDate.toISOString().split('T')[0],
      subtasks: updated.subtasks.map(s => ({ ...s, completed: false })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.tasks.unshift(nextTask);
    broadcastTaskUpdate(nextTask, 'created');
  }

  // If assignee changed, notify new assignee
  if (updated.assigneeId !== oldAssigneeId && updated.assigneeId !== currentUser.id) {
    const notification: NotificationRecord = {
      id: `notif-${Date.now()}`,
      userId: updated.assigneeId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      taskId: updated.id,
      taskTitle: updated.title,
      type: 'assignment',
      message: `${currentUser.name} assigned you to task: "${updated.title}"`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    db.notifications.unshift(notification);
    broadcastNotification(notification);
  }

  db.tasks[taskIndex] = updated;
  saveDatabase(db);
  broadcastTaskUpdate(updated, 'updated');

  res.json({ success: true, data: updated });
});

app.put('/api/tasks/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;
  if (!['todo', 'in_progress', 'in_review', 'completed'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status' });
  }

  const taskIndex = db.tasks.findIndex(t => t.id === req.params.id);
  if (taskIndex === -1) {
    return res.status(404).json({ success: false, error: 'Task not found' });
  }

  const existing = db.tasks[taskIndex];
  const oldStatus = existing.status;
  existing.status = status;
  existing.updatedAt = new Date().toISOString();

  // If recurring and newly completed:
  if (oldStatus !== 'completed' && status === 'completed' && existing.recurrence !== 'none') {
    const nextDate = new Date(existing.dueDate);
    if (existing.recurrence === 'daily') nextDate.setDate(nextDate.getDate() + 1);
    else if (existing.recurrence === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
    else if (existing.recurrence === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);

    const recurringSpawn: TaskRecord = {
      ...existing,
      id: `task-${Date.now() + 2}`,
      status: 'todo',
      dueDate: nextDate.toISOString().split('T')[0],
      subtasks: existing.subtasks.map(s => ({ ...s, completed: false })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.tasks.unshift(recurringSpawn);
    broadcastTaskUpdate(recurringSpawn, 'created');
  }

  db.tasks[taskIndex] = existing;
  saveDatabase(db);
  broadcastTaskUpdate(existing, 'updated');

  res.json({ success: true, data: existing });
});

app.put('/api/tasks/:id/subtasks/:subtaskId/toggle', (req: Request, res: Response) => {
  const task = db.tasks.find(t => t.id === req.params.id);
  if (!task) {
    return res.status(404).json({ success: false, error: 'Task not found' });
  }

  const sub = task.subtasks.find(s => s.id === req.params.subtaskId);
  if (!sub) {
    return res.status(404).json({ success: false, error: 'Subtask not found' });
  }

  sub.completed = !sub.completed;
  task.updatedAt = new Date().toISOString();
  saveDatabase(db);
  broadcastTaskUpdate(task, 'updated');

  res.json({ success: true, data: task });
});

app.delete('/api/tasks/:id', (req: Request, res: Response) => {
  const taskIndex = db.tasks.findIndex(t => t.id === req.params.id);
  if (taskIndex === -1) {
    return res.status(404).json({ success: false, error: 'Task not found' });
  }

  const [deleted] = db.tasks.splice(taskIndex, 1);
  saveDatabase(db);
  broadcastTaskUpdate(deleted, 'deleted');

  res.json({ success: true, data: { id: req.params.id } });
});

// 4. Notifications Endpoints
app.get('/api/notifications', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req);
  const userNotifications = db.notifications
    .filter(n => n.userId === currentUser.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ success: true, data: userNotifications });
});

app.get('/api/notifications/unread-count', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req);
  const count = db.notifications.filter(n => n.userId === currentUser.id && !n.read).length;
  res.json({ success: true, data: { count } });
});

app.put('/api/notifications/:id/read', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req);
  const notif = db.notifications.find(n => n.id === req.params.id && n.userId === currentUser.id);
  if (!notif) {
    return res.status(404).json({ success: false, error: 'Notification not found' });
  }
  notif.read = true;
  saveDatabase(db);
  res.json({ success: true, data: notif });
});

app.post('/api/notifications/read-all', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req);
  let count = 0;
  for (const notif of db.notifications) {
    if (notif.userId === currentUser.id && !notif.read) {
      notif.read = true;
      count++;
    }
  }
  saveDatabase(db);
  res.json({ success: true, data: { count } });
});

app.post('/api/notifications', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req);
  const { userId, taskId, taskTitle, type, message } = req.body;

  const newNotif: NotificationRecord = {
    id: `notif-${Date.now()}`,
    userId,
    senderId: currentUser.id,
    senderName: currentUser.name,
    taskId,
    taskTitle,
    type: type || 'assignment',
    message,
    read: false,
    createdAt: new Date().toISOString(),
  };

  db.notifications.unshift(newNotif);
  saveDatabase(db);
  broadcastNotification(newNotif);

  res.json({ success: true, data: newNotif });
});

// Real-Time Events (Server-Sent Events)
app.get('/api/events', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const client = { userId: currentUser.id, res };
  sseClients.add(client);

  // Send initial ping
  res.write(`data: ${JSON.stringify({ type: 'connected', userId: currentUser.id })}\n\n`);

  req.on('close', () => {
    sseClients.delete(client);
  });
});

// Setup Vite or Static File Serving
async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TaskFlow Server running at http://0.0.0.0:${PORT} [${isProduction ? 'production' : 'development'}]`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
