<?php

namespace App\Services;

use App\Repositories\PostRepository;
use App\Repositories\FileAttachmentRepository;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PostService
{
    protected $postRepository;
    protected $fileAttachmentRepository;

    public function __construct(PostRepository $postRepository, FileAttachmentRepository $fileAttachmentRepository)
    {
        $this->postRepository = $postRepository;
        $this->fileAttachmentRepository = $fileAttachmentRepository;
    }

    public function getAllPostsWithDetails($perPage = 10, ?string $viewerId = null)
    {
        return $this->postRepository->getAllPostsWithDetails($perPage, $viewerId);
    }

    public function getPostByIdWithDetails($id, ?string $viewerId = null)
    {
        return $this->postRepository->findPostWithDetails($id, $viewerId);
    }

    public function getUserPosts(string $userId, $perPage = 10, ?string $viewerId = null)
    {
        return $this->postRepository->getUserPosts($userId, $perPage, $viewerId);
    }

    public function searchPosts(string $term, $perPage = 10, ?string $viewerId = null)
    {
        return $this->postRepository->search($term, $perPage, $viewerId);
    }

    /**
     * Create a post (optionally with attachments) for the given user.
     * Stored files are cleaned up if the database transaction fails.
     */
    public function createPost(string $userId, ?string $content, array $files = [])
    {
        $storedPaths = [];

        try {
            $post = DB::transaction(function () use ($userId, $content, $files, &$storedPaths) {
                $post = $this->postRepository->create([
                    'user_id' => $userId,
                    'content' => $content,
                ]);

                foreach ($files as $file) {
                    if (!$file instanceof \Illuminate\Http\UploadedFile) {
                        continue;
                    }

                    $path = $this->storeFile($file);
                    $storedPaths[] = $path;

                    $this->fileAttachmentRepository->create([
                        'post_id' => $post->id,
                        'name' => $file->getClientOriginalName(),
                        'path' => $path,
                        'mime' => $file->getMimeType(),
                        'size' => $file->getSize(),
                    ]);
                }

                return $post;
            });
        } catch (\Throwable $e) {
            // The transaction rolled back; remove any files already on disk
            foreach ($storedPaths as $path) {
                Storage::disk('public')->delete($path);
            }
            throw $e;
        }

        return $this->postRepository->findPostWithDetails($post->id, $userId);
    }

    public function updatePost(string $id, string $userId, string $content)
    {
        $post = $this->postRepository->find($id);

        if ($post->user_id !== $userId) {
            throw new AuthorizationException('You may only edit your own posts.');
        }

        $post->update(['content' => $content]);

        return $this->postRepository->findPostWithDetails($id, $userId);
    }

    public function deletePost(string $id, string $userId): void
    {
        $post = $this->postRepository->find($id);

        if ($post->user_id !== $userId) {
            throw new AuthorizationException('You may only delete your own posts.');
        }

        $attachments = $this->fileAttachmentRepository->findByPostId($post->id);

        DB::transaction(function () use ($post, $attachments) {
            foreach ($attachments as $attachment) {
                $attachment->delete();
            }
            $post->delete();
        });

        // Remove files from disk only after the database delete has committed
        foreach ($attachments as $attachment) {
            Storage::disk('public')->delete($attachment->path);
        }
    }

    /**
     * Store an uploaded file and return its path relative to the public disk.
     */
    protected function storeFile($file): string
    {
        $filename = Str::uuid() . '.' . $file->extension();
        $path = Storage::disk('public')->putFileAs('uploads/posts', $file, $filename);

        if ($path === false) {
            throw new \RuntimeException('Failed to store uploaded file.');
        }

        return $path;
    }
}
