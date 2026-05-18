-- App Panel: Exercise katalog alanları (mobil akışları etkilemez, varsayılanlar mevcut kayıtlara uygulanır)
ALTER TABLE `Exercise`
  ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'published',
  ADD COLUMN `category` VARCHAR(191) NULL DEFAULT 'program',
  ADD COLUMN `publishedAt` DATETIME(3) NULL;

UPDATE `Exercise` SET `publishedAt` = `createdAt` WHERE `status` = 'published' AND `publishedAt` IS NULL;
