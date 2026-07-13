<?php

use App\Models\Conversation;
use App\Models\GroupUser;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    // User IDs are UUID strings, so compare them as strings
    return (string) $user->id === (string) $id;
});

// Presence channel powering online/offline indicators
Broadcast::channel('online', function ($user) {
    $user->loadMissing('profile');

    return [
        'id' => $user->id,
        'user_name' => $user->user_name,
        'first_name' => $user->profile->first_name ?? '',
        'last_name' => $user->profile->last_name ?? '',
        'profile_picture_URL' => $user->profile->profile_picture_URL ?? null,
    ];
});

Broadcast::channel('groups.{groupId}', function ($user, $groupId) {
    return GroupUser::where('group_id', $groupId)
        ->where('user_id', $user->id)
        ->exists();
});

Broadcast::channel('conversations.{conversationId}', function ($user, $conversationId) {
    // Only the two participants of a conversation may listen to it
    return Conversation::where('id', $conversationId)
        ->where(function ($query) use ($user) {
            $query->where('user_id1', $user->id)
                  ->orWhere('user_id2', $user->id);
        })
        ->exists();
});
