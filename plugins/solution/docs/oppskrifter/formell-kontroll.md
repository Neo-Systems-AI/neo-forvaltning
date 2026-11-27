# Formell kontroll

Før saken vurderes, må noen sjekke at den er komplett og at parten kan søke: kom søknaden innen fristen, er vedleggene
med, er søkeren registrert, gjelder den riktig ordning. Kontrollen er den samme i alle sakene og bør gjøres likt hver
gang, så det som mangler, blir oppdaget tidlig.

## Når den passer

Når kravene har vilkår som kan sjekkes uten skjønn (en dato, et register, et vedlegg som finnes eller ikke) eller en
liste over hva søknaden må inneholde. Det som kan sjekkes maskinelt, gjør en flyt. Det som krever lesing av dokumenter,
gjør agenten som utkast, og saksbehandleren kontrollerer.

Den passer ikke for vurderingen av om vilkårene er oppfylt; det er [Vurdering etter kriterier](vurdering-etter-kriterier.md).

## Klossene

Saken i mottak → kontrolloppgavene + flyten med de maskinelle sjekkene + saksdatainstruksen som fyller kontrollmalen →
funnene i saksdata → saksbehandleren avgjør om saken er komplett.

- Kontrolloppgavene i mottakssteget
- Flyten med de maskinelle sjekkene
- Saksdatamalen for kontrollen
- Saksdatainstruksen som lar agenten kontrollere dokumentene
- Et saksfelt for resultatet, når noe skal lese det

## Slik bygges den

1. **Del kontrollen i det som er likt hver gang, og det som krever skjønn.**
   Regler: `../monstre/08-instrukser.md#instruks-bare-skjonn`
   Blir: `design/`
2. **Legg kontrollene som oppgaver i mottakssteget**, gruppert, med variantens nøkkel på det som bare gjelder noen.
   Regler: `../monstre/02-status.md#status-er-tilstand`, `../monstre/06-oppgaver.md#oppgave-steg`,
   `../monstre/06-oppgaver.md#oppgave-hva-og-hvor`, `../monstre/06-oppgaver.md#oppgave-komplett`,
   `../monstre/06-oppgaver.md#oppgave-grupper`, `../monstre/06-oppgaver.md#oppgave-variant`
   Blir: `oppsett/task-template-sets/`
3. **Gjør de maskinelle sjekkene i en flyt**, med en synlig tabell for verdier som varierer, og et stopp med melding når
   noe er galt. Registeroppslagene står i [Opplysninger fra registre og kart](registre-og-kart.md).
   Regler: `../monstre/07-flyt.md#flyt-tabell-for-oppslag`, `../monstre/07-flyt.md#flyt-er-en-av`,
   `../monstre/07-flyt.md#flyt-stopp-med-melding`, `../monstre/07-flyt.md#flyt-parametrene`
   Blir: `oppsett/workflows/`
4. **Lag kontrollmalen** og skriv funnene i saksdata, ikke i oppgavefelt. Et utfall som ellers ville vært et tomt felt,
   krysses av.
   Regler: `../monstre/05-felt-og-saksdata.md#ikke-oppgavefelt`,
   `../monstre/05-felt-og-saksdata.md#fakta-og-vurdering-hver-sin-mal`,
   `../monstre/05-felt-og-saksdata.md#prosa-i-text-fakta-i-fields`
   Blir: `oppsett/case-data-templates/`
5. **La agenten kontrollere dokumentene** med en saksdatainstruks som fyller kontrollmalen, krever sitat og svarer
   «uavklart» ved tvil.
   Regler: `../monstre/05-felt-og-saksdata.md#modus-etter-hvem-som-fyller`, `../monstre/08-instrukser.md#instruks-fyller-malen`,
   `../monstre/08-instrukser.md#instruks-saksdata-form`, `../monstre/05-felt-og-saksdata.md#vurdering-i-saksdata`,
   `../monstre/08-instrukser.md#instruks-uavklart-er-svar`, `../monstre/08-instrukser.md#instruks-staa-alene`,
   `../monstre/08-instrukser.md#instruks-ki-tre-former`
   Blir: `oppsett/case-run-instructions/`
6. **Publiser saksdatainstruksen.**
   Regler: `../monstre/08-instrukser.md#instruks-publiser-saksdatainstruksen`
   Blir: steg i Neo: publiser saksdatainstruksen
7. **Gjør resultatet til et saksfelt** bare når en visning eller en betingelse i veiviseren skal lese det.
   Regler: `../monstre/12-visninger.md#kolonne-krever-saksfelt`, `../monstre/03-veiviser.md#betingelsen-leser-data`
   Blir: `oppsett/custom-fields/`
8. **Bestem veien etter utfallet.** Mangler noe: [Mangel og dialog med parten](mangel-og-dialog.md). Skal saken avvises:
   det er et vedtak ([Vedtak med begrunnelse](vedtak-med-begrunnelse.md)). Handlingen som sender forespørselen, henger
   på kontrolloppgaven.
   Regler: `../monstre/06-oppgaver.md#oppgave-handling`
   Blir: `design/`

## Hvem gjør hva

- **Deterministisk:** datoer, registeroppslag, at et vedlegg finnes, at verdien er en av de gyldige.
- **Agenten** leser dokumentene og fyller kontrollmalen med sitat, og sier «uavklart» når den ikke finner svaret.
  Saksbehandleren kvitterer ut.
- **Mennesket** avgjør om saken er komplett, og om det skal sendes en forespørsel eller fattes vedtak om avvisning.

## Avhengighetene

- Krever [Grunnoppsettet for en sakstype](grunnoppsett-for-sakstypen.md), og at grunnlaget står i saken:
  [Søknad inn fra Altinn](soknad-inn-fra-altinn.md) eller
  [Henvendelse inn fra e-post og innboksen](henvendelse-inn-fra-epost-og-innboks.md).
- Henger sammen med [Mangel og dialog med parten](mangel-og-dialog.md): handlingen som sender forespørselen, henger på
  kontrolloppgaven.
- Skal [Innsikt og nøkkeltall](innsikt-og-nokkeltall.md) telle mangler eller avvisninger, må flyten skrive en egen
  hendelse når det skjer (`../monstre/13-innsikt.md#tall-krever-hendelse`).

## Grensene

- Veiviseren, visningene og brevene leser ikke saksdata, så et kontrollresultat de skal bruke, må være et felt
  (`../monstre/12-visninger.md#kolonne-krever-saksfelt`).
- Et felt kan ikke merkes som påkrevd (`../monstre/05-felt-og-saksdata.md#pakrevd-er-en-betingelse`).
- «La Neo lage den» lager alltid et nytt datasett (`../monstre/05-felt-og-saksdata.md#modus-etter-hvem-som-fyller`).
- En saksdatainstruks er usynlig til den er publisert (`../monstre/08-instrukser.md#instruks-publiser-saksdatainstruksen`).
