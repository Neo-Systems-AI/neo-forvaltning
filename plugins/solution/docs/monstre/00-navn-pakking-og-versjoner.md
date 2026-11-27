# Navn, pakking og versjoner

Reglene som gjelder alle flatene: hva objektene i oppsettet heter, hvordan de pakkes i Løsninger (`solution`) og
implementasjonsprofiler (`implementationProfile`), hvordan en endring publiseres og rulles ut, og hvordan oppsettet
prøves før det er i bruk. Les denne før de andre filene: navnet og pakken er det vanskeligste å endre etterpå.

## Kortversjonen

| Spørsmålet | Et ja betyr | Regelen |
|---|---|---|
| Skal objektet rulles ut til en kunde? | Bestem navnet først, og endre det ikke etterpå | `navn-er-nokkelen` |
| Hører det til ett bruksområde (en sakstype med det den trenger)? | Én Løsning for bruksområdet | `losning-per-bruksomrade` |
| Skal flere bruksområder bruke det (et arkiv, et register)? | En egen Løsning | `losning-per-bruksomrade` |
| Peker en flyt på det? | Med i samme Løsning, eller en Løsning som tas i bruk først | `losning-har-det-den-peker-pa` |
| Skal flere organisasjoner ha samme helhet? | En implementasjonsprofil | `implementasjon-er-kundens-helhet` |
| Er det en veiviser, en relasjonsvisning eller en lagret visning av relasjonstabellen? | Settes opp i hver organisasjon; følger ikke med Løsningen | `03-veiviser.md#en-per-sakstype`, `04-relasjoner.md#org-eide-visninger` |
| Er organisasjonen i bruk? | Endringen lages og prøves i sandboxen | `endre-i-sandboxen`, `test-i-sandboxen` |
| Er en ny flyt rullet ut eller promotert? | Les gapene og aktiver | `flyter-lander-som-utkast` |
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
| Løsning | `solution` | Bruksområdet eller integrasjonen | `losning-per-bruksomrade` |

Tankestreken i navnene er en del av navneformen; den skiller sakstypen fra resten i lister der alt står samlet.

## navn-er-nokkelen Bestem navnet før første utrulling, og ikke endre et navn noe finner objektet på

```yaml
id: navn-er-nokkelen
klasse: felle
gjelder: [caseType.name, workflow.name, stream.name, form.name, instruction.name, caseRunInstruction.name, documentTemplate.name, caseDataTemplate.name, flowEventType.name, taskTemplateSet.name, savedView.name, customFieldDefinition.name]
krever: [07-flyt.md#flyt-identitet-er-id]
opphav: skrevet
sjekkes: maskinelt
```

- **Gjør:** Bestem navnet på hvert objekt før det rulles ut eller promoteres fra sandboxen. Velg navn som ikke kolliderer
  med det kunden har fra før, med prefikset og sakstypen i navnet. Endre det som vises (etiketten, beskrivelsen) når
  kunden vil ha et annet ord.
- **Ikke gjør:** Ikke gi nytt navn til en status, et felt eller en hendelsestype som er i bruk. Ikke bruk samme navn på
  to objekter av samme type hos samme eier.
- **Hvorfor:** Utrullingen finner kundens kopi på malen den kom fra, ikke på navnet. Navnet er likevel unikt per eier:
  kolliderer det med et objekt kunden har fra en annen mal, får kopien et navn med et tillegg («(2)»). Flytene peker på
  id og tåler det, men det som finner objektet på navnet, gjør ikke det: statusen i «Finn steg» og betingelsene i
  veiviseren, feltet i en flettekode, og feltene i en hendelse. For en status og en hendelsestype er navnet selve
  nøkkelen.

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

## Pakking

## losning-per-bruksomrade Lag én Løsning per bruksområde eller integrasjon

```yaml
id: losning-per-bruksomrade
klasse: valg
gjelder: [solution]
krever: [11-integrasjoner.md#arkiv-fra-katalogen, 11-integrasjoner.md#registre-fra-katalogen]
opphav: praksis
```

- **Gjør:** Pakk en sakstype med det den trenger for å virke (strøm, skjema, flyter, saksdatamaler, visninger) i én
  Løsning. Pakk en integrasjon eller et register som sin egen Løsning, så flere bruksområder kan ta den i bruk.
- **Ikke gjør:** Ikke lag én stor Løsning med alt kunden skal ha. Ikke legg et register inn i grunnoppsettet.
- **Hvorfor:** En Løsning tas i bruk, oppgraderes og aktiveres som en helhet. Er den for stor, kan kunden ikke ta i bruk
  en del uten resten.

```yaml
solution:
  name: "Tilskudd"
  components:
    - { rootType: caseType, templateId: <Tilskudd> }
    - { rootType: stream,   templateId: <Tilskudd — innsendinger fra Altinn> }
    - { rootType: form,     templateId: <Tilskudd — registrer vedtak> }
    - { rootType: workflow, templateId: <Tilskudd — søknad mottatt fra Altinn> }
# Arkivet og registrene er egne Løsninger kunden tar i bruk ved siden av.
```

## losning-har-det-den-peker-pa Alt i Løsningen har en jobb, og alt en flyt peker på, er med

```yaml
id: losning-har-det-den-peker-pa
klasse: felle
gjelder: [solution, workflow]
krever: [07-flyt.md#flyt-identitet-er-id, 07-flyt.md#flyt-aktivering]
opphav: skrevet
```

- **Gjør:** Legg feltene, statusene, malene, skjemaene og hendelsestypene flytene peker på, inn i samme Løsning. Peker en
  flyt på noe fra en annen Løsning, skriv i beskrivelsen at den Løsningen må tas i bruk først. Ta bare med objekter et
  krav trenger.
- **Ikke gjør:** Ikke gå ut fra at kunden har et felt eller en status med samme navn. Ikke legg med objekter «i tilfelle».
- **Hvorfor:** Ved utrulling skrives pekerne om til kundens kopier. En peker uten kopi blir et gap, og flyten kan ikke
  aktiveres før gapet er løst. Et objekt ingen leser, har ingen jobb hos kunden heller.

## losning-er-en-mal Lag Løsningen som en mal hos partneren, ikke i kundens organisasjon

```yaml
id: losning-er-en-mal
klasse: felle
gjelder: [solution]
opphav: skrevet
```

- **Gjør:** Lag og endre Løsningen der partneren (eller Neo) eier den, og rull den ut til kundene.
- **Ikke gjør:** Ikke bygg i én kundes organisasjon og forsøk å kopiere derfra til en annen.
- **Hvorfor:** Oppsettet går fra mal til organisasjon, aldri fra organisasjon til organisasjon; en rad en organisasjon
  eier, avvises som kilde. En partners mal kan bare rulles ut til kunder partneren har en aktiv forvaltningsavtale med.

## implementasjon-er-kundens-helhet En implementasjonsprofil er Løsningene og den løse konfigen én slags kunde skal ha

```yaml
id: implementasjon-er-kundens-helhet
klasse: valg
gjelder: [implementationProfile, solution]
krever: [00-navn-pakking-og-versjoner.md#losning-per-bruksomrade]
opphav: forslag
```

- **Gjør:** Lag en implementasjonsprofil når flere organisasjoner skal få samme helhet, for eksempel alle kommunene i et
  samarbeid. Legg inn Løsningene, og som løs konfig bare det som er særegent for helheten.
- **Ikke gjør:** Ikke legg det som hører til et bruksområde, inn som løs konfig i profilen. Ikke lag en profil for én
  Løsning.
- **Hvorfor:** Profilen ruller ut Løsningene først og den løse konfigen etterpå, og samler gapene i én liste. Det som
  ligger løst, kan ikke tas i bruk alene og får ikke Løsningens oppgradering.

## Versjoner og publisering

## publiser-malen-med-versjon En mal publiseres med en versjon; kundens kopi oppgraderes med «Adopter endringer»

```yaml
id: publiser-malen-med-versjon
klasse: felle
gjelder: [solution]
opphav: skrevet
```

- **Gjør:** Publiser malen når en endring er klar. Si til kundene hva som er endret, og la dem ta det inn med «Adopter
  endringer».
- **Ikke gjør:** Ikke forvent at en publisering endrer kopien hos kunden av seg selv.
- **Hvorfor:** Kopien husker versjonen den kom fra. Er malens versjon nyere, får kunden tilbud om å oppgradere. En rad
  organisasjonen eier selv, får ingen versjon.

## endre-i-sandboxen Endringer i en organisasjon som er i bruk, lages i sandboxen og promoteres objekt for objekt

```yaml
id: endre-i-sandboxen
klasse: felle
gjelder: [workflow, caseType]
krever: [14-tilgang.md#jobbroller-etter-jobben]
opphav: skrevet
```

- **Gjør:** Lag en sandbox for organisasjonen, gjør endringen der, prøv den, og promoter de objektene som er klare.
- **Ikke gjør:** Ikke endre en aktiv flyt eller en sakstype med saker direkte i produksjon for å se hva som skjer.
- **Hvorfor:** Promoteringen lagrer versjonen før og etter, og en endring som bryter en aktiv flyt eller fjerner en
  status som er i bruk, avvises uten at noe endres. Sandboxen krever at organisasjonen har den låst opp.

## flyter-lander-som-utkast Etter utrulling og promotering er nye flyter utkast til noen aktiverer dem

```yaml
id: flyter-lander-som-utkast
klasse: felle
gjelder: [workflow, solution]
krever: [07-flyt.md#flyt-aktivering]
opphav: skrevet
```

- **Gjør:** Etter «Ta i bruk», utrulling eller promotering av noe nytt: les gapene og aktiver Løsningen.
- **Ikke gjør:** Ikke meld at oppsettet er på plass før flytene er aktive.
- **Hvorfor:** Nye flyter lander som utkast, og hjemmelen til å skrive i sakene følger ikke med. En oppdatert flyt
  beholder statusen sin.

Eksempel: slik kommer et oppsett i drift hos en kunde.

1. Bestem navnene (`navn-er-nokkelen`).
2. Pakk én Løsning per bruksområde, med arkivet og registrene som egne Løsninger (`losning-per-bruksomrade`).
3. Prøv i sandboxen med testsaker for hver gren (`test-i-sandboxen`, `en-testsak-per-gren`).
4. Rull ut, les gapene og aktiver flytene. Publiser skjemaene og saksdatainstruksene.
5. Sett opp det som ikke følger med Løsningen, i hver organisasjon: veiviseren, relasjonsvisningene, rapportene og
   dashbordene, KI-reglene for organisasjonen og plassen til søkene.
6. Endre senere med versjon: publiser malen og la kunden adoptere (`publiser-malen-med-versjon`).

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

## test-i-sandboxen Prøv oppsettet i sandboxen, der ingenting sendes ut, med testsaker laget der

```yaml
id: test-i-sandboxen
klasse: felle
gjelder: [workflow, solution]
krever: [00-navn-pakking-og-versjoner.md#endre-i-sandboxen]
opphav: skrevet
```

- **Gjør:** Kjør flytene i sandboxen, og les «Sperret utgående» for å se hva som ville blitt sendt, og til hvem. Lag
  testsakene der, etter at konfigen er klonet. La sending stå sperret; slå den på bare for en avtalt demo mot mottakere
  dere selv eier, og av igjen etterpå.
- **Ikke gjør:** Ikke prøv en flyt som sender brev, arkiverer eller skriver til Altinn i produksjon. Ikke lag testsaker i
  kundens produksjon, og ikke bruk kundens ekte saker. Ikke legg testsaker i en Løsning.
- **Hvorfor:** Sandboxen sender ingen e-post, webhook, HTTP-kall eller skriving til arkiv, Altinn eller SvarUt, og
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
