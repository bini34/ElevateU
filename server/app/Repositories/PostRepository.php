<?php

namespace App\Repositories;

use App\Models\Post;

class PostRepository
{
    protected $post;

    public function __construct(Post $post)
    {
        $this->post = $post;
    }

    /**
     * Eager-load constraints shared by every post listing.
     */
    protected function withDetails($query, ?string $viewerId = null)
    {
        return $query->with([
            'attachments',
            'user' => function ($query) {
                $query->select('id', 'user_name')
                      ->with(['profile' => function ($query) {
                          $query->select('user_id', 'profile_picture_URL', 'first_name', 'last_name');
                      }]);
            },
        ])
        ->withCount(['likes', 'comments'])
        ->withExists(['likes as is_liked' => function ($query) use ($viewerId) {
            $query->where('user_id', $viewerId);
        }]);
    }

    public function getAllPostsWithDetails($perPage = 10, ?string $viewerId = null)
    {
        return $this->withDetails($this->post->newQuery(), $viewerId)
            ->latest()
            ->paginate($perPage);
    }

    public function getUserPosts(string $userId, $perPage = 10, ?string $viewerId = null)
    {
        return $this->withDetails($this->post->newQuery(), $viewerId)
            ->where('user_id', $userId)
            ->latest()
            ->paginate($perPage);
    }

    public function search(string $term, $perPage = 10, ?string $viewerId = null)
    {
        return $this->withDetails($this->post->newQuery(), $viewerId)
            ->where('content', 'like', '%' . addcslashes($term, '%_\\') . '%')
            ->latest()
            ->paginate($perPage);
    }

    public function findPostWithDetails($id, ?string $viewerId = null)
    {
        return $this->withDetails($this->post->newQuery(), $viewerId)->findOrFail($id);
    }

    public function find($id)
    {
        return $this->post->findOrFail($id);
    }

    public function create(array $data)
    {
        return $this->post->create($data);
    }

    public function update($id, array $data)
    {
        $post = $this->find($id);
        $post->update($data);
        return $post;
    }

    public function delete($id)
    {
        $post = $this->find($id);
        $post->delete();
        return true;
    }
}
