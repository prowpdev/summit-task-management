import React, { useState } from 'react';
import { apiClient } from '../api';
import { Code2, Play, CheckCircle, Terminal, Layers, ArrowRight, Copy } from 'lucide-react';

export const ApiConsoleView: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState('/api/tasks');
  const [method, setMethod] = useState<'GET' | 'POST'>('GET');
  const [responseOutput, setResponseOutput] = useState<string>('Click "Execute Request" below to run live API query...');
  const [isLoading, setIsLoading] = useState(false);
  const [statusBadge, setStatusBadge] = useState<number | null>(null);

  const endpoints = [
    { method: 'GET', path: '/tasks', description: 'Fetch all tasks with query filter support (q, category, priority, dateFilter)' },
    { method: 'GET', path: '/tasks/task-101', description: 'Fetch single task by unique identifier' },
    { method: 'GET', path: '/notifications', description: 'Fetch live notifications for active session user' },
    { method: 'GET', path: '/notifications/unread-count', description: 'Lightweight polling endpoint for notification badge' },
    { method: 'GET', path: '/users', description: 'Retrieve team member directory for task assignment' },
    { method: 'GET', path: '/auth/me', description: 'Inspect active authenticated user and session role' },
  ];

  const handleExecute = async () => {
    setIsLoading(true);
    setResponseOutput('Executing request via centralized ApiClient...');
    try {
      const startTime = performance.now();
      const res = await apiClient.request<any>(selectedEndpoint, { method });
      const duration = (performance.now() - startTime).toFixed(1);
      setStatusBadge(res.success ? 200 : 400);
      setResponseOutput(
        JSON.stringify(
          {
            _meta: {
              centralizedClient: 'src/api/client.ts',
              endpoint: selectedEndpoint,
              latency: `${duration}ms`,
              tokenInjected: Boolean(apiClient.getToken()),
            },
            ...res,
          },
          null,
          2
        )
      );
    } catch (err: any) {
      setStatusBadge(500);
      setResponseOutput(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Code2 className="w-5 h-5 text-blue-600" />
          <span>Centralized API Architecture & Explorer</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
          All client-to-server operations flow through a unified <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded font-mono text-[11px]">src/api/client.ts</code> bus. Adding new endpoints or expanding models as your project scales requires modifying only the central API modules without rewriting UI components.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Registered Endpoints & Code Guide */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              Registered Central Endpoints
            </h2>
            <div className="space-y-2">
              {endpoints.map((ep) => (
                <button
                  key={ep.path}
                  onClick={() => {
                    setSelectedEndpoint(ep.path);
                    setMethod(ep.method as any);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all text-xs ${
                    selectedEndpoint === ep.path
                      ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                      : 'border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-100/70 px-1.5 py-0.2 rounded">
                      {ep.method}
                    </span>
                    <span className="font-mono font-semibold text-slate-900">
                      /api{ep.path}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    {ep.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* How to add new endpoints guide */}
          <div className="bg-slate-900 text-slate-200 rounded-2xl p-4 text-xs font-mono">
            <div className="flex items-center justify-between text-slate-400 pb-2 mb-2 border-b border-slate-800">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-blue-400" />
                <span>Extending: src/api/tasks.ts</span>
              </span>
            </div>
            <pre className="text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
{`// 1. Add method in src/api/tasks.ts
export const tasksApi = {
  // Add your new endpoint:
  async archiveTask(id: string) {
    return apiClient.put(\`/tasks/\${id}/archive\`);
  }
};`}
            </pre>
          </div>
        </div>

        {/* Right Column: Live Interactive Request Runner */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex-1 flex flex-col">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2 flex-1">
                <span className="px-2 py-1 text-xs font-mono font-bold bg-slate-100 text-slate-700 rounded-lg">
                  {method}
                </span>
                <span className="font-mono text-xs font-semibold text-slate-900 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200 flex-1 truncate">
                  /api{selectedEndpoint}
                </span>
              </div>

              <button
                onClick={handleExecute}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs disabled:opacity-50 shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isLoading ? 'Sending...' : 'Execute Request'}</span>
              </button>
            </div>

            {/* Output console */}
            <div className="flex-1 flex flex-col min-h-[360px] bg-slate-950 rounded-xl p-4 overflow-hidden">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[11px] font-mono">
                <span className="text-slate-400">Response Payload Inspector</span>
                {statusBadge && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      statusBadge === 200 ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                    }`}
                  >
                    HTTP {statusBadge} OK
                  </span>
                )}
              </div>
              <pre className="flex-1 text-[11px] font-mono text-emerald-400 overflow-y-auto leading-relaxed">
                {responseOutput}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
