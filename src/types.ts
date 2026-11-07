export interface Category {
    id: string;
    name: string;
    nameAr?: string;
    image?: string;
    description?: string;
}

export interface Product {
    id: string;
    name: string;
    nameAr: string;
    price: number | string; // price can be a string in form data
    originalPrice?: number | string | null;
    category: string;
    image: string;
    images?: string; // Comma separated URLs
    description?: string;
    descriptionAr?: string;
    stock: number | string;
    colors?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface APIProduct extends Omit<Product, 'price' | 'originalPrice' | 'stock'> {
    price: number;
    originalPrice?: number | null;
    stock: number;
}

export interface OrderItem {
    id: string;
    productName?: string;
    name?: string;
    price: number;
    quantity: number;
    size?: string | null;
    image?: string | null;
}

export interface Order {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    region?: string;
    total: number;
    items: OrderItem[];
    status: string;
    trackingNumber?: string | null;
    labelUrl?: string | null;
    shipmentStatus?: string | null;
    createdAt: string;
}

