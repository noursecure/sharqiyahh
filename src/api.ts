import { supabase } from './lib/supabase';
import type { Product, Category, APIProduct } from './types';

// Helper to map DB Product to APIProduct
const mapProduct = (p: any): APIProduct => ({
    id: p.id,
    name: p.name,
    nameAr: p.name_ar,
    price: p.price,
    originalPrice: p.original_price,
    category: p.category_id,
    image: p.image,
    images: p.images,
    description: p.description,
    descriptionAr: p.description_ar,
    stock: p.stock,
    colors: p.colors,
    createdAt: p.created_at,
    updatedAt: p.updated_at
});

export const getProducts = async (category?: string, search?: string, minPrice?: number, maxPrice?: number): Promise<APIProduct[]> => {
    let query = supabase.from('products').select('*').order('created_at', { ascending: false });

    if (category && category !== 'all') {
        query = query.eq('category_id', category);
    }
    
    if (search) {
        query = query.ilike('name', `%${search}%`);
    }

    if (minPrice !== undefined) {
        query = query.gte('price', minPrice);
    }

    if (maxPrice !== undefined) {
        query = query.lte('price', maxPrice);
    }

    const { data, error } = await query;
    if (error) {
        console.error('Error fetching products:', error);
        return [];
    }

    return (data || []).map(mapProduct);
};

export const getProductById = async (id: string): Promise<APIProduct> => {
    const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
    if (error) throw error;
    return mapProduct(data);
};

export const createProduct = async (data: Omit<Product, 'id'>): Promise<APIProduct> => {
    const dbData = {
        name: data.name,
        name_ar: data.nameAr,
        price: data.price,
        original_price: data.originalPrice,
        category_id: data.category || null,
        image: data.image,
        images: data.images,
        description: data.description,
        description_ar: data.descriptionAr,
        stock: data.stock,
        colors: data.colors
    };
    const { data: result, error } = await supabase.from('products').insert([dbData]).select().single();
    if (error) throw error;
    return mapProduct(result);
};

export const updateProduct = async (id: string, data: Partial<Product>): Promise<APIProduct> => {
    const dbData: any = {};
    if (data.name !== undefined) dbData.name = data.name;
    if (data.nameAr !== undefined) dbData.name_ar = data.nameAr;
    if (data.price !== undefined) dbData.price = data.price;
    if (data.originalPrice !== undefined) dbData.original_price = data.originalPrice;
    if (data.category !== undefined) dbData.category_id = data.category || null;
    if (data.image !== undefined) dbData.image = data.image;
    if (data.images !== undefined) dbData.images = data.images;
    if (data.description !== undefined) dbData.description = data.description;
    if (data.descriptionAr !== undefined) dbData.description_ar = data.descriptionAr;
    if (data.stock !== undefined) dbData.stock = data.stock;
    if (data.colors !== undefined) dbData.colors = data.colors;

    const { data: result, error } = await supabase.from('products').update(dbData).eq('id', id).select().single();
    if (error) throw error;
    return mapProduct(result);
};

export const deleteProduct = async (id: string): Promise<{ success: boolean }> => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
};

export const getCategories = async (): Promise<Category[]> => {
    const { data, error } = await supabase.from('categories').select('*');
    if (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
    return data;
};

export const createCategory = async (data: Omit<Category, 'id'>): Promise<Category> => {
    const { data: result, error } = await supabase.from('categories').insert([data]).select().single();
    if (error) throw error;
    return result;
};

export const updateCategory = async (id: string, data: Partial<Category>): Promise<Category> => {
    const { data: result, error } = await supabase.from('categories').update(data).eq('id', id).select().single();
    if (error) throw error;
    return result;
};

export const deleteCategory = async (id: string): Promise<{ success: boolean }> => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
};


export const loginAdmin = async (credentials: any) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
    });
    if (error) throw error;
    return data;
};

export const subscribeToNewsletter = async (email: string) => {
    const { data, error } = await supabase.from('subscribers').insert([{ email }]).select().single();
    if (error) throw error;
    return data;
};

export const getSubscribers = async (): Promise<any[]> => {
    const { data, error } = await supabase.from('subscribers').select('*');
    if (error) throw error;
    return data;
};

export const deleteSubscriber = async (id: string): Promise<{ success: boolean }> => {
    const { error } = await supabase.from('subscribers').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
};

export const uploadImage = async (file: File): Promise<{ url: string }> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

    if (uploadError) {
        throw uploadError;
    }

    const { data } = supabase.storage.from('images').getPublicUrl(filePath);
    return { url: data.publicUrl };
};

export const getSettings = async (): Promise<Record<string, string>> => {
    const { data, error } = await supabase.from('settings').select('*');
    if (error) throw error;
    
    const settings: Record<string, string> = {};
    if (data) {
        data.forEach((setting: any) => {
            settings[setting.key] = setting.value;
        });
    }
    return settings;
};

export const updateSettings = async (settings: Record<string, string>): Promise<{ success: boolean }> => {
    const updates = Object.entries(settings).map(([key, value]) => ({ key, value }));
    const { error } = await supabase.from('settings').upsert(updates, { onConflict: 'key' });
    if (error) throw error;
    return { success: true };
};

export const createOrder = async (orderData: any): Promise<{ success: boolean }> => {
    const { error } = await supabase.from('orders').insert([{
        first_name: orderData.firstName,
        last_name: orderData.lastName,
        email: orderData.email,
        phone: orderData.phone,
        address: orderData.address,
        city: orderData.city,
        region: orderData.region,
        total: orderData.total,
        items: orderData.items
    }]);
    if (error) throw error;
    return { success: true };
};

export const getOrders = async () => {
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data.map((o: any) => ({
        id: o.id,
        firstName: o.first_name,
        lastName: o.last_name,
        email: o.email,
        phone: o.phone,
        address: o.address,
        city: o.city,
        region: o.region,
        total: o.total,
        items: o.items,
        status: o.status,
        createdAt: o.created_at
    }));
};

export const updateOrderStatus = async (id: string, status: string) => {
    const { data, error } = await supabase.from('orders').update({ status }).eq('id', id).select().single();
    if (error) throw error;
    return data;
};

export const deleteOrder = async (id: string) => {
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
};
