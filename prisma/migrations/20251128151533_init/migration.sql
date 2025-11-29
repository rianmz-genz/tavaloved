-- CreateEnum
CREATE TYPE "StatusItem" AS ENUM ('AVAILABLE', 'ON_LOAN', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "StatusLoan" AS ENUM ('REQUESTED', 'APPROVED', 'RETURNED', 'REJECTED');

-- CreateEnum
CREATE TYPE "StatusCampaign" AS ENUM ('ACTIVE', 'GOAL_MET', 'CLOSED');

-- CreateEnum
CREATE TYPE "StatusTransaction" AS ENUM ('SUCCESS', 'PENDING', 'FAILED');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "nomor_hp" TEXT,
    "total_buku_ditamatkan" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_titles" (
    "id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "penulis" TEXT NOT NULL,
    "synopsis" TEXT,
    "kategori" TEXT NOT NULL,
    "avg_rating" DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    CONSTRAINT "book_titles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_items" (
    "id" TEXT NOT NULL,
    "barcode_sn" TEXT,
    "kondisi" TEXT NOT NULL,
    "status_item" "StatusItem" NOT NULL DEFAULT 'AVAILABLE',
    "fk_id_judul" TEXT NOT NULL,
    "fk_id_owner" TEXT NOT NULL,

    CONSTRAINT "book_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loans" (
    "id" TEXT NOT NULL,
    "tanggal_pinjam" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tanggal_kembali_seharusnya" TIMESTAMP(3) NOT NULL,
    "tanggal_kembali_aktual" TIMESTAMP(3),
    "status_loan" "StatusLoan" NOT NULL DEFAULT 'REQUESTED',
    "fk_id_user" TEXT NOT NULL,
    "fk_id_item" TEXT NOT NULL,

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "ulasan" VARCHAR(255) NOT NULL,
    "rating" INTEGER NOT NULL,
    "tanggal_ulasan" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fk_id_user" TEXT NOT NULL,
    "fk_id_judul" TEXT NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dana_campaigns" (
    "id" TEXT NOT NULL,
    "judul_campaign" TEXT NOT NULL,
    "target_dana" DECIMAL(15,2) NOT NULL,
    "dana_terkumpul" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "deskripsi_penggunaan" TEXT NOT NULL,
    "tanggal_mulai" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tanggal_akhir" TIMESTAMP(3),
    "status_campaign" "StatusCampaign" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "dana_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dana_contributions" (
    "id" TEXT NOT NULL,
    "jumlah_dana" DECIMAL(10,2) NOT NULL,
    "tanggal_kontribusi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nama_anonim" TEXT,
    "status_transaksi" "StatusTransaction" NOT NULL DEFAULT 'SUCCESS',
    "fk_id_campaign" TEXT NOT NULL,
    "fk_id_user" TEXT,

    CONSTRAINT "dana_contributions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_nomor_hp_key" ON "users"("nomor_hp");

-- CreateIndex
CREATE UNIQUE INDEX "book_titles_judul_key" ON "book_titles"("judul");

-- CreateIndex
CREATE UNIQUE INDEX "book_items_barcode_sn_key" ON "book_items"("barcode_sn");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_fk_id_user_fk_id_judul_key" ON "reviews"("fk_id_user", "fk_id_judul");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_items" ADD CONSTRAINT "book_items_fk_id_judul_fkey" FOREIGN KEY ("fk_id_judul") REFERENCES "book_titles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_items" ADD CONSTRAINT "book_items_fk_id_owner_fkey" FOREIGN KEY ("fk_id_owner") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_fk_id_user_fkey" FOREIGN KEY ("fk_id_user") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_fk_id_item_fkey" FOREIGN KEY ("fk_id_item") REFERENCES "book_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_fk_id_user_fkey" FOREIGN KEY ("fk_id_user") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_fk_id_judul_fkey" FOREIGN KEY ("fk_id_judul") REFERENCES "book_titles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dana_contributions" ADD CONSTRAINT "dana_contributions_fk_id_campaign_fkey" FOREIGN KEY ("fk_id_campaign") REFERENCES "dana_campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dana_contributions" ADD CONSTRAINT "dana_contributions_fk_id_user_fkey" FOREIGN KEY ("fk_id_user") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
