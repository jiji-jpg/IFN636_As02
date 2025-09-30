import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../axiosConfig";
import { Link } from "react-router-dom";

const Listing = () => {
  const { user } = useAuth();
  const [flats, setFlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterAlert, setFilterAlert] = useState("all"); // 'all', 'alerts', 'no-alerts'
  const [statistics, setStatistics] = useState({
    totalProperties: 0,
    occupiedProperties: 0,
    vacantProperties: 0,
    totalRentExpected: 0,
    overduePayments: 0,
    maintenanceIssues: 0,
    recentActivity: [],
  });

  useEffect(() => {
    if (user) {
      fetchFlats();
    }
  }, [user]);

  const fetchFlats = async () => {
    try {
      const response = await axiosInstance.get("/api/flats", {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setFlats(response.data);
      calculateStatistics(response.data);
    } catch (error) {
      console.error("Error fetching flats:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (flatsData) => {
    const stats = {
      totalProperties: flatsData.length,
      occupiedProperties: flatsData.filter((flat) => !flat.vacant).length,
      vacantProperties: flatsData.filter((flat) => flat.vacant).length,
      totalRentExpected: flatsData.reduce((sum, flat) => {
        return sum + (flat.tenantDetails?.rentAmount || 0);
      }, 0),
      overduePayments: flatsData.filter((flat) => {
        return flat.invoices?.some(
          (invoice) =>
            invoice.status === "pending" &&
            new Date(invoice.dueDate) < new Date()
        );
      }).length,
      maintenanceIssues: flatsData.filter((flat) => {
        return flat.maintenanceReports?.some(
          (report) =>
            report.status === "reported" || report.status === "in-progress"
        );
      }).length,
      recentActivity: generateRecentActivity(flatsData),
    };
    setStatistics(stats);
  };

  const generateRecentActivity = (flatsData) => {
    const activities = [];

    flatsData.forEach((flat) => {
      // Add maintenance activities
      if (flat.maintenanceReports) {
        flat.maintenanceReports.forEach((report) => {
          activities.push({
            type: "maintenance",
            message: `Maintenance issue reported for ${flat.title}`,
            date: new Date(report.reportedDate),
            status: report.status,
            propertyId: flat._id,
          });
        });
      }

      // Add payment activities
      if (flat.payments) {
        flat.payments.forEach((payment) => {
          activities.push({
            type: "payment",
            message: `Payment received for ${flat.title}`,
            date: new Date(payment.paymentDate),
            amount: payment.amount,
            propertyId: flat._id,
          });
        });
      }
    });

    return activities.sort((a, b) => b.date - a.date).slice(0, 5);
  };

  const getImageUrl = (imagePath) => {
    return `${
      process.env.REACT_APP_API_URL || "http://localhost:5001"
    }/uploads/flats/${imagePath}`;
  };

  const getPropertyStatus = (flat) => {
    const hasOverdueInvoices = flat.invoices?.some(
      (invoice) =>
        invoice.status === "pending" && new Date(invoice.dueDate) < new Date()
    );
    const hasActiveMaintenance = flat.maintenanceReports?.some(
      (report) =>
        report.status === "reported" || report.status === "in-progress"
    );

    return {
      hasOverdueInvoices,
      hasActiveMaintenance,
      hasAlerts: hasOverdueInvoices || hasActiveMaintenance,
    };
  };

  // Filter properties
  const filteredFlats = flats.filter((flat) => {
    const matchesSearch =
      flat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flat.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "occupied" && !flat.vacant) ||
      (filterStatus === "vacant" && flat.vacant);

    const { hasAlerts } = getPropertyStatus(flat);
    const matchesAlert =
      filterAlert === "all" ||
      (filterAlert === "alerts" && hasAlerts) ||
      (filterAlert === "no-alerts" && !hasAlerts);

    return matchesSearch && matchesStatus && matchesAlert;
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center max-w-md mx-4">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-purple-600 text-4xl">🔐</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Welcome to Property Manager
          </h2>
          <p className="text-gray-600 mb-8">
            Please log in to access your property dashboard and manage your
            portfolio.
          </p>
          <Link
            to="/login"
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.name || "Property Manager"}! 👋
              </h1>
              <p className="text-gray-600">
                Here's an overview of your property portfolio and recent
                activity
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                to="/flats"
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <span>Add Property</span>
              </Link>
              <Link
                to="/payments"
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <span>Payments</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard
            icon="🏠"
            title="Total Properties"
            value={statistics.totalProperties}
            color="bg-blue-500"
          />
          <StatCard
            icon="✅"
            title="Occupied"
            value={statistics.occupiedProperties}
            color="bg-green-500"
          />
          <StatCard
            icon="🏚️"
            title="Vacant"
            value={statistics.vacantProperties}
            color="bg-orange-500"
          />
          <StatCard
            icon="💰"
            title="Monthly Rent"
            value={`$${statistics.totalRentExpected.toLocaleString()}`}
            color="bg-purple-500"
          />
          <StatCard
            icon="⚠️"
            title="Overdue"
            value={statistics.overduePayments}
            color="bg-red-500"
            alert={statistics.overduePayments > 0}
          />
          <StatCard
            icon="🔧"
            title="Maintenance"
            value={statistics.maintenanceIssues}
            color="bg-yellow-500"
            alert={statistics.maintenanceIssues > 0}
          />
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Search properties by address or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              >
                <option value="all">All Status</option>
                <option value="occupied">Occupied Only</option>
                <option value="vacant">Vacant Only</option>
              </select>

              <select
                value={filterAlert}
                onChange={(e) => setFilterAlert(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              >
                <option value="all">All Alerts</option>
                <option value="alerts">With Alerts</option>
                <option value="no-alerts">No Alerts</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Properties Grid */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Your Properties
              </h2>
              <span className="text-gray-600">
                Showing {filteredFlats.length} of {flats.length} properties
              </span>
            </div>

            {filteredFlats.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-gray-400 text-4xl">🏠</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {searchTerm || filterStatus !== "all" || filterAlert !== "all"
                    ? "No matching properties found"
                    : "No Properties Yet"}
                </h3>
                <p className="text-gray-600 mb-8">
                  {searchTerm || filterStatus !== "all" || filterAlert !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "Start by adding your first property to build your portfolio"}
                </p>
                {!searchTerm &&
                  filterStatus === "all" &&
                  filterAlert === "all" && (
                    <Link
                      to="/flats"
                      className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
                    >
                      Add Your First Property
                    </Link>
                  )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredFlats.map((flat) => (
                  <DashboardPropertyCard
                    key={flat._id}
                    flat={flat}
                    getImageUrl={getImageUrl}
                    getPropertyStatus={getPropertyStatus}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="mr-2">📊</span>
                Recent Activity
              </h3>

              {statistics.recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {statistics.recentActivity.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-2 ${
                          activity.type === "maintenance"
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                      />
                      <div className="flex-1">
                        <p className="text-sm text-gray-800">
                          {activity.message}
                        </p>
                        <p className="text-xs text-gray-500">
                          {activity.date.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <span className="text-4xl mb-2 block">📝</span>
                  <p className="text-gray-600 text-sm">No recent activity</p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="mr-2">⚡</span>
                Quick Actions
              </h3>

              <div className="space-y-3">
                <Link
                  to="/flats"
                  className="flex items-center p-3 text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition-all duration-200 group"
                >
                  <span className="mr-3 text-lg group-hover:scale-110 transition-transform">
                    🏠
                  </span>
                  <span className="font-medium">Manage Properties</span>
                </Link>

                <Link
                  to="/tenants"
                  className="flex items-center p-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-all duration-200 group"
                >
                  <span className="mr-3 text-lg group-hover:scale-110 transition-transform">
                    👥
                  </span>
                  <span className="font-medium">View Tenants</span>
                </Link>

                <Link
                  to="/payments"
                  className="flex items-center p-3 text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg transition-all duration-200 group"
                >
                  <span className="mr-3 text-lg group-hover:scale-110 transition-transform">
                    💰
                  </span>
                  <span className="font-medium">Record Payment</span>
                </Link>

                <Link
                  to="/maintenance"
                  className="flex items-center p-3 text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 rounded-lg transition-all duration-200 group"
                >
                  <span className="mr-3 text-lg group-hover:scale-110 transition-transform">
                    🔧
                  </span>
                  <span className="font-medium">Report Issue</span>
                </Link>
              </div>
            </div>

            {/* Alerts */}
            {(statistics.overduePayments > 0 ||
              statistics.maintenanceIssues > 0) && (
              <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-6">
                <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center">
                  <span className="mr-2">🚨</span>
                  Alerts
                </h3>

                <div className="space-y-3">
                  {statistics.overduePayments > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800 font-medium">
                        {statistics.overduePayments} property(ies) with overdue
                        payments
                      </p>
                      <Link
                        to="/payments"
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        View Payments →
                      </Link>
                    </div>
                  )}

                  {statistics.maintenanceIssues > 0 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800 font-medium">
                        {statistics.maintenanceIssues} property(ies) need
                        maintenance
                      </p>
                      <Link
                        to="/maintenance"
                        className="text-xs text-yellow-600 hover:text-yellow-800"
                      >
                        View Issues →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Statistics Card Component
const StatCard = ({ icon, title, value, color, alert = false }) => {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 ${
        alert ? "ring-2 ring-red-200 bg-red-50" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-xs font-medium mb-1">{title}</p>
          <p
            className={`text-lg font-bold ${
              alert ? "text-red-600" : "text-gray-900"
            }`}
          >
            {value}
          </p>
        </div>
        <div
          className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center ${
            alert ? "animate-pulse" : ""
          }`}
        >
          <span className="text-white text-lg">{icon}</span>
        </div>
      </div>
    </div>
  );
};

// Dashboard Property Card Component
const DashboardPropertyCard = ({ flat, getImageUrl, getPropertyStatus }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { hasOverdueInvoices, hasActiveMaintenance, hasAlerts } =
    getPropertyStatus(flat);

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === flat.images.length - 1 ? 0 : prev + 1
    );
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? flat.images.length - 1 : prev - 1
    );
  };

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-lg transition-all duration-300 group ${
        hasAlerts ? "border-red-200 ring-1 ring-red-200" : "border-gray-200"
      }`}
    >
      {/* Image Section */}
      <div className="relative h-48 bg-gray-200">
        {flat.images && flat.images.length > 0 ? (
          <>
            <img
              src={getImageUrl(flat.images[currentImageIndex])}
              alt={`${flat.title} - View ${currentImageIndex + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src =
                  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDIwMCAxOTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTkyIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NiA3NkgxMjRWMTAwSDc2Vjc2WiIgZmlsbD0iI0Q1RDdEQSIvPgo8cGF0aCBkPSJNODggODhIMTEyVjEwMEg4OFY4OFoiIGZpbGw9IiNBN0E5QUMiLz4KPHRleHQgeD0iMTAwIiB5PSIxMzAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2Qjc0ODEiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiI+Tm8gSW1hZ2U8L3RleHQ+Cjwvc3ZnPg==";
              }}
            />

            {/* Image Navigation */}
            {flat.images.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-75"
                >
                  ❮
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-75"
                >
                  ❯
                </button>

                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                  {flat.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-200 ${
                        index === currentImageIndex
                          ? "bg-white"
                          : "bg-white bg-opacity-50 hover:bg-opacity-75"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}

            {flat.images.length > 1 && (
              <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs font-medium">
                {currentImageIndex + 1} / {flat.images.length}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
            <span className="text-4xl mb-2">🏠</span>
            <span className="text-sm">No images</span>
          </div>
        )}

        {/* Status Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <span
            className={`px-3 py-1 text-xs font-semibold rounded-full ${
              flat.vacant
                ? "bg-red-100 text-red-800 border border-red-200"
                : "bg-green-100 text-green-800 border border-green-200"
            }`}
          >
            {flat.vacant ? "Vacant" : "Occupied"}
          </span>

          {hasOverdueInvoices && (
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 border border-red-200 animate-pulse">
              Overdue
            </span>
          )}

          {hasActiveMaintenance && (
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
              Maintenance
            </span>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
          {flat.title}
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {flat.description || "No description available"}
        </p>

        {/* Property Details */}
        <div className="space-y-2 mb-4">
          {!flat.vacant && flat.tenantDetails && (
            <>
              <div className="flex items-center text-sm text-gray-600">
                <span className="mr-2">👤</span>
                <span>{flat.tenantDetails.name}</span>
              </div>
              <div className="flex items-center text-sm font-medium text-green-600">
                <span className="mr-2">💰</span>
                <span>${flat.tenantDetails.rentAmount}/month</span>
              </div>
            </>
          )}

          <div className="flex items-center text-sm text-gray-600">
            <span className="mr-2">📅</span>
            <span>
              Next inspection:{" "}
              {flat.inspectionDate
                ? new Date(flat.inspectionDate).toLocaleDateString()
                : "Not scheduled"}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Link
            to={`/flats`}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 text-sm"
          >
            <span>Manage</span>
          </Link>
          <Link
            to={`/payments`}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 text-sm"
          >
            <span>Payments</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Listing;
