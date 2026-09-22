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
