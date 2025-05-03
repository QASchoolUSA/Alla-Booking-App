import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

export async function POST(req: NextRequest) {
  try {
    const { sessions, dates, times, totalPrice } = await req.json()

    // Optionally, validate the input here

    // Create a Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${sessions} Session${sessions > 1 ? "s" : ""} Booking`,
              description: `Booking for ${sessions} session${sessions > 1 ? "s" : ""}`,
            },
            unit_amount: Math.round((totalPrice as number) * 100), // Stripe expects cents
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/`,
      metadata: {
        sessions: String(sessions),
        dates: JSON.stringify(dates),
        times: JSON.stringify(times),
      },
    })
    console.log(session.id);

    return NextResponse.json({ sessionId: session.id })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}