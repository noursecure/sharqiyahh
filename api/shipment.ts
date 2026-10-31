import type { VercelRequest, VercelResponse } from '@vercel/node';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

        // Validate and clean city. Must be a recognized city in Lebanon. Fallback to Beirut if unknown.
        let city = (params.city || '').trim();
        if (!city || city.length < 2) {
            city = 'Beirut';
        }

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
                    City: city,
                    Street: params.address || "Street 1",
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
        let resultData: any;
        try {
            resultData = JSON.parse(textResponse);
        } catch (e) {
            // Check if server error contains governorateId
            if (textResponse.includes('governorateId')) {
                return res.status(400).json({
                    success: false,
                    error: `City "${city}" is not recognized by Net Global delivery zones. Please update the order city to a valid Lebanon city (e.g. Beirut, Tripoli, Saida, Jounieh).`
                });
            }
            return res.status(502).json({
                success: false,
                error: `Carrier returned non-JSON response: ${textResponse}`
            });
        }

        if (resultData.Result === 1 || resultData.Label) {
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
