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

type TwilioConfig = {
  accountSid: string;
  authToken: string;
  fromNumber?: string;
  messagingServiceSid?: string;
};

type ScheduledReminderResult = {
  sid: string;
  sendAt: Date;
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

function getTwilioConfig(): TwilioConfig | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

  if (!accountSid || !authToken) {
    console.warn("SMS skipped: missing Twilio credentials.");
    return null;
  }

  if (!fromNumber && !messagingServiceSid) {
    console.warn(
      "SMS skipped: missing TWILIO_FROM_NUMBER or TWILIO_MESSAGING_SERVICE_SID.",
    );
    return null;
  }

  return {
    accountSid,
    authToken,
    fromNumber,
    messagingServiceSid,
  };
}

function getTwilioClient(config: TwilioConfig) {
  return twilio(config.accountSid, config.authToken);
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const getValue = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");

  const asUtc = Date.UTC(
    getValue("year"),
    getValue("month") - 1,
    getValue("day"),
    getValue("hour"),
    getValue("minute"),
    getValue("second"),
  );

  return asUtc - date.getTime();
}

function getWarsawAppointmentUtcDate(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const offsetMs = getTimeZoneOffsetMs(utcGuess, "Europe/Warsaw");

  return new Date(utcGuess.getTime() - offsetMs);
}

function getReminderSendAt(date: string, time: string) {
  const appointmentUtc = getWarsawAppointmentUtcDate(date, time);
  return new Date(appointmentUtc.getTime() - 24 * 60 * 60 * 1000);
}

async function sendSms(toPhone: string, body: string) {
  const config = getTwilioConfig();

  if (!config) {
    return;
  }

  const to = normalizePhoneToE164(toPhone);

  if (!to) {
    console.warn("SMS skipped: invalid customer phone.", toPhone);
    return;
  }

  const client = getTwilioClient(config);

  await client.messages.create({
    body,
    to,
    ...(config.messagingServiceSid
      ? { messagingServiceSid: config.messagingServiceSid }
      : { from: config.fromNumber as string }),
  });
}

export async function scheduleBookingReminderSms(
  payload: BookingSmsPayload,
): Promise<ScheduledReminderResult | null> {
  const config = getTwilioConfig();

  if (!config) {
    return null;
  }

  if (!config.messagingServiceSid) {
    console.warn(
      "Reminder scheduling skipped: missing TWILIO_MESSAGING_SERVICE_SID.",
    );
    return null;
  }

  const to = normalizePhoneToE164(payload.customerPhone);

  if (!to) {
    console.warn(
      "Reminder scheduling skipped: invalid customer phone.",
      payload.customerPhone,
    );
    return null;
  }

  const sendAt = getReminderSendAt(
    payload.appointmentDate,
    payload.appointmentTime,
  );
  const now = new Date();
  const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);
  const maxScheduleDate = new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000);

  if (sendAt <= fifteenMinutesFromNow) {
    console.warn(
      "Reminder scheduling skipped: sendAt must be at least 15 minutes in the future.",
      {
        bookingDate: payload.appointmentDate,
        bookingTime: payload.appointmentTime,
        sendAt: sendAt.toISOString(),
      },
    );
    return null;
  }

  if (sendAt > maxScheduleDate) {
    console.warn(
      "Reminder scheduling skipped: sendAt is more than 35 days in the future.",
      {
        bookingDate: payload.appointmentDate,
        bookingTime: payload.appointmentTime,
        sendAt: sendAt.toISOString(),
      },
    );
    return null;
  }

  const body = [
    `Jaworska Beauty: ${payload.customerName}, przypominamy o Twojej jutrzejszej wizycie.`,
    ...buildBaseDetails(payload),
  ].join(" ");

  const client = getTwilioClient(config);
  const scheduledMessage = await client.messages.create({
    body,
    to,
    messagingServiceSid: config.messagingServiceSid,
    scheduleType: "fixed",
    sendAt,
  });

  return {
    sid: scheduledMessage.sid,
    sendAt,
  };
}

export async function cancelScheduledBookingReminderSms(messageSid?: string | null) {
  if (!messageSid) {
    return;
  }

  const config = getTwilioConfig();

  if (!config) {
    return;
  }

  const client = getTwilioClient(config);
  await client.messages(messageSid).update({
    status: "canceled",
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

export async function sendBookingRescheduledSms(payload: BookingSmsPayload) {
  const body = [
    `Jaworska Beauty: ${payload.customerName}, termin Twojej wizyty został zmieniony.`,
    ...buildBaseDetails(payload),
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
