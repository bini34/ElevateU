<?php

namespace Database\Factories;

use App\Models\FileAttachment;
use App\Models\Message;
use App\Models\Post;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FileAttachmentFactory extends Factory
{
    // A complete synthetic 1x1 PNG, not a nonexistent remote fixture URL.
    public const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADElEQVQImWPwLo4HAAIqAR4X2/UlAAAAAElFTkSuQmCC';

    public function definition(): array
    {
        return [
            'post_id' => Post::factory(), 'message_id' => null,
            'name' => 'practice.png', 'mime' => 'image/png',
            'size' => strlen(base64_decode(self::PNG)),
            'path' => fn (array $attributes) => 'uploads/'.($attributes['message_id'] ? 'messages' : 'posts').'/'.Str::uuid().'.png',
        ];
    }

    public function forMessage(Message $message): static
    {
        return $this->state(fn () => ['post_id' => null, 'message_id' => $message->id]);
    }

    public function configure(): static
    {
        return $this->afterMaking(function (FileAttachment $attachment): void {
            if (($attachment->post_id === null) === ($attachment->message_id === null)) {
                throw new \InvalidArgumentException('Attachment requires exactly one owner.');
            }
        })->afterCreating(function (FileAttachment $attachment): void {
            $disk = Storage::disk($attachment->message_id ? 'message_attachments' : 'public');
            if (! $disk->put($attachment->path, base64_decode(self::PNG))) {
                throw new \RuntimeException('Could not write fixture image.');
            }
        });
    }
}
