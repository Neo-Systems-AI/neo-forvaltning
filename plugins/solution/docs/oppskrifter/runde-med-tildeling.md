# Runde med tildeling på tvers av sakene

En ordning lyses ut, søknadene kommer inn før en felles frist, og de må vurderes og sammenlignes før midlene eller
plassene fordeles. Arbeidet på tvers av sakene (knytte søknadene til runden, rangere, et møte som fordeler) har sine
egne frister, mens hver søknad fortsatt får sitt eget vedtak. Det samme gjelder en tilsynskampanje der objektene
prioriteres på tvers.

## Når den passer

Når kravene nevner en felles søknadsfrist, en ramme som skal fordeles, rangering, prioritering eller et
tildelingsmøte: arbeid som bare gir mening på tvers av sakene. Hver sak vurderes for seg av agent og saksbehandler;
sammenligningen og fordelingen gjør mennesker.

Den passer ikke når søknadene behandles løpende og hver for seg. Da er ordningen et variantfelt på saken, ikke en egen
sakstype (`../monstre/01-sakstype.md#runde-som-egen-sakstype`).

## Klossene

Søknadene inn → hver sin sak → relasjon fra runden til hver sak, med plassen og innstillingen på relasjonen →
relasjonstabellen og veiviseren på runden → vedtak i hver sak.

- Rundens sakstype med grunnoppsettet sitt
- Relasjonen runde → sak, med relasjonsfeltene
- Relasjonsinstruksen som foreslår søknadene
- Vurderingen av hver søknad, med summen som felt
- Relasjonsvisningene per fase
- Veiviseren på runden
- Flomvernet på inntaket

## Slik bygges den

1. **Lag runden som egen sakstype** med en relasjon fra runden til hver sak, og hold rundens løp ute av enkeltsakens
   statuser.
   Regler: `../monstre/01-sakstype.md#runde-som-egen-sakstype`, `../monstre/04-relasjoner.md#relasjon-nar-begge-har-arbeid`,
   `../monstre/04-relasjoner.md#retning-fra-gruppering`, `../monstre/02-status.md#status-om-saken`
   Blir: `design/` (runden som egen sakstype) og `oppsett/case-types/`
2. **Gi runden sitt grunnoppsett** ([Grunnoppsett for sakstypen](grunnoppsett-for-sakstypen.md)), med statusgruppene som
   fasene i runden.
   Regler: `../monstre/02-status.md#grupper-er-faser`
   Blir: `oppsett/case-types/`
3. **Legg det som bare finnes i krysset, på relasjonen**: plassen, innstillingen, et statusfelt for «ferdig vurdert»,
   og kundens navn på relasjonen.
   Regler: `../monstre/04-relasjoner.md#en-relasjon-per-par`, `../monstre/04-relasjoner.md#relasjonsfelt-for-krysset`,
   `../monstre/04-relasjoner.md#relasjonsfelt-pa-grupperingen`, `../monstre/04-relasjoner.md#status-for-ferdig`,
   `../monstre/04-relasjoner.md#navn-pa-relasjonene`, `../monstre/04-relasjoner.md#frys-pa-kanten`
   Blir: `oppsett/custom-fields/`
4. **Knytt søknadene til runden** med forslag fra Neo som et menneske godtar.
   Regler: `../monstre/08-instrukser.md#instruks-velg-slaget`, `../monstre/04-relasjoner.md#neo-finner-relasjonene`,
   `../monstre/04-relasjoner.md#relasjoner-lages-av-mennesker`
   Blir: `oppsett/instructions/`
5. **Vurder hver søknad for seg** ([Vurdering etter kriterier](vurdering-etter-kriterier.md)), med summen som felt.
   Regler: `../monstre/05-felt-og-saksdata.md#poeng-som-felt-begrunnelse-som-saksdata`,
   `../monstre/08-instrukser.md#instruks-kriterier-per-sak`
   Blir: `oppsett/custom-fields/` og `oppsett/case-run-instructions/`
6. **Lag én visning av relasjonstabellen per fase**, med kolonnene jobben trenger og framdriften talt over
   statusfeltet, og en detaljvisning ordnet etter arbeidsgangen.
   Regler: `../monstre/04-relasjoner.md#visning-per-fase`, `../monstre/04-relasjoner.md#en-standard-varianter-ved-siden`,
   `../monstre/04-relasjoner.md#oppsett-etter-arbeidsgangen`, `../monstre/04-relasjoner.md#org-eide-visninger`,
   `../monstre/05-felt-og-saksdata.md#seksjon-pa-feltet`, `../monstre/12-visninger.md#kolonne-krever-saksfelt`
   Blir: `oppsett/relation-views/`
7. **Lag veiviseren på runden**: knytte sakene, vurdere dem én om gangen, sammenligne i tabellen, gjennomføre
   beslutningen.
   Regler: `../monstre/03-veiviser.md#veiviser-for-runden`, `../monstre/03-veiviser.md#steg-er-en-jobb`,
   `../monstre/03-veiviser.md#alle-krever-et-krav`, `../monstre/03-veiviser.md#lagret-visning-per-jobb`,
   `../monstre/03-veiviser.md#rekkefolge-eller-fritt`, `../monstre/03-veiviser.md#statusen-er-nadd`,
   `../monstre/03-veiviser.md#siste-steg-for-avsluttet`, `../monstre/03-veiviser.md#kundens-ord`,
   `../monstre/03-veiviser.md#en-per-sakstype`
   Blir: `oppsett/case-wizards/`
8. **Sett flomvernet** for inntaket før fristen.
   Regler: `../monstre/07-flyt.md#flyt-flomvern`
   Blir: `oppsett/workflows/`
9. **Avklar habiliteten og de eksterne vurdererne** før runden starter ([Tilgang og inhabilitet](tilgang-og-inhabilitet.md)).
   Regler: `../monstre/14-tilgang.md#inhabilitet-som-oppgave`, `../monstre/14-tilgang.md#eksterne-vurderere`
   Blir: steg i Neo: gi tilgang til vurdererne
10. **Fatt vedtak i hver sak** ([Vedtak med begrunnelse](vedtak-med-begrunnelse.md)).
    Blir: som i vedtaksoppskriften

## Hvem gjør hva

- **Deterministisk:** inntaket av hver søknad, oppgavene og framdriften «X av Y ferdig».
- **Agenten:** foreslår hvilke søknader som hører til runden, og vurderer hver søknad for seg mot kriteriene.
- **Mennesket:** godtar relasjonene, kontrollerer vurderingene, sammenligner og rangerer, fordeler i møtet og fatter
  vedtakene.

## Avhengighetene

- Krever [Grunnoppsett for sakstypen](grunnoppsett-for-sakstypen.md) for både runden og søknaden,
  [Søknad inn fra Altinn](soknad-inn-fra-altinn.md) og [Vurdering etter kriterier](vurdering-etter-kriterier.md).
- Bestem før vurderingsmalen lages hva som er felt på søknaden (summen) og hva som er felt på relasjonen (plassen).
- Ligner [Behandling i møte](behandling-i-mote.md); et tildelingsmøte kan bygges som et steg i veiviseren på runden.
- [Innsikt og nøkkeltall](innsikt-og-nokkeltall.md): søkt, innvilget og utbetalt per ordning krever vedtakshendelsen og
  at ordningen er et filtrerbart valgfelt.

## Grensene

- Agenten kan ikke rangere saker mot hverandre, og ingen flyt summerer poeng på tvers
  (`../monstre/08-instrukser.md#instruks-kriterier-per-sak`).
- En flyt kan ikke opprette eller skrive en relasjon (`../monstre/04-relasjoner.md#relasjoner-lages-av-mennesker`).
- Relasjonstabellen kan ikke sorteres i visningen (`../monstre/04-relasjoner.md#visning-per-fase`).
- Eksterne vurderere kan ikke få tilgang bare til sine saker (`../monstre/14-tilgang.md#eksterne-vurderere`).

## Hull i reglene

- Utlysningen av runden.
- En ramme som skal holdes mot summen av tildelingene.
- Utsending av mange vedtak samtidig.
