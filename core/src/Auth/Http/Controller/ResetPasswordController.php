<?php

namespace App\Auth\Http\Controller;

use App\Auth\Application\RequestPasswordReset;
use App\Auth\Application\ResetPassword;
use App\Auth\Domain\Exception\PasswordResetException;
use App\Auth\Http\Dto\PasswordForgotInput;
use App\Auth\Http\Dto\PasswordResetInput;
use App\Shared\Response\ApiResponseFactory;
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
        private readonly ApiResponseFactory $responses,
    ) {
    }

    public function request(PasswordForgotInput $input): Response
    {
        try {
            $this->requestPasswordReset->handle($input->email ?? null);
        } catch (PasswordResetException $exception) {
            return $this->responses->error($exception->getErrorCode(), $exception->getStatusCode());
        }

        return new JsonResponse(['status' => 'OK'], Response::HTTP_ACCEPTED);
    }

    public function reset(PasswordResetInput $input): Response
    {
        try {
            $this->resetPassword->handle($input->token ?? null, $input->password ?? null);
        } catch (PasswordResetException $exception) {
            return $this->responses->error($exception->getErrorCode(), $exception->getStatusCode());
        }

        return new Response('', Response::HTTP_NO_CONTENT);
    }

}
