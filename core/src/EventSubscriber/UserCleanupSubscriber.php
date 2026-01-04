<?php

declare(strict_types=1);

namespace App\EventSubscriber;

use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsDoctrineListener;
use Doctrine\DBAL\ArrayParameterType;
use Doctrine\ORM\Event\OnFlushEventArgs;
use Doctrine\ORM\Event\PostFlushEventArgs;
use Doctrine\ORM\Events;

#[AsDoctrineListener(event: Events::onFlush)]
#[AsDoctrineListener(event: Events::postFlush)]
final class UserCleanupSubscriber
{
    /**
     * @var array<string, bool>
     */
    private array $pendingUsernames = [];

    public function onFlush(OnFlushEventArgs $args): void
    {
        $uow = $args->getObjectManager()->getUnitOfWork();

        foreach ($uow->getScheduledEntityDeletions() as $entity) {
            if (!$entity instanceof User) {
                continue;
            }

            $email = $entity->getEmail();
            if (!is_string($email) || $email === '') {
                continue;
            }

            $this->pendingUsernames[$email] = true;
        }
    }

    public function postFlush(PostFlushEventArgs $args): void
    {
        if ($this->pendingUsernames === []) {
            return;
        }

        $usernames = array_keys($this->pendingUsernames);
        $this->pendingUsernames = [];

        $args->getObjectManager()->getConnection()->executeStatement(
            'DELETE FROM refresh_tokens WHERE username IN (:usernames)',
            ['usernames' => $usernames],
            ['usernames' => ArrayParameterType::STRING]
        );
    }
}
