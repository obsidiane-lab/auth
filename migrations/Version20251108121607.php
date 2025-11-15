<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251108121607 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE reset_password_requests DROP FOREIGN KEY FK_7CE748AA76ED395');
        $this->addSql('DROP INDEX UNIQ_7CE748AA15E2DBF ON reset_password_requests');
        $this->addSql('ALTER TABLE reset_password_requests ADD CONSTRAINT FK_16646B41A76ED395 FOREIGN KEY (user_id) REFERENCES users (id)');
        $this->addSql('ALTER TABLE reset_password_requests RENAME INDEX idx_7ce748aa76ed395 TO IDX_16646B41A76ED395');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE reset_password_requests DROP FOREIGN KEY FK_16646B41A76ED395');
        $this->addSql('ALTER TABLE reset_password_requests ADD CONSTRAINT FK_7CE748AA76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_7CE748AA15E2DBF ON reset_password_requests (selector)');
        $this->addSql('ALTER TABLE reset_password_requests RENAME INDEX idx_16646b41a76ed395 TO IDX_7CE748AA76ED395');
    }
}
