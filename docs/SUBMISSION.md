# Public ChatGPT plugin submission — ALGO/ART · Composition

This is a submission worksheet for the **public**, mobile-capable plugin route. It is NOT evidence of approval or publication.

**Portal:** https://platform.openai.com/plugins

**Submission type:** With MCP → Universal (one public HTTPS endpoint)

## Connection

- MCP Server URL: `https://algoart-composition-plugin.onrender.com/mcp`
- Authentication: None — public composition-only server; no user account data requested
- Health check: `https://algoart-composition-plugin.onrender.com/health`
- Original ALGO/ART renderer: `https://southernadd-cmyk.github.io/algoart/` (read-only)
- Plugin source: `https://github.com/southernadd-cmyk/artalgoplugin`
- Privacy: `https://algoart-composition-plugin.onrender.com/privacy`
- Terms: `https://algoart-composition-plugin.onrender.com/terms`
- Support: `https://algoart-composition-plugin.onrender.com/support`

## Listing

- **Name:** ALGO/ART · Composition
- **Short description:** Compose images using original golden-ratio ALGO/ART guides.
- **Long description:** ALGO/ART · Composition connects ChatGPT to the eight original ALGO/ART V6 generative composition systems. Ask for an artwork, preview three reproducible golden-ratio layouts, choose the one you prefer, and use its actual PNG as a visual reference for ChatGPT image generation. The creative challenge is to keep the selected proportions, focal hierarchy and negative space when translating abstract marks into a painting or illustration.
- **Developer identity:** Use the VERIFIED developer identity attached to your OpenAI Platform organization. Do not claim a verified identity without completing that step.
- **Category:** Productivity or Design/Creativity if available.
- **Countries:** Choose desired countries in the portal.
- **Release notes:** First public submission; original V6 ALGO/ART renderer, three-image in-chat composition picker, full-resolution PNG handoff.
- **Privacy/terms:** Use the URLs above. Confirm the policies match actual hosting practices before final submission.

## Verification challenge

When the submission portal displays a domain-verification token, configure the Render service's `OPENAI_APPS_CHALLENGE` environment variable with the **exact token** (not a URL). The live backend will serve it as plain text at:

`https://algoart-composition-plugin.onrender.com/.well-known/openai-apps-challenge`

The challenge endpoint deliberately returns 404 until the token is configured. Never use a made-up token.

## Suggested review tests

Positive tests:

1. `Use ALGO/ART to paint an oil painting of a fridge full of food.` → Shows three original seeded guides.
2. `Show three original ALGO/ART compositions for a gothic scene with modern streetwear.` → Offers three guides with differing layouts.
3. `Get the selected guide in geometric mode with seed TEST-234.` → Valid 1400×1000 PNG returned.
4. `Create the same guide again with identical seed and settings.` → Deterministic guide output (expect exact matching bytes when renderer version unchanged).
5. `Preserve blank space when creating my painting from the selected guide.` → Image-generation step uses the tool-returned PNG; no false success claim.

Negative tests:

1. Invalid ALGO/ART mode `not-a-mode` → Rejected at schema validation.
2. Invalid seed such as a script string → Rejected; cannot inject into a web page.
3. Request for a final image without successful image handoff → Clearly say image generation is unavailable rather than claiming success.

## Remaining prerequisites

- You (or an authorized developer) must have **Apps Management: Write** in the OpenAI Platform organization.
- Developer identity verification is required.
- The portal may require a plugin logo. Prefer your existing ALGO/ART brand asset.
- On submission, use **Scan Tools**, complete domain verification, review the tool metadata and test the picker and final-image flow on supported clients, including a phone.
- Approval and publication are decisions made by OpenAI and the account owner, not by this GitHub repository.

**Original** `southernadd-cmyk/algoart` **repository must not be changed for this integration.**
