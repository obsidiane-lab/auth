<?php

namespace App\Shared\Mail;

use Obsidiane\Notifuse\ApiClient;
use Obsidiane\Notifuse\Exception\NotifuseClientException;
use Psr\Log\LoggerInterface;

final readonly class MailerGateway
{
    public function __construct(
        private ApiClient $apiClient,
        private LoggerInterface $logger,
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
            $this->logFailure($recipient, $templateId, $exception);
            throw new MailDispatchException($exception);
        } catch (\Throwable $exception) {
            $this->logFailure($recipient, $templateId, $exception);
            throw new MailDispatchException($exception);
        }
    }

    private function logFailure(string $recipient, string $templateId, \Throwable $exception): void
    {
        $this->logger->error('Failed to dispatch email', [
            'template' => $templateId,
            'recipient' => $recipient,
            'exception' => $exception::class,
            'message' => $exception->getMessage(),
        ]);
    }
}
