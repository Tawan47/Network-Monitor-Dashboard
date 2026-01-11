import { useState, useEffect, useCallback } from "react";
import { AlertCircle, CheckCircle, Bell, Filter } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config";

export default function AlertsPage() {
    const [alerts, setAlerts] = useState([]);
    const [statusFilter, setStatusFilter] = useState("active");
    const [loading, setLoading] = useState(false);

    const { token } = useAuth();

    const fetchAlerts = useCallback(async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({ status: statusFilter });
            const res = await fetch(`${API_BASE_URL}/api/alerts?${query}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setAlerts(data);
        } catch (err) {
            console.error("Failed to fetch alerts", err);
        } finally {
            setLoading(false);
        }
    }, [statusFilter, token]);

    useEffect(() => {
        fetchAlerts();
        // Poll for new alerts every 10s
        const interval = setInterval(fetchAlerts, 10000);
        return () => clearInterval(interval);
    }, [fetchAlerts]);

    const handleAck = async (id) => {
        try {
            await fetch(`${API_BASE_URL}/api/alerts/${id}/ack`, {
                method: "POST",
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchAlerts(); // Now accessible
        } catch (err) {
            console.error("Failed to ack", err);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 p-6 text-slate-200">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
                        <Bell className="text-red-500" /> System Alerts
                    </h1>
                    <p className="text-slate-500 text-sm">Manage critical infrastructure notifications.</p>
                </div>

                {/* Filter */}
                <div className="flex items-center gap-3 bg-slate-900 p-1 rounded-lg border border-slate-800">
                    <button
                        onClick={() => setStatusFilter("active")}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${statusFilter === "active" ? "bg-red-500/10 text-red-500" : "text-slate-400 hover:text-white"
                            }`}
                    >
                        Active
                    </button>
                    <button
                        onClick={() => setStatusFilter("all")}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${statusFilter === "all" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
                            }`}
                    >
                        All History
                    </button>
                </div>
            </div>

            {/* Alert List */}
            <div className="space-y-4">
                {loading && alerts.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">Loading alerts...</div>
                ) : alerts.length === 0 ? (
                    <div className="text-center py-12 bg-slate-900 rounded-xl border border-slate-800 border-dashed">
                        <CheckCircle className="mx-auto mb-3 text-green-500" size={32} />
                        <p className="text-slate-300 font-medium">No alerts found</p>
                        <p className="text-slate-500 text-sm mt-1">Everything looks good!</p>
                    </div>
                ) : (
                    alerts.map((alert) => (
                        <div
                            key={alert.id}
                            className={`relative p-5 rounded-xl border border-l-4 transition-all ${alert.status === 'active'
                                ? "bg-red-500/5 border-red-500/20 border-l-red-500"
                                : "bg-slate-900 border-slate-800 border-l-slate-600 opacity-75"
                                }`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${alert.type === 'offline' ? "bg-red-500 text-white" : "bg-yellow-500 text-black"
                                            }`}>
                                            {alert.type}
                                        </span>
                                        <span className="text-xs text-slate-500 font-mono">
                                            {new Date(alert.created_at).toLocaleString()}
                                        </span>
                                        {alert.status === 'acknowledged' && (
                                            <span className="flex items-center gap-1 text-xs text-green-400 ml-2">
                                                <CheckCircle size={12} /> Acknowledged
                                            </span>
                                        )}
                                        {alert.status === 'resolved' && (
                                            <span className="flex items-center gap-1 text-xs text-blue-400 ml-2">
                                                <CheckCircle size={12} /> Resolved
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-1">
                                        {alert.device_name} ({alert.host})
                                    </h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">
                                        {alert.message}
                                    </p>
                                </div>

                                {alert.status === 'active' && (
                                    <button
                                        onClick={() => handleAck(alert.id)}
                                        className="shrink-0 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg border border-slate-700 transition-colors flex items-center gap-2"
                                    >
                                        <CheckCircle size={16} />
                                        Acknowledge
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
