"use client"

import { Calendar } from "@/components/ui/calendar"
import {
    Select, SelectTrigger, SelectValue,
    SelectContent, SelectItem
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useState } from "react"

// Add this import for Stripe redirect
import { loadStripe } from "@stripe/stripe-js"

const stripePromise = loadStripe("pk_test_51RJhrDPOgdqxXaiTD54IIilCo1Bsk7M35RYSIcse3fEIklp8gwDPxSZDcdgbggYyUShbED3rYlq0CKohhv7pdn0900MuvoZDAq") // Replace with your Stripe publishable key

export default function BookingPage() {
    const [step, setStep] = useState(1)
    const [sessions, setSessions] = useState<number>(1)
    const [dates, setDates] = useState<(Date | undefined)[]>([undefined])
    const [times, setTimes] = useState<string[]>([""])
    const [loading, setLoading] = useState(false)
    const pricePerSession = 50 // USD, adjust as needed

    const timeSlots = Array.from({ length: 12 }, (_, i) => {
        const hour = 9 + i
        const label = hour < 12 ? `${hour} AM` : hour === 12 ? `12 PM` : `${hour - 12} PM`
        return { value: `${hour}:00`, label }
    })

    const handleSessionChange = (value: string) => {
        const count = parseInt(value)
        setSessions(count)
        setDates(Array(count).fill(undefined))
        setTimes(Array(count).fill(""))
    }

    // Calculate total price
    const totalPrice = sessions * pricePerSession

    // Validate all dates and times are selected
    const isValid = dates.every(Boolean) && times.every((t) => t)

    // Handle payment
    const handlePayment = async () => {
        if (!isValid) {
            alert("Please select a date and time for each session.")
            return
        }
        setLoading(true)
        // Call your backend to create a Stripe Checkout session
        const res = await fetch("/api/checkout_sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                sessions,
                dates,
                times,
                totalPrice,
            }),
        })
        const data = await res.json()
        console.log("Received session ID:", data.sessionId);        
        const stripe = await stripePromise
        if (data.sessionId && stripe) {
            await stripe.redirectToCheckout({ sessionId: data.sessionId })
        } else {
            alert("Payment failed to initialize.")
        }
        setLoading(false)
    }

    const [availableTimes, setAvailableTimes] = useState<string[][]>([[]]);

    const fetchAvailableTimes = async (date: Date, idx: number) => {
        if (!date) return;
        const res = await fetch(`/api/availability?date=${date.toISOString().split('T')[0]}`);
        const data = await res.json();
        setAvailableTimes((prev) => {
            const updated = [...prev];
            updated[idx] = data.times; // data.times should be an array of available time strings
            return updated;
        });
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 border rounded-xl shadow space-y-6">
            <h1 className="text-2xl font-semibold text-center">Book a Session</h1>

            {/* Step 1: Choose Session Count */}
            {step === 1 && (
                <div className="space-y-4">
                    <Label className="text-base">How many sessions would you like?</Label>
                    <RadioGroup defaultValue="1" onValueChange={handleSessionChange}>
                        <div className="flex gap-4">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="1" id="session-1" />
                                <Label htmlFor="session-1">1 Session</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="2" id="session-2" />
                                <Label htmlFor="session-2">2 Sessions</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="3" id="session-3" />
                                <Label htmlFor="session-3">3 Sessions</Label>
                            </div>
                        </div>
                    </RadioGroup>

                    <button
                        className="mt-4 w-full bg-black text-white py-2 rounded hover:bg-gray-800"
                        onClick={() => setStep(2)}
                    >
                        Continue
                    </button>
                </div>
            )}

            {/* Step 2: Pick Dates & Times */}
            {step === 2 && (
                <div className="space-y-6">
                    {dates.map((date, idx) => (
                        <div key={idx} className="flex flex-col items-center border p-4 rounded-md">
                            <p className="font-medium mb-2">Session {idx + 1}</p>
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={(newDate) => {
                                    const newDates = [...dates];
                                    newDates[idx] = newDate;
                                    setDates(newDates);
                                    fetchAvailableTimes(newDate as Date, idx);
                                }}
                                className="mx-auto"
                            />
                            <div className="mt-4">
                                <Label className="block mb-2 text-sm font-medium">Select a time</Label>
                                <Select
                                    value={times[idx]}
                                    onValueChange={(newTime) => {
                                        const newTimes = [...times];
                                        newTimes[idx] = newTime;
                                        setTimes(newTimes);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pick a time" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(availableTimes[idx]?.length ? availableTimes[idx] : timeSlots).map((slot) => {
                                            // Normalize slot to always be { value, label }
                                            const normalized = typeof slot === "string"
                                                ? { value: slot, label: slot }
                                                : slot;
                                            return (
                                                <SelectItem key={normalized.value} value={normalized.value}>
                                                    {normalized.label}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    ))}

                    <div className="flex justify-between items-center mt-6">
                        <button
                            className="text-sm text-muted-foreground underline"
                            onClick={() => setStep(1)}
                            disabled={loading}
                        >
                            Back
                        </button>
                        <div className="text-lg font-semibold">
                            Total: ${totalPrice}
                        </div>
                        <button
                            className="bg-black text-white py-2 px-4 rounded hover:bg-gray-800"
                            onClick={handlePayment}
                            disabled={!isValid || loading}
                        >
                            {loading ? "Processing..." : "Confirm & Pay"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}