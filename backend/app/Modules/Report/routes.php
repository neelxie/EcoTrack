<?php

use App\Modules\Report\Controllers\ReportController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:api')->group(function () {
    Route::get('stations/{station}/export/csv',   [ReportController::class, 'exportCsv']);
    Route::get('stations/{station}/export/excel', [ReportController::class, 'exportExcel']);
    Route::post('reports/summary',                [ReportController::class, 'summary']);
});