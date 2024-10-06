<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\GroupService;
use Illuminate\Http\JsonResponse;

class GroupController extends Controller
{
    protected $groupService;

    public function __construct(GroupService $groupService)
    {
        $this->groupService = $groupService;
    }

    // Create a new group
    public function store(Request $request): JsonResponse
    {
        $groupData = $request->all();
        $group = $this->groupService->createGroup($groupData);

        return response()->json($group, 201);
    }

    // Show a specific group
    public function show($id): JsonResponse
    {
        $group = $this->groupService->getGroupById($id);
        return response()->json($group, 200);
    }

    // Update a group
    public function update(Request $request, $id): JsonResponse
    {
        $groupData = $request->all();
        $group = $this->groupService->updateGroup($id, $groupData);
        return response()->json($group, 200);
    }

    // Delete a group
    public function destroy($id): JsonResponse
    {
        $this->groupService->deleteGroup($id);
        return response()->json(['message' => 'Group deleted successfully'], 200);
    }

    // Add a user to the group
    public function addUser(Request $request, $groupId): JsonResponse
    {
        $userId = $request->input('user_id');
        $this->groupService->addUserToGroup($groupId, $userId);
        return response()->json(['message' => 'User added to group successfully'], 201);
    }

    // Remove a user from the group
    public function removeUser(Request $request, $groupId): JsonResponse
    {
        $userId = $request->input('user_id');
        $this->groupService->removeUserFromGroup($groupId, $userId);
        return response()->json(['message' => 'User removed from group successfully'], 200);
    }
}
