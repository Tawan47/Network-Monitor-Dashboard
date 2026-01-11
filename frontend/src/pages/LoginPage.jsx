import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Lock, User, Activity } from "lucide-react";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(username, password);
            navigate("/");
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Ambient Glow */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-neon-blue/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-neon-purple/20 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="w-full max-w-md glass-card rounded-2xl p-8 relative z-10 animate-fade-in-up">
                <div className="flex justify-center mb-6">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-neon-blue/50 blur-xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative w-20 h-20 bg-card-bg rounded-full flex items-center justify-center border border-neon-blue/30 shadow-[0_0_15px_rgba(0,242,255,0.2)]">
                            <Activity className="text-neon-blue drop-shadow-[0_0_8px_rgba(0,242,255,0.8)]" size={40} />
                        </div>
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-center text-white mb-2 tracking-tight">Welcome Back</h1>
                <p className="text-slate-400 text-center mb-8 font-light">Sign in to access <span className="text-neon-blue font-semibold">NetMon</span> Dashboard</p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl mb-6 text-sm text-center flex items-center justify-center gap-2 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Username</label>
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-neon-blue transition-colors" size={20} />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-dark-bg/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-neon-blue focus:shadow-[0_0_15px_rgba(0,242,255,0.1)] transition-all duration-300"
                                placeholder="Enter username"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-neon-blue transition-colors" size={20} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-dark-bg/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-neon-blue focus:shadow-[0_0_15px_rgba(0,242,255,0.1)] transition-all duration-300"
                                placeholder="Enter password"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-neon-blue text-white font-bold py-3.5 rounded-xl mt-6 hover:shadow-[0_0_20px_rgba(0,242,255,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 relative overflow-hidden group"
                    >
                        <span className="relative z-10">Sign In</span>
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-xs text-slate-600">
                        Default Credentials: <span className="font-mono text-slate-400">admin / admin123</span>
                    </p>
                </div>
            </div>

            <div className="absolute bottom-4 text-center w-full text-[10px] text-slate-700 font-mono">
                NETMON SYSTEM V2.0 • SECURE CONNECTION
            </div>
        </div>
    );
}
