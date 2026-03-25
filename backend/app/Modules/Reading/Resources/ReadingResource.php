<?php

namespace App\Modules\Reading\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ReadingResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'          => $this->id,
            'station_id'  => $this->station_id,
            'metric'      => $this->metric,
            'value'       => $this->value,
            'unit'        => $this->unit,
            'recorded_at' => $this->recorded_at->toISOString(),
            'source'      => $this->source,
        ];
    }
}