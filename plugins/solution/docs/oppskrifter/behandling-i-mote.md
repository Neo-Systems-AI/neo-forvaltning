# Behandling i møte eller utvalg

Sakene skal behandles i et møte. Noen setter agendaen, knytter sakene til møtet og forbereder hvert punkt. Etter møtet
skal utfallet av hvert punkt stå. Samme sak kan komme opp på flere møter og få ulikt utfall hver gang.

## Når den passer

Når kravene nevner et møte, et utvalg, en nemnd eller et råd som behandler flere saker samlet, med agenda, innstilling
og protokoll. Møtet har sitt eget løp (planlagt, gjennomført, protokollført), og sakene har sitt. Mennesker forbereder
og avgjør. Agenten foreslår hvilke saker som hører til møtet.

Den passer ikke når «møtet» bare er et internt drøftingspunkt uten egne frister. Da er det en oppgave i saken.

## Klossene

Møtesak → relasjon til hver sak, med utfallet på relasjonen → visning av relasjonstabellen per fase → veiviser på
møtet → protokoll fra en mal.

- Sakstypen for møtet, med fasene som statusgrupper
- Relasjonene fra møtet til sakene, med relasjonsfelt for utfallet og posisjonen
- Relasjonsinstruksen som foreslår sakene
- Relasjonsvisningen og de lagrede visningene av relasjonstabellen
- Veiviseren på møtet
- Malen for protokollen

## Slik bygges den

1. **Lag møtet som egen sakstype**, med en relasjon fra møtet til hver sak.
   Regler: `../monstre/04-relasjoner.md#relasjon-nar-begge-har-arbeid`, `../monstre/04-relasjoner.md#retning-fra-gruppering`,
   `../monstre/01-sakstype.md#egen-sakstype-nar`
   Blir: `design/`
2. **Gi møtet sitt grunnoppsett** ([Grunnoppsettet for sakstypen](grunnoppsett-for-sakstypen.md)), med fasene som
   statusgrupper: forberedelse, møtet, etterarbeid.
   Regler: `../monstre/02-status.md#grupper-er-faser`
   Blir: `oppsett/case-types/`
3. **Legg utfallet av hvert punkt og posisjonen på relasjonen**, med et statusfelt for «ferdig» og kundens navn på
   relasjonen («agendapunkt»).
   Regler: `../monstre/04-relasjoner.md#en-relasjon-per-par`, `../monstre/04-relasjoner.md#relasjonsfelt-for-krysset`,
   `../monstre/04-relasjoner.md#relasjonsfelt-pa-grupperingen`, `../monstre/04-relasjoner.md#status-for-ferdig`,
   `../monstre/04-relasjoner.md#navn-pa-relasjonene`, `../monstre/04-relasjoner.md#frys-pa-kanten`
   Blir: `oppsett/custom-fields/`
4. **Gjør vurderingen per punkt til et felt** når den skal stå i tabellen over agendaen.
   Regler: `../monstre/05-felt-og-saksdata.md#vurdering-i-saksdata`
   Blir: `oppsett/custom-fields/`
5. **La Neo foreslå sakene til agendaen** med en relasjonsinstruks på møtet. Et menneske godtar hvert forslag.
   Regler: `../monstre/08-instrukser.md#instruks-velg-slaget`, `../monstre/04-relasjoner.md#neo-finner-relasjonene`,
   `../monstre/04-relasjoner.md#relasjoner-lages-av-mennesker`
   Blir: `oppsett/instructions/`
6. **Ordne detaljvisningen av relasjonen etter arbeidsgangen.**
   Regler: `../monstre/04-relasjoner.md#en-standard-varianter-ved-siden`, `../monstre/04-relasjoner.md#oppsett-etter-arbeidsgangen`,
   `../monstre/04-relasjoner.md#org-eide-visninger`
   Blir: `oppsett/relation-views/`
7. **Lag en lagret visning av relasjonstabellen per fase**, med framdriften talt på statusfeltet fra steg 3.
   Regler: `../monstre/04-relasjoner.md#visning-per-fase`
   Blir: steg i Neo: lagre visningene av relasjonstabellen på møtet
8. **Lag veiviseren på møtet**: legg inn agendaen, knytt punktene, forbered, gjennomfør, protokollfør. Handlingene i
   stegene er flyter.
   Regler: `../monstre/03-veiviser.md#nar-veiviser`, `../monstre/03-veiviser.md#steg-er-en-jobb`,
   `../monstre/03-veiviser.md#bare-det-steget-trenger`, `../monstre/03-veiviser.md#betingelsen-leser-data`,
   `../monstre/03-veiviser.md#alle-krever-et-krav`, `../monstre/03-veiviser.md#status-i-arbeidssteget`,
   `../monstre/03-veiviser.md#statusen-er-nadd`, `../monstre/03-veiviser.md#handling-er-en-flyt`,
   `../monstre/03-veiviser.md#hovedlopet-ikke-unntak`, `../monstre/03-veiviser.md#lagret-visning-per-jobb`,
   `../monstre/03-veiviser.md#siste-steg-for-avsluttet`, `../monstre/03-veiviser.md#kundens-ord`,
   `../monstre/03-veiviser.md#en-per-sakstype`
   Blir: `oppsett/case-wizards/` og `oppsett/workflows/`
9. **Skriv protokollen fra en mal.** Lista over punktene skrives av saksbehandleren eller av agenten i utkastet.
   Regler: `../monstre/09-maler.md#mal-ingen-lister`, `../monstre/09-maler.md#mal-utkast-med-neo`
   Blir: `oppsett/document-templates/`

## Hvem gjør hva

- **Deterministisk:** framdriften «X av Y ferdig» og det handlingene i veiviseren gjør.
- **Agenten:** foreslår agendapunkter og skriver utkast til protokollen.
- **Mennesket:** setter agendaen, godtar relasjonene, fører utfallet per punkt og godkjenner protokollen.

## Avhengighetene

- Krever [Grunnoppsettet for sakstypen](grunnoppsett-for-sakstypen.md) for både møtet og sakene.
- Utfallet på relasjonen er ikke utfallet i saken. Skal møtets beslutning bli et vedtak i saken, går det gjennom
  [Vedtak med begrunnelse](vedtak-med-begrunnelse.md) i hver sak.
- Bygger på samme mønster som [Runde med tildeling](runde-med-tildeling.md).
- Oppskriften gås gjennom på nytt når integrasjonene mot møtesystemene er på plass, Aventia først.

## Grensene

- En flyt kan ikke opprette en relasjon (`../monstre/04-relasjoner.md#relasjoner-lages-av-mennesker`).
- En avsluttet sak kan ikke få nye relasjoner (`../monstre/02-status.md#avsluttet-er-last`).
- Relasjonsvisningen viser sakens felt slik de er nå. Det som skal stå som det var i møtet, skrives på relasjonen
  (`../monstre/04-relasjoner.md#frys-pa-kanten`).
- Malen kan ikke gjenta en rad per agendapunkt (`../monstre/09-maler.md#mal-ingen-lister`).
