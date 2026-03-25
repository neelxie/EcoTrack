<?php

namespace App\Modules\Station\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Station\Models\Station;
use App\Modules\Station\Resources\StationResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class StationController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $stations = Station::query()
            ->when($request->search, fn($q, $s) => $q->where('name', 'like', "%{$s}%")
                ->orWhere('city', 'like', "%{$s}%")
                ->orWhere('country', 'like', "%{$s}%"))
            ->when($request->type, fn($q, $t) => $q->where('type', $t))
            ->when($request->active, fn($q) => $q->where('is_active', true))
            ->paginate(20);

        return StationResource::collection($stations);
    }

    public function store(Request $request): StationResource
    {
        $validated = $request->validate([
            'name'      => 'required|string|max:255',
            'latitude'  => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'country'   => 'required|string|max:100',
            'city'      => 'required|string|max:100',
            'type'      => 'required|in:air_quality,weather,emissions',
            'is_active' => 'boolean',
        ]);

        return new StationResource(Station::create($validated));
    }

    public function show(Station $station): StationResource
    {
        return new StationResource($station->load('readings'));
    }

    public function update(Request $request, Station $station): StationResource
    {
        $validated = $request->validate([
            'name'      => 'sometimes|string|max:255',
            'latitude'  => 'sometimes|numeric|between:-90,90',
            'longitude' => 'sometimes|numeric|between:-180,180',
            'country'   => 'sometimes|string|max:100',
            'city'      => 'sometimes|string|max:100',
            'type'      => 'sometimes|in:air_quality,weather,emissions',
            'is_active' => 'sometimes|boolean',
        ]);

        $station->update($validated);
        return new StationResource($station);
    }

    public function destroy(Station $station): JsonResponse
    {
        $station->delete();
        return response()->json(['message' => 'Station deleted.']);
    }
}