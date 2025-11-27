import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Checking DB content...')

    const tenants = await prisma.tenant.findMany()
    console.log(`Tenants: ${tenants.length}`)
    tenants.forEach(t => console.log(` - ${t.name} (${t.id})`))

    const projects = await prisma.project.findMany()
    console.log(`Projects: ${projects.length}`)
    projects.forEach(p => console.log(` - ${p.name} (${p.slug})`))

    const products = await prisma.product.findMany()
    console.log(`Products: ${products.length}`)
    products.forEach(p => console.log(` - ${p.name} (${p.code})`))

    const prices = await prisma.price.findMany()
    console.log(`Prices: ${prices.length}`)
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
