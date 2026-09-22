<?php

namespace App\Services;

use App\Models\Goal;
use App\Models\GoalMilestone;
use App\Repositories\GoalRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class GoalMilestoneService
{
    public function __construct(private GoalRepository $goals) {}

    public function create(string $goalId, string $actor, array $data): GoalMilestone
    {
        return DB::transaction(function () use ($goalId, $actor, $data) {
            $goal = $this->goals->owned($goalId, $actor, true);
            GoalService::assertActive($goal);
            $position = (int) ($data['position'] ?? (GoalMilestone::where('goal_id', $goal->id)->orderByDesc('position')->lockForUpdate()->value('position') + 1));
            $this->checkPosition($goal, $position);

            return $goal->milestones()->create(['title' => $data['title'], 'position' => $position])->refresh();
        }, 3);
    }

    public function mutate(string $id, string $actor, string $operation, array $data = []): ?GoalMilestone
    {
        return DB::transaction(function () use ($id, $actor, $operation, $data) {
            $goalId = GoalMilestone::whereKey($id)->value('goal_id');
            abort_if($goalId === null, 404);
            $goal = $this->goals->owned($goalId, $actor, true);
            GoalService::assertActive($goal);
            $milestone = GoalMilestone::where('goal_id', $goal->id)->lockForUpdate()->findOrFail($id);
            if ($operation === 'delete') {
                $milestone->delete();
                return null;
            }
            if ($operation === 'update') {
                if (array_key_exists('position', $data)) {
                    $this->checkPosition($goal, (int) $data['position'], $id);
                }
                $milestone->fill($data);
            } elseif ($operation === 'complete' && $milestone->completed_at === null) {
                $milestone->completed_at = now();
            } elseif ($operation === 'reopen') {
                $milestone->completed_at = null;
            }
            if ($milestone->isDirty()) {
                $milestone->save();
            }

            return $milestone;
        }, 3);
    }

    private function checkPosition(Goal $goal, int $position, ?string $except = null): void
    {
        if ($position < 1 || $position > 1000000 || GoalMilestone::where('goal_id', $goal->id)->where('position', $position)
            ->when($except, fn ($query) => $query->where('id', '<>', $except))->lockForUpdate()->exists()) {
            throw ValidationException::withMessages(['position' => 'Use an unoccupied position from 1 through 1000000.']);
        }
    }
}
