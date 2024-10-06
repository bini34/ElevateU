<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\MessageService;
use Illuminate\Http\JsonResponse;

class MessageController extends Controller
{
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

        return response()->json($message, 201);
    }

    public function show($id): JsonResponse
    {
        $message = $this->messageService->getMessageById($id);
        return response()->json($message, 200);
    }

    public function getMessagesByConversation(Request $request, $conversationId): JsonResponse
    {
        $perPage = $request->input('per_page', 10); // Default pagination to 10
        $messages = $this->messageService->getMessagesByConversationPaginated($conversationId, $perPage);
        return response()->json($messages, 200);
    }

    public function getMessagesByGroup(Request $request, $groupId): JsonResponse
    {
        $perPage = $request->input('per_page', 10); // Default pagination to 10
        $messages = $this->messageService->getMessagesByGroupPaginated($groupId, $perPage);
        return response()->json($messages, 200);
    }
}
