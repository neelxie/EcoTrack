<?php

use App\Modules\Reading\Controllers\ReadingController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:api')->group(function () {
    Route::get('stations/{station}/readings',         [ReadingController::class, 'index']);
    Route::post('stations/{station}/readings',        [ReadingController::class, 'store']);
    Route::get('stations/{station}/readings/summary', [ReadingController::class, 'summary']);
});