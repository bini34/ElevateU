<?php

namespace App\Http\Controllers;

use App\Services\CommentService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    use ApiResponse;

    protected $commentService;

    public function __construct(CommentService $commentService)
    {
        $this->commentService = $commentService;
    }

    /**
     * List comments for a post, oldest first.
     */
    public function index(Request $request, $id): JsonResponse
    {
        $perPage = min((int) $request->input('per_page', 10), 50);
        $comments = $this->commentService->getForPost($id, $perPage);

        return $this->successResponse($comments);
    }

    /**
     * Comment on a post as the authenticated user.
     */
    public function store(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'content' => 'required|string|max:2000',
        ]);

        $comment = $this->commentService->create($id, $request->user()->id, $validated['content']);

        return $this->successResponse(['comment' => $comment], 'Comment added successfully', 201);
    }

    /**
     * Edit the authenticated user's own comment.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'content' => 'required|string|max:2000',
        ]);

        $comment = $this->commentService->update($id, $request->user()->id, $validated['content']);

        return $this->successResponse(['comment' => $comment], 'Comment updated successfully');
    }

    /**
     * Delete a comment (comment author or post owner).
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $this->commentService->delete($id, $request->user()->id);

        return $this->successResponse(['message' => 'Comment deleted successfully']);
    }
}
