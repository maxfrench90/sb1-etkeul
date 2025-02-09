import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
sgMail.setApiKey(import.meta.env.VITE_SENDGRID_API_KEY);

interface BookingDetails {
  clientName: string;
  clientEmail: string;
  providerName: string;
  providerEmail: string;
  serviceType: string;
  date: Date;
  time: string;
  location: string;
  price: number;
}

export async function sendBookingConfirmation(booking: BookingDetails) {
  // Client email
  const clientMsg = {
    to: booking.clientEmail,
    from: 'notifications@petpathways.com',
    templateId: import.meta.env.VITE_SENDGRID_CLIENT_TEMPLATE_ID,
    dynamicTemplateData: {
      clientName: booking.clientName,
      providerName: booking.providerName,
      serviceType: booking.serviceType,
      date: new Date(booking.date).toLocaleDateString(),
      time: booking.time,
      location: booking.location,
      price: booking.price.toFixed(2),
    },
  };

  // Provider email
  const providerMsg = {
    to: booking.providerEmail,
    from: 'notifications@petpathways.com',
    templateId: import.meta.env.VITE_SENDGRID_PROVIDER_TEMPLATE_ID,
    dynamicTemplateData: {
      clientName: booking.clientName,
      providerName: booking.providerName,
      serviceType: booking.serviceType,
      date: new Date(booking.date).toLocaleDateString(),
      time: booking.time,
      location: booking.location,
      price: booking.price.toFixed(2),
    },
  };

  try {
    await Promise.all([
      sgMail.send(clientMsg),
      sgMail.send(providerMsg)
    ]);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}