/**
 * The Net Global Delivery Service
 * Integration with MyPro Last Mile API
 */

const NET_API_BASE_URL = 'https://netapi.mypro-app.com/api';

// Staging test credentials (from Postman collection)
const DEFAULT_CONFIG = {
    username: process.env.NET_API_USERNAME || 'TestLM@Warehousing.com',
    password: process.env.NET_API_PASSWORD || 'L@stMile2025',
    companyId: 1,
    serviceId: 8,
    serviceTypeId: 64,
    shipmentTypeId: 42,
    senderId: 135820,
    senderAddressId: 231833,
    contactId: 169299,
};

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Login to Net API and retrieve Bearer token
 */
export async function getNetAuthToken(): Promise<string> {
    const now = Date.now();
    if (cachedToken && now < tokenExpiry) {
        return cachedToken;
    }

    const response = await fetch(`${NET_API_BASE_URL}/authentication/loginClient`, {
        method: 'POST',
        headers: {
            'username': DEFAULT_CONFIG.username,
            'password': DEFAULT_CONFIG.password,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`Net API Authentication failed with status ${response.status}`);
    }

    const data = await response.json();
    if (!data.token) {
        throw new Error('Authentication succeeded but no token returned');
    }

    cachedToken = data.token;
    // Set expiry 1 hour before actual expiration or 23 hours by default
    tokenExpiry = now + 23 * 60 * 60 * 1000;
    return cachedToken as string;
}

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
 * Create a new delivery order in Net Global API
 */
export async function createNetShipment(params: CreateShipmentParams): Promise<ShipmentResult> {
    try {
        const token = await getNetAuthToken();

        const formattedDate = new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        }).format(new Date());

        const payload = {
            OrderTypeId: 1, // Standard Delivery
            OrderReference: params.orderId,
            CompanyId: DEFAULT_CONFIG.companyId,
            ServiceId: DEFAULT_CONFIG.serviceId,
            ServiceTypeId: DEFAULT_CONFIG.serviceTypeId,
            ShipmentTypeId: DEFAULT_CONFIG.shipmentTypeId,
            CreatedDate: formattedDate,
            SenderId: DEFAULT_CONFIG.senderId,
            SenderAddressId: DEFAULT_CONFIG.senderAddressId,
            ContactId: DEFAULT_CONFIG.contactId,
            PickupSpecialInstructions: "Sharqiyah Abayas Pickup",
            DeliverySpecialInstructions: params.notes || "Call recipient upon arrival",
            ManifestId: 0,
            Receiver: {
                Name: params.customerName || "Customer",
                Email: params.customerEmail || "customer@sharqiyahh.com",
                Address: {
                    Country: "Lebanon",
                    City: params.city || "Beirut",
                    Street: params.address || "Main Street",
                    Building: "Building",
                    Floor: "",
                    LandMark: "",
                    ZipCode: "",
                    POBox: "",
                    GeoLocation: "",
                    PhoneType: "mobile",
                    PhoneNumber: params.customerPhone || "+961",
                    Ext: "",
                    Contact: {
                        ContactType: "Recipient",
                        ContactName: params.customerName || "Customer",
                        MobileNumber: params.customerPhone || "+961",
                        Email: params.customerEmail || "customer@sharqiyahh.com"
                    }
                }
            },
            OrderInternationalTypeId: 2,
            ShipmentTermsId: 1,
            BusinessTypeId: 2,
            shipmentReason: "E-Commerce Delivery",
            Notes: params.notes || "",
            EORI: "",
            Cod: [
                {
                    Amount: params.amount,
                    Currency: params.currency || "USD",
                    PaymentMethodId: 1 // 1 = Cash on Delivery
                }
            ],
            packages: [
                {
                    OrderReference: `${params.orderId}-P1`,
                    CreatedDate: formattedDate,
                    Length: 30,
                    Width: 20,
                    Height: 10,
                    Weight: 1,
                    Items: [
                        {
                            Description: params.itemDescription || "Sharqiyah Abaya / Dress",
                            HsCode: "6204",
                            SKU: "ABY-01",
                            GoodsValue: params.amount,
                            Currency: params.currency || "USD",
                            CountryOfOrigin: "Lebanon",
                            Quantity: params.quantity || 1,
                            ProductURL: "https://www.sharqiyahh.com"
                        }
                    ]
                }
            ]
        };

        const response = await fetch(`${NET_API_BASE_URL}/thirdparty/CreateInternationalOrder`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const textResponse = await response.text();
        let resultData: any;
        try {
            resultData = JSON.parse(textResponse);
        } catch (e) {
            return {
                success: false,
                error: `Invalid response format from carrier: ${textResponse}`
            };
        }

        if (resultData.Result === 1 || resultData.Label) {
            return {
                success: true,
                orderId: resultData.OrderID,
                label: resultData.Label,
                urlLabel: resultData.URLLabel
            };
        } else {
            return {
                success: false,
                error: resultData.error || resultData.message || 'Carrier failed to generate shipment label'
            };
        }
    } catch (err: any) {
        return {
            success: false,
            error: err.message || 'Internal connection error'
        };
    }
}
