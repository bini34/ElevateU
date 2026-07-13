<?php

use App\Models\Conversation;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    // User IDs are UUID strings, so compare them as strings
    return (string) $user->id === (string) $id;
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
