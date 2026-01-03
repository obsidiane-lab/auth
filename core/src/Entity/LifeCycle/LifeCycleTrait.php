<?php

namespace App\Entity\LifeCycle;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;

trait LifeCycleTrait
{
    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $createdAt;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $updatedAt;

    public function getCreatedAt(): DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function setCreatedAt(DateTimeImmutable $dateTimeImmutable): static
    {
        $this->createdAt = $dateTimeImmutable;
        return $this;
    }

    public function setUpdatedAt(DateTimeImmutable $dateTimeImmutable): static
    {
        $this->updatedAt = $dateTimeImmutable;
        return $this;
    }

    #[ORM\PrePersist]
    public function initializeTimestamps(): void
    {
        $now = new DateTimeImmutable();
        $this->createdAt = $now;
        $this->updatedAt = $now;
    }

    #[ORM\PreUpdate]
    public function updateTimestamp(): void
    {
        $this->updatedAt = new DateTimeImmutable();
    }
}
