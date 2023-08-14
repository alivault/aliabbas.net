import { NextRequest, NextResponse } from 'next/server'
import MailerLite from '@mailerlite/mailerlite-nodejs'

export async function POST(request: NextRequest) {
  const { email } = await request.json()

  const mailerlite = new MailerLite({
    api_key: process.env.MAILERLITE_API_KEY as string,
  })

  const params = {
    email: email,
    status: 'active' as const,
  }

  try {
    const response = await mailerlite.subscribers.createOrUpdate(params)
    return NextResponse.json(response.data)
  } catch (error: unknown) {
    if (error instanceof Error) {
      const responseError = error as { response?: { data?: any } }
      if (responseError.response && responseError.response.data) {
        return NextResponse.json(responseError.response.data, { status: 500 })
      }
    }
    return NextResponse.json(
      { error: 'Unable to subscribe email.' },
      { status: 500 }
    )
  }
}
