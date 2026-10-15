import React from 'react';
import { FilterState, User, TaskCategory, TaskPriority } from '../types';
import { Search, X, Filter, Calendar, Tag, ShieldAlert, UserCheck } from 'lucide-react';

interface FilterToolbarProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  users: User[];
  taskCount: number;
}

const CATEGORIES: (TaskCategory | 'all')[] = [
  'all',
  'Engineering',
  'Design',
  'Marketing',
  'Operations',
  'General',
];

const PRIORITIES: (TaskPriority | 'all')[] = ['all', 'urgent', 'high', 'medium', 'low'];

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  filters,
  onFilterChange,
  users,
  taskCount,
}) => {
  const hasActiveFilters =
    filters.searchQuery !== '' ||
    filters.category !== 'all' ||
    filters.priority !== 'all' ||
    filters.dateFilter !== 'all' ||
    filters.assigneeId !== 'all';

  const resetFilters = () => {
    onFilterChange({
      searchQuery: '',
      category: 'all',
      priority: 'all',
      dateFilter: 'all',
      assigneeId: 'all',
    });
  };

  return (
    <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
            placeholder="Search tasks by title, tag, or description..."
            className="w-full pl-9 pr-8 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onFilterChange({ ...filters, searchQuery: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Due Date Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-600">
            <button
              onClick={() => onFilterChange({ ...filters, dateFilter: 'all' })}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filters.dateFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              All Due
            </button>
            <button
              onClick={() => onFilterChange({ ...filters, dateFilter: 'today' })}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filters.dateFilter === 'today'
                  ? 'bg-white text-blue-700 shadow-sm font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              Due Today
            </button>
            <button
              onClick={() => onFilterChange({ ...filters, dateFilter: 'this_week' })}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filters.dateFilter === 'this_week'
                  ? 'bg-white text-blue-700 shadow-sm font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => onFilterChange({ ...filters, dateFilter: 'overdue' })}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filters.dateFilter === 'overdue'
                  ? 'bg-white text-rose-700 shadow-sm font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              Overdue
            </button>
          </div>

          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={filters.category}
              onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
              className="appearance-none pl-7 pr-7 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.filter((c) => c !== 'all').map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Priority Dropdown */}
          <div className="relative">
            <select
              value={filters.priority}
              onChange={(e) => onFilterChange({ ...filters, priority: e.target.value })}
              className="appearance-none pl-7 pr-7 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer capitalize"
            >
              <option value="all">All Priorities</option>
              {PRIORITIES.filter((p) => p !== 'all').map((p) => (
                <option key={p} value={p} className="capitalize">
                  {p} Priority
                </option>
              ))}
            </select>
            <ShieldAlert className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Assignee Dropdown */}
          <div className="relative">
            <select
              value={filters.assigneeId}
              onChange={(e) => onFilterChange({ ...filters, assigneeId: e.target.value })}
              className="appearance-none pl-7 pr-7 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Assignees</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role === 'manager' ? 'Lead' : 'Member'})
                </option>
              ))}
            </select>
            <UserCheck className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}

          {/* Task count summary */}
          <span className="text-xs text-slate-500 tabular-nums ml-auto hidden lg:inline">
            {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
          </span>
        </div>
      </div>
    </div>
  );
};
