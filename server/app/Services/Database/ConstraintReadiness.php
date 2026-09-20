<?php

namespace App\Services\Database;

use Illuminate\Support\Facades\DB;

/** Data gate shared by the three September 2026 migrations; never repairs data. */
final class ConstraintReadiness
{
    public const CHECKS = [
        'duplicate_profiles', 'duplicate_group_users', 'duplicate_conversation_pairs',
        'self_conversations', 'null_conversation_participants', 'malformed_conversation_participants',
    ];

    public static function assertClean(): void
    {
        $queries = (new IntegrityChecks(DB::connection()))->queries();
        $failures = [];
        foreach (self::CHECKS as $name) {
            if (DB::query()->fromSub($queries[$name]['query'], 'violations')->exists()) {
                $failures[] = $name;
            }
        }
        if ($failures) {
            throw new \RuntimeException('Constraint migration refused: '.implode(', ', $failures)
                .'. Stop writers; run php artisan elevateu:db-preflight; follow docs/DATABASE.md remediation. No rows were repaired or removed.');
        }
    }
}
