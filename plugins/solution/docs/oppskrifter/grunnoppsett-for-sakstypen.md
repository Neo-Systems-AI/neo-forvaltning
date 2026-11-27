# Grunnoppsettet for en sakstype

En ny prosess skal inn i Neo: søknader, tilsyn, klager eller meldinger. Før noe kan automatiseres, må saken ha en form:
hva én sak er, hvilke steg den går gjennom, hva saksbehandleren skal gjøre, og hva agenten skal vite. Alle de andre
oppskriftene bygger på denne.

## Når den passer

Alltid, og først. Kjennetegnene i kravene: noe som skal få et utfall (en søknad, et tilsyn, en klage, en melding), en
hjemmel, og steg fra mottak til avslutning. Flyten er mest menneske og agent; automatiseringen kommer med de andre
oppskriftene.

Den passer ikke alene når kravene beskriver arbeid på tvers av mange saker, som en felles søknadsfrist og rangering
eller et møte med agenda. Da kommer [Runde med tildeling](runde-med-tildeling.md) eller
[Behandling i møte](behandling-i-mote.md) i tillegg, med en egen sakstype for runden eller møtet.

## Klossene

Statusløp, felt, saksdatamaler, behandlingsregel og oppgavemal → sakstypen som setter dem sammen → (veiviseren).

- Sakstypen med statusløpet og agentverktøyene
- Feltene, med variantfeltet og utfallsfeltet
- Saksdatamalene for grunnlaget og vurderingen
- Behandlingsregelen
- Oppgavemalen
- Veiviseren, når saken har et fast løp med mye på

## Slik bygges den

1. **Bestem hva én sak er, og hvor mange sakstyper det blir.** Én ting med ett løp per sak, så få sakstyper som mulig,
   og en variant som felt når bare oppgavene skiller. Lag to sakstyper bare når løpet, halen eller tilgangen er en annen.
   En klage er alltid sin egen sakstype ([Endring og klage](endring-og-klage.md)).
   Regler: `../monstre/01-sakstype.md#en-sak-en-ting`, `../monstre/01-sakstype.md#egen-sakstype-nar`,
   `../monstre/14-tilgang.md#tilgang-skiller-sakstyper`, `../monstre/01-sakstype.md#ikke-ror-generell`
   Blir: `design/`
2. **Bestem navnene før noe bygges.** Flyter, visninger og veiviseren finner objektene på navnet.
   Regler: `../monstre/00-navn-pakking-og-versjoner.md#navn-er-nokkelen`, `../monstre/01-sakstype.md#navn-og-slug`,
   `../monstre/05-felt-og-saksdata.md#prefiks-per-sakstype`
   Blir: `design/`
3. **Lag statusløpet.** Bestem statusnavnene først og hold dem stabile. Statusene er tilstander, ikke arbeid; gruppene er
   fasene; hver status har en kategori. Ta med vedtaksstatusen og ventestatusen nå, selv om de bygges ut i andre
   oppskrifter. Ventestatusen etter vedtaket, mens klagefristen løper, står i
   [Vedtak med begrunnelse](vedtak-med-begrunnelse.md).
   Regler: `../monstre/02-status.md#stabile-statusnavn`, `../monstre/01-sakstype.md#sekvensielt-lop`,
   `../monstre/02-status.md#rekkefolgen-er-lopet`, `../monstre/02-status.md#status-er-tilstand`,
   `../monstre/02-status.md#grupper-er-faser`, `../monstre/02-status.md#kategori-med-vilje`,
   `../monstre/02-status.md#status-om-saken`, `../monstre/02-status.md#status-har-en-leser`,
   `../monstre/02-status.md#beskrivelse-sier-hva-som-er-sant`, `../monstre/02-status.md#fire-farger`,
   `../monstre/02-status.md#en-vedtaksstatus`, `../monstre/02-status.md#en-ventestatus`
   Blir: `oppsett/case-types/`
4. **Lag feltene.** Still spørsmålene i «Kortversjonen» i `../monstre/05-felt-og-saksdata.md`: part, relasjonsfelt,
   saksfelt eller saksdata. Lag valgene med nøkkel og etikett før variantfeltet og utfallsfeltet.
   Regler: `../monstre/05-felt-og-saksdata.md#parten-er-sakspart`, `../monstre/12-visninger.md#kolonne-krever-saksfelt`,
   `../monstre/05-felt-og-saksdata.md#nokkel-og-etikett`, `../monstre/05-felt-og-saksdata.md#velg-felttype`,
   `../monstre/05-felt-og-saksdata.md#filterable-bevisst`, `../monstre/05-felt-og-saksdata.md#seksjon-pa-feltet`,
   `../monstre/05-felt-og-saksdata.md#et-felt-har-en-leser`, `../monstre/01-sakstype.md#variant-som-felt`,
   `../monstre/01-sakstype.md#variant-styrer-bare-oppgaver`,
   `../monstre/05-felt-og-saksdata.md#standardverdi-pa-bindingen`, `../monstre/05-felt-og-saksdata.md#ki-forslag-med-vilje`
   Blir: `oppsett/custom-fields/`
5. **Lag saksdatamalene.** Én for grunnlaget som kommer inn, én for vurderingen. Del en mal bare når den bærer en plikt.
   Regler: `../monstre/05-felt-og-saksdata.md#fakta-og-vurdering-hver-sin-mal`,
   `../monstre/05-felt-og-saksdata.md#modus-etter-hvem-som-fyller`,
   `../monstre/05-felt-og-saksdata.md#en-vurderingsmal-per-sakstype`,
   `../monstre/05-felt-og-saksdata.md#etikett-og-beskrivelse`,
   `../monstre/05-felt-og-saksdata.md#seksjon-innhold-skillelinje`,
   `../monstre/05-felt-og-saksdata.md#bare-ferdige-blokker`,
   `../monstre/05-felt-og-saksdata.md#varsel-for-den-som-fyller-ut`,
   `../monstre/00-navn-pakking-og-versjoner.md#navn-innholdet-forst`
   Blir: `oppsett/case-data-templates/`
6. **Skriv behandlingsregelen.** Én per sakstype, med faste seksjoner, arbeidsdelingen og variantene som seksjoner.
   Skrivereglene og målformen står i én delt instruks.
   Regler: `../monstre/08-instrukser.md#instruks-en-behandlingsregel`, `../monstre/08-instrukser.md#instruks-arbeidsdeling`,
   `../monstre/08-instrukser.md#instruks-varianter-som-seksjoner`, `../monstre/08-instrukser.md#instruks-kilde-per-punkt`,
   `../monstre/08-instrukser.md#instruks-ingen-oppdiktede-fakta`, `../monstre/08-instrukser.md#instruks-ingen-app-mekanikk`,
   `../monstre/08-instrukser.md#instruks-delt-eller-egen`, `../monstre/16-skriving.md#malform-ett-sted`,
   `../monstre/16-skriving.md#skrivereglene-i-en-delt-instruks`
   Blir: `oppsett/instructions/`
7. **Lag oppgavemalen.** Den krever statusløpet (steget) og behandlingsregelen, som oppgavene viser til. Avgjøres
   varianten inne i saken, lages oppgavene for den senere.
   Regler: `../monstre/06-oppgaver.md#oppgave-mal-finnes`, `../monstre/06-oppgaver.md#oppgave-ett-sett-per-sakstype`,
   `../monstre/00-navn-pakking-og-versjoner.md#navn-oppgavesett`, `../monstre/06-oppgaver.md#oppgave-steg`,
   `../monstre/06-oppgaver.md#oppgave-hva-og-hvor`, `../monstre/06-oppgaver.md#oppgave-komplett`,
   `../monstre/06-oppgaver.md#oppgave-grupper`, `../monstre/06-oppgaver.md#oppgave-variant`,
   `../monstre/06-oppgaver.md#oppgave-variant-senere`, `../monstre/06-oppgaver.md#oppgave-frist`,
   `../monstre/06-oppgaver.md#oppgave-milepael`, `../monstre/06-oppgaver.md#oppgave-ansvarlig-tom`,
   `../monstre/06-oppgaver.md#oppgavestatus-kategorien-teller`
   Blir: `oppsett/task-template-sets/`
8. **Sett sammen sakstypen.** Knytt delene, gi agenten verktøyene kildene krever, og kart bare når saken avgjøres på
   kart.
   Regler: `../monstre/01-sakstype.md#sakstypen-er-montasjen`, `../monstre/01-sakstype.md#agentens-verktoy-etter-kildene`,
   `../monstre/01-sakstype.md#kartlag-med-et-sporsmal`
   Blir: `oppsett/case-types/`
9. **Vurder en veiviser til slutt**, bare når saken har et fast løp med mye på.
   Regler: `../monstre/03-veiviser.md#visning-ikke-saksbehandling`, `../monstre/03-veiviser.md#nar-veiviser`
   Blir: `oppsett/case-wizards/`

## Hvem gjør hva

- **Deterministisk:** oppgavene lages fra malen når saken opprettes, og variantfeltet velger hvilke.
- **Agenten** leser behandlingsregelen på hver sak, foreslår verdier i felt der KI-forslag er slått på, og fyller
  saksdatamaler når saksbehandleren ber om det. Saksbehandleren godtar eller avviser.
- **Mennesket** tar valgene i designet og avgjør alt som krever skjønn i saken, også utfallet.

## Avhengighetene

Alle de andre oppskriftene krever denne. Bestem disse sammen, før resten bygges:

- **Utfallsfeltet og vedtaksstatusen**: brukt av [Vedtak med begrunnelse](vedtak-med-begrunnelse.md), visningene i
  [Fordeling og arbeidskøer](fordeling-og-arbeidskoer.md) og tallene i [Innsikt og nøkkeltall](innsikt-og-nokkeltall.md).
- **Variantfeltet** (ordningen, tilsynsområdet): styrer oppgavene, seksjonene i behandlingsregelen og nedbrytningen i
  Innsikt. Det må være et filtrerbart valgfelt (`../monstre/13-innsikt.md#filtrerbart-valgfelt`).
- **Statusnavnene**: veiviseren, visningene og flyter som deles av flere sakstyper, finner statusen på navnet.
- **Tilgangen**: skal to slags saker ha ulik tilgang, er de to sakstyper fra start
  ([Tilgang og inhabilitet](tilgang-og-inhabilitet.md)).
- **Klagen**: en klage er en egen sakstype med relasjon til vedtakssaken ([Endring og klage](endring-og-klage.md)).

## Grensene

- Et felt kan ikke merkes som påkrevd; det er en betingelse i veiviseren eller i brevet
  (`../monstre/05-felt-og-saksdata.md#pakrevd-er-en-betingelse`).
- Variantfeltet styrer bare oppgavene, ikke statuser, maler eller saksdatamaler
  (`../monstre/01-sakstype.md#variant-styrer-bare-oppgaver`).
- Visningene, veiviseren og brevflettingen leser ikke saksdata (`../monstre/12-visninger.md#kolonne-krever-saksfelt`).
- Felt på oppgaver gjelder hele organisasjonen, ikke sakstypen (`../monstre/05-felt-og-saksdata.md#ikke-oppgavefelt`).
- Seks blokktyper i saksdatamalene er plassholdere (`../monstre/05-felt-og-saksdata.md#bare-ferdige-blokker`).
- Agentverktøyene kopieres inn når saken opprettes, så en endring gjelder bare nye saker
  (`../monstre/01-sakstype.md#agentens-verktoy-etter-kildene`).
