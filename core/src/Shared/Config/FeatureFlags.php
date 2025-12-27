<?php

declare(strict_types=1);

namespace App\Shared\Config;

use Symfony\Component\DependencyInjection\Attribute\Autowire;

final class FeatureFlags
{
    public function __construct(
        #[Autowire('%env(bool:REGISTRATION_ENABLED)%')]
        private readonly bool $registrationEnabled,
    ) {
    }

    public function isRegistrationEnabled(): bool
    {
        return $this->registrationEnabled;
    }
}
