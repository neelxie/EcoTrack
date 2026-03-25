<?php

namespace App\Modules\Station\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class StationResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'         => $this->id,
            'name'       => $this->name,
            'latitude'   => $this->latitude,
            'longitude'  => $this->longitude,
            'country'    => $this->country,
            'city'       => $this->city,
            'type'       => $this->type,
            'is_active'  => $this->is_active,
            'created_at' => $this->created_at,
        ];
    }
}