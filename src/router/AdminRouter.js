import AdminDashboard from "@/views/admin/AdminDashboard.vue";
import InquiryList from "@/views/admin/InquiryList.vue";
import NotificationList from "@/views/admin/NotificationList.vue";
import UserManagement from "@/views/admin/UserManagement.vue";

export const AdminRouter = [
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: AdminDashboard,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/inquiry',
    name: 'AdminInquiryList',
    component: InquiryList,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/notification',
    name: 'AdminNotificationList',
    component: NotificationList,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/users',
    name: 'AdminUserManagement',
    component: UserManagement,
    meta: { requiresAuth: true, requiresAdmin: true }
  }
];
