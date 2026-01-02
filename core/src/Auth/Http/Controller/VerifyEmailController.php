<?php

namespace App\Auth\Http\Controller;

use App\Repository\UserRepository;
use App\Auth\Infrastructure\Security\EmailVerifier;
use App\Shared\Http\Exception\InvalidRequestException;
use App\Shared\Http\Exception\InvalidTokenException;
use App\Shared\Http\Exception\UserNotFoundException;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use SymfonyCasts\Bundle\VerifyEmail\Exception\VerifyEmailExceptionInterface;

#[AsController]
#[Route('/api/auth/verify-email', name: 'api_auth_verify_email', methods: ['GET'])]
final class VerifyEmailController extends AbstractController
{
    public function __construct(
        private readonly EmailVerifier $emailVerifier,
        private readonly UserRepository $userRepository,
    ) {
    }

    public function __invoke(Request $request): Response
    {
        $id = $request->query->get('id');

        if (!is_numeric($id)) {
            throw new InvalidRequestException();
        }

        $user = $this->userRepository->find((int) $id);

        if (!$user) {
            throw new UserNotFoundException();
        }

        try {
            $this->emailVerifier->handleEmailConfirmation($request, $user);
        } catch (VerifyEmailExceptionInterface) {
            throw new InvalidTokenException();
        }

        return new JsonResponse(['status' => 'OK'], Response::HTTP_OK);
    }
}
