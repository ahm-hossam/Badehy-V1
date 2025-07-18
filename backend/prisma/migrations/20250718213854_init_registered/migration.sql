-- CreateTable
CREATE TABLE "Registered" (
    "id" SERIAL NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "countryName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,

    CONSTRAINT "Registered_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Registered_email_key" ON "Registered"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Registered_phone_key" ON "Registered"("phone");
