<?php

declare(strict_types=1);

namespace Obsidiane\AuthBundle\Bridge;

final readonly class BridgeOptions
{
    public function __construct(
        public string $baseUrl,
        public string $token,
        public BridgeDefaults $defaults,
        public bool $debug = false,
    ) {
        if (trim($this->baseUrl) === '') {
            throw new \InvalidArgumentException('BridgeOptions: baseUrl is required.');
        }
        if (trim($this->token) === '') {
            throw new \InvalidArgumentException('BridgeOptions: token is required.');
        }
    }

    /**
     * @param array<string,mixed> $defaults
     */
    public static function fromConfig(string $baseUrl, string $token, array $defaults = [], bool $debug = false): self
    {
        return new self($baseUrl, $token, BridgeDefaults::fromArray($defaults), $debug);
    }
}
