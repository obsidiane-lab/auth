<?php

declare(strict_types=1);

namespace Obsidiane\AuthBundle\Model;

use Symfony\Component\Serializer\Attribute\SerializedName;

class Item
{
    #[SerializedName('@id')]
    public ?string $iri = null;

    #[SerializedName('@type')]
    public string|array|null $type = null;

    #[SerializedName('@context')]
    public string|array|null $context = null;
}
