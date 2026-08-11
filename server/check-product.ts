
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const productId = 'dcf84a05-9982-464c-b673-ac3974a99ec5';

async function main() {
    console.log(`Checking for product ID: ${productId}`);
    const product = await prisma.product.findUnique({
        where: { id: productId }
    });

    if (product) {
        console.log('Product found:', product);
    } else {
        console.log('Product NOT found in database.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
