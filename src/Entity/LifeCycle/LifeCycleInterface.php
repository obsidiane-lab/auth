<?php

namespace App\Entity\LifeCycle;

use DateTimeImmutable;

interface LifeCycleInterface
{
    public function getCreatedAt(): DateTimeImmutable;

    public function setCreatedAt(DateTimeImmutable $dateTimeImmutable): static;


    public function getUpdatedAt(): DateTimeImmutable;


    public function setUpdatedAt(DateTimeImmutable $dateTimeImmutable): static;

    public function initializeTimestamps(): void;


    public function updateTimestamp(): void;
}
