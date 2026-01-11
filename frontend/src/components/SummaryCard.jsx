import { Server, Wifi, AlertTriangle, Activity } from "lucide-react";

export default function SummaryCard({ title, value, icon, color }) {
    const Icon = icon;
    return (
        <div className="bg-slate-900 rounded-xl p-4 flex items-center shadow-lg border border-slate-800">
            <div className={`p-3 rounded-full bg-opacity-10 mr-4 ${color.bg} ${color.text}`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-slate-400 text-sm">{title}</p>
                <p className="text-2xl font-bold text-white">{value}</p>
            </div>
        </div>
    );
}
