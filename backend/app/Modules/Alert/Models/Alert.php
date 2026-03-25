<?php

namespace App\Modules\Alert\Models;

use Illuminate\Database\Eloquent\Model;
use App\Modules\Station\Models\Station;
use App\Models\User;

class Alert extends Model
{
    protected $fillable = [
        'user_id',
        'station_id',
        'metric',
        'operator',
        'threshold',
        'is_active',
        'last_triggered_at',
    ];

    protected function casts(): array
    {
        return [
            'threshold'          => 'float',
            'is_active'          => 'boolean',
            'last_triggered_at'  => 'datetime',
        ];
    }

    public function station() { return $this->belongsTo(Station::class); }
    public function user()    { return $this->belongsTo(User::class); }
}