# Integrasjonene: Altinn, arkivet, registrene og postboksene

Integrasjonene kobler saken til systemene rundt den: Altinn tar imot søknaden og bærer dialogen med søkeren, arkivet
(Documaster) journalfører og publiserer til offentlig journal, registrene gir fakta om søkeren, og de felles postboksene
tar imot og sender e-post. I Neo er alt dette flyter med integrasjonsnoder, satt opp mot kundens integrasjoner.

Reglene her gjelder hvordan integrasjonene brukes i oppsettet: flytene, feltene og journalføringen. Hvordan hvert system
settes opp hos kunden, står i [integrasjonene](../../../../docs/README.md): [Altinn](../../../altinn/docs/altinn.md),
[Maskinporten](../../../maskinporten/docs/maskinporten.md), [Documaster](../../../documaster/docs/documaster.md),
[KS Fiks](../../../fiks/docs/fiks.md), [Kontakt- og reservasjonsregisteret](../../../krr/docs/krr.md) og
[Exchange Online](../../../entra/docs/exchange.md).

Det som sendes ut, er beviset for plikten (`09-maler.md#brevet-er-beviset`): én PDF går til mottakeren, til saken og
til arkivet. Ingen node leser partens foretrukne kanal eller reservasjonen i KRR; flyten velger kanalen.

## Kortversjonen

**Hvordan saken når søkeren.** Det første som svarer ja, avgjør.

| # | Spørsmålet | Ja betyr |
|---|---|---|
| 1 | Skal søkeren sende noe tilbake (en ettersending, en aksept, en rapport)? | Et **forhåndsutfylt Altinn-skjema**, med lenken i søknadens dialog (`ettersending-som-skjema`) |
| 2 | Har saken en søknad med dialog i Altinn? | En **melding i dialogen**, med PDF-en som vedlegg (`dialogen-er-soknadens`, `vedtaket-fra-dokumentet`) |
| 3 | Har mottakeren ingen dialog, men kan nås i Altinn? | En **frittstående melding** (`melding-utenfor-traden`) |
| 4 | Skal brevet gå med SvarUt? | En **forsendelse med ekstern referanse** fra Neo (`svarut-med-ekstern-referanse`) |

Substatusen i Altinn kommer i tillegg til en forsendelse, aldri i stedet for den (`vedtaket-fra-dokumentet`).

**Hvem som journalfører hva.**

| Hva | Hvem | Regelen |
|---|---|---|
| Saksmappen | Én flyt per sakstype: flyten fra katalogløsningen «Documaster» eller inntaket | `en-som-oppretter-saksmappen` |
| En Altinn-innsending (søknad, ettersending, klage, rapport) | Inntaksflyten, som inngående journalpost (I) | `altinn-journalfores-i-inntaket` |
| En henvendelse lagt i sak fra innboksen | Flyten fra katalogløsningen «Documaster» | `arkiv-fra-katalogen` |
| Et brev eller en melding med saksbehandlerens innhold | Flyten som sender, som utgående journalpost (U), før sendingen | `utgaende-journalfores-for-sending` |
| En fast kvittering uten saksbehandlerens innhold | Ingen | `utgaende-journalfores-for-sending` |
| Avslutningen | Neo setter S; arkivet setter A | `avslutning-s-og-a` |
| Offentlig journal | Arkivet, fra det Neo satte da objektet ble opprettet | `offentlig-journal-fra-arkivet` |

---

## altinn-kontrakten Avtal kontrakten med Altinn-appen før flyten bygges

```yaml
id: altinn-kontrakten
klasse: felle
gjelder: [stream, AltinnHentSkjemadata, AltinnHentSkjemadata.appId, AltinnHentSkjemadata.dataType]
opphav: forslag
```

- **Gjør:** Skriv ned, for hver app: app-id-en (`<org>/<app>`), datatypen med skjemadataen, datatypene for PDF-en og
  vedleggene, maskinverdiene i hvert valg, feltene som forhåndsutfylles, og om instansen skal skjules i innboksen. Sjekk
  at appen sender hendelser og at tjenesteeieren har rettighetene Neo trenger
  ([Altinn](../../../altinn/docs/altinn.md)). Opprett abonnementet på appen under integrasjonen i Neo.
- **Ikke gjør:** Ikke bygg flyten mot en app som ikke er publisert med hendelser på. Ikke la flyten gjette på stier i
  datamodellen; velg feltene fra appens skjema i panelet.
- **Hvorfor:** En ny app sender ingen hendelser før det slås på, og Neo abonnerer ikke av seg selv: saken blir bare aldri
  opprettet. Altinn dropper en ukjent nøkkel i forhåndsutfyllingen uten å si fra.

## en-app-per-innsending Én app per slag innsending, og én hendelsestype per app i strømmen

```yaml
id: en-app-per-innsending
klasse: felle
gjelder: [stream, stream.eventTypes.filters, EventReceived, EventReceived.streamId]
opphav: praksis
```

- **Gjør:** Lag egne apper for søknaden, ettersendingen, klagen og rapporten. Gi strømmen én hendelsestype per app,
  filtrert på `resource` (`urn:altinn:resource:app_<org>_<app>`), og én flyt per hendelsestype.
- **Ikke gjør:** Ikke la én flyt lytte på `process.completed` uten filter på appen.
- **Hvorfor:** Alle appene sender samme hendelse. Uten filteret starter inntaket av søknaden når en ettersending kommer.

## altinn-inntak Inntaket går fra hendelsen rett til saken, med maskinverdiene slått opp i en synlig tabell

```yaml
id: altinn-inntak
klasse: valg
gjelder: [AltinnHentSkjemadata, SlaOppITabell, SlaOppITabell.stoppUtenTreff, CreateCase, LeggTilPart, CreateCaseData, AltinnSettSubstatus]
krever: [07-flyt.md#flyt-tabell-for-oppslag, 05-felt-og-saksdata.md#nokkel-og-etikett, 05-felt-og-saksdata.md#parten-er-sakspart, 05-felt-og-saksdata.md#fakta-og-vurdering-hver-sin-mal]
opphav: praksis
```

- **Gjør:** Bygg inntaket slik: «Hendelse mottatt» → «Hent skjemadata» → «Slå opp i tabell» for hvert valg appen sender
  som maskinverdi → «Opprett sak» → søkeren som part → saksdataen med søknaden → substatus «Mottatt». La en ukjent
  maskinverdi stoppe inntaket.
- **Ikke gjør:** Ikke skriv maskinverdien («Driftstilskudd») rett i et valgfelt. Ikke legg en «ellers»-vei som gjør en
  ukjent verdi til en tom sak.
- **Hvorfor:** Feltet lagrer nøkkelen og brevet fletter etiketten, så maskinverdien må bli en nøkkel ett sted, og det
  stedet skal forfatteren se. En ny verdi i appen er en endring i oppsettet, ikke en sak med tomt felt. Feltene på saken
  settes fra søknaden av flyten, så ingenting tastes inn to ganger.

```yaml
SlaOppITabell:
  nokkel: "{{inntak-skjema:skjema.ordning}}"
  stoppUtenTreff: true
  tabell:
    - { value: Driftstilskudd, key: drift }
    - { value: Prosjekttilskudd, key: prosjekt }
```

Eksempel: hele inntaket av en søknad om tilskudd, i rekkefølge.

1. «Hendelse mottatt» på strømmen, filtrert på søknadsappen (`en-app-per-innsending`).
2. «Hent skjemadata», og «Slå opp i tabell» for ordningen.
3. «Opprett sak» med en tittel uten personnavn (`offentlig-tittel-uten-navn`).
4. Finn eller opprett søkeren, legg den til som part, og slå opp virksomheten i Enhetsregisteret
   (`registre-skriver-pa-kontakten`).
5. Lagre instansen i et saksfelt (`korrelasjon-paa-instans`).
6. Lag saksdataen med søknaden, og sett substatus «Mottatt».
7. Journalfør søknaden som inngående journalpost (`altinn-journalfores-i-inntaket`).
8. Kvitter ikke søknaden her (`kvitter-ved-avslutning`).

## korrelasjon-paa-instans Svaret finner saken på Altinn-instansen, ikke på saksnummeret

```yaml
id: korrelasjon-paa-instans
klasse: felle
gjelder: [customFieldDefinition, FinnSak, FinnSak.feltNavn]
krever: [05-felt-og-saksdata.md#et-felt-har-en-leser]
opphav: praksis
```

- **Gjør:** Lagre søknadens instans (`partyId/instanceGuid`) i et tekstfelt på saken. Når flyten sender et skjema ut
  (ettersending, klage, rapport), lagre den nye instansen i et eget felt. Flyten som tar imot svaret, finner saken med
  «Finn sak» på det feltet.
- **Ikke gjør:** Ikke finn saken på et saksnummer søkeren har i skjemadataen.
- **Hvorfor:** Instansen er en verdi Altinn setter; et saksnummer i skjemadataen kan søkeren endre. Feltet har en leser:
  «Finn sak» leser bare saksfelt. Verdien er en indirekte personopplysning og skal med i behandlingsprotokollen og
  slettingen.

```yaml
customFields:
  - { name: altinn_instans_soknad, label: Altinn-instans (søknaden), type: text, entityType: case }
```

## kvitter-ved-avslutning Søknaden kvitteres når saken er ferdig for den; en del-innsending når den er tatt imot

```yaml
id: kvitter-ved-avslutning
klasse: felle
gjelder: [AltinnKvitterMottatt]
krever: [07-flyt.md#flyt-forvaltningshandling]
opphav: skrevet
```

- **Gjør:** Kvitter søknaden («Kvitter mottatt») i flyten som sender vedtaket eller avslutter saken. Kvitter en
  ettersending, klage eller rapport når den er lagt i saken.
- **Ikke gjør:** Ikke kvitter søknaden i inntaket.
- **Hvorfor:** Kvitteringen sier at tjenesteeieren er ferdig, og søknaden står da som «Avsluttet» for søkeren. Kvittert i
  inntaket står den som avsluttet mens den behandles. Vi har ikke sett at en kvittering kan trekkes tilbake.

## ettersending-som-skjema Det dere ber søkeren om, sendes som et forhåndsutfylt skjema med lenken i søknadens tråd

```yaml
id: ettersending-som-skjema
klasse: valg
gjelder: [AltinnOpprettForhandsutfylt, AltinnOpprettForhandsutfylt.frist, AltinnOpprettForhandsutfylt.mottakerType, AltinnSendMelding, CreateTask]
krever: [02-status.md#en-ventestatus, 06-oppgaver.md#oppgave-venter, 07-flyt.md#flyt-oppgaven-finnes]
opphav: skrevet
```

- **Gjør:** Send et forhåndsutfylt skjema til den som eier søknaden (`partyId` fra «Hent innsending»), og legg lenken i en
  melding i søknadens tråd. Lagre den nye instansen på saken, sett saken i ventestatus, og opprett en venteoppgave som
  står til svaret er kommet. La flyten stoppe hvis en venteoppgave alt står åpen.
- **Ikke gjør:** Ikke send flere forespørsler av samme slag samtidig på samme sak. Ikke bind `frist` til en verdi som kan
  være tom.
- **Hvorfor:** Appen kan skjule instansen i innboksen, og da finner søkeren skjemaet bare gjennom lenken. Instansfeltet er
  ett felt, så en ny forespørsel ville overskrevet den forrige. En `frist` som er bundet og blir tom, stopper noden; en
  dato blir slutten av dagen i norsk tid.

```yaml
AltinnOpprettForhandsutfylt:
  appId: <org>/rapport
  dataType: model
  mottakerType: partyId
  mottaker: "{{hent-soknad:instans.partyId}}"
  prefill:
    - { felt: saksnr, verdi: "{{hent-sak:saksnummer}}" }
  frist: "{{handling:input.svarfrist}}"   # en dag blir 23:59:59 norsk tid
```

## dialogen-er-soknadens Dialogen med søkeren er søknadens; Neo legger meldinger i den

```yaml
id: dialogen-er-soknadens
klasse: valg
gjelder: [AltinnSendMelding, AltinnSendMelding.eksterneReferanser, AltinnHentInnsending]
opphav: skrevet
```

- **Gjør:** Svar søkeren i dialogen søknaden laget: «Send melding» med `DialogportenDialogId` fra «Hent innsending» og
  `DialogportenTransmissionType` som sier hva meldingen er (`Decision`, `Request`, `Acceptance`, `Information`).
- **Ikke gjør:** Ikke send vedtaket som en frittstående melding når søknaden har en dialog. Ikke bruk `Information` for en
  kvittering på noe søkeren sendte; det er `Acceptance`.
- **Hvorfor:** Dialogen lages av Altinn når søknaden sendes inn, og meldingen havner i tråden bare når den peker på den.
  Da ser søkeren søknaden, forespørslene og vedtaket på ett sted. «Hent innsending» gir ingen dialog før Altinn har laget
  den.

## tradens-regler I tråden er det én mottaker, ingen svar-knapper og ingen lesebekreftelse

```yaml
id: tradens-regler
klasse: felle
gjelder: [AltinnSendMelding.mottakere, AltinnSendMelding.svarlenker, AltinnSendMelding.krevLesebekreftelse, AltinnSendMelding.avsendernavn]
krever: [dialogen-er-soknadens]
opphav: skrevet
```

- **Gjør:** Send til dialogens eier: `urn:altinn:person:identifier-no:<fnr>` når en person søkte,
  `urn:altinn:organization:identifier-no:<orgnr>` når en virksomhet søkte. Skriv lenker som markdown-lenker i
  brødteksten. La avsendernavnet stå tomt.
- **Ikke gjør:** Ikke legg til svar-knapper, lesebekreftelse eller flere mottakere på en melding i en dialog.
- **Hvorfor:** Noden stopper før sending når en av dem er satt i en dialog. Med et avsendernavn viser Altinn det som et
  personnavn i tråden; uten navn er avsenderen tjenesteeieren.

```yaml
AltinnSendMelding:
  avsendernavn: ""
  mottakere:
    - mottaker: "urn:altinn:organization:identifier-no:{{hent-soknad:instans.instanceOwner.organisationNumber}}"
  eksterneReferanser:
    - { type: DialogportenDialogId, verdi: "{{hent-soknad:dialogId}}" }
    - { type: DialogportenTransmissionType, verdi: Decision }
```

## melding-taushet-og-reservasjon Taushetsplikt, reservasjon og videresending velges per melding

```yaml
id: melding-taushet-og-reservasjon
klasse: valg
gjelder: [AltinnSendMelding.erTaushetsbelagt, AltinnSendMelding.ignorerReservasjon, AltinnSendMelding.tillatVideresending, AltinnSendMelding.sprak]
opphav: forslag
```

- **Gjør:** Sett `erTaushetsbelagt` på meldinger med taushetsbelagte opplysninger, og slå av `tillatVideresending` på dem.
  La `ignorerReservasjon` stå av med mindre en lov gir grunnlag for å sende til en som har reservert seg. Sett `sprak` når
  meldingen ikke er på bokmål.
- **Ikke gjør:** Ikke slå på `ignorerReservasjon` for at et vedtak skal komme fram raskere.
- **Hvorfor:** Står valgene tomme, gjelder Altinns standard; noden sjekker ikke grunnlaget for å overstyre reservasjonen.
  Språket er `nb` hvis ingenting er satt, og panelet har ikke feltet.

## vedtaket-fra-dokumentet Vedtaket sendes fra det ferdige dokumentet, og substatus er bare en merkelapp

```yaml
id: vedtaket-fra-dokumentet
klasse: felle
gjelder: [ObjectAction, LagPdfFraSaksdokument, AltinnSendMelding, AltinnSendMelding.vedlegg, AltinnSettSubstatus]
krever: [07-flyt.md#flyt-handling-pa-objektet, 09-maler.md#mal-fryses-ved-utsending, 09-maler.md#brevet-er-beviset]
opphav: praksis
```

- **Gjør:** Start sendingen som en handling på dokumentet. Send PDF-en som vedlegg i meldingen. Sett substatus i tillegg,
  med en nøytral tekst («Vedtak fattet»).
- **Ikke gjør:** Ikke la substatus være det eneste søkeren får. Ikke skriv utfallet i substatusen.
- **Hvorfor:** Handlingen på dokumentet sier hvilket brev som skal ut. Substatusen er en merkelapp og en kort melding i
  innboksen, uten vedlegg og klagefrist; den er ikke en forsendelse.

Eksempel: handlingen «Send vedtaket» på dokumentet, i rekkefølge.

1. Skjemaet i handlingen spør om utfallet; flyten setter status og utfallsfeltet fra svaret.
2. Stopp med en melding hvis dokumentet ikke er ferdig (`15-dokumenter-under-arbeid.md#send-bare-ferdig`).
3. «Lag PDF fra saksdokument» med `krevAlleFeltLost` på (`09-maler.md#mal-flettefeltene-lost`).
4. Journalfør PDF-en som utgående journalpost, og avskriv de inngående (`utgaende-journalfores-for-sending`).
5. «Send melding» i søknadens dialog med PDF-en som vedlegg og `Decision` (`dialogen-er-soknadens`).
6. Lagre PDF-en i saken og sett «Dokumenttype» (`09-maler.md#brevet-er-beviset`).
7. Sett substatus «Vedtak fattet», og kvitter søknaden (`kvitter-ved-avslutning`).
8. Skriv en egen hendelse for vedtaket med utfallet, og lag oppgavene som følger vedtaket.

## melding-utenfor-traden En melding utenfor tråden er for det som ikke hører til en søknad

```yaml
id: melding-utenfor-traden
klasse: valg
gjelder: [AltinnSendMelding, AltinnSendMelding.frist, AltinnSendMelding.krevLesebekreftelse]
krever: [tradens-regler]
opphav: forslag
```

- **Gjør:** Send en frittstående melding (uten `DialogportenDialogId`) når det ikke finnes en søknadsdialog: et brev til
  en virksomhet som ikke har søkt, en purring der skjemaet ikke ble sendt fra Neo. Der kan dere bruke svar-knapper, og
  lesebekreftelse med en frist.
- **Ikke gjør:** Ikke bruk en frittstående melding for å slippe tråd-reglene når søknaden har en dialog.
- **Hvorfor:** Søkeren skal finne alt om søknaden i én tråd. Lesebekreftelse uten frist stopper noden. Meldingstjenesten
  og avsenderen følger av integrasjonen, så flyten bærer ingen verdier som hører til én kunde.

## svarut-med-ekstern-referanse En forsendelse med SvarUt har alltid en ekstern referanse fra Neo

```yaml
id: svarut-med-ekstern-referanse
klasse: felle
gjelder: [SvarUtSend, SvarUtSend.eksternReferanse, SvarUtSend.mottakertype]
krever: [07-flyt.md#flyt-ekstern-id]
opphav: skrevet
```

- **Gjør:** Sett `eksternReferanse` til en nøkkel Neo eier (sakens id og dokumentets id). Bruk SvarUt for brev til
  mottakere som ikke har en dialog i Altinn, og velg `mottakertype` etter mottakeren.
- **Ikke gjør:** Ikke send med SvarUt uten ekstern referanse.
- **Hvorfor:** Sendingen prøves ikke på nytt. Får noden ikke svar i tide, slår den opp forsendelsen på den eksterne
  referansen; uten den vet ingen om brevet gikk ut, og et nytt forsøk kan sende det to ganger. Valgene som står tomme,
  får SvarUts standard.

## arkiv-fra-katalogen Ta i bruk katalogløsningen «Documaster», og fyll tabellene i kopien

```yaml
id: arkiv-fra-katalogen
klasse: valg
gjelder: [solution, stream, SlaOppITabell]
krever: [00-navn-pakking-og-versjoner.md#katalogen-tas-inn-med-en-pr, 05-felt-og-saksdata.md#losningens-data-i-saksdata, 09-maler.md#mal-dokumentfelt]
opphav: skrevet
```

- **Gjør:** Sett opp integrasjonen mot Documaster i Neo ([Documaster](../../../documaster/docs/documaster.md)), og ta i
  bruk katalogløsningen «Documaster» i sandkassen. Ta filene inn i `oppsett/` med en PR, og gjør resten i filene: velg
  integrasjonen i nodene, filtrer strømmen «Saker til
  arkivet» på sakstypene som skal arkiveres, fyll tabellen for arkivverdier (én rad per sakstype: arkivdel, klasse,
  administrativ enhet, skjerming), valgene i dokumentfeltet «Dokumenttype» og tabellen over dokumenttyper som arkiveres
  (journalposttype U, N eller X).
- **Ikke gjør:** Ikke bygg egne flyter for saksmappen, dokumentene og henvendelsene. Ikke legg arkivverdiene i en
  instruks.
- **Hvorfor:** Katalogløsningen oppretter saksmappen, journalfører dokumentene og henvendelsene som legges i saken, og avslutter
  saksmappen. En dokumenttype som ikke står i tabellen, arkiveres ikke. En instruks leses av agenten, ikke av flyten.
  Documaster er det eneste arkivet med en ferdig løsning.

## altinn-journalfores-i-inntaket En Altinn-innsending journalføres av flyten som tar den imot

```yaml
id: altinn-journalfores-i-inntaket
klasse: felle
gjelder: [AltinnHentArkivbytes, DocumasterOpprettJournalpost, DocumasterOpprettJournalpost.journalposttype, DocumasterOpprettDokument]
krever: [05-felt-og-saksdata.md#losningens-data-i-saksdata, altinn-inntak]
opphav: praksis
```

- **Gjør:** Journalfør søknaden, ettersendingen, klagen og rapporten i flyten som tar dem imot: inngående journalpost (I),
  innsendingens PDF som hoveddokument, hvert vedlegg som eget dokument, og søkeren som ekstern avsender (EA). Hent filene
  med «Hent arkivbytes».
- **Ikke gjør:** Ikke regn med at katalogløsningen journalfører Altinn-innsendinger.
- **Hvorfor:** Katalogløsningen journalfører det som legges i saken fra innboksen, og en Altinn-innsending går ikke dit.
  Uten et steg i inntaket står søknaden i saken, men ikke i arkivet. «Hent arkivbytes» gir innholdet slik det ble
  arkivert hos Altinn.

## en-som-oppretter-saksmappen Saksmappen har én flyt som oppretter den

```yaml
id: en-som-oppretter-saksmappen
klasse: felle
gjelder: [DocumasterOpprettSaksmappe, DocumasterFinnEksternId, stream]
krever: [neos-id-i-arkivet]
opphav: forslag
```

- **Gjør:** Bestem hvilken flyt som oppretter saksmappen for en sakstype: katalogflyten på «Sak opprettet», eller
  inntaket. Flyter som journalfører etterpå, leser saksmappen fra «Arkiv» og slår den opp i arkivet når den mangler.
- **Ikke gjør:** Ikke la både katalogflyten og inntaket opprette saksmappen for samme sak.
- **Hvorfor:** Neo holder ingen lås mellom oppslaget og opprettelsen. Starter to kjøringer samtidig, kan begge opprette en
  saksmappe, og neste kjøring stopper på to treff. Rekkefølgen er ikke målt.

## neos-id-i-arkivet Hvert objekt i arkivet bærer Neos id, og flyten slår opp på den før den oppretter

```yaml
id: neos-id-i-arkivet
klasse: felle
gjelder: [DocumasterOpprettSaksmappe.eksternID, DocumasterOpprettJournalpost.eksternID, DocumasterOpprettDokument.eksternID, DocumasterFinnEksternId]
krever: [07-flyt.md#flyt-ekstern-id]
opphav: skrevet
```

- **Gjør:** Gi saksmappen sakens id som ekstern id, og journalposter og dokumenter en nøkkel Neo eier. Kommer nøkkelen
  utenfra (en Altinn-instans, et vedlegg), sett sakens id foran: `<sakens id>/<kilde>`. Slå opp før hver opprettelse og
  forgren på antallet: 0 oppretter, 1 bruker det som finnes, flere stopper.
- **Ikke gjør:** Ikke bruk en verdi en ekstern part styrer, alene, som ekstern id.
- **Hvorfor:** Documaster håndhever ikke unikhet på ekstern id, og oppslaget går i hele arkivet. Opprett-nodene prøves
  ikke på nytt; det trygge nye forsøket er en ny kjøring, som da finner det som alt ble laget.

## utgaende-journalfores-for-sending Det som sendes med saksbehandlerens innhold, journalføres før det sendes

```yaml
id: utgaende-journalfores-for-sending
klasse: valg
gjelder: [DocumasterOpprettJournalpost, DocumasterAvskrivJournalpost, LagPdfFraTekst]
krever: [07-flyt.md#flyt-forvaltningshandling, 09-maler.md#brevet-er-beviset]
opphav: praksis
```

- **Gjør:** Journalfør vedtaket, forespørselen og meldinger med fritekst som utgående journalpost (U), med mottakeren som
  ekstern mottaker (EM), før meldingen sendes. En melding uten dokument blir PDF med «Lag PDF fra tekst». Avskriv de
  inngående journalpostene mot vedtaket, én per kjøring av noden, valgt på kolonnen «Kategori» i «Arkiv».
- **Ikke gjør:** Ikke journalfør faste kvitteringer uten saksbehandlerens innhold. Ikke velg journalposter å avskrive på
  tittelen.
- **Hvorfor:** Journalposten finnes da også om sendingen feiler. En fast kvittering bekrefter bare det som står i den
  inngående journalposten. Tittelen kan endres; kategorien er satt av flyten.

## avslutning-s-og-a Neo avslutter saksmappen med S; arkivet setter A

```yaml
id: avslutning-s-og-a
klasse: felle
gjelder: [DocumasterOpprettSaksmappe.saksstatus, DocumasterOppdaterEntitet, DocumasterFinnJournalposterIMappe]
krever: [02-status.md#kategori-med-vilje]
opphav: skrevet
```

- **Gjør:** La saksmappen få S når saken avsluttes i Neo. Sjekk at ingen journalposter står på R først.
- **Ikke gjør:** Ikke sett A fra Neo. Ikke flytt en journalpost bakover i status.
- **Hvorfor:** A settes av arkivet etter kvalitetskontrollen. Documaster godtar alle overganger, så flyten er det eneste
  som holder rekkefølgen.

## offentlig-journal-fra-arkivet Offentlig journal publiseres av arkivet; Neo sørger for at det som går inn, er riktig

```yaml
id: offentlig-journal-fra-arkivet
klasse: valg
gjelder: [DocumasterOpprettSaksmappe.skjerming, DocumasterOpprettJournalpost.skjerming, DocumasterOpprettJournalpost.offentligTittel]
krever: [arkiv-fra-katalogen]
opphav: forslag
```

- **Gjør:** La Documaster publisere til offentlig journal. Sett det publiseringen bygger på, når objektet opprettes:
  skjermingshjemmelen per sakstype i tabellen for arkivverdier, og journalposttypen per dokumenttype.
- **Ikke gjør:** Ikke bygg en egen publisering fra Neo. Ikke rett skjerming eller tittel i Documaster og regn med at Neo
  får vite det.
- **Hvorfor:** Offentlig journal og innsyn er arkivets ansvar. Det som er feil når det går inn, blir feil i journalen,
  og data går bare fra Neo til Documaster. Neo setter ingen skjerming eller offentlig tittel av seg selv. Når Documaster
  publiserer, er ikke målt.

## offentlig-tittel-uten-navn En sak om en person får en offentlig tittel uten personnavnet

```yaml
id: offentlig-tittel-uten-navn
klasse: felle
gjelder: [DocumasterOpprettSaksmappe.offentligTittel, DocumasterOpprettSaksmappe.tittel, CreateCase.title]
krever: [offentlig-journal-fra-arkivet]
opphav: praksis
```

- **Gjør:** Gi saksmappen en offentlig tittel uten personnavn når sakstittelen har det, og skjerm den. Søker en
  virksomhet, kan tittelen ha virksomhetens navn. Er søkeren en person eller et enkeltpersonforetak, hold navnet ute av
  sakstittelen eller sett en offentlig tittel.
- **Ikke gjør:** Ikke sett personnavn i sakstittelen på en sakstype som arkiveres uten skjerming.
- **Hvorfor:** Katalogflyten skriver sakens tittel til saksmappen hver gang den endres, og setter ingen offentlig tittel,
  så et navn i sakstittelen havner i tittelen arkivet publiserer. Sakstittelen settes i inntaket, så regelen må med der.

```yaml
DocumasterOpprettSaksmappe:
  tittel: "{{hent-sak:tittel}}"            # «Søknad om tilskudd: Kari Nordmann»
  offentligTittel: "Søknad om tilskudd"
  skjerming: "<kode for skjermingshjemmelen>"
  eksternID: "<sakens id>"
  eksterntSystem: Neo
```

## registre-skriver-pa-kontakten Registrene skriver på kontakten til parten, ikke i saksfelt

```yaml
id: registre-skriver-pa-kontakten
klasse: felle
gjelder: [OpprettKontakt, OpprettKontakt.hvisFinnes, LeggTilPart, OppslagEnhetsregisteret, OppdaterKontakt]
krever: [05-felt-og-saksdata.md#parten-er-sakspart]
opphav: skrevet
```

- **Gjør:** Finn eller opprett parten med «Opprett kontakt» (`hvisFinnes: brukEksisterende`) og «Legg til part». Hent
  fakta om en virksomhet med «Oppslag i Enhetsregisteret», og skriv dem på kontakten med «Oppdater kontakt». Skal en
  virksomhet under konkurs stoppes, la flyten forgrene på `enhet.konkurs`.
- **Ikke gjør:** Ikke kopier registerdata inn i saksfelt. Ikke bruk `opprettNy` for en søker som kan ha søkt før.
- **Hvorfor:** Samme faktum to steder glir fra hverandre. «Bruk den som finnes» kjenner igjen kontakten på
  fødselsnummer, organisasjonsnummer og e-post; «Opprett en ny» stopper når nummeret alt finnes. Oppslaget tar ikke med
  underenheter.

```yaml
OppslagEnhetsregisteret:
  orgnummer: "{{inntak-skjema:skjema.soker.orgnr}}"
# Betingelse etterpå: {{oppslag:enhet.konkurs}} er sann → Stopp med en melding til saksbehandleren
```

## registre-fra-katalogen Hvert register er sin egen katalogløsning

```yaml
id: registre-fra-katalogen
klasse: valg
gjelder: [solution, OppslagEnhetsregisteret, OppslagKrr, OppslagFolkeregister]
krever: [00-navn-pakking-og-versjoner.md#katalogen-tas-inn-med-en-pr]
opphav: skrevet
```

- **Gjør:** Ta i bruk katalogløsningene «Enhetsregisteret», «Kontakt- og reservasjonsregisteret» og «Folkeregisteret»
  i sandkassen, etter hva kunden trenger, og ta filene inn med en PR. Enhetsregisteret trenger ingen integrasjon: noden
  «Oppslag i Enhetsregisteret» kaller det åpne API-et. KRR krever kundens KRR-integrasjon med kundens Maskinporten-klient
  ([Kontakt- og reservasjonsregisteret](../../../krr/docs/krr.md)). Folkeregisteret krever kundens KS Fiks-integrasjon
  og kommunens Fiks-rolle i noden ([KS Fiks](../../../fiks/docs/fiks.md)). Integrasjonene settes opp i Neo.
- **Ikke gjør:** Ikke kopier registerflytene inn i filene til en løsning. Ikke regn med at en sending sjekker KRR av seg
  selv.
- **Hvorfor:** Hvert register er én felles flyt på kontakten, som alle løsningene bruker
  (`00-navn-pakking-og-versjoner.md#felles-er-en-fil`). KRR leses bare når en flyt gjør oppslaget.

## en-klient-mange-integrasjoner Integrasjonene velger Maskinporten-klienten, og hver node er bundet til én integrasjon

```yaml
id: en-klient-mange-integrasjoner
klasse: felle
gjelder: [workflow, AltinnSendMelding, DocumasterOpprettSaksmappe]
opphav: skrevet
```

- **Gjør:** Legg inn kundens Maskinporten-klienter i Neo, og la Altinn, KS Fiks og KRR velge hver sin
  ([Maskinporten](../../../maskinporten/docs/maskinporten.md)). Kjør «Hent status» på klienten eller «Verifiser» på integrasjonen
  etter at kunden har lagt til et scope. Bind hver Altinn- og Documaster-node til integrasjonen den skal bruke. Slett
  Altinn-abonnementene før integrasjonen fjernes.
- **Ikke gjør:** Ikke regn med at en node finner «den eneste» integrasjonen. Ikke fjern integrasjonen med abonnementene
  aktive.
- **Hvorfor:** En node uten binding feiler før kallet. Neo ber ikke om et scope Maskinporten har sagt nei til, så et nytt
  scope tas i bruk først etter neste «Hent status» eller «Verifiser». Abonnementene hører til integrasjonen og appen,
  lever videre hos Altinn og sender til en adresse som ikke finnes.

## postboks-felles-for-saksbehandlingen Saksbehandlingens e-post går inn og ut gjennom en felles postboks

```yaml
id: postboks-felles-for-saksbehandlingen
klasse: valg
krever: [10-skjema-og-innboks.md#innboks-for-det-ustrukturerte]
opphav: skrevet
```

- **Gjør:** Koble kundens felles postboks (postmottaket) til organisasjonen ([Exchange Online](../../../entra/docs/exchange.md)).
  La personlige postbokser være for det saksbehandleren selv eier.
- **Ikke gjør:** Ikke la henvendelser som hører til saksbehandlingen komme inn bare til en personlig postboks.
- **Hvorfor:** En henvendelse fra en personlig postboks ser bare eieren. Den felles postboksen er organisasjonens.
  Felles postbokser finnes bare for Microsoft 365.

## standard-avsender-for-forste-utsending Slå på «Kan sende» og velg standard avsender før noe sendes

```yaml
id: standard-avsender-for-forste-utsending
klasse: felle
gjelder: [EmailNotification, EmailNotification.sender]
krever: [postboks-felles-for-saksbehandlingen, 07-flyt.md#flyt-epost-ut-fra-postboksen]
opphav: skrevet
```

- **Gjør:** Sørg for at kunden har gitt Neo rett til å sende fra de felles postboksene, og bare dem
  ([Exchange Online](../../../entra/docs/exchange.md)). Slå på «Kan sende» på postboksen, og velg den som standard avsender,
  før den første flyten med «E-post» og før saker tildeles.
- **Ikke gjør:** Ikke slå av «Kan sende» på standard avsender uten å velge en ny.
- **Hvorfor:** Det finnes ingen reserveavsender. Uten standard avsender stopper e-post med standard avsender, og alle
  tildelingsvarslene. Slås «Kan sende» av, er postboksen ikke lenger standard avsender.

## postboks-med-samme-adresse En postboks en flyt sender fra, må finnes med samme adresse hos kunden

```yaml
id: postboks-med-samme-adresse
klasse: felle
gjelder: [EmailNotification.sender]
krever: [00-navn-pakking-og-versjoner.md#oppsettet-har-det-flyten-peker-pa]
opphav: skrevet
```

- **Gjør:** Bruk standard avsender i noden når det går. Sender en flyt fra en bestemt postboks, koble en postboks med
  samme adresse i sandkassen og i produksjonen.
- **Ikke gjør:** Ikke pek på en postboks som bare finnes hos partneren.
- **Hvorfor:** Ved promoteringen slås postboksen opp på adressen. Finnes den ikke, står det som et gap.

## kartkilder-bare-det-som-brukes Slå på bare kartkildene sakstypene og flytene bruker

```yaml
id: kartkilder-bare-det-som-brukes
klasse: valg
gjelder: [caseType.geoLayers, GeoSokKartlag, GeoSokKartlag.sourceId]
krever: [01-sakstype.md#kartlag-med-et-sporsmal, 07-flyt.md#flyt-kartoppslag-i-saksdata]
opphav: forslag
```

- **Gjør:** Slå på kildene kartlagene og geooppslagene bruker, og la resten stå av. Vil dere endre en felles kilde, lag en
  kopi og endre kopien. Lag en egen kilde for kundens egne kartdata, og prøv den før den lagres.
- **Ikke gjør:** Ikke slå av en kilde et kartlag eller en flyt bruker. Ikke del en egen kilde med alle uten at kunden har
  bestemt det. Ikke tilpass kilden med egen tittel på valget.
- **Hvorfor:** Hvilke kilder som er på, gjelder bare organisasjonen. Egen tittel og eget oppsett på valget er merket som
  ubrukt, selv om tittelen vises; tilpasningen hører til kopien. En egen kilde er privat til den deles.
