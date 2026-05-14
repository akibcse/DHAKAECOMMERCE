import { Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { SettingsProvider } from "./context/SettingsContext"; // [NEW]
import GlobalSEO from "./components/common/GlobalSEO"; // [NEW]
import { Toaster } from "react-hot-toast";
import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// User Pages
import Home from "./pages/user/Home";
import Shop from "./pages/user/Shop";
import ProductDetails from "./pages/user/ProductDetails";
import Cart from "./pages/user/Cart";
import Checkout from "./pages/user/Checkout";
import Profile from "./pages/user/Profile";
import MyOrders from "./pages/user/MyOrders";
import OrderDetailsPage from "./pages/user/OrderDetailsPage";
import OrderMessages from "./pages/user/OrderMessages";

// Admin Pages
import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import Orders from "./pages/admin/Orders";
import Users from "./pages/admin/Users";
import AdminOffers from "./pages/admin/AdminOffers";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdvancedAnalytics from "./pages/admin/AdvancedAnalytics";
import SalesReport from "./pages/admin/SalesReport";
import Settings from "./pages/admin/Settings"; // [NEW]
import Categories from "./pages/admin/Categories"; // [NEW]

// Accounting Pages
import AccountingDashboard from "./pages/admin/accounting/AccountingDashboard";
import Customers from "./pages/admin/accounting/Customers";
import OfflineSales from "./pages/admin/accounting/OfflineSales";
import MoneyReceipt from "./pages/admin/accounting/MoneyReceipt";
import MoneyReceiptList from "./pages/admin/accounting/MoneyReceiptList";
import SalesHistory from "./pages/admin/accounting/SalesHistory";
import AccountingReports from "./pages/admin/accounting/AccountingReports";
import CustomerLedgerView from "./pages/admin/accounting/CustomerLedgerView";

import AddToCartModal from "./components/AddToCartModal";

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <SettingsProvider>
          <CartProvider>
            <GlobalSEO />
            <Toaster position="top-right" reverseOrder={false} />
            <AddToCartModal />
            <Routes>
              {/* Public Routes with Main Layout */}
              <Route path="/" element={<MainLayout><Home /></MainLayout>} />
              <Route path="/shop" element={<MainLayout><Shop /></MainLayout>} />
              <Route path="/product/:id" element={<MainLayout><ProductDetails /></MainLayout>} />
              <Route path="/cart" element={<MainLayout><Cart /></MainLayout>} />
              <Route path="/login" element={<MainLayout><Login /></MainLayout>} />
              <Route path="/register" element={<MainLayout><Register /></MainLayout>} />

              {/* Protected User Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/checkout" element={<MainLayout><Checkout /></MainLayout>} />
                <Route path="/profile" element={<MainLayout><Profile /></MainLayout>} />
                <Route path="/profile/info" element={<MainLayout><Profile /></MainLayout>} />
                <Route path="/orders" element={<MainLayout><MyOrders /></MainLayout>} />
                <Route path="/orders/:orderId" element={<MainLayout><OrderDetailsPage /></MainLayout>} />
                <Route path="/order-messages/:orderId" element={<MainLayout><OrderMessages /></MainLayout>} />
              </Route>

              {/* Protected Admin Routes */}
              <Route element={<ProtectedRoute requireAdmin={true} />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="products" element={<Products />} />
                  <Route path="orders" element={<Orders />} />
                  <Route path="users" element={<Users />} />
                  <Route path="offers" element={<AdminOffers />} />
                  <Route path="coupons" element={<AdminCoupons />} />
                  <Route path="analytics" element={<AdvancedAnalytics />} />
                  <Route path="sales-report" element={<SalesReport />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="categories" element={<Categories />} />

                  {/* Accounting Module Routes */}
                  <Route path="accounting" element={<AccountingDashboard />} />
                  <Route path="accounting/customers" element={<Customers />} />
                  <Route path="accounting/ledger/:customerId" element={<CustomerLedgerView />} />
                  <Route path="accounting/offline-sales" element={<OfflineSales />} />
                  <Route path="accounting/money-receipt" element={<MoneyReceipt />} />
                  <Route path="accounting/receipts-history" element={<MoneyReceiptList />} />
                  <Route path="accounting/sales-history" element={<SalesHistory />} />
                  <Route path="accounting/reports" element={<AccountingReports />} />
                </Route>
              </Route>
            </Routes>
          </CartProvider>
        </SettingsProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
