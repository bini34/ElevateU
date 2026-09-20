<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\UniqueConstraintViolationException;

final class UniqueResource
{
    public static function resolve(Builder $lookup, array $attributes, string $index, array $columns): Model
    {
        if ($existing = (clone $lookup)->first()) {
            return $existing;
        }
        try {
            // A savepoint keeps an outer message/registration transaction usable.
            return $lookup->withSavepointIfNeeded(fn () => $lookup->getModel()->newQuery()->create($attributes));
        } catch (UniqueConstraintViolationException $error) {
            if (! UniqueConflict::matches($error, $index, $columns)) {
                throw $error;
            }

            // InnoDB REPEATABLE READ may retain the earlier empty snapshot.
            // A current read sees the committed winner, including in outer transactions.
            return (clone $lookup)->useWritePdo()->lockForUpdate()->first() ?? throw $error;
        }
    }
}
