<?php

namespace App\Repositories;

use App\Models\Goal;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class GoalRepository
{
    public function visible(string $actor): Builder
    {
        return Goal::query()->where(fn ($query) => $query->where('user_id', $actor)->orWhere('visibility', 'public'));
    }

    public function owned(string $id, string $actor, bool $lock = false): Goal
    {
        return Goal::query()->where('user_id', $actor)->when($lock, fn ($query) => $query->lockForUpdate())->findOrFail($id);
    }

    public function listing(string $actor, array $filters, int $perPage): LengthAwarePaginator
    {
        return Goal::query()->where('user_id', $actor)
            ->when(isset($filters['status']), fn ($query) => $query->where('status', $filters['status']), fn ($query) => $query->where('status', '<>', 'archived'))
            ->when(isset($filters['visibility']), fn ($query) => $query->where('visibility', $filters['visibility']))
            ->orderByDesc('created_at')->orderByDesc('id')->paginate($perPage)->withQueryString();
    }
}
