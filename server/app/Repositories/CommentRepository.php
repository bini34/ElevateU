<?php

namespace App\Repositories;

use App\Models\Comment;

class CommentRepository
{
    protected $comment;

    public function __construct(Comment $comment)
    {
        $this->comment = $comment;
    }

    public function create(array $data)
    {
        return $this->comment->create($data);
    }

    public function find($id)
    {
        return $this->comment->findOrFail($id);
    }

    public function findWithAuthor($id)
    {
        return $this->withAuthor($this->comment->newQuery())->findOrFail($id);
    }

    public function getForPost(string $postId, $perPage = 10)
    {
        return $this->withAuthor($this->comment->newQuery())
            ->where('post_id', $postId)
            ->orderBy('created_at')
            ->paginate($perPage);
    }

    protected function withAuthor($query)
    {
        return $query->with(['user' => function ($query) {
            $query->select('id', 'user_name')
                  ->with(['profile' => function ($query) {
                      $query->select('user_id', 'profile_picture_URL', 'first_name', 'last_name');
                  }]);
        }]);
    }
}
