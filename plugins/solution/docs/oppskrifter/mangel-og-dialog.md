# Mangel og dialog med parten

Søknaden mangler noe, eller saksbehandleren trenger mer fra parten. Det må gå ut en forespørsel med frist, saken skal stå
som ventende mens svaret er ute, og svaret må finne veien tilbake til riktig sak, så saken kan gå videre når alt er
kommet.

## Når den passer

Når kravene sier at parten kan bli bedt om å ettersende, rette eller forklare noe (forvaltningsloven § 17), eller at
noen andre skal gi en uttalelse før saken kan avgjøres. Mennesket bestemmer hva det spørres om; flyten sender, setter
status og holder orden på det som står ute.

Den passer ikke for brev som bare informerer uten at saken venter
([Foreløpig svar og forhåndsvarsel](forelopig-svar-og-forhandsvarsel.md)). Venting etter vedtaket, som aksept av et
tilsagn, bygges med [Innhenting fra parten med et Altinn-skjema](innhenting-med-altinn-skjema.md) alene.

## Klossene

Handling på kontrolloppgaven → flyt (mangelbrev, journalpost, forespørsel ut, venteoppgave, ventestatus) → svaret inn
(Altinn eller e-post) → flyten lukker venteoppgaven og setter saken tilbake til behandling.

- Ventestatusen og venteoppgaven
- Mangelbrevet
- Flyten som sender forespørselen, og flyten som tar imot svaret
- Altinn-delen: [Innhenting fra parten med et Altinn-skjema](innhenting-med-altinn-skjema.md)

## Slik bygges den

1. **Lag én ventestatus i kategorien VENTER**, og la venteoppgavene si hva det ventes på.
   Regler: `../monstre/02-status.md#kategori-med-vilje`, `../monstre/02-status.md#en-ventestatus`
   Blir: `oppsett/case-types/`
2. **Lag venteoppgaven som en mal som en flyt oppretter**, med fristen svaret ventes innen.
   Regler: `../monstre/06-oppgaver.md#oppgave-ved-hendelse`, `../monstre/06-oppgaver.md#oppgave-venter`,
   `../monstre/06-oppgaver.md#oppgave-frist`
   Blir: `oppsett/task-template-sets/`
3. **Lag mangelbrevet som en delt mal**, med en overskrift som sier hva som trengs, og fristen fra saken.
   Regler: `../monstre/09-maler.md#mal-delte-brev`, `../monstre/16-skriving.md#overskrift-sier-budskapet`,
   `../monstre/09-maler.md#mal-ingen-fast-frist`, `../monstre/16-skriving.md#du-og-vi`,
   `../monstre/16-skriving.md#klart-sprak`, `../monstre/09-maler.md#mal-utkast-med-neo`
   Blir: `oppsett/document-templates/`
4. **Heng handlingen på oppgaven** der mangelen oppdages, og bestem hva flyten gjør når en forespørsel alt står ute.
   Regler: `../monstre/07-flyt.md#flyt-handling-pa-objektet`, `../monstre/06-oppgaver.md#oppgave-handling`,
   `../monstre/07-flyt.md#flyt-forvaltningshandling`, `../monstre/07-flyt.md#flyt-oppgaven-finnes`
   Blir: `oppsett/workflows/`
5. **Journalfør forespørselen før den sendes.**
   Regler: `../monstre/11-integrasjoner.md#utgaende-journalfores-for-sending`
   Blir: `oppsett/workflows/`
6. **Send forespørselen.** Med Altinn: forespørselen ut, instansen på saken og svaret inn bygges etter
   [Innhenting fra parten med et Altinn-skjema](innhenting-med-altinn-skjema.md). Uten Altinn: e-post fra en valgt
   postboks, eller en melding utenfor søknadens tråd.
   Regler: `../monstre/07-flyt.md#flyt-epost-ut-fra-postboksen`, `../monstre/11-integrasjoner.md#melding-utenfor-traden`
   Blir: `oppsett/workflows/`
7. **Ta imot svaret**: legg det i saken, lukk venteoppgaven, og sett saken tilbake til behandling bare når ingenting
   annet står ute. Et svar på e-post legges i sak fra innboksen
   ([Henvendelse inn fra e-post og innboksen](henvendelse-inn-fra-epost-og-innboks.md)).
   Regler: `../monstre/10-skjema-og-innboks.md#legg-i-sak-er-overgangen`, `../monstre/07-flyt.md#flyt-ventestatus`
   Blir: `oppsett/workflows/`
8. **Kryss av i vurderingen når parten ikke svarte**, så vedtaket kan si det.
   Regler: `../monstre/05-felt-og-saksdata.md#prosa-i-text-fakta-i-fields`
   Blir: `oppsett/case-data-templates/`

## Hvem gjør hva

- **Deterministisk:** utsendingen, journalføringen, ventestatusen, venteoppgaven, at svaret finner saken, og at saken går
  tilbake til behandling når ingenting står ute.
- **Agenten** kan skrive utkast til mangelbrevet fra malen og behandlingsregelen. Saksbehandleren går gjennom det.
- **Mennesket** bestemmer hva det spørres om, trykker på handlingen, og vurderer svaret.

## Avhengighetene

- Krever [Grunnoppsettet for en sakstype](grunnoppsett-for-sakstypen.md) og
  [Søknad inn fra Altinn](soknad-inn-fra-altinn.md) (instansfeltet og dialogen).
- Altinn-delen er [Innhenting fra parten med et Altinn-skjema](innhenting-med-altinn-skjema.md).
- Kommer ofte fra [Formell kontroll](formell-kontroll.md).
- Samme ventestatus og venteoppgaver brukes av [Foreløpig svar og forhåndsvarsel](forelopig-svar-og-forhandsvarsel.md)
  (uttalelsen). Planlegg dem sammen.
- [Journalføring og offentlig journal](journalforing-og-offentlig-journal.md): utgående forespørsel og inngående svar.
- Skal [Innsikt og nøkkeltall](innsikt-og-nokkeltall.md) telle forespørsler eller ventetid, må flyten skrive en egen
  hendelse (`../monstre/13-innsikt.md#tall-krever-hendelse`).

## Grensene

- Grensene for Altinn-delen (én forespørsel av samme slag om gangen, reglene i tråden) står i
  [Innhenting fra parten med et Altinn-skjema](innhenting-med-altinn-skjema.md).
- E-postnoden har ett forsøk, og det finnes ingen reserveavsender (`../monstre/07-flyt.md#flyt-epost-ut-fra-postboksen`).

## Hull i reglene

- Hva som skjer når fristen på venteoppgaven går ut: purring, ny frist eller avgjørelse på det som foreligger, og om en
  flyt med noden «Vent» skal sette det i gang.
