import { useState } from "react";
import { X, Plus, Trash2, Server, Router, Globe, Database } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config";

export default function AddDeviceModal({ isOpen, onClose }) {
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        host: "",
        type: "server",
        services: []
    });

    // Reset form when opening/closing? 
    // Ideally we reset on close or success.

    if (!isOpen) return null;

    const handleAddService = () => {
        setFormData({
            ...formData,
            services: [...formData.services, { name: "HTTP", port: 80, type: "tcp" }]
        });
    };

    const handleServiceChange = (index, field, value) => {
        const newServices = [...formData.services];
        newServices[index][field] = value;
        setFormData({ ...formData, services: newServices });
    };

    const handleRemoveService = (index) => {
        const newServices = formData.services.filter((_, i) => i !== index);
        setFormData({ ...formData, services: newServices });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE_URL}/api/devices`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error("Failed to add device");

            // Success
            onClose();
            setFormData({ name: "", host: "", type: "server", services: [] });
        } catch (err) {
            console.error(err);
            alert("Failed to add device");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-card-bg border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <h2 className="text-xl font-bold text-white">Add New Device</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    {/* Name */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Device Name</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-dark-bg border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-neon-blue transition-colors"
                            placeholder="e.g. Production DB"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    {/* Host */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Host / IP</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-dark-bg border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-neon-blue transition-colors"
                            placeholder="e.g. 192.168.1.5 or google.com"
                            value={formData.host}
                            onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                        />
                    </div>

                    {/* Type */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Device Type</label>
                        <div className="grid grid-cols-4 gap-2">
                            {['server', 'router', 'switch', 'website', 'database'].map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: t })}
                                    className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${formData.type === t
                                        ? "bg-neon-blue/10 border-neon-blue text-neon-blue"
                                        : "bg-dark-bg border-white/5 text-slate-500 hover:text-white"
                                        }`}
                                >
                                    {t === 'server' && <Server size={20} />}
                                    {t === 'router' && <Router size={20} />}
                                    {t === 'website' && <Globe size={20} />}
                                    {t === 'database' && <Database size={20} />}
                                    {t === 'switch' && <Server size={20} />} {/* Reusing server icon for switch for now */}
                                    <span className="text-[10px] uppercase font-bold mt-1">{t}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Services */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase">Monitored Services</label>
                            <button
                                type="button"
                                onClick={handleAddService}
                                className="text-xs flex items-center gap-1 text-neon-blue hover:text-white transition-colors"
                            >
                                <Plus size={14} /> Add Port
                            </button>
                        </div>

                        <div className="space-y-2">
                            {formData.services.map((svc, i) => (
                                <div key={i} className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Service Name"
                                        className="flex-1 bg-dark-bg border border-white/10 rounded px-2 py-1 text-sm text-white focus:border-neon-blue outline-none"
                                        value={svc.name}
                                        onChange={(e) => handleServiceChange(i, 'name', e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Port"
                                        className="w-20 bg-dark-bg border border-white/10 rounded px-2 py-1 text-sm text-white focus:border-neon-blue outline-none font-mono"
                                        value={svc.port}
                                        onChange={(e) => handleServiceChange(i, 'port', parseInt(e.target.value) || 0)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveService(i)}
                                        className="text-red-500 hover:text-red-400 p-1"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            {formData.services.length === 0 && (
                                <p className="text-xs text-slate-600 italic">No specific ports monitored.</p>
                            )}
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-neon-blue text-white font-bold py-3 rounded-xl hover:shadow-[0_0_20px_rgba(0,242,255,0.3)] transition-all disabled:opacity-50 mt-4"
                    >
                        {loading ? "Adding Device..." : "Add Device"}
                    </button>
                </form>
            </div>
        </div>
    );
}
