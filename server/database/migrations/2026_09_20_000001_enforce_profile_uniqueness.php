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
        Schema::table('profiles', fn (Blueprint $table) => $table->unique('user_id'));
        // InnoDB removes an implicit FK index. A prior rollback may have
        // restored an explicit one, which also becomes redundant here.
        if (Schema::getConnection()->getDriverName() === 'mysql' && Schema::hasIndex('profiles', 'profiles_user_id_foreign')) {
            Schema::table('profiles', fn (Blueprint $table) => $table->dropIndex('profiles_user_id_foreign'));
        }
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() === 'mysql'
            && ! Schema::hasIndex('profiles', 'profiles_user_id_foreign')) {
            Schema::table('profiles', fn (Blueprint $table) => $table->index('user_id', 'profiles_user_id_foreign'));
        }
        Schema::table('profiles', fn (Blueprint $table) => $table->dropUnique('profiles_user_id_unique'));
    }
};
