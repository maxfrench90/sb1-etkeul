export interface DashboardStats {
  totalBookings: number;
  upcomingBookings: number;
  completedBookings: number;
  totalSpent?: number;  // For users
  totalEarned?: number; // For providers
}