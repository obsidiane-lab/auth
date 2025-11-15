<?php

namespace App\Mail;

use Obsidiane\Notifuse\ApiClient;
use Obsidiane\Notifuse\Exception\NotifuseClientException;

final readonly class MailerGateway
{
    public function __construct(
        private ApiClient $apiClient,
    )
    {
    }

    /**
     * @param array<string, mixed> $data
     *
     * @throws MailDispatchException
     */
    public function dispatch(string $recipient, string $templateId, array $data = []): void
    {
        $payload = [
            'id' => $templateId,
            'contact' => [
                'email' => $recipient,
            ],
            'channels' => ['email'],
            'data' => $data,
        ];

        try {
            $this->apiClient->sendTransactional($payload);
        } catch (NotifuseClientException $exception) {
            throw new MailDispatchException($exception->getMessage(), 0, $exception);
        } catch (\Throwable $exception) {
            throw new MailDispatchException($exception->getMessage(), 0, $exception);
        }
    }
}
