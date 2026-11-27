# Innsikt og nøkkeltall

Lederen skal rapportere hvor mange saker som kom inn, hvor mange som ble innvilget og avslått, hvor lang tid det tok,
og hvor mye som er innvilget mot utbetalt. Tallene må kunne forklares mot sakslista. De må være planlagt da flytene ble
bygget, fordi det som ikke ble registrert, ikke kan telles i ettertid.

## Når den passer

Når kravene nevner rapportering, statistikk, styringsdata, saksbehandlingstid eller tall til departementet. Tallene
regnes deterministisk av hendelser som flytene skriver. Den passer i alle prosesser, men planlegges før flytene bygges.

Den passer ikke for køer saksbehandleren jobber i. Det er [Fordeling og arbeidskøer](fordeling-og-arbeidskoer.md).

## Klossene

Flyten gjør handlingen → skriver den egne hendelsen og saksdataene fra de samme verdiene → strømmen leverer hendelsen →
rapporten i Innsikt teller den, og andre systemer lytter på den samme hendelsen.

- De egne hendelsestypene, med `caseId`, beløp som tall og dimensjoner som valg
- Flytene som skriver hendelsene der det skjer
- Saksfeltene rapportene bryter ned på
- Strømmen for Innsikt
- Rapportene og dashbordene
- Nøkkeltall for arbeidsmengden

## Slik bygges den

1. **Skriv ned hvert tall og øyeblikket det teller**, og finn hendelsen som markerer det. Start med standardtallene.
   Regler: `../monstre/13-innsikt.md#tall-krever-hendelse`, `../monstre/13-innsikt.md#standardtall-for-saksbehandling`
   Blir: `design/`
2. **Definer de egne hendelsene** for milepælene Neo ikke melder selv, med `caseId`, beløp som tall og dimensjoner som
   valg.
   Regler: `../monstre/07-flyt.md#flyt-egen-hendelse`, `../monstre/13-innsikt.md#caseid-kobler-hendelsen`,
   `../monstre/00-navn-pakking-og-versjoner.md#navn-hendelse-objekt-handling`,
   `../monstre/00-navn-pakking-og-versjoner.md#hendelsestypen-brytes-ikke`
   Blir: `oppsett/flow-event-types/`
3. **La flyten som gjør handlingen, skrive hendelsen**, i grenen der det skjer. Den egne hendelsen er den felles kilden:
   Innsikt og overleveringen til eksterne systemer lytter på de samme hendelsene, og flyten skriver saksdataene fra de
   samme verdiene i samme kjøring.
   Regler: `../monstre/07-flyt.md#flyt-tell-med-hendelse`,
   `../monstre/07-flyt.md#flyt-hendelse-og-saksdata-fra-samme-verdier`, `../monstre/05-felt-og-saksdata.md#felt-fodes-fra-saksdata`,
   `../monstre/07-flyt.md#flyt-overlevering-uten-integrasjon`
   Blir: `oppsett/workflows/`
4. **Gjør dimensjonene til filtrerbare valgfelt**, og bryt ned bare på felt som ikke endres. Det som endres, ligger i
   hendelsen.
   Regler: `../monstre/05-felt-og-saksdata.md#velg-felttype`, `../monstre/05-felt-og-saksdata.md#filterable-bevisst`,
   `../monstre/13-innsikt.md#filtrerbart-valgfelt`, `../monstre/13-innsikt.md#saksfelt-er-naa`
   Blir: `oppsett/custom-fields/`
5. **Lag en egen strøm for Innsikt** per område, aktiv, med hele hendelsen og uten filter, før de første sakene kommer.
   Regler: `../monstre/13-innsikt.md#en-strom-for-innsikt`, `../monstre/13-innsikt.md#strommen-er-en-del-av-kjeden`,
   `../monstre/13-innsikt.md#mappingen-beholder-det-som-telles`, `../monstre/13-innsikt.md#filtrer-i-rapporten-ikke-i-strommen`
   Blir: steg i Neo: opprette strømmen
6. **Bygg rapportene**, med andeler som to metrikker og en formel, og definisjonen i beskrivelsen.
   Regler: `../monstre/13-innsikt.md#andel-av-to-summer`, `../monstre/13-innsikt.md#definisjonen-i-beskrivelsen`
   Blir: steg i Neo: lage rapportene i Innsikt
7. **Lag ett dashbord per mottaker.**
   Regler: `../monstre/13-innsikt.md#dashbord-per-mottaker`
   Blir: steg i Neo: lage dashbordene i Innsikt
8. **Bruk Nøkkeltall for arbeidsmengden per ansatt.** Det krever kategorien på statusene og fristene på oppgavene.
   Regler: `../monstre/06-oppgaver.md#oppgave-frist`, `../monstre/13-innsikt.md#nokkeltall-for-arbeidsmengde`
   Blir: `oppsett/task-template-sets/`
9. **Gi Innsikt bare til dem som kan se tall på tvers av alle sakstyper.**
   Regler: `../monstre/14-tilgang.md#jobbroller-etter-jobben`, `../monstre/13-innsikt.md#innsikt-ser-alle-saker`
   Blir: steg i Neo: gi lederrollen

## Hvem gjør hva

- **Deterministisk:** alt. Flytene skriver hendelsene, og Innsikt teller dem.
- **Agenten:** har ingen rolle.
- **Mennesket:** lederen bestemmer hvilke tall som skal fram. Den som bygger, skriver definisjonen.

## Avhengighetene

Hendelsene skrives av flytene i de andre oppskriftene. Planlegg dem samlet, før flytene bygges:

| Tallet | Hendelsen | Skrives i |
|---|---|---|
| Mottatt per type eller ordning | `case.created` (Neos egen) | [Søknad inn fra Altinn](soknad-inn-fra-altinn.md), [Henvendelse inn fra e-post og innboks](henvendelse-inn-fra-epost-og-innboks.md) |
| Antall per utfall, avslagsandel, innvilget beløp | `vedtak.fattet` | [Vedtak med begrunnelse](vedtak-med-begrunnelse.md) |
| Tilsagn sendt, svar fra parten mottatt | `tilsagn.gitt` | [Innhenting fra parten med et Altinn-skjema](innhenting-med-altinn-skjema.md) |
| Rapporter mottatt | `rapport.mottatt` | [Oppfølging med rapporter og frister](oppfolging-med-rapporter-og-frister.md) |
| Utbetalt beløp, innvilget mot utbetalt | `utbetaling.bestilt` | [Overlevering til et eksternt system](overlevering-til-eksternt-system.md) |
| Tilbakebetaling eller sanksjoner | `tilbakebetaling.krevd` | ingen oppskrift |

Hendelsesnavnene er eksempler; de settes i designet. Dimensjonene (variantfeltet, utfallsfeltet) kommer fra
[Grunnoppsettet for sakstypen](grunnoppsett-for-sakstypen.md). Den samme hendelsen som Innsikt teller, er den
[Overlevering til et eksternt system](overlevering-til-eksternt-system.md) lytter på. De planlegges sammen.

## Grensene

- Bare vanlige rapporter regnes; trakt, flyt og retensjon gjør det ikke. Varsler på en terskel finnes ikke
  (innledningen i `../monstre/13-innsikt.md`).
- Rapporter og dashbord er ikke konfig. De bygges i Neo i hver organisasjon.
- Ingen summering over saksdata og ingen kobling til et økonomisystem.
- Sakens felt har verdien nå, ikke da hendelsen skjedde (`../monstre/13-innsikt.md#saksfelt-er-naa`).
- En hendelse ingen strøm leverte, kan ikke telles i ettertid (`../monstre/13-innsikt.md#strommen-er-en-del-av-kjeden`).
- Saksbehandlingstid finnes i Nøkkeltall fra opprettet til første avslutning, ikke til vedtak og ikke per type
  (`../monstre/13-innsikt.md#standardtall-for-saksbehandling`).
- Rapportene går forbi tilgangsgruppene (`../monstre/13-innsikt.md#innsikt-ser-alle-saker`).
