import { NextResponse } from 'next/server'
import { MOCK_NEWS } from '@/lib/mock-data'

export async function GET() {
  try {
    const apiKey = process.env.NEWS_API_KEY
    if (apiKey) {
      const res = await fetch(
        `https://newsapi.org/v2/everything?q=(oil+OR+crude+OR+OPEC+OR+Hormuz+OR+energy+supply)&sortBy=publishedAt&language=en&pageSize=8&apiKey=${apiKey}`,
        { next: { revalidate: 300 } }
      )
      if (res.ok) {
        const data = await res.json()
        const articles = data.articles?.map((a: { title: string; source: { name: string }; publishedAt: string }, i: number) => ({
          id: i + 1,
          headline: a.title,
          source: a.source.name,
          time: new Date(a.publishedAt).toLocaleTimeString(),
          risk: Math.floor(Math.random() * 60) + 20,
          corridor: 'Global',
          sentiment: 'medium',
        })) ?? MOCK_NEWS
        return NextResponse.json({ news: articles, source: 'live' })
      }
    }
  } catch { /* fall through */ }

  return NextResponse.json({ news: MOCK_NEWS, source: 'mock' })
}
