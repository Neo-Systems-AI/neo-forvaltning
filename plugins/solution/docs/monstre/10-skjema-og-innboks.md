# Skjema, innboks og tags

Skjemamodulen i Neo lager skjemaer som medlemmene fyller ut selv, og skjemaer en flyt spør om når den kjører. Innboksen
tar imot det som ikke kommer ferdig strukturert (e-post, en ekstern skjemaløsning), og taggene sier hva en henvendelse er
og hvem som skal ta den. En søknad fra innbyggere eller virksomheter kommer som et Altinn-skjema, ikke gjennom noen av
disse flatene.

## Kortversjonen

**Hvor det kommer inn.** Det første som svarer ja, avgjør.

| # | Spørsmålet | Ja betyr |
|---|---|---|
| 1 | Sender noen utenfor organisasjonen noe som skal bli en sak (søknad, ettersending, klage, rapport)? | Et **Altinn-skjema** og en inntaksflyt (`altinn-for-soknader`, `11-integrasjoner.md#altinn-inntak`) |
| 2 | Kommer det som e-post eller fra en ekstern skjemaløsning? | **Innboksen**: tagg, tildel og legg i sak (`innboks-for-det-ustrukturerte`) |
| 3 | Melder et medlem inn noe som skal bli en sak? | Et **selvbetjent Neo-skjema** med en flyt som oppretter saken (`neo-skjema-er-intern-inngang`) |
| 4 | Skal en flyt spørre den som starter en handling (utfallet, en frist)? | Et **handlingsskjema**, ikke selvbetjent (`selvbetjent-bare-for-innganger`) |

**Hvordan en tagg settes.**

| Spørsmålet | Ja betyr |
|---|---|
| Er taggen ny, eller har ingen sett hvor godt KI-en treffer? | `requires_verification` (`tagg-verifiseres-forst`) |
| Treffer forslagene, og gjør en feil tagg liten skade? | `automatic`, gjerne med en terskel (`tagg-verifiseres-forst`) |
| Starter taggen en flyt, eller setter bare mennesker og flyter den? | `manual` (`tagg-som-utloser`) |
| Skal taggen ikke brukes mer? | Slå den av; slett den bare om den aldri er brukt (`tagg-av-ikke-slett`) |

---

## altinn-for-soknader En søknad fra innbyggere eller virksomheter kommer som Altinn-skjema, ikke som Neo-skjema

```yaml
id: altinn-for-soknader
klasse: valg
gjelder: [form, AltinnHentSkjemadata, CreateCase]
krever: [11-integrasjoner.md#altinn-kontrakten, 11-integrasjoner.md#altinn-inntak]
opphav: praksis
```

- **Gjør:** La alt som kommer fra noen utenfor organisasjonen og skal bli en sak (søknaden, ettersendingen, klagen,
  rapporten), komme som et Altinn-skjema. Flyten tar imot hendelsen fra Altinn og oppretter saken.
- **Ikke gjør:** Ikke bygg søknadsskjemaet i Neos skjemabygger og del lenken. Ikke la søknaden komme som e-post eller PDF
  i innboksen når den kan komme som et skjema.
- **Hvorfor:** Altinn gir innlogging med ID-porten, «på vegne av» med fullmakter, strukturerte data og en dialog med
  søkeren der svar og vedtak kan ligge. Et Neo-skjema kan bare fylles ut av et innlogget medlem av organisasjonen; Neo
  har ingen åpen utfylling. En søknad som kommer som e-post, må leses og tastes inn.

## neo-skjema-er-intern-inngang Et Neo-skjema er for medlemmene og for flytene, ikke for søkerne

```yaml
id: neo-skjema-er-intern-inngang
klasse: valg
gjelder: [form, ObjectAction]
krever: [07-flyt.md#flyt-valg-med-skjema]
opphav: skrevet
```

- **Gjør:** Bruk et Neo-skjema til to ting: en inngang medlemmene fyller ut selv («Fyll ut skjema»), og et spørsmål en
  flyt stiller den som starter en handling (for eksempel utfallet når vedtaket sendes).
- **Ikke gjør:** Ikke bruk et Neo-skjema som søknadsskjema for eksterne. Ikke regn med å koble et skjema til «Ny sak».
- **Hvorfor:** Et skjema har ingen kobling til sakstypen, og «Ny sak» lager alltid en tom sak. Skal en sak starte med
  innhold, lag et selvbetjent skjema med en flyt som oppretter saken.

## selvbetjent-bare-for-innganger «Kan fylles ut av medlemmer» står bare på skjemaer som er en inngang

```yaml
id: selvbetjent-bare-for-innganger
klasse: felle
gjelder: [form.selfService]
krever: [neo-skjema-er-intern-inngang]
opphav: skrevet
```

- **Gjør:** Slå på `selfService` på skjemaer et medlem skal kunne starte noe med. La den stå av (standarden) på skjemaene
  flytene bruker.
- **Ikke gjør:** Ikke slå den på for et handlingsskjema «for sikkerhets skyld».
- **Hvorfor:** Innstillingen avgjør hva som står i «Fyll ut skjema», og den gjelder med en gang, uten ny publisering. Et
  selvbetjent skjema kan ikke ha felt som henter verdier fra saken, fordi det sendes inn uten en sak. Innsendingen kjører
  flytene som medlemmet, med medlemmets tilganger.

```yaml
form:
  name: Ny tilskuddsordning        # høyst 50 tegn
  selfService: true
```

## skjemasvar-er-inndata Svaret i et skjema er inndata til flyten; det som skal vare, skriver flyten i saken

```yaml
id: skjemasvar-er-inndata
klasse: felle
gjelder: [SetCaseFieldValue, CreateCaseData]
krever: [05-felt-og-saksdata.md#utfall-som-felt, 05-felt-og-saksdata.md#vurdering-i-saksdata]
opphav: praksis
```

- **Gjør:** La flyten skrive svaret der det hører hjemme: utfallet i et valgfelt på saken, en vurdering i saksdata, en
  frist på brevet og venteoppgaven.
- **Ikke gjør:** Ikke la skjemainnsendingen være det eneste stedet en opplysning står. Ikke lag et skjema som samler
  vurderingen av en søknad og la den bli liggende i skjemainnboksen.
- **Hvorfor:** Bare flyten leser skjemasvaret. Saken er der saksbehandleren, agenten, listene og malene leser.

## skjema-navn-og-versjon Et skjema har et kort navn som sier hva det gjør, og endringer gjelder først når de er publisert

```yaml
id: skjema-navn-og-versjon
klasse: felle
gjelder: [form.name, form.definition]
opphav: forslag
```

- **Gjør:** Gi skjemaet et navn på høyst 50 tegn som sier handlingen: «Send vedtaket», «Ny tilskuddsordning». Publiser
  når en endring skal gjelde.
- **Ikke gjør:** Ikke gi to skjemaer samme navn hos samme eier. Ikke endre et publisert skjema og regn med at den som har
  det åpent, sender inn på den nye versjonen.
- **Hvorfor:** Navnet er unikt per eier og tar 50 tegn. Innholdet fryses i versjonen ved publisering, og en innsending mot
  en versjon som ikke lenger er den publiserte, avvises (409 `FORM_VERSION_CHANGED`).

## skjema-steget-tildeles-en-rolle Skjema-steget i en flyt tildeles en rolle når flyten skal brukes i flere organisasjoner

```yaml
id: skjema-steget-tildeles-en-rolle
klasse: felle
gjelder: [FormSubmission, FormSubmission.assignee, FormSubmission.deadline]
krever: [14-tilgang.md#jobbroller-etter-jobben]
opphav: skrevet
```

- **Gjør:** Tildel skjema-steget en rolle når flyten ligger i en Løsning eller skal rulles ut. Tildel en person bare i en
  flyt som er organisasjonens egen.
- **Ikke gjør:** Ikke pek på et medlem i en flyt som skal til andre organisasjoner. Ikke regn med at en frist på steget
  (`deadline`) når fram.
- **Hvorfor:** En rolle beholdes uendret ved utrulling; en person som ikke finnes hos kunden, tømmes, og steget står da
  utildelt. Noden sender bare forhåndsverdiene, versjonen og tildelingen videre, ikke fristen.

## skjema-knappen-sier-handlingen Innsendingsknappen sier hva som skjer, eller står som standard

```yaml
id: skjema-knappen-sier-handlingen
klasse: standard
gjelder: [form.settings]
opphav: forslag
```

- **Gjør:** La knappeteksten (`settings.submitButtonText`) stå tom når standardteksten er god nok. Sett den når knappen bør
  si hva som skjer: «Send til godkjenning», «Registrer utbetaling».
- **Ikke gjør:** Ikke sett egen tekst på et skjema som fylles ut på flere språk. Ikke legg andre innstillinger i
  `settings`.
- **Hvorfor:** Uten egen tekst viser knappen standardteksten på språket til den som fyller ut; en egen tekst oversettes
  ikke. Knappeteksten er den eneste innstillingen i `settings`.

## innboks-for-det-ustrukturerte Innboksen er for det som ikke kommer som skjema

```yaml
id: innboks-for-det-ustrukturerte
klasse: felle
gjelder: [OpprettHenvendelse, OpprettHenvendelse.eksternId]
krever: [07-flyt.md#flyt-ekstern-id]
opphav: skrevet
```

- **Gjør:** Bruk innboksen til e-post og innsendinger fra en ekstern skjemaløsning. En ekstern løsning kobles på med
  «Webhook mottatt» → «Opprett henvendelse», med en fast `kilde` og løsningens egen id i `eksternId`.
- **Ikke gjør:** Ikke send Altinn-innsendinger via innboksen. Ikke lag en henvendelse fra en flyt uten `eksternId`.
- **Hvorfor:** Med `eksternId` lages henvendelsen bare én gang, så den andre løsningen kan prøve på nytt. Uten den gir hver
  kjøring en ny henvendelse. Altinn-kanalen i innboksen er ikke koblet til Altinn ennå; en Altinn-innsending går fra
  hendelsen rett til saken i en flyt.

```yaml
OpprettHenvendelse:
  kilde: Skjemaløsningen
  emne: "{{utløser:skjemanavn}}"
  eksternId: "{{utløser:innsendingId}}"
  avsenderNavn: "{{utløser:innsender}}"
```

## tildel-en-person En henvendelse tildeles én person, aldri en rolle

```yaml
id: tildel-en-person
klasse: valg
gjelder: [TildelHenvendelse, TildelHenvendelse.assignedToId]
opphav: skrevet
```

- **Gjør:** Tildel henvendelsen et medlem, for hånd eller med «Tildel henvendelse». Skal noe fordeles på et fagområde, sett
  en tagg og la en person eller en flyt tildele.
- **Ikke gjør:** Ikke prøv å tildele et team eller en rolle. Ikke regn med at mottakeren får varsel.
- **Hvorfor:** En henvendelse har alltid én ansvarlig person. Tildelingen sender ikke varsel.

## legg-i-sak-er-overgangen «Legg i sak» er overgangen fra innboksen til saken

```yaml
id: legg-i-sak-er-overgangen
klasse: felle
gjelder: [AddInboxEmailToCase, LeggTilPart]
krever: [11-integrasjoner.md#arkiv-fra-katalogen, 05-felt-og-saksdata.md#parten-er-sakspart]
opphav: skrevet
```

- **Gjør:** Legg henvendelsen i saken den gjelder, med vedleggene. Gjør en flyt det («Legg e-post i sak»), legg avsenderen
  til som part i samme flyt: finn kontakten på e-posten, opprett den om den mangler, og legg den til som part.
- **Ikke gjør:** Ikke kopier innholdet inn i saken for hånd og sett henvendelsen som ferdig. Ikke regn med at flyten gjør
  avsenderen til part.
- **Hvorfor:** «Legg i sak» setter henvendelsen ferdig, gjør den til en e-post i saken og gir hendelsen
  `inbox_item.linked_to_case`, som arkivflyten lytter på. For hånd blir avsenderen part; fra en flyt blir hen det ikke.

## tagg-ruter-ikke-sak En tagg sier hva henvendelsen er; den oppretter ingen sak

```yaml
id: tagg-ruter-ikke-sak
klasse: valg
gjelder: [inboxTag, inboxTag.name, inboxTag.label]
opphav: praksis
```

- **Gjør:** Lag én tagg per slag henvendelse som skal til et bestemt sted: «Tilskudd: søknad utenom Altinn», «Tilskudd:
  rapport», «Tilskudd: spørsmål om utlysningen». Saksbehandleren, eller en flyt, gjør resten.
- **Ikke gjør:** Ikke lag tagger for statuser, utfall eller saksbehandlere. Ikke lag en tagg for Altinn-innsendinger.
- **Hvorfor:** Taggen er det KI-en setter når henvendelsen kommer inn, og det en flyt kan starte på. Status og utfall
  hører til saken, og ansvaret til tildelingen.

## tagg-beskrivelse-er-kjennetegn Beskrivelsen er grunnlaget KI-en tagger på: hva det er, kjennetegn, og hva som skal skje

```yaml
id: tagg-beskrivelse-er-kjennetegn
klasse: valg
gjelder: [inboxTag.description]
opphav: praksis
```

- **Gjør:** Skriv beskrivelsen i tre deler: én setning om hva henvendelsen gjelder, en liste med kjennetegn (ordene,
  avsenderen, vedleggene), og hva som skal skje når taggen står. Skill taggen fra naboene der de kan forveksles.
- **Ikke gjør:** Ikke skriv bare navnet om igjen.
- **Hvorfor:** KI-en får navnet, etiketten og beskrivelsen til de aktive taggene, og ikke noe annet. Beskrivelsen må være
  mellom 20 og 1000 tegn.

```yaml
inboxTag:
  name: tilskudd-rapport
  label: "Tilskudd: rapport"
  applicationMode: requires_verification
  color: secondary
  description: |
    Rapport fra en som har fått tilskudd: delrapport, sluttrapport eller regnskap for prosjektet. Kjennetegn:
    - Viser til et tilsagn, et saksnummer eller et prosjekt som har fått tilskudd
    - Vedlegg med regnskap, måloppnåelse eller sluttrapport
    Saksbehandleren legger rapporten i tilskuddssaken med «Legg i sak».
```

## tagg-verifiseres-forst Sett modusen på hver tagg, og start med verifisering

```yaml
id: tagg-verifiseres-forst
klasse: felle
gjelder: [inboxTag.applicationMode, inboxTag.verifyBelowConfidence]
opphav: praksis
```

- **Gjør:** Skriv `applicationMode` på hver tagg. Start med `requires_verification`. Gå over til `automatic`, eventuelt
  med en terskel (`verifyBelowConfidence`), først når dere har sett at forslagene treffer. Bruk `manual` for tagger bare
  mennesker og flyter setter.
- **Ikke gjør:** Ikke la modusen stå tom. Ikke la en tagg som starter en flyt, settes automatisk av KI-en.
- **Hvorfor:** Standarden er ikke den samme overalt: en tagg som lages i Neo, får `requires_verification`, men en tagg fra
  oppsettet uten modus får `automatic`. En feil tagg som settes automatisk, sender henvendelsen feil vei uten at noen ser
  det. Under terskelen blir taggen et forslag uansett modus.

## tagg-som-utloser En tagg som starter en flyt, settes for hånd, og flyten kvitterer med en annen tagg

```yaml
id: tagg-som-utloser
klasse: felle
gjelder: [SettTagg, SettTagg.taggIder]
krever: [07-flyt.md#flyt-ikke-start-seg-selv, 07-flyt.md#flyt-identitet-er-id]
opphav: skrevet
```

- **Gjør:** La flyten starte på `inbox_item.tag_applied` med strømfilteret på taggen, og la den sette en annen tagg når den
  er ferdig («Overfør til fagsystem» → «Overført til fagsystem»). Pek på taggen med id.
- **Ikke gjør:** Ikke la flyten sette den samme taggen som startet den.
- **Hvorfor:** Med samme tagg starter flyten seg selv. Id-en skrives om til kundens kopi ved utrulling. En tagg som er
  slettet eller slått av, stopper noden.

## tagg-av-ikke-slett Slå av en tagg som ikke skal brukes lenger; slett den bare når den aldri er brukt

```yaml
id: tagg-av-ikke-slett
klasse: felle
gjelder: [inboxTag, inboxTag.applicationMode, SettTagg]
krever: [tagg-som-utloser]
opphav: forslag
```

- **Gjør:** Slå av taggen når det slaget henvendelser ikke skal tagges mer. Sjekk først om en flyt setter taggen eller
  starter på den, og rett flyten.
- **Ikke gjør:** Ikke slett en tagg som står på henvendelser. Ikke slå av en tagg for at KI-en skal slutte å sette den;
  sett den til `manual`.
- **Hvorfor:** En tagg som er av, kan ikke settes av noen, heller ikke av en flyt, og kan slås på igjen. En slettet tagg
  er borte for godt. Av og på er ikke en innstilling i oppsettet; det gjøres i organisasjonen.

## tagg-farge-etter-alvor Fargen sier hvor mye taggen krever, ikke hvilken sakstype den hører til

```yaml
id: tagg-farge-etter-alvor
klasse: valg
gjelder: [inboxTag.color]
opphav: praksis
```

- **Gjør:** Bruk `destructive` for en tagg som betyr at noe må kontrolleres før saken går videre (særlige kategorier
  personopplysninger, en sperre), `outline` for skjerming, `default` for det journalpliktige og `secondary` (standarden)
  for det som er nyttig å vite.
- **Ikke gjør:** Ikke gi hver sakstype sin farge. Ikke bruk `destructive` på mer enn de få taggene som krever handling.
- **Hvorfor:** Brukt for alvor skiller fargen det som må sjekkes, fra resten. Får alt sterk farge, ser ingen den. Neo
  godtar også `success`, men oppsettet kjenner den ikke.
