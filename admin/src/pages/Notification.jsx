import React, { useState } from "react";

const audienceOptions = [
  { label: "All Users", value: "all" },
  { label: "Delivery Partners", value: "delivery" },
  { label: "Only Active Users", value: "active" },
  { label: "Specific User IDs", value: "specific" },
];
const templates = [
  { label: "Welcome", title: "Welcome!", body: "Thank you for joining us." },
  { label: "Promo", title: "Exclusive Offer!", body: "Don't miss our limited deal." },
];

export default function Notification() {
  const [tab, setTab] = useState("compose");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [image, setImage] = useState("");
  const [audience, setAudience] = useState("all");
  const [specificUserIDs, setSpecificUserIDs] = useState("");
  const [template, setTemplate] = useState("");
  const [isSchedule, setIsSchedule] = useState(false);
  const [scheduled, setScheduled] = useState("");
  const [history, setHistory] = useState([]);

  // Templating
  const handleTemplate = (e) => {
    const selected = templates.find((t) => t.label === e.target.value);
    if (selected) {
      setTemplate(selected.label);
      setTitle(selected.title);
      setBody(selected.body);
    } else {
      setTemplate("");
      setTitle("");
      setBody("");
    }
  };

  // Submission handler (stores in local state)
  const handleSubmit = (e) => {
    e.preventDefault();
    let entry = {
      id: Date.now(),
      title,
      body,
      image,
      audience: audienceOptions.find(opt => opt.value === audience)?.label || "",
      userIDs: audience === "specific" ? specificUserIDs : "",
      scheduled: isSchedule ? scheduled : "Now",
      status: isSchedule ? "Scheduled" : "Sent"
    };
    setHistory([entry, ...history]);
    // Reset form
    setTitle(""); setBody(""); setImage(""); setAudience("all");
    setSpecificUserIDs(""); setTemplate(""); setIsSchedule(false); setScheduled("");
  };

  // Main layout
  return (
    <div style={styles.page}>
      <div style={styles.headerBar}>
        <h2 style={styles.pageTitle}>Notifications</h2>
        <div style={styles.tabs}>
          <button
            style={tab === "compose" ? styles.activeTab : styles.tab}
            onClick={() => setTab("compose")}
          >
            Compose
          </button>
          <button
            style={tab === "history" ? styles.activeTab : styles.tab}
            onClick={() => setTab("history")}
          >
            History
          </button>
        </div>
      </div>

      {tab === "compose" ? (
        <form style={styles.card} onSubmit={handleSubmit} autoComplete="off">
          <div style={styles.formRow}>
            <label style={styles.label}>Template</label>
            <select style={styles.input} value={template} onChange={handleTemplate}>
              <option value="">Custom</option>
              {templates.map((t) => (
                <option key={t.label} value={t.label}>{t.label}</option>
              ))}
            </select>
          </div>
          <div style={styles.formRow}>
            <label style={styles.label}>Title</label>
            <input
              style={styles.input}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Title"
              maxLength={60}
              required
            />
          </div>
          <div style={styles.formRow}>
            <label style={styles.label}>Message</label>
            <textarea
              style={styles.textarea}
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Write your message"
              maxLength={250}
              required
            />
          </div>
          <div style={styles.formRow}>
            <label style={styles.label}>Image URL</label>
            <input
              style={styles.input}
              value={image}
              type="url"
              onChange={e => setImage(e.target.value)}
              placeholder="Paste image link (optional)"
            />
          </div>
          <div style={styles.formRow}>
            <label style={styles.label}>Target Audience</label>
            <select style={styles.input} value={audience} onChange={e => setAudience(e.target.value)}>
              {audienceOptions.map(opt => (
                <option value={opt.value} key={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          {audience === "specific" && (
            <div style={styles.formRow}>
              <label style={styles.label}>User IDs</label>
              <input
                style={styles.input}
                value={specificUserIDs}
                onChange={e => setSpecificUserIDs(e.target.value)}
                placeholder="Comma separated IDs"
                required
              />
            </div>
          )}
          <div style={styles.formRow}>
            <label style={styles.label}>Schedule</label>
            <input
              type="checkbox"
              checked={isSchedule}
              onChange={() => setIsSchedule(v => !v)}
              style={{ marginRight: 8 }}
            />
            <span>Schedule for later</span>
            {isSchedule && (
              <input
                style={{ ...styles.input, marginLeft: 12, width: 180 }}
                type="datetime-local"
                value={scheduled}
                onChange={e => setScheduled(e.target.value)}
                required
              />
            )}
          </div>
          <div style={styles.buttonRow}>
            <button type="submit" style={styles.primaryBtn}>
              {isSchedule ? "Schedule" : "Send Now"}
            </button>
            <button
              type="button"
              style={styles.clearBtn}
              onClick={() => {
                setTitle(""); setBody(""); setImage(""); setAudience("all");
                setSpecificUserIDs(""); setTemplate(""); setIsSchedule(false); setScheduled("");
              }}
            >
              Clear
            </button>
          </div>
        </form>
      ) : (
        <div style={styles.card}>
          <h3 style={styles.tableTitle}>Sent Notifications</h3>
          {history.length === 0 ? (
            <div style={{ color: "#888", textAlign: "center", padding: 36 }}>No notifications yet.</div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Title</th>
                  <th style={styles.th}>Message</th>
                  <th style={styles.th}>Audience</th>
                  <th style={styles.th}>User IDs</th>
                  <th style={styles.th}>Scheduled</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Image</th>
                </tr>
              </thead>
              <tbody>
                {history.map(n => (
                  <tr key={n.id}>
                    <td style={styles.td}>{n.title}</td>
                    <td style={styles.td}>{n.body}</td>
                    <td style={styles.td}>{n.audience}</td>
                    <td style={styles.td}>{n.userIDs || "-"}</td>
                    <td style={styles.td}>{n.scheduled}</td>
                    <td style={styles.td}>{n.status}</td>
                    <td style={styles.td}>
                      {n.image ? (
                        <img src={n.image} alt="" style={{ width: 36, height: 36, borderRadius: 4, objectFit: "cover" }}/>
                      ) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f6f7fb",
    padding: "32px 0 40px 0",
    fontFamily: "Inter, sans-serif",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  headerBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    width: "94%",
    margin: "0 0 12px 0"
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: 700,
    color: "#202947",
    margin: 0,
  },
  tabs: { display: "flex", gap: 10 },
  tab: {
    fontWeight: 500,
    fontSize: 15,
    color: "#4c5678",
    background: "none",
    border: "none",
    borderBottom: "2.5px solid transparent",
    padding: "12px 22px",
    cursor: "pointer",
    transition: "all 0.18s"
  },
  activeTab: {
    fontWeight: 700,
    color: "#196bf7",
    background: "none",
    border: "none",
    borderBottom: "2.5px solid #196bf7",
    padding: "12px 22px",
    cursor: "pointer"
  },
  card: {
    background: "#fff",
    borderRadius: 15,
    boxShadow: "0 4px 24px rgba(50,50,93,0.07)",
    padding: "32px 40px",
    minWidth: 370,
    maxWidth: 650,
    width: "100%",
    marginTop: 22,
    marginBottom: 12,
    display: "flex",
    flexDirection: "column",
    gap: 20
  },
  formRow: {
    display: "flex",
    alignItems: "center",
    gap: 15,
    marginBottom: 5,
  },
  label: {
    minWidth: 120,
    color: "#47506e",
    fontWeight: 500,
    fontSize: 15
  },
  input: {
    flex: 1,
    border: "1.5px solid #e2e4f0",
    borderRadius: 7,
    padding: "8px 14px",
    fontSize: 15,
    background: "#f8fafd",
    outline: "none",
    boxSizing: "border-box",
    margin: 0,
    fontFamily: "inherit",
    transition: "border 0.15s"
  },
  textarea: {
    flex: 1,
    border: "1.5px solid #e2e4f0",
    borderRadius: 7,
    padding: "8px 14px",
    fontSize: 15,
    minHeight: 48,
    maxWidth: 320,
    background: "#f8fafd",
    resize: "vertical",
    fontFamily: "inherit",
    transition: "border 0.15s"
  },
  buttonRow: {
    display: "flex",
    gap: 18,
    marginTop: 6
  },
  primaryBtn: {
    padding: "10px 28px",
    background: "#196bf7",
    color: "#fff",
    fontWeight: 600,
    fontSize: 16,
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(25,107,247,0.08)"
  },
  clearBtn: {
    padding: "10px 28px",
    background: "#f8fafd",
    color: "#196bf7",
    fontWeight: 500,
    fontSize: 15,
    border: "1.5px solid #e2e4f0",
    borderRadius: 8,
    cursor: "pointer",
    marginLeft: 5
  },
  tableTitle: { fontWeight: 700, color: "#196bf7", fontSize: 17, margin: "0 0 20px 0" },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 15,
    marginTop: 4,
    background: "#fff"
  },
  th: {
    fontWeight: 600,
    color: "#384068",
    background: "#f8fafd",
    padding: "9px 10px",
    borderBottom: "2px solid #e2e4f0",
    textAlign: "left"
  },
  td: {
    color: "#23243a",
    padding: "9px 10px",
    borderBottom: "1px solid #f0f2fd",
    fontWeight: 400,
    verticalAlign: "middle"
  },
};
