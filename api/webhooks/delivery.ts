import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Status Event mappings from Net Status List.xlsx
const EVENT_MAPPING: Record<number, string> = {
    2: 'Order Created',
    3: 'Pickup with driver',
    4: 'Arrived at Net facility',
    5: 'Out for delivery',
    6: 'Delivered',
    7: 'Failed - External Failure',
    10: 'Delivery Rescheduled',
    11: 'With Driver - Rescheduled',
    12: 'Checked in - Reschedule'
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only accept POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const body = req.body;
        console.log('[Net Delivery Webhook Received]:', JSON.stringify(body));

        const orderReference = body.OrderReference || body.ParentOrderReference;
        const label = body.Label || body.ParentLabel;
        const eventId = Number(body.EventId);
        const eventName = body.EventName || EVENT_MAPPING[eventId] || 'In Transit';
        const receivedBy = body.ReceivedBy || null;

        if (!orderReference && !label) {
            return res.status(400).json({ error: 'Missing OrderReference or Label in webhook body' });
        }

        // Initialize Supabase admin/server client
        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

        if (supabaseUrl && supabaseKey) {
            const supabase = createClient(supabaseUrl, supabaseKey);

            // Determine friendly order status
            let systemStatus: string | undefined;
            if (eventId === 6 || eventName.toLowerCase().includes('delivered')) {
                systemStatus = 'Completed';
            } else if (eventId === 7 || eventName.toLowerCase().includes('fail')) {
                systemStatus = 'Cancelled';
            } else {
                systemStatus = 'Processing';
            }

            // Update matching order by id or tracking number
            const updatePayload: any = {
                shipment_status: eventName,
                tracking_number: label
            };
            if (systemStatus) {
                updatePayload.status = systemStatus;
            }

            let query = supabase.from('orders').update(updatePayload);
            if (orderReference) {
                query = query.eq('id', orderReference);
            } else if (label) {
                query = query.eq('tracking_number', label);
            }

            const { error: dbError } = await query;
            if (dbError) {
                console.error('[Webhook DB Update Error]:', dbError);
            }
        }

        return res.status(200).json({
            success: true,
            receivedOrder: orderReference,
            event: eventName
        });
    } catch (error: any) {
        console.error('[Webhook Processing Error]:', error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
