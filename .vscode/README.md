# VS Code Workspace Configuration

This directory contains VS Code workspace settings for the Penpot MCP Server project.

## Setup Instructions

### 1. Copy the example settings file

```bash
cp .vscode/settings.json.example .vscode/settings.json
```

### 2. Add your Penpot Access Token

Edit `.vscode/settings.json` and replace `YOUR_PENPOT_ACCESS_TOKEN_HERE` with your actual Penpot access token.

**Getting a Penpot Access Token:**

1. Go to https://design.penpot.app
2. Log in to your account
3. Navigate to Settings → Access Tokens
4. Click "New Access Token"
5. Copy the generated token

### 3. Reload VS Code

After saving the settings file, reload VS Code:

- Press `Cmd/Ctrl + Shift + P`
- Type "Reload Window"
- Press Enter

## Usage

Once configured, you can use Penpot MCP tools directly in Claude Code:

```
Show me all available Penpot tools
```

Or create designs:

```
Create a new Penpot file called "Test Design"
```

## Security Note

⚠️ **Important:** The `.vscode/settings.json` file is ignored by git (via `.gitignore`) to prevent accidentally committing your access token. Never commit files containing real access tokens!

## Configuration

The workspace is configured to use the local MCP server build:

- **Command:** `node`
- **Server Path:** `/home/user/penpot-mcp-server/dist/index.js`
- **API URL:** `https://design.penpot.app` (or your self-hosted instance)

### Using a Self-Hosted Penpot Instance

If you're using a self-hosted Penpot instance, update the `PENPOT_API_URL`:

```json
{
  "claude.mcpServers": {
    "penpot": {
      "env": {
        "PENPOT_API_URL": "https://your-penpot-instance.com",
        "PENPOT_ACCESS_TOKEN": "your-token"
      }
    }
  }
}
```

## Troubleshooting

### MCP Server Not Connecting

1. **Verify the build exists:**

   ```bash
   ls -la /home/user/penpot-mcp-server/dist/index.js
   ```

2. **Rebuild if necessary:**

   ```bash
   npm run build
   ```

3. **Check the Output panel:**
   - View → Output
   - Select "Claude Code" from the dropdown
   - Look for connection errors

### Access Token Issues

Test your token:

```bash
curl -H "Authorization: Token YOUR_TOKEN" \
     https://design.penpot.app/api/rpc/command/get-profile
```

If you get an error, generate a new token from Penpot.

## Additional Documentation

- **Complete Setup Guide:** See `CLAUDE_CODE_SETUP.md` in the project root
- **Usage Examples:** See `EXAMPLES.md` for design creation examples
- **API Reference:** See `README.md` for all available tools

## Support

For issues or questions:

- GitHub Issues: https://github.com/zcube/penpot-mcp-server/issues
- Documentation: https://github.com/zcube/penpot-mcp-server
