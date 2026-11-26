# Sakstype og varianter

Sakstypen sier hva slags sak dette er. Den setter sammen statusløpet, feltene, oppgavemalene, dokumentmalene,
instruksene, saksdatamalene og kartlagene som gjelder for saken. En variant er en verdi i et valgfelt på saken som gir
saken ulike oppgaver innenfor samme sakstype.

## Kortversjonen

Still spørsmålene i rekkefølge. Det første ja avgjør.

| # | Spørsmålet | Et ja betyr | Regelen |
|---|---|---|---|
| 1 | Er det én ting som får sitt eget utfall og har sitt eget løp? | **Én sak**, med en sakstype etter tingen | `en-sak-en-ting` |
| 2 | Skiller bare oppgavene (og kriteriene) mellom slagene? | **Et variantfelt** på sakstypen | `variant-som-felt` |
| 3 | Skiller hvem som fatter vedtaket, produktet, livssyklusen eller tilgangen? | **To sakstyper**, knyttet med en relasjon om de hører sammen | `egen-sakstype-nar` |
| 4 | Er det en klage på vårt eget vedtak? | **Samme sak**, med klagesporet sist i statusløpet | `02-status.md#klage-i-samme-sak` |
| 5 | Er det en klage vi behandler for et annet organ? | **En egen klagesakstype** med en relasjon fra vedtaket | `klage-som-egen-sakstype` |
| 6 | Har ordningen eller runden eget arbeid med frister på tvers av sakene? | **En egen sakstype for runden** med en relasjon til hver sak | `runde-som-egen-sakstype` |
| 7 | Trengs bare en egen liste? | **Ingen sakstype.** En lagret visning med filter | `egen-sakstype-nar` |

## sakstypen-er-montasjen Sakstypen setter sammen deler som lages hver for seg

```yaml
id: sakstypen-er-montasjen
klasse: valg
gjelder: [caseType, caseType.customFields, caseType.caseDataTemplates, caseType.templates, caseType.caseTypeInstructions, caseType.caseRunInstructions, caseType.taskTemplateSets]
krever: [05-felt-og-saksdata.md#en-vurderingsmal-per-sakstype]
opphav: skrevet
```

- **Gjør:** Lag dokumentmalene, instruksene og saksdatamalene hver for seg, og knytt dem til sakstypen. En del som
  gjelder flere sakstyper på samme måte (et brev, en integrasjons saksdatamal), knyttes til alle.
- **Ikke gjør:** Ikke lag en kopi av en mal eller en instruks for hver sakstype som bruker den. Unntakene er
  oppgavesettet og vurderingsmalen, som er én per sakstype.
- **Hvorfor:** Delene knyttes mange-til-mange. En delt del rettes ett sted; en kopi driver fra originalen.

Eksempel: slik settes en ny sakstype opp, i rekkefølgen delene bygger på hverandre.

1. Bestem hva én sak er, og hvor mange sakstyper det blir (Kortversjonen over).
2. Bestem navnene før noe bygges (`00-navn-pakking-og-versjoner.md#navn-er-nokkelen`, `navn-og-slug`).
3. Lag statusløpet, med vedtaksstatusen, ventestatusen og klagesporet med en gang (`02-status.md`).
4. Lag feltene, med valgene, variantfeltet og utfallsfeltet først (`05-felt-og-saksdata.md`).
5. Lag saksdatamalene: én for grunnlaget som kommer inn, én for vurderingen.
6. Skriv behandlingsregelen, med variantene som seksjoner (`08-instrukser.md`).
7. Lag oppgavesettet, bundet til statusene (`06-oppgaver.md`).
8. Sett sammen sakstypen: knytt delene, gi agenten verktøyene (`agentens-verktoy-etter-kildene`), og kartlag bare når
   saken avgjøres på kart (`kartlag-med-et-sporsmal`).
9. Vurder en veiviser til slutt (`03-veiviser.md#nar-veiviser`).

## en-sak-en-ting Én sak er én ting med ett løp

```yaml
id: en-sak-en-ting
klasse: valg
gjelder: [caseType, caseType.name, caseType.description]
opphav: praksis
```

- **Gjør:** La én sak være én ting som får sitt eget utfall og har sin egen livssyklus: én søknad, ett møte, ett stoff,
  én klage. Gi sakstypen navn etter den tingen.
- **Ikke gjør:** Ikke la én sak dekke mange ting med hvert sitt utfall, for eksempel alle søknadene til en ordning.
- **Hvorfor:** Statusen, utfallet, fristene og vedtaket hører til én ting. Når to ting med ulik livssyklus presses inn i
  én sak, blir statusløpet uleselig, og oppgaver henger på statuser de ikke hører til.

## egen-sakstype-nar To sakstyper når kravene gir to løp

```yaml
id: egen-sakstype-nar
klasse: valg
gjelder: [caseType, savedView]
krever: [04-relasjoner.md#relasjon-nar-begge-har-arbeid]
opphav: praksis
```

- **Gjør:** Lag en sakstype per ting som har sitt eget løp. Lag to når det som skiller, endrer hele løpet: hvem som
  fatter vedtaket, om produktet er et vedtak eller en innstilling, om tingene har ulik livssyklus, eller om tilgangen må
  være ulik (`14-tilgang.md#tilgang-skiller-sakstyper`). Knytt dem med en relasjon når de hører sammen.
- **Ikke gjør:** Ikke lag en modusbryter på saken for noe som er avgjort før saken finnes. Ikke lag en sakstype for å få
  en egen liste; en lagret visning med filter på et felt gir lista.
- **Hvorfor:** Ulike haler gir ulike statuser, maler og oppgaver, og da er en felles sakstype bare et skall. Omfanget
  følger kravene, ikke et mål om få sakstyper: hver sakstype har jobben å bære ett løp.

## variant-som-felt En variant er et valgfelt som velger oppgavene, ikke en egen sakstype

```yaml
id: variant-som-felt
klasse: valg
gjelder: [caseType.variantField, caseType.taskTemplateRules.conditionValues, customFieldDefinition.optionsJson]
krever: [05-felt-og-saksdata.md#nokkel-og-etikett, 06-oppgaver.md#oppgave-variant]
opphav: skrevet
```

- **Gjør:** Bruk ett `select`-felt for variantene når saksgangen, statusene og vedtaksmalen er like, og bare noen
  oppgaver skiller. Sett feltet som variasjonsakse på sakstypen, og gi oppgavene som bare gjelder noen varianter,
  nøklene de gjelder for.
- **Ikke gjør:** Ikke lag én sakstype per søknadstype eller ordning når bare oppgavene skiller.
- **Hvorfor:** Åtte sakstyper gir åtte statusløp og åtte vedtaksmaler å holde i takt for å uttrykke én forskjell.
  Variasjonsaksen leses når oppgavemalene legges i saken.

```yaml
caseType: { name: Søknad om tilskudd, slug: soknad-om-tilskudd, sequential: true }
variantFieldName: tsk_ordning
customFields:
  - name: tsk_ordning
    label: Ordning
    type: select
    options:
      - { key: kultur, label: Kulturtilskudd }
      - { key: idrett, label: Idrettstilskudd }
taskTemplates:
  - title: Kontroller budsjettet mot egenandelen
    variantValues: [idrett]        # nøklene, ikke etikettene
```

## variant-styrer-bare-oppgaver Variantfeltet styrer bare hvilke oppgaver saken får

```yaml
id: variant-styrer-bare-oppgaver
klasse: felle
gjelder: [caseType.variantField, caseType.taskTemplateRules.conditionValues]
krever: [06-oppgaver.md#oppgave-variant, 08-instrukser.md#instruks-varianter-som-seksjoner]
opphav: praksis
```

- **Gjør:** Bruk variantfeltet til å velge oppgaver. Det som ellers skal variere (hjemmelen i brevet, seksjonen i
  behandlingsregelen), leser malen, instruksen eller flyten fra feltet selv.
- **Ikke gjør:** Ikke regn med at variantfeltet gir ulike statuser, maler eller saksdatamaler. Ikke regn med at en
  endring av feltet på en sak gir nye oppgaver.
- **Hvorfor:** Variasjonsaksen brukes bare når oppgavemalene legges i saken.

## klage-som-egen-sakstype En klage er egen sakstype bare når vi behandler den for et annet organ

```yaml
id: klage-som-egen-sakstype
klasse: valg
gjelder: [caseType]
krever: [04-relasjoner.md#retning-fra-gruppering, 04-relasjoner.md#relasjonsfelt-for-krysset, 02-status.md#klage-i-samme-sak]
opphav: praksis
```

- **Gjør:** Lag en egen klagesakstype når vi er sekretariat for en klagenemnd eller et annet organ. Knytt klagesaken til
  vedtakssaken med en relasjon som går fra vedtaket til klagen, og legg klagens utfall på relasjonen. La Neo foreslå
  relasjonen (`04-relasjoner.md#neo-finner-relasjonene`).
- **Ikke gjør:** Ikke lag egen klagesakstype når klagen gjelder vårt eget vedtak; da går den i vedtakssaken. Ikke regn
  med at en flyt kan knytte en innkommet klage til vedtaket.
- **Hvorfor:** Som underinstans vurderer vi vårt eget vedtak på nytt i samme sak. Som sekretariat har klagen sitt eget
  løp, sine egne frister og en annen eier. Relasjonen lages av et menneske, for hånd eller ved å godta et forslag
  (`04-relasjoner.md#relasjoner-lages-av-mennesker`).

```yaml
# Eksempel: sekretariat for en klagenemnd. Utfallet står på relasjonen vedtak → klage.
caseType: { name: Klage til nemnda, slug: klage-til-nemnda, sequential: true }
# Feltet er bundet til sakstypen som samler, vedtakssaken (04-relasjoner.md#relasjonsfelt-pa-grupperingen)
customFields:
  - name: kln_utfall
    label: Utfall i nemnda
    type: select
    entityType: case_relation
    options:
      - { key: stadfestet, label: Stadfestet }
      - { key: omgjort,    label: Omgjort }
      - { key: opphevet,   label: Opphevet }
      - { key: avvist,     label: Avvist }
```

## runde-som-egen-sakstype En ordning eller runde er egen sakstype bare når den har sitt eget arbeid på tvers av sakene

```yaml
id: runde-som-egen-sakstype
klasse: valg
gjelder: [caseType, caseType.variantField]
krever: [04-relasjoner.md#relasjon-nar-begge-har-arbeid, 04-relasjoner.md#retning-fra-gruppering]
opphav: forslag
```

- **Gjør:** La enkeltsaken være sakstypen: søknaden, tilsynet, klagen. Bruk ordningen eller runden som variantfelt når
  de bare skiller i oppgaver og kriterier. Lag runden som egen sakstype bare når den har sitt eget arbeid med frister på
  tvers av sakene: utlysning, en felles frist, vurdering og rangering på tvers, et møte som fordeler. Knytt da runden til
  sakene med en relasjon (runde → sak).
- **Ikke gjør:** Ikke legg rundens løp som statuser på enkeltsaken. Ikke skriv det som er likt for hele runden
  (kriteriene, klageinstansen, hjemmelen) inn som tekstfelt på hver sak.
- **Hvorfor:** Runden og enkeltsaken har ulik livssyklus. Det som er likt for alle sakene i en runde, hører til runden.

Eksempel: en tilskuddsrunde med felles søknadsfrist og et tildelingsmøte.

- Runden er en sakstype med statusgruppene som fasene i runden (`02-status.md#grupper-er-faser`).
- Søknaden er en egen sakstype med eget vedtak. Den vurderes for seg, med poengsummen som felt
  (`05-felt-og-saksdata.md#poeng-som-felt-begrunnelse-som-saksdata`).
- Relasjonen går fra runden til søknaden. Plassen og innstillingen i runden og et statusfelt for «vurdert» står på
  relasjonen (`04-relasjoner.md#relasjonsfelt-for-krysset`, `04-relasjoner.md#status-for-ferdig`).
- Neo foreslår hvilke søknader som hører til runden, og et menneske godtar (`04-relasjoner.md#neo-finner-relasjonene`).
- Relasjonstabellen har én lagret visning per fase (`04-relasjoner.md#visning-per-fase`).
- Veiviseren står på runden (`03-veiviser.md#veiviser-for-runden`).

Agenten rangerer ikke saker mot hverandre, og ingen flyt summerer poeng på tvers av sakene: sammenligningen og
fordelingen gjør mennesker i tabellen.

## navn-og-slug Navnet er tingen saken gjelder, sluggen står fast

```yaml
id: navn-og-slug
klasse: valg
gjelder: [caseType.name, caseType.slug, caseType.description, caseType.color]
krever: [00-navn-pakking-og-versjoner.md#navn-er-nokkelen]
opphav: forslag
sjekkes: maskinelt
```

- **Gjør:** Gi sakstypen et navn som sier hva én sak er, med kundens ord («Søknad om tilskudd»). Skriv i beskrivelsen hva
  saken gjelder og hvor den kommer fra. Gi en slug med små bokstaver, og en farge fra `chart-1` til `chart-10`.
- **Ikke gjør:** Ikke bruk interne koder eller avdelingsnavn som navn. Ikke endre sluggen etter at sakstypen er i bruk.
  Ikke bruk en hex-farge.
- **Hvorfor:** Navnet og sluggen er unike i organisasjonen, og sluggen står i lenker og i oppsett som peker på
  sakstypen. Fargen er et token, ikke en farge.

```yaml
caseType:
  name: Søknad om tilskudd
  slug: soknad-om-tilskudd
  description: Søknad om tilskudd fra en av kommunens ordninger, mottatt fra søknadsskjemaet.
  color: chart-3
  sequential: true
```

## sekvensielt-lop En sak med et forvaltningsløp har `sequential: true`

```yaml
id: sekvensielt-lop
klasse: felle
gjelder: [caseType.sequential]
opphav: praksis
```

- **Gjør:** Sett `sequential: true` når saken går gjennom stegene i en rekkefølge.
- **Ikke gjør:** Ikke la standarden (`false`, tavle) stå for en sak med et forvaltningsløp.
- **Hvorfor:** Med løp vises saken som en tidslinje, og statusene har en rekkefølge veiviseren kan lese («statusen er
  nådd»). Uten løp er saken en tavle uten rekkefølge.

## ikke-ror-generell Standardsakstypen «Generell» lar du være

```yaml
id: ikke-ror-generell
klasse: standard
gjelder: [caseType.isDefault]
opphav: praksis
```

- **Gjør:** La `isDefault` stå på standarden (`false`) på sakstypene du lager.
- **Ikke gjør:** Ikke gjør en ny sakstype til standard, og ikke bygg om «Generell».
- **Hvorfor:** Hver organisasjon har nøyaktig én standardsakstype. Den er reserven for saker uten sakstype og kan ikke
  slettes.

## kartlag-med-et-sporsmal Gi sakstypen bare de kartlagene saken skal avgjøres på

```yaml
id: kartlag-med-et-sporsmal
klasse: valg
gjelder: [caseType.geoLayers, caseType.geoLayers.sourceKey, caseType.geoLayers.collection, caseType.geoLayers.visible, GeoSokKartlag]
krever: [11-integrasjoner.md#kartkilder-bare-det-som-brukes]
opphav: praksis
```

- **Gjør:** Legg til et kartlag for hver kilde saksbehandleren må se for å avgjøre saken: det en behandlingsregel spør om,
  eller det en flyt tegner eller måler på. La lagene som alltid skal vurderes, stå synlige (standarden), og sett
  `visible: false` på lagene som bare kan være relevante. Bruk samme kilde og kartlag som flyten søker i.
- **Ikke gjør:** Ikke fyll kartet med alt som kan være relevant. Ikke la kartet stå tomt i en sakstype der en flyt tegner
  eller måler. Ikke gi kartlag til en sakstype som avgjøres på dokumenter.
- **Hvorfor:** Et lag uten et spørsmål bak seg er støy og et kall mot en kilde ingen leser svaret fra. Et tomt kart gir
  ingen feilmelding: flyten tegner på en blank flate. Laget krever et valgt kartlag (`collection`).

```yaml
geoLayers:
  - { sourceKey: verneomrader, collection: "0" }                   # regelen spør alltid
  - { sourceKey: kulturminner, collection: "2", visible: false }   # bare når tiltaket graver
```

## agentens-verktoy-etter-kildene Gi sakstypen de agentverktøyene sakens kilder krever

```yaml
id: agentens-verktoy-etter-kildene
klasse: felle
gjelder: [caseType.defaultAgentToolIds, caseType.defaultAgentModelId]
opphav: praksis
```

- **Gjør:** Sett `defaultAgentToolIds` til verktøyene for kildene saken bygger på: Lovdata (`law_subagent`) når oppgavene
  eller behandlingsregelen viser til lov eller forskrift, websøk (`web_subagent`) for oppdatert informasjon, geodata
  (`geo_subagent`) bare når sakstypen slår opp eller måler i kart. La `defaultAgentModelId` stå tom.
- **Ikke gjør:** Ikke la verktøylista stå tom (standarden). Ikke gi verktøy ingen regel eller oppgave ber om. Ikke velg et
  verktøy som krever en integrasjon organisasjonen ikke har.
- **Hvorfor:** Uten verktøy svarer agenten like villig, bare uten kilden, og feilen syns ikke. Verktøyene og modellen
  kopieres inn på saken når den opprettes, så en endring gjelder bare nye saker. En tom modell er organisasjonens
  standard.

```yaml
caseType:
  defaultAgentToolIds: [law_subagent, web_subagent]   # forskriften for ordningen og oppdatert informasjon
  defaultAgentModelId: null                           # organisasjonens standard
```
