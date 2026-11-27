# Foreløpig svar og forhåndsvarsel

Loven krever at parten får beskjed underveis. Tar saken tid, skal parten få et foreløpig svar (forvaltningsloven
§ 11 a). Går vedtaket parten imot, skal parten få et forhåndsvarsel med frist for å uttale seg (§ 16). Brevene er like i
alle sakstyper, men de må komme i rett steg og innen fristen, og uttalelsen må komme med i vurderingen.

## Når den passer

Når saken er et enkeltvedtak og kravene nevner saksbehandlingstid, foreløpig svar, forhåndsvarsel eller rett til å
uttale seg. Mennesket bestemmer at brevet skal ut. Flyten sender det og holder fristen.

Den passer ikke for en forespørsel om mer dokumentasjon; bruk [Mangel og dialog](mangel-og-dialog.md). Den passer
heller ikke for sakstyper som aldri utfører plikten.

## Klossene

milepæl for foreløpig svar → handling på dokumentet → flyt: PDF, journalføring, utsending → ventestatus og venteoppgave
(forhåndsvarselet) → uttalelsen i saksdata.

- Brevene som delte maler.
- Saksdatamalen for forhåndsvarselet og uttalelsen.
- Oppgavene, med milepælen for foreløpig svar.
- Flyten bak handlingen som sender brevet.
- Ventestatusen og venteoppgaven for uttalelsen.

## Slik bygges den

1. **Lag brevene som delte maler**, med plikten og hjemmelen i navnet og etiketten, ikke sakstypen.
   Regler: `../monstre/05-felt-og-saksdata.md#en-vurderingsmal-per-sakstype`, `../monstre/09-maler.md#mal-delte-brev`,
   `../monstre/00-navn-pakking-og-versjoner.md#navn-innholdet-forst`, `../monstre/16-skriving.md#standardformulering-i-malen`,
   `../monstre/16-skriving.md#overskrift-sier-budskapet`, `../monstre/09-maler.md#mal-ingen-fast-frist`,
   `../monstre/09-maler.md#mal-beskrivelse-sier-nar`, `../monstre/09-maler.md#mal-kobles-til-sakstypen`
   Blir: `oppsett/document-templates/`
2. **Lag saksdatamalen for forhåndsvarselet og uttalelsen** som en delt pliktmal. Datoene og valgene står i felt,
   innholdet i tekstblokker, og en avkrysning sier at ingen uttalelse kom.
   Regler: `../monstre/05-felt-og-saksdata.md#etikett-og-beskrivelse`,
   `../monstre/05-felt-og-saksdata.md#prosa-i-text-fakta-i-fields`,
   `../monstre/05-felt-og-saksdata.md#varsel-for-den-som-fyller-ut`
   Blir: `oppsett/case-data-templates/`
3. **Del kilden til oppgavene**, og kopier dem inn i settet til hver sakstype som utfører plikten.
   Regler: `../monstre/06-oppgaver.md#oppgave-deling-etter-kilde`, `../monstre/06-oppgaver.md#oppgave-ett-sett-per-sakstype`
   Blir: `oppsett/task-template-sets/`
4. **Gjør fristen for foreløpig svar til en milepæl** som regnes fra mottaket, og gi den en ansvarlig når saken
   tildeles.
   Regler: `../monstre/02-status.md#rekkefolgen-er-lopet`, `../monstre/06-oppgaver.md#oppgave-milepael`,
   `../monstre/06-oppgaver.md#oppgave-frist`, `../monstre/06-oppgaver.md#oppgave-ansvarlig-tom`,
   `../monstre/06-oppgaver.md#frist-varsles-av-neo`
   Blir: `oppsett/task-template-sets/`
5. **Sett varslingsoppsettet «Frister»** med hvor mange virkedager før fristen Neo skal varsle. Neo varsler den
   ansvarlige i appen og på e-post når milepælen nærmer seg og når den er passert; ingen flyt trengs.
   Regler: `../monstre/06-oppgaver.md#frist-varsles-av-neo`
   Blir: steg i Neo: sett varslingsoppsettet «Frister» (én gang for organisasjonen)
6. **Send brevet fra en handling** saksbehandleren trykker på. Flyten fryser brevet til PDF, journalfører det før
   sending og legger det i søknadens dialog.
   Regler: `../monstre/07-flyt.md#flyt-forvaltningshandling`, `../monstre/09-maler.md#mal-fryses-ved-utsending`,
   `../monstre/11-integrasjoner.md#utgaende-journalfores-for-sending`, `../monstre/11-integrasjoner.md#dialogen-er-soknadens`
   Blir: `oppsett/workflows/`, og steg i Neo: aktiver flyten.
7. **For forhåndsvarselet: vent på uttalelsen** med samme ventestatus og venteoppgave som ved mangel. Skal uttalelsen
   komme som et skjema i Altinn, bygges mottaket som i
   [Innhenting fra parten med et Altinn-skjema](innhenting-med-altinn-skjema.md).
   Regler: `../monstre/02-status.md#en-ventestatus`, `../monstre/06-oppgaver.md#oppgave-venter`,
   `../monstre/07-flyt.md#flyt-ventestatus`
   Blir: `oppsett/case-types/`, `oppsett/task-template-sets/` og `oppsett/workflows/`

## Hvem gjør hva

- **Deterministisk:** milepælen for foreløpig svar og varselet før den, PDF-en, utsendingen, journalføringen, ventestatusen og
  venteoppgaven.
- **Agenten:** kan skrive utkast til brevet og oppsummere uttalelsen i saksdatamalen. Saksbehandleren kontrollerer.
- **Mennesket:** avgjør at brevet skal ut, og hvordan uttalelsen vektes i vedtaket.

## Avhengighetene

- Bygger på [Grunnoppsett for sakstypen](grunnoppsett-for-sakstypen.md) og den samme ventestatusen som
  [Mangel og dialog](mangel-og-dialog.md).
- [Innhenting fra parten med et Altinn-skjema](innhenting-med-altinn-skjema.md) når uttalelsen kommer som et skjema.
- Uttalelsen er grunnlag for [Vedtak med begrunnelse](vedtak-med-begrunnelse.md).
- [Journalføring og offentlig journal](journalforing-og-offentlig-journal.md): brevene er utgående journalposter.

## Grensene

- Neo har ikke tekstbiter; standardteksten må stå i malen (`../monstre/16-skriving.md#standardformulering-i-malen`).
- Et foreløpig svar sendes ikke av en tidsplan eller en hendelse; det er en forvaltningshandling et menneske starter
  (`../monstre/07-flyt.md#flyt-forvaltningshandling`).
