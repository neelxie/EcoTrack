<?php

namespace App\Modules\Alert\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Alert\Models\Alert;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AlertController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $alerts = Alert::with('station')
            ->where('user_id', $request->user()->id)
            ->get();

        return response()->json($alerts);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'station_id' => 'required|exists:stations,id',
            'metric'     => 'required|string|max:50',
            'operator'   => 'required|in:gt,lt,gte,lte,eq',
            'threshold'  => 'required|numeric',
            'is_active'  => 'boolean',
        ]);

        $alert = Alert::create([
            ...$validated,
            'user_id' => $request->user()->id,
        ]);

        return response()->json($alert->load('station'), 201);
    }

    public function update(Request $request, Alert $alert): JsonResponse
    {
        $this->authorize('update', $alert);
        $alert->update($request->validate([
            'metric'    => 'sometimes|string|max:50',
            'operator'  => 'sometimes|in:gt,lt,gte,lte,eq',
            'threshold' => 'sometimes|numeric',
            'is_active' => 'sometimes|boolean',
        ]));

        return response()->json($alert);
    }

    public function destroy(Alert $alert): JsonResponse
    {
        $this->authorize('delete', $alert);
        $alert->delete();
        return response()->json(['message' => 'Alert deleted.']);
    }

    public function stream(Request $request): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        return response()->stream(function () use ($request) {
            $userId = $request->user()->id;
            $sent   = 0;

            while (true) {
                $triggered = Alert::with('station')
                    ->where('user_id', $userId)
                    ->where('is_active', true)
                    ->whereNotNull('last_triggered_at')
                    ->where('last_triggered_at', '>=', now()->subMinutes(1))
                    ->get();

                if ($triggered->isNotEmpty()) {
                    echo "data: " . $triggered->toJson() . "\n\n";
                    ob_flush();
                    flush();
                }

                if (++$sent >= 60 || connection_aborted()) break;
                sleep(5);
            }
        }, 200, [
            'Content-Type'      => 'text/event-stream',
            'Cache-Control'     => 'no-cache',
            'X-Accel-Buffering' => 'no',
        ]);
    }
}