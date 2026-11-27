# Vedtak med begrunnelse

Saksbehandleren skal fatte vedtak og sende det til parten. Vedtaket skal ha riktig utfall, en begrunnelse som holder
etter forvaltningsloven § 25 og opplysning om klageadgang. Det som sendes, arkiveres og legges på saken, skal være det
samme dokumentet. Etter vedtaket venter saken på klagefristen og lukkes av seg selv når den er ute.

## Når den passer

Når saken ender i et enkeltvedtak: innvilgelse, avslag, delvis innvilgelse, avvisning, pålegg. Mennesket fatter vedtaket
og trykker på handlingen. Flyten gjør resten: PDF, utsending, arkiv, status, neste oppgaver og lukkingen etter
klagefristen.

Teksten kan lages på to måter, og ingen utelukker den andre:

- **Deterministisk:** vedtaksmalen med flettefelt fra saken. Passer når teksten er lik fra sak til sak, utfallet styrer
  den, og det som varierer, står i saksfelt: enkle tillatelser, mange saker, lite skjønn.
- **Agentisk:** Neo skriver utkastet fra malen og behandlingsregelen, og saksbehandleren går gjennom det. Passer når
  begrunnelsen krever skjønn og bygger på vurderingen i saksdata, som flettingen ikke når.
- **Begge:** malen fletter fakta og fast tekst (konklusjonen, klageadgangen), og Neo skriver begrunnelsen i avsnittene
  der malen har veiledning. Saksbehandleren låser det som er sjekket.

Den passer ikke for et brev som følger vedtaket og ber parten om noe; bruk
[Innhenting fra parten med et Altinn-skjema](innhenting-med-altinn-skjema.md). Den passer heller ikke for en
innstilling til et annet organ som fatter vedtaket; da er det en annen sakstype
(`../monstre/01-sakstype.md#egen-sakstype-nar`).

## Klossene

handling med skjema på vedtaksoppgaven → flyt: status og utfall → vedtaksmalen (flettet, eller utkast fra Neo) → PDF,
journalføring og utsending → egen hendelse → neste oppgaver → «Venter på klagefrist» → «Vent» → «Avsluttet».

- Utfallsfeltet, vedtaksstatusen og ventestatusen «Venter på klagefrist» i sakstypen.
- Skjemaet som spør om utfallet.
- Vedtaksmalen, og behandlingsregelen når Neo skriver utkastet.
- Flyten bak handlingen, som sender vedtaket, venter på klagefristen og lukker saken.
- Den egne hendelsen for vedtaket.
- Oppgavene etter vedtaket.

## Slik bygges den

1. **Lag utfallsfeltet og statusene.** Ett valgfelt med nøkler, én status for at vedtaket er fattet, og
   «Venter på klagefrist» i kategorien `VENTER` etter den.
   Regler: `../monstre/05-felt-og-saksdata.md#nokkel-og-etikett`, `../monstre/05-felt-og-saksdata.md#utfall-som-felt`,
   `../monstre/02-status.md#en-vedtaksstatus`, `../monstre/02-status.md#venter-pa-klagefrist`,
   `../monstre/02-status.md#kategori-med-vilje`, `../monstre/02-status.md#beskrivelse-sier-hva-som-er-sant`
   Blir: `oppsett/case-types/`
2. **Lag handlingsskjemaet** som spør om utfallet. Flyten får én vei per svar, og hver vei setter både status og utfall.
   Regler: `../monstre/10-skjema-og-innboks.md#neo-skjema-er-intern-inngang`, `../monstre/10-skjema-og-innboks.md#selvbetjent-bare-for-innganger`,
   `../monstre/07-flyt.md#flyt-valg-med-skjema`, `../monstre/10-skjema-og-innboks.md#skjemasvar-er-inndata`,
   `../monstre/10-skjema-og-innboks.md#skjema-navn-og-versjon`
   Blir: steg i Neo: lag skjemaet med utfallet som RadioGroup.
3. **Velg veien for teksten**: deterministisk, agentisk eller begge (se «Når den passer»).
   Blir: `design/`
4. **Lag vedtaksmalen**: én for alle utfall, konklusjonen først, begrunnelsen i tre deler og klageadgangen fast. Fakta
   flettes. Der skjønn skal skrives, står veiledning som også er bestillingen til Neo.
   Regler: `../monstre/09-maler.md#mal-typen`, `../monstre/09-maler.md#mal-utfallsnoytral`,
   `../monstre/09-maler.md#mal-klageadgang`, `../monstre/16-skriving.md#konklusjonen-forst`, `../monstre/09-maler.md#mal-fakta-og-skjonn`,
   `../monstre/16-skriving.md#begrunnelse-tre-deler`, `../monstre/16-skriving.md#regelen-skrives-ut`,
   `../monstre/09-maler.md#mal-navnerommet`, `../monstre/09-maler.md#mal-mottaker-er-part`,
   `../monstre/09-maler.md#mal-organisasjonen-flettes`, `../monstre/09-maler.md#mal-valg-gir-etikett`,
   `../monstre/09-maler.md#mal-ingen-fast-frist`, `../monstre/09-maler.md#mal-ingen-lister`,
   `../monstre/16-skriving.md#du-og-vi`, `../monstre/16-skriving.md#klart-sprak`, `../monstre/16-skriving.md#standardformulering-i-malen`,
   `../monstre/16-skriving.md#veiledningen-er-en-bestilling`, `../monstre/09-maler.md#mal-beskrivelse-sier-nar`,
   `../monstre/09-maler.md#mal-tagger-for-biblioteket`, `../monstre/09-maler.md#mal-kobles-til-sakstypen`,
   `../monstre/09-maler.md#mal-eksempler-i-samtalen`
   Blir: `oppsett/document-templates/`
5. **For den agentiske veien: legg behandlingsregelen på saken**, så Neo skriver utkastet fra den og malen.
   Saksbehandleren tar utkastet over og låser det som er sjekket.
   Regler: `../monstre/08-instrukser.md#instruks-ki-tre-former`, `../monstre/09-maler.md#mal-utkast-med-neo`,
   `../monstre/15-dokumenter-under-arbeid.md#las-det-som-er-sjekket`,
   `../monstre/15-dokumenter-under-arbeid.md#avsnitt-ikke-tabell-for-det-som-verifiseres`
   Blir: `oppsett/instructions/`
6. **Bygg utsendingen som en handling på dokumentet.** Flyten krever at flettefeltene er løst og at dokumentet er
   ferdig. Den fryser vedtaket til PDF, journalfører, sender i søknadens dialog, legger PDF-en på saken og kvitterer
   søknaden.
   Regler: `../monstre/07-flyt.md#flyt-forvaltningshandling`, `../monstre/09-maler.md#mal-fryses-ved-utsending`,
   `../monstre/09-maler.md#mal-flettefeltene-lost`, `../monstre/07-flyt.md#flyt-stopp-med-melding`,
   `../monstre/15-dokumenter-under-arbeid.md#send-bare-ferdig`, `../monstre/11-integrasjoner.md#utgaende-journalfores-for-sending`,
   `../monstre/11-integrasjoner.md#vedtaket-fra-dokumentet`, `../monstre/11-integrasjoner.md#tradens-regler`,
   `../monstre/11-integrasjoner.md#kvitter-ved-avslutning`
   Blir: `oppsett/workflows/`, og steg i Neo: aktiver flyten.
7. **Skriv en egen hendelse for vedtaket**, med utfallet og beløpet.
   Regler: `../monstre/07-flyt.md#flyt-egen-hendelse`, `../monstre/00-navn-pakking-og-versjoner.md#navn-hendelse-objekt-handling`,
   `../monstre/13-innsikt.md#tall-krever-hendelse`
   Blir: `oppsett/flow-event-types/`
8. **La flyten lage oppgavene som hører til etter vedtaket**, og bestem hva den gjør når de alt finnes.
   Regler: `../monstre/06-oppgaver.md#oppgave-ved-hendelse`, `../monstre/07-flyt.md#flyt-oppgaven-finnes`
   Blir: `oppsett/task-template-sets/`
9. **Vent på klagefristen og lukk saken.** Samme flyt setter saken til «Venter på klagefrist» etter utsendingen. Den
   venter med noden «Vent» i klagefristen pluss postgangen, leser saken på nytt med «Hent sak», og setter den til
   «Avsluttet» bare om den fortsatt står i «Venter på klagefrist». En klage innen fristen endrer ikke dette: den blir en
   egen klagesak med relasjon til vedtaket ([Endring og klage](endring-og-klage.md)), og vedtakssaken lukkes likevel.
   Regler: `../monstre/02-status.md#venter-pa-klagefrist`, `../monstre/02-status.md#avsluttet-er-last`,
   `../monstre/07-flyt.md#flyt-handling-leser-objektet`, `../monstre/01-sakstype.md#klage-som-egen-sakstype`
   Blir: `oppsett/workflows/`
10. **Heng handlingen på vedtaksoppgaven**, og skriv i oppgaven hvilken handling som brukes.
    Regler: `../monstre/06-oppgaver.md#oppgave-handling`, `../monstre/07-flyt.md#flyt-handling-pa-objektet`,
    `../monstre/07-flyt.md#flyt-handling-leser-objektet`
    Blir: `oppsett/task-template-sets/` og `oppsett/workflows/`

## Hvem gjør hva

- **Deterministisk:** status og utfall fra samme valg, flettingen, sjekken av flettefelt og dokumentstatus, PDF-en,
  journalføringen, utsendingen, kvitteringen i Altinn, hendelsen, neste oppgaver, ventingen på klagefristen og
  lukkingen.
- **Agenten:** skriver utkast til vedtaket, eller til begrunnelsen i malen, fra saken, behandlingsregelen og malen.
  Utkastet er merket som KI.
- **Mennesket:** fatter vedtaket, går gjennom og låser teksten, og trykker på handlingen som sender. Knytter en klage
  til vedtakssaken.

## Avhengighetene

- Bygger på [Grunnoppsett for sakstypen](grunnoppsett-for-sakstypen.md) og
  [Vurdering etter kriterier](vurdering-etter-kriterier.md); begrunnelsen bygger på vurderingen.
- [Godkjenning i to ledd](godkjenning-i-to-ledd.md) når en leder skal godkjenne før sending.
- [Journalføring og offentlig journal](journalforing-og-offentlig-journal.md): vedtaket er en utgående journalpost, og
  søknaden avskrives mot det.
- [Innsikt og nøkkeltall](innsikt-og-nokkeltall.md): hendelsen for vedtaket må med når flyten bygges. Utfall og
  avslagsandel kan ikke telles i ettertid uten den (`../monstre/13-innsikt.md#standardtall-for-saksbehandling`).
- [Endring og klage](endring-og-klage.md): klagesaken og relasjonen til vedtaket. Ventestatusen må planlegges sammen med
  den.
- Neste steg: [Innhenting fra parten med et Altinn-skjema](innhenting-med-altinn-skjema.md),
  [Oppfølging med rapporter og frister](oppfolging-med-rapporter-og-frister.md) og
  [Overlevering til et eksternt system](overlevering-til-eksternt-system.md).
- Testsakene må dekke hvert utfall (`../monstre/00-navn-pakking-og-versjoner.md#en-testsak-per-gren`).

## Grensene

- Malen kan ikke gjenta en rad per element; lister skrives av saksbehandleren eller agenten
  (`../monstre/09-maler.md#mal-ingen-lister`).
- Flettingen kjenner saksfelt, ikke saksdata (`../monstre/12-visninger.md#kolonne-krever-saksfelt`).
- `required` på et flettefelt håndheves ikke; bare valget i PDF-noden stopper (`../monstre/09-maler.md#mal-flettefeltene-lost`).
- Blokkstatusene stopper ikke en sending (`../monstre/15-dokumenter-under-arbeid.md#send-bare-ferdig`).
- Neo har ikke tekstbiter (`../monstre/16-skriving.md#standardformulering-i-malen`).
- En flyt kan ikke opprette en relasjon; et menneske knytter klagesaken til vedtaket
  (`../monstre/04-relasjoner.md#relasjoner-lages-av-mennesker`).
- En relasjon kan ikke knyttes til en avsluttet sak (`CASE_CLOSED`). For en klage etter fristen saksbehandleren flytter vedtakssaken ut av «Avsluttet», knytter relasjonen og setter den tilbake
  (`../monstre/02-status.md#avsluttet-er-last`).
