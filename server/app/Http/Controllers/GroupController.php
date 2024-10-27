<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\GroupService;
use Illuminate\Http\JsonResponse;
use App\Traits\ApiResponse;
use Illuminate\Support\Facades\Validator;

class GroupController extends Controller
{
    use ApiResponse;

    protected $groupService;

    public function __construct(GroupService $groupService)
    {
        $this->groupService = $groupService;
    }

    // Create a new group
    public function store(Request $request): JsonResponse
    {
        // Define validation rules
        $validator = Validator::make($request->all(), [
            'name' => 'required|unique:groups,name',
            'description' => 'nullable|string',
            'profile_picture' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'owner_id' => 'required|exists:users,id', // Ensure owner_id exists in users table
        ]);

        // Check if validation fails
        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors()
            ], 422); // 422 Unprocessable Entity
        }

        $groupData = $request->all();
        $profilePicture = $request->file('profile_picture');

        $group = $this->groupService->createGroup($groupData, $profilePicture);

        return $this->successResponse($group, 201);
    }

    // Show a specific group
    public function show($id): JsonResponse
    {
        $group = $this->groupService->getGroupById($id);
        return $this->successResponse($group);
    }

    // Update a group
    public function update(Request $request, $id): JsonResponse
    {
        $groupData = $request->all();
        $group = $this->groupService->updateGroup($id, $groupData);
        return $this->successResponse($group);
    }

    // Delete a group
    public function destroy($id): JsonResponse
    {
        $this->groupService->deleteGroup($id);
        return $this->successResponse(['message' => 'Group deleted successfully']);
    }

    // Add a user to the group
    public function addUser(Request $request, $groupId): JsonResponse
    {
        $userId = $request->input('user_id');
        $this->groupService->addUserToGroup($groupId, $userId);
        return $this->successResponse(['message' => 'User added to group successfully'], 201);
    }

    // Remove a user from the group
    public function removeUser(Request $request, $groupId): JsonResponse
    {
        $userId = $request->input('user_id');
        $this->groupService->removeUserFromGroup($groupId, $userId);
        return $this->successResponse(['message' => 'User removed from group successfully']);
    }

    // List groups a user has joined
    public function listUserGroups($userId): JsonResponse
    {
        $groups = $this->groupService->getUserGroups($userId);
        return $this->successResponse($groups);
    }
}
