import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function EntityDetail() {

  const { id } = useParams();
  const [route, setRoute] = useState<any>(null);
  const [entity, setEntity] = useState<any>(null);
  const [routeSteps, setRouteSteps] = useState<any[]>([]);
  const [scanLogs, setScanLogs] = useState<any[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [editedEntity, setEditedEntity] = useState<any>(null);
  const [editedSteps, setEditedSteps] = useState<any[]>([]);
  useEffect(() => {
    if (id) loadData();
  }, [id]);

  async function saveChanges() {
  const { error } = await supabase
    .from("product_items")
    .update({
      product_id: editedEntity.product_id,
      batch_number: editedEntity.batch_number,
      current_location: editedEntity.current_location,
      status: editedEntity.status
    })
    .eq("id", id);

  if (!error) {
    alert("Updated successfully");
    setEntity(editedEntity);
    setEditMode(false);
  }
}

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
  setEditedEntity(entityData);

  if (!entityData) return;

  // Fetch route steps
  const { data: routeData } = await supabase
    .from("route_steps")
    .select("*")
    .eq("route_id", entityData.route_id)
    .order("order_number");

  console.log("ROUTE STEPS →", routeData);

  setRouteSteps(routeData || []);
  setEditedSteps(routeData || []);

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
      <div className="border rounded-xl p-6 space-y-4 bg-white shadow-md">

        {/* EDIT BUTTON */}
        <button
          onClick={() => {
            setEditMode(!editMode);
            setEditedEntity(entity);
          }}
          className="bg-purple-500 text-white px-3 py-1 rounded"
        >
          {editMode ? "Cancel" : "Edit Details"}
        </button>

        {/* PRODUCT ID */}
        <div>
          <p className="text-sm text-gray-700">Product ID</p>

          {editMode ? (
            <input
              value={editedEntity?.product_id || ""}
              onChange={(e) =>
                setEditedEntity({
                  ...editedEntity,
                  product_id: e.target.value
                })
              }
              className="border p-2 rounded w-full"
            />
          ) : (
            <h2 className="font-semibold">{entity.product_id}</h2>
          )}
        </div>

        {/* BATCH */}
        <div>
          <p className="text-sm text-muted-foreground">Batch</p>
          <p>{entity.batch_number}</p>
        </div>

        {/* SAVE BUTTON */}
        {editMode && (
          <button
            onClick={async () => {
              const { error } = await supabase
                .from("product_items")
                .update(editedEntity)
                .eq("id", entity.id);

              if (!error) {
                alert("Updated Successfully");
                window.location.reload();
              }
            }}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Save Changes
          </button>
          
        )}
        {editMode && (
  <button
    onClick={async () => {

      for (const step of editedSteps) {
        await supabase
          .from("route_steps")
          .update({
            level: step.level,
            city: step.city
          })
          .eq("id", step.id);
      }

      alert("Route Updated Successfully");
      loadData();
      setEditMode(false);

    }}
    className="bg-blue-500 text-white px-4 py-2 rounded ml-2"
  >
    Save Route Steps
  </button>
)}

        {/* TIMELINE */}
        <div className="border-l-2 pl-6 mt-6 space-y-6">
          {editedSteps.map((step, index) => {

            const scan = scanLogs?.find(
              s => Number(s.step_number) === Number(step.order_number)
            );

            return (
              <div key={step.id} className="relative">

                <div className={`w-3 h-3 rounded-full absolute -left-[22px]
                  ${scan ? "bg-green-500" : "bg-gray-400"}`}>
                </div>

                {editMode ? (
  <>
    <input
      value={step.level}
      onChange={(e) => {
        const updated = [...editedSteps];
        updated[index].level = e.target.value;
        setEditedSteps(updated);
      }}
      className="border border-gray-400 bg-gray-50 text-black p-2 rounded w-full"
    />

    <input
      value={step.city}
      onChange={(e) => {
        const updated = [...editedSteps];
        updated[index].city = e.target.value;
        setEditedSteps(updated);
      }}
      className="border p-1 rounded w-full mt-1"
    />
  </>
) : (
  <p className="font-medium">
    {step.level} → {step.city}
  </p>
)}

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