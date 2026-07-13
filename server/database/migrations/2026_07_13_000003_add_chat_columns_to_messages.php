<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * read_at powers read receipts; client_uuid makes sends idempotent so a
     * retried request can never create a duplicate message.
     */
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->timestamp('read_at')->nullable()->after('conversation_id');
            $table->uuid('client_uuid')->nullable()->after('read_at');

            $table->unique(['sender_id', 'client_uuid']);
            $table->index(['conversation_id', 'created_at']);
            $table->index(['group_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropUnique(['sender_id', 'client_uuid']);
            $table->dropIndex(['conversation_id', 'created_at']);
            $table->dropIndex(['group_id', 'created_at']);
            $table->dropColumn(['read_at', 'client_uuid']);
        });
    }
};
