#!/usr/bin/env node

/**
 * ControlHub API Integration Test Script
 * Tests the integration between frontend and backend
 * Demonstrates the issues found during testing
 */

const axios = require('axios');

// Different API URLs found in the codebase (demonstrating the inconsistency)
const API_URLS = {
  localhost: 'http://localhost:5000/api',
  render_api: 'https://controlhub-api.onrender.com/api',
  render_backend: 'https://controlhub-backend.onrender.com/api'
};

// Test data
const testSkill = {
  name: 'Integration Testing',
  progress: 85,
  category: 'Testing'
};

const testJob = {
  role: 'Full Stack Developer',
  company: 'Test Company',
  status: 'Applied',
  location: 'Remote'
};

const testBookmark = {
  title: 'MDN Web Docs',
  url: 'https://developer.mozilla.org',
  category: 'Development'
};

/**
 * Test API endpoint connectivity
 */
async function testAPIConnectivity() {
  console.log('🔍 Testing API Connectivity...\n');
  
  for (const [name, url] of Object.entries(API_URLS)) {
    try {
      const response = await axios.get(`${url}/skills`, { timeout: 5000 });
      console.log(`✅ ${name} (${url}): Connected - Status ${response.status}`);
    } catch (error) {
      console.log(`❌ ${name} (${url}): Failed - ${error.message}`);
    }
  }
  console.log('\n');
}

/**
 * Test Skills API (demonstrates data model mismatch)
 */
async function testSkillsAPI(baseURL) {
  console.log('🧪 Testing Skills API...\n');
  
  try {
    // Test GET all skills
    const getResponse = await axios.get(`${baseURL}/skills`);
    console.log('✅ GET Skills:', getResponse.data.length, 'skills found');
    
    // Show data structure to demonstrate field mismatch
    if (getResponse.data.length > 0) {
      const firstSkill = getResponse.data[0];
      console.log('📋 Sample skill data structure:');
      console.log('   - Has "progress" field:', 'progress' in firstSkill);
      console.log('   - Has "level" field:', 'level' in firstSkill);
      console.log('   - Actual fields:', Object.keys(firstSkill));
    }
    
    // Test POST new skill
    const postResponse = await axios.post(`${baseURL}/skills`, testSkill);
    console.log('✅ POST Skill: Created with ID', postResponse.data._id);
    
    // Test PUT update skill
    const updatedSkill = { ...testSkill, progress: 90 };
    const putResponse = await axios.put(`${baseURL}/skills/${postResponse.data._id}`, updatedSkill);
    console.log('✅ PUT Skill: Updated progress to', putResponse.data.progress);
    
    // Test DELETE skill
    await axios.delete(`${baseURL}/skills/${postResponse.data._id}`);
    console.log('✅ DELETE Skill: Removed test skill');
    
  } catch (error) {
    console.log('❌ Skills API Error:', error.message);
  }
  console.log('\n');
}

/**
 * Test FileShare API (demonstrates response format issue)
 */
async function testFileShareAPI(baseURL) {
  console.log('🗂️ Testing FileShare API...\n');
  
  try {
    const response = await axios.get(`${baseURL}/fileshare`);
    console.log('✅ GET FileShare: Status', response.status);
    
    // Demonstrate response format issue
    console.log('📋 Response format analysis:');
    console.log('   - Is array:', Array.isArray(response.data));
    console.log('   - Response type:', typeof response.data);
    
    if (Array.isArray(response.data)) {
      console.log('   - Array length:', response.data.length);
      console.log('   - Frontend expects: res.data[0]');
    } else {
      console.log('   - Single object returned');
      console.log('   - Frontend tries to access: res.data[0] (will fail)');
    }
    
  } catch (error) {
    console.log('❌ FileShare API Error:', error.message);
  }
  console.log('\n');
}

/**
 * Test Jobs API
 */
async function testJobsAPI(baseURL) {
  console.log('💼 Testing Jobs API...\n');
  
  try {
    const getResponse = await axios.get(`${baseURL}/jobs`);
    console.log('✅ GET Jobs:', getResponse.data.length, 'jobs found');
    
    const postResponse = await axios.post(`${baseURL}/jobs`, testJob);
    console.log('✅ POST Job: Created with ID', postResponse.data._id);
    
    await axios.delete(`${baseURL}/jobs/${postResponse.data._id}`);
    console.log('✅ DELETE Job: Removed test job');
    
  } catch (error) {
    console.log('❌ Jobs API Error:', error.message);
  }
  console.log('\n');
}

/**
 * Test Bookmarks API
 */
async function testBookmarksAPI(baseURL) {
  console.log('🔖 Testing Bookmarks API...\n');
  
  try {
    const getResponse = await axios.get(`${baseURL}/bookmarks`);
    console.log('✅ GET Bookmarks:', getResponse.data.length, 'bookmarks found');
    
    const postResponse = await axios.post(`${baseURL}/bookmarks`, testBookmark);
    console.log('✅ POST Bookmark: Created with ID', postResponse.data._id);
    
    await axios.delete(`${baseURL}/bookmarks/${postResponse.data._id}`);
    console.log('✅ DELETE Bookmark: Removed test bookmark');
    
  } catch (error) {
    console.log('❌ Bookmarks API Error:', error.message);
  }
  console.log('\n');
}

/**
 * Test error handling
 */
async function testErrorHandling(baseURL) {
  console.log('🚨 Testing Error Handling...\n');
  
  try {
    // Test invalid endpoint
    await axios.get(`${baseURL}/invalid-endpoint`);
  } catch (error) {
    console.log('✅ Invalid endpoint returns:', error.response?.status || 'Connection error');
  }
  
  try {
    // Test invalid data
    await axios.post(`${baseURL}/skills`, { invalidField: 'test' });
  } catch (error) {
    console.log('✅ Invalid data returns:', error.response?.status || 'Connection error');
  }
  
  console.log('\n');
}

/**
 * Main test execution
 */
async function runIntegrationTests() {
  console.log('🎯 ControlHub Integration Testing Started\n');
  console.log('=' * 50);
  
  // Test connectivity to all API endpoints
  await testAPIConnectivity();
  
  // Find a working API endpoint
  let workingAPI = null;
  for (const [name, url] of Object.entries(API_URLS)) {
    try {
      await axios.get(`${url}/skills`, { timeout: 5000 });
      workingAPI = url;
      console.log(`🎯 Using working API: ${name} (${url})\n`);
      break;
    } catch (error) {
      continue;
    }
  }
  
  if (!workingAPI) {
    console.log('❌ No working API endpoint found. Please ensure backend is running.');
    return;
  }
  
  // Run comprehensive tests
  await testSkillsAPI(workingAPI);
  await testFileShareAPI(workingAPI);
  await testJobsAPI(workingAPI);
  await testBookmarksAPI(workingAPI);
  await testErrorHandling(workingAPI);
  
  console.log('🏁 Integration Testing Complete');
  console.log('📊 Check the ControlHub_Integration_Test_Report.md for detailed findings');
}

// Run tests if script is executed directly
if (require.main === module) {
  runIntegrationTests().catch(console.error);
}

module.exports = {
  testAPIConnectivity,
  testSkillsAPI,
  testFileShareAPI,
  testJobsAPI,
  testBookmarksAPI,
  testErrorHandling
};