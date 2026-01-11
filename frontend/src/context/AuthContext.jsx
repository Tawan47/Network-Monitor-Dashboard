import { createContext, useContext, useState, useEffect } from "react";
import { API_BASE_URL } from "../config";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [loading, setLoading] = useState(true);

    const logout = () => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
    };

    useEffect(() => {
        if (token) {
            // Decode token payload simply for username (secure verify happens on backend)
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                // Check expiry
                if (payload.exp * 1000 < Date.now()) {
                    setTimeout(logout, 0);
                } else {
                    setUser({ username: payload.username });
                }
            } catch (err) {
                setTimeout(logout, 0);
            }
        }
        setLoading(false);
    }, [token]);

    const login = async (username, password) => {
        const res = await fetch(`${API_BASE_URL}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Login failed");
        }

        const data = await res.json();
        localStorage.setItem("token", data.token);
        setToken(data.token);
        setUser({ username: data.username });
    };



    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
