import { Resend } from 'resend';
import { NextResponse } from 'next/server';

interface BrandRow {
  cluster_marker: string;
  brand: string;
  kitchen_name: string;
}

export async function POST(request: Request) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');
    const body = await request.json();
    const { toEmails, ccEmails, senderName, brands } = body as {
      toEmails: string[];
      ccEmails: string[];
      senderName: string;
      brands: BrandRow[];
    };

    if (!toEmails || toEmails.length === 0) {
      return NextResponse.json({ error: 'No recipients specified' }, { status: 400 });
    }

    const today = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    // Build HTML table rows
    const tableRows = brands
      .map(
        (b) => `
      <tr>
        <td style="padding: 8px 12px; border: 1px solid #E2E8F7;">${b.cluster_marker}</td>
        <td style="padding: 8px 12px; border: 1px solid #E2E8F7;">${b.brand}</td>
        <td style="padding: 8px 12px; border: 1px solid #E2E8F7;">${b.kitchen_name || '—'}</td>
      </tr>
    `
      )
      .join('');

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kcm.curefoods.com';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #0D1F6E; max-width: 600px;">
        <p>Hi Team,</p>
        <p>Please find below the list of kitchens identified for closure:</p>
        
        <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
          <thead>
            <tr style="background-color: #F4F6FB;">
              <th style="padding: 8px 12px; border: 1px solid #E2E8F7; text-align: left; font-weight: 600;">Cluster Marker</th>
              <th style="padding: 8px 12px; border: 1px solid #E2E8F7; text-align: left; font-weight: 600;">Brand</th>
              <th style="padding: 8px 12px; border: 1px solid #E2E8F7; text-align: left; font-weight: 600;">Kitchen Name</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        
        <p>Please review and update the status on the dashboard: <a href="${appUrl}" style="color: #0D1F6E;">${appUrl}</a></p>
        
        <p>Regards,<br/>${senderName}</p>
      </div>
    `;

    const { error } = await resend.emails.send({
      from: 'KCM Dashboard <noreply@curefoods.com>',
      to: toEmails,
      cc: ccEmails.length > 0 ? ccEmails : undefined,
      subject: `Kitchen Closure Request — ${today}`,
      html: htmlContent,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
