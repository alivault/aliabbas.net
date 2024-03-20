import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  if (request.method !== 'POST') {
    return new NextResponse('Method Not Allowed', { status: 405 })
  }

  const signature = request.headers.get('x-hub-signature-256')
  const payloadText = await request.text()

  if (!signature || !process.env.GITHUB_WEBHOOK_SECRET) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const hmac = crypto.createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET)
  hmac.update(payloadText)
  const expectedSignature = `sha256=${hmac.digest('hex')}`

  if (signature !== expectedSignature) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const payload = JSON.parse(payloadText)
  const { commits = [] } = payload
  const allRelevantFiles = commits.flatMap(
    ({ modified = [], added = [], removed = [] }) => [
      ...modified,
      ...added,
      ...removed,
    ],
  )

  const mdxFilesChanged = allRelevantFiles.some((file: string) =>
    file.endsWith('.mdx'),
  )

  if (mdxFilesChanged) {
    const revalidatePaths = [
      '/',
      '/articles',
      ...allRelevantFiles
        .filter((file: string) => file.endsWith('.mdx'))
        .map((file: string) => `/articles/${file.replace('.mdx', '')}`),
    ]

    const revalidatePromises = revalidatePaths.map((path) =>
      fetch(
        `https://aliabbas.dev/api/revalidate?secret=${process.env.SECRET}&path=${encodeURIComponent(path)}`,
        {
          method: 'GET',
        },
      ),
    )

    try {
      const results = await Promise.all(revalidatePromises)
      const allOk = results.every((res) => res.ok)
      if (allOk) {
        return NextResponse.json({ message: 'Revalidated successfully' })
      } else {
        return new NextResponse('Error revalidating some paths', {
          status: 500,
        })
      }
    } catch (error) {
      console.error('Error revalidating:', error)
      return new NextResponse('Error revalidating', { status: 500 })
    }
  } else {
    return NextResponse.json({ message: 'No MDX files changed' })
  }
}
