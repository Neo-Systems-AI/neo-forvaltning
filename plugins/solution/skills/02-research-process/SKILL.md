---
name: 02-research-process
description: Researcher prosessen én løsning skal dekke, fra en idé, en kunngjøring eller et ønske fra kunden - hjemmelen med ordrett tekst, sakene og variantene, forløpet, data og regler, og dokumentene - fra kilder som lagres uendret, med en påstand per kilde, kontrollert mot kildene av en egen agent. Bruk når en ny løsning starter, eller når prosessen eller regelverket har endret seg.
---

# Research på prosessen

En løsning bygges fra det som faktisk gjelder for prosessen, ikke fra hvordan den gjøres i dag. Researchen samler det
som gjelder, med kilde, så hvert krav og hvert valg senere kan spores tilbake.

**Inn:** en idé, en kunngjøring, en utlysning eller et ønske fra kunden, og det som gjelder hele kunden (i
`felles/forstaelse/`, i et kunderepo). **Ut:** `kilder/` og `forstaelse/` i løsningen, og `losning.yaml` i status
`utkast` med formålet og eieren når løsningen er ny. Formen står i README.md i hver mappe.

## De fem dimensjonene

| Dimensjon | Hva den svarer på |
|---|---|
| Hjemmelen | Lovene, forskriftene og retningslinjene som styrer saken, med ordrett tekst. Begrunnelse, klage, innsyn, inhabilitet, unntak fra offentlighet, journalføring og oppbevaring |
| Sakene og variantene | Hva én sak er, hvor den begynner og slutter, hva som deler sakene i varianter, og hvor mange det er |
| Forløpet | Fasene fra henvendelse til avslutning og arkiv, med frister og kontrollpunktene: godkjenninger, vurderinger, høring |
| Data og regler | Egenskapene saken har (type, lovlige verdier, hvor de kommer fra), og betingelsene på dem |
| Dokumentene | Det som kommer inn og det som går ut, med maler, flettefelt og skjerming |

Det som gjelder hele kunden (rollene, språket, partene, systemene, porteføljen), står i `felles/forstaelse/`. Har
prosessen noe eget i en av dem, står det i løsningen med en henvisning dit.

## Slik gjør du det

1. **Finn kildene.** Hjemmelen fra Lovdata (lovene og forskriftene, med ordrett tekst og datoen for versjonen),
   kunngjøringen eller utlysningen, skjemaene og malene kunden bruker, veiledere, praksis fra Sivilombudet og
   klageorganet, og offentlig journal for slike saker. Er det en idé uten kunngjøring, er ideen selv den første kilden.
2. **Lagre hver kilde uendret,** med opphavet: lenke, utgiver, datoen dokumentet har, og datoen det ble lest. En lagret
   kilde endres aldri; en ny versjon får en ny id. Personopplysninger lagres ikke.
3. **Skriv forståelsen per dimensjon,** med kilde per påstand. Hjemmelen siteres ordrett, med paragrafen.
4. **Skriv det kildene ikke svarer på** som spørsmål til kunden, per dimensjon. Ikke fyll hull med antakelser.
5. **Kontrollér mot kildene.** En egen agent, som ikke skrev forståelsen, leser hver påstand mot den lagrede kilden og
   lister avvikene. Les hjemmelen særlig nøye: en påstand om hva loven krever, uten at paragrafen sier det, blir et
   krav som ikke skulle vært der.
6. **Kjør sjekken av repoet** (`check` i `.claude/method.json`) til den er grønn.

## Personen avgjør

Avvikene i forståelsen: det kontrollen fant og du ikke kunne rette fra kildene, og spørsmålene til kunden. Legg dem
fram nummerert, med hva hver av dem endrer i kravene.

## Ferdig når

Hver dimensjon har forståelsen med kilder eller en tom seksjon med spørsmålene, kontrollen har ingen åpne avvik, og
sjekken er grønn.
