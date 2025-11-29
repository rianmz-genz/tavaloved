/*
  Warnings:

  - You are about to drop the column `kategori` on the `book_titles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "book_titles" DROP COLUMN "kategori";

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "nama_kategori" TEXT NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_categories" (
    "fk_id_buku" TEXT NOT NULL,
    "fk_id_kategori" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "book_categories_pkey" PRIMARY KEY ("fk_id_buku","fk_id_kategori")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_nama_kategori_key" ON "categories"("nama_kategori");

-- AddForeignKey
ALTER TABLE "book_categories" ADD CONSTRAINT "book_categories_fk_id_buku_fkey" FOREIGN KEY ("fk_id_buku") REFERENCES "book_titles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_categories" ADD CONSTRAINT "book_categories_fk_id_kategori_fkey" FOREIGN KEY ("fk_id_kategori") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
