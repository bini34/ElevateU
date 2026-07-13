<?php

namespace App\Http\Controllers;

use App\Services\LikeService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LikeController extends Controller
{
    use ApiResponse;

    protected $likeService;

    public function __construct(LikeService $likeService)
    {
        $this->likeService = $likeService;
    }

    /**
     * Toggle the authenticated user's like on a post.
     */
    public function toggle(Request $request, $id): JsonResponse
    {
        $result = $this->likeService->toggle($id, $request->user()->id);

        return $this->successResponse($result, $result['liked'] ? 'Post liked' : 'Post unliked');
    }

    /**
     * List the users who liked a post.
     */
    public function index(Request $request, $id): JsonResponse
    {
        $perPage = min((int) $request->input('per_page', 20), 50);
        $likes = $this->likeService->getLikers($id, $perPage);

        return $this->successResponse($likes);
    }
}
