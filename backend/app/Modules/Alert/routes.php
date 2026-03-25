<?php

use App\Modules\Alert\Controllers\AlertController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:api')->group(function () {
    Route::get('alerts',         [AlertController::class, 'index']);
    Route::post('alerts',        [AlertController::class, 'store']);
    Route::put('alerts/{alert}', [AlertController::class, 'update']);
    Route::delete('alerts/{alert}', [AlertController::class, 'destroy']);
    Route::get('alerts/stream',  [AlertController::class, 'stream']);
});