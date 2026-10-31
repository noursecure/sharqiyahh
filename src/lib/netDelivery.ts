export interface CreateShipmentParams {
    orderId: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    city: string;
    address: string;
    notes?: string;
    amount: number;
    currency?: 'USD' | 'LBP';
    itemDescription?: string;
    quantity?: number;
}

export interface ShipmentResult {
    success: boolean;
    orderId?: string;
    label?: string;
    urlLabel?: string;
    error?: string;
}

/**
 * Calls our serverless endpoint /api/shipment
 * Prevents CORS blocks and securely contacts Net Global API
 */
export async function createNetShipment(params: CreateShipmentParams): Promise<ShipmentResult> {
    try {
        const response = await fetch('/api/shipment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        });

        const data = await response.json();
        return data;
    } catch (err: any) {
        return {
            success: false,
            error: err.message || 'Network error calling shipment API'
        };
    }
}
