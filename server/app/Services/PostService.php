<?php

namespace App\Services;

use App\Repositories\PostRepository;
use App\Repositories\FileAttachmentRepository;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class PostService
{
    protected $postRepository;
    protected $fileAttachmentRepository;
    

    public function __construct(PostRepository $postRepository, FileAttachmentRepository $fileAttachmentRepository)
    {
        $this->postRepository = $postRepository;
        $this->fileAttachmentRepository = $fileAttachmentRepository;
    }


    public function getAllPostsWithDetails($perPage = 10)
    {
        return $this->postRepository->getAllPostsWithDetails($perPage);
    }

    public function getPostByIdWithDetails($id)
    {
        return $this->postRepository->findPostWithDetails($id);
    }
    public function createPost(array $data, $files = [])
    {
    \Log::info('be post ' . json_encode($data));

    $post = $this->postRepository->create($data);
    $post->refresh();
    \Log::info('af post id  ' . $post->id);


    try {
        if (is_array($files) && count($files) > 0) {
            foreach ($files as $file) {
                // Ensure each file is an instance of UploadedFile
                if ($file instanceof \Illuminate\Http\UploadedFile) {
                    \Log::info('Processing file: ' . $file->getClientOriginalName());

                    // Store each file locally
                    $filePath = $this->storeFile($file);
                    
                    // Create file attachment record for each file
                    $this->fileAttachmentRepository->create([
                        'post_id' => $post->id,
                        'name' => $file->getClientOriginalName(),
                        'path' => $filePath,
                        'mime' => $file->getClientMimeType(),
                        'size' => $file->getSize(),
                    ]);
                } else {
                    \Log::error('Invalid file instance.');
                }
            }
        } else {
            \Log::error('No files provided.');
        }
    } catch (\Exception $e) {
        \Log::error('Error storing files: ' . $e->getMessage());

        return response()->json([
            'message' => 'Error sending file',
            'error' => $e->getMessage()
        ], 400);
    }

    return $post;
}



    protected function storeFile($file)
    {
        try {
            $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
            $filePath = Storage::disk('public')->putFileAs('uploads/posts', $file, $filename);
            
            // Generate a URL for the stored file
            $fileUrl = Storage::url($filePath);

            return $fileUrl;
        } catch (\Exception $e) {
            \Log::error('Error uploading file: ' . $e->getMessage());

            return response()->json([
                'message' => 'Error uploading file',
                'error' => $e->getMessage()
            ], 400);
        }
    }
}
