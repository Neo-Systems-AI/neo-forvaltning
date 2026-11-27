# Godkjenning i to ledd

Vedtaket, innstillingen eller brevet skal godkjennes av en leder eller en kollega før det sendes. Mens godkjenneren
leser, skal ingen endre teksten. Det som ble godkjent, må kunne vises i ettertid, også om noen redigerer etterpå.

## Når den passer

Når kravene sier at et dokument skal kontrolleres eller godkjennes av en annen enn den som skrev det: to-trinns
godkjenning, attestasjon av et vedtak, juridisk kontroll. Den passer også når flere skriver hver sin del av samme
dokument. Mennesket godkjenner. Flyten setter status, lager oppgaven og fryser versjonen.

Den passer ikke for et dokument én person skriver og sender selv; da holder blokkstatusen
(`../monstre/15-dokumenter-under-arbeid.md#las-det-som-er-sjekket`).

## Klossene

handling på dokumentet («Send til godkjenning», «Godkjenn», «Send tilbake») → flyt: dokumentstatus, lås og
godkjenneroppgave → godkjent versjon og PDF → flyten som sender, sjekker at dokumentet er ferdig.

- Rollen og gruppa som gir godkjenneren tilgang.
- Dokumentstatusene, med låsen der noen andre vurderer.
- Handlingene og flyten som setter statusen.
- Godkjenneroppgaven.
- Blokkstatusene for delene av dokumentet.

## Slik bygges den

1. **Sørg for at godkjenneren ser saken**: rollen etter jobben, og med i sakstypens gruppe.
   Regler: `../monstre/14-tilgang.md#jobbroller-etter-jobben`, `../monstre/14-tilgang.md#gruppa-har-alle-som-ma-lese`
   Blir: steg i Neo: gi godkjenneren rollen og legg hen i gruppa.
2. **Bruk standardsettet for dokumentstatus**, og legg til trinn bare innenfor de tre kategoriene.
   Regler: `../monstre/02-status.md#stabile-statusnavn`,
   `../monstre/15-dokumenter-under-arbeid.md#dokumentstatus-tre-kategorier`
   Blir: `oppsett/artifact-status-groups/`
3. **Lås statusen der noen andre vurderer dokumentet.**
   Regler: `../monstre/07-flyt.md#flyt-handling-pa-objektet`, `../monstre/07-flyt.md#flyt-valg-med-skjema`,
   `../monstre/15-dokumenter-under-arbeid.md#las-mens-noen-vurderer`
   Blir: `oppsett/artifact-status-groups/`
4. **La handlingene på dokumentet sette statusen** («Send til godkjenning», «Godkjenn», «Send tilbake»), med statusen
   pekt ut på id.
   Regler: `../monstre/07-flyt.md#flyt-identitet-er-id`, `../monstre/15-dokumenter-under-arbeid.md#dokumentstatus-settes-av-handlingen`
   Blir: `oppsett/workflows/`, og steg i Neo: aktiver flyten.
5. **Lag godkjenneroppgaven** fra en mal når dokumentet sendes til godkjenning. Trenger organisasjonen et eget trinn i
   oppgavene, legg det inn i riktig kategori.
   Regler: `../monstre/06-oppgaver.md#oppgave-ved-hendelse`, `../monstre/07-flyt.md#flyt-oppgaven-finnes`,
   `../monstre/06-oppgaver.md#oppgavestatus-kategorien-teller`, `../monstre/06-oppgaver.md#oppgave-ansvarlig-tom`
   Blir: `oppsett/task-template-sets/` og `oppsett/task-status-groups/`
6. **Frys det godkjente** som versjon og PDF.
   Regler: `../monstre/09-maler.md#mal-fryses-ved-utsending`,
   `../monstre/15-dokumenter-under-arbeid.md#godkjent-fryses-som-versjon`
   Blir: `oppsett/workflows/`
7. **Bruk blokkstatusene** som de er, med en ansvarlig per del når flere skriver, og vurderingen som avsnitt.
   Regler: `../monstre/15-dokumenter-under-arbeid.md#blokkstatus-standardsettet`, `../monstre/15-dokumenter-under-arbeid.md#las-det-som-er-sjekket`,
   `../monstre/15-dokumenter-under-arbeid.md#ansvarlig-per-blokk`, `../monstre/15-dokumenter-under-arbeid.md#sjekkpunkt-bare-pa-godkjent`,
   `../monstre/15-dokumenter-under-arbeid.md#avsnitt-ikke-tabell-for-det-som-verifiseres`
   Blir: `oppsett/block-status-groups/`
8. **La flyten som sender, sjekke at dokumentet er ferdig.**
   Regler: `../monstre/15-dokumenter-under-arbeid.md#send-bare-ferdig`
   Blir: `oppsett/workflows/`

## Hvem gjør hva

- **Deterministisk:** dokumentstatusen, låsen, godkjenneroppgaven, versjonen og PDF-en, og stoppet når et dokument som
  ikke er ferdig, skal sendes.
- **Agenten:** kan foreslå endringer i blokker som er låst, men ikke skrive over dem.
- **Mennesket:** skriver, låser det som er sjekket, og godkjenner eller sender tilbake.

## Avhengighetene

- Bygger på [Vedtak med begrunnelse](vedtak-med-begrunnelse.md) (dokumentet og utsendingen) og
  [Tilgang og inhabilitet](tilgang-og-inhabilitet.md) (godkjenneren i gruppa).
- Skal [Innsikt og nøkkeltall](innsikt-og-nokkeltall.md) telle hvor lenge dokumenter står til godkjenning, må flyten
  skrive en egen hendelse ved hver overgang (`../monstre/13-innsikt.md#tall-krever-hendelse`).

## Grensene

- Blokkstatusene stopper ingenting; «X av Y verifisert» er et signal
  (`../monstre/15-dokumenter-under-arbeid.md#send-bare-ferdig`).
- En blokkstatus i malen følger ikke med til dokumentet (`../monstre/15-dokumenter-under-arbeid.md#blokkstatus-i-malen`).
- En tabell i dokumentet kan ikke låses eller telles
  (`../monstre/15-dokumenter-under-arbeid.md#avsnitt-ikke-tabell-for-det-som-verifiseres`).
- En godkjenner utenfor sakstypens gruppe ser ikke saken, og en oppgave kan ikke gi tilgang
  (`../monstre/14-tilgang.md#gruppa-har-alle-som-ma-lese`).
