import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { google } from "googleapis";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(req: NextRequest) {
    console.log("Stripe webhook endpoint triggered"); // <-- Add this line

  const sig = req.headers.get("stripe-signature")!;
  const buf = await req.arrayBuffer();
  const rawBody = Buffer.from(buf);

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    let message = "Unknown error";
    if (err instanceof Error) {
      message = err.message;
    }
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    console.log("Processing checkout.session.completed event"); // <-- Add this line

    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata;

    if (metadata && metadata.dates && metadata.times) {
      const datesArr = JSON.parse(metadata.dates);
      const timesArr = JSON.parse(metadata.times);

      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        },
        scopes: ["https://www.googleapis.com/auth/calendar"],
      });

      const calendar = google.calendar({ version: "v3", auth });

      for (let i = 0; i < datesArr.length; i++) {
        const date = datesArr[i];
        const time = timesArr[i]; // e.g., "10:00"
        const [hour, minute] = time.split(":").map(Number);

        const start = new Date(date);
        start.setHours(hour, minute, 0, 0);
        const end = new Date(start);
        end.setMinutes(end.getMinutes() + 60);

        await calendar.events.insert({
          calendarId: process.env.GOOGLE_CALENDAR_ID!,
          requestBody: {
            summary: "Booked Session",
            description: "Session booked via Stripe checkout",
            start: { dateTime: start.toISOString(), timeZone: "UTC" },
            end: { dateTime: end.toISOString(), timeZone: "UTC" },
          },
        });
        console.log(session);
      }
    } else {
      console.error("Missing dates or times in session metadata");
    }
  }

  return NextResponse.json({ received: true });
}