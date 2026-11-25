# Instrukser, saksdatainstrukser og KI-regler

Instruksene sier hva agenten skal gjøre i en sak, og hva den ikke skal gjøre. Behandlingsregelen (`instruction`) er
prosessen og vurderingene for sakstypen, og den legges i hver sak. Saksdatainstruksen og relasjonsinstruksen
(`caseRunInstruction`) er oppskriften for én kjøring som saksbehandleren starter. KI-reglene på sakstypen
(`caseType.aiCapabilityRules`) slår av KI-funksjoner og verktøy for saker som treffer en betingelse.

## Kortversjonen

Still spørsmålene i rekkefølge. Det første som svarer ja, avgjør.

| # | Spørsmålet | Ja betyr |
|---|---|---|
| 1 | Kan det gjøres likt hver gang: et oppslag, en beregning, et statusbytte, oppgaver, utsending, arkivering? | En **flyt**, ikke en instruks (`instruks-bare-skjonn`) |
| 2 | Er det selve avgjørelsen i saken? | **Saksbehandleren.** Agenten skriver utkast (`instruks-arbeidsdeling`) |
| 3 | Skal agenten alltid vite det i saken: prosessen, vilkårene, beslutningslogikken? | **Behandlingsregelen**, lagt i saken fra start (`instruks-en-behandlingsregel`, `instruks-folger-med-saken`) |
| 4 | Er det en analyse saksbehandleren ber om i én sak? | En **saksdatainstruks** som fyller en saksdatamal (`instruks-saksdata-form`, `instruks-fyller-malen`) |
| 5 | Er det forslag om hvilke saker som hører sammen? | En **relasjonsinstruks** (`instruks-velg-slaget`) |
| 6 | Skal en KI-funksjon eller et verktøy være av for en gruppe saker? | En **KI-regel** på sakstypen (`instruks-ki-regel`) |

To valg til gjelder for alle instruksene:

| Spørsmålet | Ja betyr |
|---|---|
| Er innholdet likt for flere sakstyper, som en forvaltningsplikt eller et arkivnotat? | **Én delt instruks.** Vilkår, terskler og satser får hver sakstype sin egen (`instruks-delt-eller-egen`) |
| Varierer en verdi mellom kundene som bruker regelen (en sats, en terskel)? | En **tom celle** kunden fyller, ikke et lånt tall (`instruks-variasjon-synlig`) |

---

## instruks-bare-skjonn En instruks brukes bare der vi ikke kan gjøre det deterministisk

```yaml
id: instruks-bare-skjonn
klasse: valg
gjelder: [instruction, caseRunInstruction, workflow]
opphav: skrevet
```

- **Gjør:** Spør først om en flyt kan gjøre det: oppslag, beregning, statusbytte, opprettelse av oppgaver og saksdata,
  utsending og arkivering. Det som er igjen, er vurderinger agenten gjør og saksbehandleren verifiserer.
- **Ikke gjør:** Ikke skriv i instruksen at agenten skal sette status, opprette oppgaver eller sende noe. Ikke la en flyt
  avgjøre noe som krever skjønn.
- **Hvorfor:** En flyt gjør det samme hver gang og kan etterprøves i kjøringsloggen. Det agenten gjør, må kontrolleres av
  et menneske.

| Hva | Hvor |
|---|---|
| Hente data fra et register eller kart, regne avstand, telle | Flyt |
| Sette status, opprette oppgaver og saksdata, sende, arkivere | Flyt |
| Slå opp arkivverdier per sakstype | Flyt, i en tabell (`07-flyt.md#flyt-tabell-for-oppslag`) |
| Lese et dokument og fylle ut en vurdering med sitat | Saksdatainstruks |
| Skrive utkast til begrunnelse og vedtak | Behandlingsregelen og dokumentmalen |
| Fatte vedtaket | Saksbehandleren |

## instruks-velg-slaget Velg slaget etter når agenten skal lese instruksen

```yaml
id: instruks-velg-slaget
klasse: valg
gjelder: [instruction, caseRunInstruction, caseRunInstruction.kind]
opphav: skrevet
```

- **Gjør:** Det agenten alltid skal vite i saken (prosessen, vilkårene, beslutningslogikken), legges i behandlingsregelen.
  En analyse saksbehandleren ber om, legges i en saksdatainstruks (`kind: CASE_DATA`). Forslag om hvilke saker som hører
  sammen, legges i en relasjonsinstruks (`kind: CASE_RELATION`).
- **Ikke gjør:** Ikke legg en analyse som koster en kjøring, i behandlingsregelen. Ikke bruk andre verdier i `kind`.
- **Hvorfor:** Behandlingsregelen ligger på saken fra start. Saksdatainstruksen leses bare i kjøringen noen starter, og en
  kjøring ingen har bedt om, er en kostnad. Slaget settes når instruksen lages, og kan ikke endres etterpå. Bare de to
  verdiene er lov.

## instruks-folger-med-saken Sett behandlingsregelen til å følge med hver ny sak

```yaml
id: instruks-folger-med-saken
klasse: felle
gjelder: [caseType.caseTypeInstructions, caseType.caseTypeInstructions.mode]
krever: [instruks-en-behandlingsregel]
opphav: skrevet
```

- **Gjør:** Sett `mode: INSTANTIATE_ON_CREATE` på koblingen mellom sakstypen og behandlingsregelen.
- **Ikke gjør:** Ikke la standarden `AVAILABLE` stå for behandlingsregelen.
- **Hvorfor:** Bare en instruks med `INSTANTIATE_ON_CREATE` legges i saken når den opprettes. Med standarden ligger den i
  biblioteket, og agenten arbeider uten regelen.

## instruks-en-behandlingsregel Hver sakstype har én behandlingsregel med faste seksjoner

```yaml
id: instruks-en-behandlingsregel
klasse: valg
gjelder: [instruction, instruction.content, instruction.name]
opphav: praksis
```

- **Gjør:** Skriv én behandlingsregel per sakstype med seksjonene: formål og hjemmel, arbeidsdeling, prosess-steg med
  ansvarlig, vilkårene og beslutningslogikken, frister, vilkår ved innvilgelse, begrunnelse ved avslag, klage. Skriv den i
  markdown med overskrifter, nummererte steg og tabeller.
- **Ikke gjør:** Ikke del regelen opp i én instruks per variant. Ikke lag en avledet «nivå»-verdi når hjemmelen alt sier
  det.
- **Hvorfor:** Saksbehandleren og agenten leser det samme dokumentet. Faste seksjoner gjør det lett å finne fram og lett å
  sammenligne sakstyper.

```yaml
instruction:
  name: "Behandlingsregel: tilskudd til <ordningen>"
  content: |
    # Behandlingsregel: tilskudd til <ordningen>
    ## 1. Formål og hjemmel
    ## 2. Arbeidsdeling: hva flyten gjør, hva agenten gjør, hva saksbehandleren kontrollerer
    ## 3. Prosess-steg
    ## 4. Vilkårene og tildelingskriteriene
    ## 5. Frister
    ## 6. Ved innvilgelse: vilkår i tilskuddsbrevet
    ## 7. Ved avslag: begrunnelse
    ## 8. Klage
caseTypeInstructions:
  - { instruction: "Behandlingsregel: tilskudd til <ordningen>", mode: INSTANTIATE_ON_CREATE }
```

## instruks-arbeidsdeling Behandlingsregelen sier hva flyten gjør, hva agenten gjør og hva saksbehandleren kontrollerer

```yaml
id: instruks-arbeidsdeling
klasse: valg
gjelder: [instruction.content]
krever: [instruks-bare-skjonn]
opphav: praksis
```

- **Gjør:** Skriv en egen seksjon om arbeidsdelingen. Si hvilke steg som er regelstyrt, hva agenten skriver utkast til, og
  hva saksbehandleren må prøve før noe brukes. Si hvilke handlinger et menneske alltid utløser.
- **Ikke gjør:** Ikke la det være uklart om agenten avgjør noe.
- **Hvorfor:** Agenten må vite hva den ikke skal gjøre. Saksbehandleren må vite hva som er kontrollert av en regel, og hva
  som bare er et utkast.

Eksempel, for et vedtak om tilskudd:

- **Flyten:** status og utfall fra samme valg, sjekken av flettefeltene, PDF-en, journalføringen, utsendingen og
  oppgavene etter vedtaket.
- **Agenten:** utkastet til vedtaket fra saken, behandlingsregelen og malen, merket som KI.
- **Saksbehandleren:** fatter vedtaket, går gjennom teksten og trykker på handlingen som sender.

## instruks-varianter-som-seksjoner Varianter er seksjoner i én regel, og agenten leser variantfeltet

```yaml
id: instruks-varianter-som-seksjoner
klasse: valg
gjelder: [instruction.content]
krever: [01-sakstype.md#variant-som-felt]
opphav: praksis
```

- **Gjør:** Gi hver variant eller hjemmelsgruppe sin seksjon. Si i regelen hvilket felt som avgjør hvilken seksjon som
  gjelder.
- **Ikke gjør:** Ikke lag én behandlingsregel per variant.
- **Hvorfor:** Varianten er et felt på saken, ikke en egen sakstype. Én regel holder det felles på ett sted.

## instruks-ingen-app-mekanikk Instruksen beskriver leveransen, ikke verktøyene

```yaml
id: instruks-ingen-app-mekanikk
klasse: valg
gjelder: [instruction.content, caseRunInstruction.content]
opphav: praksis
```

- **Gjør:** Skriv hva resultatet skal inneholde, og hvilke regler vurderingen følger.
- **Ikke gjør:** Ikke nevn verktøynavn, blokktyper, statusene som skal settes eller hvordan kjøringen virker.
- **Hvorfor:** Verktøyene beskriver seg selv for agenten. To dokumenter på samme sak skal ikke kunne motsi hverandre om et
  verktøy, og app-mekanikk i hver regel må gjentas i hver sakstype i hver organisasjon.

## instruks-saksdata-form En saksdatainstruks har tre deler: hva analysen svarer på, hvordan, og hva agenten ikke skal gjøre

```yaml
id: instruks-saksdata-form
klasse: valg
gjelder: [caseRunInstruction, caseRunInstruction.content, caseRunInstruction.description, caseRunInstruction.name]
opphav: praksis
```

- **Gjør:** Skriv «Hva analysen skal svare på», «Hvordan du skal gå fram» og «Hva du ikke skal gjøre». Krev et ordrett
  sitat fra kilden for hvert utfylte felt. Si hvilken kilde som gjelder når det er flere. Skriv i beskrivelsen hva
  kjøringen gir, slik saksbehandleren ser det i velgeren.
- **Ikke gjør:** Ikke la agenten konkludere på vilkåret eller fatte vedtaket. Ikke la den fylle inn «oppfylt» når
  grunnlaget er uklart.
- **Hvorfor:** Analysen er et grunnlag saksbehandleren kontrollerer. Sitatet gjør kontrollen mulig.

```yaml
caseRunInstruction:
  name: "Vurdering av budsjettet"
  kind: CASE_DATA
  description: "Leser budsjettet og fyller ut kostnadene, egenfinansieringen og avvik, med sitat. Konkluderer ikke."
  content: |
    # Vurdering av budsjettet
    ## Hva analysen skal svare på
    ## Hvordan du skal gå fram
    ## Feltene
    ## Hva du ikke skal gjøre
    Ikke konkluder på om søknaden skal innvilges. Ikke regn ut et tilskuddsbeløp.
```

## instruks-uavklart-er-svar «Uavklart» og «fant ingen» er gyldige svar

```yaml
id: instruks-uavklart-er-svar
klasse: valg
gjelder: [caseRunInstruction.content, caseDataTemplate]
krever: [05-felt-og-saksdata.md#vurdering-i-saksdata]
opphav: skrevet
```

- **Gjør:** Gi agenten et svar for tvil: «uavklart», med hva som mangler. Ha valget med i saksdatamalen. Si i instruksen
  hva agenten gjør ved tvil.
- **Ikke gjør:** Ikke tving fram et ja eller nei.
- **Hvorfor:** Et gjettet svar ser ut som et funn. Et ærlig «uavklart» viser saksbehandleren hva som må undersøkes.

## instruks-fyller-malen En saksdatainstruks fyller en saksdatamal den nevner ved navn

```yaml
id: instruks-fyller-malen
klasse: valg
gjelder: [caseRunInstruction, caseRunInstruction.content, caseDataTemplate, caseType.caseDataTemplates]
krever: [05-felt-og-saksdata.md#modus-etter-hvem-som-fyller]
opphav: forslag
```

- **Gjør:** Lag saksdatamalen med feltene først, og bind den til sakstypen. Gi instruksen og malen samme navn, og skriv
  feltene instruksen skal fylle, med navnene i malen.
- **Ikke gjør:** Ikke la instruksen bestemme formen selv.
- **Hvorfor:** Med malen blir to kjøringer sammenlignbare, og saksbehandleren ser feltene før kjøringen. Neo kan koble
  instruksen til malen, men oppsettet bærer ikke koblingen, så den følger ikke med ved utrulling. Navnet og feltene i
  instruksen er det som binder dem.

## instruks-staa-alene En saksdatainstruks har med seg kriteriene den trenger

```yaml
id: instruks-staa-alene
klasse: valg
gjelder: [caseRunInstruction.content, instruction.content]
opphav: praksis
```

- **Gjør:** Skriv kriteriene, nivåene og tabellene kjøringen skal vurdere etter, inn i saksdatainstruksen, selv om de også
  står i behandlingsregelen.
- **Ikke gjør:** Ikke skriv «se behandlingsregelen» for det kjøringen skal bruke.
- **Hvorfor:** Behandlingsregelen når kjøringen bare som en henvisning med navn og id. Henter ikke agenten den, vurderer den
  mot kriterier den ikke har sett. Kopien er en kjent kostnad: de to kan drive fra hverandre.

## instruks-kilde-per-punkt Hvert punkt viser til hjemmelen eller retningslinjen det bygger på

```yaml
id: instruks-kilde-per-punkt
klasse: valg
gjelder: [instruction.content]
opphav: praksis
```

- **Gjør:** Skriv paragrafen eller punktnummeret i retningslinjen etter hver regel, slik saksbehandleren kan slå det opp. Be
  agenten vise til kilden for hvert punkt i utkastet.
- **Ikke gjør:** Ikke skriv regler uten kilde.
- **Hvorfor:** Saksbehandleren skal kunne kontrollere utkastet. Uten kilde er det ingenting å kontrollere mot.

## instruks-ingen-oppdiktede-fakta Instruksen inneholder bare det kilden sier; resten står som åpne spørsmål

```yaml
id: instruks-ingen-oppdiktede-fakta
klasse: felle
gjelder: [instruction.content, caseRunInstruction.content]
opphav: praksis
```

- **Gjør:** Hent hjemler, frister, klasser og tall fra kundens dokumenter og regelverket. Står noe ikke der, skriv at det er
  uavklart, og si hva agenten da ikke skal gjøre.
- **Ikke gjør:** Ikke fyll hull med noe som høres riktig ut. Ikke bruk eksempeltekst i en regel som skal i drift.
- **Hvorfor:** Agenten bruker det som står, som fakta. Et oppdiktet arkivnummer eller en oppdiktet frist havner i vedtaket.

## instruks-variasjon-synlig I en felles regel står det som varierer, som tomme felt kunden fyller

```yaml
id: instruks-variasjon-synlig
klasse: valg
gjelder: [instruction.content]
krever: [instruks-ingen-oppdiktede-fakta]
opphav: praksis
```

- **Gjør:** Skriv det nasjonale og det som er likt for alle, som tekst. Skriv det som varierer mellom kunder (satser,
  terskler, utvalg, presedens), som en tabell der kundens kolonne er tom til den er fylt.
- **Ikke gjør:** Ikke løft én kundes tall eller presedens inn i en regel som skal brukes av andre.
- **Hvorfor:** En tom celle er synlig for både agenten og mennesket. Et lånt tall ser ut som en regel.

```markdown
| Parameter | Hva den styrer | Verdien hos dere |
|---|---|---|
| Maksimalt tilskudd | Øvre grense per søknad | |
| Egenandel | Minste andel søkeren dekker selv | |
```

## instruks-delt-eller-egen Del en instruks mellom sakstyper når den bærer en plikt; gi hver sakstype sin når den bærer vilkår

```yaml
id: instruks-delt-eller-egen
klasse: valg
gjelder: [caseType.caseTypeInstructions, caseType.caseTypeInstructions.instruction, instruction]
opphav: praksis
```

- **Gjør:** La flere sakstyper peke på samme instruks for det som er likt i hele prosessen (en forvaltningsplikt, et
  arkivnotat). Gi hver sakstype sin egen instruks for vilkårene.
- **Ikke gjør:** Ikke del en instruks som bærer vilkår, terskler eller satser.
- **Hvorfor:** En delt instruks er én instruks: endres den for én sakstype, endres den for alle. Vilkårene skal kunne
  endres for én sakstype uten å endre de andre.

## instruks-kjoring-for-sakstypen Bind saksdatainstruksen til sakstypene den gjelder

```yaml
id: instruks-kjoring-for-sakstypen
klasse: felle
gjelder: [caseType.caseRunInstructions, caseType.caseRunInstructions.caseRunInstruction, caseRunInstruction]
opphav: skrevet
```

- **Gjør:** Knytt hver saksdata- og relasjonsinstruks til sakstypene den er skrevet for.
- **Ikke gjør:** Ikke la en instruks for én sakstype stå uten kobling.
- **Hvorfor:** En saksdatainstruks uten kobling er delt i hele organisasjonen og står i velgeren på alle saker, også saker
  den ikke er skrevet for.

## instruks-publiser-saksdatainstruksen En saksdatainstruks syns først når den er publisert

```yaml
id: instruks-publiser-saksdatainstruksen
klasse: felle
gjelder: [caseRunInstruction, caseRunInstruction.isPublished]
krever: [instruks-kjoring-for-sakstypen]
opphav: skrevet
```

- **Gjør:** Hold saksdatainstruksen upublisert mens den skrives og prøves. Publiser den når den er klar, og sjekk etter
  utrullingen at den står som publisert hos kunden.
- **Ikke gjør:** Ikke regn med at en saksdatainstruks syns fordi den er koblet til sakstypen.
- **Hvorfor:** Velgeren på saken viser bare publiserte, og den leser den publiserte utgaven. En upublisert instruks er
  usynlig, uten feilmelding. Behandlingsregelen virker uansett, fordi den ikke filtreres på publisering.

## instruks-ki-tre-former Hver KI-funksjon har en av tre former for menneskelig kontroll

```yaml
id: instruks-ki-tre-former
klasse: standard
gjelder: [caseRunInstruction]
opphav: skrevet
```

- **Gjør:** Plasser funksjonen i én av formene: en knapp der klikket er intensjonen; noe nytt KI lager, merket med
  grunnlaget, som brukeren kvitterer ut; en endring av noe som finnes, som et forslag brukeren godtar eller avviser. Skriv
  i oppgaven hvor knappen er.
- **Ikke gjør:** Ikke bygg et oppsett der KI endrer noe som finnes uten et forslag.
- **Hvorfor:** Brukeren skal alltid vite hva KI har laget, og hva hen har tatt over. Et forslag uten et sitat som finnes
  igjen i saken, forkastes.

## instruks-ki-regel KI-regler på sakstypen slår av funksjoner og verktøy for sakene som trenger det

```yaml
id: instruks-ki-regel
klasse: felle
gjelder: [caseType.aiCapabilityRules, caseType.aiCapabilityRules.conditions, caseType.aiCapabilityRules.disabledCapabilities, caseType.aiCapabilityRules.disabledToolIds, caseType.aiCapabilityRules.name]
krever: [18-org-niva.md#ki-regel-pa-sakstypen-nar-den-folger-sakstypen]
opphav: skrevet
```

- **Gjør:** Lag en regel når en gruppe saker av sakstypen ikke skal behandles med en KI-funksjon eller et verktøy, for
  eksempel skjermede saker uten nettsøk. Bruk betingelser fra sakslistas filtre. Gi regelen et navn som sier hva den gjør.
- **Ikke gjør:** Ikke lag en regel uten betingelser på sakstypen med mindre funksjonen skal være av for alle sakene av
  typen. Ikke bruk sakstype eller ansvarlig i en regel på sakstypen; det hører til organisasjonens regler.
- **Hvorfor:** En regel uten betingelser treffer alltid. Betingelsene i én regel må alle treffe; flere regler gjelder hver
  for seg. En betingelse som ikke kan leses (et slettet felt), regnes som truffet, så funksjonen er av.

```yaml
aiCapabilityRules:
  - name: "Skjermede søknader uten nettsøk"
    disabledCapabilities: []
    disabledToolIds: [web_subagent]
    conditions:
      - { id: <feltet «Skjerming»>, variant: select, operator: eq, value: "<nøkkelen for «Unntatt offentlighet»>" }
```

## instruks-kriterier-per-sak Vurdering etter kriterier skrives per sak; sammenligningen på tvers gjør et menneske

```yaml
id: instruks-kriterier-per-sak
klasse: valg
gjelder: [caseRunInstruction, caseDataTemplate, instruction.content]
krever: [instruks-fyller-malen, 05-felt-og-saksdata.md#poeng-som-felt-begrunnelse-som-saksdata]
opphav: forslag
```

- **Gjør:** Skriv kriteriene (tildelingskriterier, risikokriterier, prioriteringskriterier) med vekt og en beskrivelse av
  hva som gir høy og lav score, i behandlingsregelen. La en saksdatainstruks fylle en vurderingsmal med én rad per
  kriterium, med poeng, begrunnelse og sitat. La rangeringen og likebehandlingen på tvers skje hos mennesker.
- **Ikke gjør:** Ikke be agenten rangere sakene mot hverandre.
- **Hvorfor:** En sakskjøring skriver ett resultat i én sak. Vi kjenner ingen måte en instruks kan lese og sammenligne
  mange saker på i Neo. Mønsteret er ikke prøvd i drift.
