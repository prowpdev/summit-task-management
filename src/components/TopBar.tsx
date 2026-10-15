import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { NotificationPopover } from './NotificationPopover';
import {
  Bell,
  Plus,
  Users,
  Layers,
  Repeat,
  Code2,
  ChevronDown,
  Shield,
  User as UserIcon,
  LogOut,
} from 'lucide-react';

interface TopBarProps {
  currentTab: 'board' | 'recurring' | 'team' | 'api';
  onTabChange: (tab: 'board' | 'recurring' | 'team' | 'api') => void;
  onOpenNewTaskModal: () => void;
  onSelectTaskFromNotif?: (taskId: string) => void;
  onOpenAuthModal: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onTabChange,
  onOpenNewTaskModal,
  onSelectTaskFromNotif,
  onOpenAuthModal,
}) => {
  const { currentUser, users, switchUser } = useAuth();
  const { unreadCount } = useNotifications();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single element brand wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 font-bold text-sm tracking-tight">
              TF
            </div>
            <button
              onClick={() => onTabChange('board')}
              className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap hover:text-blue-600 transition-colors"
            >
              TaskFlow
            </button>
          </div>

          {/* Zone 2: 4 single-line navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => onTabChange('board')}
              className={`flex items-center gap-1.5 py-1.5 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                currentTab === 'board'
                  ? 'border-blue-600 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Kanban Board</span>
            </button>

            <button
              onClick={() => onTabChange('recurring')}
              className={`flex items-center gap-1.5 py-1.5 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                currentTab === 'recurring'
                  ? 'border-blue-600 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Repeat className="w-4 h-4" />
              <span>Recurring Rules</span>
            </button>

            <button
              onClick={() => onTabChange('team')}
              className={`flex items-center gap-1.5 py-1.5 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                currentTab === 'team'
                  ? 'border-blue-600 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Team Directory</span>
            </button>

            <button
              onClick={() => onTabChange('api')}
              className={`flex items-center gap-1.5 py-1.5 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                currentTab === 'api'
                  ? 'border-blue-600 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>Centralized API</span>
            </button>
          </nav>

          {/* Zone 3: Notification bell, Persona switcher, and 1 Primary action */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(prev => !prev)}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold text-white bg-blue-600 rounded-full tabular-nums shadow-sm">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <NotificationPopover
                isOpen={isNotifOpen}
                onClose={() => setIsNotifOpen(false)}
                onSelectTask={onSelectTaskFromNotif}
              />
            </div>

            {/* Persona Switcher / Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(prev => !prev)}
                className="flex items-center gap-2 p-1.5 text-left rounded-lg hover:bg-slate-100 border border-slate-200/80 transition-colors"
              >
                <img
                  src={
                    currentUser?.avatarUrl ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser?.name || 'User'}`
                  }
                  alt={currentUser?.name || 'User'}
                  className="w-7 h-7 rounded-full object-cover bg-slate-200"
                  referrerPolicy="no-referrer"
                />
                <div className="hidden sm:block text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-900 truncate max-w-[110px]">
                      {currentUser?.name || 'Account'}
                    </span>
                    {currentUser?.role === 'manager' && (
                      <span className="text-[10px] text-blue-700 font-semibold">
                        (Lead)
                      </span>
                    )}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isUserMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                  <div className="absolute right-0 top-12 z-50 w-72 bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-900/10 py-1.5 animate-in fade-in duration-100">
                    <div className="px-3.5 py-2.5 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-900">{currentUser?.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{currentUser?.email}</p>
                      <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-slate-600">
                        <span className="font-medium">{currentUser?.title}</span>
                        <span>·</span>
                        <span>{currentUser?.department}</span>
                      </div>
                    </div>

                    <div className="p-2 border-b border-slate-100">
                      <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase px-2 mb-1.5">
                        Switch Demo Persona
                      </p>
                      {users.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => {
                            switchUser(u.id);
                            setIsUserMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs text-left transition-colors ${
                            u.id === currentUser?.id
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="truncate">{u.name}</span>
                            <span className="text-[10px] text-slate-400">
                              {u.role === 'manager' ? 'Manager' : 'Member'}
                            </span>
                          </div>
                          {u.id === currentUser?.id && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded font-semibold">
                              Active
                            </span>
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="p-1">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenAuthModal();
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span>Sign In / Create Account</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Primary Action Button */}
            <button
              onClick={onOpenNewTaskModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20 whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>New Task</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
