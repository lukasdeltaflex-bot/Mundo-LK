async function testShopeeAPI() {
  const shopId = '406236066';
  const itemId = '23598804714';
  const url = `https://shopee.com.br/api/v4/item/get?itemid=${itemId}&shopid=${shopId}`;
  
  console.log(`Testing Shopee API: ${url}`);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': `https://shopee.com.br/product/${shopId}/${itemId}`,
      }
    });
    console.log(`Status: ${res.status}`);
    const data = await res.json();
    console.log('Shopee API Response:', JSON.stringify(data).slice(0, 500));
  } catch (err) {
    console.error('Error:', err);
  }
}

testShopeeAPI();
