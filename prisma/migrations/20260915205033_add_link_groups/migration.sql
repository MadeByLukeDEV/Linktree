-- AlterTable
ALTER TABLE `social_link` ADD COLUMN `groupId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `link_group` (
    `id` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `social_link_groupId_idx` ON `social_link`(`groupId`);

-- AddForeignKey
ALTER TABLE `social_link` ADD CONSTRAINT `social_link_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `link_group`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

