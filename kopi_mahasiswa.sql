-- ========================================================
-- KOPI MAHASISWA DATABASE DUMP (LARAGON MYSQL)
-- Database Name: kopi_mahasiswa
-- Host: 127.0.0.1 / localhost:3306
-- User Default: root (password kosong)
-- ========================================================

CREATE DATABASE IF NOT EXISTS `kopi_mahasiswa` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `kopi_mahasiswa`;

SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- 1. Tabel users (Akun Pengguna)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `password` VARCHAR(191) DEFAULT NULL,
  `role` VARCHAR(191) NOT NULL DEFAULT 'PELANGGAN',
  `image` VARCHAR(191) DEFAULT NULL,
  `phone` VARCHAR(191) DEFAULT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Password semua akun demo: password123
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `phone`, `isActive`, `createdAt`, `updatedAt`) VALUES
('cmtlqa1pz0000b3srbeaz9mjp', 'Admin Kopi', 'admin@kopimahasiswa.com', '$2b$12$5JZ0BwIygV5sK5cfWbNw5u2HgM5OlPO8ByPAm553tEFRMwwgH0fxW', 'ADMIN', '081111111111', 1, NOW(), NOW()),
('cmtlqa1rc0001b3sres3og5e2', 'Owner Kopi', 'owner@kopimahasiswa.com', '$2b$12$5JZ0BwIygV5sK5cfWbNw5u2HgM5OlPO8ByPAm553tEFRMwwgH0fxW', 'OWNER', '082222222222', 1, NOW(), NOW()),
('cmtlqa1rh0002b3srady403a9', 'Kasir Kopi', 'kasir@kopimahasiswa.com', '$2b$12$5JZ0BwIygV5sK5cfWbNw5u2HgM5OlPO8ByPAm553tEFRMwwgH0fxW', 'KASIR', '083333333333', 1, NOW(), NOW()),
('cmu9zo0t00000tsvja62ef1j2', 'Kasir Dua', 'kasir2@kopimahasiswa.com', '$2b$12$f/7vUAG0yG9hfwtoXVHzc.jW7.11W6dzKb/y5KGVokX7DGeKibXxC', 'KASIR', NULL, 1, NOW(), NOW()),
('cmtlqa1rj0003b3srz2mlwt61', 'Petugas Stok', 'stok@kopimahasiswa.com', '$2b$12$5JZ0BwIygV5sK5cfWbNw5u2HgM5OlPO8ByPAm553tEFRMwwgH0fxW', 'PETUGAS_STOK', '084444444444', 1, NOW(), NOW()),
('cmtlqa1rv0004b3srw1ixxuii', 'Pelanggan Demo', 'pelanggan@kopimahasiswa.com', '$2b$12$5JZ0BwIygV5sK5cfWbNw5u2HgM5OlPO8ByPAm553tEFRMwwgH0fxW', 'PELANGGAN', '085555555555', 1, NOW(), NOW());

-- --------------------------------------------------------
-- 2. Tabel accounts (NextAuth OAuth)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `accounts`;
CREATE TABLE `accounts` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `type` VARCHAR(191) NOT NULL,
  `provider` VARCHAR(191) NOT NULL,
  `providerAccountId` VARCHAR(191) NOT NULL,
  `refresh_token` TEXT DEFAULT NULL,
  `access_token` TEXT DEFAULT NULL,
  `expires_at` INT DEFAULT NULL,
  `token_type` VARCHAR(191) DEFAULT NULL,
  `scope` VARCHAR(191) DEFAULT NULL,
  `id_token` TEXT DEFAULT NULL,
  `session_state` VARCHAR(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `accounts_provider_providerAccountId_key` (`provider`, `providerAccountId`),
  KEY `accounts_userId_fkey` (`userId`),
  CONSTRAINT `accounts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 3. Tabel sessions & verification_tokens
-- --------------------------------------------------------
DROP TABLE IF EXISTS `sessions`;
CREATE TABLE `sessions` (
  `id` VARCHAR(191) NOT NULL,
  `sessionToken` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `expires` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sessions_sessionToken_key` (`sessionToken`),
  KEY `sessions_userId_fkey` (`userId`),
  CONSTRAINT `sessions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `verification_tokens`;
CREATE TABLE `verification_tokens` (
  `identifier` VARCHAR(191) NOT NULL,
  `token` VARCHAR(191) NOT NULL,
  `expires` DATETIME(3) NOT NULL,
  UNIQUE KEY `verification_tokens_token_key` (`token`),
  UNIQUE KEY `verification_tokens_identifier_token_key` (`identifier`, `token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 4. Tabel category (Kategori Menu)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `Category`;
CREATE TABLE `Category` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Category_slug_key` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `Category` (`id`, `name`, `slug`, `createdAt`, `updatedAt`) VALUES
('cmtlqa1s10005b3sr8r86o2aw', 'Espresso', 'espresso', NOW(), NOW()),
('cmtlqa1s10006b3srh7ps1nxb', 'Latte', 'latte', NOW(), NOW()),
('cmtlqa1s10007b3srlxdde0rd', 'Cold Brew', 'cold-brew', NOW(), NOW());

-- --------------------------------------------------------
-- 5. Tabel product (Daftar Menu Kopi & Minuman)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `Product`;
CREATE TABLE `Product` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `price` DOUBLE NOT NULL,
  `imageUrl` VARCHAR(191) DEFAULT NULL,
  `active` BOOLEAN NOT NULL DEFAULT TRUE,
  `categoryId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Product_categoryId_fkey` (`categoryId`),
  CONSTRAINT `Product_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `Product` (`id`, `name`, `description`, `price`, `imageUrl`, `active`, `categoryId`, `createdAt`, `updatedAt`) VALUES
('cmtlqa1ty000hb3srlbhbnn99', 'Espresso Classic', 'Shot espresso kuat dengan rasa khas Arabika.', 25000, NULL, 1, 'cmtlqa1s10005b3sr8r86o2aw', NOW(), NOW()),
('cmtlqa1ty000ib3srk27x1fkn', 'Cold Brew Original', 'Cold brew 100% kopi Arabika, disajikan dingin.', 30000, NULL, 1, 'cmtlqa1s10007b3srlxdde0rd', NOW(), NOW()),
('cmtlqa1ty000jb3srjon2v8zl', 'Vanilla Latte', 'Latte creamy dengan sirup vanilla.', 35000, NULL, 1, 'cmtlqa1s10006b3srh7ps1nxb', NOW(), NOW());

-- --------------------------------------------------------
-- 6. Tabel ingredient (Bahan Baku Gudang)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `Ingredient`;
CREATE TABLE `Ingredient` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `unit` VARCHAR(191) NOT NULL,
  `costPerUnit` DOUBLE NOT NULL,
  `stock` DOUBLE NOT NULL DEFAULT 0,
  `minStock` DOUBLE NOT NULL DEFAULT 0,
  `averageCost` DOUBLE NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `Ingredient` (`id`, `name`, `unit`, `costPerUnit`, `stock`, `minStock`, `averageCost`, `createdAt`, `updatedAt`) VALUES
('cmtlqa1s70008b3srh88k2om5', 'Gula Pasir', 'kg', 8, 100, 20, 8, NOW(), NOW()),
('cmtlqa1s90009b3srlmg7jx9o', 'Susu Full Cream', 'liter', 15, 200, 30, 15, NOW(), NOW()),
('cmtlqa1sa000bb3sr7pv5kgrr', 'Syrup Vanilla', 'liter', 30, 40, 5, 30, NOW(), NOW()),
('cmtlqa1s9000ab3srbrjg9q44', 'Biji Kopi Arabika', 'kg', 120, 50, 10, 120, NOW(), NOW());

-- --------------------------------------------------------
-- 7. Tabel supplier (Pemasok Bahan Baku)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `Supplier`;
CREATE TABLE `Supplier` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `contactInfo` VARCHAR(191) DEFAULT NULL,
  `address` VARCHAR(191) DEFAULT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `Supplier` (`id`, `name`, `contactInfo`, `address`, `createdAt`, `updatedAt`) VALUES
('cmtlqa1tu000cb3srbqu2t3il', 'Supplier Kopi Prima', '08123456789', 'Jl. Kopi No.1', NOW(), NOW()),
('cmtlqa1tu000db3sryc5qb1a0', 'Supplier Susu Sehat', '08234567890', 'Jl. Susu No.2', NOW(), NOW());

-- --------------------------------------------------------
-- 8. Tabel productrecipe (Resep Produk)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `ProductRecipe`;
CREATE TABLE `ProductRecipe` (
  `id` VARCHAR(191) NOT NULL,
  `productId` VARCHAR(191) NOT NULL,
  `ingredientId` VARCHAR(191) NOT NULL,
  `quantity` DOUBLE NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ProductRecipe_productId_ingredientId_key` (`productId`, `ingredientId`),
  KEY `ProductRecipe_ingredientId_fkey` (`ingredientId`),
  CONSTRAINT `ProductRecipe_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ProductRecipe_ingredientId_fkey` FOREIGN KEY (`ingredientId`) REFERENCES `Ingredient` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `ProductRecipe` (`id`, `productId`, `ingredientId`, `quantity`) VALUES
('cmtlqa1ui000nb3srmv8t52eu', 'cmtlqa1ty000jb3srjon2v8zl', 'cmtlqa1sa000bb3sr7pv5kgrr', 0.02),
('cmtlqa1uk000tb3srmnk9lpy9', 'cmtlqa1ty000hb3srlbhbnn99', 'cmtlqa1s9000ab3srbrjg9q44', 0.02),
('cmtlqa1ui000rb3srzmvp3ijn', 'cmtlqa1ty000ib3srk27x1fkn', 'cmtlqa1s9000ab3srbrjg9q44', 0.03),
('cmtlqa1ui000pb3srcj2gdsis', 'cmtlqa1ty000jb3srjon2v8zl', 'cmtlqa1s9000ab3srbrjg9q44', 0.015),
('cmtlqa1ui000ob3sraid3chtt', 'cmtlqa1ty000jb3srjon2v8zl', 'cmtlqa1s90009b3srlmg7jx9o', 0.15);

-- --------------------------------------------------------
-- 9. Tabel promotion & promotionproduct (Promo & Diskon)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `PromotionProduct`;
DROP TABLE IF EXISTS `Promotion`;

CREATE TABLE `Promotion` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `type` VARCHAR(191) NOT NULL,
  `value` DOUBLE NOT NULL,
  `startDate` DATETIME(3) NOT NULL,
  `endDate` DATETIME(3) NOT NULL,
  `active` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `PromotionProduct` (
  `id` VARCHAR(191) NOT NULL,
  `promotionId` VARCHAR(191) NOT NULL,
  `productId` VARCHAR(191) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `PromotionProduct_promotionId_productId_key` (`promotionId`, `productId`),
  KEY `PromotionProduct_productId_fkey` (`productId`),
  CONSTRAINT `PromotionProduct_promotionId_fkey` FOREIGN KEY (`promotionId`) REFERENCES `Promotion` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `PromotionProduct_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `Promotion` (`id`, `name`, `type`, `value`, `startDate`, `endDate`, `active`, `createdAt`, `updatedAt`) VALUES
('cmtlqa1vk000ub3srtc1xv6dh', 'Promo Diskon 10% Latte', 'PERCENTAGE', 10, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 1, NOW(), NOW());

INSERT INTO `PromotionProduct` (`id`, `promotionId`, `productId`) VALUES
('cmtlqa1vn000wb3srjhig48at', 'cmtlqa1vk000ub3srtc1xv6dh', 'cmtlqa1ty000jb3srjon2v8zl');

-- --------------------------------------------------------
-- 10. Tabel schedules (Jam Operasional Kedai)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `schedules`;
CREATE TABLE `schedules` (
  `id` VARCHAR(191) NOT NULL,
  `hari` VARCHAR(191) NOT NULL,
  `jamBuka` VARCHAR(191) NOT NULL,
  `jamTutup` VARCHAR(191) NOT NULL,
  `shiftKasir` VARCHAR(191) DEFAULT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `schedules` (`id`, `hari`, `jamBuka`, `jamTutup`, `shiftKasir`, `createdAt`, `updatedAt`) VALUES
('sch-01', 'Senin - Jumat', '08:00', '23:00', 'Pagi & Malam', NOW(), NOW()),
('sch-02', 'Sabtu - Minggu', '09:00', '00:00', 'Full Day', NOW(), NOW());

-- --------------------------------------------------------
-- 11. Tabel order & orderitem & payment
-- --------------------------------------------------------
DROP TABLE IF EXISTS `Payment`;
DROP TABLE IF EXISTS `OrderItem`;
DROP TABLE IF EXISTS `Order`;

CREATE TABLE `Order` (
  `id` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) DEFAULT NULL,
  `kasirId` VARCHAR(191) DEFAULT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `totalAmount` DOUBLE NOT NULL DEFAULT 0,
  `discountAmount` DOUBLE NOT NULL DEFAULT 0,
  `stockAdjusted` BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Order_code_key` (`code`),
  KEY `Order_userId_fkey` (`userId`),
  KEY `Order_kasirId_fkey` (`kasirId`),
  CONSTRAINT `Order_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Order_kasirId_fkey` FOREIGN KEY (`kasirId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `OrderItem` (
  `id` VARCHAR(191) NOT NULL,
  `orderId` VARCHAR(191) NOT NULL,
  `productId` VARCHAR(191) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `note` VARCHAR(191) DEFAULT NULL,
  `unitPrice` DOUBLE NOT NULL,
  `discount` DOUBLE NOT NULL DEFAULT 0,
  `subtotal` DOUBLE NOT NULL,
  PRIMARY KEY (`id`),
  KEY `OrderItem_orderId_fkey` (`orderId`),
  KEY `OrderItem_productId_fkey` (`productId`),
  CONSTRAINT `OrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `OrderItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Payment` (
  `id` VARCHAR(191) NOT NULL,
  `method` VARCHAR(191) NOT NULL,
  `amountPaid` DOUBLE NOT NULL,
  `changeGiven` DOUBLE NOT NULL DEFAULT 0,
  `transactionId` VARCHAR(191) DEFAULT NULL,
  `paidAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `orderId` VARCHAR(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Payment_orderId_key` (`orderId`),
  CONSTRAINT `Payment_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 12. Tabel Event & Booking
-- --------------------------------------------------------
DROP TABLE IF EXISTS `Booking`;
DROP TABLE IF EXISTS `Event`;

CREATE TABLE `Event` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `date` DATETIME(3) NOT NULL,
  `time` VARCHAR(191) NOT NULL,
  `capacity` INT NOT NULL,
  `price` DOUBLE NOT NULL DEFAULT 0,
  `imageUrl` VARCHAR(191) DEFAULT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Booking` (
  `id` VARCHAR(191) NOT NULL,
  `eventId` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) DEFAULT NULL,
  `seats` INT NOT NULL DEFAULT 1,
  `totalAmount` DOUBLE NOT NULL DEFAULT 0,
  `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Booking_eventId_fkey` (`eventId`),
  KEY `Booking_userId_fkey` (`userId`),
  CONSTRAINT `Booking_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Booking_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 13. Tabel Review
-- --------------------------------------------------------
DROP TABLE IF EXISTS `Review`;
CREATE TABLE `Review` (
  `id` VARCHAR(191) NOT NULL,
  `productId` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `rating` INT NOT NULL DEFAULT 5,
  `comment` TEXT DEFAULT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Review_productId_fkey` (`productId`),
  KEY `Review_userId_fkey` (`userId`),
  CONSTRAINT `Review_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Review_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 14. Tabel PurchaseOrder, PurchaseOrderItem, GoodsReceipt
-- --------------------------------------------------------
DROP TABLE IF EXISTS `GoodsReceiptItem`;
DROP TABLE IF EXISTS `GoodsReceipt`;
DROP TABLE IF EXISTS `PurchaseOrderItem`;
DROP TABLE IF EXISTS `PurchaseOrder`;

CREATE TABLE `PurchaseOrder` (
  `id` VARCHAR(191) NOT NULL,
  `supplierId` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `expectedAt` DATETIME(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `PurchaseOrder_code_key` (`code`),
  KEY `PurchaseOrder_supplierId_fkey` (`supplierId`),
  CONSTRAINT `PurchaseOrder_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `Supplier` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `PurchaseOrderItem` (
  `id` VARCHAR(191) NOT NULL,
  `purchaseOrderId` VARCHAR(191) NOT NULL,
  `ingredientId` VARCHAR(191) NOT NULL,
  `quantity` DOUBLE NOT NULL,
  `unitCost` DOUBLE NOT NULL,
  `totalCost` DOUBLE NOT NULL,
  PRIMARY KEY (`id`),
  KEY `PurchaseOrderItem_purchaseOrderId_fkey` (`purchaseOrderId`),
  KEY `PurchaseOrderItem_ingredientId_fkey` (`ingredientId`),
  CONSTRAINT `PurchaseOrderItem_purchaseOrderId_fkey` FOREIGN KEY (`purchaseOrderId`) REFERENCES `PurchaseOrder` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `PurchaseOrderItem_ingredientId_fkey` FOREIGN KEY (`ingredientId`) REFERENCES `Ingredient` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `GoodsReceipt` (
  `id` VARCHAR(191) NOT NULL,
  `purchaseOrderId` VARCHAR(191) NOT NULL,
  `receiptNumber` VARCHAR(191) NOT NULL,
  `receivedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `GoodsReceipt_receiptNumber_key` (`receiptNumber`),
  KEY `GoodsReceipt_purchaseOrderId_fkey` (`purchaseOrderId`),
  CONSTRAINT `GoodsReceipt_purchaseOrderId_fkey` FOREIGN KEY (`purchaseOrderId`) REFERENCES `PurchaseOrder` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `GoodsReceiptItem` (
  `id` VARCHAR(191) NOT NULL,
  `goodsReceiptId` VARCHAR(191) NOT NULL,
  `purchaseOrderItemId` VARCHAR(191) NOT NULL,
  `quantityReceived` DOUBLE NOT NULL,
  PRIMARY KEY (`id`),
  KEY `GoodsReceiptItem_goodsReceiptId_fkey` (`goodsReceiptId`),
  KEY `GoodsReceiptItem_purchaseOrderItemId_fkey` (`purchaseOrderItemId`),
  CONSTRAINT `GoodsReceiptItem_goodsReceiptId_fkey` FOREIGN KEY (`goodsReceiptId`) REFERENCES `GoodsReceipt` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `GoodsReceiptItem_purchaseOrderItemId_fkey` FOREIGN KEY (`purchaseOrderItemId`) REFERENCES `PurchaseOrderItem` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 15. Tabel StockMovement, Report, Reward
-- --------------------------------------------------------
DROP TABLE IF EXISTS `StockMovement`;
CREATE TABLE `StockMovement` (
  `id` VARCHAR(191) NOT NULL,
  `ingredientId` VARCHAR(191) NOT NULL,
  `type` VARCHAR(191) NOT NULL,
  `quantity` DOUBLE NOT NULL,
  `relatedId` VARCHAR(191) DEFAULT NULL,
  `description` VARCHAR(191) DEFAULT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `StockMovement_ingredientId_fkey` (`ingredientId`),
  CONSTRAINT `StockMovement_ingredientId_fkey` FOREIGN KEY (`ingredientId`) REFERENCES `Ingredient` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `reports`;
CREATE TABLE `reports` (
  `id` VARCHAR(191) NOT NULL,
  `tanggal` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `totalPesanan` INT NOT NULL DEFAULT 0,
  `totalPendapatan` DOUBLE NOT NULL DEFAULT 0,
  `pelangganBaru` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `rewards`;
CREATE TABLE `rewards` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `poin` INT NOT NULL DEFAULT 0,
  `tanggalUpdate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `rewards_userId_key` (`userId`),
  CONSTRAINT `rewards_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ========================================================
-- SELESAI! Seluruh tabel & data telah berhasil dibuat di MySQL Laragon.
-- ========================================================
