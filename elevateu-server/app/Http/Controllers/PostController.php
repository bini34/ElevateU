<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Requests\PostRequest;


class PostController extends Controller
{
    protected $postService;

    public function __construct(PostService $postService)
    {
        $this->postService = $postService;
    }

    public function index(Request $request): JsonResponse
    {
        $posts = $this->postService->getAllPosts();
        return response()->json($posts, 200);
    }

    public function store(PostRequest $request): JsonResponse
    {
        $post = $this->postService->createPost($request->all(), $request->file('attachment'));

        // Get the latest file attachment for this post
        $fileAttachment = $post->attachments()->latest()->first();

        $attachmentUrl = $fileAttachment ? Storage::url($fileAttachment->path) : null;

        return response()->json([
            'post' => $post,
            'attachment_url' => $attachmentUrl
        ], 201);
    }


    public function show(Request $request): JsonResponse
    {
        $post = $this->postService->getPostById($id);
        return response()->json($post, 200);
    }
    public function update(PostRequest $request): JsonResponse
    {
        $post = $this->postService->updatePost($request->all());
        return response()->json($post, 200);

    }
    public function destroy(Request $request)
    {
        $post = $this->postService->deletePost($id);
        return response()->json($post, 200);
    }

    public function search(Request $request)
    {
        $posts = $this->postService->searchPosts($request->all());
        return response()->json($posts, 200);
    }


}
