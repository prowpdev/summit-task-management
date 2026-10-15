import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import { TopBar } from './components/TopBar';
import { FilterToolbar } from './components/FilterToolbar';
import { KanbanBoard } from './components/KanbanBoard';
import { RecurringView } from './components/RecurringView';
import { TeamDirectoryView } from './components/TeamDirectoryView';
import { ApiConsoleView } from './components/ApiConsoleView';
import { TaskModal } from './components/TaskModal';
import { AuthModal } from './components/AuthModal';
import { ToastContainer } from './components/ToastContainer';
import { Task, TaskStatus, FilterState, User } from './types';
import { tasksApi } from './api';
import { Loader2 } from 'lucide-react';

const initialFilters: FilterState = {
  searchQuery: '',
  category: 'all',
  priority: 'all',
  dateFilter: 'all',
  assigneeId: 'all',
};

function MainApp() {
  const { currentUser, users } = useAuth();
  const { triggerToast } = useNotifications();

  const [currentTab, setCurrentTab] = useState<'board' | 'recurring' | 'team' | 'api'>('board');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskModalInitialStatus, setTaskModalInitialStatus] = useState<TaskStatus>('todo');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Fetch tasks using centralized API
  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await tasksApi.getAll(filters);
      if (res.success && res.data) {
        setTasks(res.data);
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Listen for real-time task update events from SSE
  useEffect(() => {
    const handleTaskUpdated = () => {
      loadTasks();
    };
    window.addEventListener('taskflow_task_updated', handleTaskUpdated);
    window.addEventListener('taskflow_user_switched', handleTaskUpdated);
    return () => {
      window.removeEventListener('taskflow_task_updated', handleTaskUpdated);
      window.removeEventListener('taskflow_user_switched', handleTaskUpdated);
    };
  }, [loadTasks]);

  // Drag and drop task move handler with optimistic update
  const handleMoveTask = async (taskId: string, targetStatus: TaskStatus) => {
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus, updatedAt: new Date().toISOString() } : t))
    );

    try {
      const res = await tasksApi.updateStatus(taskId, targetStatus);
      if (!res.success) {
        // Revert on failure
        loadTasks();
      }
    } catch (err) {
      console.error('Error updating task status:', err);
      loadTasks();
    }
  };

  // Task save / update handler
  const handleSaveTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingTask) {
      const res = await tasksApi.update(editingTask.id, taskData);
      if (res.success && res.data) {
        setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? res.data! : t)));
        triggerToast('Task Updated', `"${res.data.title}" was saved successfully.`);
      }
    } else {
      const res = await tasksApi.create(taskData);
      if (res.success && res.data) {
        setTasks((prev) => [res.data!, ...prev]);
        triggerToast('Task Created', `"${res.data.title}" added to ${res.data.status}.`);
      }
    }
    setEditingTask(null);
  };

  // Task delete handler
  const handleDeleteTask = async (taskId: string) => {
    const res = await tasksApi.delete(taskId);
    if (res.success) {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      triggerToast('Task Removed', 'The task was deleted from your board.');
    }
  };

  const handleOpenNewTask = (status: TaskStatus = 'todo') => {
    setEditingTask(null);
    setTaskModalInitialStatus(status);
    setIsTaskModalOpen(true);
  };

  const handleSelectTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleSelectTaskById = (taskId: string) => {
    const found = tasks.find((t) => t.id === taskId);
    if (found) {
      handleSelectTask(found);
    }
  };

  const handleAssignToUser = (user: User) => {
    setEditingTask(null);
    setTaskModalInitialStatus('todo');
    setIsTaskModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <TopBar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenNewTaskModal={() => handleOpenNewTask('todo')}
        onSelectTaskFromNotif={handleSelectTaskById}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-1 flex flex-col">
        {currentTab === 'board' && (
          <>
            {/* Filter Toolbar */}
            <FilterToolbar
              filters={filters}
              onFilterChange={setFilters}
              users={users}
              taskCount={tasks.length}
            />

            {/* Kanban Board View */}
            {isLoading && tasks.length === 0 ? (
              <div className="flex-1 flex items-center justify-center py-24 text-slate-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span className="text-xs font-medium">Synchronizing task board...</span>
              </div>
            ) : (
              <KanbanBoard
                tasks={tasks}
                users={users}
                onSelectTask={handleSelectTask}
                onMoveTask={handleMoveTask}
                onQuickAddTask={handleOpenNewTask}
              />
            )}
          </>
        )}

        {currentTab === 'recurring' && (
          <RecurringView
            tasks={tasks}
            users={users}
            onSelectTask={handleSelectTask}
            onOpenNewTaskModal={() => handleOpenNewTask('todo')}
          />
        )}

        {currentTab === 'team' && (
          <TeamDirectoryView
            users={users}
            tasks={tasks}
            onAssignToUser={handleAssignToUser}
          />
        )}

        {currentTab === 'api' && <ApiConsoleView />}
      </main>

      {/* Task Modal (Create / Edit) */}
      <TaskModal
        isOpen={isTaskModalOpen}
        task={editingTask}
        initialStatus={taskModalInitialStatus}
        users={users}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />

      {/* Auth & Persona Switcher Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Real-Time Live Toast Notification Container */}
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <MainApp />
      </NotificationProvider>
    </AuthProvider>
  );
}
