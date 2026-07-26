async function main() {
  const sRes = await fetch('https://mundo-lk.vercel.app/_next/static/chunks/2u76r3omi_gib.js');
  const sText = await sRes.text();
  console.log('Script size:', sText.length);
  
  // Search for action references
  const matches = sText.match(/[a-zA-Z0-9_$]+\.action\([^)]+\)/g);
  console.log('Action calls:', matches);

  // Search for string literals with hex hashes
  const hashes = sText.match(/[a-f0-9]{40}/g);
  console.log('40-char hashes:', hashes);

  // Search for 64-char hashes (Next 15/16)
  const hashes64 = sText.match(/[a-f0-9]{64}/g);
  console.log('64-char hashes:', hashes64);

  // Print context around analyzeProductUrlAction
  const idx = sText.indexOf('analyzeProductUrlAction');
  if (idx !== -1) {
    console.log('\nContext around analyzeProductUrlAction:');
    console.log(sText.slice(Math.max(0, idx - 200), Math.min(sText.length, idx + 300)));
  }
}
main();
