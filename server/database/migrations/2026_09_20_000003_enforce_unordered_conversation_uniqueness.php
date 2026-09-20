<?php

use App\Services\Database\ConstraintReadiness;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        ConstraintReadiness::assertClean();
        if (DB::getDriverName() === 'mysql') {
            // Virtual columns permit the existing cascading participant FKs.
            // One atomic ALTER; original participants, IDs and timestamps are untouched.
            DB::statement('ALTER TABLE conversations
                ADD participant_low CHAR(36) COLLATE utf8mb4_bin GENERATED ALWAYS AS (LEAST(LOWER(user_id1), LOWER(user_id2))) VIRTUAL,
                ADD participant_high CHAR(36) COLLATE utf8mb4_bin GENERATED ALWAYS AS (GREATEST(LOWER(user_id1), LOWER(user_id2))) VIRTUAL,
                ADD CONSTRAINT conversations_distinct_participants CHECK (participant_low < participant_high),
                ADD UNIQUE INDEX conversations_participants_unique (participant_low, participant_high)');
        } else {
            DB::statement('ALTER TABLE conversations ADD participant_low TEXT GENERATED ALWAYS AS
                (CASE WHEN LOWER(user_id1) < LOWER(user_id2) THEN LOWER(user_id1) ELSE LOWER(user_id2) END) VIRTUAL');
            DB::statement('ALTER TABLE conversations ADD participant_high TEXT GENERATED ALWAYS AS
                (CASE WHEN LOWER(user_id1) < LOWER(user_id2) THEN LOWER(user_id2) ELSE LOWER(user_id1) END) VIRTUAL
                CONSTRAINT conversations_distinct_participants CHECK (participant_low < participant_high)');
            DB::statement('CREATE UNIQUE INDEX conversations_participants_unique ON conversations (participant_low, participant_high)');
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE conversations DROP CHECK conversations_distinct_participants,
                DROP INDEX conversations_participants_unique, DROP COLUMN participant_high, DROP COLUMN participant_low');
        } else {
            DB::statement('DROP INDEX conversations_participants_unique');
            DB::statement('ALTER TABLE conversations DROP COLUMN participant_high');
            DB::statement('ALTER TABLE conversations DROP COLUMN participant_low');
        }
    }
};
