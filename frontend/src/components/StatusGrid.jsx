import { useState } from "react";

export default function StatusGrid({ devices }) {
    return (
        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-lg">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <span>📍 Device Status Grid</span>
                <span className="text-xs font-normal text-slate-500">({devices.length})</span>
            </h3>

            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
                {devices.map((device) => (
                    <StatusItem key={device.id} device={device} />
                ))}
            </div>
        </div>
    );
}

function StatusItem({ device }) {
    const [hover, setHover] = useState(false);

    // Status colors
    const colorClass =
        device.status === "online" ? "bg-green-500 shadow-green-500/50" :
            device.status === "warning" ? "bg-yellow-400 shadow-yellow-400/50" :
                "bg-red-500 shadow-red-500/50";

    return (
        <div
            className="relative cursor-pointer group"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            <div className={`w-full aspect-square rounded-md ${colorClass} shadow-md transition-all hover:scale-110`} />

            {/* Tooltip */}
            <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[150px] bg-black text-white text-xs rounded px-2 py-1 z-10 pointer-events-none transition-opacity ${hover ? 'opacity-100' : 'opacity-0'}`}>
                <p className="font-bold truncate">{device.name}</p>
                <p className="text-slate-400 capitalize">{device.status} • {device.latency}ms</p>
                {/* Arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black" />
            </div>
        </div>
    );
}
