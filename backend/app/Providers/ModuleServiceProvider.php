<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;

class ModuleServiceProvider extends ServiceProvider
{
    protected array $modules = [
        'Auth',
        'Station',
        'Reading',
        'Alert',
        'Report',
        'Ingest',
    ];

    public function boot(): void
    {
        foreach ($this->modules as $module) {
            $routeFile = app_path("Modules/{$module}/routes.php");
            if (file_exists($routeFile)) {
                Route::prefix('api')
                    ->middleware('api')
                    ->group($routeFile);
            }
        }
    }
}