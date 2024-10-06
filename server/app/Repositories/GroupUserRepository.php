<?php

namespace App\Repositories;

use App\Models\GroupUser;

class GroupUserRepository
{
    protected $groupUser;

    public function __construct(GroupUser $groupUser)
    {
        $this->groupUser = $groupUser;
    }

    // Add a user to a group
    public function addUserToGroup($groupId, $userId)
    {
        return $this->groupUser->create([
            'group_id' => $groupId,
            'user_id' => $userId
        ]);
    }

    // Remove a user from a group
    public function removeUserFromGroup($groupId, $userId)
    {
        return $this->groupUser
            ->where('group_id', $groupId)
            ->where('user_id', $userId)
            ->delete();
    }
}
