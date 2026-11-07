import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import crypto from 'crypto';

// Lebanese phone validation: supports mobile (03, 70, 71, 76, 78, 79, 81) & landline (01, 04, 05, 06, 07, 08, 09)
// Accepts formats: +961 70 123456, 96170123456, 03123456, 70123456
const lebanesePhoneRegex = /^(?:\+?961|00961|0)?(?:[1-9]|70|71|76|78|79|81)\d{6}$/;

const OrderItemSchema = z.object({
  id: z.string().min(1, "Product ID is required").max(100),
  name: z.string().max(200).optional(),
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(50, "Maximum 50 items per product"),
  size: z.string().max(50).nullable().optional(),
  image: z.string().max(1000).nullable().optional(),
});

const CreateOrderSchema = z.object({
  idempotencyKey: z.string().uuid("Invalid idempotency key format").optional(),
  firstName: z.string().trim().min(1, "First name is required").max(60, "First name too long"),
  lastName: z.string().trim().min(1, "Last name is required").max(60, "Last name too long"),
  email: z.string().trim().email("Invalid email address").max(120).or(z.literal("")).optional(),
  phone: z.string().trim().refine((val) => {
    const cleaned = val.replace(/[\s\-().]/g, '');
    return lebanesePhoneRegex.test(cleaned);
  }, {
    message: "يرجى إدخال رقم هاتف لبناني صحيح (مثال: 70123456 أو 03123456)"
  }),
  address: z.string().trim().min(3, "Delivery address is too short").max(300, "Address is too long"),
  city: z.string().trim().min(1, "City is required").max(80),
  region: z.string().trim().max(100).optional().default(""),
  items: z.array(OrderItemSchema).min(1, "At least one item is required in the cart").max(30, "Too many distinct items"),
});

function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].trim();
  }
  return req.socket?.remoteAddress || '127.0.0.1';
}

function normalizePhone(rawPhone: string): string {
  let cleaned = rawPhone.replace(/[\s\-().]/g, '');
  if (cleaned.startsWith('+961')) cleaned = cleaned.slice(4);
  else if (cleaned.startsWith('00961')) cleaned = cleaned.slice(5);
  else if (cleaned.startsWith('961')) cleaned = cleaned.slice(3);
  else if (cleaned.startsWith('0')) cleaned = cleaned.slice(1);
  return '961' + cleaned;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Disallow non-POST methods
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 1. Initialize Supabase with Service Role Key (Secure Backend Client)
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || (!serviceRoleKey && !anonKey)) {
    console.error('[CRITICAL] Missing Supabase server credentials');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Prefer serviceRoleKey to bypass RLS, fallback to anonKey if serviceRoleKey is not yet configured in Vercel
  const supabase = createClient(supabaseUrl, serviceRoleKey || anonKey!, {
    auth: { persistSession: false }
  });

  try {
    // 2. Strict Input Validation via Zod
    const validationResult = CreateOrderSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errorMsg = validationResult.error.errors.map(e => e.message).join(' | ');
      return res.status(400).json({ error: errorMsg, details: validationResult.error.format() });
    }

    const payload = validationResult.data;
    const clientIp = getClientIp(req);
    const normalizedPhone = normalizePhone(payload.phone);

    // Create a privacy-preserving SHA-256 identifier hash of (Phone + IP prefix)
    const identifierHash = crypto.createHash('sha256').update(`${normalizedPhone}:${clientIp}`).digest('hex');

    // 3. Centralized Database-Backed Atomic Rate Limiting
    // Rule A: Cooldown check (Minimum 30 seconds since last order by phone or IP hash)
    // Rule B: Maximum 3 orders per 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000).toISOString();

    const { data: recentOrders, error: rateLimitError } = await supabase
      .from('orders')
      .select('id, created_at, phone, total')
      .or(`phone.eq.${payload.phone},phone.eq.${normalizedPhone},client_identifier_hash.eq.${identifierHash}`)
      .gte('created_at', tenMinutesAgo)
      .order('created_at', { ascending: false });

    if (!rateLimitError && recentOrders && recentOrders.length > 0) {
      const lastOrderTime = new Date(recentOrders[0].created_at).getTime();
      const timeSinceLastOrder = Date.now() - lastOrderTime;

      // 30-Second Cooldown Enforcement
      if (timeSinceLastOrder < 30 * 1000) {
        const retryAfterSeconds = Math.ceil((30 * 1000 - timeSinceLastOrder) / 1000);
        res.setHeader('Retry-After', String(retryAfterSeconds));
        return res.status(429).json({
          error: `يرجى الانتظار ${retryAfterSeconds} ثانية قبل إرسال طلب جديد.`,
          retryAfter: retryAfterSeconds
        });
      }

      // 3 Orders per 10 Minutes Enforcement
      if (recentOrders.length >= 3) {
        const oldestInWindow = new Date(recentOrders[recentOrders.length - 1].created_at).getTime();
        const retryAfterSeconds = Math.ceil((10 * 60 * 1000 - (Date.now() - oldestInWindow)) / 1000);
        res.setHeader('Retry-After', String(Math.max(30, retryAfterSeconds)));
        return res.status(429).json({
          error: 'لقد قمت بإرسال عدة طلبات مؤخراً. يرجى الانتظار بضع دقائق أو التواصل معنا عبر واتساب.',
          retryAfter: retryAfterSeconds
        });
      }
    }

    // 4. Duplicate Order & Idempotency Key Handling
    const idempotencyKey = payload.idempotencyKey || req.headers['idempotency-key'] as string || null;

    if (idempotencyKey) {
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('*')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle();

      if (existingOrder) {
        // Return existing order without creating a duplicate
        return res.status(200).json({
          success: true,
          message: 'Order already received',
          orderId: existingOrder.id,
          total: existingOrder.total,
          isDuplicate: true
        });
      }
    }

    // 5. Authoritative Server-Side Price & Total Calculation
    // Never trust client prices! Fetch current product prices directly from database
    const itemIds = payload.items.map(i => i.id);
    const { data: dbProducts, error: prodError } = await supabase
      .from('products')
      .select('id, name, price, stock, image')
      .in('id', itemIds);

    if (prodError || !dbProducts || dbProducts.length === 0) {
      return res.status(400).json({ error: 'تعذر التحقق من منتجات الطلب. يرجى المحاولة لاحقاً.' });
    }

    const productMap = new Map(dbProducts.map(p => [p.id, p]));
    let calculatedSubtotal = 0;
    const validatedItems = [];

    for (const item of payload.items) {
      const dbProd = productMap.get(item.id);
      if (!dbProd) {
        return res.status(400).json({ error: `المنتج ${item.name || item.id} غير متوفر حالياً.` });
      }

      const verifiedPrice = Number(dbProd.price);
      if (isNaN(verifiedPrice) || verifiedPrice < 0) {
        return res.status(500).json({ error: 'خطأ في تسعيرة المنتج داخل النظام.' });
      }

      calculatedSubtotal += verifiedPrice * item.quantity;
      validatedItems.push({
        id: dbProd.id,
        name: dbProd.name,
        price: verifiedPrice,
        quantity: item.quantity,
        size: item.size || null,
        image: dbProd.image || item.image || null
      });
    }

    // Official business shipping rules: Free shipping over $200, otherwise $15
    const shipping = calculatedSubtotal > 200 ? 0 : 15;
    const authoritativeTotal = Math.round((calculatedSubtotal + shipping) * 100) / 100;

    // 6. Atomic Order Record Creation
    const orderRecord: Record<string, unknown> = {
      first_name: payload.firstName,
      last_name: payload.lastName,
      email: payload.email || 'customer@sharqiyahh.com',
      phone: payload.phone,
      address: payload.address,
      city: payload.city,
      region: payload.region || '',
      total: authoritativeTotal,
      items: validatedItems,
      client_identifier_hash: identifierHash
    };

    if (idempotencyKey) {
      orderRecord.idempotency_key = idempotencyKey;
    }

    const { data: newOrder, error: insertError } = await supabase
      .from('orders')
      .insert([orderRecord])
      .select()
      .single();

    if (insertError) {
      // Check for concurrent race condition on duplicate idempotency key
      if (insertError.code === '23505' && idempotencyKey) {
        const { data: duplicate } = await supabase
          .from('orders')
          .select('*')
          .eq('idempotency_key', idempotencyKey)
          .maybeSingle();

        if (duplicate) {
          return res.status(200).json({
            success: true,
            orderId: duplicate.id,
            total: duplicate.total,
            isDuplicate: true
          });
        }
      }

      console.error('[Order Insert Error]:', insertError);
      return res.status(500).json({ error: 'فشل في حفظ الطلب بقاعدة البيانات. يرجى المحاولة مرة أخرى.' });
    }

    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      orderId: newOrder.id,
      total: authoritativeTotal
    });

  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Unhandled Order Error]:', errorMsg);
    return res.status(500).json({ error: 'حدث خطأ غير متوقع أثناء معالجة الطلب.' });
  }
}
