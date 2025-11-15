<?php

namespace App\Repository;

use App\Entity\RefreshToken;
use Doctrine\ORM\NonUniqueResultException;
use Gesdinet\JWTRefreshTokenBundle\Entity\RefreshTokenRepository as BaseRefreshTokenRepository;

/**
 * @extends BaseRefreshTokenRepository<RefreshToken>
 */
class RefreshTokenRepository extends BaseRefreshTokenRepository
{
    public function deleteAllForUser(string $username): void
    {
        $this->createQueryBuilder('token')
            ->delete()
            ->where('token.username = :username')
            ->setParameter('username', $username)
            ->getQuery()
            ->execute();
    }

    public function findOneValid(string $refreshToken): ?RefreshToken
    {
        try {
            return $this->createQueryBuilder('token')
                ->where('token.refreshToken = :refresh')
                ->andWhere('token.valid >= :now')
                ->setParameter('refresh', $refreshToken)
                ->setParameter('now', new \DateTimeImmutable())
                ->setMaxResults(1)
                ->getQuery()
                ->getOneOrNullResult();
        } catch (NonUniqueResultException) {
            return null;
        }
    }
}
