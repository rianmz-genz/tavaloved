import "dotenv/config";
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'
import { UserRole } from '../generated/prisma/enums'
const connectionString = `${process.env.DATABASE_URL}`

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({adapter})
async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'tavaloved@vastro.id' },
    update: {},
    create: {
      email: 'tavaloved@vastro.id',
      name: 'Admin',
      role: UserRole.ADMIN
    },
  })
  console.log({admin})
}
main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })