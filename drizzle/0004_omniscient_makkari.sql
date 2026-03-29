CREATE TABLE "legal_documents" (
	"key" varchar(40) PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "legal_documents" ("key", "title", "content") VALUES
	('regulamin', 'Regulamin serwisu', 'Korzystanie z formularza rezerwacji oznacza akceptację zasad świadczenia usług przez Jaworska Beauty.

Rezerwacja terminu jest bezpłatna i dotyczy wizyty realizowanej stacjonarnie. Płatność odbywa się wyłącznie gotówką po wykonaniu usługi.

W przypadku opóźnienia lub rezygnacji prosimy o kontakt telefoniczny tak szybko, jak to możliwe.

Salon zastrzega sobie prawo do zmiany terminu z przyczyn losowych po wcześniejszym kontakcie z klientką.'),
	('polityka', 'Polityka Prywatności', 'Administratorem danych osobowych jest Jaworska Beauty. Dane podane w formularzu są wykorzystywane wyłącznie do obsługi rezerwacji.

Przetwarzane dane obejmują: imię, numer telefonu oraz opcjonalne uwagi dotyczące wizyty.

Dane nie są sprzedawane podmiotom trzecim i są przechowywane tylko przez okres niezbędny do realizacji usługi oraz kontaktu po rezerwacji.

W każdej chwili można poprosić o aktualizację lub usunięcie danych, kontaktując się telefonicznie z salonem.');
--> statement-breakpoint
CREATE INDEX "legal_documents_updated_at_idx" ON "legal_documents" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "legal_documents_created_at_idx" ON "legal_documents" USING btree ("created_at");
