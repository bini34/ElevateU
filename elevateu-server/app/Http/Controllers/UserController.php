<?Php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\UserService;

class UserController extends Controller
{
    protected $userService;

    public function __construct(UserService $userService)
    {
        $this->userService = $userService;
    }

    public function show($id)
    {
        $user = $this->userService->getUserById($id);
        return response()->json($user, 200);
    }

    public function store(Request $request)
    {
        // Validation rules
        $validatedData = $request->validate([
            'user_name' => 'required|string|max:255|unique:users,user_name', // Ensure user_name is unique
            'email' => 'required|email|unique:users,email',  // Ensure email is unique
            'password' => 'required|string|min:6',
        ]);

        // Try to create a new user using the validated data
        try {
            $user = $this->userService->createUser($validatedData);

            // Check if user creation was successful
            if (!$user) {
                return response()->json(['message' => 'User not created'], 500);
            }

            return response()->json($user, 201);
        } catch (ValidationException $e) {
            // Catch any validation errors and return a custom response
            return response()->json(['message' => 'User creation failed', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            // Handle other potential exceptions
            return response()->json(['message' => 'An unexpected error occurred', 'error' => $e->getMessage()], 500);
        }
    }

}
