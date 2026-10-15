import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import { CheckCheck, Bell, UserCheck, Clock, CheckCircle2 } from 'lucide-react';

interface NotificationPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTask?: (taskId: string) => void;
}

export const NotificationPopover: React.FC<NotificationPopoverProps> = ({
  isOpen,
  onClose,
  onSelectTask,
}) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  if (!isOpen) return null;

  const formatTimeAgo = (isoDate: string) => {
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <>
      {/* Backdrop to close */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-900/10 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-900 tracking-tight">Notifications</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-700 rounded tabular-nums">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
          {notifications.length === 0 ? (
            <div className="py-10 px-4 text-center">
              <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-600 font-medium">No notifications yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                When team managers assign or update your tasks, alerts will appear here.
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  if (!notif.read) markAsRead(notif.id);
                  if (onSelectTask && notif.taskId) {
                    onSelectTask(notif.taskId);
                    onClose();
                  }
                }}
                className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-3 ${
                  !notif.read ? 'bg-blue-50/30' : ''
                }`}
              >
                <div
                  className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                    notif.type === 'assignment'
                      ? 'bg-blue-100 text-blue-700'
                      : notif.type === 'due_reminder'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {notif.type === 'assignment' ? (
                    <UserCheck className="w-3.5 h-3.5" />
                  ) : notif.type === 'due_reminder' ? (
                    <Clock className="w-3.5 h-3.5" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-medium text-slate-800 leading-snug break-words">
                      {notif.message}
                    </p>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 tabular-nums">
                    <span>{formatTimeAgo(notif.createdAt)}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-500 truncate">{notif.taskTitle}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};
