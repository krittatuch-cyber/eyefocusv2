// patch-handler.js
// Patches .open-next/server-functions/default/handler.mjs to fix Cloudflare Workers runtime errors:
// 1. "Cannot assign to read only property 'setImmediate'" (frozen node:timers)
// 2. "Dynamic require of '...instrumentation.js' is not supported"
const fs = require('fs');

const path = '.open-next/server-functions/default/handler.mjs';
let content = fs.readFileSync(path, 'utf8');
let modified = false;

// =====================================================================
// PATCH 1: fast-set-immediate frozen node:timers
// =====================================================================
const searchStr = 'const nodeTimers = require("node:timers");\n                globalThis.setImmediate = nodeTimers.setImmediate =';
const idx = content.indexOf(searchStr);

if (idx !== -1) {
  const blockStart = content.lastIndexOf('\n', idx) + 1;
  const nextTickStr = 'process.nextTick = patchedNextTick;';
  const nextTickIdx = content.indexOf(nextTickStr, idx);
  if (nextTickIdx !== -1) {
    const blockEnd = content.indexOf('\n', nextTickIdx + nextTickStr.length) + 1;
    const originalBlock = content.slice(blockStart, blockEnd);
    const indent = originalBlock.match(/^(\s*)/)[1];
    const replacement = `${indent}try { const nodeTimers = require("node:timers"); try { globalThis.setImmediate = nodeTimers.setImmediate = patchedSetImmediate; } catch(_) {} try { globalThis.clearImmediate = nodeTimers.clearImmediate = patchedClearImmediate; } catch(_) {} try { const nodeTimersPromises = require("node:timers/promises"); nodeTimersPromises.setImmediate = patchedSetImmediatePromise; } catch(_) {} process.nextTick = patchedNextTick; } catch(_e) {}\n`;
    content = content.slice(0, blockStart) + replacement + content.slice(blockEnd);
    console.log('✓ Patch 1 applied: fast-set-immediate frozen node:timers');
    modified = true;
  }
} else {
  console.log('✓ Patch 1: Already applied or not needed (setImmediate pattern not found)');
}

// =====================================================================
// PATCH 2: instrumentation.js dynamic require
// Catch any "Dynamic require" error in addition to ENOENT/MODULE_NOT_FOUND
// =====================================================================
const instrOld = 'catch (err) {\n                if ((0, _iserror.default)(err) && err.code !== "ENOENT" && err.code !== "MODULE_NOT_FOUND" && err.code !== "ERR_MODULE_NOT_FOUND") {\n                    throw err;\n                }\n            }';
const instrNew = 'catch (err) {\n                // Also ignore Cloudflare Workers "Dynamic require not supported" errors\n                const errMsg = err && err.message ? err.message : "";\n                const isDynamicRequireErr = errMsg.includes("Dynamic require") || errMsg.includes("not supported");\n                if ((0, _iserror.default)(err) && err.code !== "ENOENT" && err.code !== "MODULE_NOT_FOUND" && err.code !== "ERR_MODULE_NOT_FOUND" && !isDynamicRequireErr) {\n                    throw err;\n                }\n            }';

if (content.includes(instrOld)) {
  content = content.replace(instrOld, instrNew);
  console.log('✓ Patch 2 applied: instrumentation.js dynamic require');
  modified = true;
} else {
  console.log('! Patch 2: Pattern not found, trying alternative search...');
  // Try to find it differently
  const instrIdx = content.indexOf('getInstrumentationModule');
  if (instrIdx !== -1) {
    console.log('  getInstrumentationModule snippet:');
    console.log(content.slice(instrIdx + 200, instrIdx + 800));
  }
}

if (modified) {
  fs.writeFileSync(path, content, 'utf8');
  console.log('\n✓ handler.mjs patched successfully!');
} else {
  console.log('\n! No patches applied.');
}
