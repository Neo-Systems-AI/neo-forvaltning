# Relasjoner og relasjonsvisninger

En relasjon knytter to saker sammen, for eksempel et møte og stoffene på agendaen, eller en klage og vedtaket den
gjelder. Relasjonen kan bære egne felt for det som bare finnes i krysset mellom de to sakene. Relasjonsvisningene
bestemmer hvordan relasjonene vises: som tabell i saken (en lagret visning) og som detaljvisning når man åpner en rad.
Relasjoner lages av mennesker, for hånd eller ved å godta et forslag fra Neo; ingen flyt kan lage eller lese dem.

## Kortversjonen

Om to ting skal være en relasjon:

| Spørsmålet | Et ja betyr | Regelen |
|---|---|---|
| Har begge tingene sitt eget løp, sine egne frister og sitt eget arbeid? | **To sakstyper og en relasjon** | `relasjon-nar-begge-har-arbeid` |
| Skal sakene bare samles i en liste? | **Ingen relasjon.** En lagret visning med filter på et felt | `relasjon-nar-begge-har-arbeid` |
| Skal en flyt lage, lese eller skrive koblingen? | **Ikke mulig.** Et menneske knytter, gjerne fra et forslag fra Neo | `relasjoner-lages-av-mennesker`, `neo-finner-relasjonene` |
| Finnes det flere slags forhold mellom de samme sakene? | **Ett felt på relasjonen**, ikke flere relasjoner | `en-relasjon-per-par` |

Hvor en verdi skal stå:

| Spørsmålet | Et ja betyr | Regelen |
|---|---|---|
| Finnes verdien uten at de to sakene møtes? | **Et felt på saken** | `05-felt-og-saksdata.md#et-felt-har-en-leser` |
| Gjelder den forholdet, eller én behandling (dette møtet, denne runden)? | **Et felt på relasjonen**, bundet til sakstypen som samler | `relasjonsfelt-for-krysset`, `relasjonsfelt-pa-grupperingen`, `frys-pa-kanten` |
| Skal «X av Y ferdig» telles, eller veiviseren vente på punktene? | **Et statusfelt** på relasjonen | `status-for-ferdig` |

## relasjon-nar-begge-har-arbeid Bruk en relasjon når begge sakene har sin egen saksbehandling

```yaml
id: relasjon-nar-begge-har-arbeid
klasse: valg
gjelder: [caseType]
opphav: praksis
```

- **Gjør:** Lag to sakstyper og en relasjon når to ting hører sammen, men hver har sitt eget løp, sine egne frister og
  sitt eget arbeid: et møte og stoffene, en klage og vedtaket, en søknadsrunde og søknadene.
- **Ikke gjør:** Ikke lag en relasjon bare for å samle saker i en liste; bruk en lagret visning med filter på et felt.
  Ikke lag en sak for noe som ikke har eget arbeid.
- **Hvorfor:** Grupperingen er relasjonen, ikke en beholder. Begge sider bærer sin egen saksbehandling, og relasjonen kan
  bære felt om forholdet. En sak uten eget arbeid har ingen jobb.

## relasjoner-lages-av-mennesker Relasjoner lages av en person eller som forslag fra Neo

```yaml
id: relasjoner-lages-av-mennesker
klasse: felle
gjelder: [workflow]
opphav: praksis
```

- **Gjør:** Planlegg at relasjonene knyttes i saken, for hånd eller ved å godta forslag fra Neo, og at relasjonsfeltene
  fylles av saksbehandleren i tabellen eller detaljvisningen.
- **Ikke gjør:** Ikke design et løp der en flyt skal opprette, lese eller skrive en relasjon eller et relasjonsfelt.
- **Hvorfor:** Det finnes ingen flytnode for relasjoner, og ingen hendelse når en relasjon endres. En klage som kommer
  inn på skjema, kan derfor ikke knyttes til vedtaket uten et menneske.

## neo-finner-relasjonene La Neo foreslå relasjonene med en relasjonsinstruks

```yaml
id: neo-finner-relasjonene
klasse: valg
gjelder: [caseRunInstruction, caseRunInstruction.kind]
krever: [08-instrukser.md#instruks-velg-slaget]
opphav: praksis
```

- **Gjør:** Skriv en relasjonsinstruks (`kind: CASE_RELATION`) på sakstypen som samler. Skriv i instruksen hva som er en
  sak og hva som ikke er det, med eksempler på det som likner.
- **Ikke gjør:** Ikke regn med at noe filtrerer forslagene utenom instruksen. Om lukkede saker skal foreslås, står i
  instruksen.
- **Hvorfor:** Hva som foreslås, avgjøres av instruksen. Et menneske avgjør hvert forslag.

## retning-fra-gruppering Relasjonen går fra grupperingen til medlemmet

```yaml
id: retning-fra-gruppering
klasse: felle
gjelder: [caseType.relationViews.direction, caseType.relationTableViews.direction]
opphav: skrevet
```

- **Gjør:** La relasjonen gå fra saken som samler (møtet, runden, vedtaket som klages på) til saken som inngår (stoffet,
  søknaden, klagen). Hold samme retning i hele oppsettet.
- **Ikke gjør:** Ikke bland retningene mellom samme to sakstyper.
- **Hvorfor:** Relasjonslista, de lagrede visningene og detaljvisningene gjelder én gruppe: et par av sakstyper og en
  retning. En relasjon som står motsatt vei, havner i en annen gruppe og får verken kolonnene eller oppsettet.

## en-relasjon-per-par Mellom to saker finnes én relasjon, og den har ingen type

```yaml
id: en-relasjon-per-par
klasse: felle
gjelder: [customFieldDefinition.entityType]
opphav: praksis
```

- **Gjør:** Legg det som skiller slags forhold i et felt på relasjonen («Omgjort», «Avvist», «Oversendt»).
- **Ikke gjør:** Ikke planlegg to ulike relasjoner mellom de samme to sakene. Ikke se etter en relasjonstype.
- **Hvorfor:** En relasjon har ingen type. Betydningen kommer fra sakstypene i hver ende, retningen og feltene. To saker
  kan bare ha én relasjon i samme retning.

## relasjonsfelt-for-krysset Det som bare finnes i krysset, er et felt på relasjonen

```yaml
id: relasjonsfelt-for-krysset
klasse: valg
gjelder: [customFieldDefinition.entityType]
krever: [05-felt-og-saksdata.md#et-felt-har-en-leser]
opphav: praksis
```

- **Gjør:** Spør: finnes dette uten at de to sakene møtes? Er svaret nei, legg feltet på relasjonen (`entityType:
  case_relation`). Utfallet av et agendapunkt, posisjonen på ett møte, utfallet av en klage over ett vedtak og plassen
  til én søknad i én runde er slike felt.
- **Ikke gjør:** Ikke legg et utfall som gjelder forholdet, på en av sakene. Ikke dobbeltfør det på begge. Ikke regn med
  å filtrere eller sortere relasjonstabellen på feltet.
- **Hvorfor:** Samme stoff kan bli utsatt på ett møte og vedtatt på et annet; ett saksfelt kan ikke bære begge.
  Relasjonsfeltet leses i relasjonstabellen, detaljvisningen og veiviseren, og telles i framdriften når det er et
  statusfelt. Tabellen filtrerer og sorterer ikke på feltene.

```yaml
# Eksempel, en tilskuddsrunde: på relasjonen runde → søknad
customFields:
  - name: tsr_innstilling
    label: Innstilling i runden
    type: select
    entityType: case_relation
    group: Behandlingen i runden
    options:
      - { key: tildeles,      label: Tildeles }
      - { key: venteliste,    label: Venteliste }
      - { key: tildeles-ikke, label: Tildeles ikke }
```

## relasjonsfelt-pa-grupperingen Relasjonsfeltet bindes til sakstypen som samler

```yaml
id: relasjonsfelt-pa-grupperingen
klasse: felle
gjelder: [customFieldDefinition.caseTypeId, caseType.customFields]
krever: [04-relasjoner.md#retning-fra-gruppering]
opphav: praksis
```

- **Gjør:** Knytt relasjonsfeltet til sakstypen på grupperingssiden (møtet, runden).
- **Ikke gjør:** Ikke knytt det til medlemssiden.
- **Hvorfor:** Relasjonsfeltet er bundet til én sakstype, og den sier hvilke relasjoner feltet tilbys på. Står den på
  feil side, tilbys feltet på relasjoner det ikke gjelder.

## status-for-ferdig Bruk et statusfelt på relasjonen når «ferdig» skal telles

```yaml
id: status-for-ferdig
klasse: valg
gjelder: [customFieldDefinition.type, caseType.relationTableViews.progressField]
krever: [04-relasjoner.md#relasjonsfelt-for-krysset]
opphav: praksis
```

- **Gjør:** Lag feltet som `type: status` med grupper som har en livssyklus (`TODO`, `COMPLETED`) når noen skal se hvor
  mange punkter som er ferdige, eller når veiviseren skal vente på dem.
- **Ikke gjør:** Ikke bruk `select` for noe som skal telles som ferdig. Ikke ha et valg ingen kan avgjøre.
- **Hvorfor:** Telleren «X av Y ferdig» leser livssyklusgruppen og godtar bare et statusfelt på relasjonen. Saken har
  sin egen status og kan ikke ha et statusfelt.

```yaml
- name: tsr_vurdering
  label: Vurdering
  type: status
  entityType: case_relation
  statusConfig:
    groups:
      - { id: ikke-vurdert, label: Ikke vurdert, groupType: TODO }
      - { id: vurdert,      label: Vurdert,      groupType: COMPLETED }
    options:
      - { id: ikke-vurdert, label: Ikke vurdert, groupId: ikke-vurdert }
      - { id: vurdert,      label: Vurdert,      groupId: vurdert }
```

## frys-pa-kanten Det som skal stå som det var i én behandling, skrives på relasjonen

```yaml
id: frys-pa-kanten
klasse: felle
krever: [04-relasjoner.md#relasjonsfelt-for-krysset]
opphav: skrevet
```

- **Gjør:** Legg verdier som gjelder én behandling (posisjonen på dette møtet, innstillingen i denne runden) på
  relasjonen.
- **Ikke gjør:** Ikke regn med at en eldre relasjon viser hva saksfeltet var den gangen.
- **Hvorfor:** Relasjonsvisningen viser sakens felt slik de er i dag, også for eldre relasjoner. Endringene står i
  historikken, men visningen har ingen innebygd snapshot.

## navn-pa-relasjonene Gi relasjonene kundens navn

```yaml
id: navn-pa-relasjonene
klasse: valg
gjelder: [caseType.relationViews.label]
opphav: skrevet
```

- **Gjør:** Sett navnet i entall og flertall («agendapunkt», «agendapunkter») på standardvisningen for paret.
- **Ikke gjør:** Ikke sett bare det ene. Ikke sett navnet på en variant.
- **Hvorfor:** Navnet brukes i knappene, tellingen, tomtilstanden, gruppeoverskriften og det veiviseren sier mangler.
  Begge eller ingen, ellers avvises det. Uten navn står et generisk navn.

## en-standard-varianter-ved-siden Én standard per par og retning, varianter til hver jobb

```yaml
id: en-standard-varianter-ved-siden
klasse: valg
gjelder: [caseType.relationViews, caseType.relationViews.variants, caseType.relationViews.variants.name]
opphav: skrevet
```

- **Gjør:** La standardvisningen vise hele relasjonen; den brukes i «Hele saken» og dialogen bak en rad. Lag varianter
  spisset til et steg i veiviseren.
- **Ikke gjør:** Ikke gjør standarden smal for å passe ett steg.
- **Hvorfor:** Det er høyst én standard per par og retning. Et steg i veiviseren peker på en variant med navnet, uten å
  endre hva resten av appen viser.

## oppsett-etter-arbeidsgangen Ordne detaljvisningen etter arbeidsgangen

```yaml
id: oppsett-etter-arbeidsgangen
klasse: valg
gjelder: [caseType.relationViews.rows, caseType.relationViews.rows.columns]
krever: [05-felt-og-saksdata.md#seksjon-pa-feltet]
opphav: skrevet
```

- **Gjør:** Ordne radene ovenfra og ned slik saksbehandleren jobber: hva saken er og hvor den står, grunnlaget,
  vurderingen og det som skjer etterpå. Bruk en skillelinje med overskrift for å skille sakens data fra relasjonens.
- **Ikke gjør:** Ikke lag egne overskrifter for å gruppere felt; grupperingen står på feltet (`group`). Ikke sett samme
  felt både alene og i en plassert seksjon i kroppen.
- **Hvorfor:** En visning velger utvalg og plassering, men skal ikke si at to felt hører sammen her og ikke der. Samme
  felt to ganger gir to steder å skrive samme verdi.

```yaml
relationViews:
  - name: Søknaden i runden
    fromCaseTypeSlug: soknadsrunde
    direction: outgoing
    label: { singular: søknad, plural: søknader }
    header: [{ type: field, role: via, field: tsr_innstilling }]
    rows:
      - columns: [{ width: 12, items: [{ type: divider, title: Søknaden }] }]
      - columns:
          - { width: 8, items: [{ type: group, role: self, group: Søknaden, display: open }] }
          - { width: 4, items: [{ type: field, role: self, field: tsk_omsokt_belop }] }
      - columns: [{ width: 12, items: [{ type: divider, title: I denne runden }] }]
      - columns:
          - { width: 12, items: [{ type: field, role: via, field: tsr_vurdering }] }
```

## hodet-for-det-som-styrer Hodet i detaljvisningen har de få feltene brukeren styrer etter

```yaml
id: hodet-for-det-som-styrer
klasse: valg
gjelder: [caseType.relationViews.header, caseType.relationViews.variants.header]
krever: [04-relasjoner.md#oppsett-etter-arbeidsgangen]
opphav: forslag
```

- **Gjør:** Legg i hodet de to eller tre feltene brukeren skal se mens hun leser resten: innstillingen, utfallet,
  vurderingsstatusen på relasjonen. Bruk felt med en kompakt visning (valg, avkrysning, dato, tall).
- **Ikke gjør:** Ikke legg lange tekster eller hele seksjoner i hodet. Ikke la hodet stå tomt når et utfall på relasjonen
  skal settes mens brukeren leser.
- **Hvorfor:** Hodet blir stående når resten ruller, og tar bare felt med en kompakt visning. Samme felt kan stå både i
  hodet og i kroppen.

## visning-per-fase Én lagret visning av relasjonstabellen per fase

```yaml
id: visning-per-fase
klasse: valg
gjelder: [caseType.relationTableViews, caseType.relationTableViews.defaultInStatusGroups, caseType.relationTableViews.isDefault, caseType.relationTableViews.progressField, caseType.relationTableViews.columns]
krever: [02-status.md#grupper-er-faser, 04-relasjoner.md#status-for-ferdig]
opphav: skrevet
```

- **Gjør:** Lag en lagret visning av relasjonstabellen for hver jobb (forberedelse, møtet), med kolonnene jobben trenger.
  Gjør hver av dem til standard i fasene der jobben gjøres (`defaultInStatusGroups`), og sett `isDefault` på den som skal
  åpne i en fase ingen visning dekker. Tell framdriften med `progressField` på et statusfelt på relasjonen.
- **Ikke gjør:** Ikke lag én tabell med alle kolonnene. Ikke prøv å sortere relasjonstabellen i visningen; rekkefølgen
  er den manuelle plassen.
- **Hvorfor:** Tabellen åpner med visningen for fasen saken er i, og fasen går foran `isDefault`. En fase sakstypen ikke
  har, avvises.

## org-eide-visninger Relasjonsvisningene er organisasjonens egne

```yaml
id: org-eide-visninger
klasse: felle
gjelder: [caseType.relationViews, caseType.relationTableViews, solution]
opphav: skrevet
```

- **Gjør:** Lag relasjonsvisningene og de lagrede visningene av relasjonstabellen i organisasjonen som bruker dem.
- **Ikke gjør:** Ikke regn med at de følger med en Løsning.
- **Hvorfor:** De er ikke med i sakstypen som kopieres ved utrulling.
