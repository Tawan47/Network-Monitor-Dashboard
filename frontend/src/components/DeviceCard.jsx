import { Server, Router, Globe, Database, Activity } from "lucide-react";

const getIcon = (type) => {
    switch (type) {
        case 'router': return <Router size={24} />;
        case 'switch': return <Activity size={24} />;
        case 'website': return <Globe size={24} />;
        case 'database': return <Database size={24} />;
        default: return <Server size={24} />;
    }
};

export default function DeviceCard({ device }) {
    // Dynamic border color based on status
    const statusColor =
        device.status === 'online' ? 'border-green-500/50 shadow-green-500/20' :
            device.status === 'offline' ? 'border-red-500/50 shadow-red-500/20' :
                'border-yellow-500/50 shadow-yellow-500/20';

    const bgGlow =
        device.status === 'online' ? 'bg-gradient-to-br from-card-bg to-green-900/10' :
            device.status === 'offline' ? 'bg-gradient-to-br from-card-bg to-red-900/10' :
                'bg-card-bg';

    return (
        <div className={`relative p-5 rounded-xl border border-white/5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${statusColor} ${bgGlow} group`}>
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${device.status === 'online' ? 'bg-green-500/10 text-green-400' :
                            device.status === 'offline' ? 'bg-red-500/10 text-red-500' :
                                'bg-yellow-500/10 text-yellow-400'
                        }`}>
                        {getIcon(device.type)}
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg leading-tight group-hover:text-neon-blue transition-colors">
                            {device.name}
                        </h3>
                        <p className="text-slate-500 text-xs font-mono mt-0.5">{device.host}</p>
                    </div>
                </div>
                <div className={`text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-wider ${device.status === 'online' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                        device.status === 'offline' ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse' :
                            'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                    }`}>
                    {device.status}
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-dark-bg/50 p-2 rounded-lg border border-white/5">
                    <span className="text-[10px] text-slate-500 uppercase block mb-1">Latency</span>
                    <div className="flex items-end gap-1">
                        <span className={`text-lg font-mono font-bold ${device.latency > 100 ? 'text-yellow-400' : 'text-white'}`}>
                            {device.latency}
                        </span>
                        <span className="text-xs text-slate-600 mb-1">ms</span>
                    </div>
                </div>
                <div className="bg-dark-bg/50 p-2 rounded-lg border border-white/5">
                    <span className="text-[10px] text-slate-500 uppercase block mb-1">Packet Loss</span>
                    <div className="flex items-end gap-1">
                        {device.type === 'website' ? (
                            <span className={`text-sm font-bold ${device.packetLoss > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                {device.packetLoss > 0 ? "ERR" : "OK"}
                            </span>
                        ) : (
                            <>
                                <span className={`text-lg font-mono font-bold ${device.packetLoss > 0 ? 'text-red-400' : 'text-white'}`}>
                                    {device.packetLoss}
                                </span>
                                <span className="text-xs text-slate-600 mb-1">%</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Services List (Compact) */}
            {device.servicesStatus && device.servicesStatus.length > 0 && (
                <div className="border-t border-white/5 pt-3">
                    <div className="flex flex-wrap gap-2">
                        {device.servicesStatus.map((svc, i) => (
                            <div key={i} className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded text-xs text-slate-300">
                                <span className={`w-1.5 h-1.5 rounded-full ${svc.status === 'up' ? 'bg-green-400 shadow-[0_0_5px_#4ade80]' : 'bg-red-500'}`}></span>
                                {svc.name}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Uptime Bar (Visual decoration) */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5 rounded-b-xl overflow-hidden">
                <div
                    className={`h-full ${device.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${device.uptime || 100}%` }}
                ></div>
            </div>
        </div>
    );
}
