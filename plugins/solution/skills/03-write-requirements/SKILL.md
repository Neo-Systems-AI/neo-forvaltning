---
name: 03-write-requirements
description: Skriver kravene til en løsning fra forståelsen - ett krav per vilkår, regel, steg, dokument eller rolle, kanalnøytralt, med hvem som utfører det (deterministisk, agentisk eller menneske), hvorfor og kilden. Kravene er det løsningen bygges og testes mot. Bruk når researchen på prosessen er kontrollert, eller når forståelsen har endret seg.
---

# Kravene

Kravene sier hva som må holde, ikke hvordan. De er det oppsettet bygges fra og testene sjekker, så et krav som mangler
her, blir ikke bygget, og et krav som er feil, blir bygget feil.

**Inn:** forståelsen i løsningen og i `virksomheten/`. **Ut:** `3-krav/` i løsningen, som items. Formen på et krav står
i repoets regel for mappa (`.claude/rules/`).

## Et krav

- **Ett per vilkår, regel, steg, dokument eller rolle,** med en id som ikke endres. Et krav som har to «og», er ofte to.
- **Kanalnøytralt:** «søknaden er mottatt innen fristen», ikke «Altinn-skjemaet sjekker datoen». Hvordan det oppfylles,
  avgjøres i designet og oppsettet.
- **Hvem som utfører det:**
  - `deterministisk`: en fast regel på dataene, likt hver gang;
  - `agentisk`: en agent leser og foreslår, og et menneske godkjenner;
  - `menneske`: skjønn eller en beslutning et menneske tar.
- **Hvorfor**, i én setning, med hjemmelen eller grunnen.
- **Kilden:** id-en til kilden eller ankeret i forståelsen.
- **Hva det blir** står tomt til oppsettet bygges. Kravene antar ikke hva Neo har.

## Slik gjør du det

1. Gå gjennom forståelsen dimensjon for dimensjon, og skriv kravene i samme rekkefølge, så hullene synes.
2. Ta med kravene fra `virksomheten/` som løsningen berører (en rolle som godkjenner, et system som skal oppdateres,
   en rapport oppover), med kilde dit.
3. Velg hvem som utfører hvert krav etter hva det krever: en regel som kan skrives ned, er deterministisk, selv om den
   gjøres for hånd i dag. Skjønn som en agent kan forberede med kilde, er agentisk. Det som er en beslutning, er et
   menneske.
4. Spørsmålene fra researchen som ikke er besvart, blir ikke krav. Si hvilke krav som venter på dem.
5. Kjør repoets sjekk til den er grønn: hvert krav har hvem som utfører det, hvorfor og en kilde som finnes.

## Regler

- **Et krav fra hjemmelen tas aldri bort.** Det kan oppfylles på en annen måte enn i dag, men ikke forenkles vekk.
- **Dagens prosess er ikke et krav.** At noe gjøres i dag, er en kilde til forståelsen, ikke en grunn til at det skal
  være slik.
- **Ingen krav uten kilde.** Det som er en god idé, men ikke står noe sted, legges fram som et forslag, ikke skrives som
  et krav.

## Personen avgjør

Kravene. Legg dem fram per dimensjon, med antallet per utfører, de som kommer fra hjemmelen, og de der valget av
utfører kunne gått begge veier.

## Ferdig når

Hver påstand i forståelsen som noe i løsningen må handle på, har et krav, hvert krav har kilde, sjekken er grønn, og
personen har godkjent kravene.
