<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\User;
use App\Repositories\ProfileRepository;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProfileController extends Controller
{
    use ApiResponse;

    protected $profileRepository;

    public function __construct(ProfileRepository $profileRepository)
    {
        $this->profileRepository = $profileRepository;
    }

    /**
     * Public profile by user_name (used by the /{name} page).
     */
    public function show(string $userName): JsonResponse
    {
        $user = User::where('user_name', $userName)
            ->with('profile')
            ->firstOrFail();

        $postsCount = Post::where('user_id', $user->id)->count();

        return $this->successResponse([
            'user' => $user,
            'posts_count' => $postsCount,
        ]);
    }

    /**
     * Update the authenticated user's own profile.
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => 'sometimes|required|string|max:255',
            'last_name' => 'sometimes|required|string|max:255',
            'bio' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'birthdate' => 'nullable|date|before:today',
        ]);

        $profile = $this->profileRepository->updateProfile($request->user()->id, $validated);

        if (!$profile) {
            return $this->errorResponse('Profile not found', 404);
        }

        return $this->successResponse(
            ['user' => $request->user()->load('profile')],
            'Profile updated successfully'
        );
    }

    /**
     * Upload a new avatar for the authenticated user.
     */
    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
        ]);

        $file = $request->file('avatar');
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $path = Storage::disk('public')->putFileAs('uploads/avatars', $file, $filename);

        if ($path === false) {
            return $this->errorResponse('Could not store the avatar', 500);
        }

        $url = Storage::disk('public')->url($path);

        $previous = $request->user()->profile?->profile_picture_URL;

        $this->profileRepository->updateProfile($request->user()->id, [
            'profile_picture_URL' => $url,
        ]);

        // Best-effort cleanup of the previous avatar file
        if ($previous && str_contains($previous, '/storage/uploads/avatars/')) {
            Storage::disk('public')->delete('uploads/avatars/' . basename($previous));
        }

        return $this->successResponse(
            ['user' => $request->user()->fresh()->load('profile')],
            'Avatar updated successfully'
        );
    }
}
