# ALGO/ART · Composition — ChatGPT Plugin

This is a **ChatGPT MCP plugin**. It is **not** a replacement for the original ALGO/ART site.

- Reads the **original published ALGO/ART V6 JavaScript renderer** at https://southernadd-cmyk.github.io/algoart/ — all eight original modes.
- Displays three composition previews in an interactive ChatGPT widget.
- Returns a real full-resolution PNG and negative-space constraints for ChatGPT image generation.
- Does not modify the original `southernadd-cmyk/algoart` repository.

## Hosting

Node.js 20+ with Playwright Chromium. Render build command: `npm install && npx playwright install chromium`; start command: `npm start`. Chromium system libraries must be available on the host. MCP endpoint: `/mcp`; health endpoint: `/health`.

Once the MCP server is deployed at HTTPS, connect its `https://HOST/mcp` URL under ChatGPT Plugins → Add custom MCP server. Native ChatGPT image handoff still requires an in-ChatGPT test.

## User flow

Ask: `Use ALGO/ART to paint a fridge full of food in oils`. Choose one of three previews, then let ChatGPT obtain the exact PNG and generate the image. Composition is authoritative, including white-space regions.

Source stays fully separate from the original ALGO/ART repository.
