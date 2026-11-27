# Lagrede visninger

En lagret visning (`savedView`) er et navngitt utvalg av en liste: filtre, sortering, kolonner, gruppering og layout. I
oppsettet er den en arbeidskø eller et oppslag i saksoversikten, «Oppgaver» eller «Dokumenter». Den gir ingen tilgang
og regner ingen summer: lista viser hvilke saker, Innsikt viser hvor mange og hvor mye.

Visningene oppsettet setter opp, er globale. De er ikke filer: de lages i Neo i sandkassen (steg i Neo) og promoteres
med resten. Private og delte visninger er brukernes egne og hører ikke til oppsettet.
Visningene av relasjonstabellen står på sakstypen, i [04-relasjoner.md](04-relasjoner.md).

## Kortversjonen

| Spørsmålet | Ja betyr |
|---|---|
| Har noen en jobb i et fast utvalg av saker (sitt eget, det ingen har tatt, det som venter)? | **Én visning** for jobben (`visning-er-en-jobb`) |
| Skal noen fordele nye saker? | En visning **«Til fordeling»**: uten ansvarlig, ikke avsluttet, eldste først (`sorter-etter-jobben`) |
| Mener du åpen, venter eller avsluttet? | Filter på **statuskategorien**, ikke på statusene (`kategori-foran-status`) |
| Gjelder køen den som ser den? | Filter på **«meg»**, aldri et navn (`meg-ikke-navn`) |
| Gjelder køen et utfall (innvilget, avslått)? | Filter på **utfallsfeltet** med valgets nøkkel (`utfall-er-et-filter`) |
| Skal noe vises som kolonne eller grupperes på? | Det må være et **saksfelt**, og for gruppering et valgfelt (`kolonne-krever-saksfelt`, `grupper-pa-valgfelt`) |
| Gjelder utvalget en periode? | **Faste datoer** og året i navnet (`fast-periode-i-navnet`) |
| Vil du vite hvor mange eller hvor mye? | **Innsikt**, ikke en visning (`ko-i-lista-sum-i-innsikt`) |
| Vil du skjule saker for noen? | **Tilgangsgrupper** på sakstypen, ikke en visning (`visning-gir-ikke-tilgang`) |

## visning-er-en-jobb Lag én visning per jobb, i rekkefølgen arbeidet går

```yaml
id: visning-er-en-jobb
klasse: valg
gjelder: [savedView]
opphav: praksis
```

- **Gjør:** Lag en visning for hver felles kø eller oppslag noen har en jobb i: mitt arbeid, det ingen har tatt, det
  som venter på andre, det som står igjen etter vedtaket, det avsluttede. Rekkefølgen i oppsettet er rekkefølgen
  brukeren ser.
- **Ikke gjør:** Ikke lag en visning per person, per saksbehandler eller per uke, og ikke en for én persons behov. Det
  er filtre brukeren setter selv, eller en privat visning hen lager selv.
- **Hvorfor:** Visningene står i én meny. Mange like visninger gjør at ingen finner køen sin. Bare globale visninger
  promoteres, så alt i oppsettet er felles.

Eksempel: køene for saksbehandlerne av en søknad om tilskudd.

```yaml
- name: Mine åpne saker
- name: "Tilskudd: til fordeling"
- name: "Tilskudd: venter på søker"
- name: "Tilskudd: innvilget, ikke utbetalt"
- name: "Tilskudd: avsluttet"
```

## visning-flaten-som-kan-pakkes En visning i oppsettet gjelder saker, oppgaver eller dokumenter

```yaml
id: visning-flaten-som-kan-pakkes
klasse: felle
gjelder: [savedView.entityType]
krever: [04-relasjoner.md#visning-per-fase]
opphav: skrevet
```

- **Gjør:** Sett `entityType` til `case`, `task` eller `document`. Legg visningene av relasjonstabellen på sakstypen.
- **Ikke gjør:** Ikke lag en visning i oppsettet for en annen flate.
- **Hvorfor:** Promoteringen vet bare for disse tre hvilke kolonner som bærer id-er som må skrives om. En visning for en
  annen flate avvises når den promoteres.

## kategori-foran-status Filtrer på statuskategorien når du mener åpen, venter eller avsluttet

```yaml
id: kategori-foran-status
klasse: valg
gjelder: [savedView.filterParams, caseType.statusGroups.options.category]
krever: [02-status.md#kategori-med-vilje]
opphav: praksis
```

- **Gjør:** Bruk `statusCategory` (`AKTIV`, `VENTER`, `AVSLUTTET`) for de brede køene. Bruk enkeltstatuser bare når
  køen er ett bestemt steg, som «Til utbetaling». Si i beskrivelsen at «ikke avsluttet» også tar med saker uten status.
- **Ikke gjør:** Ikke list opp alle de åpne statusene én for én.
- **Hvorfor:** Kategorien er gyldig i enhver org og for enhver sakstype. En ny status med riktig kategori havner i riktig
  kø uten at visningen endres. Statusene er id-er som må skrives om ved promoteringen.

```yaml
filterParams:
  - { id: statusCategory, operator: notInArray, value: [AVSLUTTET], variant: multiSelect }
```

## meg-ikke-navn Bruk «meg», aldri et navngitt medlem

```yaml
id: meg-ikke-navn
klasse: felle
gjelder: [savedView.filterParams]
opphav: praksis
```

- **Gjør:** Filtrer «Mine …» på `@me` i `assignedTo` (saker), `responsible` eller `responsibleOrAssigned` (oppgaver).
- **Ikke gjør:** Ikke legg en bestemt person i filteret.
- **Hvorfor:** Medlemmer er ikke konfig og kan ikke skrives om til en annen org. Neo avviser en fil med en person i
  filteret i planen, og visningen slutter å virke når personen bytter jobb.

```yaml
name: Mine åpne saker
filterParams:
  - { id: assignedTo, operator: inArray, value: ["@me"], variant: multiSelect }
  - { id: statusCategory, operator: notInArray, value: [AVSLUTTET], variant: multiSelect }
sortParams: [{ id: updatedAt, desc: true }]
isDefault: true
```

## utfall-er-et-filter «Innvilget» og «Avslått» er et filter på utfallsfeltet med valgets nøkkel

```yaml
id: utfall-er-et-filter
klasse: felle
gjelder: [savedView.filterParams, caseType.customFields.optionsJson]
krever: [02-status.md#en-vedtaksstatus, 05-felt-og-saksdata.md#utfall-som-felt, 05-felt-og-saksdata.md#nokkel-og-etikett]
opphav: praksis
```

- **Gjør:** Filtrer på utfallsfeltet (`customField:<feltets id>`) med valgets `key`.
- **Ikke gjør:** Ikke filtrer på etiketten. Ikke lag statusene «Innvilget» og «Avslått» for å kunne lage visningen.
- **Hvorfor:** Filteret sammenligner med verdien som er lagret på saken, og det er nøkkelen. Et filter på etiketten
  treffer ingenting, uten feilmelding. Saken står i én vedtaksstatus uansett utfall.

```yaml
filterParams:
  - { id: "customField:utfall", operator: inArray, value: [innvilget], variant: multiSelect }
```

## felt-i-filteret-ma-finnes Et felt i filteret eller sorteringen må være et saksfelt som finnes i org-en

```yaml
id: felt-i-filteret-ma-finnes
klasse: felle
gjelder: [savedView.filterParams, savedView.sortParams, customFieldDefinition]
opphav: skrevet
```

- **Gjør:** Ha feltet i filene og promoter det sammen med visningen, så promoteringen kan skrive om id-en. Sjekk
  visningene når et felt slettes eller byttes ut.
- **Ikke gjør:** Ikke la en visning stå med et felt som er tatt ut av oppsettet.
- **Hvorfor:** Et filter på et felt som ikke finnes, gir null rader, og en sortering på det faller til standarden
  (sist opprettet først). Lista ser tom eller tilfeldig ut, uten feilmelding. Finnes ikke feltet i produksjonen, avvises
  visningen ved promoteringen.

## sorter-etter-jobben Sorter etter det som skal tas først

```yaml
id: sorter-etter-jobben
klasse: valg
gjelder: [savedView.sortParams]
opphav: praksis
```

- **Gjør:** Til fordeling: eldste først (`createdAt` stigende). Venter på andre: lengst ventende først (`updatedAt`
  stigende). Mitt arbeid og avsluttede: sist endret først (`updatedAt` synkende). Sorterer køen på et saksfelt (en
  frist, et beløp), sett det som første sortering.
- **Ikke gjør:** Ikke sett et saksfelt som andre sortering. Ikke la alle visningene stå med samme sortering.
- **Hvorfor:** Sorteringen gjør lista til en kø. Et saksfelt sorteres bare når det står først; ellers blir det borte
  uten å si fra. Uten sortering er lista sist opprettet først.

Eksempel: køen lederen fordeler fra.

```yaml
name: "Tilskudd: til fordeling"
description: >
  Tilskuddssaker som ikke er avsluttet og ikke har en ansvarlig. Eldste først.
filterParams:
  - { id: assignedTo, operator: isEmpty, variant: multiSelect }
  - { id: statusCategory, operator: notInArray, value: [AVSLUTTET], variant: multiSelect }
sortParams: [{ id: createdAt, desc: false }]
```

## kolonne-krever-saksfelt Det du vil se som kolonne, må være et saksfelt

```yaml
id: kolonne-krever-saksfelt
klasse: valg
gjelder: [savedView.visibleColumns]
krever: [05-felt-og-saksdata.md#et-felt-har-en-leser]
opphav: praksis
```

- **Gjør:** Vis tittel, saksnummer, status, ansvarlig og datoene, og saksfeltene to saksbehandlere trenger å se side om
  side (ordning, søkt beløp, utfall).
- **Ikke gjør:** Ikke prøv å få saksdata (vurderingen, begrunnelsen) inn som kolonne. Ikke gjør noe til saksfelt bare
  for kolonnens skyld når det er grunnlag for en vurdering.
- **Hvorfor:** Sakslista leser saksfelt, status, ansvarlig og neste frist, ikke saksdata. Leser ingen et felt, er det
  ikke et felt.

```yaml
visibleColumns: [title, caseId, status, assignedTo, "customField:ordning", "customField:innvilget_belop", updatedAt]
```

## grupper-pa-valgfelt Grupper bare på et felt med ett kjent valg per sak

```yaml
id: grupper-pa-valgfelt
klasse: felle
gjelder: [savedView.groupBy, caseType.customFields.type]
krever: [05-felt-og-saksdata.md#velg-felttype]
opphav: skrevet
```

- **Gjør:** Grupper saker på `status`, `statusCategory`, `caseType`, `assignedTo`, eller et saksfelt av typen `select`,
  `checkbox` eller `person`. Grupper oppgaver på `status`, `responsible`, `case`, `type` eller `step`. Skal en
  dimensjon (ordningen) grupperes, må den være et `select`-felt.
- **Ikke gjør:** Ikke grupper på flervalg eller tekst.
- **Hvorfor:** En sak skal stå i én gruppe, og en tekst har ingen kjente verdier. En gruppering Neo ikke kan, avvises.

## layout-etter-jobben Liste for køer, tavle for fordeling

```yaml
id: layout-etter-jobben
klasse: standard
gjelder: [savedView.layout, savedView.groupBy]
opphav: praksis
```

- **Gjør:** La standarden `list` stå for køene. Bruk `board` når poenget er å se sakene fordelt på status eller en
  gruppering, og `timeline` når datoene er poenget.
- **Ikke gjør:** Ikke sett en gruppering på `card`, `feed`, `timeline` eller `graph`.
- **Hvorfor:** Grupperingen vises bare i lista og på tavla. «Dokumenter» har bare lista.

## en-standard-per-flate Gi hver flate én standardvisning, som viser eget arbeid

```yaml
id: en-standard-per-flate
klasse: valg
gjelder: [savedView.isDefault]
opphav: skrevet
```

- **Gjør:** Sett `isDefault` på én visning per flate, som regel «Mine åpne saker» uten sakstype i filteret.
- **Ikke gjør:** Ikke sett standard på en visning for én sakstype, og ikke regn med at standarden i sandkassen vinner i
  en produksjon som alt har en.
- **Hvorfor:** Standarden er det en ny bruker ser. En visning blir standard bare når produksjonen ikke alt har en;
  promoteringen overskriver aldri kundens valg.

## beskrivelsen-er-definisjonen Skriv i beskrivelsen hva som er med, hva som ikke er det, og rekkefølgen

```yaml
id: beskrivelsen-er-definisjonen
klasse: valg
gjelder: [savedView.description]
opphav: praksis
```

- **Gjør:** Én eller to setninger: utvalget i klarspråk, kantene (saker uten status, uten ansvarlig) og sorteringen.
- **Ikke gjør:** Ikke gjenta navnet, og ikke beskriv filtrene teknisk.
- **Hvorfor:** Brukeren ser ikke filtrene før hen åpner dem. Beskrivelsen sier hva tallet i lista betyr.

```yaml
name: "Tilskudd: innvilget, ikke utbetalt"
description: >
  Tilskuddssaker med utfallet «Innvilget» som ennå ikke er avsluttet. Eldste vedtak først.
```

## sakstype-i-navnet Navngi en visning for én sakstype «<Sakstype> — <utvalg>»

```yaml
id: sakstype-i-navnet
klasse: valg
gjelder: [savedView.name]
krever: [00-navn-pakking-og-versjoner.md#navn-er-nokkelen]
opphav: forslag
```

- **Gjør:** «Tilskudd — venter på søker». En visning på tvers av sakstyper får navn uten sakstype: «Til fordeling».
- **Ikke gjør:** Ikke bruk «Standardvisning» eller «Standard visning», som er reservert, og ikke interne koder.
- **Hvorfor:** Menyen blander visninger fra flere løsninger, og navnet er det eneste som skiller dem. Navnet er høyst
  100 tegn.

## fast-periode-i-navnet En visning over en periode får faste datoer og året i navnet

```yaml
id: fast-periode-i-navnet
klasse: felle
gjelder: [savedView.filterParams, savedView.name]
opphav: skrevet
```

- **Gjør:** Sett datoene med `gte`, `lte` eller `isBetween`, og skriv perioden i navnet: «Tilskudd — avslått i 2026».
  Lag en ny ved årsskiftet, eller la Innsikt telle perioden.
- **Ikke gjør:** Ikke kall den «i fjor». Ikke bruk `isRelativeToToday` eller `eq` på en dato.
- **Hvorfor:** Den eneste relative verdien er «meg». `isRelativeToToday` står i skjemaet, men virker ikke, og `eq` på
  et tidspunkt treffer nesten aldri.

## visning-gir-ikke-tilgang En visning viser bare saker brukeren alt kan se

```yaml
id: visning-gir-ikke-tilgang
klasse: standard
gjelder: [savedView]
krever: [14-tilgang.md#apen-som-standard]
opphav: skrevet
```

- **Gjør:** Styr hvem som ser sakene, med tilgangsgrupper på sakstypen.
- **Ikke gjør:** Ikke bruk en visning, eller fraværet av en, for å skjule saker.
- **Hvorfor:** Lista bruker samme synlighetsregel som én sak, og den som kan lese saker, kan sette filteret selv.

## ko-i-lista-sum-i-innsikt Lista viser hvilke saker; Innsikt viser hvor mange og hvor mye

```yaml
id: ko-i-lista-sum-i-innsikt
klasse: valg
gjelder: [savedView]
krever: [13-innsikt.md#tall-krever-hendelse]
opphav: forslag
```

- **Gjør:** Lag køen for sakene som står igjen («innvilget, ikke utbetalt») med beløpet som kolonne. Antall, summer og
  andeler over tid hører i Innsikt.
- **Ikke gjør:** Ikke lag én visning per måned for å kunne telle, og ikke et felt («utbetalt») bare for å filtrere.
- **Hvorfor:** Visningene har ingen sum og ingen relativ periode. Køen er det saksbehandleren jobber i; summen er det
  lederen rapporterer.
