<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\MessageService;
use Illuminate\Http\JsonResponse;
use App\Traits\ApiResponse;

class MessageController extends Controller
{
    use ApiResponse;

    protected $messageService;

    public function __construct(MessageService $messageService)
    {
        $this->messageService = $messageService;
    }

    public function store(Request $request): JsonResponse
    {
        $messageData = $request->all();
        $files = $request->file('files');  // Handle file uploads if any
        $message = $this->messageService->createMessage($messageData, $files);

        return $this->successResponse($message, 201);
    }

    public function show($id): JsonResponse
    {
        $message = $this->messageService->getMessageById($id);
        return $this->successResponse($message);
    }

    public function getMessagesByConversation(Request $request, $conversationId): JsonResponse
    {
        $perPage = $request->input('per_page', 10); // Default pagination to 10
        $messages = $this->messageService->getMessagesByConversationPaginated($conversationId, $perPage);
        return $this->successResponse($messages);
    }

    public function getMessagesByGroup(Request $request, $groupId): JsonResponse
    {
        $perPage = $request->input('per_page', 10); // Default pagination to 10
        $messages = $this->messageService->getMessagesByGroupPaginated($groupId, $perPage);
        return $this->successResponse($messages);
    }
}
