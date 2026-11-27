# Innsynsbegjæring etter offentleglova

Noen ber om innsyn i en sak eller et dokument, på e-post, fra eInnsyn eller i innboksen. Begjæringen skal avgjøres uten
ugrunnet opphold, dokumentene skal vurderes for unntak og merinnsyn, og svaret er en innvilgelse eller et avslag med
hjemmel og klageadgang. Begjæringen er sin egen sak, knyttet til saken den gjelder, og arkivet speiler det.

## Når den passer

Når organisasjonen er omfattet av offentleglova og kravene nevner innsyn, innsynsbegjæringer eller eInnsyn. Inntaket,
fristen, journalføringen og utsendingen er deterministiske. Vurderingen av unntak og merinnsyn er skjønn: agenten kan
foreslå, saksbehandleren avgjør.

Den passer ikke for partsinnsyn etter forvaltningsloven i en sak parten selv er part i; det svares i saken. Publiseringen
av offentlig journal er arkivets og står i [Journalføring og offentlig journal](journalforing-og-offentlig-journal.md).

## Klossene

Begjæringen inn (e-post, eInnsyn eller innboksen) → «Legg i sak» som ny innsynssak → relasjon fra saken begjæringen
gjelder → milepæl med frist og varsel → vurderingen i saksdata → svaret som brev, journalført og sendt → klagesak ved
klage.

- Innsynssakstypen med grunnoppsettet sitt
- Taggen for innsynsbegjæringer i innboksen
- Relasjonen fra saken begjæringen gjelder, til innsynssaken
- Milepælen for fristen, med en ansvarlig
- Saksdatamalen for vurderingen, og saksdatainstruksen som foreslår
- Utfallsfeltet og svarbrevet
- Flyten som journalfører og sender svaret

## Slik bygges den

1. **Lag innsynssakstypen** med eget grunnoppsett ([Grunnoppsett for sakstypen](grunnoppsett-for-sakstypen.md)):
   statusene fra begjæringen er mottatt til den er avgjort.
   Regler: `../monstre/01-sakstype.md#egen-sakstype-nar`, `../monstre/04-relasjoner.md#relasjon-nar-begge-har-arbeid`,
   `../monstre/02-status.md#rekkefolgen-er-lopet`, `../monstre/02-status.md#kategori-med-vilje`
   Blir: `design/` (innsyn som egen sakstype) og `oppsett/case-types/`
2. **Ta imot begjæringen som en ny innsynssak.** Begjæringer på e-post, også fra eInnsyn, kommer til den felles
   postboksen. Taggen sier at det er en innsynsbegjæring, og henvendelsen tildeles én person, som oppretter
   innsynssaken med «Legg i sak» ([Henvendelse inn fra e-post og innboks](henvendelse-inn-fra-epost-og-innboks.md)).
   Regler: `../monstre/10-skjema-og-innboks.md#innboks-for-det-ustrukturerte`,
   `../monstre/10-skjema-og-innboks.md#tagg-ruter-ikke-sak`, `../monstre/10-skjema-og-innboks.md#tagg-beskrivelse-er-kjennetegn`,
   `../monstre/10-skjema-og-innboks.md#tildel-en-person`, `../monstre/10-skjema-og-innboks.md#legg-i-sak-er-overgangen`
   Blir: `oppsett/inbox-tags/`, og steg i Neo: tildel og legg i sak
3. **Lag relasjonen fra saken begjæringen gjelder, til innsynssaken**, med kundens navn på relasjonen, og la Neo
   foreslå den. Er saken begjæringen gjelder, avsluttet, flytter saksbehandleren den ut av «Avsluttet», knytter
   relasjonen og setter den tilbake.
   Regler: `../monstre/04-relasjoner.md#retning-fra-gruppering`, `../monstre/04-relasjoner.md#navn-pa-relasjonene`,
   `../monstre/04-relasjoner.md#neo-finner-relasjonene`, `../monstre/04-relasjoner.md#relasjoner-lages-av-mennesker`,
   `../monstre/02-status.md#avsluttet-er-last`
   Blir: `oppsett/relation-views/` og `oppsett/instructions/`
4. **Gi fristen en milepæl.** Begjæringen skal avgjøres uten ugrunnet opphold (offentleglova § 29), så fristen er kort:
   få virkedager fra mottaket, slik organisasjonen har satt den. Milepælen får en ansvarlig når saken tildeles. Neo varsler den ansvarlige når fristen nærmer seg og når den er passert, etter varslingsoppsettet
   «Frister».
   Regler: `../monstre/06-oppgaver.md#oppgave-milepael`, `../monstre/06-oppgaver.md#oppgave-frist`,
   `../monstre/06-oppgaver.md#oppgave-ansvarlig-tom`, `../monstre/06-oppgaver.md#frist-varsles-av-neo`
   Blir: `oppsett/task-template-sets/`, og steg i Neo: sett varslingsoppsettet «Frister»
5. **Lag saksdatamalen for vurderingen**, med en rad per dokument: innsyn, delvis innsyn eller unntak, hjemmelen, og om
   merinnsyn er vurdert.
   Regler: `../monstre/05-felt-og-saksdata.md#vurdering-i-saksdata`, `../monstre/05-felt-og-saksdata.md#flere-rader-er-saksdata`,
   `../monstre/05-felt-og-saksdata.md#prosa-i-text-fakta-i-fields`
   Blir: `oppsett/case-data-templates/`
6. **La agenten foreslå vurderingen av unntak og merinnsyn** (offentleglova §§ 11 og 13 flg.) med en saksdatainstruks som fyller malen, med hjemmelen per punkt og sitat fra
   dokumentet. Saksbehandleren tar over og avgjør.
   Regler: `../monstre/08-instrukser.md#instruks-bare-skjonn`, `../monstre/08-instrukser.md#instruks-fyller-malen`,
   `../monstre/08-instrukser.md#instruks-kilde-per-punkt`, `../monstre/08-instrukser.md#instruks-uavklart-er-svar`,
   `../monstre/08-instrukser.md#instruks-ki-tre-former`
   Blir: `oppsett/case-run-instructions/`
7. **Gi innsynssaken et utfallsfelt** (innvilget, delvis innvilget, avslått) og ett svarbrev for alle utfall. Et avslag
   viser til hjemmelen og har klageadgangen (offentleglova § 32) som fast tekst. Dokumentene som unntas, skjermes med riktig hjemmel.
   Regler: `../monstre/05-felt-og-saksdata.md#utfall-som-felt`, `../monstre/09-maler.md#mal-utfallsnoytral`,
   `../monstre/09-maler.md#mal-klageadgang`, `../monstre/16-skriving.md#standardformulering-i-malen`,
   `../monstre/18-org-niva.md#skjermingshjemlene-er-faste`
   Blir: `oppsett/custom-fields/` og `oppsett/document-templates/`
8. **Send svaret fra en handling.** Flyten fryser svaret til PDF, journalfører det som utgående før sendingen og sender
   det fra den felles postboksen til den som ba om innsyn. Innsynssaken har sin egen saksmappe i arkivet
   ([Journalføring og offentlig journal](journalforing-og-offentlig-journal.md)).
   Regler: `../monstre/07-flyt.md#flyt-forvaltningshandling`, `../monstre/09-maler.md#mal-fryses-ved-utsending`,
   `../monstre/11-integrasjoner.md#utgaende-journalfores-for-sending`, `../monstre/07-flyt.md#flyt-epost-ut-fra-postboksen`,
   `../monstre/11-integrasjoner.md#en-som-oppretter-saksmappen`
   Blir: `oppsett/workflows/`, og steg i Neo: aktiver flyten
9. **Gjør en klage på avslaget til en egen klagesak** med relasjon fra innsynssaken ([Endring og klage](endring-og-klage.md)).
   Innsynssaken venter på klagefristen før den avsluttes, så klagen kan knyttes.
   Regler: `../monstre/01-sakstype.md#klage-som-egen-sakstype`, `../monstre/02-status.md#venter-pa-klagefrist`
   Blir: `oppsett/case-types/` og `oppsett/workflows/`

## Hvem gjør hva

- **Deterministisk:** journalføringen av begjæringen og svaret, milepælen og varselet før fristen, utsendingen, og
  lukkingen når klagefristen er ute.
- **Agenten:** foreslår relasjonen til saken begjæringen gjelder, og foreslår vurderingen av unntak og merinnsyn per
  dokument med hjemmel og sitat.
- **Mennesket:** legger begjæringen i en ny innsynssak, godtar relasjonen, avgjør unntak og merinnsyn, skjermer
  dokumentene og sender svaret.

## Avhengighetene

- Bygges med [Grunnoppsett for sakstypen](grunnoppsett-for-sakstypen.md).
- Inntaket er [Henvendelse inn fra e-post og innboks](henvendelse-inn-fra-epost-og-innboks.md), med den felles
  postboksen.
- [Journalføring og offentlig journal](journalforing-og-offentlig-journal.md): begjæringen er inngående og svaret
  utgående journalpost, i innsynssakens egen saksmappe.
- [Endring og klage](endring-og-klage.md) for klagen på et avslag.
- [Fordeling og arbeidskøer](fordeling-og-arbeidskoer.md): en kø for innsynssakene, sortert på fristen.

## Grensene

- En flyt kan ikke opprette eller skrive en relasjon, så innsynssaken knyttes til saken den gjelder av et menneske
  (`../monstre/04-relasjoner.md#relasjoner-lages-av-mennesker`).
- En relasjon kan ikke knyttes til en avsluttet sak; saksbehandleren flytter den ut av «Avsluttet» først
  (`../monstre/02-status.md#avsluttet-er-last`).
- Skjermingen i dokumentene tilbyr bare fire hjemler (`../monstre/18-org-niva.md#skjermingshjemlene-er-faste`).
- Data går bare fra Neo til arkivet; en skjerming som rettes i arkivet, får Neo ikke vite om
  (`../monstre/11-integrasjoner.md#offentlig-journal-fra-arkivet`).
