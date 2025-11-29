-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('MEMBER', 'CONTRIBUTOR', 'ADMIN');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'MEMBER';
