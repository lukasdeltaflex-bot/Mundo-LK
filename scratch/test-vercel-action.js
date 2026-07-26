async function testVercelProductionAction() {
  const url = 'https://mundo-lk.vercel.app/dashboard';
  const actionId = '4027fe178d1e606098a325e429354f92ebc1625956';
  
  const payload = [
    {
      url: 'https://s.shopee.com.br/2qT9s4Rir7?share_channel_code=1',
      affiliateTag: 'mundolk',
      style: 'padrao'
    }
  ];

  console.log('=== INVOKING REAL SERVER ACTION ON VERCEL PRODUCTION ===');
  console.log('Target URL:', url);
  console.log('Action ID:', actionId);
  console.log('Payload:', JSON.stringify(payload));

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Next-Action': actionId,
      'Content-Type': 'text/plain;charset=UTF-8',
      'Accept': 'text/x-component',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    },
    body: JSON.stringify(payload)
  });

  console.log('\n--- VERCEL RESPONSE ---');
  console.log('HTTP Status Code:', res.status);
  console.log('HTTP Status Text:', res.statusText);
  console.log('Response Headers:', Object.fromEntries(res.headers.entries()));

  const text = await res.text();
  console.log('Raw Response Body Length:', text.length);
  console.log('Raw Response Body:\n', text);
}

testVercelProductionAction();
