import { NextResponse } from 'next/server';
import { analyzeProductUrlAction } from '@/presentation/actions/analyze-url.action';

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const envMode = process.env.VERCEL_ENV || process.env.NODE_ENV || 'development';

  try {
    const result = await analyzeProductUrlAction({
      url: 'https://shopee.com.br/product/garrafa-termica-1l-inox',
      style: 'padrao'
    });

    return NextResponse.json({
      envMode,
      keyFound: !!apiKey,
      keyLength: apiKey ? apiKey.length : 0,
      result
    });
  } catch (err) {
    const msg = err instanceof Error ? (err.stack || err.message) : String(err);
    return NextResponse.json({
      envMode,
      keyFound: !!apiKey,
      keyLength: apiKey ? apiKey.length : 0,
      error: msg
    }, { status: 500 });
  }
}
