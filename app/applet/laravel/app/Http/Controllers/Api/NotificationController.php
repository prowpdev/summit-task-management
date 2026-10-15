<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Get all notifications for current authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user() ? $request->user()->id : $request->query('user_id', 1);

        $notifications = Notification::with(['sender', 'task'])
            ->where('user_id', $userId)
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $notifications,
        ]);
    }

    /**
     * Get count of unread notifications.
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $userId = $request->user() ? $request->user()->id : $request->query('user_id', 1);

        $count = Notification::where('user_id', $userId)
            ->where('read', false)
            ->count();

        return response()->json([
            'success' => true,
            'data' => ['count' => $count],
        ]);
    }

    /**
     * Mark a single notification as read.
     */
    public function markAsRead(Notification $notification): JsonResponse
    {
        $notification->update(['read' => true]);

        return response()->json([
            'success' => true,
            'data' => $notification,
        ]);
    }

    /**
     * Mark all notifications as read for current user.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $userId = $request->user() ? $request->user()->id : $request->input('user_id', 1);

        $affected = Notification::where('user_id', $userId)
            ->where('read', false)
            ->update(['read' => true]);

        return response()->json([
            'success' => true,
            'data' => ['count' => $affected],
            'message' => 'All notifications marked as read',
        ]);
    }

    /**
     * Manually trigger/store a notification.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'task_id' => 'nullable|exists:tasks,id',
            'type' => 'nullable|string',
            'message' => 'required|string',
        ]);

        $senderId = $request->user() ? $request->user()->id : ($request->input('sender_id') ?: 1);

        $notification = Notification::create([
            'user_id' => $validated['user_id'],
            'sender_id' => $senderId,
            'task_id' => $validated['task_id'] ?? null,
            'type' => $validated['type'] ?? 'assignment',
            'message' => $validated['message'],
            'read' => false,
        ]);

        return response()->json([
            'success' => true,
            'data' => $notification->load(['sender', 'task']),
        ], 201);
    }
}
