<?php

namespace App\Controller\Auth;

use App\Repository\UserRepository;
use App\Response\ApiResponseFactory;
use App\Security\EmailVerifier;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use SymfonyCasts\Bundle\VerifyEmail\Exception\VerifyEmailExceptionInterface;

#[Route('/api/auth/verify-email', name: 'api_auth_verify_email', methods: ['GET'])]
final class VerifyEmailController extends AbstractController
{
    public function __construct(
        private readonly EmailVerifier $emailVerifier,
        private readonly UserRepository $userRepository,
        private readonly ApiResponseFactory $responses,
    ) {
    }

    public function __invoke(Request $request): Response
    {
        $id = $request->query->get('id');

        if (!is_numeric($id)) {
            return $this->responses->error('INVALID_REQUEST', Response::HTTP_BAD_REQUEST);
        }

        $user = $this->userRepository->find((int) $id);

        if (!$user) {
            return $this->responses->error('USER_NOT_FOUND', Response::HTTP_NOT_FOUND);
        }

        try {
            $this->emailVerifier->handleEmailConfirmation($request, $user);
        } catch (VerifyEmailExceptionInterface) {
            return $this->responses->error('INVALID_TOKEN', Response::HTTP_BAD_REQUEST);
        }

        return new JsonResponse(['status' => 'OK'], Response::HTTP_OK);
    }
}
