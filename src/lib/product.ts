import { supabase } from "@/lib/supabase";

export async function createProductItem(
  product_id: string,
  batch_number: string,
  serial_number: string,
  manufactured_date: string,
  expiry_date: string
) {
  try {
    console.log("Attempting to insert into product_items with:", {
      product_id,
      batch_number,
      serial_number,
      manufactured_date,
      expiry_date,
      current_state: "Factory",
      current_location: "Factory"
    });

    const { data, error } = await supabase
      .from("product_items")
      .insert({
        product_id,
        batch_number,
        serial_number,
        manufactured_date,
        expiry_date,
        current_state: "Factory",
        current_location: "Factory"
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      throw error;
    }

    console.log("Insert successful, returned data:", data);
    return data;
    
  } catch (error) {
    console.error("Error in createProductItem:", error);
    throw error;
  }
}