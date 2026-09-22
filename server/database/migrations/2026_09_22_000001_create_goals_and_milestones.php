<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Explicit CREATE DDL keeps the same named CHECKs on SQLite and MySQL.
        $mysql = DB::getDriverName() === 'mysql';
        $suffix = '';
        if ($mysql) {
            $charset = DB::connection()->getConfig('charset');
            $collation = DB::connection()->getConfig('collation');
            if (! preg_match('/\A[a-z0-9_]+\z/i', $charset) || ! preg_match('/\A[a-z0-9_]+\z/i', $collation)) {
                throw new RuntimeException('Invalid schema encoding configuration.');
            }
            $suffix = " ENGINE=InnoDB DEFAULT CHARACTER SET $charset COLLATE $collation";
        } elseif (DB::getDriverName() !== 'sqlite') {
            throw new RuntimeException('Goals require MySQL or SQLite.');
        }
        $length = $mysql ? 'CHAR_LENGTH' : 'LENGTH';
        DB::statement("CREATE TABLE goals (
            id CHAR(36) NOT NULL PRIMARY KEY,
            user_id CHAR(36) NOT NULL,
            title VARCHAR(160) NOT NULL,
            description TEXT NULL,
            visibility VARCHAR(16) NOT NULL DEFAULT 'private',
            status VARCHAR(16) NOT NULL DEFAULT 'active',
            measurement_type VARCHAR(16) NOT NULL,
            target_value DECIMAL(12,3) NULL,
            unit VARCHAR(32) NULL,
            target_date DATE NULL,
            completed_at DATETIME NULL,
            archived_at DATETIME NULL,
            created_at DATETIME NULL,
            updated_at DATETIME NULL,
            CONSTRAINT goals_owner_foreign FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
            CONSTRAINT goals_text_check CHECK ($length(TRIM(title)) BETWEEN 1 AND 160 AND (description IS NULL OR $length(description) <= 5000)),
            CONSTRAINT goals_visibility_check CHECK (visibility IN ('private','public')),
            CONSTRAINT goals_lifecycle_check CHECK (
                (status = 'active' AND completed_at IS NULL AND archived_at IS NULL) OR
                (status = 'completed' AND completed_at IS NOT NULL AND archived_at IS NULL) OR
                (status = 'archived' AND archived_at IS NOT NULL)),
            CONSTRAINT goals_measurement_check CHECK (
                (measurement_type IN ('boolean','milestone') AND target_value IS NULL AND unit IS NULL) OR
                (measurement_type IN ('count','duration') AND target_value IS NOT NULL AND target_value > 0
                 AND target_value <= 999999999.999 AND unit IS NOT NULL AND $length(TRIM(unit)) BETWEEN 1 AND 32
                 AND (measurement_type = 'count' OR unit = 'minutes')))
        )$suffix");
        DB::statement('CREATE INDEX goals_owner_status_created ON goals (user_id, status, created_at, id)');
        DB::statement('CREATE INDEX goals_owner_created ON goals (user_id, created_at, id)');
        DB::statement("CREATE TABLE goal_milestones (
            id CHAR(36) NOT NULL PRIMARY KEY,
            goal_id CHAR(36) NOT NULL,
            title VARCHAR(160) NOT NULL,
            position INTEGER NOT NULL,
            completed_at DATETIME NULL,
            created_at DATETIME NULL,
            updated_at DATETIME NULL,
            CONSTRAINT goal_milestones_parent_foreign FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE RESTRICT,
            CONSTRAINT goal_milestones_position_unique UNIQUE (goal_id, position),
            CONSTRAINT goal_milestones_position_check CHECK (position BETWEEN 1 AND 1000000),
            CONSTRAINT goal_milestones_title_check CHECK ($length(TRIM(title)) BETWEEN 1 AND 160)
        )$suffix");
    }

    public function down(): void
    {
        Schema::dropIfExists('goal_milestones');
        Schema::dropIfExists('goals');
    }
};
