<?php

namespace App\Modules\Reading\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Reading\Models\Reading;
use App\Modules\Reading\Resources\ReadingResource;
use App\Modules\Station\Models\Station;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ReadingController extends Controller
{
    public function index(Request $request, Station $station): AnonymousResourceCollection
    {
        $readings = Reading::query()
            ->where('station_id', $station->id)
            ->when($request->metric, fn($q, $m) => $q->where('metric', $m))
            ->when($request->from,   fn($q, $f) => $q->where('recorded_at', '>=', $f))
            ->when($request->to,     fn($q, $t) => $q->where('recorded_at', '<=', $t))
            ->orderBy('recorded_at', 'desc')
            ->paginate(100);

        return ReadingResource::collection($readings);
    }

    public function store(Request $request, Station $station): ReadingResource
    {
        $validated = $request->validate([
            'metric'      => 'required|string|max:50',
            'value'       => 'required|numeric',
            'unit'        => 'required|string|max:20',
            'recorded_at' => 'required|date',
            'source'      => 'nullable|string|max:100',
        ]);

        $reading = $station->readings()->create($validated);
        return new ReadingResource($reading);
    }

    public function summary(Request $request, Station $station): \Illuminate\Http\JsonResponse
    {
        $from = $request->from ?? now()->subDays(7);
        $to   = $request->to   ?? now();

        $summary = Reading::query()
            ->where('station_id', $station->id)
            ->whereBetween('recorded_at', [$from, $to])
            ->selectRaw('metric, unit, AVG(value) as avg, MIN(value) as min, MAX(value) as max, COUNT(*) as count')
            ->groupBy('metric', 'unit')
            ->get();

        return response()->json($summary);
    }
}