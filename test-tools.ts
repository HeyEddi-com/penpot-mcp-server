#!/usr/bin/env node
/**
 * Penpot MCP Server Test Suite
 * Tests all tools with a real Penpot instance
 */

import { execSync } from 'child_process';
import { PenpotClient } from './src/penpot-client.js';
import { createFileTools } from './src/tools/file-tools.js';
import { createPageTools } from './src/tools/page-tools.js';
import { createPageAdvancedTools } from './src/tools/page-advanced-tools.js';
import { createShapeTools } from './src/tools/shape-tools.js';
import { createComponentTools } from './src/tools/component-tools.js';
import { createTeamTools } from './src/tools/team-tools.js';
import { createShareTools } from './src/tools/share-tools.js';
import { createCommentTools } from './src/tools/comment-tools.js';
import { createMediaTools } from './src/tools/media-tools.js';
import { createFontTools } from './src/tools/font-tools.js';
import { createSearchTools } from './src/tools/search-tools.js';
import { createProfileTools } from './src/tools/profile-tools.js';
import { createSnapshotTools } from './src/tools/snapshot-tools.js';
import { createLibraryTools } from './src/tools/library-tools.js';

// Test state
const testState = {
  teamId: '',
  projectId: '',
  fileId: '',
  pageId: '',
  shapeIds: [] as string[],
  componentId: '',
  mediaId: '',
  snapshotId: '',
  passed: 0,
  failed: 0,
  skipped: 0,
};

// Helper functions
function log(message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') {
  const symbols = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warn: '⚠️',
  };
  console.log(`${symbols[type]} ${message}`);
}

async function runTest(name: string, testFn: () => Promise<void>) {
  try {
    await testFn();
    testState.passed++;
    log(`${name}`, 'success');
  } catch (error) {
    testState.failed++;
    log(`${name}: ${error}`, 'error');
  }
}

async function skipTest(name: string, reason: string) {
  testState.skipped++;
  log(`${name} (skipped: ${reason})`, 'warn');
}

function getGitInfo(): { date: string; hash: string; tag?: string } {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  let hash = '';
  let tag: string | undefined;

  try {
    // Get short commit hash (7 characters)
    hash = execSync('git rev-parse --short=7 HEAD', { encoding: 'utf-8' }).trim();

    // Try to get current tag if exists
    try {
      tag = execSync('git describe --tags --exact-match HEAD 2>/dev/null', {
        encoding: 'utf-8',
      }).trim();
    } catch {
      // No tag on current commit, ignore
    }
  } catch {
    // Not in a git repository or git not available
    hash = 'nogit';
  }

  return { date, hash, tag };
}

function generateTestPrefix(): string {
  const { date, hash, tag } = getGitInfo();
  if (tag) {
    return `delme: ${date} ${tag} (${hash})`;
  }
  return `delme: ${date} (${hash})`;
}

// Main test suite
async function runTests() {
  const apiUrl = process.env.PENPOT_API_URL || 'https://design.penpot.app';
  const accessToken = process.env.PENPOT_ACCESS_TOKEN;

  if (!accessToken) {
    log('PENPOT_ACCESS_TOKEN environment variable is required', 'error');
    log(
      'Please create an access token at: https://design.penpot.app/settings/access-tokens',
      'info'
    );
    process.exit(1);
  }

  log(`Testing Penpot MCP Server v1.0.0`, 'info');
  log(`API URL: ${apiUrl}`, 'info');
  log('', 'info');

  const client = new PenpotClient({ apiUrl, accessToken });

  // Initialize all tools
  const fileTools = createFileTools(client);
  const pageTools = createPageTools(client);
  const pageAdvancedTools = createPageAdvancedTools(client);
  const shapeTools = createShapeTools(client);
  const componentTools = createComponentTools(client);
  const teamTools = createTeamTools(client);
  const shareTools = createShareTools(client);
  const commentTools = createCommentTools(client);
  const mediaTools = createMediaTools(client);
  const fontTools = createFontTools(client);
  const searchTools = createSearchTools(client);
  const profileTools = createProfileTools(client);
  const snapshotTools = createSnapshotTools(client);
  const libraryTools = createLibraryTools(client);

  // ============================================================================
  // 1. PROFILE & BASIC INFO
  // ============================================================================
  log('\n📋 Testing Profile & Basic Info...', 'info');

  await runTest('Get profile', async () => {
    const result = await profileTools.get_profile.handler({});
    const profile = JSON.parse(result.content[0].text);
    if (!profile.id) throw new Error('No profile ID returned');
    log(`  Profile ID: ${profile.id}`, 'info');
    log(`  Email: ${profile.email}`, 'info');
  });

  // ============================================================================
  // 2. TEAMS & PROJECTS
  // ============================================================================
  log('\n👥 Testing Teams & Projects...', 'info');

  await runTest('List teams', async () => {
    const result = await teamTools.list_teams.handler({});
    const teams = JSON.parse(result.content[1].text);
    if (!Array.isArray(teams) || teams.length === 0) {
      throw new Error('No teams found');
    }
    testState.teamId = teams[0].id;
    log(`  Found ${teams.length} team(s)`, 'info');
    log(`  Using team: ${teams[0].name} (${testState.teamId})`, 'info');
  });

  await runTest('Get team details', async () => {
    const result = await teamTools.get_team.handler({ teamId: testState.teamId });
    const team = JSON.parse(result.content[1].text);
    if (!team.id || team.id !== testState.teamId) {
      throw new Error('Team details mismatch');
    }
    log(`  Team name: ${team.name}`, 'info');
  });

  await runTest('Get team stats', async () => {
    const result = await teamTools.get_team_stats.handler({ teamId: testState.teamId });
    const stats = JSON.parse(result.content[1].text);
    log(`  Team statistics retrieved`, 'info');
  });

  await runTest('Get team members', async () => {
    const result = await teamTools.get_team_members.handler({ teamId: testState.teamId });
    const text = result.content[0].text;
    log(`  ${text}`, 'info');
  });

  await runTest('Get team invitations', async () => {
    const result = await teamTools.get_team_invitations.handler({ teamId: testState.teamId });
    const text = result.content[0].text;
    log(`  ${text}`, 'info');
  });

  await runTest('Get team shared files', async () => {
    const result = await teamTools.get_team_shared_files.handler({ teamId: testState.teamId });
    const text = result.content[0].text;
    log(`  ${text}`, 'info');
  });

  await runTest('Get team recent files', async () => {
    const result = await teamTools.get_team_recent_files.handler({ teamId: testState.teamId });
    const text = result.content[0].text;
    log(`  ${text}`, 'info');
  });

  await runTest('List projects', async () => {
    const result = await teamTools.list_projects.handler({ teamId: testState.teamId });
    const projects = JSON.parse(result.content[1].text);
    if (!Array.isArray(projects) || projects.length === 0) {
      throw new Error('No projects found');
    }
    testState.projectId = projects[0].id;
    log(`  Found ${projects.length} project(s)`, 'info');
    log(`  Using project: ${projects[0].name} (${testState.projectId})`, 'info');
  });

  // ============================================================================
  // 3. FILE OPERATIONS
  // ============================================================================
  log('\n📁 Testing File Operations...', 'info');

  await runTest('Create test file', async () => {
    const prefix = generateTestPrefix();
    const result = await fileTools.create_file.handler({
      projectId: testState.projectId,
      name: `${prefix} - MCP Test File`,
    });
    const text = result.content.map((c: any) => c.text).join('\n');
    const match = text.match(/ID:\s*([a-f0-9-]+)/i);
    if (!match) throw new Error('No file ID in response');
    testState.fileId = match[1];
    log(`  Created file: ${testState.fileId}`, 'info');
  });

  await runTest('Get file details', async () => {
    const result = await fileTools.get_file.handler({ fileId: testState.fileId });
    const file = JSON.parse(result.content[1].text);
    if (!file.data?.pages || file.data.pages.length === 0) {
      throw new Error('File has no pages');
    }
    testState.pageId = file.data.pages[0];
    log(`  File has ${file.data.pages.length} page(s)`, 'info');
    log(`  Using page: ${testState.pageId}`, 'info');
  });

  await runTest('List files in project', async () => {
    const result = await fileTools.list_files.handler({ projectId: testState.projectId });
    const files = JSON.parse(result.content[1].text);
    if (!Array.isArray(files)) throw new Error('Invalid files response');
    log(`  Found ${files.length} file(s) in project`, 'info');
  });

  // ============================================================================
  // 4. PAGE OPERATIONS
  // ============================================================================
  log('\n📄 Testing Page Operations...', 'info');

  await runTest('List pages', async () => {
    const result = await pageTools.list_pages.handler({ fileId: testState.fileId });
    const pages = JSON.parse(result.content[1].text);
    if (!Array.isArray(pages) || pages.length === 0) {
      throw new Error('No pages found');
    }
    log(`  Found ${pages.length} page(s)`, 'info');
  });

  await runTest('Add new page', async () => {
    const result = await pageTools.add_page.handler({
      fileId: testState.fileId,
      name: 'Test Page 2',
    });
    const text = result.content[0].text;
    if (!text.includes('Added page')) {
      throw new Error('Page creation failed');
    }
    log(`  ${text}`, 'info');
  });

  // ============================================================================
  // 5. SHAPE CREATION
  // ============================================================================
  log('\n🎨 Testing Shape Creation...', 'info');

  await runTest('Create rectangle', async () => {
    const result = await shapeTools.create_rectangle.handler({
      fileId: testState.fileId,
      pageId: testState.pageId,
      name: 'Test Rectangle',
      x: 100,
      y: 100,
      width: 200,
      height: 150,
      fillColor: '#ff0000',
    });
    const text = result.content[0].text;
    const match = text.match(/ID:\s*([a-f0-9-]+)/i);
    if (!match) throw new Error('No shape ID in response');
    testState.shapeIds.push(match[1]);
    log(`  Created rectangle: ${match[1]}`, 'info');
  });

  await runTest('Create circle', async () => {
    const result = await shapeTools.create_circle.handler({
      fileId: testState.fileId,
      pageId: testState.pageId,
      name: 'Test Circle',
      x: 350,
      y: 100,
      width: 100,
      height: 100,
      fillColor: '#00ff00',
    });
    const text = result.content[0].text;
    const match = text.match(/ID:\s*([a-f0-9-]+)/i);
    if (!match) throw new Error('No shape ID in response');
    testState.shapeIds.push(match[1]);
    log(`  Created circle: ${match[1]}`, 'info');
  });

  await runTest('Create frame', async () => {
    const result = await shapeTools.create_frame.handler({
      fileId: testState.fileId,
      pageId: testState.pageId,
      name: 'Test Frame',
      x: 500,
      y: 100,
      width: 300,
      height: 400,
      fillColor: '#f0f0f0',
    });
    const text = result.content[0].text;
    const match = text.match(/ID:\s*([a-f0-9-]+)/i);
    if (!match) throw new Error('No shape ID in response');
    testState.shapeIds.push(match[1]);
    log(`  Created frame: ${match[1]}`, 'info');
  });

  await runTest('Create text', async () => {
    const result = await shapeTools.create_text.handler({
      fileId: testState.fileId,
      pageId: testState.pageId,
      name: 'Test Text',
      content: 'Hello Penpot MCP!',
      x: 100,
      y: 300,
      fillColor: '#000000',
    });
    const text = result.content[0].text;
    const match = text.match(/ID:\s*([a-f0-9-]+)/i);
    if (!match) throw new Error('No shape ID in response');
    testState.shapeIds.push(match[1]);
    log(`  Created text: ${match[1]}`, 'info');
  });

  // ============================================================================
  // 6. SHAPE MANIPULATION
  // ============================================================================
  log('\n✏️ Testing Shape Manipulation...', 'info');

  await runTest('Update shape', async () => {
    const result = await pageAdvancedTools.update_shape.handler({
      fileId: testState.fileId,
      pageId: testState.pageId,
      shapeId: testState.shapeIds[0],
      x: 150,
      y: 150,
      width: 250,
    });
    const text = result.content[0].text;
    if (!text.includes('Updated shape')) {
      throw new Error('Shape update failed');
    }
  });

  await runTest('Get page shapes', async () => {
    const result = await pageAdvancedTools.get_page_shapes.handler({
      fileId: testState.fileId,
      pageId: testState.pageId,
    });
    const shapes = JSON.parse(result.content[1].text);
    if (!Array.isArray(shapes) || shapes.length < 3) {
      throw new Error(`Expected at least 3 shapes, got ${shapes.length}`);
    }
    log(`  Found ${shapes.length} shape(s) on page`, 'info');
  });

  await runTest('Update text shape with alignment and font properties', async () => {
    // Find text shape ID (should be the 4th shape created)
    const textShapeId = testState.shapeIds[3];
    const result = await pageAdvancedTools.update_shape.handler({
      fileId: testState.fileId,
      pageId: testState.pageId,
      shapeId: textShapeId,
      fontSize: 24,
      textAlign: 'center',
      fontWeight: 'bold',
      fontStyle: 'italic',
      letterSpacing: 2,
    });
    const text = result.content[0].text;
    if (!text.includes('Updated shape')) {
      throw new Error('Text shape update failed');
    }
    log(`  Updated text shape with alignment and font properties`, 'info');
  });

  await runTest('Get shape properties', async () => {
    const result = await pageAdvancedTools.get_shape_properties.handler({
      fileId: testState.fileId,
      pageId: testState.pageId,
      shapeId: testState.shapeIds[0],
    });
    const props = JSON.parse(result.content[1].text);
    if (!props.id || !props.type) {
      throw new Error('Invalid shape properties');
    }
    log(`  Retrieved properties for ${props.type} shape: ${props.name}`, 'info');
  });

  await runTest('Query shapes - filter by type', async () => {
    const result = await pageAdvancedTools.query_shapes.handler({
      fileId: testState.fileId,
      pageId: testState.pageId,
      types: ['rectangle', 'circle'],
      fields: ['position', 'colors'],
    });
    const shapes = JSON.parse(result.content[1].text);
    if (!Array.isArray(shapes)) {
      throw new Error('Invalid query result');
    }
    log(`  Found ${shapes.length} shape(s) matching type filter`, 'info');
  });

  await runTest('Query shapes - filter by color', async () => {
    const result = await pageAdvancedTools.query_shapes.handler({
      fileId: testState.fileId,
      pageId: testState.pageId,
      fillColor: '#ff0000',
      fields: ['position', 'colors'],
    });
    const shapes = JSON.parse(result.content[1].text);
    if (!Array.isArray(shapes)) {
      throw new Error('Invalid query result');
    }
    log(`  Found ${shapes.length} red shape(s)`, 'info');
  });

  await runTest('Query shapes - filter by area', async () => {
    const result = await pageAdvancedTools.query_shapes.handler({
      fileId: testState.fileId,
      pageId: testState.pageId,
      minX: 100,
      maxX: 400,
      minY: 100,
      maxY: 300,
      fields: ['position'],
    });
    const shapes = JSON.parse(result.content[1].text);
    if (!Array.isArray(shapes)) {
      throw new Error('Invalid query result');
    }
    log(`  Found ${shapes.length} shape(s) in specified area`, 'info');
  });

  await runTest('Query shapes - text shapes with all fields', async () => {
    const result = await pageAdvancedTools.query_shapes.handler({
      fileId: testState.fileId,
      pageId: testState.pageId,
      types: ['text'],
      fields: ['all'],
    });
    const shapes = JSON.parse(result.content[1].text);
    if (!Array.isArray(shapes)) {
      throw new Error('Invalid query result');
    }
    if (shapes.length > 0 && shapes[0].text) {
      log(
        `  Found ${shapes.length} text shape(s) with properties: fontSize=${shapes[0].text.fontSize}`,
        'info'
      );
    } else {
      log(`  Found ${shapes.length} text shape(s)`, 'info');
    }
  });

  await runTest('Query shapes - filter by text content', async () => {
    const result = await pageAdvancedTools.query_shapes.handler({
      fileId: testState.fileId,
      pageId: testState.pageId,
      textContent: 'Penpot',
      fields: ['text', 'position'],
    });
    const shapes = JSON.parse(result.content[1].text);
    if (!Array.isArray(shapes)) {
      throw new Error('Invalid query result');
    }
    log(`  Found ${shapes.length} shape(s) containing "Penpot"`, 'info');
  });

  // ============================================================================
  // 7. COMPONENT SYSTEM
  // ============================================================================
  log('\n🧩 Testing Components...', 'info');

  await runTest('Create component', async () => {
    const result = await componentTools.create_component.handler({
      fileId: testState.fileId,
      pageId: testState.pageId,
      shapeId: testState.shapeIds[0],
      name: 'Test Component',
    });
    const text = result.content[0].text;
    const match = text.match(/ID:\s*([a-f0-9-]+)/i);
    if (!match) throw new Error('No component ID in response');
    testState.componentId = match[1];
    log(`  Created component: ${match[1]}`, 'info');
  });

  await runTest('List components', async () => {
    const result = await componentTools.list_components.handler({
      fileId: testState.fileId,
    });
    // Components are in the file data structure
    log(`  Component listing executed`, 'info');
  });

  // ============================================================================
  // 8. SEARCH FUNCTIONALITY
  // ============================================================================
  log('\n🔍 Testing Search...', 'info');

  await runTest('Search shapes', async () => {
    const result = await searchTools.search_shapes.handler({
      fileId: testState.fileId,
      query: 'Test',
    });
    const text = result.content[0].text;
    if (!text.includes('Found')) {
      throw new Error('Search failed');
    }
    log(`  ${text}`, 'info');
  });

  await runTest('Search files', async () => {
    const result = await searchTools.search_files.handler({
      projectId: testState.projectId,
      query: 'MCP',
    });
    const text = result.content[0].text;
    log(`  ${text}`, 'info');
  });

  // ============================================================================
  // 9. COMMENTS
  // ============================================================================
  log('\n💬 Testing Comments...', 'info');

  await runTest('Create comment thread', async () => {
    // Use the frame shape as the comment frame (3rd shape = index 2)
    const frameId = testState.shapeIds[2];
    const result = await commentTools.create_comment_thread.handler({
      fileId: testState.fileId,
      pageId: testState.pageId,
      frameId: frameId,
      content: 'This is a test comment',
      position: { x: 100, y: 100 },
    });
    const text = result.content.map((c: any) => c.text).join('\n');
    if (!text.includes('successfully') && !text.includes('Created')) {
      throw new Error('Comment creation failed');
    }
    log(`  Comment thread created`, 'info');
  });

  await runTest('List comment threads', async () => {
    const result = await commentTools.list_comment_threads.handler({
      fileId: testState.fileId,
    });
    const text = result.content[0].text;
    log(`  ${text}`, 'info');
  });

  // ============================================================================
  // 10. SHARING
  // ============================================================================
  log('\n🔗 Testing File Sharing...', 'info');

  await runTest('Create share link', async () => {
    const result = await shareTools.create_share_link.handler({
      fileId: testState.fileId,
      whoComment: 'team',
      whoInspect: 'all',
      pages: [], // Empty array = all pages
    });
    const text = result.content.map((c: any) => c.text).join('\n');
    if (!text.includes('Created')) {
      throw new Error('Share link creation failed');
    }
    log(`  Share link created`, 'info');
  });

  // Note: list_share_links API does not exist in Penpot API
  // Removed test as there is no API endpoint for listing share links

  // ============================================================================
  // 11. MEDIA UPLOAD (requires test image)
  // ============================================================================
  log('\n🖼️ Testing Media...', 'info');

  await skipTest('Upload media from file', 'Requires local test image file');

  await runTest('List file media', async () => {
    const result = await mediaTools.list_file_media.handler({
      fileId: testState.fileId,
    });
    // Just check it executed
    log(`  Media listing executed`, 'info');
  });

  // ============================================================================
  // 12. FILE SNAPSHOTS (VERSION MANAGEMENT)
  // ============================================================================
  log('\n📸 Testing File Snapshots...', 'info');

  await runTest('Create file snapshot', async () => {
    const result = await snapshotTools.create_file_snapshot.handler({
      fileId: testState.fileId,
      label: 'Test snapshot before cleanup',
    });
    const text = result.content.map((c: any) => c.text).join('\n');
    // Try to extract snapshot ID from the response
    const jsonMatch = text.match(/\{[\s\S]*"id":\s*"([a-f0-9-]+)"[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      testState.snapshotId = data.id;
      log(`  Created snapshot: ${testState.snapshotId}`, 'info');
    }
  });

  await runTest('List file snapshots', async () => {
    const result = await snapshotTools.list_file_snapshots.handler({
      fileId: testState.fileId,
    });
    const text = result.content[0].text;
    log(`  ${text}`, 'info');
  });

  if (testState.snapshotId) {
    await runTest('Update snapshot label', async () => {
      const result = await snapshotTools.update_file_snapshot.handler({
        snapshotId: testState.snapshotId,
        label: 'Updated test snapshot',
      });
      const text = result.content[0].text;
      log(`  ${text}`, 'info');
    });

    await runTest('Lock snapshot', async () => {
      const result = await snapshotTools.lock_file_snapshot.handler({
        snapshotId: testState.snapshotId,
      });
      const text = result.content[0].text;
      log(`  ${text}`, 'info');
    });

    await runTest('Unlock snapshot', async () => {
      const result = await snapshotTools.unlock_file_snapshot.handler({
        snapshotId: testState.snapshotId,
      });
      const text = result.content[0].text;
      log(`  ${text}`, 'info');
    });

    await runTest('Delete snapshot', async () => {
      const result = await snapshotTools.delete_file_snapshot.handler({
        snapshotId: testState.snapshotId,
      });
      const text = result.content[0].text;
      log(`  ${text}`, 'info');
    });
  } else {
    await skipTest('Update/Lock/Unlock/Delete snapshot', 'No snapshot ID available');
  }

  // ============================================================================
  // 13. COMPONENT LIBRARIES
  // ============================================================================
  log('\n📚 Testing Component Libraries...', 'info');

  await runTest('Check if file has libraries', async () => {
    const result = await libraryTools.has_file_libraries.handler({
      fileId: testState.fileId,
    });
    const text = result.content[0].text;
    log(`  ${text}`, 'info');
  });

  await runTest('Get file libraries', async () => {
    const result = await libraryTools.get_file_libraries.handler({
      fileId: testState.fileId,
    });
    const text = result.content[0].text;
    log(`  ${text}`, 'info');
  });

  await skipTest('Link/unlink library operations', 'Requires separate library file setup');

  // ============================================================================
  // 14. CUSTOM FONTS
  // ============================================================================
  log('\n🔤 Testing Custom Fonts...', 'info');

  await runTest('List font variants for team', async () => {
    const result = await fontTools.list_font_variants.handler({
      teamId: testState.teamId,
    });
    const text = result.content[0].text;
    log(`  ${text}`, 'info');
  });

  await skipTest('Create/update/delete font operations', 'Requires font file data upload');

  // ============================================================================
  // 15. CLEANUP (optional)
  // ============================================================================
  log('\n🧹 Cleanup...', 'info');

  await runTest('Delete test shapes', async () => {
    for (const shapeId of testState.shapeIds) {
      await pageAdvancedTools.delete_shape.handler({
        fileId: testState.fileId,
        pageId: testState.pageId,
        shapeId,
      });
    }
    log(`  Deleted ${testState.shapeIds.length} shape(s)`, 'info');
  });

  // Note: Keeping the file for manual inspection
  log(`\n⚠️  Test file not deleted: ${testState.fileId}`, 'warn');
  log(`   You can delete it manually from Penpot or run:`, 'info');
  log(`   delete_file({ fileId: "${testState.fileId}" })`, 'info');

  // ============================================================================
  // SUMMARY
  // ============================================================================
  log('\n' + '='.repeat(60), 'info');
  log('📊 TEST SUMMARY', 'info');
  log('='.repeat(60), 'info');
  log(`✅ Passed:  ${testState.passed}`, 'success');
  log(`❌ Failed:  ${testState.failed}`, testState.failed > 0 ? 'error' : 'info');
  log(`⚠️  Skipped: ${testState.skipped}`, 'warn');
  log(`📁 Test File ID: ${testState.fileId}`, 'info');
  log('='.repeat(60), 'info');

  if (testState.failed > 0) {
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  log(`Fatal error: ${error}`, 'error');
  process.exit(1);
});
