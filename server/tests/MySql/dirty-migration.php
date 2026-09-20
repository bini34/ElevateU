<?php

// This intentionally leaves invalid rows for inspection; discard the owned stack afterwards.
require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
set_exception_handler(function (Throwable $error): never {
    fwrite(STDERR, 'Dirty migration check failed: '.$error::class.' at '.basename($error->getFile()).':'.$error->getLine()."\n");
    exit(1);
});

use App\Services\Database\IntegrityPreflight;
use Database\Seeders\DemoDataset;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

if (! app()->environment('testing') || DB::getDriverName() !== 'mysql'
    || DB::connection()->getDatabaseName() !== 'elevateu_audit'
    || config('database.connections.mysql.host') !== 'mysql' || config('database.connections.mysql.url')
    || getenv('ELEVATEU_DIRTY_REHEARSAL') !== '1') {
    throw new RuntimeException('Requires the explicitly opted-in disposable dirty rehearsal stack.');
}
$names = DB::table('migrations')->orderByDesc('id')->limit(3)->pluck('migration');
if ($names->count() !== 3 || $names->contains(fn ($name) => ! str_starts_with($name, '2026_09_20_'))) {
    throw new RuntimeException('Refusing to roll back migrations outside the three Day 5 constraints.');
}
Artisan::call('migrate:rollback', ['--step' => 3, '--force' => true]);
$profile = (array) DB::table('profiles')->where('user_id', DemoDataset::id('user', 1))->first();
$profile['id'] = (string) Str::uuid();
DB::table('profiles')->insert($profile);
$membership = (array) DB::table('group_users')->first();
DB::table('group_users')->insert($membership);
$conversation = (array) DB::table('conversations')->where('id', DemoDataset::id('conversation', 1))->first();
$conversation['id'] = (string) Str::uuid();
[$conversation['user_id1'], $conversation['user_id2']] = [$conversation['user_id2'], $conversation['user_id1']];
DB::table('conversations')->insert($conversation);

function fingerprint(): array
{
    $result = [];
    foreach (Schema::getTables() as $table) {
        $name = $table['name'];
        $rows = DB::table($name)->get()->map(function ($row) {
            $values = (array) $row;
            ksort($values);

            return json_encode($values, JSON_THROW_ON_ERROR);
        })->sort()->values()->all();
        $result[$name] = [count($rows), hash('sha256', implode("\n", $rows)), Schema::getIndexes($name)];
    }

    return $result;
}
$before = fingerprint();
$report = app(IntegrityPreflight::class)->inspect(2);
foreach (['duplicate_profiles', 'duplicate_group_users', 'duplicate_conversation_pairs', 'reversed_conversation_pairs',
    'messages_in_duplicate_conversations', 'last_messages_in_duplicate_conversations'] as $name) {
    if ($report['checks'][$name]['count'] < 1) {
        throw new RuntimeException('Preflight missed '.$name);
    }
}
if (Artisan::call('elevateu:db-preflight', ['--json' => true, '--sample' => 0]) !== 1 || $report['constraint_migration_safe']) {
    throw new RuntimeException('Dirty preflight must exit unsuccessfully.');
}
try {
    Artisan::call('migrate', ['--force' => true]);
    throw new RuntimeException('Dirty migration unexpectedly succeeded.');
} catch (RuntimeException $error) {
    if (! str_starts_with($error->getMessage(), 'Constraint migration refused:')) {
        throw $error;
    }
}
if ($before !== fingerprint()) {
    throw new RuntimeException('Dirty migration changed data or indexes.');
}
echo "PASS: duplicate profiles, memberships, reversed conversations and affected message/pointer IDs detected.\n";
echo "PASS: preflight failed; migration refused before DDL; all 24 table counts, hashes and indexes unchanged.\n";
echo "Invalid fixtures retained only in this disposable rehearsal; no automatic remediation occurred.\n";
