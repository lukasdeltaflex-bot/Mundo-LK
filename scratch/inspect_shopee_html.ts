import fs from 'fs';

async function inspectShopeeHTML() {
  const pageUrl = `https://shopee.com.br/product/406236066/23598804714`;
  console.log(`[Inspect] Fetching page: ${pageUrl}`);

  const res = await fetch(pageUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    }
  });

  const html = await res.text();
  console.log(`HTML received: ${html.length} bytes`);

  // Find all <script> blocks or <meta> tags
  const metaMatches = html.match(/<meta[^>]+>/gi) || [];
  console.log('\n--- Meta Tags Found ---');
  metaMatches.forEach(m => {
    if (m.includes('title') || m.includes('price') || m.includes('image') || m.includes('description') || m.includes('og:')) {
      console.log(m);
    }
  });

  // Check for JSON LD or initial state
  const scriptMatches = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];
  console.log(`\nFound ${scriptMatches.length} script tags.`);
  
  for (let i = 0; i < scriptMatches.length; i++) {
    const s = scriptMatches[i];
    if (s.includes('name') || s.includes('price') || s.includes('image') || s.includes('itemid') || s.includes('ld+json')) {
      console.log(`\n--- Script ${i} snippet ---`);
      console.log(s.slice(0, 400));
    }
  }
}

inspectShopeeHTML();
