import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

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
  const modifiedFiles = payload?.commits?.[0]?.modified || []

  const mdxFilesChanged = modifiedFiles.some((file: string) =>
    file.endsWith('.mdx')
  )

  if (mdxFilesChanged) {
    const revalidateURL = `https://aliabbas.dev/api/revalidate?secret=${process.env.SECRET}`

    try {
      const fetchRes = await fetch(revalidateURL, {
        method: 'GET',
      })

      if (fetchRes.ok) {
        return NextResponse.json({ message: 'Revalidated successfully' })
      } else {
        return new NextResponse('Error revalidating', { status: 500 })
      }
    } catch (error) {
      console.error('Error revalidating:', error)
      return new NextResponse('Error revalidating', { status: 500 })
    }
  } else {
    return NextResponse.json({ message: 'No MDX files changed' })
  }
}
