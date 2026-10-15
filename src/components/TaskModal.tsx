import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, TaskPriority, TaskCategory, RecurrenceType, User, Subtask } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Calendar,
  Clock,
  Repeat,
  AlertCircle,
  Tag,
  CheckSquare,
  Plus,
  Trash2,
  UserCheck,
  Send,
} from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  task?: Task | null;
  initialStatus?: TaskStatus;
  users: User[];
  onClose: () => void;
  onSave: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onDelete?: (taskId: string) => Promise<void>;
}

const CATEGORIES: TaskCategory[] = ['Engineering', 'Design', 'Marketing', 'Operations', 'General'];
const PRIORITIES: TaskPriority[] = ['urgent', 'high', 'medium', 'low'];
const STATUSES: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'in_review', label: 'In Review' },
  { value: 'completed', label: 'Completed' },
];

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  task,
  initialStatus = 'todo',
  users,
  onClose,
  onSave,
  onDelete,
}) => {
  const { currentUser } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(initialStatus);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [category, setCategory] = useState<TaskCategory>('Engineering');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('17:00');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState(30);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority);
      setCategory(task.category);
      setAssigneeId(task.assigneeId);
      setDueDate(task.dueDate);
      setDueTime(task.dueTime || '17:00');
      setRecurrence(task.recurrence);
      setReminderMinutesBefore(task.reminderMinutesBefore || 30);
      setSubtasks(task.subtasks || []);
      setTagsInput((task.tags || []).join(', '));
    } else {
      const todayStr = new Date().toISOString().split('T')[0];
      setTitle('');
      setDescription('');
      setStatus(initialStatus);
      setPriority('medium');
      setCategory('Engineering');
      setAssigneeId(currentUser?.id || (users[0]?.id ?? ''));
      setDueDate(todayStr);
      setDueTime('17:00');
      setRecurrence('none');
      setReminderMinutesBefore(30);
      setSubtasks([]);
      setTagsInput('');
    }
    setErrorMessage('');
  }, [task, initialStatus, currentUser, users, isOpen]);

  if (!isOpen) return null;

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const newSub: Subtask = {
      id: `sub-${Date.now()}`,
      title: newSubtaskTitle.trim(),
      completed: false,
    };
    setSubtasks([...subtasks, newSub]);
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (id: string) => {
    setSubtasks(
      subtasks.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
    );
  };

  const handleDeleteSubtask = (id: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Task title is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      await onSave({
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        category,
        assigneeId,
        creatorId: task?.creatorId || currentUser?.id || 'usr-manager',
        dueDate,
        dueTime,
        recurrence,
        reminderMinutesBefore,
        subtasks,
        tags,
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const targetAssignee = users.find((u) => u.id === assigneeId);
  const willTriggerNotification =
    currentUser?.role === 'manager' && targetAssignee && targetAssignee.id !== currentUser.id;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              {task ? 'Edit Task' : 'Create New Task'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Organize priorities, recurring schedules, and team assignments.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Audit client API caching layer"
              className="w-full px-3.5 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-400"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Description & Context
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide background, technical details, or acceptance criteria..."
              className="w-full px-3.5 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-400 leading-relaxed"
            />
          </div>

          {/* Row: Status, Priority, Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 capitalize"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p} Priority
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Assignee & Multi-User Notification Alert */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Assigned Team Member
            </label>
            <div className="relative">
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {u.title} ({u.role === 'manager' ? 'Lead' : 'Member'})
                  </option>
                ))}
              </select>
            </div>

            {willTriggerNotification && (
              <div className="mt-2 p-2.5 bg-blue-50/80 border border-blue-200/80 rounded-xl flex items-center gap-2 text-xs text-blue-800">
                <Send className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>
                  Immediate notification alert will be broadcast to{' '}
                  <strong className="font-semibold">{targetAssignee?.name}</strong> upon saving.
                </span>
              </div>
            )}
          </div>

          {/* Due Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Due Date</label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Due Time</label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Recurring Reminders Schedule */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-xl space-y-3">
            <div className="flex items-center gap-2">
              <Repeat className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold text-slate-900">
                Recurring Reminders & Automation
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Recurrence Cadence
                </label>
                <select
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
                  className="w-full px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 capitalize"
                >
                  <option value="none">No Recurrence (One-time)</option>
                  <option value="daily">Daily (Every Day)</option>
                  <option value="weekly">Weekly (Every 7 Days)</option>
                  <option value="monthly">Monthly (Every Month)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Reminder Alert Before Due
                </label>
                <select
                  value={reminderMinutesBefore}
                  onChange={(e) => setReminderMinutesBefore(parseInt(e.target.value, 10))}
                  className="w-full px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value={15}>15 minutes before</option>
                  <option value={30}>30 minutes before</option>
                  <option value={60}>1 hour before</option>
                  <option value={120}>2 hours before</option>
                  <option value={1440}>1 day before</option>
                </select>
              </div>
            </div>
          </div>

          {/* Checklist / Subtasks */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-slate-500" />
                <span>Checklist Subtasks</span>
              </label>
              <span className="text-[11px] text-slate-400 tabular-nums">
                {subtasks.filter((s) => s.completed).length}/{subtasks.length} completed
              </span>
            </div>

            <div className="space-y-1.5 mb-2">
              {subtasks.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={sub.completed}
                      onChange={() => handleToggleSubtask(sub.id)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span
                      className={`truncate ${
                        sub.completed ? 'line-through text-slate-400' : 'text-slate-800'
                      }`}
                    >
                      {sub.title}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleDeleteSubtask(sub.id)}
                    className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                placeholder="Add subtask step (press Enter)..."
                className="flex-1 px-3 py-1.5 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-slate-500" />
              <span>Labels / Tags (comma separated)</span>
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g., API, Security, Performance"
              className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            {task && onDelete ? (
              <button
                type="button"
                onClick={async () => {
                  if (confirm('Are you sure you want to delete this task?')) {
                    await onDelete(task.id);
                    onClose();
                  }
                }}
                className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Task</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition-colors shadow-sm shadow-blue-500/20"
              >
                {isSubmitting ? 'Saving...' : task ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
