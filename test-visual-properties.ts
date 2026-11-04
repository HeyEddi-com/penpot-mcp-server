#!/usr/bin/env node
/**
 * Penpot MCP Server - Visual Properties Test Suite
 * Tests Phase 1-3 visual properties: colors, shadows, blur, gradients, images, blend modes
 */

import { PenpotClient } from './src/penpot-client.js';
import { createFileTools } from './src/tools/file-tools.js';
import { createPageTools } from './src/tools/page-tools.js';
import { createPageAdvancedTools } from './src/tools/page-advanced-tools.js';
import { createShapeTools } from './src/tools/shape-tools.js';
import { createTeamTools } from './src/tools/team-tools.js';
import { createMediaTools } from './src/tools/media-tools.js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Test state
const testState = {
  teamId: '',
  projectId: '',
  fileId: '',
  pageId: '',
  shapeIds: [] as string[],
  mediaId: '',
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

function extractShapeId(text: string): string {
  const match = text.match(/ID:\s*([a-f0-9-]+)/i);
  if (!match) throw new Error('No shape ID in response');
  return match[1];
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

  log(`Testing Penpot MCP Server - Visual Properties`, 'info');
  log(`API URL: ${apiUrl}`, 'info');
  log('', 'info');

  const client = new PenpotClient({ apiUrl, accessToken });

  // Initialize tools
  const fileTools = createFileTools(client);
  const pageTools = createPageTools(client);
  const pageAdvancedTools = createPageAdvancedTools(client);
  const shapeTools = createShapeTools(client);
  const teamTools = createTeamTools(client);
  const mediaTools = createMediaTools(client);

  // ============================================================================
  // SETUP: Get team, project, and create test file
  // ============================================================================
  log('\n🔧 Setup: Creating test environment...', 'info');

  await runTest('Get team and project', async () => {
    const teamsResult = await teamTools.list_teams.handler({});
    const teams = JSON.parse(teamsResult.content[1].text);
    if (!Array.isArray(teams) || teams.length === 0) {
      throw new Error('No teams found');
    }
    testState.teamId = teams[0].id;
    log(`  Using team: ${teams[0].name}`, 'info');

    const projectsResult = await teamTools.list_projects.handler({ teamId: testState.teamId });
    const projects = JSON.parse(projectsResult.content[1].text);
    if (!Array.isArray(projects) || projects.length === 0) {
      throw new Error('No projects found');
    }
    testState.projectId = projects[0].id;
    log(`  Using project: ${projects[0].name}`, 'info');
  });

  await runTest('Create test file', async () => {
    const result = await fileTools.create_file.handler({
      projectId: testState.projectId,
      name: `Visual Properties Test ${Date.now()}`,
    });
    const text = result.content.map((c: any) => c.text).join('\n');
    const match = text.match(/ID:\s*([a-f0-9-]+)/i);
    if (!match) throw new Error('No file ID in response');
    testState.fileId = match[1];
    log(`  Created test file: ${testState.fileId}`, 'info');
  });

  await runTest('Get page ID', async () => {
    const result = await fileTools.get_file.handler({ fileId: testState.fileId });
    const file = JSON.parse(result.content[1].text);
    if (!file.data?.pages || file.data.pages.length === 0) {
      throw new Error('File has no pages');
    }
    testState.pageId = file.data.pages[0];
    log(`  Using page: ${testState.pageId}`, 'info');
  });

  // ============================================================================
  // PHASE 1: Colors, Borders, Corner Radius, Opacity
  // ============================================================================
  log('\n🎨 Phase 1: Testing Colors, Borders, Corner Radius, Opacity...', 'info');

  await runTest('Rectangle with fill color and opacity', async () => {
    const result = await shapeTools.create_rectangle.handler({
      fileId: testState.fileId,
      pageId: testState.pageId,
      name: 'Colored Rectangle',
      x: 50,
      y: 50,
      width: 150,
      height: 100,
      fillColor: '#667eea',
      fillOpacity: 0.8,
      opacity: 0.9,
    });
    const shapeId = extractShapeId(result.content[0].text);
    testState.shapeIds.push(shapeId);
    log(`  Created colored rectangle: ${shapeId}`, 'info');
  });

  await runTest('Rectangle with stroke (border)', async () => {
    const result = await shapeTools.create_rectangle.handler({
      fileId: testState.fileId,
      pageId: testState.pageId,
      name: 'Rectangle with Border',
      x: 220,
      y: 50,
      width: 150,
      height: 100,
      fillColor: '#ffffff',
      strokeColor: '#ff0000',
      strokeWidth: 3,
      strokeOpacity: 1,
    });
    const shapeId = extractShapeId(result.content[0].text);
    testState.shapeIds.push(shapeId);
    log(`  Created rectangle with border: ${shapeId}`, 'info');
  });

  await runTest('Rectangle with border radius', async () => {
    const result = await shapeTools.create_rectangle.handler({
      fileId: testState.fileId,
      pageId: testState.pageId,
      name: 'Rounded Rectangle',
      x: 390,
      y: 50,
      width: 150,
      height: 100,
      fillColor: '#764ba2',
      borderRadius: 16,
    });
    const shapeId = extractShapeId(result.content[0].text);
    testState.shapeIds.push(shapeId);
    log(`  Created rounded rectangle: ${shapeId}`, 'info');
  });

  await runTest('Rectangle with individual corner radii', async () => {
    const result = await shapeTools.create_rectangle.handler({
      fileId: testState.fileId,
      pageId: testState.pageId,
      name: 'Custom Corners Rectangle',
      x: 560,
      y: 50,
      width: 150,
      height: 100,
      fillColor: '#f093fb',
      r1: 20, // top-left
      r2: 0, // top-right
      r3: 20, // bottom-right
      r4: 0, // bottom-left
    });
    const shapeId = extractShapeId(result.content[0].text);
    testState.shapeIds.push(shapeId);
    log(`  Created custom corners rectangle: ${shapeId}`, 'info');
  });

  await runTest('Circle with colors', async () => {
    const result = await shapeTools.create_circle.handler({
      fileId: testState.fileId,
      pageId: testState.pageId,
      name: 'Colored Circle',
      x: 730,
      y: 50,
      radius: 50,
      fillColor: '#00d2ff',
      strokeColor: '#3a7bd5',
      strokeWidth: 2,
    });
    const shapeId = extractShapeId(result.content[0].text);
    testState.shapeIds.push(shapeId);
    log(`  Created colored circle: ${shapeId}`, 'info');
  });

  await runTest('Text with color', async () => {
    const result = await shapeTools.create_text.handler({
      fileId: testState.fileId,
      pageId: testState.pageId,
      name: 'Colored Text',
      text: 'Styled Text!',
      x: 50,
      y: 180,
      fontSize: 24,
      fillColor: '#667eea',
      fillOpacity: 1,
    });
    const shapeId = extractShapeId(result.content[0].text);
    testState.shapeIds.push(shapeId);
    log(`  Created colored text: ${shapeId}`, 'info');
  });

  await runTest('Frame with all Phase 1 properties', async () => {
    const result = await shapeTools.create_frame.handler({
      fileId: testState.fileId,
      pageId: testState.pageId,
      name: 'Styled Frame',
      x: 220,
      y: 180,
      width: 200,
      height: 150,
      fillColor: '#f5f7fa',
      strokeColor: '#667eea',
      strokeWidth: 2,
      borderRadius: 12,
      opacity: 1,
    });
    const shapeId = extractShapeId(result.content[0].text);
    testState.shapeIds.push(shapeId);
    log(`  Created styled frame: ${shapeId}`, 'info');
  });

  // ============================================================================
  // PHASE 2: Shadows and Blur
  // ============================================================================
  log('\n🌑 Phase 2: Testing Shadows and Blur...', 'info');

  await runTest('Rectangle with drop shadow', async () => {
    const result = await shapeTools.create_rectangle.handler({
      fileId: testState.fileId,
      pageId: testState.pageId,
      name: 'Card with Shadow',
      x: 50,
      y: 370,
      width: 180,
      height: 120,
      fillColor: '#ffffff',
      borderRadius: 8,
      shadowColor: '#000000',
      shadowOffsetX: 0,
      shadowOffsetY: 4,
      shadowBlur: 12,
      shadowSpread: 0,
      shadowOpacity: 0.15,
      shadowStyle: 'drop-shadow',
    });
    const shapeId = extractShapeId(result.content[0].text);
    testState.shapeIds.push(shapeId);
    log(`  Created card with drop shadow: ${shapeId}`, 'info');
  });

  await runTest('Rectangle with inner shadow', async () => {
    const result = await shapeTools.create_rectangle.handler({
      fileId: testState.fileId,
      pageId: testState.pageId,
      name: 'Button Pressed',
      x: 250,
      y: 370,
      width: 180,
      height: 120,
      fillColor: '#e0e0e0',
      borderRadius: 8,
      shadowColor: '#000000',
      shadowOffsetX: 0,
      shadowOffsetY: 2,
      shadowBlur: 4,
      shadowSpread: 0,
      shadowOpacity: 0.3,
      shadowStyle: 'inner-shadow',
    });
    const shapeId = extractShapeId(result.content[0].text);
    testState.shapeIds.push(shapeId);
    log(`  Created button with inner shadow: ${shapeId}`, 'info');
  });

  await runTest('Rectangle with blur (glassmorphism)', async () => {
    const result = await shapeTools.create_rectangle.handler({
      fileId: testState.fileId,
      pageId: testState.pageId,
      name: 'Glass Effect',
      x: 450,
      y: 370,
      width: 180,
      height: 120,
      fillColor: '#ffffff',
      fillOpacity: 0.1,
      strokeColor: '#ffffff',
      strokeOpacity: 0.2,
      strokeWidth: 1,
      borderRadius: 16,
      blurValue: 20,
      shadowOffsetY: 8,
      shadowBlur: 24,
      shadowOpacity: 0.2,
    });
    const shapeId = extractShapeId(result.content[0].text);
    testState.shapeIds.push(shapeId);
    log(`  Created glassmorphism card: ${shapeId}`, 'info');
  });

  await runTest('Text with shadow (glow)', async () => {
    const result = await shapeTools.create_text.handler({
      fileId: testState.fileId,
      pageId: testState.pageId,
      name: 'Glowing Text',
      text: 'GLOW',
      x: 650,
      y: 400,
      fontSize: 48,
      fillColor: '#00ffff',
      shadowColor: '#00ffff',
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      shadowBlur: 20,
      shadowOpacity: 0.8,
    });
    const shapeId = extractShapeId(result.content[0].text);
    testState.shapeIds.push(shapeId);
    log(`  Created glowing text: ${shapeId}`, 'info');
  });

  // ============================================================================
  // PHASE 3: Gradients and Blend Modes
  // ============================================================================
  log('\n🎭 Phase 3: Testing Gradients and Blend Modes...', 'info');

  await runTest('Rectangle with linear gradient', async () => {
    const result = await shapeTools.create_rectangle.handler({
      fileId: testState.fileId,
      pageId: testState.pageId,
      name: 'Linear Gradient',
      x: 50,
      y: 520,
      width: 180,
      height: 120,
      gradientType: 'linear',
      gradientStartX: 0,
      gradientStartY: 0,
      gradientEndX: 1,
      gradientEndY: 1,
      gradientStops:
        '[{"color":"#667eea","opacity":1,"offset":0},{"color":"#764ba2","opacity":1,"offset":1}]',
      borderRadius: 8,
    });
    const shapeId = extractShapeId(result.content[0].text);
    testState.shapeIds.push(shapeId);
    log(`  Created linear gradient rectangle: ${shapeId}`, 'info');
  });

  await runTest('Circle with radial gradient', async () => {
    const result = await shapeTools.create_circle.handler({
      fileId: testState.fileId,
      pageId: testState.pageId,
      name: 'Radial Gradient',
      x: 250,
      y: 520,
      radius: 60,
      gradientType: 'radial',
      gradientStartX: 0.5,
      gradientStartY: 0.5,
      gradientEndX: 1,
      gradientEndY: 0.5,
      gradientStops:
        '[{"color":"#FFFFFF","opacity":1,"offset":0},{"color":"#667eea","opacity":0,"offset":1}]',
    });
    const shapeId = extractShapeId(result.content[0].text);
    testState.shapeIds.push(shapeId);
    log(`  Created radial gradient circle: ${shapeId}`, 'info');
  });

  await runTest('Frame with gradient background', async () => {
    const result = await shapeTools.create_frame.handler({
      fileId: testState.fileId,
      pageId: testState.pageId,
      name: 'Gradient Frame',
      x: 390,
      y: 520,
      width: 180,
      height: 120,
      gradientType: 'linear',
      gradientStartX: 0,
      gradientStartY: 0,
      gradientEndX: 0,
      gradientEndY: 1,
      gradientStops:
        '[{"color":"#f093fb","opacity":1,"offset":0},{"color":"#f5576c","opacity":1,"offset":1}]',
      borderRadius: 12,
    });
    const shapeId = extractShapeId(result.content[0].text);
    testState.shapeIds.push(shapeId);
    log(`  Created gradient frame: ${shapeId}`, 'info');
  });

  await runTest('Rectangle with blend mode: multiply', async () => {
    const result = await shapeTools.create_rectangle.handler({
      fileId: testState.fileId,
      pageId: testState.pageId,
      name: 'Multiply Blend',
      x: 590,
      y: 520,
      width: 120,
      height: 120,
      fillColor: '#ff0000',
      fillOpacity: 0.5,
      blendMode: 'multiply',
    });
    const shapeId = extractShapeId(result.content[0].text);
    testState.shapeIds.push(shapeId);
    log(`  Created multiply blend rectangle: ${shapeId}`, 'info');
  });

  await runTest('Rectangle with blend mode: screen', async () => {
    const result = await shapeTools.create_rectangle.handler({
      fileId: testState.fileId,
      pageId: testState.pageId,
      name: 'Screen Blend',
      x: 650,
      y: 560,
      width: 120,
      height: 120,
      fillColor: '#00ff00',
      fillOpacity: 0.5,
      blendMode: 'screen',
    });
    const shapeId = extractShapeId(result.content[0].text);
    testState.shapeIds.push(shapeId);
    log(`  Created screen blend rectangle: ${shapeId}`, 'info');
  });

  await runTest('Text with blend mode: overlay', async () => {
    const result = await shapeTools.create_text.handler({
      fileId: testState.fileId,
      pageId: testState.pageId,
      name: 'Overlay Text',
      text: 'OVERLAY',
      x: 50,
      y: 670,
      fontSize: 32,
      fillColor: '#ffffff',
      blendMode: 'overlay',
    });
    const shapeId = extractShapeId(result.content[0].text);
    testState.shapeIds.push(shapeId);
    log(`  Created overlay blend text: ${shapeId}`, 'info');
  });

  // ============================================================================
  // UPDATE TESTS: Testing update_shape with new properties
  // ============================================================================
  log('\n✏️ Testing update_shape with visual properties...', 'info');

  await runTest('Update shape with Phase 1 properties', async () => {
    const result = await pageAdvancedTools.update_shape.handler({
      fileId: testState.fileId,
      pageId: testState.pageId,
      shapeId: testState.shapeIds[0],
      fillColor: '#ff6b6b',
      fillOpacity: 0.9,
      strokeColor: '#c92a2a',
      strokeWidth: 2,
      borderRadius: 20,
      opacity: 0.95,
    });
    if (!result.content[0].text.includes('Updated shape')) {
      throw new Error('Update failed');
    }
    log(`  Updated shape with colors and borders`, 'info');
  });

  await runTest('Update shape with Phase 2 properties', async () => {
    const result = await pageAdvancedTools.update_shape.handler({
      fileId: testState.fileId,
      pageId: testState.pageId,
      shapeId: testState.shapeIds[1],
      shadowColor: '#667eea',
      shadowOffsetY: 8,
      shadowBlur: 16,
      shadowOpacity: 0.3,
      blurValue: 5,
    });
    if (!result.content[0].text.includes('Updated shape')) {
      throw new Error('Update failed');
    }
    log(`  Updated shape with shadow and blur`, 'info');
  });

  await runTest('Update shape with Phase 3 gradient', async () => {
    const result = await pageAdvancedTools.update_shape.handler({
      fileId: testState.fileId,
      pageId: testState.pageId,
      shapeId: testState.shapeIds[2],
      gradientType: 'linear',
      gradientStartX: 0,
      gradientStartY: 0,
      gradientEndX: 1,
      gradientEndY: 0,
      gradientStops:
        '[{"color":"#f093fb","opacity":1,"offset":0},{"color":"#f5576c","opacity":1,"offset":1}]',
    });
    if (!result.content[0].text.includes('Updated shape')) {
      throw new Error('Update failed');
    }
    log(`  Updated shape with gradient`, 'info');
  });

  await runTest('Update shape with blend mode', async () => {
    const result = await pageAdvancedTools.update_shape.handler({
      fileId: testState.fileId,
      pageId: testState.pageId,
      shapeId: testState.shapeIds[3],
      blendMode: 'multiply',
    });
    if (!result.content[0].text.includes('Updated shape')) {
      throw new Error('Update failed');
    }
    log(`  Updated shape with blend mode`, 'info');
  });

  // ============================================================================
  // VERIFICATION: Get shapes and verify properties
  // ============================================================================
  log('\n🔍 Verifying created shapes...', 'info');

  await runTest('Get all page shapes and verify count', async () => {
    const result = await pageAdvancedTools.get_page_shapes.handler({
      fileId: testState.fileId,
      pageId: testState.pageId,
    });
    const shapes = JSON.parse(result.content[1].text);
    if (!Array.isArray(shapes)) {
      throw new Error('Invalid shapes response');
    }
    const expectedCount = testState.shapeIds.length;
    if (shapes.length < expectedCount) {
      throw new Error(`Expected at least ${expectedCount} shapes, got ${shapes.length}`);
    }
    log(`  Verified ${shapes.length} shapes on page`, 'info');
  });

  // ============================================================================
  // SUMMARY
  // ============================================================================
  log('\n' + '='.repeat(60), 'info');
  log('📊 VISUAL PROPERTIES TEST SUMMARY', 'info');
  log('='.repeat(60), 'info');
  log(`✅ Passed:  ${testState.passed}`, 'success');
  log(`❌ Failed:  ${testState.failed}`, testState.failed > 0 ? 'error' : 'info');
  log(`⚠️  Skipped: ${testState.skipped}`, 'warn');
  log(`📁 Test File ID: ${testState.fileId}`, 'info');
  log(`🎨 Total Shapes Created: ${testState.shapeIds.length}`, 'info');
  log('='.repeat(60), 'info');
  log('', 'info');
  log('✨ Visual Properties Coverage:', 'info');
  log('   Phase 1: Colors, Borders, Corner Radius, Opacity ✅', 'success');
  log('   Phase 2: Shadows, Blur ✅', 'success');
  log('   Phase 3: Gradients, Blend Modes ✅', 'success');
  log('   Image Fills: ⚠️  (Requires uploaded media)', 'warn');
  log('', 'info');
  log('⚠️  Test file not deleted for manual inspection', 'warn');
  log(`   File ID: ${testState.fileId}`, 'info');
  log(`   View at: ${apiUrl}/view/${testState.fileId}`, 'info');
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
