# entra

Oppsettet i kundens egen Microsoft-tenant for Neo: innlogging med Entra ID, brukerprovisjonering med SCIM, og en
felles postboks i Exchange Online inn i innboksen. Pluginen er veiledning: kommandoene mot Microsoft kjøres av et
menneske med sin egen innlogging, og agenten leser utdataene og finner feilen. I Neo gjør agenten det som verken
bærer en hemmelighet eller kan stenge noen ute, over MCP, når Neo er koblet til; resten gjør mennesket i nettleseren.

| Skill | Hva |
|---|---|
| `entra:sso-scim` | SSO, «Kun SSO», SCIM og grupper koblet til jobbroller og tilgangsgrupper, med en prøve på testbrukere |
| `entra:felles-postboks` | En felles postboks koblet til innboksen, med app-tilgang avgrenset i Exchange |

De to er uavhengige: en organisasjon kan ha den ene uten den andre, og de bruker hver sin app i Entra.

## Config

Ingen. Pluginen leser ingenting fra `.claude/neo.config.json`, og har ingen egne skript. `entra:sso-scim` bruker
Neos MCP-server når den er koblet til for organisasjonen (eier eller administrator), og virker uten.

## Det kunden må ha selv

- En Entra-tenant, og en konto som kan opprette apper og gi administratorsamtykke.
- Entra ID P1 eller P2 for å tildele grupper til en app. Uten det kan enkeltbrukere tildeles, men ikke grupper.
- Exchange Online og en Exchange-administrator, for den felles postboksen.
- Tilgang til DNS for e-postdomenet, for TXT-posten som verifiserer domenet.

Client secret og SCIM-token er kundens. De kopieres rett fra kilden til Neo eller Entra, og står aldri i en fil, i
config eller i chatten.
