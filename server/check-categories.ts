
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCategories() {
    console.log("Checking Categories...");
    try {
        const products = await prisma.product.findMany({ select: { category: true } });
        const distinctCategories = [...new Set(products.map(p => p.category))];
        console.log("Distinct Product Categories:", distinctCategories);

        const categories = await prisma.category.findMany();
        console.log("Defined Categories:", categories.map(c => c.name));
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

checkCategories();
