export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'completed';
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskCategory = 'Engineering' | 'Design' | 'Marketing' | 'Operations' | 'General';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'manager' | 'member';
  avatarUrl?: string;
  department: string;
  title: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  assigneeId: string;
  creatorId: string;
  dueDate: string; // ISO Date YYYY-MM-DD
  dueTime?: string; // HH:mm
  recurrence: RecurrenceType;
  reminderMinutesBefore?: number;
  subtasks: Subtask[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type NotificationType = 'assignment' | 'status_change' | 'due_reminder' | 'comment';

export interface NotificationItem {
  id: string;
  userId: string; // Recipient user ID
  senderId: string; // Sender user ID
  senderName: string;
  taskId: string;
  taskTitle: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface FilterState {
  searchQuery: string;
  category: string; // 'all' or specific category
  priority: string; // 'all' or specific priority
  dateFilter: 'all' | 'today' | 'this_week' | 'overdue';
  assigneeId: string; // 'all' or specific user ID
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
