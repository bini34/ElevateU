<?php

namespace App\Support;

use Illuminate\Validation\ValidationException;

final class ConversationParticipants
{
    /** Canonical text UUIDs: lowercase ASCII, then byte order. */
    public static function ordered(string $first, string $second): array
    {
        foreach ([$first, $second] as $id) {
            if (! preg_match('/\A[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\z/i', $id)) {
                throw ValidationException::withMessages(['receiver_id' => 'A valid participant UUID is required.']);
            }
        }
        $ids = [strtolower($first), strtolower($second)];
        sort($ids, SORT_STRING);
        if ($ids[0] === $ids[1]) {
            throw ValidationException::withMessages(['receiver_id' => 'You cannot message yourself.']);
        }

        return $ids;
    }
}
