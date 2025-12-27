<?php

namespace App\Repository;

use App\Entity\RefreshToken;
use Gesdinet\JWTRefreshTokenBundle\Entity\RefreshTokenRepository as BaseRefreshTokenRepository;

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

}
