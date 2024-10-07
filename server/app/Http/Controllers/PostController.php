<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Requests\StorePostRequest;
use App\Services\PostService;
use App\Services\LikeService;
use App\Services\CommentService;
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
        $perPage = $request->input('per_page', 10);  // Pagination default
        $posts = $this->postService->getAllPostsWithDetails($perPage);  // Updated service call
        return $this->successResponse($posts);
    }

    public function store(StorePostRequest $request): JsonResponse
    {
        $this->postService->createPost($request->all(), $request->file('file'));
        return $this->successResponse(['message' => "Post created successfully"], 201);
    }

    public function show($id): JsonResponse
    {
        $post = $this->postService->getPostByIdWithDetails($id);  // Updated to include details
        return $this->successResponse($post);
    }
    
    public function update(Request $request, $id): JsonResponse
    {
        $post = $this->postService->updatePost($id, $request->all());
        return $this->successResponse($post);
    }

    public function destroy($id): JsonResponse
    {
        $this->postService->deletePost($id);
        return $this->successResponse(['message' => 'Post deleted successfully']);
    }

    public function userPosts($userId, $page = 1): JsonResponse
    {
        $posts = $this->postService->getUserPosts($userId, $page);
        return $this->successResponse($posts);
    }

    public function search(Request $request): JsonResponse
    {
        $posts = $this->postService->searchPosts($request->all());
        return $this->successResponse($posts);
    }
}

