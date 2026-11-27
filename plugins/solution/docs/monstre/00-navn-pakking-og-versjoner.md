# Navn, pakking og versjoner

Reglene som gjelder alle flatene: hva objektene i oppsettet heter, hvordan de ligger som filer i `oppsett/`, hvordan
det Neo leverer tas inn, hvordan en endring kommer fra sandkassen til produksjonen, og hvordan oppsettet prøves før det
er i bruk. Les denne før de andre filene: navnet er det vanskeligste å endre etterpå.

Filene peker på hverandre med navn (`ref:<type>:<navn>`). De gjennomføres i kundens sandkasse etter en godkjent PR, og
kundens org-admin promoterer fra sandkassen til produksjonen i Neo. Ingenting i oppsettet endres av seg selv: alt som
kommer fra Neo, går gjennom sandkassen og en PR (`katalogen-tas-inn-med-en-pr`).

## Kortversjonen

| Spørsmålet | Et ja betyr | Regelen |
|---|---|---|
| Peker en fil på objektet? | Bestem navnet først, og endre det ikke etterpå | `navn-er-nokkelen` |
| Bruker flere løsninger det (et felt uten sakstype, et statussett, en innboks-tagg)? | Én felles fil i `oppsett/` | `felles-er-en-fil` |
| Peker en flyt på det? | Det finnes som fil i `oppsett/`, eller er satt opp i Neo før gjennomføringen | `oppsettet-har-det-flyten-peker-pa` |
| Kommer det fra Neo (en katalogløsning, et objekt fra biblioteket, en ny versjon)? | Tas inn i sandkassen og går gjennom en PR | `katalogen-tas-inn-med-en-pr` |
| Er det noe Neo ikke skriver som fil (skjema, strøm, visning, søk, Innsikt, tilgang)? | Et steg i Neo, i sandkassen, og promoteres | `endre-i-sandboxen` |
| Er organisasjonen i bruk? | Endringen gjennomføres og prøves i sandkassen, og promoteres | `endre-i-sandboxen`, `test-i-sandboxen` |
| Er en ny flyt gjennomført eller promotert? | Les gapene og aktiver | `flyter-lander-som-utkast` |
| Skal en publisert hendelsestype endres? | Legg til felt, eller lag en ny type | `hendelsestypen-brytes-ikke` |

## Navngiving

Navnene per objekt, og hvor regelen står:

| Objekt | I oppsettet | Navnet | Regelen |
|---|---|---|---|
| Sakstype | `caseType` | Tingen saken gjelder, i entall | `01-sakstype.md#navn-og-slug` |
| Status | `caseType` (statusvalget) | Tilstanden saken har nådd | `02-status.md#stabile-statusnavn` |
| Felt | `customFieldDefinition` | `<prefiks>_<hva>` og kundens etikett | `05-felt-og-saksdata.md#prefiks-per-sakstype` |
| Flyt | `workflow` | «<Sakstype> — <hva flyten gjør>» | `navn-sakstype-forst` |
| Strøm | `stream` | «<Sakstype> — <hva som kommer inn>» | `navn-sakstype-forst` |
| Skjema | `form` | «<Sakstype> — <hva det spør om>» | `navn-sakstype-forst`, `10-skjema-og-innboks.md#skjema-navn-og-versjon` |
| Instruks | `instruction`, `caseRunInstruction` | «<Hva> — <sakstype>» | `navn-innholdet-forst` |
| Dokumentmal | `documentTemplate` | «<Hva> — <sakstype>» | `navn-innholdet-forst` |
| Saksdatamal | `caseDataTemplate` | «<Hva> — <sakstype>», kort etikett | `navn-innholdet-forst`, `05-felt-og-saksdata.md#etikett-og-beskrivelse` |
| Hendelsestype | `flowEventType` | `objekt.handling` | `navn-hendelse-objekt-handling` |
| Oppgavesett | `taskTemplateSet` | Sakstypens navn | `navn-oppgavesett` |
| Visning | `savedView` | «<Sakstype> — <utvalg>» | `12-visninger.md#sakstype-i-navnet` |
| Søk | `organizationSearch` | Det medlemmet søker i | `17-sok.md#sok-navn-er-kilden` |
| Tilgangsgruppe | (`Team`) | Sakstypen og jobben | `14-tilgang.md#gruppa-har-alle-som-ma-lese` |

Tankestreken i navnene er en del av navneformen; den skiller sakstypen fra resten i lister der alt står samlet.

## navn-er-nokkelen Bestem navnet før første gjennomføring, og ikke endre et navn noe finner objektet på

```yaml
id: navn-er-nokkelen
klasse: felle
gjelder: [caseType.name, workflow.name, stream.name, form.name, instruction.name, caseRunInstruction.name, documentTemplate.name, caseDataTemplate.name, flowEventType.name, taskTemplateSet.name, savedView.name, customFieldDefinition.name]
krever: [07-flyt.md#flyt-identitet-er-id]
opphav: skrevet
sjekkes: maskinelt
```

- **Gjør:** Bestem navnet på hvert objekt før det gjennomføres i sandkassen første gang. Velg navn som ikke kolliderer
  med det kunden har fra før, med prefikset og sakstypen i navnet. Endre det som vises (etiketten, beskrivelsen) når
  kunden vil ha et annet ord.
- **Ikke gjør:** Ikke gi nytt navn til en status, et felt eller en hendelsestype som er i bruk. Ikke bruk samme navn på
  to objekter av samme type hos samme eier.
- **Hvorfor:** Filene peker på hverandre med navnet (`ref:caseDataTemplate:Arkiv`), og planen finner objektet i Neo på
  navnet. Får et objekt nytt navn, peker filene på et som ikke finnes, eller planen lager et nytt ved siden av. Det
  samme gjelder det i Neo som finner objektet på navnet: statusen i «Finn steg» og betingelsene i veiviseren, feltet i
  en flettekode, og feltene i en hendelse. For en status og en hendelsestype er navnet selve nøkkelen.

## navn-sakstype-forst Flyter, strømmer og skjema heter «<Sakstype> — <hva den gjør>»

```yaml
id: navn-sakstype-forst
klasse: valg
gjelder: [workflow.name, stream.name, form.name]
krever: [07-flyt.md#flyt-handling-pa-objektet]
opphav: praksis
```

- **Gjør:** Start navnet med sakstypen og en tankestrek, og si så med et verb hva flyten gjør, eller hva strømmen tar
  imot. Bruk samme ord som handlingen saksbehandleren ser.
- **Ikke gjør:** Ikke nummerer flytene i navnet, og ikke bruk tekniske ord («webhook-handler»).
- **Hvorfor:** Flyter, strømmer og skjema står i én liste per organisasjon. Med sakstypen først står de som hører
  sammen, sammen, og navnet sier hva som skjer i kjøringsloggen.

```yaml
stream:   { name: "Tilskudd — innsendinger fra Altinn" }
workflow:
  - { name: "Tilskudd — søknad mottatt fra Altinn" }
  - { name: "Tilskudd — registrer vedtaket og send det til søkeren" }
form:     { name: "Tilskudd — registrer vedtak" }
```

## navn-innholdet-forst Instrukser, dokumentmaler og saksdatamaler heter «<Hva> — <sakstype>»

```yaml
id: navn-innholdet-forst
klasse: valg
gjelder: [instruction.name, caseRunInstruction.name, documentTemplate.name, caseDataTemplate.name, caseDataTemplate.label]
krever: [08-instrukser.md#instruks-delt-eller-egen, 09-maler.md#mal-delte-brev]
opphav: praksis
```

- **Gjør:** Start med hva objektet er («Behandlingsregel», «Vedtak», «Vilkårsvurdering»), så tankestrek og sakstypen.
  Gi saksdatamalen en kort etikett uten sakstypen, fordi den vises inne i saken. Et brev som deles mellom sakstyper, får
  hjemmelen i stedet for sakstypen («Foreløpig svar — fvl. § 11 a»); en delt saksdatamal får integrasjonens navn
  («Arkiv»).
- **Ikke gjør:** Ikke gi en delt instruks eller mal et sakstypenavn, og ikke gi to sakstypers vilkårsmaler samme navn.
- **Hvorfor:** Den som velger mal eller instruks, leter etter hva den er. Sakstypen skiller radene, siden navnet er
  unikt per eier. En delt rad med sakstypen i navnet ser ut som den hører til én.

```yaml
instruction:        { name: "Behandlingsregel — tilskudd" }
caseRunInstruction: { name: "Vurdering mot tildelingskriteriene — tilskudd" }
documentTemplate:   { name: "Vedtak — tilskudd" }
caseDataTemplate:   { name: "Saksgrunnlag — tilskudd", label: "Saksgrunnlag" }
documentTemplate:   { name: "Foreløpig svar — fvl. § 11 a" }   # delt mellom sakstypene
```

## navn-hendelse-objekt-handling En egen hendelsestype heter `objekt.handling`

```yaml
id: navn-hendelse-objekt-handling
klasse: felle
gjelder: [flowEventType.name, flowEventType.label]
krever: [07-flyt.md#flyt-egen-hendelse]
opphav: skrevet
```

- **Gjør:** Gi hendelsen navnet på tingen og det som skjedde med den, i fortid: `tilsagn.gitt`, `utbetaling.sendt`.
- **Ikke gjør:** Ikke bruk et navn fra Neos hendelseskatalog, og ikke legg sakstypen i navnet når hendelsen kan skje i
  flere.
- **Hvorfor:** Neo avviser navn som kolliderer med katalogen, ved hver skriving. Formen gjør at Innsikt og strømmene
  leser egne og Neos hendelser på samme måte.

## navn-oppgavesett Oppgavesettet heter som sakstypen det hører til

```yaml
id: navn-oppgavesett
klasse: valg
gjelder: [taskTemplateSet.name]
krever: [06-oppgaver.md#oppgave-ett-sett-per-sakstype]
opphav: forslag
```

- **Gjør:** Kall settet det samme som sakstypen. Et delt sett (for eksempel foreløpig svar) får navnet på det det gjør.
- **Ikke gjør:** Ikke kall settet «Standard» eller «Oppgaver».
- **Hvorfor:** Settet velges i en liste der alle sakstypers sett står.

## Filene og det Neo leverer

## felles-er-en-fil Det flere løsninger bruker, er én fil i `oppsett/`

```yaml
id: felles-er-en-fil
klasse: valg
gjelder: [customFieldDefinition, caseTypeStatusGroup, inboxTag, caseDataTemplate, flowEventType]
opphav: praksis
```

- **Gjør:** Legg det som hører til én løsning (sakstypen, flytene, malene, oppgavene), i filene for den. Legg det flere
  løsninger bruker (et felt uten sakstype, et statussett, en innboks-tagg, en saksdatamal for arkivet), i én fil i
  `oppsett/`, og la kravene i hver løsning vise til den.
- **Ikke gjør:** Ikke lag en kopi av et felles objekt for hver løsning. Ikke legg alt kunden skal ha, i én løsning.
- **Hvorfor:** Neo har ett objekt per navn hos en eier. To filer med samme objekt skriver over hverandre, og en løsning
  som eier noe andre bruker, kan ikke endres uten å treffe dem.

## oppsettet-har-det-flyten-peker-pa Alt en flyt peker på, finnes som fil eller er satt opp i Neo før gjennomføringen

```yaml
id: oppsettet-har-det-flyten-peker-pa
klasse: felle
gjelder: [workflow]
krever: [07-flyt.md#flyt-identitet-er-id, 07-flyt.md#flyt-aktivering]
opphav: skrevet
```

- **Gjør:** Legg feltene, statusene, malene og hendelsestypene en flyt peker på, i `oppsett/`. Det Neo ikke skriver som
  fil (skjemaet, strømmen, integrasjonen, postboksen), settes opp i sandkassen før gjennomføringen, med det navnet
  flyten peker på. Ta bare med objekter et krav trenger.
- **Ikke gjør:** Ikke gå ut fra at kunden har et felt eller en status med samme navn. Ikke legg med objekter «i tilfelle».
- **Hvorfor:** Planen stopper på en peker til et objekt som ikke finnes. Ved promoteringen skrives pekerne om til
  produksjonens objekter, og mangler produksjonen en integrasjon eller en postboks, står det som et gap på flyten til
  det er satt opp der. Et objekt ingen leser, har ingen jobb hos kunden heller.

## katalogen-tas-inn-med-en-pr Det Neo leverer, tas inn i sandkassen og går gjennom en PR, også en ny versjon

```yaml
id: katalogen-tas-inn-med-en-pr
klasse: felle
gjelder: [solution]
krever: [endre-i-sandboxen]
opphav: skrevet
```

- **Gjør:** Ta i bruk en katalogløsning fra Neo («Grunnoppsett for saksbehandling», «Documaster», registrene, SvarUt og
  SvarInn) eller et objekt fra biblioteket i sandkassen. Ta snapshot, og legg filene som kom inn, i `oppsett/` med en PR.
  Fra da er filene kilden, som for alt annet. Tilbyr Neo en ny versjon («Adopter endringer»), trykk den bare i
  sandkassen, etter at noen har lest hva som endres. Snapshotet etterpå er endringen i PR-en, og den promoteres når
  PR-en er godkjent.
- **Ikke gjør:** Ikke ta i bruk en katalogløsning eller adopter en ny versjon i produksjonen. Ikke adopter en ny versjon
  uten å se hva den endrer i flytene og feltene kunden alt bruker.
- **Hvorfor:** En ny versjon kan endre flyter, felt og statuser som er i bruk i mange saker. Neo oppgraderer ikke noe av
  seg selv, men knappene finnes i hver organisasjon, også i produksjonen. I sandkassen prøves endringen før den
  promoteres. PR-en holder filene lik sandkassen: står den nye versjonen ikke i `oppsett/`, viser neste plan den som en
  endring og gjennomføringen setter den tilbake.

## Versjoner og publisering

## endre-i-sandboxen Endringer i en organisasjon som er i bruk, gjøres i sandkassen og promoteres

```yaml
id: endre-i-sandboxen
klasse: felle
gjelder: [workflow, caseType]
krever: [14-tilgang.md#jobbroller-etter-jobben]
opphav: skrevet
```

- **Gjør:** Gjennomfør filene i sandkassen etter en godkjent PR, og gjør stegene i Neo der. Prøv endringen, og la
  kundens org-admin promotere de objektene som er klare.
- **Ikke gjør:** Ikke endre en aktiv flyt eller en sakstype med saker direkte i produksjon for å se hva som skjer.
- **Hvorfor:** Promoteringen lagrer versjonen før og etter, og en endring som bryter en aktiv flyt eller fjerner en
  status som er i bruk, avvises uten at noe endres. Sandkassen krever at organisasjonen har den låst opp.

## flyter-lander-som-utkast Etter gjennomføring og promotering er nye flyter utkast til noen aktiverer dem

```yaml
id: flyter-lander-som-utkast
klasse: felle
gjelder: [workflow]
krever: [07-flyt.md#flyt-aktivering]
opphav: skrevet
```

- **Gjør:** Etter gjennomføringen, «Ta i bruk» eller promoteringen av noe nytt: les gapene og aktiver flytene.
- **Ikke gjør:** Ikke meld at oppsettet er på plass før flytene er aktive.
- **Hvorfor:** Nye flyter lander som utkast, og hjemmelen til å skrive i sakene følger ikke med. En oppdatert flyt
  beholder statusen sin.

Eksempel: slik kommer et oppsett i drift hos en kunde.

1. Bestem navnene (`navn-er-nokkelen`).
2. Ta i bruk katalogløsningene kunden trenger, i sandkassen, og ta filene inn med en PR (`katalogen-tas-inn-med-en-pr`).
3. Bygg filene i `oppsett/`, det felles én gang (`felles-er-en-fil`), og få planen godkjent i PR-en.
4. Gjennomfør i sandkassen. Gjør stegene i Neo der: skjemaene, strømmene, visningene, søkene, Innsikt og tilgangen.
   Les gapene, aktiver flytene, og publiser veiviseren og saksdatainstruksene.
5. Prøv med testsaker for hver gren (`test-i-sandboxen`, `en-testsak-per-gren`).
6. Kundens org-admin promoterer til produksjonen. Les gapene der, og aktiver.
7. Endre senere på samme vei: en PR, gjennomføring i sandkassen, prøving og promotering.

## hendelsestypen-brytes-ikke En publisert hendelsestype endres ved å legge til, ikke ved å bytte ut

```yaml
id: hendelsestypen-brytes-ikke
klasse: felle
gjelder: [flowEventType, flowEventType.fields]
krever: [07-flyt.md#flyt-egen-hendelse]
opphav: skrevet
```

- **Gjør:** Legg til nye felt i en ny versjon. Lag en ny hendelsestype når betydningen endres.
- **Ikke gjør:** Ikke fjern eller gi nytt navn til et felt en flyt, en strøm eller Innsikt bruker.
- **Hvorfor:** Versjonene er uforanderlige, og en publisering som bryter noe som bruker et felt, avvises. Innsikt leser
  feltet med typen fra versjonen hendelsen fulgte.

## Prøving

## test-i-sandboxen Prøv oppsettet i sandkassen, der ingenting sendes ut, med testsaker laget der

```yaml
id: test-i-sandboxen
klasse: felle
gjelder: [workflow]
krever: [00-navn-pakking-og-versjoner.md#endre-i-sandboxen]
opphav: skrevet
```

- **Gjør:** Kjør flytene i sandkassen, og les «Sperret utgående» for å se hva som ville blitt sendt, og til hvem. Lag
  testsakene der, etter at konfigen er klonet. La sending stå sperret; slå den på bare for en avtalt demo mot mottakere
  dere selv eier, og av igjen etterpå.
- **Ikke gjør:** Ikke prøv en flyt som sender brev, arkiverer eller skriver til Altinn i produksjon. Ikke lag testsaker i
  kundens produksjon, og ikke bruk kundens ekte saker. Ikke legg testsaker i `oppsett/`.
- **Hvorfor:** Sandkassen sender ingen e-post, webhook, HTTP-kall eller skriving til arkiv, Altinn eller SvarUt, og
  kjøringen stopper etter steget som ble sperret, så stegene etter må prøves for seg. Kloningen tar med konfigen, ikke
  saker. En testsak i produksjon kommer med i køene, Innsikt og arkivet.

## en-testsak-per-gren Testsakene dekker hver vei saken kan ta

```yaml
id: en-testsak-per-gren
klasse: valg
gjelder: [caseType, caseType.variantField, customFieldDefinition.optionsJson, savedView]
krever: [05-felt-og-saksdata.md#nokkel-og-etikett, 02-status.md#en-vedtaksstatus, 01-sakstype.md#variant-som-felt]
opphav: forslag
```

- **Gjør:** Lag minst én testsak per vei et krav gir: per utfall, per verdi i variantfeltet, for ventestatusen og for
  klagen. Prøv inngangen med en innsending før saken finnes, og resten på saker som står i riktig steg. Bruk oppdiktede
  personer, faste datoer og valgenes nøkler.
- **Ikke gjør:** Ikke test bare hovedløpet med innvilgelse. Ikke lag alle testsakene for hånd forbi inntaket. Ikke bruk
  ekte personer eller etiketter i stedet for nøkler.
- **Hvorfor:** Feilene sitter i sporene som sjelden går. Inntaket setter part, felt og saksdata som resten bygger på.
  Feltet lagrer nøkkelen, så en etikett gir en sak ingen filter treffer.

```yaml
- { tittel: "Test — innvilget i sin helhet",   tsk_utfall: innvilget }
- { tittel: "Test — avslag",                    tsk_utfall: avslag }
- { tittel: "Test — venter på ettersending",    status: "Venter på svar" }
- { tittel: "Test — venter på klagefrist",    status: "Venter på klagefrist" }
```
