import { KioskStation } from "@/components/Kiosk";
import { ServiceWorker } from "@/components/ServiceWorker";

export default function Page() {
  return (
    <main className="flex flex-1 flex-col px-3 py-6 sm:px-6 sm:py-10">
      <ServiceWorker />
      <KioskStation />
      <p className="mx-auto mt-6 max-w-3xl text-center text-sm text-muted">
        A demo for a made-up airline. Bookings, flights and seats are sample data. Check-ins sync only between kiosks in this browser.
      </p>
    </main>
  );
}
