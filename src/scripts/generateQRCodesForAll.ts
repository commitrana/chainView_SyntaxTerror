import { supabase } from '@/lib/supabase';
import QRCode from 'qrcode';

async function generateQRForItem(item: any) {
  try {
    console.log(`Generating QR for item: ${item.serial_number || item.id}`);

    // External QR Data
    const externalQRData = {
      type: "EXTERNAL",
      itemId: item.serial_number || item.id,
      productId: item.product_id,
      batchNumber: item.batch_number,
      scanCount: item.scan_count || 0,
      productName: "Product",
      currentState: item.current_state || "Unknown",
      requiredScans: 1
    };

    const internalQRData = {
      type: "INTERNAL",
      itemId: item.serial_number || item.id,
      productId: item.product_id,
      batchNumber: item.batch_number,
      claimed: false,
      claimable: false,
      claimWindow: 3600
    };

    // Generate Images
    const externalQRImage = await QRCode.toDataURL(JSON.stringify(externalQRData));
    const internalQRImage = await QRCode.toDataURL(JSON.stringify(internalQRData));

    const externalQRPath = `qr-codes/external/${item.serial_number || item.id}-EXT.png`;
    const internalQRPath = `qr-codes/internal/${item.serial_number || item.id}-INT.png`;

    // Upload to storage
    const { error: extError } = await supabase.storage
      .from("qr-bucket")
      .upload(externalQRPath, dataURLtoBlob(externalQRImage), {
        upsert: true,
        contentType: 'image/png'
      });

    if (extError) {
      console.error(`Error uploading external QR for ${item.id}:`, extError);
      return false;
    }

    const { error: intError } = await supabase.storage
      .from("qr-bucket")
      .upload(internalQRPath, dataURLtoBlob(internalQRImage), {
        upsert: true,
        contentType: 'image/png'
      });

    if (intError) {
      console.error(`Error uploading internal QR for ${item.id}:`, intError);
      return false;
    }

    // Save paths in DB
    const { error: updateError } = await supabase
      .from("product_items")
      .update({
        external_qr_path: externalQRPath,
        internal_qr_path: internalQRPath
      })
      .eq("id", item.id);

    if (updateError) {
      console.error(`Error updating DB for ${item.id}:`, updateError);
      return false;
    }

    console.log(`✅ QR codes generated for ${item.serial_number || item.id}`);
    return true;
  } catch (err) {
    console.error(`❌ Error generating QR for ${item.id}:`, err);
    return false;
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

export async function generateQRCodesForAllItems() {
  try {
    console.log('🚀 Starting QR code generation for all items...');
    
    // Fetch all product items
    const { data: items, error } = await supabase
      .from('product_items')
      .select('*');

    if (error) throw error;

    console.log(`📦 Found ${items.length} items to process`);

    let successCount = 0;
    let failCount = 0;
    let skippedCount = 0;

    for (const item of items) {
      // Skip if QR codes already exist
      if (item.external_qr_path && item.internal_qr_path) {
        console.log(`⏭️ Skipping ${item.serial_number || item.id} - QR codes already exist`);
        skippedCount++;
        continue;
      }

      const success = await generateQRForItem(item);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`
      ✅✅✅ GENERATION COMPLETE ✅✅✅
      📊 Summary:
      - Total items: ${items.length}
      - Successfully generated: ${successCount}
      - Skipped (already had QR): ${skippedCount}
      - Failed: ${failCount}
    `);

    return {
      total: items.length,
      success: successCount,
      skipped: skippedCount,
      failed: failCount
    };

  } catch (error) {
    console.error('❌ Error in batch generation:', error);
    throw error;
  }
}