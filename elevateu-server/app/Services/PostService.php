<?php

namespace App\Services;

use App\Repositories\PostRepository;
use App\Repositories\FileAttachmentRepository;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class PostService
{
    protected $postRepository;
    protected $fileAttachmentRepository;

    public function __construct(PostRepository $postRepository, FileAttachmentRepository $fileAttachmentRepository)
    {
        $this->postRepository = $postRepository;
        $this->fileAttachmentRepository = $fileAttachmentRepository;

    }

    public function getAllPosts()
    {
        return $this->postRepository->getAll();
    }

    public function getPostById($id)
    {
        return $this->postRepository->find($id);
    }

    public function createPost(array $data)
    {
        $post = $this->postRepository->create($data);

        // Step 2: Handle file upload if a file is provided
        if ($file) {
            // Step 3: Store the file locally
            $filePath = $this->storeFile($file);

            // Step 4: Create file attachment record
            $this->fileAttachmentRepository->create([
                'post_id' => $post->id,
                'name' => $file->getClientOriginalName(),
                'path' => $filePath,
                'mime' => $file->getClientMimeType(),
                'size' => $file->getSize(),
            ]);
        }
        return $post;
    }

    public function updatePost($id, array $data)
    {
        return $this->postRepository->update($id, $data);
    }

    public function deletePost($id)
    {
        return $this->postRepository->delete($id);
    }
    public function searchPosts(array $data)
    {
        return $this->postRepository->search($data);
    }

     /**
     * Store the uploaded file in local storage and return the file path.
     */
    protected function storeFile($file)
    {
        // Create a unique filename
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();

        // Store the file in the 'public/uploads' directory using the local driver
        return Storage::disk('public')->putFileAs('uploads/posts', $file, $filename);
    }

}
