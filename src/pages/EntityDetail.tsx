import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function EntityDetail() {
  const { id } = useParams();
  const [entity, setEntity] = useState<any>(null);
  const [routeSteps, setRouteSteps] = useState<any[]>([]);
  const [scanLogs, setScanLogs] = useState<any[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [editedEntity, setEditedEntity] = useState<any>(null);
  const [editedSteps, setEditedSteps] = useState<any[]>([]);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  async function loadData() {
    if (!id) return;

    // ENTITY
    const { data: entityData } = await supabase
      .from("product_items")
      .select("*")
      .eq("id", id)
      .single();

    setEntity(entityData);
    setEditedEntity(entityData);

    if (!entityData) return;

    // ROUTE STEPS
    const { data: routeData } = await supabase
      .from("route_steps")
      .select("*")
      .eq("route_id", entityData.route_id)
      .order("order_number");

    setRouteSteps(routeData || []);
    setEditedSteps(routeData || []);

    // SCAN HISTORY
    const { data: scanData } = await supabase
      .from("scan_history")
      .select("*")
      .eq("item_id", entityData.id)
      .order("step_number");

    setScanLogs(scanData || []);
  }

  async function saveEntity() {
    await supabase.from("product_items").update(editedEntity).eq("id", id);
    alert("Updated successfully");
    loadData();
    setEditMode(false);
  }

  async function saveRoute() {
    for (const step of editedSteps) {
      await supabase
        .from("route_steps")
        .update({ level: step.level, city: step.city })
        .eq("id", step.id);
    }
    alert("Route updated");
    loadData();
    setEditMode(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020617] via-[#0b1120] to-[#020617] text-white p-8">

      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Product Tracking
        </h1>
        <p className="text-gray-400 mt-2">
          View route journey, edit details and track scans
        </p>
      </div>

      {entity && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">

          {/* EDIT BUTTON */}
          <div className="flex justify-between mb-6">
            <h2 className="text-xl font-semibold">Tracking Details</h2>

            <button
              onClick={() => {
                setEditMode(!editMode);
                setEditedEntity(entity);
              }}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 px-5 py-2 rounded-lg font-semibold hover:scale-105 transition"
            >
              {editMode ? "Cancel" : "Edit"}
            </button>
          </div>

          {/* PRODUCT ID */}
          <div className="mb-4">
            <p className="text-gray-400 text-sm">Product ID</p>

            {editMode ? (
              <input
                value={editedEntity?.product_id || ""}
                onChange={(e) =>
                  setEditedEntity({
                    ...editedEntity,
                    product_id: e.target.value,
                  })
                }
                className="bg-[#020617] border border-gray-600 focus:border-blue-500 outline-none p-3 rounded-lg w-full mt-1"
              />
            ) : (
              <p className="text-lg font-semibold mt-1">{entity.product_id}</p>
            )}
          </div>

          {/* BATCH */}
          <div className="mb-6">
            <p className="text-gray-400 text-sm">Batch Number</p>
            <p className="font-semibold mt-1">{entity.batch_number}</p>
          </div>

          {/* SAVE ENTITY */}
          {editMode && (
            <button
              onClick={saveEntity}
              className="bg-gradient-to-r from-emerald-500 to-green-600 px-6 py-2 rounded-lg font-semibold hover:scale-105 transition"
            >
              Save Details
            </button>
          )}

          {/* ROUTE SAVE */}
          {editMode && (
            <button
              onClick={saveRoute}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-2 rounded-lg font-semibold hover:scale-105 transition ml-3"
            >
              Save Route
            </button>
          )}

          {/* TIMELINE */}
          <div className="mt-10">
            <h3 className="text-lg font-semibold mb-6">Route Timeline</h3>

            <div className="border-l border-gray-700 pl-6 space-y-8">
              {editedSteps.map((step, index) => {
                const scan = scanLogs?.find(
                  (s) => Number(s.step_number) === Number(step.order_number)
                );

                return (
                  <div key={step.id} className="relative">

                    {/* DOT */}
                    <div
                      className={`w-4 h-4 rounded-full ring-4 ring-[#020617] absolute -left-[26px]
                      ${scan ? "bg-green-500" : "bg-gray-500"}`}
                    />

                    {/* STEP INFO */}
                    {editMode ? (
                      <>
                        <input
                          value={step.level}
                          onChange={(e) => {
                            const updated = [...editedSteps];
                            updated[index].level = e.target.value;
                            setEditedSteps(updated);
                          }}
                          className="bg-[#020617] border border-gray-600 p-2 rounded-lg w-full"
                        />

                        <input
                          value={step.city}
                          onChange={(e) => {
                            const updated = [...editedSteps];
                            updated[index].city = e.target.value;
                            setEditedSteps(updated);
                          }}
                          className="bg-[#020617] border border-gray-600 p-2 rounded-lg w-full mt-2"
                        />
                      </>
                    ) : (
                      <p className="font-semibold text-lg">
                        {step.level} → {step.city}
                      </p>
                    )}

                    {/* SCAN TIME */}
                    {scan && (
                      <p className="text-sm text-green-400 mt-1">
                        Scanned at {new Date(scan.scan_time).toLocaleString()}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}