// filepath: /home/blizzy/Development/xAGI/Reasonet/app/api/webhooks/verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

/**
 * Simple webhook verification endpoint
 * This helps diagnose if webhooks are being received properly
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const headerEntries = Object.fromEntries([...headersList.entries()]);
    const event = headerEntries['x-github-event'] || 'unknown';
    const delivery = headerEntries['x-github-delivery'] || 'unknown';
    
    console.log('🔔 WEBHOOK VERIFICATION ENDPOINT TRIGGERED');
    console.log(`Webhook received: ${event}, delivery ID: ${delivery}`);
    console.log(`Headers: ${JSON.stringify(headerEntries, null, 2)}`);
    console.log(`Body: ${body.substring(0, 500)}${body.length > 500 ? '...' : ''}`);
    
    // Always return success - this is just for logging
    return NextResponse.json({ 
      status: 'success', 
      message: 'Webhook received and logged', 
      event,
      delivery,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in webhook verification endpoint:', error);
    return NextResponse.json({ error: 'Webhook verification failed' }, { status: 500 });
  }
}

/**
 * GET handler for testing the endpoint is active
 */
export async function GET() {
  return NextResponse.json({ 
    status: 'active',
    message: 'Webhook verification endpoint is active',
    timestamp: new Date().toISOString()
  });
}