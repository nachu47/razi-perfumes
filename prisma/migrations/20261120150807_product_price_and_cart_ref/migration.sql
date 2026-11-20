-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "sourceCartId" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "priceFromKWD" DECIMAL(12,3) NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Product_priceFromKWD_idx" ON "Product"("priceFromKWD");
