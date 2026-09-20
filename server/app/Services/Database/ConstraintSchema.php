<?php

namespace App\Services\Database;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

final class ConstraintSchema
{
    /** Read-only metadata inspection, not an assumption based on migration history. */
    public static function guarantees(): array
    {
        $guarantees = [];
        foreach ([
            'profiles' => ['duplicate_profiles' => ['user_id']],
            'group_users' => ['duplicate_group_users' => ['group_id', 'user_id']],
            'conversations' => ['duplicate_conversation_pairs' => ['participant_low', 'participant_high']],
        ] as $table => $conditions) {
            $indexes = Schema::getIndexes($table);
            foreach ($conditions as $name => $columns) {
                $guarantees[$name] = collect($indexes)->contains(fn ($index) => $index['unique'] && $index['columns'] === $columns);
            }
        }
        $guarantees['duplicate_conversations'] = $guarantees['duplicate_conversation_pairs'];
        $guarantees['reversed_conversation_pairs'] = $guarantees['duplicate_conversation_pairs'];
        if (DB::getDriverName() === 'mysql') {
            $guarantees['self_conversations'] = DB::table('information_schema.TABLE_CONSTRAINTS')
                ->where('CONSTRAINT_SCHEMA', DB::connection()->getDatabaseName())->where('TABLE_NAME', 'conversations')
                ->where('CONSTRAINT_NAME', 'conversations_distinct_participants')->where('CONSTRAINT_TYPE', 'CHECK')->where('ENFORCED', 'YES')->exists();
        } else {
            $sql = DB::table('sqlite_master')->where('type', 'table')->where('name', 'conversations')->value('sql');
            $guarantees['self_conversations'] = str_contains($sql ?? '', 'conversations_distinct_participants');
        }

        return $guarantees;
    }
}
