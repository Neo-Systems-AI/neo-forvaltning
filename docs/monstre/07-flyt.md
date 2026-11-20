# Flyt og hendelser

Flyten (`workflow`) er automatiseringen i saksbehandlingen: det som kan gjøres likt hver gang, gjort av noder som er koblet etter hverandre.
Reglene er delt i familier etter hva nodene gjør: hele flyten, inn (utløserne), sak, saksdata og kart, beregning,
oppgave, dokument, utsending, Altinn, arkiv, venting og logikk, og hendelser og strømmer. Innstillingene der Neos
standard holder, har ingen regel.

Hvordan arbeidet deles mellom flyt, agent og saksbehandler, står i `08-instrukser.md#instruks-bare-skjonn`.

## Hva starter flyten

| Situasjonen | Utløseren |
|---|---|
| Saksbehandleren bestemmer, og skal se resultatet med en gang (vedtak, forespørsel, et oppslag hun venter på) | En handling på objektet arbeidet gjelder (`flyt-handling-pa-objektet`, `flyt-forvaltningshandling`) |
| Saksbehandleren må velge noe flyten skal forgrene på (utfallet) | En handling med et skjema (`flyt-valg-med-skjema`) |
| Noe har skjedd, og resten kan gå i bakgrunnen (innkommende post, en hendelse fra en annen flyt) | «Hendelse mottatt» på en strøm (`flyt-epost-inn-er-en-hendelse`, `flyt-hendelse-er-ikke-straks`) |
| Flyten trenger et svar fra et menneske midt i kjøringen | Et skjema-steg tildelt en rolle (`flyt-skjemasteg-til-rolle`) |

## Når flyten møter det som alt finnes

En flyt kjøres mer enn én gang på samme sak. Før den oppretter noe, slår den opp det som finnes, og forgrener på antallet.

| Det flyten lager | Slå opp med | Regelen |
|---|---|---|
| Saksdata | «Hent saksdata» på malen | `flyt-saksdata-adresse` |
| Oppgave | «Hent oppgaver» på malen | `flyt-oppgaven-finnes` |
| Kontakt | «Opprett kontakt» med «Bruk den som finnes» | `flyt-kontakt-bruk-den-som-finnes` |
| Kartlag | «Hent kartvisning» | `flyt-kartoppslag-i-saksdata` |
| Noe i arkivet | Oppslag på ekstern id | `flyt-ekstern-id` |
| Et kall til et annet system | En nøkkel mottakeren kjenner igjen | `flyt-http-taaler-gjentak` |

---

## Hele flyten

## flyt-parametrene Flyten eier de operative parametrene

```yaml
id: flyt-parametrene
klasse: valg
gjelder: [workflow, workflow.definition, Vent.varighet, GeoLagSone.meter, Iterator.antall]
krever: [06-oppgaver.md#oppgave-hva-og-hvor]
opphav: skrevet
```

- **Gjør:** Legg tall som styrer et oppslag eller en beregning (søkeradius, antall runder, ventetid, antall desimaler) i
  noden som bruker dem, og skriv i flytens beskrivelse hvorfor tallet er valgt.
- **Ikke gjør:** Ikke skriv dem i oppgavene eller i behandlingsregelen som om de var regler.
- **Hvorfor:** Parameteren er det flyten bruker. Står den to steder, er den ene feil første gang noen endrer den.

## flyt-en-node-en-effekt Hver node gjør én ting, og det flyten skal velge mellom, er synlige steg

```yaml
id: flyt-en-node-en-effekt
klasse: standard
gjelder: [HentSaksdata, HentOppgaver, Condition, CreateCaseData, OppdaterSaksdata, CreateTask, UpdateTask, Stopp]
opphav: skrevet
```

- **Gjør:** Bygg «Hent → Betingelse → Opprett / Oppdater / Stopp». Hent gir en liste og `antall`; flyten forgrener på
  `0`, `1` og flere.
- **Ikke gjør:** Ikke se etter en node som «finner eller oppretter». Ikke bruk indeks 0 uten en betingelse på «nøyaktig
  én» foran.
- **Hvorfor:** Opprett oppretter alltid, Oppdater virker på én id, og Hent og Finn skriver aldri. Det flyten gjør, står i
  flyten og ikke i en skjult regel i noden, og flertreff velges aldri implisitt.

```yaml
- node: HentSaksdata          # filtrert på malen «Tilskuddsvurdering»
- node: Condition             # antall = 0?
  ja:  CreateCaseData         # fra malen
  nei:
    - node: Condition         # antall = 1?
      ja:  OppdaterSaksdata   # caseDataId = saksdata.0.caseDataId
      nei: Stopp              # "Saken har flere tilskuddsvurderinger. Slett den som ikke gjelder."
```

## flyt-stopp-med-melding Flertreff og brutte forutsetninger stopper flyten med en melding saksbehandleren forstår

```yaml
id: flyt-stopp-med-melding
klasse: valg
gjelder: [Stopp, Stopp.melding, Condition, SwitchRouter]
krever: [07-flyt.md#flyt-en-node-en-effekt]
opphav: skrevet
```

- **Gjør:** Skriv meldingen som en beskjed: hva som er galt, og hva saksbehandleren gjør.
- **Ikke gjør:** Ikke la flyten gå videre med «den første». Ikke la et uventet utfall gå en stille vei.
- **Hvorfor:** «Stopp» avslutter kjøringen som mislykket og viser meldingen til den som startet handlingen. Et synlig
  stopp kan rettes; en stille feil oppdages først når noen leser saken.

## flyt-identitet-er-id Flyten peker på oppsettet og objektene med id, aldri med navn

```yaml
id: flyt-identitet-er-id
klasse: felle
gjelder: [SetCaseStatus.statusOptionId, CreateTask.taskTemplateId, HentOppgaver.taskTemplateId, HentSaksdata.caseDataTemplateId, SettTagg.taggIder, SetTaskStatus.statusOptionId, SetDocumentStatus.statusOptionId, ObjectAction.taskTemplateIds]
opphav: skrevet
```

- **Gjør:** Velg status, oppgavemal, saksdatamal, tagg og skjema i nodene. Ta et objekts id fra utløseren, fra Hent eller
  fra Opprett.
- **Ikke gjør:** Ikke finn noe på tittel, etikett eller visningsnavn, heller ikke en oppgave på tittelen eller en
  saksdata på overskriften.
- **Hvorfor:** Id-en til oppsettet skrives om ved deploy og følger med til en ny organisasjon. Et navn kan endres og er
  ikke unikt. Hent-nodene filtrerer derfor bare på mal og id.

## flyt-en-per-sakstype Lag flyten for én sakstype; del den bare når flere sakstyper trenger nøyaktig det samme

```yaml
id: flyt-en-per-sakstype
klasse: felle
gjelder: [SetCaseStatus.statusOptionId, FinnSteg, FinnSteg.stegNavn, ObjectAction.caseTypeIds]
krever: [07-flyt.md#flyt-identitet-er-id]
opphav: skrevet
```

- **Gjør:** Bind flyten til sakstypen den gjelder, og velg steget direkte i «Sett saksstatus». Deler flere sakstyper
  flyten, bruk «Finn steg» med stegets navn, en betingelse på `finnes`, og «Stopp» når steget mangler.
- **Ikke gjør:** Ikke lim inn en steg-id fra én sakstype i en flyt som kjører på en annen.
- **Hvorfor:** Et steg er én rad per sakstype, og «Sett saksstatus» avviser et steg fra en annen sakstype. «Finn steg»
  stopper når sakstypen har to steg med navnet.

## flyt-aktivering Flyten er et utkast til noen aktiverer den, og gapene stopper aktiveringen

```yaml
id: flyt-aktivering
klasse: felle
gjelder: [workflow, AssignCase.assignedToId, EmailNotification.sender, SkrivHendelse.hendelsestype]
krever: [14-tilgang.md#jobbroller-etter-jobben]
opphav: praksis
sjekkes: maskinelt
```

- **Gjør:** Les gapene før du aktiverer, og løs dem i noden de peker på. La en person med rett til å endre saker
  aktivere flyter som skriver i saken.
- **Ikke gjør:** Ikke aktiver en flyt med åpne gap for å se hva som skjer.
- **Hvorfor:** En flyt som er deployet, lander som utkast. En peker deploy ikke kan skrive om (et medlem i «Tildel sak»,
  avsenderpostboksen, en status, en sakstype eller en hendelsestype mottakeren ikke har), står igjen som et gap som
  blokkerer aktiveringen. En flyt som starter av en hendelse, en webhook eller et skjema, har ingen bak seg: hjemmelen
  til å skrive i saken er den som aktiverte den.

## flyt-flomvern Endre grensen for flomvernet bare når du vet at volumet er ventet

```yaml
id: flyt-flomvern
klasse: standard
gjelder: [workflow.floodLimit]
opphav: forslag
```

- **Gjør:** La standarden stå (100 starter per 5 minutter). Venter du en topp, for eksempel mange søknader rett før en
  søknadsfrist, regn ut hvor mange starter flyten får, og sett grensen for den flyten.
- **Ikke gjør:** Ikke skru grensen høyt for å slippe å tenke på det.
- **Hvorfor:** Flomvernet holder tilbake starter over grensen (`HELD`) til et menneske kjører eller forkaster dem. Det er
  vernet mot løkker Neo ikke oppdager. En ventet topp skal ikke stanse inntaket.

## flyt-ikke-start-seg-selv En flyt skal ikke kunne starte seg selv gjennom flere ledd

```yaml
id: flyt-ikke-start-seg-selv
klasse: felle
gjelder: [SettTagg, SkrivHendelse, EventReceived, HttpRequest, WebhookReceived]
krever: [07-flyt.md#flyt-flomvern]
opphav: skrevet
```

- **Gjør:** Gi taggen eller hendelsen flyten skriver, et annet navn enn den flyten lytter på. Ved overføring: én tagg
  som starter, en annen som sier at den er overført.
- **Ikke gjør:** Ikke stol på at Neo oppdager løkker gjennom flere flyter, webhooker eller andre systemer.
- **Hvorfor:** Løkkesperren stopper bare at en flyt startes av en hendelse dens egen kjøring skrev. Løkker gjennom flere
  ledd fanges først av flomvernet, og da står kjøringene og venter på et menneske.

---

## Inn: utløserne

## flyt-handling-pa-objektet Heng handlingen på objektet arbeidet gjelder, og gi den et navn som sier hva den gjør

```yaml
id: flyt-handling-pa-objektet
klasse: valg
gjelder: [ObjectAction, ObjectAction.objectType, ObjectAction.label, ObjectAction.caseTypeIds, ObjectAction.taskTemplateIds, ObjectAction.itemKinds, ObjectAction.emailDirections, ObjectAction.contactTypes]
opphav: praksis
```

- **Gjør:** Velg objekttypen (sak, oppgave, dokument, fil eller e-post, kontakt) der saksbehandleren står når hen
  trenger handlingen. Avgrens med sakstype, oppgavemal, filtype og retning. Skriv etiketten som en handling i
  saksbehandlerens ord («Be om ettersending», «Registrer vedtaket og send det til søkeren»).
- **Ikke gjør:** Ikke legg alle handlinger på saken. Ikke bruk flytens tekniske navn som etikett.
- **Hvorfor:** Etiketten er det saksbehandleren leser i menyen. En handling avgrenset til en oppgavemal vises bare på
  oppgaver fra den malen, aldri på en håndlaget oppgave.

```yaml
trigger: ObjectAction
objectType: document
label: "Send tilsagnsbrevet til søkeren"
caseTypeIds: [<tilskuddssøknad>]
```

## flyt-handling-leser-objektet Handlingen gir bare id-en; flyten leser objektet med Hent

```yaml
id: flyt-handling-leser-objektet
klasse: standard
gjelder: [ObjectAction, HentSak, HentOppgave, HentDokument, HentKontakt]
opphav: skrevet
```

- **Gjør:** Start med Hent-noden for objekttypen: «Hent sak», «Hent oppgave», «Hent dokument» (`document` eller `item`),
  «Hent kontakt».
- **Ikke gjør:** Ikke forvent feltene, statusen eller navnet i utløseren.
- **Hvorfor:** Utløseren bærer `trigger.<objekt>.id` og `trigger.case.id`, ikke mer. Da leses et felt ett sted og på
  samme måte, uansett hvordan flyten startet.

## flyt-valg-med-skjema Når mennesket må velge, spør handlingen med et skjema og flyten har én vei per svar

```yaml
id: flyt-valg-med-skjema
klasse: valg
gjelder: [ObjectAction.formId, ObjectAction.formVersionId, SwitchRouter, SetCaseStatus, SetCaseFieldValue]
krever: [07-flyt.md#flyt-rutevelger-uten-ellers, 05-felt-og-saksdata.md#utfall-som-felt, 10-skjema-og-innboks.md#neo-skjema-er-intern-inngang]
opphav: praksis
```

- **Gjør:** Knytt et skjema til handlingen når saksbehandleren må velge noe (utfallet av et vedtak). Gi valget et
  RadioGroup-felt med akkurat de faste valgene, og la «Rutevelger» ha én vei per svar. Sett status og utfallsfelt i
  samme vei.
- **Ikke gjør:** Ikke bruk fritekst for et valg flyten skal forgrene på. Ikke lag én handling per utfall.
- **Hvorfor:** Svaret sjekkes mot skjemaversjonen før flyten starter. Status og utfall settes av samme valg, så de aldri
  spriker.

```yaml
trigger: ObjectAction
objectType: document
label: "Registrer vedtaket og send det til søkeren"
formId: <skjemaet «Utfall»>          # RadioGroup: innvilget / delvis innvilget / avslått
formVersionId: <revisjonen>
# Rutevelger: innvilget → …, delvis innvilget → …, avslått → …  (ingen ellers)
```

## flyt-forvaltningshandling Forvaltningshandlinger startes av et menneske

```yaml
id: flyt-forvaltningshandling
klasse: valg
gjelder: [ObjectAction, LagPdfFraSaksdokument, AltinnSendMelding, SvarUtSend, EmailNotification]
krever: [09-maler.md#mal-fryses-ved-utsending]
opphav: praksis
```

- **Gjør:** La vedtak, foreløpig svar og forespørsler til parten gå ut fra en handling saksbehandleren trykker på.
  Flyten gjør resten: PDF, utsending, arkiv, status og neste oppgaver.
- **Ikke gjør:** Ikke send et vedtak eller et foreløpig svar fra en hendelse eller etter en «Vent».
- **Hvorfor:** Det er saksbehandleren som fatter vedtaket og står for det som sendes til parten. Flyten utfører det
  mennesket har bestemt.

## flyt-skjemasteg-til-rolle Skjema-steget i en flyt tildeles en rolle, ikke en person

```yaml
id: flyt-skjemasteg-til-rolle
klasse: felle
gjelder: [FormSubmission, FormSubmission.assignee, FormSubmission.deadline]
krever: [14-tilgang.md#jobbroller-etter-jobben]
opphav: skrevet
```

- **Gjør:** Når flyten skal spørre et menneske midt i kjøringen, tildel skjema-steget en rolle, eller en person fra en
  variabel (den som startet handlingen). Gi steget en frist når svaret har en frist.
- **Ikke gjør:** Ikke velg en bestemt person i et oppsett som skal deployes.
- **Hvorfor:** Et medlem er ikke oppsett. Ved deploy tømmes personen på skjema-steget uten gap, og steget står uten
  mottaker. En rolle lagres som nøkkel og følger med. Kjøringen står «Venter» til skjemaet er sendt inn, uten å holde
  plass i organisasjonens tak.

## flyt-epost-inn-er-en-hendelse Start en flyt på innkommende post med «Hendelse mottatt» på `inbox_item.created`

```yaml
id: flyt-epost-inn-er-en-hendelse
klasse: felle
gjelder: [EmailReceived, EventReceived, EventReceived.streamId, FetchInboxItem, stream.eventTypes.eventType, stream.eventTypes.filters]
krever: [10-skjema-og-innboks.md#innboks-for-det-ustrukturerte]
opphav: skrevet
```

- **Gjør:** La en strøm lytte på `inbox_item.created`, filtrer på kanalen (`provider`) eller postboksen, og start flyten
  med «Hendelse mottatt». Les henvendelsen med «Hent henvendelse».
- **Ikke gjør:** Ikke bruk utløseren «E-post mottatt» (`EmailReceived`).
- **Hvorfor:** Hendelsen skrives når henvendelsen er komplett med vedleggene, likt for e-post, SvarInn og flytkanalen,
  og ikke for e-post Neo selv sender. «E-post mottatt» står i editoren, men ingenting starter den.

```yaml
stream:
  name: Svar fra SvarInn
  eventTypes:
    - eventType: inbox_item.created
      filters: { provider: SVARINN }
workflow:
  trigger: EventReceived
  steps: [FetchInboxItem, Condition, AddInboxEmailToCase]
```

## flyt-hendelsen-gir-id En flyt på en hendelse leser detaljene selv

```yaml
id: flyt-hendelsen-gir-id
klasse: standard
gjelder: [EventReceived, HentSak, HentDokument, FetchInboxItem]
opphav: skrevet
```

- **Gjør:** Bruk id-en og de få feltene hendelsen har. Les resten med en Hent-node.
- **Ikke gjør:** Ikke be om at hendelsen skal bære flere felt.
- **Hvorfor:** Neos hendelser bærer id-er for ruting og filtrering, ikke raden. En kopi av raden i hendelsen ville glidd
  fra objektet.

## flyt-hendelse-er-ikke-straks En flyt på en hendelse starter innen et minutt, ikke straks

```yaml
id: flyt-hendelse-er-ikke-straks
klasse: valg
gjelder: [EventReceived, ObjectAction, stream]
opphav: skrevet
```

- **Gjør:** Bruk en handling når saksbehandleren skal se resultatet med en gang. Bruk en hendelse for det som kan skje i
  bakgrunnen.
- **Ikke gjør:** Ikke bygg et steg der saksbehandleren venter på en flyt som er startet av en hendelse.
- **Hvorfor:** Hendelsene plukkes opp av en tidsplan hvert minutt og leveres derfra.

---

## Sak: felt, parter og tildeling

## flyt-felt-uten-verdi Velg hva en skriving gjør når variabelen ikke har noen verdi

```yaml
id: flyt-felt-uten-verdi
klasse: valg
gjelder: [SetCaseFieldValue, SetCaseFieldValue.customFields, SetTaskFieldValue, SetDocumentFieldValue, CreateCase, CreateCase.hoppOverUtenVerdi]
opphav: skrevet
```

- **Gjør:** La «Stopp flyten» stå når feltet alltid skal ha en verdi. Velg «Hopp over» når verdien er valgfri og det som
  står, skal stå. Velg «Tøm feltet» når en ny kjøring uten verdi betyr at den gamle ikke gjelder lenger (et nytt oppslag
  som ikke var entydig).
- **Ikke gjør:** Ikke velg «Hopp over» på et oppslag som kan kjøres på nytt; da står det gamle svaret som om det gjaldt.
- **Hvorfor:** Standarden stopper flyten, så et felt som ikke løste, aldri blir en stille tom verdi. «Opprett sak» har
  bare stopp og hopp over, fordi det ikke finnes noe å tømme.

## flyt-kontakt-bruk-den-som-finnes Et inntak lager kontakten med «Bruk den som finnes» og forgrener på flere treff

```yaml
id: flyt-kontakt-bruk-den-som-finnes
klasse: felle
gjelder: [OpprettKontakt, OpprettKontakt.hvisFinnes, LeggTilPart, LeggTilPart.rolle, OppdaterKontakt]
krever: [07-flyt.md#flyt-en-node-en-effekt, 05-felt-og-saksdata.md#parten-er-sakspart]
opphav: skrevet
```

- **Gjør:** Sett «Hvis kontakten finnes» til «Bruk den som finnes». Har kontaktdataene e-post, sett en betingelse på
  `flereTreff` og stopp med en melding. Legg så til parten med `contactId` og rollen. Skriv adressen for utsending bare
  når `harAdresseForUtsending` er nei.
- **Ikke gjør:** Ikke la standarden «Opprett en ny» stå i et inntak.
- **Hvorfor:** «Opprett en ny» stopper med 409 når organisasjonen alt har fødsels- eller organisasjonsnummeret, altså
  andre gang samme søker sender noe. «Bruk den som finnes» kjenner igjen kontakten på nummeret, ellers e-posten, og
  endrer den ikke. E-post er ikke unik, og noden velger aldri blant flere.

## flyt-tildeling-fra-variabel Tildel saken og oppgaven fra en variabel, ikke et fast medlem

```yaml
id: flyt-tildeling-fra-variabel
klasse: felle
gjelder: [AssignCase, AssignCase.assignedToId, UpdateTask.responsibleMemberId, TildelHenvendelse, TildelHenvendelse.assignedToId]
krever: [07-flyt.md#flyt-aktivering]
opphav: skrevet
```

- **Gjør:** Ta medlemmet fra utløseren (den som startet handlingen), fra «Hent sak» eller fra et skjemasvar.
- **Ikke gjør:** Ikke velg en bestemt person i en flyt som skal deployes.
- **Hvorfor:** Et medlem finnes bare i én organisasjon. Ved deploy står id-en igjen som et gap som blokkerer
  aktiveringen, fordi en tom verdi i disse nodene betyr «fjern tildelingen».

---

## Saksdata og kart

## flyt-saksdata-adresse Malen er adressen: flyten skriver i saksdata den har pekt ut på mal og id

```yaml
id: flyt-saksdata-adresse
klasse: felle
gjelder: [HentSaksdata, HentSaksdata.caseDataTemplateId, HentSaksdata.radfilter, CreateCaseData, CreateCaseData.caseDataTemplateId, OppdaterSaksdata, OppdaterSaksdata.caseDataId, SetGlobalVariable]
krever: [07-flyt.md#flyt-en-node-en-effekt, 05-felt-og-saksdata.md#ikke-en-logg]
opphav: skrevet
```

- **Gjør:** Lag en saksdatamal for alt en flyt skal skrive i. Hent saksdataen fra malen, opprett den fra malen når saken
  ikke har den, og oppdater den på `caseDataId` ellers. En rad i en tabell finnes med radfilteret og oppdateres på
  `radId`. Skal skrivingen skje etter et kall til et annet system, pek ut saksdataen før kallet og bær id-en i en global
  variabel.
- **Ikke gjør:** Ikke la flyten opprette et nytt datasett hver gang den kjører. Ikke skriv kvitteringer for kjøringer i
  saksdata.
- **Hvorfor:** «Opprett saksdata» lager alltid en ny, og den har ett forsøk. Kjøres flyten på nytt, skal den skrive om
  det samme datasettet. Pekes saksdataen ut før kallet, stopper flertreff flyten før noe er skrevet i det andre
  systemet.

## flyt-oppdater-saksdata-fyll Oppdater saksdata med «Fyll felter», ikke ved å erstatte innholdet

```yaml
id: flyt-oppdater-saksdata-fyll
klasse: felle
gjelder: [OppdaterSaksdata.mode, OppdaterSaksdata.feltVerdier, OppdaterSaksdata.tabellRader, OppdaterSaksdata.oppdaterRader]
krever: [07-flyt.md#flyt-saksdata-adresse]
opphav: skrevet
```

- **Gjør:** Bruk modusen «Fyll felter» (`fyll`) og fyll bare feltene og radene flyten eier. Bruk `uendret` når bare
  overskriften eller låsen skal endres.
- **Ikke gjør:** Ikke bruk blokker, JSON eller skjema (`builder`, `json`, `form`) på en saksdata et menneske også skriver
  i.
- **Hvorfor:** De tre erstatter hele innholdet, også det saksbehandleren har skrevet. «Fyll felter» rører ikke det steget
  ikke setter. Legger noden til rader, har den ett forsøk, fordi et nytt forsøk legger raden til en gang til.

## flyt-kartoppslag-i-saksdata Et kartoppslag skriver hva det søkte i og hva det fant, også det som ikke traff

```yaml
id: flyt-kartoppslag-i-saksdata
klasse: valg
gjelder: [GeoLagSone, GeoSokKartlag, GeoSokKartlag.kildefeilSomUtfall, GeoSokKartlag.maksTreff, HentKartvisning, OpprettKartlag, TomKartlag, FjernKartlag, LeggTilKartobjekt]
krever: [07-flyt.md#flyt-saksdata-adresse, 01-sakstype.md#kartlag-med-et-sporsmal, 05-felt-og-saksdata.md#flere-rader-er-saksdata]
opphav: praksis
```

- **Gjør:** Slå opp innenfor en sone flyten lager, og skriv hvert oppslag som en rad i saksdata: hensynet, kilden, sonen
  og resultatet, også oppslagene uten treff. Sett «Kildefeil som utfall» når et oppslag som feilet, skal skrives som en
  rad og ikke stoppe flyten. Skriv `totaltFunnet` når `harMer` er ja. Finn laget fra forrige kjøring med «Hent
  kartvisning» før du lager et nytt.
- **Ikke gjør:** Ikke la kartet alene være dokumentasjonen av oppslaget. Ikke opprett et nytt lag ved hver kjøring.
- **Hvorfor:** Et oppslag uten treff er også et resultat, og det skal kunne etterprøves. Kilden gir høyst 20 treff per
  kall. «Opprett kartlag» oppretter alltid, så uten oppslaget først får saken et nytt lag hver gang.

Eksempel: En søknad om tiltak i utmark skal sjekkes mot verneområder og kulturminner innenfor 500 meter. Flyten lager
sonen, slår opp i hvert kartlag og skriver én rad per oppslag i tabellen `oppslag` i saksgrunnlaget, også «ingen
treff». Kartlagene på sakstypen viser det samme på kartet. Registeroppslag om parten (Enhetsregisteret, konkurs,
reservasjon) skrives på kontakten, ikke i saksdata (`05-felt-og-saksdata.md#kontaktfelt-for-det-som-gjelder-parten`).
Saksbehandleren vurderer hva funnene betyr; agenten kan skrive en vurdering av dem i en egen mal.

```yaml
- type: table
  key: oppslag
  columns:
    - { key: hensyn,   label: Hensyn,   type: text }    # verneområde, kulturminne
    - { key: kilde,    label: Kilde,    type: text }
    - { key: sone,     label: Sone,     type: text }    # 500 m rundt tiltaket
    - { key: resultat, label: Resultat, type: text }    # treffene, eller «ingen treff»
  rows: []
```

---

## Beregning

## flyt-regn-ut En flyt regner ut summer og andeler med «Regn ut», men lager ikke relasjoner mellom saker

```yaml
id: flyt-regn-ut
klasse: valg
gjelder: [RegnUt, HentSaksdata, SetCaseFieldValue, GeoBeregnAvstand]
krever: [05-felt-og-saksdata.md#felt-fodes-fra-saksdata, 04-relasjoner.md#relasjoner-lages-av-mennesker]
opphav: skrevet
```

- **Gjør:** Når et felt er en beregning av tall i saken (poengsummen fra kriterietabellen, utbetalt hittil, resten av
  tilsagnet, andelen egenfinansiering), regn det ut i flyten med «Regn ut» og sett feltet med «Sett saksfelt» fra
  `resultat`. Velg operasjonen: sum (av verdier, en liste eller en kolonne i en tabell i saksdata), differanse, prosent
  av, eller andel i prosent. Hent saksdataen med «Hent saksdata» først, og pek ut tabellen og kolonnen med nøklene. Sett
  antall desimaler. Bruk `visning` (med tusenskille) i brev og meldinger, og `resultat` når det regnes videre. Summer
  over mange saker i Innsikt. Skal saker knyttes sammen, la agenten foreslå relasjonen med en relasjonsinstruks, eller la
  et menneske lage den.
- **Ikke gjør:** Ikke be agenten eller saksbehandleren regne ut en sum flyten kan regne fra tabellen. Ikke la flyten
  regne på en tabell som kan være tom, uten en betingelse foran. Ikke bygg en flyt som skal knytte en søknad til runden
  sin.
- **Hvorfor:** Regnet av flyten er summen alltid lik radene den bygger på. «Regn ut» stopper med en melding som navngir
  verdien når en verdi mangler, ikke er et tall, lista er tom eller det deles på null; ingenting regnes som 0.
  Differanse, prosent av og andel tar nøyaktig to verdier. Ingen node lager en relasjon mellom saker, så et felt eller
  et steg som venter på at en flyt skal gjøre det, blir aldri satt.

```yaml
# Eksempel, tilskudd: utbetalt hittil og resten av tilsagnet, etter hver utbetaling
- node: HentSaksdata                 # malen «Utbetalinger — tilskudd»
- node: RegnUt                       # id: utbetalt
  operasjon: sum
  verdier: [{ kilde: "{{hent-saksdata:saksdata.0}}", tabell: utbetalinger, kolonne: belop }]
  desimaler: 0
- node: RegnUt                       # id: rest
  operasjon: differanse
  verdier: [{ kilde: "{{hent-sak:felt.tsk_innvilget_belop}}" }, { kilde: "{{utbetalt:resultat}}" }]
  desimaler: 0
- node: SetCaseFieldValue            # tsk_utbetalt = {{utbetalt:resultat}}, tsk_rest = {{rest:resultat}}
```

---

## Oppgave

## flyt-oppgaven-finnes Bestem hva flyten gjør når saken alt har oppgaven

```yaml
id: flyt-oppgaven-finnes
klasse: valg
gjelder: [HentOppgaver, HentOppgaver.tilstand, HentOppgaver.lenketTilDokumentId, CreateTask, UpdateTask, SetTaskStatus, Iterator]
krever: [07-flyt.md#flyt-en-node-en-effekt, 06-oppgaver.md#oppgave-ved-hendelse]
opphav: skrevet
```

- **Gjør:** Hent oppgavene fra malen (alle, eller bare åpne) og velg ett av fire: stopp (saken skal ha én), gå videre
  (den som står, holder), oppdater den ene, eller lukk alle åpne og lag en ny. Skriv begrunnelsen på grenen.
- **Ikke gjør:** Ikke opprett blindt en oppgave hver gang flyten kjører.
- **Hvorfor:** En flyt kjøres mer enn én gang på samme sak: en ny ettersending, et omgjort vedtak, et nytt trykk.
  «Opprett oppgave» oppretter alltid og har ett forsøk.

## flyt-oppgave-fra-malen Flyten lager oppgaven fra en mal sakstypen har, og setter fristen i samme steg

```yaml
id: flyt-oppgave-fra-malen
klasse: felle
gjelder: [CreateTask, CreateTask.taskTemplateId, CreateTask.dueDate, CreateTask.documentId, caseType.taskTemplateSets]
krever: [06-oppgaver.md#oppgave-ved-hendelse, 06-oppgaver.md#oppgave-ett-sett-per-sakstype]
opphav: skrevet
```

- **Gjør:** Velg en toppnivå-mal fra et sett sakstypen har. Skal fristen følge en dato i saken, sett den i «Opprett
  oppgave» (`dueDate`). Gjelder oppgaven et dokument, lenk det med `documentId`.
- **Ikke gjør:** Ikke velg en deloppgave-mal, en mal fra et sett sakstypen ikke har, eller en mal som er betinget på en
  variant saken ikke har.
- **Hvorfor:** Alle tre stopper kjøringen. Malens frist regnes fra da flyten lager oppgaven, og en frist flyten setter,
  går foran malens. Deloppgavene kommer med forelderen.

## flyt-ventestatus Saken går tilbake fra ventestatus først når ingen forespørsel står ute

```yaml
id: flyt-ventestatus
klasse: valg
gjelder: [HentOppgaver, HentOppgaver.tilstand, SetTaskStatus, SetTaskStatus.statusOptionId, SetCaseStatus]
krever: [02-status.md#en-ventestatus, 06-oppgaver.md#oppgave-venter]
opphav: praksis
```

- **Gjør:** Når svaret kommer, kvitter ut venteoppgaven det svarer på med «Sett oppgavestatus» til en ferdig-status.
  Hent så de åpne venteoppgavene, og sett saken tilbake til behandling bare når `antall` er 0.
- **Ikke gjør:** Ikke sett saken tilbake til behandling bare fordi ett svar kom.
- **Hvorfor:** Saken kan vente på flere ting samtidig, for eksempel en ettersending fra søkeren og en uttalelse fra en
  annen instans. En oppgave er åpen til statusen ligger i en `COMPLETED`-gruppe.

---

## Dokument

## flyt-pdf-krever-alle-flettefelt La «Krev at alle flettefelt er løst» stå på for det som sendes ut

```yaml
id: flyt-pdf-krever-alle-flettefelt
klasse: felle
gjelder: [LagPdfFraSaksdokument, LagPdfFraSaksdokument.krevAlleFeltLost, LagPdfFraSaksdokument.versjon]
krever: [09-maler.md#mal-fryses-ved-utsending]
opphav: skrevet
```

- **Gjør:** La standarden stå på for alt som går til en part eller et arkiv. Er dokumentet godkjent som en bestemt
  versjon, gi noden versjonen, så PDF-en lages av den.
- **Ikke gjør:** Ikke slå den av for å få en sending gjennom.
- **Hvorfor:** Forhåndsvisningen i saken viser et uløst flettefelt, men en PDF som sendes, har ingen leser før
  mottakeren. Med valget på stopper noden og sier hvilke felt som mangler. Uten versjon lages PDF-en av innholdet slik
  det er nå.

## flyt-pdf-lagres-i-saken PDF-en hører til kjøringen; skal den stå i saken, lagre den én gang

```yaml
id: flyt-pdf-lagres-i-saken
klasse: valg
gjelder: [LagPdfFraSaksdokument, LagPdfFraTekst, LagSaksdokumentFraBytes, CreateDocumentVersion]
krever: [07-flyt.md#flyt-pdf-krever-alle-flettefelt]
opphav: skrevet
```

- **Gjør:** Send referansen fra PDF-noden rett til utsendingen og arkivet. Skal det som ble sendt, også stå i saken, legg
  til «Lagre fil i saken» etter at sendingen har gått.
- **Ikke gjør:** Ikke lagre filen før sendingen, og ikke i en gren som kan kjøres to ganger.
- **Hvorfor:** PDF-en slettes når kjøringen er ferdig. «Lagre fil i saken» og «Opprett ny dokumentversjon» har ett
  forsøk, og to kjøringer gir to filer eller to versjoner.

---

## Utsending

## flyt-epost-ut-fra-postboksen E-post fra en flyt sendes fra en valgt postboks og registreres i saken

```yaml
id: flyt-epost-ut-fra-postboksen
klasse: valg
gjelder: [EmailNotification, EmailNotification.sender, EmailNotification.caseId, EmailNotification.replyToInboxItemId, EmailNotification.attachments]
krever: [11-integrasjoner.md#standard-avsender-for-forste-utsending, 09-maler.md#mal-utkast-med-neo]
opphav: skrevet
```

- **Gjør:** Velg avsenderen: standard avsender (`STANDARD`), en felles postboks (`POSTBOKS`), den som startet handlingen
  (`INITIATOR`), eller svar i samme tråd (`REPLY` med henvendelsen). Sett `caseId`, så sendingen står i saken.
- **Ikke gjør:** Ikke bruk «den som startet handlingen» i en flyt som starter av en hendelse, en webhook eller et skjema.
  Ikke send et vedtak som e-posttekst. Ikke bygg flyten slik at den sender på nytt etter at noden har feilet.
- **Hvorfor:** Det finnes ingen reserveavsender: uten et medlem bak kjøringen feiler `INITIATOR`. Med `caseId` blir
  e-posten et dokument i saken. Noden har ett forsøk; er det ukjent om e-posten gikk, må noen sjekke Sendte elementer.

```yaml
EmailNotification:
  sender: { mode: STANDARD }
  to: "{{skjema:mottaker}}"
  subject: "{{skjema:emne}}"
  body: "{{skjema:tekst}}"
  caseId: "{{utløser:trigger.case.id}}"
```

## flyt-svarut-ekstern-referanse Sett ekstern referanse på hver SvarUt-forsendelse

```yaml
id: flyt-svarut-ekstern-referanse
klasse: felle
gjelder: [SvarUtSend, SvarUtSend.eksternReferanse, SvarUtSend.kunDigitalLevering, SvarUtHentStatus]
krever: [07-flyt.md#flyt-vent-og-sjekk]
opphav: skrevet
```

- **Gjør:** Sett `eksternReferanse`, typisk til kjøringens id. Lagre forsendelsens id på dokumentet, og følg statusen med
  «Hent SvarUt-status» i en løkke med tak. La «Kun digital levering» stå tom med mindre parten ikke skal få brevet på
  papir.
- **Ikke gjør:** Ikke send uten referanse.
- **Hvorfor:** Sendingen må være ferdig innen 100 sekunder og har ett forsøk. Brytes den underveis uten referanse, kan
  forsendelsen ikke finnes igjen, og ingen vet om den gikk. Et tomt valg gir SvarUts standard.

## flyt-overlevering-uten-integrasjon En overlevering til et system Neo ikke er koblet til, bygges synlig i saken

```yaml
id: flyt-overlevering-uten-integrasjon
klasse: valg
gjelder: [CreateTask, SkrivHendelse, HttpRequest, OppdaterSaksdata, stream.eventTypes]
krever: [07-flyt.md#flyt-http-taaler-gjentak, 07-flyt.md#webhook-abonnent-taaler-gjentak, 05-felt-og-saksdata.md#flere-rader-er-saksdata]
opphav: forslag
```

- **Gjør:** La flyten på vedtaket skrive en egen hendelse (for eksempel `utbetaling.bestilt`) og opprette en oppgave for
  overleveringen. Har systemet et API, la en strøm levere hendelsen til det som webhook, eller kall det med
  «HTTP-forespørsel». Skriv det som er overlevert, som rader i en saksdatamal.
- **Ikke gjør:** Ikke la en overlevering skje uten et spor i saken.
- **Hvorfor:** Neo har integrasjoner mot arkivet, Altinn, SvarUt og registrene, men ikke mot et økonomisystem.
  Hendelsen gjør overleveringen synlig og tellbar. Vi har ikke sett mønsteret prøvd for økonomi.

Eksempel: En utbetaling av tilskudd. Saksbehandleren utløser utbetalingen med en handling på oppgaven «Utbetal
tilskuddet». Flyten stopper hvis parten er under konkurs (det står på kontakten), legger til en rad i tabellen
`utbetalinger`, skriver hendelsen `utbetaling.bestilt` med beløpet som tall, og regner ut hva som er utbetalt hittil
(`flyt-regn-ut`). En strøm leverer hendelsen til økonomisystemet, med bare feltene det trenger
(`flyt-strom-sender-det-som-trengs`). Kvitterer saksbehandleren ut oppgaven for hånd, er det fordi overleveringen er
gjort utenfor Neo. Innsikt viser innvilget mot utbetalt fra vedtakshendelsen og utbetalingshendelsen; sakslista viser
køen av saker som ikke er utbetalt.

---

## Altinn

## flyt-altinn-melding-flaggene La Altinns standard gjelde for flaggene på en melding, og sett dem bare med en grunn

```yaml
id: flyt-altinn-melding-flaggene
klasse: valg
gjelder: [AltinnSendMelding, AltinnSendMelding.ignorerReservasjon, AltinnSendMelding.erTaushetsbelagt, AltinnSendMelding.krevLesebekreftelse, AltinnSendMelding.frist, AltinnSendMelding.tillatVideresending]
krever: [11-integrasjoner.md#vedtaket-fra-dokumentet]
opphav: forslag
```

- **Gjør:** Sett «Taushetsbelagt» når meldingen eller vedlegget har taushetsbelagte opplysninger. Sett «Krev
  lesebekreftelse» bare sammen med en frist. Sett «Ignorer reservasjon» bare når hjemmelen sier at meldingen skal fram
  digitalt selv om mottakeren har reservert seg.
- **Ikke gjør:** Ikke slå på et flagg fordi det ser tryggest ut.
- **Hvorfor:** Et flagg uten valg sendes ikke, og da gjelder Altinns standard. Lesebekreftelse uten frist avvises av
  Altinn, og noden stopper før kallet. At reservasjonen bare skal overstyres med hjemmel, er vår anbefaling.

---

## Arkiv

## flyt-ekstern-id Slå opp på ekstern id før flyten oppretter noe i et annet system

```yaml
id: flyt-ekstern-id
klasse: felle
gjelder: [DocumasterFinnEksternId, DocumasterOpprettSaksmappe, DocumasterOpprettSaksmappe.eksternID, DocumasterOpprettJournalpost, DocumasterOpprettJournalpost.eksternID, DocumasterOpprettDokument, OpprettHenvendelse, OpprettHenvendelse.eksternId]
krever: [07-flyt.md#flyt-saksdata-adresse, 11-integrasjoner.md#neos-id-i-arkivet]
opphav: skrevet
```

- **Gjør:** Gi det flyten oppretter i arkivet Neos id som ekstern id, og slå opp på den først: null treff oppretter, ett
  brukes, flere stopper. Gi «Opprett henvendelse» det andre systemets egen id i `eksternId`.
- **Ikke gjør:** Ikke opprett på nytt bare fordi flyten kjøres en gang til.
- **Hvorfor:** Documaster har ingen idempotensnøkkel, så opprett-nodene har ett forsøk. Det trygge nye forsøket er en ny
  kjøring som finner det forrige i arkivet. «Opprett henvendelse» med `eksternId` lager henvendelsen bare én gang.

## flyt-tabell-for-oppslag Verdier som varierer per sakstype eller kommer fra et annet system, slås opp i en synlig tabell

```yaml
id: flyt-tabell-for-oppslag
klasse: valg
gjelder: [SlaOppITabell, SlaOppITabell.tabell, SlaOppITabell.nokkelFelt, SlaOppITabell.stoppUtenTreff]
krever: [05-felt-og-saksdata.md#nokkel-og-etikett]
opphav: skrevet
```

- **Gjør:** Legg oversettelser i «Slå opp i tabell»: appens maskinverdi til valgets nøkkel, sakstypen til arkivverdiene,
  dokumenttypen til journalposttypen. La «Stopp uten treff» stå på når hver verdi skal ha en rad.
- **Ikke gjør:** Ikke bygg en rutevelger med én vei per verdi for det samme. Ikke legg arkivverdiene flyten trenger,
  bare i en instruks.
- **Hvorfor:** Tabellen er synlig, og kunden kan fylle den. Nøkkelkolonnen må være unik. Med «Stopp uten treff» av gir
  noden `funnet: nei`, og da må flyten forgrene selv.

---

## Venting og logikk

## flyt-vent-og-sjekk Vent på et annet system med en løkke som har et tak

```yaml
id: flyt-vent-og-sjekk
klasse: valg
gjelder: [Iterator, Iterator.modus, Iterator.antall, Vent, Vent.varighet, Vent.enhet, AvsluttLokke, RepeatIterator]
opphav: skrevet
```

- **Gjør:** «Løkke» med et fast antall runder → «Vent» → les tilstanden → skriv den → «Avslutt løkke» når
  sluttilstanden er nådd → «Gjenta løkke».
- **Ikke gjør:** Ikke lag en løkke uten tak. Ikke bruk desimaler i ventetiden; skriv 90 minutter, ikke 1,5 timer.
- **Hvorfor:** Varigheten og antallet må være hele tall større enn null. Kjøringen står «Venter» uten å holde plass, og
  slutter når taket er nådd, med den siste tilstanden.

## flyt-lokke-over-tom-liste En løkke over en liste står i grenen der lista ikke er tom

```yaml
id: flyt-lokke-over-tom-liste
klasse: felle
gjelder: [Iterator, Iterator.source, Condition]
opphav: skrevet
```

- **Gjør:** Sett en betingelse på `antall` > 0 foran en «Løkke» i listemodus, og legg løkka i ja-grenen.
- **Ikke gjør:** Ikke regn med at en tom liste hopper over løkka.
- **Hvorfor:** En tom liste kjører kroppen én gang, med en tom verdi. Steget inne i løkka feiler da, eller skriver noe
  som ikke finnes.

## flyt-rutevelger-uten-ellers Rutevelgeren har ingen «ellers» når valgene er faste

```yaml
id: flyt-rutevelger-uten-ellers
klasse: felle
gjelder: [SwitchRouter, SwitchRouter.defaultKey, SwitchRouter.branches]
opphav: praksis
```

- **Gjør:** Gi rutevelgeren én vei per lovlig verdi, og la «ellers» stå tom.
- **Ikke gjør:** Ikke legg til en tom «ellers»-vei for å få kjøringen grønn.
- **Hvorfor:** Uten «ellers» stopper en verdi utenfor valgene kjøringen synlig. En tom «ellers» gir en grønn kjøring som
  ikke gjorde noe.

## flyt-er-en-av Bruk «Er en av» for en liste av gyldige verdier

```yaml
id: flyt-er-en-av
klasse: felle
gjelder: [Condition.statements, SwitchRouter.branches]
opphav: skrevet
```

- **Gjør:** Bruk `IN` / `NOT_IN` og skriv lista som en JSON-liste: `["Tilskudd", "Klage på tilskudd"]`.
- **Ikke gjør:** Ikke bruk «Inneholder».
- **Hvorfor:** «Inneholder» søker på deltekst: «Klage» treffer også «Klagesak». «Er en av» sammenligner eksakt, og en
  liste som ikke kan leses, stopper steget.

## flyt-http-taaler-gjentak Et kall med «HTTP-forespørsel» kan gå mer enn én gang

```yaml
id: flyt-http-taaler-gjentak
klasse: felle
gjelder: [HttpRequest, HttpRequest.method, HttpRequest.headers, HttpRequest.body]
opphav: skrevet
```

- **Gjør:** Gi en `POST` en nøkkel mottakeren kan kjenne igjen kallet på (Neos id eller kjøringens id), og legg nøkkelen
  til mottakeren i en header.
- **Ikke gjør:** Ikke kall et system som oppretter noe for hvert kall uten en slik nøkkel.
- **Hvorfor:** Noden prøver opptil tre ganger, og et svar som ikke er 2xx, er en feil. Er kallet tatt imot, men svaret
  borte, kommer det en gang til.

---

## Hendelser og strømmer

## flyt-tell-med-hendelse Det som skal telles over tid, skriver flyten som en egen hendelse der det skjer

```yaml
id: flyt-tell-med-hendelse
klasse: valg
gjelder: [SkrivHendelse, SkrivHendelse.verdier, flowEventType, stream, stream.eventTypes]
krever: [07-flyt.md#flyt-egen-hendelse, 07-flyt.md#strom-pause-er-tap, 13-innsikt.md#tall-krever-hendelse, 13-innsikt.md#en-strom-for-innsikt]
opphav: skrevet
```

- **Gjør:** Når kravet er å telle eller summere noe over tid (vedtak per utfall, innvilget beløp, utsendinger per kanal,
  mottatte rapporter), planlegg hendelsen sammen med flyten: legg «Skriv hendelse» i grenen der det skjer, med `caseId`
  og verdiene slik de er da. Publiser hendelsestypen og lag strømmen Innsikt leser, før flyten aktiveres.
- **Ikke gjør:** Ikke regn med å telle det etterpå fra sakens felt eller status.
- **Hvorfor:** Innsikt leser sakens felt slik de er nå, og hendelser bare når en strøm har levert dem. En hendelse som
  ikke ble skrevet, eller som kom før strømmen fantes, kan ikke telles i ettertid.

```yaml
# Eksempel, tilskudd: i vedtaksgrenen, etter at tilsagnsbrevet er sendt
- node: SkrivHendelse
  hendelsestype: <tilsagn.gitt>
  verdier:
    caseId: "{{utløser:trigger.case.id}}"
    belop: "{{hent-sak:felt.tsk_innvilget_belop}}"
    ordning: "{{hent-sak:felt.tsk_ordning}}"
```

## flyt-egen-hendelse Definer den egne hendelsen med de feltene leserne trenger, og skriv den én gang

```yaml
id: flyt-egen-hendelse
klasse: valg
gjelder: [flowEventType, flowEventType.name, flowEventType.fields, flowEventType.fields.type, flowEventType.fields.required, flowEventType.fields.options, SkrivHendelse, SkrivHendelse.hendelsestype]
krever: [00-navn-pakking-og-versjoner.md#navn-hendelse-objekt-handling, 00-navn-pakking-og-versjoner.md#hendelsestypen-brytes-ikke]
opphav: skrevet
```

- **Gjør:** Gi typen navnet `objekt.handling` og feltene andre trenger: `caseId` når hendelsen gjelder en sak, beløp som
  `number`, og det rapportene bryter ned på som `select` med samme nøkler som saksfeltet. Gjør et felt påkrevd bare når
  hendelsen er meningsløs uten det. Skriv hendelsen der det skjer, i en gren som ikke kjøres to ganger.
- **Ikke gjør:** Ikke bruk et navn fra Neos egen katalog. Ikke la en flyt skrive saksdata for at en annen flyt skal
  merke det. Ikke legg et beløp som tekst.
- **Hvorfor:** Et påkrevd felt uten verdi stopper flyten, og ingenting skrives. Innsikt kobler hendelsen til saken bare
  gjennom feltet `caseId`. «Skriv hendelse» har ett forsøk, og to kjøringer gir to hendelser.

```yaml
flowEventType:
  name: tilsagn.gitt
  label: "Tilsagn gitt"
  fields:
    - { name: caseId, label: "Sak", type: text, required: true }
    - { name: belop, label: "Tilsagnsbeløp", type: number, required: true }
    - name: ordning
      label: "Ordning"
      type: select
      required: false
      options: [{ key: drift, label: "Driftstilskudd" }, { key: prosjekt, label: "Prosjekttilskudd" }]
```

## flyt-strom-sender-det-som-trengs En strøm til et annet system sender bare feltene mottakeren trenger

```yaml
id: flyt-strom-sender-det-som-trengs
klasse: valg
gjelder: [stream.eventTypes.propertyMappings, stream.eventTypes.filters]
opphav: forslag
```

- **Gjør:** For en webhook ut av Neo: sett `propertyMappings` med feltene mottakeren trenger, med mottakerens navn. For
  en strøm som starter en flyt eller leverer til Innsikt: la mappingen stå tom, eller ta med alle feltene leserne bruker.
- **Ikke gjør:** Ikke send hele hendelsen til et annet system fordi det er enklest.
- **Hvorfor:** Uten mapping leveres hele hendelsen. Med mapping leveres bare feltene i mappingen, også til flyten og
  Innsikt. Neo avviser en endring av strømmen som tar et felt fra en aktiv flyt.

```yaml
eventTypes:
  - eventType: tilsagn.gitt
    propertyMappings:
      - { sourcePath: caseId, propertyName: saksreferanse, required: true }
      - { sourcePath: belop, propertyName: belop, required: true }
```

## flyt-hjemmel-ikke-pa-strommen Skriv hjemmelen der den brukes, ikke på hendelsen i strømmen

```yaml
id: flyt-hjemmel-ikke-pa-strommen
klasse: felle
gjelder: [stream.eventTypes.legalProvisions]
opphav: forslag
```

- **Gjør:** Sett `legalProvisions: []`, og skriv hjemmelen der den virker: i flytens arkivverdier, i behandlingsregelen
  eller i dokumentmalen.
- **Ikke gjør:** Ikke regn med at hjemlene på en hendelsestype i strømmen brukes til noe.
- **Hvorfor:** Feltet lagres med strømmen, men leveringen leser det ikke, og det følger ikke hendelsen ut.

## strom-pause-er-tap Sett en strøm eller en abonnent på pause bare når hendelsene i pausen kan gå tapt

```yaml
id: strom-pause-er-tap
klasse: felle
gjelder: [stream.active, stream.eventTypes.enabled]
krever: [07-flyt.md#flyt-aktivering]
opphav: forslag
```

- **Gjør:** Bruk pausen når en mottaker er nede eller en strøm skal stå stille en kort stund, og sjekk etterpå hva som
  skjedde i pausen. Slett strømmen når den ikke skal brukes igjen.
- **Ikke gjør:** Ikke sett en strøm på pause for å holde igjen hendelser til mottakeren er klar. Ikke sett strømmen bak
  en flyt på pause for å stoppe flyten; deaktiver flyten.
- **Hvorfor:** Hver hendelse tas én gang og leveres bare til aktive strømmer med minst én aktiv abonnent. En hendelse som
  kom mens strømmen var av, blir ikke levert når den slås på igjen, og Innsikt teller den ikke. Det er utledet av
  hvordan leveringen virker, ikke prøvd.

## webhook-abonnent-taaler-gjentak En webhook-abonnent har én mottaker, nøkkelen i headeren, og en mottaker som tåler samme hendelse to ganger

```yaml
id: webhook-abonnent-taaler-gjentak
klasse: felle
gjelder: [stream, stream.eventTypes]
krever: [07-flyt.md#flyt-strom-sender-det-som-trengs, 00-navn-pakking-og-versjoner.md#test-i-sandboxen]
opphav: forslag
```

- **Gjør:** Lag én `WEBHOOK`-abonnent per system, med adressen og nøkkelen i `authorization` eller `x-api-key`. Be
  mottakeren kjenne igjen en hendelse på `eventLogId`. Følg leveringsloggen den første tiden.
- **Ikke gjør:** Ikke lag abonnenten som starter en flyt for hånd; bind flyten til strømmen. Ikke legg nøkkelen i
  adressen.
- **Hvorfor:** Neo prøver en webhook opptil åtte ganger ved 5xx, 408 og 429; andre svar er endelige. Bare de to headerne
  er tillatt, og verdiene vises ikke igjen. I en sandkasse sendes ingen webhook.

```yaml
stream:
  name: "Til økonomisystemet — tilskudd"
  subscribers:
    - name: Økonomisystemet
      type: WEBHOOK
      active: true
      config:
        url: https://okonomi.example.no/neo/hendelser
        method: POST
        headers: { x-api-key: "<settes i Neo og vises ikke igjen>" }
```
