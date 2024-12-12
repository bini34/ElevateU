<?php

namespace App\Http\Controllers;

use App\Services\MessageService;
use Illuminate\Http\Request;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use App\Events\MessageSent;


class MessageController extends Controller
{

    use ApiResponse;

    protected $messageService ;

    public function __construct(MessageService $messageService)
    {
        $this->messageService = $messageService;
    }

    public function store(Request $request): JsonResponse
    {
        $messageData = $request->all();
        $files = $request->file('files');  // Handle file uploads if any
        $message = $this->messageService->createMessage($messageData, $files);

        // broadcast(new MessageSent($message))->toOthers();

        return $this->successResponse('Message sent successfully', 201);
    }

    public function show($id): JsonResponse
    {
        $message = $this->messageService->getMessageById($id);
        return $this->successResponse($message);
    }

    public function getMessageCards($userId)
    {
        $messageCards = $this->messageService->getUserConversations($userId);

        return response()->json($messageCards);
    }

    public function getMessagesByConversation($conversationId, Request $request)
    {
        $perPage = $request->input('per_page', 10); // Default to 10 if not provided
        $messages = $this->messageService->getMessagesByConversationPaginated($conversationId, $perPage);

        return response()->json($messages);
    }
    public function getMessagesByGroup(Request $request, $groupId): JsonResponse
    {
        $perPage = $request->input('per_page', 10); // Default pagination to 10
        $messages = $this->messageService->getMessagesByGroupPaginated($groupId, $perPage);
        return $this->successResponse($messages);
    }
    
}
