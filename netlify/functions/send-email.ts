import { Handler } from '@netlify/functions'
import { Resend } from 'resend'

// Helper for generating responsive, luxury PJ Lawn HTML email template
function createEmailWrapper(title: string, contentHtml: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0a0a0a;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #ede5d0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #0a0a0a;
      padding: 40px 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #111111;
      border: 1px solid rgba(232, 201, 109, 0.25);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
    }
    .header {
      background: linear-gradient(180deg, #161616 0%, #111111 100%);
      padding: 35px 20px;
      text-align: center;
      border-bottom: 1px solid rgba(232, 201, 109, 0.2);
    }
    .brand-title {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 28px;
      font-weight: bold;
      color: #e8c96d;
      letter-spacing: 4px;
      margin: 0 0 6px 0;
      text-transform: uppercase;
    }
    .brand-subtitle {
      font-size: 11px;
      color: #d9cdb5;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin: 0;
    }
    .content {
      padding: 35px 30px;
      line-height: 1.6;
      font-size: 15px;
    }
    .badge {
      display: inline-block;
      padding: 6px 14px;
      font-size: 11px;
      font-weight: bold;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      border-radius: 4px;
      margin-bottom: 20px;
    }
    .badge-gold {
      background-color: rgba(232, 201, 109, 0.15);
      color: #e8c96d;
      border: 1px solid rgba(232, 201, 109, 0.4);
    }
    .badge-green {
      background-color: rgba(78, 134, 38, 0.2);
      color: #8ce04a;
      border: 1px solid rgba(78, 134, 38, 0.4);
    }
    .card {
      background-color: #171717;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 20px;
      margin: 24px 0;
    }
    .card-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 14px;
    }
    .card-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .card-label {
      color: #d9cdb5;
    }
    .card-value {
      color: #fefdf9;
      font-weight: 600;
      text-align: right;
    }
    .btn {
      display: inline-block;
      background-color: #e8c96d;
      color: #0a0a0a !important;
      font-weight: 900;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      font-size: 14px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
      margin: 20px 0 10px 0;
    }
    .footer {
      background-color: #0e0e0e;
      padding: 25px 20px;
      text-align: center;
      font-size: 12px;
      color: #888888;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }
    .footer a {
      color: #e8c96d;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="brand-title">PJ Lawn</div>
        <p class="brand-subtitle">Nagercoil's Premier Open-Air Venue</p>
      </div>
      <div class="content">
        ${contentHtml}
      </div>
      <div class="footer">
        <p style="margin: 0 0 8px 0;">PJ Lawn &bull; Parvathipuram, Nagercoil, Tamil Nadu 629003</p>
        <p style="margin: 0;">Phone: <a href="tel:+919489724975">+91 94897 24975</a> &bull; <a href="https://pjlawn.netlify.app">pjlawn.netlify.app</a></p>
      </div>
    </div>
  </div>
</body>
</html>
  `
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
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

    // 1. Booking Request Received
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

      // A) Email to Customer
      if (customerEmail) {
        const customerContent = `
          <div class="badge badge-gold">Request Received</div>
          <h2 style="color: #fefdf9; margin-top: 0; font-size: 22px; font-family: Georgia, serif;">Hello ${customerName || 'Guest'},</h2>
          <p>Thank you for choosing <strong>PJ Lawn</strong> for your special occasion. We have received your booking inquiry for <strong>${eventDate}</strong>.</p>
          <p>Our venue management team is currently reviewing your date and guest capacity. Once approved, you will receive a formal confirmation with your exact quote and secure payment link.</p>
          
          <div class="card">
            <div class="card-row">
              <span class="card-label">Event Date</span>
              <span class="card-value">${eventDate}</span>
            </div>
            <div class="card-row">
              <span class="card-label">Occasion</span>
              <span class="card-value">${eventType}</span>
            </div>
            <div class="card-row">
              <span class="card-label">Expected Guests</span>
              <span class="card-value">${guestCount} Guests</span>
            </div>
            <div class="card-row">
              <span class="card-label">Estimated Price</span>
              <span class="card-value">₹${Number(estimatedPrice || 15000).toLocaleString()}</span>
            </div>
            ${notes ? `
            <div class="card-row">
              <span class="card-label">Special Notes</span>
              <span class="card-value">${notes}</span>
            </div>
            ` : ''}
          </div>

          <p style="color: #d9cdb5; font-size: 14px;">If you have any urgent queries or custom catering requests, feel free to call or WhatsApp us anytime at <strong>+91 94897 24975</strong>.</p>
        `

        await resend.emails.send({
          from: fromEmail,
          to: [customerEmail],
          subject: `Booking Request Received for ${eventDate} - PJ Lawn`,
          html: createEmailWrapper(`Booking Request - ${customerName}`, customerContent)
        })
      }

      // B) Email alert to Admin
      if (adminEmail) {
        const adminContent = `
          <div class="badge badge-gold">New Booking Request</div>
          <h2 style="color: #fefdf9; margin-top: 0; font-size: 22px; font-family: Georgia, serif;">New Customer Booking Request</h2>
          <p>A new event booking inquiry has been submitted online and requires your approval in the admin dashboard.</p>
          
          <div class="card">
            <div class="card-row">
              <span class="card-label">Customer Name</span>
              <span class="card-value">${customerName}</span>
            </div>
            <div class="card-row">
              <span class="card-label">Phone</span>
              <span class="card-value"><a href="tel:${customerPhone}" style="color: #e8c96d;">${customerPhone}</a></span>
            </div>
            <div class="card-row">
              <span class="card-label">Email</span>
              <span class="card-value">${customerEmail || 'Not provided'}</span>
            </div>
            <div class="card-row">
              <span class="card-label">Event Date</span>
              <span class="card-value" style="color: #e8c96d;">${eventDate}</span>
            </div>
            <div class="card-row">
              <span class="card-label">Occasion</span>
              <span class="card-value">${eventType}</span>
            </div>
            <div class="card-row">
              <span class="card-label">Guests</span>
              <span class="card-value">${guestCount}</span>
            </div>
            ${notes ? `
            <div class="card-row">
              <span class="card-label">Notes</span>
              <span class="card-value">${notes}</span>
            </div>
            ` : ''}
          </div>

          <div style="text-align: center;">
            <a href="https://pjlawn.netlify.app/admin" class="btn">Open Admin Dashboard</a>
          </div>
        `

        await resend.emails.send({
          from: fromEmail,
          to: [adminEmail],
          subject: `[New Booking Alert] ${customerName} - ${eventType} on ${eventDate}`,
          html: createEmailWrapper(`New Booking Alert`, adminContent)
        })
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: 'Booking request emails sent.' })
      }
    }

    // 2. Booking Approved by Admin
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
        <div class="badge badge-green">Booking Approved</div>
        <h2 style="color: #fefdf9; margin-top: 0; font-size: 22px; font-family: Georgia, serif;">Great News, ${customerName || 'Customer'}!</h2>
        <p>Your booking request for <strong>${eventDate}</strong> has been officially approved by PJ Lawn management!</p>
        <p>Your venue date is now held. To confirm and secure your reservation, please complete the advance payment below.</p>
        
        <div class="card">
          <div class="card-row">
            <span class="card-label">Event Date</span>
            <span class="card-value">${eventDate}</span>
          </div>
          <div class="card-row">
            <span class="card-label">Occasion</span>
            <span class="card-value">${eventType}</span>
          </div>
          <div class="card-row">
            <span class="card-label">Total Venue Price</span>
            <span class="card-value">₹${Number(totalAmount).toLocaleString()}</span>
          </div>
          <div class="card-row">
            <span class="card-label" style="color: #e8c96d; font-weight: bold;">Advance Required</span>
            <span class="card-value" style="color: #e8c96d; font-size: 16px;">₹${Number(advanceAmount || 5000).toLocaleString()}</span>
          </div>
        </div>

        <div style="text-align: center;">
          <a href="https://pjlawn.netlify.app/dashboard" class="btn">Pay Advance & Confirm Date</a>
        </div>

        <p style="text-align: center; color: #888888; font-size: 12px; margin-top: 15px;">
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

    // 3. Payment Confirmation & Receipt
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
        <div class="badge badge-green">Payment Received &bull; Confirmed</div>
        <h2 style="color: #fefdf9; margin-top: 0; font-size: 22px; font-family: Georgia, serif;">Payment Confirmed!</h2>
        <p>Hello ${customerName || 'Customer'}, we have successfully received your payment for your upcoming event at <strong>PJ Lawn</strong>.</p>
        
        <div class="card">
          <div class="card-row">
            <span class="card-label">Receipt / Order ID</span>
            <span class="card-value" style="font-family: monospace; font-size: 12px;">${orderId}</span>
          </div>
          <div class="card-row">
            <span class="card-label">Event Date</span>
            <span class="card-value">${eventDate}</span>
          </div>
          <div class="card-row">
            <span class="card-label">Occasion</span>
            <span class="card-value">${eventType}</span>
          </div>
          <div class="card-row">
            <span class="card-label">Payment Type</span>
            <span class="card-value">${paymentType === 'full' ? 'Full Payment' : 'Advance Deposit'}</span>
          </div>
          <div class="card-row">
            <span class="card-label" style="color: #8ce04a; font-weight: bold;">Amount Paid</span>
            <span class="card-value" style="color: #8ce04a; font-size: 16px;">₹${Number(amountPaid).toLocaleString()}</span>
          </div>
          ${Number(remainingBalance) > 0 ? `
          <div class="card-row">
            <span class="card-label">Remaining Balance</span>
            <span class="card-value" style="color: #e8c96d;">₹${Number(remainingBalance).toLocaleString()}</span>
          </div>
          ` : `
          <div class="card-row">
            <span class="card-label">Balance Status</span>
            <span class="card-value" style="color: #8ce04a;">Paid in Full</span>
          </div>
          `}
        </div>

        <div style="text-align: center;">
          <a href="https://pjlawn.netlify.app/dashboard" class="btn">View Booking & Download PDF Receipt</a>
        </div>
      `

      const res = await resend.emails.send({
        from: fromEmail,
        to: [customerEmail],
        subject: `Official Payment Receipt - PJ Lawn (₹${Number(amountPaid).toLocaleString()})`,
        html: createEmailWrapper(`Payment Receipt`, content)
      })

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, id: res.data?.id })
      }
    }

    // 4. Contact Form Inquiry
    if (type === 'contact_inquiry') {
      const { name, email, phone, message } = data

      // Send alert to admin
      if (adminEmail) {
        const adminContent = `
          <div class="badge badge-gold">New Website Inquiry</div>
          <h2 style="color: #fefdf9; margin-top: 0; font-size: 22px; font-family: Georgia, serif;">New Message from ${name}</h2>
          
          <div class="card">
            <div class="card-row">
              <span class="card-label">Name</span>
              <span class="card-value">${name}</span>
            </div>
            <div class="card-row">
              <span class="card-label">Phone</span>
              <span class="card-value"><a href="tel:${phone}" style="color: #e8c96d;">${phone}</a></span>
            </div>
            <div class="card-row">
              <span class="card-label">Email</span>
              <span class="card-value"><a href="mailto:${email}" style="color: #e8c96d;">${email}</a></span>
            </div>
            <div style="padding-top: 15px;">
              <p class="card-label" style="margin-bottom: 6px;">Message:</p>
              <p style="color: #fefdf9; margin: 0; background: #0a0a0a; padding: 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.06);">${message}</p>
            </div>
          </div>
        `

        await resend.emails.send({
          from: fromEmail,
          to: [adminEmail],
          subject: `[Contact Form] New Message from ${name}`,
          html: createEmailWrapper(`New Message from ${name}`, adminContent)
        })
      }

      // Send thank you confirmation to visitor
      if (email) {
        const visitorContent = `
          <div class="badge badge-gold">Message Received</div>
          <h2 style="color: #fefdf9; margin-top: 0; font-size: 22px; font-family: Georgia, serif;">Hello ${name},</h2>
          <p>Thank you for reaching out to <strong>PJ Lawn</strong>. We have received your message and our team will get back to you shortly.</p>
          <div class="card">
            <p style="margin: 0; color: #d9cdb5;"><em>"${message}"</em></p>
          </div>
          <p>If your inquiry is urgent, please feel free to call or WhatsApp us directly at <a href="tel:+919489724975" style="color: #e8c96d; font-weight: bold;">+91 94897 24975</a>.</p>
        `

        await resend.emails.send({
          from: fromEmail,
          to: [email],
          subject: `Thank you for contacting PJ Lawn`,
          html: createEmailWrapper(`Inquiry Received`, visitorContent)
        })
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: 'Contact inquiry emails sent.' })
      }
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ error: `Unknown email notification type: ${type}` })
    }

  } catch (error: any) {
    console.error('Error sending email via Resend:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Failed to send email' })
    }
  }
}
