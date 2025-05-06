import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Booking App MVP</h1>
      <div className="text-center space-y-4">
        <h1 className="text-xl font-bold">Design Option 1</h1>
        <p className="text-gray-600 mb-3">
          Fully Custom Booking - integration with Google Calendar API + Stripe.
        </p>
        <Button>
          <a href="/booking">Book Now</a>
        </Button>
      </div>
      <div className="text-center space-y-4 mt-8">
        <h1 className="text-xl font-bold">Design Option 2</h1>
        <p className="text-gray-600 mb-3">
          Cal.com Booking - ready to use component from Cal.com that contains lots of features.
        </p>
        <Button>
          <a href="/cal-calendar">Book Now</a>
        </Button>
      </div>
    </div>
  );
}