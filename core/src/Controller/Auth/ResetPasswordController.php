<?php

namespace App\Controller\Auth;

use App\Auth\RequestPasswordReset;
use App\Auth\ResetPassword;
use App\Dto\Auth\PasswordForgotInput;
use App\Dto\Auth\PasswordResetInput;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

#[AsController]
final class ResetPasswordController extends AbstractController
{
    public function __construct(
        private readonly RequestPasswordReset $requestPasswordReset,
        private readonly ResetPassword $resetPassword,
    ) {
    }

    public function request(PasswordForgotInput $input): Response
    {
        $this->requestPasswordReset->handle($input->email ?? null);

        return new JsonResponse(['status' => 'OK'], Response::HTTP_ACCEPTED);
    }

    public function reset(PasswordResetInput $input): Response
    {
        $this->resetPassword->handle($input->token, $input->password);

        return new Response('', Response::HTTP_NO_CONTENT);
    }

}
