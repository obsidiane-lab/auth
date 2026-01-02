<?php

namespace App\Controller\Auth;

use App\Repository\UserRepository;
use App\Security\EmailVerifier;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\GoneHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Attribute\Route;
use SymfonyCasts\Bundle\VerifyEmail\Exception\ExpiredSignatureException;
use SymfonyCasts\Bundle\VerifyEmail\Exception\InvalidSignatureException;
use SymfonyCasts\Bundle\VerifyEmail\Exception\VerifyEmailExceptionInterface;
use SymfonyCasts\Bundle\VerifyEmail\Exception\WrongEmailVerifyException;

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
            throw new BadRequestHttpException('Invalid request.');
        }

        $user = $this->userRepository->find((int) $id);

        if (!$user) {
            throw new NotFoundHttpException('User not found.');
        }

        try {
            $this->emailVerifier->handleEmailConfirmation($request, $user);
        } catch (ExpiredSignatureException $exception) {
            throw new GoneHttpException('Verification link has expired.', $exception);
        } catch (InvalidSignatureException | WrongEmailVerifyException $exception) {
            throw new BadRequestHttpException('Invalid token.', previous: $exception);
        } catch (VerifyEmailExceptionInterface) {
            throw new BadRequestHttpException('Invalid token.');
        }

        return new JsonResponse(['status' => 'OK'], Response::HTTP_OK);
    }
}
