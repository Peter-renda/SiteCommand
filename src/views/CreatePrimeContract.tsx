import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ProjectNav from "../components/ProjectNav";
import { Plus, Trash2, Info, ChevronDown } from "lucide-react";
type SOVItem = {
  budget_code: string;
  description: string;
  amount: number;
  billed_to_date: number;
};
export default function CreatePrimeContract() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    contract_number: "",
    owner_client: "",
    title: "",
    status: "Draft",
    executed: false,
    default_retainage: 0,
    contractor: "",
    architect_engineer: "",
    description: "",
    inclusions: "",
    exclusions: "",
    start_date: "",
    estimated_completion_date: "",
    actual_completion_date: "",
    signed_contract_received_date: "",
    contract_termination_date: "",
    is_private: true,
    non_admin_access: [],
    allow_non_admin_sov_view: false,
  });
  const [sovItems, setSovItems] = useState<SOVItem[]>([]);
  const addLine = () => {
    setSovItems([...sovItems, { budget_code: "", description: "", amount: 0, billed_to_date: 0 }]);
  };
  const removeLine = (index: number) => {
    setSovItems(sovItems.filter((_, i) => i !== index));
  };
  const updateSovItem = (index: number, field: keyof SOVItem, value: any) => {
    const next = [...sovItems];
    next[index] = { ...next[index], [field]: value };
    setSovItems(next);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${id}/prime-contracts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, sov_items: sovItems }),
      });
      if (res.ok) {
        navigate(`/projects/${id}/prime-contracts`);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  const totalAmount = sovItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalBilled = sovItems.reduce((sum, item) => sum + (Number(item.billed_to_date) || 0), 0);
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <ProjectNav projectId={id!} />
      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">New Prime Contract</h1>
          <div className="flex gap-3">
            <button 
              type="button"
              onClick={() => navigate(`/projects/${id}/prime-contracts`)}
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="bg-[#ff5a1f] hover:bg-[#e64a19] text-white px-6 py-2 rounded font-semibold text-sm transition-colors disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
        {/* General Information */}
        <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">General Information</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Contract #</label>
              <input 
                type="text" 
                value={formData.contract_number}
                onChange={e => setFormData({...formData, contract_number: e.target.value})}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="2"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Owner/Client</label>
              <select 
                value={formData.owner_client}
                onChange={e => setFormData({...formData, owner_client: e.target.value})}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select company</option>
                <option value="Client A">Client A</option>
                <option value="Client B">Client B</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Title</label>
              <input 
                type="text" 
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter title"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Status <span className="text-red-500">*</span></label>
              <select 
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value})}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Draft">Draft</option>
                <option value="Executed">Executed</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Executed <span className="text-red-500">*</span></label>
              <div className="flex items-center h-10">
                <input 
                  type="checkbox" 
                  checked={formData.executed}
                  onChange={e => setFormData({...formData, executed: e.target.checked})}
                  className="w-4 h-4 rounded border-gray-300"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Default Retainage</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={formData.default_retainage}
                  onChange={e => setFormData({...formData, default_retainage: Number(e.target.value)})}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Contractor</label>
              <select 
                value={formData.contractor}
                onChange={e => setFormData({...formData, contractor: e.target.value})}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select contractor</option>
                <option value="Contractor X">Contractor X</option>
              </select>
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Architect/Engineer</label>
              <select 
                value={formData.architect_engineer}
                onChange={e => setFormData({...formData, architect_engineer: e.target.value})}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select architect/engineer</option>
                <option value="Arch A">Arch A</option>
              </select>
            </div>
            <div className="space-y-1 md:col-span-3">
              <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
              <textarea 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 h-24"
              />
            </div>
          </div>
        </section>
        {/* Schedule of Values */}
        <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Schedule of Values</h2>
            <button 
              type="button"
              onClick={addLine}
              className="text-[#ff5a1f] text-xs font-bold hover:underline"
            >
              Add Group
            </button>
          </div>
          <div className="bg-blue-50 px-6 py-3 flex items-center gap-3 border-b border-blue-100">
            <Info className="w-4 h-4 text-blue-600" />
            <p className="text-xs text-blue-800">This contract's default accounting method is amount-based. To use budget codes with a unit of measure association, select Change to Unit/Quantity.</p>
            <button type="button" className="ml-auto text-xs font-bold text-gray-700 bg-white border border-gray-200 px-3 py-1 rounded hover:bg-gray-50">Change to Unit/Quantity</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 font-bold text-gray-500 text-[10px] uppercase tracking-wider w-12 text-center">#</th>
                  <th className="px-4 py-3 font-bold text-gray-500 text-[10px] uppercase tracking-wider">Budget Code</th>
                  <th className="px-4 py-3 font-bold text-gray-500 text-[10px] uppercase tracking-wider">Description</th>
                  <th className="px-4 py-3 font-bold text-gray-500 text-[10px] uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 font-bold text-gray-500 text-[10px] uppercase tracking-wider">Billed to Date</th>
                  <th className="px-4 py-3 font-bold text-gray-500 text-[10px] uppercase tracking-wider">Amount Remaining</th>
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sovItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center">
                          <Plus className="w-8 h-8 text-orange-500" />
                        </div>
                        <p className="text-gray-500 font-medium">You Have No Line Items Yet</p>
                        <button 
                          type="button"
                          onClick={addLine}
                          className="bg-[#ff5a1f] text-white px-4 py-2 rounded font-bold text-xs"
                        >
                          Add Line
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sovItems.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-center text-gray-400 font-mono text-xs">{index + 1}</td>
                      <td className="px-4 py-3">
                        <input 
                          type="text" 
                          value={item.budget_code}
                          onChange={e => updateSovItem(index, 'budget_code', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input 
                          type="text" 
                          value={item.description}
                          onChange={e => updateSovItem(index, 'description', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input 
                          type="number" 
                          value={item.amount}
                          onChange={e => updateSovItem(index, 'amount', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input 
                          type="number" 
                          value={item.billed_to_date}
                          onChange={e => updateSovItem(index, 'billed_to_date', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
                        />
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                        ${(item.amount - item.billed_to_date).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <button 
                          type="button"
                          onClick={() => removeLine(index)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {sovItems.length > 0 && (
                <tfoot className="bg-gray-50 font-bold">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-right text-xs uppercase text-gray-500">Total:</td>
                    <td className="px-4 py-3 text-xs">${totalAmount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs">${totalBilled.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs">${(totalAmount - totalBilled).toLocaleString()}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3">
            <button 
              type="button"
              onClick={addLine}
              className="bg-[#ff5a1f] text-white px-4 py-2 rounded font-bold text-xs"
            >
              Add Line
            </button>
            <div className="relative">
              <button type="button" className="flex items-center gap-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 px-3 py-2 rounded hover:bg-gray-50">
                Import <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
        {/* Inclusions & Exclusions */}
        <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Inclusions & Exclusions</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Inclusions</label>
              <textarea 
                value={formData.inclusions}
                onChange={e => setFormData({...formData, inclusions: e.target.value})}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 h-24"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Exclusions</label>
              <textarea 
                value={formData.exclusions}
                onChange={e => setFormData({...formData, exclusions: e.target.value})}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 h-24"
              />
            </div>
          </div>
        </section>
        {/* Contract Dates */}
        <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Contract Dates</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Start Date</label>
              <input 
                type="date" 
                value={formData.start_date}
                onChange={e => setFormData({...formData, start_date: e.target.value})}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Estimated Completion Date</label>
              <input 
                type="date" 
                value={formData.estimated_completion_date}
                onChange={e => setFormData({...formData, estimated_completion_date: e.target.value})}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Actual Completion Date</label>
              <input 
                type="date" 
                value={formData.actual_completion_date}
                onChange={e => setFormData({...formData, actual_completion_date: e.target.value})}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Signed Contract Received Date</label>
              <input 
                type="date" 
                value={formData.signed_contract_received_date}
                onChange={e => setFormData({...formData, signed_contract_received_date: e.target.value})}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Contract Termination Date</label>
              <input 
                type="date" 
                value={formData.contract_termination_date}
                onChange={e => setFormData({...formData, contract_termination_date: e.target.value})}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </section>
        {/* Contract Privacy */}
        <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Contract Privacy</h2>
          </div>
          <div className="p-6 space-y-6">
            <p className="text-xs text-gray-500">Using the privacy setting allows only project admins and the select non-admin users access.</p>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                checked={formData.is_private}
                onChange={e => setFormData({...formData, is_private: e.target.checked})}
                className="w-4 h-4 rounded border-gray-300"
              />
              <label className="text-xs font-bold text-gray-700 uppercase">Private</label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Access for Non-Admin Users</label>
                <select className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option value="">Select Values</option>
                </select>
              </div>
              <div className="flex items-center gap-2 h-10">
                <input 
                  type="checkbox" 
                  checked={formData.allow_non_admin_sov_view}
                  onChange={e => setFormData({...formData, allow_non_admin_sov_view: e.target.checked})}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <label className="text-xs text-gray-600">Allow these non-admin users to view the SOV items.</label>
              </div>
            </div>
          </div>
        </section>
        <div className="flex items-center justify-end gap-6 pt-6">
          <p className="text-[10px] text-gray-400 italic"><span className="text-red-500">*</span> Required fields</p>
          <button 
            type="button"
            onClick={() => navigate(`/projects/${id}/prime-contracts`)}
            className="text-sm font-bold text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={loading}
            className="bg-[#ff5a1f] hover:bg-[#e64a19] text-white px-8 py-2.5 rounded font-bold text-sm transition-colors disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
