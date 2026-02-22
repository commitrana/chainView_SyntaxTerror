import QRCode from "qrcode";
import { supabase } from "@/lib/supabase";

export async function generateQR(item: any) {

  try {

    console.log("QR Generation Started");

    // External QR Data
    const externalQRData = {
      type: "EXTERNAL",
      itemId: item.serial_number,
      productId: item.product_id,
      batchNumber: item.batch_number,
      scanCount: 0,
      productName: "Product",
      currentState: item.current_state,
      requiredScans: 1
    };

    const internalQRData = {
      type: "INTERNAL",
      itemId: item.serial_number,
      productId: item.product_id,
      batchNumber: item.batch_number,
      claimed: false,
      claimable: false,
      claimWindow: 3600
    };

    // Generate Images
    const externalQRImage = await QRCode.toDataURL(JSON.stringify(externalQRData));
    const internalQRImage = await QRCode.toDataURL(JSON.stringify(internalQRData));

    const externalQRPath = `qr-codes/external/${item.serial_number}-EXT.png`;
    const internalQRPath = `qr-codes/internal/${item.serial_number}-INT.png`;

    // Upload to storage
    await supabase.storage
      .from("qr-bucket")
      .upload(externalQRPath, dataURLtoBlob(externalQRImage), {
        upsert: true
      });

    await supabase.storage
      .from("qr-bucket")
      .upload(internalQRPath, dataURLtoBlob(internalQRImage), {
        upsert: true
      });

    // Save paths in DB
    await supabase
      .from("product_items")
      .update({
        external_qr_path: externalQRPath,
        internal_qr_path: internalQRPath
      })
      .eq("id", item.id);

  } catch (err) {
    console.error("QR Generation Error", err);
  }
}

function dataURLtoBlob(dataurl: string) {
  const arr = dataurl.split(",");
  const mime = arr[0].match(/:(.*?);/)![1];

  const bstr = atob(arr[1]);
  const u8arr = new Uint8Array(bstr.length);

  for (let i = 0; i < bstr.length; i++) {
    u8arr[i] = bstr.charCodeAt(i);
  }

  return new Blob([u8arr], { type: mime });
}