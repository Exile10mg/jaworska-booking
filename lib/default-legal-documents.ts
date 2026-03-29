export type LegalDocumentKey = "regulamin" | "polityka";

export type LegalDocument = {
  key: LegalDocumentKey;
  title: string;
  content: string;
};

export const defaultLegalDocuments: Record<LegalDocumentKey, LegalDocument> = {
  regulamin: {
    key: "regulamin",
    title: "Regulamin serwisu",
    content: `Korzystanie z formularza rezerwacji oznacza akceptację zasad świadczenia usług przez Jaworska Beauty.

Rezerwacja terminu jest bezpłatna i dotyczy wizyty realizowanej stacjonarnie. Płatność odbywa się wyłącznie gotówką po wykonaniu usługi.

W przypadku opóźnienia lub rezygnacji prosimy o kontakt telefoniczny tak szybko, jak to możliwe.

Salon zastrzega sobie prawo do zmiany terminu z przyczyn losowych po wcześniejszym kontakcie z klientką.`,
  },
  polityka: {
    key: "polityka",
    title: "Polityka Prywatności",
    content: `Administratorem danych osobowych jest Jaworska Beauty. Dane podane w formularzu są wykorzystywane wyłącznie do obsługi rezerwacji.

Przetwarzane dane obejmują: imię, numer telefonu oraz opcjonalne uwagi dotyczące wizyty.

Dane nie są sprzedawane podmiotom trzecim i są przechowywane tylko przez okres niezbędny do realizacji usługi oraz kontaktu po rezerwacji.

W każdej chwili można poprosić o aktualizację lub usunięcie danych, kontaktując się telefonicznie z salonem.`,
  },
};

export const legalDocumentKeys = Object.keys(
  defaultLegalDocuments,
) as LegalDocumentKey[];
