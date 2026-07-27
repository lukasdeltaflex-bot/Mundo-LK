async function testShopeeWithBrowserHeaders() {
  const shopId = '406236066';
  const itemId = '23598804714';
  
  // Test 1: Fetching item page with desktop user agent and accept headers
  const pageUrl = `https://shopee.com.br/product/${shopId}/${itemId}`;
  console.log(`[Test] Fetching page: ${pageUrl}`);

  try {
    const res = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      }
    });

    console.log(`Page Status: ${res.status}`);
    const html = await res.text();
    console.log(`HTML length: ${html.length}`);

    // Check for title or JSON in HTML
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    console.log('Title match:', titleMatch ? titleMatch[1] : 'None');

    const metaOgTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
    console.log('og:title:', metaOgTitle ? metaOgTitle[1] : 'None');

    const metaOgPrice = html.match(/<meta[^>]+property=["']product:price:amount["'][^>]+content=["']([^"']+)["']/i);
    console.log('og:price:', metaOgPrice ? metaOgPrice[1] : 'None');

    const metaOgImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
    console.log('og:image:', metaOgImage ? metaOgImage[1] : 'None');
  } catch (err) {
    console.error('Error:', err);
  }
}

testShopeeWithBrowserHeaders();
