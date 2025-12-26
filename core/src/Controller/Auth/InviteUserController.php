<?php

namespace App\Controller\Auth;

use App\Auth\Exception\RegistrationException;
use App\Auth\InvitationManager;
use App\Auth\Dto\InviteUserInput;
use App\Mail\MailDispatchException;
use App\Response\ApiResponseFactory;
use App\Setup\InitialAdminManager;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_ADMIN')]
final class InviteUserController extends AbstractController
{
    public function __construct(
        private readonly InvitationManager $invitationManager,
        private readonly ApiResponseFactory $responses,
        private readonly InitialAdminManager $initialAdminManager,
    ) {
    }

    public function __invoke(InviteUserInput $input): JsonResponse
    {
        if ($this->initialAdminManager->needsBootstrap()) {
            return $this->responses->error('INITIAL_ADMIN_REQUIRED', Response::HTTP_CONFLICT);
        }

        $email = trim((string) ($input->email ?? ''));

        if ($email == '') {
            return $this->responses->error('INVALID_EMAIL', Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        try {
            $this->invitationManager->invite($email);
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
