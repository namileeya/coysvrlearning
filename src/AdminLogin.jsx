import { useState } from "react";
import "./AdminLogin.css";

function Toast({ message, type }) {
    return (
        <div className="admin-login-toast">
            <div className={`admin-toast admin-toast--${type}`}>
                <div className="admin-toast__icon">
                    {type === "success" ? (
                        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                            <path d="M1.5 4.5l2 2L7.5 2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    ) : (
                        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                            <path d="M1.5 1.5l6 6M7.5 1.5l-6 6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    )}
                </div>
                <p className="admin-toast__msg">{message}</p>
            </div>
        </div>
    );
}

export default function AdminLogin({ onLoginSuccess }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [toast, setToast] = useState(null);

    const showToast = (message, type = "error") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Admin credentials (you can change these)
    const ADMIN_CREDENTIALS = {
        username: "admin@coys.com",
        password: "Admin@2024"
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // Validate credentials
        if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
            // Store login state
            localStorage.setItem("adminLoggedIn", "true");
            localStorage.setItem("adminUsername", username);

            showToast("Login successful! Redirecting...", "success");

            setTimeout(() => {
                if (onLoginSuccess) {
                    onLoginSuccess();
                }
            }, 1000);
        } else {
            setError("Invalid username or password");
            showToast("Invalid username or password", "error");
        }

        setIsLoading(false);
    };

    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="admin-login-container">
            <div className="admin-login-card">
                <div className="admin-login-header">
                    <div className="admin-login-logo">
                        <span>COYS</span>
                    </div>
                    <h1 className="admin-login-title">Admin Access</h1>
                    <p className="admin-login-subtitle">Enter your credentials to continue</p>
                </div>

                <form className="admin-login-form" onSubmit={handleSubmit}>
                    <div className="admin-login-field">
                        <label className="admin-login-label">Username / Email</label>
                        <div className="admin-login-input-wrapper">
                            <input
                                type="text"
                                className={`admin-login-input ${error ? 'admin-login-input--error' : ''}`}
                                placeholder="admin@coys.com"
                                value={username}
                                onChange={(e) => {
                                    setUsername(e.target.value);
                                    setError("");
                                }}
                                required
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="admin-login-field">
                        <label className="admin-login-label">Password</label>
                        <div className="admin-login-input-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                className={`admin-login-input ${error ? 'admin-login-input--error' : ''}`}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setError("");
                                }}
                                required
                            />
                            <div className="admin-login-icon">
                                <button
                                    type="button"
                                    className="admin-login-toggle"
                                    onClick={toggleShowPassword}
                                >
                                    {showPassword ? (
                                        <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M21 21L3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    ) : (
                                        <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                        {error && <div className="admin-login-error">{error}</div>}
                    </div>

                    <button
                        type="submit"
                        className={`admin-login-button ${isLoading ? 'admin-login-button--loading' : ''}`}
                        disabled={isLoading}
                    >
                        {isLoading ? "Signing in..." : "Sign In"}
                    </button>
                </form>

                <div className="admin-login-footer">
                    <p className="admin-login-footer-text">
                        Secure Admin Access Only
                    </p>
                </div>
            </div>
            {toast && <Toast message={toast.message} type={toast.type} />}
        </div>
    );
}