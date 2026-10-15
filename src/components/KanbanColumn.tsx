import React, { useState } from 'react';
import { Task, TaskStatus, User } from '../types';
import { TaskCard } from './TaskCard';
import { Plus, CircleDot } from 'lucide-react';

interface KanbanColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  users: User[];
  onSelectTask: (task: Task) => void;
  onMoveTask: (taskId: string, targetStatus: TaskStatus) => void;
  onQuickAddTask: (status: TaskStatus) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status,
  title,
  tasks,
  users,
  onSelectTask,
  onMoveTask,
  onQuickAddTask,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      onMoveTask(taskId, status);
    }
  };

  const getStatusColor = (s: TaskStatus) => {
    switch (s) {
      case 'todo':
        return 'border-slate-300 text-slate-700 bg-slate-100';
      case 'in_progress':
        return 'border-blue-300 text-blue-700 bg-blue-50';
      case 'in_review':
        return 'border-amber-300 text-amber-700 bg-amber-50';
      case 'completed':
        return 'border-emerald-300 text-emerald-700 bg-emerald-50';
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col flex-1 min-w-[280px] max-w-sm bg-slate-100/70 border rounded-2xl p-3 transition-colors duration-150 ${
        isDragOver
          ? 'border-blue-500 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20'
          : 'border-slate-200/90'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full border ${getStatusColor(status)}`}
          />
          <h2 className="text-xs font-bold text-slate-800 tracking-tight">{title}</h2>
          <span className="px-1.5 py-0.2 text-[10px] font-semibold text-slate-500 bg-slate-200/80 rounded-full tabular-nums">
            {tasks.length}
          </span>
        </div>

        <button
          onClick={() => onQuickAddTask(status)}
          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors"
          title={`Add task to ${title}`}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Cards Scrollable Container */}
      <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto max-h-[calc(100vh-210px)] pr-0.5">
        {tasks.length === 0 ? (
          <div
            className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl text-center transition-colors ${
              isDragOver
                ? 'border-blue-400 bg-blue-50/50 text-blue-600'
                : 'border-slate-200/90 text-slate-400'
            }`}
          >
            <p className="text-xs font-medium">No tasks in {title}</p>
            <p className="text-[11px] text-slate-400 mt-1">Drag tasks here or click +</p>
          </div>
        ) : (
          tasks.map((task) => {
            const assignee = users.find((u) => u.id === task.assigneeId);
            return (
              <TaskCard
                key={task.id}
                task={task}
                assignee={assignee}
                onSelect={onSelectTask}
                onStatusChange={onMoveTask}
              />
            );
          })
        )}
      </div>
    </div>
  );
};
