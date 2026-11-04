# Penpot MCP Server - Testing Guide

This document explains how to test all features of the Penpot MCP server.

## 🔑 1. Generating Penpot Access Token

### Method 1: Generate from Penpot Website

1. **Log in to Penpot**
   - Visit https://design.penpot.app
   - Create a free account if you don't have one

2. **Navigate to Settings**
   - Click profile icon in top right
   - Select "Settings"

3. **Generate Access Token**
   - Select "Access Tokens" from left menu
   - Click "Create new token" button
   - Enter token name (e.g., "MCP Server Test")
   - Choose expiration period (30 days recommended for testing)
   - Click "Create"

4. **Copy Token**
   - Copy the generated token to a safe place
   - ⚠️ You won't be able to see this token again, so save it carefully!

### Method 2: Self-hosted Penpot Instance

If using self-hosted Penpot:

**Important:** Due to Cloudflare security restrictions on the public Penpot instance, you may need to use a self-hosted server for API access.

1. **Enable access token support** in your Penpot server configuration:

   ```yaml
   # docker-compose.yml or penpot-config.env
   environment:
     - PENPOT_FLAGS=...enable-access-tokens
   ```

   If you have other flags, add `enable-access-tokens` to the list:

   ```yaml
   # Example with multiple flags
   - PENPOT_FLAGS=enable-registration enable-login enable-access-tokens
   ```

2. **Restart your Penpot server** to apply the changes

3. **Confirm instance URL** (e.g., `https://penpot.mycompany.com`)

4. **Generate access token** using the same method as Method 1 above

## 🧪 2. Running Tests

### Set Environment Variables

```bash
# Linux/macOS
export PENPOT_API_URL="https://design.penpot.app"
export PENPOT_ACCESS_TOKEN="your-token-here"

# Windows (PowerShell)
$env:PENPOT_API_URL="https://design.penpot.app"
$env:PENPOT_ACCESS_TOKEN="your-token-here"

# Windows (CMD)
set PENPOT_API_URL=https://design.penpot.app
set PENPOT_ACCESS_TOKEN=your-token-here
```

### Run Test Script

```bash
# Run directly with TypeScript
npx tsx test-tools.ts

# Or build and run
npm run build
node dist/test-tools.js
```

## 📋 3. Test Items

The automated test script tests the following features:

### ✅ Profile & Basic Info

- [x] Get user profile
- [x] List teams
- [x] List projects

### ✅ File Operations

- [x] Create test file
- [x] Get file details
- [x] List files in project

### ✅ Page Operations

- [x] List pages
- [x] Add new page
- [x] Get page shapes

### ✅ Shape Creation

- [x] Create rectangle
- [x] Create circle
- [x] Create frame
- [x] Create text element

### ✅ Shape Manipulation

- [x] Update shape properties
- [x] List shapes on page
- [x] Delete shapes

### ✅ Component System

- [x] Create component from shape
- [x] List components

### ✅ Search Functionality

- [x] Search shapes by name
- [x] Search files by name

### ✅ Comments

- [x] Create comment thread
- [x] List comment threads

### ✅ Sharing

- [x] Create share link
- [x] List share links

### ⚠️ Media Upload (Manual Testing Required)

- [ ] Upload media from local file
- [x] List file media

### ⚠️ Font Upload (Manual Testing Required)

- [ ] Upload custom font
- [ ] List team fonts

### ⚠️ Webhooks (Manual Testing Required)

- [ ] Create webhook
- [ ] List webhooks

## 🧪 4. Manual Testing Guide

Some features require additional resources (image files, font files, etc.) and must be tested manually.

### Media Upload Test

```typescript
// 1. Prepare test image (PNG, JPG, SVG, etc.)
// 2. Request via Claude through MCP:

'Upload my local file /path/to/test-image.png';

// Or from URL:
'Fetch and upload the image from https://example.com/logo.png';
```

### Font Upload Test

```typescript
// 1. Prepare test font file (TTF, OTF, WOFF, etc.)
// 2. Request to Claude:

"Upload font file /path/to/font.ttf to team ID 'xxx'
Set font family name to 'My Custom Font' and weight to 400"
```

### Webhook Test

```typescript
// 1. Prepare webhook receiving server (e.g., use webhook.site)
// 2. Request to Claude:

"Create a webhook for team ID 'xxx'
Set URL to https://webhook.site/your-unique-id"

// 3. Edit a file in Penpot to trigger the webhook and verify
```

## 🔧 5. Troubleshooting

### Authentication Error

```
Error: Penpot API error (401): Unauthorized
```

**Solution:**

- Verify access token is correct
- Check token hasn't expired
- Confirm environment variables are set correctly

### Resource Not Found

```
Error: Page xyz not found
```

**Solution:**

- Verify file ID and page ID are correct
- Query file information first with `get_file` to get valid page IDs

### File Upload Failure

```
Error: Upload failed (400): Invalid file type
```

**Solution:**

- Verify supported file formats
  - Images: PNG, JPG, SVG, GIF, WEBP
  - Fonts: TTF, OTF, WOFF, WOFF2
- Check file path is correct
- Verify file is not corrupted

### Network Error

```
Error: Request failed with status code 503
```

**Solution:**

- Check Penpot server status
- Verify internet connection
- For self-hosted, confirm server is running

## 📊 6. Test Results Example

Successful test execution result:

```
ℹ️ Testing Penpot MCP Server v1.0.0
ℹ️ API URL: https://design.penpot.app

📋 Testing Profile & Basic Info...
✅ Get profile
  Profile ID: abc123...
  Email: user@example.com

👥 Testing Teams & Projects...
✅ List teams
  Found 2 team(s)
  Using team: My Team (team-id-123)
✅ List projects
  Found 5 project(s)
  Using project: Test Project (proj-id-456)

📁 Testing File Operations...
✅ Create test file
  Created file: file-id-789
✅ Get file details
  File has 1 page(s)
  Using page: page-id-abc

📄 Testing Page Operations...
✅ List pages
  Found 1 page(s)
✅ Add new page

🎨 Testing Shape Creation...
✅ Create rectangle
  Created rectangle: shape-id-1
✅ Create circle
  Created circle: shape-id-2
✅ Create frame
  Created frame: shape-id-3
✅ Create text
  Created text: shape-id-4

✏️ Testing Shape Manipulation...
✅ Update shape
✅ Get page shapes
  Found 4 shape(s) on page

🧩 Testing Components...
✅ Create component
  Created component: comp-id-1
✅ List components

🔍 Testing Search...
✅ Search shapes
  Found 4 shapes matching "Test"
✅ Search files
  Found 3 files matching "MCP"

💬 Testing Comments...
✅ Create comment thread
✅ List comment threads
  Found 1 comment threads

🔗 Testing File Sharing...
✅ Create share link
✅ List share links

🖼️ Testing Media...
⚠️  Upload media from file (skipped: Requires local test image file)
✅ List file media

🧹 Cleanup...
✅ Delete test shapes
  Deleted 4 shape(s)

⚠️  Test file not deleted: file-id-789
   You can delete it manually from Penpot or run:
   delete_file({ fileId: "file-id-789" })

============================================================
📊 TEST SUMMARY
============================================================
✅ Passed:  25
❌ Failed:  0
⚠️  Skipped: 1
📁 Test File ID: file-id-789
============================================================
```

## 🎯 7. CI/CD Integration

To run tests in GitHub Actions or other CI/CD pipelines:

```yaml
# .github/workflows/test.yml
name: Test Penpot MCP Server

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npx tsx test-tools.ts
        env:
          PENPOT_API_URL: ${{ secrets.PENPOT_API_URL }}
          PENPOT_ACCESS_TOKEN: ${{ secrets.PENPOT_ACCESS_TOKEN }}
```

## 📝 8. Additional Information

- **Test Files**: After testing completes, you can view the test file in Penpot
- **Cleanup**: Test files are not automatically deleted, so delete them manually
- **Limitations**: Consider Penpot API rate limits when running tests
- **Security**: Never hardcode access tokens in code. Always use environment variables

## 🆘 9. Getting Help

If you encounter problems:

1. Check the "Troubleshooting" section in this document
2. Report issues on GitHub Issues
3. Visit Penpot community forum: https://community.penpot.app
