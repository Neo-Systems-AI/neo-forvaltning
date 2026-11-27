# Endring og klage

Parten klager på vedtaket, eller ber om å få endre det som er innvilget. Klagen har frister, skal vurderes på nytt av oss
før den eventuelt sendes til klageinstansen, og utfallet skal kunne spores til vedtaket det gjaldt. Noen ganger er vi
sekretariat for et annet organ og behandler klager på andres vedtak.

## Når den passer

Når saken ender i et enkeltvedtak som kan påklages (nesten alltid), eller når kravene sier at parten kan søke om
endring etter vedtaket.

En klage er alltid en egen klagesak med en relasjon til vedtaket. Klagen har sine egne felt, oppgaver og frister, og
det gjelder både når vi er underinstans for vårt eget vedtak og når vi er sekretariat for et annet organ. En søknad om
endring mens vedtakssaken står åpen, går i vedtakssaken.

Mennesket vurderer klagen. Flyten tar imot, setter status og lager oppgavene.

## Klossene

Vedtakssaken i «Venter på klagefrist» → klagen inn (Altinn-skjema eller innboks) → ny klagesak → relasjon fra vedtaket
til klagen → nytt vedtak eller oversendelse i klagesaken.

- Klagesakstypen med grunnoppsettet sitt
- Klageoppgavene med frister
- Relasjonen vedtak → klage, med utfallet på relasjonen
- Relasjonsinstruksen som foreslår vedtaket klagen gjelder
- Inntaket av klagen
- Vedtaksmalen og oversendelsesbrevet i klagesaken

## Slik bygges den

1. **Lag klagesakstypen** med eget grunnoppsett ([Grunnoppsett for sakstypen](grunnoppsett-for-sakstypen.md)): statusene
   fra klagen er mottatt til den er avgjort eller oversendt klageinstansen.
   Regler: `../monstre/01-sakstype.md#klage-som-egen-sakstype`, `../monstre/01-sakstype.md#egen-sakstype-nar`,
   `../monstre/02-status.md#rekkefolgen-er-lopet`, `../monstre/02-status.md#kategori-med-vilje`
   Blir: `oppsett/case-types/`
2. **Gi klagesaken sine egne felt**: utfallet av klagebehandlingen og det klagen gjelder.
   Regler: `../monstre/05-felt-og-saksdata.md#utfall-som-felt`, `../monstre/05-felt-og-saksdata.md#prefiks-per-sakstype`
   Blir: `oppsett/custom-fields/`
3. **Lag klageoppgavene** fra en delt kilde, med fristen fra klagen kom.
   Regler: `../monstre/06-oppgaver.md#oppgave-ett-sett-per-sakstype`, `../monstre/06-oppgaver.md#oppgave-deling-etter-kilde`,
   `../monstre/06-oppgaver.md#oppgave-frist`
   Blir: `oppsett/task-template-sets/`
4. **Lag relasjonen fra vedtaket til klagen**, med klagens utfall på relasjonen, erklært på vedtakssakstypen, og
   kundens navn på relasjonen.
   Regler: `../monstre/04-relasjoner.md#relasjon-nar-begge-har-arbeid`, `../monstre/04-relasjoner.md#retning-fra-gruppering`,
   `../monstre/04-relasjoner.md#en-relasjon-per-par`, `../monstre/04-relasjoner.md#relasjonsfelt-for-krysset`,
   `../monstre/04-relasjoner.md#relasjonsfelt-pa-grupperingen`, `../monstre/04-relasjoner.md#navn-pa-relasjonene`
   Blir: `oppsett/custom-fields/` og `oppsett/relation-views/`
5. **Ta imot klagen som en ny klagesak.** Med Altinn er klagen en egen innsending; skjemaet kan sendes fra vedtakssaken
   som en innhenting ([Innhenting fra parten med et Altinn-skjema](innhenting-med-altinn-skjema.md)), og flyten som tar
   den imot, oppretter klagesaken. Fra innboksen blir henvendelsen en ny klagesak med «Legg i sak».
   Regler: `../monstre/11-integrasjoner.md#en-app-per-innsending`, `../monstre/11-integrasjoner.md#korrelasjon-paa-instans`,
   `../monstre/11-integrasjoner.md#altinn-journalfores-i-inntaket`, `../monstre/11-integrasjoner.md#kvitter-ved-avslutning`,
   `../monstre/10-skjema-og-innboks.md#legg-i-sak-er-overgangen`
   Blir: `oppsett/workflows/`
6. **La Neo foreslå relasjonen til vedtaket**, og et menneske godta den.
   Regler: `../monstre/08-instrukser.md#instruks-velg-slaget`, `../monstre/04-relasjoner.md#neo-finner-relasjonene`,
   `../monstre/04-relasjoner.md#relasjoner-lages-av-mennesker`
   Blir: `oppsett/instructions/`
7. **Hold vedtakssaken åpen i klagefristen.** Vedtakssaken står i «Venter på klagefrist» til fristen er ute, og flyten
   for vedtaket lukker den da ([Vedtak med begrunnelse](vedtak-med-begrunnelse.md)). En klage som kommer innen fristen,
   kan derfor knyttes. Vedtakssaken flyttes ikke når klagen er knyttet: klagesaken bærer klagen, og flyten lukker
   vedtakssaken når fristen er ute.
   Regler: `../monstre/02-status.md#venter-pa-klagefrist`, `../monstre/02-status.md#avsluttet-er-last`
   Blir: `oppsett/case-types/`
8. **Gjør en klage etter fristen også til en ny klagesak**, også når den avvises. Den kan ikke knyttes til en avsluttet
   vedtakssak i dag (se Grensene). Å gjenåpne vedtakssaken er saksbehandlerens eget valg, ikke en del av løpet.
   Regler: `../monstre/02-status.md#avsluttet-er-last`
   Blir: `design/`
9. **Vurder klagen og fatt nytt vedtak i klagesaken** med vedtaksmalen og utsendingen fra
   [Vedtak med begrunnelse](vedtak-med-begrunnelse.md). Hver utsending fryses som egen versjon.
   Regler: `../monstre/09-maler.md#mal-fryses-ved-utsending`, `../monstre/09-maler.md#mal-utfallsnoytral`,
   `../monstre/09-maler.md#mal-klageadgang`
   Blir: `oppsett/document-templates/`
10. **Lag oversendelsesbrevet** til klageinstansen som et brev, ikke et vedtak.
    Regler: `../monstre/09-maler.md#mal-typen`
    Blir: `oppsett/document-templates/`
11. **Ta imot en søknad om endring** som en egen innsending i vedtakssaken mens den står åpen, og bestem i flyten hva
    som skjer med oppgavene som alt står.
    Regler: `../monstre/11-integrasjoner.md#en-app-per-innsending`, `../monstre/07-flyt.md#flyt-oppgaven-finnes`
    Blir: `oppsett/workflows/`

## Hvem gjør hva

- **Deterministisk:** mottaket av klagen og opprettelsen av klagesaken, statusen, klageoppgavene med frist,
  journalføringen, kvitteringen, og lukkingen av vedtakssaken når klagefristen er ute.
- **Agenten:** oppsummerer anførslene i en tabell i saksdata, foreslår relasjonen til vedtaket, og skriver utkast til
  nytt vedtak eller oversendelse.
- **Mennesket:** godtar relasjonen, vurderer om klagen skal tas til følge, fatter nytt vedtak eller sender saken videre,
  og velger selv om en avsluttet vedtakssak skal gjenåpnes.

## Avhengighetene

- Krever [Vedtak med begrunnelse](vedtak-med-begrunnelse.md): klageadgangen i vedtaket sier hvor klagen sendes, og
  flyten for vedtaket holder saken i «Venter på klagefrist» og lukker den.
- Klagesaken bygges med [Grunnoppsett for sakstypen](grunnoppsett-for-sakstypen.md).
- Klagen inn med Altinn bygges med [Innhenting fra parten med et Altinn-skjema](innhenting-med-altinn-skjema.md), og
  planlegges med de andre appene i [Søknad inn fra Altinn](soknad-inn-fra-altinn.md).
- [Journalføring og offentlig journal](journalforing-og-offentlig-journal.md): klagesaken får sin egen saksmappe i
  arkivet.
- [Innsikt og nøkkeltall](innsikt-og-nokkeltall.md): vedtakshendelsen må skrives ved hvert vedtak, også i klagesaken,
  for at klager og omgjøringer kan telles (`../monstre/13-innsikt.md#saksfelt-er-naa`).
- Testsakene må dekke klagen (`../monstre/00-navn-pakking-og-versjoner.md#en-testsak-per-gren`).

## Grensene

- En flyt kan ikke opprette, lese eller skrive en relasjon, så klagesaken knyttes til vedtaket av et menneske
  (`../monstre/04-relasjoner.md#relasjoner-lages-av-mennesker`).
- En relasjon kan ikke knyttes til en avsluttet sak (409 `CASE_CLOSED`), så en klage etter fristen står uten relasjon
  til vedtaket (`../monstre/02-status.md#avsluttet-er-last`). Ønske til Neo: at en relasjon kan knyttes til en avsluttet
  sak uten å gjenåpne den.
- Relasjonsvisningen viser sakens felt slik de er nå, ikke da klagen ble behandlet (`../monstre/04-relasjoner.md#frys-pa-kanten`).

## Hull i reglene

- Hvordan et vedtak omgjøres av eget tiltak.
- Hvordan oversendelsen til klageinstansen sendes.
