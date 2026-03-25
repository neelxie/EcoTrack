<?php

use App\Modules\Station\Controllers\StationController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:api')->group(function () {
    Route::apiResource('stations', StationController::class);
});