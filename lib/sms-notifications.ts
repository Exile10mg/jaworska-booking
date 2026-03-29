import "server-only";

import twilio from "twilio";

import {
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_E164,
} from "@/lib/contact-details";

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

function buildBaseDetails({
  serviceName,
  appointmentDate,
  appointmentTime,
  price,
}: BookingSmsPayload) {
  const priceLine =
    typeof price === "number"
      ? `Kwota do zapłaty na miejscu: ${price} zł.`
      : "Kwota do zapłaty zgodnie z cennikiem salonu.";

  return [
    serviceName,
    `${formatBookingDate(appointmentDate)}, godz. ${appointmentTime}.`,
    priceLine,
    "Adres: Różana 28/66, Lublin.",
    `Kontakt: +48 ${CONTACT_PHONE_DISPLAY}.`,
  ];
}

function buildContactLine() {
  return `Kontakt w sprawie rezerwacji: +48 ${CONTACT_PHONE_DISPLAY}.`;
}

async function sendSms(toPhone: string, body: string) {
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

  const to = normalizePhoneToE164(toPhone);

  if (!to) {
    console.warn("SMS skipped: invalid customer phone.", toPhone);
    return;
  }

  const client = twilio(accountSid, authToken);

  await client.messages.create({
    body,
    to,
    ...(messagingServiceSid
      ? { messagingServiceSid }
      : { from: fromNumber as string }),
  });
}

export async function sendBookingPendingSms(payload: BookingSmsPayload) {
  const body = [
    `Jaworska Beauty: Dziękujemy ${payload.customerName}!`,
    "Twoja wizyta czeka na potwierdzenie.",
    buildContactLine(),
  ].join(" ");

  await sendSms(payload.customerPhone, body);
}

export async function sendBookingConfirmedSms(payload: BookingSmsPayload) {
  const body = [
    `Jaworska Beauty: ${payload.customerName}, Twoja wizyta została potwierdzona.`,
    ...buildBaseDetails(payload),
  ].join(" ");

  await sendSms(payload.customerPhone, body);
}

export async function sendBookingCancelledSms(payload: BookingSmsPayload) {
  const body = [
    `Jaworska Beauty: ${payload.customerName}, Twoja wizyta została anulowana.`,
    buildContactLine(),
  ].join(" ");

  await sendSms(payload.customerPhone, body);
}

export async function sendBookingDeletedSms(payload: BookingSmsPayload) {
  const body = [
    `Jaworska Beauty: ${payload.customerName}, Twoja wizyta została usunięta z systemu.`,
    buildContactLine(),
  ].join(" ");

  await sendSms(payload.customerPhone, body);
}

export async function sendAdminNewBookingSms(payload: BookingSmsPayload) {
  const notesLine = payload.customerPhone
    ? `Telefon klientki: ${payload.customerPhone}.`
    : "";
  const body = [
    "Jaworska Beauty: wpłynęła nowa rezerwacja oczekująca na potwierdzenie.",
    `${payload.customerName} - ${payload.serviceName}.`,
    `${formatBookingDate(payload.appointmentDate)}, godz. ${payload.appointmentTime}.`,
    notesLine,
  ]
    .filter(Boolean)
    .join(" ");

  await sendSms(CONTACT_PHONE_E164, body);
}
