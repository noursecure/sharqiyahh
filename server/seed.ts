import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const products = [
    {
        name: "Elegant Cream Abaya",
        nameAr: "عباية كريمية أنيقة",
        price: 120,
        originalPrice: 150,
        image: "/src/assets/product-1.jpg", // Note: Frontend handles image paths differently, we might need to adjust this or serve static files
        category: "Abayas",
        description: "Crafted from premium fabric with delicate gold embroidery, this elegant cream abaya embodies sophistication and modesty. Perfect for special occasions.",
        descriptionAr: "مصنوعة من قماش فاخر مع تطريز ذهبي رقيق، هذه العباية الكريمية الأنيقة تجسد الرقي والحشمة. مثالية للمناسبات الخاصة."
    },
    {
        name: "Blush Evening Dress",
        nameAr: "فستان سهرة وردي",
        price: 95,
        image: "/src/assets/product-2.jpg",
        category: "Dresses",
        description: "A flowing blush pink evening dress with elegant long sleeves and modest silhouette. Made from soft, breathable fabric.",
        descriptionAr: "فستان سهرة وردي انسيابي مع أكمام طويلة أنيقة وقصة محتشمة. مصنوع من قماش ناعم قابل للتنفس."
    },
    {
        name: "Classic Black Abaya",
        nameAr: "عباية سوداء كلاسيكية",
        price: 110,
        originalPrice: 140,
        image: "/src/assets/product-3.jpg",
        category: "Basics",
        description: "A timeless black abaya with minimal design and luxury fabric. Essential for every modest wardrobe.",
        descriptionAr: "عباية سوداء خالدة بتصميم بسيط وقماش فاخر. ضرورية لكل خزانة محتشمة."
    },
    {
        name: "Modest Beige Shirt",
        nameAr: "قميص بيج محتشم",
        price: 65,
        image: "/src/assets/product-4.jpg",
        category: "Tops",
        description: "Elegant modest shirt with long sleeves and elegant button details. Perfect for casual and semi-formal occasions.",
        descriptionAr: "قميص محتشم أنيق مع أكمام طويلة وتفاصيل أزرار أنيقة. مثالي للمناسبات غير الرسمية وشبه الرسمية."
    },
    {
        name: "Ivory Silk Abaya",
        nameAr: "عباية حرير عاجي",
        price: 135,
        image: "/src/assets/product-1.jpg",
        category: "Abayas",
        description: "Premium silk abaya.",
        descriptionAr: "عباية حرير فاخرة."
    },
    {
        name: "Rose Maxi Dress",
        nameAr: "فستان ماكسي وردي",
        price: 88,
        originalPrice: 110,
        image: "/src/assets/product-2.jpg",
        category: "Dresses",
        description: "Beautiful rose maxi dress.",
        descriptionAr: "فستان ماكسي وردي جميل."
    },
    {
        name: "Charcoal Trousers",
        nameAr: "بنطال فحمي",
        price: 115,
        image: "/src/assets/product-3.jpg",
        category: "Trousers",
        description: "Comfortable charcoal trousers.",
        descriptionAr: "بنطال فحمي مريح."
    },
    {
        name: "Sand Cotton Chemise",
        nameAr: "شيميز قطن رملي",
        price: 58,
        image: "/src/assets/product-4.jpg",
        category: "Chemise",
        description: "Soft cotton chemise.",
        descriptionAr: "شيميز قطن ناعم."
    }
];

async function main() {
    console.log('Seeding database...');
    for (const p of products) {
        await prisma.product.create({ data: p });
    }

    // Categories to seed
    const categories = [
        { name: "Dresses", nameAr: "فساتين", image: "/src/assets/product-2.jpg" },
        { name: "Abayas", nameAr: "عبايات", image: "/src/assets/product-1.jpg" },
        { name: "Tops", nameAr: "بلوزات", image: "/src/assets/product-4.jpg" },
        { name: "Trousers", nameAr: "بناطيل", image: "/src/assets/product-3.jpg" },
        { name: "Chemise", nameAr: "شيميز", image: "/src/assets/product-4.jpg" },
        { name: "Basics", nameAr: "أساسيات", image: "/src/assets/product-3.jpg" },
    ];

    console.log('Seeding categories...');
    for (const c of categories) {
        await prisma.category.upsert({
            where: { name: c.name },
            update: {},
            create: c
        });
    }

    // Create default admin
    // Create or update default admin
    await prisma.admin.upsert({
        where: { username: 'admin' },
        update: { password: 'password123' },
        create: {
            username: 'admin',
            password: 'password123'
        }
    });

    console.log('Database seeded successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
