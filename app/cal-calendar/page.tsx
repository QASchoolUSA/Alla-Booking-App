export default function CalCalendarPage() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-[#EEEFF2]">
      <div className="w-full max-w-2xl" style={{ height: "90vh" }}>
        <iframe
          src="https://cal.com/nikita-kedrov"
          width="100%"
          height="100%"
          title="Book with Cal.com"
          allow="camera; microphone; fullscreen; speaker"
        />
      </div>
    </div>
  );
}