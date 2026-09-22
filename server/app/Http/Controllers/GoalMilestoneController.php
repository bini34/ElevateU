<?php

namespace App\Http\Controllers;

use App\Http\Requests\MilestoneWriteRequest;
use App\Repositories\GoalRepository;
use App\Services\GoalMilestoneService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GoalMilestoneController extends Controller
{
    use ApiResponse;

    public function __construct(private GoalMilestoneService $service, private GoalRepository $goals) {}

    public function index(Request $request, string $id): JsonResponse
    {
        GoalController::onlyFields($request, ['page', 'per_page']);
        $request->validate(['page' => 'sometimes|integer|min:1']);
        $goal = $this->goals->visible($request->user()->id)->findOrFail($id);

        return $this->successResponse($goal->milestones()->paginate($this->perPage($request, 10))->withQueryString());
    }

    public function store(MilestoneWriteRequest $request, string $id): JsonResponse
    {
        return $this->successResponse($this->service->create($id, $request->user()->id, $request->validated()), 'Milestone created.', 201);
    }

    public function update(MilestoneWriteRequest $request, string $id): JsonResponse
    {
        return $this->successResponse($this->service->mutate($id, $request->user()->id, 'update', $request->validated()));
    }

    public function transition(Request $request, string $id, string $operation): JsonResponse
    {
        GoalController::onlyFields($request, []);

        return $this->successResponse($this->service->mutate($id, $request->user()->id, $operation));
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        GoalController::onlyFields($request, []);
        $this->service->mutate($id, $request->user()->id, 'delete');

        return $this->successResponse(null, 'Milestone deleted.');
    }
}
