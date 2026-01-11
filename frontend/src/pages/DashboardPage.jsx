import { useState, useEffect } from "react";
import DashboardCharts from "../components/DashboardCharts";
import DeviceCard from "../components/DeviceCard";
import AddDeviceModal from "../components/AddDeviceModal";
import { Server, Activity, ShieldCheck, Zap, Plus, Wifi } from "lucide-react";
import { API_BASE_URL, WS_URL } from "../config";

export default function DashboardPage() {
    const [devices, setDevices] = useState([]);
    const [ws, setWs] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [speedResult, setSpeedResult] = useState(null);
    const [isTesting, setIsTesting] = useState(false);

    const runSpeedTest = async () => {
        setIsTesting(true);
        setSpeedResult(null);
        try {
            const res = await fetch(`${API_BASE_URL}/api/speedtest`);
            const data = await res.json();
            setSpeedResult(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsTesting(false);
        }
    };

    // Initial Load & WebSocket Setup
    useEffect(() => {
        const socket = new WebSocket(WS_URL);

        socket.onopen = () => {
            console.log("✅ WebSocket Connected");
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                setDevices(data);
            } catch (e) {
                console.error("Failed to parse WS data", e);
            }
        };

        socket.onclose = () => console.log("❌ WebSocket Disconnected");

        setWs(socket);

        return () => socket.close();
    }, []);

    // Derived Stats
    const totalDevices = devices.length;
    const onlineDevices = devices.filter(d => d.status === 'online').length;
    const warningDevices = devices.filter(d => d.status === 'warning').length;
    const offlineDevices = devices.filter(d => d.status === 'offline').length;

    // Calculate overall uptime (mock or avg)
    const avgUptime = devices.length > 0
        ? (devices.reduce((acc, d) => acc + (d.uptime || 100), 0) / devices.length).toFixed(1)
        : 100;

    return (
        <div className="space-y-8">
            {/* Top Widgets Row (Reference: Circular stats in image) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Metric Card 1 */}
                <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Server size={80} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Total Devices</span>
                        <div className="text-4xl font-bold text-white mb-1">{totalDevices}</div>
                        <div className="text-xs text-neon-blue flex items-center gap-1">
                            <Activity size={12} /> Active Monitoring
                        </div>
                    </div>
                    <div className="mt-4 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-neon-blue w-full"></div>
                    </div>
                </div>

                {/* Metric Card 2 */}
                <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ShieldCheck size={80} className="text-green-500" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Online Status</span>
                        <div className="text-4xl font-bold text-green-400 mb-1">{onlineDevices}</div>
                        <div className="text-xs text-slate-500">
                            {offlineDevices > 0 ? (
                                <span className="text-red-500 font-bold">{offlineDevices} Offline!</span>
                            ) : "All Systems Operational"}
                        </div>
                    </div>
                    <div className="mt-4 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-green-500 transition-all duration-500"
                            style={{ width: `${(onlineDevices / (totalDevices || 1)) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* Metric Card 3 */}
                <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Zap size={80} className="text-neon-purple" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Avg Uptime</span>
                        <div className="text-4xl font-bold text-neon-purple mb-1 text-glow-pink">{avgUptime}%</div>
                        <div className="text-xs text-slate-500">Last 24 Hours</div>
                    </div>
                    {/* Ring Chart Simulation (CSS) */}
                    <div className="absolute bottom-4 right-4 w-12 h-12 rounded-full border-4 border-slate-700 border-t-neon-purple animate-spin-slow opacity-50"></div>
                </div>

                {/* Metric Card 4: Alerts */}
                <div className="glass-card p-6 rounded-2xl relative overflow-hidden group border-l-4 border-l-neon-pink">
                    <div className="flex flex-col h-full justify-between">
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Active Alerts</span>
                        <div className="text-5xl font-bold text-white text-glow-pink self-end">
                            {warningDevices + offlineDevices}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Charts (Span 2) */}
                <div className="lg:col-span-2 space-y-8">
                    <DashboardCharts devices={devices} />

                    {/* Device Grid Header */}
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="w-2 h-8 bg-neon-blue rounded-full"></span>
                            Monitored Devices
                        </h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="px-3 py-1 bg-neon-blue/10 text-neon-blue border border-neon-blue/50 rounded-lg hover:bg-neon-blue hover:text-black transition-all flex items-center gap-1 text-xs font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(0,242,255,0.2)]"
                            >
                                <Plus size={14} /> Add Device
                            </button>
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span> Online
                            </span>
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                                <span className="w-2 h-2 rounded-full bg-red-500"></span> Offline
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
                        {devices.map((device) => (
                            <DeviceCard key={device.id} device={device} />
                        ))}
                    </div>

                    <AddDeviceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
                </div>

                {/* Right Column: Recent logs or quick stats (Placeholder/Expansion) */}
                <div className="space-y-6">

                    {/* Speedtest Widget */}
                    <div className="glass-panel p-5 rounded-xl border border-neon-blue/20">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                <Wifi size={16} /> Speed Test
                            </h4>
                            {isTesting && <span className="text-xs text-neon-blue animate-pulse">Testing...</span>}
                        </div>

                        <div className="flex flex-col items-center justify-center py-4">
                            {speedResult ? (
                                <div className="text-center">
                                    <div className="text-5xl font-bold text-white text-glow-blue mb-1">
                                        {speedResult.speed}
                                    </div>
                                    <div className="text-sm text-slate-400">{speedResult.unit}</div>
                                </div>
                            ) : isTesting ? (
                                <div className="w-12 h-12 rounded-full border-4 border-slate-700 border-t-neon-blue animate-spin"></div>
                            ) : (
                                <div className="text-slate-500 text-sm">Ready to test</div>
                            )}
                        </div>

                        <button
                            onClick={runSpeedTest}
                            disabled={isTesting}
                            className="w-full mt-2 py-2 bg-neon-blue/10 hover:bg-neon-blue/20 text-neon-blue border border-neon-blue/50 rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isTesting ? "Running..." : "Run Test"}
                        </button>
                    </div>


                    {/* Mini Widget 1 */}
                    <div className="glass-panel p-5 rounded-xl">
                        <h4 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider">Network Traffic</h4>
                        <div className="h-40 flex items-end justify-between gap-1 px-2">
                            {[...Array(20)].map((_, i) => (
                                <div
                                    key={i}
                                    className="w-full bg-neon-blue/20 hover:bg-neon-blue transition-colors rounded-t-sm"
                                    style={{ height: `${Math.random() * 100}%` }}
                                ></div>
                            ))}
                        </div>
                    </div>

                    {/* Mini Widget 2 */}
                    <div className="glass-panel p-5 rounded-xl">
                        <h4 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider">Storage Health</h4>
                        <div className="relative pt-2">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-slate-400">/dev/sda1</span>
                                <span className="text-xs text-neon-pink font-mono">85%</span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-2">
                                <div className="bg-neon-pink h-2 rounded-full" style={{ width: '85%' }}></div>
                            </div>

                            <div className="flex items-center justify-between mb-2 mt-4">
                                <span className="text-xs text-slate-400">/dev/db_storage</span>
                                <span className="text-xs text-blue-400 font-mono">42%</span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-2">
                                <div className="bg-blue-400 h-2 rounded-full" style={{ width: '42%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
