# Statusløpet

Statusløpet er stegene en sak går gjennom, fra mottak til avsluttet. Det består av statusgrupper (fasene) og statuser i
hver gruppe, med rekkefølge, farge, beskrivelse og en kategori som sier om saken er aktiv, venter eller er avsluttet.
Statusen sier hvor saken står. Arbeidet ligger i oppgavene, utfallet i et felt, og hvert statusskifte står i historikken
av seg selv.

## Kortversjonen

| Spørsmålet | Et ja betyr | Regelen |
|---|---|---|
| Sier det hvor saken står, og skal noen se, filtrere, telle eller handle på det? | **En status** | `status-er-tilstand`, `status-har-en-leser` |
| Er det arbeid som skal gjøres? | **En oppgave**, bundet til statusen der den gjøres | `status-er-tilstand` |
| Er det utfallet av vedtaket? | **Ett felt**, og én status for at vedtaket er fattet | `en-vedtaksstatus` |
| Står saken på noen andre under behandlingen? | **Én status** i `VENTER`, med venteoppgaver | `en-ventestatus` |
| Må parten gjøre noe etter vedtaket før saken går videre? | **En egen status** i `VENTER` | `venting-etter-vedtaket` |
| Gjentar det seg et ukjent antall ganger (utbetalinger, rapporter)? | **Ingen status.** Rader i saksdata, oppgaver og hendelser | `venting-etter-vedtaket` |
| Er det en klage på vedtaket? | **Ingen status.** En egen klagesak; vedtakssaken venter på klagefristen | `venter-pa-klagefrist` |
| Er det at et brev er sendt? | **Ingen status.** Brevet står i saken | `status-har-en-leser` |
| Beskriver det noe utenfor saken (utlysningen, runden)? | **Ingen status.** Eventuelt en egen sakstype | `status-om-saken` |

## status-er-tilstand En status er en tilstand saken har nådd, ikke arbeid som skal gjøres

```yaml
id: status-er-tilstand
klasse: felle
gjelder: [caseType.statusGroups.options, caseType.statusGroups.options.label]
krever: [06-oppgaver.md#oppgave-steg]
opphav: praksis
```

- **Gjør:** Gi statusene navn som sier hvor saken står: «Mottatt», «Under behandling», «Vedtak fattet». Legg arbeidet i
  oppgavemaler, og bind hver oppgavemal til statusen der den gjøres.
- **Ikke gjør:** Ikke lag statuser som «Vurder vilkårene» eller «Skriv vedtak». Ikke lag en status for hver oppgave.
- **Hvorfor:** En status har én verdi om gangen, mens arbeidet går i parallell. Med arbeidet som oppgaver kan
  saksbehandleren hake av, og en ny sak får saksgangen med en gang.

## status-har-en-leser En status finnes fordi noen skal se, filtrere eller handle på den

```yaml
id: status-har-en-leser
klasse: valg
gjelder: [caseType.statusGroups.options]
krever: [05-felt-og-saksdata.md#et-felt-har-en-leser]
opphav: forslag
```

- **Gjør:** Lag en status når ansvaret skifter (fra oss til parten og tilbake), når noen skal filtrere eller telle på
  den, eller når en flyt, en betingelse i veiviseren eller en oppgavemal skal lese den. Skriv leseren i designet.
- **Ikke gjør:** Ikke lag statuser for å vise framdrift som oppgavene alt viser. Ikke lag en status for at et brev er
  sendt; brevet står i saken.
- **Hvorfor:** Hver status er en kolonne, et filter og noe flytene må holde i takt. Omfanget følger kravene: en status
  uten leser har ingen jobb, og en status kravet trenger, tas ikke bort for å holde tallet nede.

## en-vedtaksstatus Én status for vedtaket, og utfallet som felt

```yaml
id: en-vedtaksstatus
klasse: felle
gjelder: [caseType.statusGroups.options, customFieldDefinition, SetCaseStatus, SetCaseFieldValue]
krever: [05-felt-og-saksdata.md#utfall-som-felt, 07-flyt.md#flyt-valg-med-skjema]
opphav: praksis
```

- **Gjør:** Lag én status for at vedtaket er fattet («Vedtak fattet»). Skriv utfallet (innvilget, avslag, delvis) i et
  `select`-felt med samme handling som setter statusen.
- **Ikke gjør:** Ikke lag «Innvilget» og «Avslått» som to statuser.
- **Hvorfor:** Saken står i samme tilstand uansett utfall: vedtaket er fattet, klagefristen løper. To statuser gjør at
  hver regel for «etter vedtak» må skrives to ganger. Utfallet som felt kan filtreres, flettes og telles.

```yaml
statusOptions:
  - groupLabel: Vedtak
    label: Vedtak fattet
    sequence: 4
    category: AKTIV
    description: >
      Vedtaket er fattet og sendt søkeren. Om det ble innvilget, delvis innvilget
      eller avslått, står i feltet «Utfall».
```

## kategori-med-vilje Hver status har en kategori: AKTIV, VENTER eller AVSLUTTET

```yaml
id: kategori-med-vilje
klasse: valg
gjelder: [caseType.statusGroups.options.category]
opphav: praksis
```

- **Gjør:** Sett `AKTIV` når saken er hos oss og beveger seg, også mens et vedtak følges opp. Sett `VENTER` når saken
  står på noen andre (søkeren, en part, klageinstansen). Sett `AVSLUTTET` bare når ingen videre behandling venter.
- **Ikke gjør:** Ikke la en status stå uten kategori. Ikke bruk `VENTER` når saken venter på oss selv.
- **Hvorfor:** Sakslista, visningene og veiviseren leser kategorien, ikke navnet. Nøkkeltallene teller en sak som
  avsluttet første gang den når `AVSLUTTET`, også om den gjenåpnes.

## avsluttet-er-last En avsluttet sak er skrivebeskyttet

```yaml
id: avsluttet-er-last
klasse: felle
gjelder: [caseType.statusGroups.options.category]
opphav: skrevet
```

- **Gjør:** Legg alt som skal gjøres med saken, før statusen i `AVSLUTTET`: siste brev, siste steg i veiviseren,
  effektueringen, journalføringen. Bruk `AKTIV` for statuser der saken fortsatt skal endres, selv om de ligger sent.
  Opprett en ny sak eller avvis forslaget når en relasjon peker på en lukket sak.
- **Ikke gjør:** Ikke sett en status til `AVSLUTTET` hvis noen skal skrive i saken etterpå. Ikke regn med å knytte nye
  relasjoner til en avsluttet sak.
- **Hvorfor:** All skriving i en sak i `AVSLUTTET` avvises (`CASE_CLOSED`), bortsett fra å bytte status, arkivere eller
  kassere. Det gjelder også relasjonene og bekreftelsene i veiviseren. Kommer en klage etter at saken er avsluttet,
  blir den en egen klagesak (`01-sakstype.md#klage-som-egen-sakstype`). Skal den knyttes til vedtaket,
  saksbehandleren flytter vedtakssaken ut av «Avsluttet», knytter relasjonen og setter den tilbake.

## en-ventestatus Én ventestatus, og venteoppgaver som sier hva det ventes på

```yaml
id: en-ventestatus
klasse: valg
gjelder: [caseType.statusGroups.options, caseType.statusGroups.options.category]
krever: [06-oppgaver.md#oppgave-venter, 07-flyt.md#flyt-ventestatus]
opphav: praksis
```

- **Gjør:** Lag én status i kategorien `VENTER` («Venter på svar») for det som står ute under behandlingen. Hva det
  ventes på, og fristen, står i venteoppgavene.
- **Ikke gjør:** Ikke lag én ventestatus per ting det kan ventes på.
- **Hvorfor:** Står to ting ute samtidig, hopper saken mellom to ventestatuser. Med oppgavene ser saksbehandleren alt som
  står ute, og nøkkeltallene teller fristene.

## venting-etter-vedtaket Etter vedtaket får saken en egen ventestatus bare når parten må gjøre noe før saken går videre

```yaml
id: venting-etter-vedtaket
klasse: valg
gjelder: [caseType.statusGroups.options, caseType.statusGroups.options.category]
krever: [05-felt-og-saksdata.md#flere-rader-er-saksdata, 06-oppgaver.md#oppgave-oppfolging-over-tid]
opphav: forslag
```

- **Gjør:** Lag en egen status etter vedtaket når parten må akseptere, signere eller rette noe før neste steg: aksept av
  et tilsagn, en signert avtale, retting innen en frist etter et tilsyn. Den er i kategorien `VENTER`.
- **Ikke gjør:** Ikke lag én status per gjentakende hendelse: hver utbetaling, hver rapport, hver kontroll. De er rader i
  saksdata, oppgaver, og hendelser når de skal telles.
- **Hvorfor:** Saken står ulikt før og etter at parten har svart på vedtaket. Antallet gjentakende hendelser varierer
  per sak, og et statusløp kan ikke telle dem.

```yaml
# Eksempel: tilskudd, der søkeren må akseptere tilsagnet
statusGroups: [{label: Mottak}, {label: Behandling}, {label: Vedtak}, {label: Oppfølging}, {label: Avsluttet}]
statusOptions:
  - { groupLabel: Mottak,     label: Søknad mottatt,              sequence: 1, category: AKTIV }
  - { groupLabel: Behandling, label: Under behandling,            sequence: 2, category: AKTIV }
  - { groupLabel: Behandling, label: Venter på svar,              sequence: 3, category: VENTER }
  - { groupLabel: Vedtak,     label: Vedtak fattet,               sequence: 4, category: AKTIV }
  - { groupLabel: Vedtak,     label: Venter på aksept av tilsagn, sequence: 5, category: VENTER }
  - { groupLabel: Oppfølging, label: Til utbetaling,              sequence: 6, category: AKTIV }
  - { groupLabel: Oppfølging, label: Venter på rapport,           sequence: 7, category: VENTER }
  - { groupLabel: Avsluttet,  label: Avsluttet,                   sequence: 8, category: AVSLUTTET }
```

## grupper-er-faser Statusgruppene er fasene i saken

```yaml
id: grupper-er-faser
klasse: valg
gjelder: [caseType.statusGroups, caseType.statusGroups.label, caseType.relationTableViews.defaultInStatusGroups]
opphav: forslag
```

- **Gjør:** Lag gruppene etter fasene saken går gjennom: «Mottak», «Behandling», «Vedtak», «Oppfølging», «Avsluttet».
  Gi dem navn kunden bruker.
- **Ikke gjør:** Ikke lag én gruppe per status, og ikke én gruppe for alt.
- **Hvorfor:** Gruppen er fasen andre flater leser: en lagret visning av relasjonstabellen kan være standard i en fase,
  og en betingelse i veiviseren kan lese statusgruppen. Navnet vises for brukeren.

## beskrivelse-sier-hva-som-er-sant Beskrivelsen sier hva som er sant når saken står der

```yaml
id: beskrivelse-sier-hva-som-er-sant
klasse: valg
gjelder: [caseType.statusGroups.options.description]
opphav: praksis
```

- **Gjør:** Skriv i én til tre setninger hva som er gjort, hva som gjelder nå og hva som ikke skjer av seg selv. Skriv
  forbehold for automatikk her («Utbetalingen starter ikke før tilsagnet er akseptert»).
- **Ikke gjør:** Ikke gjenta navnet. Ikke skriv en instruks.
- **Hvorfor:** Den som setter opp en flyt, ser statusbeskrivelsen. Et forbehold som bare står i behandlingsregelen,
  leser bare agenten. Beskrivelsen er høyst 500 tegn.

## rekkefolgen-er-lopet Sekvensen er rekkefølgen saken går i

```yaml
id: rekkefolgen-er-lopet
klasse: valg
gjelder: [caseType.statusGroups.options.sequence, caseType.sequential]
krever: [01-sakstype.md#sekvensielt-lop]
opphav: praksis
```

- **Gjør:** Gi statusene `sequence` i den rekkefølgen saken normalt går. Klagesporet og avslutningen står sist.
- **Ikke gjør:** Ikke sorter statusene etter noe annet enn løpet.
- **Hvorfor:** Saken vises som en tidslinje, og veiviseren kan kreve at «statusen er nådd», regnet ut av `sequence`.

## stabile-statusnavn Bestem statusnavnene før resten bygges, og fjern ikke en status som er i bruk

```yaml
id: stabile-statusnavn
klasse: felle
gjelder: [caseType.statusGroups.options.label, SetCaseStatus, FinnSteg, caseType.wizard.steps.condition, savedView]
krever: [07-flyt.md#flyt-identitet-er-id]
opphav: skrevet
```

- **Gjør:** Bestem navnene før flytene, veiviseren og visningene lages, og hold dem korte. Skal en status byttes, legg til
  den nye, flytt sakene over, og fjern den gamle til slutt. Er et navn endret, sjekk det som finner statusen på navnet:
  «Finn steg», betingelsene i veiviseren og filtrene i de lagrede visningene.
- **Ikke gjør:** Ikke gi to statuser i samme gruppe samme navn. Ikke gi en status nytt navn i malen og vent at kundens
  status følger med.
- **Hvorfor:** «Sett status» peker på id, men «Finn steg», veiviserens betingelser og oppsettet som bygges, slår opp på
  navnet. Navnet er nøkkelen i gruppen og overskrives ikke ved oppdatering, og en oppdatering som fjerner en status noe
  står i, avvises. Et omdøpt navn gir ingen feil før noe kjører.

## venter-pa-klagefrist Etter vedtaket venter saken på klagefristen, og flyten avslutter den når fristen er ute

```yaml
id: venter-pa-klagefrist
klasse: valg
gjelder: [caseType.statusGroups.options, caseType.statusGroups.options.category, Vent, Vent.varighet, Vent.enhet]
krever: [01-sakstype.md#klage-som-egen-sakstype, en-vedtaksstatus]
opphav: praksis
```

- **Gjør:** Legg en status etter vedtaket, «Venter på klagefrist» (`VENTER`). La flyten som sender vedtaket, sette den,
  vente med «Vent» i klagefristen og postgangen, lese statusen på nytt, og sette saken til «Avsluttet» bare om den
  fortsatt står i «Venter på klagefrist». En klage innen fristen flytter ikke vedtakssaken: klagen blir en egen
  klagesak, relasjonen knyttes mens vedtakssaken venter, og flyten lukker vedtakssaken når fristen er ute.
- **Ikke gjør:** Ikke avslutt saken når vedtaket sendes. Ikke la noen gå over sakene for hånd for å lukke dem. Ikke hold
  vedtakssaken åpen mens klagen behandles.
- **Hvorfor:** En klage innen fristen skal kunne knyttes til vedtakssaken med en relasjon, og en avsluttet sak tar ikke
  imot nye relasjoner (`avsluttet-er-last`). Det er klagesaken som bærer klagen videre, så vedtakssaken har ingenting
  igjen å gjøre etter fristen. Flyten lukker alle saker likt, så ingen blir stående åpne. Har saksbehandleren selv flyttet
  saken, for eksempel for å omgjøre vedtaket, lar flyten den stå.

```yaml
# Eksempel: etter vedtaksfasen
statusOptions:
  - { groupLabel: Vedtak,    label: Vedtak fattet,          sequence: 7, category: AKTIV }
  - { groupLabel: Vedtak,    label: Venter på klagefrist,   sequence: 8, category: VENTER }
  - { groupLabel: Avsluttet, label: Avsluttet,              sequence: 9, category: AVSLUTTET }
```

## fire-farger Fire farger med fire betydninger

```yaml
id: fire-farger
klasse: valg
gjelder: [caseType.statusGroups.options.color]
opphav: praksis
```

- **Gjør:** Bruk samme farge for samme betydning i alle sakstypene: framdrift, venting, beslutning og avsluttet.
- **Ikke gjør:** Ikke gi hver status sin egen farge.
- **Hvorfor:** Sakstypene står ved siden av hverandre i lister og tavler. Like farger for like ting gjør dem lesbare.

```yaml
framdrift:  "#5b8a5e"   # AKTIV, saken beveger seg
venter:     "#8B5DB3"   # VENTER
beslutning: "#c08a3e"   # vedtak, klage, oversendelse
avsluttet:  "#6b7280"   # AVSLUTTET
```

## status-om-saken Statusen beskriver saken, ikke runden eller noe utenfor

```yaml
id: status-om-saken
klasse: felle
gjelder: [caseType.statusGroups.options]
krever: [01-sakstype.md#runde-som-egen-sakstype]
opphav: forslag
```

- **Gjør:** Start løpet der saken starter: når søknaden, klagen eller varselet er mottatt, eller når tilsynet er
  besluttet.
- **Ikke gjør:** Ikke lag en status som «Utlysning» eller «Venter på søknader» på en søknadssak.
- **Hvorfor:** En status som beskriver noe utenfor saken, blir aldri satt eller står alltid feil. Har runden sitt eget
  løp, er den en egen sakstype.
