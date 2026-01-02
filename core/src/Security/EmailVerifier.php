<?php

namespace App\Security;

use App\Entity\User;
use App\Frontend\FrontendUrlBuilder;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;
use SymfonyCasts\Bundle\VerifyEmail\Exception\VerifyEmailExceptionInterface;
use SymfonyCasts\Bundle\VerifyEmail\Model\VerifyEmailSignatureComponents;
use SymfonyCasts\Bundle\VerifyEmail\VerifyEmailHelperInterface;

final readonly class EmailVerifier
{
    public function __construct(
        private VerifyEmailHelperInterface $verifyEmailHelper,
        private EntityManagerInterface $entityManager,
        private FrontendUrlBuilder $frontendUrlBuilder,
        private string $verifyRoute = 'api_auth_verify_email',
    ) {
    }

    public function generateSignature(User $user): VerifyEmailSignatureComponents
    {
        $userId = $user->getId();
        $email = $user->getEmail();

        if ($userId === null || $email === null) {
            throw new \LogicException('Unable to generate verification link for user without identifier or email.');
        }

        $userIdString = (string) $userId;

        return $this->verifyEmailHelper->generateSignature(
            $this->verifyRoute,
            $userIdString,
            $email,
            ['id' => $userIdString],
        );
    }

    public function generateFrontendSignature(User $user): string
    {
        $components = $this->generateSignature($user);
        $query = $this->extractQueryParams($components->getSignedUrl());

        return $this->frontendUrlBuilder->verifyEmailUrl($query);
    }


    public function handleEmailConfirmation(Request $request, User $user): void
    {
        $userId = $user->getId();
        $email = $user->getEmail();

        if ($userId === null || $email === null) {
            throw new \LogicException('Unable to verify an email for a user without identifier or email.');
        }

        $this->verifyEmailHelper->validateEmailConfirmationFromRequest($request, (string) $userId, $email);

        $user->setEmailVerified(true);

        $this->entityManager->persist($user);
        $this->entityManager->flush();
    }

    /**
     * @return array<string, scalar>
     */
    private function extractQueryParams(string $signedUrl): array
    {
        $parts = parse_url($signedUrl);
        if (!is_array($parts) || !isset($parts['query'])) {
            return [];
        }

        parse_str($parts['query'], $params);

        return is_array($params) ? $params : [];
    }
}
