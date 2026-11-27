# Oppfølging med rapporter og frister

Vedtaket gir plikter over tid: delrapport og sluttrapport, etterkontroll, retting etter et pålegg. Hver frist kommer fra
vedtaket og står som en oppgave når den er aktuell. Saken viser hva som er mottatt, hva som er vurdert og hva som har
forfalt.

## Når den passer

Når kravene sier at parten skal rapportere, at vi skal kontrollere etter vedtaket, eller at et pålegg skal følges opp
til det er rettet. Flyten setter fristene fra datoene i saken. Rapporten kommer inn som en innsending, og mennesket
vurderer den.

Den passer ikke for frister under behandlingen før vedtaket. Bruk da [Mangel og dialog](mangel-og-dialog.md) eller
[Foreløpig svar og forhåndsvarsel](forelopig-svar-og-forhandsvarsel.md).

## Klossene

Vedtaket → flyt → én oppgave per frist; rapporten inn (Altinn-skjema eller innboks) → flyt → saksdata, status og
hendelse.

- Datofelt eller rader i saksdata for fristene
- Én oppgavemal per slags oppfølging
- Flyten på vedtaket som oppretter oppgavene
- Statusene etter vedtaket
- Innsendingen av rapporten, med Altinn eller fra innboksen
- Saksdatainstruksen som vurderer rapporten
- Hendelsen for mottatt rapport, og køen

## Slik bygges den

1. **Legg datoene i saken.** Fristene er datofelt når det er én av hver, og rader i saksdata når det er flere.
   Regler: `../monstre/05-felt-og-saksdata.md#velg-felttype`, `../monstre/05-felt-og-saksdata.md#flere-rader-er-saksdata`
   Blir: `oppsett/custom-fields/` og `oppsett/case-data-templates/`
2. **Lag én oppgavemal per slags oppfølging**, som ikke lages med saken. Handlingen på vedtaket oppretter én oppgave per
   frist, med fristen fra datoen i steg 1.
   Regler: `../monstre/06-oppgaver.md#oppgave-oppfolging-over-tid`, `../monstre/06-oppgaver.md#oppgave-ved-hendelse`,
   `../monstre/06-oppgaver.md#oppgave-frist`, `../monstre/06-oppgaver.md#oppgave-milepael`
   Blir: `oppsett/task-template-sets/`
3. **La flyten for vedtaket opprette oppgavene**, og sjekke først om oppgaven alt finnes.
   Regler: `../monstre/07-flyt.md#flyt-forvaltningshandling`, `../monstre/07-flyt.md#flyt-oppgaven-finnes`
   Blir: `oppsett/workflows/`
4. **Sett statusen etter hvem som skal gjøre noe**, og hold saken åpen til siste rapport er vurdert.
   Regler: `../monstre/02-status.md#venting-etter-vedtaket`, `../monstre/02-status.md#kategori-med-vilje`,
   `../monstre/02-status.md#avsluttet-er-last`
   Blir: `oppsett/case-types/`
5. **Ta imot rapporten med Altinn** som en innhenting: et eget skjema for rapporten, instansen på saken, svaret inn som
   hendelse og flyten som oppdaterer saken ([Innhenting fra parten med et Altinn-skjema](innhenting-med-altinn-skjema.md)).
   Regler: `../monstre/11-integrasjoner.md#en-app-per-innsending`, `../monstre/11-integrasjoner.md#korrelasjon-paa-instans`
   Blir: `oppsett/workflows/` (flyten som tar imot rapporten). Altinn-appen bygges som i innhentingen.
6. **Ta imot rapporten fra innboksen** med en tagg for rapporter og «Legg i sak».
   Regler: `../monstre/10-skjema-og-innboks.md#tagg-ruter-ikke-sak`, `../monstre/10-skjema-og-innboks.md#legg-i-sak-er-overgangen`
   Blir: `oppsett/inbox-tags/`
7. **Purr** med en melding utenfor tråden når rapportskjemaet ikke ble sendt fra Neo.
   Regler: `../monstre/11-integrasjoner.md#melding-utenfor-traden`
   Blir: `oppsett/workflows/`
8. **Vurder rapporten** med en saksdatainstruks som fyller en mal ([Vurdering etter kriterier](vurdering-etter-kriterier.md)).
   Regler: `../monstre/08-instrukser.md#instruks-fyller-malen`, `../monstre/08-instrukser.md#instruks-saksdata-form`
   Blir: `oppsett/case-run-instructions/`
9. **Skriv en hendelse når en rapport er mottatt**, i flyten som tar den imot.
   Regler: `../monstre/13-innsikt.md#tall-krever-hendelse`, `../monstre/07-flyt.md#flyt-egen-hendelse`
   Blir: `oppsett/flow-event-types/`
10. **Lag køen** for det som venter på oppfølging, og vis forfalte frister i Nøkkeltall.
    Regler: `../monstre/12-visninger.md#ko-i-lista-sum-i-innsikt`, `../monstre/12-visninger.md#sorter-etter-jobben`,
    `../monstre/13-innsikt.md#nokkeltall-for-arbeidsmengde`
    Blir: steg i Neo: lagre visningen av køen

## Hvem gjør hva

- **Deterministisk:** oppgavene med fristene fra vedtaket, mottaket, journalføringen og kvitteringen av rapporten, og
  hendelsen.
- **Agenten:** vurderer rapporten mot vilkårene i vedtaket og fyller vurderingsmalen med sitat.
- **Mennesket:** godkjenner rapporten, purrer, og avgjør om noe skal kreves tilbake eller følges opp med et nytt pålegg.

## Avhengighetene

- Krever [Vedtak med begrunnelse](vedtak-med-begrunnelse.md): fristene kommer fra vedtaket.
- Rapporten inn med Altinn bygges med [Innhenting fra parten med et Altinn-skjema](innhenting-med-altinn-skjema.md).
  Planlegg Altinn-appene samlet med [Søknad inn fra Altinn](soknad-inn-fra-altinn.md): én app per slag innsending, og et
  eget instansfelt for rapportskjemaet.
- [Overlevering til et eksternt system etter vedtaket](overlevering-til-eksternt-system.md) når en utbetaling avhenger av
  en godkjent rapport.
- [Innsikt og nøkkeltall](innsikt-og-nokkeltall.md): `rapport.mottatt` må skrives for at mottatte rapporter kan telles.

## Grensene

- Neo har ingen gjentakende oppgave, så hver frist er sin egen oppgave (`../monstre/06-oppgaver.md#oppgave-oppfolging-over-tid`).
- Forfalte frister vises per ansatt i Nøkkeltall, ikke som tall over tid
  (`../monstre/13-innsikt.md#standardtall-for-saksbehandling`).
- Bare én utsendt forespørsel av samme slag kan stå ute om gangen (`../monstre/11-integrasjoner.md#ettersending-som-skjema`).

## Hull i reglene

- Hvordan en tilbakebetaling eller en sanksjon behandles; reglene nevner bare tallet
  (`../monstre/13-innsikt.md#standardtall-for-saksbehandling`).
