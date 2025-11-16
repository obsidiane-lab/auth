<?php

namespace App\Http;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Serializer\Exception\NotEncodableValueException;

trait JsonRequestDecoderTrait
{
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

