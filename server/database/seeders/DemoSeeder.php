<?php

namespace Database\Seeders;

use Database\Factories\FileAttachmentFactory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $db = DB::connection();
        $allowedDatabase = in_array($db->getDatabaseName(), ['elevateu_demo', 'elevateu_audit'], true)
            || (app()->environment('testing') && $db->getDriverName() === 'sqlite' && $db->getDatabaseName() === ':memory:');
        if (! app()->environment(['local', 'testing']) || ! config('demo.enabled') || ! $allowedDatabase) {
            throw new \RuntimeException('Demo seeding requires explicit enablement in local/testing and an isolated elevateu_demo/elevateu_audit database.');
        }
        $password = config('demo.password');
        if (! is_string($password) || strlen($password) < 12 || strlen($password) > 72) {
            throw new \RuntimeException('Set ELEVATEU_DEMO_PASSWORD to 12 through 72 bytes. No default credential is supplied.');
        }
        $rows = DemoDataset::rows(Hash::make($password));
        $newFiles = [];
        try {
            $db->transaction(function () use ($rows, &$newFiles): void {
                foreach ($rows['users'] as $row) {
                    if (DB::table('users')->where('id', '<>', $row['id'])->where(function ($q) use ($row) {
                        $q->where('email', $row['email'])->orWhere('user_name', $row['user_name']);
                    })->exists()) {
                        throw new \RuntimeException('Demo identity collides with an existing account. Nothing was replaced.');
                    }
                }
                foreach ($rows as $table => $records) {
                    foreach ($records as $row) {
                        $key = $table === 'group_users' ? array_intersect_key($row, array_flip(['group_id', 'user_id'])) : ['id' => $row['id']];
                        $existing = DB::table($table)->where($key)->first();
                        if ($existing) {
                            // Never commandeer a record whose identity/ownership differs.
                            foreach (['email', 'user_name', 'user_id', 'owner_id', 'user_id1', 'user_id2', 'sender_id', 'receiver_id', 'group_id', 'conversation_id', 'post_id', 'message_id', 'notifiable_id', 'path'] as $field) {
                                if (array_key_exists($field, $row) && $row[$field] !== $existing->$field) {
                                    throw new \RuntimeException('Demo identifier collision in '.$table.'. No existing row was overwritten.');
                                }
                            }
                        } else {
                            if ($table === 'profiles' && DB::table('profiles')->where('user_id', $row['user_id'])->exists()) {
                                throw new \RuntimeException('Demo user already has a different profile; review rather than duplicate it.');
                            }
                            if ($table === 'conversations' && DB::table('conversations')->where(function ($q) use ($row) {
                                $q->where(['user_id1' => $row['user_id1'], 'user_id2' => $row['user_id2']])
                                    ->orWhere(['user_id1' => $row['user_id2'], 'user_id2' => $row['user_id1']]);
                            })->exists()) {
                                throw new \RuntimeException('Demo participant pair already has a different conversation; review rather than duplicate it.');
                            }
                            DB::table($table)->insert($row);
                        }
                    }
                }
                foreach ($rows['file_attachments'] as $file) {
                    $diskName = $file['message_id'] ? 'message_attachments' : 'public';
                    $disk = Storage::disk($diskName);
                    $bytes = base64_decode(FileAttachmentFactory::PNG);
                    if ($disk->exists($file['path'])) {
                        if (! hash_equals(hash('sha256', $bytes), hash('sha256', $disk->get($file['path'])))) {
                            throw new \RuntimeException('Existing demo file differs; refusing to overwrite it.');
                        }
                    } else {
                        if (! $disk->put($file['path'], $bytes)) {
                            throw new \RuntimeException('Could not store demo fixture image.');
                        }
                        $newFiles[] = [$diskName, $file['path']];
                    }
                }
                foreach (['conversations' => 'conversation_id', 'groups' => 'group_id'] as $table => $target) {
                    foreach ($rows[$table] as $thread) {
                        $last = DB::table('messages')->where($target, $thread['id'])->orderByDesc('created_at')->orderByDesc('id')->value('id');
                        DB::table($table)->where('id', $thread['id'])->whereNull('last_message_id')->update(['last_message_id' => $last]);
                    }
                }
            });
        } catch (\Throwable $exception) {
            foreach ($newFiles as [$disk, $path]) {
                if (! Storage::disk($disk)->delete($path)) {
                    report(new \RuntimeException('Could not remove a rolled-back demo fixture file.'));
                }
            }
            throw $exception;
        }
        $this->command?->info('Demo fixtures present. Existing content and passwords were preserved; no notifications were sent.');
    }
}
