# Dokumenter under arbeid

Et saksdokument skrives ofte av flere: agenten lager utkastet, saksbehandleren skriver vurderingen, og en leder
godkjenner. To statuser holder orden på det. Dokumentstatusen (`artifactStatusGroup`) gjelder hele dokumentet og sier
hvor det er i løpet: under arbeid, til behandling eller ferdig. Blokkstatusen (`blockStatusGroup`) gjelder ett avsnitt,
én overskrift eller én liste, og sier hva som er sjekket.

Standardsettene hver organisasjon får:

| Dokumentstatus | Kategori (`groupType`) | Låst |
|---|---|---|
| Utkast, Klar | `IN_PROGRESS` | nei |
| Til godkjenning | `IN_REVIEW` | ja |
| Godkjent, Publisert, Arkivert | `DONE` | nei |

| Blokkstatus | Mål (`isTarget`) | Låst | Sjekkpunkt |
|---|---|---|---|
| Utkast | nei | nei | nei |
| Klar til gjennomgang | nei | ja | nei |
| Godkjent | ja | ja | ja |

Farge og rekkefølge (`color`, `sortOrder`) på statusene er Neos standard og trenger ingen regel.

## Kortversjonen

| Spørsmålet | Ja betyr |
|---|---|
| Trenger dokumentet flere trinn enn standardsettet? | **Nye statuser** innenfor de tre kategoriene (`dokumentstatus-tre-kategorier`) |
| Leser noen andre dokumentet i en status? | **Lås** den statusen (`las-mens-noen-vurderer`) |
| Skal det som ble godkjent, kunne vises senere? | La flyten **fryse en versjon** ved godkjenningen (`godkjent-fryses-som-versjon`) |
| Flytter en handling dokumentet videre? | **Handlingen setter statusen** (`dokumentstatus-settes-av-handlingen`) |
| Sender en flyt dokumentet ut? | **Sjekk kategorien** `DONE` først (`send-bare-ferdig`) |
| Skriver flere i samme dokument? | En **ansvarlig per blokk** (`ansvarlig-per-blokk`) |
| Skal en del av teksten sjekkes for seg? | **Avsnitt eller liste**, ikke tabell (`avsnitt-ikke-tabell-for-det-som-verifiseres`) |

## dokumentstatus-tre-kategorier Bruk standardsettet, og legg til statuser bare innenfor de tre kategoriene

```yaml
id: dokumentstatus-tre-kategorier
klasse: valg
gjelder: [artifactStatusGroup, artifactStatusGroup.groupType, artifactStatusGroup.options.label]
krever: [02-status.md#stabile-statusnavn]
opphav: praksis
```

- **Gjør:** Start med standardsettet. Trenger kunden flere trinn, legg dem inn som nye statuser i riktig kategori
  («Til juridisk vurdering» under Til behandling).
- **Ikke gjør:** Ikke lag en status som blander kategorier («Godkjent med merknader» under Under arbeid). Ikke bruk
  dokumentstatusen for sakens løp.
- **Hvorfor:** Flytene og visningene leser kategorien, ikke navnet. «Hent dokument» gir `statusKategori`, og
  standardvisningen av dokumentene filtrerer på den.

## las-mens-noen-vurderer Statusen som betyr at noen andre vurderer dokumentet, er låst

```yaml
id: las-mens-noen-vurderer
klasse: valg
gjelder: [artifactStatusGroup.options.locked]
krever: [07-flyt.md#flyt-handling-pa-objektet, 07-flyt.md#flyt-valg-med-skjema]
opphav: praksis
```

- **Gjør:** Sett `locked` på statusene der en godkjenner eller en kollega leser dokumentet. Retur er en statusendring
  tilbake til «Utkast».
- **Ikke gjør:** Ikke lås en status saksbehandleren skal skrive i. Ikke lag en egen «lås»-handling ved siden av statusen.
- **Hvorfor:** Den som godkjenner, skal vurdere det som står der når hen leser. Mens statusen er låst, kan verken
  mennesker, flyter eller KI endre innholdet, navnet, dokumentfeltene, blokkstatusene eller den ansvarlige, og heller
  ikke en administrator. Kommentarer er lov, og statusen kan alltid endres.

```yaml
artifactStatusGroup:
  - label: "Til behandling"
    groupType: IN_REVIEW
    options:
      - { label: "Til godkjenning",        locked: true }
      - { label: "Til juridisk vurdering", locked: true }
```

## godkjent-fryses-som-versjon Det som er godkjent, fryses som versjon; «Godkjent» låses bare med vilje

```yaml
id: godkjent-fryses-som-versjon
klasse: valg
gjelder: [artifactStatusGroup.options.locked, CreateDocumentVersion, SetDocumentStatus]
krever: [09-maler.md#mal-fryses-ved-utsending]
opphav: forslag
```

- **Gjør:** La godkjenningsflyten sette «Godkjent» og fryse en ny dokumentversjon. Lås «Godkjent» bare når dokumentet
  ikke skal kunne rettes etter godkjenningen uten at statusen først endres tilbake.
- **Ikke gjør:** Ikke bruk låsen som eneste spor av hva som ble godkjent.
- **Hvorfor:** Versjonen viser hva som ble godkjent, også om noen redigerer etterpå, og PDF-en kan lages av den. En
  versjon kan fryses også når statusen er låst. I standardsettet er «Godkjent» ikke låst.

## dokumentstatus-settes-av-handlingen Dokumentstatusen settes av handlingen som flytter dokumentet

```yaml
id: dokumentstatus-settes-av-handlingen
klasse: valg
gjelder: [SetDocumentStatus, SetDocumentStatus.statusOptionId, ObjectAction]
krever: [07-flyt.md#flyt-identitet-er-id, 07-flyt.md#flyt-handling-pa-objektet]
opphav: skrevet
```

- **Gjør:** La handlingen på dokumentet («Send til godkjenning») sette statusen med «Sett dokumentstatus», i samme flyt
  som lager oppgaven til godkjenneren.
- **Ikke gjør:** Ikke be saksbehandleren først sette statusen og så starte handlingen.
- **Hvorfor:** Statusen og det som skjer (godkjennerens oppgave, versjonen) skal følges ad. Noden peker på statusen med
  navnet i fila (`ref:artifactStatus:<gruppe>/<etikett>`), og id-en skrives om ved promoteringen; finnes den ikke,
  stopper kjøringen.

## send-bare-ferdig Flyten som sender et dokument ut, sjekker at det står i kategorien Ferdig

```yaml
id: send-bare-ferdig
klasse: felle
gjelder: [HentDokument, Condition, Stopp]
krever: [11-integrasjoner.md#vedtaket-fra-dokumentet, 07-flyt.md#flyt-stopp-med-melding]
opphav: forslag
```

- **Gjør:** Les dokumentet med «Hent dokument» og stopp med en melding når `statusKategori` ikke er `DONE`.
- **Ikke gjør:** Ikke send et vedtak som står som utkast fordi handlingen fantes på dokumentet. Ikke stol på at alle
  blokkene er godkjent.
- **Hvorfor:** Godkjenningen er dokumentstatusen. Blokkstatusene stopper ingenting: «X av Y verifisert» er et signal,
  ikke en sperre.

## blokkstatus-standardsettet Bruk de tre blokkstatusene som de er

```yaml
id: blokkstatus-standardsettet
klasse: standard
gjelder: [blockStatusGroup, blockStatusGroup.isTarget, blockStatusGroup.options.label, blockStatusGroup.options.locked]
opphav: praksis
```

- **Gjør:** Bruk «Utkast», «Klar til gjennomgang» og «Godkjent» med låsen, målet og sjekkpunktet slik standarden har dem.
- **Ikke gjør:** Ikke gi blokkstatusene kundens egne navn. Ikke lag flere mål-grupper.
- **Hvorfor:** Navnene er Neos faste ord, like hos alle kunder. Bare «Godkjent» teller mot «X av Y verifisert», så et
  avsnitt som bare er klart, ikke ser ferdig ut.

## las-det-som-er-sjekket Lås et avsnitt når det er sjekket, så agenten foreslår i stedet for å skrive over

```yaml
id: las-det-som-er-sjekket
klasse: valg
gjelder: [blockStatusGroup.options.locked]
krever: [08-instrukser.md#instruks-ki-tre-former, 09-maler.md#mal-utkast-med-neo]
opphav: skrevet
```

- **Gjør:** Sett «Klar til gjennomgang» eller «Godkjent» på det du har sjekket mot kilden, og skriv i grunnlaget hva du
  sjekket det mot («Kontrollert mot søknaden og regnskapet for 2025»).
- **Ikke gjør:** Ikke lås et avsnitt du ikke har lest. Ikke la et vedtak med agentens tekst stå uten status.
- **Hvorfor:** Agenten kan ikke erstatte innholdet i et dokument med låste blokker, og forslagene dens kan ikke ligge i
  en låst blokk. Editoren krever grunnlaget ved overgangen til en låst status. En status som settes utenom editoren,
  kan mangle grunnlaget.

## sjekkpunkt-bare-pa-godkjent Bare statusen som betyr godkjent, er et sjekkpunkt

```yaml
id: sjekkpunkt-bare-pa-godkjent
klasse: felle
gjelder: [blockStatusGroup.options.isCheckpoint]
krever: [07-flyt.md#flyt-hendelsen-gir-id]
opphav: skrevet
```

- **Gjør:** La `isCheckpoint` stå på «Godkjent».
- **Ikke gjør:** Ikke sett sjekkpunkt på «Utkast» eller «Klar til gjennomgang».
- **Hvorfor:** Hver overgang til et sjekkpunkt fryser en ny dokumentversjon og gir hendelsen `document.updated`. Et
  sjekkpunkt på en status som brukes ofte, gir mange versjoner og starter flyter som lytter på hendelsen.

## ansvarlig-per-blokk Sett en ansvarlig på blokkene når flere skriver i samme dokument

```yaml
id: ansvarlig-per-blokk
klasse: valg
gjelder: [blockStatusGroup]
krever: [14-tilgang.md#jobbroller-etter-jobben]
opphav: forslag
```

- **Gjør:** Gi hver del en ansvarlig når flere skriver: fagvurderingen til den som har faget, økonomien til økonomien.
- **Ikke gjør:** Ikke sett ansvarlig på hvert avsnitt i et dokument én person skriver.
- **Hvorfor:** En låst blokk kan bare endres av den som satte statusen, den ansvarlige og en administrator. Uten
  ansvarlig må den som låste, låse opp for alle andre.

## avsnitt-ikke-tabell-for-det-som-verifiseres Det som skal verifiseres, skrives som avsnitt eller liste

```yaml
id: avsnitt-ikke-tabell-for-det-som-verifiseres
klasse: felle
gjelder: [blockStatusGroup, documentTemplate.content]
krever: [09-maler.md#mal-ingen-lister]
opphav: forslag
```

- **Gjør:** Skriv en vurdering som skal få status, som avsnitt, overskrifter eller lister. Del lange vurderinger i
  avsnitt per vilkår eller kriterium, så hvert kan sjekkes for seg. Bygg malen slik.
- **Ikke gjør:** Ikke legg en vurdering som skal godkjennes, i en tabell.
- **Hvorfor:** Bare avsnitt, overskrifter, punktlister, nummererte lister og sitater kan ha blokkstatus. En tabell telles
  ikke og kan ikke låses.

```markdown
## Begrunnelse

### Kriterium 1: Samfunnsnytte

_Skriv vurderingen av dette kriteriet i ett avsnitt. Det får sin egen status._
```

## blokkstatus-i-malen En blokkstatus i malen gjelder malen; låsen følger ikke med til dokumentet

```yaml
id: blokkstatus-i-malen
klasse: felle
gjelder: [blockStatusGroup, documentTemplate, OpprettSaksdokument]
opphav: forslag
```

- **Gjør:** Bruk blokkstatus i maleditoren når en mal skrives om og noen skal godkjenne teksten før den publiseres.
- **Ikke gjør:** Ikke regn med at en status i malen gjelder i dokumentet som lages fra den.
- **Hvorfor:** Innholdet kopieres fra malen, men opphavet til låsen (hvem som låste, og innholdet da) gjør det ikke. Et
  nytt dokument er ikke sjekket av noen i denne saken.
