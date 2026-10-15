<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class UserController extends Controller
{
    /**
     * List all team members.
     */
    public function index(): JsonResponse
    {
        $users = User::withCount([
            'assignedTasks as active_tasks_count' => function ($q) {
                $q->where('status', '!=', 'completed');
            },
            'assignedTasks as completed_tasks_count' => function ($q) {
                $q->where('status', 'completed');
            },
        ])->get();

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }

    /**
     * Display single user profile.
     */
    public function show(User $user): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $user->loadCount(['assignedTasks', 'createdTasks']),
        ]);
    }
}
