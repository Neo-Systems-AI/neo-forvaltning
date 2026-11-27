# Fordeling og arbeidskøer

Lederen skal fordele nye saker. Saksbehandlerne skal finne sitt eget arbeid. Alle skal se hva som venter på andre, og
hva som har ligget lengst. Uten faste køer starter hver dag med et nytt søk i sakslista, og ingen vet hva tallet i lista
betyr.

## Når den passer

Alltid når mer enn én person jobber med sakene. Kjennetegn i kravene: fordeling, saksbehandlingstid, restanser,
«mine saker», oversikt for lederen. Fordelingen gjør et menneske, eller en flyt etter en regel organisasjonen eier.

Den passer ikke for tall over tid (hvor mange, hvor mye). Det er [Innsikt og nøkkeltall](innsikt-og-nokkeltall.md).

## Klossene

Kategorien på statusene og saksfeltene i konfigen → lagrede visninger som filtrerer, sorterer og grupperer på dem →
tildeling i saken eller i en flyt → Nøkkeltall og søk.

- Statusene med kategori, og saksfeltene køene leser
- De lagrede visningene, én per jobb
- Tildelingen, for hånd eller i en flyt
- Nøkkeltall for arbeidsmengden
- Standardsøket, og egne søk bare der det ikke dekker

## Slik bygges den

Visningene og søkene lages i Neo. De virker bare når konfigen er forberedt for dem: statusene har kategori, og alt en
kø viser, filtrerer, sorterer eller grupperer på, er et saksfelt. Saksdata kan ikke brukes i en visning. Steg 1 og 2
gjøres derfor før visningene.

1. **Sett kategorien på hver status** (`AKTIV`, `VENTER`, `AVSLUTTET`). Køene filtrerer på kategorien, ikke på
   enkeltstatusene.
   Regler: `../monstre/02-status.md#kategori-med-vilje`, `../monstre/12-visninger.md#kategori-foran-status`
   Blir: `oppsett/case-types/`
2. **Lag saksfeltene køene trenger**: det som skal vises som kolonne, filtreres på eller grupperes på. Utfallet og
   varianten er valgfelt med faste nøkler, og et felt det grupperes på, har ett valg per sak.
   Regler: `../monstre/12-visninger.md#kolonne-krever-saksfelt`, `../monstre/05-felt-og-saksdata.md#velg-felttype`,
   `../monstre/05-felt-og-saksdata.md#filterable-bevisst`, `../monstre/12-visninger.md#grupper-pa-valgfelt`,
   `../monstre/12-visninger.md#felt-i-filteret-ma-finnes`
   Blir: `oppsett/custom-fields/`
3. **Lag én visning per jobb**, i rekkefølgen arbeidet går: mitt arbeid, til fordeling, venter på andre, oversikten.
   Filtrer utfallet på nøkkelen, og gi en visning over en periode faste datoer.
   Regler: `../monstre/12-visninger.md#visning-er-en-jobb`, `../monstre/12-visninger.md#sorter-etter-jobben`,
   `../monstre/12-visninger.md#meg-ikke-navn`, `../monstre/12-visninger.md#beskrivelsen-er-definisjonen`,
   `../monstre/12-visninger.md#sakstype-i-navnet`, `../monstre/12-visninger.md#en-standard-per-flate`,
   `../monstre/12-visninger.md#layout-etter-jobben`, `../monstre/12-visninger.md#utfall-er-et-filter`,
   `../monstre/12-visninger.md#fast-periode-i-navnet`, `../monstre/12-visninger.md#ko-i-lista-sum-i-innsikt`
   Blir: steg i Neo: lagre visningene i sakslista
4. **Fordel uten faste personer i malene.** Tildel i saken, eller la en flyt tildele etter organisasjonens regel.
   Henvendelser tildeles én person.
   Regler: `../monstre/06-oppgaver.md#oppgave-ansvarlig-tom`, `../monstre/07-flyt.md#flyt-tildeling-fra-variabel`,
   `../monstre/10-skjema-og-innboks.md#tildel-en-person`, `../monstre/14-tilgang.md#ansvarlig-ser-sin-sak`
   Blir: `oppsett/workflows/` når en flyt tildeler, ellers steg i Neo: lederen tildeler i saken
5. **Gi oppgavene frister**, så Nøkkeltall viser arbeidsmengden og fristene per ansatt. Nøkkeltall leser kategorien
   fra steg 1 og fristene; ingen rapport trengs.
   Regler: `../monstre/06-oppgaver.md#oppgave-frist`, `../monstre/13-innsikt.md#nokkeltall-for-arbeidsmengde`
   Blir: `oppsett/task-template-sets/`
6. **Bruk standardsøket for saker** til å finne én sak. Lag ikke søk for køer.
   Regler: `../monstre/17-sok.md#sok-ta-i-bruk-standarden`, `../monstre/17-sok.md#sok-ikke-for-ko`,
   `../monstre/17-sok.md#sok-finner-pa-saksfelt`, `../monstre/17-sok.md#sok-ser-som-medlemmet`
   Blir: steg i Neo: standardsøket er slått på
7. **Lag et eget søk** bare for en kilde eller et utvalg standardsøket ikke dekker, som en flyt fra «Søk» til
   «Returner søketreff».
   Regler: `../monstre/17-sok.md#sok-navn-er-kilden`, `../monstre/17-sok.md#sok-en-sakstype`,
   `../monstre/17-sok.md#sok-felt-bare-det-kilden-kan`, `../monstre/17-sok.md#sok-en-bane-per-sporsmal`,
   `../monstre/17-sok.md#sok-standardavbildningen`, `../monstre/17-sok.md#sok-ingen-skjulte-tak`,
   `../monstre/17-sok.md#sok-flyten-ma-vaere-aktiv`, `../monstre/17-sok.md#sok-plassen-er-organisasjonens`
   Blir: `oppsett/workflows/`, og steg i Neo: aktivere flyten og plassere søket

## Hvem gjør hva

- **Deterministisk:** køene, sorteringen, Nøkkeltall og en tildeling en flyt gjør etter en fast regel.
- **Agenten:** har ingen rolle i køene.
- **Mennesket:** lederen fordeler. Saksbehandleren tar saker fra køen og lager private visninger for egne behov.

## Avhengighetene

- Krever [Grunnoppsettet for sakstypen](grunnoppsett-for-sakstypen.md): statuskategoriene, utfallsfeltet og
  variantfeltet som filtrerbare valgfelt.
- Køene etter vedtaket («innvilget, ikke utbetalt») henger på
  [Overlevering til et eksternt system](overlevering-til-eksternt-system.md) og
  [Oppfølging med rapporter og frister](oppfolging-med-rapporter-og-frister.md).
- Visningene viser bare det brukeren alt ser ([Tilgang og inhabilitet](tilgang-og-inhabilitet.md)).

## Grensene

- Visningene har ingen relativ periode og ingen sum per kolonne (`../monstre/12-visninger.md#fast-periode-i-navnet`,
  `../monstre/12-visninger.md#ko-i-lista-sum-i-innsikt`).
- Saksdata kan ikke vises som kolonne (`../monstre/12-visninger.md#kolonne-krever-saksfelt`).
- Gruppering på flervalg og tekst avvises (`../monstre/12-visninger.md#grupper-pa-valgfelt`).
- Et filter på et felt som ikke finnes, gir en tom liste uten feilmelding (`../monstre/12-visninger.md#felt-i-filteret-ma-finnes`).
- En henvendelse kan ikke tildeles et team, og mottakeren får ikke varsel (`../monstre/10-skjema-og-innboks.md#tildel-en-person`).
- En visning gir ingen tilgang (`../monstre/12-visninger.md#visning-gir-ikke-tilgang`).

## Hull i reglene

- Hvordan en flyt fordeler saker automatisk: etter fagområde, belastning eller tur.
