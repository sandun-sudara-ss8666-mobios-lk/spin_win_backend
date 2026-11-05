ALTER TABLE `rewards`
  ADD COLUMN `video_url` VARCHAR(191) NULL,
  ADD COLUMN `is_video_show` BOOLEAN NOT NULL DEFAULT false;
