<?php

namespace Tests\Concerns;

use Laravel\Passport\Passport;

trait UsesPassportKeys
{
    protected function initializePassportKeys(): void
    {
        // Ephemeral test storage; never the HTTP stack's keys.
        $directory = storage_path('testing-passport');
        if (! is_dir($directory)) {
            mkdir($directory, 0700, true);
            $key = openssl_pkey_new(['private_key_bits' => 2048]);
            openssl_pkey_export($key, $private);
            file_put_contents($directory.'/oauth-private.key', $private);
            file_put_contents($directory.'/oauth-public.key', openssl_pkey_get_details($key)['key']);
            chmod($directory.'/oauth-private.key', 0600);
            chmod($directory.'/oauth-public.key', 0600);
        }
        Passport::loadKeysFrom($directory);
    }
}
