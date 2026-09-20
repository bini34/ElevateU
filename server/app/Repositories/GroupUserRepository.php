<?php

namespace App\Repositories;

use App\Models\GroupUser;
use App\Support\UniqueResource;

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
        $attributes = ['group_id' => $groupId, 'user_id' => $userId];

        return UniqueResource::resolve($this->groupUser->where($attributes), $attributes,
            'group_users_group_id_user_id_unique', ['group_users.group_id', 'group_users.user_id']);
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
