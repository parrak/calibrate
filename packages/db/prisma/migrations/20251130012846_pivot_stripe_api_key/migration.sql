/*
  Warnings:

  - You are about to drop the column `accessToken` on the `StripeAccount` table. All the data in the column will be lost.
  - You are about to drop the column `refreshToken` on the `StripeAccount` table. All the data in the column will be lost.
  - You are about to drop the column `scope` on the `StripeAccount` table. All the data in the column will be lost.
  - You are about to drop the column `tokenExpiresAt` on the `StripeAccount` table. All the data in the column will be lost.
  - Added the required column `secretKey` to the `StripeAccount` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "StripeAccount" DROP COLUMN "accessToken",
DROP COLUMN "refreshToken",
DROP COLUMN "scope",
DROP COLUMN "tokenExpiresAt",
ADD COLUMN     "secretKey" TEXT NOT NULL,
ALTER COLUMN "stripeAccountId" DROP NOT NULL;
