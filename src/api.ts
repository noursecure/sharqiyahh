import axios from 'axios';
import type { Product, Category, APIProduct } from './types';

const API_URL = '/api';

export const api = axios.create({
    baseURL: API_URL,
});

export const getProducts = async (category?: string, search?: string, minPrice?: number, maxPrice?: number): Promise<APIProduct[]> => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    if (minPrice !== undefined) params.append('minPrice', String(minPrice));
    if (maxPrice !== undefined) params.append('maxPrice', String(maxPrice));
    const response = await api.get(`/products?${params.toString()}`);
    return response.data;
};

export const getProductById = async (id: string): Promise<APIProduct> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
};

export const createProduct = async (data: Omit<Product, 'id'>): Promise<APIProduct> => {
    const response = await api.post('/products', data);
    return response.data;
};

export const updateProduct = async (id: string, data: Partial<Product>): Promise<APIProduct> => {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
};

export const deleteProduct = async (id: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
};

export const getCategories = async (): Promise<Category[]> => {
    const response = await api.get('/categories');
    return response.data;
};

export const createCategory = async (data: Omit<Category, 'id'>): Promise<Category> => {
    const response = await api.post('/categories', data);
    return response.data;
};

export const updateCategory = async (id: string, data: Partial<Category>): Promise<Category> => {
    const response = await api.put(`/categories/${id}`, data);
    return response.data;
};

export const deleteCategory = async (id: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
};


export const loginAdmin = async (credentials: any) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
};

export const subscribeToNewsletter = async (email: string) => {
    const response = await api.post('/subscribers', { email });
    return response.data;
};

export const getSubscribers = async (): Promise<Subscriber[]> => {
    const response = await api.get('/subscribers');
    return response.data;
};

export const deleteSubscriber = async (id: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/subscribers/${id}`);
    return response.data;
};

export const uploadImage = async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post('/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const getSettings = async (): Promise<Record<string, string>> => {
    const response = await api.get('/settings');
    return response.data;
};

export const updateSettings = async (settings: Record<string, any>): Promise<{ success: boolean }> => {
    const response = await api.put('/settings', settings);
    return response.data;
};
