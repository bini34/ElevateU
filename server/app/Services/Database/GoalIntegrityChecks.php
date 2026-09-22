<?php

namespace App\Services\Database;

use Illuminate\Database\Connection;

/** Optional until the additive Goal migration is installed. No content projection. */
final class GoalIntegrityChecks
{
    public static function queries(Connection $db): array
    {
        $checks = [];
        foreach (['goals' => ['user_id', 'users'], 'goal_milestones' => ['goal_id', 'goals']] as $table => [$column, $parent]) {
            if (! $db->getSchemaBuilder()->hasTable($table)) {
                continue;
            }
            $checks['orphan_'.$table] = ['query' => $db->table($table.' as r')->select('r.id')->whereNotExists(fn ($query) => $query->selectRaw('1')->from($parent.' as p')->whereColumn('p.id', 'r.'.$column)),
                'meaning' => 'Required goal ownership/parent reference is missing.', 'severity' => 'blocking'];
        }
        if ($db->getSchemaBuilder()->hasTable('goals')) {
            $checks['invalid_goal_measurement'] = ['query' => $db->table('goals')->select('id')->whereRaw("NOT (
                (measurement_type IN ('boolean','milestone') AND target_value IS NULL AND unit IS NULL) OR
                (measurement_type IN ('count','duration') AND target_value IS NOT NULL AND target_value > 0 AND target_value <= 999999999.999
                AND unit IS NOT NULL AND TRIM(unit) <> '' AND (measurement_type = 'count' OR unit = 'minutes')))") ,
                'meaning' => 'Goal measurement and target/unit do not agree.', 'severity' => 'blocking'];
        }
        if ($db->getSchemaBuilder()->hasTable('goal_milestones')) {
            $checks['duplicate_milestone_positions'] = ['query' => $db->table('goal_milestones')->select('goal_id')->selectRaw('COUNT(*) as copies')->groupBy('goal_id', 'position')->havingRaw('COUNT(*) > 1'),
                'meaning' => 'More than one milestone occupies a goal position.', 'severity' => 'blocking'];
        }

        return $checks;
    }
}
