-- CreateTable
CREATE TABLE `passkey` (
    `id` VARCHAR(191) NOT NULL,
    `name` TEXT NULL,
    `publicKey` TEXT NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `credentialID` TEXT NOT NULL,
    `counter` INTEGER NOT NULL,
    `deviceType` TEXT NOT NULL,
    `backedUp` BOOLEAN NOT NULL,
    `transports` TEXT NULL,
    `createdAt` DATETIME(3) NULL,
    `aaguid` TEXT NULL,

    INDEX `passkey_userId_idx`(`userId`(191)),
    INDEX `passkey_credentialID_idx`(`credentialID`(191)),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `passkey` ADD CONSTRAINT `passkey_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

