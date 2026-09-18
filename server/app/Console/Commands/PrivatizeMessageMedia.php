<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class PrivatizeMessageMedia extends Command
{
    protected $signature = 'media:privatize-messages {--apply : Copy, verify, then remove legacy public copies}';

    protected $description = 'Inventory or safely move legacy message uploads to private storage (no database changes)';

    public function handle(): int
    {
        $public = Storage::disk('public');
        $private = Storage::disk('message_attachments');
        $files = $public->allFiles('uploads/messages');
        $this->info(count($files).' legacy message file(s) found.');
        if (! $this->option('apply')) {
            $this->comment('Dry run. Back up storage, block the public URL prefix, then use --apply.');

            return self::SUCCESS;
        }

        foreach ($files as $path) {
            if (! preg_match('~\Auploads/messages/[a-f0-9-]+\.[a-z0-9]+\z~i', $path)) {
                $this->error('Unexpected legacy path; stopping without deleting that file. Review the storage inventory.');

                return self::FAILURE;
            }
            if (! $private->exists($path)) {
                $stream = $public->readStream($path);
                if (! is_resource($stream)) {
                    throw new \RuntimeException('Could not read legacy message file.');
                }
                try {
                    $private->put($path, $stream);
                } finally {
                    fclose($stream);
                }
            }
            // The configured disks are local. A conflict never overwrites or
            // deletes the source. Verified copies make the command restartable.
            $sourceHash = hash_file('sha256', $public->path($path));
            $targetHash = hash_file('sha256', $private->path($path));
            if ($sourceHash === false || $targetHash === false || ! hash_equals($sourceHash, $targetHash)) {
                $this->error('A private copy differs from its public source. No source deleted for that file.');

                return self::FAILURE;
            }
            if (! $public->delete($path)) {
                throw new \RuntimeException('Could not remove a verified public message copy. Keep public serving blocked.');
            }
        }
        $this->info('Legacy files moved and verified; database paths are unchanged.');

        return self::SUCCESS;
    }
}
