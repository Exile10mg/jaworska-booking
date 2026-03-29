"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  Bell,
  CalendarCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  Instagram,
  MapPin,
  MessageSquare,
  MessageSquareText,
  Phone,
  Sparkles,
  User,
  UserRound,
  X,
} from "lucide-react";

import {
  defaultLegalDocuments,
  type LegalDocument,
} from "@/lib/default-legal-documents";
import {
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_E164,
} from "@/lib/contact-details";

type Service = {
  id: string;
  name: string;
  price: number;
  duration: number;
  description: string;
  isFixedPrice?: boolean;
};

type AvailabilityMap = Record<string, string[]>;

type TimePeriod = "morning" | "afternoon" | "evening";
type LegalModalContent = "regulamin" | "polityka" | null;
type LegalDocumentsMap = Record<Exclude<LegalModalContent, null>, LegalDocument>;
type CountryOption = {
  iso: string;
  name: string;
  dialCode: string;
  flag: string;
};
type CountryDropdownPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};
type SuccessStepProps = {
  serviceName: string;
  dateLabel: string;
  time: string;
  onReset: () => void;
};

type BookedSummary = {
  serviceName: string;
  dateLabel: string;
  time: string;
};

const SERVICES_LOADING_MIN_DURATION_MS = 2400;

const phoneCountries: CountryOption[] = [
  { iso: "PL", name: "Polska", dialCode: "48", flag: "🇵🇱" },
  { iso: "DE", name: "Niemcy", dialCode: "49", flag: "🇩🇪" },
  { iso: "GB", name: "Wielka Brytania", dialCode: "44", flag: "🇬🇧" },
  { iso: "FR", name: "Francja", dialCode: "33", flag: "🇫🇷" },
  { iso: "ES", name: "Hiszpania", dialCode: "34", flag: "🇪🇸" },
  { iso: "IT", name: "Włochy", dialCode: "39", flag: "🇮🇹" },
  { iso: "UA", name: "Ukraina", dialCode: "380", flag: "🇺🇦" },
  { iso: "CZ", name: "Czechy", dialCode: "420", flag: "🇨🇿" },
  { iso: "SK", name: "Słowacja", dialCode: "421", flag: "🇸🇰" },
  { iso: "US", name: "Stany Zjednoczone", dialCode: "1", flag: "🇺🇸" },
];

function formatPhoneDigits(digits: string) {
  const cleanDigits = digits.replace(/\D/g, "").slice(0, 12);
  const chunks = cleanDigits.match(/.{1,3}/g) ?? [];
  return chunks.join(" ");
}

function formatInternationalPhone(dialCode: string, digits: string) {
  const localFormatted = formatPhoneDigits(digits);
  return localFormatted ? `+${dialCode} ${localFormatted}` : `+${dialCode}`;
}

function getFlagEmoji(iso: string) {
  return iso
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

function getFlagImageSrc(iso: string) {
  return `https://purecatamphetamine.github.io/country-flag-icons/3x2/${iso.toUpperCase()}.svg`;
}

function FlagIcon({ iso, name }: { iso: string; name: string }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <span
        className="text-lg leading-none"
        role="img"
        aria-label={`Flaga ${name}`}
        style={{ fontFamily: '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif' }}
      >
        {getFlagEmoji(iso)}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={getFlagImageSrc(iso)}
      alt={`Flaga ${name}`}
      className="h-4 w-5 rounded-[2px] border border-stone-200 object-cover"
      loading="lazy"
      onError={() => setHasError(true)}
    />
  );
}

function SuccessStep({ serviceName, dateLabel, time, onReset }: SuccessStepProps) {
  return (
    <div className="animate-step-enter flex h-full flex-col justify-center">
      <div className="rounded-[32px] border border-[#ead8c6] bg-[linear-gradient(180deg,_#fffdf9,_#fff6eb)] p-6 text-center shadow-[0_20px_50px_rgba(199,153,99,0.18)]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#c79963] text-white shadow-[0_18px_34px_rgba(199,153,99,0.24)] animate-[pulse_2.4s_ease-in-out_infinite]">
          <Sparkles className="h-8 w-8" />
        </div>

        <h2 className="mt-5 text-2xl font-bold text-stone-900">
          Twoja rezerwacja została wysłana!
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          Dziękujemy za zaufanie. Twoja wizyta jest teraz oczekująca i czeka na potwierdzenie.
        </p>

        <div className="mt-4 flex w-full flex-col items-center gap-1 rounded-2xl bg-white/80 px-4 py-2 text-sm text-stone-700 md:inline-flex md:w-auto md:flex-row md:gap-2">
          <span className="text-center font-semibold text-stone-900">{serviceName}</span>
          <span className="hidden text-stone-300 md:inline">|</span>
          <span>{dateLabel}</span>
          <span className="hidden text-stone-300 md:inline">|</span>
          <span className="font-semibold">{time}</span>
        </div>

        <div className="mt-5 rounded-[24px] border border-[#ead8c6] bg-white/85 p-4 text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8c6b4a]">
            Co dalej?
          </p>
          <div className="mt-3 space-y-3 text-sm text-stone-700">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-[#fff4e8] p-2 text-[#8c6b4a]">
                <MessageSquare className="h-4 w-4" />
              </div>
              <p>
                Po zapisaniu rezerwacji otrzymasz SMS z informacją, że wizyta oczekuje
                na potwierdzenie.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-[#fff4e8] p-2 text-[#8c6b4a]">
                <Phone className="h-4 w-4" />
              </div>
              <p>
                Gdy potwierdzimy termin, wyślemy kolejny SMS z potwierdzeniem wizyty.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-[#fff4e8] p-2 text-[#8c6b4a]">
                <Bell className="h-4 w-4" />
              </div>
              <p>
                Jeśli wizyta zostanie anulowana, również otrzymasz osobny SMS z taką informacją.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="mt-6 flex h-12 w-full items-center justify-center rounded-2xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-black"
        >
          Rozumiem, wróć do strony głównej
        </button>
      </div>
    </div>
  );
}

function ServiceCardSkeleton({ index }: { index: number }) {
  return (
    <div
      className="loading-sheen animate-card-enter relative overflow-hidden rounded-[24px] border border-stone-200 bg-[linear-gradient(180deg,_#fffdfa_0%,_#fff8f2_100%)] p-3 md:p-4 lg:rounded-[22px] lg:p-3"
      style={{ animationDelay: `${index * 60}ms` }}
      aria-hidden="true"
    >
      <div className="flex flex-col items-start justify-between gap-2.5 md:flex-row md:items-center md:gap-3 lg:gap-2">
        <div className="min-w-0 flex-1 pr-3 lg:pr-2">
          <div className="skeleton-block h-4 w-4/5 rounded-full" />
          <div className="mt-2 skeleton-block h-3 w-full rounded-full" />
          <div className="mt-1.5 skeleton-block h-3 w-2/3 rounded-full" />
        </div>

        <div className="w-full shrink-0 rounded-xl border border-[#eadfd3] bg-white/80 px-4 py-2 md:w-28 lg:h-11 lg:w-24 lg:px-3">
          <div className="skeleton-block h-2 w-6 rounded-full" />
          <div className="mt-2 skeleton-block h-4 w-14 rounded-full" />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="skeleton-block h-3.5 w-3.5 rounded-full" />
        <div className="skeleton-block h-3 w-20 rounded-full" />
      </div>
    </div>
  );
}

function ServicesLoadingState() {
  return (
    <div className="animate-step-enter space-y-3 pb-1">
      <div className="loading-sheen overflow-hidden rounded-[24px] border border-[#ead8c6] bg-[linear-gradient(135deg,_#fffaf5_0%,_#fff5ea_55%,_#fffaf5_100%)] p-4 shadow-[0_18px_45px_rgba(199,153,99,0.12)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c6b4a]">
          Aktualizujemy ofertę
        </p>
        <div className="mt-2 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#8c6b4a]/10 text-[#8c6b4a]">
            <Sparkles className="h-5 w-5 animate-[pulse_2.2s_ease-in-out_infinite]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-900">
              Ładujemy usługi z bazy danych
            </p>
            <p className="mt-0.5 text-xs leading-5 text-stone-600">
              Zaraz pokażemy aktualny cennik i dostępne zabiegi.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2.5 pb-1 lg:grid lg:grid-cols-2 lg:gap-2.5 lg:space-y-0">
        {Array.from({ length: 6 }).map((_, index) => (
          <ServiceCardSkeleton key={index} index={index} />
        ))}
      </div>
    </div>
  );
}

const weekDayFormatter = new Intl.DateTimeFormat("pl-PL", { weekday: "short" });
const dayFormatter = new Intl.DateTimeFormat("pl-PL", { day: "2-digit" });
const monthShortFormatter = new Intl.DateTimeFormat("pl-PL", { month: "short" });
const monthLongFormatter = new Intl.DateTimeFormat("pl-PL", { month: "long" });
const monthYearFormatter = new Intl.DateTimeFormat("pl-PL", {
  month: "long",
  year: "numeric",
});
const fullDateFormatter = new Intl.DateTimeFormat("pl-PL", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function capitalize(text: string) {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function getMinutesFromTime(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function getTimeSlotsByPeriod(slots: string[], period: TimePeriod) {
  return slots.filter((time) => {
    const minutes = getMinutesFromTime(time);

    if (period === "morning") return minutes < 12 * 60;
    if (period === "afternoon") return minutes >= 12 * 60 && minutes < 17 * 60;
    return minutes >= 17 * 60;
  });
}

function getDefaultTimePeriod(slots: string[]): TimePeriod {
  if (slots.length === 0) return "morning";
  if (getTimeSlotsByPeriod(slots, "morning").length > 0) return "morning";
  if (getTimeSlotsByPeriod(slots, "afternoon").length > 0) return "afternoon";
  return "evening";
}

function getAvailableTimeSlots(dateKey: string, availability: AvailabilityMap) {
  return availability[dateKey] ?? [];
}

function getUpcomingDaysFromToday(
  days = 14,
  availability: AvailabilityMap,
  now = new Date(),
) {
  const baseDate = new Date(now);
  baseDate.setHours(12, 0, 0, 0);

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + index);
    const key = toDateKey(date);
    const totalSlots = getAvailableTimeSlots(key, availability).length;

    return {
      key,
      weekday: weekDayFormatter.format(date).replace(".", ""),
      day: dayFormatter.format(date),
      month: monthShortFormatter.format(date).replace(".", ""),
      fullLabel: fullDateFormatter.format(date),
      hasAvailability: totalSlots > 0,
      isToday: index === 0,
    };
  });
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatDuration(minutes: number) {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${remainingMinutes} min`;
}

function formatVisibleMonthLabel(visibleDateKeys: string[]) {
  if (visibleDateKeys.length === 0) return "";

  const uniqueMonths: Array<{ month: number; year: number }> = [];

  for (const dateKey of visibleDateKeys) {
    const date = parseDateKey(dateKey);
    const token = { month: date.getMonth(), year: date.getFullYear() };
    const alreadyIncluded = uniqueMonths.some(
      (item) => item.month === token.month && item.year === token.year,
    );

    if (!alreadyIncluded) {
      uniqueMonths.push(token);
    }
  }

  if (uniqueMonths.length === 1) {
    const onlyMonth = uniqueMonths[0];
    return capitalize(
      monthYearFormatter.format(new Date(onlyMonth.year, onlyMonth.month, 1)),
    );
  }

  const first = uniqueMonths[0];
  const last = uniqueMonths[uniqueMonths.length - 1];
  const firstLabel = capitalize(
    monthLongFormatter.format(new Date(first.year, first.month, 1)),
  );
  const lastLabel = capitalize(
    monthLongFormatter.format(new Date(last.year, last.month, 1)),
  );

  if (first.year === last.year) {
    return `${firstLabel} / ${lastLabel} ${first.year}`;
  }

  return `${firstLabel} ${first.year} / ${lastLabel} ${last.year}`;
}

export default function Page() {
  const now = new Date();
  const todayKey = toDateKey(now);
  const daysScrollRef = useRef<HTMLDivElement | null>(null);
  const dayItemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const timeSlotsScrollRef = useRef<HTMLDivElement | null>(null);
  const isDraggingDaysRef = useRef(false);
  const isDraggingTimesRef = useRef(false);
  const countryDropdownRef = useRef<HTMLDivElement | null>(null);
  const countryDropdownMenuRef = useRef<HTMLDivElement | null>(null);
  const dragStartXRef = useRef(0);
  const dragStartScrollLeftRef = useRef(0);
  const timeDragStartXRef = useRef(0);
  const timeDragStartScrollLeftRef = useRef(0);
  const suppressDayClickRef = useRef(false);
  const suppressTimeClickRef = useRef(false);
  const isLoadingMoreDaysRef = useRef(false);

  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [isServicesLoading, setIsServicesLoading] = useState(true);
  const [availability, setAvailability] = useState<AvailabilityMap>({});
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [isAvailabilityLoading, setIsAvailabilityLoading] = useState(true);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(todayKey);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriod>(
    getDefaultTimePeriod(getAvailableTimeSlots(todayKey, {})),
  );
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedCountryIso, setSelectedCountryIso] = useState("PL");
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [countryDropdownPosition, setCountryDropdownPosition] =
    useState<CountryDropdownPosition | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const [bookedSummary, setBookedSummary] = useState<BookedSummary | null>(null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLegalAccepted, setIsLegalAccepted] = useState(false);
  const [showLegalError, setShowLegalError] = useState(false);
  const [legalModalContent, setLegalModalContent] =
    useState<LegalModalContent>(null);
  const [legalDocuments, setLegalDocuments] =
    useState<LegalDocumentsMap>(defaultLegalDocuments);
  const [canScrollDaysLeft, setCanScrollDaysLeft] = useState(false);
  const [canScrollDaysRight, setCanScrollDaysRight] = useState(false);
  const [isDraggingDays, setIsDraggingDays] = useState(false);
  const [canScrollTimesLeft, setCanScrollTimesLeft] = useState(false);
  const [canScrollTimesRight, setCanScrollTimesRight] = useState(false);
  const [isDraggingTimes, setIsDraggingTimes] = useState(false);
  const [visibleDaysCount, setVisibleDaysCount] = useState(14);
  const [visibleMonthLabel, setVisibleMonthLabel] = useState(() =>
    capitalize(monthYearFormatter.format(parseDateKey(todayKey))),
  );

  const selectedService =
    services.find((service) => service.id === selectedServiceId) ?? null;
  const upcomingDays = getUpcomingDaysFromToday(visibleDaysCount, availability, now);
  const selectedDay =
    selectedDate === null
      ? null
      : {
          key: selectedDate,
          fullLabel: fullDateFormatter.format(parseDateKey(selectedDate)),
        };
  const availableTimeSlots = selectedDate
    ? getAvailableTimeSlots(selectedDate, availability)
    : [];
  const selectedCountry =
    phoneCountries.find((country) => country.iso === selectedCountryIso) ??
    phoneCountries[0];
  const filteredCountries = phoneCountries.filter((country) => {
    const query = countrySearch.trim().toLowerCase();
    if (!query) return true;

    return (
      country.name.toLowerCase().includes(query) ||
      country.dialCode.includes(query.replace("+", ""))
    );
  });
  const formattedPhone = formatInternationalPhone(selectedCountry.dialCode, phone);
  const filteredTimeSlots = getTimeSlotsByPeriod(
    availableTimeSlots,
    selectedTimePeriod,
  );
  const activeLegalDocument = legalModalContent
    ? legalDocuments[legalModalContent]
    : null;
  const shouldScrollServices = services.length > 6;
  const shouldPinServiceFooter = isServicesLoading || shouldScrollServices;
  const contactReady = name.trim().length > 1 && phone.length >= 6;
  const headerSecondaryButtonClass =
    "flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 h-10 text-sm font-medium text-gray-700 shadow-sm transition-[transform,background-color,color] duration-200 ease-in-out md:hover:scale-[1.03]";
  const headerPrimaryButtonClass =
    "flex items-center gap-2 rounded-full bg-stone-900 px-4 h-10 text-sm font-medium text-white shadow-sm transition-[transform,background-color,color] duration-200 ease-in-out hover:bg-black md:hover:scale-[1.03]";

  const stepMeta = [
    { id: 1, label: "Usługa" },
    { id: 2, label: "Termin" },
    { id: 3, label: "Kontakt" },
    { id: 4, label: "Potwierdzenie" },
  ];

  function goBack() {
    if (step > 1) {
      setStep((current) => current - 1);
    }
  }

  const loadMoreDays = useCallback(() => {
    if (isLoadingMoreDaysRef.current) return;
    isLoadingMoreDaysRef.current = true;

    setVisibleDaysCount((current) => current + 14);

    requestAnimationFrame(() => {
      isLoadingMoreDaysRef.current = false;
    });
  }, []);

  const updateDaysScrollState = useCallback(() => {
    if (!daysScrollRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = daysScrollRef.current;
    const maxScrollLeft = scrollWidth - clientWidth;

    setCanScrollDaysLeft(scrollLeft > 4);
    setCanScrollDaysRight(scrollLeft < maxScrollLeft - 4);
    if (maxScrollLeft - scrollLeft < 140) {
      loadMoreDays();
    }
    const containerRect = daysScrollRef.current.getBoundingClientRect();
    const visibleKeys: string[] = [];

    for (const day of upcomingDays) {
      const element = dayItemRefs.current[day.key];
      if (!element) continue;

      const rect = element.getBoundingClientRect();
      const visibleWidth =
        Math.min(rect.right, containerRect.right) -
        Math.max(rect.left, containerRect.left);

      if (visibleWidth >= rect.width * 0.5) {
        visibleKeys.push(day.key);
      }
    }

    if (visibleKeys.length > 0) {
      setVisibleMonthLabel(formatVisibleMonthLabel(visibleKeys));
    }
  }, [loadMoreDays, upcomingDays]);

  const updateTimeScrollState = useCallback(() => {
    if (!timeSlotsScrollRef.current) {
      setCanScrollTimesLeft(false);
      setCanScrollTimesRight(false);
      return;
    }

    const { scrollLeft, scrollWidth, clientWidth } = timeSlotsScrollRef.current;
    const maxScrollLeft = Math.max(0, scrollWidth - clientWidth);

    setCanScrollTimesLeft(scrollLeft > 4);
    setCanScrollTimesRight(scrollLeft < maxScrollLeft - 4);
  }, []);

  function handleSelectService(serviceId: string) {
    setSelectedServiceId(serviceId);
    setSubmitError(null);
  }

  function handleSelectDate(dateKey: string) {
    const slotsForDate = getAvailableTimeSlots(dateKey, availability);
    setSelectedDate(dateKey);
    setSelectedTime(null);
    setSelectedTimePeriod(getDefaultTimePeriod(slotsForDate));
    setSubmitError(null);
  }

  function handleSelectTime(time: string) {
    setSelectedTime(time);
    setSubmitError(null);
  }

  function handleScrollTimeSlots(direction: "left" | "right") {
    if (!timeSlotsScrollRef.current) return;

    const baseDistance = Math.max(
      180,
      Math.floor(timeSlotsScrollRef.current.clientWidth * 0.85),
    );
    const distance = direction === "left" ? -baseDistance : baseDistance;
    if (direction === "left" && !canScrollTimesLeft) return;
    if (direction === "right" && !canScrollTimesRight) return;

    timeSlotsScrollRef.current.scrollBy({ left: distance, behavior: "smooth" });
  }

  function handleScrollDays(direction: "left" | "right") {
    if (!daysScrollRef.current) return;

    if (direction === "right" && !canScrollDaysRight) {
      loadMoreDays();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!daysScrollRef.current) return;
          daysScrollRef.current.scrollBy({
            left: daysScrollRef.current.clientWidth,
            behavior: "smooth",
          });
        });
      });
      return;
    }

    const distance =
      direction === "left"
        ? -daysScrollRef.current.clientWidth
        : daysScrollRef.current.clientWidth;

    daysScrollRef.current.scrollBy({ left: distance, behavior: "smooth" });
  }

  function handleDaysMouseDown(event: React.MouseEvent<HTMLDivElement>) {
    if (!daysScrollRef.current) return;

    isDraggingDaysRef.current = true;
    setIsDraggingDays(true);
    suppressDayClickRef.current = false;
    dragStartXRef.current = event.clientX;
    dragStartScrollLeftRef.current = daysScrollRef.current.scrollLeft;
  }

  function handleDaysMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    if (!isDraggingDaysRef.current || !daysScrollRef.current) return;

    event.preventDefault();
    const walk = event.clientX - dragStartXRef.current;
    if (Math.abs(walk) > 6) {
      suppressDayClickRef.current = true;
    }
    daysScrollRef.current.scrollLeft = dragStartScrollLeftRef.current - walk;
  }

  function handleDaysWheel(event: React.WheelEvent<HTMLDivElement>) {
    if (!event.shiftKey || !daysScrollRef.current) return;

    event.preventDefault();
    daysScrollRef.current.scrollLeft += event.deltaY + event.deltaX;
  }

  function stopDraggingDays() {
    if (!isDraggingDaysRef.current) return;
    isDraggingDaysRef.current = false;
    setIsDraggingDays(false);
    window.setTimeout(() => {
      suppressDayClickRef.current = false;
    }, 0);
  }

  function handleTimeMouseDown(event: React.MouseEvent<HTMLDivElement>) {
    if (!timeSlotsScrollRef.current) return;

    isDraggingTimesRef.current = true;
    setIsDraggingTimes(true);
    suppressTimeClickRef.current = false;
    timeDragStartXRef.current = event.clientX;
    timeDragStartScrollLeftRef.current = timeSlotsScrollRef.current.scrollLeft;
  }

  function handleTimeMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    if (!isDraggingTimesRef.current || !timeSlotsScrollRef.current) return;

    event.preventDefault();
    const walk = event.clientX - timeDragStartXRef.current;
    if (Math.abs(walk) > 6) {
      suppressTimeClickRef.current = true;
    }
    timeSlotsScrollRef.current.scrollLeft = timeDragStartScrollLeftRef.current - walk;
  }

  function handleTimeWheel(event: React.WheelEvent<HTMLDivElement>) {
    if (!event.shiftKey || !timeSlotsScrollRef.current) return;

    event.preventDefault();
    timeSlotsScrollRef.current.scrollLeft += event.deltaY + event.deltaX;
  }

  function stopDraggingTimes() {
    if (!isDraggingTimesRef.current) return;
    isDraggingTimesRef.current = false;
    setIsDraggingTimes(false);
    window.setTimeout(() => {
      suppressTimeClickRef.current = false;
    }, 0);
  }

  function handleContinueToContact() {
    if (!selectedDate || !selectedTime) return;
    if (!availableTimeSlots.includes(selectedTime)) {
      setSelectedTime(null);
      setSubmitError("Wybrany termin nie jest już dostępny. Wybierz nową godzinę.");
      setStep(2);
      return;
    }

    setSubmitError(null);
    setStep(3);
  }

  function openLegalModal(content: Exclude<LegalModalContent, null>) {
    setLegalModalContent(content);
  }

  function closeLegalModal() {
    setLegalModalContent(null);
  }

  const updateCountryDropdownPosition = useCallback(() => {
    if (!countryDropdownRef.current) return;

    const rect = countryDropdownRef.current.getBoundingClientRect();
    const viewportPadding = 16;
    const preferredHeight = 300;
    const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
    const spaceAbove = rect.top - viewportPadding;
    const shouldOpenUp = spaceBelow < 220 && spaceAbove > spaceBelow;
    const availableSpace = shouldOpenUp ? spaceAbove : spaceBelow;
    const maxHeight = Math.max(160, Math.min(preferredHeight, availableSpace - 8));
    const top = shouldOpenUp ? rect.top - maxHeight - 8 : rect.bottom + 8;

    setCountryDropdownPosition({
      top: Math.max(viewportPadding, top),
      left: rect.left,
      width: rect.width,
      maxHeight,
    });
  }, []);

  const centerSelectedDay = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (!daysScrollRef.current || !selectedDate) return;

    const container = daysScrollRef.current;
    const selectedElement = dayItemRefs.current[selectedDate];
    if (!selectedElement) return;

    const targetLeft =
      selectedElement.offsetLeft -
      container.clientWidth / 2 +
      selectedElement.clientWidth / 2;
    const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth);
    const safeLeft = Math.min(Math.max(0, targetLeft), maxScrollLeft);

    container.scrollTo({
      left: safeLeft,
      behavior,
    });
  }, [selectedDate]);

  function resetBooking() {
    const resetNow = new Date();
    const resetTodayKey = toDateKey(resetNow);
    const resetSlots = getAvailableTimeSlots(resetTodayKey, availability);

    setStep(1);
    setSelectedServiceId(null);
    setSelectedDate(resetTodayKey);
    setSelectedTime(null);
    setSelectedTimePeriod(getDefaultTimePeriod(resetSlots));
    setName("");
    setPhone("");
    setSelectedCountryIso("PL");
    setIsCountryDropdownOpen(false);
    setCountrySearch("");
    setNotes("");
    setIsLegalAccepted(false);
    setShowLegalError(false);
    setLegalModalContent(null);
    setIsBooked(false);
    setBookedSummary(null);
    setSubmitError(null);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadServices() {
      const loadingStartedAt = Date.now();

      try {
        setIsServicesLoading(true);
        setServicesError(null);

        const response = await fetch("/api/services", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Nie udało się pobrać usług.");
        }

        const data = (await response.json()) as { services?: Service[] };

        if (cancelled) return;

        setServices(Array.isArray(data.services) ? data.services : []);
      } catch (error) {
        if (cancelled) return;
        console.error(error);
        setServices([]);
        setServicesError("Nie udało się pobrać listy usług. Odśwież stronę.");
      } finally {
        const elapsed = Date.now() - loadingStartedAt;
        const remaining = Math.max(
          0,
          SERVICES_LOADING_MIN_DURATION_MS - elapsed,
        );

        if (remaining > 0) {
          await new Promise((resolve) => setTimeout(resolve, remaining));
        }

        if (!cancelled) {
          setIsServicesLoading(false);
        }
      }
    }

    void loadServices();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadLegalDocuments() {
      try {
        const response = await fetch("/api/legal-documents", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Nie udało się pobrać treści dokumentów.");
        }

        const data = (await response.json()) as {
          documents?: Partial<LegalDocumentsMap>;
        };

        if (cancelled || !data.documents) return;

        setLegalDocuments({
          regulamin: data.documents.regulamin ?? defaultLegalDocuments.regulamin,
          polityka: data.documents.polityka ?? defaultLegalDocuments.polityka,
        });
      } catch (error) {
        if (cancelled) return;
        console.error(error);
        setLegalDocuments(defaultLegalDocuments);
      }
    }

    void loadLegalDocuments();

    return () => {
      cancelled = true;
    };
  }, []);

  const loadAvailability = useCallback(async () => {
    const response = await fetch("/api/availability", {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Nie udało się pobrać dostępności.");
    }

    const data = (await response.json()) as {
      availability?: AvailabilityMap;
    };

    setAvailability(data.availability ?? {});
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function syncAvailability() {
      try {
        setIsAvailabilityLoading(true);
        setAvailabilityError(null);

        const response = await fetch("/api/availability", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Nie udało się pobrać dostępności.");
        }

        const data = (await response.json()) as {
          availability?: AvailabilityMap;
        };

        if (cancelled) return;

        setAvailability(data.availability ?? {});
      } catch (error) {
        if (cancelled) return;
        console.error(error);
        setAvailability({});
        setAvailabilityError(
          "Nie udało się pobrać terminarza. Spróbuj odświeżyć stronę.",
        );
      } finally {
        if (!cancelled) {
          setIsAvailabilityLoading(false);
        }
      }
    }

    void syncAvailability();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (selectedServiceId && !services.some((service) => service.id === selectedServiceId)) {
      setSelectedServiceId(null);
    }
  }, [selectedServiceId, services]);

  useEffect(() => {
    const slotsForSelectedDate = selectedDate
      ? getAvailableTimeSlots(selectedDate, availability)
      : [];

    if (!isBooked && selectedTime && !slotsForSelectedDate.includes(selectedTime)) {
      setSelectedTime(null);
    }

    if (slotsForSelectedDate.length === 0) {
      if (selectedTimePeriod !== "morning") {
        setSelectedTimePeriod("morning");
      }
      return;
    }
  }, [availability, isBooked, selectedDate, selectedTime, selectedTimePeriod]);

  useEffect(() => {
    if (isLegalAccepted) {
      setShowLegalError(false);
    }
  }, [isLegalAccepted]);

  useEffect(() => {
    updateDaysScrollState();
  }, [step, upcomingDays.length, selectedDate, updateDaysScrollState]);

  useEffect(() => {
    const scroller = daysScrollRef.current;
    if (!scroller) return;

    const handleScroll = () => updateDaysScrollState();
    const handleResize = () => updateDaysScrollState();

    scroller.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      scroller.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [updateDaysScrollState]);

  useEffect(() => {
    if (step !== 2 || !selectedDate) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        centerSelectedDay("auto");
      });
    });
  }, [step, selectedDate, upcomingDays.length, centerSelectedDay]);

  useEffect(() => {
    updateTimeScrollState();
  }, [filteredTimeSlots.length, selectedDate, selectedTimePeriod, step, updateTimeScrollState]);

  useEffect(() => {
    const scroller = timeSlotsScrollRef.current;
    if (!scroller) {
      setCanScrollTimesLeft(false);
      setCanScrollTimesRight(false);
      return;
    }

    const handleScroll = () => updateTimeScrollState();
    const handleResize = () => updateTimeScrollState();

    scroller.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      scroller.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [filteredTimeSlots.length, step, updateTimeScrollState]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const targetNode = event.target as Node;
      const clickedInsideTrigger =
        !!countryDropdownRef.current &&
        countryDropdownRef.current.contains(targetNode);
      const clickedInsideMenu =
        !!countryDropdownMenuRef.current &&
        countryDropdownMenuRef.current.contains(targetNode);

      if (!clickedInsideTrigger && !clickedInsideMenu) {
        setIsCountryDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!isCountryDropdownOpen) return;

    updateCountryDropdownPosition();
    const handleViewportChange = () => updateCountryDropdownPosition();

    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [isCountryDropdownOpen, updateCountryDropdownPosition]);

  return (
    <main className="min-h-[100dvh] bg-[#faf8f5] p-2 text-stone-900 sm:p-4 lg:flex lg:items-center lg:justify-center lg:p-8">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col overflow-hidden rounded-[32px] border border-[#f2e3d3] bg-[#fcfaf8] shadow-[0_30px_90px_rgba(166,130,95,0.18)] backdrop-blur lg:min-h-0 lg:h-[85vh] lg:max-w-5xl">
        <section className="shrink-0 px-4 pb-3 pt-4 md:px-6 md:pb-3 md:pt-4">
          <div className="flex flex-col items-center gap-3 border-b border-[#e5e0d8] pb-4 md:flex-row md:items-start md:justify-between">
            <div className="max-w-full text-center md:max-w-[70%] md:text-left">
              <h1 className="font-serif text-3xl font-medium tracking-wide text-stone-900 md:text-[1.9rem]">
                Jaworska Beauty
              </h1>
              <div className="mt-1.5 text-xs text-stone-500 md:text-[13px]">
                <a
                  href="https://maps.app.goo.gl/RLjYMaTppwpzztEw5"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-stone-900 md:hidden"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  Różana 28/66, 20-538 Lublin
                </a>

                <div className="mt-1 flex flex-col items-center gap-1 md:hidden">
                  <a
                    href={`tel:${CONTACT_PHONE_E164}`}
                    className="inline-flex items-center gap-1.5 hover:text-stone-900 transition-colors"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {CONTACT_PHONE_DISPLAY}
                  </a>
                  <a
                    href="https://www.instagram.com/jaworska_beauty/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 hover:text-stone-900 transition-colors"
                  >
                    <Instagram className="h-3.5 w-3.5 text-[#C13584]" />
                    @jaworska_beauty
                  </a>
                </div>

                <div className="mt-1.5 hidden items-center gap-2.5 md:flex">
                  <a
                    href="https://maps.app.goo.gl/RLjYMaTppwpzztEw5"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 transition-colors hover:text-stone-900"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                      Różana 28/66, 20-538 Lublin
                  </a>
                  <span className="text-stone-300">|</span>
                  <a
                    href={`tel:${CONTACT_PHONE_E164}`}
                    className="inline-flex items-center gap-1.5 hover:text-stone-900 transition-colors"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {CONTACT_PHONE_DISPLAY}
                  </a>
                  <span className="text-stone-300">|</span>
                  <a
                    href="https://www.instagram.com/jaworska_beauty/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 hover:text-stone-900 transition-colors"
                  >
                    <Instagram className="h-3.5 w-3.5 text-[#C13584]" />
                    @jaworska_beauty
                  </a>
                </div>
              </div>
            </div>
            <div className="w-full md:w-auto">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                <div className="flex items-center justify-center gap-2 md:gap-3">
                  <a
                    href="https://www.instagram.com/jaworska_beauty/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-12 w-12 items-center justify-center rounded-full border-none bg-gradient-to-tr from-[#FFD600] via-[#FF0069] to-[#7638FF] text-white shadow-md transition hover:brightness-110 md:h-9 md:w-auto md:gap-2 md:px-3.5 md:text-sm"
                  >
                    <Instagram className="h-5 w-5 text-white md:h-4 md:w-4" />
                    <span className="hidden md:inline">Instagram</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setIsMapModalOpen(true)}
                    className={`${headerSecondaryButtonClass} h-12 w-12 justify-center px-0 text-xs cursor-pointer transition-colors hover:bg-gray-50 md:h-9 md:w-auto md:gap-2 md:px-3.5 md:text-sm`}
                  >
                    <MapPin className="h-5 w-5 text-stone-500 md:h-4 md:w-4" />
                    <span className="hidden md:inline">Pokaż na mapie</span>
                  </button>
                </div>
                <a
                  href={`tel:${CONTACT_PHONE_E164}`}
                  className={`${headerPrimaryButtonClass} h-10 w-full justify-center px-3.5 text-sm cursor-pointer md:h-9 md:w-auto md:text-sm`}
                >
                  <Phone className="h-4 w-4 text-white" />
                  Zadzwoń teraz
                </a>
              </div>
            </div>
          </div>

          <div className="mb-5 mt-7 lg:mb-4 lg:mt-6">
            <div className="relative">
              <div className="absolute left-0 top-1/2 z-0 h-[1px] w-full -translate-y-1/2 bg-gray-200" />
              <div className="relative z-10 grid grid-cols-4">
                {stepMeta.map((item) => {
                  const isActive = item.id === step;
                  const isComplete = item.id < step || (item.id === 4 && isBooked);

                  return (
                    <div key={item.id} className="flex justify-center">
                      <div
                        className={cn(
                          "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold",
                          isActive &&
                            "border-[#8c6b4a] bg-[#8c6b4a] text-white ring-4 ring-[#8c6b4a]/20 ring-offset-2 ring-offset-[#fcfaf8]",
                          isComplete &&
                            !isActive &&
                            "border-[#8c6b4a] bg-[#8c6b4a] text-white",
                          !isActive &&
                            !isComplete &&
                            "border-gray-200 bg-white text-gray-400",
                        )}
                      >
                        {isComplete ? <CheckCircle2 className="h-4 w-4" /> : item.id}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-2 hidden grid-cols-4 md:grid">
              {stepMeta.map((item) => {
                const isActive = item.id === step;
                const isComplete = item.id < step || (item.id === 4 && isBooked);

                return (
                  <div key={item.id} className="flex justify-center">
                    <span
                      className={cn(
                        "text-[10px] sm:text-xs uppercase tracking-[0.2em] font-medium",
                        isActive || isComplete ? "text-gray-900" : "text-gray-400",
                      )}
                    >
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="flex-1 flex flex-col overflow-visible px-4 pb-4 pt-0 md:px-5 lg:overflow-hidden lg:px-6 lg:pb-4 lg:pt-0">
          {!isBooked && (
            <div
              className={cn(
                "flex items-center",
                step === 1 ? "mb-4 mt-0" : "mb-2",
              )}
            >
              <div>
                <p
                  className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#8c6b4a]" />
                  KROK {step} Z 4
                </p>
                <h2
                  className="mt-2 text-2xl font-medium text-gray-800"
                >
                  {step === 1 && "Wybierz usługę"}
                  {step === 2 && "Znajdź dogodny termin"}
                  {step === 3 && "Uzupełnij dane"}
                  {step === 4 && "Sprawdź podsumowanie"}
                </h2>
                {step === 1 && (
                  <p className="mt-1 text-sm font-normal text-gray-500">
                    Zaznacz interesujący Cię zabieg, aby przejść dalej.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex min-h-0 flex-1 flex-col">

          {step === 1 && (
            <div
              className={cn(
                "animate-step-enter flex flex-col",
                shouldPinServiceFooter ? "h-auto lg:h-full lg:min-h-0" : "h-auto",
              )}
            >
              <div
                className={cn(
                  shouldPinServiceFooter &&
                    "lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:overflow-hidden",
                )}
              >
                {isServicesLoading ? (
                  <ServicesLoadingState />
                ) : servicesError ? (
                  <div className="rounded-[24px] border border-red-200 bg-red-50 px-4 py-5 text-sm text-red-700">
                    {servicesError}
                  </div>
                ) : services.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-stone-200 bg-stone-50 px-4 py-8 text-center text-sm text-stone-500">
                    Brak aktywnych usług do rezerwacji.
                  </div>
                ) : (
                  <div
                    className={cn(
                      !shouldScrollServices && "pb-1",
                      shouldScrollServices &&
                        "pb-1 lg:service-list-scroll lg:flex-1 lg:overflow-y-auto lg:pr-3 lg:pb-6",
                    )}
                  >
                    <div className="space-y-2.5 lg:grid lg:grid-cols-2 lg:gap-2 lg:space-y-0">
                    {services.map((service) => {
                      const isSelected = service.id === selectedServiceId;

                      return (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() => handleSelectService(service.id)}
                          className={cn(
                            "group relative w-full overflow-hidden rounded-[24px] border p-3 text-left transition-colors duration-200 ease-in-out md:p-4 lg:h-full lg:rounded-[22px] lg:p-3",
                            isSelected &&
                              "border-[#8c6b4a] bg-[#8c6b4a]/5",
                            !isSelected &&
                              "border-stone-200 bg-[linear-gradient(180deg,_#fffdfa_0%,_#fff8f2_100%)] md:hover:border-[#dcc0a4]",
                          )}
                        >
                          <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-[linear-gradient(180deg,_rgba(255,255,255,0.5),_rgba(255,255,255,0))]" />
                          <div className="relative flex flex-col items-start justify-between gap-2.5 md:flex-row md:items-center md:gap-3 lg:gap-2">
                            <div className="min-w-0 flex-1 pr-3 lg:pr-2">
                              <h3 className="text-[13px] font-semibold leading-5 text-stone-900 lg:text-[12.5px] lg:leading-[1.35]">
                                {service.name}
                              </h3>
                              <p className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-stone-600 md:line-clamp-3 lg:text-[10.5px]">
                                {service.description}
                              </p>
                            </div>
                            <div
                              className={cn(
                                "shrink-0 flex h-12 w-full items-center justify-between rounded-xl border border-[#eadfd3] bg-white/65 px-4 py-2 md:w-28 lg:h-11 lg:w-24 lg:px-3",
                                isSelected && "border-[#ccb195] bg-[#fff5ea]",
                              )}
                            >
                              <div className="leading-none">
                                {!service.isFixedPrice && (
                                  <p className="text-[9px] tracking-[0.12em] text-stone-400">od</p>
                                )}
                                <p
                                  className={cn(
                                    "text-sm font-semibold text-[#8f6742] lg:text-[15px]",
                                    service.isFixedPrice ? "" : "mt-1",
                                  )}
                                >
                                  {service.price} zł
                                </p>
                              </div>
                              <span
                                className={cn(
                                  "inline-flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all duration-200 ease-in-out lg:h-[18px] lg:w-[18px]",
                                  isSelected
                                    ? "border-stone-900 bg-stone-900 text-white"
                                    : "border-[#e5e0d8] bg-transparent text-transparent",
                                )}
                                aria-label={isSelected ? "Wybrano usługę" : "Wybierz usługę"}
                              >
                                <Check className="h-3.5 w-3.5" />
                              </span>
                            </div>
                          </div>

                          <div className="relative mt-1.5 text-xs lg:mt-1">
                            <span className="inline-flex items-center gap-2 text-xs text-stone-400 lg:text-[11px]">
                              <Clock3 className="h-3.5 w-3.5 text-[#b88659]" />
                              Czas: {formatDuration(service.duration)}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                    </div>
                  </div>
                )}
              </div>
              <div className="sticky bottom-0 z-10 mt-4 shrink-0 bg-[#fcfaf8] pt-3 md:static md:bottom-auto md:z-auto md:bg-transparent md:pt-0 lg:mt-auto">
                <button
                  type="button"
                  onClick={() => selectedServiceId && setStep(2)}
                  disabled={!selectedServiceId}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 px-4 text-sm font-semibold text-white transition-[transform,background-color,color] duration-200 ease-in-out hover:bg-stone-800 md:hover:scale-[1.01] disabled:cursor-not-allowed disabled:bg-stone-300 disabled:opacity-50"
                >
                  Przejdź do terminu
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && selectedService && (
            <div className="animate-step-enter flex h-full flex-col">
              <div className="space-y-2.5 md:space-y-4 lg:space-y-3">
              <div className="rounded-[24px] border border-[#ead8c6] bg-[#fffaf5] p-3 md:p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[#9b6f47]">
                  Wybrana usługa
                </p>
                <div className="mt-2 flex items-start justify-between gap-2.5 md:gap-3">
                  <div className="min-w-0 flex-1 pr-2">
                    <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-stone-900 md:text-base">
                      {selectedService.name}
                    </h3>
                    <p className="mt-1 hidden text-xs text-stone-500 sm:block">
                      Czas: {formatDuration(selectedService.duration)}
                    </p>
                  </div>
                  <p className="shrink-0 whitespace-nowrap text-base font-semibold text-stone-900 md:text-lg">
                    {selectedService.price} zł
                  </p>
                </div>
              </div>

              <div className="w-full max-w-full overflow-hidden rounded-[24px] border border-[#eadfd3] bg-white/80 p-3 md:p-4">
                <div className="mb-3 flex items-center justify-between md:mb-4">
                  <button
                    type="button"
                    onClick={() => handleScrollDays("left")}
                    disabled={!canScrollDaysLeft}
                    className={cn(
                      "inline-flex h-9 w-9 items-center justify-center rounded-full border bg-white transition",
                      canScrollDaysLeft
                        ? "border-stone-200 text-stone-600 hover:border-stone-300"
                        : "cursor-not-allowed border-stone-100 text-stone-300",
                    )}
                    aria-label="Przewiń dni w lewo"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <p className="text-lg font-semibold text-stone-900">
                    {visibleMonthLabel}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleScrollDays("right")}
                    className={cn(
                      "inline-flex h-9 w-9 items-center justify-center rounded-full border bg-white transition",
                      canScrollDaysRight
                        ? "border-stone-200 text-stone-600 hover:border-stone-300"
                        : "border-stone-200 text-stone-500 hover:border-stone-300",
                    )}
                    aria-label="Przewiń dni w prawo"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                <div
                  ref={daysScrollRef}
                  className={cn(
                    "w-full select-none overflow-x-auto overflow-y-hidden overscroll-x-auto px-4 py-4 [scrollbar-width:none] [-ms-overflow-style:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden",
                    isDraggingDays ? "cursor-grabbing" : "cursor-grab",
                  )}
                  onMouseDown={handleDaysMouseDown}
                  onMouseMove={handleDaysMouseMove}
                  onMouseUp={stopDraggingDays}
                  onMouseLeave={stopDraggingDays}
                  onWheel={handleDaysWheel}
                >
                  <div className="flex min-w-max gap-2">
                    {upcomingDays.map((day) => {
                      const isSelected = day.key === selectedDate;

                      return (
                        <button
                          key={day.key}
                          ref={(node) => {
                            dayItemRefs.current[day.key] = node;
                          }}
                          type="button"
                          onClick={(event) => {
                            if (suppressDayClickRef.current) {
                              event.preventDefault();
                              suppressDayClickRef.current = false;
                              return;
                            }
                            handleSelectDate(day.key);
                          }}
                          className={cn(
                            "relative my-1 flex min-w-[62px] flex-col items-center rounded-2xl border px-2 py-2.5 transition",
                            isSelected &&
                              "z-10 border-[#8c6b4a] bg-[#8c6b4a] text-white",
                            !isSelected &&
                              "border-stone-200 bg-white text-stone-700 hover:border-[#d9c0a7]",
                          )}
                        >
                          <span className="text-[10px] uppercase tracking-[0.18em]">
                            {day.weekday}
                          </span>
                          <span className="mt-1 text-lg font-semibold">{day.day}</span>
                          <span className="text-[10px] uppercase tracking-[0.14em] opacity-70">
                            {day.month}
                          </span>
                          <span
                            className={cn(
                              "mt-2 h-0.5 w-6 rounded-full",
                              isSelected
                                ? "bg-white/80"
                                : day.hasAvailability
                                  ? "bg-emerald-500"
                                  : "bg-red-400",
                            )}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-[#eadfd3] bg-white/80 p-3 md:p-4">
                <div className="mb-3 inline-flex w-full rounded-2xl bg-stone-100 p-1 md:mb-4">
                  {[
                    { id: "morning", label: "Rano" },
                    { id: "afternoon", label: "Popołudnie" },
                    { id: "evening", label: "Wieczór" },
                  ].map((period) => {
                    const isActive = selectedTimePeriod === period.id;

                    return (
                      <button
                        key={period.id}
                        type="button"
                        onClick={() => {
                          setSelectedTimePeriod(period.id as TimePeriod);
                          setSelectedTime(null);
                        }}
                        className={cn(
                          "h-10 flex-1 rounded-xl text-sm font-medium transition",
                          isActive
                            ? "bg-white text-stone-900 shadow-sm"
                            : "text-stone-500 hover:text-stone-700",
                        )}
                      >
                        {period.label}
                      </button>
                    );
                  })}
                </div>

                {isAvailabilityLoading ? (
                  <div className="flex h-10 items-center justify-center rounded-xl border border-dashed border-stone-300 bg-stone-50 px-3 text-center text-xs text-stone-500">
                    Ładowanie terminarza...
                  </div>
                ) : availabilityError ? (
                  <div className="flex min-h-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-center text-xs text-red-700">
                    {availabilityError}
                  </div>
                ) : selectedDate ? (
                  filteredTimeSlots.length > 0 ? (
                    <>
                      <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleScrollTimeSlots("left")}
                        disabled={!canScrollTimesLeft}
                        className={cn(
                          "hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-white transition md:inline-flex",
                          canScrollTimesLeft
                            ? "border-stone-200 text-stone-600 hover:border-stone-300"
                            : "pointer-events-none border-stone-100 text-stone-300 opacity-30",
                        )}
                        aria-label="Przewiń godziny w lewo"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <div
                        ref={timeSlotsScrollRef}
                        className={cn(
                          "flex-1 select-none overflow-x-auto overscroll-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden",
                          isDraggingTimes ? "cursor-grabbing" : "cursor-grab",
                        )}
                        onMouseDown={handleTimeMouseDown}
                        onMouseMove={handleTimeMouseMove}
                        onMouseUp={stopDraggingTimes}
                        onMouseLeave={stopDraggingTimes}
                        onWheel={handleTimeWheel}
                      >
                        <div className="flex min-w-max flex-nowrap gap-2 pr-1">
                          {filteredTimeSlots.map((time) => {
                            const isSelected = time === selectedTime;

                            return (
                              <button
                                key={time}
                                type="button"
                                onClick={(event) => {
                                  if (suppressTimeClickRef.current) {
                                    event.preventDefault();
                                    suppressTimeClickRef.current = false;
                                    return;
                                  }
                                  handleSelectTime(time);
                                }}
                                className={cn(
                                  "h-9 rounded-full border px-3 text-sm font-medium transition md:h-10 md:px-4",
                                  isSelected
                                    ? "border-[#8c6b4a] bg-[#8c6b4a] text-white"
                                    : "border-stone-200 bg-white text-stone-700 hover:border-[#d9c0a7]",
                                )}
                              >
                                {time}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleScrollTimeSlots("right")}
                        disabled={!canScrollTimesRight}
                        className={cn(
                          "hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-white transition md:inline-flex",
                          canScrollTimesRight
                            ? "border-stone-200 text-stone-600 hover:border-stone-300"
                            : "pointer-events-none border-stone-100 text-stone-300 opacity-30",
                        )}
                        aria-label="Przewiń godziny w prawo"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex h-10 items-center justify-center rounded-xl border border-dashed border-stone-300 bg-stone-50 px-3 text-center text-xs text-stone-500">
                      {availableTimeSlots.length > 0
                        ? "Brak wolnych godzin w tej porze dnia."
                        : "Brak terminów w tym dniu."}
                    </div>
                  )
                ) : (
                  <div className="flex h-10 items-center justify-center rounded-xl border border-dashed border-stone-300 bg-stone-50 px-3 text-center text-xs text-stone-500">
                    Najpierw wybierz dzień, aby zobaczyć wolne godziny.
                  </div>
                )}
              </div>
              </div>

              <div className="sticky bottom-0 z-20 mt-auto -mx-1 flex gap-3 bg-[#fcfaf8]/95 px-1 pb-1 pt-3 backdrop-blur supports-[backdrop-filter]:bg-[#fcfaf8]/80 md:static md:mx-0 md:bg-transparent md:px-0 md:pb-0 md:pt-5 lg:mb-1">
                <button
                  type="button"
                  onClick={goBack}
                  className="inline-flex h-14 w-14 shrink-0 items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white text-sm font-medium text-stone-700 transition-[transform,background-color,color] duration-200 ease-in-out hover:bg-stone-50 md:w-auto md:px-6 md:hover:scale-[1.01]"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden md:inline">Wstecz</span>
                </button>
                <button
                  type="button"
                  onClick={handleContinueToContact}
                  disabled={!selectedDate || !selectedTime}
                  className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-stone-900 px-4 text-sm font-semibold text-white transition-[transform,background-color,color] duration-200 ease-in-out hover:bg-stone-800 md:hover:scale-[1.01] disabled:cursor-not-allowed disabled:bg-stone-300 disabled:opacity-50"
                >
                  Przejdź dalej
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              {submitError && (
                <p className="mt-2 text-center text-sm font-medium text-red-600">
                  {submitError}
                </p>
              )}
            </div>
          )}

          {step === 3 && selectedService && selectedDay && selectedTime && (
            <div className="animate-step-enter flex h-full flex-col">
              <div className="space-y-3 lg:space-y-2.5">
                <div className="rounded-[26px] border border-[#ead8c6] bg-[#fffaf5] p-3.5">
                  <p className="text-xs uppercase tracking-[0.24em] text-[#9b6f47]">
                    Twój termin
                  </p>
                  <div className="mt-2 space-y-1.5 text-sm text-stone-700">
                    <p className="font-semibold text-stone-900">{selectedService.name}</p>
                    <p>{selectedDay.fullLabel}</p>
                    <p>Godzina {selectedTime}</p>
                  </div>
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="space-y-2">
                    <label
                      htmlFor="booking-name"
                      className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500"
                    >
                      <UserRound className="h-3.5 w-3.5 text-[#b88659]" />
                      Imię i nazwisko
                    </label>
                    <input
                      id="booking-name"
                      type="text"
                      autoComplete="name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Np. Anna Jaworska"
                      className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-3.5 text-sm leading-tight outline-none transition-[border-color,box-shadow] duration-200 ease-in-out placeholder:text-stone-400 focus:border-[#c79963] focus:ring-4 focus:ring-[#f4e5d5] lg:h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <p
                      id="booking-phone-label"
                      className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500"
                    >
                      <Phone className="h-3.5 w-3.5 text-[#b88659]" />
                      Numer telefonu
                    </p>
                    <div ref={countryDropdownRef} className="relative">
                      <div className="flex h-12 w-full items-center overflow-hidden rounded-2xl border border-stone-200 bg-white outline-none transition-[border-color,box-shadow] duration-200 ease-in-out focus-within:border-[#8c6b4a] focus-within:ring-4 focus-within:ring-[#f4e5d5] lg:h-11">
                        <button
                          type="button"
                          onClick={() => {
                            setCountrySearch("");
                            setIsCountryDropdownOpen((open) => !open);
                          }}
                          className="inline-flex h-full items-center gap-2 border-r border-stone-200 px-3 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
                          aria-label="Wybierz kraj"
                        >
                          <FlagIcon
                            iso={selectedCountry.iso}
                            name={selectedCountry.name}
                          />
                          <span>+{selectedCountry.dialCode}</span>
                          <ChevronDown className="h-4 w-4 text-stone-500" />
                        </button>
                        <div className="flex-1">
                          <input
                            id="booking-phone"
                            aria-labelledby="booking-phone-label"
                            type="tel"
                            inputMode="numeric"
                            autoComplete="tel"
                            value={formatPhoneDigits(phone)}
                            onChange={(event) => {
                              const digitsOnly = event.target.value
                                .replace(/\D/g, "")
                                .slice(0, 12);
                              setPhone(digitsOnly);
                            }}
                            onPaste={(event) => {
                              event.preventDefault();
                              const pastedDigits = event.clipboardData
                                .getData("text")
                                .replace(/\D/g, "")
                                .slice(0, 12);
                              setPhone(pastedDigits);
                            }}
                            placeholder="Np. 123 456 789"
                            className="h-full w-full bg-transparent px-3.5 text-sm leading-tight text-stone-900 outline-none placeholder:text-stone-400"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="booking-notes"
                    className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500"
                  >
                    <MessageSquareText className="h-3.5 w-3.5 text-[#b88659]" />
                    Uwagi do wizyty
                  </label>
                  <textarea
                    id="booking-notes"
                    rows={3}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Opcjonalnie: napisz, jeśli chcesz coś doprecyzować"
                    className="h-20 max-h-[100px] w-full resize-none rounded-2xl border border-stone-200 bg-white px-3.5 pb-2.5 pt-3 text-sm outline-none transition-[border-color,box-shadow] duration-200 ease-in-out placeholder:text-stone-400 focus:border-[#c79963] focus:ring-4 focus:ring-[#f4e5d5]"
                  />
                </div>

                <div className="rounded-[24px] border border-[#ead8c6] bg-[#fff8f1] p-3 text-sm text-stone-700">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 rounded-full bg-white p-1.5 text-[#b88659] shadow-sm">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-stone-900">
                        Płatność tylko gotówką w salonie
                      </p>
                      <p className="mt-0.5 leading-5 text-stone-600">
                        Rezerwacja nie wymaga przedpłaty ani płatności online.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={cn(
                  "mb-3 mt-4 rounded-2xl border bg-[#faf8f5] p-3.5 transition-colors duration-200 sm:p-5 lg:p-4",
                  showLegalError && !isLegalAccepted
                    ? "border-red-300 bg-red-50/60"
                    : "border-gray-100",
                )}
              >
                <div className="flex items-start gap-4">
                  <input
                    id="legal-consent"
                    type="checkbox"
                    checked={isLegalAccepted}
                    onChange={(event) => {
                      setIsLegalAccepted(event.target.checked);
                      if (event.target.checked) {
                        setShowLegalError(false);
                      }
                    }}
                    className={cn(
                      "mt-0.5 h-6 w-6 cursor-pointer rounded-md accent-[#8C6B4A] transition-all duration-200 ease-in-out focus:ring-[#8C6B4A]",
                      showLegalError && !isLegalAccepted
                        ? "border-red-400"
                        : "border-gray-300",
                    )}
                  />
                  <p className="text-sm leading-6 text-gray-700">
                    Przeczytałam i akceptuję{" "}
                    <button
                      type="button"
                      onClick={() => openLegalModal("regulamin")}
                      className="cursor-pointer font-semibold text-[#8c6b4a] underline transition-colors hover:text-[#6f543a]"
                    >
                      Regulamin
                    </button>{" "}
                    oraz{" "}
                    <button
                      type="button"
                      onClick={() => openLegalModal("polityka")}
                      className="cursor-pointer font-semibold text-[#8c6b4a] underline transition-colors hover:text-[#6f543a]"
                    >
                      Politykę Prywatności
                    </button>{" "}
                    serwisu. Wiem, że są one niezbędne do realizacji mojej
                    rezerwacji.
                  </p>
                </div>
                {showLegalError && !isLegalAccepted && (
                  <p className="mt-2 pl-10 text-xs font-medium text-red-600">
                    Aby przejść dalej, zaakceptuj Regulamin i Politykę Prywatności.
                  </p>
                )}
              </div>

              <div className="mt-auto flex gap-3 pt-4 md:pt-5 lg:mb-1">
                <button
                  type="button"
                  onClick={goBack}
                  className="inline-flex h-14 w-14 shrink-0 items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white text-sm font-medium text-stone-700 transition-[transform,background-color,color] duration-200 ease-in-out hover:bg-stone-50 md:w-auto md:px-6 md:hover:scale-[1.01]"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden md:inline">Wstecz</span>
                </button>
                <button
                  type="button"
                  disabled={!contactReady}
                  onClick={() => {
                    if (!contactReady) return;
                    if (!isLegalAccepted) {
                      setShowLegalError(true);
                      return;
                    }
                    setShowLegalError(false);
                    setSubmitError(null);
                    setStep(4);
                  }}
                  className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-stone-900 px-4 text-sm font-semibold text-white transition-[transform,background-color,color] duration-200 ease-in-out hover:bg-stone-800 md:hover:scale-[1.01] disabled:cursor-not-allowed disabled:bg-stone-300"
                >
                  Przejdź dalej
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {step === 4 && !isBooked && selectedService && selectedDay && selectedTime && (
            <div className="animate-step-enter flex h-full flex-col">
              <div className="space-y-2.5 lg:space-y-2">
                <div className="rounded-[26px] border border-stone-200 bg-white p-3.5 shadow-sm">
                  <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-stone-500">
                    <CalendarCheck className="h-4 w-4 text-[#8c6b4a]" />
                    Podsumowanie wizyty
                  </p>

                  <div className="mt-3 grid gap-2.5 lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="rounded-2xl bg-stone-50/90 p-3">
                      <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#8c6b4a]" />
                        Usługa
                      </p>
                      <p className="mt-1.5 text-base font-semibold leading-5 text-stone-900">
                        {selectedService.name}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#fdf7ef] p-3">
                      <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                        <CalendarCheck className="h-3.5 w-3.5 text-[#8c6b4a]" />
                        Termin
                      </p>
                      <p className="mt-1 text-sm font-semibold text-stone-900">
                        {selectedDay.fullLabel}
                      </p>
                      <div className="mt-1.5 inline-flex items-center gap-2 rounded-xl bg-[#8c6b4a]/10 px-2.5 py-1.5">
                        <Clock3 className="h-4 w-4 text-[#8c6b4a]" />
                        <span className="text-2xl font-bold leading-none text-stone-900 lg:text-3xl">
                          {selectedTime}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 grid gap-2 lg:grid-cols-2">
                    <div className="rounded-2xl border border-stone-200 bg-white p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                        Kontakt
                      </p>
                      <div className="mt-2 flex flex-col gap-2 text-sm text-stone-800">
                        <p className="inline-flex items-center gap-2">
                          <User className="h-4 w-4 text-[#8c6b4a]" />
                          <span className="font-semibold text-stone-900">{name}</span>
                        </p>
                        <p className="inline-flex items-center gap-2">
                          <Phone className="h-4 w-4 text-[#8c6b4a]" />
                          <span className="font-semibold text-stone-900">{formattedPhone}</span>
                        </p>
                      </div>
                    </div>

                    {notes.trim() ? (
                      <div className="rounded-2xl border border-stone-200 bg-white p-3">
                        <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                          <MessageSquareText className="h-3.5 w-3.5 text-[#8c6b4a]" />
                          Uwagi
                        </p>
                        <p className="mt-1.5 text-sm leading-5 text-gray-600">{notes}</p>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/80 p-3 text-sm text-stone-500">
                        Brak dodatkowych uwag.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-[24px] border border-[#e6d4bf] border-l-4 border-l-[#8c6b4a] bg-[#fff8f1] p-3.5 text-sm text-stone-700">
                  <p className="font-semibold uppercase tracking-[0.16em] text-stone-500">
                    Do zapłaty na miejscu
                  </p>
                  <p className="mt-1 text-3xl font-bold text-stone-900">
                    {selectedService.price} zł
                  </p>
                  <p className="mt-1.5 text-xs leading-5 text-stone-600">
                    Płatność gotówką po wizycie.
                  </p>
                </div>
              </div>

              <div className="mt-auto flex gap-3 pt-4 md:pt-5 lg:mb-1">
                <button
                  type="button"
                  onClick={goBack}
                  disabled={isSubmitting}
                  className="inline-flex h-14 w-14 shrink-0 items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white text-sm font-medium text-stone-700 transition-[transform,background-color,color] duration-200 ease-in-out hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto md:px-6 md:hover:scale-[1.01]"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden md:inline">Wstecz</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!selectedService || !selectedDate || !selectedTime || !contactReady) {
                      return;
                    }

                    setIsSubmitting(true);
                    setSubmitError(null);

                    try {
                      const response = await fetch("/api/book", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          serviceId: selectedService.id,
                          serviceName: selectedService.name,
                          price: selectedService.price,
                          date: selectedDate,
                          time: selectedTime,
                          name: name.trim(),
                          phone: formattedPhone,
                          notes: notes.trim(),
                        }),
                      });

                      if (!response.ok) {
                        const payload = (await response.json().catch(() => null)) as
                          | { error?: string }
                          | null;
                        throw new Error(
                          payload?.error ?? "Nie udało się zapisać rezerwacji.",
                        );
                      }

                      setAvailability((current) => {
                        const nextSlots = (current[selectedDate] ?? []).filter(
                          (time) => time !== selectedTime,
                        );

                        return {
                          ...current,
                          [selectedDate]: nextSlots,
                        };
                      });
                      setBookedSummary({
                        serviceName: selectedService.name,
                        dateLabel: selectedDay?.fullLabel ?? "",
                        time: selectedTime,
                      });
                      setIsBooked(true);
                    } catch (error) {
                      console.error(error);
                      if (
                        error instanceof Error &&
                        error.message === "Wybrany termin nie jest już dostępny."
                      ) {
                        try {
                          await loadAvailability();
                        } catch (refreshError) {
                          console.error(refreshError);
                        }

                        setSelectedTime(null);
                        setStep(2);
                        setSubmitError(
                          "Wybrany termin nie jest już dostępny. Wybierz nową godzinę.",
                        );
                        return;
                      }

                      setSubmitError(
                        error instanceof Error
                          ? error.message
                          : "Nie udało się zapisać rezerwacji. Spróbuj ponownie.",
                      );
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  disabled={isSubmitting}
                  className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-stone-900 px-4 text-sm font-semibold text-white transition-all hover:bg-black disabled:cursor-not-allowed disabled:bg-stone-300"
                >
                  {isSubmitting ? "Zapisywanie..." : "Potwierdź rezerwację"}
                </button>
              </div>

              {submitError && (
                <p className="mt-2 text-center text-sm font-medium text-red-600">
                  {submitError}
                </p>
              )}
            </div>
          )}

          {isBooked && bookedSummary && (
            <SuccessStep
              serviceName={bookedSummary.serviceName}
              dateLabel={bookedSummary.dateLabel}
              time={bookedSummary.time}
              onReset={resetBooking}
            />
          )}
          </div>
        </section>
      </div>

      {isCountryDropdownOpen &&
        countryDropdownPosition &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={countryDropdownMenuRef}
            className="fixed z-[100] rounded-2xl border border-stone-200 bg-white p-2 shadow-xl"
            style={{
              top: countryDropdownPosition.top,
              left: countryDropdownPosition.left,
              width: countryDropdownPosition.width,
            }}
          >
            <input
              type="text"
              value={countrySearch}
              onChange={(event) => setCountrySearch(event.target.value)}
              placeholder="Szukaj kraju lub kodu"
              className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-700 outline-none focus:border-[#8c6b4a] focus:ring-2 focus:ring-[#f4e5d5]"
            />
            <div
              className="mt-2 overflow-y-auto"
              style={{ maxHeight: Math.max(140, countryDropdownPosition.maxHeight - 52) }}
            >
              {filteredCountries.map((country) => (
                <button
                  key={country.iso}
                  type="button"
                  onClick={() => {
                    setSelectedCountryIso(country.iso);
                    setIsCountryDropdownOpen(false);
                    setCountrySearch("");
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-stone-700 transition hover:bg-stone-50"
                >
                    <span className="inline-flex items-center gap-2">
                    <FlagIcon iso={country.iso} name={country.name} />
                    <span>{country.name}</span>
                    <span className="text-stone-400">+{country.dialCode}</span>
                  </span>
                  {country.iso === selectedCountry.iso && (
                    <Check className="h-4 w-4 text-[#8c6b4a]" />
                  )}
                </button>
              ))}
            </div>
          </div>,
          document.body,
        )}

      {legalModalContent && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={closeLegalModal}
        >
          <div
            className="relative flex h-[70vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeLegalModal}
              className="absolute right-4 top-4 z-10 rounded-full bg-white p-2 shadow-md transition-colors hover:bg-gray-100"
              aria-label="Zamknij okno"
            >
              <X className="h-4 w-4 text-stone-700" />
            </button>

            <h2 className="pr-10 text-2xl font-semibold text-stone-900">
              {activeLegalDocument?.title ?? ""}
            </h2>

            <div className="mt-4 flex-1 overflow-y-auto pr-1 text-sm leading-6 text-stone-700">
              <div className="whitespace-pre-wrap">
                {activeLegalDocument?.content ?? ""}
              </div>
            </div>
          </div>
        </div>
      )}

      {isMapModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setIsMapModalOpen(false)}
        >
          <div
            className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white p-2 shadow-2xl md:p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsMapModalOpen(false)}
              className="absolute right-4 top-4 z-10 rounded-full bg-white p-2 shadow-md transition-colors hover:bg-gray-100"
              aria-label="Zamknij mapę"
            >
              <X className="h-4 w-4 text-stone-700" />
            </button>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2498.4115570166955!2d22.51757489461273!3d51.22991489891537!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47225829f740c705%3A0xb0b78543da6f1593!2zUsOzxbxhbmEgMjgvNjYsIDIwLTUzOCBMdWJsaW4!5e0!3m2!1spl!2spl!4v1774371904270!5m2!1spl!2spl"
              className="h-[400px] w-full rounded-xl md:h-[500px]"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      )}
    </main>
  );
}
