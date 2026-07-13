<?php

namespace App\Repositories;

use App\Models\Like;

class LikeRepository
{
    protected $like;

    public function __construct(Like $like)
    {
        $this->like = $like;
    }

    public function findByPostAndUser(string $postId, string $userId)
    {
        return $this->like->where('post_id', $postId)
            ->where('user_id', $userId)
            ->first();
    }

    public function create(string $postId, string $userId)
    {
        return $this->like->create([
            'post_id' => $postId,
            'user_id' => $userId,
        ]);
    }

    public function countForPost(string $postId): int
    {
        return $this->like->where('post_id', $postId)->count();
    }

    public function getUsersForPost(string $postId, $perPage = 20)
    {
        return $this->like->where('post_id', $postId)
            ->with(['user' => function ($query) {
                $query->select('id', 'user_name')
                      ->with(['profile' => function ($query) {
                          $query->select('user_id', 'profile_picture_URL', 'first_name', 'last_name');
                      }]);
            }])
            ->latest()
            ->paginate($perPage);
    }
}
