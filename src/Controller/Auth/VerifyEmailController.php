<?php

namespace App\Controller\Auth;

use App\Repository\UserRepository;
use App\Security\EmailVerifier;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use SymfonyCasts\Bundle\VerifyEmail\Exception\VerifyEmailExceptionInterface;

#[Route('/verify-email', name: 'app_verify_email', methods: ['GET'])]
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
            return $this->redirectWithFlash('auth.verify.error');
        }

        $user = $this->userRepository->find((int) $id);

        if (!$user) {
            return $this->redirectWithFlash('auth.verify.error');
        }

        try {
            $this->emailVerifier->handleEmailConfirmation($request, $user);
        } catch (VerifyEmailExceptionInterface) {
            return $this->redirectWithFlash('auth.verify.error');
        }

        return $this->redirectWithFlash('auth.verify.success');
    }

    private function redirectWithFlash(string $flashKey): RedirectResponse
    {
        return $this->redirectToRoute('auth_login_page', ['flash' => $flashKey]);
    }
}

