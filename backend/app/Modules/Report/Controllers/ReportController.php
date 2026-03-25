<?php

namespace App\Modules\Report\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Reading\Models\Reading;
use App\Modules\Station\Models\Station;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Maatwebsite\Excel\Facades\Excel;
use App\Modules\Report\Exports\ReadingsExport;

class ReportController extends Controller
{
    public function exportCsv(Request $request, Station $station)
    {
        $validated = $request->validate([
            'from'   => 'required|date',
            'to'     => 'required|date',
            'metric' => 'nullable|string',
        ]);

        return Excel::download(
            new ReadingsExport($station->id, $validated['from'], $validated['to'], $validated['metric'] ?? null),
            "ecotrack-{$station->name}-report.csv",
            \Maatwebsite\Excel\Excel::CSV,
            ['Content-Type' => 'text/csv']
        );
    }

    public function exportExcel(Request $request, Station $station)
    {
        $validated = $request->validate([
            'from'   => 'required|date',
            'to'     => 'required|date',
            'metric' => 'nullable|string',
        ]);

        return Excel::download(
            new ReadingsExport($station->id, $validated['from'], $validated['to'], $validated['metric'] ?? null),
            "ecotrack-{$station->name}-report.xlsx"
        );
    }

    public function summary(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'station_ids' => 'required|array',
            'from'        => 'required|date',
            'to'          => 'required|date',
            'metric'      => 'nullable|string',
        ]);

        $data = Reading::query()
            ->whereIn('station_id', $validated['station_ids'])
            ->whereBetween('recorded_at', [$validated['from'], $validated['to']])
            ->when($validated['metric'] ?? null, fn($q, $m) => $q->where('metric', $m))
            ->selectRaw('station_id, metric, unit, DATE(recorded_at) as date,
                         AVG(value) as avg, MIN(value) as min, MAX(value) as max')
            ->groupBy('station_id', 'metric', 'unit', 'date')
            ->orderBy('date')
            ->get();

        return response()->json($data);
    }
}