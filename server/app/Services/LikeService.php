<?php

namespace App\Services;

use App\Repositories\LikeRepository;
use App\Repositories\PostRepository;
use Illuminate\Database\UniqueConstraintViolationException;

class LikeService
{
    protected $likeRepository;
    protected $postRepository;

    public function __construct(LikeRepository $likeRepository, PostRepository $postRepository)
    {
        $this->likeRepository = $likeRepository;
        $this->postRepository = $postRepository;
    }

    /**
     * Like the post if the user hasn't liked it yet, otherwise unlike it.
     * Safe against double-submits: the (user_id, post_id) unique index makes
     * a concurrent duplicate insert fail, which we treat as "already liked".
     *
     * @return array{liked: bool, likes_count: int}
     */
    public function toggle(string $postId, string $userId): array
    {
        // Ensure the post exists (404 via findOrFail if not)
        $this->postRepository->find($postId);

        $existing = $this->likeRepository->findByPostAndUser($postId, $userId);

        if ($existing) {
            $existing->delete();
            $liked = false;
        } else {
            try {
                $this->likeRepository->create($postId, $userId);
            } catch (UniqueConstraintViolationException $e) {
                // A concurrent request already created the like; keep it.
            }
            $liked = true;
        }

        return [
            'liked' => $liked,
            'likes_count' => $this->likeRepository->countForPost($postId),
        ];
    }

    public function getLikers(string $postId, $perPage = 20)
    {
        $this->postRepository->find($postId);

        return $this->likeRepository->getUsersForPost($postId, $perPage);
    }
}
