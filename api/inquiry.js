// api/inquiry.js — Vercel Serverless Function (Node.js)
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      fullName = '',
      phone = '',
      email = '',
      serviceDivision = '',
      preferredOffice = 'Lekki Office',
      message = '',
    } = req.body || {};

    const clean = (str) => String(str).replace(/[<>]/g, '').trim();

    const record = {
      id: `IP-${Date.now()}`,
      fullName: clean(fullName),
      phone: clean(phone),
      email: clean(email),
      serviceDivision: clean(serviceDivision),
      preferredOffice: clean(preferredOffice),
      message: clean(message),
      submittedAt: new Date().toISOString(),
    };

    if (
      record.fullName.length < 2 ||
      record.phone.length < 7 ||
      !record.email.includes('@') ||
      !record.serviceDivision ||
      record.message.length < 10
    ) {
      return res.status(400).json({
        error: 'Validation failed. Please complete all required fields.',
      });
    }

    // Optional: Send email via Resend API if RESEND_API_KEY is set in Vercel Environment Variables
    const resendKey = process.env.RESEND_API_KEY;
    const recipient =
      process.env.CONTACT_NOTIFICATION_EMAIL || 'Immanuelpavilionservices@gmail.com';

    if (resendKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'ImmanuelPavilion Advisory <onboarding@resend.dev>',
          to: [recipient],
          reply_to: record.email,
          subject: `[New ${record.serviceDivision} Mandate] — ${record.fullName}`,
          html: `
            <div style="font-family: sans-serif; color: #0B0D11; max-width: 600px;">
              <h2 style="border-bottom: 2px solid #E5B822; padding-bottom: 8px;">
                New Client Mandate — ImmanuelPavilion Services Limited
              </h2>
              <p><strong>Reference:</strong> ${record.id}</p>
              <p><strong>Client Name:</strong> ${record.fullName}</p>
              <p><strong>Phone / WhatsApp:</strong> ${record.phone}</p>
              <p><strong>Email:</strong> ${record.email}</p>
              <p><strong>Business Vertical:</strong> ${record.serviceDivision}</p>
              <p><strong>Preferred Office:</strong> ${record.preferredOffice}</p>
              <p><strong>Details:</strong></p>
              <blockquote style="background: #F9F8F6; padding: 12px; border-left: 4px solid #E5B822;">
                ${record.message}
              </blockquote>
            </div>
          `,
        }),
      });
    }

    return res.status(201).json({
      success: true,
      inquiryId: record.id,
      message: 'Mandate logged and dispatched.',
    });
  } catch (err) {
    console.error('Vercel Serverless Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}