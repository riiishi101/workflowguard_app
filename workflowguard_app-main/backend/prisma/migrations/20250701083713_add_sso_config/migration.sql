-- CreateTable
CREATE TABLE "SsoConfig" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "metadata" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SsoConfig_pkey" PRIMARY KEY ("id")
);
