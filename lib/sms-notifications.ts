import "server-only";

import twilio from "twilio";

type BookingSmsPayload = {
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  customerName: string;
  customerPhone: string;
  price: number | null;
};

function normalizePhoneToE164(phone: string) {
  const digits = phone.trim().replace(/\D/g, "");

  if (!digits) {
    return null;
  }

  return `+${digits}`;
}

function formatBookingDate(date: string) {
  return new Intl.DateTimeFormat("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Warsaw",
  }).format(new Date(`${date}T12:00:00`));
}

function buildBookingSmsBody({
  serviceName,
  appointmentDate,
  appointmentTime,
  customerName,
  price,
}: BookingSmsPayload) {
  const priceLine =
    typeof price === "number"
      ? `Kwota do zapłaty na miejscu: ${price} zł.`
      : "Kwota do zapłaty zgodnie z cennikiem salonu.";

  return [
    `Jaworska Beauty: Dziękujemy ${customerName}!`,
    "Twoja rezerwacja została przyjęta.",
    serviceName,
    `${formatBookingDate(appointmentDate)}, godz. ${appointmentTime}.`,
    priceLine,
    "Adres: Różana 28/66, Lublin.",
  ].join(" ");
}

export async function sendBookingConfirmationSms(payload: BookingSmsPayload) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

  if (!accountSid || !authToken) {
    console.warn("SMS skipped: missing Twilio credentials.");
    return;
  }

  if (!fromNumber && !messagingServiceSid) {
    console.warn(
      "SMS skipped: missing TWILIO_FROM_NUMBER or TWILIO_MESSAGING_SERVICE_SID.",
    );
    return;
  }

  const to = normalizePhoneToE164(payload.customerPhone);

  if (!to) {
    console.warn("SMS skipped: invalid customer phone.", payload.customerPhone);
    return;
  }

  const client = twilio(accountSid, authToken);

  await client.messages.create({
    body: buildBookingSmsBody(payload),
    to,
    ...(messagingServiceSid
      ? { messagingServiceSid }
      : { from: fromNumber as string }),
  });
}
