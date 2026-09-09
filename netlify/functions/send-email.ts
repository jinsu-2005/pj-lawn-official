import type { Handler } from '@netlify/functions'
import { Resend } from 'resend'

// Helper for generating responsive, luxury PJ Lawn HTML email template
function createEmailWrapper(title: string, contentHtml: string): string {
  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #060606; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f0e8dc; -webkit-font-smoothing: antialiased;">
  <div style="width: 100%; background-color: #060606; padding: 30px 0;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #111111; border: 1px solid rgba(232, 201, 109, 0.35); border-radius: 12px; overflow: hidden; box-shadow: 0 12px 36px rgba(0, 0, 0, 0.85);">
      
      <!-- HEADER -->
      <tr>
        <td align="center" style="background: linear-gradient(180deg, #181818 0%, #111111 100%); padding: 35px 20px; border-bottom: 1px solid rgba(232, 201, 109, 0.25);">
          <div style="font-family: Georgia, 'Times New Roman', serif; font-size: 28px; font-weight: bold; color: #e8c96d; letter-spacing: 4px; margin: 0 0 6px 0; text-transform: uppercase;">
            PJ LAWN
          </div>
          <p style="font-size: 11px; color: #d9cdb5; letter-spacing: 2.5px; text-transform: uppercase; margin: 0; font-weight: 600;">
            Nagercoil's Premier Open-Air Venue
          </p>
        </td>
      </tr>

      <!-- BODY CONTENT -->
      <tr>
        <td style="padding: 35px 30px; font-size: 15px; line-height: 1.65; color: #ede5d0;">
          ${contentHtml}
        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td align="center" style="background-color: #0a0a0a; padding: 25px 20px; font-size: 12px; color: #b3a692; border-top: 1px solid rgba(255, 255, 255, 0.08); line-height: 1.6;">
          <p style="margin: 0 0 8px 0; color: #d9cdb5; font-size: 12px; font-weight: 500;">
            <strong>PJ Lawn</strong> &bull; Paul Vathiyar Compound, Gandhi Nagar, Kurusady, Nagercoil, Tamil Nadu 629004
          </p>
          <p style="margin: 0; color: #b3a692;">
            Phone: <a href="tel:+919489724975" style="color: #e8c96d; text-decoration: none; font-weight: bold;">+91 94897 24975</a> &bull; <a href="https://pjlawn.netlify.app" style="color: #e8c96d; text-decoration: none;">pjlawn.netlify.app</a>
          </p>
        </td>
      </tr>

    </table>
  </div>
</body>
</html>
  `.trim()
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    console.error('[send-email] RESEND_API_KEY is not configured in environment.')
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'RESEND_API_KEY is not configured in environment.' })
    }
  }

  const resend = new Resend(resendApiKey)
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'PJ Lawn <onboarding@resend.dev>'
  const adminEmail = process.env.ADMIN_EMAIL || 'pjlawnofficial@gmail.com'

  try {
    const payload = JSON.parse(event.body || '{}')
    const { type, data } = payload

    if (!type || !data) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing type or data in request body.' })
      }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 1. BOOKING REQUEST RECEIVED
    // ─────────────────────────────────────────────────────────────────────────────
    if (type === 'booking_request') {
      const {
        customerName,
        customerEmail,
        customerPhone,
        eventDate,
        eventType,
        guestCount,
        notes,
        estimatedPrice
      } = data

      const results: { customer?: any; admin?: any; errors: string[] } = { errors: [] }

      // A) Email to Customer
      if (customerEmail) {
        const customerContent = `
          <div style="display: inline-block; padding: 6px 14px; font-size: 11px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; border-radius: 4px; margin-bottom: 20px; background-color: rgba(232, 201, 109, 0.15); color: #e8c96d; border: 1px solid rgba(232, 201, 109, 0.4);">
            Request Received
          </div>
          <h2 style="color: #fefdf9; margin-top: 0; margin-bottom: 12px; font-size: 22px; font-family: Georgia, 'Times New Roman', serif;">
            Hello ${customerName || 'Valued Guest'},
          </h2>
          <p style="margin: 0 0 14px 0; color: #ede5d0; font-size: 15px; line-height: 1.65;">
            Thank you for choosing <strong style="color: #ffffff;">PJ Lawn</strong> for your special occasion. We have received your booking inquiry for <strong style="color: #e8c96d;">${eventDate}</strong>.
          </p>
          <p style="margin: 0 0 20px 0; color: #d9cdb5; font-size: 14px; line-height: 1.65;">
            Our venue management team is currently reviewing your date and guest requirements. Once approved, you will receive a formal confirmation with your exact quote and secure advance payment link.
          </p>
          
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse; background-color: #171717; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; margin: 20px 0;">
            <tr>
              <td style="padding: 16px 20px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td align="left" style="padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #d9cdb5; font-size: 14px;">Event Date</td>
                    <td align="right" style="padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #fefdf9; font-weight: bold; font-size: 14px;">${eventDate}</td>
                  </tr>
                  <tr>
                    <td align="left" style="padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #d9cdb5; font-size: 14px;">Occasion</td>
                    <td align="right" style="padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #fefdf9; font-weight: bold; font-size: 14px;">${eventType}</td>
                  </tr>
                  <tr>
                    <td align="left" style="padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #d9cdb5; font-size: 14px;">Expected Guests</td>
                    <td align="right" style="padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #fefdf9; font-weight: bold; font-size: 14px;">${guestCount} Guests</td>
                  </tr>
                  <tr>
                    <td align="left" style="padding: 10px 0; ${notes ? 'border-bottom: 1px solid rgba(255, 255, 255, 0.08);' : ''} color: #d9cdb5; font-size: 14px;">Estimated Price</td>
                    <td align="right" style="padding: 10px 0; ${notes ? 'border-bottom: 1px solid rgba(255, 255, 255, 0.08);' : ''} color: #e8c96d; font-weight: bold; font-size: 15px;">₹${Number(estimatedPrice || 15000).toLocaleString('en-IN')}</td>
                  </tr>
                  ${notes ? `
                  <tr>
                    <td align="left" style="padding: 10px 0; color: #d9cdb5; font-size: 14px;">Special Notes</td>
                    <td align="right" style="padding: 10px 0; color: #fefdf9; font-weight: 500; font-size: 14px;">${notes}</td>
                  </tr>
                  ` : ''}
                </table>
              </td>
            </tr>
          </table>

          <p style="margin: 20px 0 0 0; color: #d9cdb5; font-size: 13px; line-height: 1.6;">
            If you have any urgent queries or custom catering requests, feel free to call or WhatsApp us anytime at <a href="tel:+919489724975" style="color: #e8c96d; font-weight: bold; text-decoration: none;">+91 94897 24975</a>.
          </p>
        `

        try {
          const sendRes = await resend.emails.send({
            from: fromEmail,
            to: [customerEmail],
            subject: `Booking Request Received for ${eventDate} - PJ Lawn`,
            html: createEmailWrapper(`Booking Request - ${customerName}`, customerContent)
          })
          results.customer = sendRes
        } catch (custErr: any) {
          console.error('[send-email] Failed to send customer booking email:', custErr.message)
          results.errors.push(`Customer email error: ${custErr.message}`)
        }
      }

      // B) Email alert to Admin
      if (adminEmail) {
        const adminContent = `
          <div style="display: inline-block; padding: 6px 14px; font-size: 11px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; border-radius: 4px; margin-bottom: 20px; background-color: rgba(232, 201, 109, 0.2); color: #e8c96d; border: 1px solid rgba(232, 201, 109, 0.4);">
            New Booking Alert
          </div>
          <h2 style="color: #fefdf9; margin-top: 0; margin-bottom: 12px; font-size: 22px; font-family: Georgia, 'Times New Roman', serif;">
            New Booking Inquiry Submitted
          </h2>
          <p style="margin: 0 0 16px 0; color: #ede5d0; font-size: 15px;">
            A new event booking inquiry has been submitted online and is awaiting your review in the admin dashboard:
          </p>
          
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse; background-color: #171717; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; margin: 20px 0;">
            <tr>
              <td style="padding: 16px 20px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td align="left" style="padding: 9px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #d9cdb5; font-size: 14px;">Customer Name</td>
                    <td align="right" style="padding: 9px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #fefdf9; font-weight: bold; font-size: 14px;">${customerName}</td>
                  </tr>
                  <tr>
                    <td align="left" style="padding: 9px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #d9cdb5; font-size: 14px;">Phone</td>
                    <td align="right" style="padding: 9px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #e8c96d; font-weight: bold; font-size: 14px;"><a href="tel:${customerPhone}" style="color: #e8c96d; text-decoration: none;">${customerPhone}</a></td>
                  </tr>
                  <tr>
                    <td align="left" style="padding: 9px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #d9cdb5; font-size: 14px;">Email</td>
                    <td align="right" style="padding: 9px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #fefdf9; font-size: 14px;">${customerEmail || 'Not provided'}</td>
                  </tr>
                  <tr>
                    <td align="left" style="padding: 9px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #d9cdb5; font-size: 14px;">Event Date</td>
                    <td align="right" style="padding: 9px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #e8c96d; font-weight: bold; font-size: 14px;">${eventDate}</td>
                  </tr>
                  <tr>
                    <td align="left" style="padding: 9px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #d9cdb5; font-size: 14px;">Occasion</td>
                    <td align="right" style="padding: 9px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #fefdf9; font-weight: bold; font-size: 14px;">${eventType}</td>
                  </tr>
                  <tr>
                    <td align="left" style="padding: 9px 0; ${notes ? 'border-bottom: 1px solid rgba(255, 255, 255, 0.08);' : ''} color: #d9cdb5; font-size: 14px;">Guest Count</td>
                    <td align="right" style="padding: 9px 0; ${notes ? 'border-bottom: 1px solid rgba(255, 255, 255, 0.08);' : ''} color: #fefdf9; font-weight: bold; font-size: 14px;">${guestCount}</td>
                  </tr>
                  ${notes ? `
                  <tr>
                    <td align="left" style="padding: 9px 0; color: #d9cdb5; font-size: 14px;">Notes</td>
                    <td align="right" style="padding: 9px 0; color: #fefdf9; font-size: 14px;">${notes}</td>
                  </tr>
                  ` : ''}
                </table>
              </td>
            </tr>
          </table>

          <div style="text-align: center; margin-top: 25px; margin-bottom: 10px;">
            <a href="https://pjlawn.netlify.app/admin" style="display: inline-block; background-color: #e8c96d; color: #0a0a0a !important; font-weight: 900; text-decoration: none; padding: 14px 32px; border-radius: 8px; letter-spacing: 1.5px; text-transform: uppercase; font-size: 13px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);">
              Open Admin Dashboard
            </a>
          </div>
        `

        try {
          const adminRes = await resend.emails.send({
            from: fromEmail,
            to: [adminEmail],
            subject: `[New Booking Alert] ${customerName} - ${eventType} on ${eventDate}`,
            html: createEmailWrapper(`New Booking Alert`, adminContent)
          })
          results.admin = adminRes
        } catch (adminErr: any) {
          console.error('[send-email] Failed to send admin alert email:', adminErr.message)
          results.errors.push(`Admin email error: ${adminErr.message}`)
        }
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, results })
      }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 2. BOOKING APPROVED BY ADMIN
    // ─────────────────────────────────────────────────────────────────────────────
    if (type === 'booking_approved') {
      const {
        customerName,
        customerEmail,
        eventDate,
        eventType,
        totalAmount,
        advanceAmount
      } = data

      if (!customerEmail) {
        return { statusCode: 400, body: JSON.stringify({ error: 'customerEmail is required' }) }
      }

      const content = `
        <div style="display: inline-block; padding: 6px 14px; font-size: 11px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; border-radius: 4px; margin-bottom: 20px; background-color: rgba(78, 134, 38, 0.25); color: #8ce04a; border: 1px solid rgba(78, 134, 38, 0.5);">
          Booking Approved
        </div>
        <h2 style="color: #fefdf9; margin-top: 0; margin-bottom: 12px; font-size: 24px; font-family: Georgia, 'Times New Roman', serif;">
          Great News, ${customerName || 'Valued Guest'}!
        </h2>
        <p style="margin: 0 0 14px 0; color: #ede5d0; font-size: 15px; line-height: 1.65;">
          Your booking request for <strong style="color: #e8c96d;">${eventDate}</strong> has been officially approved by PJ Lawn management!
        </p>
        <p style="margin: 0 0 20px 0; color: #d9cdb5; font-size: 15px; line-height: 1.65;">
          Your venue date is now held. To confirm and secure your reservation, please complete the advance deposit payment below:
        </p>
        
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse; background-color: #171717; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; margin: 20px 0;">
          <tr>
            <td style="padding: 16px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="left" style="padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #d9cdb5; font-size: 14px;">Event Date</td>
                  <td align="right" style="padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #fefdf9; font-weight: bold; font-size: 14px;">${eventDate}</td>
                </tr>
                <tr>
                  <td align="left" style="padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #d9cdb5; font-size: 14px;">Occasion</td>
                  <td align="right" style="padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #fefdf9; font-weight: bold; font-size: 14px;">${eventType}</td>
                </tr>
                <tr>
                  <td align="left" style="padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #d9cdb5; font-size: 14px;">Total Venue Price</td>
                  <td align="right" style="padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #fefdf9; font-weight: bold; font-size: 15px;">₹${Number(totalAmount).toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td align="left" style="padding: 10px 0; color: #e8c96d; font-weight: bold; font-size: 14px;">Advance Required</td>
                  <td align="right" style="padding: 10px 0; color: #e8c96d; font-weight: bold; font-size: 16px;">₹${Number(advanceAmount || 5000).toLocaleString('en-IN')}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <div style="text-align: center; margin-top: 28px; margin-bottom: 15px;">
          <a href="https://pjlawn.netlify.app/dashboard" style="display: inline-block; background-color: #e8c96d; color: #0a0a0a !important; font-weight: 900; text-decoration: none; padding: 15px 34px; border-radius: 8px; letter-spacing: 1.5px; text-transform: uppercase; font-size: 13px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);">
            Pay Advance & Confirm Date
          </a>
        </div>

        <p style="text-align: center; color: #d9cdb5; font-size: 12.5px; line-height: 1.5; margin: 15px 0 0 0;">
          You can securely pay using UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, or Net Banking via Cashfree Payments.
        </p>
      `

      const res = await resend.emails.send({
        from: fromEmail,
        to: [customerEmail],
        subject: `Your Booking is Approved for ${eventDate} - PJ Lawn`,
        html: createEmailWrapper(`Booking Approved`, content)
      })

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, id: res.data?.id })
      }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 3. PAYMENT CONFIRMATION & RECEIPT
    // ─────────────────────────────────────────────────────────────────────────────
    if (type === 'payment_receipt') {
      const {
        customerName,
        customerEmail,
        eventDate,
        eventType,
        orderId,
        amountPaid,
        paymentType,
        totalAmount,
        remainingBalance
      } = data

      if (!customerEmail) {
        return { statusCode: 400, body: JSON.stringify({ error: 'customerEmail is required' }) }
      }

      const content = `
        <div style="display: inline-block; padding: 6px 14px; font-size: 11px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; border-radius: 4px; margin-bottom: 20px; background-color: rgba(78, 134, 38, 0.25); color: #8ce04a; border: 1px solid rgba(78, 134, 38, 0.5);">
          Payment Received &bull; Confirmed
        </div>
        <h2 style="color: #fefdf9; margin-top: 0; margin-bottom: 12px; font-size: 24px; font-family: Georgia, 'Times New Roman', serif;">
          Payment Confirmed!
        </h2>
        <p style="margin: 0 0 14px 0; color: #ede5d0; font-size: 15px; line-height: 1.65;">
          Hello ${customerName || 'Valued Guest'}, we have successfully received your payment for your upcoming event at <strong style="color: #ffffff;">PJ Lawn</strong>.
        </p>
        
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse; background-color: #171717; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; margin: 20px 0;">
          <tr>
            <td style="padding: 16px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="left" style="padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #d9cdb5; font-size: 14px;">Receipt / Order ID</td>
                  <td align="right" style="padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #fefdf9; font-family: monospace; font-size: 13px;">${orderId}</td>
                </tr>
                <tr>
                  <td align="left" style="padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #d9cdb5; font-size: 14px;">Event Date</td>
                  <td align="right" style="padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #fefdf9; font-weight: bold; font-size: 14px;">${eventDate}</td>
                </tr>
                <tr>
                  <td align="left" style="padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #d9cdb5; font-size: 14px;">Occasion</td>
                  <td align="right" style="padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #fefdf9; font-weight: bold; font-size: 14px;">${eventType}</td>
                </tr>
                <tr>
                  <td align="left" style="padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #d9cdb5; font-size: 14px;">Payment Type</td>
                  <td align="right" style="padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #fefdf9; font-weight: bold; font-size: 14px;">${paymentType === 'full' ? 'Full Payment' : 'Advance Deposit'}</td>
                </tr>
                <tr>
                  <td align="left" style="padding: 10px 0; ${Number(remainingBalance) > 0 ? 'border-bottom: 1px solid rgba(255, 255, 255, 0.08);' : ''} color: #8ce04a; font-weight: bold; font-size: 14px;">Amount Paid</td>
                  <td align="right" style="padding: 10px 0; ${Number(remainingBalance) > 0 ? 'border-bottom: 1px solid rgba(255, 255, 255, 0.08);' : ''} color: #8ce04a; font-weight: bold; font-size: 16px;">₹${Number(amountPaid).toLocaleString('en-IN')}</td>
                </tr>
                ${Number(remainingBalance) > 0 ? `
                <tr>
                  <td align="left" style="padding: 10px 0; color: #d9cdb5; font-size: 14px;">Remaining Balance</td>
                  <td align="right" style="padding: 10px 0; color: #e8c96d; font-weight: bold; font-size: 15px;">₹${Number(remainingBalance).toLocaleString('en-IN')}</td>
                </tr>
                ` : `
                <tr>
                  <td align="left" style="padding: 10px 0; color: #8ce04a; font-size: 14px;">Balance Status</td>
                  <td align="right" style="padding: 10px 0; color: #8ce04a; font-weight: bold; font-size: 14px;">Paid in Full</td>
                </tr>
                `}
              </table>
            </td>
          </tr>
        </table>

        <div style="text-align: center; margin-top: 28px; margin-bottom: 10px;">
          <a href="https://pjlawn.netlify.app/dashboard" style="display: inline-block; background-color: #e8c96d; color: #0a0a0a !important; font-weight: 900; text-decoration: none; padding: 15px 34px; border-radius: 8px; letter-spacing: 1.5px; text-transform: uppercase; font-size: 13px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);">
            View Booking & Download PDF Receipt
          </a>
        </div>
      `

      const res = await resend.emails.send({
        from: fromEmail,
        to: [customerEmail],
        subject: `Official Payment Receipt - PJ Lawn (₹${Number(amountPaid).toLocaleString('en-IN')})`,
        html: createEmailWrapper(`Payment Receipt`, content)
      })

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, id: res.data?.id })
      }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 4. CONTACT FORM INQUIRY
    // ─────────────────────────────────────────────────────────────────────────────
    if (type === 'contact_inquiry') {
      const { name, email, phone, message } = data

      // Send alert to admin
      if (adminEmail) {
        const adminContent = `
          <div style="display: inline-block; padding: 6px 14px; font-size: 11px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; border-radius: 4px; margin-bottom: 20px; background-color: rgba(232, 201, 109, 0.2); color: #e8c96d; border: 1px solid rgba(232, 201, 109, 0.4);">
            New Website Inquiry
          </div>
          <h2 style="color: #fefdf9; margin-top: 0; margin-bottom: 12px; font-size: 22px; font-family: Georgia, 'Times New Roman', serif;">
            New Contact Message from ${name}
          </h2>
          
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse; background-color: #171717; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; margin: 20px 0;">
            <tr>
              <td style="padding: 16px 20px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td align="left" style="padding: 9px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #d9cdb5; font-size: 14px;">Name</td>
                    <td align="right" style="padding: 9px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #fefdf9; font-weight: bold; font-size: 14px;">${name}</td>
                  </tr>
                  <tr>
                    <td align="left" style="padding: 9px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #d9cdb5; font-size: 14px;">Phone</td>
                    <td align="right" style="padding: 9px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #e8c96d; font-weight: bold; font-size: 14px;"><a href="tel:${phone}" style="color: #e8c96d; text-decoration: none;">${phone}</a></td>
                  </tr>
                  <tr>
                    <td align="left" style="padding: 9px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #d9cdb5; font-size: 14px;">Email</td>
                    <td align="right" style="padding: 9px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #fefdf9; font-size: 14px;"><a href="mailto:${email}" style="color: #fefdf9; text-decoration: none;">${email}</a></td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding-top: 15px;">
                      <p style="color: #d9cdb5; font-size: 13px; margin: 0 0 6px 0;">Message:</p>
                      <p style="color: #fefdf9; margin: 0; background: #0c0c0c; padding: 14px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.08); font-size: 14px; line-height: 1.6;">${message}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        `

        try {
          await resend.emails.send({
            from: fromEmail,
            to: [adminEmail],
            subject: `[Contact Form] New Message from ${name}`,
            html: createEmailWrapper(`New Message from ${name}`, adminContent)
          })
        } catch (adminErr: any) {
          console.error('[send-email] Failed to send admin contact inquiry:', adminErr.message)
        }
      }

      // Send thank you confirmation to visitor
      if (email) {
        const visitorContent = `
          <div style="display: inline-block; padding: 6px 14px; font-size: 11px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; border-radius: 4px; margin-bottom: 20px; background-color: rgba(232, 201, 109, 0.15); color: #e8c96d; border: 1px solid rgba(232, 201, 109, 0.4);">
            Message Received
          </div>
          <h2 style="color: #fefdf9; margin-top: 0; margin-bottom: 12px; font-size: 22px; font-family: Georgia, 'Times New Roman', serif;">
            Hello ${name},
          </h2>
          <p style="margin: 0 0 14px 0; color: #ede5d0; font-size: 15px; line-height: 1.65;">
            Thank you for reaching out to <strong style="color: #ffffff;">PJ Lawn</strong>. We have received your inquiry and our management team will get in touch with you shortly.
          </p>
          <div style="background-color: #171717; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 18px; margin: 20px 0;">
            <p style="margin: 0; color: #d9cdb5; font-style: italic; font-size: 14px; line-height: 1.6;">"${message}"</p>
          </div>
          <p style="margin: 20px 0 0 0; color: #d9cdb5; font-size: 13.5px; line-height: 1.6;">
            If your inquiry is urgent, please feel free to call or WhatsApp us directly at <a href="tel:+919489724975" style="color: #e8c96d; font-weight: bold; text-decoration: none;">+91 94897 24975</a>.
          </p>
        `

        try {
          await resend.emails.send({
            from: fromEmail,
            to: [email],
            subject: `Thank you for contacting PJ Lawn`,
            html: createEmailWrapper(`Inquiry Received`, visitorContent)
          })
        } catch (visErr: any) {
          console.error('[send-email] Failed to send visitor confirmation:', visErr.message)
        }
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: 'Contact inquiry emails processed.' })
      }
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ error: `Unknown email notification type: ${type}` })
    }

  } catch (error: any) {
    console.error('[send-email] Fatal error processing request:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Failed to send email' })
    }
  }
}
