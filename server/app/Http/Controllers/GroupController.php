<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\GroupService;
use Illuminate\Http\JsonResponse;
use App\Traits\ApiResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class GroupController extends Controller
{
    use ApiResponse;

    protected $groupService;

    public function __construct(GroupService $groupService)
    {
        $this->groupService = $groupService;
    }

    // Create a new group owned by the authenticated user
    public function store(Request $request): JsonResponse
    {
        // Define validation rules
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:groups,name',
            'description' => 'nullable|string|max:5000',
            'profile_picture' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        // Check if validation fails
        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors()
            ], 422); // 422 Unprocessable Entity
        }

        $groupData = $request->only(['name', 'description']);
        $groupData['owner_id'] = $request->user()->id; // never trust the body
        $profilePicture = $request->file('profile_picture');

        $group = $this->groupService->createGroup($groupData, $profilePicture);

        return $this->successResponse($group, 'Group created successfully', 201);
    }

    // Show a specific group
    public function show(Request $request, $id): JsonResponse
    {
        $group = $this->groupService->getGroupById($id, $request->user()->id);
        return $this->successResponse($group);
    }

    // Update a group
    public function update(Request $request, $id): JsonResponse
    {
        $groupData = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('groups', 'name')->ignore($id)],
            'description' => 'nullable|string|max:5000',
        ]);
        $group = $this->groupService->updateGroup($id, $request->user()->id, $groupData);
        return $this->successResponse($group);
    }

    // Delete a group
    public function destroy(Request $request, $id): JsonResponse
    {
        $this->groupService->deleteGroup($id, $request->user()->id);
        return $this->successResponse(['message' => 'Group deleted successfully']);
    }

    // Add a user to the group
    public function addUser(Request $request, $groupId): JsonResponse
    {
        $validated = $request->validate(['user_id' => 'required|uuid|exists:users,id']);
        $this->groupService->addUserToGroup($groupId, $validated['user_id'], $request->user()->id);
        return $this->successResponse(null, 'User added to group successfully', 201);
    }

    // Remove a user from the group
    public function removeUser(Request $request, $groupId): JsonResponse
    {
        $validated = $request->validate(['user_id' => 'required|uuid|exists:users,id']);
        $this->groupService->removeUserFromGroup($groupId, $validated['user_id'], $request->user()->id);
        return $this->successResponse(['message' => 'User removed from group successfully']);
    }

    // List groups a user has joined
    public function listUserGroups(Request $request, $userId): JsonResponse
    {
        $groups = $this->groupService->getUserGroups($userId, $request->user()->id);
        return $this->successResponse($groups);
    }
}
