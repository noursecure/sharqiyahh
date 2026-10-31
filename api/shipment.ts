import type { VercelRequest, VercelResponse } from '@vercel/node';
import lebanonCities from '../src/data/lebanonCities.json';

const NET_API_BASE_URL = 'https://netapi.mypro-app.com/api';

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

// Build a fast lookup map for Lebanon cities (case-insensitive)
const CITIES_MAP = new Map<string, string>();
for (const c of (lebanonCities as string[])) {
    CITIES_MAP.set(c.toLowerCase().trim(), c);
}

// Common aliases/synonyms
CITIES_MAP.set('beirut', 'Beirut');
CITIES_MAP.set('بيروت', 'Beirut');
CITIES_MAP.set('tripoli', 'Tripoli');
CITIES_MAP.set('طرابلس', 'Tripoli');
CITIES_MAP.set('sidon', 'Saida');
CITIES_MAP.set('saida', 'Saida');
CITIES_MAP.set('صيدا', 'Saida');
CITIES_MAP.set('jounieh', 'Jounieh');
CITIES_MAP.set('جونيه', 'Jounieh');
CITIES_MAP.set('جونية', 'Jounieh');
CITIES_MAP.set('jbeil', 'Jbeil');
CITIES_MAP.set('byblos', 'Jbeil');
CITIES_MAP.set('جبيل', 'Jbeil');
CITIES_MAP.set('tyre', 'Tyre');
CITIES_MAP.set('sour', 'Tyre');
CITIES_MAP.set('صور', 'Tyre');
CITIES_MAP.set('zahle', 'Zahle');
CITIES_MAP.set('زحلة', 'Zahle');
CITIES_MAP.set('nabatieh', 'Nabatieh');
CITIES_MAP.set('النبطية', 'Nabatieh');

function resolveLebanonCity(inputCity?: string): string {
    if (!inputCity) return 'Beirut';
    const clean = inputCity.toLowerCase().trim();
    if (CITIES_MAP.has(clean)) {
        return CITIES_MAP.get(clean)!;
    }
    // Partial search match
    for (const [key, val] of CITIES_MAP.entries()) {
        if (clean.includes(key) || key.includes(clean)) {
            return val;
        }
    }
    // Default fallback so Net Global doesn't reject with governorateId error
    return 'Beirut';
}

async function getNetAuthToken(): Promise<string> {
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

    return data.token;
}

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const params = req.body;
        console.log('[Create Shipment Request]:', params);

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

        // Resolve city to a guaranteed valid Lebanese city
        const rawCity = params.city || '';
        const validCity = resolveLebanonCity(rawCity);

        // If the original input was non-Lebanese (like 'los anglos'), append it to street address for reference
        const streetAddress = rawCity && rawCity !== validCity
            ? `${params.address || 'Street 1'} (${rawCity})`
            : (params.address || 'Street 1');

        const customerPhone = (params.customerPhone || '70112112').replace(/[^\d+]/g, '');

        const payload = {
            OrderTypeId: 1,
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
                    City: validCity,
                    Street: streetAddress,
                    Building: "Building 1",
                    Floor: "1st floor",
                    LandMark: "",
                    ZipCode: "",
                    POBox: "",
                    GeoLocation: "URL",
                    PhoneType: "mobile",
                    PhoneNumber: customerPhone,
                    Ext: "",
                    Contact: {
                        ContactType: "Owner",
                        ContactName: params.customerName || "Customer",
                        MobileNumber: customerPhone,
                        Email: params.customerEmail || "customer@sharqiyahh.com"
                    }
                }
            },
            OrderInternationalTypeId: 2,
            ShipmentTermsId: 1,
            BusinessTypeId: 2,
            shipmentReason: "",
            Notes: params.notes || "Sharqiyah Order",
            EORI: "",
            Cod: [
                {
                    Amount: Math.round(Number(params.amount) || 50),
                    Currency: params.currency || "USD",
                    PaymentMethodId: 1
                }
            ],
            packages: [
                {
                    OrderReference: `${params.orderId}-P1`,
                    CreatedDate: formattedDate,
                    Length: 10,
                    Width: 20,
                    Height: 30,
                    Weight: 1,
                    Items: [
                        {
                            Description: params.itemDescription || "Sharqiyah Abaya / Dress",
                            HsCode: "HSCODE 1",
                            SKU: "1235467",
                            GoodsValue: Math.round(Number(params.amount) || 50),
                            Currency: params.currency || "USD",
                            CountryOfOrigin: "Lebanon",
                            Quantity: params.quantity || 1,
                            ProductURL: "www.sharqiyahh.com"
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
        console.log('[Net API Raw Response]:', textResponse);

        let resultData: any;
        try {
            resultData = JSON.parse(textResponse);
        } catch (e) {
            return res.status(502).json({
                success: false,
                error: `Carrier error: ${textResponse}`
            });
        }

        // If Label exists (even on duplicate order), it's a success
        if (resultData.Label) {
            return res.status(200).json({
                success: true,
                orderId: resultData.OrderID,
                label: resultData.Label,
                urlLabel: resultData.URLLabel
            });
        } else {
            return res.status(400).json({
                success: false,
                error: resultData.error || resultData.message || 'Carrier failed to generate shipment'
            });
        }
    } catch (err: any) {
        console.error('[Create Shipment Error]:', err);
        return res.status(500).json({
            success: false,
            error: err.message || 'Internal connection error'
        });
    }
}
