<?php

return [
    /**
     * Salt used when hashing visitor IPs before storage. Set in .env to a long
     * random string. Rotating it severs the link between recorded views and
     * the original IP — recommended on a yearly cadence per privacy guidance.
     */
    'ip_salt' => env('ANALYTICS_IP_HASH_SALT', 'change-me-in-production'),
];
