/* ============================================================
   COUNTRIES - which national film lists exist.

   `list` is the catalogue id for that country's page. A country
   with no list is drawn dimmed on the map and is not clickable.

   To make a country live: build assets/js/data/<id>.js the same
   way as any other list, register it in universes.js, then set
   `list` here and run `npm run build`.
   ============================================================ */

const COUNTRIES = {
  /* ---- live ---- */
  FR: {
    name: "France",
    list: "french",
    note: "50 films · the New Wave and after",
  },
  DE: {
    name: "Germany",
    list: "german",
    note: "50 films · Weimar to the present",
  },
  DK: { name: "Denmark", list: "danish", note: "50 films · Dogme and after" },
  NL: {
    name: "Netherlands",
    list: "dutch",
    note: "50 films · Verhoeven and beyond",
  },
  IN: { name: "India", list: "india", note: "97 films · the full list" },
  CN: { name: "China", list: "china", note: "49 films · Hong Kong, Taiwan and the mainland" },
  NO: { name: "Norway", list: "norway", note: "47 films · from Ibsen to Oscar-nominated" },
  SE: { name: "Sweden", list: "sweden", note: "24 films · Bergman and after" },
  ES: { name: "Spain", list: "spain", note: "25 films · Almodóvar and beyond" },
  GB: { name: "United Kingdom", list: "uk", note: "48 films · kitchen sink to blockbuster" },
  JP: { name: "Japan", list: "japan", note: "30 films · Kurosawa to Miyazaki" },
  KR: { name: "Korea", list: "korea", note: "30 films · from the New Wave to Parasite" },

  /* ---- not built yet: drawn but unclickable ---- */
  US: { name: "United States" },
  RU: { name: "Russia" },
  HK: { name: "Hong Kong" },
  TW: { name: "Taiwan" },
  BR: { name: "Brazil" },
  MX: { name: "Mexico" },
  AR: { name: "Argentina" },
  IR: { name: "Iran" },
  CA: { name: "Canada" },
  AU: { name: "Australia" },
  PL: { name: "Poland" },
  GR: { name: "Greece" },
  BE: { name: "Belgium" },
  AT: { name: "Austria" },
  HU: { name: "Hungary" },
  DZ: { name: "Algeria" },
  AM: { name: "Armenia" },
  BY: { name: "Belarus" },
  NG: { name: "Nigeria" },
  ZA: { name: "South Africa" },
  EG: { name: "Egypt" },
  TR: { name: "Turkey" },
  TH: { name: "Thailand" },
  ID: { name: "Indonesia" },
  PH: { name: "Philippines" },
  VN: { name: "Vietnam" },
  NZ: { name: "New Zealand" },
  IE: { name: "Ireland" },
  PT: { name: "Portugal" },
  CH: { name: "Switzerland" },
  CZ: { name: "Czechia" },
  RO: { name: "Romania" },
  UA: { name: "Ukraine" },
  IL: { name: "Israel" },
  SA: { name: "Saudi Arabia" },
  PK: { name: "Pakistan" },
  BD: { name: "Bangladesh" },
  CL: { name: "Chile" },
  CO: { name: "Colombia" },
  PE: { name: "Peru" },
  CU: { name: "Cuba" },
  SN: { name: "Senegal" },
  MA: { name: "Morocco" },
  KE: { name: "Kenya" },
  ET: { name: "Ethiopia" },
  FI: { name: "Finland" },
  IS: { name: "Iceland" },
};
