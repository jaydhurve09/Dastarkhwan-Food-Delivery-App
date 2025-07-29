import React, { useState, useEffect,useContext } from "react";
import {
  FaShoppingCart, FaRupeeSign, FaUsers, FaMotorcycle, FaStar,
  FaBoxOpen, FaUtensils, FaSearch, FaUserCheck, FaUserShield
} from "react-icons/fa";
import {
  PieChart, Pie, Cell, Legend, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from "recharts";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import DatePicker from "react-datepicker";
import { motion } from "framer-motion";
import "react-datepicker/dist/react-datepicker.css";
import "leaflet/dist/leaflet.css";
import { AdminContext } from "../contexts/adminContext";
// ---- Delivery Map Data Nagpur ----
const deliveryData = [
  {
    id: 1,
    boyName: "Ravi Pawar",
    location: [21.146633, 79.079637],
    destination: [21.153590, 79.085517],
    orderId: "ORD2001"
  },
  {
    id: 2,
    boyName: "Sushil Deshmukh",
    location: [21.127861, 79.106484],
    destination: [21.120373, 79.086538],
    orderId: "ORD2002"
  },
  {
    id: 3,
    boyName: "Anjali Chavan",
    location: [21.165312, 79.068374],
    destination: [21.173274, 79.102611],
    orderId: "ORD2003"
  }
];
const blueIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});
const greenIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});
const redIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});
function isArrived(loc, dest) {
  const [lat1, lon1] = loc;
  const [lat2, lon2] = dest;
  return Math.abs(lat1 - lat2) < 0.001 && Math.abs(lon1 - lon2) < 0.001;
}

// ---- Card Data ----

// ---- Status and Rating Data ----
const orderStatusData = [
  { name: "Delivered", value: 850 },
  { name: "Pending", value: 260 },
  { name: "Cancelled", value: 133 },
];
const orderStatusColors = ["#22c55e", "#fbbf24", "#ef4444"];
const ratingsData = [
  { name: "5 Stars", value: 320 }, { name: "4 Stars", value: 95 },
  { name: "3 Stars", value: 21 }, { name: "2 Stars", value: 7 }, { name: "1 Star", value: 3 },
];
const ratingsColors = ["#fde047", "#a3e635", "#38bdf8", "#fbbf24", "#fb7185"];

// ---- Top Dishes: Mughal Non-veg, Dastarkhawn ----
const dishOptions = ["Today", "This Month", "Last 3 Months"];
const topDishesData = {
  Today: [
    { name: "Mutton Rogan Josh", orders: 14 },
    { name: "Chicken Changezi", orders: 11 },
    { name: "Mutton Korma", orders: 8 },
    { name: "Nihari Gosht", orders: 7 },
    { name: "Murg Musallam", orders: 5 }
  ],
  "This Month": [
    { name: "Chicken Biryani", orders: 98 },
    { name: "Mutton Korma", orders: 87 },
    { name: "Mutton Rogan Josh", orders: 86 },
    { name: "Nihari Gosht", orders: 78 },
    { name: "Murg Musallam", orders: 55 }
  ],
  "Last 3 Months": [
    { name: "Chicken Biryani", orders: 265 },
    { name: "Mutton Rogan Josh", orders: 256 },
    { name: "Chicken Changezi", orders: 236 },
    { name: "Shahi Korma", orders: 221 },
    { name: "Dum Ka Murgh", orders: 185 }
  ],
};
const topDishesColors = ["#ef4444", "#fbbf24", "#f59e42", "#a3e635", "#60a5fa"];

// ---- Sales Data ----
const salesDataMonthly = [
  { month: "Jan", sales: 6200 }, { month: "Feb", sales: 7250 }, { month: "Mar", sales: 8000 },
  { month: "Apr", sales: 6420 }, { month: "May", sales: 9300 }, { month: "Jun", sales: 8900 },
  { month: "Jul", sales: 10100 }, { month: "Aug", sales: 9700 }, { month: "Sep", sales: 10800 },
  { month: "Oct", sales: 11540 }, { month: "Nov", sales: 12200 }, { month: "Dec", sales: 12880 }
];
const salesDataDaily = [
  { date: "8 Jul", sales: 3619 }, { date: "9 Jul", sales: 1456 }, { date: "10 Jul", sales: 1102 },
  { date: "11 Jul", sales: 4037 }, { date: "12 Jul", sales: 2126 }, { date: "13 Jul", sales: 2003 },
  { date: "14 Jul", sales: 1914 }, { date: "15 Jul", sales: 1571 }, { date: "16 Jul", sales: 4016 },
  { date: "17 Jul", sales: 1419 }, { date: "18 Jul", sales: 3771 }, { date: "19 Jul", sales: 4033 },
  { date: "20 Jul", sales: 4654 }, { date: "21 Jul", sales: 3233 }, { date: "22 Jul", sales: 1356 }
];

function formatDate(date) {
  return date ? date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "";
}

export default function Dashboard() {
  const { orders, deliveryPartners, users } = useContext(AdminContext);
  const kpis = [
  { label: "Total Orders", value: orders.length, icon: <FaShoppingCart size={28} color="#22c55e" />, bg: "#e7f9f2" },
  { label: "This Month Sales", value: "₹8,700", icon: <FaRupeeSign size={24} color="#38bdf8" />, bg: "#e0f2fe" },
  { label: "Today Sales", value: "₹1,360", icon: <FaRupeeSign size={24} color="#818cf8" />, bg: "#e0e7ff" },
  { label: "Total Users", value: users.length, icon: <FaUsers size={28} color="#f59e42" />, bg: "#fff3e6", id: 'totalUsers' },
  { label: "Total Delivery Partners", value: deliveryPartners.length, icon: <FaMotorcycle size={28} color="#a855f7" />, bg: "#f4e7fa", id: 'totalDeliveryPartners' },
  { label: "Ongoing Orders", value: 37, icon: <FaBoxOpen size={27} color="#0ea5e9" />, bg: "#e0f2fe" },
  { label: "Avg Restaurant Rating", value: "4.3", icon: <FaStar size={26} color="#fde047" />, bg: "#fffbe8" },
  { label: "Avg Delivery Rating", value: "4.6", icon: <FaStar size={26} color="#f59e42" />, bg: "#fff7ed" },
];

  // Search
  const [search, setSearch] = useState("");
 
  // State for user counts
  const [userCounts, setUserCounts] = useState({
    totalUsers: 0,
    totalDeliveryPartners: 0,
    loading: true
  });

  // Fetch user counts on component mount
  useEffect(() => {
    const fetchUserCounts = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) return;

        const response = await fetch('http://localhost:5000/api/users/counts', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUserCounts({
            totalUsers: data.data.totalUsers || 0,
            totalDeliveryPartners: data.data.totalDeliveryPartners || 0,
            loading: false
          });
        }
      } catch (error) {
        console.error('Error fetching user counts:', error);
        setUserCounts(prev => ({ ...prev, loading: false }));
      }
    };

    fetchUserCounts();
  }, []);

  // Update KPIs with real data
  const updatedKpis = kpis.map(kpi => {
    if (kpi.id === 'totalUsers') {
      return { ...kpi, value: userCounts.loading ? '...' : userCounts.totalUsers };
    }
    if (kpi.id === 'totalDeliveryPartners') {
      return { ...kpi, value: userCounts.loading ? '...' : userCounts.totalDeliveryPartners };
    }
    return kpi;
  });

  // Dishes
  const [dishRange, setDishRange] = useState("Today");
  const filteredDishes = topDishesData[dishRange].filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  // Sales time range toggles
  const [salesMode, setSalesMode] = useState("Monthly");
  const [dailyRange, setDailyRange] = useState([0, salesDataDaily.length - 1]); // default: all 15 days
  const dailyData = salesDataDaily.slice(dailyRange[0], dailyRange[1] + 1);

  // For date picker: disable selection not matching daily data
  const dailyDates = salesDataDaily.map((d, i) => ({
    ...d,
    dateObj: new Date(`2024-07-${8 + i}`) // Just for demo
  }));

  // For Monthly, use full year
  const [monthlyRange, setMonthlyRange] = useState([0, salesDataMonthly.length - 1]);
  const monthlyData = salesDataMonthly.slice(monthlyRange[0], monthlyRange[1] + 1);

  return (
    <div style={{ padding: "0 10px" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center",
        marginBottom: 24, flexWrap: "wrap", gap: 10
      }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 600, margin: 0 }}>Dashboard</h2>
          <p style={{ color: "#8c8c8c", marginTop: 4 }}>Hi, Welcome to Admin!</p>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{
        position: "relative",
        width: "100%",
        marginBottom: 28
      }}>
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search dishes…"
          style={{
            width: "100%",
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            padding: "12px 44px 12px 16px",
            fontSize: 16,
            background: "#fff",
            boxShadow: "0 1px 4px #e5e7eb"
          }}
        />
        {search ? (
          <span
            style={{ position: "absolute", right: 34, top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "#888" }}
            onClick={() => setSearch("")}
          >×</span>
        ) : <FaSearch style={{
          position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
          color: "#94a3b8", fontSize: 20
        }} />}
      </div>

      {/* KPI CARDS */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 32,
        justifyContent: "space-between"
      }}>
        {updatedKpis.map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.5, type: "spring" }}
            style={{
              flex: "1 1 160px", minWidth: 160, maxWidth: "calc(20% - 16px)",
              background: "#fff", borderRadius: 18, boxShadow: "0 2px 6px #f1f1f1",
              display: "flex", alignItems: "center", padding: "16px 22px", gap: 15
            }}
          >
            <div style={{
              background: kpi.bg, borderRadius: "50%", padding: 12,
              display: "flex", alignItems: "center", justifyContent: "center",
              minWidth: 48, minHeight: 48,
            }}>
              {kpi.icon}
            </div>
            <div>
              <div style={{ fontSize: 23, fontWeight: 700, color: "#222" }}>
                {kpi.value}
                {(kpi.label === "Avg Restaurant Rating" || kpi.label === "Avg Delivery Rating") && (
                  <FaStar size={14} color="#facc15" style={{ marginLeft: 3, verticalAlign: "middle" }} />
                )}
              </div>
              <div style={{ color: "#8c8c8c", fontSize: 15 }}>{kpi.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Graphs Row - Orders, Ratings, Top Dishes */}
      <div style={{
        display: "flex", gap: 24, marginBottom: 36, justifyContent: "space-between", flexWrap: "wrap"
      }}>
        {/* Orders by Status Pie */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          style={{
            background: "#fff", borderRadius: 20, boxShadow: "0 2px 6px #f1f1f1",
            padding: "26px 22px", flex: 1, minWidth: 315, maxWidth: 400, textAlign: "center"
          }}>
          <div style={{ fontWeight: 600, marginBottom: 18, fontSize: 17 }}>Orders by Status</div>
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderStatusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%" cy="50%"
                  outerRadius="80%"
                  label
                  paddingAngle={1}
                >
                  {orderStatusData.map((entry, idx) => (
                    <Cell key={idx} fill={orderStatusColors[idx % orderStatusColors.length]} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Ratings Pie */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          style={{
            background: "#fff", borderRadius: 20, boxShadow: "0 2px 6px #f1f1f1",
            padding: "26px 22px", flex: 1, minWidth: 315, maxWidth: 400, textAlign: "center"
          }}>
          <div style={{ fontWeight: 600, marginBottom: 18, fontSize: 17 }}>Ratings Distribution</div>
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ratingsData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%" cy="50%"
                  outerRadius="80%"
                  label
                  paddingAngle={1}
                >
                  {ratingsColors.map((clr, idx) => (
                    <Cell key={idx} fill={clr} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top Dishes – Dastarkhawn Non-Veg */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          style={{
            background: "#fff", borderRadius: 20, boxShadow: "0 2px 6px #f1f1f1",
            padding: "26px 22px", flex: 1, minWidth: 315, maxWidth: 400, textAlign: "center"
          }}>
          <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <FaUtensils color="#dc2626" size={18} />
            Top Dishes – Dastarkhawn Restaurant
          </div>
          <div style={{ marginBottom: 14 }}>
            {dishOptions.map(opt => (
              <button
                key={opt}
                style={{
                  background: dishRange === opt ? "#ef4444" : "#f1f5f9",
                  color: dishRange === opt ? "#fff" : "#374151",
                  border: "none", borderRadius: 5, padding: "4px 13px", margin: "0 6px",
                  fontWeight: 500, cursor: "pointer", fontSize: 14, transition: "all 0.15s"
                }}
                onClick={() => setDishRange(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
          <div style={{ width: "100%", height: 270 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredDishes} layout="vertical" margin={{ left: 35, right: 10 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={120} />
                <Tooltip />
                <Bar dataKey="orders" radius={[8,8,8,8]}>
                  {filteredDishes.map((entry, idx) => (
                    <Cell key={idx} fill={topDishesColors[idx % topDishesColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {search && filteredDishes.length === 0 && (
            <div style={{
              textAlign: "center", color: "#ef4444", marginTop: 10, fontWeight: 500,
              fontSize: 15
            }}>
              No dishes found.
            </div>
          )}
        </motion.div>
      </div>

      {/* SALES BY TIME RANGE with monthly/daily toggle */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.27, duration: 0.65 }}
        style={{
          background: "#fff", borderRadius: 20, boxShadow: "0 2px 6px #f1f1f1",
          padding: "26px 22px", minHeight: 290, marginBottom: 36
        }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 10
        }}>
          <div style={{ fontWeight: 600, fontSize: 17 }}>
            Sales by Time Range (₹)
          </div>
          <div>
            <button
              onClick={() => setSalesMode("Monthly")}
              style={{
                background: salesMode === "Monthly" ? "#2563eb" : "#f1f5f9",
                color: salesMode === "Monthly" ? "#fff" : "#374151",
                border: "none", borderRadius: 5, padding: "4px 13px", margin: "0 5px",
                fontWeight: 500, cursor: "pointer"
              }}
            >Monthly</button>
            <button
              onClick={() => setSalesMode("Daily")}
              style={{
                background: salesMode === "Daily" ? "#2563eb" : "#f1f5f9",
                color: salesMode === "Daily" ? "#fff" : "#374151",
                border: "none", borderRadius: 5, padding: "4px 13px", margin: "0 5px",
                fontWeight: 500, cursor: "pointer"
              }}
            >Last 15 Days</button>
          </div>
        </div>
        {salesMode === "Monthly" ? (
          <>
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={3} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <>
            {/* Range slider for daily date selection */}
            <div style={{ display: "flex", gap: 12, alignItems: "center", margin: "10px 0" }}>
              <span style={{ fontSize: 13, color: "#666" }}>From</span>
              <DatePicker
                selected={dailyDates[dailyRange[0]].dateObj}
                onChange={date => {
                  const idx = dailyDates.findIndex(d => d.dateObj.getDate() === date.getDate());
                  if (idx !== -1 && idx <= dailyRange[1]) setDailyRange([idx, dailyRange[1]]);
                }}
                includeDates={dailyDates.map(d => d.dateObj)}
                dateFormat="dd MMM"
                placeholderText="Start"
                style={{ minWidth: 120 }}
              />
              <span style={{ fontSize: 13, color: "#666" }}>To</span>
              <DatePicker
                selected={dailyDates[dailyRange[1]].dateObj}
                onChange={date => {
                  const idx = dailyDates.findIndex(d => d.dateObj.getDate() === date.getDate());
                  if (idx !== -1 && idx >= dailyRange[0]) setDailyRange([dailyRange[0], idx]);
                }}
                includeDates={dailyDates.map(d => d.dateObj)}
                dateFormat="dd MMM"
                placeholderText="End"
                style={{ minWidth: 120 }}
              />
            </div>
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={3} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </motion.div>

      {/* Live Order Map – Nagpur, Blue line, Presentable */}
      <motion.div
        initial={{ opacity: 0, y: 35 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.37, duration: 0.7, type: "spring" }}
        style={{
          background: "#fff", borderRadius: 20, boxShadow: "0 2px 6px #f1f1f1",
          padding: "26px 22px", minWidth: 260, maxWidth: 600, margin: "0 auto", textAlign: "center"
        }}>
        <div style={{ fontWeight: 600, marginBottom: 18, fontSize: 17 }}>Live Order Map (Nagpur)</div>
        <MapContainer
          center={[21.146633, 79.079637]}
          zoom={12}
          scrollWheelZoom={false}
          style={{ height: 280, width: "100%", borderRadius: 8 }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {deliveryData.map(d => (
            <React.Fragment key={d.id}>
              <Marker
                position={d.location}
                icon={isArrived(d.location, d.destination) ? greenIcon : blueIcon}
              >
                <Popup>
                  <strong>{d.boyName}</strong><br />
                  Order: {d.orderId}<br />
                  Status: <b>{isArrived(d.location, d.destination) ? "Arrived" : "En Route"}</b>
                </Popup>
              </Marker>
              <Marker
                position={d.destination}
                icon={redIcon}
              >
                <Popup>
                  Delivery Address<br />
                  Order: {d.orderId}
                </Popup>
              </Marker>
              <Polyline
                positions={[d.location, d.destination]}
                pathOptions={{ color: "#2563eb", weight: 4, opacity: 0.75 }}
              />
            </React.Fragment>
          ))}
        </MapContainer>
        <div style={{ color: "#94a3b8", fontSize: 15, marginTop: 10 }}>
          <b>Blue</b>: delivery partner<br />
          <b>Green</b>: arrived at order<br />
          <b>Red</b>: delivery address<br />
          <span style={{ color: "#2563eb" }}>Blue line</span>: route from rider to delivery point
        </div>
      </motion.div>
    </div>
  );
}
