# Organisasjonsnivået

Noen innstillinger gjelder hele organisasjonen og følger ikke en sakstype eller en Løsning: KI-reglene for hele
organisasjonen, modellpolicyen og modellvalget, menyen og grensen for flytkjøringer. De er ikke konfig og settes i hver
organisasjon for seg. Reglene er festet på det de virker på: agenten, sakstypens KI-regler og modell, dokumentene og
flytene. Oppsettet skriver ned hva som skal settes på organisasjonsnivå, og hvorfor, så det kan gjøres etter
utrullingen.

Hjemmelskatalogen og partnerens ressursmaler hører ikke til oppsettet. Kunden setter dem ikke.

## Kortversjonen

| Spørsmålet | Ja betyr |
|---|---|
| Skal en KI-funksjon være av for hele organisasjonen? | **Bryteren** på KI-siden (`ki-bryter-eller-regel`) |
| Skal den være av for noen saker, og følger det av sakstypens innhold? | En **regel på sakstypen**, som følger Løsningen (`ki-regel-pa-sakstypen-nar-den-folger-sakstypen`) |
| Går det på tvers av sakstyper, eller gjelder det en ansvarlig? | En **regel på organisasjonen** (`ki-bryter-eller-regel`) |
| Har organisasjonen krav til hvor dataene behandles? | **Modellpolicyen** før modellvalget (`modellpolicy-for-modellvalget`) |
| Trenger sakstypen en annen modell enn standarden? | **`defaultAgentModelId`** med en grunn; ellers tom (`modell-arves-fra-organisasjonen`) |
| Skal et dokument skjermes? | En av **de fire skjermingshjemlene** (`skjermingshjemlene-er-faste`) |
| Starter mange flytkjøringer samtidig? | **Si fra til Neo** (`grensen-for-flytkjoringer`) |

## ki-bryter-eller-regel Slå av en KI-funksjon med bryteren; bruk en regel når det gjelder en gruppe saker

```yaml
id: ki-bryter-eller-regel
klasse: valg
gjelder: [caseType.aiCapabilityRules, caseType.aiCapabilityRules.disabledCapabilities, caseType.aiCapabilityRules.disabledToolIds]
opphav: skrevet
```

- **Gjør:** Slå av funksjonen på KI-siden når organisasjonen ikke skal bruke den. Lag en regel når den skal være av for
  noen saker: en sakstype, saker med en bestemt ansvarlig, eller saker med et felt eller en status. Gi regelen et navn
  som sier hvorfor.
- **Ikke gjør:** Ikke lag en regel uten betingelser når du mener bryteren.
- **Hvorfor:** Bryteren gjør at funksjonen oppfører seg som om planen ikke har den. En regel virker som bryteren, men
  bare for sakene den treffer. Ingen av dem kan slå på noe som er av.

## ki-regel-pa-sakstypen-nar-den-folger-sakstypen Legg regelen på sakstypen når den følger av sakstypens innhold

```yaml
id: ki-regel-pa-sakstypen-nar-den-folger-sakstypen
klasse: valg
gjelder: [caseType.aiCapabilityRules, caseType.aiCapabilityRules.conditions]
krever: [08-instrukser.md#instruks-ki-regel]
opphav: skrevet
```

- **Gjør:** Legg en regel som følger av sakstypens innhold (skjermede søknader uten nettsøk) på sakstypen, så den
  følger Løsningen. Bruk organisasjonens regel for det som går på tvers, eller som trenger en ansvarlig.
- **Ikke gjør:** Ikke legg en regel som skal følge en Løsning til alle kunder, på organisasjonsnivå. Ikke bruk sakstype
  eller ansvarlig i en betingelse på sakstypen.
- **Hvorfor:** Sakstypens regler er konfig og følger sakstypen ved utrulling og kopi. Organisasjonens regler må settes
  i hver organisasjon. Sakstypen er gitt i en sakstyperegel, og et medlem finnes ikke i en annen org.

```yaml
aiCapabilityRules:
  - name: "Skjermede søknader: ingen nettsøk"
    disabledCapabilities: []
    disabledToolIds: [web_subagent]
    conditions:
      - { id: "customField:skjermet", operator: eq, value: true, variant: boolean }
```

## ki-regel-uten-betingelse-gjelder-overalt En organisasjonsregel uten betingelser gjelder også utenfor saken

```yaml
id: ki-regel-uten-betingelse-gjelder-overalt
klasse: felle
gjelder: [caseType.aiCapabilityRules.conditions]
opphav: skrevet
```

- **Gjør:** Bruk en organisasjonsregel uten betingelser bare når funksjonen skal være av i Samtaler, innboksen og Tabell
  også.
- **Ikke gjør:** Ikke bruk «meg» i en betingelse; den avvises.
- **Hvorfor:** Utenfor en sak gjelder bare organisasjonens regler uten betingelser. En regel med betingelser gjelder
  bare i saker.

## ki-regel-ved-sletting Rett KI-reglene før du sletter et felt, en status, en sakstype eller et medlem de bruker

```yaml
id: ki-regel-ved-sletting
klasse: felle
gjelder: [caseType.aiCapabilityRules.conditions]
krever: [02-status.md#stabile-statusnavn]
opphav: skrevet
```

- **Gjør:** Se etter regler som bruker det du sletter, og rett dem først.
- **Ikke gjør:** Ikke la en regel stå med en betingelse som peker på noe som ikke finnes.
- **Hvorfor:** En betingelse som ikke kan leses, regnes som truffet, så funksjonen er av. Regelen vises som ødelagt,
  men saksbehandlerne ser bare at KI-funksjonen er borte.

## modellpolicy-for-modellvalget Sett modellpolicyen etter organisasjonens vurdering før dere velger modeller

```yaml
id: modellpolicy-for-modellvalget
klasse: valg
opphav: forslag
```

- **Gjør:** Sett policyen etter det personvern- og risikovurderingen krever: hvor dataene kan behandles, hvilke
  leverandørland som er utelukket, og om leverandøren må la være å lagre data og være EU-adekvat. Velg så de tillatte
  modellene, standardmodellen og en modell per kategori der standarden ikke passer.
- **Ikke gjør:** Ikke bruk lista over tillatte modeller til å uttrykke et krav om hvor dataene behandles. Ikke slå på et
  krav uten å se hvilke modeller det utelukker.
- **Hvorfor:** Policyen er et vern over lista og gjelder også modeller som kommer senere. En modell som mangler
  opplysningen policyen spør om, utelukkes.

## modell-arves-fra-organisasjonen La sakstypen arve modellen

```yaml
id: modell-arves-fra-organisasjonen
klasse: standard
gjelder: [caseType.defaultAgentModelId]
krever: [18-org-niva.md#modellpolicy-for-modellvalget]
opphav: skrevet
```

- **Gjør:** La `defaultAgentModelId` stå tom. Sett den bare når sakstypen trenger en annen modell enn organisasjonens
  standard, og skriv hvorfor.
- **Ikke gjør:** Ikke sett en modell organisasjonen ikke tillater.
- **Hvorfor:** Modellen velges i lag (det saken ber om, overstyringen per agent, kategorien, standarden), innenfor det
  organisasjonen tillater. Sakstypens modell kopieres inn på saken når den opprettes, så en endring gjelder bare nye
  saker, og en modell utenfor settet avvises når sakstypen lagres.

## skjermingshjemlene-er-faste Skjermingen i dokumentene tilbyr bare fire hjemler

```yaml
id: skjermingshjemlene-er-faste
klasse: felle
krever: [11-integrasjoner.md#offentlig-tittel-uten-navn]
opphav: skrevet
```

- **Gjør:** Skjerm med offentleglova § 13 eller forvaltningsloven § 13 (hele paragrafen, første ledd nr. 1 eller nr. 2),
  og skriv begrunnelsen i skjermingen.
- **Ikke gjør:** Ikke regn med at en annen skjermingshjemmel kan velges.
- **Hvorfor:** Velgeren viser bare disse fire, med organisasjonens titler der den har endret dem. En ukjent hjemmel
  avvises, og ingenting lagres.

## menyen-etter-jobbene Ordne menyen etter det folk bruker, og flytt resten til «Mer»

```yaml
id: menyen-etter-jobbene
klasse: valg
krever: [14-tilgang.md#jobbroller-etter-jobben]
opphav: forslag
```

- **Gjør:** Ordne valgene i hver seksjon etter hvor ofte de brukes, og flytt det organisasjonen ikke bruker ennå til
  «Mer».
- **Ikke gjør:** Ikke flytt et valg til «Mer» for å stenge noen ute. Ikke regn med å kunne flytte et valg til en annen
  seksjon.
- **Hvorfor:** Menyen styrer bare hvor valgene står; tilgangen følger rollene. Organisasjonen kan bytte rekkefølge
  innenfor en seksjon og flytte til «Mer», ikke mer.

## grensen-for-flytkjoringer Si fra til Neo før mange flytkjøringer starter samtidig

```yaml
id: grensen-for-flytkjoringer
klasse: valg
gjelder: [workflow]
krever: [07-flyt.md#flyt-vent-og-sjekk, 07-flyt.md#flyt-flomvern]
opphav: forslag
```

- **Gjør:** Ventes mange kjøringer på en gang (en søknadsfrist, en masseutsending), be Neo om en egen grense og si
  hvorfor. La en flyt som venter på et svar eller en tid, vente med et skjema eller «Vent».
- **Ikke gjør:** Ikke la en flyt sjekke et annet system i en løkke uten «Vent» mellom forsøkene.
- **Hvorfor:** Grensen gjelder kjøringer som starter eller kjører; en kjøring som venter, holder ingen plass.
  Organisasjonen kan ikke sette grensen selv. Om kjøringer over grensen står i kø i alle tilfeller, er ikke sjekket.
