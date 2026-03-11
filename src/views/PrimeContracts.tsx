import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import ProjectNav from "../components/ProjectNav";
import { Plus, FileDown, FileText, ChevronRight } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
export default function PrimeContracts() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`/api/projects/${id}/prime-contracts`)
      .then((res) => res.json())
      .then((data) => {
        setContracts(data);
        setLoading(false);
      });
  }, [id]);
  const exportToPDF = async (contractId: string) => {
    const res = await fetch(`/api/prime-contracts/${contractId}`);
    const contract = await res.json();
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text("PRIME CONTRACT", 105, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.text(`Contract #: ${contract.contract_number}`, 20, 40);
    doc.text(`Title: ${contract.title}`, 20, 50);
    doc.text(`Status: ${contract.status}`, 20, 60);
    doc.text(`Owner/Client: ${contract.owner_client}`, 20, 70);
    doc.text(`Contractor: ${contract.contractor}`, 20, 80);
    // Schedule of Values
    doc.setFontSize(16);
    doc.text("Schedule of Values", 20, 100);
    
    const sovData = contract.sov_items.map((item: any) => [
      item.budget_code,
      item.description,
      `$${item.amount.toLocaleString()}`,
      `$${item.billed_to_date.toLocaleString()}`,
      `$${(item.amount - item.billed_to_date).toLocaleString()}`
    ]);
    autoTable(doc, {
      startY: 110,
      head: [["Budget Code", "Description", "Amount", "Billed to Date", "Remaining"]],
      body: sovData,
    });
    doc.save(`Contract_${contract.contract_number}.pdf`);
  };
  return (
    <div className="min-h-screen bg-gray-50">
      <ProjectNav projectId={id!} />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Prime Contracts</h1>
            <p className="text-sm text-gray-500 mt-1">Manage owner contracts and schedule of values.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => navigate(`/projects/${id}/prime-contracts/new`)}
              className="bg-[#ff5a1f] hover:bg-[#e64a19] text-white px-4 py-2 rounded font-semibold text-sm transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create Contract
            </button>
          </div>
        </div>
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading contracts...</div>
        ) : contracts.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-xl py-20 text-center">
            <FileText className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No prime contracts yet</p>
            <button 
              onClick={() => navigate(`/projects/${id}/prime-contracts/new`)}
              className="text-[#ff5a1f] text-sm font-semibold mt-2 hover:underline"
            >
              Create your first contract
            </button>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 font-semibold text-gray-700">Contract #</th>
                  <th className="px-6 py-4 font-semibold text-gray-700">Title</th>
                  <th className="px-6 py-4 font-semibold text-gray-700">Owner/Client</th>
                  <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 font-semibold text-gray-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 font-mono text-gray-500">{contract.contract_number}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{contract.title}</td>
                    <td className="px-6 py-4 text-gray-600">{contract.owner_client}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        contract.status === 'Executed' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {contract.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => exportToPDF(contract.id)}
                          className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded transition-all"
                          title="Export to PDF"
                        >
                          <FileDown className="w-4 h-4" />
                        </button>
                        <Link 
                          to={`/projects/${id}/prime-contracts/${contract.id}`}
                          className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded transition-all"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
