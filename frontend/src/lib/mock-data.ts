/**
 * Seeded mock data for FairGig.
 * In a real build, the worker data, city medians, and grievances would come
 * from the Earnings / Analytics / Grievance services over REST.
 */

export type Role = "worker" | "verifier" | "advocate";

export type Platform =
  | "Careem"
  | "Bykea"
  | "Foodpanda"
  | "Indrive"
  | "Uber"
  | "Cheetay";

export const PLATFORMS: Platform[] = [
  "Careem",
  "Bykea",
  "Foodpanda",
  "Indrive",
  "Uber",
  "Cheetay",
];

export const CITY_ZONES = [
  "Lahore — Gulberg",
  "Lahore — DHA",
  "Lahore — Johar Town",
  "Karachi — Clifton",
  "Karachi — Gulshan",
  "Islamabad — F-7",
  "Rawalpindi — Saddar",
];

export type ShiftLog = {
  id: string;
  date: string; // ISO
  platform: Platform;
  hours: number;
  gross: number;
  deductions: number;
  net: number;
  zone: string;
  verification: "verified" | "pending" | "flagged" | "unverifiable";
};

const today = new Date();
function daysAgo(n: number) {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export const mockShifts: ShiftLog[] = [
  { id: "s1",  date: daysAgo(0),  platform: "Careem",    hours: 7.5, gross: 3200, deductions: 720, net: 2480, zone: "Lahore — Gulberg",   verification: "pending"  },
  { id: "s2",  date: daysAgo(1),  platform: "Bykea",     hours: 6,   gross: 2100, deductions: 360, net: 1740, zone: "Lahore — Johar Town",verification: "verified" },
  { id: "s3",  date: daysAgo(2),  platform: "Foodpanda", hours: 8,   gross: 3600, deductions: 980, net: 2620, zone: "Lahore — Gulberg",   verification: "verified" },
  { id: "s4",  date: daysAgo(3),  platform: "Careem",    hours: 9,   gross: 4100, deductions: 1180,net: 2920, zone: "Lahore — DHA",       verification: "flagged"  },
  { id: "s5",  date: daysAgo(4),  platform: "Indrive",   hours: 5,   gross: 1800, deductions: 280, net: 1520, zone: "Lahore — Gulberg",   verification: "verified" },
  { id: "s6",  date: daysAgo(5),  platform: "Bykea",     hours: 7,   gross: 2400, deductions: 410, net: 1990, zone: "Lahore — Johar Town",verification: "verified" },
  { id: "s7",  date: daysAgo(6),  platform: "Foodpanda", hours: 8.5, gross: 3700, deductions: 1020,net: 2680, zone: "Lahore — Gulberg",   verification: "verified" },
  { id: "s8",  date: daysAgo(8),  platform: "Careem",    hours: 8,   gross: 3500, deductions: 800, net: 2700, zone: "Lahore — DHA",       verification: "verified" },
  { id: "s9",  date: daysAgo(10), platform: "Uber",      hours: 6,   gross: 2700, deductions: 690, net: 2010, zone: "Karachi — Clifton",  verification: "verified" },
  { id: "s10", date: daysAgo(12), platform: "Bykea",     hours: 7.5, gross: 2600, deductions: 440, net: 2160, zone: "Lahore — Johar Town",verification: "verified" },
  { id: "s11", date: daysAgo(15), platform: "Foodpanda", hours: 9,   gross: 4000, deductions: 1100,net: 2900, zone: "Lahore — Gulberg",   verification: "verified" },
  { id: "s12", date: daysAgo(20), platform: "Careem",    hours: 7,   gross: 3100, deductions: 720, net: 2380, zone: "Lahore — DHA",       verification: "verified" },
];

export type WeeklyPoint = {
  week: string;
  net: number;
  gross: number;
  hours: number;
  hourlyRate: number;
  cityMedian: number;
};

export const weeklySeries: WeeklyPoint[] = [
  { week: "W-9", net: 14200, gross: 19800, hours: 41, hourlyRate: 346, cityMedian: 320 },
  { week: "W-8", net: 15100, gross: 21100, hours: 44, hourlyRate: 343, cityMedian: 322 },
  { week: "W-7", net: 13800, gross: 19400, hours: 42, hourlyRate: 329, cityMedian: 325 },
  { week: "W-6", net: 16200, gross: 22600, hours: 46, hourlyRate: 352, cityMedian: 330 },
  { week: "W-5", net: 15800, gross: 22000, hours: 45, hourlyRate: 351, cityMedian: 328 },
  { week: "W-4", net: 14900, gross: 20800, hours: 43, hourlyRate: 347, cityMedian: 331 },
  { week: "W-3", net: 13500, gross: 19000, hours: 41, hourlyRate: 329, cityMedian: 333 },
  { week: "W-2", net: 12100, gross: 17400, hours: 39, hourlyRate: 310, cityMedian: 335 },
  { week: "W-1", net: 11800, gross: 17000, hours: 38, hourlyRate: 311, cityMedian: 336 },
  { week: "This",net: 13600, gross: 19500, hours: 41, hourlyRate: 332, cityMedian: 338 },
];

export type CommissionPoint = {
  month: string;
  Careem: number;
  Bykea: number;
  Foodpanda: number;
  Indrive: number;
};

export const commissionTrend: CommissionPoint[] = [
  { month: "May",  Careem: 18, Bykea: 14, Foodpanda: 22, Indrive: 12 },
  { month: "Jun",  Careem: 19, Bykea: 14, Foodpanda: 23, Indrive: 13 },
  { month: "Jul",  Careem: 20, Bykea: 15, Foodpanda: 24, Indrive: 14 },
  { month: "Aug",  Careem: 21, Bykea: 16, Foodpanda: 26, Indrive: 14 },
  { month: "Sep",  Careem: 22, Bykea: 17, Foodpanda: 27, Indrive: 15 },
  { month: "Oct",  Careem: 23, Bykea: 17, Foodpanda: 28, Indrive: 16 },
];

export type ZoneIncome = { zone: string; median: number };
export const zoneMedians: ZoneIncome[] = [
  { zone: "Lahore — Gulberg",    median: 14800 },
  { zone: "Lahore — DHA",        median: 16200 },
  { zone: "Lahore — Johar Town", median: 12400 },
  { zone: "Karachi — Clifton",   median: 17500 },
  { zone: "Karachi — Gulshan",   median: 13100 },
  { zone: "Islamabad — F-7",     median: 18900 },
  { zone: "Rawalpindi — Saddar", median: 11800 },
];

export type Grievance = {
  id: string;
  worker: string;
  platform: Platform;
  category: "Commission Hike" | "Deactivation" | "Late Payout" | "Safety" | "Other";
  title: string;
  description: string;
  date: string;
  status: "open" | "escalated" | "resolved";
  upvotes: number;
};

export const mockGrievances: Grievance[] = [
  { id: "g1", worker: "anon-7421", platform: "Foodpanda", category: "Commission Hike",
    title: "Commission jumped 4% overnight, no notice",
    description: "Last week deductions went from 22% to 26%. No email, no in-app banner. Effective hourly rate dropped by Rs. 40.",
    date: daysAgo(1), status: "open", upvotes: 42 },
  { id: "g2", worker: "anon-3110", platform: "Careem",
    category: "Deactivation",
    title: "Deactivated for 3 days after a single passenger complaint",
    description: "Account suspended without review. No human contact. Lost ~Rs. 9000 in earnings.",
    date: daysAgo(2), status: "escalated", upvotes: 117 },
  { id: "g3", worker: "anon-9988", platform: "Bykea",
    category: "Late Payout",
    title: "Weekly payout delayed by 6 days",
    description: "Bank transfer never arrived. Support tickets auto-closed.",
    date: daysAgo(3), status: "open", upvotes: 28 },
  { id: "g4", worker: "anon-2210", platform: "Foodpanda",
    category: "Safety",
    title: "No insurance for nighttime delivery in DHA",
    description: "Bike accident at 11pm — platform refused medical assistance.",
    date: daysAgo(5), status: "escalated", upvotes: 91 },
  { id: "g5", worker: "anon-6677", platform: "Indrive",
    category: "Other",
    title: "Rate intel: Indrive Lahore base fare cut by Rs. 30",
    description: "Sharing for awareness — base fare quietly reduced this Monday.",
    date: daysAgo(6), status: "resolved", upvotes: 14 },
];

export type VerificationItem = {
  id: string;
  worker: string;
  platform: Platform;
  reportedNet: number;
  date: string;
  uploadedAt: string;
  thumb: string; // placeholder gradient identifier
};

export const verificationQueue: VerificationItem[] = [
  { id: "v1", worker: "Asif R.",    platform: "Careem",    reportedNet: 2480, date: daysAgo(0), uploadedAt: "2h ago",  thumb: "a" },
  { id: "v2", worker: "Sana M.",    platform: "Foodpanda", reportedNet: 2620, date: daysAgo(0), uploadedAt: "3h ago",  thumb: "b" },
  { id: "v3", worker: "Imran S.",   platform: "Bykea",     reportedNet: 1740, date: daysAgo(1), uploadedAt: "5h ago",  thumb: "c" },
  { id: "v4", worker: "Nadia K.",   platform: "Indrive",   reportedNet: 1520, date: daysAgo(1), uploadedAt: "7h ago",  thumb: "d" },
  { id: "v5", worker: "Bilal Q.",   platform: "Uber",      reportedNet: 2010, date: daysAgo(2), uploadedAt: "1d ago",  thumb: "e" },
  { id: "v6", worker: "Hira F.",    platform: "Foodpanda", reportedNet: 2900, date: daysAgo(3), uploadedAt: "2d ago",  thumb: "f" },
];

export const advocateKpis = {
  totalWorkers: 4231,
  flaggedThisWeek: 38,
  vulnerableWorkers: 86,
  openGrievances: 142,
};

export const vulnerabilityList = [
  { worker: "anon-7421", drop: 23, zone: "Lahore — Gulberg", platform: "Foodpanda" },
  { worker: "anon-3110", drop: 31, zone: "Lahore — DHA",     platform: "Careem"    },
  { worker: "anon-2210", drop: 28, zone: "Lahore — Gulberg", platform: "Foodpanda" },
  { worker: "anon-9988", drop: 21, zone: "Karachi — Clifton",platform: "Bykea"     },
  { worker: "anon-1099", drop: 35, zone: "Lahore — Johar Town",platform: "Indrive" },
];

export const complaintsByCategory = [
  { category: "Commission",    count: 47 },
  { category: "Deactivation",  count: 31 },
  { category: "Late Payout",   count: 22 },
  { category: "Safety",        count: 18 },
  { category: "Other",         count: 24 },
];

export const currentUser = {
  name: "Asif Rehman",
  handle: "@asif",
  avatar: "AR",
  role: "worker" as Role,
  city: "Lahore",
  joined: "Jan 2025",
};
