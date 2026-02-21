import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Employee = {
  id: string;
  name: string;
  level: string;
  phone: string;
  email: string;
  location: string;
  role: string;
};

export default function Employees() {

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
  }, []);

  async function fetchEmployees() {
    setLoading(true);

    const { data, error } = await supabase
      .from("employees")
      .select("id,name,level,phone,email,location,role");

    if (!error) {
      setEmployees(data || []);
    }

    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Employees</h1>

      <div className="rounded-xl border bg-card overflow-x-auto">
        <Table>

          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>

            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : (
              employees.map(emp => (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">{emp.name}</TableCell>
                  <TableCell>{emp.level || "-"}</TableCell>
                  <TableCell>{emp.phone || "-"}</TableCell>
                  <TableCell>{emp.email || "-"}</TableCell>
                  <TableCell>{emp.location || "-"}</TableCell>
                  <TableCell>{emp.role || "-"}</TableCell>
                </TableRow>
              ))
            )}

          </TableBody>

        </Table>
      </div>
    </div>
  );
}