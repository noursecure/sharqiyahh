
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Testing exact match 'Tops':");
    const exact = await prisma.product.findMany({
        where: {
            category: {
                equals: 'Tops'
            }
        }
    });
    console.log(`Found ${exact.length} products with category 'Tops'`);
    if (exact.length > 0) console.log(JSON.stringify(exact[0], null, 2));

    console.log("\nTesting lowercase 'tops' with insensitive mode:");
    const insensitive = await prisma.product.findMany({
        where: {
            category: {
                equals: 'tops',
                mode: 'insensitive'
            }
        }
    });
    console.log(`Found ${insensitive.length} products with category 'tops' (insensitive)`);

    console.log("\nTesting lowercase 'tops' WITHOUT insensitive mode:");
    const regular = await prisma.product.findMany({
        where: {
            category: {
                equals: 'tops'
            }
        }
    });
    console.log(`Found ${regular.length} products with category 'tops' (regular)`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
