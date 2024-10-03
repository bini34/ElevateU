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
        Schema::create('profiles', function (Blueprint $table) {
            $table->uuid('id')->primary(); // Use UUID for the profile ID
            $table->uuid('user_id'); // Foreign key (UUID)
            $table->string('first_name');
            $table->string('last_name');
            $table->string('bio')->nullable(); // Nullable to handle empty bios
            $table->string('profile_picture_URL')->nullable(); // Nullable if no picture
            $table->string('location')->nullable(); // Nullable if no location
            $table->date('birthdate')->nullable(); // Nullable for birthdate
            $table->timestamps();

            // Foreign key constraint for user_id
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('profiles');
    }
};
