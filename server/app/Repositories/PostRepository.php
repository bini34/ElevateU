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

    public function getAllPostsWithDetails($perPage = 10)
    {
        // Eager load likes, comments (with user profiles), and attachments
        return $this->post->with([
            'likes',                              // Eager load likes
            'comments.user.profile',              // Eager load comments with user profile
            'attachments'                         // Eager load attachments
        ])->paginate($perPage);
    }

    public function findPostWithDetails($id)
    {
        return $this->post->with([
            'likes',
            'comments.user.profile',
            'attachments'
        ])->findOrFail($id);
    }

    public function create(array $data)
    {
        $post = $this->post->create($data);
        \Log::info('repo post ' . $post);
        return $post;

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
