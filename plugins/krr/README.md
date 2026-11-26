# krr

Oppslag i Kontakt- og reservasjonsregisteret (KRR), slik registeret selv svarer, for feilsøk av varslingen i Neo.
Bare lesing; personnummeret maskeres (de seks første sifrene og `*****`).

| Skill | Hva |
|---|---|
| `krr:api` | `person`: kontaktinformasjon, reservasjon og varslingsstatus for én eller flere personer |

`scripts/krr.mjs` har kommandoen, uten avhengigheter. Miljøet (`krr.miljo`) er `test` (test.kontaktregisteret.no)
eller `produksjon` (kontaktregisteret.no). Oppslaget går mot `POST /rest/v1/personer` (eller v2 med `--v2`).

## Config

```json
"krr": { "miljo": "test", "klient": "krr" }
```

**Klienten hentes fra `maskinporten`-delen** (`maskinporten.klienter.<klient>`), ikke fra egne nøkler her: klienten,
nøkkelen og scopet står ett sted, og tokenet for klienten i Maskinporten-pluginen prøver nøyaktig den klienten
KRR-oppslaget bruker. Klienten trenger `krr:global/kontaktinformasjon.read` i `scopes`. Pluginen `maskinporten`
trenger ikke være installert; bare delen i config-fila, og nøkkelen `maskinporten--<klient>-nokkel` i hvelvet.

## Det kunden må ha selv

Oppsettet hos kunden, steg for steg, står i [`docs/krr.md`](./docs/krr.md).

- **En egen Maskinporten-klient** med scopet `krr:global/kontaktinformasjon.read`, i hvert miljø.
- **Et eget virksomhetssertifikat** eller en egen nøkkel på klienten, i kundens hvelv.
- **Bruksvilkårene for KRR** hos Digdir er godtatt av kunden, og kunden har hjemmel for oppslagene.

Kunden eier klientene og nøklene; vi eier koden.
