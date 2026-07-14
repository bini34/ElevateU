<?php

namespace App\Http\Controllers;

use App\Events\MessageSent;
use App\Events\MessagesRead;
use App\Models\User;
use App\Notifications\ActivityNotification;
use App\Services\MessageService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    use ApiResponse;

    protected $messageService;

    public function __construct(MessageService $messageService)
    {
        $this->messageService = $messageService;
    }

    /**
     * Send a message as the authenticated user (P2P or group).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'required_without:files|nullable|string|max:5000',
            'files' => 'required_without:message|nullable|array|max:10',
            'files.*' => 'file|mimes:jpeg,png,jpg,gif,webp,mp4,avi,mov,pdf,doc,docx|max:20480',
            'receiver_id' => 'required_without:group_id|nullable|uuid|exists:users,id',
            'group_id' => 'nullable|uuid|exists:groups,id',
            'client_uuid' => 'nullable|uuid',
        ]);

        $senderId = $request->user()->id;

        if (($validated['receiver_id'] ?? null) === $senderId) {
            return $this->errorResponse('You cannot message yourself.', 422);
        }

        $result = $this->messageService->createMessage(
            $senderId,
            $validated,
            $request->file('files', [])
        );

        // Broadcast only on first creation — an idempotent retry must not
        // emit the message a second time. toOthers() keeps the sender's own
        // socket (X-Socket-ID header) from receiving its echo.
        if ($result['created']) {
            $message = $result['message'];
            broadcast(new MessageSent($message))->toOthers();

            // Notify the receiver of direct messages (group chats rely on
            // their own unread indicators instead of fan-out notifications)
            if ($message->receiver_id) {
                User::find($message->receiver_id)?->notify(
                    ActivityNotification::newMessage(
                        $request->user(),
                        $message->conversation_id,
                        $message->message
                    )
                );
            }
        }

        return $this->successResponse(
            ['message' => $result['message']],
            $result['created'] ? 'Message sent successfully' : 'Message already sent',
            $result['created'] ? 201 : 200
        );
    }

    public function show(Request $request, $id): JsonResponse
    {
        $message = $this->messageService->getMessageById($id, $request->user()->id);
        return $this->successResponse($message);
    }

    /**
     * Chat list cards for the authenticated user.
     */
    public function getMessageCards(Request $request): JsonResponse
    {
        $cards = $this->messageService->getUserConversations($request->user()->id);
        return $this->successResponse($cards);
    }

    /**
     * The other user + existing conversation (if any) for /chat/{userId}.
     */
    public function conversationWith(Request $request, $userId): JsonResponse
    {
        $data = $this->messageService->getConversationWith($request->user()->id, $userId);
        return $this->successResponse($data);
    }

    public function getMessagesByConversation(Request $request, $conversationId): JsonResponse
    {
        $perPage = min((int) $request->input('per_page', 20), 50);
        $messages = $this->messageService->getMessagesByConversationPaginated(
            $conversationId,
            $request->user()->id,
            $perPage
        );

        return $this->successResponse($messages);
    }

    /**
     * Mark all messages sent to the authenticated user in a conversation as
     * read and notify the other participant.
     */
    public function markRead(Request $request, $conversationId): JsonResponse
    {
        $result = $this->messageService->markConversationRead($conversationId, $request->user()->id);

        if ($result['updated'] > 0) {
            broadcast(new MessagesRead($conversationId, $request->user()->id, $result['read_at']))->toOthers();
        }

        return $this->successResponse($result, 'Conversation marked as read');
    }

    public function getMessagesByGroup(Request $request, $groupId): JsonResponse
    {
        $perPage = min((int) $request->input('per_page', 20), 50);
        $messages = $this->messageService->getMessagesByGroupPaginated(
            $groupId,
            $request->user()->id,
            $perPage
        );

        return $this->successResponse($messages);
    }
}
