<?php

namespace App\Http\Controllers;

use App\Http\Requests\GoalWriteRequest;
use App\Repositories\GoalRepository;
use App\Services\GoalService;
use App\Support\GoalFields;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class GoalController extends Controller
{
    use ApiResponse;

    public function __construct(private GoalService $service, private GoalRepository $goals) {}

    public function index(Request $request): JsonResponse
    {
        self::onlyFields($request, ['status', 'visibility', 'page', 'per_page']);
        $filters = $request->validate(['status' => ['sometimes', 'required', Rule::in(GoalFields::STATUSES)],
            'visibility' => ['sometimes', 'required', Rule::in(GoalFields::VISIBILITIES)], 'page' => 'sometimes|integer|min:1']);

        return $this->successResponse($this->goals->listing($request->user()->id, $filters, $this->perPage($request, 10)));
    }

    public function store(GoalWriteRequest $request): JsonResponse
    {
        return $this->successResponse($this->service->create($request->user()->id, $request->validated()), 'Goal created.', 201);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        return $this->successResponse($this->goals->visible($request->user()->id)->findOrFail($id));
    }

    public function update(GoalWriteRequest $request, string $id): JsonResponse
    {
        return $this->successResponse($this->service->update($id, $request->user()->id, $request->validated()));
    }

    public function transition(Request $request, string $id, string $operation): JsonResponse
    {
        self::onlyFields($request, []);

        return $this->successResponse($this->service->transition($id, $request->user()->id, $operation));
    }

    public static function onlyFields(Request $request, array $allowed): void
    {
        $unknown = array_diff(array_keys($request->all()), $allowed);
        if ($unknown) {
            throw ValidationException::withMessages(array_fill_keys($unknown, 'This field is not accepted.'));
        }
    }
}
