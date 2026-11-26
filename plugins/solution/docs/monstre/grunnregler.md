# Grunnreglene

Reglene alle de andre måles mot, på tvers av flatene. En regel i en av flatefilene (`00-…` til `18-…`) som går imot en
grunnregel, er feil, og rettes eller tas ut.

## Hver ting har en jobb

Hvert objekt i oppsettet finnes fordi et krav trenger det: noen leser det, og det løser noe kravet trenger. Et objekt
ingen leser, har ingen jobb, og lages ikke. Det er ikke et mål om få ting: omfanget følger kravene, og et krav fra
hjemmelen eller utlysningen tas aldri bort for å forenkle.

## Leseren først, objektene etterpå

Et krav løses ved å stille spørsmålene i denne rekkefølgen:

1. Hvem skal lese hva, og med hvilken evne (se, filtrere, telle, flette inn i et brev, sette en betingelse)?
2. Hvor kan det stå, så den leseren kan bruke det?
3. Hvem skriver det der: flyten, agenten eller et menneske?
4. Hva starter skrivingen?

Reglene per flate sier hvordan hvert objekt settes opp, og avgjør når det finnes flere veier. Valget og grunnen står i
designet, og kravet sier hva det ble (`blir`).

## Neo registrerer selv

Det Neo allerede registrerer, modelleres ikke på nytt: historikken (statusendringer, dokumenter, oppgaver, e-post,
feltendringer), bekreftelsene i veiviseren, dokumentene selv og oppgavene. Et tidspunkt for noe som skjedde, er ikke et
felt; en frist som skal følges opp, er en milepæl.

## Et felt har en leser

Et saksfelt er det Neo skal handle på på tvers av saker: liste, filtrere, sortere, sette en betingelse i veiviseren,
flette inn i et brev, telle eller summere i Innsikt, eller finne saken på. Er ingen av dem sanne, er det ikke et felt.

## Felt fødes fra saksdata

Saksdata er arbeidsgrunnlaget i én sak: det som kom inn, og vurderingene av det, lest av mennesket, agenten og flyten.
Et felt settes fra saksdata av flyten (deterministisk) eller foreslås av agenten med sitat og godkjennes av et menneske.
Det samme skrives aldri inn to ganger.

## Plikten bevises der den skjer

En forvaltningsplikt (foreløpig svar, forhåndsvarsel, habilitet) oppfylles og bevises i dokumentet som sendes, oppgaven
som utføres, og bekreftelsen i veiviseren, som kan ha en betingelse på at dokumentet finnes. Den føres ikke i tillegg
i saksdata.

## Ferdig konfigurert

Hver innstilling på et objekt eller en flytnode er enten Neos standardverdi, eller satt med en grunn. Innstillingene der
valget betyr noe, settes etter regelen for dem, og fellene unngås. Det gjelder alle flatene: feltene (seksjon,
hjelpetekst, KI-forslag med kriterium, filtrerbar, valgene), saksdatamalene (modus, etikett, beskrivelse, varsel),
flytnodene og resten.

## Det som skal telles, skrives som hendelse

Det Innsikt eller en strøm skal telle eller summere over tid, skrives som en egen hendelse av flyten der det skjer, med
verdiene slik de var da. Innsikt leser sakens felt slik de er nå, og hendelser bare når en strøm leverer dem.
Hendelsene planlegges sammen med flytene, fordi en hendelse som ikke ble skrevet, ikke kan telles i ettertid.
