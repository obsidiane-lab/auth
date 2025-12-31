<?php

namespace Obsidiane\AuthBundle\Endpoint;

use Obsidiane\AuthBundle\Http\HttpClient;

/**
 * Endpoint /api/config (configuration frontend publique).
 */
final class FrontendConfigEndpoint
{
    private const PATH_FRONTEND_CONFIG = '/api/config';

    public function __construct(
        private readonly HttpClient $http,
    ) {
    }

    /**
     * GET /api/config
     *
     * @return array<string,mixed>
     */
    public function get(): array
    {
        return $this->http->requestJson('GET', self::PATH_FRONTEND_CONFIG);
    }
}
