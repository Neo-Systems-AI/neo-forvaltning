# Dokumentmaler

Dokumentmalen (`documentTemplate`) er vedtaket og de andre brevene: foreløpig svar, mangelbrev, forhåndsvarsel,
tilsagnsbrev, oversendelse av klage. Malen henter fakta fra saken med flettefelt og viser med veiledning hvor
saksbehandleren (eller agenten) skal skrive vurderingen. Dokumentet lages i saken, kontrolleres, fryses til PDF og sendes
av en flyt. Det sendte brevet er beviset for at plikten er oppfylt (`brevet-er-beviset`).

Flettingen leser saksfeltene, partene og kontaktene, statusen, den ansvarlige, organisasjonen og dokumentets egne felt.
Den leser ikke saksdata, relasjoner eller oppgaver.

## Kortversjonen

**Hvor mange maler.** Det første som svarer ja, avgjør.

| # | Spørsmålet | Ja betyr |
|---|---|---|
| 1 | Følger brevet av en plikt i forvaltningsloven og er likt i alle sakstyper (foreløpig svar, forhåndsvarsel, mangelbrev)? | **Én delt mal**, koblet til sakstypene som bruker den (`mal-delte-brev`) |
| 2 | Er det et vedtak med flere mulige utfall? | **Én vedtaksmal** for alle utfall (`mal-utfallsnoytral`) |
| 3 | Følger et eget steg vedtaket, med egne vilkår og frister (tilsagn, avtale, pålegg)? | **Et eget brev** (`mal-brev-etter-vedtaket`) |

**Hvor hvert stykke i brevet kommer fra.**

| Spørsmålet | Ja betyr |
|---|---|
| Står det i saken som felt, part, status, ansvarlig eller organisasjon? | **Flett det** (`mal-navnerommet`, `mal-mottaker-er-part`, `mal-organisasjonen-flettes`) |
| Gjelder verdien bare dette brevet (en svarfrist, beløpet i ett av flere brev)? | **Et dokumentfelt**, satt av flyten som sender (`mal-dokumentfelt`, `mal-ingen-fast-frist`) |
| Er det en vurdering eller en begrunnelse? | **En veiledning** saksbehandleren eller agenten skriver ut (`mal-fakta-og-skjonn`) |
| Er det en liste med en rad per element? | **En veiledning**; lista skrives fra saksdata (`mal-ingen-lister`) |
| Er det likt i hvert vedtak og påkrevd av loven? | **Fast tekst** i malen (`mal-klageadgang`) |

---

## brevet-er-beviset Brevet som ble sendt, er beviset for plikten; den føres ikke i tillegg i saken

```yaml
id: brevet-er-beviset
klasse: valg
gjelder: [documentTemplate, LagPdfFraSaksdokument, LagSaksdokumentFraBytes, SetDocumentFieldValue]
krever: [mal-fryses-ved-utsending, 05-felt-og-saksdata.md#plikten-er-ikke-saksdata, 03-veiviser.md#plikten-bekreftes-med-dokumentet, 11-integrasjoner.md#utgaende-journalfores-for-sending]
opphav: forslag
```

- **Gjør:** La flyten som sender et brev som oppfyller en plikt (foreløpig svar, mangelbrev, forhåndsvarsel, vedtak),
  legge PDF-en som gikk ut, i saken («Lagre fil i saken»), og sette dokumentfeltet «Dokumenttype» på fila
  («Sett dokumentfelt»). Bruk det samme feltet i betingelsen i veiviseren (`03-veiviser.md#plikten-bekreftes-med-dokumentet`)
  og i arkivet; lag ikke et eget «Brevtype».
- **Ikke gjør:** Ikke lag et saksfelt eller en saksdatamal for «foreløpig svar sendt», «dato for forhåndsvarsel» eller
  «vedtak sendt». Ikke la saksbehandleren krysse av for at brevet er sendt.
- **Hvorfor:** Plikten bevises der den skjer: i dokumentet som sendes. Neo registrerer selv når fila ble lagt i saken, og
  arkivet har journalposten. En betingelse i veiviseren kan telle filene på et dokumentfelt, men ikke på malen eller
  dokumentstatusen, så dokumenttypen er det som gjør brevet lesbart for veiviseren. «Dokumenttype» finnes i
  grunnoppsettet og i Documaster-løsningen, så det er samme felt som avgjør hva som arkiveres.

```yaml
# Flyten «Send foreløpig svar», etter at PDF-en er sendt
LagSaksdokumentFraBytes: { filKilde: referanse, referanse: "{{pdf:referanse}}", filnavn: "Foreløpig svar.pdf" }
SetDocumentFieldValue:   { documentKind: item, documentId: "{{lagre:id}}", customFields: { dokumenttype: forelopig_svar } }
# Veiviseren: steget «Foreløpig svar» er ferdig når
condition:
  type: items
  quantifier: { kind: some }
  where: { type: field, fieldId: <id-en til «Dokumenttype»>, operator: eq, value: forelopig_svar }
```

## mal-utfallsnoytral Vedtaket har én mal for alle utfall

```yaml
id: mal-utfallsnoytral
klasse: valg
gjelder: [documentTemplate, documentTemplate.content]
krever: [05-felt-og-saksdata.md#utfall-som-felt]
opphav: praksis
```

- **Gjør:** Lag én vedtaksmal. Merk seksjonene som bare gjelder ett utfall («Ved innvilgelse: …», «Ved avslag: …»), og
  skriv i en kursiv linje under overskriften at seksjonen slettes ved det andre utfallet. Hold begrunnelsen og
  klageadgangen felles. Flett utfallet fra utfallsfeltet.
- **Ikke gjør:** Ikke lag én mal for innvilgelse og én for avslag.
- **Hvorfor:** En mal med konklusjonen ferdigskrevet krever at utfallet er bestemt før dokumentet finnes, og to maler må
  holdes i takt for alt de har felles. Utfallet er et valgfelt, og det flettes som etiketten.

```markdown
## Vedtak

Utfall: **{{case:utfall}}**

## Ved innvilgelse: beløp og vilkår

_Slett denne seksjonen ved avslag._
```

Eksempel: utfallet kommer fra skjemaet i handlingen «Send vedtaket», og flyten setter både status og utfallsfeltet fra
samme svar (`10-skjema-og-innboks.md#skjemasvar-er-inndata`). Saksbehandleren velger utfallet én gang.

## mal-fakta-og-skjonn Fakta flettes fra saken; vurderingen er en veiledning saksbehandleren skriver ut

```yaml
id: mal-fakta-og-skjonn
klasse: felle
gjelder: [documentTemplate.content, documentTemplate.mergeFields]
krever: [05-felt-og-saksdata.md#vurdering-i-saksdata]
opphav: praksis
```

- **Gjør:** Flett det som står i saken som felt, part, saksbehandler eller organisasjon. Skriv en kursiv veiledning der
  vurderingen skal stå: hva som skal skrives, og hvilken saksdata eller regel det bygger på.
- **Ikke gjør:** Ikke lag flettefelt for begrunnelser og vurderinger. Ikke lag et saksfelt for en vurdering bare for å
  kunne flette den. Ikke skriv eksempeltekst som kan bli stående.
- **Hvorfor:** Vurderingen står i saksdata, og flettingen leser ikke saksdata. Et flettefelt uten verdi står igjen som
  `{{…}}` og meldes som manglende; en veiledning er synlig og må erstattes.

## mal-navnerommet Bruk bare flettefeltene Neo kjenner

```yaml
id: mal-navnerommet
klasse: felle
gjelder: [documentTemplate.mergeFields]
krever: [05-felt-og-saksdata.md#et-felt-har-en-leser, 05-felt-og-saksdata.md#parten-er-sakspart]
opphav: praksis
```

- **Gjør:** Bruk nøklene flettingen kjenner:
  - `case:number`, `case:title`, `case:status` (etiketten), `case:type` og `case:<feltnavn>` for saksfeltene
  - `party:`, `reporter:`, `representative:` og `cc:` med `name`, `email`, `phone`, `address` eller `orgName`
  - `assignee:name`, `assignee:email` og `org:name`
  - `system:date` (eller `system:documentDate`, som gir det samme) og `system:time`
  - `document:<feltnavn>` for dokumentets egne felt
- **Ikke gjør:** Ikke finn opp nøkler som `{{vedtak:begrunnelse}}` eller `{{sak:nummer}}`. Ikke flett saksdata, oppgaver
  eller relasjoner; det har flettingen ingen nøkkel for.
- **Hvorfor:** En nøkkel flettingen ikke kjenner, blir stående som `{{…}}` og meldes som manglende. Mønsteret er
  `{{ord:ord}}`, og alt annet er vanlig tekst.

## mal-organisasjonen-flettes Navnet på organisasjonen flettes; bare det som følger av loven skrives fast

```yaml
id: mal-organisasjonen-flettes
klasse: valg
gjelder: [documentTemplate.content]
opphav: praksis
```

- **Gjør:** Skriv `{{org:name}}` for avsenderen. Skriv klageinstansen fast bare når den følger av loven og er den samme
  for alle som bruker malen.
- **Ikke gjør:** Ikke skriv kommunens eller etatens navn i malen.
- **Hvorfor:** Malen skal kunne brukes av flere organisasjoner uten å skrives om.

## mal-mottaker-er-part Mottakeren flettes fra parten i saken

```yaml
id: mal-mottaker-er-part
klasse: valg
gjelder: [documentTemplate.mergeFields]
krever: [05-felt-og-saksdata.md#parten-er-sakspart]
opphav: praksis
```

- **Gjør:** Flett mottakeren med `{{party:name}}` og `{{party:address}}`. Sørg for at søkeren er lagt til som part med
  rollen `PARTY`. Har parten ikke adresse for utsending, la adressen stå som en markør.
- **Ikke gjør:** Ikke flett mottakeren fra et tekstfelt på saken.
- **Hvorfor:** Søkeren skal stå ett sted. Har saken flere parter med rollen, flettes alle verdiene med «, » imellom; i
  PDF-en kan skillet ikke endres.

## mal-valg-gir-etikett Et valgfelt flettes som etiketten, ikke som nøkkelen

```yaml
id: mal-valg-gir-etikett
klasse: felle
gjelder: [documentTemplate.mergeFields, customFieldDefinition]
krever: [05-felt-og-saksdata.md#nokkel-og-etikett]
opphav: praksis
```

- **Gjør:** Flett valgfelt direkte (`{{case:ordning}}`). Skriv etiketten slik den skal stå i brevet.
- **Ikke gjør:** Ikke lag et ekstra tekstfelt med etiketten for at brevet skal se riktig ut.
- **Hvorfor:** Feltet lagrer nøkkelen, og flettingen viser etiketten. Et felt med flere valg flettes med «, » imellom.

## mal-flettefeltene-lost La «Krev at alle flettefelt er løst» stå på, og regn ikke med standardverdien i PDF-en

```yaml
id: mal-flettefeltene-lost
klasse: felle
gjelder: [LagPdfFraSaksdokument.krevAlleFeltLost, documentTemplate.mergeFields]
krever: [07-flyt.md#flyt-forvaltningshandling]
opphav: skrevet
```

- **Gjør:** La `krevAlleFeltLost` stå på i «Lag PDF fra saksdokument»; det er standarden. Sørg for at verdien finnes i
  saken før PDF-en lages.
- **Ikke gjør:** Ikke slå den av for å få et brev ut. Ikke regn med at `defaultValue` eller `required` på flettefeltet
  fyller eller stopper noe i PDF-en.
- **Hvorfor:** Med valget på stopper flyten og lister feltene som mangler, før noe er sendt. PDF-en flettes uten
  feltoppsettet, med vilje, så en standardverdi brukes bare i forhåndsvisningen, og `required` leses ikke av flettingen.

## mal-klageadgang Hvert vedtak har en seksjon om klageadgang

```yaml
id: mal-klageadgang
klasse: valg
gjelder: [documentTemplate.content, documentTemplate.type]
opphav: praksis
```

- **Gjør:** Skriv klagefristen, hvor klagen sendes, hvem som er klageinstans, hva klagen må inneholde, og retten til
  innsyn (forvaltningsloven §§ 18 og 27–29), som fast tekst i hver vedtaksmal.
- **Ikke gjør:** Ikke la klageadgangen være en veiledning saksbehandleren må huske å fylle.
- **Hvorfor:** Opplysningene er påkrevd i hvert enkeltvedtak og er de samme hver gang. En mal kan ikke ta inn tekst fra en
  annen mal, så seksjonen må stå i hver vedtaksmal, og den som bygger, holder dem like.

## mal-ingen-fast-frist En frist i brevet er en verdi på brevet, satt av den som sender det

```yaml
id: mal-ingen-fast-frist
klasse: felle
gjelder: [documentTemplate.content, SetDocumentFieldValue, CreateTask]
krever: [mal-dokumentfelt, 06-oppgaver.md#oppgave-frist, 06-oppgaver.md#oppgave-venter]
opphav: forslag
```

- **Gjør:** Flett fristen fra et dokumentfelt (`{{document:svarfrist}}`). La handlingen som sender brevet, spørre om
  fristen i skjemaet sitt, og la flyten skrive den både på brevet og som frist på venteoppgaven. Uten en slik flyt, skriv en
  markør («_Angi dato_»).
- **Ikke gjør:** Ikke skriv «innen fire uker» fast i malen. Ikke lag et saksfelt for svarfristen.
- **Hvorfor:** En frist i et brev binder organisasjonen, så den må komme fra en regel eller fra saksbehandleren. Fristen
  hører til brevet; oppfølgingen er venteoppgaven. Begge settes fra samme svar, så det samme tastes ikke to ganger.

## mal-delte-brev Brev som følger av en plikt i forvaltningsloven, deles mellom sakstypene

```yaml
id: mal-delte-brev
klasse: valg
gjelder: [documentTemplate, caseType.templates]
krever: [mal-kobles-til-sakstypen]
opphav: praksis
```

- **Gjør:** Lag én mal for foreløpig svar (§ 11 a), én for forhåndsvarsel (§ 16) og én for mangelbrev (§ 17), med tekst
  som ikke nevner sakstypen. Sett plikten og hjemmelen i navnet. Koble dem til sakstypene som bruker dem. En
  standardformulering som er et helt brev, står i den delte malen.
- **Ikke gjør:** Ikke lag en kopi av det samme brevet per sakstype.
- **Hvorfor:** Plikten varierer ikke med sakstypen. En organisasjon som endrer tonen i mangelbrevet, vil endre den ett
  sted. En seksjon inne i et annet brev (klageadgangen i vedtaket) kan ikke deles; se `mal-klageadgang`.

Eksempel: forhåndsvarselet har en svarfrist fra handlingens skjema (`mal-ingen-fast-frist`). Flyten som sender det,
setter saken i samme ventestatus som ved mangel, og lager en venteoppgave med fristen
(`06-oppgaver.md#oppgave-venter`). Uttalelsen som kommer inn, er grunnlag for vedtaket.

## mal-kobles-til-sakstypen Koble malen til sakstypene den brukes i

```yaml
id: mal-kobles-til-sakstypen
klasse: felle
gjelder: [caseType.templates, caseType.templates.template]
opphav: skrevet
```

- **Gjør:** Koble hver mal til sakstypene der den skal kunne velges. La bare de delte brevene være koblet til flere.
- **Ikke gjør:** Ikke la en sakstypes vedtaksmal stå ukoblet.
- **Hvorfor:** En mal uten kobling er tilgjengelig i alle saker i organisasjonen, også for en flyt som lager dokumentet.
  Da får saksbehandleren vedtaksmaler fra andre ordninger i velgeren.

## mal-typen Velg typen etter hva dokumentet er

```yaml
id: mal-typen
klasse: valg
gjelder: [documentTemplate.type]
opphav: forslag
```

- **Gjør:** Bruk `DECISION` for vedtak, `LETTER` for brev, `EMAIL` for e-post, `NOTIFICATION` for varsler og `INTERNAL`
  for interne notater.
- **Ikke gjør:** Ikke la alt stå som standardtypen `LETTER`. Ikke regn med at typen styrer noe annet enn menyen.
- **Hvorfor:** Typen ordner og grupperer menyen «Lag dokument», med vedtakene først. Agenten, flytene, PDF-en og
  veiviseren leser den ikke.

## mal-ingen-lister Malen kan ikke gjenta en rad per element; lister skrives av saksbehandleren eller agenten

```yaml
id: mal-ingen-lister
klasse: felle
gjelder: [documentTemplate.content]
krever: [05-felt-og-saksdata.md#flere-rader-er-saksdata]
opphav: forslag
```

- **Gjør:** Står det en liste i brevet (utbetalingsplan, vilkår per sted, rapportfrister), la en veiledning si at
  saksbehandleren eller agenten skriver den fra tabellen i saksdata.
- **Ikke gjør:** Ikke bruk `{{#each …}}` eller andre løkker. Ikke lag et tekstfelt på saken med lista ferdig skrevet for
  å kunne flette den.
- **Hvorfor:** Flettingen har ingen løkker; `{{#each}}` blir stående som tekst. Et tekstfelt med lista er samme
  opplysning to steder.

## mal-dokumentfelt Verdier som hører til ett brev, står på dokumentet

```yaml
id: mal-dokumentfelt
klasse: valg
gjelder: [SetDocumentFieldValue, FinnDokument]
krever: [05-felt-og-saksdata.md#et-felt-har-en-leser]
opphav: skrevet
```

- **Gjør:** Lag dokumentfelt (`entityType: document`) for verdier som gjelder dette ene dokumentet (beløpet i ett av
  flere utbetalingsbrev, svarfristen, en referanse fra utsendingen). Flett dem med `{{document:<feltnavn>}}`. Sett dem
  før PDF-en lages.
- **Ikke gjør:** Ikke lag et saksfelt for en verdi som er ulik i hvert brev. Ikke regn med at dokumentfeltet flettes når
  dokumentet lages fra malen.
- **Hvorfor:** Saksfeltet har én verdi for hele saken. Dokumentfeltet flettes bare når dokumentet finnes
  (forhåndsvisning og PDF), og flyten kan finne dokumentet på verdien.

## mal-dokument-fra-flyt Et dokument en flyt lager fra malen, er ikke flettet før PDF-en

```yaml
id: mal-dokument-fra-flyt
klasse: felle
gjelder: [OpprettSaksdokument, OpprettSaksdokument.templateId, LagPdfFraSaksdokument]
krever: [mal-fryses-ved-utsending]
opphav: skrevet
```

- **Gjør:** Lag dokumentet med «Opprett saksdokument» og malen, sett dokumentfeltene, og lag PDF-en med «Lag PDF fra
  saksdokument» før noe sendes.
- **Ikke gjør:** Ikke send eller arkiver innholdet fra «Opprett saksdokument» direkte.
- **Hvorfor:** Malinnholdet kopieres rått, og flettefeltene står igjen til forhåndsvisningen eller PDF-en fletter dem.

## mal-utkast-med-neo Neo skriver utkastet fra malen, og saksbehandleren tar det over før det er et dokument

```yaml
id: mal-utkast-med-neo
klasse: valg
gjelder: [caseRunInstruction, documentTemplate]
krever: [08-instrukser.md#instruks-en-behandlingsregel, 08-instrukser.md#instruks-ki-tre-former]
opphav: praksis
```

- **Gjør:** Skriv veiledningen i malen så den også er en bestilling: hva som skal stå, og hvilken kilde det bygger på.
  Legg behandlingsregelen på saken fra start (`INSTANTIATE_ON_CREATE`), så agenten leser den.
- **Ikke gjør:** Ikke send et dokument agenten har laget, uten at saksbehandleren har tatt det over.
- **Hvorfor:** Utkastet er et KI-utkast til et menneske tar det over, og først da gir det `document.updated`. Agenten får
  instruksene som ligger på saken; en instruks som bare er tilgjengelig (`AVAILABLE`), ser den ikke.

## mal-fryses-ved-utsending Det som sendes, er én PDF: den samme går til mottakeren, til saken og til arkivet

```yaml
id: mal-fryses-ved-utsending
klasse: felle
gjelder: [LagPdfFraSaksdokument, LagPdfFraSaksdokument.versjon, CreateDocumentVersion]
krever: [07-flyt.md#flyt-forvaltningshandling]
opphav: skrevet
```

- **Gjør:** La handlingen som sender, lage PDF-en én gang og bruke referansen til vedlegget, til fila i saken og til
  arkivet. Skal PDF-en lages av en godkjent versjon, frys versjonen først og pek på den med `versjon`.
- **Ikke gjør:** Ikke send dokumentet som det står i editoren. Ikke lag en ny PDF til arkivet etterpå.
- **Hvorfor:** Det som er sendt og det som er arkivert, skal være det samme. PDF-en flettes mot sakens verdier slik de er
  når den lages, også fra en fryst versjon, så en PDF laget senere kan bli en annen.

Eksempel: godkjenning i to ledd. Handlingen «Godkjenn» på dokumentet setter dokumentstatusen og fryser versjonen
(`CreateDocumentVersion`). Handlingen som sender, lager PDF-en av den versjonen med `versjon`, så det som ble godkjent,
er det som går ut, også om noen redigerer etterpå. Dokumentstatusene og låsingen står i `15-dokumenter-under-arbeid.md`.

## mal-brev-etter-vedtaket Et tilsagn eller en avtale etter vedtaket får sitt eget brev når det er et eget steg

```yaml
id: mal-brev-etter-vedtaket
klasse: valg
gjelder: [documentTemplate, documentTemplate.type]
krever: [02-status.md#venting-etter-vedtaket, mal-dokumentfelt]
opphav: forslag
```

- **Gjør:** Er det som følger vedtaket et eget steg med egne vilkår (et tilsagn med rapportering og utbetalingsplan, en
  avtale som skal signeres, et pålegg med frist for retting), lag et eget brev med dokumentfelt for det som er spesielt
  for brevet. Er vedtaket og dette samme dokument uten noe parten må gjøre, hold det i vedtaksmalen under «Ved
  innvilgelse».
- **Ikke gjør:** Ikke gjenta begrunnelsen fra vedtaket i brevet som følger.
- **Hvorfor:** Et dokument per forvaltningshandling gjør det klart hva som er sendt når, og hva som er arkivert mot
  hvilket steg.

Eksempel: et tilsagn om tilskudd. Beløpet er et tallfelt på saken; utbetalingsplanen og vilkårene er rader i saksdata,
som agenten eller saksbehandleren skriver inn i brevet (`mal-ingen-lister`). Akseptfristen er et dokumentfelt satt fra
handlingens skjema. Flyten sender tilsagnet, setter saken i ventestatusen etter vedtaket og lager en venteoppgave med
fristen. Aksepten kommer som en egen Altinn-innsending som finner saken på instansen
(`11-integrasjoner.md#korrelasjon-paa-instans`).

## mal-beskrivelse-sier-nar Beskrivelsen sier når malen skal brukes

```yaml
id: mal-beskrivelse-sier-nar
klasse: valg
gjelder: [documentTemplate.name, documentTemplate.description]
opphav: forslag
```

- **Gjør:** Skriv i `description` hvilket dokument malen gir, i hvilket steg den brukes, om den gjelder alle utfall eller
  ett, og hjemmelen når den bærer malen.
- **Ikke gjør:** Ikke gjenta navnet, og ikke la beskrivelsen stå tom.
- **Hvorfor:** Agenten velger mal på id, navn og beskrivelse; det er alt den får. To maler med like navn og tomme
  beskrivelser er umulige å velge riktig mellom.

```yaml
documentTemplate:
  name: Vedtak om tilskudd
  type: DECISION
  description: >
    Enkeltvedtak om tilskudd etter forskriften for ordningen, for både innvilgelse og avslag.
    Brukes i steget «Vedtak». Tilsagnsbrevet etter vedtaket er en egen mal.
```

## mal-tagger-for-biblioteket Taggene er for biblioteket, og ingenting annet

```yaml
id: mal-tagger-for-biblioteket
klasse: standard
gjelder: [documentTemplate.tags]
krever: [mal-typen, mal-beskrivelse-sier-nar]
opphav: praksis
```

- **Gjør:** Tomme tagger holder. Vil kunden finne malene lettere i biblioteket, gi to til fire tagger med små bokstaver:
  dokumentets art, saksområdet og hjemmelen.
- **Ikke gjør:** Ikke bruk en tagg i stedet for `type` eller beskrivelsen.
- **Hvorfor:** Bare malbiblioteket leser taggene. Agenten ser dem ikke når den velger mal.

## mal-eksempler-i-samtalen Eksempeldokumentene er grunnlag for malagenten, ikke en del av malen

```yaml
id: mal-eksempler-i-samtalen
klasse: felle
gjelder: [documentTemplate]
opphav: forslag
```

- **Gjør:** Last opp et tidligere dokument av samme slag når du lager malen sammen med agenten, med
  personopplysningene fjernet. Last opp det eksempelet agenten skal bruke, sist.
- **Ikke gjør:** Ikke last opp dokumenter med personopplysninger eller taushetsbelagt innhold. Ikke regn med at
  eksempelet følger malen til en ny samtale eller en annen organisasjon.
- **Hvorfor:** Eksempeldokumentene er bundet til samtalen, ikke til malen, og agenten leser bare det nyeste.
