<?php

namespace App\Console\Commands;

use App\Services\Database\IntegrityPreflight;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class DatabasePreflight extends Command
{
    protected $signature = 'elevateu:db-preflight {--json : Machine-readable counts and safe IDs} {--sample=5 : Maximum samples per check, 0 through 20}';

    protected $description = 'Read-only integrity inventory; never repairs, deletes or rewrites rows';

    public function handle(IntegrityPreflight $preflight): int
    {
        $sample = filter_var($this->option('sample'), FILTER_VALIDATE_INT, ['options' => ['min_range' => 0, 'max_range' => 20]]);
        if ($sample === false) {
            $this->error('--sample must be an integer from 0 through 20.');

            return self::INVALID;
        }
        $db = DB::connection();
        if ($db->transactionLevel() === 0 && $db->getDriverName() === 'mysql') {
            $db->statement('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ, READ ONLY');
        }
        $db->beginTransaction();
        try {
            $report = $preflight->inspect($sample);
        } finally {
            $db->rollBack();
        }
        if ($this->option('json')) {
            $this->line(json_encode($report, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
        } else {
            $this->info('Read-only database preflight (sample identifiers only; counts may overlap).');
            $this->table(['Check', 'Severity', 'Count'], collect($report['checks'])->map(fn ($check, $name) => [$name, $check['severity'], $check['count']])->values()->all());
            foreach ($report['checks'] as $name => $check) {
                if ($check['count']) {
                    $this->line($name.': '.$check['meaning']);
                    $this->line(json_encode($check['samples'], JSON_THROW_ON_ERROR));
                }
            }
            $this->line($report['ok'] ? 'No blocking data violations found. This is not a schema guarantee.' : 'Blocking violations found. No data was changed. Review before migration.');
        }

        return $report['ok'] ? self::SUCCESS : self::FAILURE;
    }
}
