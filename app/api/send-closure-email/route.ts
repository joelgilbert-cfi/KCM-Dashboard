import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailRow {
  cluster_marker: string;
  brand: string;
  kitchen_name: string;
  city: string;
}

export async function POST(request: NextRequest) {
  try {
    const { to, cc, rows, senderName, senderEmail } = (await request.json()) as {
      to: string[];
      cc: string[];
      rows: EmailRow[];
      senderName: string;
      senderEmail: string;
    };

    if (!to || to.length === 0 || !rows || rows.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: to, rows' },
        { status: 400 }
      );
    }

    // Build the HTML email table
    const tableRows = rows
      .map(
        (row) => `
        <tr>
          <td style="padding: 10px 14px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #374151;">${row.cluster_marker}</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #374151;">${row.brand}</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #374151;">${row.kitchen_name}</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #374151;">${row.city}</td>
        </tr>`
      )
      .join('');

    const today = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
        <p style="font-size: 14px; color: #374151; line-height: 1.6;">Hi Team,</p>
        <p style="font-size: 14px; color: #374151; line-height: 1.6;">Please find below the list of kitchens identified for closure:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background: #f9fafb;">
              <th style="padding: 10px 14px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e5e7eb;">Cluster Marker</th>
              <th style="padding: 10px 14px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e5e7eb;">Brand</th>
              <th style="padding: 10px 14px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e5e7eb;">Kitchen Name</th>
              <th style="padding: 10px 14px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e5e7eb;">City</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <p style="font-size: 14px; color: #374151; line-height: 1.6;">
          Kindly review and update the status on the dashboard at 
          <a href="${appUrl}/dashboard" style="color: #4f46e5; text-decoration: underline;">${appUrl}</a>.
        </p>

        <p style="font-size: 14px; color: #374151; line-height: 1.6; margin-top: 24px;">
          Regards,<br/>
          ${senderName}<br/>
          <span style="color: #6b7280;">${senderEmail}</span>
        </p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: `KCM Dashboard <onboarding@resend.dev>`,
      to,
      cc: cc && cc.length > 0 ? cc : undefined,
      subject: `Kitchen Closure Request — ${today}`,
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
