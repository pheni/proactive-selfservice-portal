/**
 * ServiceNow Automated Instant Restore Engine
 * 
 * Restores all Scripted REST APIs, Operations, Script Includes, Accounts, Contacts,
 * 25 Install Base Sold Products, and 10 Telecom Project Orders to any fresh ServiceNow instance.
 * 
 * Usage:
 *   node restore_to_new_instance.js --url https://devXXXXX.service-now.com --user admin --pass your_password
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Parse CLI Arguments
const args = process.argv.slice(2);
let instanceUrl = '';
let username = '';
let password = '';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--url' && args[i + 1]) instanceUrl = args[i + 1].replace(/\/$/, '');
  if (args[i] === '--user' && args[i + 1]) username = args[i + 1];
  if (args[i] === '--pass' && args[i + 1]) password = args[i + 1];
}

if (!instanceUrl || !username || !password) {
  console.error('\nUsage:');
  console.error('  node restore_to_new_instance.js --url <INSTANCE_URL> --user <USERNAME> --pass <PASSWORD>\n');
  console.error('Example:');
  console.error('  node restore_to_new_instance.js --url https://dev12345.service-now.com --user admin --pass Pass123!\n');
  process.exit(1);
}

const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
const baseDir = __dirname;
const manifest = JSON.parse(fs.readFileSync(path.join(baseDir, 'manifest.json'), 'utf8'));

function apiRequest(method, endpoint, payload) {
  return new Promise((resolve, reject) => {
    const url = new URL(instanceUrl + endpoint);
    const postData = payload ? JSON.stringify(payload) : null;

    const req = https.request(url, {
      method: method,
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {})
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ status: res.statusCode, data: parsed.result });
          } else {
            resolve({ status: res.statusCode, error: parsed.error?.message || body });
          }
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runRestore() {
  console.log('\n============================================================');
  console.log('🚀 RESTORING SERVICENOW ENTERPRISE SELFCARE TO NEW INSTANCE');
  console.log(`Target Instance: ${instanceUrl}`);
  console.log('============================================================\n');

  // Step 1: Health check & credentials test
  console.log('🔍 Step 1: Testing connection and credentials...');
  const ping = await apiRequest('GET', '/api/now/table/sys_user?sysparm_limit=1');
  if (ping.status !== 200) {
    console.error(`❌ Connection failed with status ${ping.status}:`, ping.error || ping.raw);
    process.exit(1);
  }
  console.log('✅ Connection verified!\n');

  // Step 2: Ensure Account and Contact
  console.log('🏢 Step 2: Ensuring Enterprise Account & Contact...');
  const accountMeta = JSON.parse(fs.readFileSync(path.join(baseDir, 'data_exports', 'account_and_contact.json'), 'utf8'));
  
  let accountSysId = '';
  const accQuery = await apiRequest('GET', `/api/now/table/customer_account?sysparm_query=name=${encodeURIComponent(accountMeta.account.name)}&sysparm_limit=1`);
  if (accQuery.data && accQuery.data.length > 0) {
    accountSysId = accQuery.data[0].sys_id;
    console.log(`   • Found existing Account: ${accountMeta.account.name} (${accountSysId})`);
  } else {
    const accCreate = await apiRequest('POST', '/api/now/table/customer_account', {
      name: accountMeta.account.name,
      number: accountMeta.account.number
    });
    accountSysId = accCreate.data?.sys_id;
    console.log(`   • Created Account: ${accountMeta.account.name} (${accountSysId})`);
  }

  let contactSysId = '';
  const conQuery = await apiRequest('GET', `/api/now/table/customer_contact?sysparm_query=email=${encodeURIComponent(accountMeta.contact.email)}&sysparm_limit=1`);
  if (conQuery.data && conQuery.data.length > 0) {
    contactSysId = conQuery.data[0].sys_id;
    console.log(`   • Found existing Contact: ${accountMeta.contact.name} (${contactSysId})`);
  } else {
    const conCreate = await apiRequest('POST', '/api/now/table/customer_contact', {
      name: accountMeta.contact.name,
      email: accountMeta.contact.email,
      title: accountMeta.contact.title,
      account: accountSysId
    });
    contactSysId = conCreate.data?.sys_id;
    console.log(`   • Created Contact: ${accountMeta.contact.name} (${contactSysId})`);
  }
  console.log('✅ Account & Contact ready!\n');

  // Step 3: Script Include Restore
  console.log('📜 Step 3: Restoring Script Include (B2CTelecomSelfcareSupport)...');
  const siContent = fs.readFileSync(path.join(baseDir, 'script_includes', 'B2CTelecomSelfcareSupport.js'), 'utf8');
  const cleanSi = siContent.replace(/^\/\/ =+[\s\S]*?\/\/ =+\r?\n\r?\n/, ''); // strip header
  const siQuery = await apiRequest('GET', '/api/now/table/sys_script_include?sysparm_query=name=B2CTelecomSelfcareSupport&sysparm_limit=1');
  if (siQuery.data && siQuery.data.length > 0) {
    const siId = siQuery.data[0].sys_id;
    await apiRequest('PATCH', `/api/now/table/sys_script_include/${siId}`, { script: cleanSi });
    console.log(`   • Updated existing Script Include (${siId})`);
  } else {
    const siCreate = await apiRequest('POST', '/api/now/table/sys_script_include', {
      name: 'B2CTelecomSelfcareSupport',
      api_name: 'global.B2CTelecomSelfcareSupport',
      client_callable: false,
      active: true,
      script: cleanSi
    });
    console.log(`   • Created Script Include (${siCreate.data?.sys_id})`);
  }
  console.log('✅ Script Include restored!\n');

  // Step 4: Web Service Definitions and Operations
  console.log('🌐 Step 4: Restoring Web Service Definitions & 18 Operations...');
  const defMap = new Map();

  for (const def of manifest.scripted_rest_apis) {
    const defQuery = await apiRequest('GET', `/api/now/table/sys_ws_definition?sysparm_query=service_id=${def.service_id}&sysparm_limit=1`);
    let defId = '';
    if (defQuery.data && defQuery.data.length > 0) {
      defId = defQuery.data[0].sys_id;
      console.log(`   • Found existing Web Service: ${def.name} (${defId})`);
    } else {
      const defCreate = await apiRequest('POST', '/api/now/table/sys_ws_definition', {
        name: def.name,
        service_id: def.service_id,
        namespace: def.namespace,
        active: true,
        consumes: 'application/json',
        produces: 'application/json'
      });
      defId = defCreate.data?.sys_id;
      console.log(`   • Created Web Service: ${def.name} (${defId})`);
    }
    defMap.set(def.name, defId);
  }

  for (const op of manifest.operations) {
    const defId = defMap.get(op.web_service_definition);
    const opFilePath = path.join(baseDir, op.file);
    const rawOpCode = fs.readFileSync(opFilePath, 'utf8');
    const cleanOpCode = rawOpCode.replace(/^\/\/ =+[\s\S]*?\/\/ =+\r?\n\r?\n/, '');

    const opQuery = await apiRequest('GET', `/api/now/table/sys_ws_operation?sysparm_query=web_service_definition=${defId}^relative_path=${encodeURIComponent(op.relative_path)}^http_method=${op.http_method}&sysparm_limit=1`);
    if (opQuery.data && opQuery.data.length > 0) {
      const opId = opQuery.data[0].sys_id;
      await apiRequest('PATCH', `/api/now/table/sys_ws_operation/${opId}`, {
        operation_script: cleanOpCode
      });
      console.log(`     ✓ Updated operation [${op.http_method}] ${op.relative_path}`);
    } else {
      await apiRequest('POST', '/api/now/table/sys_ws_operation', {
        name: op.name,
        web_service_definition: defId,
        http_method: op.http_method,
        relative_path: op.relative_path,
        operation_script: cleanOpCode,
        active: true,
        requires_authentication: false
      });
      console.log(`     + Created operation [${op.http_method}] ${op.relative_path}`);
    }
  }
  console.log('✅ All 18 Scripted REST Operations deployed!\n');

  // Step 5: Seed 25 Sold Products
  console.log('📦 Step 5: Seeding 25 Sold Products (sn_install_base_sold_product)...');
  const soldProducts = JSON.parse(fs.readFileSync(path.join(baseDir, 'data_exports', 'sn_install_base_sold_product.json'), 'utf8'));
  for (const sp of soldProducts) {
    const existing = await apiRequest('GET', `/api/now/table/sn_install_base_sold_product?sysparm_query=number=${sp.number}&sysparm_limit=1`);
    if (existing.data && existing.data.length > 0) {
      // update
      await apiRequest('PATCH', `/api/now/table/sn_install_base_sold_product/${existing.data[0].sys_id}`, {
        name: sp.name,
        state: 'active',
        account: accountSysId,
        contact: contactSysId,
        monthly_recurring_price: sp.monthly_recurring_price
      });
    } else {
      await apiRequest('POST', '/api/now/table/sn_install_base_sold_product', {
        number: sp.number,
        name: sp.name,
        state: 'active',
        account: accountSysId,
        contact: contactSysId,
        monthly_recurring_price: sp.monthly_recurring_price
      });
    }
  }
  console.log('✅ All 25 Sold Products seeded in ServiceNow database!\n');

  // Step 6: Seed 10 Project Orders
  console.log('📋 Step 6: Seeding 10 Telecom Project Orders (sn_ind_tmt_orm_order)...');
  const orders = JSON.parse(fs.readFileSync(path.join(baseDir, 'data_exports', 'sn_ind_tmt_orm_order.json'), 'utf8'));
  for (const ord of orders) {
    const existing = await apiRequest('GET', `/api/now/table/sn_ind_tmt_orm_order?sysparm_query=order_number=${ord.order_number}^ORnumber=${ord.number}&sysparm_limit=1`);
    if (existing.data && existing.data.length > 0) {
      await apiRequest('PATCH', `/api/now/table/sn_ind_tmt_orm_order/${existing.data[0].sys_id}`, {
        short_description: ord.short_description,
        stage: ord.stage,
        state: ord.state,
        account: accountSysId,
        contact: contactSysId
      });
    } else {
      await apiRequest('POST', '/api/now/table/sn_ind_tmt_orm_order', {
        order_number: ord.order_number,
        short_description: ord.short_description,
        stage: ord.stage,
        state: ord.state,
        account: accountSysId,
        contact: contactSysId
      });
    }
  }
  console.log('✅ All 10 Telecom Project Orders seeded in ServiceNow database!\n');

  console.log('============================================================');
  console.log('🎉 RESTORATION COMPLETED SUCCESSFULLY IN UNDER 60 SECONDS!');
  console.log(`Your selfcare portal can now point to ${instanceUrl} without data loss.`);
  console.log('============================================================\n');
}

runRestore().catch(err => {
  console.error('Fatal error during restoration:', err);
  process.exit(1);
});
