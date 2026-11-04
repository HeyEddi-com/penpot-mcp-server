/**
 * Basic API Test - Tests core functionality with OpenAPI client
 */

import { PenpotClient } from './src/penpot-client.js';

const apiUrl = process.env.PENPOT_API_URL || 'https://design.penpot.app';
const accessToken = process.env.PENPOT_ACCESS_TOKEN;

if (!accessToken) {
  console.error('❌ PENPOT_ACCESS_TOKEN environment variable is required');
  process.exit(1);
}

async function testBasicOperations() {
  console.log('🧪 Testing Penpot MCP Server - OpenAPI Client\n');
  console.log(`API URL: ${apiUrl}\n`);

  const client = new PenpotClient({ apiUrl, accessToken });

  let passed = 0;
  let failed = 0;

  // Test 1: Get Profile
  try {
    console.log('1️⃣ Testing get profile...');
    const profile = await client.getProfile();
    console.log('✅ Profile retrieved:', (profile as any)?.email || 'Success');
    passed++;
  } catch (error) {
    console.log('❌ Profile failed:', String(error).substring(0, 200));
    failed++;
  }

  // Test 2: List Teams
  try {
    console.log('\n2️⃣ Testing list teams...');
    const teams = await client.listTeams();
    console.log(`✅ Found ${teams.length} teams`);
    if (teams.length > 0) {
      console.log(`   First team: ${teams[0].name}`);
    }
    passed++;
  } catch (error) {
    console.log('❌ List teams failed:', String(error).substring(0, 200));
    failed++;
  }

  // Test 3: List Projects (if we have a team)
  try {
    console.log('\n3️⃣ Testing list projects...');
    const teams = await client.listTeams();
    if (teams.length > 0) {
      const projects = await client.listProjects(teams[0].id);
      console.log(`✅ Found ${projects.length} projects in team "${teams[0].name}"`);
      if (projects.length > 0) {
        console.log(`   First project: ${projects[0].name}`);
      }
      passed++;
    } else {
      console.log('⚠️  No teams found, skipping project test');
    }
  } catch (error) {
    console.log('❌ List projects failed:', String(error).substring(0, 200));
    failed++;
  }

  // Test 4: List Files (if we have a project)
  try {
    console.log('\n4️⃣ Testing list files...');
    const teams = await client.listTeams();
    if (teams.length > 0) {
      const projects = await client.listProjects(teams[0].id);
      if (projects.length > 0) {
        const files = await client.listFiles(projects[0].id);
        console.log(`✅ Found ${files.length} files in project "${projects[0].name}"`);
        if (files.length > 0) {
          console.log(`   First file: ${files[0].name}`);
        }
        passed++;
      } else {
        console.log('⚠️  No projects found, skipping file test');
      }
    } else {
      console.log('⚠️  No teams found, skipping file test');
    }
  } catch (error) {
    console.log('❌ List files failed:', String(error).substring(0, 200));
    failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  console.log('='.repeat(50));

  process.exit(failed > 0 ? 1 : 0);
}

testBasicOperations().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
