<?php

namespace App\Security\Voter;

use App\Entity\User as AppUser;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/**
 * @extends Voter<string, AppUser>
 */
final class UserVoter extends Voter
{
    public const READ = 'USER_READ';
    public const EDIT = 'USER_EDIT';

    protected function supports(string $attribute, mixed $subject): bool
    {
        if (!in_array($attribute, [self::READ, self::EDIT], true)) {
            return false;
        }

        return $subject instanceof AppUser;
    }

    /**
     * @param AppUser $subject
     */
    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool
    {
        $user = $token->getUser();

        if (!$user instanceof AppUser) {
            return false;
        }

        if (in_array('ROLE_ADMIN', $user->getRoles(), true)) {
            return true;
        }

        $isOwner = $this->isSameUser($user, $subject);

        return match ($attribute) {
            self::READ, self::EDIT => $isOwner,
            default => false,
        };
    }

    private function isSameUser(AppUser $actor, AppUser $subject): bool
    {
        $actorId = $actor->getId();
        $subjectId = $subject->getId();

        if (null !== $actorId && null !== $subjectId) {
            return (int)$actorId === (int)$subjectId;
        }

        return $actor->getUserIdentifier() === $subject->getUserIdentifier();
    }
}
