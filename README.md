# @heyeddi/penpot-mcp-server

HeyEddi fork of [`@zcubekr/penpot-mcp-server`](https://github.com/zcube/penpot-mcp-server) (MIT).

## HeyEddi additions (v1.1.0)

These close the layout gap that made Suite/settings boards ship as absolute text-walls:

| Tool / param                                                                                                                        | Purpose                                             |
| ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `parentId` on `create_frame` / `create_rectangle` / `create_text` / `create_circle`                                                 | Nest children into a board (not only the page root) |
| `layout`, `layoutFlexDir`, `layoutGapRow`/`Column`, padding, justify, align on `create_frame` / `update_shape` / `set_frame_layout` | Real Penpot Flex or CSS Grid                        |
| `layoutItemHSizing` / `layoutItemVSizing` (`fill` \| `fix` \| `auto`)                                                               | Fit / Fill / Fix children                           |
| `set_frame_layout`                                                                                                                  | Turn an existing board into Flex/Grid               |
| `set_layout_item`                                                                                                                   | Size a child inside a layout parent                 |
| `reparent_shape`                                                                                                                    | Move a shape under a new parent board/group         |

### Cursor MCP config

```json
{
  "mcpServers": {
    "penpot": {
      "command": "npx",
      "args": ["-y", "@heyeddi/penpot-mcp-server"],
      "env": {
        "PENPOT_API_URL": "https://design.penpot.app"
      }
    }
  }
}
```

Until the package is on npm, use the GitHub install:

```json
"args": ["-y", "github:HeyEddi-com/penpot-mcp-server"]
```

Or a local path:

```json
"command": "node",
"args": ["/absolute/path/to/penpot-mcp-server/dist/index.js"]
```

`PENPOT_ACCESS_TOKEN` must be in the environment Cursor passes to the server. Never commit the token. `export_shape` renders a board through `POST /api/export` and returns the PNG in the tool result. Optional `PENPOT_AUTH_TOKEN` is the browser `auth-token` cookie; set it when image fills must match the canvas. The access token alone uses Penpot's WASM exporter.

### Upstream

Original README follows. Upstream project: https://github.com/zcube/penpot-mcp-server

---

# Penpot MCP Server

[![Docker Image](https://ghcr-badge.egpl.dev/zcube/penpot-mcp-server/latest_tag?trim=major&label=latest)](https://github.com/zcube/penpot-mcp-server/pkgs/container/penpot-mcp-server)
[![Docker Image Size](https://ghcr-badge.egpl.dev/zcube/penpot-mcp-server/size)](https://github.com/zcube/penpot-mcp-server/pkgs/container/penpot-mcp-server)

A Model Context Protocol (MCP) server that provides full manipulation capabilities for Penpot - the open-source design tool. This server enables AI assistants to create, modify, and manage Penpot designs programmatically, similar to Figma plugin capabilities.

**🐳 Multi-architecture Docker images available:** `linux/amd64`, `linux/arm64`

## 🎬 See It In Action

![Chat Interface Example](docs/screenshot.png)

_Example chat interface created entirely through natural conversation with an AI assistant using this MCP server. See [Example 7: Chat Interface](EXAMPLES.md#-example-7-chat-interface) for the complete conversation that generated this design._

The screenshot above demonstrates how you can describe a design in natural language, and the AI assistant will create it in Penpot using the MCP server's capabilities - handling layout, styling, components, and interactions automatically.

## Features

### 🎨 Complete Design Manipulation

- **Create & Manage Files**: Create new design files, list projects, and manage file metadata
- **Shape Operations**: Create rectangles, circles, frames, paths, text, and SVG shapes
- **Modify Designs**: Update shape properties, move objects, resize, rotate, and style
- **Page Management**: Add, remove, and organize pages within files
- **Component System**: Create and manage reusable components

### 🔄 Real-time Operations

- Direct API integration with Penpot
- Session-based updates with revision tracking
- Support for batch operations

### 🛠️ Available Tools (76+ Tools!)

#### Project & File Management (8 tools)

- `list_teams` - List all accessible teams
- `list_projects` - List all accessible projects
- `list_files` - List files in a project
- `get_file` - Get file data and structure
- `create_file` - Create a new design file
- `rename_file` - Rename an existing file
- `delete_file` - Delete a file permanently

#### Page Management (8 tools)

- `list_pages` - List all pages in a file
- `add_page` - Add a new page to a file
- `get_page_shapes` - Get all shapes on a specific page (basic info)
- `query_shapes` - Query and filter shapes with criteria (like grep). Filter by type, area, color, font, text content. Select fields to return. Useful for bulk operations
- `get_shape_properties` - Get detailed properties of a specific shape (colors, text, fonts, effects, etc.)
- `rename_page` - Rename a page
- `delete_page` - Delete a page from a file
- `move_shapes` - Move shapes to different parent/frame or reorder

#### Shape Creation (6 tools)

- `create_rectangle` - Create rectangle shapes
- `create_circle` - Create circle/ellipse shapes
- `create_frame` - Create frame containers
- `create_text` - Create text elements with alignment (left, center, right, justify), fonts, and styling
- `create_svg` - Create SVG elements
- `create_path` - Create custom paths (planned)

#### Shape Manipulation (3 tools)

- `update_shape` - Modify shape properties (position, size, style, etc.)
- `delete_shape` - Remove shapes from the design
- `duplicate_shapes` - Duplicate shapes (planned)
- `group_shapes` - Group multiple shapes (planned)

#### Shape Alignment & Distribution (2 tools)

- `align_shapes` - Align multiple shapes (left, center, right, top, middle, bottom)
- `distribute_shapes` - Distribute shapes evenly with equal spacing (horizontal, vertical)

#### Component System (5 tools)

- `create_component` - Create reusable component from shape
- `update_component` - Update component name/path
- `delete_component` - Delete component from library
- `list_components` - List all components in file
- `instantiate_component` - Create component instance (planned)

#### Team & Collaboration (10 tools)

- `create_team` - Create a new team
- `update_team` - Update team settings
- `delete_team` - Delete a team
- `list_team_members` - List all members of a team
- `invite_team_member` - Invite user to join team
- `remove_team_member` - Remove member from team
- `update_team_member_role` - Update member permissions
- `create_project` - Create new project in team
- `update_project` - Update project settings
- `delete_project` - Delete a project

#### File Sharing (3 tools)

- `create_share_link` - Create shareable link for file
- `list_share_links` - List all share links for file
- `delete_share_link` - Delete a share link

#### Comments & Feedback (8 tools)

- `list_comment_threads` - List comment threads in file
- `get_comments` - Get all comments in thread
- `create_comment_thread` - Create new comment thread
- `add_comment` - Add comment to existing thread
- `update_comment` - Update existing comment
- `delete_comment` - Delete a comment
- `delete_comment_thread` - Delete entire thread
- `update_comment_thread_status` - Mark thread as resolved/unresolved

#### Export & Media (5 tools)

- `export_shape` - Render a frame through `POST /api/export` and return the PNG (or jpeg, webp, svg, pdf) in the tool result
- `list_file_media` - List all media used in file
- `upload_file_media` - Upload image file (PNG, JPG, SVG, GIF, WEBP)
- `upload_file_media_from_url` - Upload image from URL
- `delete_file_media` - Delete media object
- `clone_media` - Clone media from another file

#### Font Management (5 tools)

- `upload_font` - Upload custom font (TTF, OTF, WOFF, WOFF2)
- `list_team_fonts` - List all fonts in team
- `get_font_variants` - Get all variants of font family
- `update_font_variant` - Update font metadata
- `delete_font_variant` - Delete font variant

#### Webhooks (5 tools)

- `create_webhook` - Create webhook for event notifications
- `list_webhooks` - List all webhooks for team
- `update_webhook` - Update webhook settings
- `delete_webhook` - Delete a webhook
- `get_webhook_events` - Get info about webhook event types

#### Search (5 tools)

- `search_files` - Search files by name
- `search_projects` - Search projects by name
- `search_shapes` - Search shapes within file
- `search_components` - Search components by name
- `advanced_search` - Search across multiple resource types

#### Profile & Stats (5 tools)

- `get_profile` - Get current user profile
- `update_profile` - Update user profile settings
- `list_recent_files` - List recently accessed files
- `get_file_permissions` - Get file permissions
- `get_team_stats` - Get team statistics

## Installation

### Option 1: Using npm (Recommended for CLI)

Install globally from npm:

```bash
# Install globally
npm install -g @zcubekr/penpot-mcp-server

# Run the server
penpot-mcp-server

# Or run in HTTP mode
TRANSPORT=http penpot-mcp-server
```

Or install as a project dependency:

```bash
# Install as dependency
npm install @zcubekr/penpot-mcp-server

# Run via npx
npx penpot-mcp-server
```

### Option 2: Using Docker (Recommended for HTTP Server)

Pull the pre-built multi-architecture image from GitHub Container Registry:

```bash
# Pull latest version
docker pull ghcr.io/zcube/penpot-mcp-server:latest

# Or pull specific version
docker pull ghcr.io/zcube/penpot-mcp-server:v1.0.0

# Or pull development version
docker pull ghcr.io/zcube/penpot-mcp-server:main-dev
```

**Supported Architectures:**

- `linux/amd64` (x86_64)
- `linux/arm64` (ARM64/Apple Silicon)

### Option 3: Build from Source

```bash
git clone https://github.com/zcube/penpot-mcp-server.git
cd penpot-mcp-server
npm install
npm run build
```

## Configuration

Set up your Penpot credentials as environment variables:

```bash
export PENPOT_API_URL="https://design.penpot.app"
export PENPOT_ACCESS_TOKEN="your-access-token-here"
```

Or create a `.env` file (not recommended for production):

```
PENPOT_API_URL=https://design.penpot.app
PENPOT_ACCESS_TOKEN=your-access-token-here
```

### Getting a Penpot Access Token

1. Log in to your Penpot account
2. Go to Settings → Access Tokens
3. Create a new access token
4. Copy and save it securely

### Self-hosted Penpot Server

If you're running a self-hosted Penpot instance, you need to enable access token support:

**Important:** Due to Cloudflare security restrictions on the public Penpot instance, you may need to use a self-hosted server for API access.

#### Enable Access Tokens

Add `enable-access-tokens` to your Penpot server configuration:

```yaml
# docker-compose.yml or penpot-config.env
environment:
  - PENPOT_FLAGS=...enable-access-tokens
```

If you have other flags, append `enable-access-tokens` to the list:

```yaml
# Example with multiple flags
environment:
  - PENPOT_FLAGS=enable-registration enable-login enable-access-tokens
```

After enabling this flag, restart your Penpot server and you'll be able to generate access tokens from Settings → Access Tokens.

## Usage

### Transport Modes

This server supports two transport modes:

1. **stdio mode (default)** - For local MCP clients like Claude Desktop
2. **HTTP/SSE mode** - For external access via HTTP with Server-Sent Events

### Stdio Mode (Default)

#### With Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "penpot": {
      "command": "node",
      "args": ["/path/to/penpot-mcp-server/dist/index.js"],
      "env": {
        "PENPOT_API_URL": "https://design.penpot.app",
        "PENPOT_ACCESS_TOKEN": "your-access-token"
      }
    }
  }
}
```

#### With Other MCP Clients

```bash
node dist/index.js
```

### HTTP/SSE Mode (External Access)

For external access, you can run the server in HTTP mode with Server-Sent Events:

#### Quick Start with Docker

```bash
# Run with Docker
docker run -d \
  --name penpot-mcp-server \
  -p 3000:3000 \
  -e TRANSPORT=http \
  -e PENPOT_API_URL=https://design.penpot.app \
  -e PENPOT_ACCESS_TOKEN=your-access-token \
  ghcr.io/zcube/penpot-mcp-server:latest

# With custom port and self-hosted Penpot
docker run -d \
  --name penpot-mcp-server \
  -p 8080:8080 \
  -e TRANSPORT=http \
  -e HTTP_PORT=8080 \
  -e PENPOT_API_URL=https://penpot.mycompany.com \
  -e PENPOT_ACCESS_TOKEN=your-access-token \
  ghcr.io/zcube/penpot-mcp-server:latest

# View logs
docker logs -f penpot-mcp-server

# Stop server
docker stop penpot-mcp-server
docker rm penpot-mcp-server
```

#### Quick Start with Node.js

```bash
# Using npm script
npm run dev:http

# Or with environment variable
TRANSPORT=http node dist/index.js

# With custom port
TRANSPORT=http HTTP_PORT=8080 node dist/index.js
```

#### Configuration Options

```bash
# Required
export PENPOT_ACCESS_TOKEN="your-access-token"

# Optional
export PENPOT_API_URL="https://design.penpot.app"  # Default
export HTTP_PORT="3000"                             # Default
export HTTP_HOST="0.0.0.0"                          # Default

# Security options
export ALLOWED_ORIGINS="https://example.com,https://app.example.com"
export ALLOWED_HOSTS="localhost,example.com"
export ENABLE_DNS_REBINDING_PROTECTION="true"
```

#### HTTP Endpoints

Once running, the server exposes:

- **MCP Endpoint**: `http://localhost:3000/mcp`
  - GET: Establish SSE stream for receiving messages
  - POST: Send JSON-RPC messages to the server
  - DELETE: Close session and cleanup

- **Health Check**: `http://localhost:3000/health`
  - Returns server status and active session count

#### Example HTTP Client Usage

```javascript
// Initialize connection (GET request)
const eventSource = new EventSource('http://localhost:3000/mcp');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};

// Send message (POST request)
fetch('http://localhost:3000/mcp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'mcp-session-id': sessionId, // From SSE endpoint response
  },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
  }),
});
```

#### Docker with HTTP Mode

```bash
# Using docker-compose
docker compose up -d

# Or with docker run
docker run -d \
  -e TRANSPORT=http \
  -e HTTP_PORT=3000 \
  -e PENPOT_ACCESS_TOKEN=your-token \
  -p 3000:3000 \
  penpot-mcp-server:latest
```

#### Security Considerations

When running in HTTP mode:

1. **Use HTTPS in production** - Run behind a reverse proxy (nginx, Caddy, etc.)
2. **Enable CORS restrictions** - Use `ALLOWED_ORIGINS` to restrict access
3. **Enable DNS rebinding protection** - Set `ENABLE_DNS_REBINDING_PROTECTION=true`
4. **Firewall rules** - Restrict access to trusted networks
5. **Token security** - Keep access tokens secure, rotate regularly

## Example Usage

Once connected, you can ask your AI assistant to:

- "Create a new design file for a mobile app landing page"
- "Add a rectangle with red fill at position 100,100"
- "Create a frame called 'Hero Section' and add some text inside"
- "List all shapes on the current page"
- "Move the rectangle to position 200,200 and make it 300x200"
- "Create a circle with blue stroke and no fill"

## API Architecture

This server uses Penpot's RPC API with the following structure:

- **Endpoint**: `https://design.penpot.app/api/rpc/command/<method-name>`
- **Authentication**: Bearer token via `Authorization: Token <token>`
- **Content-Type**: `application/json` or `application/transit+json`

## Testing

### ✅ Automated CI/CD Testing

**All tests run automatically on every push and pull request!**

The GitHub Actions workflow:

- 🧪 Runs comprehensive test suite (45 tests covering 76+ tools)
- ✅ Tests against external Penpot instance using penpot-test environment
- 🐳 Builds and validates Docker images (multi-arch)
- 📊 Uploads test results as artifacts

**Workflow:** `.github/workflows/docker.yml` → `integration-test` job

### Testing with External Penpot Instance

You can also test against a real Penpot instance:

1. Create a Penpot account at https://design.penpot.app
2. Generate an access token in Settings → Access Tokens
3. Set environment variables:

```bash
export PENPOT_API_URL="https://design.penpot.app"
export PENPOT_ACCESS_TOKEN="your-token-here"
```

4. Run tests:

```bash
# Run full test suite
npm test

# Or run with npx
npx tsx test-tools.ts
```

The test suite will:

- ✅ Test all 70+ MCP tools
- ✅ Create a test file with shapes
- ✅ Test components, comments, sharing
- ✅ Search functionality
- ✅ Verify all operations

See [TESTING.md](./TESTING.md) for detailed testing guide.

## Docker

### Quick Start with Docker

```bash
# Create .env file
echo "PENPOT_API_URL=https://design.penpot.app" > .env
echo "PENPOT_ACCESS_TOKEN=your-token" >> .env

# Run with Docker Compose
docker compose up -d

# View logs
docker compose logs -f

# Run tests
docker compose --profile test up penpot-mcp-test
```

### Build Docker Image

```bash
# Production image
docker build -t penpot-mcp-server:latest .

# Test image
docker build -f Dockerfile.test -t penpot-mcp-test:latest .
```

See [DOCKER.md](./DOCKER.md) for comprehensive Docker guide.

## Development

```bash
# Watch mode for development
npm run watch

# Run in development
npm run dev

# Run tests during development
npm test
```

## Contributing

We welcome contributions! Before submitting changes:

1. **Test GitHub Actions locally with [nektos/act](https://github.com/nektos/act)**

   ```bash
   # Install act
   brew install act  # macOS
   # or
   curl -s https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

   # Test workflows before pushing
   act -j build-and-test

   # Test with larger runner image
   act -P ubuntu-latest=catthehacker/ubuntu:act-latest
   ```

2. **Test Docker builds locally**

   ```bash
   docker build -t penpot-mcp-server:test .
   ```

3. **Run tests with local Penpot container**
   ```bash
   docker compose -f docker-compose.penpot.yml up -d
   docker compose -f docker-compose.penpot.yml --profile test up penpot-mcp-test
   ```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for complete development guide including:

- Setting up development environment
- Testing workflows with act
- Docker build testing
- Code style guidelines
- Pull request process

## Penpot API Coverage

This server implements tools based on Penpot's 25 RPC command modules:

| Module                   | Coverage | Tools                                                         |
| ------------------------ | -------- | ------------------------------------------------------------- |
| ✅ files.clj             | Full     | create_file, get_file, list_files, rename_file, delete_file   |
| ✅ files_create.clj      | Full     | create_file                                                   |
| ✅ files_update.clj      | Full     | All shape/page manipulation via update-file RPC               |
| ✅ projects.clj          | Full     | list_projects, create_project, update_project, delete_project |
| ✅ teams.clj             | Full     | list_teams, create_team, update_team, delete_team             |
| ✅ teams_invitations.clj | Partial  | invite_team_member                                            |
| ✅ files_share.clj       | Full     | create_share_link, list_share_links, delete_share_link        |
| ✅ comments.clj          | Full     | All comment and thread operations                             |
| ✅ media.clj             | Full     | upload_file_media, list_file_media, delete, clone             |
| ✅ fonts.clj             | Full     | Upload fonts, list, update, delete font variants              |
| ✅ webhooks.clj          | Full     | Create, list, update, delete webhooks                         |
| ✅ search.clj            | Full     | Search files, projects, shapes, components                    |
| ✅ profile.clj           | Partial  | get_profile, update_profile, recent files, permissions        |
| ❌ auth.clj              | N/A      | Authentication handled via access token                       |
| ❌ profile.clj           | N/A      | User profile management                                       |
| ❌ audit.clj             | N/A      | Admin-only audit logs                                         |
| ❌ viewer.clj            | N/A      | View-only operations                                          |

**Legend**: ✅ Implemented | ⚠️ Partial/Planned | ❌ Not applicable for MCP use case

## New in v1.0.0 - Complete API Coverage! 🎉

Version 1.0.0 brings **full implementation** of all previously partial features:

### ✨ Media Upload (Full Implementation)

- **File Upload**: Upload images from local file system
- **URL Import**: Import images directly from URLs
- **Format Support**: PNG, JPG, SVG, GIF, WEBP
- **Management**: Delete and clone media objects
- Real multipart/form-data upload support

### 🔤 Font Management (Full Implementation)

- **Upload Fonts**: TTF, OTF, WOFF, WOFF2 formats
- **Font Families**: Manage multiple font families per team
- **Font Variants**: Multiple weights and styles
- **Team Fonts**: Shared font libraries across team

### 🔔 Webhooks (Full Implementation)

- **Event Notifications**: file:created, file:updated, comment:created, etc.
- **HTTPS Endpoints**: Secure webhook delivery
- **Management**: Create, update, delete, list webhooks
- **Status Control**: Enable/disable webhooks

### 🔍 Search (Full Implementation)

- **File Search**: Search across all projects
- **Project Search**: Find projects by name
- **Shape Search**: Find shapes within files by name/type
- **Component Search**: Locate components in libraries
- **Advanced Search**: Multi-resource type searches

### 💬 Enhanced Comments (Full Implementation)

- **Thread Management**: Create, delete, resolve threads
- **Comment Operations**: Add, update, delete comments
- **Position Tracking**: Comments tied to specific locations
- **Resolution Status**: Mark threads as resolved/unresolved

### 👤 Profile & Statistics (New)

- **User Profile**: Get and update user settings
- **Recent Files**: Access history tracking
- **Permissions**: Check file access levels
- **Team Stats**: Project, file, and member counts

### 📈 Coverage Summary

- **19/25 RPC modules** implemented (76% coverage)
- **70+ MCP tools** (up from 50+)
- **25+ new tools** added in v1.0.0
- All major Penpot features now accessible via AI

## License

MIT

### Third-Party Code and Attributions

#### OpenAPI Specification

This project uses the Penpot OpenAPI specification from `https://design.penpot.app/api/openapi.json`.

The `openapi.json` file in this repository is maintained for version control purposes to track changes in the Penpot API over time. The copyright for the OpenAPI specification remains with the Penpot project and its contributors.

#### Generated Code

The `src/generated/` directory contains TypeScript client code automatically generated from the Penpot OpenAPI specification using [@hey-api/openapi-ts](https://github.com/hey-api/openapi-ts) (MIT License).

#### API Type Definitions

The type definitions in `src/types.ts` are based on Penpot's RPC API structure and were created by analyzing the Penpot API responses and behavior.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
