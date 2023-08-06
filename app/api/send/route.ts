import { Resend } from 'resend';
import { EmailTemplate } from '@/components/EmailTemplate';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email, message } = await request.json();

    const data = await resend.emails.send({
      from: 'Message <form@mail.aliabbas.dev>',
      to: ['ali@aliabbas.dev'],
      subject: `Message from ${email}`,
      react: EmailTemplate({ email, message }),
      text: `Message from ${email}: ${message}`,
    });

    return new Response(JSON.stringify(data));
  } catch (error) {
    return new Response(JSON.stringify({ error }), { status: 500 });
  }
}
