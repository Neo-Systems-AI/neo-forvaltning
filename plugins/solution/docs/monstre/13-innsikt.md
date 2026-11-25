# Innsikt

Innsikt er der lederen ser tallene: rapporter som teller og summerer hendelser over tid, dashbord som setter dem
sammen, og siden «Nøkkeltall» med arbeidsmengden per ansatt. Grunnregelen er at det som skal telles, skrives som
hendelse ([grunnregler.md](grunnregler.md)). Innsikt leser sakens felt slik de er nå, og hendelser bare når en strøm har
levert dem.

Et tall i en rapport hviler alltid på de samme fire leddene:

1. **Rapporten** teller eller summerer en hendelsestype i en strøm, og kan bryte ned på hendelsens felt og på sakens
   felt (`sak.<feltnavn>`, verdien nå).
2. **Strømmen** (`stream`) må ha levert hendelsen. Innsikt leser det strømmen har levert, ikke loggen. En hendelse ingen
   strøm leverte, finnes ikke for Innsikt, og den leveres ikke i ettertid.
3. **Hendelsen** er Neos egen (`case.created`, `case.updated`) eller en egen hendelse (`flowEventType`) som flyten
   skriver med «Skriv hendelse» der det skjer, med verdiene slik de var da.
4. **Flyten** som skriver den, og det som starter flyten.

Rapportene og dashbordene er ikke konfig: de ligger ikke i en Løsning og bygges i hver org. Oppsettet leverer
hendelsestypene, flytene som skriver dem, og strømmen. Innsikt regner bare vanlige rapporter: trakt, flyt og retensjon
finnes som typer, men regnes ikke. Det finnes ingen varsler på en terskel, og ingen sum over saksdata.

## Kortversjonen

| Spørsmålet | Ja betyr |
|---|---|
| Skal noe telles eller summeres over tid? | En **hendelse** som markerer øyeblikket, planlagt med flyten (`tall-krever-hendelse`) |
| Er øyeblikket at saken ble opprettet? | Neos **`case.created`** (`tall-krever-hendelse`) |
| Gjelder hendelsen en sak? | Feltet **`caseId`** i hendelsen (`caseid-kobler-hendelsen`) |
| Skal tallet brytes ned på en dimensjon? | Et **filtrerbart valgfelt** som ikke endres, eller verdien i hendelsen (`filtrerbart-valgfelt`, `saksfelt-er-naa`) |
| Er tallet en andel av to øyeblikk? | **To metrikker og en formel** (`andel-av-to-summer`) |
| Gjelder det arbeidsmengden per ansatt nå? | **Nøkkeltall**, ingen rapport (`nokkeltall-for-arbeidsmengde`) |
| Er sakstypen begrenset? | Bare **id-er, tall og valg** i hendelsen (`innsikt-ser-alle-saker`) |

## tall-krever-hendelse Hvert tall starter med hendelsen som markerer øyeblikket

```yaml
id: tall-krever-hendelse
klasse: valg
gjelder: [SkrivHendelse]
krever: [07-flyt.md#flyt-egen-hendelse]
opphav: skrevet
```

- **Gjør:** Skriv for hvert tall hvilket øyeblikk som telles (søknaden kom inn, vedtaket ble fattet, pengene ble
  utbetalt), og finn hendelsen som markerer det. Bruk `case.created` for mottatt. For alt annet: planlegg en egen
  hendelse i flyten som gjør handlingen, samtidig som flyten designes, med beløpet og dimensjonene slik de er da. Prøv
  hver rapport med testsaker som skal treffe og ikke treffe, med faste datoer.
- **Ikke gjør:** Ikke tell `case.updated` og filtrer på `sak.status` for å finne «vedtak fattet i mars». Ikke lov et
  tall før hendelsen er i oppsettet.
- **Hvorfor:** Innsikt teller hendelser, og tidsaksen er når hendelsen skjedde. `sak.status` er statusen nå, og et
  saksfelt kan endres etter øyeblikket; hendelsen fryser verdien. En hendelse som ikke ble skrevet, kan ikke telles i
  ettertid.

## caseid-kobler-hendelsen En egen hendelse om en sak har feltet `caseId`

```yaml
id: caseid-kobler-hendelsen
klasse: felle
gjelder: [flowEventType.fields.name, SkrivHendelse.verdier]
opphav: skrevet
```

- **Gjør:** Gi hendelsestypen et påkrevd tekstfelt som heter nøyaktig `caseId`, og sett det til sakens id i «Skriv
  hendelse».
- **Ikke gjør:** Ikke kall feltet `sakId`, `saksId` eller noe annet.
- **Hvorfor:** Innsikt finner saken bare på `caseId` i hendelsen. Uten den er alle `sak.*` «(ikke satt)», og tallet
  kan ikke brytes ned på sakstype, ordning eller utfall. Hendelsestypen `utsending.sendt` i Neos grunnoppsett har feltet
  `sakId`, og kobles derfor ikke til saken.

## strommen-er-en-del-av-kjeden Innsikt ser bare det en aktiv strøm med en aktiv abonnent har levert

```yaml
id: strommen-er-en-del-av-kjeden
klasse: felle
gjelder: [stream, stream.active, stream.eventTypes.enabled]
krever: [07-flyt.md#strom-pause-er-tap]
opphav: skrevet
```

- **Gjør:** Ta strømmen med i oppsettet sammen med hendelsestypene, aktiv, med hver hendelse rapportene trenger slått
  på. Rulles den ut til en org som alt har strømmen, sjekk at den har en aktiv abonnent. Gjør det før de første sakene
  kommer.
- **Ikke gjør:** Ikke sett Innsikt-strømmen på pause, og ikke slå av abonnenten.
- **Hvorfor:** En hendelse leveres bare til aktive strømmer med minst én aktiv abonnent, én gang, når den skjer. En
  strøm som opprettes i org-en ved utrullingen, får standardabonnenten og leverer fra første hendelse. En strøm som
  fantes fra før, beholder abonnentene org-en har valgt. Det som skjedde før strømmen leverte, kan ikke telles.

## en-strom-for-innsikt Gi Innsikt en egen strøm per område

```yaml
id: en-strom-for-innsikt
klasse: valg
gjelder: [stream, stream.name, stream.description, stream.eventTypes.customName]
krever: [13-innsikt.md#strommen-er-en-del-av-kjeden]
opphav: forslag
```

- **Gjør:** Lag én strøm for et område (for eksempel «Tilskudd — Innsikt») med `case.created` og de egne hendelsene
  rapportene bygger på. Si i beskrivelsen at rapportene leser den. Gi hver hendelse i strømmen et `customName` som står.
- **Ikke gjør:** Ikke bygg rapporter på en strøm som finnes for en integrasjon eller for å starte en flyt. Ikke gi
  hendelsene nytt `customName`.
- **Hvorfor:** Endres en strøm for en annen jobb, endres tallene. `customName` er nøkkelen en ny utrulling kjenner
  hendelsen i strømmen igjen på, og rapportens metrikk peker på den.

## mappingen-beholder-det-som-telles En strøm for Innsikt leverer hele hendelsen, eller alt rapportene leser

```yaml
id: mappingen-beholder-det-som-telles
klasse: felle
gjelder: [stream.eventTypes.propertyMappings]
krever: [07-flyt.md#flyt-strom-sender-det-som-trengs]
opphav: skrevet
```

- **Gjør:** La `propertyMappings` stå tom i Innsikt-strømmen. Må den snevres inn, ta med `caseId` og hvert felt som
  summeres, telles eller brytes ned på.
- **Ikke gjør:** Ikke kopier mappingen fra en strøm til et annet system.
- **Hvorfor:** Med en mapping leveres bare feltene i den, og Innsikt tilbyr bare dem. Uten `caseId` mister hendelsen
  saken, og `sak.*` blir «(ikke satt)».

## filtrer-i-rapporten-ikke-i-strommen La filtrene på Innsikt-strømmen stå tomme

```yaml
id: filtrer-i-rapporten-ikke-i-strommen
klasse: valg
gjelder: [stream.eventTypes.filters]
opphav: forslag
```

- **Gjør:** Lever alle hendelsene av typen, og filtrer i rapporten.
- **Ikke gjør:** Ikke filtrer bort en sakstype eller et utfall i strømmen for å få riktig tall i én rapport.
- **Hvorfor:** Et filter i strømmen avgjør hva som leveres, og det som ikke ble levert, kan ingen rapport telle senere.
  Et filter i rapporten kan endres.

## saksfelt-er-naa Bruk sakens felt til å beskrive saken, ikke til å tidfeste den

```yaml
id: saksfelt-er-naa
klasse: felle
opphav: skrevet
```

- **Gjør:** Bryt ned og filtrer på felt som ikke endres etter at de er satt: sakstype, ordning, utfall, kommune. Trenger
  rapporten verdien slik den var, legg den i hendelsen.
- **Ikke gjør:** Ikke bryt ned på `sak.status` eller `sak.ansvarlig` når spørsmålet er «hvordan var det da».
- **Hvorfor:** Innsikt slår opp sakens felt når rapporten kjøres. En sak som har byttet status, telles på statusen den
  har i dag, også i fjorårets tall.

## filtrerbart-valgfelt Felt Innsikt skal bryte ned på, er filtrerbare valgfelt med et eget navn

```yaml
id: filtrerbart-valgfelt
klasse: felle
gjelder: [caseType.customFields.filterable, caseType.customFields.type, caseType.customFields.name]
krever: [05-felt-og-saksdata.md#velg-felttype, 05-felt-og-saksdata.md#filterable-bevisst]
opphav: skrevet
```

- **Gjør:** La dimensjonene (ordning, utfall) være `select` med `filterable: true`, og beløp `number`.
- **Ikke gjør:** Ikke bruk `links` eller tekst til en dimensjon. Ikke slå av `filterable` på et felt en rapport bruker.
  Ikke gi et saksfelt navnet `status`, `sakstype`, `ansvarlig` eller `tilgangsgruppe`.
- **Hvorfor:** Innsikt tilbyr bare filtrerbare saksfelt, og ikke lenker. Et felt med navnet til et fast felt tilbys
  ikke; det faste vinner. En tekst gir én søyle per skrivemåte.

## andel-av-to-summer Sammenlign to øyeblikk som to metrikker og en formel

```yaml
id: andel-av-to-summer
klasse: valg
krever: [07-flyt.md#flyt-egen-hendelse, 13-innsikt.md#caseid-kobler-hendelsen]
opphav: forslag
```

- **Gjør:** Tell hvert øyeblikk på sin egen hendelse og regn andelen med en formel: summen av innvilget beløp på
  `vedtak.fattet`, summen av beløpet på `utbetaling.utfort`, og `utbetalt / innvilget * 100`. La vedtakshendelsen bære
  innvilget beløp, 0 ved avslag, så rapporten ikke trenger et filter på utfallet. Bryt ned på en dimensjon, grupper per
  måned, vis som tabell.
- **Ikke gjør:** Ikke summer et saksfelt på `case.created`. Ikke sett et filter på et felt bare én av hendelsene har.
- **Hvorfor:** Filtrene i en rapport gjelder alle metrikkene. Formelen regnes per tidspunkt, så andelen per måned
  sammenligner det som skjedde den måneden, ikke de samme sakene; det må stå i beskrivelsen.

```yaml
name: Innvilget mot utbetalt per ordning
streamIds: [<Tilskudd: Innsikt>]
metrics:
  - { id: innvilget, eventTypeName: vedtak.fattet,     aggregation: sum, property: innvilgetBelop, label: Innvilget }
  - { id: utbetalt,  eventTypeName: utbetaling.utfort, aggregation: sum, property: belop,          label: Utbetalt }
  - { id: andel, isFormula: true, formula: "utbetalt / innvilget * 100", formulaMetrics: [innvilget, utbetalt],
      label: "Utbetalt, prosent" }
breakdowns: [{ property: sak.ordning, propertyType: string }]
timeGrouping: month
chartType: table
```

## standardtall-for-saksbehandling Start med tallene en saksbehandlende enhet rapporterer på

```yaml
id: standardtall-for-saksbehandling
klasse: valg
krever: [13-innsikt.md#tall-krever-hendelse, 05-felt-og-saksdata.md#utfall-som-felt, 01-sakstype.md#variant-som-felt]
opphav: forslag
```

- **Gjør:** Gå gjennom tallene under når flytene designes, og la flyten som gjør handlingen, skrive hendelsen for hvert
  tall kunden trenger. Hendelsesnavnene er eksempler.
- **Ikke gjør:** Ikke legg hendelsene på etterpå.
- **Hvorfor:** Det er disse tallene en forvalter rapporterer oppover. De fleste krever en hendelse flyten skriver.

| Tallet | Hendelse og aggregering | Skrives av flyten som |
|---|---|---|
| Saker mottatt per type eller ordning | `case.created`, `count`, nedbrutt på variantfeltet | (Neos egen) |
| Antall per utfall, avslagsandel | `vedtak.fattet` med utfallet, `count`; formel avslått / alle | fatter vedtaket |
| Saksbehandlingstid | Nøkkeltall: fra opprettet til første avslutning, per ansatt. Til vedtak eller per type krever `vedtak.fattet` med datoene | fatter vedtaket |
| Tilsagn eller pålegg sendt | `tilsagn.sendt`, `palegg.gitt`, `count` | sender tilsagnet eller pålegget |
| Rapporter mottatt og forfalt | `rapport.mottatt`, `count`; forfalte frister som oppgaver i Nøkkeltall | tar imot rapporten |
| Søkt, innvilget og utbetalt beløp | søkt fra saksfeltet på `case.created`; resten på vedtaks- og utbetalingshendelsen | fatter vedtaket, utbetaler |
| Tilbakebetaling og sanksjoner | `tilbakebetaling.krevd`, `count` og `sum` | krever tilbake |

## nokkeltall-for-arbeidsmengde Bruk Nøkkeltall for arbeidsmengden per ansatt

```yaml
id: nokkeltall-for-arbeidsmengde
klasse: standard
krever: [06-oppgaver.md#oppgave-frist]
opphav: skrevet
```

- **Gjør:** Vis åpne saker, behandlingstid og frister per ansatt på «Nøkkeltall». Det krever bare at statusene har
  riktig kategori og oppgavene frister.
- **Ikke gjør:** Ikke bygg det samme som en rapport på hendelser.
- **Hvorfor:** Nøkkeltall regnes fra tilstanden nå, med ansvarlig nå og første avslutning, og teller bare saker leseren
  ser. En rapport på hendelser vet ikke hvem som er ansvarlig nå.

## definisjonen-i-beskrivelsen Skriv definisjonen av tallet i rapportens beskrivelse

```yaml
id: definisjonen-i-beskrivelsen
klasse: valg
opphav: forslag
```

- **Gjør:** Si hvilken hendelse som telles, hvilket felt som summeres, perioden, og at sakens felt har verdien nå.
- **Ikke gjør:** Ikke la navnet alene bære definisjonen.
- **Hvorfor:** To ledere som leser «innvilget» forskjellig, får to tall. Tallet i rapporten og tallet i lista skal kunne
  forklares mot hverandre.

## dashbord-per-mottaker Lag ett dashbord per mottaker, med tekst mellom rapportene

```yaml
id: dashbord-per-mottaker
klasse: valg
opphav: forslag
```

- **Gjør:** Ett dashbord per bruk (ledermøtet, rapporteringen til departementet), som starter med en tekstblokk om hva
  det svarer på.
- **Ikke gjør:** Ikke samle alle rapportene i ett dashbord.
- **Hvorfor:** Et dashbord er et svar til noen. Tekstblokken bærer definisjonene og forbeholdene.

## innsikt-ser-alle-saker Den som har Innsikt, ser hendelser fra alle sakstyper

```yaml
id: innsikt-ser-alle-saker
klasse: felle
krever: [14-tilgang.md#jobbroller-etter-jobben]
opphav: skrevet
```

- **Gjør:** Gi lederrollen bare til dem som kan se tall på tvers av alle sakstyper. Legg bare id-er, tall og valg i
  egne hendelser fra en begrenset sakstype, og unngå nedbrytninger som avslører personer.
- **Ikke gjør:** Ikke lov at en tilgangsgruppe skjuler sakene i rapportene. Ikke legg navn eller fritekst om parten i
  en hendelse.
- **Hvorfor:** Rapportene leser alle hendelser i org-en, også fra begrensede sakstyper, og sakens felt kan brytes ned
  på. En egen hendelse bærer det flyten legger i den. Nøkkeltall følger derimot synligheten.
