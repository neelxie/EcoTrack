<?php

namespace App\Modules\Ingest\Jobs;

use App\Modules\Reading\Models\Reading;
use App\Modules\Station\Models\Station;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class IngestOpenAQJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable;

    public function handle(): void
    {
        $stations = Station::where('type', 'air_quality')->where('is_active', true)->get();

        foreach ($stations as $station) {
            try {
                $response = Http::timeout(10)->get('https://api.openaq.org/v2/latest', [
                    'coordinates' => "{$station->latitude},{$station->longitude}",
                    'radius'      => 10000,
                    'limit'       => 10,
                ]);

                if (!$response->ok()) continue;

                $results = $response->json('results', []);

                foreach ($results as $result) {
                    foreach ($result['measurements'] ?? [] as $m) {
                        Reading::updateOrCreate(
                            [
                                'station_id'  => $station->id,
                                'metric'      => $m['parameter'],
                                'recorded_at' => $m['lastUpdated'],
                            ],
                            [
                                'value'  => $m['value'],
                                'unit'   => $m['unit'],
                                'source' => 'openaq',
                            ]
                        );
                    }
                }
            } catch (\Throwable $e) {
                Log::error("OpenAQ ingest failed for station {$station->id}: " . $e->getMessage());
            }
        }
    }
}