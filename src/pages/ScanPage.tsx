import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function ScanPage() {

  useEffect(() => {

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: 250 },
      false
    );

    scanner.render(onScanSuccess, onScanError);

    async function onScanSuccess(decodedText: string) {

      try {

        // Parse QR Data
        const qrData = JSON.parse(decodedText);

        if (!qrData.itemId || !qrData.step) {
          alert("Invalid QR Format");
          return;
        }

        // Fetch product item
        const { data: item, error: itemError } = await supabase
          .from("product_items")
          .select("*")
          .eq("serial_number", qrData.itemId)
          .single();

        if (itemError || !item) {
          alert("Invalid Product QR");
          return;
        }

        // ⭐ Step validation using scan history (MOST IMPORTANT)
        const { count: scanCount } = await supabase
            .from("scan_history")
            .select("*", { count: "exact" })
            .eq("item_id", item.id)
            .eq("route_id", item.route_id);

        const expectedStep = (scanCount || 0) + 1;

        if (qrData.step !== expectedStep) {
          alert(`Cannot skip steps! Please scan Step ${expectedStep}`);
          return;
        }

        // ⭐ Prevent duplicate scanning
        const { data: existingScan } = await supabase
          .from("scan_history")
          .select("*")
          .eq("item_id", item.id)
          .eq("step_number", qrData.step);

        if (existingScan && existingScan.length > 0) {
          alert("Already scanned at this step");
          return;
        }

        // ⭐ Insert scan history
        await supabase.from("scan_history").insert({
        item_id: item.id,
        route_id: item.route_id,
        step_number: qrData.step,
        scanned_by: localStorage.getItem("employee_id"),
        location: qrData.location || item.current_location,
        scan_type: "scan",
        scan_time: new Date().toISOString()
    });

        // ⭐ Update product item status
        await supabase
          .from("product_items")
          .update({
            current_step: expectedStep,
            scan_count: (scanCount || 0) + 1,
            current_location: qrData.location || item.current_location
          })
          .eq("id", item.id);

        alert("Scan Successful ✅");

      } catch (err) {
        console.log(err);
        alert("Invalid QR Data");
      }
    }

    function onScanError() {}

    return () => {
      scanner.clear().catch(() => {});
    };

  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-6">
        Scan Product QR
      </h1>

      <div
        id="qr-reader"
        className="border rounded-xl overflow-hidden"
      ></div>
    </div>
  );
}