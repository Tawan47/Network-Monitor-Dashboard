import { useState } from "react";
import { Gauge, ArrowDown, ArrowUp, Zap, Globe } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config";

export default function SpeedtestWidget() {
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const runSpeedtest = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await fetch(`${API_BASE_URL}/api/speedtest`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!res.ok) throw new Error("Speedtest failed to start");

            const data = await res.json();
            setResult(data);
        } catch (err) {
            console.error(err);
            setError("Test failed. Server might be busy.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-panel p-5 rounded-xl relative overflow-hidden">
            <h4 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider flex items-center gap-2">
                <Gauge size={16} className="text-neon-blue" /> Network Speed
            </h4>

            {!loading && !result && !error && (
                <div className="flex flex-col items-center justify-center py-6">
                    <p className="text-slate-500 text-xs mb-4 text-center">Measure server internet connection</p>
                    <button
                        onClick={runSpeedtest}
                        className="px-6 py-2 bg-neon-blue/10 text-neon-blue border border-neon-blue rounded-full font-bold hover:bg-neon-blue hover:text-black transition-all shadow-[0_0_15px_rgba(0,242,255,0.2)]"
                    >
                        Start Speedtest
                    </button>
                </div>
            )}

            {loading && (
                <div className="flex flex-col items-center justify-center py-6">
                    <div className="w-12 h-12 border-4 border-slate-700 border-t-neon-blue rounded-full animate-spin mb-4"></div>
                    <p className="text-neon-blue text-xs font-mono animate-pulse">Running Speedtest...</p>
                    <p className="text-slate-500 text-[10px] mt-1">This may take up to 30s</p>
                </div>
            )}

            {result && (
                <div className="space-y-4 animate-fade-in-up">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-dark-bg/50 p-3 rounded-lg border border-white/5 text-center group hover:border-neon-blue/30 transition-colors">
                            <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px] uppercase mb-1">
                                <ArrowDown size={12} className="text-neon-blue" /> Download
                            </div>
                            <div className="text-2xl font-bold text-white group-hover:text-neon-blue transition-colors">{result.download}</div>
                            <div className="text-[10px] text-slate-500">Mbps</div>
                        </div>
                        <div className="bg-dark-bg/50 p-3 rounded-lg border border-white/5 text-center group hover:border-neon-purple/30 transition-colors">
                            <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px] uppercase mb-1">
                                <ArrowUp size={12} className="text-neon-purple" /> Upload
                            </div>
                            <div className="text-2xl font-bold text-white group-hover:text-neon-purple transition-colors">{result.upload}</div>
                            <div className="text-[10px] text-slate-500">Mbps</div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-white/5">
                        <div className="flex items-center gap-1">
                            <Zap size={12} className="text-yellow-400" />
                            <span>Ping: <span className="text-white font-mono">{result.ping}ms</span></span>
                        </div>
                        <div className="flex items-center gap-1 max-w-[50%] truncate" title={result.isp}>
                            <Globe size={12} className="text-slate-500" />
                            <span className="truncate">{result.isp}</span>
                        </div>
                    </div>

                    <button
                        onClick={runSpeedtest}
                        className="w-full text-xs text-slate-500 hover:text-white mt-2 underline decoration-slate-700 hover:decoration-white transition-all"
                    >
                        Test Again
                    </button>
                </div>
            )}

            {error && (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                    <p className="text-red-400 text-xs mb-2">{error}</p>
                    <button
                        onClick={runSpeedtest}
                        className="text-xs px-3 py-1 bg-white/5 hover:bg-white/10 rounded text-white"
                    >
                        Retry
                    </button>
                </div>
            )}
        </div>
    );
}
