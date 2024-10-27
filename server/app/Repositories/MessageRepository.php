<?php

namespace App\Repositories;

use App\Models\Message;
use App\Models\User;

class MessageRepository
{
    protected $message;
    protected $user;
    
    public function __construct(Message $message, User $user)
    {
        $this->message = $message;
        $this->user = $user;
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
            ->with([
                'sender.profile' => function ($query) {
                    $query->select('user_id', 'first_name', 'last_name', 'profile_picture_url');
                },
                'fileAttachments' // Eager load file attachments
            ])
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
    public function getUserConversations($userId)
    {
        // Fetch all users except the current user
        $allUsers = $this->user->where('id', '!=', $userId)
            ->with('profile') // Eager load profile
            ->get();

        // Fetch the latest message for each conversation involving the current user
        $latestMessages = $this->message->where(function ($query) use ($userId) {
            $query->where('sender_id', $userId)
                  ->orWhere('receiver_id', $userId);
        })
        ->orderBy('created_at', 'desc')
        ->get()
        ->unique('conversation_id');

        // Map conversation data to user IDs
        $conversationData = $latestMessages->mapWithKeys(function ($message) use ($userId) {
            $otherUserId = $message->sender_id === $userId ? $message->receiver_id : $message->sender_id;
            return [$otherUserId => [
                'conversation_id' => $message->conversation_id,
                'last_message' => $message->message,
            ]];
        });

        // Users with conversations
        $usersWithConversations = $allUsers->filter(function ($user) use ($conversationData) {
            return $conversationData->has($user->id);
        })->map(function ($user) use ($conversationData) {
            $conversation = $conversationData->get($user->id);
            return [
                'user_id' => $user->id,
                'first_name' => $user->profile->first_name ?? '',
                'last_name' => $user->profile->last_name ?? '',
                'profile_picture_url' => $user->profile->profile_picture_url ?? '',
                'has_conversation' => true,
                'conversation_id' => $conversation['conversation_id'],
                'last_message' => $conversation['last_message'] ?? null,
                'joined_at' => $user->profile->created_at,
            ];
        });

        // Users without conversations
        $usersWithoutConversations = $allUsers->filter(function ($user) use ($conversationData) {
            return !$conversationData->has($user->id);
        })->map(function ($user) {
            return [
                'user_id' => $user->id,
                'first_name' => $user->profile->first_name ?? '',
                'last_name' => $user->profile->last_name ?? '',
                'profile_picture_url' => $user->profile->profile_picture_url ?? '',
                'has_conversation' => false,
                'conversation_id' => null,
                'last_message' => null,
                'joined_at' => $user->profile->created_at,
            ];
        });

        // Ensure both are collections before merging
        $usersWithConversations = collect($usersWithConversations);
        $usersWithoutConversations = collect($usersWithoutConversations);

        // Merge both collections and return
        return $usersWithConversations->merge($usersWithoutConversations);
    }
    
    

}
