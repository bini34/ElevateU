<?php

namespace App\Services\Database;

use Illuminate\Support\Facades\DB;

final class IntegrityPreflight
{
    public function inspect(int $sampleLimit = 5): array
    {
        if ($sampleLimit < 0 || $sampleLimit > 20) {
            throw new \InvalidArgumentException('Sample limit must be between 0 and 20.');
        }
        $db = DB::connection();
        $checks = [];
        $blocking = 0;
        foreach ((new IntegrityChecks($db))->queries() as $name => $definition) {
            $query = $definition['query'];
            $count = $db->query()->fromSub(clone $query, 'integrity_rows')->count();
            $samples = [];
            if ($count && $sampleLimit) {
                foreach ((clone $query)->limit($sampleLimit)->get() as $row) {
                    // Only UUID identifiers / counts survive output projection.
                    $samples[] = collect((array) $row)->map(fn ($value, $key) => $key === 'copies' ? (int) $value :
                        (is_string($value) && preg_match('/\A[0-9a-f-]{36}\z/i', $value) ? $value : '[redacted]')
                    )->all();
                }
            }
            $checks[$name] = ['count' => $count, 'samples' => $samples, 'severity' => $definition['severity'], 'meaning' => $definition['meaning']];
            if ($count && $definition['severity'] === 'blocking') {
                $blocking++;
            }
        }

        return ['ok' => $blocking === 0, 'blocking_checks' => $blocking, 'checks' => $checks];
    }
}
