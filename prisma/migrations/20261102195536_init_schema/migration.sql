-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN') NOT NULL DEFAULT 'ADMIN',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exhibitions` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `timezone` VARCHAR(191) NOT NULL DEFAULT 'Asia/Colombo',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `is_paused` BOOLEAN NOT NULL DEFAULT false,
    `pacing_start_time` VARCHAR(191) NOT NULL DEFAULT '09:00:00',
    `pacing_end_time` VARCHAR(191) NOT NULL DEFAULT '21:00:00',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exhibition_days` (
    `id` VARCHAR(191) NOT NULL,
    `exhibition_id` VARCHAR(191) NOT NULL,
    `day_number` INTEGER NOT NULL,
    `date` VARCHAR(10) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `status` ENUM('UPCOMING', 'IN_PROGRESS', 'COMPLETED') NOT NULL DEFAULT 'UPCOMING',
    `actual_started_at` DATETIME(3) NULL,
    `actual_ended_at` DATETIME(3) NULL,
    `pacing_start_time` VARCHAR(191) NOT NULL DEFAULT '09:00:00',
    `pacing_end_time` VARCHAR(191) NOT NULL DEFAULT '21:00:00',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `exhibition_days_status_idx`(`status`),
    UNIQUE INDEX `exhibition_days_exhibition_id_day_number_key`(`exhibition_id`, `day_number`),
    UNIQUE INDEX `exhibition_days_exhibition_id_date_key`(`exhibition_id`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `qr_session_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(64) NOT NULL,
    `exhibition_id` VARCHAR(191) NOT NULL,
    `exhibition_day_id` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'CLAIMED', 'EXPIRED') NOT NULL DEFAULT 'ACTIVE',
    `expires_at` DATETIME(3) NOT NULL,
    `claimed_at` DATETIME(3) NULL,
    `claimed_by_ip` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `qr_session_tokens_token_key`(`token`),
    INDEX `qr_session_tokens_token_status_expires_at_idx`(`token`, `status`, `expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visitor_registration_sessions` (
    `id` VARCHAR(191) NOT NULL,
    `session_token` VARCHAR(64) NOT NULL,
    `qr_token_id` VARCHAR(191) NOT NULL,
    `exhibition_day_id` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'COMPLETED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `expires_at` DATETIME(3) NOT NULL,
    `completed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `visitor_registration_sessions_session_token_key`(`session_token`),
    UNIQUE INDEX `visitor_registration_sessions_qr_token_id_key`(`qr_token_id`),
    INDEX `visitor_registration_sessions_session_token_status_expires_a_idx`(`session_token`, `status`, `expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `participations` (
    `id` VARCHAR(191) NOT NULL,
    `readable_ref` VARCHAR(20) NOT NULL,
    `exhibition_day_id` VARCHAR(191) NOT NULL,
    `reg_session_id` VARCHAR(191) NULL,
    `visitor_name` VARCHAR(191) NOT NULL,
    `visitor_phone` VARCHAR(20) NOT NULL,
    `visitor_phone_raw` VARCHAR(30) NOT NULL,
    `status` ENUM('WAITING', 'SELECTED', 'SPINNING', 'COMPLETED', 'SKIPPED', 'DAY_CLOSED') NOT NULL DEFAULT 'WAITING',
    `registered_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `selected_at` DATETIME(3) NULL,
    `completed_at` DATETIME(3) NULL,
    `notes` VARCHAR(191) NULL,

    UNIQUE INDEX `participations_readable_ref_key`(`readable_ref`),
    UNIQUE INDEX `participations_reg_session_id_key`(`reg_session_id`),
    INDEX `participations_exhibition_day_id_status_registered_at_idx`(`exhibition_day_id`, `status`, `registered_at`),
    INDEX `participations_visitor_phone_idx`(`visitor_phone`),
    INDEX `participations_readable_ref_idx`(`readable_ref`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `merchants` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `logo_url` VARCHAR(191) NULL,
    `primary_color` VARCHAR(10) NULL,
    `contact_email` VARCHAR(191) NULL,
    `contact_phone` VARCHAR(191) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `merchants_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rewards` (
    `id` VARCHAR(191) NOT NULL,
    `merchant_id` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `type` ENUM('PHYSICAL', 'VOUCHER', 'MERCHANDISE', 'NO_WIN') NOT NULL DEFAULT 'PHYSICAL',
    `short_label` VARCHAR(24) NOT NULL,
    `inventory_mode` ENUM('LIMITED', 'UNLIMITED', 'NO_WIN') NOT NULL DEFAULT 'LIMITED',
    `distribution_strategy` ENUM('EXHIBITION_WIDE', 'AUTO_DAILY', 'CUSTOM_DAILY') NOT NULL DEFAULT 'AUTO_DAILY',
    `total_physical_stock` INTEGER NOT NULL DEFAULT 0,
    `available_physical_stock` INTEGER NOT NULL DEFAULT 0,
    `retired_stock` INTEGER NOT NULL DEFAULT 0,
    `carry_forward` BOOLEAN NOT NULL DEFAULT true,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `effective_start_at` DATETIME(3) NULL,
    `baseline_weight` INTEGER NOT NULL DEFAULT 3,
    `color_hex` VARCHAR(10) NULL,
    `icon_url` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `rewards_is_active_inventory_mode_idx`(`is_active`, `inventory_mode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `daily_allocations` (
    `id` VARCHAR(191) NOT NULL,
    `reward_id` VARCHAR(191) NOT NULL,
    `exhibition_day_id` VARCHAR(191) NOT NULL,
    `allocated_quantity` INTEGER NOT NULL DEFAULT 0,
    `carried_forward_quantity` INTEGER NOT NULL DEFAULT 0,
    `awarded_quantity` INTEGER NOT NULL DEFAULT 0,
    `is_finalized` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `daily_allocations_reward_id_exhibition_day_id_key`(`reward_id`, `exhibition_day_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_ledger_entries` (
    `id` VARCHAR(191) NOT NULL,
    `reward_id` VARCHAR(191) NOT NULL,
    `exhibition_day_id` VARCHAR(191) NULL,
    `entry_type` ENUM('INITIAL_STOCK', 'ADMIN_ADJUSTMENT', 'AUTO_DISTRIBUTION', 'SPIN_AWARD', 'AWARD_CANCELLED_RETURN_PACING', 'AWARD_CANCELLED_RETURN_IMMEDIATE', 'AWARD_CANCELLED_RETIRE', 'CARRY_FORWARD_APPLIED', 'DAY_CLOSE_RESET') NOT NULL,
    `quantity_delta` INTEGER NOT NULL,
    `balance_after` INTEGER NOT NULL,
    `reference_id` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `created_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `stock_ledger_entries_reward_id_created_at_idx`(`reward_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `awards` (
    `id` VARCHAR(191) NOT NULL,
    `spin_id` VARCHAR(191) NOT NULL,
    `participation_id` VARCHAR(191) NOT NULL,
    `reward_id` VARCHAR(191) NOT NULL,
    `exhibition_day_id` VARCHAR(191) NOT NULL,
    `status` ENUM('AWARDED', 'CANCELLED') NOT NULL DEFAULT 'AWARDED',
    `cancellation_reason` VARCHAR(191) NULL,
    `cancellation_resolution` ENUM('IMMEDIATE_RETURN', 'RETURN_TO_PACING', 'RETIRE') NULL,
    `cancelled_by` VARCHAR(191) NULL,
    `cancelled_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `awards_spin_id_key`(`spin_id`),
    INDEX `awards_exhibition_day_id_status_idx`(`exhibition_day_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `priority_lists` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'INACTIVE') NOT NULL DEFAULT 'DRAFT',
    `version` INTEGER NOT NULL DEFAULT 1,
    `published_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `priority_lists_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `priority_list_items` (
    `id` VARCHAR(191) NOT NULL,
    `priority_list_id` VARCHAR(191) NOT NULL,
    `reward_id` VARCHAR(191) NOT NULL,
    `rank` INTEGER NOT NULL,
    `multiplier` DOUBLE NOT NULL DEFAULT 1.0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `priority_list_items_priority_list_id_rank_key`(`priority_list_id`, `rank`),
    UNIQUE INDEX `priority_list_items_priority_list_id_reward_id_key`(`priority_list_id`, `reward_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wheel_configs` (
    `id` VARCHAR(191) NOT NULL,
    `version` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `is_published` BOOLEAN NOT NULL DEFAULT false,
    `slice_count` INTEGER NOT NULL DEFAULT 12,
    `created_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `wheel_configs_version_key`(`version`),
    INDEX `wheel_configs_is_published_idx`(`is_published`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wheel_slices` (
    `id` VARCHAR(191) NOT NULL,
    `wheel_config_id` VARCHAR(191) NOT NULL,
    `slice_index` INTEGER NOT NULL,
    `reward_id` VARCHAR(191) NULL,
    `is_no_win` BOOLEAN NOT NULL DEFAULT false,
    `label` VARCHAR(50) NOT NULL,
    `background_color` VARCHAR(20) NOT NULL,
    `text_color` VARCHAR(20) NOT NULL,
    `icon_url` VARCHAR(191) NULL,

    UNIQUE INDEX `wheel_slices_wheel_config_id_slice_index_key`(`wheel_config_id`, `slice_index`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `spin_records` (
    `id` VARCHAR(191) NOT NULL,
    `participation_id` VARCHAR(191) NOT NULL,
    `exhibition_day_id` VARCHAR(191) NOT NULL,
    `wheel_config_id` VARCHAR(191) NOT NULL,
    `wheel_slice_id` VARCHAR(191) NOT NULL,
    `reward_id` VARCHAR(191) NULL,
    `slice_index` INTEGER NOT NULL,
    `is_win` BOOLEAN NOT NULL DEFAULT false,
    `idempotency_key` VARCHAR(64) NOT NULL,
    `status` ENUM('SELECTED', 'STARTING', 'ANIMATING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'SELECTED',
    `started_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `spin_records_participation_id_key`(`participation_id`),
    UNIQUE INDEX `spin_records_idempotency_key_key`(`idempotency_key`),
    INDEX `spin_records_exhibition_day_id_status_idx`(`exhibition_day_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NULL,
    `user_email` VARCHAR(191) NULL,
    `action` VARCHAR(100) NOT NULL,
    `resource_type` VARCHAR(100) NOT NULL,
    `resource_id` VARCHAR(100) NULL,
    `payload` TEXT NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_action_created_at_idx`(`action`, `created_at`),
    INDEX `audit_logs_resource_type_resource_id_idx`(`resource_type`, `resource_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `exhibition_days` ADD CONSTRAINT `exhibition_days_exhibition_id_fkey` FOREIGN KEY (`exhibition_id`) REFERENCES `exhibitions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `qr_session_tokens` ADD CONSTRAINT `qr_session_tokens_exhibition_id_fkey` FOREIGN KEY (`exhibition_id`) REFERENCES `exhibitions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `qr_session_tokens` ADD CONSTRAINT `qr_session_tokens_exhibition_day_id_fkey` FOREIGN KEY (`exhibition_day_id`) REFERENCES `exhibition_days`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visitor_registration_sessions` ADD CONSTRAINT `visitor_registration_sessions_qr_token_id_fkey` FOREIGN KEY (`qr_token_id`) REFERENCES `qr_session_tokens`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visitor_registration_sessions` ADD CONSTRAINT `visitor_registration_sessions_exhibition_day_id_fkey` FOREIGN KEY (`exhibition_day_id`) REFERENCES `exhibition_days`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `participations` ADD CONSTRAINT `participations_exhibition_day_id_fkey` FOREIGN KEY (`exhibition_day_id`) REFERENCES `exhibition_days`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `participations` ADD CONSTRAINT `participations_reg_session_id_fkey` FOREIGN KEY (`reg_session_id`) REFERENCES `visitor_registration_sessions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rewards` ADD CONSTRAINT `rewards_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `merchants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `daily_allocations` ADD CONSTRAINT `daily_allocations_reward_id_fkey` FOREIGN KEY (`reward_id`) REFERENCES `rewards`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `daily_allocations` ADD CONSTRAINT `daily_allocations_exhibition_day_id_fkey` FOREIGN KEY (`exhibition_day_id`) REFERENCES `exhibition_days`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_ledger_entries` ADD CONSTRAINT `stock_ledger_entries_reward_id_fkey` FOREIGN KEY (`reward_id`) REFERENCES `rewards`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_ledger_entries` ADD CONSTRAINT `stock_ledger_entries_exhibition_day_id_fkey` FOREIGN KEY (`exhibition_day_id`) REFERENCES `exhibition_days`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `awards` ADD CONSTRAINT `awards_spin_id_fkey` FOREIGN KEY (`spin_id`) REFERENCES `spin_records`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `awards` ADD CONSTRAINT `awards_participation_id_fkey` FOREIGN KEY (`participation_id`) REFERENCES `participations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `awards` ADD CONSTRAINT `awards_reward_id_fkey` FOREIGN KEY (`reward_id`) REFERENCES `rewards`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `awards` ADD CONSTRAINT `awards_exhibition_day_id_fkey` FOREIGN KEY (`exhibition_day_id`) REFERENCES `exhibition_days`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `priority_list_items` ADD CONSTRAINT `priority_list_items_priority_list_id_fkey` FOREIGN KEY (`priority_list_id`) REFERENCES `priority_lists`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `priority_list_items` ADD CONSTRAINT `priority_list_items_reward_id_fkey` FOREIGN KEY (`reward_id`) REFERENCES `rewards`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wheel_slices` ADD CONSTRAINT `wheel_slices_wheel_config_id_fkey` FOREIGN KEY (`wheel_config_id`) REFERENCES `wheel_configs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wheel_slices` ADD CONSTRAINT `wheel_slices_reward_id_fkey` FOREIGN KEY (`reward_id`) REFERENCES `rewards`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spin_records` ADD CONSTRAINT `spin_records_participation_id_fkey` FOREIGN KEY (`participation_id`) REFERENCES `participations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spin_records` ADD CONSTRAINT `spin_records_exhibition_day_id_fkey` FOREIGN KEY (`exhibition_day_id`) REFERENCES `exhibition_days`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spin_records` ADD CONSTRAINT `spin_records_wheel_config_id_fkey` FOREIGN KEY (`wheel_config_id`) REFERENCES `wheel_configs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spin_records` ADD CONSTRAINT `spin_records_wheel_slice_id_fkey` FOREIGN KEY (`wheel_slice_id`) REFERENCES `wheel_slices`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spin_records` ADD CONSTRAINT `spin_records_reward_id_fkey` FOREIGN KEY (`reward_id`) REFERENCES `rewards`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
