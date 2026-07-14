<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;

/**
 * A social activity notification (like / comment / message).
 *
 * Stored in the database and broadcast on the recipient's private channel
 * (App.Models.User.{id}); the broadcast leg is delivered by the queue
 * worker, so the triggering request never waits on the websocket.
 */
class ActivityNotification extends Notification
{
    public const KIND_POST_LIKED = 'post_liked';
    public const KIND_POST_COMMENTED = 'post_commented';
    public const KIND_NEW_MESSAGE = 'new_message';

    protected string $kind;
    protected User $actor;
    protected array $extra;

    public function __construct(string $kind, User $actor, array $extra = [])
    {
        $this->kind = $kind;
        $this->actor = $actor;
        $this->extra = $extra;
    }

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    protected function payload(): array
    {
        $this->actor->loadMissing('profile');

        $name = trim(($this->actor->profile->first_name ?? '') . ' ' . ($this->actor->profile->last_name ?? ''))
            ?: $this->actor->user_name;

        return array_merge([
            'kind' => $this->kind,
            'actor' => [
                'id' => $this->actor->id,
                'user_name' => $this->actor->user_name,
                'name' => $name,
                'avatar' => $this->actor->profile->profile_picture_URL ?? null,
            ],
            'text' => $this->text($name),
        ], $this->extra);
    }

    protected function text(string $actorName): string
    {
        return match ($this->kind) {
            self::KIND_POST_LIKED => "$actorName liked your post",
            self::KIND_POST_COMMENTED => "$actorName commented on your post",
            self::KIND_NEW_MESSAGE => "$actorName sent you a message",
            default => "$actorName interacted with you",
        };
    }

    public function toArray(object $notifiable): array
    {
        return $this->payload();
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->payload());
    }

    public function broadcastType(): string
    {
        return 'activity';
    }

    /**
     * Convenience helpers for the three activity kinds.
     */
    public static function postLiked(User $actor, string $postId): self
    {
        return new self(self::KIND_POST_LIKED, $actor, ['post_id' => $postId]);
    }

    public static function postCommented(User $actor, string $postId, string $comment): self
    {
        return new self(self::KIND_POST_COMMENTED, $actor, [
            'post_id' => $postId,
            'snippet' => Str::limit($comment, 80),
        ]);
    }

    public static function newMessage(User $actor, string $conversationId, ?string $message): self
    {
        return new self(self::KIND_NEW_MESSAGE, $actor, [
            'conversation_id' => $conversationId,
            'snippet' => $message ? Str::limit($message, 80) : 'Sent an attachment',
        ]);
    }
}
