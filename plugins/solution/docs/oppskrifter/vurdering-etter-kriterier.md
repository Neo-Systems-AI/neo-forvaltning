# Vurdering etter kriterier

Saken skal vurderes mot vilkår eller kriterier: er vilkårene oppfylt, hvor mange poeng gir prosjektet, hvor høy er
risikoen ved virksomheten. Vurderingen krever skjønn. Den skal likevel være lik fra sak til sak, vise til kilden og kunne
kontrolleres av en annen.

## Når den passer

Når kravene har vilkår, tildelingskriterier, risikokriterier eller en poengskala, med hjemmel eller retningslinje.
Agenten skriver utkast til vurderingen per kriterium med sitat fra kilden. Saksbehandleren kontrollerer og eier den.

Den passer ikke for det som kan sjekkes uten skjønn; bruk [Formell kontroll](formell-kontroll.md). Den passer heller
ikke for å sammenligne mange saker mot hverandre; bruk [Runde med tildeling](runde-med-tildeling.md).

## Klossene

behandlingsregel → saksdatainstruks → vurderingsmal i saksdata → summen som felt → vurderingsoppgaven i saken.

- Behandlingsregelen med kriteriene, vekten og kilden.
- Vurderingsmalen i saksdata, med én rad per kriterium.
- Et tallfelt for summen, når sakene skal sammenlignes på den.
- Saksdatainstruksen som fyller malen.
- Vurderingsoppgaven i steget der vurderingen gjøres, med habilitetsvurderingen foran.

## Slik bygges den

1. **Skriv kriteriene i behandlingsregelen**, med vekt og kilde per punkt. Det som varierer mellom kunder, står som tomme
   felt, og varianter er seksjoner.
   Regler: `../monstre/08-instrukser.md#instruks-en-behandlingsregel`, `../monstre/08-instrukser.md#instruks-kilde-per-punkt`,
   `../monstre/08-instrukser.md#instruks-variasjon-synlig`, `../monstre/08-instrukser.md#instruks-ingen-oppdiktede-fakta`,
   `../monstre/08-instrukser.md#instruks-varianter-som-seksjoner`, `../monstre/08-instrukser.md#instruks-delt-eller-egen`
   Blir: `oppsett/instructions/`
2. **Lag vurderingsmalen** for sakstypen, adskilt fra grunnlaget, med én rad per kriterium i en tabell.
   Regler: `../monstre/05-felt-og-saksdata.md#vurdering-i-saksdata`, `../monstre/05-felt-og-saksdata.md#flere-rader-er-saksdata`,
   `../monstre/05-felt-og-saksdata.md#fakta-og-vurdering-hver-sin-mal`, `../monstre/05-felt-og-saksdata.md#en-vurderingsmal-per-sakstype`,
   `../monstre/05-felt-og-saksdata.md#modus-etter-hvem-som-fyller`, `../monstre/05-felt-og-saksdata.md#seksjon-innhold-skillelinje`
   Blir: `oppsett/case-data-templates/`
3. **Gjør summen til et felt** når sakene skal sammenlignes på den. Plassen i en runde står på relasjonen.
   Regler: `../monstre/04-relasjoner.md#relasjonsfelt-for-krysset`, `../monstre/05-felt-og-saksdata.md#poeng-som-felt-begrunnelse-som-saksdata`,
   `../monstre/05-felt-og-saksdata.md#filterable-bevisst`
   Blir: `oppsett/custom-fields/`
4. **Skriv saksdatainstruksen** som fyller malen: hva den svarer på, hvordan, og hva den ikke skal gjøre. Kriteriene
   kopieres inn, hvert felt får et sitat, og «uavklart» er et gyldig svar.
   Regler: `../monstre/08-instrukser.md#instruks-velg-slaget`, `../monstre/08-instrukser.md#instruks-fyller-malen`,
   `../monstre/08-instrukser.md#instruks-saksdata-form`, `../monstre/08-instrukser.md#instruks-staa-alene`,
   `../monstre/08-instrukser.md#instruks-uavklart-er-svar`, `../monstre/08-instrukser.md#instruks-kriterier-per-sak`,
   `../monstre/08-instrukser.md#instruks-publiser-saksdatainstruksen`
   Blir: `oppsett/case-run-instructions/`, og steg i Neo: publiser saksdatainstruksen.
5. **Lag vurderingsoppgaven** i steget der vurderingen gjøres. Krever loven en skriftlig vurdering per punkt, får hvert
   vilkår en deloppgave. Oppgaven sier hvor knappen er.
   Regler: `../monstre/06-oppgaver.md#oppgave-steg`, `../monstre/06-oppgaver.md#oppgave-hva-og-hvor`,
   `../monstre/06-oppgaver.md#oppgave-grupper`, `../monstre/08-instrukser.md#instruks-ki-tre-former`
   Blir: `oppsett/task-template-sets/`
6. **Legg habilitetsvurderingen foran** for den som vurderer ([Tilgang og inhabilitet](tilgang-og-inhabilitet.md)).
   Regler: `../monstre/14-tilgang.md#inhabilitet-som-oppgave`
   Blir: `oppsett/task-template-sets/`

## Hvem gjør hva

- **Deterministisk:** ingenting i selve vurderingen. En flyt kan legge fakta inn i grunnlaget før vurderingen.
- **Agenten:** fyller vurderingsmalen med poeng, begrunnelse og sitat per kriterium når saksbehandleren ber om det.
  Resultatet er merket som KI og kvitteres ut av saksbehandleren.
- **Mennesket:** kontrollerer hvert punkt mot kilden, setter summen og tar stilling til utfallet.

## Avhengighetene

- Bygger på [Grunnoppsett for sakstypen](grunnoppsett-for-sakstypen.md) og på at grunnlaget står i saken
  ([Søknad inn fra Altinn](soknad-inn-fra-altinn.md)).
- Vurderingen er grunnlaget for begrunnelsen i [Vedtak med begrunnelse](vedtak-med-begrunnelse.md)
  (`../monstre/16-skriving.md#begrunnelse-tre-deler`).
- I en [Runde med tildeling](runde-med-tildeling.md) må poengsummen være et felt og plassen et felt på relasjonen.
  Bestem det før malen lages.

## Grensene

- Agenten kan ikke rangere saker mot hverandre, og ingen flyt summerer poeng på tvers
  (`../monstre/08-instrukser.md#instruks-kriterier-per-sak`).
- Vurderingen i saksdata kan ikke vises som kolonne (`../monstre/12-visninger.md#kolonne-krever-saksfelt`).
- «La Neo lage den» lager alltid et nytt datasett (`../monstre/05-felt-og-saksdata.md#modus-etter-hvem-som-fyller`).
- En vurdering i en tabell i et dokument kan ikke få blokkstatus
  (`../monstre/15-dokumenter-under-arbeid.md#avsnitt-ikke-tabell-for-det-som-verifiseres`).
