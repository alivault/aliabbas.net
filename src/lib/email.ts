import { createServerFn } from '@tanstack/react-start'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendEmailInput {
  name: string
  email: string
  message: string
}

export const sendContactEmail = createServerFn({ method: 'POST' })
  .validator((d: SendEmailInput) => d)
  .handler(async ({ data }) => {
    const { name, email, message } = data

    const result = await resend.emails.send({
      from: 'New Message <form@mail.aliabbas.dev>',
      to: ['ali@aliabbas.dev'],
      subject: `from ${name}`,
      html: `
        <div>
          <p>${message}</p>
          <strong>${name}</strong>
          <p>${email}</p>
        </div>
      `,
      text: `${message} -${name} (${email})`,
    })

    if (result.error) {
      throw new Error(result.error.message)
    }

    return { success: true, id: result.data.id }
  })
