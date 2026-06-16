# MCP ChatGPT Proxy

This tiny proxy lets ChatGPT connect with auth set to `None`.

ChatGPT calls the proxy without OAuth. The proxy adds:

```text
Authorization: Bearer $MCP_ACCESS_TOKEN
```

and forwards the request to the existing Render MCP services.

## Render environment variables

Set these variables on the new Render service:

```text
MCP_ACCESS_TOKEN=<same value as mcp-shared-access>
PUBLIC_PATH_SECRET=<random long string, not the MCP token>
```

Optional defaults:

```text
JUDILIBRE_UPSTREAM=https://mcp-legal-fr-judilibre.onrender.com/mcp
DROIT_FRANCAIS_UPSTREAM=https://mcp-droit-francais-q6lk.onrender.com/mcp
```

## ChatGPT connector URLs

Replace `<proxy-host>` with the new Render service host and `<PUBLIC_PATH_SECRET>` with the random path secret.

```text
https://<proxy-host>/<PUBLIC_PATH_SECRET>/judilibre/mcp
```

```text
https://<proxy-host>/<PUBLIC_PATH_SECRET>/droit/mcp
```

In ChatGPT, choose auth:

```text
None / Rien
```
