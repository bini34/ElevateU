<?php

use App\Services\Database\ConstraintReadiness;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        ConstraintReadiness::assertClean();
        Schema::table('group_users', fn (Blueprint $table) => $table->unique(['group_id', 'user_id']));
        if (Schema::getConnection()->getDriverName() === 'mysql' && Schema::hasIndex('group_users', 'group_users_group_id_foreign')) {
            Schema::table('group_users', fn (Blueprint $table) => $table->dropIndex('group_users_group_id_foreign'));
        }
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() === 'mysql'
            && ! Schema::hasIndex('group_users', 'group_users_group_id_foreign')) {
            Schema::table('group_users', fn (Blueprint $table) => $table->index('group_id', 'group_users_group_id_foreign'));
        }
        Schema::table('group_users', fn (Blueprint $table) => $table->dropUnique('group_users_group_id_user_id_unique'));
    }
};
