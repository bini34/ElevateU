<?php

namespace App\Services;

use App\Repositories\MessageRepository;
use App\Repositories\ConversationRepository;
use App\Repositories\FileAttachmentRepository;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

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

    public function createMessage(array $data, $files = [])
    {
        Log::info('Creating message: ' . json_encode($data));

        // Check if it's P2P (has receiver_id and no group_id)
        if (isset($data['receiver_id']) && !isset($data['group_id'])) {
            // Check if a conversation exists between sender and receiver
            $conversation = $this->conversationRepository->findConversation($data['sender_id'], $data['receiver_id']);
            
            // If no conversation exists, create a new one
            if (!$conversation) {
                $conversation = $this->conversationRepository->createConversation($data['sender_id'], $data['receiver_id']);
            }

            // Set the conversation_id in the data for P2P messages
            $data['conversation_id'] = $conversation->id;
        } elseif (isset($data['group_id'])) {
            // If it's a group message, ensure the conversation_id is null
            $data['conversation_id'] = null;
        }
        Log::info('after conversation id message: ' . json_encode($data));


        // Now store the message
        $message = $this->messageRepository->create($data);
        $message->refresh();

        // If it's a P2P message, update the conversation's last message ID
        if (isset($data['conversation_id'])) {
            $this->conversationRepository->updateLastMessageId($data['conversation_id'], $message->id);
        }

        // Handle file attachments if any
        try {
            if (is_array($files) && count($files) > 0) {
                foreach ($files as $file) {
                    if ($file instanceof \Illuminate\Http\UploadedFile) {
                        $filePath = $this->storeFile($file);
                        $this->fileAttachmentRepository->create([
                            'message_id' => $message->id,
                            'name' => $file->getClientOriginalName(),
                            'path' => $filePath,
                            'mime' => $file->getClientMimeType(),
                            'size' => $file->getSize(),
                        ]);
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error('Error storing files: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error uploading files',
                'error' => $e->getMessage()
            ], 400);
        }

        return $message;
    }

    public function getMessageById($id)
    {
        return $this->messageRepository->find($id);
    }

    public function getMessagesByConversationPaginated($conversationId, $perPage = 10)
    {
        return $this->messageRepository->getMessagesByConversationPaginated($conversationId, $perPage);
    }

    public function getMessagesByGroupPaginated($groupId, $perPage = 10)
    {
        return $this->messageRepository->getMessagesByGroupPaginated($groupId, $perPage);
    }

    protected function storeFile($file)
    {
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        return Storage::disk('public')->putFileAs('uploads/messages', $file, $filename);
    }
}
