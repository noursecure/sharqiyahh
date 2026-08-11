
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const inputCategory = 'tops'; // Input from frontend
    console.log(`Input category: '${inputCategory}'`);

    // Mimic the backend fix
    const categoryStr = String(inputCategory);
    const formattedCategory = categoryStr.charAt(0).toUpperCase() + categoryStr.slice(1).toLowerCase();

    console.log(`Formatted category: '${formattedCategory}'`);

    const products = await prisma.product.findMany({
        where: {
            category: {
                equals: formattedCategory
            }
        }
    });

    console.log(`Found ${products.length} products for '${formattedCategory}'`);
    if (products.length > 0) {
        console.log('SUCCESS: Products found!');
        console.log('Sample product:', products[0].name);
    } else {
        console.error('FAILURE: No products found.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
