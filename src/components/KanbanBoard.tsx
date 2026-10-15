import React from 'react';
import { Task, TaskStatus, User } from '../types';
import { KanbanColumn } from './KanbanColumn';

interface KanbanBoardProps {
  tasks: Task[];
  users: User[];
  onSelectTask: (task: Task) => void;
  onMoveTask: (taskId: string, targetStatus: TaskStatus) => void;
  onQuickAddTask: (status: TaskStatus) => void;
}

const COLUMNS: { status: TaskStatus; title: string }[] = [
  { status: 'todo', title: 'To Do' },
  { status: 'in_progress', title: 'In Progress' },
  { status: 'in_review', title: 'In Review' },
  { status: 'completed', title: 'Completed' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  users,
  onSelectTask,
  onMoveTask,
  onQuickAddTask,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex gap-4 overflow-x-auto pb-4 items-start min-h-[calc(100vh-200px)]">
        {COLUMNS.map((col) => {
          const columnTasks = tasks.filter((t) => t.status === col.status);
          return (
            <KanbanColumn
              key={col.status}
              status={col.status}
              title={col.title}
              tasks={columnTasks}
              users={users}
              onSelectTask={onSelectTask}
              onMoveTask={onMoveTask}
              onQuickAddTask={onQuickAddTask}
            />
          );
        })}
      </div>
    </div>
  );
};
