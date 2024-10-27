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
        return $this->post->with([
            'attachments', // Eager load attachments
            'user' => function($query) { // Eager load user with specific fields
                $query->select('id', 'user_name')
                      ->with(['profile' => function($query) { // Eager load profile with specific fields
                          $query->select('user_id', 'profile_picture_URL', 'first_name', 'last_name');
                      }]);
            }
        ])->withCount(['likes', 'comments']) // Count likes and comments
          ->paginate($perPage);
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
