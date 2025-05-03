import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

const WORK_START_HOUR = 9;
const WORK_END_HOUR = 21; // exclusive, so last slot is 20:00-21:00

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date"); // format: YYYY-MM-DD

  if (!dateStr) {
    return NextResponse.json({ error: "Missing date parameter" }, { status: 400 });
  }

  // Build start and end of the day in ISO format
  const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

  // Google Auth
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
  });

  const calendar = google.calendar({ version: "v3", auth });

  // Fetch events for the day
  let events: any[] = [];
  try {
    const res = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID!,
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });
    events = res.data.items || [];
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch calendar events" }, { status: 500 });
  }

  // Build an array of unavailable hours (mark all hours overlapped by any event)
  const unavailableHours = new Set<number>();
  for (const event of events) {
    if (!event.start?.dateTime || !event.end?.dateTime) continue;
    const eventStart = new Date(event.start.dateTime);
    const eventEnd = new Date(event.end.dateTime);
    let hour = eventStart.getUTCHours();
    const endHour = eventEnd.getUTCHours();
    while (hour < endHour) {
      unavailableHours.add(hour);
      hour++;
    }
  }

  // Build available time slots
  const availableTimes = [];
  for (let hour = WORK_START_HOUR; hour < WORK_END_HOUR; hour++) {
    if (!unavailableHours.has(hour)) {
      const label = hour < 12 ? `${hour} AM` : hour === 12 ? `12 PM` : `${hour - 12} PM`;
      availableTimes.push({ value: `${hour}:00`, label });
    }
  }

  return NextResponse.json({ times: availableTimes });
}