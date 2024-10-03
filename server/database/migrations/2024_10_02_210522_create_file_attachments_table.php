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
        Schema::create('file_attachments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('message_id')->nullable();
            $table->uuid('posts_id')->nullable();
            $table->string('name', 255);
            $table->string('path', 1024);
            $table->string('mime', 255); // e.g., image/png
            $table->integer('nsize');
            $table->timestamps();

            // Foreign key constraints
            $table->foreign('message_id')->references('id')->on('messages')->onDelete('set null');
            $table->foreign('posts_id')->references('id')->on('posts')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('file_attachments');
    }
};
