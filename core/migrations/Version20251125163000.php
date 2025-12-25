<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20251125163000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Remove display_name column from users table';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE users DROP display_name');
    }

    public function down(Schema $schema): void
    {
        $this->addSql("ALTER TABLE users ADD display_name VARCHAR(120) NOT NULL DEFAULT ''");
    }
}
