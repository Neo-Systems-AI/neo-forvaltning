# Opplysninger fra registre og kart

Saksbehandleren må slå opp søkeren i Enhetsregisteret, sjekke om virksomheten er under konkurs, finne adressen eller se
om tiltaket berører et verneområde. Oppslagene skal gjøres likt hver gang, og saken skal vise hva som ble sjekket, også
det som ikke traff.

## Når den passer

Når kravene sier at et faktum om parten eller stedet skal hentes fra en kilde: Enhetsregisteret, Folkeregisteret, Kontakt-
og reservasjonsregisteret, kart- eller geodata. Oppslaget er deterministisk og hører til en flyt. Vurderingen av det som
ble funnet, er skjønn og hører til saksbehandleren, med agenten som hjelp.

Den passer ikke når opplysningen bare finnes i dokumentene parten sendte; da er det en vurdering
([Formell kontroll](formell-kontroll.md) eller [Vurdering etter kriterier](vurdering-etter-kriterier.md)).

## Klossene

Katalogløsningen for registeret, med integrasjonen der registeret krever den → flyten som slår opp → kontakten til parten og saksdata med oppslagene → saksbehandleren
vurderer.

- Katalogløsningen for hvert register, og integrasjonen for KRR og Folkeregisteret
- Flyten som slår opp og skriver
- Saksdatamalen med en tabell for oppslagene
- Kartlagene på sakstypen og agentverktøyene

## Slik bygges den

1. **Gjør parten til sakspart**, ikke til felt.
   Regler: `../monstre/05-felt-og-saksdata.md#parten-er-sakspart`
   Blir: `design/`
2. **Ta i bruk katalogløsningen for hvert register kunden trenger**, i sandkassen, og ta filene inn med en PR.
   Enhetsregisteret trenger ingen integrasjon. Kontakt- og reservasjonsregisteret krever kundens KRR-integrasjon med
   kundens Maskinporten-klient. Folkeregisteret krever kundens KS Fiks-integrasjon og kommunens Fiks-rolle i noden. Hver
   node i flyten er bundet til integrasjonen den skal bruke.
   Regler: `../monstre/11-integrasjoner.md#registre-fra-katalogen`,
   `../monstre/00-navn-pakking-og-versjoner.md#endringer-i-neo-tas-inn`,
   `../monstre/11-integrasjoner.md#en-klient-mange-integrasjoner`
   Blir: steg i Neo: ta i bruk katalogløsningene i sandkassen, og legg inn KRR-integrasjonen og KS Fiks-integrasjonen
   når de trengs
3. **Skriv registerdataene på kontakten**, og forgren på konkurs der det skal stoppe saken.
   Regler: `../monstre/11-integrasjoner.md#registre-skriver-pa-kontakten`
   Blir: `oppsett/workflows/`
4. **For kart: velg kartlagene saken skal avgjøres på**, og bruk samme kilde i flyten.
   Regler: `../monstre/01-sakstype.md#kartlag-med-et-sporsmal`
   Blir: `oppsett/case-types/`
5. **Lag en saksdatamal med en tabell for oppslagene**, uten tom tabell før oppslaget er kjørt, og uten kvitteringer for
   oppslagene.
   Regler: `../monstre/05-felt-og-saksdata.md#flere-rader-er-saksdata`,
   `../monstre/05-felt-og-saksdata.md#modus-etter-hvem-som-fyller`, `../monstre/05-felt-og-saksdata.md#ikke-en-logg`
   Blir: `oppsett/case-data-templates/`
6. **Bygg kartoppslaget** så det skriver hva det søkte i og hva det fant, også oppslagene uten treff, og legg
   avstandene i flyten.
   Regler: `../monstre/07-flyt.md#flyt-kartoppslag-i-saksdata`, `../monstre/07-flyt.md#flyt-parametrene`,
   `../monstre/07-flyt.md#flyt-saksdata-adresse`
   Blir: `oppsett/workflows/`
7. **Velg utløseren.** En handling når saksbehandleren skal se svaret med en gang; en hendelse når det kan skje i
   bakgrunnen.
   Regler: `../monstre/07-flyt.md#flyt-handling-pa-objektet`, `../monstre/07-flyt.md#flyt-hendelse-er-ikke-straks`
   Blir: `oppsett/workflows/`
8. **Gi agenten verktøyene** kildene krever, geodata bare når saken slår opp i kart.
   Regler: `../monstre/01-sakstype.md#agentens-verktoy-etter-kildene`
   Blir: `oppsett/case-types/`
9. **Si i oppgaven hvor svaret står** når en kontroll må gjøres utenfor Neo.
   Regler: `../monstre/06-oppgaver.md#oppgave-hva-og-hvor`
   Blir: `oppsett/task-template-sets/`

## Hvem gjør hva

- **Deterministisk:** oppslaget i registeret eller kartet, skrivingen på kontakten og i saksdata, og stoppet ved konkurs.
- **Agenten** kan lese funnene og skrive en vurdering av dem i en saksdatamal når saksbehandleren ber om det.
- **Mennesket** vurderer hva funnene betyr for saken.

## Avhengighetene

- Krever [Grunnoppsettet for en sakstype](grunnoppsett-for-sakstypen.md).
- Brukes av [Søknad inn fra Altinn](soknad-inn-fra-altinn.md) (parten), [Formell kontroll](formell-kontroll.md) (er
  søkeren registrert) og [Overlevering til et eksternt system](overlevering-til-eksternt-system.md) (konkurs før
  utbetaling).

## Grensene

- Kartkilden gir høyst 20 treff per kall (`../monstre/07-flyt.md#flyt-kartoppslag-i-saksdata`).
- Et kart kan ikke vises som blokk i saksdata; det vises med kartlagene på sakstypen
  (`../monstre/05-felt-og-saksdata.md#bare-ferdige-blokker`).
- «Opprett kartlag» oppretter alltid et nytt lag; flyten må finne laget fra forrige kjøring selv
  (`../monstre/07-flyt.md#flyt-kartoppslag-i-saksdata`).
- Oppslaget i Enhetsregisteret tar ikke med underenheter (`../monstre/11-integrasjoner.md#registre-skriver-pa-kontakten`).
