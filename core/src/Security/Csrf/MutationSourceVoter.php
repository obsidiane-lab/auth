<?php

declare(strict_types=1);

namespace App\Security\Csrf;

use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;
use Symfony\Component\DependencyInjection\Attribute\AutoconfigureTag;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

#[AutoconfigureTag('security.voter')]
final class MutationSourceVoter extends Voter
{
    public const ATTRIBUTE = 'MUTATION_FROM_ALLOWED_SOURCE';

    public function __construct(
        private readonly RequestStack $requestStack,
        #[Autowire('%env(ALLOWED_ORIGINS)%')]
        private string $allowedOriginsPattern,
        private readonly OriginExtractor $originExtractor,
    ) {
    }

    protected function supports(string $attribute, mixed $subject): bool
    {
        return $attribute === self::ATTRIBUTE;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool
    {
        $request = $this->requestStack->getCurrentRequest();
        if ($request === null) {
            return true;
        }

        if ($request->isMethodSafe()) {
            return true;
        }

        if (in_array('ROLE_SERVICE', $token->getRoleNames(), true)) {
            return true;
        }

        if ($request->headers->get('Sec-Fetch-Site') === 'cross-site') {
            return false;
        }

        $origin = $this->originExtractor->extractOrigin($request);
        if ($origin === null || $origin === '' || $origin === 'null') {
            return false;
        }

        if ($this->allowedOriginsPattern === '') {
            return true;
        }

        $origin = strtolower($origin);
        return $this->matchesAllowedOrigin($origin, $this->allowedOriginsPattern);
    }

    private function matchesAllowedOrigin(string $origin, string $allowed): bool
    {
        if ($allowed === $origin) {
            return true;
        }

        $pattern = '#'.$allowed.'#';
        return preg_match($pattern, $origin) === 1;
    }
}
