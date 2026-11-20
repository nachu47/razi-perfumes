import { prisma } from '@/lib/prisma';
import { clientIp, handler, ok, readJson } from '@/lib/api';
import { rateLimit } from '@/lib/rate-limit';
import { contactSchema } from '@/lib/validators';
import { adminNotifyEmail, sendEmail } from '@/lib/email';
import { contactAdminEmail } from '@/lib/email-templates';

// POST /api/contact — saves the message to the admin inbox and emails the admin
export const POST = handler(async (req: Request) => {
  rateLimit(`contact:${clientIp(req)}`, 5, 15 * 60_000);
  const input = contactSchema.parse(await readJson(req));
  if (input.website) return ok({ received: true }); // honeypot hit: pretend success
  const msg = await prisma.contactMessage.create({
    data: { name: input.name, email: input.email, phone: input.phone || null, subject: input.subject, message: input.message },
  });
  const admin = adminNotifyEmail();
  if (admin) await sendEmail({ to: admin, replyTo: msg.email, ...contactAdminEmail(msg) });
  return ok({ received: true }, { status: 201 });
});
