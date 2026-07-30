-- Bildirim metinleri istemcide çevrilecek: title/body yerine çeviri anahtarı saklanır.
-- Kolon nullable; mevcut kayıtlar title/body ile gösterilmeye devam eder.
ALTER TABLE `Notification`
  ADD COLUMN `key` VARCHAR(191) NULL;

-- Mevcut Türkçe kayıtları bilinen anahtarlarla eşleştir.
UPDATE `Notification` SET `key` = 'ready'
  WHERE `key` IS NULL AND `title` LIKE 'Artık Hazırsın%';

UPDATE `Notification` SET `key` = 'premium_active'
  WHERE `key` IS NULL AND `title` LIKE 'Premium Üyelik Aktif%';

UPDATE `Notification` SET `key` = 'subscription_ended'
  WHERE `key` IS NULL AND `title` LIKE 'Abonelik Sona Erdi%';
