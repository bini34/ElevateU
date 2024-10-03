<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->longText('message')->nullable();
            $table->uuid('sender_id');
            $table->uuid('receiver_id')->nullable();
            $table->uuid('group_id')->nullable();
            $table->uuid('conversation_id')->nullable();
            $table->timestamps();

            // Foreign key constraints
            $table->foreign('sender_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('receiver_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('group_id')->references('id')->on('groups')->onDelete('set null');
            $table->foreign('conversation_id')->references('id')->on('conversations')->onDelete('set null');
        });

        // Modify the groups table to add the last_message_id column and foreign key
        Schema::table('groups', function (Blueprint $table) {
            $table->uuid('last_message_id')->nullable();
            $table->foreign('last_message_id')->references('id')->on('messages')->onDelete('set null');
        });

        // Modify the conversations table to add the last_message_id column and foreign key
        Schema::table('conversations', function (Blueprint $table) {
            $table->uuid('last_message_id')->nullable();
            $table->foreign('last_message_id')->references('id')->on('messages')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop foreign keys before dropping columns and tables
        Schema::table('groups', function (Blueprint $table) {
            $table->dropForeign(['last_message_id']);
            $table->dropColumn('last_message_id');
        });

        Schema::table('conversations', function (Blueprint $table) {
            $table->dropForeign(['last_message_id']);
            $table->dropColumn('last_message_id');
        });

        // Drop the messages table
        Schema::dropIfExists('messages');
    }
};
