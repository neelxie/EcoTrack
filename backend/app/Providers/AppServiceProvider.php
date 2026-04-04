<?php

namespace App\Providers;

use App\Modules\Alert\Models\Alert;
use App\Policies\AlertPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider;

class AppServiceProvider extends AuthServiceProvider
{
    protected $policies = [
        Alert::class => AlertPolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();
    }
}