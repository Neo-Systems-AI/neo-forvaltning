# Tilgang

Tilgangen i Neo har to deler. Rollen sier hva et medlem kan gjøre (lese saker, fordele, sette opp). Synligheten sier
hvilke saker hen ser, og settes på sakstypen med tilgangsgrupper. En sak er synlig for et medlem når minst én av disse
holder:

1. Sakstypen har ingen tilgangsgrupper.
2. Medlemmet er med i en av sakstypens tilgangsgrupper.
3. Medlemmet er sakens ansvarlige.

Regelen gjelder alle leseveier (saken, lister, søk, relasjoner, agenten, API-et) og alle roller, også org-admin.
Unntakene er en kjøring uten bruker, som ser hele org-en, og Innsikt, som leser alle hendelser
(`13-innsikt.md#innsikt-ser-alle-saker`).

Roller, tilgangsgrupper og koblingen til Entra er ikke konfig: de følger ikke en Løsning og settes i hver org. Reglene
under er derfor festet på sakstypen, den ansvarlige og leserne, som er det tilgangen virker på.

## Kortversjonen

Still spørsmålene i rekkefølge. Det første som svarer ja, avgjør.

| Spørsmålet | Ja betyr |
|---|---|
| Har sakene innhold bare noen skal se (personal, helse, varsling, egne ansatte)? | **Tilgangsgruppe** på sakstypen, satt i org-en etter utrullingen (`apen-som-standard`, `tilgangen-settes-i-org-en`) |
| Trenger to slags saker ulik tilgang? | **To sakstyper**, hver med sin gruppe (`tilgang-skiller-sakstyper`) |
| Skal én person utenfor gruppa behandle én sak? | Gjør hen **ansvarlig** for saken (`ansvarlig-ser-sin-sak`) |
| Kan noen være inhabil? | En **oppgave** om habiliteten tidlig i saksgangen (`inhabilitet-som-oppgave`) |
| Skal eksterne (et utvalg, en jury) vurdere? | **Avklar før oppsettet**: medlem og i gruppa, eller et produktgap (`eksterne-vurderere`) |
| Skal et eksternt system lese sakene gjennom API-et? | La sakstypen være **åpen**, eller la en flyt sende det systemet trenger (`maskinklienten-ser-bare-apne`) |
| Skal KI ikke brukes på noen av sakene? | En **KI-regel** (`18-org-niva.md#ki-bryter-eller-regel`) |
| Vil du bare rydde i lister? | **Visninger**, ingen begrensning (`12-visninger.md#visning-gir-ikke-tilgang`) |

## jobbroller-etter-jobben Gi rollene etter jobben personen gjør

```yaml
id: jobbroller-etter-jobben
klasse: valg
opphav: skrevet
```

- **Gjør:** Saksbehandleren får `caseworker`, lederen som fordeler og følger opp `manager`, den som setter opp
  sakstypene `process_designer`, den som setter opp flyter og integrasjoner `process_engineer`, arkivet
  `information_manager`. Den som følger opp etterlevelsen, får `compliance_officer`, og den som fører tilsyn med KI,
  `ai_oversight_officer`. Et medlem kan ha flere.
- **Ikke gjør:** Ikke gi `org_admin` for at noen skal se mer.
- **Hvorfor:** Rollene er faste og like i alle org-er. Lederen leser, fordeler og har Innsikt, men behandler ikke saker.
  Admin ser ikke flere saker enn andre.

## apen-som-standard La en sakstype være åpen til innholdet krever noe annet

```yaml
id: apen-som-standard
klasse: standard
gjelder: [caseType]
opphav: forslag
```

- **Gjør:** Begrens en sakstype med tilgangsgrupper når sakene har innhold bare noen skal se: personalsaker, helse,
  varsling, eller saker der mange i et lite fagmiljø kan være inhabile.
- **Ikke gjør:** Ikke begrens for å rydde i lister; det gjør visningene.
- **Hvorfor:** En begrenset sakstype skjuler sakene for alle utenfor gruppa, også lederen som fordeler og kollegaen som
  skal hjelpe, og hver begrensning må vedlikeholdes når folk kommer og går.

## tilgangen-settes-i-org-en En begrensning følger ikke Løsningen og må settes i org-en etter utrullingen

```yaml
id: tilgangen-settes-i-org-en
klasse: felle
gjelder: [caseType, solution]
krever: [14-tilgang.md#apen-som-standard]
opphav: skrevet
```

- **Gjør:** Skriv i oppsettet hvilke sakstyper som skal begrenses og hvem som skal i gruppa. Opprett gruppene og koble
  dem til sakstypen i org-en rett etter utrullingen, før de første sakene kommer inn.
- **Ikke gjør:** Ikke regn med at en begrensning i sandboxen eller malen blir med.
- **Hvorfor:** Tilgangsgruppene er ikke en del av sakstypen som kopieres. En sakstype som rulles ut, er åpen for alle med
  rollen til noen begrenser den.

## tilgang-skiller-sakstyper Når tilgangen skal være ulik, er det to sakstyper

```yaml
id: tilgang-skiller-sakstyper
klasse: valg
gjelder: [caseType, caseType.variantField]
krever: [01-sakstype.md#egen-sakstype-nar]
opphav: forslag
```

- **Gjør:** Trenger to slags saker ulik tilgang (tilskudd til bedrifter og til egne ansatte), gjør dem til to
  sakstyper, hver med sin gruppe.
- **Ikke gjør:** Ikke gjør det til en variant på én sakstype. Ikke del i sakstyper for tilgangens skyld når alle
  saksbehandlerne skal se alt.
- **Hvorfor:** Tilgangen henger bare på sakstypen, ikke på et felt eller en variant.

## gruppa-har-alle-som-ma-lese Gruppa har med alle som må lese sakene, også lederen og godkjenneren

```yaml
id: gruppa-har-alle-som-ma-lese
klasse: felle
gjelder: [caseType, caseType.taskTemplateSets]
krever: [14-tilgang.md#jobbroller-etter-jobben]
opphav: skrevet
```

- **Gjør:** Ta med saksbehandlerne, lederen som fordeler, alle som skal godkjenne eller kontrollere, og arkivet om det
  skal se sakene. Navngi gruppa etter sakstypen og jobben: «Tilskudd — saksbehandling og godkjenning».
- **Ikke gjør:** Ikke regn med at en rolle eller en oppgave gir tilgang. Ikke navngi gruppa etter personer.
- **Hvorfor:** Ingen rolle går forbi regelen, og en oppgave kan bare få en ansvarlig som ser saken. En godkjenner
  utenfor gruppa ser ikke saken hen skal godkjenne. Navnet er unikt i org-en og står når folk bytter avdeling.

## ansvarlig-ser-sin-sak Den ansvarlige ser saken, også utenfor gruppa, så lenge hen er ansvarlig

```yaml
id: ansvarlig-ser-sin-sak
klasse: felle
gjelder: [caseType]
opphav: skrevet
```

- **Gjør:** Bruk det når én person utenfor gruppa skal behandle én bestemt sak.
- **Ikke gjør:** Ikke gjør noen ansvarlig for å dele en sak til lesing.
- **Hvorfor:** Tilgangen forsvinner neste gang ansvaret flyttes, og saksbehandleren mister ansvaret imens. Det finnes
  ingen annen tilgang per sak.

## entra-er-kilden Hent rollene og gruppemedlemskapet fra Entra når org-en har «Kun SSO»

```yaml
id: entra-er-kilden
klasse: valg
krever: [14-tilgang.md#jobbroller-etter-jobben]
opphav: skrevet
```

- **Gjør:** Slå på «Kun SSO». Koble hver Entra-gruppe til jobbrollene og tilgangsgruppene den skal gi, med en etikett
  som sier hvem den er.
- **Ikke gjør:** Ikke gi de samme rollene og medlemskapene for hånd til folk som får dem fra Entra.
- **Hvorfor:** Koblingene virker bare mens «Kun SSO» er på. Uten SCIM slår en endring inn ved neste innlogging, også at
  noe tas bort. Det som også er gitt for hånd, blir stående når Entra tar det bort, og en gruppe en Entra-gruppe gir,
  kan ikke slettes. Neo leser ikke Entra-katalogen, så etiketten er gruppas eneste navn i Neo.

```yaml
idpGroup:
  externalGroupId: "<objekt-ID-en til gruppa i Entra>"
  label: Saksbehandlere tilskudd
  roleCodes: [caseworker]
  accessGroups: ["Tilskudd: saksbehandling og godkjenning"]
```

## flyter-ser-som-den-som-starter En kjøring uten bruker ser alle sakene; en kjøring et medlem starter, ser det medlemmet ser

```yaml
id: flyter-ser-som-den-som-starter
klasse: felle
gjelder: [workflow, caseType]
krever: [07-flyt.md#flyt-en-per-sakstype]
opphav: skrevet
```

- **Gjør:** Sett en betingelse på sakstypen i en flyt som startes av en hendelse, en webhook eller et skjema, så den
  bare rører sakene den gjelder. Regn med at en flyt et medlem starter (søket, en handling), finner det medlemmet ser.
- **Ikke gjør:** Ikke bruk en begrensning på sakstypen for å holde en flyt unna sakene.
- **Hvorfor:** Org-automasjonen ser hele org-en; begrensningen gjelder mennesker. En kjøring for et medlem leser som
  medlemmet, så en sak utenfor gruppa finnes ikke for den.

## maskinklienten-ser-bare-apne Et system som leser gjennom API-et, ser bare sakstyper uten begrensning

```yaml
id: maskinklienten-ser-bare-apne
klasse: felle
gjelder: [caseType]
krever: [14-tilgang.md#apen-som-standard]
opphav: skrevet
```

- **Gjør:** Avklar før en sakstype begrenses om et eksternt system skal lese sakene gjennom API-et. Skal det, la heller
  en flyt sende det systemet trenger.
- **Ikke gjør:** Ikke begrens en sakstype et system leser med en klient uten medlem.
- **Hvorfor:** En klient uten medlem har ingen gruppe og ikke noe ansvar å matche på, og ser bare ubegrensede
  sakstyper.

## inhabilitet-som-oppgave Habiliteten vurderes i saken, og den inhabile tar ikke saken

```yaml
id: inhabilitet-som-oppgave
klasse: valg
gjelder: [caseType.taskTemplateSets]
krever: [06-oppgaver.md#oppgave-steg, 08-instrukser.md#instruks-arbeidsdeling]
opphav: forslag
```

- **Gjør:** Legg en oppgave tidlig i saksgangen: «Vurder habiliteten din i saken», med beskrivelsen av hva som gjør
  den ferdig. Er noen inhabil, flytter lederen ansvaret og oppgavene. Behandlingsregelen sier at agenten melder tegn på
  tilknytning og ikke vurderer dem. Har saken flere som vurderer (et utvalg, en runde), får hver sin oppgave.
- **Ikke gjør:** Ikke lag en sakstype eller gruppe per sak for å stenge én person ute. Ikke lov at Neo skjuler én sak
  for én person. Ikke før vurderingen i tillegg i saksdata.
- **Hvorfor:** Neo har ingen tilgang per sak ut over den ansvarlige. Loven krever at den inhabile ikke tilrettelegger
  eller avgjør saken, ikke at hen ikke ser den. Oppgaven er beviset på at vurderingen er gjort, og den kan ikke hoppes
  over.

```yaml
taskTemplate:
  title: Vurder habiliteten din i saken
  description: >
    Sjekk om du har tilknytning til søkeren eller prosjektet (fvl. § 6). Ferdig når du har sagt fra til lederen
    om du er inhabil, eller krysset av for at du ikke er det.
  caseStatusOptionLabel: Mottatt
  dueOffsetDays: 2
```

## eksterne-vurderere Eksterne fagvurderere trenger en løsning som avklares før oppsettet

```yaml
id: eksterne-vurderere
klasse: valg
gjelder: [caseType]
krever: [14-tilgang.md#ansvarlig-ser-sin-sak]
opphav: forslag
```

- **Gjør:** Avklar om eksterne (et fagutvalg, en jury) skal inn i Neo. Skal de det, må de være medlemmer med en rolle
  som kan lese saker, og med i sakstypens gruppe.
- **Ikke gjør:** Ikke gjør dem ansvarlige for saken for at de skal kunne lese den.
- **Hvorfor:** I gruppa ser de alle sakene av typen. Er det ikke godt nok fordi de bare skal se sine egne, er det et
  produktgap og skal sies.
