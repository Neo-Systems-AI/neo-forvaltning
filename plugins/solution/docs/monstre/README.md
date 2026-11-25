# Mønstrene for god konfig

Hvordan man bygger god saksbehandling i Neo selv: reglene for hver flate i konfigen, med hva du gjør, hva du ikke gjør,
og hvorfor. De er skrevet for den som bygger en løsning, enten det er kunden, en partner eller en agent. En
standardløsning fra Neo er ferdig konfig du kan ta i bruk; mønstrene er hvordan du lager din egen like godt.

## Slik leses de

1. **[Grunnreglene](grunnregler.md) først.** De gjelder på tvers av flatene. En regel som går imot en grunnregel, er
   feil.
2. **Kortversjonen øverst i hver flate.** Beslutningstabellene avgjør de vanlige valgene: spørsmålene i rekkefølge, og
   det første som svarer ja, avgjør. Hver rad viser til regelen som sier hvorfor.
3. **Regelen** når valget ikke er åpenbart, eller når du vil vite hva som går galt.

## Flatene

| Fil | Flaten |
|---|---|
| [`00-navn-pakking-og-versjoner.md`](00-navn-pakking-og-versjoner.md) | Navn, pakking og versjoner |
| [`01-sakstype.md`](01-sakstype.md) | Sakstype og varianter |
| [`02-status.md`](02-status.md) | Statusløpet |
| [`03-veiviser.md`](03-veiviser.md) | Veiviseren |
| [`04-relasjoner.md`](04-relasjoner.md) | Relasjoner og relasjonsvisninger |
| [`05-felt-og-saksdata.md`](05-felt-og-saksdata.md) | Saksfelt og saksdata |
| [`06-oppgaver.md`](06-oppgaver.md) | Oppgavemaler |
| [`07-flyt.md`](07-flyt.md) | Flyt og hendelser |
| [`08-instrukser.md`](08-instrukser.md) | Instrukser, saksdatainstrukser og KI-regler |
| [`09-maler.md`](09-maler.md) | Dokumentmaler |
| [`10-skjema-og-innboks.md`](10-skjema-og-innboks.md) | Skjema, innboks og tags |
| [`11-integrasjoner.md`](11-integrasjoner.md) | Integrasjonene: Altinn, arkivet, registrene og postboksene |
| [`12-visninger.md`](12-visninger.md) | Lagrede visninger |
| [`13-innsikt.md`](13-innsikt.md) | Innsikt |
| [`14-tilgang.md`](14-tilgang.md) | Tilgang |
| [`15-dokumenter-under-arbeid.md`](15-dokumenter-under-arbeid.md) | Dokumenter under arbeid |
| [`16-skriving.md`](16-skriving.md) | Skriving |
| [`17-sok.md`](17-sok.md) | Søk |
| [`18-org-niva.md`](18-org-niva.md) | Organisasjonsnivået |

## En regel

````markdown
## <id> <Regelen i én setning>

```yaml
id: <id>
klasse: standard | valg | felle
gjelder: [<objektet eller innstillingen, med navnet i konfigen>]
krever: [<fil.md#id>, ...]
opphav: skrevet | praksis | forslag
sjekkes: maskinelt                # bare når skriptet sjekker regelen
```

- **Gjør:** …
- **Ikke gjør:** …
- **Hvorfor:** …
````

- **Klassen:** `standard` betyr at Neos standardverdi holder. `valg` betyr at riktig verdi avhenger av prosessen.
  `felle` er en verdi som ser riktig ut og gir feil.
- **`gjelder`** sier hvilke objekter og innstillinger i konfigen regelen handler om, med navnene konfigen bruker
  (`caseType.statusGroups`, `customFieldDefinition.filterable`, `SetCaseStatus`).
- **`krever`** er det som binder flatene sammen: en regel som bare holder når en annen regel er fulgt. En rapport kan
  bare telle det en flyt har skrevet som hendelse, så en regel i innsikten krever en regel i flyten. Slike avhengigheter
  oppdages ellers først når konfigen er bygget.
- **Opphavet:** `skrevet` står i produktdokumentasjonen, `praksis` går igjen i konfig som er i bruk, og `forslag` er en
  anbefaling som ikke er prøvd i bruk ennå.
- **Id-en står fast.** Andre regler, sporingen i en løsning og funn fra en gjennomgang viser til den.

## Det som sjekkes maskinelt

Noen regler kan sjekkes på konfigen slik den kjører, uten skjønn: et navn brukt to ganger, en beskrivelse som mangler,
et KI-forslag uten kriterium, en flyt som ikke er aktivert. De har `sjekkes: maskinelt`, og skriptet
[`rules.mjs`](../../scripts/rules.mjs) i pluginen `solution` sjekker dem med samme id, så et funn alltid viser til regelen her. Skriptet sjekker
bare den delen av regelen som kan avgjøres uten skjønn; resten leses. Testene i repoet stopper en sjekk uten regel, og
en regel som sier at den sjekkes, uten sjekk.

## Bidra

En regel som er feil eller mangler, rettes med en PR mot dette repoet. Sjekken i repoet stopper en henvisning til en
regel som ikke finnes.
