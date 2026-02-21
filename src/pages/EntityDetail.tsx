import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function EntityDetail() {

  const { id } = useParams();
  const [route, setRoute] = useState<any>(null);
  const [entity, setEntity] = useState<any>(null);
  const [routeSteps, setRouteSteps] = useState<any[]>([]);
  const [scanLogs, setScanLogs] = useState<any[]>([]);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  async function loadData() {

  console.log("URL PARAM ID →", id);

  if (!id) return;

  // Fetch entity
  const { data: entityData, error } = await supabase
    .from("product_items")
    .select("*")
    .eq("id", id)
    .single();

  console.log("ENTITY DATA →", entityData);
  console.log("ENTITY ERROR →", error);

  setEntity(entityData);

  if (!entityData) return;

  // Fetch route steps
  const { data: routeData } = await supabase
    .from("route_steps")
    .select("*")
    .eq("route_id", entityData.route_id)
    .order("order_number");

  console.log("ROUTE STEPS →", routeData);

  setRouteSteps(routeData || []);

  // Fetch scan logs
  const { data: scanData } = await supabase
    .from("scan_history")
    .select("*")
    .eq("item_id", entityData.id)
    .order("step_number");

  console.log("SCAN LOGS →", scanData);

  setScanLogs(scanData || []);
}

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-xl font-bold">
        Tracking Details
      </h1>

      {entity && (
        <div className="border rounded-xl p-6">

          <h2 className="font-semibold">
            {entity.product_id}
          </h2>

          <p className="text-sm text-muted-foreground">
            Batch: {entity.batch_number}
          </p>

          {/* Timeline */}
          <div className="border-l-2 pl-6 mt-6 space-y-6">

            {routeSteps.map(step => {

              const scan = scanLogs.find(
                s => Number(s.step_number) === Number(step.order_number)
            );

              return (
                <div key={step.id} className="relative">

                  <div className={`w-3 h-3 rounded-full absolute -left-[22px]
                    ${scan ? "bg-green-500" : "bg-gray-400"}`}>
                  </div>

                  <p className="font-medium">
                    {step.level} → {step.city}
                  </p>

                  {scan && (
                    <p className="text-xs text-green-600">
                      Scanned at {new Date(scan.scan_time).toLocaleString()}
                    </p>
                  )}

                </div>
              );
            })}

          </div>

        </div>
      )}

    </div>
  );
}