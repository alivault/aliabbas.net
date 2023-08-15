import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  if (request.method !== 'POST') {
    return new NextResponse('Method Not Allowed', { status: 405 })
  }

  const payload = JSON.parse(await request.text())
  const modifiedFiles = payload?.commits?.[0]?.modified || []

  const mdxFilesChanged = modifiedFiles.some((file: string) =>
    file.endsWith('.mdx')
  )

  if (mdxFilesChanged) {
    const revalidateURL = `https://aliabbas.dev/api/revalidate?secret=${process.env.SECRET}`

    // Send a GET request to the revalidation endpoint
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
