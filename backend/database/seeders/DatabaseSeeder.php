<?php

namespace Database\Seeders;

use App\Modules\Station\Models\Station;
use App\Modules\Reading\Models\Reading;
use Illuminate\Database\Seeder;

class StationSeeder extends Seeder
{
    public function run(): void
    {
        $stations = [
            ['name'=>'Kampala Central','latitude'=>0.3476,'longitude'=>32.5825,
             'country'=>'Uganda','city'=>'Kampala','type'=>'air_quality'],
            ['name'=>'Nairobi CBD','latitude'=>-1.2921,'longitude'=>36.8219,
             'country'=>'Kenya','city'=>'Nairobi','type'=>'weather'],
            ['name'=>'Dar es Salaam Port','latitude'=>-6.7924,'longitude'=>39.2083,
             'country'=>'Tanzania','city'=>'Dar es Salaam','type'=>'emissions'],
        ];

        foreach ($stations as $data) {
            $station = Station::create([...$data, 'is_active' => true]);

            // Seed 30 days of hourly readings
            $metrics = match($data['type']) {
                'air_quality' => [['pm25','µg/m³'],['pm10','µg/m³'],['no2','ppb']],
                'weather'     => [['temperature','°C'],['humidity','%'],['pressure','hPa']],
                'emissions'   => [['co2','ppm'],['so2','ppb']],
            };

            foreach ($metrics as [$metric, $unit]) {
                $base = match($metric) {
                    'pm25'=>35,'pm10'=>60,'no2'=>25,'temperature'=>24,
                    'humidity'=>68,'pressure'=>1013,'co2'=>415,'so2'=>8,
                    default=>50,
                };

                for ($day = 29; $day >= 0; $day--) {
                    for ($hour = 0; $hour < 24; $hour += 3) {
                        Reading::create([
                            'station_id'  => $station->id,
                            'metric'      => $metric,
                            'value'       => round($base + (mt_rand(-100,100)/20), 2),
                            'unit'        => $unit,
                            'recorded_at' => now()->subDays($day)->setHour($hour)->setMinute(0)->setSecond(0),
                            'source'      => 'seeder',
                        ]);
                    }
                }
            }
        }
    }
}