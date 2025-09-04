-- AlterTable
ALTER TABLE "User" ADD COLUMN     "email_verification_token" TEXT,
ADD COLUMN     "email_verification_token_expires_at" TIMESTAMP(3),
ADD COLUMN     "email_verified" BOOLEAN DEFAULT false;
