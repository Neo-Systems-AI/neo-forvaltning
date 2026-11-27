# Tilgang og inhabilitet

Noen saker har innhold bare noen skal se: personalsaker, helse, varsling, saker om egne ansatte. Den som er inhabil i en
sak, skal ikke tilrettelegge eller avgjøre den, og det må kunne vises at habiliteten ble vurdert. Samtidig må alle som
skal lese, godkjenne eller fordele sakene, se dem.

## Når den passer

Når kravene nevner taushetsplikt, skjermede saker, begrenset tilgang, habilitet, eksterne fagvurderere eller at KI ikke
skal brukes på visse saker. Habilitetsvurderingen er en oppgave mennesket gjør i saken.

Den passer ikke for å rydde i lister. Det gjør visningene ([Fordeling og arbeidskøer](fordeling-og-arbeidskoer.md)).

## Klossene

Roller etter jobben → sakstypen åpen eller begrenset til en tilgangsgruppe → ansvaret for én sak → habilitetsoppgaven
i saken → KI-reglene og skjermingen mot arkivet.

- Jobbrollene
- Sakstypen, og en egen sakstype når tilgangen skal være ulik
- Tilgangsgruppa, helst fra Entra
- Habilitetsoppgaven og behandlingsregelen
- KI-reglene på sakstypen eller organisasjonen
- Den offentlige tittelen og skjermingen mot arkivet

## Slik bygges den

1. **Gi rollene etter jobben.**
   Regler: `../monstre/14-tilgang.md#jobbroller-etter-jobben`
   Blir: steg i Neo: gi rollene, helst gjennom Entra
2. **La sakstypen være åpen** til innholdet krever noe annet. Skal tilgangen være ulik, er det to sakstyper. Avklar
   også om et eksternt system skal lese sakene gjennom API-et.
   Regler: `../monstre/14-tilgang.md#apen-som-standard`, `../monstre/01-sakstype.md#egen-sakstype-nar`,
   `../monstre/14-tilgang.md#tilgang-skiller-sakstyper`, `../monstre/14-tilgang.md#maskinklienten-ser-bare-apne`
   Blir: `design/`, og sakstypene i `oppsett/case-types/`
3. **Lag tilgangsgruppa** med alle som må lese, også lederen og godkjenneren. Gi den navn etter sakstypen og jobben, og
   hent medlemmene fra Entra når det finnes. Koble den til sakstypen før de første sakene kommer.
   Regler: `../monstre/14-tilgang.md#gruppa-har-alle-som-ma-lese`, `../monstre/14-tilgang.md#entra-er-kilden`,
   `../monstre/14-tilgang.md#tilgangen-settes-i-org-en`
   Blir: steg i Neo: opprette gruppa og begrense sakstypen
4. **Bruk ansvaret for én sak** når én person utenfor gruppa skal behandle den.
   Regler: `../monstre/14-tilgang.md#ansvarlig-ser-sin-sak`
   Blir: steg i Neo: gjøre personen ansvarlig i saken
5. **Hold flytene til sin sakstype**, fordi en flyt uten bruker ser alle saker.
   Regler: `../monstre/07-flyt.md#flyt-en-per-sakstype`, `../monstre/14-tilgang.md#flyter-ser-som-den-som-starter`
   Blir: `oppsett/workflows/`
6. **Gjør habiliteten til en oppgave tidlig i saksgangen.** Behandlingsregelen sier at agenten melder tegn på
   tilknytning og ikke vurderer dem. Har saken flere som vurderer, får hver sin oppgave.
   Regler: `../monstre/14-tilgang.md#inhabilitet-som-oppgave`, `../monstre/06-oppgaver.md#oppgave-steg`,
   `../monstre/08-instrukser.md#instruks-arbeidsdeling`
   Blir: `oppsett/task-template-sets/` og `oppsett/instructions/`
7. **Avklar eksterne vurderere** før oppsettet bygges.
   Regler: `../monstre/14-tilgang.md#eksterne-vurderere`
   Blir: `design/`
8. **Slå av KI der innholdet krever det**: på sakstypen når det følger sakstypen, ellers på organisasjonen.
   Regler: `../monstre/08-instrukser.md#instruks-ki-regel`, `../monstre/18-org-niva.md#ki-bryter-eller-regel`,
   `../monstre/18-org-niva.md#ki-regel-pa-sakstypen-nar-den-folger-sakstypen`,
   `../monstre/18-org-niva.md#ki-regel-uten-betingelse-gjelder-overalt`, `../monstre/18-org-niva.md#ki-regel-ved-sletting`
   Blir: `oppsett/case-types/` for regelen på sakstypen, steg i Neo for organisasjonens regel
9. **Hold personnavn ute av det som går til arkivet**, og skjerm med de faste hjemlene
   ([Journalføring og offentlig journal](journalforing-og-offentlig-journal.md)).
   Regler: `../monstre/11-integrasjoner.md#offentlig-tittel-uten-navn`, `../monstre/18-org-niva.md#skjermingshjemlene-er-faste`
   Blir: `oppsett/workflows/` for tittelen i inntaket, steg i Neo for skjermingen i dokumentene
10. **Legg bare id-er, tall og valg i hendelsene** fra en begrenset sakstype, fordi Innsikt ser alle sakstyper.
    Søk og visninger følger gruppa.
    Regler: `../monstre/13-innsikt.md#innsikt-ser-alle-saker`, `../monstre/17-sok.md#sok-ser-som-medlemmet`,
    `../monstre/12-visninger.md#visning-gir-ikke-tilgang`
    Blir: `oppsett/flow-event-types/`

## Hvem gjør hva

- **Deterministisk:** synligheten etter sakstype, gruppe og ansvar, KI-reglene, og den offentlige tittelen mot arkivet.
- **Agenten:** melder tegn på tilknytning når behandlingsregelen ber om det, men vurderer ikke habiliteten.
- **Mennesket:** vurderer sin egen habilitet. Lederen flytter ansvaret og oppgavene når noen er inhabil.

## Avhengighetene

- Bestemmes sammen med [Grunnoppsettet for sakstypen](grunnoppsett-for-sakstypen.md): ulik tilgang betyr to sakstyper
  fra start.
- [Godkjenning i to ledd](godkjenning-i-to-ledd.md): godkjenneren må være i gruppa.
- [Vurdering etter kriterier](vurdering-etter-kriterier.md) og [Runde med tildeling](runde-med-tildeling.md):
  habilitetsoppgaven for hver som vurderer.
- [Innsikt og nøkkeltall](innsikt-og-nokkeltall.md): unngå nedbrytninger som avslører personer i en begrenset sakstype.

## Grensene

- Neo har ingen tilgang per sak ut over den ansvarlige, og ingen måte å stenge én person ute fra én sak
  (`../monstre/14-tilgang.md#inhabilitet-som-oppgave`).
- Ingen rolle går forbi synlighetsregelen, heller ikke org-admin (`../monstre/14-tilgang.md#jobbroller-etter-jobben`).
- Eksterne vurderere i gruppa ser alle sakene av typen. Skal de bare se sine egne, er det et produktgap
  (`../monstre/14-tilgang.md#eksterne-vurderere`).
- Et system som leser gjennom API-et uten medlem, ser bare sakstyper uten begrensning
  (`../monstre/14-tilgang.md#maskinklienten-ser-bare-apne`).
- Rapportene i Innsikt viser hendelser fra alle sakstyper (`../monstre/13-innsikt.md#innsikt-ser-alle-saker`).
- Et medlemskap fra Entra kan ikke fjernes for hånd i Neo (`../monstre/14-tilgang.md#entra-er-kilden`).
- En KI-regel kan bare slå av, ikke på (`../monstre/08-instrukser.md#instruks-ki-regel`).
