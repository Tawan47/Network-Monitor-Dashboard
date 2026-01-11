import { useEffect, useState } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
} from "recharts";

import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config";

export default function DashboardCharts({ devices }) {
    const [history, setHistory] = useState([]);
    const { token } = useAuth();

    // 1. Fetch initial historical data (last 3 hours, aggregated by minute)
    useEffect(() => {
        if (!token) return;

        fetch(`${API_BASE_URL}/api/dashboard/history`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then((res) => res.json())
            .then((data) => {
                // Format timestamp
                const formatted = data.map((d) => ({
                    ...d,
                    time: new Date(d.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    avg_latency: parseFloat(d.avg_latency),
                    offline_count: parseInt(d.offline_count)
                }));
                // Keep only the last 20 points initially so it looks "scrolling"
                setHistory(formatted.slice(-20));
            })
            .catch((err) => console.error("Failed to load chart history:", err));
    }, [token]);

    // 2. Live updates from `devices` prop
    useEffect(() => {
        if (devices.length === 0) return;

        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        const avgLatency =
            devices.reduce((sum, d) => sum + (d.latency || 0), 0) / devices.length;

        const offlineCount = devices.filter((d) => d.status === "offline").length;

        const newPoint = {
            time: timeStr,
            avg_latency: +avgLatency.toFixed(2),
            offline_count: offlineCount,
        };

        // Avoid synchronous state update warning
        setTimeout(() => {
            setHistory((prev) => {
                // Keep max 30 points
                const newHistory = [...prev, newPoint];
                if (newHistory.length > 30) newHistory.shift();
                return newHistory;
            });
        }, 0);

    }, [devices]); // Triggers every time devices update (3s)

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Latency Chart */}
            <div className="glass-card p-5 rounded-2xl">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 bg-neon-blue rounded-full shadow-[0_0_10px_#00f2ff]"></div>
                    Network Latency
                </h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={history}>
                            <defs>
                                <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#00f2ff" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2a3042" vertical={false} />
                            <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                            <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e2230', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }}
                                itemStyle={{ color: '#00f2ff' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="avg_latency"
                                stroke="#00f2ff"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorLatency)"
                                isAnimationActive={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Offline Devices Chart */}
            <div className="glass-card p-5 rounded-2xl">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 bg-neon-pink rounded-full shadow-[0_0_10px_#ff0050]"></div>
                    Offline Events
                </h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={history}>
                            <defs>
                                <linearGradient id="colorOffline" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ff0050" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#ff0050" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2a3042" vertical={false} />
                            <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                            <YAxis stroke="#64748b" allowDecimals={false} fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e2230', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }}
                                itemStyle={{ color: '#ff0050' }}
                            />
                            <Area
                                type="step"
                                dataKey="offline_count"
                                stroke="#ff0050"
                                strokeWidth={2}
                                fill="url(#colorOffline)"
                                fillOpacity={1}
                                isAnimationActive={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
