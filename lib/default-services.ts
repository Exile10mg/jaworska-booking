export type DefaultService = {
  id: string;
  name: string;
  price: number;
  duration: number;
  description: string;
  isFixedPrice?: boolean;
  isActive?: boolean;
  sortOrder: number;
};

export const defaultServices: DefaultService[] = [
  {
    id: "regulacja-brwi",
    name: "Regulacja brwi (pęseta/wosk)",
    price: 35,
    duration: 20,
    description: "Precyzyjna regulacja pęsetą i woskiem dla idealnego kształtu.",
    sortOrder: 10,
  },
  {
    id: "henna-klasyczna-regulacja",
    name: "Henna klasyczna + Regulacja",
    price: 55,
    duration: 35,
    description: "Trwała koloryzacja klasyczną henną z precyzyjną regulacją.",
    sortOrder: 20,
  },
  {
    id: "henna-pudrowa-architektura-regulacja",
    name: "Henna pudrowa + Architektura + Regulacja",
    price: 85,
    duration: 60,
    description:
      "Profesjonalna henna pudrowa z geometrią twarzy i regulacją. Najtrwalszy efekt.",
    sortOrder: 30,
  },
  {
    id: "laminacja-bez-henny",
    name: "Laminacja brwi (bez henny) + Regulacja",
    price: 100,
    duration: 45,
    description: "Ujarzmienie i ułożenie brwi w górę dla efektu uniesienia.",
    sortOrder: 40,
  },
  {
    id: "laminacja-farbka-regulacja",
    name: "Laminacja brwi z koloryzacją (Farbka) + Regulacja",
    price: 130,
    duration: 60,
    description: "Laminacja, farbowanie włosków i regulacja dla wyrazistego wyglądu.",
    sortOrder: 50,
  },
  {
    id: "laminacja-koloryzacja-botox",
    name: "Laminacja brwi z koloryzacją + Botox",
    price: 150,
    duration: 75,
    description:
      "Zabieg premium: Laminacja, koloryzacja i regulacja z odżywczym botoksem.",
    isFixedPrice: true,
    sortOrder: 60,
  },
  {
    id: "lifting-laminacja-rzes-koloryzacja",
    name: "Lifting + Laminacja rzęs z koloryzacją",
    price: 140,
    duration: 60,
    description:
      "Trwałe podkręcenie, pogrubienie i przyciemnienie naturalnych rzęs. Efekt otwartego oka bez maskary.",
    isFixedPrice: true,
    sortOrder: 70,
  },
  {
    id: "geometria-brwi-regulacja-nitka-wosk",
    name: "Geometria brwi + Precyzyjna regulacja (Nitka/Wosk)",
    price: 45,
    duration: 30,
    description:
      "Wyznaczenie idealnego kształtu brwi za pomocą pomiarów twarzy oraz usunięcie zbędnych włosków. Bez koloryzacji.",
    sortOrder: 80,
  },
];
