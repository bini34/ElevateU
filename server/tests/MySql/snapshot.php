<?php

// Synthetic-rehearsal verification only. Outputs counts/hashes, never row data.
require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
set_exception_handler(function (Throwable $error): never {
    fwrite(STDERR, 'Snapshot failed: '.$error::class.' at '.basename($error->getFile()).':'.$error->getLine()."\n");
    exit(1);
});

use App\Services\Database\IntegrityPreflight;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

if (! app()->environment('testing') || DB::getDriverName() !== 'mysql'
    || DB::connection()->getDatabaseName() !== 'elevateu_audit'
    || config('database.connections.mysql.host') !== 'mysql'
    || config('database.connections.mysql.url')) {
    throw new RuntimeException('Snapshots require the isolated MySQL audit stack.');
}
$db = DB::connection();
$db->statement('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ, READ ONLY');
$db->beginTransaction();
try {
    $tables = [];
    foreach (Schema::getTables() as $table) {
        $name = $table['name'];
        if ($db->table($name)->count() > 10000) {
            throw new RuntimeException('Snapshot is bounded to synthetic fixtures, not large or real datasets.');
        }
        $records = $db->table($name)->get();
        $rows = $records->map(function ($row) {
            $values = (array) $row;
            ksort($values);

            return json_encode($values, JSON_THROW_ON_ERROR);
        })->sort()->values()->all();
        $tables[$name] = ['count' => count($rows), 'sha256' => hash('sha256', implode("\n", $rows))];
        // Compare all pre-Day-5 columns separately when rehearsing the three new migrations.
        $originalRows = $records->map(function ($row) use ($name) {
            $values = (array) $row;
            if ($name === 'conversations') {
                unset($values['participant_low'], $values['participant_high']);
            }
            ksort($values);

            return json_encode($values, JSON_THROW_ON_ERROR);
        })->sort()->values()->all();
        $tables[$name]['original_sha256'] = hash('sha256', implode("\n", $originalRows));
    }
    ksort($tables);
    $files = [];
    foreach ($db->table('file_attachments')->orderBy('id')->get(['id', 'message_id', 'path', 'size']) as $file) {
        if (! preg_match('~\Auploads/(posts|messages)/[a-f0-9-]+\.png\z~', $file->path)) {
            throw new RuntimeException('Unexpected synthetic fixture path.');
        }
        $disk = Storage::disk($file->message_id ? 'message_attachments' : 'public');
        if (! $disk->exists($file->path)) {
            throw new RuntimeException('Synthetic attachment file is missing.');
        }
        $bytes = $disk->get($file->path);
        if (strlen($bytes) !== (int) $file->size) {
            throw new RuntimeException('Synthetic attachment is invalid or its size differs from metadata.');
        }
        // Demo assets must fully decode. HTTP regression fixtures also include
        // intentionally minimal image bytes: prove exact backup/restore bytes,
        // without claiming those fixtures demonstrate image decoder safety.
        $demoIds = array_column(\Database\Seeders\DemoDataset::rows('unused')['file_attachments'], 'id');
        if (in_array($file->id, $demoIds, true)) {
            $decoded = imagecreatefromstring($bytes);
            if ($decoded === false) {
                throw new RuntimeException('Demo attachment failed full image decoding.');
            }
            imagedestroy($decoded);
        }
        $files[$file->id] = ['exists' => true, 'sha256' => hash('sha256', $bytes)];
    }
    $preflight = app(IntegrityPreflight::class)->inspect(0);
    echo json_encode([
        'mysql' => DB::selectOne('SELECT VERSION() AS version')->version,
        'connection' => (array) DB::selectOne('SELECT @@session.sql_mode AS sql_mode, @@character_set_connection AS charset, @@collation_connection AS collation'),
        'tables' => $tables, 'files' => $files, 'preflight_ok' => $preflight['ok'],
    ], JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR)."\n";
} finally {
    $db->rollBack();
}
exit($preflight['ok'] ? 0 : 1);
