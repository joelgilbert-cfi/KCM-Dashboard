import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface BrandRow {
  cluster_marker: string;
  brand: string;
  kitchen_name: string;
}

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

export async function POST(request: Request) {
  try {
    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
    const fromName = process.env.EMAIL_FROM_NAME || 'Kitchen Closure';

    if (!gmailUser || !gmailAppPassword) {
      return NextResponse.json(
        { error: 'Gmail email credentials are not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { toEmails, ccEmails = [], senderName, brands = [] } = body as {
      toEmails: string[];
      ccEmails?: string[];
      senderName: string;
      brands?: BrandRow[];
    };

    if (!Array.isArray(toEmails) || toEmails.length === 0) {
      return NextResponse.json({ error: 'No recipients specified' }, { status: 400 });
    }

    if (!Array.isArray(ccEmails) || !Array.isArray(brands)) {
      return NextResponse.json({ error: 'Invalid email request payload' }, { status: 400 });
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
        <td style="padding: 8px 12px; border: 1px solid #E2E8F7;">${escapeHtml(b.cluster_marker)}</td>
        <td style="padding: 8px 12px; border: 1px solid #E2E8F7;">${escapeHtml(b.brand)}</td>
        <td style="padding: 8px 12px; border: 1px solid #E2E8F7;">${escapeHtml(b.kitchen_name || '—')}</td>
      </tr>
    `
      )
      .join('');

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kcm.curefoods.com';
    const safeAppUrl = escapeHtml(appUrl);
    const safeSenderName = escapeHtml(senderName || 'Finance Team');

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
        
        <p>Please review and update the status on the dashboard: <a href="${safeAppUrl}" style="color: #0D1F6E;">${safeAppUrl}</a></p>
        
        <p>Regards,<br/>${safeSenderName}</p>
      </div>
    `;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });

    const result = await transporter.sendMail({
      from: `${fromName} <${gmailUser}>`,
      to: toEmails.join(','),
      cc: ccEmails.length > 0 ? ccEmails.join(',') : undefined,
      subject: `Kitchen Closure Request — ${today}`,
      html: htmlContent,
    });

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    );
  }
}
