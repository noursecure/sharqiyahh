import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    const sourceDir = 'C:\\Users\\N\\Desktop\\posts';
    const uploadsDir = path.join(__dirname, 'uploads');
    
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const files = fs.readdirSync(sourceDir);
    
    for (const file of files) {
        if (!file.endsWith('.webp')) continue;

        // Copy file
        const sourcePath = path.join(sourceDir, file);
        const destPath = path.join(uploadsDir, file);
        
        fs.copyFileSync(sourcePath, destPath);
        console.log(`Copied ${file} to uploads/`);

        // Generate random price between 50 and 500
        const price = Math.floor(Math.random() * (500 - 50 + 1)) + 50;
        const name = file.replace('.webp', '');

        // Add to DB
        await prisma.product.create({
            data: {
                name: `Test Product - ${name}`,
                nameAr: `منتج تجريبي - ${name}`,
                price: price,
                image: `/uploads/${file}`,
                category: 'Tops', // random category
                description: 'This is a test product generated automatically.',
                descriptionAr: 'هذا منتج تجريبي تم إنشاؤه تلقائياً.',
                stock: 10,
                colors: 'Red,Blue',
                images: ''
            }
        });
        
        console.log(`Inserted product for ${file} with price ${price}`);
    }
    
    console.log('Done inserting products.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
