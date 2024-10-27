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
        // Create the 'groups' table
        Schema::create('groups', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->longText('description')->nullable();
            $table->string('profile_picture')->nullable();
            $table->uuid('owner_id');
            $table->timestamps();

            // Foreign key constraint for owner_id
            $table->foreign('owner_id')->references('id')->on('users')->onDelete('cascade');
        });

        // Create the 'group_users' table
        Schema::create('group_users', function (Blueprint $table) {
            $table->uuid('group_id');
            $table->uuid('user_id');
            $table->timestamps();

            // Foreign key constraints
            $table->foreign('group_id')->references('id')->on('groups')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('group_users');
        Schema::dropIfExists('groups');
    }
};
