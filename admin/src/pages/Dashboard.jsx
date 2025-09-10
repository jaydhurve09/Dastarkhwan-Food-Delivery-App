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
import scooterIcon from "../assets/scooter.png";
import DeliveryPartnerMap from "../components/DeliveryPartnerMap";
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
const orderStatusColors = ["#22c55e", "#fbbf24", "#ef4444", "#0ea5e9", "#f59e42", "#a855f7", "#ec4899"];
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
  
  // State hooks
  const [search, setSearch] = useState("");
  
  // State for monthly sales calculation
  const [monthlyStats, setMonthlyStats] = useState({
    thisMonthSales: 0,
    todaySales: 0,
    ongoingOrders: 0,
    totalOrders: 0,
    loading: true
  });

  // State for order status distribution
  const [orderStatusData, setOrderStatusData] = useState([
    { name: "Delivered", value: 0 },
    { name: "Pending", value: 0 },
    { name: "Cancelled", value: 0 },
    { name: "Dispatched", value: 0 },
    { name: "Preparing", value: 0 },
    { name: "Prepared", value: 0 },
    { name: "Yet to be Accepted", value: 0 }
  ]);

  // State for top dishes data
  const [topDishesLiveData, setTopDishesLiveData] = useState({
    Today: [],
    "This Month": [],
    "Last 3 Months": []
  });

  // State for live sales data
  const [liveSalesData, setLiveSalesData] = useState({
    monthly: [],
    daily: []
  });
  
  // State for user counts
  const [userCounts, setUserCounts] = useState({
    totalUsers: 0,
    totalDeliveryPartners: 0,
    loading: true
  });
  
  // KPI definitions
  const kpis = [
    { label: "Total Orders", value: monthlyStats.loading ? "..." : monthlyStats.totalOrders, icon: <FaShoppingCart size={28} color="#22c55e" />, bg: "#e7f9f2" },
    { label: "This Month Sales", value: monthlyStats.loading ? "..." : `₹${monthlyStats.thisMonthSales.toLocaleString('en-IN')}`, icon: <FaRupeeSign size={24} color="#38bdf8" />, bg: "#e0f2fe" },
    { label: "Today Sales", value: monthlyStats.loading ? "..." : `₹${monthlyStats.todaySales.toLocaleString('en-IN')}`, icon: <FaRupeeSign size={24} color="#818cf8" />, bg: "#e0e7ff" },
    { label: "Total Users", value: users.length, icon: <FaUsers size={28} color="#f59e42" />, bg: "#fff3e6", id: 'totalUsers' },
    { label: "Total Delivery Partners", value: deliveryPartners.length, icon: <FaMotorcycle size={28} color="#a855f7" />, bg: "#f4e7fa", id: 'totalDeliveryPartners' },
    { label: "Ongoing Orders", value: monthlyStats.loading ? "..." : monthlyStats.ongoingOrders, icon: <FaBoxOpen size={27} color="#0ea5e9" />, bg: "#e0f2fe" },
    
  ];

  // Function to calculate this month's and today's sales and ongoing orders
  const calculateStats = () => {
    // Get current date dynamically from system
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const today = new Date();
    const todayString = today.toLocaleDateString(); // Get local date string
    
    console.log('Current date info:', {
      currentMonth: currentMonth,
      currentYear: currentYear,
      today: today,
      totalOrders: orders.length
    });
    
    console.log('First few orders sample:', orders.slice(0, 3).map(order => ({
      orderId: order.orderId,
      orderStatus: order.orderStatus,
      status: order.status,
      orderValue: order.orderValue,
      createdAt: order.createdAt,
      createdAtType: typeof order.createdAt
    })));
    
    let thisMonthTotal = 0;
    let todayTotal = 0;
    let ongoingCount = 0;
    let totalOrdersCount = 0;
    
    // Initialize status counts
    const statusCounts = {
      delivered: 0,
      dispatched: 0,
      preparing: 0,
      prepared: 0,
      declined: 0
    };
    
    orders.forEach(order => {
      // Get order status (check both status and orderStatus fields)
      const orderStatus = order.status || order.orderStatus;
      
      // Calculate ongoing orders: orders that do NOT have orderStatus as "yetToBeAccepted", "delivered", or "declined"
      if (orderStatus && !['yetToBeAccepted', 'delivered', 'declined'].includes(orderStatus)) {
        ongoingCount++;
      }
      
      // Calculate total orders: orders that do NOT have orderStatus as "yetToBeAccepted" or "declined"
      if (orderStatus && !['yetToBeAccepted', 'declined'].includes(orderStatus)) {
        totalOrdersCount++;
      }
      
      // Count order statuses
      if (orderStatus) {
        console.log('Processing order status:', orderStatus, 'lowercase:', orderStatus.toLowerCase());
        switch (orderStatus.toLowerCase()) {
          case 'delivered':
            statusCounts.delivered++;
            break;
          case 'dispatched':
            statusCounts.dispatched++;
            break;
          case 'preparing':
            statusCounts.preparing++;
            break;
          case 'prepared':
            statusCounts.prepared++;
            break;
          case 'declined':
            statusCounts.declined++;
            break;
          default:
            console.log('⚠️ Unknown order status found:', orderStatus);
            break;
        }
      }
      
      // Calculate sales only for delivered orders
      if (order.orderValue && order.createdAt && orderStatus && orderStatus.toLowerCase() === 'delivered') {
        console.log('Found delivered order:', {
          orderId: order.orderId,
          orderValue: order.orderValue,
          orderStatus: orderStatus,
          createdAtType: typeof order.createdAt,
          createdAtRaw: order.createdAt
        });
        
        // Handle Firestore timestamp - convert to JavaScript Date
        let orderDate;
        if (order.createdAt && typeof order.createdAt === 'object') {
          if (order.createdAt.toDate && typeof order.createdAt.toDate === 'function') {
            // Firestore Timestamp object with toDate method
            orderDate = order.createdAt.toDate();
          } else if (order.createdAt.seconds) {
            // Firestore Timestamp as plain object with seconds
            orderDate = new Date(order.createdAt.seconds * 1000);
          } else if (order.createdAt._seconds) {
            // Alternative Firestore format
            orderDate = new Date(order.createdAt._seconds * 1000);
          } else {
            // Try direct conversion
            orderDate = new Date(order.createdAt);
          }
        } else {
          // Regular date string or number
          orderDate = new Date(order.createdAt);
        }
        
        const orderDateString = orderDate.toLocaleDateString();
        
        console.log('Processed order date:', {
          orderId: order.orderId,
          orderDate: orderDate,
          orderDateString: orderDateString,
          todayString: todayString,
          currentMonth: currentMonth,
          currentYear: currentYear,
          orderMonth: orderDate.getMonth(),
          orderYear: orderDate.getFullYear(),
          isCurrentMonth: orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear,
          isToday: orderDateString === todayString
        });
        
        // Check if order is from this month
        if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) {
          thisMonthTotal += parseFloat(order.orderValue) || 0;
          console.log('✅ Added to thisMonthTotal:', order.orderValue, 'New total:', thisMonthTotal);
        } else {
          console.log('❌ Order not from current month');
        }
        
        // Check if order is from today
        if (orderDateString === todayString) {
          todayTotal += parseFloat(order.orderValue) || 0;
          console.log('✅ Added to todayTotal:', order.orderValue, 'New total:', todayTotal);
        } else {
          console.log('❌ Order not from today - orderDate:', orderDateString, 'today:', todayString);
        }
      }
    });
    
    // Calculate top dishes
    const dishCounts = {
      today: {},
      thisMonth: {},
      last3Months: {}
    };
    
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    orders.forEach(order => {
      if (order.items && Array.isArray(order.items) && order.createdAt) {
        const orderDate = new Date(order.createdAt);
        
        order.items.forEach(item => {
          const dishName = item.name || item.dishName || item.itemName;
          const quantity = parseInt(item.quantity) || 1;
          
          if (dishName) {
            // Today's dishes
            if (orderDate.toDateString() === today) {
              dishCounts.today[dishName] = (dishCounts.today[dishName] || 0) + quantity;
            }
            
            // This month's dishes
            if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) {
              dishCounts.thisMonth[dishName] = (dishCounts.thisMonth[dishName] || 0) + quantity;
            }
            
            // Last 3 months dishes
            if (orderDate >= threeMonthsAgo) {
              dishCounts.last3Months[dishName] = (dishCounts.last3Months[dishName] || 0) + quantity;
            }
          }
        });
      }
    });
    
    // Convert to sorted arrays and get top 5
    const getTopDishes = (dishObj) => {
      return Object.entries(dishObj)
        .map(([name, orders]) => ({ name, orders }))
        .sort((a, b) => b.orders - a.orders)
        .slice(0, 5);
    };
    
    setTopDishesLiveData({
      Today: getTopDishes(dishCounts.today),
      "This Month": getTopDishes(dishCounts.thisMonth),
      "Last 3 Months": getTopDishes(dishCounts.last3Months)
    });
    
    // Calculate sales data for charts
    const monthlySales = {};
    const dailySales = {};
    const last15Days = [];
    for (let i = 14; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      last15Days.push(date);
    }
    
    orders.forEach(order => {
      if (order.orderValue && order.createdAt) {
        const orderDate = new Date(order.createdAt);
        const orderValue = parseFloat(order.orderValue) || 0;
        
        // Monthly sales (current year)
        if (orderDate.getFullYear() === currentYear) {
          const monthKey = orderDate.toLocaleDateString('en-US', { month: 'short' });
          monthlySales[monthKey] = (monthlySales[monthKey] || 0) + orderValue;
        }
        
        // Daily sales (last 15 days)
        const orderDateStr = orderDate.toDateString();
        last15Days.forEach(day => {
          if (day.toDateString() === orderDateStr) {
            const dayKey = day.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
            dailySales[dayKey] = (dailySales[dayKey] || 0) + orderValue;
          }
        });
      }
    });
    
    // Convert to chart format
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyChartData = monthNames.map(month => ({
      month,
      sales: monthlySales[month] || 0
    }));
    
    const dailyChartData = last15Days.map(day => ({
      date: day.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      sales: dailySales[day.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })] || 0
    }));
    
    setLiveSalesData({
      monthly: monthlyChartData,
      daily: dailyChartData
    });
    
    // Log final status counts for debugging
    console.log('Final status counts:', statusCounts);
    
    // Update order status data with actual order statuses
    setOrderStatusData([
      { name: "Delivered", value: statusCounts.delivered },
      { name: "Dispatched", value: statusCounts.dispatched },
      { name: "Preparing", value: statusCounts.preparing },
      { name: "Prepared", value: statusCounts.prepared },
      { name: "Declined", value: statusCounts.declined }
    ].filter(item => item.value > 0)); // Only show statuses with orders
    
    setMonthlyStats({
      thisMonthSales: thisMonthTotal,
      todaySales: todayTotal,
      ongoingOrders: ongoingCount,
      totalOrders: totalOrdersCount,
      loading: false
    });
  };

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

  // Calculate stats whenever orders change
  useEffect(() => {
    if (orders && orders.length >= 0) {
      calculateStats();
    }
  }, [orders]);

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
  const currentTopDishes = topDishesLiveData[dishRange] || [];
  const filteredDishes = currentTopDishes.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  // Sales time range toggles
  const [salesMode, setSalesMode] = useState("Monthly");
  const [dailyRange, setDailyRange] = useState([0, (liveSalesData.daily.length || 15) - 1]);
  const dailyData = liveSalesData.daily.slice(dailyRange[0], dailyRange[1] + 1);
  const monthlyData = liveSalesData.monthly;

  // For date picker: disable selection not matching daily data
  const dailyDates = liveSalesData.daily.map((d, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (liveSalesData.daily.length - 1 - i));
    return {
      ...d,
      dateObj: date
    };
  });

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
          {!search && currentTopDishes.length === 0 && (
            <div style={{
              textAlign: "center", color: "#94a3b8", marginTop: 10, fontWeight: 500,
              fontSize: 15
            }}>
              No orders found for {dishRange.toLowerCase()}.
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
              {dailyDates.length > 0 && (
                <DatePicker
                  selected={dailyDates[dailyRange[0]]?.dateObj}
                  onChange={date => {
                    const idx = dailyDates.findIndex(d => d.dateObj.getDate() === date.getDate());
                    if (idx !== -1 && idx <= dailyRange[1]) setDailyRange([idx, dailyRange[1]]);
                  }}
                  includeDates={dailyDates.map(d => d.dateObj)}
                  dateFormat="dd MMM"
                  placeholderText="Start"
                  style={{ minWidth: 120 }}
                />
              )}
              <span style={{ fontSize: 13, color: "#666" }}>To</span>
              {dailyDates.length > 0 && (
                <DatePicker
                  selected={dailyDates[dailyRange[1]]?.dateObj}
                  onChange={date => {
                    const idx = dailyDates.findIndex(d => d.dateObj.getDate() === date.getDate());
                    if (idx !== -1 && idx >= dailyRange[0]) setDailyRange([dailyRange[0], idx]);
                  }}
                  includeDates={dailyDates.map(d => d.dateObj)}
                  dateFormat="dd MMM"
                  placeholderText="End"
                  style={{ minWidth: 120 }}
                />
              )}
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

      {/* Live Order Map – show delivery partners from Firestore driverPositions */}
      <motion.div
        initial={{ opacity: 0, y: 35 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.37, duration: 0.7, type: "spring" }}
        style={{
          background: "#fff", borderRadius: 20, boxShadow: "0 2px 6px #f1f1f1",
          padding: "26px 22px", minWidth: 260, maxWidth: 600, margin: "0 auto", textAlign: "center"
        }}>
        <div style={{ fontWeight: 600, marginBottom: 18, fontSize: 17 }}>Live Order Map (Delivery Partners)</div>
        <DeliveryPartnerMap orders={orders} />
        <div style={{ color: "#94a3b8", fontSize: 15, marginTop: 10 }}>
          <b>Scooter icon</b>: delivery partner's live location<br />
          <span style={{ color: "#2563eb" }}>Live from Firestore driverPositions field</span>
        </div>
      </motion.div>
    </div>
  );
}
