<?php

namespace App\Controller\Auth;

use App\Auth\InvitationManager;
use App\Auth\Exception\RegistrationException;
use App\Config\FeatureFlags;
use App\Mail\MailDispatchException;
use App\Response\ApiResponseFactory;
use App\Setup\InitialAdminManager;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Serializer\Exception\NotEncodableValueException;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_ADMIN')]
final class InviteUserController extends AbstractController
{
    public function __construct(
        private readonly InvitationManager $invitationManager,
        private readonly FeatureFlags $featureFlags,
        private readonly ApiResponseFactory $responses,
        private readonly InitialAdminManager $initialAdminManager,
    ) {
    }

    public function __invoke(Request $request): JsonResponse
    {
        if ($this->initialAdminManager->needsBootstrap()) {
            return $this->responses->error('INITIAL_ADMIN_REQUIRED', Response::HTTP_CONFLICT);
        }

        if (!$this->featureFlags->isRegistrationEnabled()) {
            return $this->responses->error('REGISTRATION_DISABLED', Response::HTTP_FORBIDDEN);
        }

        try {
            $payload = $this->decodeJson($request);
        } catch (NotEncodableValueException) {
            return $this->responses->error('INVALID_PAYLOAD', Response::HTTP_BAD_REQUEST);
        }

        $email = isset($payload['email']) ? trim((string) $payload['email']) : '';

        if ($email == '') {
            return $this->responses->error('INVALID_EMAIL', Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        try {
            $this->invitationManager->invite($email);
        } catch (RegistrationException $exception) {
            $errors = $exception->getErrors();
            $errorCode = current($errors) ?: 'INVALID_INVITATION';

            return $this->responses->error($errorCode, Response::HTTP_UNPROCESSABLE_ENTITY, [
                'details' => $errors,
            ]);
        } catch (MailDispatchException) {
            return $this->responses->error('EMAIL_SEND_FAILED', Response::HTTP_SERVICE_UNAVAILABLE);
        }

        return new JsonResponse(['status' => 'INVITE_SENT'], Response::HTTP_ACCEPTED);
    }

    /**
     * @return array<string, mixed>
     */
    private function decodeJson(Request $request): array
    {
        $content = $request->getContent();

        if ($content === '') {
            return [];
        }

        $data = json_decode($content, true);

        if (!is_array($data)) {
            throw new NotEncodableValueException('Invalid JSON payload.');
        }

        return $data;
    }
}

