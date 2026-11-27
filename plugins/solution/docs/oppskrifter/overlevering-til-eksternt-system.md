# Overlevering til et eksternt system etter vedtaket

Når vedtaket er fattet, skal noe skje i et system Neo ikke behandler saken i: pengene utbetales fra økonomisystemet, en
tillatelse registreres i et fagsystem, saken oversendes en annen etat. Overleveringen skjer én gang, står som spor i
saken, og kan telles i Innsikt. Utbetalingen av et tilskudd er eksempelet gjennom oppskriften.

## Når den passer

Når kravene sier at vedtaket skal føre til en utbetaling, en registrering eller en bestilling i et annet system. Flyten
skriver sporet og en egen hendelse. Hvert eksterne system lytter på hendelsen. Mennesket utløser og kontrollerer.

Den passer ikke for arkivet. Journalføringen har sin egen oppskrift:
[Journalføring og offentlig journal](journalforing-og-offentlig-journal.md).

## Klossene

Vedtaket eller handlingen på oppgaven → flyt → raden i saksdata og den egne hendelsen, fra de samme verdiene → strøm →
hvert eksternt system (webhook eller egen flyt) og Innsikt.

- Den egne hendelsestypen, for eksempel `utbetaling.bestilt`
- Saksdatamalen for overleveringene, én rad per overlevering
- Oppgaven for overleveringen
- Flyten som skriver raden og hendelsen
- Strømmen med hendelsen, og én abonnent eller flyt per eksternt system
- Køen og tallet

## Slik bygges den

1. **Bestem mottakerne og veien** for hver: et API Neo kan levere til, eller en overlevering for hånd med en oppgave.
   Regler: `../monstre/07-flyt.md#flyt-overlevering-uten-integrasjon`
   Blir: `design/`
2. **Lag den egne hendelsestypen** med navnet `objekt.handling` og feltene mottakerne og Innsikt trenger: `caseId`,
   beløpet som tall, og det rapportene bryter ned på som valg.
   Regler: `../monstre/07-flyt.md#flyt-egen-hendelse`, `../monstre/00-navn-pakking-og-versjoner.md#navn-hendelse-objekt-handling`,
   `../monstre/00-navn-pakking-og-versjoner.md#hendelsestypen-brytes-ikke`, `../monstre/13-innsikt.md#tall-krever-hendelse`
   Blir: `oppsett/flow-event-types/`
3. **Lag en saksdatamal for overleveringene**, med én rad per utbetaling eller bestilling.
   Regler: `../monstre/05-felt-og-saksdata.md#flere-rader-er-saksdata`, `../monstre/05-felt-og-saksdata.md#ikke-en-logg`
   Blir: `oppsett/case-data-templates/`
4. **La flyten på vedtaket opprette en oppgave for overleveringen** fra en mal. Saksbehandleren utløser
   overleveringen med en handling på oppgaven, eller kvitterer den ut når den er gjort for hånd.
   Regler: `../monstre/06-oppgaver.md#oppgave-ved-hendelse`, `../monstre/07-flyt.md#flyt-oppgaven-finnes`,
   `../monstre/06-oppgaver.md#oppgave-handling`
   Blir: `oppsett/task-template-sets/`
5. **Skriv raden og hendelsen i samme flyt, fra de samme verdiene.** Flyten leser beløpet og de andre verdiene én gang,
   legger til raden i saksdata og skriver den egne hendelsen med de samme verdiene. Da sier tallet i Innsikt og raden i
   saken alltid det samme. La aldri en annen flyt skrive den ene av dem, og skriv aldri den ene fra en verdi den andre
   ikke har. Skriv hendelsen i en gren som ikke kjøres to ganger.
   Regler: `../monstre/07-flyt.md#flyt-hendelse-og-saksdata-fra-samme-verdier`, `../monstre/07-flyt.md#flyt-saksdata-adresse`,
   `../monstre/07-flyt.md#flyt-egen-hendelse`, `../monstre/07-flyt.md#flyt-tell-med-hendelse`
   Blir: `oppsett/workflows/`
6. **Stopp før overleveringen når noe er galt**, for eksempel når parten er under konkurs
   ([Opplysninger fra registre og kart](registre-og-kart.md)).
   Regler: `../monstre/11-integrasjoner.md#registre-skriver-pa-kontakten`, `../monstre/07-flyt.md#flyt-stopp-med-melding`
   Blir: `oppsett/workflows/`
7. **Lag strømmen med den egne hendelsen**, og send bare det mottakeren trenger. Hjemmelen står der den brukes, ikke på
   strømmen.
   Regler: `../monstre/07-flyt.md#flyt-strom-sender-det-som-trengs`, `../monstre/07-flyt.md#flyt-hjemmel-ikke-pa-strommen`,
   `../monstre/07-flyt.md#strom-pause-er-tap`
   Blir: steg i Neo: lag strømmen
8. **Koble hvert eksterne system til hendelsen.** Det finnes to veier:
   - **Lytt på hendelsen (anbefalt).** Hvert system får sin egen abonnent på strømmen: en webhook når systemet tar imot
     hendelsen slik den er, eller en egen flyt bundet til strømmen som kaller systemets API med «HTTP-forespørsel».
     Flyten for vedtaket endres ikke når et system kommer til eller går bort. Hvert system feiler for seg: et API som er
     nede, stopper ikke vedtaket, raden eller de andre mottakerne.
   - **Kall systemet i samme flyt** som skriver raden og hendelsen. Det gir færre klosser, men hvert nytt system betyr en
     endring i flyten for vedtaket, og en feil i ett kall stopper resten av flyten.

   Regler: `../monstre/07-flyt.md#system-lytter-pa-hendelsen`, `../monstre/07-flyt.md#webhook-abonnent-taaler-gjentak`, `../monstre/07-flyt.md#flyt-http-taaler-gjentak`,
   `../monstre/07-flyt.md#flyt-stopp-med-melding`
   Blir: steg i Neo: legg inn webhook-abonnenten; flyten som lytter, blir `oppsett/workflows/`
9. **Lag et brev per utbetaling** når parten skal ha det, med beløpet som dokumentfelt.
   Regler: `../monstre/09-maler.md#mal-dokumentfelt`, `../monstre/09-maler.md#mal-brev-etter-vedtaket`
   Blir: `oppsett/document-templates/`
10. **Lag køen og tallet.** Lista viser sakene som ikke er overlevert. Innsikt viser innvilget mot utbetalt fra
    vedtakshendelsen og den egne hendelsen.
    Regler: `../monstre/12-visninger.md#kategori-foran-status`, `../monstre/12-visninger.md#ko-i-lista-sum-i-innsikt`,
    `../monstre/13-innsikt.md#andel-av-to-summer`, `../monstre/13-innsikt.md#en-strom-for-innsikt`
    Blir: steg i Neo: lagre visningen og lag rapporten i Innsikt

## Hvem gjør hva

- **Deterministisk:** oppgaven, raden i saksdata, den egne hendelsen, leveringen til hvert system, og stoppet ved
  konkurs.
- **Agenten:** har ingen rolle i selve overleveringen.
- **Mennesket:** utløser overleveringen eller kvitterer ut oppgaven når den er gjort for hånd, og følger opp et stopp.

## Avhengighetene

- Krever [Vedtak med begrunnelse](vedtak-med-begrunnelse.md). Ofte også en aksept fra parten
  ([Innhenting fra parten med et Altinn-skjema](innhenting-med-altinn-skjema.md)) eller en godkjent rapport før neste
  utbetaling ([Oppfølging med rapporter og frister](oppfolging-med-rapporter-og-frister.md)).
- [Innsikt og nøkkeltall](innsikt-og-nokkeltall.md): den egne hendelsen er felles kilde for Innsikt og overleveringen.
  «Innvilget mot utbetalt» krever både vedtakshendelsen og den egne hendelsen, med beløpet som tall.
- [Opplysninger fra registre og kart](registre-og-kart.md) for stoppet ved konkurs.

## Grensene

- Neo har integrasjoner mot arkivet, Altinn, SvarUt og registrene, men ikke mot et økonomisystem
  (`../monstre/07-flyt.md#flyt-overlevering-uten-integrasjon`).
- En hendelse som kommer mens strømmen står på pause, leveres ikke senere (`../monstre/07-flyt.md#strom-pause-er-tap`).
- I en sandkasse sendes ingen webhook (`../monstre/07-flyt.md#webhook-abonnent-taaler-gjentak`).
- Innsikt har ingen kobling til et økonomisystem og ingen summering over saksdata.
- En lagret visning har ingen sum (`../monstre/12-visninger.md#ko-i-lista-sum-i-innsikt`).

## Hull i reglene

- Hvordan attestasjon og anvisning av en utbetaling gjøres, og hvordan en tilbakebetaling behandles.
