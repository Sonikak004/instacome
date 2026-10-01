import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Users, CheckCircle, XCircle, Clock, ShieldAlert } from 'lucide-react';

// TODO: Replace with actual Supabase URL and Anon Key when the backend is live.
const supabase = createClient('http://127.0.0.1:54321', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder');

type Provider = {
  id: string;
  full_name: string;
  phone_number: string;
  categories: string[];
  kyc_status: string;
  admin_approval_status: string;
  created_at: string;
};

export default function App() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data for demo purposes since local DB might not be running yet
  const mockProviders: Provider[] = [
    {
      id: '1',
      full_name: 'Rahul Sharma',
      phone_number: '+91 9876543210',
      categories: ['chef'],
      kyc_status: 'pending',
      admin_approval_status: 'pending',
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      full_name: 'Priya Patel',
      phone_number: '+91 8765432109',
      categories: ['laundry'],
      kyc_status: 'approved',
      admin_approval_status: 'approved',
      created_at: new Date().toISOString()
    },
    {
      id: '3',
      full_name: 'Urban Pest Experts',
      phone_number: '+91 7654321098',
      categories: ['pest_control'],
      kyc_status: 'pending',
      admin_approval_status: 'pending',
      created_at: new Date().toISOString()
    }
  ];

  useEffect(() => {
    // In a real environment, we fetch from Supabase here
    // For this demo, we'll just load the mock data
    setProviders(mockProviders);
    setLoading(false);
  }, []);

  const handleApprove = async (id: string) => {
    // Optimistic UI update
    setProviders(providers.map(p => p.id === id ? { ...p, admin_approval_status: 'approved', kyc_status: 'approved' } : p));
    
    // Database update (will fail silently if DB isn't running, but UI will update for demo)
    await supabase.from('providers').update({ admin_approval_status: 'approved', kyc_status: 'approved' }).eq('id', id);
  };

  const handleReject = async (id: string) => {
    setProviders(providers.map(p => p.id === id ? { ...p, admin_approval_status: 'rejected', kyc_status: 'rejected' } : p));
    await supabase.from('providers').update({ admin_approval_status: 'rejected', kyc_status: 'rejected' }).eq('id', id);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-[#152d55] text-white p-6 hidden md:block">
        <h1 className="text-2xl font-bold text-[#f45127] tracking-widest mb-10">InstaCome</h1>
        <nav className="space-y-4">
          <a href="#" className="flex items-center space-x-3 bg-white/10 p-3 rounded-lg text-white font-medium">
            <Users size={20} />
            <span>Providers</span>
          </a>
          <a href="#" className="flex items-center space-x-3 p-3 text-gray-400 hover:text-white transition">
            <ShieldAlert size={20} />
            <span>Disputes</span>
          </a>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Provider Approvals</h2>
            <p className="text-gray-500 mt-1">Review KYC documents and approve new partners.</p>
          </div>
        </header>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm font-semibold">
                <th className="p-4 pl-6">Provider Name</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Services</th>
                <th className="p-4">KYC Status</th>
                <th className="p-4">Approval</th>
                <th className="p-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {providers.map((provider) => (
                <tr key={provider.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                  <td className="p-4 pl-6 font-medium text-gray-900">{provider.full_name}</td>
                  <td className="p-4 text-gray-600">{provider.phone_number}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      {provider.categories.map(cat => (
                        <span key={cat} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-semibold uppercase">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4">
                    {provider.kyc_status === 'approved' ? (
                      <span className="flex items-center text-green-600 text-sm font-medium"><CheckCircle size={16} className="mr-1"/> Verified</span>
                    ) : provider.kyc_status === 'rejected' ? (
                      <span className="flex items-center text-red-600 text-sm font-medium"><XCircle size={16} className="mr-1"/> Rejected</span>
                    ) : (
                      <span className="flex items-center text-orange-500 text-sm font-medium"><Clock size={16} className="mr-1"/> Pending Review</span>
                    )}
                  </td>
                  <td className="p-4">
                    {provider.admin_approval_status === 'approved' ? (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">LIVE</span>
                    ) : provider.admin_approval_status === 'rejected' ? (
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">BANNED</span>
                    ) : (
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">HIDDEN</span>
                    )}
                  </td>
                  <td className="p-4 text-right pr-6 space-x-2">
                    {provider.admin_approval_status === 'pending' && (
                      <div className="flex flex-col items-end gap-2">
                        <button className="text-sm font-semibold text-blue-600 hover:underline">
                          View Documents
                        </button>
                        <div className="space-x-2">
                          <button 
                            onClick={() => handleApprove(provider.id)}
                            className="px-4 py-2 bg-[#f45127] text-white text-sm font-bold rounded-lg hover:bg-[#d6411d] transition shadow-sm"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleReject(provider.id)}
                            className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-300 transition"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {providers.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">No providers found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
