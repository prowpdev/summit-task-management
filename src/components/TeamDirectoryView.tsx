import React from 'react';
import { User, Task } from '../types';
import { useAuth } from '../context/AuthContext';
import { Users, Shield, Plus, CheckCircle2, Clock, Mail } from 'lucide-react';

interface TeamDirectoryViewProps {
  users: User[];
  tasks: Task[];
  onAssignToUser: (user: User) => void;
}

export const TeamDirectoryView: React.FC<TeamDirectoryViewProps> = ({
  users,
  tasks,
  onAssignToUser,
}) => {
  const { currentUser } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          <span>Team Directory & Workload</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Multi-user team member directory. Managers can delegate tasks to any member, triggering immediate live notification alerts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {users.map((member) => {
          const memberTasks = tasks.filter((t) => t.assigneeId === member.id);
          const activeTasks = memberTasks.filter((t) => t.status !== 'completed');
          const completedTasks = memberTasks.filter((t) => t.status === 'completed');
          const isCurrentUser = member.id === currentUser?.id;

          return (
            <div
              key={member.id}
              className={`bg-white border rounded-2xl p-5 flex flex-col justify-between transition-all ${
                isCurrentUser
                  ? 'border-blue-300 ring-1 ring-blue-500/20 shadow-sm'
                  : 'border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="relative">
                    <img
                      src={
                        member.avatarUrl ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`
                      }
                      alt={member.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                    {isCurrentUser && (
                      <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 bg-blue-600 text-white text-[9px] font-bold rounded-full">
                        You
                      </span>
                    )}
                  </div>

                  <span
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded capitalize ${
                      member.role === 'manager'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {member.role === 'manager' ? 'Lead / Manager' : 'Team Member'}
                  </span>
                </div>

                {/* Name & Title */}
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">{member.name}</h3>
                <p className="text-xs text-slate-600 font-medium">{member.title}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{member.department}</p>

                <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-500 truncate">
                  <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{member.email}</span>
                </div>

                {/* Task Stats */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 text-center">
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <p className="text-base font-bold text-slate-900 tabular-nums">
                      {activeTasks.length}
                    </p>
                    <p className="text-[10px] font-medium text-slate-500">Active Tasks</p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <p className="text-base font-bold text-emerald-600 tabular-nums">
                      {completedTasks.length}
                    </p>
                    <p className="text-[10px] font-medium text-slate-500">Completed</p>
                  </div>
                </div>
              </div>

              {/* Assign Action */}
              <div className="mt-4 pt-3">
                <button
                  onClick={() => onAssignToUser(member)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200/60 rounded-xl transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Assign Task to {member.name.split(' ')[0]}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
