<?php

namespace App\Services;

use App\Repositories\CommentRepository;
use App\Repositories\PostRepository;
use Illuminate\Auth\Access\AuthorizationException;

class CommentService
{
    protected $commentRepository;
    protected $postRepository;

    public function __construct(CommentRepository $commentRepository, PostRepository $postRepository)
    {
        $this->commentRepository = $commentRepository;
        $this->postRepository = $postRepository;
    }

    public function getForPost(string $postId, $perPage = 10)
    {
        $this->postRepository->find($postId);

        return $this->commentRepository->getForPost($postId, $perPage);
    }

    public function create(string $postId, string $userId, string $content)
    {
        $this->postRepository->find($postId);

        $comment = $this->commentRepository->create([
            'post_id' => $postId,
            'user_id' => $userId,
            'content' => $content,
        ]);

        return $this->commentRepository->findWithAuthor($comment->id);
    }

    public function update(string $commentId, string $userId, string $content)
    {
        $comment = $this->commentRepository->find($commentId);

        if ($comment->user_id !== $userId) {
            throw new AuthorizationException('You may only edit your own comments.');
        }

        $comment->update(['content' => $content]);

        return $this->commentRepository->findWithAuthor($commentId);
    }

    /**
     * A comment may be deleted by its author or by the owner of the post.
     */
    public function delete(string $commentId, string $userId): void
    {
        $comment = $this->commentRepository->find($commentId);

        $isCommentAuthor = $comment->user_id === $userId;
        $isPostOwner = $comment->post_id
            && $this->postRepository->find($comment->post_id)->user_id === $userId;

        if (!$isCommentAuthor && !$isPostOwner) {
            throw new AuthorizationException('You may only delete your own comments.');
        }

        $comment->delete();
    }
}
