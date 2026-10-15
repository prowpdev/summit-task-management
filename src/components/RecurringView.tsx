import React from 'react';
import { Task, User } from '../types';
import { Repeat, Calendar, CheckCircle2, Clock, Plus, ArrowRight } from 'lucide-react';

interface RecurringViewProps {
  tasks: Task[];
  users: User[];
  onSelectTask: (task: Task) => void;
  onOpenNewTaskModal: () => void;
}

export const RecurringView: React.FC<RecurringViewProps> = ({
  tasks,
  users,
  onSelectTask,
  onOpenNewTaskModal,
}) => {
  const recurringTasks = tasks.filter((t) => t.recurrence !== 'none');

  const getNextOccurrence = (task: Task) => {
    const d = new Date(task.dueDate);
    if (task.recurrence === 'daily') d.setDate(d.getDate() + 1);
    else if (task.recurrence === 'weekly') d.setDate(d.getDate() + 7);
    else if (task.recurrence === 'monthly') d.setMonth(d.getMonth() + 1);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Repeat className="w-5 h-5 text-blue-600" />
            <span>Automated Recurring Reminders & Cadences</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tasks configured with recurring intervals automatically reschedule upon completion and dispatch reminder alerts.
          </p>
        </div>

        <button
          onClick={onOpenNewTaskModal}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Recurring Task</span>
        </button>
      </div>

      {recurringTasks.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-lg mx-auto">
          <Repeat className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No recurring tasks configured</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
            Create recurring daily standups, weekly security reviews, or monthly maintenance tasks with automatic next-cycle spawning.
          </p>
          <button
            onClick={onOpenNewTaskModal}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Create First Recurring Task
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recurringTasks.map((task) => {
            const assignee = users.find((u) => u.id === task.assigneeId);
            return (
              <div
                key={task.id}
                onClick={() => onSelectTask(task)}
                className="bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-md hover:shadow-slate-900/5 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded capitalize">
                      {task.recurrence} Cadence
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {task.category}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-900 leading-snug tracking-tight mb-2">
                    {task.title}
                  </h3>

                  {task.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                      {task.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-[11px] text-slate-400">Current Due:</span>
                    <span className="font-semibold tabular-nums text-slate-800">
                      {task.dueDate} at {task.dueTime || '17:00'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-[11px] text-slate-400">Next Occurrence:</span>
                    <span className="font-medium text-blue-700 flex items-center gap-1">
                      <span>{getNextOccurrence(task)}</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">Assignee:</span>
                    <div className="flex items-center gap-1.5 font-medium text-slate-700">
                      <img
                        src={
                          assignee?.avatarUrl ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${assignee?.name || 'User'}`
                        }
                        alt={assignee?.name}
                        className="w-4 h-4 rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <span>{assignee?.name}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
