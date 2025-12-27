<?php

namespace App\Auth\Http\Controller;

use App\Auth\Application\InviteUser;
use App\Auth\Domain\Exception\RegistrationException;
use App\Auth\Http\Dto\InviteUserInput;
use App\Shared\Mail\MailDispatchException;
use App\Shared\Response\ApiResponseFactory;
use App\Setup\Application\InitialAdminManager;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[AsController]
#[IsGranted('ROLE_ADMIN')]
final class InviteUserController extends AbstractController
{
    public function __construct(
        private readonly InviteUser $inviteUser,
        private readonly ApiResponseFactory $responses,
        private readonly InitialAdminManager $initialAdminManager,
    ) {
    }

    public function __invoke(InviteUserInput $input): JsonResponse
    {
        if ($this->initialAdminManager->needsBootstrap()) {
            return $this->responses->error('INITIAL_ADMIN_REQUIRED', Response::HTTP_CONFLICT);
        }

        try {
            $this->inviteUser->handle($input);
        } catch (RegistrationException $exception) {
            $errors = $exception->getErrors();
            $errorCode = current($errors) ?: 'INVALID_INVITATION';

            $statusCode = Response::HTTP_UNPROCESSABLE_ENTITY;
            if (in_array('EMAIL_ALREADY_USED', $errors, true)) {
                $statusCode = Response::HTTP_CONFLICT;
            }

            return $this->responses->error($errorCode, $statusCode, [
                'details' => $errors,
            ]);
        } catch (MailDispatchException) {
            return $this->responses->error('EMAIL_SEND_FAILED', Response::HTTP_SERVICE_UNAVAILABLE);
        }

        return new JsonResponse(['status' => 'INVITE_SENT'], Response::HTTP_ACCEPTED);
    }
}
