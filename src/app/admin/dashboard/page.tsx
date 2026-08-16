"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Loader } from "@/components/ui/Loader";
import Badge from "@/components/ui/Badge";
import { formatDate } from "@/utils/date";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
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

  // Deleted users & activity tracker states
  const [deletedUsersData, setDeletedUsersData] = useState<any[]>([]);
  const [selectedDeletedUser, setSelectedDeletedUser] = useState<any>(null);
  const [deletedUserActivities, setDeletedUserActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [userSummary, setUserSummary] = useState<any>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

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
        if (activeTab === "deleted-users") fetchDeletedUsers();
        if (activeTab === "ADS" && !dashboardData) fetchDashboardData();
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

  const fetchDeletedUsers = async () => {
    setFetching(true);
    try {
      const res = await fetch("/api/admin/deleted-users", {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) setDeletedUsersData(data.data);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to fetch deleted users");
    } finally {
      setFetching(false);
    }
  };

  const fetchDeletedUserActivity = async (deletedUser: any) => {
    setLoadingActivities(true);
    setSelectedDeletedUser(deletedUser);
    setUserSummary(null);
    try {
      const res = await fetch(`/api/admin/deleted-users/${deletedUser._id}/activity`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) setDeletedUserActivities(data.data);

      const sumRes = await fetch(`/api/admin/deleted-users/${deletedUser._id}/summary`, {
        headers: getAuthHeaders(),
      });
      const sumData = await sumRes.json();
      if (sumData.success) setUserSummary(sumData.data.stats);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to fetch activities");
    } finally {
      setLoadingActivities(false);
    }
  };

  const fetchUserSummary = async (targetUser: any) => {
    setSelectedUser(targetUser);
    setUserSummary(null);
    setLoadingSummary(true);
    try {
      const res = await fetch(`/api/admin/users/${targetUser._id}/summary`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setUserSummary(data.data.stats);
      }
    } catch (err) {
      console.error("Failed to fetch user summary:", err);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("⚠️ WARNING: This will permanently delete this user and ALL of their products, reviews, and social posts. They will be archived in the Deleted Users section. Are you sure you want to proceed?")) return;
    
    setDeletingUserId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        alert("User deleted successfully!");
        setSelectedUser(null);
        fetchUsers();
        fetchDeletedUsers();
        setActiveTab("deleted-users");
      } else {
        alert(data.message || "Failed to delete user");
      }
    } catch (err: any) {
      alert(err.message || "Error deleting user");
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleRecoverUser = async (deletedUserId: string) => {
    if (!confirm("Are you sure you want to recover this user account? This will rollback their status from deleted to active.")) return;
    
    setLoadingActivities(true);
    try {
      const res = await fetch(`/api/admin/deleted-users/${deletedUserId}/recover`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        alert("User account recovered successfully!");
        setSelectedDeletedUser(null);
        fetchDeletedUsers();
        fetchUsers();
      } else {
        alert(data.message || "Failed to recover user");
      }
    } catch (err: any) {
      alert(err.message || "Error recovering user");
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  if (
    authLoading ||
    (fetching && (activeTab === "dashboard" || activeTab === "ADS") && !dashboardData)
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
    { id: "ADS", label: "ADS Metrics", icon: Activity },
    { id: "deleted-users", label: "Deleted Users", icon: XCircle },
  ];

  return (
    <div className="flex h-screen bg-gray-100/50 dark:bg-gray-950 text-gray-800 dark:text-gray-100">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 hidden md:flex flex-col flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xl">
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
                    ? "bg-indigo-50 text-indigo-700 font-semibold dark:bg-indigo-950/40 dark:text-indigo-400"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                }`}
              >
                <Icon
                  size={18}
                  className={isActive ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 dark:text-gray-500"}
                />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 mb-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                Admin
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-600 font-medium hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-colors"
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
      <aside className={`fixed top-0 left-0 w-72 h-full bg-white dark:bg-gray-900 z-[110] transform transition-transform duration-300 md:hidden flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xl">
             <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">S</div>
             Starta Admin
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
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
      <main className="flex-1 flex flex-col overflow-hidden relative bg-gray-100/50 dark:bg-gray-950">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 md:px-6 flex-shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 md:hidden"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <h1 className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100 capitalize truncate max-w-[150px] sm:max-w-none">
              {activeTab === "dashboard" ? "Dashboard Overview" : activeTab === "deleted-users" ? "Deleted Users Archive" : activeTab}
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
                disabled={activeTab === "dashboard" || activeTab === "feedback" || activeTab === "deleted-users"}
                className="pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-800 bg-transparent dark:bg-gray-900 dark:text-gray-100 rounded-full text-sm w-48 xl:w-80 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-gray-900"
              />
            </div>
            <ThemeToggle />
            <button
              onClick={() => {
                if (activeTab === "dashboard" || activeTab === "ADS") fetchDashboardData();
                else if (activeTab === "users") fetchUsers();
                else if (activeTab === "orders") fetchOrders();
                else if (activeTab === "feedback") fetchFeedbacks();
                else if (activeTab === "deleted-users") fetchDeletedUsers();
              }}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-full transition-colors"
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
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 flex flex-col hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400 rounded-lg">
                       <Package size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                        System Activity
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Last 7 Days Trend</p>
                    </div>
                  </div>

                  {dashboardData.chartData &&
                  dashboardData.chartData.length > 0 ? (
                    <div className="flex-1 flex items-end justify-between gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 h-48">
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
                              <span className="text-[10px] text-gray-400 dark:text-gray-400 mt-2 font-medium truncate w-full text-center">
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

                  <div className="flex justify-center gap-4 mt-6 text-xs text-gray-500 dark:text-gray-400">
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
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 flex flex-col hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-pink-50 text-pink-600 dark:bg-pink-950/20 dark:text-pink-400 rounded-lg">
                        <Clock size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                          Recent Activity
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
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
                          className="flex items-center justify-between p-3 rounded-xl border border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                              <ShoppingBag size={16} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
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
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <h3 className="font-bold text-gray-800 dark:text-gray-100">
                  Registered Users ({usersData.length})
                </h3>
              </div>

              {fetching && usersData.length === 0 ? (
                <div className="p-12 flex justify-center">
                  <Loader />
                </div>
              ) : usersData.length === 0 ? (
                <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                  No users found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                        <th className="px-6 py-4 font-semibold">User</th>
                        <th className="px-6 py-4 font-semibold">Role</th>
                        <th className="px-6 py-4 font-semibold">Phone</th>
                        <th className="px-6 py-4 font-semibold">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {usersData.map((u: any) => (
                        <tr
                          key={u._id}
                          onClick={() => fetchUserSummary(u)}
                          className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {u.profilePhoto?.url ? (
                                <img
                                  src={u.profilePhoto.url}
                                  alt={u.name}
                                  className="w-9 h-9 rounded-full object-cover shadow-sm bg-gray-100 dark:bg-gray-800"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-bold text-sm shadow-sm">
                                  {u.name?.charAt(0) || "U"}
                                </div>
                              )}
                              <div>
                                <div className="font-semibold text-gray-800 dark:text-gray-200">
                                  {u.name || "N/A"}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
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
          {activeTab === "ADS" && dashboardData && (
             <div className="space-y-8">
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

                  {/* inspireShop Rankings Section */}
                  <div className="space-y-4">
                     <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
                        🛍️ inspireShop Top Performances
                     </h3>
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Top Sellers */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
                          <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-3 text-sm">Top Sellers</h4>
                          {dashboardData.rankings?.topSellers?.length > 0 ? (
                            <div className="space-y-3">
                              {dashboardData.rankings.topSellers.map((s: any, idx: number) => (
                                <div
                                  key={s.id}
                                  onClick={() => {
                                    setActiveTab("users");
                                    setSearchQuery(s.email);
                                  }}
                                  className="flex items-center justify-between text-xs p-2.5 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:border-indigo-200 cursor-pointer transition-all duration-200"
                                  title="View User Details"
                                >
                                  <div className="min-w-0 flex-1">
                                    <p className="font-bold text-gray-800 dark:text-gray-200 truncate">#{idx + 1} {s.name}</p>
                                    <p className="text-[10px] text-gray-400 truncate">{s.email}</p>
                                  </div>
                                  <div className="text-right flex-shrink-0 pl-2">
                                    <p className="font-extrabold text-indigo-600 dark:text-indigo-400">₹{s.totalSales.toLocaleString("en-IN")}</p>
                                    <p className="text-[10px] text-gray-400">{s.ordersCount} orders</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 italic">No sales data yet.</p>
                          )}
                        </div>

                        {/* Most Bought Products */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
                          <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-3 text-sm">Most Bought Products</h4>
                          {dashboardData.rankings?.mostBoughtProducts?.length > 0 ? (
                            <div className="space-y-3">
                              {dashboardData.rankings.mostBoughtProducts.map((p: any, idx: number) => (
                                <a
                                  key={p.id}
                                  href={`/products/${p.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between text-xs p-2.5 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:border-indigo-200 cursor-pointer transition-all duration-200 block"
                                  title="View Product Page"
                                >
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    {p.image ? (
                                      <img src={p.image} className="w-8 h-8 rounded object-cover flex-shrink-0" alt="" />
                                    ) : (
                                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded flex-shrink-0" />
                                    )}
                                    <div className="min-w-0">
                                      <p className="font-bold text-gray-800 dark:text-gray-200 truncate">#{idx + 1} {p.name}</p>
                                      <p className="text-[10px] text-gray-400">₹{p.price}</p>
                                    </div>
                                  </div>
                                  <div className="text-right flex-shrink-0 pl-2">
                                    <p className="font-extrabold text-emerald-600 dark:text-emerald-400">{p.salesCount} sold</p>
                                    <p className="text-[10px] text-gray-400">₹{p.totalEarnings.toLocaleString("en-IN")}</p>
                                  </div>
                                </a>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 italic">No sales data yet.</p>
                          )}
                        </div>

                        {/* Most Viewed Products */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
                          <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-3 text-sm">Most Viewed Products</h4>
                          {dashboardData.rankings?.mostViewedProducts?.length > 0 ? (
                            <div className="space-y-3">
                              {dashboardData.rankings.mostViewedProducts.map((p: any, idx: number) => (
                                <a
                                  key={p.id}
                                  href={`/products/${p.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between text-xs p-2.5 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:border-indigo-200 cursor-pointer transition-all duration-200 block"
                                  title="View Product Page"
                                >
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    {p.image ? (
                                      <img src={p.image} className="w-8 h-8 rounded object-cover flex-shrink-0" alt="" />
                                    ) : (
                                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded flex-shrink-0" />
                                    )}
                                    <div className="min-w-0">
                                      <p className="font-bold text-gray-800 dark:text-gray-200 truncate">#{idx + 1} {p.name}</p>
                                      <p className="text-[10px] text-gray-400">₹{p.price}</p>
                                    </div>
                                  </div>
                                  <div className="text-right flex-shrink-0 pl-2">
                                    <p className="font-extrabold text-blue-600 dark:text-blue-400">👁️ {p.views} views</p>
                                  </div>
                                </a>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 italic">No views data available yet.</p>
                          )}
                        </div>
                     </div>
                  </div>

                  {/* Social Network Content Rankings */}
                  <div className="space-y-4">
                     <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
                        📣 Social Content Performance
                     </h3>
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Highest Liked Posts */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
                          <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-3 text-sm">Highest Liked Posts</h4>
                          {dashboardData.rankings?.topLikedPosts?.length > 0 ? (
                            <div className="space-y-3">
                              {dashboardData.rankings.topLikedPosts.map((p: any, idx: number) => (
                                <a
                                  key={p.id}
                                  href={`/social/post/${p.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block text-xs p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:border-indigo-200 cursor-pointer transition-all duration-200 space-y-2"
                                  title="View Social Post"
                                >
                                  <div className="flex justify-between items-center">
                                    <span className="font-bold text-gray-800 dark:text-gray-200 truncate max-w-[120px]">#{idx + 1} {p.author?.name || "Anonymous"}</span>
                                    <span className="text-[10px] bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded font-black">❤️ {p.likes_count} likes</span>
                                  </div>
                                  <p className="text-[11px] text-gray-500 dark:text-gray-400 italic truncate font-medium">"{p.content}"</p>
                                </a>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 italic">No liked posts available.</p>
                          )}
                        </div>

                        {/* Highest Commented Posts */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
                          <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-3 text-sm">Highest Commented Posts</h4>
                          {dashboardData.rankings?.topCommentedPosts?.length > 0 ? (
                            <div className="space-y-3">
                              {dashboardData.rankings.topCommentedPosts.map((p: any, idx: number) => (
                                <a
                                  key={p.id}
                                  href={`/social/post/${p.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block text-xs p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:border-indigo-200 cursor-pointer transition-all duration-200 space-y-2"
                                  title="View Social Post"
                                >
                                  <div className="flex justify-between items-center">
                                    <span className="font-bold text-gray-800 dark:text-gray-200 truncate max-w-[120px]">#{idx + 1} {p.author?.name || "Anonymous"}</span>
                                    <span className="text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400 px-1.5 py-0.5 rounded font-black">💬 {p.comments_count} comments</span>
                                  </div>
                                  <p className="text-[11px] text-gray-500 dark:text-gray-400 italic truncate font-medium">"{p.content}"</p>
                                </a>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 italic">No commented posts available.</p>
                          )}
                        </div>

                        {/* Highest Viewed Posts */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
                          <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-3 text-sm">Highest Viewed Posts</h4>
                          {dashboardData.rankings?.topViewedPosts?.length > 0 ? (
                            <div className="space-y-3">
                              {dashboardData.rankings.topViewedPosts.map((p: any, idx: number) => (
                                <a
                                  key={p.id}
                                  href={`/social/post/${p.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block text-xs p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:border-indigo-200 cursor-pointer transition-all duration-200 space-y-2"
                                  title="View Social Post"
                                >
                                  <div className="flex justify-between items-center">
                                    <span className="font-bold text-gray-800 dark:text-gray-200 truncate max-w-[120px]">#{idx + 1} {p.author?.name || "Anonymous"}</span>
                                    <span className="text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded font-black">👁️ {p.views_count} views</span>
                                  </div>
                                  <p className="text-[11px] text-gray-500 dark:text-gray-400 italic truncate font-medium">"{p.content}"</p>
                                </a>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 italic">No viewed posts available.</p>
                          )}
                        </div>
                     </div>
                  </div>
             </div>
          )}

          {/* DELETED USERS TAB */}
          {activeTab === "deleted-users" && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <h3 className="font-bold text-gray-800 dark:text-gray-100">
                  Archived / Deleted Users ({deletedUsersData.length})
                </h3>
              </div>

              {fetching && deletedUsersData.length === 0 ? (
                <div className="p-12 flex justify-center">
                  <Loader />
                </div>
              ) : deletedUsersData.length === 0 ? (
                <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                  No archived user profiles found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                        <th className="px-6 py-4 font-semibold">User</th>
                        <th className="px-6 py-4 font-semibold">Original Role</th>
                        <th className="px-6 py-4 font-semibold">Deleted At</th>
                        <th className="px-6 py-4 font-semibold">Deleted By</th>
                        <th className="px-6 py-4 font-semibold">Archived Assets</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {deletedUsersData.map((u: any) => (
                        <tr
                          key={u._id}
                          onClick={() => fetchDeletedUserActivity(u)}
                          className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-semibold text-gray-800 dark:text-gray-200">
                                {u.name || "N/A"}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {u.email}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="default">{u.role}</Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(u.deletedAt)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 font-mono text-xs">
                            {u.deletedBy === "admin" ? "Master Admin" : u.deletedBy?.substring(0, 8) || "Admin"}
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-600 dark:text-gray-400 font-medium">
                            <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded mr-2" title="Products Archived">
                              📦 {u.archivedData?.productsCount || 0}
                            </span>
                            <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded mr-2" title="Social Posts Archived">
                              📝 {u.archivedData?.socialPostsCount || 0}
                            </span>
                            <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded mr-2" title="Reviews Archived">
                              💬 {u.archivedData?.reviewsCount || 0}
                            </span>
                            <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded" title="Comments Archived">
                              💬 {u.archivedData?.commentsCount || 0}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in duration-200 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
              <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">User Profile</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-grow flex flex-col items-center relative w-full">
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
                  className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-850 shadow-md bg-gray-50 dark:bg-gray-800 mb-4"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-bold text-3xl shadow-sm mb-4">
                  {selectedUser.name?.charAt(0) || "U"}
                </div>
              )}

              <h4 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {selectedUser.name}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{selectedUser.email}</p>
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
                <div className="flex justify-between border-b border-gray-50 dark:border-gray-800/50 pb-2">
                  <span className="text-gray-500 font-medium">System ID</span>
                  <span className="text-gray-800 dark:text-gray-200 font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                    {selectedUser._id}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-50 dark:border-gray-800/50 pb-2">
                  <span className="text-gray-500 font-medium">Phone</span>
                  <span className="text-gray-800 dark:text-gray-200">
                    {selectedUser.phone || "Not provided"}
                  </span>
                </div>
                {selectedUser.address ? (
                  <div className="flex justify-between border-b border-gray-50 dark:border-gray-800/50 pb-2">
                    <span className="text-gray-500 font-medium">Address</span>
                    <span
                      className="text-gray-800 dark:text-gray-200 text-right max-w-[200px] truncate"
                      title={selectedUser.address}
                    >
                      {selectedUser.address}
                    </span>
                  </div>
                ) : null}
                {selectedUser.dateOfBirth ? (
                  <div className="flex justify-between border-b border-gray-50 dark:border-gray-800/50 pb-2">
                    <span className="text-gray-500 font-medium">DOB</span>
                    <span className="text-gray-800 dark:text-gray-200">
                      {formatDate(selectedUser.dateOfBirth)}
                    </span>
                  </div>
                ) : null}
                <div className="flex justify-between pt-1">
                  <span className="text-gray-500 font-medium">
                    Joined Platform
                  </span>
                  <span className="text-gray-800 dark:text-gray-200 font-medium">
                    {formatDate(selectedUser.createdAt)}
                  </span>
                </div>
              </div>

              {/* Activity Summary Profile */}
              <div className="w-full mt-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 space-y-4">
                <h4 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                  Customer Support Summary
                </h4>
                {loadingSummary ? (
                  <div className="flex justify-center py-4"><Loader /></div>
                ) : userSummary ? (
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-white dark:bg-gray-900 p-2.5 rounded-lg shadow-sm border border-gray-100/50 dark:border-gray-800/50">
                      <span className="text-gray-400 font-bold block uppercase text-[9px] mb-0.5">Peak Activity Hours</span>
                      <span className="font-extrabold text-gray-800 dark:text-gray-200">{userSummary.peakHour}</span>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-2.5 rounded-lg shadow-sm border border-gray-100/50 dark:border-gray-800/50">
                      <span className="text-gray-400 font-bold block uppercase text-[9px] mb-0.5">Total Time Online</span>
                      <span className="font-extrabold text-gray-800 dark:text-gray-200">{userSummary.totalMinutesSpent} minutes</span>
                    </div>

                    {/* Role specific metrics */}
                    {selectedUser.role === "buyer" && (
                      <>
                        <div className="bg-white dark:bg-gray-900 p-2.5 rounded-lg shadow-sm border border-gray-100/50 dark:border-gray-800/50">
                          <span className="text-gray-400 font-bold block uppercase text-[9px] mb-0.5">Orders Placed</span>
                          <span className="font-extrabold text-gray-800 dark:text-gray-200">🛍️ {userSummary.ordersCount} orders</span>
                        </div>
                        <div className="bg-white dark:bg-gray-900 p-2.5 rounded-lg shadow-sm border border-gray-100/50 dark:border-gray-800/50">
                          <span className="text-gray-400 font-bold block uppercase text-[9px] mb-0.5">Total Purchase</span>
                          <span className="font-extrabold text-gray-800 dark:text-gray-200">₹{userSummary.moneyTotal.toLocaleString("en-IN")}</span>
                        </div>
                      </>
                    )}

                    {selectedUser.role === "seller" && (
                      <>
                        <div className="bg-white dark:bg-gray-900 p-2.5 rounded-lg shadow-sm border border-gray-100/50 dark:border-gray-800/50">
                          <span className="text-gray-400 font-bold block uppercase text-[9px] mb-0.5">Products Uploaded</span>
                          <span className="font-extrabold text-gray-800 dark:text-gray-200">📦 {userSummary.productsCount} items</span>
                        </div>
                        <div className="bg-white dark:bg-gray-900 p-2.5 rounded-lg shadow-sm border border-gray-100/50 dark:border-gray-800/50">
                          <span className="text-gray-400 font-bold block uppercase text-[9px] mb-0.5">Sales Received</span>
                          <span className="font-extrabold text-gray-800 dark:text-gray-200">₹{userSummary.moneyTotal.toLocaleString("en-IN")}</span>
                        </div>
                      </>
                    )}

                    {selectedUser.role === "delivery" && (
                      <div className="bg-white dark:bg-gray-900 p-2.5 rounded-lg shadow-sm border border-gray-100/50 dark:border-gray-800/50 col-span-2">
                        <span className="text-gray-400 font-bold block uppercase text-[9px] mb-0.5">Deliveries</span>
                        <span className="font-extrabold text-gray-800 dark:text-gray-200">🚚 {userSummary.deliveriesCount} completed</span>
                      </div>
                    )}

                    {/* Social details */}
                    <div className="bg-white dark:bg-gray-900 p-2.5 rounded-lg shadow-sm border border-gray-100/50 dark:border-gray-800/50 col-span-2 space-y-1">
                      <span className="text-gray-400 font-bold block uppercase text-[9px]">Social Platform Metrics</span>
                      <div className="flex gap-4 text-[11px] font-semibold text-gray-600 dark:text-gray-400">
                        <span>📝 {userSummary.socialPostsCount} posts</span>
                        <span>❤️ {userSummary.socialLikesCount} likes</span>
                        <span>💬 {userSummary.socialCommentsCount} comments</span>
                      </div>
                    </div>

                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">Failed to calculate activity report.</p>
                )}
              </div>
            </div>

            <div className="bg-gray-50/80 dark:bg-gray-900/80 p-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center flex-shrink-0">
              {selectedUser.role !== "admin" ? (
                <button
                  onClick={() => handleDeleteUser(selectedUser._id)}
                  disabled={deletingUserId === selectedUser._id}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-xl px-4 py-2 font-bold text-xs shadow-md shadow-red-500/10 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  {deletingUserId === selectedUser._id ? "Deleting..." : "🗑️ Delete User & Data"}
                </button>
              ) : <div />}
              <Button onClick={() => setSelectedUser(null)} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Deleted User Profile and Activities Modal */}
      {selectedDeletedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in duration-200 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
              <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">Deleted User Activity & Archive</h3>
              <button
                onClick={() => setSelectedDeletedUser(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-grow">
              {/* Profile Card */}
              <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Account Info</h4>
                  <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{selectedDeletedUser.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selectedDeletedUser.email}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">Original ID: {selectedDeletedUser.originalUserId}</p>
                </div>
                <div className="space-y-1 md:text-right">
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Deletion Event</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">Role: <Badge variant="default">{selectedDeletedUser.role}</Badge></p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Joined: {formatDate(selectedDeletedUser.createdAt)}</p>
                  <p className="text-xs text-red-500">Deleted: {formatDate(selectedDeletedUser.deletedAt)}</p>
                </div>
              </div>

              {/* Total Login Statistics */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-purple-50 dark:bg-purple-950/20 p-3 rounded-xl border border-purple-100/50 dark:border-purple-950/50">
                  <p className="text-2xl font-black text-purple-600 dark:text-purple-400">
                    {deletedUserActivities.filter(a => a.type === "login").length}
                  </p>
                  <p className="text-[10px] uppercase font-bold text-gray-400">Sign-Ins</p>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-950/20 p-3 rounded-xl border border-indigo-100/50 dark:border-indigo-950/50">
                  <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                    {deletedUserActivities.filter(a => a.type === "ping").length}
                  </p>
                  <p className="text-[10px] uppercase font-bold text-gray-400">Heartbeats</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-100/50 dark:bg-emerald-950/50">
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {Math.round(deletedUserActivities.reduce((acc, a) => acc + (a.duration || 0), 0) / 60)}m
                  </p>
                  <p className="text-[10px] uppercase font-bold text-gray-400">Time Spent</p>
                </div>
              </div>

              {/* Activity Summary Profile */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 space-y-4">
                <h4 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                  Archived Activity Summary
                </h4>
                {userSummary ? (
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-white dark:bg-gray-900 p-2.5 rounded-lg shadow-sm border border-gray-100/50 dark:border-gray-800/50">
                      <span className="text-gray-400 font-bold block uppercase text-[9px] mb-0.5">Peak Activity Hours</span>
                      <span className="font-extrabold text-gray-800 dark:text-gray-200">{userSummary.peakHour}</span>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-2.5 rounded-lg shadow-sm border border-gray-100/50 dark:border-gray-800/50">
                      <span className="text-gray-400 font-bold block uppercase text-[9px] mb-0.5">Total Time Online</span>
                      <span className="font-extrabold text-gray-800 dark:text-gray-200">{userSummary.totalMinutesSpent} minutes</span>
                    </div>

                    {/* Role specific metrics */}
                    {selectedDeletedUser.role === "buyer" && (
                      <div className="bg-white dark:bg-gray-900 p-2.5 rounded-lg shadow-sm border border-gray-100/50 dark:border-gray-800/50 col-span-2">
                        <span className="text-gray-400 font-bold block uppercase text-[9px] mb-0.5">Archived Orders</span>
                        <span className="font-extrabold text-gray-800 dark:text-gray-200">🛍&nbsp; {userSummary.ordersCount} orders recovered from logs</span>
                      </div>
                    )}

                    {selectedDeletedUser.role === "seller" && (
                      <div className="bg-white dark:bg-gray-900 p-2.5 rounded-lg shadow-sm border border-gray-100/50 dark:border-gray-800/50 col-span-2">
                        <span className="text-gray-400 font-bold block uppercase text-[9px] mb-0.5">Products Stored in Archive</span>
                        <span className="font-extrabold text-gray-800 dark:text-gray-200">📦 {userSummary.productsCount} items</span>
                      </div>
                    )}

                    {/* Social details */}
                    <div className="bg-white dark:bg-gray-900 p-2.5 rounded-lg shadow-sm border border-gray-100/50 dark:border-gray-800/50 col-span-2 space-y-1">
                      <span className="text-gray-400 font-bold block uppercase text-[9px]">Archived Social Assets</span>
                      <div className="flex gap-4 text-[11px] font-semibold text-gray-600 dark:text-gray-400">
                        <span>📝 {userSummary.socialPostsCount} posts</span>
                        <span>💬 {userSummary.socialCommentsCount} comments</span>
                        <span>💬 {userSummary.reviewsCount} reviews</span>
                      </div>
                    </div>

                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">Failed to calculate archived report.</p>
                )}
              </div>

              {/* Activity Logs */}
              <div>
                <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                  <Clock size={16} className="text-indigo-500" /> Activity History (What They Did)
                </h4>
                {loadingActivities ? (
                  <div className="flex justify-center py-8"><Loader /></div>
                ) : deletedUserActivities.length === 0 ? (
                  <p className="text-sm text-gray-400 italic text-center py-6">No historical activity logs found for this user.</p>
                ) : (
                  <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-2">
                    {deletedUserActivities.map((act) => (
                      <div
                        key={act._id}
                        className="p-3 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-800 flex items-start justify-between gap-4 text-xs"
                      >
                        <div className="space-y-1">
                          <p className="font-bold text-gray-800 dark:text-gray-200">
                            {act.type === "login" ? "🔐 Login Successful" : `🧭 Navigation Heartbeat`}
                          </p>
                          <p className="text-gray-500 dark:text-gray-400 font-medium">
                            {act.type === "login" ? "Location / Device Details" : `Page Visited: ${act.path || "/"}`}
                          </p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500">
                            IP: {act.ip || "127.0.0.1"} • {act.userAgent?.substring(0, 60)}...
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-gray-400 font-medium">{new Date(act.timestamp).toLocaleTimeString()}</p>
                          <p className="text-gray-500 font-medium">{new Date(act.timestamp).toLocaleDateString()}</p>
                          {act.duration > 0 && <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 px-1.5 py-0.5 rounded text-[9px] font-black">{act.duration}s spent</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center flex-shrink-0">
              <button
                onClick={() => handleRecoverUser(selectedDeletedUser._id)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-2 font-bold text-xs shadow-md shadow-emerald-500/10 active:scale-95 transition-all flex items-center gap-1.5"
              >
                🔄 Recover Account
              </button>
              <Button onClick={() => setSelectedDeletedUser(null)} variant="outline">
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
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 dark:border-gray-800 p-6 relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">{title}</p>
          <h2 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100">{value}</h2>
        </div>
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${color} shadow-lg shadow-${color.replace("bg-", "")}/30 transform group-hover:scale-110 transition-transform`}
        >
          <Icon size={24} />
        </div>
      </div>
      <div className="mt-4 flex items-center text-xs font-medium text-green-600 bg-green-50 dark:bg-green-950/20 w-fit px-2 py-1 rounded-md">
        <span>{trend}</span>
      </div>
      {/* Decorative accent */}
      <div
        className={`absolute -right-6 -bottom-6 w-24 h-24 ${color} opacity-[0.03] rounded-full group-hover:scale-150 transition-transform duration-500`}
      ></div>
    </div>
  );
}
