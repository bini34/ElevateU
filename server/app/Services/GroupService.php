<?php

namespace App\Services;

use App\Repositories\GroupRepository;
use App\Repositories\GroupUserRepository;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;

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
        $filePath = null;

        try {
            if ($profilePicture instanceof UploadedFile) {
                $filePath = $this->storeFile($profilePicture);
                $data['profile_picture'] = Storage::disk('public')->url($filePath);
            }

            return DB::transaction(function () use ($data) {
                $group = $this->groupRepository->create($data);
                $this->groupUserRepository->addUserToGroup($group->id, $data['owner_id']);

                return $group;
            });
        } catch (\Throwable $e) {
            if ($filePath !== null) {
                Storage::disk('public')->delete($filePath);
            }
            throw $e;
        }
    }

    // Get a group by ID
    public function getGroupById($id, string $actorId)
    {
        $group = $this->groupRepository->find($id);

        if (!$group->users->contains('id', $actorId)) {
            throw new AuthorizationException('You are not a member of this group.');
        }

        return $group;
    }

    // Update a group
    public function updateGroup($id, string $actorId, array $data)
    {
        $group = $this->ownedGroup($id, $actorId);
        $group->update(\Illuminate\Support\Arr::only($data, ['name', 'description']));

        return $group;
    }

    // Delete a group
    public function deleteGroup($id, string $actorId)
    {
        return $this->ownedGroup($id, $actorId)->delete();
    }

    // Add user to group
    public function addUserToGroup($groupId, $userId, string $actorId)
    {
        $this->ownedGroup($groupId, $actorId);
        return $this->groupUserRepository->addUserToGroup($groupId, $userId);
    }

    // Remove user from group
    public function removeUserFromGroup($groupId, $userId, string $actorId)
    {
        $group = $this->ownedGroup($groupId, $actorId);

        if ($group->owner_id === $userId) {
            throw ValidationException::withMessages(['user_id' => 'The group owner cannot be removed.']);
        }

        return $this->groupUserRepository->removeUserFromGroup($groupId, $userId);
    }

    public function getUserGroups($userId, string $actorId)
    {
        if ($userId !== $actorId) {
            throw new AuthorizationException('You may only list your own groups.');
        }

        return $this->groupRepository->findGroupsByUserId($userId);
    }

    protected function ownedGroup($id, string $actorId)
    {
        $group = $this->groupRepository->find($id);

        if ($group->owner_id !== $actorId) {
            throw new AuthorizationException('Only the group owner may manage this group.');
        }

        return $group;
    }

    protected function storeFile($file)
    {
        $filename = \Illuminate\Support\Str::uuid() . '.' . $file->extension();
        $filePath = Storage::disk('public')->putFileAs('uploads/groups', $file, $filename);

        if ($filePath === false) {
            throw new \RuntimeException('Failed to store group picture.');
        }

        return $filePath;
    }
}
