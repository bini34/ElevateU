<?php

namespace App\Services;

use App\Models\Conversation;
use App\Models\Group;
use App\Models\GroupUser;
use App\Models\User;
use App\Repositories\ConversationRepository;
use App\Repositories\FileAttachmentRepository;
use App\Repositories\MessageRepository;
use App\Support\UniqueConflict;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MessageService
{
    protected $messageRepository;

    protected $conversationRepository;

    protected $fileAttachmentRepository;

    public function __construct(
        MessageRepository $messageRepository,
        ConversationRepository $conversationRepository,
        FileAttachmentRepository $fileAttachmentRepository
    ) {
        $this->messageRepository = $messageRepository;
        $this->conversationRepository = $conversationRepository;
        $this->fileAttachmentRepository = $fileAttachmentRepository;
    }

    /**
     * Create a message from the authenticated sender.
     *
     * Idempotent: when the client supplies a client_uuid it has used before
     * (e.g. a retry after a network failure), the existing message is
     * returned instead of creating a duplicate.
     *
     * @return array{message: \App\Models\Message, created: bool}
     */
    public function createMessage(string $senderId, array $data, array $files = []): array
    {
        if (! empty($data['client_uuid'])) {
            $existing = $this->messageRepository->findBySenderAndClientUuid($senderId, $data['client_uuid']);
            if ($existing) {
                // Removed members must not recover group content by replaying a key.
                $this->getMessageById($existing->id, $senderId);

                return ['message' => $existing, 'created' => false];
            }
        }

        $storedPaths = [];

        try {
            $message = DB::transaction(function () use ($senderId, $data, $files, &$storedPaths) {
                $payload = [
                    'message' => $data['message'] ?? null,
                    'sender_id' => $senderId,
                    'client_uuid' => $data['client_uuid'] ?? null,
                ];

                if (! empty($data['group_id'])) {
                    $this->assertGroupMember($data['group_id'], $senderId);
                    $payload['group_id'] = $data['group_id'];
                } else {
                    $conversation = $this->conversationRepository->createConversation($senderId, $data['receiver_id']);

                    $payload['receiver_id'] = $data['receiver_id'];
                    $payload['conversation_id'] = $conversation->id;
                }

                $message = $this->messageRepository->create($payload);

                foreach ($files as $file) {
                    if (! $file instanceof \Illuminate\Http\UploadedFile) {
                        continue;
                    }

                    $path = $this->storeFile($file);
                    $storedPaths[] = $path;

                    $this->fileAttachmentRepository->create([
                        'message_id' => $message->id,
                        'name' => $file->getClientOriginalName(),
                        'path' => $path,
                        'mime' => $file->getMimeType(),
                        'size' => $file->getSize(),
                    ]);
                }

                if (isset($conversation)) {
                    $conversation->update(['last_message_id' => $message->id]);
                } elseif ($message->group_id) {
                    Group::whereKey($message->group_id)->update(['last_message_id' => $message->id]);
                }

                return $message;
            });
        } catch (\Throwable $e) {
            foreach ($storedPaths as $path) {
                Storage::disk('message_attachments')->delete($path);
            }
            if (! empty($data['client_uuid']) && UniqueConflict::matches($e,
                'messages_sender_id_client_uuid_unique', ['messages.sender_id', 'messages.client_uuid'])) {
                $existing = $this->messageRepository->findBySenderAndClientUuid($senderId, $data['client_uuid']);
                if ($existing) {
                    $this->getMessageById($existing->id, $senderId);

                    return ['message' => $existing, 'created' => false];
                }
            }
            throw $e;
        }

        return [
            'message' => $this->messageRepository->find($message->id),
            'created' => true,
        ];
    }

    public function getMessageById($id, string $userId)
    {
        $message = $this->messageRepository->find($id);

        if ($message->group_id) {
            $this->assertGroupMember($message->group_id, $userId);

            return $message;
        }

        // Deleting a group nulls group_id in the existing schema. An orphaned
        // group message must not become a direct message readable by its sender.
        if (! $message->conversation_id) {
            throw new AuthorizationException('You are not part of this conversation.');
        }

        $this->assertConversationParticipant($message->conversation_id, $userId);

        return $message;
    }

    public function getMessagesByConversationPaginated(string $conversationId, string $userId, $perPage = 20)
    {
        $this->assertConversationParticipant($conversationId, $userId);

        return $this->messageRepository->getMessagesByConversationPaginated($conversationId, $perPage);
    }

    public function getMessagesByGroupPaginated(string $groupId, string $userId, $perPage = 20)
    {
        $this->assertGroupMember($groupId, $userId);

        return $this->messageRepository->getMessagesByGroupPaginated($groupId, $perPage);
    }

    /**
     * @return array{read_at: string, updated: int}
     */
    public function markConversationRead(string $conversationId, string $userId): array
    {
        $this->assertConversationParticipant($conversationId, $userId);

        $readAt = now();
        $updated = $this->messageRepository->markConversationRead($conversationId, $userId, $readAt);

        return ['read_at' => $readAt->toISOString(), 'updated' => $updated];
    }

    public function getUserConversations(string $userId)
    {
        return $this->messageRepository->getUserConversations($userId);
    }

    /**
     * Card describing the other user plus the existing conversation between
     * you, if any. Used when opening /chat/{userId} directly.
     */
    public function getConversationWith(string $userId, string $otherUserId): array
    {
        $other = User::with('profile')->findOrFail($otherUserId);
        $conversation = $this->conversationRepository->findConversation($userId, $otherUserId);

        return [
            'user' => [
                'user_id' => $other->id,
                'user_name' => $other->user_name,
                'first_name' => $other->profile->first_name ?? '',
                'last_name' => $other->profile->last_name ?? '',
                'profile_picture_URL' => $other->profile->profile_picture_URL ?? null,
            ],
            'conversation_id' => $conversation?->id,
        ];
    }

    protected function isConversationParticipant(string $conversationId, string $userId): bool
    {
        return Conversation::where('id', $conversationId)
            ->where(function ($query) use ($userId) {
                $query->where('user_id1', $userId)->orWhere('user_id2', $userId);
            })
            ->exists();
    }

    protected function assertConversationParticipant(string $conversationId, string $userId): void
    {
        if (! $this->isConversationParticipant($conversationId, $userId)) {
            throw new AuthorizationException('You are not part of this conversation.');
        }
    }

    protected function assertGroupMember(string $groupId, string $userId): void
    {
        $isMember = GroupUser::where('group_id', $groupId)
            ->where('user_id', $userId)
            ->exists();

        if (! $isMember) {
            throw new AuthorizationException('You are not a member of this group.');
        }
    }

    protected function storeFile($file): string
    {
        $filename = Str::uuid().'.'.$file->extension();
        $path = Storage::disk('message_attachments')->putFileAs('uploads/messages', $file, $filename);

        if ($path === false) {
            throw new \RuntimeException('Failed to store uploaded file.');
        }

        return $path;
    }
}
