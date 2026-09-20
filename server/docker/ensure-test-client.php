<?php

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

if (! app()->environment('testing') || DB::connection()->getDatabaseName() !== 'elevateu_audit'
    || DB::getDriverName() !== 'mysql' || config('database.connections.mysql.host') !== 'mysql'
    || config('database.connections.mysql.url')) {
    throw new RuntimeException('Client provisioning is restricted to the isolated audit database.');
}
$exists = DB::table('oauth_personal_access_clients as p')->join('oauth_clients as c', 'c.id', '=', 'p.client_id')
    ->where('c.personal_access_client', true)->where('c.revoked', false)->exists();
if (! $exists && Artisan::call('passport:client', ['--personal' => true, '--name' => 'ElevateU integration tests', '--no-interaction' => true]) !== 0) {
    throw new RuntimeException('Test personal client provisioning failed.');
}
echo "Test personal client ready (credentials not printed).\n";
