<?php

namespace App\Support;

use Illuminate\Database\UniqueConstraintViolationException;

final class UniqueConflict
{
    /** Inspect driver diagnostics only, never the query/bindings in the exception message. */
    public static function matches(\Throwable $error, string $index, array $columns): bool
    {
        if (! $error instanceof UniqueConstraintViolationException) {
            return false;
        }
        $code = (int) ($error->errorInfo[1] ?? 0);
        $diagnostic = $error->errorInfo[2] ?? '';
        if ($code === 1062) {
            return preg_match("/for key ['`](?:[^'`]+\\.)?".preg_quote($index, '/')."['`]$/", $diagnostic) === 1;
        }

        return $code === 19 && $diagnostic === 'UNIQUE constraint failed: '.implode(', ', $columns);
    }
}
