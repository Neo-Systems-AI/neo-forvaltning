# Skriving

Reglene for teksten som går ut av saksbehandlingen, og teksten agenten skriver: brev og vedtak fra dokumentmalene,
veiledningen i malene og skrivereglene i instruksene. Hvordan en mal flettes og er bygget, står i
[09-maler.md](09-maler.md); hvordan en instruks er bygget, i [08-instrukser.md](08-instrukser.md). Her står hvordan
teksten skrives.

Neo har ikke et bibliotek med tekstbiter, og en mal kan ikke ta inn en annen. En standardformulering bor derfor i malen
eller i instruksen der den skal brukes.

## Kortversjonen

Tekst i en mal er alltid ett av tre slag:

| Spørsmålet | Ja betyr | Eksempel |
|---|---|---|
| Er teksten lik i alle saker av typen, eller følger den av loven? | **Fast tekst**, skrevet rett inn (`standardformulering-i-malen`) | Klageadgangen, innsynsretten |
| Står det i saken som felt, part, saksbehandler eller organisasjon? | **Flettet verdi**, `{{kilde:felt}}` | `{{party:name}}`, `{{case:innvilget_belop}}` |
| Vurderer saksbehandleren eller agenten det i denne saken? | **Skjønn**: kursiv veiledning som skal erstattes (`veiledningen-er-en-bestilling`) | Begrunnelsen, vurderingen per kriterium |

## du-og-vi Skriv til mottakeren som «du», og om organisasjonen som «vi»

```yaml
id: du-og-vi
klasse: valg
gjelder: [documentTemplate.content]
krever: [09-maler.md#mal-organisasjonen-flettes]
opphav: praksis
```

- **Gjør:** Tiltal mottakeren med «du» og «deg». Skriv «vi» om organisasjonen i brødteksten, og flett navnet der det må
  stå (brevhodet, vedtaksformelen).
- **Ikke gjør:** Ikke skriv «De», «søker» eller «undertegnede» om mottakeren, og ikke «kommunen» om oss selv i løpende
  tekst.
- **Hvorfor:** Mottakeren skal forstå at brevet handler om henne, og «vi» gjør det tydelig hvem som har ansvaret.

## klart-sprak Skriv korte setninger med vanlige ord, og forklar fagordene

```yaml
id: klart-sprak
klasse: valg
gjelder: [documentTemplate.content, instruction.content]
opphav: forslag
```

- **Gjør:** Skriv én tanke per setning, med verb i aktiv form («vi har vurdert»). Forklar et fagord første gang det
  brukes. Skriv tall, beløp og datoer fullt ut.
- **Ikke gjør:** Ikke bruk «vedrørende», «herunder», «i henhold til», «dersom» der «om» holder, eller substantiv der et
  verb holder («foreta en vurdering»).
- **Hvorfor:** Offentlige organer skal bruke et klart språk tilpasset mottakeren (språkloven § 9). Et brev som må
  forklares på telefonen, har kostet to ganger.

## malform-ett-sted Målformen er organisasjonens, og den står i malen og instruksen

```yaml
id: malform-ett-sted
klasse: valg
gjelder: [documentTemplate.content, instruction.content]
krever: [08-instrukser.md#instruks-en-behandlingsregel, 16-skriving.md#skrivereglene-i-en-delt-instruks]
opphav: forslag
```

- **Gjør:** Skriv malene på organisasjonens målform, og skriv målformen i skrivereglene agenten leser. Har organisasjonen
  begge målformene, lag én mal per målform og velg etter mottakeren.
- **Ikke gjør:** Ikke bland målformer i én mal, og ikke la agenten velge.
- **Hvorfor:** Et vedtak med innslag av den andre målformen kan ikke sendes ut. Agenten skriver på målformen den blir
  bedt om, og ellers på den den har mest av.

## konklusjonen-forst Vedtaket starter med konklusjonen

```yaml
id: konklusjonen-forst
klasse: valg
gjelder: [documentTemplate.content, documentTemplate.type]
krever: [09-maler.md#mal-utfallsnoytral, 09-maler.md#mal-klageadgang]
opphav: praksis
```

- **Gjør:** Ha seksjonene i denne rekkefølgen: hva saken gjelder (én setning), vedtaket, vilkårene eller beløpet,
  begrunnelsen, klageadgangen, innsynsretten, kontaktinformasjon.
- **Ikke gjør:** Ikke start med bakgrunnen og la vedtaket komme etter begrunnelsen.
- **Hvorfor:** Mottakeren leser først for å vite om hun fikk det hun søkte om. Begrunnelsen leses av den som lurer på
  hvorfor, eller som vurderer å klage.

## overskrift-sier-budskapet I brev som ikke er vedtak, sier overskriften budskapet

```yaml
id: overskrift-sier-budskapet
klasse: valg
gjelder: [documentTemplate.content, documentTemplate.type]
krever: [09-maler.md#mal-typen]
opphav: praksis
```

- **Gjør:** Skriv overskrifter som sier hva mottakeren trenger å vite eller gjøre («Vi trenger mer dokumentasjon i saken
  din», «Dette må du sende oss»). Sett fristen i en egen setning.
- **Ikke gjør:** Ikke bruk overskrifter som bare er et tema («Dokumentasjon») eller et skjemanavn.
- **Hvorfor:** Mange leser bare overskriftene. I et vedtak er overskriftene faste fordi strukturen er kjent; i et
  foreløpig svar eller et mangelbrev er budskapet hele poenget.

## begrunnelse-tre-deler Begrunnelsen har tre deler: reglene, de faktiske forholdene og hovedhensynene

```yaml
id: begrunnelse-tre-deler
klasse: valg
gjelder: [documentTemplate.content]
krever: [09-maler.md#mal-fakta-og-skjonn, 05-felt-og-saksdata.md#vurdering-i-saksdata]
opphav: praksis
```

- **Gjør:** Lag en veiledning i malen for hver av de tre delene, og si hvilken regel eller saksdata hver del bygger på.
  Skriv at hovedhensynene bare trengs der vedtaket bygger på skjønn.
- **Ikke gjør:** Ikke lag én veiledning «Skriv begrunnelsen». Ikke skriv en ferdig begrunnelse i malen.
- **Hvorfor:** Forvaltningsloven § 25 krever at begrunnelsen viser til reglene, nevner de faktiske forholdene og, ved
  skjønn, de hensynene som har vært avgjørende. En avslagsbegrunnelse som mangler en av delene, er en klagegrunn.

```markdown
## Begrunnelse

### Regelverket

_Vis til hjemmelen og forskriften for ordningen, og gjengi kort innholdet i kriteriene vedtaket bygger på.
Kilde: behandlingsregelen, punktet «Formål og hjemmel»._

### Det vi har lagt til grunn

_Skriv de faktiske forholdene vedtaket bygger på. Kilde: saksdataen «Saksgrunnlag»._

### Vurderingen

_Skriv hvordan søknaden er vurdert mot hvert kriterium, og hvilke hensyn som var avgjørende.
Kilde: saksdataen «Vurdering mot tildelingskriteriene»._
```

## regelen-skrives-ut Skriv ut hva regelen sier, ikke bare paragrafen

```yaml
id: regelen-skrives-ut
klasse: felle
gjelder: [documentTemplate.content, SlaOppITabell]
krever: [01-sakstype.md#variant-som-felt, 09-maler.md#mal-valg-gir-etikett, 07-flyt.md#flyt-tabell-for-oppslag]
opphav: forslag
```

- **Gjør:** Skriv lovens eller forskriftens navn og innholdet i regelen med vanlige ord, og paragrafen i parentes.
  Varierer hjemmelen med sakens variant, la flyten sette et hjemmelfelt fra varianten med en tabell, og la feltet bære
  hele sitatet.
- **Ikke gjør:** Ikke skriv «jf. § 6 tredje ledd» alene. Ikke bygg sitatet av biter i malen med en fast «jf.»-hale. Ikke
  la saksbehandleren taste hjemmelen.
- **Hvorfor:** Mottakeren kjenner sjelden regelen, og da skal begrunnelsen gjengi innholdet (forvaltningsloven § 25
  første ledd). En fast hale blir feil for varianten med en annen hjemmel. Feltet har en leser (flettingen) og settes fra
  varianten, så det tastes ikke to ganger.

## standardformulering-i-malen En standardformulering står i malen som fast tekst eller i veiledningen

```yaml
id: standardformulering-i-malen
klasse: felle
gjelder: [documentTemplate.content]
krever: [09-maler.md#mal-fakta-og-skjonn, 09-maler.md#mal-utkast-med-neo, 09-maler.md#mal-delte-brev]
opphav: praksis
```

- **Gjør:** Skriv formuleringen rett inn når den er lik i alle saker. Når saksbehandleren skal velge mellom faste
  formuleringer, skriv dem som sitat i veiledningen («Skriv utfallet: «…» ELLER «…»»).
- **Ikke gjør:** Ikke legg standardtekster i et eget dokument saksbehandleren kopierer fra, og ikke lag én mal per
  formulering.
- **Hvorfor:** Neo har ingen tekstbiter som settes inn. Det som ikke står i malen eller instruksen, finnes ikke for
  saksbehandleren eller agenten når dokumentet skrives.

```markdown
## Vedtak

_Skriv utfallet med en av disse formuleringene:
«Du får {{case:innvilget_belop}} kroner i tilskudd til {{case:formal}}.» ELLER
«Du får ikke tilskudd til {{case:formal}}.»_
```

## skrivereglene-i-en-delt-instruks Organisasjonens skriveregler står i én instruks som ligger på saken fra start

```yaml
id: skrivereglene-i-en-delt-instruks
klasse: valg
gjelder: [instruction, instruction.content, caseType.caseTypeInstructions, caseType.caseTypeInstructions.mode]
krever: [08-instrukser.md#instruks-velg-slaget, 08-instrukser.md#instruks-delt-eller-egen]
opphav: forslag
```

- **Gjør:** Skriv tiltalen, målformen, ordene som skal unngås og organisasjonens egne standardformuleringer i én
  instruks. Koble den til alle sakstypene med `INSTANTIATE_ON_CREATE`.
- **Ikke gjør:** Ikke gjenta skrivereglene i hver behandlingsregel. Ikke koble den som `AVAILABLE`.
- **Hvorfor:** Agenten får instruksene som ligger på saken, og blir bedt om å lese dem før den skriver. En instruks som
  bare er tilgjengelig, ser den ikke. Neo har ingen skriveregel på organisasjonsnivå, så den delte instruksen er stedet.

```yaml
instruction:
  name: Skriveregler for brev og vedtak
  content: |
    ## Tiltale
    Skriv til mottakeren som «du». Skriv «vi» om organisasjonen.
    ## Målform
    Bokmål.
    ## Ord vi ikke bruker
    vedrørende → om; foreta en vurdering → vurdere; søker → du
```

## veiledningen-er-en-bestilling Veiledningen i malen er skrevet så både saksbehandleren og agenten kan følge den

```yaml
id: veiledningen-er-en-bestilling
klasse: valg
gjelder: [documentTemplate.content]
krever: [09-maler.md#mal-utkast-med-neo, 08-instrukser.md#instruks-kilde-per-punkt]
opphav: praksis
```

- **Gjør:** Skriv hva som skal stå, hvilken kilde det skal bygge på, og hva det ikke skal inneholde. Bruk bydeform
  («Skriv …», «Vis til …»).
- **Ikke gjør:** Ikke skriv eksempeltekst som kan bli stående. Ikke skriv «osv.» eller «evt.» i veiledningen.
- **Hvorfor:** Når Neo skriver utkastet, er veiledningen bestillingen. En veiledning uten kilde gir tekst uten kilde.

## Tekstene inne i Neo

Tekstene saksbehandleren leser i Neo, har egne regler i flatene:

| Teksten | Regelen |
|---|---|
| Statusbeskrivelsen | `02-status.md#beskrivelse-sier-hva-som-er-sant` |
| Stegene i veiviseren | `03-veiviser.md#kundens-ord` |
| Oppgavetittelen og -beskrivelsen | `06-oppgaver.md#oppgave-komplett` |
| Prosa i saksdata | `05-felt-og-saksdata.md#prosa-i-text-fakta-i-fields` |
| Visningens beskrivelse | `12-visninger.md#beskrivelsen-er-definisjonen` |
| Taggens beskrivelse | `10-skjema-og-innboks.md#tagg-beskrivelse-er-kjennetegn` |
| Malens beskrivelse | `09-maler.md#mal-beskrivelse-sier-nar` |
