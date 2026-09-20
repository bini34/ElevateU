<?php

require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
set_exception_handler(function (Throwable $error): never {
    fwrite(STDERR, 'Query plan check failed: '.$error::class.' at '.basename($error->getFile()).':'.$error->getLine()."\n");
    exit(1);
});

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

if (! app()->environment('testing') || DB::getDriverName() !== 'mysql'
    || DB::connection()->getDatabaseName() !== 'elevateu_audit'
    || config('database.connections.mysql.host') !== 'mysql' || config('database.connections.mysql.url')) {
    throw new RuntimeException('Query plans require the disposable audit stack.');
}
$plans = [];
foreach ([
    ['profiles', ['user_id'], 'profiles_user_id_unique'],
    ['group_users', ['group_id', 'user_id'], 'group_users_group_id_user_id_unique'],
    ['conversations', ['participant_low', 'participant_high'], 'conversations_participants_unique'],
] as [$table, $columns, $expected]) {
    $row = DB::table($table)->first($columns);
    if (! $row) {
        throw new RuntimeException('Seed demo fixtures before checking plans.');
    }
    $query = DB::table($table)->where((array) $row)->limit(1);
    $plan = DB::selectOne('EXPLAIN '.$query->toSql(), $query->getBindings());
    if ($plan->key !== $expected || (int) $plan->rows > 1) {
        throw new RuntimeException('Unique lookup did not use its expected index.');
    }
    $indexes = Schema::getIndexes($table);
    foreach ($indexes as $index) {
        if (! $index['unique'] && array_slice($columns, 0, count($index['columns'])) === $index['columns']) {
            throw new RuntimeException('Redundant non-unique prefix index found.');
        }
    }
    $plans[$table] = ['key' => $plan->key, 'type' => $plan->type, 'estimated_rows' => $plan->rows,
        'indexes' => array_map(fn ($index) => ['name' => $index['name'], 'columns' => $index['columns'], 'unique' => $index['unique']], $indexes)];
}
echo json_encode($plans, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR)."\n";
