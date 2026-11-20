# Saksfelt og saksdata

En sak bærer opplysninger på to måter. **Saksfeltene** er enkeltverdier med en fast type, som Neo kan handle på på
tvers av saker. **Saksdataene** er arbeidsgrunnlaget i én sak (det som kom inn, og vurderingene av det), laget fra en
**saksdatamal** og lest av mennesket, agenten og flyten. Fila bygger på fire av [grunnreglene](grunnregler.md): et felt
har en leser, felt fødes fra saksdata, Neo registrerer selv, og plikten bevises der den skjer.

## Hvor opplysningen hører hjemme

Still spørsmålene i rekkefølge. Det første som svarer ja, avgjør.

| # | Spørsmålet | Ja betyr |
|---|---|---|
| 1 | Registrerer Neo det allerede (et tidspunkt, en statusendring, et sendt brev, en utført oppgave, en bekreftelse)? | **Ingenting.** Les det der Neo har det (`tidspunkt-er-historikk`) |
| 2 | Er det bevis for at en forvaltningsplikt er oppfylt? | **Dokumentet, oppgaven og bekreftelsen i veiviseren**, ikke saksdata og ikke et felt (`plikten-er-ikke-saksdata`) |
| 3 | Er det en person eller virksomhet? | En **sakspart** (`parten-er-sakspart`) |
| 4 | Er det en egenskap ved forholdet mellom to saker? | Et **relasjonsfelt** (`04-relasjoner.md#relasjonsfelt-for-krysset`) |
| 5 | Skal sakslista, en visning, veiviseren, et brev, Innsikt eller «Finn sak» lese den? | Et **saksfelt** (`et-felt-har-en-leser`), satt fra saksdata (`felt-fodes-fra-saksdata`) |
| 6 | Kan den ha flere rader? | **Saksdata** med en tabell (`flere-rader-er-saksdata`) |
| 7 | Er den grunnlag, vurdering, begrunnelse eller sitat? | **Saksdata** (`vurdering-i-saksdata`) |
| 8 | Leser ingen den? | **Ingenting.** La den bli i kilden |

## Hvem skriver feltet

Hvert saksfelt har én skriver (`felt-fodes-fra-saksdata`).

| Verdien | Skriveren |
|---|---|
| står som et faktum i saksdata eller i skjemasvaret | Flyten: «Hent saksdata» og «Sett saksfelt» |
| kan regnes ut av tall i saken (en sum, en differanse, en andel) | Flyten: «Regn ut» og «Sett saksfelt» (`07-flyt.md#flyt-regn-ut`) |
| må leses ut av tekst i dokumentene og e-postene | Agenten, med KI-forslag på feltet (`ki-forslag-med-vilje`) |
| avgjøres av saksbehandleren i en handling (utfallet) | Flyten bak handlingen, fra skjemaet (`utfall-som-felt`) |
| er nesten alltid den samme for sakstypen | Standardverdien på sakstypen (`standardverdi-pa-bindingen`) |

---

## Felt eller saksdata

## et-felt-har-en-leser Et saksfelt finnes fordi en leser i Neo skal handle på det på tvers av saker

```yaml
id: et-felt-har-en-leser
klasse: valg
gjelder: [customFieldDefinition, caseType.customFields]
opphav: skrevet
```

- **Gjør:** Lag et saksfelt bare når du kan peke på leseren og hva den gjør: sakslista eller en lagret visning (vise,
  filtrere, sortere, telle), en betingelse i veiviseren, en flettekode i et brev (`{{case:<feltnavn>}}`), Innsikt
  (telle, summere), «Finn sak» i en flyt, en kolonne i relasjonstabellen eller et felt i relasjonsvisningen, eller
  variantfeltet som velger oppgavene. Skriv leseren i sporingen til kravene. Slå sammen felt i kilden som utelukker
  hverandre, til ett.
- **Ikke gjør:** Ikke lag et felt for hver opplysning i søknaden, for hvordan skjemaet ble fylt ut, for appens hjelpefelt
  eller for arkivkonvolutten. Ikke legg en verdi bare i saksdata og regn med at sakslista, veiviseren, brevet eller
  Innsikt kan lese den.
- **Hvorfor:** Saksdata leses av agenten, av flyten («Hent saksdata») og av agenten som foreslår felt. Ingen av de andre
  leserne leser saksdata: flettingen kjenner bare sakstypens felt, veiviseren har ingen betingelse på saksdata, og søket
  går ikke i dem. Derfor avgjør leseren hva som er et felt. Et felt uten leser er et tomt felt i egenskapspanelet. Det
  som ikke leses, ligger fortsatt i kilden (skjemasvaret, vedlegget).

```yaml
# Eksempel, tilskudd: hvert felt med leseren sin
customFields:
  - { name: tsk_ordning,      type: select }   # variantfeltet og filteret i sakslista
  - { name: tsk_omsokt_belop, type: number }   # Innsikt summerer omsøkt per ordning
  - { name: tsk_utfall,       type: select }   # filteret, flettingen i vedtaket og Innsikt
# Vilkårsvurderingen, budsjettet og prosjektbeskrivelsen leses av saksbehandleren og agenten: saksdata
```

## felt-fodes-fra-saksdata Et felt settes fra saksdata av flyten, eller foreslås av agenten med sitat

```yaml
id: felt-fodes-fra-saksdata
klasse: valg
gjelder: [HentSaksdata, SetCaseFieldValue, RegnUt]
krever: [05-felt-og-saksdata.md#et-felt-har-en-leser]
opphav: skrevet
```

- **Gjør:** Bestem én skriver for hvert felt, og skriv den i sporingen til kravene:
  - **flyten**, når verdien står som et faktum i saksdata eller i skjemasvaret: «Hent saksdata» og så «Sett saksfelt».
    Er verdien en sum eller en andel av tall i saken, regner flyten den ut med «Regn ut» først
    (`07-flyt.md#flyt-regn-ut`). Utfallet settes fra skjemaet til handlingen som fatter vedtaket.
  - **agenten**, når verdien må leses ut av tekst: slå på KI-forslag på feltet (`ki-forslag-med-vilje`). Agenten leser
    dokumentene, e-postene, saksdataene og oppgavene, foreslår med begrunnelse og ordrett sitat, og et menneske
    godkjenner, retter eller avviser.
  - **sakstypens standardverdi**, når en ny sak nesten alltid har samme verdi (`standardverdi-pa-bindingen`).
- **Ikke gjør:** Ikke be saksbehandleren skrive inn en verdi i feltet som hun alt har skrevet i saksdata, eller omvendt.
  Ikke gi samme felt både en flyt og KI-forslag som skrivere. Ikke la saksdata bære en kopi av feltets verdi; la den bære
  grunnlaget og regelen verdien kom fra.
- **Hvorfor:** Det samme skrevet inn to ganger glir fra hverandre: den ene blir rettet, den andre ikke, og vedtaket
  bygger på den gale. Når feltet settes fra saksdata, er saksdata grunnlaget og feltet det Neo handler på. Et sitat som
  ikke finnes igjen i saken, forkaster forslaget, så et felt fra agenten kan alltid spores til kilden.

```yaml
# Eksempel, tilskudd: beløpet står i saksdataen «Tilsagnet», feltet settes av flyten som sender tilsagnsbrevet
workflow: "Send tilsagnet — tilskudd"
  # HentSaksdata (Tilsagnet) → SetCaseFieldValue { tsk_innvilget_belop: "{{saksdata.belop}}" }
caseDataTemplate: "Tilsagn — tilskudd"
  # fields: belop, regelen beløpet er satt etter, vilkårene for utbetaling
```

## tidspunkt-er-historikk Et tidspunkt for noe som skjedde, er ikke et felt og ikke saksdata

```yaml
id: tidspunkt-er-historikk
klasse: felle
gjelder: [customFieldDefinition.type]
krever: [06-oppgaver.md#oppgave-milepael, 13-innsikt.md#tall-krever-hendelse]
opphav: skrevet
```

- **Gjør:** Les det som har skjedd, der Neo registrerer det: statusendringene, dokumentene, oppgavene, e-postene og
  feltendringene i historikken, og bekreftelsene i veiviseren. Gjør en frist som skal følges opp, til en milepæl (en
  oppgave med frist). Skal Innsikt telle det over tid, skriv en egen hendelse i flyten der det skjer.
- **Ikke gjør:** Ikke lag felt eller saksdatafelt som «Mottatt dato», «Vedtaksdato», «Brev sendt», «Dato for
  forhåndsvarsel» eller «Saksbehandler som fattet vedtaket». Ikke skriv en rad i saksdata om at noe er gjort.
- **Hvorfor:** Neo skriver historikken av seg selv ved hver skriving, med aktøren og tidspunktet. Et felt for det samme
  må settes av noen, kan bli glemt, og kan si noe annet enn historikken. Nøkkeltallene teller allerede frister på åpne
  oppgaver og når saken ble avsluttet. Innsikt leser feltene slik de er nå, så et tidspunkt i et felt gir uansett ikke en
  telling over tid.

## plikten-er-ikke-saksdata En forvaltningsplikt bevises i dokumentet, oppgaven og bekreftelsen, ikke i saksdata

```yaml
id: plikten-er-ikke-saksdata
klasse: felle
gjelder: [caseDataTemplate]
krever: [03-veiviser.md#plikten-bekreftes-med-dokumentet, 05-felt-og-saksdata.md#tidspunkt-er-historikk]
opphav: skrevet
```

- **Gjør:** La plikten (foreløpig svar, forhåndsvarsel, mangelbrev, habilitet) oppfylles der den skjer: brevet som
  sendes, er dokumentet; arbeidet er en oppgave; og bekreftelsen er et steg i veiviseren med en betingelse om at
  dokumentet finnes. Legg vurderingen av det parten svarte, i vurderingen av saken, der den hører til.
- **Ikke gjør:** Ikke lag en saksdatamal per plikt («Forhåndsvarsel — fvl. § 16») og del den mellom sakstypene. Ikke lag
  avkrysninger eller datoer for at plikten er oppfylt («Forhåndsvarsel sendt», «Uttalelse mottatt», «Ingen uttalelse
  innen fristen»).
- **Hvorfor:** Dokumentet, oppgaven og bekreftelsen er beviset Neo alt har, med tidspunkt og aktør. En avkrysning i
  tillegg er samme faktum to steder, satt for hånd, og den kan si at brevet er sendt når det ikke er det. Om parten
  svarte, syns av at svaret ligger som kilde i saken; om fristen er ute, av oppgavens frist.

## parten-er-sakspart Den saken gjelder, er en sakspart, ikke et tekstfelt

```yaml
id: parten-er-sakspart
klasse: felle
gjelder: [FinnKontakt, OpprettKontakt, LeggTilPart]
opphav: skrevet
```

- **Gjør:** Legg søkeren, klageren, tilsynsobjektet, representanten og andre saken gjelder, inn som parter. La
  innsendingsflyten finne kontakten, opprette den når den ikke finnes, og legge den til som part.
- **Ikke gjør:** Ikke lag felt som «Søker», «Søkers navn», «Organisasjonsnummer» eller «Kontaktperson».
- **Hvorfor:** Brevene fletter partene per rolle, veiviseren kan telle dem, og flyten kan hente dem. Et tekstfelt i
  tillegg er samme faktum to steder, og en part gjenbrukes på tvers av saker.

## vurdering-i-saksdata Vurderinger og grunnlag står i saksdata

```yaml
id: vurdering-i-saksdata
klasse: valg
gjelder: [caseDataTemplate, caseDataTemplate.blocks, caseRunInstruction]
krever: [05-felt-og-saksdata.md#et-felt-har-en-leser]
opphav: praksis
```

- **Gjør:** Legg vilkårsvurderingen, begrunnelsen, det som taler for og mot, det som er uavklart og sitatene fra kildene
  i en saksdatamal. La utfallet stå som saksfelt.
- **Ikke gjør:** Ikke lag tekstfelt som «Vilkår», «Begrunnelse» eller «Vurdering» på saken.
- **Hvorfor:** En vurdering er flere opplysninger som hører sammen, med kilder. Neo lager den med en saksdatainstruks, og
  saksbehandleren kontrollerer den. Unntaket er når vurderingen skal skrives og leses i en tabell over mange saker (en
  agenda, en rangering): da er relasjonstabellen en leser, og vurderingen blir et `long_text`-felt.

Eksempel: I en formell kontroll av en søknad gjør flyten det som kan sjekkes uten skjønn (fristen, registeroppslaget,
at vedlegget finnes), og agenten leser dokumentene og fyller kontrollmalen med sitat, eller «uavklart» når den ikke
finner svaret. Saksbehandleren kontrollerer og avgjør om søknaden er komplett. Kontrollresultatet blir et saksfelt bare
når en visning eller en betingelse i veiviseren skal lese det.

```yaml
caseDataTemplates:
  - name: Vilkårsvurdering — tilskudd
    label: Vurdering av søknaden
    blocks:
      - { type: section, label: Vilkårene, description: "Vilkårene i forskriften § 3." }
      - type: fields
        columns: 1
        fields:
          - { key: vilkar_formaal, label: Formålet er innenfor ordningen, type: select, options: [Oppfylt, Ikke oppfylt, Uavklart] }
      - { type: text, key: vilkar_formaal_begrunnelse, label: Begrunnelse med kilde }
      - { type: text, key: uavklart, label: Det som ikke er avklart }
```

## flere-rader-er-saksdata Det som kan ha flere rader, står i en tabell i saksdata

```yaml
id: flere-rader-er-saksdata
klasse: valg
gjelder: [caseDataTemplate.blocks, OppdaterSaksdata, HentSaksdata]
krever: [13-innsikt.md#tall-krever-hendelse]
opphav: praksis
```

- **Gjør:** Bruk en `table`-blokk for det som gjentar seg: steder, kriterier, utbetalinger, anførsler, oppslag. Gi
  tabellen en `key`, så en flyt kan legge til og oppdatere rader, og regne med en kolonne. Skal Innsikt summere radene
  (utbetalt per år), skriv en egen hendelse fra flyten for hver rad som skjer.
- **Ikke gjør:** Ikke lag «Utbetaling 1», «Utbetaling 2» som felt. Ikke skriv en liste som fritekst i ett felt.
- **Hvorfor:** Et saksfelt bærer én verdi. En tabellrad har en fast id, og flytene kan legge til, oppdatere og slette
  rader. «Regn ut» finner tabellen på nøkkelen. Innsikt leser ikke saksdata, men hendelsene en strøm leverer.

```yaml
- type: table
  key: utbetalinger
  columns:
    - { key: termin,   label: Termin,   type: text }
    - { key: forfall,  label: Forfall,  type: date }
    - { key: belop,    label: Beløp,    type: number }
    - { key: vilkar,   label: Vilkår for utbetaling, type: text }
  rows: []   # tom med vilje: radene er sakens
```

## losningens-data-i-saksdata Det bare en integrasjon leser, står i integrasjonens saksdatamal

```yaml
id: losningens-data-i-saksdata
klasse: valg
gjelder: [caseDataTemplate, HentSaksdata, solution]
krever: [05-felt-og-saksdata.md#et-felt-har-en-leser, 11-integrasjoner.md#korrelasjon-paa-instans]
opphav: skrevet
```

- **Gjør:** Legg integrasjonens data om saken (arkivets saksmappe, journalpostene, et fagsystems svar) i en saksdatamal
  integrasjonen tar med seg i sin Løsning, for eksempel «Arkiv». Del den mellom sakstypene integrasjonen gjelder.
- **Ikke gjør:** Ikke lag et saksfelt for saksmappens id eller en annen ekstern id som bare integrasjonens flyt leser.
  Unntaket er en id en flyt skal finne saken på: «Finn sak» leser bare felt.
- **Hvorfor:** Den eneste leseren er flyten, og den leser saksdata. Malen er integrasjonens, så den følger Løsningen og
  er lik hos alle sakstypene.

## en-vurderingsmal-per-sakstype Vurderingen av sakstypens vilkår har sin egen mal i hver sakstype

```yaml
id: en-vurderingsmal-per-sakstype
klasse: felle
gjelder: [caseDataTemplate, caseDataTemplate.name, caseType.caseDataTemplates]
krever: [05-felt-og-saksdata.md#losningens-data-i-saksdata]
opphav: praksis
```

- **Gjør:** Gi hver sakstype sin egen mal for vilkårene og vurderingen, med sakstypen i navnet («Vilkårsvurdering —
  tilskudd»). Del en mal bare når den er en integrasjons (`losningens-data-i-saksdata`).
- **Ikke gjør:** Ikke del en vilkårsmal fordi teksten likner. Ikke gi to sakstypers maler samme navn.
- **Hvorfor:** Malene er unike på navnet hos eieren, så samme navn gir én rad med flere koblinger. En delt vilkårsmal gjør
  at en endring for én ordning endrer en annen.

## ikke-oppgavefelt Funn per steg står i saksdata, ikke i oppgavefelt

```yaml
id: ikke-oppgavefelt
klasse: felle
gjelder: [customFieldDefinition.entityType]
opphav: skrevet
```

- **Gjør:** Skriv det man finner i et steg i en saksdatamal, og vis til malen i beskrivelsen av oppgaven.
- **Ikke gjør:** Ikke lag felt på oppgavene (`entityType: task`) for en sakstype.
- **Hvorfor:** Oppgavefelt er organisasjonens, ikke sakstypens: hver oppgave i hver sak viser dem. Oppgavelista kan bare
  filtrere på dem, ikke sortere.

---

## Saksdatamalene

## fakta-og-vurdering-hver-sin-mal Det som kommer inn, og vurderingen av det er to maler

```yaml
id: fakta-og-vurdering-hver-sin-mal
klasse: valg
gjelder: [caseDataTemplate, caseType.caseDataTemplates, CreateCaseData, OppdaterSaksdata, caseRunInstruction]
krever: [07-flyt.md#flyt-saksdata-adresse]
opphav: praksis
```

- **Gjør:** Lag én mal for saksgrunnlaget (søknaden, oppslagene, uttalelsene), som flytene fyller. Lag en annen for
  vurderingen, som saksbehandleren fyller med Neo. Sett `sortOrder` på koblingene i den rekkefølgen de brukes.
- **Ikke gjør:** Ikke bland det flyten skriver og det saksbehandleren vurderer i samme datasett.
- **Hvorfor:** Grunnlaget skrives om når nye fakta kommer. Vurderingen skal ikke overskrives av en flyt. Med to maler kan
  den ene lages på nytt uten å røre den andre.

## modus-etter-hvem-som-fyller Velg modus etter hvem som lager datasettet

```yaml
id: modus-etter-hvem-som-fyller
klasse: valg
gjelder: [caseType.caseDataTemplates.mode, caseRunInstruction]
opphav: praksis
```

- **Gjør:** Bruk `INSTANTIATE_ON_CREATE` når flytene fyller datasettet underveis, eller når saksbehandleren skal se fra
  første minutt hvilke vurderinger saken skal ha. La standarden `AVAILABLE` stå når en kjøring lager datasettet («La Neo
  lage den»), eller når et tomt datasett ville sagt noe som ikke er sant.
- **Ikke gjør:** Ikke lag en tom tabell med saken for et oppslag som ikke er kjørt. Ikke lag tom en vurdering som Neo
  skal lage.
- **Hvorfor:** En kjøring lager alltid et nytt datasett, så det tomme må slettes for hånd. En tom tabell på en ny sak
  sier at oppslaget er gjort uten treff. `INSTANTIATE_ON_CREATE` gjelder bare saker som opprettes etter at koblingen er
  satt.

## ikke-en-logg Saksdata er ikke en aktivitetslogg

```yaml
id: ikke-en-logg
klasse: felle
gjelder: [CreateCaseData, OppdaterSaksdata]
krever: [05-felt-og-saksdata.md#tidspunkt-er-historikk]
opphav: skrevet
```

- **Gjør:** Spør før en flyt skriver saksdata: er dette en kvittering for at noe kjørte? Da skal det ikke skrives.
- **Ikke gjør:** Ikke skriv rader som «Saken flyttet til X» eller «Effektuert i fagsystemet, svarkode 201».
- **Hvorfor:** Neo registrerer selv statusen, oppgaven og dokumentet, og kjøringen bærer utfallet. Kvitteringer drukner
  det saksbehandleren skal lese.

## prosa-i-text-fakta-i-fields Datoer og valg i felt, prosa i tekstblokker

```yaml
id: prosa-i-text-fakta-i-fields
klasse: valg
gjelder: [caseDataTemplate.blocks]
opphav: praksis
```

- **Gjør:** Legg datoer, valg, tall og ja/nei i en `fields`-blokk. Legg det som skrives med egne ord (uttalelsens
  innhold, vurderingen av den) i en `text`-blokk.
- **Ikke gjør:** Ikke press en dato inn i et tekstfelt, og ikke lange vurderinger inn i et kort felt.
- **Hvorfor:** Typen avgjør kontrollen saksbehandleren får, og hva en flyt kan lese, regne med og sette et saksfelt fra.

## varsel-for-den-som-fyller-ut Det den som fyller ut malen må vite, står i et varsel øverst

```yaml
id: varsel-for-den-som-fyller-ut
klasse: valg
gjelder: [caseDataTemplate.blocks]
opphav: praksis
```

- **Gjør:** Start malen med en `alert`-blokk når et forbehold gjelder selve utfyllingen: hva som må være gjort først,
  hvem vedtaket binder. Bruk `severity: warning` når det har en konsekvens å overse, `info` ellers, og `error` bare for
  noe som stopper saken.
- **Ikke gjør:** Ikke bruk et varsel til en forklaring som hører i beskrivelsen til en `section`. Ikke sett flere varsler
  i samme mal.
- **Hvorfor:** Malen leses av den som gjør jobben, og et varsel syns. Blokka krever `severity` og `content`; med feil
  feltnavn avvises hele skrivingen.

```yaml
blocks:
  - type: alert
    severity: warning
    title: Siste utbetaling venter på godkjent sluttrapport
    content: "Ikke sett rapporten som godkjent før regnskapet er kontrollert mot tilsagnet."
```

## seksjon-innhold-skillelinje Bygg malen med overskrifter som har innhold, og skill ulike deler med en linje

```yaml
id: seksjon-innhold-skillelinje
klasse: valg
gjelder: [caseDataTemplate.blocks]
opphav: praksis
```

- **Gjør:** Start malen med en `section`, og la hver `section` følges av minst én blokk med innhold. Sett en `divider`
  mellom deler som handler om ulike ting. Bruk `list` for punkter og sjekklister, og `context` til slutt når raden skal
  merkes med stikkord.
- **Ikke gjør:** Ikke skriv markdown (`**fet**`, `- punkt`) i tekstene. Ikke lag en overskrift uten innhold.
- **Hvorfor:** All tekst i saksdata vises ordrett, så markdown står som tegn på skjermen. Agenten som fyller malen,
  bygger etter de samme reglene.

## bare-ferdige-blokker Bruk bare blokktypene Neo viser fullt ut

```yaml
id: bare-ferdige-blokker
klasse: felle
gjelder: [caseDataTemplate.blocks]
krever: [01-sakstype.md#kartlag-med-et-sporsmal, 07-flyt.md#flyt-handling-pa-objektet]
opphav: forslag
```

- **Gjør:** Bygg malen med `fields`, `section`, `table`, `text`, `divider`, `file`, `list`, `context` og `alert`. Vis kart
  med kartlagene på sakstypen, tall i Innsikt, og en handling som en flyt på saken.
- **Ikke gjør:** Ikke bruk `image`, `actions`, `input`, `map` eller `chart` i en mal.
- **Hvorfor:** De er plassholdere i visningen: de lagres, men vises som «kommer snart» eller som en enkel erstatning. En
  knapp eller et inndatafelt i saksdata gjør ingenting i saken.

## etikett-og-beskrivelse Etiketten er overskriften i saken, beskrivelsen sier hva malen holder og hvem som fyller den

```yaml
id: etikett-og-beskrivelse
klasse: valg
gjelder: [caseDataTemplate.name, caseDataTemplate.label, caseDataTemplate.description, caseDataTemplate.icon]
krever: [00-navn-pakking-og-versjoner.md#navn-innholdet-forst]
opphav: praksis
```

- **Gjør:** Gi malen et `name` som står fast; det er nøkkelen og navnet i biblioteket. Gi den en kort `label` med
  saksbehandlerens ord. Skriv i `description` hva malen holder, hvem eller hva som fyller den, og hvem som leser den. La
  `icon` stå tom.
- **Ikke gjør:** Ikke gi to maler samme etikett i én sakstype. Ikke endre navnet på en mal som er i bruk.
- **Hvorfor:** Etiketten er overskriften raden får på saken. Beskrivelsen er det den som kobler malen til en sakstype,
  leser. Vi har ikke sett at saken viser ikonet.

```yaml
caseDataTemplate:
  name: "Tilsagn — tilskudd"
  label: "Tilsagnet"
  description: >
    Beløpet, vilkårene og fristene i tilsagnet. Fylles av flyten som sender tilsagnsbrevet,
    og leses av oppfølgingen og utbetalingen.
  icon: null
```

---

## Saksfeltene

## utfall-som-felt Utfallet er et valgfelt, og statusen er tilstanden

```yaml
id: utfall-som-felt
klasse: valg
gjelder: [customFieldDefinition, customFieldDefinition.type, customFieldDefinition.optionsJson, SetCaseFieldValue, SetCaseStatus]
krever: [02-status.md#en-vedtaksstatus, 07-flyt.md#flyt-valg-med-skjema]
opphav: praksis
```

- **Gjør:** Lag ett `select`-felt «Utfall» med en nøkkel per utfall, og la handlingen som setter vedtaksstatusen, skrive
  det fra skjemaet sitt.
- **Ikke gjør:** Ikke lag utfallet som tekst. Ikke legg det bare i saksdata.
- **Hvorfor:** Utfallet filtreres, flettes og telles. Sakslista grupperer og teller bare på `select`, `checkbox` og
  `person`, og et valg har kjente verdier.

```yaml
- name: tsk_utfall
  label: Utfall
  type: select
  options:
    - { key: innvilget,        label: Innvilget }
    - { key: delvis-innvilget, label: Delvis innvilget }
    - { key: avslag,           label: Avslag }
    - { key: avvist,           label: Avvist }
```

## nokkel-og-etikett Valgene har en nøkkel som lagres og en etikett som vises

```yaml
id: nokkel-og-etikett
klasse: felle
gjelder: [customFieldDefinition.optionsJson, caseType.taskTemplateRules.conditionValues, SlaOppITabell]
krever: [07-flyt.md#flyt-tabell-for-oppslag]
opphav: skrevet
```

- **Gjør:** Skriv nøkkelen (`key`) og etiketten (`label`) for hvert valg. La flyten slå et maskinnavn fra skjemaet opp i
  en tabell og skrive nøkkelen.
- **Ikke gjør:** Ikke utled nøkkelen av etiketten, og ikke endre nøkkelen etter at den er i bruk. Ikke bruk etiketten i
  betingelsene for oppgavene.
- **Hvorfor:** Nøkkelen er det som lagres og sammenlignes; etiketten kan endres fritt. En nøkkel avledet av etiketten
  flytter seg når etiketten rettes, og da peker oppgavene, flytene og betingelsene på ingenting.

## velg-felttype Velg typen etter hva verdien er og hvem som leser den

```yaml
id: velg-felttype
klasse: valg
gjelder: [customFieldDefinition.type, caseType.customFields.type]
krever: [05-felt-og-saksdata.md#et-felt-har-en-leser]
opphav: skrevet
```

- **Gjør:**
  - `select` når verdiene er kjent på forhånd, og alltid når sakslista skal gruppere eller telle på feltet.
  - `multi_select` når flere av de kjente verdiene kan gjelde samtidig, og ingen skal gruppere på feltet.
  - `checkbox` for ja/nei som skal telles.
  - `number` for beløp og tall man skal summere, regne med, filtrere eller sortere på.
  - `date` for en dag i saken som ikke er et tidspunkt for noe som skjedde.
  - `text` for én linje, `long_text` for mer.
  - `links` for lenker som skrives inn der og da.
  - `status` bare på en relasjon (`04-relasjoner.md#status-for-ferdig`).
- **Ikke gjør:** Ikke bruk `text` for en dato eller et beløp. Ikke bruk `links` til noe som skal filtreres. Ikke bruk
  `status` eller `person` på saken. Har hver av verdiene egne opplysninger (et beløp, en begrunnelse), er det en tabell i
  saksdata, ikke `multi_select`.
- **Hvorfor:** Typen avgjør editoren, filteret, grupperingen og hvordan verdien flettes. Sakslista grupperer bare på
  `select`, `checkbox` og `person`. `links` har ikke et kjent sett å filtrere mot.

## filterable-bevisst Sett filtrerbar med vilje, og alltid av på lenker og lange tekster

```yaml
id: filterable-bevisst
klasse: felle
gjelder: [customFieldDefinition.filterable, caseType.customFields.filterable]
opphav: skrevet
```

- **Gjør:** La standarden (`true`) stå på felt noen filtrerer på i sakslista. Sett `filterable: false` på `long_text`, og
  alltid på `links`.
- **Ikke gjør:** Ikke la et `links`-felt stå uten `filterable: false`.
- **Hvorfor:** Oppsettet setter `true` når verdien mangler, også på `links`, og da tilbyr tabellen et filter som alltid
  feiler. Grensesnittet avviser det samme; oppsettet gjør det ikke.

## prefiks-per-sakstype Feltnavnet har et prefiks for sakstypen

```yaml
id: prefiks-per-sakstype
klasse: valg
gjelder: [customFieldDefinition.name, caseType.customFields.name]
opphav: praksis
```

- **Gjør:** Gi feltene i en sakstype et felles prefiks (`tsk_` for tilskudd, `byg_` for byggesak, `tls_` for tilsyn). Et
  felt som deles av flere sakstyper, får et navn uten prefiks for én sakstype.
- **Ikke gjør:** Ikke gi felt generiske navn som `utfall` eller `dato`.
- **Hvorfor:** Navnet er unikt i organisasjonen per entitetstype, og det er navnet flettingen, betingelsene og «Hent sak»
  peker på.

## seksjon-pa-feltet Seksjonen og rekkefølgen står på feltet

```yaml
id: seksjon-pa-feltet
klasse: valg
gjelder: [customFieldDefinition.group, customFieldDefinition.order, caseType.customFields.group, caseType.customFields.order]
opphav: skrevet
```

- **Gjør:** Gi felt som hører sammen samme `group` («Søknaden», «Vedtaket»), høyst 60 tegn, og sett `order`.
- **Ikke gjør:** Ikke prøv å gruppere i en visning.
- **Hvorfor:** At feltene hører sammen, er et faktum om feltene. Seksjonen brukes i egenskapspanelet, relasjonsvisningen
  og veiviseren.

## ki-forslag-med-vilje KI-forslag slås på felt for felt, med et kriterium

```yaml
id: ki-forslag-med-vilje
klasse: standard
gjelder: [customFieldDefinition.aiSuggestions, customFieldDefinition.extractionCriterion, customFieldDefinition.helpText, caseType.customFields.aiSuggestions, caseType.customFields.extractionCriterion, caseType.customFields.helpText]
krever: [05-felt-og-saksdata.md#felt-fodes-fra-saksdata]
opphav: skrevet
sjekkes: maskinelt
```

- **Gjør:** La Neos standard stå (forslagene er av). Slå på `aiSuggestions` med vilje på saksfelt som skal leses ut av
  saken (dokumentene, e-postene, saksdataene). Skriv `extractionCriterion` for modellen: hva som hører i feltet, med
  negative eksempler. Skriv `helpText` (høyst 300 tegn) for mennesket.
- **Ikke gjør:** Ikke slå på KI-forslag på felt en flyt setter, eller på felt saksbehandleren avgjør i en handling
  (utfallet). Ikke bruk hjelpeteksten som kriterium. Ikke skriv et kriterium uten å slå på forslagene.
- **Hvorfor:** Uten kriteriet har modellen bare etiketten, og forslaget merkes med at kriteriet mangler. Et kriterium
  uten `aiSuggestions: true`, eller på et felt som ikke er på saken, avvises når oppsettet skrives. Forslagene gjelder
  ikke `person`, `status` og `links`.

```yaml
- name: tsk_prosjektnavn
  label: Prosjektets navn
  type: text
  aiSuggestions: true
  extractionCriterion: >
    Navnet søkeren gir prosjektet i søknaden. Ikke søkerens navn,
    ikke ordningens navn, ikke saksnummeret.
  helpText: Slik søkeren selv kaller prosjektet.
```

## pakrevd-er-en-betingelse Påkrevd er ikke en egenskap ved feltet

```yaml
id: pakrevd-er-en-betingelse
klasse: felle
gjelder: [customFieldDefinition, caseType.wizard.steps.condition, LagPdfFraSaksdokument]
krever: [03-veiviser.md#alle-krever-et-krav, 09-maler.md#mal-flettefeltene-lost]
opphav: praksis
```

- **Gjør:** Si at et felt må være fylt ut i betingelsen for steget i veiviseren (`isNotEmpty`), eller med «Krev at alle
  flettefelt er løst» når brevet lages.
- **Ikke gjør:** Ikke se etter et påkrevd-valg på feltet. Det finnes ikke.
- **Hvorfor:** Om et felt er påkrevd, avhenger av hvor saken er. Utfallet er ikke påkrevd før vedtaket.

## standardverdi-pa-bindingen En standardverdi settes per sakstype

```yaml
id: standardverdi-pa-bindingen
klasse: standard
gjelder: [caseType.customFields.defaultValue]
krever: [05-felt-og-saksdata.md#felt-fodes-fra-saksdata]
opphav: forslag
```

- **Gjør:** La feltet stå uten standardverdi. Sett en bare når en ny sak av sakstypen nesten alltid har samme verdi, for
  eksempel ordningen når sakstypen bare gjelder én ordning.
- **Ikke gjør:** Ikke bruk standardverdien for noe saksbehandleren skal ta stilling til, som utfallet.
- **Hvorfor:** Standardverdien bor på bindingen mellom feltet og sakstypen og settes når saken opprettes. En verdi
  kalleren sender, vinner.

## poeng-som-felt-begrunnelse-som-saksdata Summen er et felt, vurderingen per kriterium er saksdata

```yaml
id: poeng-som-felt-begrunnelse-som-saksdata
klasse: valg
gjelder: [customFieldDefinition, caseDataTemplate.blocks, SetCaseFieldValue, RegnUt]
krever: [05-felt-og-saksdata.md#felt-fodes-fra-saksdata, 04-relasjoner.md#relasjonsfelt-for-krysset, 07-flyt.md#flyt-regn-ut]
opphav: forslag
```

- **Gjør:** Legg vurderingen per kriterium (poeng og begrunnelse) i en tabell i saksdata. Lag poengsummen som
  `number`-felt, regnet ut av flyten med «Regn ut» (summen av poengkolonnen) og satt med «Sett saksfelt». Er kriteriene
  vektet, la tabellen ha en kolonne med de vektede poengene, så summen er summen av én kolonne. Lag poeng per kriterium
  som egne felt bare når kriteriene er faste og skal stå som kolonner i en tabell over sakene. Plassen i en runde er et
  felt på relasjonen når runden er en egen sak.
- **Ikke gjør:** Ikke skriv poengene som fritekst. Ikke la saksbehandleren skrive summen inn for hånd ved siden av
  tabellen.
- **Hvorfor:** Summen er det sakene sammenlignes på. Regnet av flyten fra tabellen er den alltid lik radene. Sakslista
  sorterer på et eget felt bare når det er den første sorteringen.

Eksempel: Agenten fyller vurderingsmalen med poeng, begrunnelse og sitat per kriterium når saksbehandleren ber om det.
Saksbehandleren kontrollerer hvert punkt mot kilden, og en handling på vurderingsoppgaven regner ut summen og setter
feltet. Sammenligningen av sakene mot hverandre gjør et menneske, i relasjonstabellen eller sakslista.

```yaml
customFields:
  - { name: tsk_poeng_sum, label: Poeng totalt, type: number, group: Vurderingen }
caseDataTemplates:
  - name: Vurdering mot tildelingskriteriene — tilskudd
    blocks:
      - type: table
        key: kriterier
        columns:
          - { key: kriterium,   label: Kriterium,   type: text }
          - { key: vekt,        label: Vekt,        type: number }
          - { key: poeng,       label: Poeng,       type: number }
          - { key: begrunnelse, label: Begrunnelse med kilde, type: text }
        rows: []
```

---

## Felt på henvendelser og kontakter

## henvendelsesfelt-for-mottaket Felt på en henvendelse er for mottaket, før den legges i sak

```yaml
id: henvendelsesfelt-for-mottaket
klasse: felle
krever: [10-skjema-og-innboks.md#legg-i-sak-er-overgangen, 10-skjema-og-innboks.md#tagg-ruter-ikke-sak]
opphav: forslag
```

- **Gjør:** Bruk grunnsettet Neo gir på henvendelsene (Kategori, Sammendrag, Foreslått sak, Skjerming). Lag et eget felt
  på henvendelsen bare når mottaket eller en flyt trenger det for å sortere, fordele eller skjerme.
- **Ikke gjør:** Ikke lag felt på henvendelsen for opplysninger om saken. Ikke lag et felt som sier det samme som en
  tagg.
- **Hvorfor:** Feltene følger ikke med når henvendelsen legges i sak; det som skal vare, skrives i saken. Den eneste
  leseren utenom mottaket er flyten.

## kontaktfelt-for-det-som-gjelder-parten Et kontaktfelt er for det som er sant om parten i alle sakene

```yaml
id: kontaktfelt-for-det-som-gjelder-parten
klasse: valg
gjelder: [OppdaterKontakt]
krever: [11-integrasjoner.md#registre-skriver-pa-kontakten]
opphav: skrevet
```

- **Gjør:** Lag et kontaktfelt for opplysninger om personen eller virksomheten som gjelder uansett sak: reservasjonen
  mot digital post, når kontakten sist ble kontrollert mot et register. Legg feltene i en seksjon med kildens navn.
- **Ikke gjør:** Ikke lag kontaktfelt for det som gjelder én sak. Ikke lag egne felt for det en register-Løsning alt
  gir.
- **Hvorfor:** Kontaktfeltet følger kontakten til hver sak og kan leses i veiviseren («alle partene er sjekket mot
  registeret»). En endring gir ingen saksaktivitet, fordi kontakten ikke har en sak.

## kontaktfelt-gjelder-typene Et kontaktfelt gjelder bare de kontakttypene opplysningen finnes for

```yaml
id: kontaktfelt-gjelder-typene
klasse: felle
gjelder: [customFieldDefinition.contactTypes, OppdaterKontakt]
krever: [05-felt-og-saksdata.md#kontaktfelt-for-det-som-gjelder-parten]
opphav: skrevet
```

- **Gjør:** Sett `contactTypes` til `PERSON`, `ORGANIZATION` eller begge, etter hvem opplysningen kan gjelde, før en flyt
  skriver feltet.
- **Ikke gjør:** Ikke la lista stå tom; tom betyr ikke «alle». Ikke la et felt gjelde begge for sikkerhets skyld.
- **Hvorfor:** Kontaktsiden viser bare feltene for kontaktens type. En verdi til en kontakt av en annen type avvises,
  også fra en flyt, som da stopper uten å endre kontakten.

```yaml
customFieldDefinition:
  entityType: contact
  name: reservertMotDigitalKommunikasjon
  label: Reservert mot digital kommunikasjon
  type: checkbox
  group: Kontakt- og reservasjonsregisteret
  contactTypes: [PERSON]
```

## adressetype-fast-forst Bruk de faste adressetypene; lag en egen bare for det de ikke dekker

```yaml
id: adressetype-fast-forst
klasse: felle
gjelder: [OppdaterKontakt]
krever: [11-integrasjoner.md#registre-skriver-pa-kontakten]
opphav: forslag
```

- **Gjør:** Bruk postadresse, bostedsadresse, forretningsadresse og besøksadresse. Lag en egen adressetype bare for et
  slag adresse ingen av dem dekker, og bestem etiketten før en flyt skriver den.
- **Ikke gjør:** Ikke gi en egen type nytt navn når en flyt skriver den. Ikke gi en kontakt to adresser av samme type.
- **Hvorfor:** En flyt finner en egen adressetype på etiketten; finnes den ikke, eller har kontakten to adresser av
  typen, stopper flyten uten å endre kontakten. Adressetypene settes i hver organisasjon og følger ikke med en Løsning.
