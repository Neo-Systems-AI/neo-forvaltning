# Veiviseren

Veiviseren tar brukeren gjennom saken steg for steg, og viser på hvert steg bare det steget trenger. Den er en visning av
saken, ikke saksbehandling: status, oppgaver og flyter hører til saksbehandlingen, og veiviseren leser fra dem. Det
eneste den lagrer, er bekreftelsene: at et menneske har gått videre fra et steg. Hver sakstype kan ha én veiviser.

## Kortversjonen

Om sakstypen skal ha en veiviser:

| Spørsmålet | Et ja betyr | Regelen |
|---|---|---|
| Har saken et fast hovedløp, mye å gå gjennom og brukere som ikke bruker den hver dag? | **En veiviser** | `nar-veiviser` |
| Viser oppgavelista veien godt nok? | **Ingen veiviser** | `nar-veiviser` |
| Er arbeidet på tvers av sakene i en runde? | **Veiviseren på runden**, ikke på hver sak | `veiviser-for-runden` |
| Er veiviseren hovedarbeidet i sakstypen? | `isDefaultMode: true` | `nar-veiviser` |
| Bygger hvert steg på det forrige? | `sequential: true` (standarden) | `rekkefolge-eller-fritt` |

Hva steget skal vise og kreve:

| Steget skal … | Bruk | Regelen |
|---|---|---|
| vise eller endre felt på saken, også statusen | Feltblokken | `bare-det-steget-trenger`, `status-i-arbeidssteget` |
| vise relasjonene, én om gangen eller i tabell | Relasjonsblokken med en lagret visning til jobben | `lagret-visning-per-jobb` |
| vise én relasjon i detalj | Relasjonsvisningsblokken med en variant | `bare-det-steget-trenger` |
| vise kilden brukeren sjekker mot | Kildeblokken, ved siden av det hun fyller ut | `kilden-ved-siden-av` |
| skrive et dokument fra en mal | Dokumentblokken med malen | `dokument-i-steget` |
| vise saksdataene fra en saksdatamal | Saksdatablokken (bare lesing) | `bare-det-steget-trenger` |
| vise partene eller andre kontakter | Partsblokken (bare lesing) | `bare-det-steget-trenger` |
| gjøre noe med saken | Handlingsblokken med en flyt | `handling-er-en-flyt` |
| vente på data | En betingelse over sakens data | `betingelsen-leser-data` |
| bevise en forvaltningsplikt | En betingelse på dokumentet, og bekreftelsen | `plikten-bekreftes-med-dokumentet` |

## visning-ikke-saksbehandling Veiviseren viser saken, den driver den ikke

```yaml
id: visning-ikke-saksbehandling
klasse: felle
gjelder: [caseType.wizard]
krever: [02-status.md#status-er-tilstand, 06-oppgaver.md#oppgave-mal-finnes]
opphav: praksis
```

- **Gjør:** Sett opp statusløpet, oppgavene og flytene først. Lag veiviseren etterpå, som en vei gjennom det som alt
  finnes.
- **Ikke gjør:** Ikke bruk veiviseren i stedet for oppgavemaler eller statuser. Ikke regn med at «Neste» setter status
  eller starter noe.
- **Hvorfor:** Veiviseren lagrer bare bekreftelsene. Om et steg er ferdig, regnes ut av sakens data hver gang saken
  leses. Den kan tilby handlinger saksbehandlingen alt har, men utløser ingenting selv.

## nar-veiviser Bruk veiviseren når brukeren skal ledes gjennom et fast løp med mye på saken

```yaml
id: nar-veiviser
klasse: valg
gjelder: [caseType.wizard, caseType.wizard.isDefaultMode]
opphav: forslag
```

- **Gjør:** Lag en veiviser når saken har et fast hovedløp, mange objekter å gå gjennom (relasjoner, kilder) og brukere
  som ikke bruker saken hver dag. Sett `isDefaultMode: true` når veiviseren er hovedarbeidet i sakstypen; standarden er
  `false`.
- **Ikke gjør:** Ikke lag en veiviser for en enkel sak der oppgavelista viser veien, eller for unntakene.
- **Hvorfor:** Veiviseren svarer på at brukeren ikke vet hvor hun skal trykke, og på at felt vises før de skal brukes. En
  enkel sak får ingenting igjen for den.

## steg-er-en-jobb Ett steg er én jobb, og tittelen sier jobben

```yaml
id: steg-er-en-jobb
klasse: valg
gjelder: [caseType.wizard.steps.name, caseType.wizard.steps.description]
opphav: praksis
```

- **Gjør:** Gi hvert steg en tittel som sier hva brukeren gjør («Legg inn agendaen», «Knytt agendapunktene»), høyst 120
  tegn. Skriv en beskrivelse bare når den sier noe tittelen ikke sier, som én kort setning.
- **Ikke gjør:** Ikke gi steg navn etter faser eller statuser («Behandling»). Ikke skriv forklaringer på steget.
- **Hvorfor:** Brukeren skal se hva hun skal gjøre. Kartet over stegene viser bare navnet på steget hun står på.

## kundens-ord Tekstene er kundens ord

```yaml
id: kundens-ord
klasse: valg
gjelder: [caseType.wizard.steps.name, caseType.relationViews.label]
krever: [04-relasjoner.md#navn-pa-relasjonene]
opphav: praksis
```

- **Gjør:** Skriv stegnavn og beskrivelser med kundens ord. Gi relasjonene kundens navn på relasjonsvisningen, så
  veiviserens tekster bruker dem.
- **Ikke gjør:** Ikke bruk systemord som «relasjon», «statusgruppe» eller sakstypenavnene i stegene.
- **Hvorfor:** Det veiviseren sier mangler, bygges av statusnavnene, feltnavnene og navnet på relasjonene. Uten kundens
  navn står det et generisk navn.

## bare-det-steget-trenger Hvert steg viser bare det jobben trenger

```yaml
id: bare-det-steget-trenger
klasse: valg
gjelder: [caseType.wizard.steps.rows, caseType.relationViews.variants, caseType.relationTableViews]
krever: [04-relasjoner.md#en-standard-varianter-ved-siden, 05-felt-og-saksdata.md#et-felt-har-en-leser]
opphav: praksis
```

- **Gjør:** Vis feltene og objektene steget trenger. Bruk en variant av relasjonsvisningen og en egen lagret visning for
  relasjonstabellen når steget trenger et smalere utvalg enn hele saken. Vis saksdataene med saksdatablokken og partene
  med partsblokken når brukeren skal lese dem i steget.
- **Ikke gjør:** Ikke legg hele saken inn i et steg. Ikke vis felt som hører til et senere steg, som utfallet før møtet.
  Ikke regn med å redigere saksdata eller partene i blokkene; de viser bare.
- **Hvorfor:** Felt som vises for tidlig, forvirrer. Alt annet finnes i «Hele saken». Blokkene er relasjoner,
  relasjonsvisning, kilder, felt, feltgruppe, dokument, handlinger, saksdata og parter. Saksdatablokken viser den
  nyeste raden fra én saksdatamal, og partsblokken kontaktene med én rolle; en kontakt endres i feltblokken.

## betingelsen-leser-data Betingelsen leser sakens data, ikke hvem som gjorde arbeidet

```yaml
id: betingelsen-leser-data
klasse: valg
gjelder: [caseType.wizard.steps.condition]
krever: [05-felt-og-saksdata.md#et-felt-har-en-leser, 04-relasjoner.md#retning-fra-gruppering]
opphav: praksis
```

- **Gjør:** Skriv betingelsen («Klar når») over sakens felt og de innebygde (status, statusgruppe, statuskategori),
  relasjonene, kildene, dokumentene, oppgavene, kontaktene og forslagene om relasjoner og nye saker. Bruk kvantorene
  «minst én», «alle», «ingen» og antall, med et krav på objektenes egne felt.
- **Ikke gjør:** Ikke lag en betingelse om at en handling har kjørt. Ikke krev noe om oppgavens status eller et dokuments
  innebygde egenskaper; objektene har bare sine egne felt i betingelsen. Ikke vent på metadataforslagene eller på
  saksdata; de kan ikke leses i betingelsen. Ikke skill mellom arbeid gjort for hånd og av Neo.
- **Hvorfor:** Betingelsen bruker filterets operatorer og betyr det samme som i sakslista. Den åpner bare «Neste»; et
  menneske gjør steget ferdig. Et krav på en oppgave eller et dokument må derfor stå i et felt på objektet.

```yaml
# Eksempel, en tilskuddsrunde: alle søknadene er vurdert og har poengsum
condition:
  type: relations
  relation: { otherCaseTypeSlug: soknad-om-tilskudd, direction: outgoing }
  quantifier: { kind: all }
  where: { type: field, role: self, field: tsk_poeng_sum, operator: isNotEmpty }
```

## alle-krever-et-krav «Alle» krever et krav og minst ett objekt

```yaml
id: alle-krever-et-krav
klasse: felle
gjelder: [caseType.wizard.steps.condition]
opphav: praksis
```

- **Gjør:** Kombiner «alle» med et krav (`where`) når steget skal vente på at hvert punkt er gjort. Legg kravet om at et
  felt er utfylt, her.
- **Ikke gjør:** Ikke regn med at «alle» er oppfylt når det ikke finnes noen.
- **Hvorfor:** «Alle» krever minst ett objekt, så et steg om at feltet er utfylt på alle punktene, er ikke klart før det
  finnes punkter. Påkrevd er ikke en egenskap ved feltet (`05-felt-og-saksdata.md#pakrevd-er-en-betingelse`).

## plikten-bekreftes-med-dokumentet En forvaltningsplikt bekreftes i steget der brevet lages, med dokumentet som betingelse

```yaml
id: plikten-bekreftes-med-dokumentet
klasse: valg
gjelder: [caseType.wizard.steps.condition, SetDocumentFieldValue]
krever: [05-felt-og-saksdata.md#plikten-er-ikke-saksdata, 03-veiviser.md#betingelsen-leser-data, 09-maler.md#brevet-er-beviset]
opphav: forslag
```

- **Gjør:** Når saken har en veiviser, legg plikten (foreløpig svar, forhåndsvarsel, mangelbrev) i steget der brevet
  lages, med dokumentblokken og malen. Skriv betingelsen som «minst ett dokument» med et krav på et dokumentfelt som
  skiller brevet, «Dokumenttype» fra grunnoppsettet (`09-maler.md#brevet-er-beviset`), satt av flyten som lager eller
  sender det. Arbeidet er en oppgave. Bekreftelsen er beviset for at et menneske har sett det.
- **Ikke gjør:** Ikke lag en saksdatamal eller en avkrysning for plikten. Ikke skriv betingelsen som «oppgaven er
  ferdig»; oppgavens status kan ikke leses i betingelsen.
- **Hvorfor:** Dokumentet, oppgaven og bekreftelsen er det Neo registrerer selv, med tidspunkt og aktør. Betingelsen kan
  ikke kjenne igjen et dokument på innholdet, bare på dokumentets egne felt.

```yaml
- name: Send forhåndsvarsel
  rows:
    - columns: [{ width: 12, items: [{ type: document, title: Forhåndsvarselet, templateId: <Forhåndsvarsel — fvl. § 16> }] }]
  condition:
    type: documents
    quantifier: { kind: some }
    where: { type: field, fieldId: <dokumenttype>, operator: eq, value: forhandsvarsel }
```

## status-i-arbeidssteget Statusen settes i steget der jobben gjøres

```yaml
id: status-i-arbeidssteget
klasse: valg
gjelder: [caseType.wizard.steps.rows]
krever: [02-status.md#status-er-tilstand]
opphav: praksis
```

- **Gjør:** Legg en feltblokk med sakens status i steget: øverst når statusen starter jobben («Møte pågår»), nederst når
  den avslutter jobben («Møte gjennomført»).
- **Ikke gjør:** Ikke lag et steg som bare er en statusvelger. Ikke regn med at «Neste» setter status.
- **Hvorfor:** Status er et innebygd felt som de andre. Skal steget gjøre noe med saken, er det en handling (en flyt).

## statusen-er-nadd Krev at statusen er nådd, ikke at den er lik

```yaml
id: statusen-er-nadd
klasse: felle
gjelder: [caseType.wizard.steps.condition, caseType.statusGroups.options.sequence]
krever: [01-sakstype.md#sekvensielt-lop, 02-status.md#rekkefolgen-er-lopet]
opphav: praksis
```

- **Gjør:** Skriv betingelsen på status som «statusen eller en senere i løpet»: `inArray` over statusene med samme eller
  høyere `sequence`.
- **Ikke gjør:** Ikke krev `eq` på én status.
- **Hvorfor:** Med `eq` blir et bekreftet steg uoppfylt så snart saken går videre, og kartet viser at noe mangler på en
  ferdig sak.

```yaml
condition:
  type: field
  builtin: status
  operator: inArray
  value: [Vedtak fattet, Venter på aksept av tilsagn, Til utbetaling, Venter på rapport, Avsluttet]
```

## siste-steg-for-avsluttet Det siste steget bekreftes før saken avsluttes

```yaml
id: siste-steg-for-avsluttet
klasse: felle
gjelder: [caseType.wizard.steps.condition, caseType.statusGroups.options.category]
krever: [02-status.md#avsluttet-er-last]
opphav: praksis
```

- **Gjør:** La betingelsen for det siste steget kreve en status i `AKTIV`, og la avslutningen komme etter.
- **Ikke gjør:** Ikke krev en status i `AVSLUTTET` i et steg som skal bekreftes.
- **Hvorfor:** En lukket sak avvises før noe regnes ut (`CASE_CLOSED`), så steget kan aldri bekreftes.

## handling-er-en-flyt Det et steg gjør med saken, er en flyt som «Handling på objekt»

```yaml
id: handling-er-en-flyt
klasse: valg
gjelder: [caseType.wizard.steps.rows, ObjectAction, workflow]
krever: [07-flyt.md#flyt-handling-pa-objektet]
opphav: forslag
```

- **Gjør:** Bruk handlingsblokken når steget skal sette noe, slå opp i et register eller lage et dokument. Pek på en flyt
  som er satt opp som «Handling på objekt» for målets type (saken, en kontakt, en kilde, et dokument, en oppgave). La
  handlingen fylle feltene, feltblokkene vise dem og betingelsen lese dem.
- **Ikke gjør:** Ikke se etter handlinger som bare finnes i veiviseren. Ikke pek på relasjonen (`via`); den er ikke et
  objekt en handling kan gå på.
- **Hvorfor:** Handlingene er de samme flytene som i resten av appen, med samme tilgang. Det finnes ingen betingelse om
  at handlingen har kjørt.

## rekkefolge-eller-fritt La stegene gå i rekkefølge, og velg fritt bare når de ikke bygger på hverandre

```yaml
id: rekkefolge-eller-fritt
klasse: standard
gjelder: [caseType.wizard.sequential]
opphav: forslag
```

- **Gjør:** La standarden (`sequential: true`) stå når et steg trenger det forrige. Sett `false` når stegene kan gjøres i
  hvilken som helst rekkefølge.
- **Ikke gjør:** Ikke velg rekkefølge for å tvinge en arbeidsform stegene ikke krever.
- **Hvorfor:** Rekkefølgen gjelder hele veiviseren. I rekkefølge ser brukeren de neste stegene, men kan ikke gjøre noe der
  før det er hennes tur.

## hovedlopet-ikke-unntak Veiviseren dekker hovedløpet

```yaml
id: hovedlopet-ikke-unntak
klasse: valg
gjelder: [caseType.wizard.steps]
opphav: forslag
```

- **Gjør:** Lag steg for det de fleste sakene går gjennom. La unntakene (en oppdatert agenda, en ny opplysning etter at
  steget er bekreftet) håndteres i «Hele saken» eller ved å gå tilbake.
- **Ikke gjør:** Ikke lag steg eller betingelser for sjeldne avvik.
- **Hvorfor:** En bekreftelse står selv om betingelsen blir usann senere, og kartet viser hva som mangler.

## lagret-visning-per-jobb Relasjonsblokken får en lagret visning til jobben

```yaml
id: lagret-visning-per-jobb
klasse: valg
gjelder: [caseType.wizard.steps.rows, caseType.relationTableViews, caseType.relationTableViews.columns]
krever: [04-relasjoner.md#visning-per-fase]
opphav: praksis
```

- **Gjør:** Gi relasjonsblokken en lagret visning med bare kolonnene steget trenger. I et steg der brukeren godtar eller
  avviser forslag fra Neo, vis bare tittelen.
- **Ikke gjør:** Ikke bruk den fulle visningen i hvert steg.
- **Hvorfor:** Med mange kolonner blir handlingene på forslagene skjøvet ut av bildet.

## kilden-ved-siden-av Kildeblokken står i steget der brukeren leser kilden, ved siden av det hun fyller ut

```yaml
id: kilden-ved-siden-av
klasse: valg
gjelder: [caseType.wizard.steps.rows]
krever: [03-veiviser.md#betingelsen-leser-data, 03-veiviser.md#bare-det-steget-trenger]
opphav: praksis
```

- **Gjør:** Bruk kildeblokken i steget der brukeren skal legge inn eller lese kilden. Når hun skal sjekke rader eller felt
  mot kilden, sett blokken i en kolonne ved siden av. Gi blokken en tittel som sier hvilken kilde det er.
- **Ikke gjør:** Ikke legg kildeblokken i hvert steg. Ikke regn med at den viser bare én kilde; den viser alle kildene
  saken har.
- **Hvorfor:** Blokken har bare en tittel og ikke noe filter. Står den ved siden av, markerer «Vis i dokumentet» sitatet
  uten en dialog.

```yaml
steps:
  - name: Kontroller opplysningene mot søknaden
    rows:
      - columns:
          - { width: 6, items: [{ type: source, title: "Søknaden" }] }
          - { width: 6, items: [{ type: field, role: from, field: tsk_omsokt_belop }] }
```

## dokument-i-steget Dokumentblokken står i steget der dokumentet skrives, med malen det skal lages fra

```yaml
id: dokument-i-steget
klasse: valg
gjelder: [caseType.wizard.steps.rows, documentTemplate]
krever: [09-maler.md#mal-kobles-til-sakstypen, 03-veiviser.md#status-i-arbeidssteget]
opphav: praksis
```

- **Gjør:** Bruk dokumentblokken i steget der brukeren skriver eller går gjennom dokumentet (vedtaket, referatet). Sett
  `templateId` til dokumentmalen. Sett statusblokken under når steget slutter med at dokumentet er ferdig.
- **Ikke gjør:** Ikke la blokken stå uten mal når steget skal lage et bestemt dokument. Ikke bruk den for dokumenter som
  kommer inn utenfra; de er kilder.
- **Hvorfor:** Med en mal lager brukeren dokumentet i steget med «Lag dokument», enten ved å la Neo skrive utkastet
  eller ved å lage det manuelt, og redigerer det der. Blokken finner dokumentet igjen på malen det er laget fra. Uten
  mal viser blokken bare sakens dokumenter og veien til editoren i hele saken.

## hver-vei-kommer-fram Hver vei saken kan ta, kommer fram til det siste steget

```yaml
id: hver-vei-kommer-fram
klasse: felle
gjelder: [caseType.wizard.sequential, caseType.wizard.steps.condition, caseType.statusGroups.options]
krever: [03-veiviser.md#statusen-er-nadd, 03-veiviser.md#siste-steg-for-avsluttet]
opphav: praksis
```

- **Gjør:** Gå gjennom stegene én gang for hvert utfall saken kan få (innvilget, avslått, avvist, trukket, bortfalt), og
  se at hvert steg kan bekreftes på den veien. Et steg som bare gjelder hovedløpet, får en betingelse som også holder når
  saken har tatt en annen vei: en gruppe med `join: or` der den ene grenen er utfallet eller resultatet som leder bort
  (`formell_kontroll eq ikke-bestatt`, `utfall` er `avvist` eller `trukket`).
- **Ikke gjør:** Ikke krev noe i et steg som bare finnes når saken går hovedløpet (en poengsum, en innstilling), uten en
  gren for det som går en annen vei.
- **Hvorfor:** Når stegene går i rekkefølge, kan et steg bare bekreftes når stegene foran er bekreftet og betingelsen
  holder (`WIZARD_STEP_NOT_AVAILABLE`, `WIZARD_STEP_NOT_READY`). En søknad som avvises i den formelle kontrollen, får
  aldri en poengsum. Krever vurderingssteget poengsummen, når saken aldri vedtaket, og det siste steget, som må
  bekreftes før saken avsluttes, kan ikke nås. Feilen synes ikke når veiviseren prøves med hovedløpet.

```yaml
steps:
  - name: Vurder søknaden etter kriteriene
    condition:
      type: group
      join: or                         # klar når vurderingen er gjort, eller saken er avvist før den
      conditions:
        - { type: field, fieldId: sum_poeng, operator: isNotEmpty }
        - { type: field, fieldId: formell_kontroll, operator: eq, value: ikke-bestatt }
```

## en-per-sakstype Én veiviser per sakstype, og den er organisasjonens egen

```yaml
id: en-per-sakstype
klasse: felle
gjelder: [caseType.wizard, solution]
opphav: praksis
```

- **Gjør:** Lag veiviseren i organisasjonen som bruker sakstypen, og publiser den.
- **Ikke gjør:** Ikke regn med at en veiviser følger med en Løsning eller kan lages som partnermal.
- **Hvorfor:** Veiviseren er unik per sakstype og eier, og den er ikke med i sakstypen som kopieres ved utrulling. Saken
  leser den publiserte versjonen, aldri utkastet.

## veiviser-for-runden Arbeidet på tvers av sakene går i en veiviser på runden

```yaml
id: veiviser-for-runden
klasse: valg
gjelder: [caseType.wizard, caseType.wizard.steps.rows, caseType.relationViews.variants]
krever: [01-sakstype.md#runde-som-egen-sakstype, 04-relasjoner.md#neo-finner-relasjonene, 04-relasjoner.md#status-for-ferdig, 05-felt-og-saksdata.md#poeng-som-felt-begrunnelse-som-saksdata]
opphav: forslag
```

- **Gjør:** Når runden er en egen sakstype, lag stegene etter jobbene i runden: knytte sakene, vurdere dem én om gangen,
  sammenligne dem i tabellen og gjennomføre beslutningen.
- **Ikke gjør:** Ikke lag en veiviser på hver enkeltsak for å vise sammenligningen.
- **Hvorfor:** Veiviseren kan gå gjennom relasjonene én om gangen og i tabellen, og kreve at et felt er fylt ut på alle.

```yaml
wizard:
  name: Søknadsrunden
  isDefaultMode: true
  steps:
    - name: Knytt søknadene til runden     # «La Neo finne sakene»; klar når minst én søknad og ingen forslag venter
    - name: Vurder søknadene               # én om gangen, variant «Vurdering»; klar når alle har tsk_poeng_sum
    - name: Ranger søknadene               # tabellen med den lagrede visningen «Rangering»
    - name: Tildelingsmøtet                # statusblokk øverst, så tabellen; klar når statusen er nådd
```
