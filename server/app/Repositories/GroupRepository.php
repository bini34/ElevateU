<?php

namespace App\Repositories;

use App\Models\Group;
use App\Models\GroupUser;

class GroupRepository
{
    protected $group;

    public function __construct(Group $group)
    {
        $this->group = $group;
    }

    // Create a group
    public function create(array $data)
    {
        return $this->group->create($data);
    }

    // Find a group by ID
    public function find($id)
    {
        return $this->group->with('users')->findOrFail($id);
    }

    // Update a group
    public function update($id, array $data)
    {
        $group = $this->find($id);
        $group->update($data);
        return $group;
    }

    // Delete a group
    public function delete($id)
    {
        $group = $this->find($id);
        $group->delete();
        return true;
    }

    // Find groups by user ID
    public function findGroupsByUserId($userId)
    {
        return Group::join('group_users', 'groups.id', '=', 'group_users.group_id')
            ->leftJoin('messages', 'groups.last_message_id', '=', 'messages.id')
            ->where('group_users.user_id', $userId)
            ->get([
                'groups.id',
                'groups.name',
                'groups.created_at',
                'groups.profile_picture',
                'messages.message as last_message'
            ]);
    }
}
