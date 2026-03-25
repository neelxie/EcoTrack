<?php

use App\Modules\Ingest\Jobs\IngestOpenAQJob;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:api'])->group(function () {
    Route::post('ingest/trigger', function () {
        IngestOpenAQJob::dispatch();
        return response()->json(['message' => 'Ingest job dispatched.']);
    });
});