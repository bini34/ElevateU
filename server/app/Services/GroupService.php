<?php

namespace App\Services;

use App\Repositories\GroupRepository;
use App\Repositories\GroupUserRepository;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;

class GroupService
{
    protected $groupRepository;
    protected $groupUserRepository;

    public function __construct(GroupRepository $groupRepository, GroupUserRepository $groupUserRepository)
    {
        $this->groupRepository = $groupRepository;
        $this->groupUserRepository = $groupUserRepository;
    }

    // Create a group
    public function createGroup(array $data, $profilePicture = null)
    {
        if ($profilePicture instanceof \Illuminate\Http\UploadedFile) {
            $filePath = $this->storeFile($profilePicture);
            $data['profile_picture'] = $filePath;
        }

        Log::info('Creating group: ' . json_encode($data));
        $group = $this->groupRepository->create($data);

        // Store owner_id and group_id in group_users table
        $this->groupUserRepository->addUserToGroup($group->id, $data['owner_id']);

        return $group;
    }

    // Get a group by ID
    public function getGroupById($id)
    {
        return $this->groupRepository->find($id);
    }

    // Update a group
    public function updateGroup($id, array $data)
    {
        return $this->groupRepository->update($id, $data);
    }

    // Delete a group
    public function deleteGroup($id)
    {
        return $this->groupRepository->delete($id);
    }

    // Add user to group
    public function addUserToGroup($groupId, $userId)
    {
        Log::info('Adding user to group: ' . $userId . ' in group: ' . $groupId);
        return $this->groupUserRepository->addUserToGroup($groupId, $userId);
    }

    // Remove user from group
    public function removeUserFromGroup($groupId, $userId)
    {
        Log::info('Removing user from group: ' . $userId . ' in group: ' . $groupId);
        return $this->groupUserRepository->removeUserFromGroup($groupId, $userId);
    }

    public function getUserGroups($userId)
    {
        return $this->groupRepository->findGroupsByUserId($userId);
    }

    protected function storeFile($file)
    {
        $filename = \Illuminate\Support\Str::uuid() . '.' . $file->getClientOriginalExtension();
        $filePath = \Illuminate\Support\Facades\Storage::disk('public')->putFileAs('uploads/groups', $file, $filename);

        return \Illuminate\Support\Facades\Storage::url($filePath);
    }
}
