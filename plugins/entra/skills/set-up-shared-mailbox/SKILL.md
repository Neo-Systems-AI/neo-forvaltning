---
name: set-up-shared-mailbox
description: Kobler en felles postboks i Exchange Online (postmottak@ og lignende) til innboksen i Neo, med app-tilgang avgrenset til de felles postboksene - i rekkefølgen, med hvem som gjør hva, kontrollen og feilene. Appen og sjekken av tenanten er et skript et menneske kjører; rollene i Exchange er PowerShell-linjer skriptet fyller inn. Last når en felles postboks skal kobles til, prøves eller feilsøkes.
---

# Felles postboks fra Exchange til innboksen

**Oppskriften står i `${CLAUDE_PLUGIN_ROOT}/docs/exchange.md`:** hva kunden trenger, oppgavene i rekkefølge med når hver
er ferdig, hva som legges i hvelvet, hva forvalteren gjør i Neo, driften og feilkodene Neo gir. Les den først. Her står
hvem som gjør hva, hvilket steg i skriptet som gjør hver oppgave, og kontrollen.

Kommandoene er `node "${CLAUDE_PLUGIN_ROOT}/scripts/entra.mjs" <steg>`, kjørt av **mennesket** med sin egen innlogging
(`az login --allow-no-subscriptions`). Rollene i Exchange finnes bare i Exchange Online PowerShell (`pwsh` med modulen
`ExchangeOnlineManagement`), kjørt av en Exchange-administrator.

## Hvem gjør hva

| Steg | Agent | Menneske |
|---|---|---|
| Gi kommandoene, lese utdataene, finne feilen | ✅ | |
| Kjøre skriptet og PowerShell | | ✅ med sin egen innlogging |
| Client secret | ❌ ser den aldri | ✅ rett fra terminalen til Neo |
| Integrasjonen og postboksen i Neo, og prøve-e-posten | | ✅ som administrator i organisasjonen |

## Rekkefølgen, med kontrollen

1. **Exchange i tenanten:** `exchange-sjekk`. *Kontroll:* `exchange: true`. Ellers stopper løpet til organisasjonen har
   en lisens med Exchange Online, tildelt minst én bruker. Ligger e-posten hos en annen leverandør, må postboksen ha en
   adresse i tenantens `onmicrosoft.com`-domene.
2. **Appen:** `postboks-app`. Svaret er klient-ID-en (`appId`) og objekt-ID-en til tjenesteprinsipalen (`spId`);
   Exchange trenger begge. Appen får ingen e-posttillatelser i Entra.
3. **Client secret:** mennesket kjører `az ad app credential reset --id <appId> --display-name neo --years 1` og kopierer
   `password` rett inn i Neo i steg 5.
4. **Rollene i Exchange:** `exchange-linjer --app <appId> --sp <spId> --postboks <adresse> … [--send]` gir linjene,
   som mennesket kjører i `pwsh`. Mangler postboksen, lages den først med
   `New-Mailbox -Shared -Name "<navn>" -PrimarySmtpAddress <adresse>`. *Kontroll:* siste linje
   (`Test-ServicePrincipalAuthorization`) viser `InScope = True` for hver rolle. Rollene slår ikke inn med en gang.
5. **Integrasjonen i Neo:** mennesket legger til Microsoft 365 med klient-ID, client secret og tenant-ID (aldri blank),
   og legger til postboksen under «Felles postbokser». Neo prøver å lese innboksen og sjekker at postboksen er felles
   før den lagres.
6. **Kontrollen:** en e-post til postboksen, med vedlegg, kommer inn i innboksen (neste synk, hvert femte minutt, eller
   «Synk nå»); en e-post til en postboks utenfor omfanget kommer ikke inn. Det er beviset på at avgrensningen virker.

## Feil fra kommandoene

Feilkodene fra Neo står i oppskriften. Her står de som kommer fra kommandoene:

| Kode | Årsak | Rettes med |
|---|---|---|
| `UnAuthorized` fra `Connect-ExchangeOnline` | Kontoen mangler rollen i Exchange, eller tenanten har ikke Exchange Online | Steg 1, og en Exchange-administrator |
| `command not found: Connect-ExchangeOnline` | Linjene ble kjørt i zsh eller bash | Start `pwsh` først |

## Fjerne en postboks

I Neo: «Fjern» på postboksen. Ta den så ut av omfanget i Exchange (`Set-ManagementScope` med et filter uten den), så
appen ikke lenger kan lese den.
