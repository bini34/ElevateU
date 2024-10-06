<?php

namespace App\Repositories;

use App\Models\Message;

class MessageRepository
{
    protected $message;

    public function __construct(Message $message)
    {
        $this->message = $message;
    }

    public function create(array $data)
    {
        return $this->message->create($data);
    }

    public function find($id)
    {
        return $this->message->with(['sender.profile' => function ($query) {
            $query->select('user_id', 'first_name', 'last_name', 'profile_picture_url');
        }])->findOrFail($id);
    }

    public function getMessagesByConversationPaginated($conversationId, $perPage = 10)
    {
        return $this->message->where('conversation_id', $conversationId)
            ->with(['sender.profile' => function ($query) {
                $query->select('user_id', 'first_name', 'last_name', 'profile_picture_url');
            }])
            ->orderBy('created_at', 'asc')
            ->paginate($perPage);
    }

    public function getMessagesByGroupPaginated($groupId, $perPage = 10)
    {
        return $this->message->where('group_id', $groupId)
            ->with(['sender.profile' => function ($query) {
                $query->select('user_id', 'first_name', 'last_name', 'profile_picture_url');
            }])
            ->orderBy('created_at', 'asc')
            ->paginate($perPage);
    }

    

}
