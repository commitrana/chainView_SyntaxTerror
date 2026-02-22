import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { generateQR } from "@/lib/qr";
import { createProductItem } from "@/lib/product";

export default function CreateProductItem() {

  const [product_id, setProductId] = useState("");
  const [batch_number, setBatchNumber] = useState("");
  const [serial_number, setSerialNumber] = useState("");
  const [manufactured_date, setManufacturedDate] = useState("");
  const [expiry_date, setExpiryDate] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreateItem() {
    // Validate required fields
    if (!product_id || !batch_number || !serial_number || !manufactured_date || !expiry_date) {
      alert("Please fill in all fields");
      return;
    }

    setLoading(true);
    
    try {
      console.log("Step 1 — Creating product item with data:", {
        product_id,
        batch_number,
        serial_number,
        manufactured_date,
        expiry_date
      });

      // Step 1 — Create Product Item
      const item = await createProductItem(
        product_id,
        batch_number,
        serial_number,
        manufactured_date,
        expiry_date
      );

      console.log("Step 2 — Product item created successfully:", item);

      // Step 2 — Generate QR Codes
      console.log("Step 3 — Generating QR for", item);
      await generateQR(item);
      
      console.log("Step 4 — QR generation complete");
      alert("Item Created + QR Generated ✅");
      
      // Clear form
      setProductId("");
      setBatchNumber("");
      setSerialNumber("");
      setManufacturedDate("");
      setExpiryDate("");
      
    } catch (err: any) {
      console.error("Error in handleCreateItem:", err);
      console.error("Error details:", {
        message: err.message,
        details: err.details,
        hint: err.hint,
        code: err.code
      });
      alert(`Error creating item: ${err.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create Product Item</h1>
      
      <input
        placeholder="Product ID"
        value={product_id}
        onChange={(e) => setProductId(e.target.value)}
        className="border p-2 w-full rounded"
        disabled={loading}
      />

      <input
        placeholder="Batch Number"
        value={batch_number}
        onChange={(e) => setBatchNumber(e.target.value)}
        className="border p-2 w-full rounded"
        disabled={loading}
      />

      <input
        placeholder="Serial Number"
        value={serial_number}
        onChange={(e) => setSerialNumber(e.target.value)}
        className="border p-2 w-full rounded"
        disabled={loading}
      />

      <input
        type="date"
        value={manufactured_date}
        onChange={(e) => setManufacturedDate(e.target.value)}
        className="border p-2 w-full rounded"
        disabled={loading}
      />

      <input
        type="date"
        value={expiry_date}
        onChange={(e) => setExpiryDate(e.target.value)}
        className="border p-2 w-full rounded"
        disabled={loading}
      />

      <button
        onClick={handleCreateItem}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded w-full disabled:bg-blue-300"
      >
        {loading ? "Creating..." : "Create Product Item"}
      </button>
    </div>
  );
}