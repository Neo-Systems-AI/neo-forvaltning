# Journalføring og offentlig journal

Alt som kommer inn og går ut i saken, skal journalføres i arkivet med riktig arkivdel, klasse, skjerming og
journalposttype. Det som skal i offentlig journal, må være riktig når det går inn, uten personnavn der det ikke hører
hjemme. Arkivet speiler saksbehandlingen: hver sak i Neo har sin egen saksmappe, som avsluttes når saken er ferdig.

## Når den passer

Når organisasjonen har arkivplikt og kravene nevner arkiv, journalføring, offentlig journal, innsyn eller skjerming.
Alt er deterministisk og står i flyter; agenten velger ingen arkivverdier.

Integrasjonen mot arkivet i Neo er mot Documaster.

## Klossene

Integrasjonen mot arkivet i Neo → flytene (saksmappen, inngående, utgående, avslutningen) → saksdatamalen «Arkiv» i
saken → saksmappen og journalpostene i arkivet → offentlig journal fra arkivet.

- Integrasjonen mot arkivet
- Saksdatamalen «Arkiv» og dokumentfeltet for dokumenttype
- Tabellene for arkivverdiene og journalposttypene
- Flyten som oppretter saksmappen, og flytene som journalfører
- Rollen og søket for arkivet

## Slik bygges den

1. **Sett opp integrasjonen mot arkivet i Neo** ([Documaster](../../../documaster/docs/documaster.md)), og bind hver
   arkivnode i flytene til den.
   Regler: `../monstre/11-integrasjoner.md#en-klient-mange-integrasjoner`
   Blir: steg i Neo: legg inn integrasjonen mot arkivet og test den
2. **Lag saksdatamalen «Arkiv»** for saksmappen og journalpostene, delt mellom sakstypene, og dokumentfeltet for
   dokumenttype.
   Regler: `../monstre/05-felt-og-saksdata.md#losningens-data-i-saksdata`, `../monstre/09-maler.md#mal-dokumentfelt`
   Blir: `oppsett/case-data-templates/` og `oppsett/custom-fields/`
3. **Fyll tabellene i flyten**: arkivverdiene per sakstype (arkivdel, klasse, administrativ enhet, skjerming) og
   journalposttypen per dokumenttype. En dokumenttype som ikke står i tabellen, arkiveres ikke.
   Regler: `../monstre/07-flyt.md#flyt-tabell-for-oppslag`
   Blir: `oppsett/workflows/`
4. **Bestem hvilken flyt som oppretter saksmappen**, og gi alt i arkivet Neos id, slått opp før hver opprettelse. Hver
   sak i Neo får sin egen saksmappe, også en klagesak ([Endring og klage](endring-og-klage.md)).
   Regler: `../monstre/11-integrasjoner.md#en-som-oppretter-saksmappen`, `../monstre/07-flyt.md#flyt-ekstern-id`,
   `../monstre/11-integrasjoner.md#neos-id-i-arkivet`
   Blir: `oppsett/workflows/`
5. **Journalfør det som kommer inn**: Altinn-innsendinger i inntaket, henvendelser når de legges i sak.
   Regler: `../monstre/11-integrasjoner.md#altinn-journalfores-i-inntaket`, `../monstre/10-skjema-og-innboks.md#legg-i-sak-er-overgangen`
   Blir: `oppsett/workflows/`
6. **Journalfør det som går ut før det sendes**, med samme PDF som sendes, og avskriv de inngående journalpostene mot
   vedtaket.
   Regler: `../monstre/07-flyt.md#flyt-forvaltningshandling`, `../monstre/09-maler.md#mal-fryses-ved-utsending`,
   `../monstre/11-integrasjoner.md#utgaende-journalfores-for-sending`
   Blir: `oppsett/workflows/`
7. **Skjerm og gi en offentlig tittel uten personnavn** når saken gjelder en person.
   Regler: `../monstre/11-integrasjoner.md#offentlig-tittel-uten-navn`, `../monstre/18-org-niva.md#skjermingshjemlene-er-faste`,
   `../monstre/08-instrukser.md#instruks-kilde-per-punkt`
   Blir: `oppsett/workflows/`
8. **La arkivet publisere offentlig journal.** Neo sørger for at det som går inn, er riktig.
   Regler: `../monstre/11-integrasjoner.md#offentlig-journal-fra-arkivet`
   Blir: steg i arkivet, ikke i Neo: publiseringen settes opp der
9. **Avslutt saksmappen med S** når saken avsluttes; arkivet setter A.
   Regler: `../monstre/02-status.md#kategori-med-vilje`, `../monstre/11-integrasjoner.md#avslutning-s-og-a`
   Blir: `oppsett/workflows/`
10. **Gi arkivet rollen og søket som er dets.**
    Regler: `../monstre/14-tilgang.md#jobbroller-etter-jobben`, `../monstre/17-sok.md#sok-ta-i-bruk-standarden`
    Blir: steg i Neo: lag rollen for informasjonsforvalteren og ta i bruk søket

## Hvem gjør hva

- **Deterministisk:** alt: saksmappen, journalpostene, avskrivingen, skjermingen ut fra tabellen og avslutningen med S.
- **Agenten:** kan få et arkivnotat som kontekst, men velger ingen arkivverdier.
- **Mennesket:** informasjonsforvalteren kvalitetskontrollerer og setter A i arkivet, og fastsetter oppbevaringstiden.
  Saksbehandleren skjermer dokumenter med riktig hjemmel.

## Avhengighetene

- Krever [Grunnoppsett for sakstypen](grunnoppsett-for-sakstypen.md): statuskategoriene styrer avslutningen.
- Henger på inntaket i [Søknad inn fra Altinn](soknad-inn-fra-altinn.md) og
  [Henvendelse inn fra e-post og innboks](henvendelse-inn-fra-epost-og-innboks.md), og på hver utsending:
  [Mangel og dialog](mangel-og-dialog.md), [Foreløpig svar og forhåndsvarsel](forelopig-svar-og-forhandsvarsel.md),
  [Vedtak med begrunnelse](vedtak-med-begrunnelse.md) og
  [Innhenting fra parten med et Altinn-skjema](innhenting-med-altinn-skjema.md). Hver utsendingsflyt har
  journalføringen som et steg før sendingen.
- [Endring og klage](endring-og-klage.md): klagesaken får sin egen saksmappe, ikke saksmappen til vedtaket.
- Sakstittelen settes i inntaket, så regelen om personnavn må med der.
- [Innsynsbegjæring etter offentleglova](innsynsbegjaering.md): en begjæring om innsyn behandles som en egen innsynssak,
  med sin egen saksmappe.

## Grensene

- Data går bare fra Neo til arkivet; rettes noe i arkivet, får Neo ikke vite det
  (`../monstre/11-integrasjoner.md#offentlig-journal-fra-arkivet`).
- Documaster håndhever ikke unikhet på ekstern id (`../monstre/11-integrasjoner.md#neos-id-i-arkivet`).
- Neo holder ingen lås mellom oppslaget og opprettelsen av saksmappen
  (`../monstre/11-integrasjoner.md#en-som-oppretter-saksmappen`).
- Skjermingen i dokumentene tilbyr bare fire hjemler (`../monstre/18-org-niva.md#skjermingshjemlene-er-faste`).
- Documaster stopper ikke en avslutning med journalposter på R; flyten må gjøre det
  (`../monstre/11-integrasjoner.md#avslutning-s-og-a`).
- Ingen jobb kasserer KI-forslagene ennå.
