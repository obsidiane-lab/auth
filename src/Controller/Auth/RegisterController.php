<?php

namespace App\Controller\Auth;

use App\Auth\Dto\RegisterIdentityInput;
use App\Auth\Dto\RegisterUserInput;
use App\Auth\Exception\RegistrationException;
use App\Auth\UserRegistration;
use App\Config\FeatureFlags;
use App\Response\ApiResponseFactory;
use App\Setup\InitialAdminManager;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Serializer\Exception\NotEncodableValueException;

final class RegisterController extends AbstractController
{
    public function __construct(
        private readonly UserRegistration $registration,
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
            throw new NotFoundHttpException();
        }

        try {
            $payload = $this->decodeJson($request);
        } catch (NotEncodableValueException) {
            return $this->responses->error('INVALID_PAYLOAD', Response::HTTP_BAD_REQUEST);
        }

        $input = new RegisterUserInput();
        $identity = new RegisterIdentityInput();

        $input->email = isset($payload['email']) ? trim((string) $payload['email']) : null;
        $input->plainPassword = isset($payload['password']) ? (string) $payload['password'] : null;
        $identity->displayName = isset($payload['displayName']) ? trim((string) $payload['displayName']) : null;

        $input->identity = $identity;

        try {
            $user = $this->registration->register($input);
        } catch (RegistrationException $exception) {
            $errorCode = $exception->getMessage() === 'EMAIL_SEND_FAILED' ? 'EMAIL_SEND_FAILED' : 'INVALID_REGISTRATION';
            return $this->responses->error(
                $errorCode,
                Response::HTTP_UNPROCESSABLE_ENTITY,
                ['details' => $exception->getErrors()]
            );
        }

        return new JsonResponse([
            'user' => [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'displayName' => $user->getDisplayName(),
                'roles' => $user->getRoles(),
            ],
        ], Response::HTTP_CREATED);
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
