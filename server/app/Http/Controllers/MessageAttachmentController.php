<?php

namespace App\Http\Controllers;

use App\Models\FileAttachment;
use App\Services\MessageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MessageAttachmentController extends Controller
{
    public function show(Request $request, string $id, MessageService $messages)
    {
        $attachment = FileAttachment::whereNotNull('message_id')->findOrFail($id);
        $messages->getMessageById($attachment->message_id, $request->user()->id);

        // Stored paths are data, never URLs or arbitrary filesystem paths.
        $path = $attachment->path;
        abort_unless(is_string($path) && preg_match('~\Auploads/messages/[a-f0-9-]+\.[a-z0-9]+\z~i', $path), 404);
        $disk = Storage::disk('message_attachments');

        // Compatibility for old rows. nginx blocks this public prefix; run
        // media:privatize-messages before serving with any other static server.
        if (! $disk->exists($path)) {
            $disk = Storage::disk('public');
        }
        abort_unless($disk->exists($path), 404);

        // Force a safe download; the client explicitly renders approved image
        // blobs. Never render an upload as an HTML/SVG document on the API origin.
        return $disk->download($path, basename($path), [
            'Content-Type' => 'application/octet-stream',
            'X-Content-Type-Options' => 'nosniff',
            'Content-Security-Policy' => "default-src 'none'; sandbox",
            'Cache-Control' => 'private, no-store, max-age=0',
            'Pragma' => 'no-cache',
        ]);
    }
}
