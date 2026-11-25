# Oppgavemaler

Oppgavemalen (`taskTemplateSet`) er saksgangen: hva saksbehandleren skal gjøre, sjekke og hvor. Den settes inn i
sakstypen, og oppgavene blir til på hver ny sak, eller når en flyt lager dem. Behandlingsregelen er noe man leser;
oppgavemalen er noe man gjør. Oppgavestatusene (`taskStatusGroup`) er felles for organisasjonen.

Oppgaven er Neos eget spor av arbeidet: den står i historikken, i nøkkeltallene og i Oppgaver, og trenger ikke et felt
eller en saksdata ved siden av seg ([grunnreglene](grunnregler.md), «Neo registrerer selv»).

## Når oppgaven blir til

Still spørsmålene i rekkefølge. Det første som svarer ja, avgjør.

| # | Spørsmålet | Ja betyr |
|---|---|---|
| 1 | Er det en dato saken skal nå, ikke et arbeid? | En **milepæl** (`oppgave-milepael`) |
| 2 | Står det en forespørsel ute som saken venter svar på? | En **venteoppgave** som flyten lager når forespørselen sendes (`oppgave-venter`) |
| 3 | Gir vedtaket oppfølging over tid (rapporter, kontroller)? | **Én oppgave per frist**, laget av flyten med fristen fra saken (`oppgave-oppfolging-over-tid`) |
| 4 | Gir den først mening når noe har skjedd (en klage, et vedtak)? | `instantiateOnCaseCreation: false`, og **flyten lager den fra malen** (`oppgave-ved-hendelse`) |
| 5 | Avgjøres varianten først inne i saken? | **Én mal per verdi**, laget av en handling (`oppgave-variant-senere`) |
| 6 | Gjelder den bare én variant kjent ved opprettelsen? | **Variantens nøkkel** på oppgaven (`oppgave-variant`) |
| 7 | Ellers | Oppgaven lages **med saken**, i steget der den gjøres (`oppgave-steg`) |

## oppgave-mal-finnes Hver sakstype med en saksgang har en oppgavemal

```yaml
id: oppgave-mal-finnes
klasse: valg
gjelder: [taskTemplateSet, caseType.taskTemplateSets, caseType.taskTemplateSets.taskTemplateSet]
opphav: skrevet
```

- **Gjør:** Lag en oppgavemal for hver sakstype før den tas i bruk, og knytt den til sakstypen.
- **Ikke gjør:** Ikke regn med at behandlingsregelen eller veiviseren erstatter oppgavene.
- **Hvorfor:** Oppgavene legges i saken fra settene sakstypen har når saken opprettes. Uten sett er en ny sak blank,
  uansett hvor ferdig behandlingsregelen er.

## oppgave-hva-og-hvor Oppgaven sier hva som skal sjekkes og hvor, aldri hva utfallet skal bli

```yaml
id: oppgave-hva-og-hvor
klasse: valg
gjelder: [taskTemplateSet.tasks.title, taskTemplateSet.tasks.description]
krever: [08-instrukser.md#instruks-en-behandlingsregel]
opphav: praksis
```

- **Gjør:** Skriv hva som skal kontrolleres, og hvor svaret finnes, også når stedet er utenfor Neo (grunnboka,
  folkeregisteret, Enhetsregisteret, fagsystemet). Vis til punktet i behandlingsregelen eller hjemmelen.
- **Ikke gjør:** Ikke skriv terskler, beløp, varigheter eller hva som gir innvilgelse eller avslag i oppgaven.
- **Hvorfor:** Tersklene endres ett sted, i behandlingsregelen, som agenten leser og saksbehandleren verifiserer. Står de
  i oppgavene også, glir de fra hverandre.

```yaml
- title: "Er søkeren registrert i Enhetsregisteret?"
  description: >-
    Slå opp organisasjonsnummeret i Enhetsregisteret. Søkeren må være registrert
    før søknaden behandles (behandlingsregelen punkt 3). Mangler det, be om
    ettersending.
```

## oppgave-komplett Tittelen er en handling eller et spørsmål, og beskrivelsen står alene

```yaml
id: oppgave-komplett
klasse: valg
gjelder: [taskTemplateSet.tasks.title, taskTemplateSet.tasks.description]
krever: [06-oppgaver.md#oppgave-hva-og-hvor]
opphav: praksis
```

- **Gjør:** Begynn tittelen med et verb («Kontroller …», «Vurder …», «Innhent …») eller still spørsmålet som skal
  besvares. Skriv i beskrivelsen hva som skal gjøres, hvor, hjemmelen, og hva saksbehandleren gjør når noe mangler. Står
  det en handling på oppgaven, si hvilken.
- **Ikke gjør:** Ikke skriv titler som bare er et tema («Økonomi», «Dokumentasjon»). Ikke henvis til en rutine som ikke
  står i Neo.
- **Hvorfor:** Oppgaven er det saksbehandleren ser i arbeidslista. Den skal kunne gjøres uten å slå opp noe annet først.

## oppgave-steg Hver oppgave er bundet til steget i statusløpet der den gjøres

```yaml
id: oppgave-steg
klasse: valg
gjelder: [taskTemplateSet.tasks.caseStatus, taskTemplateSet.tasks.sortOrder]
krever: [02-status.md#status-er-tilstand]
opphav: praksis
```

- **Gjør:** Sett steget på hver oppgave, med gruppens og stegets navn. Legg oppgavene i rekkefølgen de gjøres;
  rekkefølgen i lista er rekkefølgen i saken.
- **Ikke gjør:** Ikke lag en status for hvert stykke arbeid.
- **Hvorfor:** Steget pekes ut med navnene og slås opp i sakstypens statusløp ved deploy. Uten steg lander oppgavene
  under «uten steg», og saksbehandleren mister orienteringen status og oppgaver skal gi sammen.

```yaml
- title: "Vurder søknaden mot tildelingskriteriene"
  caseStatus: { groupLabel: "Behandling", label: "Under behandling" }
```

## oppgave-grupper Grupper oppgavene som forelder med deloppgaver, ett nivå

```yaml
id: oppgave-grupper
klasse: valg
gjelder: [taskTemplateSet.tasks.parentId]
opphav: praksis
```

- **Gjør:** Samle kontrollene som hører sammen under én forelder. Lag én deloppgave per kontroll som skal kunne krysses
  av for seg, for eksempel når loven krever en skriftlig vurdering per punkt.
- **Ikke gjør:** Ikke lag en flat sjekkliste på førti rader. Ikke prøv å neste mer enn ett nivå.
- **Hvorfor:** Deloppgavene blir til sammen med forelderen og gjelder for de samme sakene. En flyt kan ikke opprette en
  deloppgave alene.

Eksempel: Den formelle kontrollen av en søknad er én forelder i mottakssteget, med en deloppgave per kontroll (fristen,
vedleggene, registeret, ordningen). Det som kan sjekkes uten skjønn, gjør en flyt før saksbehandleren begynner; funnene
står i saksdata (`05-felt-og-saksdata.md#ikke-oppgavefelt`). Handlingen som ber om ettersending, henger på forelderen
(`oppgave-handling`).

```yaml
- title: "Kontroller at søknaden er komplett"
  caseStatus: { groupLabel: "Mottak", label: "Mottatt" }
- title: "Kom søknaden innen fristen?"
  parentTitle: "Kontroller at søknaden er komplett"
- title: "Er budsjettet og prosjektplanen vedlagt?"
  parentTitle: "Kontroller at søknaden er komplett"
- title: "Er søkeren registrert i Enhetsregisteret?"
  parentTitle: "Kontroller at søknaden er komplett"
```

## oppgave-variant Oppgaver som bare gjelder én variant, bærer variantens nøkkel

```yaml
id: oppgave-variant
klasse: felle
gjelder: [caseType.taskTemplateRules, caseType.taskTemplateRules.conditionValues, caseType.taskTemplateRules.taskTemplate]
krever: [01-sakstype.md#variant-som-felt, 05-felt-og-saksdata.md#nokkel-og-etikett]
opphav: praksis
```

- **Gjør:** Har sakstypen et variantfelt, sett variantverdiene på oppgavene som bare gjelder noen av variantene. Bruk
  valgets nøkkel, ikke etiketten. Sett verdiene på forelderen. Legger du en oppgave til i malen senere, gi den verdiene
  med en gang.
- **Ikke gjør:** Ikke legg alle variantenes oppgaver på hver sak og la saksbehandleren lukke dem som ikke gjelder. Ikke
  sett variantverdier på en deloppgave.
- **Hvorfor:** Verdiene sammenlignes med det saken har lagret, og et valgfelt lagrer nøkkelen; etiketten gir en oppgave
  som aldri dukker opp. En oppgave uten verdier gjelder alle saker, også en som ble lagt til etter at sakstypen var satt
  opp. Mangler saken verdien, får den bare de ubetingede.

```yaml
# Sakstypen har variantfeltet «Tilskuddstype» med valgene
#   { key: drift, label: "Driftstilskudd" } og { key: prosjekt, label: "Prosjekttilskudd" }
taskTemplateRules:
  - taskTemplate: { title: "Kontroller prosjektplanen og milepælene" }
    conditionValues: [prosjekt]      # nøkkelen, ikke «Prosjekttilskudd»
```

## oppgave-variant-senere Settes varianten inne i saken, lager en handling det riktige oppgavesettet

```yaml
id: oppgave-variant-senere
klasse: valg
gjelder: [taskTemplateSet.tasks.instantiateOnCaseCreation, ObjectAction, SwitchRouter, CreateTask]
krever: [07-flyt.md#flyt-handling-pa-objektet, 07-flyt.md#flyt-rutevelger-uten-ellers, 07-flyt.md#flyt-oppgave-fra-malen]
opphav: praksis
```

- **Gjør:** Er varianten noe saksbehandleren avgjør underveis (et grunnlag som klassifiseres), lag én mal per verdi med
  `instantiateOnCaseCreation: false`. Heng en handling på klassifiseringsoppgaven som oppretter settet for verdien som
  er satt.
- **Ikke gjør:** Ikke bruk variantverdier på oppgavene da. Ikke la handlingen ha en «ellers»-vei for en verdi uten sett.
- **Hvorfor:** Variantverdiene velger oppgaver idet saken opprettes, med verdien feltet har da. En sak der feltet settes
  senere, får ingen av settene. En verdi uten sett er en feil i oppsettet som skal stoppe synlig.

## oppgave-ved-hendelse Oppgaver som først gir mening når noe har skjedd, lages av en flyt fra malen

```yaml
id: oppgave-ved-hendelse
klasse: valg
gjelder: [taskTemplateSet.tasks.instantiateOnCaseCreation, taskTemplateSet.tasks.dueOffsetDays, CreateTask]
krever: [07-flyt.md#flyt-oppgaven-finnes, 07-flyt.md#flyt-oppgave-fra-malen]
opphav: praksis
```

- **Gjør:** Sett `instantiateOnCaseCreation: false` på oppgaver som hører til en hendelse: en klage er kommet, et vedtak
  er fattet, en frist er ute, en rapport skal leveres. La flyten opprette dem fra malen.
- **Ikke gjør:** Ikke legg dem på saken fra start. Ikke la flyten lage dem som fritekst.
- **Hvorfor:** Opprettet med saken står de i arbeidslista i månedsvis uten mening. Opprettet som fritekst har de ingen
  mal, og da treffer ingen handling som er avgrenset til malen. Fristen regnes fra da flyten opprettet oppgaven.

```yaml
- title: "Vurder sluttrapporten"
  instantiateOnCaseCreation: false   # flyten lager den når rapporten er mottatt
  dueOffsetDays: 14                  # regnet fra da flyten opprettet den
```

## oppgave-venter Hver forespørsel som står ute, er en venteoppgave

```yaml
id: oppgave-venter
klasse: valg
gjelder: [taskTemplateSet.tasks.instantiateOnCaseCreation, taskTemplateSet.tasks.dueOffsetDays, CreateTask, HentOppgaver, SetTaskStatus]
krever: [02-status.md#en-ventestatus, 07-flyt.md#flyt-ventestatus]
opphav: praksis
```

- **Gjør:** Lag en venteoppgave per slags forespørsel (ettersending fra søkeren, uttalelse fra en annen instans). La
  flyten som sender forespørselen, opprette den. Fristen er tiden svaret ventes innen. Svaret kvitterer den ut. Skriv i
  beskrivelsen hva saksbehandleren gjør hvis svaret kommer på en annen måte.
- **Ikke gjør:** Ikke lag én ventestatus per slags forespørsel. Ikke la saken stå i ventestatus etter at svaret er kommet.
- **Hvorfor:** Statusen sier at saken venter. Venteoppgaven sier hva den venter på, og fristen viser når det har gått for
  lang tid.

Eksempel: Saksbehandleren finner en mangel i kontrollen og bruker handlingen «Be om ettersending» på kontrolloppgaven.
Flyten journalfører og sender forespørselen, lager venteoppgaven «Venter på ettersending» med svarfristen, og setter
saken i ventestatus. Når svaret er lagt i saken, kvitterer flyten ut venteoppgaven og setter saken tilbake til
behandling hvis ingenting annet står ute (`07-flyt.md#flyt-ventestatus`). Mangelbrevet er dokumentet; ingen avkrysning
sier at det er sendt (`05-felt-og-saksdata.md#plikten-er-ikke-saksdata`).

```yaml
- title: "Venter på ettersending fra søkeren"
  instantiateOnCaseCreation: false   # flyten bak «Be om ettersending» lager den
  dueOffsetDays: 14                  # svarfristen i brevet
  description: >-
    Kvitteres ut når ettersendingen er lagt i saken. Kommer svaret på e-post
    eller papir, legg det i saken og sett oppgaven til ferdig.
```

## oppgave-frist Fristen settes der en lov, en rutine eller et svar gir den

```yaml
id: oppgave-frist
klasse: felle
gjelder: [taskTemplateSet.tasks.dueOffsetDays, taskTemplateSet.tasks.startOffsetDays, CreateTask.dueDate, UpdateTask.dueDate]
krever: [05-felt-og-saksdata.md#velg-felttype, 07-flyt.md#flyt-oppgave-fra-malen]
opphav: praksis
```

- **Gjør:** Sett `dueOffsetDays` når det finnes en frist å regne fra: saksbehandlingstiden, en svarfrist, en klagefrist.
  Skal fristen følge en dato i saken (utløpet av et vedtak, en rapporteringsdato), la flyten sette den i «Opprett
  oppgave» fra feltet.
- **Ikke gjør:** Ikke gi hver oppgave en frist. Ikke bruk faste dager fra saksopprettelsen for oppgaver som hører til et
  senere steg.
- **Hvorfor:** `dueOffsetDays` regnes fra da saken ble opprettet, eller fra da flyten lagde oppgaven. En
  oppfølgingsoppgave med frist ti dager etter mottak har gått ut lenge før den er aktuell, og frister som alltid er
  passert, blir ikke lest. En frist flyten setter, går foran malens.

## oppgave-milepael En milepæl er en dato saken skal nå, ikke et arbeid

```yaml
id: oppgave-milepael
klasse: valg
gjelder: [taskTemplateSet.tasks.type, taskTemplateSet.tasks.dueOffsetDays, taskTemplateSet.tasks.startOffsetDays]
krever: [02-status.md#rekkefolgen-er-lopet]
opphav: forslag
```

- **Gjør:** Bruk `type: MILESTONE` for en frist saken har: svarfristen til søkeren, fristen for et foreløpig svar, en
  rapporteringsdato. Bind den til steget fristen gjelder, og gi den `dueOffsetDays` eller la flyten sette fristen.
- **Ikke gjør:** Ikke bruk en milepæl for noe noen skal gjøre; det er en oppgave. Ikke gi den startdato. Ikke lag en
  milepæl for hver status.
- **Hvorfor:** En milepæl har bare frist; en startdato avvises. Nøkkeltallene teller kommende milepæler for seg, som
  sakens frister. Blandes arbeid og frister, sier ingen av tallene noe.

```yaml
# Eksempel, tilskudd: fristen for sluttrapporten, satt av flyten fra feltet for rapportdatoen
- title: "Frist for sluttrapport"
  type: MILESTONE
  instantiateOnCaseCreation: false
```

## oppgave-handling Automatiseringen i et steg henger på oppgaven steget gjøres i

```yaml
id: oppgave-handling
klasse: valg
gjelder: [ObjectAction, ObjectAction.taskTemplateIds, taskTemplateSet.tasks.description]
krever: [07-flyt.md#flyt-handling-pa-objektet]
opphav: praksis
```

- **Gjør:** Når et steg avsluttes med noe Neo gjør (sende en forespørsel, sette status, opprette neste oppgaver), heng
  handlingen på oppgaven og avgrens den til malen. Skriv i oppgavens beskrivelse hvilken handling som brukes. La
  handlingen kvittere ut oppgaven.
- **Ikke gjør:** Ikke be saksbehandleren skrive av en dato eller sette en status for hånd når en handling kan gjøre det.
- **Hvorfor:** Saksbehandleren finner handlingen der arbeidet står. En handling avgrenset til en mal vises bare på
  oppgaver fra den malen.

```yaml
- title: "Kontroller at søknaden er komplett"
  description: >-
    … Er søknaden komplett: bruk handlingen «Søknaden er komplett» på denne
    oppgaven. Mangler noe: bruk «Be om ettersending» og skriv hva som mangler.
```

## oppgave-ett-sett-per-sakstype Hver sakstype har sitt eget oppgavesett

```yaml
id: oppgave-ett-sett-per-sakstype
klasse: felle
gjelder: [caseType.taskTemplateSets, caseType.taskTemplateSets.taskTemplateSet, taskTemplateSet.tasks.caseStatus]
opphav: praksis
```

- **Gjør:** Lag ett sett per sakstype. Trenger flere sakstyper de samme oppgavene (klagesporet, foreløpig svar), lag en
  kopi i hvert sett og hold kilden samlet i én definisjon du kopierer fra.
- **Ikke gjør:** Ikke knytt samme sett til flere sakstyper.
- **Hvorfor:** Oppgavens steg er én rad i én sakstypes statusløp. På en annen sakstype får oppgaven ikke steget sitt, og
  to sakstyper som deler et sett, er identiske i alt annet også.

## oppgave-deling-etter-kilde Del oppgaver mellom sakstyper når kilden er den samme, ikke når teksten likner

```yaml
id: oppgave-deling-etter-kilde
klasse: valg
gjelder: [taskTemplateSet, taskTemplateSet.tasks]
krever: [06-oppgaver.md#oppgave-ett-sett-per-sakstype]
opphav: praksis
```

- **Gjør:** Del kilden til oppgaver som følger av en forvaltningsplikt (foreløpig svar, mangelbrev, klage) eller et
  oppslag som er likt overalt, og kopier dem inn i settene. Ta dem bare med for sakstypene der saksgangen utfører
  plikten.
- **Ikke gjør:** Ikke del terskler, varigheter og vilkår, selv om de er like i dag.
- **Hvorfor:** Det som varierer mellom ordninger eller kunder, skal kunne endres for én sakstype uten å endre de andre.
  En pliktoppgave på en sakstype som aldri utfører plikten, skjuler et hull.

## oppgave-ansvarlig-tom Oppgavemalen har ingen ansvarlig; tildelingen skjer i saken eller i flyten

```yaml
id: oppgave-ansvarlig-tom
klasse: standard
gjelder: [taskTemplateSet.tasks, UpdateTask.responsibleMemberId, AssignCase]
krever: [07-flyt.md#flyt-tildeling-fra-variabel]
opphav: skrevet
```

- **Gjør:** Tildel i saken, eller la en flyt tildele ut fra noe organisasjonen eier (den som startet handlingen, sakens
  ansvarlige).
- **Ikke gjør:** Ikke regn med at en ansvarlig satt på malen i én organisasjon følger med.
- **Hvorfor:** Oppsettet bærer ikke ansvarlig på oppgavemalen, og kopien får alltid en tom ansvarlig. Et medlem finnes
  bare i én organisasjon.

## oppgave-oppfolging-over-tid Rapporter og kontroller over tid lages som én oppgave per frist, av en flyt

```yaml
id: oppgave-oppfolging-over-tid
klasse: valg
gjelder: [taskTemplateSet.tasks.instantiateOnCaseCreation, CreateTask, CreateTask.dueDate]
krever: [06-oppgaver.md#oppgave-frist, 07-flyt.md#flyt-forvaltningshandling]
opphav: forslag
```

- **Gjør:** Når et vedtak gir oppfølging over tid (delrapport, sluttrapport, etterkontroll, retting etter et pålegg),
  lag en mal per slags oppfølging med `instantiateOnCaseCreation: false`. La flyten som sender vedtaket, opprette én
  oppgave per frist, med fristen fra datoene i saken.
- **Ikke gjør:** Ikke legg oppfølgingsoppgavene på saken fra start med faste dager.
- **Hvorfor:** Fristene kommer fra vedtaket, ikke fra mottaket. Oppgavemalen har ingen gjentakende oppgave, så hver
  frist er sin egen oppgave. Vi har ikke sett mønsteret prøvd.

Eksempel: Et tilsagn krever delrapport og sluttrapport. Rapportdatoene står i saken: som datofelt når det er én av
hver, som rader i en tabell i saksdata når det er flere. Handlingen som sender tilsagnet, lager én «Vurder
delrapporten» og én «Vurder sluttrapporten» med fristen fra datoene, og saken står åpen til siste rapport er vurdert.
Når rapporten kommer inn, legges den i saken, og flyten skriver hendelsen `rapport.mottatt`, så Innsikt kan telle
mottatte rapporter (`07-flyt.md#flyt-tell-med-hendelse`).

## oppgavestatus-kategorien-teller Oppgavestatusene er felles for organisasjonen, og kategorien avgjør om oppgaven er ferdig

```yaml
id: oppgavestatus-kategorien-teller
klasse: standard
gjelder: [taskStatusGroup, taskStatusGroup.groupType, taskStatusGroup.options, taskStatusGroup.options.label, SetTaskStatus]
krever: [05-felt-og-saksdata.md#utfall-som-felt]
opphav: skrevet
```

- **Gjør:** Behold standardsettet «Å gjøre», «Pågår» og «Ferdig». Trenger organisasjonen å skille mer, legg en ny status
  i gruppa med riktig kategori (`TODO`, `IN_PROGRESS` eller `COMPLETED`), for eksempel «Til kontroll» under
  `IN_PROGRESS`. Gi hver status et navn som er unikt i hele settet.
- **Ikke gjør:** Ikke lag oppgavestatuser for én sakstype eller for et utfall («Avslått»). Ikke fjern den siste statusen
  i `TODO` eller `COMPLETED`.
- **Hvorfor:** En oppgave er ferdig bare når statusen ligger i en `COMPLETED`-gruppe; alt annet er åpent. Fristene,
  nøkkeltallene og «Hent oppgaver» bruker den regelen, ikke navnet. Neo krever minst én status i `TODO` og i
  `COMPLETED`. Et utfall hører til saken.

```yaml
taskStatusGroups:
  - { label: "Å gjøre", groupType: TODO, options: ["Å gjøre"] }
  - { label: "Pågår", groupType: IN_PROGRESS, options: ["Pågår", "Til kontroll"] }
  - { label: "Ferdig", groupType: COMPLETED, options: ["Ferdig"] }
```
