import { NextResponse } from 'next/server'

export async function GET() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

    return NextResponse.json({
        supabaseUrl: {
            defined: !!url,
            startsWithHttps: url.startsWith('https://'),
            endsWithSupabaseCo: url.includes('.supabase.co'),
            hasWhitespace: /\s/.test(url),
            valuePreview: url.substring(0, 8) + '...'
        },
        supabaseKey: {
            defined: !!key,
            length: key.length,
            hasWhitespace: /\s/.test(key),
            isLikelyAnon: key.startsWith('eyJ'),
            valuePreview: key.substring(0, 5) + '...' + key.substring(key.length - 5)
        },
        nodeEnv: process.env.NODE_ENV,
    })
}
