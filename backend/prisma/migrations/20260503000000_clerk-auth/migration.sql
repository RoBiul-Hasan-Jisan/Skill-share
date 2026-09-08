-- Drop RefreshToken table and its foreign key
DROP TABLE IF EXISTS "RefreshToken";

-- Add clerkId column to User
ALTER TABLE "User" ADD COLUMN "clerkId" TEXT;

-- Make clerkId unique
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- Drop passwordHash column
ALTER TABLE "User" DROP COLUMN "passwordHash";
