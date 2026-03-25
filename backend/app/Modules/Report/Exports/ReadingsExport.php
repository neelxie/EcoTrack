<?php

namespace App\Modules\Report\Exports;

use App\Modules\Reading\Models\Reading;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class ReadingsExport implements FromQuery, WithHeadings, WithMapping
{
    public function __construct(
        private int     $stationId,
        private string  $from,
        private string  $to,
        private ?string $metric = null,
    ) {}

    public function query()
    {
        return Reading::query()
            ->where('station_id', $this->stationId)
            ->whereBetween('recorded_at', [$this->from, $this->to])
            ->when($this->metric, fn($q, $m) => $q->where('metric', $m))
            ->orderBy('recorded_at');
    }

    public function headings(): array
    {
        return ['ID', 'Station ID', 'Metric', 'Value', 'Unit', 'Recorded At', 'Source'];
    }

    public function map($row): array
    {
        return [
            $row->id,
            $row->station_id,
            $row->metric,
            $row->value,
            $row->unit,
            $row->recorded_at->toDateTimeString(),
            $row->source,
        ];
    }
}