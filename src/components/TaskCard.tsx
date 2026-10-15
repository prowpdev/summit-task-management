import React from 'react';
import { Task, User } from '../types';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Repeat,
  GripVertical,
  AlertCircle,
  ListTodo,
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  assignee?: User;
  onSelect: (task: Task) => void;
  onStatusChange: (taskId: string, newStatus: Task['status']) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  assignee,
  onSelect,
  onStatusChange,
}) => {
  const isCompleted = task.status === 'completed';

  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = task.subtasks.length;

  const todayStr = new Date().toISOString().split('T')[0];
  const isOverdue = !isCompleted && task.dueDate < todayStr;
  const isDueToday = !isCompleted && task.dueDate === todayStr;

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const getPriorityStyle = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'text-rose-700 border-rose-300 bg-rose-50/70';
      case 'high':
        return 'text-amber-700 border-amber-300 bg-amber-50/70';
      case 'medium':
        return 'text-blue-700 border-blue-300 bg-blue-50/70';
      case 'low':
      default:
        return 'text-slate-600 border-slate-200 bg-slate-50';
    }
  };

  const formatDueDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return dateStr;
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => onSelect(task)}
      className={`group relative bg-white border border-slate-200/90 hover:border-slate-300 hover:shadow-md hover:shadow-slate-900/5 rounded-xl p-3.5 transition-all duration-150 cursor-grab active:cursor-grabbing ${
        isCompleted ? 'opacity-70 bg-slate-50/50' : ''
      }`}
    >
      {/* Header Row: Category, Priority, Recurrence */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <span className="text-slate-600">{task.category}</span>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <span
            className={`px-1.5 py-0.5 text-[10px] font-semibold border rounded capitalize tracking-wide ${getPriorityStyle(
              task.priority
            )}`}
          >
            {task.priority}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {task.recurrence !== 'none' && (
            <span
              className="flex items-center gap-1 text-[10px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60"
              title={`Recurring: ${task.recurrence}`}
            >
              <Repeat className="w-3 h-3 text-blue-600" />
              <span className="capitalize">{task.recurrence}</span>
            </span>
          )}

          <div className="opacity-0 group-hover:opacity-100 text-slate-400 transition-opacity">
            <GripVertical className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Task Title */}
      <h3
        className={`text-xs font-semibold text-slate-900 leading-snug tracking-tight mb-1.5 ${
          isCompleted ? 'line-through text-slate-500' : ''
        }`}
      >
        {task.title}
      </h3>

      {/* Description Snippet (if available) */}
      {task.description && (
        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-3">
          {task.description}
        </p>
      )}

      {/* Subtasks Progress (if subtasks exist) */}
      {totalSubtasks > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
            <span className="flex items-center gap-1 font-medium">
              <ListTodo className="w-3 h-3 text-slate-400" />
              <span>Checklist</span>
            </span>
            <span className="font-mono tabular-nums text-[10px]">
              {completedSubtasks}/{totalSubtasks}
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer Row: Due Date & Assignee Avatar */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
        {/* Due date indicator */}
        <div
          className={`flex items-center gap-1.5 font-medium tabular-nums ${
            isOverdue
              ? 'text-rose-600 font-semibold'
              : isDueToday
              ? 'text-amber-600 font-semibold'
              : 'text-slate-500'
          }`}
        >
          {isOverdue ? (
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <Calendar className="w-3.5 h-3.5 shrink-0" />
          )}
          <span>{formatDueDisplay(task.dueDate)}</span>
          {task.dueTime && (
            <>
              <span aria-hidden="true" className="text-slate-300">
                ·
              </span>
              <span>{task.dueTime}</span>
            </>
          )}
        </div>

        {/* Assignee Avatar */}
        {assignee && (
          <div className="flex items-center gap-1.5 shrink-0" title={`Assigned to ${assignee.name}`}>
            <span className="text-[11px] text-slate-500 hidden sm:inline max-w-[80px] truncate">
              {assignee.name.split(' ')[0]}
            </span>
            <img
              src={
                assignee.avatarUrl ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${assignee.name}`
              }
              alt={assignee.name}
              className="w-5 h-5 rounded-full object-cover border border-slate-200"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
      </div>
    </div>
  );
};
