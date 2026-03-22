"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Loader } from "@/components/ui/Loader";
import Badge from "@/components/ui/Badge";
import { formatDate } from "@/utils/date";
import {
  Users,
  ShoppingBag,
  Store,
  Truck,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  MessageSquare,
  Activity
} from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, getAuthHeaders, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [usersData, setUsersData] = useState<any[]>([]);
  const [ordersData, setOrdersData] = useState<any[]>([]);
  const [feedbacksData, setFeedbacksData] = useState<any[]>([]);
  const [fetching, setFetching] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/auth/login");
      } else if (user.role !== "admin") {
        router.push("/products"); // Unauthorized
      } else {
        fetchDashboardData();
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === "admin") {
      const delayDebounceFn = setTimeout(() => {
        if (activeTab === "users") fetchUsers();
        if (activeTab === "orders") fetchOrders();
        if (activeTab === "feedback" && feedbacksData.length === 0)
          fetchFeedbacks();
      }, 500);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [searchQuery, activeTab]);

  const fetchDashboardData = async () => {
    setFetching(true);
    try {
      const res = await fetch("/api/admin/dashboard", {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setDashboardData(data.data);
      } else {
        setErrorMsg(data.message || "Failed to load dashboard data");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network Error");
    } finally {
      setFetching(false);
    }
  };

  const fetchUsers = async () => {
    setFetching(true);
    try {
      const res = await fetch(
        `/api/admin/users?search=${encodeURIComponent(searchQuery)}`,
        {
          headers: getAuthHeaders(),
        },
      );
      const data = await res.json();
      if (data.success) setUsersData(data.data);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setFetching(false);
    }
  };

  const fetchOrders = async () => {
    setFetching(true);
    try {
      const res = await fetch(
        `/api/admin/orders?search=${encodeURIComponent(searchQuery)}`,
        {
          headers: getAuthHeaders(),
        },
      );
      const data = await res.json();
      if (data.success) setOrdersData(data.data);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setFetching(false);
    }
  };

  const fetchFeedbacks = async () => {
    setFetching(true);
    try {
      const res = await fetch("/api/admin/feedback", {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) setFeedbacksData(data.data);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setFetching(false);
    }
  };

  const resolveFeedback = async (id: string, currentStatus: string) => {
    try {
      const res = await fetch("/api/admin/feedback", {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id,
          status: currentStatus === "OPEN" ? "RESOLVED" : "OPEN",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedbacksData(
          feedbacksData.map((f) => (f._id === id ? data.data : f)),
        );
      }
    } catch (err: any) {
      setErrorMsg(Array.isArray(err) ? err[0] : err.message);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  if (
    authLoading ||
    (fetching && activeTab === "dashboard" && !dashboardData)
  ) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <Loader size="lg" />
      </div>
    );
  }

  if (!user || user.role !== "admin") return null;

  const tabs = [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "users", label: "All Users", icon: Users },
    { id: "orders", label: "All Orders", icon: ShoppingBag },
    { id: "feedback", label: "User Feedback", icon: MessageSquare },
    { id: "social", label: "Social Metrics", icon: Activity },
  ];

  return (
    <div className="flex h-screen bg-gray-100/50">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xl">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black">
              S
            </div>
            Starta Admin
          </div>
        </div>

        <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchQuery("");
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon
                  size={18}
                  className={isActive ? "text-indigo-600" : "text-gray-400"}
                />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 mb-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                Admin
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-600 font-medium hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut size={16} />
            Log Out
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[100] md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`fixed top-0 left-0 w-72 h-full bg-white z-[110] transform transition-transform duration-300 md:hidden flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xl">
             <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">S</div>
             Starta Admin
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-gray-400 hover:text-gray-600">
             <XCircle size={24} />
          </button>
        </div>
        <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchQuery("");
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all font-bold text-base ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon size={20} className={isActive ? "text-indigo-600" : "text-gray-400"} />
                {tab.label}
              </button>
            );
          })}
        </div>
        <div className="p-4 border-t border-gray-200 bg-gray-50/50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 font-bold hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 flex-shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-gray-400 hover:text-indigo-600 md:hidden"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <h1 className="text-lg md:text-xl font-bold text-gray-800 capitalize truncate max-w-[150px] sm:max-w-none">
              {activeTab === "dashboard" ? "Dashboard Overview" : activeTab}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative hidden lg:block">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder={
                  activeTab === "users"
                    ? "Search users..."
                    : activeTab === "orders"
                      ? "Search orders..."
                      : "Search unavailable"
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={activeTab === "dashboard" || activeTab === "feedback"}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-full text-sm w-48 xl:w-80 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50 disabled:bg-gray-50"
              />
            </div>
            <button
              onClick={() => {
                if (activeTab === "dashboard") fetchDashboardData();
                else if (activeTab === "users") fetchUsers();
                else if (activeTab === "orders") fetchOrders();
                else if (activeTab === "feedback") fetchFeedbacks();
              }}
              className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
              title="Refresh Data"
            >
              <RefreshCw size={18} className={fetching ? "animate-spin" : ""} />
            </button>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {errorMsg && (
            <div className="mb-6 bg-red-50 text-red-500 p-4 rounded-xl border border-red-100 flex items-center gap-3">
              <XCircle size={20} />
              <p className="font-medium text-sm">{errorMsg}</p>
              <button
                onClick={() => setErrorMsg("")}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                &times;
              </button>
            </div>
          )}

          {/* DASHBOARD TAB */}
          {activeTab === "dashboard" && dashboardData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Total Users"
                  value={dashboardData.totalUsers || 0}
                  icon={Users}
                  color="bg-blue-500"
                  trend="+12% this week"
                />
                <StatCard
                  title="Total Sellers"
                  value={dashboardData.totalSellers || 0}
                  icon={Store}
                  color="bg-purple-500"
                  trend="+5% this week"
                />
                <StatCard
                  title="Total Delivery"
                  value={dashboardData.totalDelivery || 0}
                  icon={Truck}
                  color="bg-green-500"
                  trend="+2% this week"
                />
                <StatCard
                  title="Total Orders"
                  value={dashboardData.totalOrders || 0}
                  icon={ShoppingBag}
                  color="bg-pink-500"
                  trend="+24% this week"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* System Activity Chart */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                      <Package size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">
                        System Activity
                      </h3>
                      <p className="text-xs text-gray-500">Last 7 Days Trend</p>
                    </div>
                  </div>

                  {dashboardData.chartData &&
                  dashboardData.chartData.length > 0 ? (
                    <div className="flex-1 flex items-end justify-between gap-2 mt-4 pt-4 border-t border-gray-100 h-48">
                      {dashboardData.chartData.map(
                        (data: any, index: number) => {
                          // Max value for scaling
                          const maxVal = Math.max(
                            ...dashboardData.chartData.map((d: any) =>
                              Math.max(d.orders, d.users, 1),
                            ),
                          );
                          const orderHeight = `${(data.orders / maxVal) * 100}%`;
                          const userHeight = `${(data.users / maxVal) * 100}%`;

                          return (
                            <div
                              key={index}
                              className="flex flex-col items-center flex-1 group"
                            >
                              <div className="flex gap-1 items-end h-full w-full justify-center relative">
                                {/* Order Bar */}
                                <div
                                  className="w-1/3 bg-indigo-500 rounded-t-md relative group-hover:bg-indigo-600 transition-colors min-h-[4px]"
                                  style={{ height: orderHeight }}
                                  title={`Orders: ${data.orders}`}
                                ></div>
                                {/* User Bar */}
                                <div
                                  className="w-1/3 bg-purple-400 rounded-t-md relative group-hover:bg-purple-500 transition-colors min-h-[4px]"
                                  style={{ height: userHeight }}
                                  title={`Users: ${data.users}`}
                                ></div>
                              </div>
                              <span className="text-[10px] text-gray-400 mt-2 font-medium truncate w-full text-center">
                                {data.name}
                              </span>
                            </div>
                          );
                        },
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                      No activity data...
                    </div>
                  )}

                  <div className="flex justify-center gap-4 mt-6 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm bg-indigo-500"></div>{" "}
                      Orders
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm bg-purple-400"></div>{" "}
                      Signups
                    </div>
                  </div>
                </div>

                {/* Recent Transactions */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-pink-50 text-pink-600 rounded-lg">
                        <Clock size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">
                          Recent Activity
                        </h3>
                        <p className="text-xs text-gray-500">
                          Latest orders & signups
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                    {/* Orders */}
                    {dashboardData.recentOrders
                      ?.slice(0, 3)
                      .map((order: any) => (
                        <div
                          key={order._id}
                          className="flex items-center justify-between p-3 rounded-xl border border-gray-50 bg-gray-50/50 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                              <ShoppingBag size={16} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-800">
                                New Order{" "}
                                <span className="text-gray-400 font-mono text-xs">
                                  #{order._id.slice(-6)}
                                </span>
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDate(order.createdAt)} •{" "}
                                <span
                                  className={`font-semibold ${order.paymentStatus === "PAID" ? "text-green-600" : "text-orange-500"}`}
                                >
                                  {order.paymentStatus || "PENDING"}
                                </span>
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-800">
                              ₹{order.totalAmount}
                            </p>
                            <p className="text-xs text-gray-400">
                              {order.status}
                            </p>
                          </div>
                        </div>
                      ))}

                    {/* Users */}
                    {dashboardData.recentUsers?.slice(0, 3).map((user: any) => (
                      <div
                        key={user._id}
                        className="flex items-center justify-between p-3 rounded-xl border border-gray-50 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                            <Users size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">
                              New User Request
                            </p>
                            <p className="text-xs text-gray-500">
                              {user.name} • {formatDate(user.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="info">{user.role}</Badge>
                        </div>
                      </div>
                    ))}

                    {!dashboardData.recentOrders?.length &&
                      !dashboardData.recentUsers?.length && (
                        <p className="text-sm text-gray-400 text-center py-4">
                          No recent activity detected.
                        </p>
                      )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* USERS TAB */}
          {activeTab === "users" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-800">
                  Registered Users ({usersData.length})
                </h3>
              </div>

              {fetching && usersData.length === 0 ? (
                <div className="p-12 flex justify-center">
                  <Loader />
                </div>
              ) : usersData.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  No users found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider">
                        <th className="px-6 py-4 font-semibold">User</th>
                        <th className="px-6 py-4 font-semibold">Role</th>
                        <th className="px-6 py-4 font-semibold">Phone</th>
                        <th className="px-6 py-4 font-semibold">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {usersData.map((u: any) => (
                        <tr
                          key={u._id}
                          onClick={() => setSelectedUser(u)}
                          className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {u.profilePhoto?.url ? (
                                <img
                                  src={u.profilePhoto.url}
                                  alt={u.name}
                                  className="w-9 h-9 rounded-full object-cover shadow-sm bg-gray-100"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                                  {u.name?.charAt(0) || "U"}
                                </div>
                              )}
                              <div>
                                <div className="font-semibold text-gray-800">
                                  {u.name || "N/A"}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {u.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge
                              variant={
                                u.role === "admin"
                                  ? "error"
                                  : u.role === "seller"
                                    ? "warning"
                                    : u.role === "delivery"
                                      ? "success"
                                      : "default"
                              }
                            >
                              {u.role}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {u.phone || "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {formatDate(u.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ORDERS TAB */}
          {activeTab === "orders" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-800">
                  All Orders ({ordersData.length})
                </h3>
              </div>

              {fetching && ordersData.length === 0 ? (
                <div className="p-12 flex justify-center">
                  <Loader />
                </div>
              ) : ordersData.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  No orders found.
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  {ordersData.map((order: any) => (
                    <div
                      key={order._id}
                      className="bg-gray-50 rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200 pb-4 mb-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 font-semibold mb-1">
                            ORDER #{order._id.toUpperCase()}
                          </p>
                          <div className="flex items-center gap-3">
                            <h4 className="text-lg font-bold text-gray-800">
                              ${order.totalAmount?.toFixed(2) || "0.00"}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {formatDate(order.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-600">
                            Status:
                          </span>
                          <Badge
                            variant={
                              order.status === "DELIVERED"
                                ? "success"
                                : [
                                      "PLACED",
                                      "CONFIRMED",
                                      "PROCESSING",
                                      "PICKED_UP",
                                    ].includes(order.status)
                                  ? "info"
                                  : order.status === "CANCELLED"
                                    ? "error"
                                    : "default"
                            }
                          >
                            {order.status}
                          </Badge>
                          <Badge
                            variant={
                              order.paymentStatus === "PAID" ||
                              ["DELIVERED", "COMPLETED"].includes(order.status)
                                ? "success"
                                : "warning"
                            }
                          >
                            {["DELIVERED", "COMPLETED"].includes(order.status)
                              ? "PAID"
                              : order.paymentStatus || "PENDING"}{" "}
                            Payment
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Buyer Info */}
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                          <h5 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <Users size={16} className="text-blue-500" /> Buyer
                          </h5>
                          {order.buyer ? (
                            <div className="text-sm space-y-1">
                              <p>
                                <span className="text-gray-500 font-medium">
                                  Name:
                                </span>{" "}
                                {order.buyer.name}
                              </p>
                              <p>
                                <span className="text-gray-500 font-medium">
                                  Email:
                                </span>{" "}
                                {order.buyer.email}
                              </p>
                              <p>
                                <span className="text-gray-500 font-medium">
                                  Phone:
                                </span>{" "}
                                {order.buyer.phone}
                              </p>
                              <p>
                                <span className="text-gray-500 font-medium">
                                  Address:
                                </span>{" "}
                                {order.deliveryAddress}
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400 italic">
                              No buyer data
                            </p>
                          )}
                        </div>

                        {/* Seller Info */}
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                          <h5 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <Store size={16} className="text-purple-500" />{" "}
                            Seller
                          </h5>
                          {order.seller ? (
                            <div className="text-sm space-y-1">
                              <p>
                                <span className="text-gray-500 font-medium">
                                  Shop:
                                </span>{" "}
                                {order.seller.shopName || order.seller.name}
                              </p>
                              <p>
                                <span className="text-gray-500 font-medium">
                                  Email:
                                </span>{" "}
                                {order.seller.email}
                              </p>
                              <p>
                                <span className="text-gray-500 font-medium">
                                  Phone:
                                </span>{" "}
                                {order.seller.phone}
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400 italic">
                              No seller data
                            </p>
                          )}
                        </div>

                        {/* Delivery Info */}
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                          <h5 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <Truck size={16} className="text-green-500" />{" "}
                            Delivery
                          </h5>
                          {order.delivery ? (
                            <div className="text-sm space-y-1">
                              <p>
                                <span className="text-gray-500 font-medium">
                                  Name:
                                </span>{" "}
                                {order.delivery.name}
                              </p>
                              <p>
                                <span className="text-gray-500 font-medium">
                                  Email:
                                </span>{" "}
                                {order.delivery.email}
                              </p>
                              <p>
                                <span className="text-gray-500 font-medium">
                                  Phone:
                                </span>{" "}
                                {order.delivery.phone}
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400 italic">
                              Not assigned yet
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Items */}
                      <div className="mt-6">
                        <h5 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <Package size={16} className="text-indigo-500" />{" "}
                          Order Items
                        </h5>
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase px-4">
                              <tr>
                                <th className="px-4 py-3 font-semibold text-left">
                                  Product
                                </th>
                                <th className="px-4 py-3 font-semibold text-center">
                                  Qty
                                </th>
                                <th className="px-4 py-3 font-semibold text-right">
                                  Price
                                </th>
                                <th className="px-4 py-3 font-semibold text-right">
                                  Total
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {order.items?.map((item: any, idx: number) => (
                                <tr key={idx} className="hover:bg-gray-50/50">
                                  <td className="px-4 py-3 font-medium text-gray-800">
                                    {item.product?.name || "Unknown Product"}
                                  </td>
                                  <td className="px-4 py-3 text-center text-gray-600">
                                    {item.quantity}
                                  </td>
                                  <td className="px-4 py-3 text-right text-gray-600">
                                    ${item.price?.toFixed(2)}
                                  </td>
                                  <td className="px-4 py-3 text-right font-medium text-gray-800">
                                    ${(item.quantity * item.price).toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* FEEDBACK TAB */}
          {activeTab === "feedback" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-6">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-800">
                  User Feedback & Complaints ({feedbacksData.length})
                </h3>
              </div>

              {fetching && feedbacksData.length === 0 ? (
                <div className="p-12 flex justify-center">
                  <Loader />
                </div>
              ) : feedbacksData.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  No feedback or complaints found.
                </div>
              ) : (
                <div className="p-6 space-y-4">
                  {feedbacksData.map((f: any) => (
                    <div
                      key={f._id}
                      className="bg-gray-50 p-5 rounded-xl border border-gray-100 flex flex-col items-start gap-4 hover:shadow-sm transition-all sm:flex-row sm:justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 border-b border-gray-200 pb-3 mb-3">
                          <div
                            className={`p-2 rounded-lg text-white ${f.type === "COMPLAINT" ? "bg-red-500" : "bg-blue-500"}`}
                          >
                            <MessageSquare size={16} />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-800">
                              {f.name}
                            </h4>
                            <p className="text-xs text-gray-500">{f.email}</p>
                          </div>
                          <Badge
                            variant={f.type === "COMPLAINT" ? "error" : "info"}
                            className="ml-auto sm:ml-4"
                          >
                            {f.type}
                          </Badge>
                          <Badge
                            variant={
                              f.status === "RESOLVED" ? "success" : "warning"
                            }
                          >
                            {f.status}
                          </Badge>
                        </div>
                        <p className="text-gray-700 text-sm italic border-l-4 border-indigo-200 pl-3">
                          "{f.message}"
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {formatDate(f.createdAt)}
                        </p>
                      </div>
                      <div className="mt-3 sm:mt-0 sm:ml-4 shrink-0">
                        <Button
                          variant={
                            f.status === "RESOLVED" ? "outline" : "primary"
                          }
                          onClick={() => resolveFeedback(f._id, f.status)}
                          className={
                            f.status === "RESOLVED"
                              ? "text-gray-500"
                              : "bg-green-600 hover:bg-green-700 text-white"
                          }
                        >
                          {f.status === "RESOLVED" ? "Reopen" : "Mark Resolved"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SOCIAL METRICS TAB */}
          {activeTab === "social" && dashboardData?.socialMetrics && (
             <div className="space-y-6">
                 {/* Quick Stats Header */}
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Active Users"
                        value={dashboardData.totalUsers || 0}
                        icon={Users}
                        color="bg-blue-500"
                        trend="Total Users on Platform"
                    />
                    <StatCard
                        title="Total Posts Made"
                        value={dashboardData.socialMetrics.totalPosts || 0}
                        icon={Activity}
                        color="bg-purple-500"
                        trend="Overall Network Content"
                    />
                 </div>

                 {/* Top Content Row */}
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                    
                    {/* Highest Liked */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
                               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">Highest Liked Post</h3>
                                <p className="text-xs text-gray-500">Most engaged content overall</p>
                            </div>
                        </div>
                        {dashboardData.socialMetrics.highestLikedPost ? (
                            <div className="flex-1 bg-gray-50/50 border border-gray-100 p-4 rounded-xl flex flex-col items-center justify-center text-center">
                                <h4 className="text-3xl font-black text-red-500 mb-1">{dashboardData.socialMetrics.highestLikedPost.interactions}</h4>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Total Likes</span>
                                <p className="text-sm font-medium text-gray-700 italic border-l-2 border-red-200 pl-3">"{dashboardData.socialMetrics.highestLikedPost.content?.substring(0, 100)}{dashboardData.socialMetrics.highestLikedPost.content?.length > 100 ? '...' : ''}"</p>
                                <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full mt-3 font-mono">{dashboardData.socialMetrics.highestLikedPost.id.split('-')[0]}</span>
                            </div>
                        ) : <div className="p-4 text-center text-gray-400 text-sm">No likes data.</div>}
                    </div>

                    {/* Highest Viewed */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                               <Activity size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">Highest Viewed Post</h3>
                                <p className="text-xs text-gray-500">Maximum organic reach</p>
                            </div>
                        </div>
                        {dashboardData.socialMetrics.highestViewedPost ? (
                            <div className="flex-1 bg-gray-50/50 border border-gray-100 p-4 rounded-xl flex flex-col items-center justify-center text-center">
                                <h4 className="text-3xl font-black text-blue-500 mb-1">{dashboardData.socialMetrics.highestViewedPost.interactions}</h4>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Unique Views</span>
                                <p className="text-sm font-medium text-gray-700 italic border-l-2 border-blue-200 pl-3">"{dashboardData.socialMetrics.highestViewedPost.content?.substring(0, 100)}{dashboardData.socialMetrics.highestViewedPost.content?.length > 100 ? '...' : ''}"</p>
                                <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full mt-3 font-mono">{dashboardData.socialMetrics.highestViewedPost.id.split('-')[0]}</span>
                            </div>
                        ) : <div className="p-4 text-center text-gray-400 text-sm">No views data.</div>}
                    </div>

                    {/* Highest Shared */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-500 flex items-center justify-center">
                               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">Highest Shared Post</h3>
                                <p className="text-xs text-gray-500">Most virality and DM shares</p>
                            </div>
                        </div>
                        {dashboardData.socialMetrics.highestSharedPost ? (
                            <div className="flex-1 bg-gray-50/50 border border-gray-100 p-4 rounded-xl flex flex-col items-center justify-center text-center">
                                <h4 className="text-3xl font-black text-green-500 mb-1">{dashboardData.socialMetrics.highestSharedPost.interactions}</h4>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Chat Shares</span>
                                <p className="text-sm font-medium text-gray-700 italic border-l-2 border-green-200 pl-3">"{dashboardData.socialMetrics.highestSharedPost.content?.substring(0, 100)}{dashboardData.socialMetrics.highestSharedPost.content?.length > 100 ? '...' : ''}"</p>
                                <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full mt-3 font-mono">{dashboardData.socialMetrics.highestSharedPost.id.split('-')[0]}</span>
                            </div>
                        ) : <div className="p-4 text-center text-gray-400 text-sm">No sharing data available yet.</div>}
                    </div>

                 </div>
             </div>
          )}
        </div>
      </main>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in duration-200">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h3 className="font-bold text-lg text-gray-800">User Profile</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center relative">
              <div className="absolute top-6 right-6">
                {selectedUser.isOnline && (
                  <span className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                )}
              </div>

              {selectedUser.profilePhoto?.url ? (
                <img
                  src={selectedUser.profilePhoto.url}
                  alt={selectedUser.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md bg-gray-50 mb-4"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-bold text-3xl shadow-sm mb-4">
                  {selectedUser.name?.charAt(0) || "U"}
                </div>
              )}

              <h4 className="text-xl font-bold text-gray-800">
                {selectedUser.name}
              </h4>
              <p className="text-sm text-gray-500 mb-3">{selectedUser.email}</p>
              <Badge
                variant={
                  selectedUser.role === "admin"
                    ? "error"
                    : selectedUser.role === "seller"
                      ? "warning"
                      : selectedUser.role === "delivery"
                        ? "success"
                        : "default"
                }
              >
                {selectedUser.role.toUpperCase()}
              </Badge>

              <div className="w-full mt-6 space-y-3 text-sm">
                <div className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-gray-500 font-medium">System ID</span>
                  <span className="text-gray-800 font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                    {selectedUser._id}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-gray-500 font-medium">Phone</span>
                  <span className="text-gray-800">
                    {selectedUser.phone || "Not provided"}
                  </span>
                </div>
                {selectedUser.address ? (
                  <div className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="text-gray-500 font-medium">Address</span>
                    <span
                      className="text-gray-800 text-right max-w-[200px] truncate"
                      title={selectedUser.address}
                    >
                      {selectedUser.address}
                    </span>
                  </div>
                ) : null}
                {selectedUser.dateOfBirth ? (
                  <div className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="text-gray-500 font-medium">DOB</span>
                    <span className="text-gray-800">
                      {formatDate(selectedUser.dateOfBirth)}
                    </span>
                  </div>
                ) : null}
                <div className="flex justify-between pt-1">
                  <span className="text-gray-500 font-medium">
                    Joined Platform
                  </span>
                  <span className="text-gray-800 font-medium">
                    {formatDate(selectedUser.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50/80 p-4 border-t border-gray-100 flex justify-end">
              <Button onClick={() => setSelectedUser(null)} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Component
function StatCard({ title, value, icon: Icon, color, trend }: any) {
  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-semibold text-gray-500 mb-1">{title}</p>
          <h2 className="text-3xl font-extrabold text-gray-800">{value}</h2>
        </div>
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${color} shadow-lg shadow-${color.replace("bg-", "")}/30 transform group-hover:scale-110 transition-transform`}
        >
          <Icon size={24} />
        </div>
      </div>
      <div className="mt-4 flex items-center text-xs font-medium text-green-600 bg-green-50 w-fit px-2 py-1 rounded-md">
        <span>{trend}</span>
      </div>
      {/* Decorative accent */}
      <div
        className={`absolute -right-6 -bottom-6 w-24 h-24 ${color} opacity-[0.03] rounded-full group-hover:scale-150 transition-transform duration-500`}
      ></div>
    </div>
  );
}
