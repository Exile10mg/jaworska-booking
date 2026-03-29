CREATE TABLE "services" (
	"id" varchar(120) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"price" integer NOT NULL,
	"duration" integer NOT NULL,
	"is_fixed_price" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "services" ("id", "name", "description", "price", "duration", "is_fixed_price", "is_active", "sort_order") VALUES
	('regulacja-brwi', 'Regulacja brwi (pęseta/wosk)', 'Precyzyjna regulacja pęsetą i woskiem dla idealnego kształtu.', 35, 20, false, true, 10),
	('henna-klasyczna-regulacja', 'Henna klasyczna + Regulacja', 'Trwała koloryzacja klasyczną henną z precyzyjną regulacją.', 55, 35, false, true, 20),
	('henna-pudrowa-architektura-regulacja', 'Henna pudrowa + Architektura + Regulacja', 'Profesjonalna henna pudrowa z geometrią twarzy i regulacją. Najtrwalszy efekt.', 85, 60, false, true, 30),
	('laminacja-bez-henny', 'Laminacja brwi (bez henny) + Regulacja', 'Ujarzmienie i ułożenie brwi w górę dla efektu uniesienia.', 100, 45, false, true, 40),
	('laminacja-farbka-regulacja', 'Laminacja brwi z koloryzacją (Farbka) + Regulacja', 'Laminacja, farbowanie włosków i regulacja dla wyrazistego wyglądu.', 130, 60, false, true, 50),
	('laminacja-koloryzacja-botox', 'Laminacja brwi z koloryzacją + Botox', 'Zabieg premium: Laminacja, koloryzacja i regulacja z odżywczym botoksem.', 150, 75, true, true, 60),
	('lifting-laminacja-rzes-koloryzacja', 'Lifting + Laminacja rzęs z koloryzacją', 'Trwałe podkręcenie, pogrubienie i przyciemnienie naturalnych rzęs. Efekt otwartego oka bez maskary.', 140, 60, true, true, 70),
	('geometria-brwi-regulacja-nitka-wosk', 'Geometria brwi + Precyzyjna regulacja (Nitka/Wosk)', 'Wyznaczenie idealnego kształtu brwi za pomocą pomiarów twarzy oraz usunięcie zbędnych włosków. Bez koloryzacji.', 45, 30, false, true, 80);
--> statement-breakpoint
CREATE INDEX "services_active_sort_idx" ON "services" USING btree ("is_active","sort_order");--> statement-breakpoint
CREATE INDEX "services_created_at_idx" ON "services" USING btree ("created_at");
