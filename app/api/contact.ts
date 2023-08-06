import { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      // The form data sent in the request
      const { email, name, message } = req.body;

      await resend.emails.send({
        from: 'Your Name <your-email@example.com>', // replace with your info
        to: ['recipient@example.com'], // replace with your info
        subject: `New contact form submission from ${name}`,
        html: `<p>You've received a new contact form submission:</p>
                        <p><strong>Name:</strong> ${name}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Message:</strong> ${message}</p>`,
      });

      return res.status(200).send({ status: 'ok' });
    } catch (error) {
      console.error(error);
      return res.status(500).send({ error: 'Error sending email' });
    }
  } else {
    // Handle any other HTTP method
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
