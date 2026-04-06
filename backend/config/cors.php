<?php

return [
    'paths'                    => ['api/*'],
    'allowed_methods'          => ['*'],
    'allowed_origins'          => [
        'http://localhost:4200',
        'https://*.vercel.app',
    ],
    'allowed_origins_patterns' => ['#^https://.*\.vercel\.app$#'],
    'allowed_headers'          => ['*'],
    'exposed_headers'          => [],
    'max_age'                  => 86400,
    'supports_credentials'     => false,
];