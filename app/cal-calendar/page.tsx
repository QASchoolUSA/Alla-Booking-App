"use client";
import Cal from "@calcom/embed-react";

export default function CalCalendarPage() {
  return (
    <div className="">
      <Cal calLink="nikita-kedrov" config={{ theme: "light" }}></Cal>
    </div>
  );
}