<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Requests\StorePostRequest;
use App\Services\PostService;
use App\Traits\ApiResponse;

class PostController extends Controller
{
    use ApiResponse;

    protected $postService;

    public function __construct(PostService $postService)
    {
        $this->postService = $postService;
    }

    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->input('per_page', 10), 50);
        $posts = $this->postService->getAllPostsWithDetails($perPage, $request->user()->id);
        return $this->successResponse($posts);
    }

    public function store(StorePostRequest $request): JsonResponse
    {
        $post = $this->postService->createPost(
            $request->user()->id,
            $request->input('content'),
            $request->file('file', [])
        );

        return $this->successResponse(['post' => $post], 'Post created successfully', 201);
    }

    public function show(Request $request, $id): JsonResponse
    {
        $post = $this->postService->getPostByIdWithDetails($id, $request->user()->id);
        return $this->successResponse($post);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'content' => 'required|string|max:5000',
        ]);

        $post = $this->postService->updatePost($id, $request->user()->id, $validated['content']);

        return $this->successResponse(['post' => $post], 'Post updated successfully');
    }

    public function destroy(Request $request, $id): JsonResponse
    {
        $this->postService->deletePost($id, $request->user()->id);
        return $this->successResponse(['message' => 'Post deleted successfully']);
    }

    public function userPosts(Request $request, $userId): JsonResponse
    {
        $perPage = min((int) $request->input('per_page', 10), 50);
        $posts = $this->postService->getUserPosts($userId, $perPage, $request->user()->id);
        return $this->successResponse($posts);
    }

    public function search(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'query' => 'required|string|max:255',
        ]);

        $perPage = min((int) $request->input('per_page', 10), 50);
        $posts = $this->postService->searchPosts($validated['query'], $perPage, $request->user()->id);

        return $this->successResponse($posts);
    }
}
