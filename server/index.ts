import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const app = express();
const prisma = new PrismaClient();
const PORT = 3000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Configure Multer
const storage = multer.diskStorage({
    destination: (req: any, file: any, cb: any) => {
        cb(null, 'uploads/');
    },
    filename: (req: any, file: any, cb: any) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage });

// Upload Endpoint
app.post('/api/upload', upload.single('image'), (req: any, res) => {
    try {
        if (!req.file) {
            console.error('Upload failed: No file provided');
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const imageUrl = `/uploads/${req.file.filename}`;
        console.log(`File uploaded successfully: ${imageUrl}`);
        res.json({ url: imageUrl });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Internal server error during upload' });
    }
});

// Get all products
app.get('/api/products', async (req, res) => {
    try {
        const { category, search, minPrice, maxPrice } = req.query;
        const where: any = {};

        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) where.price.gte = parseFloat(String(minPrice));
            if (maxPrice) where.price.lte = parseFloat(String(maxPrice));
        }

        if (category && category !== 'all') {
            // Manual capitalization to match "Tops", "Dresses", etc.
            const categoryStr = String(category);
            const formattedCategory = categoryStr.charAt(0).toUpperCase() + categoryStr.slice(1).toLowerCase();

            where.category = {
                equals: formattedCategory
            };
        }

        if (search) {
            const query = String(search).toLowerCase();
            where.OR = [
                { name: { contains: query } },
                { nameAr: { contains: query } },
                { category: { contains: query } }
            ];
        }

        const products = await prisma.product.findMany({ where });
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching products' });
    }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const product = await prisma.product.findUnique({ where: { id } });
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ error: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error fetching product' });
    }
});

// Create product (Admin)
app.post('/api/products', async (req, res) => {
    try {
        const product = await prisma.product.create({
            data: req.body,
        });
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: 'Error creating product' });
    }
});

// Update product
app.put('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const product = await prisma.product.update({
            where: { id },
            data: req.body,
        });
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: 'Error updating product' });
    }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.product.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting product' });
    }
});

// --- Categories API ---

// Get all categories
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await prisma.category.findMany();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching categories' });
    }
});

// Create category
app.post('/api/categories', async (req, res) => {
    try {
        const category = await prisma.category.create({
            data: req.body,
        });
        res.json(category);
    } catch (error) {
        res.status(500).json({ error: 'Error creating category' });
    }
});

// Update category
app.put('/api/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const category = await prisma.category.update({
            where: { id },
            data: req.body,
        });
        res.json(category);
    } catch (error) {
        res.status(500).json({ error: 'Error updating category' });
    }
});

// Delete category
app.delete('/api/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.category.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting category' });
    }
});

// --- Orders API ---

// Create Order
app.post('/api/orders', async (req, res) => {
    try {
        const { firstName, lastName, email, phone, address, city, region, items, total } = req.body;

        const order = await prisma.order.create({
            data: {
                firstName,
                lastName,
                email,
                phone,
                address,
                city,
                region,
                total,
                status: 'Pending',
                items: {
                    create: items.map((item: any) => ({
                        productId: item.id,
                        productName: item.name,
                        productImage: item.image,
                        price: parseFloat(item.price),
                        quantity: parseInt(item.quantity)
                    }))
                }
            },
            include: {
                items: true
            }
        });

        res.json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creating order' });
    }
});

// Get All Orders
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            include: {
                items: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching orders' });
    }
});

// Update Order Status
app.put('/api/orders/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const order = await prisma.order.update({
            where: { id },
            data: { status }
        });
        res.json(order);
    } catch (error) {
        res.status(500).json({ error: 'Error updating order status' });
    }
});

// Delete Order
app.delete('/api/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Use transaction to ensure items are deleted before the order
        await prisma.$transaction([
            prisma.orderItem.deleteMany({
                where: { orderId: id }
            }),
            prisma.order.delete({
                where: { id }
            })
        ]);

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error deleting order' });
    }
});

// Admin Login (Mock for minimal setup, robust auth usually requires JWT)
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    // In a real app, verify hash. For now, simple check.
    const admin = await prisma.admin.findUnique({ where: { username } });
    if (admin && admin.password === password) {
        res.json({ success: true, token: 'mock-token' });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// --- Subscribers API ---

app.post('/api/subscribers', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const existing = await prisma.subscriber.findUnique({
            where: { email }
        });

        if (existing) {
            return res.status(400).json({ error: 'Email already subscribed' });
        }

        const subscriber = await prisma.subscriber.create({
            data: { email }
        });
        res.json(subscriber);
    } catch (error) {
        res.status(500).json({ error: 'Error subscribing' });
    }
});

app.get('/api/subscribers', async (req, res) => {
    try {
        const subscribers = await prisma.subscriber.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(subscribers);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching subscribers' });
    }
});

app.delete('/api/subscribers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.subscriber.delete({
            where: { id }
        });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error deleting subscriber' });
    }
});

// --- Settings API ---

app.get('/api/settings', async (req, res) => {
    try {
        const settings = await prisma.setting.findMany();
        const settingsMap = settings.reduce((acc: any, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
        res.json(settingsMap);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching settings' });
    }
});

app.put('/api/settings', async (req, res) => {
    try {
        const updates = req.body;
        const promises = Object.entries(updates).map(([key, value]) => {
            return prisma.setting.upsert({
                where: { key },
                update: { value: String(value) },
                create: { key, value: String(value) }
            });
        });
        await Promise.all(promises);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error updating settings' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
