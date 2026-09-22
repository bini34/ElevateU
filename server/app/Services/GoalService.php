<?php

namespace App\Services;

use App\Models\Goal;
use App\Repositories\GoalRepository;
use App\Support\GoalFields;
use Illuminate\Support\Facades\DB;

class GoalService
{
    public function __construct(private GoalRepository $goals) {}

    public function create(string $actor, array $data): Goal
    {
        validator($data, GoalFields::rules())->validate();
        GoalFields::validateMeasurement($data);
        $goal = new Goal($data);
        $goal->user_id = $actor;
        $goal->save();

        return $goal->refresh();
    }

    public function update(string $id, string $actor, array $data): Goal
    {
        return DB::transaction(function () use ($id, $actor, $data) {
            $goal = $this->goals->owned($id, $actor, true);
            self::assertActive($goal);
            if (array_key_exists('measurement_type', $data)) {
                throw \Illuminate\Validation\ValidationException::withMessages(['measurement_type' => 'Measurement type cannot be changed.']);
            }
            validator($data, GoalFields::rules(true))->validate();
            $goal->fill($data);
            GoalFields::validateMeasurement($goal->getAttributes());
            $goal->save();

            return $goal->refresh();
        }, 3);
    }

    public function transition(string $id, string $actor, string $operation): Goal
    {
        return DB::transaction(function () use ($id, $actor, $operation) {
            $goal = $this->goals->owned($id, $actor, true);
            $target = match ($operation) { 'complete' => 'completed', 'reopen' => 'active', 'archive' => 'archived' };
            if ($goal->status === $target) {
                return $goal;
            }
            abort_if($operation === 'complete' && $goal->status === 'archived', 409, 'Reopen an archived goal before completing it.');
            $goal->status = $target;
            if ($operation === 'complete') {
                $goal->completed_at = now();
            } elseif ($operation === 'archive') {
                $goal->archived_at = now();
            } else {
                $goal->completed_at = null;
                $goal->archived_at = null;
            }
            $goal->save();

            return $goal;
        }, 3);
    }

    public static function assertActive(Goal $goal): void
    {
        abort_unless($goal->status === 'active', 409, 'Reopen this goal before editing it or its milestones.');
    }
}
