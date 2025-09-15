-- CreateTable
CREATE TABLE "public"."NflGameData" (
    "id" TEXT NOT NULL,
    "gameId" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NflGameData_pkey" PRIMARY KEY ("id")
);
