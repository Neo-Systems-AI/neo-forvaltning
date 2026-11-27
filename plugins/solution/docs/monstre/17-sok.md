# Søk

Et søk i «Søk» (`organizationSearch`) er et navn, en plass i lista og en flyt. Flyten starter med utløseren «Søk»
(`SearchRequested`), søker i en kilde (sakene med «Søk i saker», arkivet, et register) og gir treffene tilbake med
«Returner søketreff». Det er én mekanisme for alle søk, og org-en bestemmer hvilke som finnes. Neo leverer to: «Saker» i
katalogløsningen «Grunnoppsett for saksbehandling» og «Arkiv» i katalogløsningen «Documaster». Begge tas i bruk i Neo
(steg i Neo). Et eget søk er ikke en fil: flyten står i `oppsett/workflows/`, og søket settes opp i Neo.

Søket er for å finne én ting. «Søk i saker» leser tittel, saksnummer, status og saksfeltene, ikke saksdata,
dokumenter eller relasjoner. En kø folk går tilbake til, er en lagret visning.

## Kortversjonen

| Spørsmålet | Ja betyr |
|---|---|
| Dekker «Saker» eller «Arkiv» behovet? | **Ta i bruk standardsøket** (`sok-ta-i-bruk-standarden`) |
| Er det en kø eller et utvalg folk går tilbake til? | En **lagret visning**, ikke et søk (`sok-ikke-for-ko`) |
| Skal saken finnes på noe (navn, organisasjonsnummer, referanse)? | Det må stå i **tittelen eller et saksfelt** (`sok-finner-pa-saksfelt`) |
| Skal søket bare gi én sakstype? | **`caseTypeId`** i noden (`sok-en-sakstype`) |
| Har kilden felt å søke i ut over fritekst? | **Søkefelt** på utløseren, og en bane per måte å søke på (`sok-felt-bare-det-kilden-kan`, `sok-en-bane-per-sporsmal`) |
| Skal søket gi noen tilgang de ikke har? | **Nei.** Søket ser som den som søker (`sok-ser-som-medlemmet`) |

## sok-ta-i-bruk-standarden Ta i bruk standardsøkene før du lager egne

```yaml
id: sok-ta-i-bruk-standarden
klasse: standard
gjelder: [organizationSearch, solution]
krever: [00-navn-pakking-og-versjoner.md#endringer-i-neo-tas-inn]
opphav: skrevet
```

- **Gjør:** Ta i bruk «Saker» med katalogløsningen «Grunnoppsett for saksbehandling» og «Arkiv» med katalogløsningen
  «Documaster», i sandkassen (`00-navn-pakking-og-versjoner.md#endringer-i-neo-tas-inn`). Lag et eget søk bare for en kilde eller et utvalg de ikke dekker.
- **Ikke gjør:** Ikke lag en kopi av «Søk i saker» for å endre gruppenavnet.
- **Hvorfor:** Standardsøkene er vedlikeholdt av Neo, og en ny versjon kan tas inn på samme vei som resten av
  katalogløsningen. En kopi har ingen versjon å ta inn.

## sok-ikke-for-ko Søk er for å finne én ting; en liste du går tilbake til, er en lagret visning

```yaml
id: sok-ikke-for-ko
klasse: valg
gjelder: [organizationSearch, savedView]
krever: [12-visninger.md#visning-er-en-jobb]
opphav: forslag
```

- **Gjør:** Lag en lagret visning for en kø eller et utvalg folk bruker hver dag.
- **Ikke gjør:** Ikke lag et søk for «alle saker til vurdering».
- **Hvorfor:** Et søk starter en flyt hver gang og gir treff, ikke en liste med kolonner, sortering og filtre.

## sok-finner-pa-saksfelt Det saken skal finnes på, må stå i tittelen eller et saksfelt

```yaml
id: sok-finner-pa-saksfelt
klasse: felle
gjelder: [SokSaker]
krever: [05-felt-og-saksdata.md#et-felt-har-en-leser]
opphav: skrevet
```

- **Gjør:** Finn ut hva folk søker på (søkerens navn, organisasjonsnummer, gårds- og bruksnummer, ekstern referanse), og
  sørg for at det står i tittelen eller i et saksfelt satt av flyten.
- **Ikke gjør:** Ikke regn med at noe i saksdata, i et dokument eller på en relatert sak gir treff.
- **Hvorfor:** «Søk i saker» leser tittel, saksnummer, status og alle saksfeltene, med etiketten på valgene. Å finne
  saken på er en av jobbene som gjør noe til et saksfelt.

## sok-navn-er-kilden Søket heter det medlemmet søker i, og flyten heter det den gjør

```yaml
id: sok-navn-er-kilden
klasse: valg
gjelder: [organizationSearch.name, workflow.name]
krever: [00-navn-pakking-og-versjoner.md#navn-er-nokkelen]
opphav: praksis
```

- **Gjør:** Gi søket et kort navn på det som søkes i («Saker», «Arkiv», «Tilskuddssaker»), og flyten et navn som starter
  med «Søk i» («Søk i saker»).
- **Ikke gjør:** Ikke gi søket flytens navn, og ikke systemnavnet når medlemmene sier noe annet.
- **Hvorfor:** Søkeflaten viser «Søk i» og så søkets navn. Flyten skal skilles fra de andre i lista over flyter.

## sok-flyten-ma-vaere-aktiv Søket virker først når flyten bak er aktiv

```yaml
id: sok-flyten-ma-vaere-aktiv
klasse: felle
gjelder: [organizationSearch.workflowId, workflow]
krever: [00-navn-pakking-og-versjoner.md#flyter-lander-som-utkast]
opphav: skrevet
```

- **Gjør:** Aktiver flyten i Neo når den er gjennomført og promotert, eller når katalogløsningen er tatt i bruk (steg i
  Neo).
- **Ikke gjør:** Ikke meld fra om et nytt søk før flyten er slått på.
- **Hvorfor:** Flyten lander som utkast. Søket står i «Søk» med en gang, men som utilgjengelig til flyten er aktiv.

## sok-plassen-er-organisasjonens Plassen og bryteren i malen er bare utgangspunktet

```yaml
id: sok-plassen-er-organisasjonens
klasse: standard
gjelder: [organizationSearch.position, organizationSearch.enabled]
opphav: skrevet
```

- **Gjør:** Sett `position` så søkene fra ulike løsninger ikke kolliderer, og la `enabled` stå på. La org-ens
  administrator flytte, gi nytt navn og slå av.
- **Ikke gjør:** Ikke prøv å endre rekkefølgen i produksjonen med en ny promotering.
- **Hvorfor:** Et nytt søk får plassen og bryteren fra sandkassen ved promoteringen; et søk som alt finnes i
  produksjonen, er administratorens.

## sok-ser-som-medlemmet Søket viser bare det den som søker, kan se

```yaml
id: sok-ser-som-medlemmet
klasse: standard
gjelder: [SokSaker]
krever: [14-tilgang.md#flyter-ser-som-den-som-starter]
opphav: skrevet
```

- **Gjør:** Stol på at «Søk i saker» søker med den som søker som leser, og at arkivsøket bruker brukerens egne
  rettigheter i arkivet.
- **Ikke gjør:** Ikke lag et søk for å gi noen tilgang til saker de ikke ser i lista.
- **Hvorfor:** Søket er en vei til det du alt kan se, ikke rundt det.

## sok-felt-bare-det-kilden-kan Erklær bare søkefelt kilden kan søke på

```yaml
id: sok-felt-bare-det-kilden-kan
klasse: valg
gjelder: [SearchRequested.felter, SearchRequested.fritekstMinLengde]
opphav: praksis
```

- **Gjør:** Legg til et søkefelt når kilden har et felt å søke i (saksnummer og klasse i arkivet). Sett
  `fritekstMinLengde` når kilden krever et minimum. For sakene: ingen felt.
- **Ikke gjør:** Ikke erklær et felt flyten ikke bruker, og ikke fritekst; den finnes alltid.
- **Hvorfor:** Søkeflaten viser feltene utløseren erklærer. Et felt uten virkning gir et søk som ser ut til å virke. Et
  minimum avviser et for kort søk før kilden feiler.

```yaml
felter:
  - { key: saksnummer, label: Saksnummer, type: text }
  - { key: klasse,     label: Klasse,     type: text }
fritekstMinLengde: 2
```

## sok-en-bane-per-sporsmal Søk i parallelle baner når kilden krever at alle feltene treffer

```yaml
id: sok-en-bane-per-sporsmal
klasse: felle
gjelder: [SearchRequested, DocumasterSok, ReturnSearchHits]
krever: [07-flyt.md#flyt-en-node-en-effekt]
opphav: praksis
```

- **Gjør:** Gi hver måte å søke på sin egen bane i en parallell, med en betingelse først som sjekker at banens felt er
  fylt ut, og «nei» rett til slutten av banen. Gi hver bane sin «Returner søketreff».
- **Ikke gjør:** Ikke send fritekst og felt i samme kall når kilden krever at alle treffer, og ikke la en bane søke med
  tomme felt.
- **Hvorfor:** Et kall med begge gir bare det som treffer begge. En bane som søker med tomme felt, feiler, og da feiler
  hele søket.

## sok-standardavbildningen Bruk kildens standardavbildning, og overstyr bare gruppen

```yaml
id: sok-standardavbildningen
klasse: standard
gjelder: [ReturnSearchHits.felt, ReturnSearchHits.highlights, ReturnSearchHits.liste]
opphav: skrevet
```

- **Gjør:** La «Returner søketreff» bruke standarden for kilden. Sett gruppen (det treffene står under) og bare feltene
  som skal vises annerledes.
- **Ikke gjør:** Ikke skriv ut hele avbildningen for en kilde som har standard.
- **Hvorfor:** Noden lagrer bare det du overstyrer. Rettes standarden, får søket rettelsen.

## sok-ingen-skjulte-tak Gi antallet, språket og «flere treff» videre fra søket

```yaml
id: sok-ingen-skjulte-tak
klasse: felle
gjelder: [SokSaker.limit, SokSaker.sprak, SokSaker.tekst, ReturnSearchHits.flere]
opphav: skrevet
```

- **Gjør:** Pek `tekst` på `{{sok:tekst}}`, `limit` på `{{sok:limit}}` og `sprak` på `{{sok:sprak}}`, og bær `flere`
  videre i returen.
- **Ikke gjør:** Ikke sett et fast lavt antall.
- **Hvorfor:** Da kan «Søk» tilby «Vis flere» og si fra når lista ikke er alle treffene. Språket gjør at datoer, tall og
  valg vises på brukerens språk. Et søk gir høyst 50 treff per side.

## sok-en-sakstype Et søk i én sakstype peker på sakstypen i noden

```yaml
id: sok-en-sakstype
klasse: valg
gjelder: [SokSaker.caseTypeId]
krever: [07-flyt.md#flyt-identitet-er-id]
opphav: skrevet
```

- **Gjør:** Sett `caseTypeId` når søket bare skal gi saker av én type, og navngi søket etter den. La feltet stå tomt for
  alle sakstyper.
- **Ikke gjør:** Ikke filtrer treffene etter søket i flyten. Ikke pek feltet på en variabel som kan være tom.
- **Hvorfor:** Noden søker da bare i sakstypen, og antallet stemmer. Sakstypen står med navnet i fila
  (`ref:caseType:<slug>`) og skrives om ved promoteringen. En variabel som gir ingen sakstype, stopper steget i stedet for
  å søke i alt.
