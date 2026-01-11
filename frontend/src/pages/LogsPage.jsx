import { useState, useEffect } from "react";
import { Download, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config";

export default function LogsPage() {
    const [logs, setLogs] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState("all");

    const { token } = useAuth(); // Get token from auth context

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            try {
                const query = new URLSearchParams({
                    page: page.toString(),
                    limit: "50",
                    status: statusFilter
                });
                const res = await fetch(`${API_BASE_URL}/api/logs?${query}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.status === 401) { /* Handle unauthorized, e.g., redirect to login */ }
                const data = await res.json();
                setLogs(data);
            } catch (err) {
                console.error("Failed to fetch logs", err);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, [page, statusFilter, token]); // Add token to dependency array

    const handleExport = () => {
        window.open(`${API_BASE_URL}/api/logs/export?status=${statusFilter}`, "_blank");
    };

    return (
        <div className="min-h-screen bg-slate-950 p-6 text-slate-200">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">📋 Event Logs</h1>
                    <p className="text-slate-500 text-sm">System events, outages, and performance logs.</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Filter */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                            className="pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="offline">Offline</option>
                            <option value="warning">Warning</option>
                            <option value="online">Online</option>
                        </select>
                    </div>

                    {/* Export */}
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                        <Download size={16} />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-950 border-b border-slate-800 uppercase text-xs font-semibold text-slate-400">
                            <tr>
                                <th className="px-6 py-4">Time</th>
                                <th className="px-6 py-4">Device</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Latency</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {loading && logs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">Loading logs...</td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">No logs found.</td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-400 font-mono">
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-white">
                                            {log.device_name}
                                            <div className="text-xs text-slate-500 font-normal">{log.host}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-slate-800 rounded text-xs uppercase font-bold tracking-wider text-slate-400">{log.device_type}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${log.status === 'online' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                log.status === 'warning' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                    'bg-red-500/10 text-red-400 border-red-500/20'
                                                }`}>
                                                {log.status === 'online' && <span className="w-1.5 h-1.5 rounded-full bg-green-400" />}
                                                {log.status === 'warning' && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />}
                                                {log.status === 'offline' && <span className="w-1.5 h-1.5 rounded-full bg-red-400" />}
                                                {log.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-slate-300">
                                            {log.latency} ms
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="flex items-center gap-1 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft size={16} /> Previous
                    </button>
                    <span className="text-slate-500 text-xs">Page {page}</span>
                    <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={logs.length < 50} // Rough check
                        className="flex items-center gap-1 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Next <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
