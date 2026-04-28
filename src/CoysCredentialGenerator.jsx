import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase"; // Adjust path if needed
import * as XLSX from 'xlsx'; // Install: npm install xlsx
import emailjs from '@emailjs/browser'; // Install: npm install @emailjs/browser
import "./CoysCredentialGenerator.css";

// Initialize EmailJS with your public key
emailjs.init("hy71kTMrjMEHF72S-");

// ── Helpers ──────────────────────────────────────────────────────────────────

function randStr(chars, len) {
    let r = "";
    for (let i = 0; i < len; i++)
        r += chars[Math.floor(Math.random() * chars.length)];
    return r;
}

function generateCredentials() {
    const user = randStr("abcdefghijkmnpqrstuvwxyz", 6) + randStr("23456789", 3);
    const pass =
        randStr("ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz", 5) +
        randStr("23456789", 3) +
        randStr("!@#$%", 2);
    return { username: user + "@coys.com", password: pass };
}

// ── Toast Component ─────────────────────────────────────────────────────────

function Toast({ message, type }) {
    return (
        <div className={`cc-generator-toast cc-generator-toast--${type}`}>
            <div className="cc-generator-toast__icon">
                {type === "success" ? (
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                        <path d="M1.5 4.5l2 2L7.5 2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                ) : type === "warning" ? (
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                        <path d="M4.5 1v4M4.5 7v.01" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                ) : (
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                        <path d="M1.5 1.5l6 6M7.5 1.5l-6 6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                )}
            </div>
            <p className="cc-generator-toast__msg">{message}</p>
        </div>
    );
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function CoysCredentialGenerator({ onLogout }) {
    const [emails, setEmails] = useState([""]);
    const [credsList, setCredsList] = useState([]);
    const [validity, setValidity] = useState("7");
    const [toast, setToast] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [bulkInput, setBulkInput] = useState("");
    const [showBulkInput, setShowBulkInput] = useState(false);
    const [isSendingEmails, setIsSendingEmails] = useState(false);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4500);
    };

    const handleAddEmail = () => {
        setEmails([...emails, ""]);
    };

    const handleRemoveEmail = (index) => {
        const newEmails = emails.filter((_, i) => i !== index);
        setEmails(newEmails);
    };

    const handleEmailChange = (index, value) => {
        const newEmails = [...emails];
        newEmails[index] = value;
        setEmails(newEmails);
    };

    const handleBulkPaste = () => {
        if (!bulkInput.trim()) {
            showToast("Please paste email addresses first.", "error");
            return;
        }

        const emailList = bulkInput
            .split(/[,\n\s;]+/)
            .map(email => email.trim())
            .filter(email => email && email.includes('@'));

        if (emailList.length === 0) {
            showToast("No valid email addresses found. Make sure emails contain '@' symbol.", "error");
            return;
        }

        setEmails(emailList);
        setBulkInput("");
        setShowBulkInput(false);
        showToast(`Added ${emailList.length} email address(es).`, "success");
    };

    const handleGenerate = () => {
        const hasValidEmail = emails.some(email => email.trim() !== "");

        if (!hasValidEmail) {
            showToast("Please enter at least one email address before generating credentials.", "error");
            return;
        }

        setIsGenerating(true);

        const newCredsList = emails
            .filter(email => email.trim() !== "")
            .map(email => ({
                email: email.trim(),
                credentials: generateCredentials(),
                validity: parseInt(validity)
            }));

        setCredsList(newCredsList);
        setIsGenerating(false);
        showToast(`Generated credentials for ${newCredsList.length} recipient(s).`, "success");
    };

    // ── Email Sending Function - FIXED FOR YOUR TEMPLATE ─────────────────────
    const sendEmailToUser = async (recipientEmail, credentials, validityDays) => {
        // EmailJS configuration
        const SERVICE_ID = "service_oeh4y3o";
        const TEMPLATE_ID = "template_zruv1rq";
        const PUBLIC_KEY = "hy71kTMrjMEHF72S-";

        // Calculate expiry date
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + validityDays);
        const userName = recipientEmail.split('@')[0];

        // Template parameters matching EXACTLY what's in your EmailJS template
        const templateParams = {
            email: recipientEmail,           // For "To Email" field - {{email}}
            name: userName,                  // For subject "Welcome {{name}}!"
            to_name: userName,               // For "Hello {{to_name}}"
            username: credentials.username,  // For {{username}}
            password: credentials.password,  // For {{password}}
            validity_days: validityDays.toString(),  // For {{validity_days}}
            current_date: new Date().toLocaleDateString(), // For {{current_date}}
            expiry_date: expiryDate.toLocaleDateString(),  // For {{expiry_date}}
            login_url: "https://your-vr-learning-platform.com" // For {{login_url}}
        };

        console.log("📧 Sending to:", recipientEmail);
        console.log("Template params:", templateParams);

        try {
            const response = await emailjs.send(
                SERVICE_ID,
                TEMPLATE_ID,
                templateParams,
                PUBLIC_KEY
            );
            console.log("✅ Email sent successfully!");
            return { success: true, response };
        } catch (error) {
            console.error("❌ Email error:", error);
            console.error("Error text:", error.text);
            return { success: false, error: error.text || error.message };
        }
    };

    // ── Save to Firebase and Send Emails ───────────────────────────────────
    const handleSaveAndSendEmails = async () => {
        if (credsList.length === 0) {
            showToast("Generate credentials first before saving.", "error");
            return;
        }

        setIsSaving(true);
        setIsSendingEmails(true);

        const savedCredentials = [];
        const failedEmails = [];
        const emailResults = [];

        try {
            // Process each credential
            for (const item of credsList) {
                try {
                    // Calculate expiry date
                    const expiryDate = new Date();
                    expiryDate.setDate(expiryDate.getDate() + parseInt(validity));

                    // Prepare credential data for Firebase
                    const credentialData = {
                        email: item.email,
                        username: item.credentials.username,
                        password: item.credentials.password,
                        validityDays: parseInt(validity),
                        expiresAt: expiryDate,
                        createdAt: serverTimestamp(),
                        status: "active",
                        generatedBy: "Admin",
                        emailSent: false,
                        createdAt_readable: new Date().toISOString()
                    };

                    // Save to Firestore
                    const docRef = await addDoc(collection(db, "credentials"), credentialData);
                    console.log(`💾 Saved to Firebase: ${item.email} (ID: ${docRef.id})`);

                    // Send email to user
                    const emailResult = await sendEmailToUser(
                        item.email,
                        item.credentials,
                        parseInt(validity)
                    );

                    // Log email result to Firebase
                    await addDoc(collection(db, "emailLogs"), {
                        credentialId: docRef.id,
                        email: item.email,
                        username: item.credentials.username,
                        status: emailResult.success ? "sent" : "failed",
                        error: emailResult.error || null,
                        sentAt: serverTimestamp(),
                        validityDays: parseInt(validity)
                    });

                    if (emailResult.success) {
                        savedCredentials.push(item.email);
                        emailResults.push({ email: item.email, status: "success" });
                    } else {
                        failedEmails.push(item.email);
                        emailResults.push({ email: item.email, status: "failed", error: emailResult.error });
                    }

                } catch (error) {
                    console.error(`Error processing ${item.email}:`, error);
                    failedEmails.push(item.email);
                    emailResults.push({ email: item.email, status: "error", error: error.message });
                }
            }

            // Save summary to Firebase
            await addDoc(collection(db, "generationLogs"), {
                timestamp: serverTimestamp(),
                totalRecipients: credsList.length,
                successful: savedCredentials.length,
                failed: failedEmails.length,
                validityDays: parseInt(validity),
                recipients: emailResults
            });

            // Show summary toast
            if (savedCredentials.length > 0) {
                showToast(
                    `✓ Success! ${savedCredentials.length} credential(s) saved to Firebase. Emails sent to ${savedCredentials.length} recipient(s). ${failedEmails.length > 0 ? `Failed to send to ${failedEmails.length} recipient(s).` : ''}`,
                    failedEmails.length > 0 ? "warning" : "success"
                );
            } else {
                showToast("Failed to save credentials and send emails. Please check Firebase and EmailJS configuration.", "error");
            }

        } catch (error) {
            console.error("Error in save and send process:", error);
            showToast(`Error: ${error.message}. Please check console.`, "error");
        } finally {
            setIsSaving(false);
            setIsSendingEmails(false);
        }
    };

    // ── Send Emails Only ───────────────────────────────────────────────────
    const handleSendEmailsOnly = async () => {
        if (credsList.length === 0) {
            showToast("No credentials to send. Please generate credentials first.", "error");
            return;
        }

        setIsSendingEmails(true);

        const sentEmails = [];
        const failedEmails = [];

        for (const item of credsList) {
            const result = await sendEmailToUser(item.email, item.credentials, parseInt(validity));
            if (result.success) {
                sentEmails.push(item.email);
            } else {
                failedEmails.push(item.email);
            }
        }

        if (sentEmails.length > 0) {
            showToast(
                `📧 Emails sent to ${sentEmails.length} recipient(s). ${failedEmails.length > 0 ? `Failed to send to ${failedEmails.length} recipient(s).` : ''}`,
                failedEmails.length > 0 ? "warning" : "success"
            );
        } else {
            showToast("Failed to send any emails. Please check EmailJS configuration.", "error");
        }

        setIsSendingEmails(false);
    };

    // ── Excel Download Function ─────────────────────────────────────────────
    const handleDownloadExcel = () => {
        if (credsList.length === 0) {
            showToast("Generate credentials first before downloading.", "error");
            return;
        }

        try {
            const excelData = credsList.map((item, index) => ({
                "#": index + 1,
                "Email": item.email,
                "Username": item.credentials.username,
                "Password": item.credentials.password,
                "Validity (Days)": parseInt(validity),
                "Generated At": new Date().toLocaleString(),
                "Expires At": new Date(Date.now() + parseInt(validity) * 24 * 60 * 60 * 1000).toLocaleString()
            }));

            const ws = XLSX.utils.json_to_sheet(excelData);
            const colWidths = [
                { wch: 5 }, { wch: 35 }, { wch: 25 },
                { wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 20 }
            ];
            ws['!cols'] = colWidths;

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Credentials");

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const filename = `credentials_${timestamp}.xlsx`;

            XLSX.writeFile(wb, filename);
            showToast(`📥 Excel file downloaded with ${credsList.length} record(s).`, "success");
        } catch (error) {
            console.error("Error generating Excel file:", error);
            showToast("Error generating Excel file.", "error");
        }
    };

    const validityOptions = [
        { value: "1", label: "1 day" },
        { value: "3", label: "3 days" },
        { value: "7", label: "7 days (default)" },
        { value: "14", label: "14 days" },
        { value: "30", label: "30 days" },
    ];

    return (
        <div className="cc-generator">
            <nav className="cc-generator-nav">
                <div className="cc-generator-nav__left">
                    <div className="cc-generator-nav__chip">COYS</div>
                    <div className="cc-generator-nav__title">Admin Panel</div>
                    <div className="cc-generator-nav__sep" />
                    <div className="cc-generator-nav__sub">Credential Generator</div>
                </div>
                <div className="cc-generator-nav__right">
                    <span className="cc-generator-nav__username">Admin</span>
                    <div className="cc-generator-nav__avatar">AD</div>
                    {onLogout && (
                        <button
                            onClick={onLogout}
                            style={{
                                marginLeft: '12px',
                                padding: '6px 12px',
                                background: '#ef4444',
                                border: 'none',
                                borderRadius: '6px',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontWeight: '500'
                            }}
                            onMouseEnter={(e) => e.target.style.background = '#dc2626'}
                            onMouseLeave={(e) => e.target.style.background = '#ef4444'}
                        >
                            Logout
                        </button>
                    )}
                </div>
            </nav>

            <div className="cc-generator-header">
                <p className="cc-generator-header__eyebrow">Admin · Access Management</p>
                <h1 className="cc-generator-header__title">Create Temporary Credentials</h1>
                <p className="cc-generator-header__desc">
                    Generate login credentials for multiple users. Credentials expire after the chosen validity period.
                </p>
            </div>

            <main className="cc-generator-main">
                <div className="cc-generator-section">
                    <div className="cc-generator-section-header">
                        <p className="cc-generator-section__label">Recipients</p>
                        <button
                            className="cc-generator-btn cc-generator-btn--bulk"
                            onClick={() => setShowBulkInput(!showBulkInput)}
                            type="button"
                        >
                            {showBulkInput ? "Cancel" : "📋 Bulk Add"}
                        </button>
                    </div>
                    <p className="cc-generator-section__desc">
                        Enter email addresses individually or use bulk add to paste multiple emails at once.
                    </p>

                    {showBulkInput && (
                        <div className="cc-generator-bulk-section">
                            <div className="cc-generator-field">
                                <label className="cc-generator-label">Paste email addresses</label>
                                <textarea
                                    className="cc-generator-textarea"
                                    rows="4"
                                    placeholder="Paste emails separated by commas, spaces, or newlines..."
                                    value={bulkInput}
                                    onChange={(e) => setBulkInput(e.target.value)}
                                />
                            </div>
                            <div className="cc-generator-bulk-actions">
                                <button className="cc-generator-btn cc-generator-btn--add-bulk" onClick={handleBulkPaste}>
                                    Add Emails
                                </button>
                                <button className="cc-generator-btn cc-generator-btn--clear" onClick={() => setBulkInput("")}>
                                    Clear
                                </button>
                            </div>
                            <p className="cc-generator-bulk-hint">
                                💡 Tip: Emails can be separated by commas, spaces, newlines, or semicolons.
                            </p>
                        </div>
                    )}

                    {emails.map((email, index) => (
                        <div key={index} className="cc-generator-email-row">
                            <div className="cc-generator-field cc-generator-email-field">
                                <label className="cc-generator-label">Email address {emails.length > 1 ? `#${index + 1}` : ""}</label>
                                <input
                                    className="cc-generator-input"
                                    type="email"
                                    placeholder="e.g. john.doe@company.com"
                                    value={email}
                                    onChange={(e) => handleEmailChange(index, e.target.value)}
                                />
                            </div>
                            {emails.length > 1 && (
                                <button
                                    className="cc-generator-btn cc-generator-btn--remove"
                                    onClick={() => handleRemoveEmail(index)}
                                    type="button"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    ))}

                    <div className="cc-generator-row cc-generator-row--actions">
                        <button className="cc-generator-btn cc-generator-btn--add" onClick={handleAddEmail} type="button">
                            + Add another email
                        </button>
                        <button className="cc-generator-btn cc-generator-btn--gen" onClick={handleGenerate} disabled={isGenerating}>
                            {isGenerating ? "Generating..." : "Generate Credentials"}
                        </button>
                    </div>
                </div>

                {credsList.length > 0 && (
                    <div className="cc-generator-section cc-generator-section--alt">
                        <p className="cc-generator-section__label">
                            Generated credentials
                            <span className="cc-generator-badge">{credsList.length} recipient(s)</span>
                        </p>
                        <p className="cc-generator-section__desc">
                            This is your credential to access the VR learning platform. Note that it's only valid for {validity} days.
                        </p>

                        {credsList.map((item, index) => (
                            <div key={index} className="cc-generator-creds-card">
                                <div className="cc-generator-creds-header">
                                    <span className="cc-generator-creds-email">{item.email}</span>
                                </div>
                                <div className="cc-generator-row cc-generator-row--creds">
                                    <div className="cc-generator-field">
                                        <label className="cc-generator-label">Login username</label>
                                        <input
                                            className="cc-generator-input cc-generator-input--ro cc-generator-input--filled"
                                            type="text"
                                            value={item.credentials.username}
                                            readOnly
                                        />
                                    </div>
                                    <div className="cc-generator-field">
                                        <label className="cc-generator-label">Password</label>
                                        <input
                                            className="cc-generator-input cc-generator-input--ro cc-generator-input--filled"
                                            type="text"
                                            value={item.credentials.password}
                                            readOnly
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div className="cc-generator-field cc-generator-validity-field">
                            <label className="cc-generator-label">Validity period (applies to all)</label>
                            <select
                                className="cc-generator-select"
                                value={validity}
                                onChange={(e) => setValidity(e.target.value)}
                            >
                                {validityOptions.map((o) => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
            </main>

            <div className="cc-generator-footer">
                {credsList.length > 0 && (
                    <>
                        <button
                            className="cc-generator-btn cc-generator-btn--download"
                            onClick={handleDownloadExcel}
                        >
                            📥 Download Excel
                        </button>
                        <button
                            className="cc-generator-btn cc-generator-btn--save"
                            onClick={handleSendEmailsOnly}
                            disabled={isSendingEmails}
                            style={{ background: "#7c3aed" }}
                        >
                            {isSendingEmails ? "Sending Emails..." : "✉️ Send Emails Only"}
                        </button>
                    </>
                )}
                <button
                    className="cc-generator-btn cc-generator-btn--save"
                    onClick={handleSaveAndSendEmails}
                    disabled={credsList.length === 0 || isSaving || isSendingEmails}
                >
                    {isSaving ? "Saving & Sending..." : "💾 Save to Database & Send Emails"}
                </button>
                {toast && <Toast message={toast.message} type={toast.type} />}
            </div>
        </div>
    );
}