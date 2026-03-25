<?php

namespace App\Modules\Reading\Models;

use Illuminate\Database\Eloquent\Model;
use App\Modules\Station\Models\Station;

class Reading extends Model
{
    protected $fillable = [
        'station_id',
        'metric',
        'value',
        'unit',
        'recorded_at',
        'source',
    ];

    protected function casts(): array
    {
        return [
            'value'       => 'float',
            'recorded_at' => 'datetime',
        ];
    }

    public function station()
    {
        return $this->belongsTo(Station::class);
    }
}