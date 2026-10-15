<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes for TaskFlow
|--------------------------------------------------------------------------
|
| Centralized REST endpoints matching the TaskFlow client API bus:
| - Authentication & Sessions
| - Tasks CRUD, Drag-and-Drop Status, Subtask Checklists
| - Multi-User Team Member Directory
| - Real-time Notifications & Unread Counts
|
*/

// Public Auth Endpoints
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/switch-user', [AuthController::class, 'switchUser']);
});

// Authenticated or Open API Endpoints
Route::group(['middleware' => ['api']], function () {
    // Current User
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Team Users
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/{user}', [UserController::class, 'show']);

    // Tasks Management
    Route::get('/tasks', [TaskController::class, 'index']);
    Route::post('/tasks', [TaskController::class, 'store']);
    Route::get('/tasks/{task}', [TaskController::class, 'show']);
    Route::put('/tasks/{task}', [TaskController::class, 'update']);
    Route::delete('/tasks/{task}', [TaskController::class, 'destroy']);

    // Drag-and-Drop Quick Status Transition
    Route::put('/tasks/{task}/status', [TaskController::class, 'updateStatus']);

    // Checklist Subtasks
    Route::put('/tasks/{task}/subtasks/{subtask}/toggle', [TaskController::class, 'toggleSubtask']);

    // Multi-User Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::put('/notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::post('/notifications', [NotificationController::class, 'store']);
});
