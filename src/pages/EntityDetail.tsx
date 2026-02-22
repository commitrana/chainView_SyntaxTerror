import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Download, QrCode } from "lucide-react";

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

          {/* BATCH & SERIAL NUMBERS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-gray-400 text-sm">Batch Number</p>
              <p className="font-semibold mt-1">{entity.batch_number || '-'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Serial Number</p>
              <p className="font-semibold mt-1">{entity.serial_number || '-'}</p>
            </div>
          </div>

          {/* MANUFACTURED & EXPIRY DATES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-gray-400 text-sm">Manufactured Date</p>
              <p className="font-semibold mt-1">
                {entity.manufactured_date 
                  ? new Date(entity.manufactured_date).toLocaleDateString() 
                  : '-'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Expiry Date</p>
              <p className="font-semibold mt-1">
                {entity.expiry_date 
                  ? new Date(entity.expiry_date).toLocaleDateString() 
                  : '-'}
              </p>
            </div>
          </div>

          {/* CURRENT STATE & LOCATION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-gray-400 text-sm">Current State</p>
              <p className="font-semibold mt-1">{entity.current_state || '-'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Current Location</p>
              <p className="font-semibold mt-1">{entity.current_location || '-'}</p>
            </div>
          </div>

          {/* QR CODES SECTION */}
          <div className="mt-8 mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <QrCode className="h-5 w-5 text-blue-400" />
              Product QR Codes
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* External QR Code */}
              <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-300">External QR Code</p>
                  {entity.external_qr_path && (
                    <a
                      href={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/qr-bucket/${entity.external_qr_path}`}
                      download
                      className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      <Download className="h-3 w-3" />
                      Download
                    </a>
                  )}
                </div>
                
                {entity.external_qr_path ? (
                  <div className="bg-white rounded-xl p-3 inline-block">
                    <img
                      src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/qr-bucket/${entity.external_qr_path}`}
                      alt="External QR Code"
                      className="w-40 h-40"
                    />
                  </div>
                ) : (
                  <div className="bg-white/5 rounded-xl p-8 text-center border border-dashed border-white/20">
                    <QrCode className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No external QR code</p>
                  </div>
                )}
                
                <div className="mt-3 text-xs text-gray-400">
                  <p>Type: EXTERNAL - For public scanning</p>
                  <p>Contains: Product info, current state, scan tracking</p>
                </div>
              </div>

              {/* Internal QR Code */}
              <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-300">Internal QR Code</p>
                  {entity.internal_qr_path && (
                    <a
                      href={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/qr-bucket/${entity.internal_qr_path}`}
                      download
                      className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      <Download className="h-3 w-3" />
                      Download
                    </a>
                  )}
                </div>
                
                {entity.internal_qr_path ? (
                  <div className="bg-white rounded-xl p-3 inline-block">
                    <img
                      src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/qr-bucket/${entity.internal_qr_path}`}
                      alt="Internal QR Code"
                      className="w-40 h-40"
                    />
                  </div>
                ) : (
                  <div className="bg-white/5 rounded-xl p-8 text-center border border-dashed border-white/20">
                    <QrCode className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No internal QR code</p>
                  </div>
                )}
                
                <div className="mt-3 text-xs text-gray-400">
                  <p>Type: INTERNAL - For internal tracking</p>
                  <p>Contains: Claim info, batch details, tracking data</p>
                </div>
              </div>
            </div>
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

          {/* SCAN HISTORY TABLE */}
          {scanLogs.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Scan History</h3>
              <div className="bg-white/5 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-white/10">
                    <tr>
                      <th className="px-4 py-2 text-left">Step</th>
                      <th className="px-4 py-2 text-left">Location</th>
                      <th className="px-4 py-2 text-left">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scanLogs.map((scan) => (
                      <tr key={scan.id} className="border-t border-white/10">
                        <td className="px-4 py-2">Step {scan.step_number}</td>
                        <td className="px-4 py-2">{scan.location || '-'}</td>
                        <td className="px-4 py-2">
                          {new Date(scan.scan_time).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}