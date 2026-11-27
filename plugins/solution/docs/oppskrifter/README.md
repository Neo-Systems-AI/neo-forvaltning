# Oppskriftene

En oppskrift sier hvordan byggeklossene i Neo settes sammen for et behov man kjenner igjen i saksbehandlingen:
hvilke klosser, hvordan de kobles, i hvilken rekkefølge, og hva hvert steg blir (en fil i `oppsett/`, et valg i
`design/`, eller et steg et menneske gjør i Neo). En oppskrift har ingen kunnskap av egen: hvordan én kloss bygges
riktig, står i en regel i [mønstrene](../monstre/README.md), og oppskriften viser til regelens id.

| | Svarer på | Står |
|---|---|---|
| **Regel** | Hvordan bygges én kloss riktig? | I flaten for klossen, i `../monstre/` |
| **Oppskrift** | Hvordan settes klossene sammen for dette behovet? | Her |
| **Løypa** | Hvordan kommer løsningen fra en idé til Neo? | I README-en til pluginen `solution` |

## Slik brukes de

1. **I designet (04)** går du gjennom «Når den passer» mot kravene, og skriver i `design/` hvilke oppskrifter
   løsningen bygger på. [Grunnoppsettet for en sakstype](grunnoppsett-for-sakstypen.md) gjelder alltid.
2. **Les «Avhengighetene»** i hver oppskrift du har valgt, før du bygger. Noe må planlegges samlet: de egne hendelsene,
   Altinn-skjemaene for hver innsending, og ventestatusene.
3. **I konfigen (05)** bygger du stegene i rekkefølgen oppskriften gir. Reglene steget viser til, er de som gjelder.
4. **Etter testen (09)** foreslås en kombinasjon som virket, og som ingen oppskrift har, som en ny oppskrift.

## Oppskriftene

| Oppskrift | Behovet | Passer når |
|---|---|---|
| [Grunnoppsettet for en sakstype](grunnoppsett-for-sakstypen.md) | En ny prosess skal få form: hva én sak er, stegene, feltene, oppgavene og behandlingsregelen | Alltid, først |
| [Søknad inn fra Altinn](soknad-inn-fra-altinn.md) | En innsending i Altinn skal bli en sak med riktig part og felt, uten inntasting og uten dobbeltsaker | Parten sender søknaden eller meldingen i Altinn |
| [Henvendelse inn fra e-post og innboks](henvendelse-inn-fra-epost-og-innboks.md) | Det som kommer på e-post eller i innboksen, skal sorteres, tildeles og legges i riktig sak | Noe kommer inn uten fast form |
| [Opplysninger fra registre og kart](registre-og-kart.md) | Fakta om parten eller stedet skal hentes likt hver gang og vise hva som ble sjekket | Kravene viser til Enhetsregisteret, Folkeregisteret, KRR eller kart |
| [Formell kontroll](formell-kontroll.md) | Saken skal sjekkes for frist, vedlegg og rett til å søke før den vurderes | Kravene har vilkår som kan sjekkes uten skjønn |
| [Mangel og dialog med parten](mangel-og-dialog.md) | Parten må ettersende eller svare, saken venter, og svaret må finne saken | Parten kan bli bedt om mer under behandlingen |
| [Vurdering etter kriterier](vurdering-etter-kriterier.md) | Vilkår eller kriterier skal vurderes likt fra sak til sak, med kilde, og kunne kontrolleres | Kravene har vilkår, kriterier eller poeng |
| [Vedtak med begrunnelse](vedtak-med-begrunnelse.md) | Vedtaket skal ha riktig utfall, en begrunnelse som holder og klageadgang, og saken venter på klagefristen | Saken ender i et enkeltvedtak |
| [Foreløpig svar og forhåndsvarsel](forelopig-svar-og-forhandsvarsel.md) | Parten skal få beskjed underveis etter forvaltningsloven §§ 11 a og 16 | Saken er et enkeltvedtak med saksbehandlingstid, eller kan gå parten imot |
| [Godkjenning i to ledd](godkjenning-i-to-ledd.md) | En annen skal godkjenne før sending, uten at teksten endres mens hen leser | Kravene sier at noen andre enn forfatteren skal godkjenne |
| [Innhenting fra parten med et Altinn-skjema](innhenting-med-altinn-skjema.md) | Parten skal svare, akseptere, ettersende eller rapportere i Altinn, og svaret skal brukes videre i saken | Noe må komme fra parten i en fast form |
| [Oppfølging med rapporter og frister](oppfolging-med-rapporter-og-frister.md) | Rapporter, kontroller og retting over tid skal ha frister fra vedtaket og spores | Vedtaket gir plikter over tid |
| [Overlevering til et eksternt system](overlevering-til-eksternt-system.md) | Vedtaket skal føre til noe i et annet system, én gang og etterprøvbart | Det skal utbetales, registreres eller oversendes |
| [Endring og klage](endring-og-klage.md) | Klagen eller endringen er en egen sak, med frister, og spores til vedtaket | Vedtaket kan påklages eller endres, eller vi er sekretariat for et klageorgan |
| [Journalføring og offentlig journal](journalforing-og-offentlig-journal.md) | Alt inn og ut journalføres riktig, og arkivet speiler saksbehandlingen | Organisasjonen har arkivplikt |
| [Runde med tildeling på tvers av sakene](runde-med-tildeling.md) | Søknader til en felles frist skal vurderes, sammenlignes og fordeles | Kravene nevner felles frist, ramme, rangering eller tildelingsmøte |
| [Behandling i møte eller utvalg](behandling-i-mote.md) | Saker skal på agendaen til et møte og få utfall per punkt | Et møte, utvalg eller en nemnd behandler flere saker samlet |
| [Fordeling og arbeidskøer](fordeling-og-arbeidskoer.md) | Lederen skal fordele, og alle skal finne sitt arbeid og det som venter | Mer enn én person jobber med sakene |
| [Innsikt og nøkkeltall](innsikt-og-nokkeltall.md) | Tallene lederen rapporterer, må regnes riktig og være planlagt da flytene ble bygget | Kravene nevner rapportering, statistikk eller styringsdata |
| [Tilgang og inhabilitet](tilgang-og-inhabilitet.md) | Følsomme saker skal bare ses av noen, og den inhabile skal ikke ta saken | Kravene nevner taushetsplikt, skjerming, habilitet eller eksterne vurderere |

## Det som går igjen

- **De egne hendelsene er den felles kilden.** Flytene skriver en egen hendelse for vedtaket, overleveringen og
  milepælene, med de samme verdiene som skrives i saksdataene. [Innsikt](innsikt-og-nokkeltall.md) og
  [overleveringen til andre systemer](overlevering-til-eksternt-system.md) lytter på dem.
- **Ett Altinn-skjema per slag innsending** (søknad, ettersending, aksept, rapport, klage), og et felt per utsendt
  skjema for instansen: [Søknad inn](soknad-inn-fra-altinn.md) og [Innhenting fra parten](innhenting-med-altinn-skjema.md).
- **Ventestatusene:** én under behandlingen ([Mangel](mangel-og-dialog.md),
  [Forhåndsvarsel](forelopig-svar-og-forhandsvarsel.md)), og etter vedtaket på parten
  ([Innhenting](innhenting-med-altinn-skjema.md)) og på klagefristen ([Vedtak](vedtak-med-begrunnelse.md)).
- **Journalføring før hver utsending:** [Journalføring](journalforing-og-offentlig-journal.md) er et steg i alle
  oppskriftene som sender noe.
- **Utfallsfeltet og variantfeltet** fra [Grunnoppsettet](grunnoppsett-for-sakstypen.md) leses av vedtaket, visningene
  og Innsikt.
