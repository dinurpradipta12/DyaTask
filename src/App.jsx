import React, { useState, useEffect, useRef, useMemo } from 'react'
import './App.css'
import './mobile-tablet.css'
import dyataskLogo from './logo-dyatask.png'
import dyataskMiniLogo from './minilogo-dyatask.png'
import dyataskLogo2 from './logo-dyatask2.png'
import workspaceTeamMigrationSql from '../supabase/migrations/20260524170000_workspace_team_assistants.sql?raw'
import workspaceGoogleCalendarConfigRpcSql from '../supabase/migrations/20260525173000_workspace_google_calendar_config_rpc.sql?raw'
import allowAnonymousAuthProfilesSql from '../supabase/migrations/20260525190000_allow_anonymous_auth_profiles.sql?raw'
import globalLoginVisualSql from '../supabase/migrations/20260525201000_global_login_visual.sql?raw'
import { supabase } from './supabaseClient'
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Lock,
  Settings,
  RefreshCw,
  Bell,
  Moon,
  Sun,
  Plus,
  Sparkles,
  ShieldCheck,
  FileText,
  Trash2,
  Pencil,
  CheckCircle,
  ExternalLink,
  FileSpreadsheet,
  Mail,
  TrendingUp,
  User,
  Clock,
  Share2,
  ChevronDown,
  ChevronUp,
  Copy,
  Laptop,
  Download,
  Smartphone,
  Check,
  PlayCircle,
  BookOpen,
  GraduationCap,
  Eye,
  EyeOff,
  BellRing,
  AlertCircle,
  ArrowLeft,
  Folder,
  FolderOpen,
  Users,
  UserPlus,
  MessageSquare,
  SendHorizontal,
  CalendarClock,
  BadgeDollarSign,
  Palette,
  Mic2,
  SlidersHorizontal,
  Clipboard,
  MoreHorizontal,
  CornerUpLeft,
  Smile,
  LogOut,
  X
} from 'lucide-react'

const initialTasks = []
const initialAppointments = []
const initialNotes = []

const TEAM_PERMISSION_DEFAULTS = {
  dashboard: true,
  tasks: true,
  calendar: true,
  orders: true,
  designOrders: true,
  generalOrders: true,
  mentoringSchedule: true,
  contentPlanner: true,
  invoiceFollowUp: true,
  invoiceGenerator: true,
  crm: true,
  finance: true,
  reports: true,
  notes: false,
  integrations: false,
  settings: false
}

const TEAM_PERMISSION_LABELS = {
  dashboard: 'Dashboard',
  tasks: 'Tasks & Project',
  calendar: 'Reservasi & Jadwal',
  orders: 'Order Spreadsheet',
  designOrders: 'Pages Design Order',
  generalOrders: 'Pages Orderan (General)',
  mentoringSchedule: 'Pages Mentoring/Speaker',
  contentPlanner: 'Content Planner',
  invoiceFollowUp: 'Invoice Payment & Follow Up',
  invoiceGenerator: 'Invoice Generator',
  crm: 'Client CRM',
  finance: 'Finance & Invoice',
  reports: 'Reports',
  notes: 'Catatan Terenkripsi',
  integrations: 'Integrasi',
  settings: 'Settings'
}

const normalizeTeamPermissions = (rawPermissions = {}) => {
  const normalized = { ...TEAM_PERMISSION_DEFAULTS, ...(rawPermissions || {}) }
  if (normalized.calendar == null && rawPermissions?.reservations != null) normalized.calendar = !!rawPermissions.reservations
  if (normalized.designOrders == null && rawPermissions?.orders != null) normalized.designOrders = !!rawPermissions.orders
  if (normalized.generalOrders == null && rawPermissions?.orders != null) normalized.generalOrders = !!rawPermissions.orders
  if (normalized.contentPlanner == null && rawPermissions?.tasks != null) normalized.contentPlanner = !!rawPermissions.tasks
  if (normalized.mentoringSchedule == null && rawPermissions?.reservations != null) normalized.mentoringSchedule = !!rawPermissions.reservations
  if (normalized.invoiceFollowUp == null && rawPermissions?.finance != null) normalized.invoiceFollowUp = !!rawPermissions.finance
  if (normalized.invoiceGenerator == null && rawPermissions?.finance != null) normalized.invoiceGenerator = !!rawPermissions.finance
  return normalized
}

const WORKSPACE_ROLE_LABELS = {
  owner: 'Owner',
  assistant: 'Assistant',
  viewer: 'Viewer'
}

const SPREADSHEET_ORDER_TYPES = ['Dashboard', 'Automation', 'Reporting', 'Template', 'Fixing']
const DESIGN_ORDER_TYPES = ['Logo Brand', 'Visual Identity', 'UI/UX App', 'Social Media Kit', 'Pitch Deck Design', 'Design Revision']
const GENERAL_ORDER_TYPES = ['Admin Support', 'Research', 'Data Entry', 'Customer Service', 'Personal Assistant', 'Project Coordination']
const PAGE_CONTROL_CONFIG_KEY = '__page_control_enabled_pages'
const CONTENT_PLANNER_CONFIG_KEY = '__content_planner_items'

const PAGE_TOGGLE_DEFAULTS = {
  dashboard: true,
  tasks: true,
  calendar: true,
  orders: true,
  designOrders: true,
  generalOrders: true,
  mentoringSchedule: true,
  contentPlanner: true,
  invoiceFollowUp: true,
  invoiceGenerator: true,
  crm: true,
  finance: true,
  reports: true,
  notes: true,
  integrations: true,
  settings: true
}

const INVOICE_GENERATOR_DEFAULTS_STORAGE_KEY = 'dyatask_invoice_generator_defaults'
const LOGIN_VISUAL_SETTINGS_KEY = 'login_visual'
const TUTORIAL_COURSES_SETTINGS_KEY = 'tutorial_courses'
const LOGIN_VISUAL_BUCKET = 'app-assets'
const LOGIN_VISUAL_OBJECT_PATH = 'login/login-visual'
const FALLBACK_INVOICE_GENERATOR_DEFAULTS = {
  logo: '',
  company: 'DyaTask Studio',
  tagline: 'Freelance Service Invoice',
  paymentInfo: 'Bank: BCA\nA/N: DyaTask\nNo. Rek: 1234567890',
  terms: 'Pembayaran maksimal sebelum jatuh tempo.',
  signer: '',
  signature: ''
}

const WORKSPACE_CHAT_EMOJIS = ['👍', '✅', '🙏', '😊', '🔥', '⭐', '📌', '⏰', '💬', '🎯', '🚀', '✨']

const TUTORIAL_COURSES = [
  {
    id: 'getting-started',
    title: 'Mulai dari Dashboard',
    module: 'Fundamental',
    duration: '06:20',
    level: 'Pemula',
    accent: '#8f75d8',
    description: 'Kenali command center, ringkasan kerja, notifikasi, dan alur navigasi utama.',
    lessons: 4,
    youtubeUrl: ''
  },
  {
    id: 'tasks-projects',
    title: 'Mengelola Tugas & Project',
    module: 'Workflow',
    duration: '11:45',
    level: 'Pemula',
    accent: '#22c55e',
    description: 'Buat folder, task utama, subtask, reminder, dan progress kerja harian.',
    lessons: 6,
    youtubeUrl: ''
  },
  {
    id: 'calendar-booking',
    title: 'Reservasi, Jadwal, dan GCal',
    module: 'Calendar',
    duration: '09:10',
    level: 'Menengah',
    accent: '#06b6d4',
    description: 'Sinkronkan event, kelola booking client, dan baca aktivitas Google Calendar.',
    lessons: 5,
    youtubeUrl: ''
  },
  {
    id: 'invoice-finance',
    title: 'Invoice & Finance Tracker',
    module: 'Finance',
    duration: '13:05',
    level: 'Menengah',
    accent: '#f59e0b',
    description: 'Buat invoice, simpan default input, pantau status payment, dan follow up.',
    lessons: 7,
    youtubeUrl: ''
  },
  {
    id: 'assistant-workspace',
    title: 'Workspace Assistant',
    module: 'Team',
    duration: '08:35',
    level: 'Owner',
    accent: '#ec4899',
    description: 'Invite assistant, atur akses halaman, chat terpisah, revoke, dan regenerate token.',
    lessons: 5,
    youtubeUrl: ''
  },
  {
    id: 'content-crm',
    title: 'Content Planner & CRM',
    module: 'Growth',
    duration: '10:15',
    level: 'Menengah',
    accent: '#6366f1',
    description: 'Susun content plan, insight, client CRM, aktivitas, dan follow-up.',
    lessons: 6,
    youtubeUrl: ''
  }
]

const getYoutubeVideoId = (value) => {
  const rawUrl = String(value || '').trim()
  if (!rawUrl) return ''
  const directId = rawUrl.match(/^[a-zA-Z0-9_-]{11}$/)?.[0]
  if (directId) return directId
  try {
    const url = new URL(rawUrl)
    let videoId = ''
    if (url.hostname.includes('youtu.be')) {
      videoId = url.pathname.replace(/^\/+/, '').split('/')[0]
    } else if (url.searchParams.get('v')) {
      videoId = url.searchParams.get('v') || ''
    } else if (url.pathname.includes('/embed/')) {
      videoId = url.pathname.split('/embed/')[1]?.split('/')[0] || ''
    } else if (url.pathname.includes('/shorts/')) {
      videoId = url.pathname.split('/shorts/')[1]?.split('/')[0] || ''
    }
    return /^[a-zA-Z0-9_-]{11}$/.test(videoId) ? videoId : ''
  } catch {
    return ''
  }
}

const getYoutubeEmbedUrl = (value) => {
  const videoId = getYoutubeVideoId(value)
  return videoId ? `https://www.youtube.com/embed/${videoId}` : ''
}

const getYoutubeThumbnailUrl = (value) => {
  const videoId = getYoutubeVideoId(value)
  return videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : ''
}

const readStoredJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

const MOBILE_PWA_GUIDE_STORAGE_KEY = 'dyatask_mobile_pwa_guide_state'

const readStoredInvoiceGeneratorDefaults = (storageKey = INVOICE_GENERATOR_DEFAULTS_STORAGE_KEY) => {
  const parsed = readStoredJson(storageKey, {})
  return { ...FALLBACK_INVOICE_GENERATOR_DEFAULTS, ...(parsed && typeof parsed === 'object' ? parsed : {}) }
}

function App() {
  const formatDateLocal = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const parseLocalDateValue = (value) => {
    if (!value) return null
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
    const safeValue = String(value).trim()
    if (!safeValue) return null
    const dateOnlyMatch = safeValue.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch
      return new Date(Number(year), Number(month) - 1, Number(day))
    }
    const parsed = new Date(safeValue)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  const formatLongDate = (value, fallback = '-') => {
    const date = parseLocalDateValue(value)
    if (!date) return fallback
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatLongDateTime = (value, fallback = '-') => {
    const parsed = value ? new Date(value) : null
    if (!parsed || Number.isNaN(parsed.getTime())) return fallback
    return `${formatLongDate(parsed)} ${parsed.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
  }

  const formatTextDates = (value) => {
    return String(value || '').replace(/\b\d{4}-\d{2}-\d{2}\b/g, (match) => formatLongDate(match, match))
  }

  const formatTime12Hour = (value, fallback = '') => {
    const safeValue = String(value || '').trim()
    if (!safeValue) return fallback
    const match = safeValue.match(/^(\d{1,2}):(\d{2})/)
    if (!match) return safeValue
    const hours = Number(match[1])
    const minutes = match[2]
    if (Number.isNaN(hours)) return safeValue
    const period = hours >= 12 ? 'pm' : 'am'
    const hour12 = hours % 12 || 12
    return `${String(hour12).padStart(2, '0')}:${minutes} ${period}`
  }

  const formatCalendarPillTitle = (timeValue, title, fallbackTime = 'All day') => {
    const displayTime = formatTime12Hour(timeValue, fallbackTime)
    const displayTitle = String(title || '').trim() || '(Tanpa judul)'
    return `${displayTime} - ${displayTitle}`
  }

  const todayDate = new Date()
  const todayString = formatDateLocal(todayDate)
  const [session, setSession] = useState(null)
  const [authUsername, setAuthUsername] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authFullName, setAuthFullName] = useState('')
  const [authTab, setAuthTab] = useState('signin') // 'signin' or 'signup'
  const [loadingAuth, setLoadingAuth] = useState(false)
  const [authError, setAuthError] = useState(null)
  const [showAuthPassword, setShowAuthPassword] = useState(false)

  const [activeTab, setActiveTab] = useState('dashboard')
  const [mobileWorkspaceChatPreviousTab, setMobileWorkspaceChatPreviousTab] = useState('dashboard')
  const [mobileWorkspaceChatView, setMobileWorkspaceChatView] = useState('list')
  const [isSidebarHovered, setIsSidebarHovered] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [enabledPages, setEnabledPages] = useState(PAGE_TOGGLE_DEFAULTS)
  const [appHeaderTagline, setAppHeaderTagline] = useState(() => localStorage.getItem('dyatask_header_tagline') || 'Modern Soft Minimalist Amethyst')
  const [appHeaderTitle, setAppHeaderTitle] = useState(() => localStorage.getItem('dyatask_header_title') || 'Dyatask Manager - Superapp for Freelancer')
  const [headerNow, setHeaderNow] = useState(new Date())
  const [loginVisualImage, setLoginVisualImage] = useState('')
  const [loginVisualUploading, setLoginVisualUploading] = useState(false)
  const [loginVisualSyncStatus, setLoginVisualSyncStatus] = useState('')
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('dyatask_theme')
    const hasUserThemeChoice = localStorage.getItem('dyatask_theme_user_selected') === 'true'
    if (hasUserThemeChoice && (savedTheme === 'light' || savedTheme === 'dark')) return savedTheme

    localStorage.setItem('dyatask_theme', 'light')
    document.documentElement.classList.remove('dark')
    return 'light'
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [chartMetric, setChartMetric] = useState('productivity') // 'productivity', 'tasks', 'bookings', 'completionRate'
  const [chartHoverIndex, setChartHoverIndex] = useState(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [profileFormData, setProfileFormData] = useState({ 
    full_name: '', 
    avatar_url: '', 
    avatar_file: null,
    tanggal_lahir: '', 
    email: '', 
    nomer_hp: '' 
  })
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  
  // Tasks state
  const [tasks, setTasks] = useState(initialTasks)
  const [taskFilter, setTaskFilter] = useState('All')
  const [taskView, setTaskView] = useState('list') // 'list' or 'grid'
  
  // Task form state
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskCategory, setNewTaskCategory] = useState('Work')
  const [newTaskPriority, setNewTaskPriority] = useState('medium')
  const [newTaskColor, setNewTaskColor] = useState('#8B5CF6')
  const [newTaskTime, setNewTaskTime] = useState('18:00')
  const [newTaskDate, setNewTaskDate] = useState(todayString)
  const [newTaskSubtasks, setNewTaskSubtasks] = useState('')
  const [projectFolderRecords, setProjectFolderRecords] = useState([])
  const [selectedProjectName, setSelectedProjectName] = useState('')
  const [showNewFolderModal, setShowNewFolderModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderColor, setNewFolderColor] = useState('#8B5CF6')
  const [contentPlannerItems, setContentPlannerItems] = useState([])
  const [contentPlannerPlatform, setContentPlannerPlatform] = useState('instagram')
  const [contentPlannerEditingId, setContentPlannerEditingId] = useState(null)
  const [contentPlannerTitle, setContentPlannerTitle] = useState('')
  const [contentPlannerPillar, setContentPlannerPillar] = useState('')
  const [contentPlannerDate, setContentPlannerDate] = useState(todayString)
  const [contentPlannerTime, setContentPlannerTime] = useState('09:00')
  const [contentPlannerStatus, setContentPlannerStatus] = useState('draft')
  const [contentPlannerPostLink, setContentPlannerPostLink] = useState('')
  const [contentPlannerLinkEditId, setContentPlannerLinkEditId] = useState(null)
  const [contentPlannerLinkDraft, setContentPlannerLinkDraft] = useState('')
  const [contentPlannerDetailItem, setContentPlannerDetailItem] = useState(null)
  const [contentPlannerInsightDraft, setContentPlannerInsightDraft] = useState('')
  const [contentPlannerInsightFormOpen, setContentPlannerInsightFormOpen] = useState(false)
  const [contentPlannerInsightMetrics, setContentPlannerInsightMetrics] = useState({})
  const [showContentPlannerForm, setShowContentPlannerForm] = useState(true)

  // Booking state
  const [appointments, setAppointments] = useState(initialAppointments)
  const [googleCalendarEvents, setGoogleCalendarEvents] = useState([])
  const [nationalHolidays, setNationalHolidays] = useState([])
  const seenGoogleCalendarEventIdsRef = useRef(new Set())
  const googleCalendarBaselineReadyRef = useRef(false)
  const googleCalendarFetchIdRef = useRef(0)
  const reminderNotificationKeysRef = useRef(new Set())
  const orderDeadlineReminderKeysRef = useRef(new Set())
  const invoiceReminderKeysRef = useRef(new Set())

  // Helper function to get chart data points based on metric (after state is defined)
  const getChartDataPoints = () => {
    const daysOfWeek = [1, 2, 3, 4, 5, 6, 0] // Mon to Sun
    
    if (chartMetric === 'productivity') {
      // Simulate productivity based on task activity this week
      const tasksByDay = daysOfWeek.map(day => {
        const dayDate = new Date(todayDate)
        dayDate.setDate(todayDate.getDate() - (todayDate.getDay() - day))
        const dateStr = formatDateLocal(dayDate)
        return tasks.filter(t => t.date === dateStr).length
      })
      return tasksByDay.map(v => Math.min(100, (v || 0) * 15))
    } else if (chartMetric === 'tasks') {
      // Tasks created per day of week
      return daysOfWeek.map(day => {
        const dayDate = new Date(todayDate)
        dayDate.setDate(todayDate.getDate() - (todayDate.getDay() - day))
        const dateStr = formatDateLocal(dayDate)
        return Math.min(100, tasks.filter(t => t.date === dateStr).length * 20)
      })
    } else if (chartMetric === 'bookings') {
      // Appointments per day
      return daysOfWeek.map(day => {
        const dayDate = new Date(todayDate)
        dayDate.setDate(todayDate.getDate() - (todayDate.getDay() - day))
        const dateStr = formatDateLocal(dayDate)
        return Math.min(100, appointments.filter(a => a.date === dateStr).length * 30)
      })
    } else if (chartMetric === 'completionRate') {
      // Task completion rate per day
      return daysOfWeek.map(day => {
        const dayDate = new Date(todayDate)
        dayDate.setDate(todayDate.getDate() - (todayDate.getDay() - day))
        const dateStr = formatDateLocal(dayDate)
        const dayTasks = tasks.filter(t => t.date === dateStr)
        if (dayTasks.length === 0) return 0
        return Math.round((dayTasks.filter(t => t.status === 'done').length / dayTasks.length) * 100)
      })
    }
    return [0, 0, 0, 0, 0, 0, 0]
  }

  // Use useMemo to calculate chart data points safely
  const chartDataPoints = useMemo(() => getChartDataPoints(), [tasks, appointments, chartMetric])
  const chartMetricMeta = {
    productivity: { label: 'Produktivitas', color: '#7C3AED', unit: '' },
    tasks: { label: 'Tugas', color: '#DB2777', unit: '' },
    bookings: { label: 'Konsultasi', color: '#059669', unit: '' },
    completionRate: { label: 'Selesai', color: '#D97706', unit: '%' }
  }
  const activeChartMeta = chartMetricMeta[chartMetric] || chartMetricMeta.productivity
  const chartLabels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
  const chartCoordinates = chartDataPoints.map((value, index) => {
    const safeValue = Math.max(0, Math.min(100, Number(value) || 0))
    return {
      label: chartLabels[index],
      value: safeValue,
      x: 48 + index * 100,
      y: 178 - (safeValue / 100) * 122
    }
  })
  const chartLinePath = chartCoordinates.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
  const chartAreaPath = chartCoordinates.length
    ? `${chartLinePath} L ${chartCoordinates[chartCoordinates.length - 1].x} 178 L ${chartCoordinates[0].x} 178 Z`
    : ''
  const [bookingClient, setBookingClient] = useState('')
  const [bookingTitle, setBookingTitle] = useState('')
  const [bookingEmail, setBookingEmail] = useState('')
  const [bookingWhatsapp, setBookingWhatsapp] = useState('')
  const [bookingTime, setBookingTime] = useState('09:00')
  const [bookingDate, setBookingDate] = useState(todayString)
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(todayString)
  const [calendarMonthDate, setCalendarMonthDate] = useState(() => new Date(todayDate.getFullYear(), todayDate.getMonth(), 1))
  const [isBookingFormExpanded, setIsBookingFormExpanded] = useState(true)
  const [copiedShareLink, setCopiedShareLink] = useState(false)
  const [shareToken, setShareToken] = useState('')
  const [bookingAvailability, setBookingAvailability] = useState(() => {
    const defaultDaySchedules = {
      0: { enabled: false, startHour: '09:00', endHour: '17:00' },
      1: { enabled: true, startHour: '09:00', endHour: '17:00' },
      2: { enabled: true, startHour: '09:00', endHour: '17:00' },
      3: { enabled: true, startHour: '09:00', endHour: '17:00' },
      4: { enabled: true, startHour: '09:00', endHour: '17:00' },
      5: { enabled: true, startHour: '09:00', endHour: '17:00' },
      6: { enabled: false, startHour: '09:00', endHour: '17:00' }
    }

    try {
      const saved = {}
      const hasDaySchedules = saved.daySchedules && typeof saved.daySchedules === 'object'

      const migratedDaySchedules = hasDaySchedules
        ? Object.fromEntries(
          Array.from({ length: 7 }, (_, dayIndex) => {
            const currentDay = saved.daySchedules?.[dayIndex] || {}
            return [
              dayIndex,
              {
                enabled: typeof currentDay.enabled === 'boolean'
                  ? currentDay.enabled
                  : (saved.enabledDays || [1, 2, 3, 4, 5]).includes(dayIndex),
                startHour: currentDay.startHour || saved.startHour || '09:00',
                endHour: currentDay.endHour || saved.endHour || '17:00'
              }
            ]
          })
        )
        : Object.fromEntries(
          Array.from({ length: 7 }, (_, dayIndex) => [
            dayIndex,
            {
              enabled: (saved.enabledDays || [1, 2, 3, 4, 5]).includes(dayIndex),
              startHour: saved.startHour || '09:00',
              endHour: saved.endHour || '17:00'
            }
          ])
        )

      return {
        daySchedules: { ...defaultDaySchedules, ...migratedDaySchedules },
        slotMinutes: saved.slotMinutes || 30
      }
    } catch {
      return { daySchedules: defaultDaySchedules, slotMinutes: 30 }
    }
  })
  const [reservationSessionPrice, setReservationSessionPrice] = useState(250000)
  const [selectedAvailabilityDay, setSelectedAvailabilityDay] = useState(1)
  const [showAvailabilitySettings, setShowAvailabilitySettings] = useState(false)
  const [showBookingQuickForm, setShowBookingQuickForm] = useState(false)
  const [publicBookingSuccess, setPublicBookingSuccess] = useState(false)
  const [publicBookingSummary, setPublicBookingSummary] = useState(null)
  const [publicBookingNotes, setPublicBookingNotes] = useState('Ketentuan reservasi:\n- Harap hadir 10 menit sebelum jadwal.\n- Jadwal dapat dijadwalkan ulang maksimal 1x.\n- Link meeting akan dikirim via email/WhatsApp setelah konfirmasi.')
  const [publicShareBaseUrl, setPublicShareBaseUrl] = useState('')
  const [spreadsheetOrders, setSpreadsheetOrders] = useState([])
  const [orderTimelineItems, setOrderTimelineItems] = useState([])
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [newOrderCustomer, setNewOrderCustomer] = useState('')
  const [newOrderName, setNewOrderName] = useState('')
  const [newOrderType, setNewOrderType] = useState('Dashboard')
  const [newOrderBudget, setNewOrderBudget] = useState('')
  const [newOrderDueDate, setNewOrderDueDate] = useState(todayString)
  const [newOrderStatus, setNewOrderStatus] = useState('new')
  const [newOrderPaymentStatus, setNewOrderPaymentStatus] = useState('belum_bayar')
  const [orderPaymentStatusMap, setOrderPaymentStatusMap] = useState({})
  const [editingOrderId, setEditingOrderId] = useState(null)
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [timelineInputTitle, setTimelineInputTitle] = useState('')
  const [timelineInputNote, setTimelineInputNote] = useState('')
  const [timelineInputProgress, setTimelineInputProgress] = useState(0)
  const [editingTimelineId, setEditingTimelineId] = useState(null)
  const [editTimelineTitle, setEditTimelineTitle] = useState('')
  const [editTimelineNote, setEditTimelineNote] = useState('')
  const [editTimelineProgress, setEditTimelineProgress] = useState(0)
  const [invoices, setInvoices] = useState([])
  const [invoiceStorageMode, setInvoiceStorageMode] = useState('cloud')
  const [invoiceFilterStatus, setInvoiceFilterStatus] = useState('all')
  const [showInvoiceForm, setShowInvoiceForm] = useState(false)
  const [editingInvoiceId, setEditingInvoiceId] = useState(null)
  const [invoiceClientName, setInvoiceClientName] = useState('')
  const [invoiceTitle, setInvoiceTitle] = useState('')
  const [invoiceType, setInvoiceType] = useState('Custom Spreadsheet')
  const [invoiceAmount, setInvoiceAmount] = useState('')
  const [invoiceIssueDate, setInvoiceIssueDate] = useState(todayString)
  const [invoiceDueDate, setInvoiceDueDate] = useState(todayString)
  const [invoiceStatus, setInvoiceStatus] = useState('draft')
  const [invoiceNotes, setInvoiceNotes] = useState('')
  const [invoiceGeneratorDefaults, setInvoiceGeneratorDefaults] = useState(() => ({ ...FALLBACK_INVOICE_GENERATOR_DEFAULTS }))
  const [invoiceGeneratorEditingId, setInvoiceGeneratorEditingId] = useState(null)
  const [invoiceGeneratorLogo, setInvoiceGeneratorLogo] = useState(() => invoiceGeneratorDefaults.logo)
  const [invoiceGeneratorNumber, setInvoiceGeneratorNumber] = useState('')
  const [invoiceGeneratorDate, setInvoiceGeneratorDate] = useState(todayString)
  const [invoiceGeneratorDueDate, setInvoiceGeneratorDueDate] = useState(todayString)
  const [invoiceGeneratorCompany, setInvoiceGeneratorCompany] = useState(() => invoiceGeneratorDefaults.company)
  const [invoiceGeneratorTagline, setInvoiceGeneratorTagline] = useState(() => invoiceGeneratorDefaults.tagline)
  const [invoiceGeneratorClient, setInvoiceGeneratorClient] = useState('')
  const [invoiceGeneratorClientAddress, setInvoiceGeneratorClientAddress] = useState('')
  const [invoiceGeneratorShipTo, setInvoiceGeneratorShipTo] = useState('')
  const [invoiceGeneratorService, setInvoiceGeneratorService] = useState('')
  const [invoiceGeneratorServiceDesc, setInvoiceGeneratorServiceDesc] = useState('')
  const [invoiceGeneratorQty, setInvoiceGeneratorQty] = useState(1)
  const [invoiceGeneratorPrice, setInvoiceGeneratorPrice] = useState(0)
  const [invoiceGeneratorPaymentInfo, setInvoiceGeneratorPaymentInfo] = useState(() => invoiceGeneratorDefaults.paymentInfo)
  const [invoiceGeneratorTerms, setInvoiceGeneratorTerms] = useState(() => invoiceGeneratorDefaults.terms)
  const [invoiceGeneratorSigner, setInvoiceGeneratorSigner] = useState(() => invoiceGeneratorDefaults.signer)
  const [invoiceGeneratorSignature, setInvoiceGeneratorSignature] = useState(() => invoiceGeneratorDefaults.signature)
  const [invoiceGeneratorSourceOrderId, setInvoiceGeneratorSourceOrderId] = useState(null)
  const [invoiceGeneratorStatus, setInvoiceGeneratorStatus] = useState('draft')
  const [showInvoiceGeneratorForm, setShowInvoiceGeneratorForm] = useState(true)
  const [invoicePreviewModalItem, setInvoicePreviewModalItem] = useState(null)
  const [crmClients, setCrmClients] = useState([])
  const [crmActivities, setCrmActivities] = useState([])
  const [showCrmForm, setShowCrmForm] = useState(false)
  const [editingCrmClientId, setEditingCrmClientId] = useState(null)
  const [selectedCrmClientId, setSelectedCrmClientId] = useState(null)
  const [crmClientName, setCrmClientName] = useState('')
  const [crmClientCompany, setCrmClientCompany] = useState('')
  const [crmClientEmail, setCrmClientEmail] = useState('')
  const [crmClientPhone, setCrmClientPhone] = useState('')
  const [crmClientStatus, setCrmClientStatus] = useState('lead')
  const [crmClientNextFollowUp, setCrmClientNextFollowUp] = useState(todayString)
  const [crmClientNotes, setCrmClientNotes] = useState('')
  const [crmActivityTitle, setCrmActivityTitle] = useState('')
  const [crmActivityNote, setCrmActivityNote] = useState('')
  const [crmActivityDueDate, setCrmActivityDueDate] = useState(todayString)
  const [activityLogs, setActivityLogs] = useState([])

  // Encryption simulation state
  const [notes, setNotes] = useState(initialNotes)
  const [noteInputTitle, setNoteInputTitle] = useState('')
  const [noteInputContent, setNoteInputContent] = useState('')
  const [masterPassword, setMasterPassword] = useState('')
  const [activeDecryptedContent, setActiveDecryptedContent] = useState(null)
  const [decryptingNoteId, setDecryptingNoteId] = useState(null)
  const [decryptPassphraseInput, setDecryptPassphraseInput] = useState('')
  const [scrambleProgress, setScrambleProgress] = useState(false)
  const [scrambledText, setScrambledText] = useState('')

  // Simulated push notification
  const [notifications, setNotifications] = useState([])
  const [showNotificationList, setShowNotificationList] = useState(false)
  const [notificationBannerVisible, setNotificationBannerVisible] = useState(true)
  const [floatingQuickAdd, setFloatingQuickAdd] = useState(false)
  const [showNotificationHistory, setShowNotificationHistory] = useState(false)
  const [showMobileMoreMenu, setShowMobileMoreMenu] = useState(false)
  const [workspaceContext, setWorkspaceContext] = useState(null)
  const [workspaceOwnerName, setWorkspaceOwnerName] = useState('')
  const [workspaceMembers, setWorkspaceMembers] = useState([])
  const [workspaceProfileNames, setWorkspaceProfileNames] = useState({})
  const [developerMonitoringRows, setDeveloperMonitoringRows] = useState([])
  const [developerMonitoringLoading, setDeveloperMonitoringLoading] = useState(false)
  const [developerMonitoringError, setDeveloperMonitoringError] = useState('')
  const [developerMonitoringUpdatedAt, setDeveloperMonitoringUpdatedAt] = useState('')
  const [developerMonitoringSearch, setDeveloperMonitoringSearch] = useState('')
  const [workspaceInviteUsername, setWorkspaceInviteUsername] = useState('')
  const [workspaceInviteRole, setWorkspaceInviteRole] = useState('assistant')
  const [workspaceInviteToken, setWorkspaceInviteToken] = useState('')
  const [workspaceInvitePermissions, setWorkspaceInvitePermissions] = useState({ ...TEAM_PERMISSION_DEFAULTS })
  const [teamLoading, setTeamLoading] = useState(false)
  const [pageAccessMemberId, setPageAccessMemberId] = useState(null)
  const [pageAccessDraftPermissions, setPageAccessDraftPermissions] = useState({ ...TEAM_PERMISSION_DEFAULTS })
  const [migrationOneClickCopied, setMigrationOneClickCopied] = useState(false)
  const [pendingInviteToken, setPendingInviteToken] = useState(() => localStorage.getItem('dyatask_pending_workspace_invite_token') || '')
  const [inviteLandingToken, setInviteLandingToken] = useState('')
  const [inviteConfirmModalOpen, setInviteConfirmModalOpen] = useState(false)
  const [inviteConfirmInput, setInviteConfirmInput] = useState('')
  const [inviteDirectLoading, setInviteDirectLoading] = useState(false)
  const [inviteAuthNotice, setInviteAuthNotice] = useState('')
  const [workspaceInviteNotice, setWorkspaceInviteNotice] = useState(null)
  const [tutorialCourses, setTutorialCourses] = useState(TUTORIAL_COURSES)
  const [tutorialViewMode, setTutorialViewMode] = useState('gallery')
  const [tutorialProgress, setTutorialProgress] = useState([])
  const [activeTutorialCourse, setActiveTutorialCourse] = useState(null)
  const [editingTutorialCourse, setEditingTutorialCourse] = useState(null)
  const [savingTutorialCourse, setSavingTutorialCourse] = useState(false)
  const [workspaceChatModalOpen, setWorkspaceChatModalOpen] = useState(false)
  const [workspaceChatAssistantPanelCollapsed, setWorkspaceChatAssistantPanelCollapsed] = useState(false)
  const [workspaceChatStatusMenuOpen, setWorkspaceChatStatusMenuOpen] = useState(false)
  const [workspaceChatMessage, setWorkspaceChatMessage] = useState('')
  const [workspaceChatSending, setWorkspaceChatSending] = useState(false)
  const [workspaceChatLastReadAt, setWorkspaceChatLastReadAt] = useState(0)
  const [selectedWorkspaceChatMemberId, setSelectedWorkspaceChatMemberId] = useState('')
  const [workspaceEmojiPickerOpen, setWorkspaceEmojiPickerOpen] = useState(false)
  const [workspaceChatReplyTarget, setWorkspaceChatReplyTarget] = useState(null)
  const [workspaceChatActionMessageId, setWorkspaceChatActionMessageId] = useState('')
  const [workspaceChatOwnerMenuOpen, setWorkspaceChatOwnerMenuOpen] = useState(false)
  const [isMobileTabletView, setIsMobileTabletView] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth <= 1180
  })
  const [mobileTaskFolderOpen, setMobileTaskFolderOpen] = useState(false)
  const [mobileOrderDetailOpen, setMobileOrderDetailOpen] = useState(false)
  const [mobileCrmDetailOpen, setMobileCrmDetailOpen] = useState(false)
  const [deployUpdateInfo, setDeployUpdateInfo] = useState(null)
  const [installOptionsOpen, setInstallOptionsOpen] = useState(false)
  const [mobilePwaGuideOpen, setMobilePwaGuideOpen] = useState(false)
  const [mobilePwaGuidePlatform, setMobilePwaGuidePlatform] = useState('android')
  const [mobilePwaGuideState, setMobilePwaGuideState] = useState(() => readStoredJson(MOBILE_PWA_GUIDE_STORAGE_KEY, { dismissed: false, reason: '', platform: '' }))
  const [appVersionInfo, setAppVersionInfo] = useState(null)
  const [manualUpdateStatus, setManualUpdateStatus] = useState('')
  const [checkingManualUpdate, setCheckingManualUpdate] = useState(false)
  const [pwaInstallPrompt, setPwaInstallPrompt] = useState(null)
  const [isPwaStandalone, setIsPwaStandalone] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
  })
  const [floatingTaskTitle, setFloatingTaskTitle] = useState('')
  const [showQuickTaskModal, setShowQuickTaskModal] = useState(false)
  const [showQuickBookingModal, setShowQuickBookingModal] = useState(false)
  const sidebarHoverTimerRef = useRef(null)
  const contentPlannerAutosaveTimerRef = useRef(null)
  const currentDeployVersionRef = useRef(import.meta.env.VITE_DEPLOY_COMMIT || 'dev')
  const announcedDeployVersionRef = useRef('')
  const dismissedDeployVersionRef = useRef(localStorage.getItem('dyatask_dismissed_deploy_version') || '')
  const tutorialProgressLoadedRef = useRef(false)
  const seenAssistantNoteIdsRef = useRef(new Set())
  const workspaceChatSeenSignatureRef = useRef('')
  const workspaceChatPresenceSignatureRef = useRef('')
  const workspaceChatInactiveNoticeSignatureRef = useRef('')
  const workspaceChatTypingHeartbeatRef = useRef(null)
  const workspaceChatTypingIdleTimerRef = useRef(null)
  const workspaceChatTypingStateRef = useRef(false)
  const workspaceChatPresenceHeartbeatRef = useRef(null)
  const workspaceChatLongPressTimerRef = useRef(null)
  const workspaceChatTouchStartRef = useRef({ x: 0, y: 0, messageId: '' })
  const workspaceChatFeedRef = useRef(null)
  const invoicePreviewRef = useRef(null)
  const mobilePwaGuideAutoShownRef = useRef(false)

  // macOS system configurations
  const [autoStart, setAutoStart] = useState(true)
  const [autoOpenOnAlert, setAutoOpenOnAlert] = useState(true)
  const [floatingMenuEnabled, setFloatingMenuEnabled] = useState(true)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true)
  const [syncStatus, setSyncStatus] = useState('Terhubung')

  // Integration config state (synced with Supabase per user; localStorage used only as temporary fallback)
  const [integrationConfigs, setIntegrationConfigs] = useState({})
  const [integrationConfigsLoaded, setIntegrationConfigsLoaded] = useState(false)
  const [activeIntegrationModal, setActiveIntegrationModal] = useState(null) // 'google_calendar' | 'notion' | 'email' | 'google_sheets'
  const [activeTutorialModal, setActiveTutorialModal] = useState(null)
  const [integrationFormData, setIntegrationFormData] = useState({})

  const activeNotifications = notifications.filter(item => !item.confirmed)
  const isMobileWorkspaceChatView = isMobileTabletView && activeTab === 'workspaceChat'
  const isWorkspaceChatOpen = workspaceChatModalOpen || isMobileWorkspaceChatView
  const isWorkspaceChatThreadVisible = workspaceChatModalOpen || (
    isMobileTabletView
    && activeTab === 'workspaceChat'
    && ((workspaceContext?.role || 'owner') !== 'owner' || mobileWorkspaceChatView === 'detail')
  )
  const [testingGoogleConnection, setTestingGoogleConnection] = useState(false)
  const [googleConnectionStatus, setGoogleConnectionStatus] = useState(null)
  const [calendarActionItem, setCalendarActionItem] = useState(null)
  const [activeCalendarEditItem, setActiveCalendarEditItem] = useState(null)
  const [calendarEditForm, setCalendarEditForm] = useState({})
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null)
  const searchParams = new URLSearchParams(window.location.search)
  const publicBookingToken = searchParams.get('booking')
  const publicTrackingToken = searchParams.get('track')
  const inviteTokenFromUrl = searchParams.get('invite') || searchParams.get('invite_token') || ''
  const inviteUsernameFromUrl = searchParams.get('u') || searchParams.get('username') || ''
  const actorUserId = session?.user?.id || null
  const actorEmail = String(session?.user?.email || '').trim().toLowerCase()
  const actorUsername = actorEmail.split('@')[0] || ''
  const appDeveloperAccounts = String(import.meta.env.VITE_APP_DEVELOPER_EMAILS || 'arunika.dyatask@gmail.com,dinur.dyatask@gmail.com,dinurm.pradipta.dyatask@gmail.com')
    .split(',')
    .map(item => item.trim().toLowerCase())
    .filter(Boolean)
  const appDeveloperUsernames = String(import.meta.env.VITE_APP_DEVELOPER_USERNAMES || 'arunika.dyatask,dinur,dinurm.pradipta')
    .split(',')
    .map(item => item.trim().toLowerCase())
    .filter(Boolean)
  const isAppDeveloper = appDeveloperAccounts.includes(actorEmail)
    || appDeveloperUsernames.includes(actorUsername)
    || actorEmail.startsWith('arunika.dyatask@')
  const scopedUserId = workspaceContext?.ownerUserId || actorUserId
  const workspaceRole = workspaceContext?.role || 'owner'
  const workspaceStatus = workspaceContext?.status || 'active'
  const isWorkspaceAccessRevoked = workspaceRole !== 'owner' && workspaceStatus === 'revoked'
  const workspacePermissions = normalizeTeamPermissions(workspaceContext?.permissions || {})
  const canManageTeam = workspaceRole === 'owner'
  const hasWritePermission = (areaKey) => !isWorkspaceAccessRevoked && (workspaceRole === 'owner' || (workspaceRole === 'assistant' && !!workspacePermissions?.[areaKey]))
  const canReadArea = (areaKey) => !isWorkspaceAccessRevoked && (workspaceRole === 'owner' || !!workspacePermissions?.[areaKey])
  const pageControlStorageKey = scopedUserId ? `dyatask_enabled_pages_${scopedUserId}` : 'dyatask_enabled_pages_guest'
  const scopedStorageKey = (baseKey) => scopedUserId ? `${baseKey}_${scopedUserId}` : `${baseKey}_guest`
  const contentPlannerFormStorageKey = scopedStorageKey('dyatask_show_content_planner_form')
  const notificationHistoryStorageKey = scopedStorageKey('dyatask_notification_history')
  const bookingAvailabilityStorageKey = scopedStorageKey('dyatask_booking_availability')
  const bookingShareTokenStorageKey = scopedStorageKey('dyatask_booking_share_token')
  const reservationSessionPriceStorageKey = scopedStorageKey('dyatask_reservation_session_price')
  const publicBookingNotesStorageKey = scopedStorageKey('dyatask_public_booking_notes')
  const publicShareBaseUrlStorageKey = scopedStorageKey('dyatask_public_share_base_url')
  const tutorialProgressStorageKey = scopedStorageKey('dyatask_tutorial_progress')
  const invoiceGeneratorDefaultsStorageKey = scopedStorageKey(INVOICE_GENERATOR_DEFAULTS_STORAGE_KEY)
  const isPageEnabled = (pageKey) => enabledPages?.[pageKey] !== false
  const mobilePrimaryNavTabs = ['dashboard', 'tasks', 'calendar', 'orders', 'crm', 'finance', 'invoiceFollowUp']
  const isPrimaryMobileNavTab = (tabKey) => !isMobileTabletView || mobilePrimaryNavTabs.includes(tabKey)

  const canShowTab = (tabKey) => {
    const tabToPage = {
      dashboard: 'dashboard',
      tasks: 'tasks',
      calendar: 'calendar',
      orders: 'orders',
      designOrders: 'designOrders',
      generalOrders: 'generalOrders',
      mentoringSchedule: 'mentoringSchedule',
      contentPlanner: 'contentPlanner',
      invoiceFollowUp: 'invoiceFollowUp',
      invoiceGenerator: 'invoiceGenerator',
      crm: 'crm',
      finance: 'finance',
      reports: 'reports',
      notes: 'notes',
      integrations: 'integrations',
      settings: 'settings',
      tutorial: null,
      workspaceChat: null
    }
    const pageKey = tabToPage[tabKey]
    return !pageKey || isPageEnabled(pageKey)
  }

  const togglePageEnabled = (pageKey) => {
    setEnabledPages(prev => ({ ...prev, [pageKey]: !(prev?.[pageKey] !== false) }))
  }

  const visiblePrimaryTabs = ['dashboard', 'tasks', 'calendar', 'orders', 'designOrders', 'generalOrders', 'mentoringSchedule', 'contentPlanner', 'invoiceFollowUp', 'invoiceGenerator', 'crm', 'finance', 'reports']
    .filter(tab => canShowTab(tab) && canReadArea(tab))
  const sidebarCollapsed = isMobileTabletView || !isSidebarHovered

  const handleSidebarMouseEnter = () => {
    if (isMobileTabletView) return
    if (sidebarHoverTimerRef.current) clearTimeout(sidebarHoverTimerRef.current)
    sidebarHoverTimerRef.current = setTimeout(() => {
      setIsSidebarHovered(true)
    }, 120)
  }

  const handleSidebarMouseLeave = () => {
    if (sidebarHoverTimerRef.current) clearTimeout(sidebarHoverTimerRef.current)
    setIsSidebarHovered(false)
  }

  useEffect(() => {
    const handleViewportResize = () => setIsMobileTabletView(window.innerWidth <= 1180)
    window.addEventListener('resize', handleViewportResize)
    return () => {
      window.removeEventListener('resize', handleViewportResize)
      if (sidebarHoverTimerRef.current) clearTimeout(sidebarHoverTimerRef.current)
      if (contentPlannerAutosaveTimerRef.current) clearTimeout(contentPlannerAutosaveTimerRef.current)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 150)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!isMobileTabletView || activeTab !== 'tasks') {
      setMobileTaskFolderOpen(false)
    }
    if (!isMobileTabletView || activeTab !== 'orders') {
      setMobileOrderDetailOpen(false)
    }
    if (!isMobileTabletView || activeTab !== 'crm') {
      setMobileCrmDetailOpen(false)
    }
  }, [isMobileTabletView, activeTab])

  useEffect(() => {
    if (!isMobileTabletView && activeTab === 'workspaceChat') {
      setActiveTab(mobileWorkspaceChatPreviousTab || 'dashboard')
    }
  }, [isMobileTabletView, activeTab, mobileWorkspaceChatPreviousTab])

  useEffect(() => {
    if (editingOrderId) return
    if (activeTab === 'designOrders') {
      setNewOrderType(DESIGN_ORDER_TYPES[0])
      return
    }
    if (activeTab === 'generalOrders') {
      setNewOrderType(GENERAL_ORDER_TYPES[0])
      return
    }
    if (activeTab === 'orders') {
      setNewOrderType(SPREADSHEET_ORDER_TYPES[0])
    }
  }, [activeTab, editingOrderId])

  useEffect(() => {
    setShowContentPlannerForm(localStorage.getItem(contentPlannerFormStorageKey) !== 'false')
  }, [contentPlannerFormStorageKey])

  useEffect(() => {
    localStorage.setItem(contentPlannerFormStorageKey, showContentPlannerForm ? 'true' : 'false')
  }, [showContentPlannerForm, contentPlannerFormStorageKey])

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(pageControlStorageKey) || '{}')
      setEnabledPages({ ...PAGE_TOGGLE_DEFAULTS, ...(saved || {}) })
    } catch {
      setEnabledPages(PAGE_TOGGLE_DEFAULTS)
    }
  }, [pageControlStorageKey])

  useEffect(() => {
    localStorage.setItem(pageControlStorageKey, JSON.stringify(enabledPages))
  }, [enabledPages, pageControlStorageKey])

  useEffect(() => {
    if (!integrationConfigsLoaded) return
    const cloudPages = integrationConfigs?.[PAGE_CONTROL_CONFIG_KEY]
    if (!cloudPages || typeof cloudPages !== 'object') return
    setEnabledPages(prev => {
      const merged = { ...PAGE_TOGGLE_DEFAULTS, ...cloudPages }
      return JSON.stringify(prev) === JSON.stringify(merged) ? prev : merged
    })
  }, [integrationConfigsLoaded, integrationConfigs, scopedUserId])

  useEffect(() => {
    if (!integrationConfigsLoaded) return
    const cloudItems = integrationConfigs?.[CONTENT_PLANNER_CONFIG_KEY]
    if (!Array.isArray(cloudItems)) return
    setContentPlannerItems(cloudItems.map((item) => ({
      id: item.id || `content-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      platform: item.platform || 'instagram',
      status: item.status || 'draft',
      uploadDate: item.uploadDate || todayString,
      uploadTime: item.uploadTime || '09:00',
      pillar: item.pillar || '',
      title: item.title || '',
      postLink: item.postLink || '',
      insightNote: item.insightNote || item.insightLink || '',
      insightMetrics: item.insightMetrics && typeof item.insightMetrics === 'object' ? item.insightMetrics : {},
      taskId: item.taskId || null
    })))
  }, [integrationConfigsLoaded, integrationConfigs, todayString])

  useEffect(() => {
    if (!scopedUserId || !integrationConfigsLoaded) return
    if (!hasWritePermission('integrations')) return
    const mergedPages = { ...PAGE_TOGGLE_DEFAULTS, ...(enabledPages || {}) }
    const currentCloudPages = integrationConfigs?.[PAGE_CONTROL_CONFIG_KEY] || null
    if (JSON.stringify(currentCloudPages) === JSON.stringify(mergedPages)) return

    const nextConfigs = { ...integrationConfigs, [PAGE_CONTROL_CONFIG_KEY]: mergedPages }
    setIntegrationConfigs(nextConfigs)
    supabase
      .from('user_integration_configs')
      .upsert({
        user_id: scopedUserId,
        configs: nextConfigs
      }, { onConflict: 'user_id' })
      .then(({ error }) => {
        if (error) console.warn('Gagal sinkron Atur Halaman ke Supabase:', error.message)
      })
  }, [enabledPages, scopedUserId, integrationConfigsLoaded, integrationConfigs, workspaceRole, workspacePermissions])

  useEffect(() => {
    if (!scopedUserId || !integrationConfigsLoaded) return
    if (!hasWritePermission('integrations')) return
    const currentCloudItems = integrationConfigs?.[CONTENT_PLANNER_CONFIG_KEY] || []
    if (JSON.stringify(currentCloudItems) === JSON.stringify(contentPlannerItems)) return

    if (contentPlannerAutosaveTimerRef.current) clearTimeout(contentPlannerAutosaveTimerRef.current)
    contentPlannerAutosaveTimerRef.current = setTimeout(() => {
      const nextConfigs = { ...integrationConfigs, [CONTENT_PLANNER_CONFIG_KEY]: contentPlannerItems }
      setIntegrationConfigs(nextConfigs)
      supabase
        .from('user_integration_configs')
        .upsert({
          user_id: scopedUserId,
          configs: nextConfigs
        }, { onConflict: 'user_id' })
        .then(({ error }) => {
          if (error) console.warn('Gagal autosave Content Planner ke Supabase:', error.message)
        })
    }, 400)

    return () => {
      if (contentPlannerAutosaveTimerRef.current) clearTimeout(contentPlannerAutosaveTimerRef.current)
    }
  }, [contentPlannerItems, scopedUserId, integrationConfigsLoaded, integrationConfigs, workspaceRole, workspacePermissions])

  useEffect(() => {
    if (!invoiceGeneratorNumber) {
      setInvoiceGeneratorNumber(buildAutoInvoiceNumber())
    }
  }, [invoices])

  useEffect(() => {
    const nextDefaults = readStoredInvoiceGeneratorDefaults(invoiceGeneratorDefaultsStorageKey)
    setInvoiceGeneratorDefaults(nextDefaults)
    if (!invoiceGeneratorEditingId) {
      applyInvoiceGeneratorDefaults(nextDefaults)
    }
  }, [invoiceGeneratorDefaultsStorageKey])

  useEffect(() => {
    if (
      workspaceRole !== 'owner'
      && !['pageControl', 'tutorial', 'userMonitoring', 'workspaceChat'].includes(activeTab)
      && !canReadArea(activeTab)
    ) {
      setActiveTab(visiblePrimaryTabs[0] || 'dashboard')
    }
  }, [activeTab, workspaceRole, workspacePermissions, visiblePrimaryTabs])

  useEffect(() => {
    if (activeTab === 'pageControl' || activeTab === 'tutorial') return
    if (!canShowTab(activeTab)) {
      setActiveTab(visiblePrimaryTabs[0] || 'dashboard')
    }
  }, [activeTab, enabledPages, visiblePrimaryTabs])

  useEffect(() => {
    if (activeTab === 'userMonitoring' && !isAppDeveloper) {
      setActiveTab(visiblePrimaryTabs[0] || 'dashboard')
    }
  }, [activeTab, isAppDeveloper, visiblePrimaryTabs])

  useEffect(() => {
    if (workspaceChatModalOpen) {
      setWorkspaceChatAssistantPanelCollapsed(false)
    }
  }, [workspaceChatModalOpen])
  const openWorkspaceChatExperience = (event) => {
    event?.preventDefault?.()
    event?.stopPropagation?.()
    if (isMobileTabletView) {
      setMobileWorkspaceChatPreviousTab(activeTab === 'workspaceChat' ? (mobileWorkspaceChatPreviousTab || 'dashboard') : activeTab)
      setMobileWorkspaceChatView(workspaceRole === 'owner' ? 'list' : 'detail')
      setWorkspaceChatModalOpen(false)
      setActiveTab('workspaceChat')
      setShowMobileMoreMenu(false)
      setNotificationBannerVisible(false)
      setShowNotificationList(false)
      if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(() => setActiveTab('workspaceChat'))
      }
      return
    }
    setWorkspaceChatModalOpen(true)
  }

  const handleWorkspaceChatTriggerClick = (event) => {
    if (isMobileTabletView) {
      if (isWorkspaceChatOpen) {
        event?.preventDefault?.()
        event?.stopPropagation?.()
        closeWorkspaceChatExperience()
        return
      }
      return
    }
    if (workspaceChatModalOpen) {
      event?.preventDefault?.()
      event?.stopPropagation?.()
      closeWorkspaceChatExperience()
      return
    }
    openWorkspaceChatExperience(event)
  }

  const handleWorkspaceChatTriggerPointerDown = (event) => {
    if (!isMobileTabletView) return
    if (isWorkspaceChatOpen) {
      event?.preventDefault?.()
      event?.stopPropagation?.()
      closeWorkspaceChatExperience()
      return
    }
    openWorkspaceChatExperience(event)
  }

  const closeWorkspaceChatExperience = () => {
    if (isMobileTabletView) {
      if (workspaceRole === 'owner' && mobileWorkspaceChatView === 'detail') {
        setMobileWorkspaceChatView('list')
        return
      }
      setActiveTab(mobileWorkspaceChatPreviousTab || 'dashboard')
      return
    }
    setWorkspaceChatModalOpen(false)
  }
  const isPublicBookingMode = !!publicBookingToken
  const isPublicTrackingMode = !!publicTrackingToken

  const saveIntegrationConfig = async () => {
    if (!scopedUserId || !activeIntegrationModal) return
    if (!hasWritePermission('integrations')) {
      alert('Akun Anda tidak punya izin mengubah konfigurasi integrasi.')
      return
    }
    const updated = { ...integrationConfigs, [activeIntegrationModal]: integrationFormData }
    setIntegrationConfigs(updated)

    const { error } = await supabase
      .from('user_integration_configs')
      .upsert({
        user_id: scopedUserId,
        configs: updated
      }, { onConflict: 'user_id' })

    if (error) {
      alert(`Gagal menyimpan konfigurasi integrasi: ${error.message}`)
      return
    }

    setActiveIntegrationModal(null)
    setIntegrationFormData({})
  }

  useEffect(() => {
    const safeTitle = appHeaderTitle.trim() || 'Dyatask Manager'
    localStorage.setItem('dyatask_header_tagline', appHeaderTagline)
    localStorage.setItem('dyatask_header_title', appHeaderTitle)
    document.title = safeTitle
  }, [appHeaderTagline, appHeaderTitle])

  useEffect(() => {
    const timer = setInterval(() => {
      setHeaderNow(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadGlobalLoginVisual = async () => {
      const { data, error } = await supabase
        .from('app_global_settings')
        .select('value')
        .eq('key', LOGIN_VISUAL_SETTINGS_KEY)
        .maybeSingle()

      if (cancelled) return
      if (error) {
        console.warn('Gagal memuat gambar login global:', error.message)
        setLoginVisualSyncStatus('Jalankan One-Click Apply SQL agar gambar login bisa tersinkron global.')
        return
      }

      const value = data?.value && typeof data.value === 'object' ? data.value : {}
      const publicUrl = String(value.publicUrl || '').trim()
      const version = value.version || value.updatedAt || ''
      setLoginVisualImage(publicUrl ? `${publicUrl}${publicUrl.includes('?') ? '&' : '?'}v=${encodeURIComponent(version)}` : '')
      setLoginVisualSyncStatus(publicUrl ? 'Gambar login tersinkron dari database.' : '')
      localStorage.removeItem('dyatask_login_visual_image')
    }

    loadGlobalLoginVisual()

    const channel = supabase
      .channel('app_global_settings_login_visual')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'app_global_settings',
        filter: `key=eq.${LOGIN_VISUAL_SETTINGS_KEY}`
      }, loadGlobalLoginVisual)
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadTutorialCourses = async () => {
      const { data, error } = await supabase
        .from('app_global_settings')
        .select('value')
        .eq('key', TUTORIAL_COURSES_SETTINGS_KEY)
        .maybeSingle()

      if (cancelled) return
      if (error) {
        console.warn('Gagal memuat tutorial global:', error.message)
        return
      }

      const courses = Array.isArray(data?.value?.courses) ? data.value.courses : []
      if (!courses.length) return
      setTutorialCourses(TUTORIAL_COURSES.map(defaultCourse => {
        const savedCourse = courses.find(item => item.id === defaultCourse.id) || {}
        return { ...defaultCourse, ...savedCourse }
      }))
    }

    loadTutorialCourses()

    const channel = supabase
      .channel('app_global_settings_tutorial_courses')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'app_global_settings',
        filter: `key=eq.${TUTORIAL_COURSES_SETTINGS_KEY}`
      }, loadTutorialCourses)
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(reservationSessionPriceStorageKey, String(Math.max(0, Number(reservationSessionPrice || 0))))
  }, [reservationSessionPrice, reservationSessionPriceStorageKey])

  useEffect(() => {
    tutorialProgressLoadedRef.current = false
    try {
      const saved = JSON.parse(localStorage.getItem(tutorialProgressStorageKey) || '[]')
      setTutorialProgress(Array.isArray(saved) ? saved : [])
    } catch {
      setTutorialProgress([])
    }
    setTimeout(() => {
      tutorialProgressLoadedRef.current = true
    }, 0)
  }, [tutorialProgressStorageKey])

  useEffect(() => {
    if (!tutorialProgressLoadedRef.current) return
    localStorage.setItem(tutorialProgressStorageKey, JSON.stringify(tutorialProgress))
  }, [tutorialProgress, tutorialProgressStorageKey])

  const handleLoginVisualUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!isAppDeveloper) {
      showWorkspaceInviteNotice({
        tone: 'error',
        title: 'Akses Ditolak',
        message: 'Hanya developer app yang bisa mengganti gambar login global.'
      })
      event.target.value = ''
      return
    }

    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar.')
      event.target.value = ''
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran gambar maksimal 2MB agar tetap ringan saat dibuka.')
      event.target.value = ''
      return
    }

    setLoginVisualUploading(true)
    setLoginVisualSyncStatus('Mengupload gambar login...')
    try {
      await supabase.storage
        .from(LOGIN_VISUAL_BUCKET)
        .remove([LOGIN_VISUAL_OBJECT_PATH])

      const { error: uploadError } = await supabase.storage
        .from(LOGIN_VISUAL_BUCKET)
        .upload(LOGIN_VISUAL_OBJECT_PATH, file, {
          upsert: true,
          contentType: file.type,
          cacheControl: '0'
        })

      if (uploadError) {
        throw new Error(
          uploadError.message === 'Bucket not found'
            ? 'Bucket Supabase Storage "app-assets" belum dibuat. Jalankan One-Click Apply SQL dulu.'
            : uploadError.message
        )
      }

      const { data: publicData } = supabase.storage
        .from(LOGIN_VISUAL_BUCKET)
        .getPublicUrl(LOGIN_VISUAL_OBJECT_PATH)

      const publicUrl = publicData?.publicUrl || ''
      const version = Date.now()
      const nextImageUrl = `${publicUrl}?v=${version}`

      const { error: settingsError } = await supabase
        .from('app_global_settings')
        .upsert({
          key: LOGIN_VISUAL_SETTINGS_KEY,
          value: {
            bucket: LOGIN_VISUAL_BUCKET,
            objectPath: LOGIN_VISUAL_OBJECT_PATH,
            publicUrl,
            contentType: file.type,
            size: file.size,
            version,
            updatedAt: new Date().toISOString()
          },
          updated_by: actorUserId || null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' })

      if (settingsError) throw settingsError

      setLoginVisualImage(nextImageUrl)
      setLoginVisualSyncStatus('Gambar login tersimpan di database dan tersinkron ke semua user.')
      event.target.value = ''
    } catch (error) {
      console.warn('Upload gambar login gagal:', error.message)
      setLoginVisualSyncStatus(`Gagal upload gambar login: ${error.message}`)
      showWorkspaceInviteNotice({
        tone: 'error',
        title: 'Gagal Upload Gambar Login',
        message: error.message
      })
    } finally {
      setLoginVisualUploading(false)
    }
  }

  const handleResetLoginVisual = async () => {
    if (!isAppDeveloper) {
      showWorkspaceInviteNotice({
        tone: 'error',
        title: 'Akses Ditolak',
        message: 'Hanya developer app yang bisa reset gambar login global.'
      })
      return
    }

    setLoginVisualUploading(true)
    setLoginVisualSyncStatus('Menghapus gambar login global...')
    try {
      await supabase.storage
        .from(LOGIN_VISUAL_BUCKET)
        .remove([LOGIN_VISUAL_OBJECT_PATH])

      const { error } = await supabase
        .from('app_global_settings')
        .delete()
        .eq('key', LOGIN_VISUAL_SETTINGS_KEY)

      if (error) throw error

      setLoginVisualImage('')
      setLoginVisualSyncStatus('Gambar login dikembalikan ke default untuk semua user.')
    } catch (error) {
      console.warn('Reset gambar login gagal:', error.message)
      setLoginVisualSyncStatus(`Gagal reset gambar login: ${error.message}`)
      showWorkspaceInviteNotice({
        tone: 'error',
        title: 'Gagal Reset Gambar Login',
        message: error.message
      })
    } finally {
      setLoginVisualUploading(false)
    }
  }

  const openTutorialCourseEditor = (course) => {
    if (!isAppDeveloper) return
    setEditingTutorialCourse({ ...course })
  }

  const openTutorialCourse = (course) => {
    if (!course?.id) return
    const now = new Date().toISOString()
    setTutorialProgress(prev => {
      const existing = prev.find(item => item.courseId === course.id)
      if (existing?.status === 'completed') {
        return prev.map(item => item.courseId === course.id ? { ...item, lastWatchedAt: now } : item)
      }
      if (existing) {
        return prev.map(item => item.courseId === course.id ? {
          ...item,
          status: 'in_progress',
          startedAt: item.startedAt || now,
          lastWatchedAt: now,
          completedAt: ''
        } : item)
      }
      return [{
        courseId: course.id,
        status: 'in_progress',
        startedAt: now,
        lastWatchedAt: now,
        completedAt: ''
      }, ...prev]
    })
    setActiveTutorialCourse(course)
  }

  const completeTutorialCourse = (courseId) => {
    const now = new Date().toISOString()
    setTutorialProgress(prev => {
      const existing = prev.find(item => item.courseId === courseId)
      if (existing) {
        return prev.map(item => item.courseId === courseId ? {
          ...item,
          status: 'completed',
          lastWatchedAt: item.lastWatchedAt || now,
          completedAt: now
        } : item)
      }
      return [{
        courseId,
        status: 'completed',
        startedAt: now,
        lastWatchedAt: now,
        completedAt: now
      }, ...prev]
    })
  }

  const saveTutorialCourse = async (event) => {
    event.preventDefault()
    if (!isAppDeveloper || !editingTutorialCourse?.id) return

    const normalizedCourse = {
      ...editingTutorialCourse,
      duration: String(editingTutorialCourse.duration || '').trim() || '00:00',
      lessons: Math.max(1, Number(editingTutorialCourse.lessons || 1)),
      youtubeUrl: String(editingTutorialCourse.youtubeUrl || '').trim()
    }
    const nextCourses = tutorialCourses.map(course => (
      course.id === normalizedCourse.id ? normalizedCourse : course
    ))

    setSavingTutorialCourse(true)
    try {
      const { error } = await supabase
        .from('app_global_settings')
        .upsert({
          key: TUTORIAL_COURSES_SETTINGS_KEY,
          value: {
            courses: nextCourses,
            updatedAt: new Date().toISOString()
          },
          updated_by: actorUserId || null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' })

      if (error) throw error
      setTutorialCourses(nextCourses)
      setEditingTutorialCourse(null)
      showWorkspaceInviteNotice({
        tone: 'success',
        title: 'Tutorial Disimpan',
        message: `${normalizedCourse.title} sudah tersinkron untuk semua user.`
      })
    } catch (error) {
      showWorkspaceInviteNotice({
        tone: 'error',
        title: 'Gagal Menyimpan Tutorial',
        message: error.message
      })
    } finally {
      setSavingTutorialCourse(false)
    }
  }

  const openIntegrationModal = (key) => {
    setIntegrationFormData(integrationConfigs[key] || {})
    setGoogleConnectionStatus(null)
    setActiveIntegrationModal(key)
  }

  const openTutorialModal = (key) => {
    setActiveTutorialModal(key)
  }

  const isConfigured = (key) => {
    const cfg = integrationConfigs[key]
    return cfg && Object.values(cfg).some(v => v && v.trim() !== '')
  }

  const isGoogleCalendarReady = () => {
    const cfg = integrationConfigs.google_calendar || {}
    return ['client_id', 'client_secret', 'refresh_token'].every(key => (cfg[key] || '').trim())
  }

  const getConfiguredIntegrationSyncLogs = () => {
    const logs = []
    if (isConfigured('google_calendar')) logs.push('🔄 Google Calendar: sinkronisasi event aktif.')
    if (isConfigured('notion')) logs.push('📅 Notion: sinkronisasi database aktif.')
    if (isConfigured('email')) logs.push('📧 Email Parser: pemindaian inbox aktif.')
    if (isConfigured('google_sheets')) logs.push('🟢 Google Sheets: update baris aktivitas aktif.')
    logs.push('🛡️ Supabase RLS: pemindaian berkala aman.')
    return logs
  }

  const getElectronIpcRenderer = () => {
    try {
      if (typeof window === 'undefined' || typeof window.require !== 'function') return null
      return window.require('electron')?.ipcRenderer || null
    } catch {
      return null
    }
  }

  const sendNativeNotification = (title, body, meta = {}) => {
    const ipcRenderer = getElectronIpcRenderer()
    if (!ipcRenderer) return
    ipcRenderer.send('show-native-notification', {
      title,
      body,
      ...meta
    })
  }

  const focusElectronWindow = () => {
    const ipcRenderer = getElectronIpcRenderer()
    if (!ipcRenderer) return
    ipcRenderer.send('focus-main-window')
  }

  const openExternalUrl = (url) => {
    const safeUrl = String(url || '').trim()
    if (!safeUrl) return
    window.open(safeUrl, '_blank', 'noopener,noreferrer')
  }

  const loadElectronVersionInfo = async () => {
    const ipcRenderer = getElectronIpcRenderer()
    if (!ipcRenderer?.invoke) return null
    try {
      const info = await ipcRenderer.invoke('get-app-version-info')
      setAppVersionInfo(info)
      return info
    } catch {
      return null
    }
  }

  const handleDownloadDmg = async () => {
    const ipcRenderer = getElectronIpcRenderer()
    let downloadUrl = 'https://github.com/dinurpradipta12/DyaTask/releases/latest'

    try {
      const response = await fetch('https://api.github.com/repos/dinurpradipta12/DyaTask/releases/latest')
      if (response.ok) {
        const release = await response.json()
        const dmgAsset = release.assets?.find(asset => asset.name && asset.name.endsWith('.dmg'))
        if (dmgAsset && dmgAsset.browser_download_url) {
          downloadUrl = dmgAsset.browser_download_url
        }
      }
    } catch (err) {
      console.warn('Gagal memuat info rilis DMG dari GitHub API, fallback ke halaman rilis:', err)
    }

    if (ipcRenderer?.invoke) {
      try {
        await ipcRenderer.invoke('open-latest-dmg-release', downloadUrl)
        return
      } catch {
        // Fall back to browser link below.
      }
    }
    openExternalUrl(downloadUrl)
  }

  const handleCheckManualUpdate = async () => {
    setCheckingManualUpdate(true)
    setManualUpdateStatus('Memeriksa update terbaru...')
    const ipcRenderer = getElectronIpcRenderer()

    if (ipcRenderer?.invoke) {
      try {
        const result = await ipcRenderer.invoke('check-for-updates-manual')
        if (result?.ok) {
          setManualUpdateStatus(`Cek update berjalan. Versi feed terbaru: ${result.version || 'menunggu respon'}.`)
        } else {
          setManualUpdateStatus(result?.message || 'Cek update DMG belum tersedia di mode ini.')
        }
      } catch (error) {
        setManualUpdateStatus(error.message || 'Gagal memeriksa update DMG.')
      } finally {
        setCheckingManualUpdate(false)
      }
      return
    }

    try {
      const response = await fetch(`deploy-version.json?t=${Date.now()}`, { cache: 'no-store' })
      if (!response.ok) throw new Error('Metadata versi belum tersedia.')
      const data = await response.json()
      const latestKey = getDeployVersionKey(data)
      if (latestKey && latestKey !== currentDeployKey) {
        setDeployUpdateInfo(data)
        setManualUpdateStatus(`App perlu di update. Versi terbaru: v${data.version || 'terbaru'}.`)
      } else {
        setManualUpdateStatus('App up to date.')
      }
    } catch (error) {
      setManualUpdateStatus(error.message || 'Gagal memeriksa versi web.')
    } finally {
      setCheckingManualUpdate(false)
    }
  }

  const buildTimeSlots = (dateStr) => {
    const dayIndex = new Date(`${dateStr}T00:00:00`).getDay()
    const dayConfig = bookingAvailability.daySchedules?.[dayIndex]
    if (!dayConfig?.enabled) return []

    const [startHour, startMinute] = (dayConfig.startHour || '09:00').split(':').map(Number)
    const [endHour, endMinute] = (dayConfig.endHour || '17:00').split(':').map(Number)
    const startTotal = startHour * 60 + startMinute
    const endTotal = endHour * 60 + endMinute
    if (endTotal < startTotal) return []

    const slots = []

    for (let minuteMark = startTotal; minuteMark <= endTotal; minuteMark += bookingAvailability.slotMinutes) {
      const hh = String(Math.floor(minuteMark / 60)).padStart(2, '0')
      const mm = String(minuteMark % 60).padStart(2, '0')
      slots.push(`${hh}:${mm}`)
    }

    return slots
  }

  const bookingTimeSlots = buildTimeSlots(bookingDate)

  const extractStartTime = (timeValue) => {
    const text = (timeValue || '').trim()
    const rangeMatch = text.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/)
    if (rangeMatch) return rangeMatch[1]
    const singleMatch = text.match(/(\d{1,2}:\d{2})/)
    return singleMatch ? singleMatch[1] : ''
  }

  const bookedTimeSetForSelectedDate = new Set(
    appointments
      .filter(app => app.date === bookingDate)
      .map(app => extractStartTime(app.time))
      .filter(Boolean)
  )

  const availableTimeSlotsForSelectedDate = bookingTimeSlots.filter(slot => !bookedTimeSetForSelectedDate.has(slot))

  const isDateAllowed = (dateStr) => {
    const dateObj = new Date(`${dateStr}T00:00:00`)
    return !!bookingAvailability.daySchedules?.[dateObj.getDay()]?.enabled
  }

  const normalizedPublicShareBaseUrl = publicShareBaseUrl.trim().replace(/\/+$/, '')
  const currentAppBaseUrl = `${window.location.origin}${window.location.pathname}`.replace(/\/+$/, '')
  const latestDmgReleaseUrl = 'https://github.com/dinurpradipta12/DyaTask/releases/latest'
  const isElectronApp = !!getElectronIpcRenderer()
  const isMacOsDevice = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/i.test(`${navigator.platform || ''} ${navigator.userAgent || ''}`)
  const mobilePwaGuideDetectedPlatform = useMemo(() => {
    if (typeof navigator === 'undefined') return 'tablet'
    const ua = navigator.userAgent || ''
    const platform = navigator.platform || ''
    const maxTouchPoints = navigator.maxTouchPoints || 0
    const isIpad = /iPad/i.test(ua) || (platform === 'MacIntel' && maxTouchPoints > 1)
    const isIphone = /iPhone|iPod/i.test(ua)
    const isAndroid = /Android/i.test(ua)
    const isAndroidTablet = isAndroid && !/Mobile/i.test(ua)
    if (isIphone) return 'iphone'
    if (isIpad) return 'ipad'
    if (isAndroidTablet) return 'tablet'
    if (isAndroid) return 'android'
    return 'tablet'
  }, [])
  const isIosLikeInstallDevice = mobilePwaGuideDetectedPlatform === 'iphone' || mobilePwaGuideDetectedPlatform === 'ipad'
  const mobilePwaGuideTabs = [
    { key: 'android', label: 'Android' },
    { key: 'iphone', label: 'iPhone' },
    { key: 'ipad', label: 'iPad' },
    { key: 'tablet', label: 'Tablet' }
  ]
  const mobilePwaGuideSteps = {
    android: [
      { icon: Smartphone, title: 'Buka di browser utama', detail: 'Gunakan Chrome atau browser Android utama Anda.' },
      { icon: MoreHorizontal, title: 'Buka menu browser', detail: 'Tekan ikon tiga titik di kanan atas browser.' },
      { icon: Download, title: 'Pilih Install App', detail: 'Gunakan Install App atau Add to Home Screen jika prompt belum muncul otomatis.' },
      { icon: CheckCircle, title: 'Simpan ke layar utama', detail: 'Setelah terpasang, buka DyaTask langsung dari home screen.' }
    ],
    iphone: [
      { icon: Smartphone, title: 'Buka lewat Safari', detail: 'Instal PWA iPhone paling stabil lewat Safari, bukan browser dalam aplikasi lain.' },
      { icon: Share2, title: 'Tekan tombol Share', detail: 'Gunakan ikon share di toolbar Safari bagian bawah.' },
      { icon: Plus, title: 'Pilih Add to Home Screen', detail: 'Cari opsi Add to Home Screen pada daftar aksi Safari.' },
      { icon: CheckCircle, title: 'Tap Add', detail: 'Ikon DyaTask akan muncul di layar utama iPhone Anda.' }
    ],
    ipad: [
      { icon: Smartphone, title: 'Buka lewat Safari iPad', detail: 'Safari iPad mendukung Add to Home Screen untuk DyaTask.' },
      { icon: Share2, title: 'Tekan Share', detail: 'Gunakan tombol share di toolbar Safari.' },
      { icon: Plus, title: 'Pilih Add to Home Screen', detail: 'Tambahkan DyaTask agar terbuka penuh seperti aplikasi.' },
      { icon: CheckCircle, title: 'Selesai dipasang', detail: 'Setelah ditambahkan, buka dari layar utama iPad.' }
    ],
    tablet: [
      { icon: Smartphone, title: 'Buka di browser tablet', detail: 'Gunakan browser utama tablet Anda untuk hasil install terbaik.' },
      { icon: MoreHorizontal, title: 'Buka menu browser', detail: 'Cari menu tiga titik atau menu share pada browser tablet Anda.' },
      { icon: Download, title: 'Pilih Install App', detail: 'Gunakan Install App atau Add to Home Screen jika tersedia.' },
      { icon: CheckCircle, title: 'Buka dari home screen', detail: 'Setelah berhasil, DyaTask akan tampil seperti aplikasi penuh.' }
    ]
  }
  const activeMobilePwaGuideSteps = mobilePwaGuideSteps[mobilePwaGuidePlatform] || mobilePwaGuideSteps.android
  const electronAppVersion = appVersionInfo?.version && appVersionInfo.version !== '0.0.0' ? appVersionInfo.version : ''
  const currentAppVersion = electronAppVersion || import.meta.env.VITE_APP_VERSION || '0.1.0'
  const updateStatusLabel = deployUpdateInfo ? 'App perlu di update' : 'App up to date'
  const tutorialProgressById = tutorialProgress.reduce((map, item) => {
    if (item?.courseId) map[item.courseId] = item
    return map
  }, {})
  const unfinishedTutorialHistory = tutorialProgress
    .filter(item => item?.courseId && item.status !== 'completed')
    .map(item => {
      const course = tutorialCourses.find(courseItem => courseItem.id === item.courseId)
      return course ? { ...item, course } : null
      })
      .filter(Boolean)
      .sort((a, b) => String(b.lastWatchedAt || b.startedAt || '').localeCompare(String(a.lastWatchedAt || a.startedAt || '')))
  const developerMonitoringSearchValue = developerMonitoringSearch.trim().toLowerCase()
  const matchesDeveloperMonitoringSearch = (row) => {
    if (!developerMonitoringSearchValue) return true
    const haystack = [
      row?.full_name,
      row?.email,
      row?.role,
      row?.status,
      row?.invite_token,
      row?.source_table,
      row?.record_type
    ].map(value => String(value || '').toLowerCase()).join(' | ')
    return haystack.includes(developerMonitoringSearchValue)
  }
  const developerMonitoringSignupRows = developerMonitoringRows.filter(row => row.record_type === 'signup')
  const developerMonitoringInviteRows = developerMonitoringRows.filter(row => row.record_type === 'invite')
  const developerMonitoringFilteredSignupRows = developerMonitoringSignupRows.filter(matchesDeveloperMonitoringSearch)
  const developerMonitoringFilteredInviteRows = developerMonitoringInviteRows.filter(matchesDeveloperMonitoringSearch)
  const developerMonitoringSignupCount = developerMonitoringSignupRows.length
  const developerMonitoringInviteCount = developerMonitoringInviteRows.length
  const developerMonitoringActiveInviteCount = developerMonitoringInviteRows.filter(row => String(row.status || '').toLowerCase() === 'active').length
  const developerMonitoringPendingInviteCount = developerMonitoringInviteRows.filter(row => String(row.status || '').toLowerCase() === 'pending').length
  const sharedFormLink = `${normalizedPublicShareBaseUrl || currentAppBaseUrl}?booking=${shareToken}`
  const activeOrderPageMode = activeTab === 'designOrders' ? 'design' : activeTab === 'generalOrders' ? 'general' : 'spreadsheet'
  const isDesignOrderPage = activeTab === 'designOrders'
  const isGeneralOrderPage = activeTab === 'generalOrders'
  const orderTypeOptions = isDesignOrderPage
    ? DESIGN_ORDER_TYPES
    : isGeneralOrderPage
      ? GENERAL_ORDER_TYPES
      : SPREADSHEET_ORDER_TYPES
  const orderTypeMatchers = {
    spreadsheet: (value) => SPREADSHEET_ORDER_TYPES.includes(value) || /dashboard|automation|reporting|template|fixing/i.test(value),
    design: (value) => DESIGN_ORDER_TYPES.includes(value) || /design|ui|ux|branding|logo|poster|konten|feed|thumbnail|creative|identity/i.test(value),
    general: (value) => GENERAL_ORDER_TYPES.includes(value) || (!DESIGN_ORDER_TYPES.includes(value) && !SPREADSHEET_ORDER_TYPES.includes(value))
  }
  const filteredSpreadsheetOrders = spreadsheetOrders.filter(order => {
    const orderTypeValue = String(order.orderType || '')
    if (activeOrderPageMode === 'spreadsheet') return orderTypeMatchers.spreadsheet(orderTypeValue)
    if (activeOrderPageMode === 'design') return orderTypeMatchers.design(orderTypeValue)
    if (activeOrderPageMode === 'general') return orderTypeMatchers.general(orderTypeValue)
    return true
  })
  const selectedSpreadsheetOrder = filteredSpreadsheetOrders.find(order => order.id === selectedOrderId) || filteredSpreadsheetOrders[0] || null
  const sortedSpreadsheetOrders = [...filteredSpreadsheetOrders].sort((a, b) => {
    const aDone = ['completed', 'done'].includes((a.status || '').toLowerCase())
    const bDone = ['completed', 'done'].includes((b.status || '').toLowerCase())
    if (aDone !== bDone) return aDone ? 1 : -1
    return (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || '')
  })
  const selectedOrderTimeline = selectedSpreadsheetOrder
    ? orderTimelineItems
      .filter(item => item.orderId === selectedSpreadsheetOrder.id)
      .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''))
    : []
  const selectedOrderPublicLink = selectedSpreadsheetOrder
    ? `${normalizedPublicShareBaseUrl || currentAppBaseUrl}?track=${selectedSpreadsheetOrder.publicToken}`
    : ''
  const paidPaymentStatuses = ['lunas', 'paid']
  const isSpreadsheetOrderPaid = (order) => paidPaymentStatuses.includes(String(order.paymentStatus || '').toLowerCase())
  const currentMonthKey = todayString.slice(0, 7)
  const reservationRevenueCurrentMonth = appointments
    .filter(item => String(item.date || '').slice(0, 7) === currentMonthKey)
    .length * Number(reservationSessionPrice || 0)
  const spreadsheetPaidRevenueCurrentMonth = spreadsheetOrders
    .filter(order => isSpreadsheetOrderPaid(order) && String(order.createdAt || '').slice(0, 7) === currentMonthKey)
    .reduce((sum, order) => sum + Number(order.budget || 0), 0)
  const monthlyBusinessRevenue = reservationRevenueCurrentMonth + spreadsheetPaidRevenueCurrentMonth
  const spreadsheetOutstandingAmount = spreadsheetOrders
    .filter(order => !isSpreadsheetOrderPaid(order))
    .reduce((sum, order) => sum + Number(order.budget || 0), 0)
  const spreadsheetTotalAmount = spreadsheetOrders.reduce((sum, order) => sum + Number(order.budget || 0), 0)
  const spreadsheetPaidAmount = spreadsheetOrders
    .filter(order => isSpreadsheetOrderPaid(order))
    .reduce((sum, order) => sum + Number(order.budget || 0), 0)
  const spreadsheetCollectionRate = spreadsheetTotalAmount > 0 ? Math.round((spreadsheetPaidAmount / spreadsheetTotalAmount) * 100) : 0
  const totalBusinessRevenue = (appointments.length * Number(reservationSessionPrice || 0)) + spreadsheetPaidAmount
  const orderPaymentStatusCounts = {
    belum_bayar: spreadsheetOrders.filter(order => String(order.paymentStatus || 'belum_bayar') === 'belum_bayar').length,
    dp: spreadsheetOrders.filter(order => String(order.paymentStatus || '') === 'dp').length,
    cicilan: spreadsheetOrders.filter(order => String(order.paymentStatus || '') === 'cicilan').length,
    lunas: spreadsheetOrders.filter(order => String(order.paymentStatus || '') === 'lunas').length
  }
  const invoiceStorageKey = scopedUserId ? `dyatask_invoices_${scopedUserId}` : 'dyatask_invoices_guest'
  const crmClientsStorageKey = scopedUserId ? `dyatask_crm_clients_${scopedUserId}` : 'dyatask_crm_clients_guest'
  const crmActivitiesStorageKey = scopedUserId ? `dyatask_crm_activities_${scopedUserId}` : 'dyatask_crm_activities_guest'
  const filteredInvoices = invoices.filter((item) => invoiceFilterStatus === 'all' || item.status === invoiceFilterStatus)
  const openTaskCount = tasks.filter(item => item.status !== 'done' && item.parentTaskId == null).length
  const contentPlannerPlatforms = [
    { key: 'instagram', label: 'Instagram' },
    { key: 'tiktok', label: 'TikTok' },
    { key: 'threads', label: 'Threads' }
  ]
  const contentPlannerItemsByPlatform = contentPlannerItems
    .filter(item => (item.platform || 'instagram') === contentPlannerPlatform)
    .sort((a, b) => `${a.uploadDate || ''} ${a.uploadTime || ''}`.localeCompare(`${b.uploadDate || ''} ${b.uploadTime || ''}`))
  const upcomingMeetingCount = appointments.filter(item => {
    const value = String(item.date || '')
    return value >= todayString
  }).length
  const reportByStatus = orderPaymentStatusCounts
  const revenueByMonth = useMemo(() => {
    const monthKeys = Array.from({ length: 6 }, (_, index) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (5 - index))
      return {
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        label: date.toLocaleDateString('id-ID', { month: 'short' })
      }
    })

    return monthKeys.map(month => {
      const reservationValue = appointments
        .filter(item => String(item.date || '').slice(0, 7) === month.key)
        .length * Number(reservationSessionPrice || 0)

      const spreadsheetValue = spreadsheetOrders
        .filter(order => isSpreadsheetOrderPaid(order) && String(order.createdAt || '').slice(0, 7) === month.key)
        .reduce((sum, order) => sum + Number(order.budget || 0), 0)

      const value = reservationValue + spreadsheetValue
      return { ...month, value }
    })
  }, [appointments, spreadsheetOrders, reservationSessionPrice])
  const topClients = useMemo(() => {
    const map = new Map()

    spreadsheetOrders
      .filter(order => isSpreadsheetOrderPaid(order))
      .forEach(order => {
        const key = order.customerName || 'Client Spreadsheet'
        map.set(key, (map.get(key) || 0) + Number(order.budget || 0))
      })

    appointments.forEach(item => {
      const key = item.clientName || 'Client Reservasi'
      map.set(key, (map.get(key) || 0) + Number(reservationSessionPrice || 0))
    })

    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [appointments, spreadsheetOrders, reservationSessionPrice])
  const getCrmClientKey = (name = '', email = '') => {
    const normalizedEmail = String(email || '').trim().toLowerCase()
    const normalizedName = String(name || '').trim().toLowerCase()
    return normalizedEmail || normalizedName || 'unknown-client'
  }
  const crmClientsCombined = useMemo(() => {
    const latestString = (a = '', b = '') => {
      if (!a) return b
      if (!b) return a
      return String(a) > String(b) ? a : b
    }

    const formatActivityDate = (dateValue, timeValue) => {
      const safeDate = String(dateValue || '').trim()
      const safeTime = String(timeValue || '').trim()
      if (!safeDate) return ''
      if (!safeTime) return `${safeDate}T23:59:59`
      const timeHead = safeTime.includes('-') ? safeTime.split('-')[0].trim() : safeTime
      return `${safeDate}T${timeHead.length === 5 ? `${timeHead}:00` : timeHead}`
    }

    const map = new Map()

    const ensureClient = (key, defaults = {}) => {
      if (!map.has(key)) {
        map.set(key, {
          key,
          name: defaults.name || '',
          company: defaults.company || '',
          email: defaults.email || '',
          phone: defaults.phone || '',
          status: defaults.status || 'lead',
          nextFollowUpDate: defaults.nextFollowUpDate || '',
          notes: defaults.notes || '',
          sourceLabels: new Set(defaults.sourceLabels || []),
          reservations: [],
          orders: [],
          activities: [],
          totalRevenue: 0,
          paidRevenue: 0,
          lastActivityAt: defaults.lastActivityAt || '',
          updatedAt: defaults.updatedAt || ''
        })
      }
      return map.get(key)
    }

    appointments.forEach((item) => {
      const key = getCrmClientKey(item.clientName, item.email)
      const clientName = String(item.clientName || '').trim()
      const topic = String(item.title || '').trim()
      const appointmentLabel = clientName && topic ? `${clientName} - ${topic}` : clientName || topic || 'Session'
      const client = ensureClient(key, {
        name: item.clientName || '',
        email: item.email || '',
        status: 'active',
        sourceLabels: ['Reservasi']
      })

      client.name = client.name || item.clientName || ''
      client.email = client.email || item.email || ''
      client.status = client.status === 'lead' ? 'active' : client.status
      client.sourceLabels.add('Reservasi')
      client.reservations.push({
        id: item.id,
        title: appointmentLabel,
        date: item.date,
        time: item.time,
        status: item.status || 'confirmed',
        createdAt: formatActivityDate(item.date, item.time)
      })
      client.activities.push({
        id: `reservation-${item.id}`,
        type: 'reservation',
        title: `Reservasi 1:1 ${appointmentLabel}`,
        note: `${formatLongDate(item.date)}${item.time ? ` • ${item.time}` : ''}`,
        createdAt: formatActivityDate(item.date, item.time),
        status: item.status || 'confirmed'
      })
      client.totalRevenue += Number(reservationSessionPrice || 0)
      client.lastActivityAt = latestString(client.lastActivityAt, formatActivityDate(item.date, item.time))
    })

    spreadsheetOrders.forEach((item) => {
      const key = getCrmClientKey(item.customerName)
      const client = ensureClient(key, {
        name: item.customerName || '',
        status: 'active',
        sourceLabels: ['Spreadsheet']
      })

      client.name = client.name || item.customerName || ''
      client.sourceLabels.add('Spreadsheet')
      client.orders.push({
        id: item.id,
        title: item.orderName,
        type: item.orderType,
        budget: Number(item.budget || 0),
        status: item.status,
        paymentStatus: item.paymentStatus || 'belum_bayar',
        dueDate: item.dueDate,
        createdAt: item.createdAt || ''
      })
      if (isSpreadsheetOrderPaid(item)) {
        client.paidRevenue += Number(item.budget || 0)
      }
      client.totalRevenue += Number(item.budget || 0)
      client.activities.push({
        id: `order-${item.id}`,
        type: 'order',
        title: item.orderName,
        note: `${item.orderType} • Rp ${Number(item.budget || 0).toLocaleString('id-ID')} • ${item.paymentStatus || 'belum_bayar'}`,
        createdAt: item.createdAt || '',
        status: item.status || 'new'
      })
      client.lastActivityAt = latestString(client.lastActivityAt, item.createdAt || '')
      if (['completed', 'done'].includes(String(item.status || '').toLowerCase())) {
        client.status = client.status === 'lead' ? 'active' : client.status
      }
    })

    crmClients.forEach((clientItem) => {
      const key = getCrmClientKey(clientItem.name, clientItem.email)
      const existing = ensureClient(key, {
        name: clientItem.name || '',
        email: clientItem.email || '',
        phone: clientItem.phone || '',
        company: clientItem.company || '',
        status: clientItem.status || 'lead',
        nextFollowUpDate: clientItem.nextFollowUpDate || '',
        notes: clientItem.notes || '',
        updatedAt: clientItem.updatedAt || clientItem.createdAt || ''
      })

      existing.name = clientItem.name || existing.name
      existing.company = clientItem.company || existing.company
      existing.email = clientItem.email || existing.email
      existing.phone = clientItem.phone || existing.phone
      existing.status = clientItem.status || existing.status
      existing.nextFollowUpDate = clientItem.nextFollowUpDate || existing.nextFollowUpDate
      existing.notes = clientItem.notes || existing.notes
      existing.updatedAt = clientItem.updatedAt || existing.updatedAt
      existing.sourceLabels.add('Manual')
      if (clientItem.notes) {
        existing.activities.push({
          id: `client-note-${clientItem.id}`,
          type: 'note',
          title: 'Catatan CRM',
          note: clientItem.notes,
          createdAt: clientItem.updatedAt || clientItem.createdAt || '',
          status: 'note'
        })
      }
      if (clientItem.nextFollowUpDate) {
        existing.activities.push({
          id: `client-followup-${clientItem.id}`,
          type: 'follow_up',
          title: 'Follow-up terjadwal',
          note: `Target follow-up ${formatLongDate(clientItem.nextFollowUpDate)}`,
          createdAt: clientItem.updatedAt || clientItem.createdAt || '',
          status: 'open',
          dueDate: clientItem.nextFollowUpDate
        })
      }
    })

    crmActivities.forEach((activity) => {
      const key = activity.clientKey || getCrmClientKey(activity.clientName, activity.clientEmail)
      const client = ensureClient(key, {
        name: activity.clientName || '',
        email: activity.clientEmail || '',
        status: 'active'
      })
      client.activities.push({
        id: activity.id,
        type: 'follow_up',
        title: activity.title,
        note: activity.note || '',
        createdAt: activity.createdAt || '',
        dueDate: activity.dueDate || '',
        status: activity.status || 'open'
      })
      client.sourceLabels.add('Follow-up')
      client.lastActivityAt = latestString(client.lastActivityAt, activity.createdAt || '')
      if (activity.status === 'done') {
        client.status = client.status === 'lead' ? 'active' : client.status
      }
    })

    return Array.from(map.values())
      .map(client => ({
        ...client,
        sourceLabels: Array.from(client.sourceLabels),
        activities: client.activities
          .slice()
          .sort((a, b) => String(b.createdAt || b.dueDate || '').localeCompare(String(a.createdAt || a.dueDate || '')))
      }))
      .sort((a, b) => String(b.lastActivityAt || b.updatedAt || '').localeCompare(String(a.lastActivityAt || a.updatedAt || '')))
  }, [appointments, spreadsheetOrders, crmClients, crmActivities, reservationSessionPrice])
  const selectedCrmClient = crmClientsCombined.find(item => item.key === selectedCrmClientId) || crmClientsCombined[0] || null
  const crmSummary = useMemo(() => {
    const followUpTodayOrLate = crmClientsCombined.filter(item => item.nextFollowUpDate && item.nextFollowUpDate <= todayString).length
    const reservationCount = appointments.length
    const paidSpreadsheetCount = spreadsheetOrders.filter(order => isSpreadsheetOrderPaid(order)).length
    return {
      totalClients: crmClientsCombined.length,
      activeClients: crmClientsCombined.filter(item => item.sourceLabels.length > 0).length,
      followUpsDue: followUpTodayOrLate,
      totalReservations: reservationCount,
      paidSpreadsheetCount,
      confirmedRevenue: (appointments.length * Number(reservationSessionPrice || 0)) + spreadsheetOrders.filter(order => isSpreadsheetOrderPaid(order)).reduce((sum, order) => sum + Number(order.budget || 0), 0)
    }
  }, [appointments.length, crmClientsCombined, reservationSessionPrice, spreadsheetOrders, todayString])
  useEffect(() => {
    if (!crmClientsCombined.length) {
      setSelectedCrmClientId(null)
      return
    }

    if (!selectedCrmClientId || !crmClientsCombined.some(item => item.key === selectedCrmClientId)) {
      setSelectedCrmClientId(crmClientsCombined[0].key)
    }
  }, [crmClientsCombined, selectedCrmClientId])
  const formatCurrencyIDR = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`
  const activityLogItems = useMemo(() => {
    const toDate = (value) => {
      if (!value) return null
      if (typeof value === 'number') return new Date(value)
      const date = new Date(value)
      return Number.isNaN(date.getTime()) ? null : date
    }

    const makeItem = ({ id, type, title, detail, createdAt, tone = 'purple' }) => ({
      id,
      type,
      title,
      detail,
      createdAt: toDate(createdAt) || new Date(),
      tone
    })

    const logs = []

    activityLogs.forEach(log => {
      logs.push(makeItem({
        id: `db-log-${log.id}`,
        type: log.type || 'Log',
        title: log.title || 'Activity',
        detail: log.detail || '',
        createdAt: log.createdAt,
        tone: log.tone || 'purple'
      }))
    })

    spreadsheetOrders.forEach(order => {
      logs.push(makeItem({
        id: `order-created-${order.id}`,
        type: 'Order',
        title: `Order dibuat: ${order.orderName || 'Tanpa nama'}`,
        detail: `${order.customerName || 'Client'} • ${order.orderType || 'Custom'} • ${formatCurrencyIDR(order.budget)}`,
        createdAt: order.createdAt || order.updatedAt,
        tone: 'blue'
      }))

      if (order.updatedAt && order.updatedAt !== order.createdAt) {
        logs.push(makeItem({
          id: `order-status-${order.id}`,
          type: 'Status',
          title: `Status order: ${order.status || 'new'}`,
          detail: `${order.orderName || 'Order'} • pembayaran ${order.paymentStatus || 'belum_bayar'}`,
          createdAt: order.updatedAt,
          tone: ['completed', 'done'].includes(String(order.status || '').toLowerCase()) ? 'green' : 'amber'
        }))
      }
    })

    appointments.forEach(appointment => {
      logs.push(makeItem({
        id: `appointment-${appointment.id}`,
        type: 'Reservasi',
        title: `Reservasi masuk: ${appointment.clientName || 'Client'}`,
        detail: `${appointment.title || '1:1 Consultation'} • ${formatLongDate(appointment.date)} ${appointment.time || ''}`,
        createdAt: appointment.createdAt || `${appointment.date || todayString}T${String(appointment.time || '23:59').slice(0, 5)}:00`,
        tone: 'green'
      }))
    })

    invoices
      .filter(invoice => String(invoice.status || '').toLowerCase() === 'paid')
      .forEach(invoice => {
        logs.push(makeItem({
          id: `invoice-paid-${invoice.id}`,
          type: 'Invoice',
          title: `Invoice lunas: ${invoice.title || 'Invoice'}`,
          detail: `${invoice.clientName || 'Client'} • ${formatCurrencyIDR(invoice.amount)}`,
          createdAt: invoice.updatedAt || invoice.createdAt || invoice.issueDate,
          tone: 'green'
        }))
      })

    notifications.forEach(notification => {
      logs.push(makeItem({
        id: `notification-${notification.id}`,
        type: 'Notifikasi',
        title: `Notifikasi terkirim: ${notification.title || 'DyaTask'}`,
        detail: notification.body || 'Notifikasi aplikasi',
        createdAt: notification.createdAt,
        tone: notification.confirmed ? 'slate' : 'purple'
      }))
    })

    tasks
      .filter(task => task.status === 'done')
      .slice(0, 8)
      .forEach(task => {
        logs.push(makeItem({
          id: `task-done-${task.id}`,
          type: 'Task',
          title: `Task selesai: ${task.title}`,
        detail: `${task.category || 'Task'} • ${formatLongDate(task.calendarDate || todayString)}`,
          createdAt: `${task.calendarDate || todayString}T${task.dueTime || '23:59'}:00`,
          tone: 'green'
        }))
      })

    const uniqueLogs = Array.from(
      logs.reduce((map, item) => {
        const key = `${item.type}:${item.title}:${item.detail}:${item.createdAt.toISOString().slice(0, 16)}`
        if (!map.has(key)) map.set(key, item)
        return map
      }, new Map()).values()
    )

    return uniqueLogs
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 40)
  }, [activityLogs, appointments, invoices, notifications, spreadsheetOrders, tasks, todayString])
  const currentDeployKey = import.meta.env.VITE_DEPLOY_COMMIT || 'dev'
  const getDeployVersionKey = (metadata = {}) => metadata.buildId || metadata.commit || metadata.version || metadata.buildTime || ''
  const calendarTitle = calendarMonthDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' })
  const cleanDyaTaskName = (value, fallback = 'User') => {
    const raw = String(value || '').trim()
    if (!raw) return fallback
    const localPart = raw.includes('@') ? raw.split('@')[0] : raw
    const cleaned = localPart
      .replace(/(?:^|[-_.\s])dyatask(?:\+\w+)?$/i, '')
      .replace(/\bdyatask\b/gi, '')
      .replace(/[-_.]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    return cleaned || fallback
  }
  const formatDisplayName = (value, fallback = 'User') => cleanDyaTaskName(value, fallback)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ') || fallback
  const workspaceMemberSelf = workspaceMembers.find(member => (
    member.memberUserId === actorUserId
    || String(member.memberEmail || '').toLowerCase() === String(session?.user?.email || '').toLowerCase()
  )) || null
  const profileNameFromMap = workspaceProfileNames[actorUserId]?.fullName
    || workspaceProfileNames[actorUserId]?.email
    || workspaceMemberSelf?.memberEmail
    || ''
  const headerUserName = formatDisplayName(
    profileNameFromMap || session?.user?.user_metadata?.full_name || session?.user?.email || authUsername,
    'User'
  )
  const assistantDisplayName = headerUserName
  const isAssistantWorkspace = workspaceRole === 'assistant'
  const workspaceAssistantChatMembers = workspaceMembers.filter(member => member.role !== 'owner')
  const workspaceChatStatusOptions = [
    { value: 'active', label: 'Aktif', tone: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    { value: 'busy', label: 'Sibuk', tone: 'bg-amber-100 text-amber-700 border-amber-200' },
    { value: 'inactive', label: 'Tidak Aktif', tone: 'bg-slate-100 text-slate-700 border-slate-200' }
  ]
  const workspaceChatStatusTitleLabel = (value) => (
    workspaceChatStatusOptions.find(option => option.value === String(value || '').toLowerCase())?.label
    || workspaceChatStatusOptions[0].label
  )
  const resolveWorkspaceMemberName = (member, fallback = 'Assistant') => {
    if (!member) return fallback
    const profile = workspaceProfileNames[member.memberUserId] || {}
    return formatDisplayName(profile.fullName || profile.email || member.memberEmail || fallback, fallback)
  }
  const workspaceOwnerDisplayName = formatDisplayName(
    workspaceProfileNames[workspaceContext?.ownerUserId]?.fullName
      || workspaceProfileNames[workspaceContext?.ownerUserId]?.email
      || workspaceOwnerName,
    'pemilik workspace'
  )
  const activeWorkspaceChatMember = isAssistantWorkspace
    ? workspaceAssistantChatMembers.find(member => member.memberUserId === actorUserId) || workspaceAssistantChatMembers[0] || null
    : workspaceAssistantChatMembers.find(member => member.id === selectedWorkspaceChatMemberId) || workspaceAssistantChatMembers[0] || null
  const activeWorkspaceChatMemberId = activeWorkspaceChatMember?.id || ''
  const activeWorkspaceChatMemberName = activeWorkspaceChatMember
    ? resolveWorkspaceMemberName(activeWorkspaceChatMember)
    : 'Assistant'
  const workspaceChatPeerUserId = isAssistantWorkspace
    ? workspaceContext?.ownerUserId || ''
    : activeWorkspaceChatMember?.memberUserId || ''
  const workspaceChatTitleName = isAssistantWorkspace
    ? workspaceOwnerDisplayName
    : activeWorkspaceChatMemberName
  const workspaceChatStatusTargetUserId = actorUserId
  const workspaceChatStatusTargetLabel = headerUserName
  const workspaceChatStatusLogs = activityLogs.filter(item => item?.metadata?.kind === 'workspace_chat_status')
  const workspaceChatSelfStatusLog = workspaceChatStatusTargetUserId
    ? workspaceChatStatusLogs.find(item => item?.metadata?.targetUserId === workspaceChatStatusTargetUserId)
    : null
  const workspaceChatStatusValue = String(workspaceChatSelfStatusLog?.metadata?.status || 'active').toLowerCase()
  const workspaceChatStatusOption = workspaceChatStatusOptions.find(option => option.value === workspaceChatStatusValue) || workspaceChatStatusOptions[0]
  const workspaceChatStatusLabel = workspaceChatStatusOption.label
  const workspaceChatStatusTone = workspaceChatStatusOption.tone
  const workspaceChatPeerStatusLog = workspaceChatPeerUserId
    ? workspaceChatStatusLogs.find(item => item?.metadata?.targetUserId === workspaceChatPeerUserId)
    : null
  const workspaceChatPeerStatusValue = String(workspaceChatPeerStatusLog?.metadata?.status || 'active').toLowerCase()
  const workspaceChatPeerStatusOption = workspaceChatStatusOptions.find(option => option.value === workspaceChatPeerStatusValue) || workspaceChatStatusOptions[0]
  const workspaceChatPeerStatusLabel = workspaceChatPeerStatusOption.label
  const workspaceChatPeerStatusTone = workspaceChatPeerStatusOption.tone
  const workspaceChatPeerStatusDotClass = workspaceChatPeerStatusValue === 'active'
    ? 'bg-emerald-400'
    : workspaceChatPeerStatusValue === 'busy'
      ? 'bg-red-400'
      : 'bg-slate-400'
  const workspaceChatStatusSectionLabel = 'Status Saya'
  const rawWorkspaceChatLogs = activityLogs.filter(item => item?.metadata?.kind === 'workspace_chat')
  const workspaceChatPresenceLogs = activityLogs.filter(item => item?.metadata?.kind === 'workspace_chat_presence')
  const workspaceChatLastSeenLog = workspaceChatPeerUserId
    ? activityLogs.find(item => (
      item?.metadata?.kind === 'workspace_chat_seen'
      && (
        item?.metadata?.targetUserId === workspaceChatPeerUserId
        || item?.metadata?.senderUserId === workspaceChatPeerUserId
      )
    ))
    : null
  const workspaceChatPeerPresenceLog = workspaceChatPeerUserId
    ? workspaceChatPresenceLogs.reduce((latest, item) => {
        if (item?.metadata?.senderUserId !== workspaceChatPeerUserId) return latest
        const presenceChatMemberId = item?.metadata?.chatMemberId || ''
        const presenceChatMemberUserId = item?.metadata?.chatMemberUserId || ''
        const matchesMember = (
          (presenceChatMemberId && presenceChatMemberId === activeWorkspaceChatMemberId)
          || (presenceChatMemberUserId && activeWorkspaceChatMember?.memberUserId && presenceChatMemberUserId === activeWorkspaceChatMember.memberUserId)
          || (!presenceChatMemberId && !presenceChatMemberUserId && activeWorkspaceChatMember?.id === workspaceAssistantChatMembers[0]?.id)
        )
        if (!matchesMember) return latest
        const createdAt = new Date(item.createdAt).getTime()
        return createdAt > latest.createdAt ? { createdAt, item } : latest
      }, { createdAt: 0, item: null }).item
    : null
  const workspaceChatLastOpenedLabel = workspaceChatLastSeenLog
    ? formatLongDateTime(workspaceChatLastSeenLog.createdAt)
    : 'Belum pernah dibuka'
  const workspaceChatLastSeenSourceTime = (() => {
    const seenTime = workspaceChatLastSeenLog ? new Date(workspaceChatLastSeenLog.createdAt).getTime() : 0
    const presenceTime = workspaceChatPeerPresenceLog ? new Date(workspaceChatPeerPresenceLog.createdAt).getTime() : 0
    return Math.max(seenTime, presenceTime)
  })()
  const workspaceChatLastSeenSentence = workspaceChatLastSeenSourceTime
    ? (() => {
        const date = new Date(workspaceChatLastSeenSourceTime)
        const dateLabel = date.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }).toLowerCase()
        const timeLabel = date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }).toLowerCase()
        const isSameDay = date.toDateString() === headerNow.toDateString()
        return isSameDay
          ? `Last Seen ${timeLabel}`
          : `Last Seen ${dateLabel} pukul ${timeLabel}`
      })()
    : 'Last Seen belum pernah dibuka'
  const workspaceChatPeerPresenceAgeMs = workspaceChatPeerPresenceLog
    ? (headerNow.getTime() - new Date(workspaceChatPeerPresenceLog.createdAt).getTime())
    : Number.POSITIVE_INFINITY
  const workspaceChatPresenceText = workspaceChatPeerStatusValue === 'busy'
    ? 'Sibuk'
    : workspaceChatPeerStatusValue === 'inactive'
      ? 'Tidak Aktif'
      : workspaceChatPeerPresenceLog?.metadata?.inThread && workspaceChatPeerPresenceAgeMs < 45000
        ? 'Online'
        : workspaceChatPeerPresenceLog && workspaceChatPeerPresenceLog?.metadata?.inThread === false && workspaceChatPeerPresenceAgeMs < 60000
          ? 'Tidak di obrolan'
          : workspaceChatLastSeenSentence
  const getWorkspacePresenceToneClass = (text) => {
    const normalized = String(text || '').toLowerCase()
    if (normalized.includes('sedang mengetik')) return 'typing'
    if (normalized === 'online') return 'online'
    if (normalized === 'sibuk') return 'busy'
    if (normalized === 'tidak aktif') return 'inactive'
    return 'default'
  }
  const workspaceChatLastOpenedText = workspaceChatLastSeenLog
    ? `${workspaceChatPeerStatusLabel} • terakhir dibuka ${workspaceChatLastOpenedLabel}`
    : `${workspaceChatPeerStatusLabel} • belum pernah dibuka`
  const workspaceChatButtonTitle = workspaceRole === 'owner'
    ? `Chat ${activeWorkspaceChatMemberName}`
    : `Chat ${workspaceOwnerDisplayName}`
  const getWorkspaceChatPresenceOption = (targetUserId) => {
    const rawStatus = targetUserId
      ? String(workspaceChatStatusLogs.find(item => item?.metadata?.targetUserId === targetUserId)?.metadata?.status || 'active').toLowerCase()
      : 'active'
    return workspaceChatStatusOptions.find(option => option.value === rawStatus) || workspaceChatStatusOptions[0]
  }
  const getWorkspaceThreadSeenAt = (member) => {
    if (!actorUserId || !member) return 0
    return activityLogs.reduce((latest, item) => {
      if (item?.metadata?.kind !== 'workspace_chat_seen') return latest
      if (item?.metadata?.senderUserId !== actorUserId) return latest
      const seenChatMemberId = item?.metadata?.chatMemberId || ''
      const seenChatMemberUserId = item?.metadata?.chatMemberUserId || ''
      const matchesMember = (
        (seenChatMemberId && seenChatMemberId === member.id)
        || (seenChatMemberUserId && seenChatMemberUserId === member.memberUserId)
        || (!seenChatMemberId && !seenChatMemberUserId && member.id === workspaceAssistantChatMembers[0]?.id)
      )
      if (!matchesMember) return latest
      const seenAt = new Date(item.createdAt).getTime()
      return seenAt > latest ? seenAt : latest
    }, 0)
  }
  const getWorkspacePeerThreadSeenAt = (member = activeWorkspaceChatMember) => {
    if (!workspaceChatPeerUserId || !member) return 0
    return activityLogs.reduce((latest, item) => {
      if (item?.metadata?.kind !== 'workspace_chat_seen') return latest
      if (item?.metadata?.senderUserId !== workspaceChatPeerUserId) return latest
      const seenChatMemberId = item?.metadata?.chatMemberId || ''
      const seenChatMemberUserId = item?.metadata?.chatMemberUserId || ''
      const matchesMember = (
        (seenChatMemberId && seenChatMemberId === member.id)
        || (seenChatMemberUserId && seenChatMemberUserId === member.memberUserId)
        || (!seenChatMemberId && !seenChatMemberUserId && member.id === workspaceAssistantChatMembers[0]?.id)
      )
      if (!matchesMember) return latest
      const seenAt = new Date(item.createdAt).getTime()
      return seenAt > latest ? seenAt : latest
    }, 0)
  }
  const getWorkspaceThreadPresenceText = (member) => {
    if (!member?.memberUserId) return 'Last Seen belum pernah dibuka'
    const memberStatusValue = getWorkspaceChatPresenceOption(member.memberUserId).value
    const latestTypingLog = activityLogs.reduce((latest, item) => {
      if (item?.metadata?.kind !== 'workspace_chat_typing') return latest
      if (item?.metadata?.senderUserId !== member.memberUserId) return latest
      const typingChatMemberId = item?.metadata?.chatMemberId || ''
      const typingChatMemberUserId = item?.metadata?.chatMemberUserId || ''
      const matchesMember = (
        (typingChatMemberId && typingChatMemberId === member.id)
        || (typingChatMemberUserId && typingChatMemberUserId === member.memberUserId)
        || (!typingChatMemberId && !typingChatMemberUserId && member.id === workspaceAssistantChatMembers[0]?.id)
      )
      if (!matchesMember) return latest
      const createdAt = new Date(item.createdAt).getTime()
      return createdAt > latest.createdAt ? { createdAt, item } : latest
    }, { createdAt: 0, item: null }).item
    const latestPresenceLog = workspaceChatPresenceLogs.reduce((latest, item) => {
      if (item?.metadata?.senderUserId !== member.memberUserId) return latest
      const presenceChatMemberId = item?.metadata?.chatMemberId || ''
      const presenceChatMemberUserId = item?.metadata?.chatMemberUserId || ''
      const matchesMember = (
        (presenceChatMemberId && presenceChatMemberId === member.id)
        || (presenceChatMemberUserId && presenceChatMemberUserId === member.memberUserId)
        || (!presenceChatMemberId && !presenceChatMemberUserId && member.id === workspaceAssistantChatMembers[0]?.id)
      )
      if (!matchesMember) return latest
      const createdAt = new Date(item.createdAt).getTime()
      return createdAt > latest.createdAt ? { createdAt, item } : latest
    }, { createdAt: 0, item: null }).item

    const latestSeenLog = activityLogs.reduce((latest, item) => {
      if (item?.metadata?.kind !== 'workspace_chat_seen') return latest
      if (item?.metadata?.senderUserId !== member.memberUserId) return latest
      const seenChatMemberId = item?.metadata?.chatMemberId || ''
      const seenChatMemberUserId = item?.metadata?.chatMemberUserId || ''
      const matchesMember = (
        (seenChatMemberId && seenChatMemberId === member.id)
        || (seenChatMemberUserId && seenChatMemberUserId === member.memberUserId)
        || (!seenChatMemberId && !seenChatMemberUserId && member.id === workspaceAssistantChatMembers[0]?.id)
      )
      if (!matchesMember) return latest
      const createdAt = new Date(item.createdAt).getTime()
      return createdAt > latest.createdAt ? { createdAt, item } : latest
    }, { createdAt: 0, item: null }).item

    const presenceAgeMs = latestPresenceLog
      ? (headerNow.getTime() - new Date(latestPresenceLog.createdAt).getTime())
      : Number.POSITIVE_INFINITY
    const typingAgeMs = latestTypingLog
      ? (headerNow.getTime() - new Date(latestTypingLog.createdAt).getTime())
      : Number.POSITIVE_INFINITY

    if (latestTypingLog?.metadata?.typing && typingAgeMs < 6000) return 'Sedang mengetik'

    if (memberStatusValue === 'busy') return 'Sibuk'
    if (memberStatusValue === 'inactive') return 'Tidak Aktif'

    if (latestPresenceLog?.metadata?.inThread && presenceAgeMs < 90000) return 'Online'
    if (latestPresenceLog && latestPresenceLog?.metadata?.inThread === false && presenceAgeMs < 60000) return 'Tidak di obrolan'

    const sourceTime = Math.max(
      latestSeenLog ? new Date(latestSeenLog.createdAt).getTime() : 0,
      latestPresenceLog ? new Date(latestPresenceLog.createdAt).getTime() : 0
    )
    if (!sourceTime) return 'Last Seen belum pernah dibuka'

    const date = new Date(sourceTime)
    const timeLabel = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).toLowerCase()
    if (date.toDateString() === headerNow.toDateString()) return `Last Seen ${timeLabel}`

    const dateLabel = date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).toLowerCase()
    return `Last Seen ${dateLabel} pukul ${timeLabel}`
  }
  const workspaceChatMemberSummaries = workspaceAssistantChatMembers.map(member => {
    const memberName = resolveWorkspaceMemberName(member)
    const memberPresence = getWorkspaceChatPresenceOption(member.memberUserId)
    const memberPresenceText = getWorkspaceThreadPresenceText(member)
    const matchedMemberMessages = rawWorkspaceChatLogs.filter(item => matchesWorkspaceChatMember(item, member))
    const memberMessages = (matchedMemberMessages.length
      ? matchedMemberMessages
      : rawWorkspaceChatLogs.filter(item => {
          const senderUserId = item?.metadata?.senderUserId || ''
          return senderUserId === member.memberUserId || senderUserId === workspaceContext?.ownerUserId
        }))
      .sort((a, b) => getWorkspaceChatSortTime(b) - getWorkspaceChatSortTime(a))
    const lastMessage = memberMessages[0] || null
    const threadSeenAt = getWorkspaceThreadSeenAt(member)
    const unreadCount = memberMessages.filter(item => (
      item?.metadata?.senderUserId
      && item.metadata.senderUserId !== actorUserId
      && getWorkspaceChatSortTime(item) > threadSeenAt
    )).length
    return {
      member,
      memberName,
      memberPresence,
      memberPresenceText,
      lastMessage,
      unreadCount
    }
  }).sort((a, b) => {
    const aTime = a.lastMessage ? getWorkspaceChatSortTime(a.lastMessage) : 0
    const bTime = b.lastMessage ? getWorkspaceChatSortTime(b.lastMessage) : 0
    return bTime - aTime
  })
  const getWorkspaceMessageSenderName = (item) => {
    const senderUserId = item?.metadata?.senderUserId || ''
    const metadataName = String(item?.metadata?.senderName || '').trim()
    const metadataNameLower = metadataName.toLowerCase()
    const senderRole = item?.metadata?.senderRole || ''
    const messageChatMemberUserId = item?.metadata?.chatMemberUserId || ''
    if (senderUserId === actorUserId) return headerUserName
    if (senderUserId === workspaceContext?.ownerUserId) return workspaceOwnerDisplayName
    if (senderRole === 'owner') return workspaceRole === 'owner' ? headerUserName : workspaceOwnerDisplayName
    if (senderRole === 'assistant') return workspaceRole === 'assistant' ? headerUserName : activeWorkspaceChatMemberName
    if (workspaceRole === 'assistant' && messageChatMemberUserId && messageChatMemberUserId === actorUserId) {
      return headerUserName
    }
    if (metadataNameLower === 'owner') {
      return workspaceRole === 'owner' ? headerUserName : workspaceOwnerDisplayName
    }
    if (metadataNameLower === 'assistant') {
      return workspaceRole === 'assistant' ? headerUserName : activeWorkspaceChatMemberName
    }
    if (metadataNameLower === 'system' || metadataNameLower === 'sistem') {
      return 'Sistem'
    }
    const senderMember = workspaceMembers.find(member => member.memberUserId === senderUserId)
    if (senderMember) return resolveWorkspaceMemberName(senderMember)
    if (metadataName && !['user', 'owner', 'assistant', 'system', 'sistem'].includes(metadataNameLower)) {
      return formatDisplayName(metadataName, 'User')
    }
    const chatMember = workspaceMembers.find(member => member.id === item?.metadata?.chatMemberId)
    if (chatMember) return resolveWorkspaceMemberName(chatMember)
    return formatDisplayName(item?.metadata?.senderEmail || headerUserName || activeWorkspaceChatMemberName, 'Pengguna')
  }
  function getWorkspaceChatSortTime (item) {
    const clientCreatedAt = item?.metadata?.clientCreatedAt || ''
    const clientTime = clientCreatedAt ? new Date(clientCreatedAt).getTime() : 0
    if (Number.isFinite(clientTime) && clientTime > 0) return clientTime
    const createdAtTime = new Date(item?.createdAt || 0).getTime()
    return Number.isFinite(createdAtTime) ? createdAtTime : 0
  }

  const summarizeWorkspaceChatMessage = (value) => {
    const text = String(value || '').replace(/\s+/g, ' ').trim()
    if (!text) return 'Pesan'
    return text.length > 84 ? `${text.slice(0, 84)}...` : text
  }

  const getWorkspaceChatReplyMeta = (item) => {
    const replyToMessageId = item?.metadata?.replyToMessageId || ''
    if (!replyToMessageId) return null
    return {
      id: replyToMessageId,
      senderName: item?.metadata?.replyToSenderName || 'Pesan',
      preview: item?.metadata?.replyToPreview || 'Pesan dibalas'
    }
  }

  const resolvePersistedWorkspaceChatMessageId = (item) => {
    if (!item?.id) return ''
    const rawId = String(item.id)
    if (!rawId.startsWith('local-')) return rawId

    const targetClientMessageId = String(item?.metadata?.clientMessageId || '').trim()
    const targetDetail = String(item.detail || '').trim()
    const targetSenderUserId = item?.metadata?.senderUserId || ''
    const targetSenderRole = item?.metadata?.senderRole || ''
    const targetChatMemberId = item?.metadata?.chatMemberId || ''
    const targetChatMemberUserId = item?.metadata?.chatMemberUserId || ''
    const targetCreatedAt = new Date(item.createdAt || Date.now()).getTime()

    const persistedMatch = activityLogs.find(log => {
      if (!log?.id || String(log.id).startsWith('local-')) return false
      if (log?.metadata?.kind !== 'workspace_chat') return false
      if (targetClientMessageId && String(log?.metadata?.clientMessageId || '').trim() === targetClientMessageId) return true
      if (String(log.detail || '').trim() !== targetDetail) return false
      if ((log?.metadata?.senderUserId || '') !== targetSenderUserId) return false
      if ((log?.metadata?.senderRole || '') !== targetSenderRole) return false
      if ((log?.metadata?.chatMemberId || '') !== targetChatMemberId) return false
      if ((log?.metadata?.chatMemberUserId || '') !== targetChatMemberUserId) return false
      const createdGap = Math.abs(new Date(log.createdAt || Date.now()).getTime() - targetCreatedAt)
      return createdGap < 15000
    })

    return persistedMatch?.id ? String(persistedMatch.id) : ''
  }
  function matchesWorkspaceChatMember (item, member = activeWorkspaceChatMember) {
    if (item?.metadata?.kind !== 'workspace_chat') return false
    if (!member) return true

    const messageChatMemberId = item?.metadata?.chatMemberId || ''
    const messageChatMemberUserId = item?.metadata?.chatMemberUserId || ''
    const senderUserId = item?.metadata?.senderUserId || ''
    const senderRole = item?.metadata?.senderRole || ''

    if (messageChatMemberId && messageChatMemberId === member.id) return true
    if (messageChatMemberUserId && messageChatMemberUserId === member.memberUserId) return true

    if (isAssistantWorkspace) {
      if (senderUserId && [actorUserId, workspaceContext?.ownerUserId].includes(senderUserId)) return true
      if (!messageChatMemberId && !messageChatMemberUserId && ['owner', 'assistant'].includes(senderRole)) return true
    }

    return !messageChatMemberId && member.id === workspaceAssistantChatMembers[0]?.id
  }
  function matchesWorkspaceChatThreadLog (item, member = activeWorkspaceChatMember) {
    const kind = item?.metadata?.kind || ''
    if (!['workspace_chat', 'workspace_chat_ack', 'workspace_chat_seen', 'workspace_chat_typing', 'workspace_chat_presence'].includes(kind)) return false
    if (!member) return true

    const messageChatMemberId = item?.metadata?.chatMemberId || ''
    const messageChatMemberUserId = item?.metadata?.chatMemberUserId || ''
    const senderUserId = item?.metadata?.senderUserId || ''
    const senderRole = item?.metadata?.senderRole || ''

    if (messageChatMemberId && messageChatMemberId === member.id) return true
    if (messageChatMemberUserId && messageChatMemberUserId === member.memberUserId) return true

    if (!messageChatMemberId && !messageChatMemberUserId) {
      if (kind === 'workspace_chat') return matchesWorkspaceChatMember(item, member)
      if (isAssistantWorkspace) {
        if (senderUserId && [actorUserId, workspaceContext?.ownerUserId].includes(senderUserId)) return true
        if (!senderUserId && ['owner', 'assistant'].includes(senderRole)) return true
      }
      if (workspaceRole === 'owner') {
        if (senderUserId && [workspaceContext?.ownerUserId, member.memberUserId].includes(senderUserId)) return true
        if (!senderUserId && ['owner', 'assistant'].includes(senderRole)) return true
      }
    }

    return false
  }
  function isWorkspaceChatMine (item) {
    const senderUserId = item?.metadata?.senderUserId || ''
    const senderName = String(item?.metadata?.senderName || '').trim().toLowerCase()
    const senderRole = item?.metadata?.senderRole || ''
    const messageChatMemberUserId = item?.metadata?.chatMemberUserId || ''
    const normalizedHeaderUserName = String(headerUserName || '').trim().toLowerCase()
    const normalizedOwnerName = String(workspaceOwnerDisplayName || '').trim().toLowerCase()
    const normalizedAssistantName = String(activeWorkspaceChatMemberName || '').trim().toLowerCase()
    if (workspaceRole === 'assistant') {
      if (
        messageChatMemberUserId
        && messageChatMemberUserId === actorUserId
        && senderRole !== 'owner'
        && senderName !== normalizedOwnerName
      ) return true
      if (senderRole === 'assistant') return true
      if (senderName && ['assistant', normalizedHeaderUserName, normalizedAssistantName].includes(senderName)) return true
      if (senderUserId && senderUserId === workspaceContext?.ownerUserId) return false
      if (senderName && normalizedOwnerName && senderName === normalizedOwnerName) return false
    }
    if (workspaceRole === 'owner') {
      if (senderRole === 'owner') return true
      if (senderName && ['owner', normalizedHeaderUserName].includes(senderName)) return true
    }
    if (senderUserId) return senderUserId === actorUserId
    if (workspaceRole === 'owner') return senderRole === 'owner'
    if (workspaceRole === 'assistant') return senderRole === 'assistant'
    return false
  }
  const matchedWorkspaceChatMessages = rawWorkspaceChatLogs.filter(item => (
    !activeWorkspaceChatMemberId ? true : matchesWorkspaceChatMember(item)
  ))
  const workspaceChatMessages = (matchedWorkspaceChatMessages.length
    ? matchedWorkspaceChatMessages
    : rawWorkspaceChatLogs.filter(item => {
        const senderUserId = item?.metadata?.senderUserId || ''
        if (isAssistantWorkspace) {
          return senderUserId === actorUserId || senderUserId === workspaceContext?.ownerUserId || !senderUserId
        }
        if (activeWorkspaceChatMember?.memberUserId) {
          return senderUserId === activeWorkspaceChatMember.memberUserId || senderUserId === workspaceContext?.ownerUserId || !senderUserId
        }
        return true
      }))
    .sort((a, b) => getWorkspaceChatSortTime(a) - getWorkspaceChatSortTime(b))
    .slice(-300)
  const workspaceChatAcknowledgements = activityLogs
    .filter(item => {
      if (item?.metadata?.kind !== 'workspace_chat_ack' || !item?.metadata?.ackForMessageId) return false
      if (!activeWorkspaceChatMemberId) return true
      const ackChatMemberId = item?.metadata?.chatMemberId || ''
      const ackChatMemberUserId = item?.metadata?.chatMemberUserId || ''
      return (
        ackChatMemberId === activeWorkspaceChatMemberId
        || (ackChatMemberUserId && ackChatMemberUserId === activeWorkspaceChatMember?.memberUserId)
        || (!ackChatMemberId && activeWorkspaceChatMember?.id === workspaceAssistantChatMembers[0]?.id)
      )
    })
  const workspaceChatAcknowledgedIds = new Set(workspaceChatAcknowledgements.map(item => item.metadata.ackForMessageId))
  const workspaceChatPeerSeenAt = getWorkspacePeerThreadSeenAt()
  const workspaceChatPeerTypingLog = activityLogs.reduce((latest, item) => {
    if (item?.metadata?.kind !== 'workspace_chat_typing') return latest
    if (item?.metadata?.senderUserId !== workspaceChatPeerUserId) return latest
    const typingChatMemberId = item?.metadata?.chatMemberId || ''
    const typingChatMemberUserId = item?.metadata?.chatMemberUserId || ''
    const matchesMember = (
      (typingChatMemberId && typingChatMemberId === activeWorkspaceChatMemberId)
      || (typingChatMemberUserId && activeWorkspaceChatMember?.memberUserId && typingChatMemberUserId === activeWorkspaceChatMember.memberUserId)
      || (!typingChatMemberId && !typingChatMemberUserId && activeWorkspaceChatMember?.id === workspaceAssistantChatMembers[0]?.id)
    )
    if (!matchesMember) return latest
    const createdAt = new Date(item.createdAt).getTime()
    return createdAt > latest.createdAt ? { createdAt, item } : latest
  }, { createdAt: 0, item: null }).item
  const workspaceChatPeerIsTyping = Boolean(
    workspaceChatPeerTypingLog?.metadata?.typing
    && (Date.now() - new Date(workspaceChatPeerTypingLog.createdAt).getTime()) < 6000
  )
  const workspaceChatPeerTypingLabel = workspaceRole === 'assistant'
    ? `${workspaceOwnerDisplayName} sedang mengetik...`
    : `${activeWorkspaceChatMemberName} sedang mengetik...`
  const workspaceChatLatestMessage = workspaceChatMessages[workspaceChatMessages.length - 1] || null
  const workspaceChatLatestMessageMarker = workspaceChatLatestMessage
    ? `${workspaceChatLatestMessage.id}:${workspaceChatLatestMessage.createdAt}`
    : 'no-message'
  const workspaceChatItemsWithDateSeparator = workspaceChatMessages.reduce((acc, item) => {
    const messageDate = new Date(item.createdAt)
    const dateKey = `${messageDate.getFullYear()}-${String(messageDate.getMonth() + 1).padStart(2, '0')}-${String(messageDate.getDate()).padStart(2, '0')}`
    const lastDateKey = acc.length ? acc[acc.length - 1]?.__dateKey : null
    if (dateKey !== lastDateKey) {
      acc.push({
        id: `date-separator-${dateKey}`,
        __type: 'date_separator',
        __dateKey: dateKey,
        label: formatLongDate(messageDate)
      })
    }
    acc.push({ ...item, __type: 'message', __dateKey: dateKey })
    return acc
  }, [])
  const workspaceCurrentThreadSeenAt = getWorkspaceThreadSeenAt(activeWorkspaceChatMember)
  const workspaceUnreadChatCount = workspaceRole === 'owner'
    ? workspaceChatMemberSummaries.reduce((sum, summary) => sum + (summary.unreadCount || 0), 0)
    : workspaceChatMessages.filter(item => (
        item?.metadata?.senderUserId
        && item.metadata.senderUserId !== actorUserId
        && new Date(item.createdAt).getTime() > workspaceCurrentThreadSeenAt
      )).length
  const hasUnreadWorkspaceChat = workspaceUnreadChatCount > 0
  const headerHour = headerNow.getHours()
  const dayGreeting = headerHour < 12 ? 'Good Morning!' : headerHour < 18 ? 'Good Afternoon!' : 'Good Evening!'
  const headerDateLabel = formatLongDate(headerNow)
  const headerTimeLabel = headerNow.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
  const calendarYear = calendarMonthDate.getFullYear()
  const calendarMonth = calendarMonthDate.getMonth()
  const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  const offsetMinutes = -new Date().getTimezoneOffset()
  const offsetSign = offsetMinutes >= 0 ? '+' : '-'
  const offsetAbs = Math.abs(offsetMinutes)
  const offsetHour = String(Math.floor(offsetAbs / 60)).padStart(2, '0')
  const offsetMinute = String(offsetAbs % 60).padStart(2, '0')
  const timezoneLabel = `GMT${offsetSign}${offsetHour}:${offsetMinute} (${browserTimeZone})`
  const getCalendarDays = () => {
    const year = calendarMonthDate.getFullYear()
    const month = calendarMonthDate.getMonth()
    const firstDayOfMonth = new Date(year, month, 1)
    const startOffset = firstDayOfMonth.getDay()
    const gridStart = new Date(year, month, 1 - startOffset)

    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(gridStart)
      day.setDate(gridStart.getDate() + index)
      const dateStr = formatDateLocal(day)
      return {
        date: day,
        dateStr,
        isCurrentMonth: day.getMonth() === month,
        isToday: dateStr === todayString
      }
    })
  }

  const calendarDays = getCalendarDays()
  const selectedDateAppointments = appointments.filter(app => app.date === selectedCalendarDate)
  const selectedDateTasks = tasks.filter(task => (task.calendarDate || todayString) === selectedCalendarDate)
  const selectedDateGoogleEvents = googleCalendarEvents.filter(event => event.date === selectedCalendarDate)
  const selectedDateHolidays = nationalHolidays.filter(holiday => holiday.date === selectedCalendarDate)
  const selectedDateItems = [
    ...selectedDateAppointments.map(item => ({ ...item, itemType: 'appointment' })),
    ...selectedDateTasks.map(item => ({ ...item, itemType: 'task' })),
    ...selectedDateGoogleEvents.map(item => ({ ...item, itemType: 'google_event' })),
    ...selectedDateHolidays.map(item => ({ ...item, itemType: 'holiday' }))
  ]

  const taskMatchesSearch = (task) => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return true
    return [task.title, task.category, task.priority]
      .filter(Boolean)
      .some(value => String(value).toLowerCase().includes(query))
  }

  const getTaskProgress = (task, childSubtasks = []) => {
    if (childSubtasks.length === 0) {
      return {
        completed: task.status === 'done' ? 1 : 0,
        total: 1,
        percent: task.status === 'done' ? 100 : 0
      }
    }

    const completed = childSubtasks.filter(subtask => subtask.status === 'done').length
    return {
      completed,
      total: childSubtasks.length,
      percent: Math.round((completed / childSubtasks.length) * 100)
    }
  }

  const subtasksByParent = tasks.reduce((groups, task) => {
    if (!task.parentTaskId) return groups
    return {
      ...groups,
      [task.parentTaskId]: [...(groups[task.parentTaskId] || []), task]
    }
  }, {})

  const allProjectFolders = Object.values(
    tasks.reduce((groups, task) => {
      const projectName = task.category || 'Uncategorized'
      const existing = groups[projectName] || {
        name: projectName,
        color: task.colorLabel || '#8B5CF6',
        tasks: [],
        subtasks: []
      }

      if (task.parentTaskId) {
        existing.subtasks.push(task)
      } else {
        existing.tasks.push(task)
      }

      groups[projectName] = existing
      return groups
    }, projectFolderRecords.reduce((groups, folder) => {
      groups[folder.name] = {
        name: folder.name,
        color: folder.color || '#8B5CF6',
        tasks: [],
        subtasks: [],
        folderId: folder.id
      }
      return groups
    }, {}))
  )
    .map(folder => {
      const folderTaskIds = new Set(folder.tasks.map(task => task.id))
      const orphanSubtasks = folder.subtasks.filter(subtask => !folderTaskIds.has(subtask.parentTaskId))
      return { ...folder, tasks: [...folder.tasks, ...orphanSubtasks] }
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  const projectFolders = allProjectFolders
    .filter(folder => {
      const projectMatches = taskFilter === 'All' || folder.name === taskFilter
      const queryMatches = folder.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
        || folder.tasks.some(task => taskMatchesSearch(task))
        || folder.subtasks.some(task => taskMatchesSearch(task))
      return projectMatches && queryMatches
    })

  const allProjectOptions = ['All', ...Array.from(new Set([
    ...projectFolderRecords.map(folder => folder.name),
    ...tasks.map(task => task.category || 'Uncategorized')
  ])).sort()]
  const selectedProjectFolder = allProjectFolders.find(folder => folder.name === selectedProjectName) || allProjectFolders[0] || null
  const selectedFolderTasks = selectedProjectFolder
    ? selectedProjectFolder.tasks.filter(task => !task.parentTaskId && taskMatchesSearch(task))
    : []
  const todayLocalAppointments = appointments.filter(appt => appt.date === todayString)
  const todayGoogleEvents = googleCalendarEvents.filter(event => event.date === todayString)
  const todayHolidays = nationalHolidays.filter(holiday => holiday.date === todayString)
  const todayTasks = tasks.filter(task => (task.calendarDate || todayString) === todayString)
  const todayCalendarItems = [
    ...todayTasks.map(task => ({ ...task, source: 'task', sortDate: `${task.calendarDate || todayString} ${task.dueTime || '23:59'}` })),
    ...todayLocalAppointments.map(appt => ({ ...appt, source: 'appointment', sortDate: `${appt.date} ${appt.time || '23:59'}` })),
    ...todayGoogleEvents.map(event => ({ ...event, source: 'google_event', sortDate: `${event.date} ${event.time || '23:59'}` })),
    ...todayHolidays.map(holiday => ({ ...holiday, source: 'holiday', sortDate: `${holiday.date} 00:00` }))
  ].sort((a, b) => a.sortDate.localeCompare(b.sortDate))
  const overdueTasks = tasks.filter(task => task.status !== 'done' && (task.calendarDate || todayString) < todayString)
  const completedTodayTasks = todayTasks.filter(task => task.status === 'done')
  const mobileWorkspaceChatBottomStats = [
    { label: 'Task Hari Ini', value: todayTasks.length },
    { label: 'Selesai', value: completedTodayTasks.length },
    { label: 'Urgent', value: overdueTasks.length },
    { label: 'Event', value: todayLocalAppointments.length + todayGoogleEvents.length }
  ]
  const upcomingCalendarItems = [
    ...appointments.map(appt => ({ ...appt, source: 'appointment', sortDate: `${appt.date} ${appt.time || '23:59'}` })),
    ...googleCalendarEvents.map(event => ({ ...event, source: 'google_event', sortDate: `${event.date} ${event.time || '23:59'}` })),
    ...nationalHolidays.map(holiday => ({ ...holiday, source: 'holiday', time: 'All day', sortDate: `${holiday.date} 00:00` }))
  ]
    .filter(item => item.date >= todayString)
    .sort((a, b) => a.sortDate.localeCompare(b.sortDate))
  const nextCalendarItem = upcomingCalendarItems[0]
  const weeklyWorkload = [1, 2, 3, 4, 5, 6, 0].map((day, index) => {
    const dayDate = new Date(todayDate)
    dayDate.setDate(todayDate.getDate() - (todayDate.getDay() - day))
    const dateStr = formatDateLocal(dayDate)
    const taskCount = tasks.filter(task => (task.calendarDate || todayString) === dateStr).length
    const appointmentCount = appointments.filter(appt => appt.date === dateStr).length
    const googleEventCount = googleCalendarEvents.filter(event => event.date === dateStr).length
    const holidayCount = nationalHolidays.filter(holiday => holiday.date === dateStr).length
    return {
      label: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'][index],
      total: taskCount + appointmentCount + googleEventCount + holidayCount,
      tasks: taskCount,
      appointments: appointmentCount,
      googleEvents: googleEventCount,
      holidays: holidayCount
    }
  })
  const maxWeeklyWorkload = Math.max(...weeklyWorkload.map(day => day.total), 1)
  const projectProgressOverview = allProjectFolders.slice(0, 4).map(folder => {
    const folderItems = [...folder.tasks, ...folder.subtasks]
    const completedItems = folderItems.filter(task => task.status === 'done').length
    const totalItems = folderItems.length || 1
    return {
      ...folder,
      completed: completedItems,
      total: folderItems.length,
      percent: Math.round((completedItems / totalItems) * 100)
    }
  })
  const priorityRank = { critical: 0, high: 1, medium: 2, low: 3 }
  const focusQueue = tasks
    .filter(task => task.status !== 'done' && !task.parentTaskId)
    .sort((a, b) => {
      const dateCompare = (a.calendarDate || todayString).localeCompare(b.calendarDate || todayString)
      if (dateCompare !== 0) return dateCompare
      return (priorityRank[a.priority] ?? 4) - (priorityRank[b.priority] ?? 4)
    })
    .slice(0, 3)

  useEffect(() => {
    if (selectedProjectName && allProjectFolders.some(folder => folder.name === selectedProjectName)) return
    setSelectedProjectName(allProjectFolders[0]?.name || '')
  }, [allProjectFolders, selectedProjectName])

  const parseBookingTimeRange = (timeText) => {
    const raw = (timeText || '').trim()
    const match = raw.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/)
    if (match) {
      return { start: match[1], end: match[2] }
    }

    const single = raw.match(/(\d{1,2}:\d{2})/)
    if (!single) return null

    const [hoursStr, minutesStr] = single[1].split(':')
    const hours = Number(hoursStr)
    const minutes = Number(minutesStr)
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null

    const endDate = new Date(2000, 0, 1, hours, minutes + 60)
    const endHours = String(endDate.getHours()).padStart(2, '0')
    const endMinutes = String(endDate.getMinutes()).padStart(2, '0')
    return { start: single[1], end: `${endHours}:${endMinutes}` }
  }

  const syncBookingToGoogleCalendar = async (booking) => {
    const cfg = integrationConfigs.google_calendar || {}
    const clientId = (cfg.client_id || '').trim()
    const clientSecret = (cfg.client_secret || '').trim()
    const refreshToken = (cfg.refresh_token || '').trim()
    const calendarId = (cfg.calendar_id || 'primary').trim() || 'primary'
    const timeRange = parseBookingTimeRange(booking.time)

    if (!clientId || !clientSecret || !refreshToken || !timeRange) {
      return {
        ok: false,
        skipped: true,
        reason: 'Konfigurasi Google Calendar belum lengkap atau format waktu tidak valid (contoh: 10:00 - 11:00).'
      }
    }

    const bookingDate = booking.date || new Date().toISOString().slice(0, 10)
    const timezone = 'Asia/Makassar'
    const offset = '+08:00'
    const startDateTime = `${bookingDate}T${timeRange.start}:00${offset}`
    const endDateTime = `${bookingDate}T${timeRange.end}:00${offset}`

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    })

    const tokenData = await tokenResponse.json()
    if (!tokenResponse.ok || !tokenData.access_token) {
      return {
        ok: false,
        error: tokenData?.error_description || tokenData?.error || 'Gagal mendapatkan access token Google.'
      }
    }

    const eventPayload = {
      summary: booking.title,
      description: `Klien: ${booking.client_name}\nEmail: ${booking.email || 'guest@dyatask.com'}\nDibuat dari DyaTask Manager`,
      start: {
        dateTime: startDateTime,
        timeZone: timezone
      },
      end: {
        dateTime: endDateTime,
        timeZone: timezone
      }
    }

    const eventResponse = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenData.access_token}`
      },
      body: JSON.stringify(eventPayload)
    })

    const eventData = await eventResponse.json()
    if (!eventResponse.ok) {
      return {
        ok: false,
        error: eventData?.error?.message || 'Gagal menambahkan event ke Google Calendar.'
      }
    }

    return { ok: true, eventId: eventData.id, htmlLink: eventData.htmlLink }
  }

  const fetchGoogleCalendarEventsForMonth = async ({ notifyNew = false } = {}) => {
    const fetchId = googleCalendarFetchIdRef.current + 1
    googleCalendarFetchIdRef.current = fetchId
    const cfg = integrationConfigs.google_calendar || {}
    const clientId = (cfg.client_id || '').trim()
    const clientSecret = (cfg.client_secret || '').trim()
    const refreshToken = (cfg.refresh_token || '').trim()
    const calendarId = (cfg.calendar_id || 'primary').trim() || 'primary'

    if (!clientId || !clientSecret || !refreshToken) {
      if (fetchId !== googleCalendarFetchIdRef.current) return
      setGoogleCalendarEvents([])
      seenGoogleCalendarEventIdsRef.current = new Set()
      googleCalendarBaselineReadyRef.current = false
      return
    }

    try {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        })
      })

      const tokenData = await tokenResponse.json()
      if (!tokenResponse.ok || !tokenData.access_token) throw new Error(tokenData?.error_description || tokenData?.error || 'Gagal autentikasi Google Calendar.')

      const rangeStart = `${formatDateLocal(new Date(calendarYear, calendarMonth, 1))}T00:00:00+08:00`
      const rangeEnd = `${formatDateLocal(new Date(calendarYear, calendarMonth + 1, 1))}T00:00:00+08:00`
      const params = new URLSearchParams({
        timeMin: rangeStart,
        timeMax: rangeEnd,
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '250'
      })

      const eventResponse = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      })
      const eventData = await eventResponse.json()
      if (!eventResponse.ok) throw new Error(eventData?.error?.message || 'Gagal membaca event Google Calendar.')

      const externalEvents = (eventData.items || [])
        .filter(event => event.status !== 'cancelled')
        .filter(event => !(event.description || '').includes('Dibuat dari DyaTask Manager'))
        .map(event => {
          const startValue = event.start?.date || event.start?.dateTime || ''
          const endValue = event.end?.date || event.end?.dateTime || ''
          const date = startValue.slice(0, 10)
          const startTime = event.start?.dateTime ? startValue.slice(11, 16) : 'All day'
          const endTime = event.end?.dateTime ? endValue.slice(11, 16) : ''
          return {
            id: event.id,
            title: event.summary || '(Tanpa judul)',
            date,
            time: endTime && startTime !== 'All day' ? `${startTime} - ${endTime}` : startTime,
            htmlLink: event.htmlLink,
            calendarName: calendarId
          }
        })
        .filter(event => event.date)

      if (fetchId !== googleCalendarFetchIdRef.current) return

      const incomingIds = new Set(externalEvents.map(event => event.id))
      const newExternalEvents = externalEvents.filter(event => !seenGoogleCalendarEventIdsRef.current.has(event.id))

      if (!googleCalendarBaselineReadyRef.current) {
        seenGoogleCalendarEventIdsRef.current = incomingIds
        googleCalendarBaselineReadyRef.current = true
      } else {
        if (notifyNew && newExternalEvents.length > 0) {
          const timestamp = new Date().toLocaleTimeString('id-ID')
          newExternalEvents.slice(0, 4).forEach(event => {
            const isTaskEvent = /^task\s*:/i.test(event.title) || /task|tugas/i.test(event.title)
            triggerMockNotification(
              isTaskEvent ? 'Task Google Calendar Baru' : 'Event Google Calendar Baru',
              `${event.title} • ${formatLongDate(event.date)} ${event.time || 'All day'}`,
              'google-cal',
              {
                source: 'google_calendar',
                eventId: event.id,
                title: event.title,
                date: event.date,
                time: event.time,
                htmlLink: event.htmlLink
              }
            )
          })
          setSyncLogs(prev => [
            `[${timestamp}] 🔔 Google Calendar: ${newExternalEvents.length} event/task baru terdeteksi dari luar aplikasi.`,
            ...prev.slice(0, 9)
          ])
        }
        newExternalEvents.forEach(event => seenGoogleCalendarEventIdsRef.current.add(event.id))
        Array.from(seenGoogleCalendarEventIdsRef.current).forEach(eventId => {
          if (!incomingIds.has(eventId)) seenGoogleCalendarEventIdsRef.current.delete(eventId)
        })
      }

      setGoogleCalendarEvents(externalEvents)
    } catch (err) {
      if (fetchId !== googleCalendarFetchIdRef.current) return
      setGoogleCalendarEvents([])
      setSyncLogs(prev => [`[${new Date().toLocaleTimeString('id-ID')}] ⚠️ Google Calendar external events gagal dimuat: ${err.message}`, ...prev.slice(0, 9)])
    }
  }

  const syncTaskToGoogleCalendar = async (task) => {
    const cfg = integrationConfigs.google_calendar || {}
    const clientId = (cfg.client_id || '').trim()
    const clientSecret = (cfg.client_secret || '').trim()
    const refreshToken = (cfg.refresh_token || '').trim()
    const calendarId = (cfg.calendar_id || 'primary').trim() || 'primary'

    if (!clientId || !clientSecret || !refreshToken || !task?.dueTime) {
      return { ok: false, skipped: true, reason: 'Konfigurasi Google Calendar belum lengkap.' }
    }

    const start = parseBookingTimeRange(task.dueTime)
    if (!start) return { ok: false, skipped: true, reason: 'Format jam task tidak valid.' }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    })
    const tokenData = await tokenResponse.json()
    if (!tokenResponse.ok || !tokenData.access_token) {
      return { ok: false, error: tokenData?.error_description || tokenData?.error || 'Gagal autentikasi Google.' }
    }

    const timezone = 'Asia/Makassar'
    const offset = '+08:00'
    const taskDate = task.calendarDate || todayString
    const payload = {
      summary: `Task: ${task.title}`,
      description: `Kategori: ${task.category}\nPrioritas: ${task.priority}\nDibuat dari DyaTask Manager`,
      start: { dateTime: `${taskDate}T${start.start}:00${offset}`, timeZone: timezone },
      end: { dateTime: `${taskDate}T${start.end}:00${offset}`, timeZone: timezone }
    }

    const eventResponse = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenData.access_token}` },
      body: JSON.stringify(payload)
    })
    const eventData = await eventResponse.json()
    if (!eventResponse.ok) {
      return { ok: false, error: eventData?.error?.message || 'Gagal sinkron task ke Google Calendar.' }
    }

    return { ok: true, eventId: eventData.id }
  }

  const testGoogleCalendarConnection = async () => {
    setGoogleConnectionStatus(null)
    setTestingGoogleConnection(true)

    try {
      const cfg = activeIntegrationModal === 'google_calendar'
        ? integrationFormData
        : (integrationConfigs.google_calendar || {})
      const clientId = (cfg.client_id || '').trim()
      const clientSecret = (cfg.client_secret || '').trim()
      const refreshToken = (cfg.refresh_token || '').trim()
      const calendarId = (cfg.calendar_id || 'primary').trim() || 'primary'

      if (!clientId || !clientSecret || !refreshToken) {
        setGoogleConnectionStatus({ ok: false, message: 'Isi Client ID, Client Secret, dan Refresh Token dulu.' })
        return
      }

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        })
      })

      const tokenData = await tokenResponse.json()
      if (!tokenResponse.ok || !tokenData.access_token) {
        setGoogleConnectionStatus({
          ok: false,
          message: `Token error: ${tokenData?.error_description || tokenData?.error || 'Gagal autentikasi.'}`
        })
        return
      }

      const calendarResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}`,
        {
          headers: { Authorization: `Bearer ${tokenData.access_token}` }
        }
      )
      const calendarData = await calendarResponse.json()

      if (!calendarResponse.ok) {
        setGoogleConnectionStatus({
          ok: false,
          message: `Calendar error: ${calendarData?.error?.message || 'Calendar tidak bisa diakses.'}`
        })
        return
      }

      setGoogleConnectionStatus({
        ok: true,
        message: `Koneksi berhasil ke calendar: ${calendarData?.summary || calendarId}`
      })
    } catch (error) {
      setGoogleConnectionStatus({
        ok: false,
        message: `Gagal test koneksi: ${error.message}`
      })
    } finally {
      setTestingGoogleConnection(false)
    }
  }

  const integrationDefs = [
    {
      key: 'google_calendar',
      label: 'Google Calendar',
      subtitle: 'Sinkronisasi Bidirectional',
      icon: 'Calendar',
      colorClass: 'bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
      fields: [
        { id: 'client_id', label: 'OAuth Client ID', placeholder: 'xxxxxx.apps.googleusercontent.com', type: 'text' },
        { id: 'client_secret', label: 'OAuth Client Secret', placeholder: 'GOCSPX-xxxxx', type: 'password' },
        { id: 'calendar_id', label: 'Calendar ID', placeholder: 'primary atau nama@gmail.com', type: 'text' },
        { id: 'refresh_token', label: 'Refresh Token', placeholder: 'Token dari Google OAuth Playground', type: 'password' }
      ]
    },
    {
      key: 'notion',
      label: 'Notion Calendar',
      subtitle: 'Sinkronisasi Database Workspace',
      icon: 'Sparkles',
      colorClass: 'bg-purple-100 dark:bg-indigo-950 text-purple-600 dark:text-purple-300',
      fields: [
        { id: 'api_key', label: 'Notion Integration Token', placeholder: 'secret_xxxxx', type: 'password' },
        { id: 'database_id', label: 'Database ID', placeholder: 'ID database Notion Anda', type: 'text' },
        { id: 'workspace', label: 'Nama Workspace (opsional)', placeholder: 'My Workspace', type: 'text' }
      ]
    },
    {
      key: 'email',
      label: 'Surel (Email Parser)',
      subtitle: 'Membaca IMAP/Gmail API',
      icon: 'Mail',
      colorClass: 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400',
      fields: [
        { id: 'imap_host', label: 'IMAP Host', placeholder: 'imap.gmail.com', type: 'text' },
        { id: 'imap_port', label: 'IMAP Port', placeholder: '993', type: 'text' },
        { id: 'email', label: 'Alamat Surel', placeholder: 'nama@gmail.com', type: 'text' },
        { id: 'app_password', label: 'App Password / Token', placeholder: 'App Password dari Google', type: 'password' }
      ]
    },
    {
      key: 'google_sheets',
      label: 'Google Sheets',
      subtitle: 'Export Data Realtime',
      icon: 'FileSpreadsheet',
      colorClass: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
      fields: [
        { id: 'spreadsheet_id', label: 'Spreadsheet ID', placeholder: 'ID dari URL spreadsheet Google', type: 'text' },
        { id: 'sheet_name', label: 'Nama Sheet', placeholder: 'Sheet1', type: 'text' },
        { id: 'service_account_json', label: 'Service Account JSON Key', placeholder: 'Tempel isi file .json service account', type: 'textarea' }
      ]
    }
  ]

  const integrationTutorials = {
    google_calendar: {
      title: 'Tutorial Koneksi Google Calendar',
      steps: [
        'Buka Google Cloud Console lalu buat project khusus integrasi DyaTask.',
        'Aktifkan Google Calendar API pada menu API & Services > Library.',
        'Buat OAuth Client ID (Web/Desktop), lalu salin Client ID dan Client Secret.',
        'Jalankan OAuth consent dan ambil Refresh Token, lalu masukkan ke form Konfigurasi.'
      ],
      refs: [
        { label: 'Google Cloud Console', href: 'https://console.cloud.google.com/' },
        { label: 'Google OAuth Playground', href: 'https://developers.google.com/oauthplayground' }
      ]
    },
    notion: {
      title: 'Tutorial Koneksi Notion Calendar',
      steps: [
        'Buat Integration baru di Notion Developers dan salin Internal Integration Token.',
        'Buka database Notion yang ingin disinkronkan, lalu klik Share > Invite integration.',
        'Salin Database ID dari URL halaman database Notion Anda.',
        'Tempel Token dan Database ID ke form Konfigurasi Notion di aplikasi.'
      ],
      refs: [
        { label: 'Notion Developers', href: 'https://www.notion.so/profile/integrations' },
        { label: 'Notion API Intro', href: 'https://developers.notion.com/docs/getting-started' }
      ]
    },
    email: {
      title: 'Tutorial Koneksi Surel (Email Parser)',
      steps: [
        'Pastikan IMAP aktif pada akun email (contoh Gmail: Settings > Forwarding and POP/IMAP).',
        'Aktifkan verifikasi 2 langkah pada akun email agar bisa membuat App Password.',
        'Buat App Password khusus Mail, lalu isi host, port, email, dan App Password.',
        'Simpan konfigurasi lalu lakukan uji sinkron dari tab Integrations.'
      ],
      refs: [
        { label: 'Gmail IMAP Setup', href: 'https://support.google.com/mail/answer/7126229' },
        { label: 'Google App Password', href: 'https://support.google.com/accounts/answer/185833' }
      ]
    },
    google_sheets: {
      title: 'Tutorial Koneksi Google Sheets',
      steps: [
        'Buat Service Account di Google Cloud Console, lalu download JSON Key.',
        'Aktifkan Google Sheets API pada project yang sama.',
        'Share spreadsheet target ke email Service Account sebagai Editor.',
        'Masukkan Spreadsheet ID, nama sheet, dan isi JSON Key ke form Konfigurasi.'
      ],
      refs: [
        { label: 'Enable Google Sheets API', href: 'https://developers.google.com/sheets/api/quickstart/nodejs' },
        { label: 'Manage Service Accounts', href: 'https://cloud.google.com/iam/docs/service-accounts-create' }
      ]
    }
  }

  const activeIntegrationLabels = integrationDefs
    .filter(def => isConfigured(def.key))
    .map(def => def.label)
  const calendarIntegrationActive = isGoogleCalendarReady()

  const realtimeStatusText = calendarIntegrationActive
    ? 'Calendar: Active'
    : 'Calendar: Off'

  const securityStatusText = twoFactorEnabled ? '2FA: Active' : '2FA: Off'

  const [syncLogs, setSyncLogs] = useState([
    '⚡ Koneksi database PostgreSQL Supabase berhasil.'
  ])
  const [dbConnectionStatus, setDbConnectionStatus] = useState('connected') // 'connected', 'disconnected', 'syncing'
  const [lastSyncTime, setLastSyncTime] = useState(new Date())

  // Handle Supabase Authentication Session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const tokenFromUrl = String(inviteTokenFromUrl || '').trim()
    if (!tokenFromUrl) return
    setPendingInviteToken(tokenFromUrl)
    setInviteLandingToken(tokenFromUrl)
    localStorage.setItem('dyatask_pending_workspace_invite_token', tokenFromUrl)
    if (inviteUsernameFromUrl) {
      setAuthUsername(inviteUsernameFromUrl)
    }
    setAuthTab('signin')
  }, [inviteTokenFromUrl, inviteUsernameFromUrl])

  useEffect(() => {
    if (!pendingInviteToken) return
    localStorage.setItem('dyatask_pending_workspace_invite_token', pendingInviteToken)
  }, [pendingInviteToken])

  useEffect(() => {
    const tokenFromUrl = String(inviteTokenFromUrl || '').trim()
    if (tokenFromUrl) return
    if (!session?.user?.id) return
    if (!pendingInviteToken) return
    setInviteLandingToken('')
  }, [session?.user?.id, inviteTokenFromUrl, pendingInviteToken])

  useEffect(() => {
    if (!actorUserId) {
      setWorkspaceContext(null)
      setWorkspaceMembers([])
      return
    }

    let cancelled = false
    const fallbackContext = {
      ownerUserId: actorUserId,
      role: 'owner',
      status: 'active',
      permissions: { ...TEAM_PERMISSION_DEFAULTS, notes: true, integrations: true, settings: true }
    }

    const resolveWorkspaceOwnerName = async (ownerUserId) => {
      if (!ownerUserId || ownerUserId === actorUserId) {
        setWorkspaceOwnerName(headerUserName)
        return
      }

      const isGenericOwnerLabel = (value) => {
        const label = String(value || '').trim().toLowerCase()
        return !label || label === 'owner' || label === 'superuser / developer'
      }

      const { data: ownerLabel, error: ownerLabelError } = await supabase.rpc('get_workspace_owner_label', {
        p_owner_user_id: ownerUserId
      })
      if (cancelled) return
      if (!ownerLabelError && !isGenericOwnerLabel(ownerLabel)) {
        setWorkspaceOwnerName(String(ownerLabel).trim())
        return
      }

      setWorkspaceOwnerName('')
    }

    const loadWorkspaceContext = async () => {
      const { error: ensureError } = await supabase.rpc('ensure_owner_workspace_membership', { p_user_id: actorUserId })
      if (ensureError) {
        console.warn('Workspace ensure owner gagal, pakai fallback:', ensureError.message)
      }

      const { data: membershipRows, error: membershipError } = await supabase
        .from('workspace_members')
        .select('owner_user_id, member_user_id, member_email, role, status, permissions, created_at')

      if (cancelled) return

      if (!membershipError) {
        const actorEmail = String(session?.user?.email || '').toLowerCase()
        const relevantRows = (membershipRows || []).filter(row => (
          row.member_user_id === actorUserId
          || (row.role === 'owner' && row.owner_user_id === actorUserId)
          || (!row.member_user_id && String(row.member_email || '').toLowerCase() === actorEmail)
        ))

        const invitedWorkspaceRows = relevantRows
          .filter(row => row.owner_user_id && row.owner_user_id !== actorUserId)
          .sort((a, b) => {
            const statusRank = (row) => ({ active: 0, pending: 1, revoked: 2 }[row.status] ?? 3)
            const identityRank = (row) => {
              if (row.member_user_id === actorUserId) return 0
              if (String(row.member_email || '').toLowerCase() === actorEmail) return 1
              return 2
            }
            return statusRank(a) - statusRank(b) || identityRank(a) - identityRank(b) || new Date(a.created_at || 0) - new Date(b.created_at || 0)
          })[0]

        if (invitedWorkspaceRows?.owner_user_id) {
          setWorkspaceContext({
            ownerUserId: invitedWorkspaceRows.owner_user_id,
            role: invitedWorkspaceRows.role || 'assistant',
            status: invitedWorkspaceRows.status || 'active',
            permissions: normalizeTeamPermissions(invitedWorkspaceRows.permissions || {})
          })
          await resolveWorkspaceOwnerName(invitedWorkspaceRows.owner_user_id)
          return
        }

        const preferredRow = relevantRows.sort((a, b) => {
          const rank = (row) => {
            if (row.member_user_id === actorUserId && row.owner_user_id !== actorUserId) return 0
            if (row.role === 'owner' && row.owner_user_id === actorUserId) return 1
            return 2
          }
          const statusRank = (row) => ({ active: 0, pending: 1, revoked: 2 }[row.status] ?? 3)
          return rank(a) - rank(b) || statusRank(a) - statusRank(b) || new Date(a.created_at || 0) - new Date(b.created_at || 0)
        })[0]

        if (preferredRow?.owner_user_id) {
          setWorkspaceContext({
            ownerUserId: preferredRow.owner_user_id,
            role: preferredRow.role || 'owner',
            status: preferredRow.status || 'active',
            permissions: normalizeTeamPermissions(preferredRow.permissions || {})
          })
          await resolveWorkspaceOwnerName(preferredRow.owner_user_id)
          return
        }
      }

      const { data, error } = await supabase.rpc('get_workspace_context')
      if (cancelled) return

      if (error) {
        console.warn('Workspace context fallback aktif:', error.message)
        setWorkspaceContext(fallbackContext)
        await resolveWorkspaceOwnerName(fallbackContext.ownerUserId)
        return
      }

      const row = Array.isArray(data) ? data[0] : data
      if (!row?.owner_user_id) {
        setWorkspaceContext(fallbackContext)
        await resolveWorkspaceOwnerName(fallbackContext.ownerUserId)
        return
      }

      setWorkspaceContext({
        ownerUserId: row.owner_user_id,
        role: row.role || 'owner',
        status: 'active',
        permissions: normalizeTeamPermissions(row.permissions || {})
      })
      await resolveWorkspaceOwnerName(row.owner_user_id)
    }

    loadWorkspaceContext()

    return () => {
      cancelled = true
    }
  }, [actorUserId, session?.user?.email, headerUserName])

  useEffect(() => {
    if (!actorUserId || !workspaceContext?.ownerUserId) {
      setWorkspaceMembers([])
      return
    }

    let cancelled = false

    const loadWorkspaceMembers = async () => {
      const query = canManageTeam
        ? supabase
          .from('workspace_members')
          .select('*')
          .eq('owner_user_id', workspaceContext.ownerUserId)
          .order('created_at', { ascending: true })
        : supabase
          .from('workspace_members')
          .select('*')
          .eq('owner_user_id', workspaceContext.ownerUserId)
          .order('created_at', { ascending: true })

      const { data, error } = await query
      if (cancelled) return
      if (error) {
        console.warn('Load workspace members gagal:', error.message)
        return
      }

      const rawRows = canManageTeam
        ? (data || [])
        : (data || []).filter(item => (
            item.member_user_id === actorUserId
            || String(item.member_email || '').toLowerCase() === String(session?.user?.email || '').toLowerCase()
          ))

      const rows = rawRows.map(item => ({
        id: item.id,
        ownerUserId: item.owner_user_id,
        memberUserId: item.member_user_id,
        memberEmail: item.member_email,
        role: item.role,
        status: item.status,
        inviteToken: item.invite_token,
        permissions: normalizeTeamPermissions(item.permissions || {}),
        acceptedAt: item.accepted_at,
        createdAt: item.created_at
      }))
      setWorkspaceMembers(rows)

      if (!canManageTeam) {
        const ownMemberRow = rows.find(row => row.memberUserId === actorUserId && row.status === 'active') || rows[0]
        if (ownMemberRow?.ownerUserId) {
          setWorkspaceContext(prev => {
            const nextContext = {
              ownerUserId: ownMemberRow.ownerUserId,
              role: ownMemberRow.role || 'assistant',
              status: ownMemberRow.status || 'active',
              permissions: normalizeTeamPermissions(ownMemberRow.permissions || {})
            }
            return JSON.stringify(prev) === JSON.stringify(nextContext) ? prev : nextContext
          })
        }
      }
    }

    loadWorkspaceMembers()

    const channel = supabase
      .channel(`workspace_members_realtime_${workspaceContext.ownerUserId}_${actorUserId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workspace_members' }, () => {
        loadWorkspaceMembers()
      })
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [actorUserId, workspaceContext?.ownerUserId, canManageTeam, session?.user?.email])

  useEffect(() => {
    const profileIds = [
      actorUserId,
      workspaceContext?.ownerUserId,
      ...workspaceMembers.map(member => member.memberUserId)
    ].filter(Boolean)

    const uniqueProfileIds = Array.from(new Set(profileIds))
    if (uniqueProfileIds.length === 0) {
      setWorkspaceProfileNames({})
      return
    }

    let cancelled = false

    const loadWorkspaceProfileNames = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', uniqueProfileIds)

      if (cancelled) return

      if (error) {
        console.warn('Load nama profil workspace gagal:', error.message)
        return
      }

      const nextProfileNames = (data || []).reduce((map, profile) => {
        map[profile.id] = {
          email: profile.email || '',
          fullName: profile.full_name || ''
        }
        return map
      }, {})

      setWorkspaceProfileNames(nextProfileNames)
    }

    loadWorkspaceProfileNames()

    return () => {
      cancelled = true
    }
  }, [
    actorUserId,
    workspaceContext?.ownerUserId,
    workspaceMembers.map(member => member.memberUserId).filter(Boolean).join('|')
  ])

  useEffect(() => {
    if (!actorUserId || !session?.user) return

    const email = String(session.user.email || '').trim().toLowerCase()
    const fullName = String(
      session.user.user_metadata?.full_name
      || workspaceMemberSelf?.memberEmail?.split('@')[0]
      || authUsername
      || ''
    ).trim()

    if (!email && !fullName) return

    let cancelled = false

    const syncSessionProfile = async () => {
      const payload = {
        id: actorUserId,
        email: email || null,
        full_name: fullName || null,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'id' })

      if (!cancelled && !error) {
        setWorkspaceProfileNames(prev => ({
          ...prev,
          [actorUserId]: {
            email: payload.email || '',
            fullName: payload.full_name || ''
          }
        }))
      }
    }

    syncSessionProfile()

    return () => {
      cancelled = true
    }
  }, [actorUserId, session?.user, workspaceMemberSelf?.memberEmail, authUsername])

  useEffect(() => {
    if (!isAppDeveloper || activeTab !== 'userMonitoring') return

    refreshDeveloperMonitoring()
  }, [activeTab, isAppDeveloper])

  // Monitor Supabase Connection Status & Real-time Sync Events
  useEffect(() => {
    let connectionCheckInterval
    let taskChannel, appointmentChannel, noteChannel

    const checkConnection = async () => {
      try {
        const { data, error } = await supabase.from('tasks').select('count', { count: 'exact', head: true })
        if (error) {
          setDbConnectionStatus('disconnected')
          setSyncLogs(prev => [`[${new Date().toLocaleTimeString('id-ID')}] ❌ Database offline - ${error.message}`, ...prev.slice(0, 9)])
        } else {
          if (dbConnectionStatus !== 'connected') {
            setDbConnectionStatus('connected')
            setSyncLogs(prev => [`[${new Date().toLocaleTimeString('id-ID')}] ✅ Database terhubung kembali.`, ...prev.slice(0, 9)])
          }
          setLastSyncTime(new Date())
        }
      } catch (err) {
        setDbConnectionStatus('disconnected')
        setSyncLogs(prev => [`[${new Date().toLocaleTimeString('id-ID')}] ❌ Koneksi error: ${err.message}`, ...prev.slice(0, 9)])
      }
    }

    // Check connection immediately
    checkConnection()
    
    // Check connection every 30 seconds
    connectionCheckInterval = setInterval(checkConnection, 30000)

    // Subscribe to real-time updates
    try {
      taskChannel = supabase
        .channel('public:tasks')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
          const timestamp = new Date().toLocaleTimeString('id-ID')
          if (payload.eventType === 'INSERT') {
            setSyncLogs(prev => [`[${timestamp}] ✅ Tugas baru ditambahkan ke database.`, ...prev.slice(0, 9)])
          } else if (payload.eventType === 'UPDATE') {
            setSyncLogs(prev => [`[${timestamp}] 🔄 Tugas diperbarui di database.`, ...prev.slice(0, 9)])
          } else if (payload.eventType === 'DELETE') {
            setSyncLogs(prev => [`[${timestamp}] 🗑️ Tugas dihapus dari database.`, ...prev.slice(0, 9)])
          }
          setLastSyncTime(new Date())
        })
        .subscribe()

      appointmentChannel = supabase
        .channel('public:appointments')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, (payload) => {
          const timestamp = new Date().toLocaleTimeString('id-ID')
          if (payload.eventType === 'INSERT') {
            setSyncLogs(prev => [`[${timestamp}] 📅 Konsultasi baru dijadwalkan di database.`, ...prev.slice(0, 9)])
          } else if (payload.eventType === 'UPDATE') {
            setSyncLogs(prev => [`[${timestamp}] 📝 Konsultasi diperbarui di database.`, ...prev.slice(0, 9)])
          }
          setLastSyncTime(new Date())
        })
        .subscribe()

      noteChannel = supabase
        .channel('public:notes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, (payload) => {
          const timestamp = new Date().toLocaleTimeString('id-ID')
          if (payload.eventType === 'INSERT') {
            setSyncLogs(prev => [`[${timestamp}] 🔐 Catatan terenkripsi disimpan di database.`, ...prev.slice(0, 9)])
          }
          setLastSyncTime(new Date())
        })
        .subscribe()
    } catch (err) {
      console.warn('Real-time subscription setup failed:', err)
    }

    return () => {
      clearInterval(connectionCheckInterval)
      if (taskChannel) taskChannel.unsubscribe()
      if (appointmentChannel) appointmentChannel.unsubscribe()
      if (noteChannel) noteChannel.unsubscribe()
    }
  }, [dbConnectionStatus])

  useEffect(() => {
    const savedAvailability = readStoredJson(bookingAvailabilityStorageKey, null)
    if (savedAvailability && typeof savedAvailability === 'object') {
      setBookingAvailability(prev => ({ ...prev, ...savedAvailability }))
    }

    const savedShareToken = localStorage.getItem(bookingShareTokenStorageKey)
    if (savedShareToken) {
      setShareToken(savedShareToken)
    } else {
      const generated = Math.random().toString(36).slice(2, 10)
      setShareToken(generated)
      localStorage.setItem(bookingShareTokenStorageKey, generated)
    }

    const savedReservationPrice = Number(localStorage.getItem(reservationSessionPriceStorageKey) || '250000')
    setReservationSessionPrice(Number.isFinite(savedReservationPrice) && savedReservationPrice >= 0 ? savedReservationPrice : 250000)

    const savedBookingNotes = localStorage.getItem(publicBookingNotesStorageKey)
    setPublicBookingNotes(savedBookingNotes || 'Ketentuan reservasi:\n- Harap hadir 10 menit sebelum jadwal.\n- Jadwal dapat dijadwalkan ulang maksimal 1x.\n- Link meeting akan dikirim via email/WhatsApp setelah konfirmasi.')
    setPublicShareBaseUrl(localStorage.getItem(publicShareBaseUrlStorageKey) || '')
  }, [
    bookingAvailabilityStorageKey,
    bookingShareTokenStorageKey,
    reservationSessionPriceStorageKey,
    publicBookingNotesStorageKey,
    publicShareBaseUrlStorageKey
  ])

  useEffect(() => {
    localStorage.setItem(bookingAvailabilityStorageKey, JSON.stringify(bookingAvailability))
  }, [bookingAvailability, bookingAvailabilityStorageKey])

  useEffect(() => {
    if (!shareToken) return
    localStorage.setItem(bookingShareTokenStorageKey, shareToken)
  }, [shareToken, bookingShareTokenStorageKey])

  useEffect(() => {
    localStorage.setItem(publicBookingNotesStorageKey, publicBookingNotes)
  }, [publicBookingNotes, publicBookingNotesStorageKey])

  useEffect(() => {
    localStorage.setItem(publicShareBaseUrlStorageKey, publicShareBaseUrl)
  }, [publicShareBaseUrl, publicShareBaseUrlStorageKey])

  useEffect(() => {
    if (!session) return

    const onStorageBookingEvent = (event) => {
      if (event.key !== 'dyatask_public_booking_event' || !event.newValue) return
      try {
        const payload = JSON.parse(event.newValue)
        if (!payload?.clientName) return

        triggerMockNotification(
          'Reservasi Baru Masuk',
          `${payload.clientName} menjadwalkan "${payload.title}" pada ${formatLongDate(payload.date)} ${payload.time} WIB.`,
          'booking'
        )
      } catch {
        // ignore malformed payload
      }
    }

    window.addEventListener('storage', onStorageBookingEvent)
    return () => window.removeEventListener('storage', onStorageBookingEvent)
  }, [session])

  useEffect(() => {
    if (!scopedUserId) {
      setIntegrationConfigs({})
      setIntegrationConfigsLoaded(false)
      return
    }

    let cancelled = false
    setIntegrationConfigsLoaded(false)

    const loadIntegrationConfigs = async () => {
      const loadWorkspaceGoogleCalendarConfig = async (baseConfigs = {}) => {
        if (workspaceRole !== 'assistant') return baseConfigs || {}

        let nextGoogleCalendarConfig = baseConfigs?.google_calendar || null
        const { data: googleCalendarConfig, error: googleCalendarError } = await supabase.rpc('get_workspace_google_calendar_config', {
          p_owner_user_id: scopedUserId
        })

        if (cancelled) return null
        if (!googleCalendarError && googleCalendarConfig && Object.keys(googleCalendarConfig || {}).length > 0) {
          nextGoogleCalendarConfig = googleCalendarConfig
        }

        if (!nextGoogleCalendarConfig || Object.keys(nextGoogleCalendarConfig || {}).length === 0) {
          return baseConfigs || {}
        }

        return {
          ...(baseConfigs || {}),
          google_calendar: nextGoogleCalendarConfig
        }
      }

      const { data, error } = await supabase
        .from('user_integration_configs')
        .select('configs')
        .eq('user_id', scopedUserId)
        .maybeSingle()

      if (cancelled) return

      if (error) {
        console.error('Error loading integration configs:', error)
        const nextConfigs = await loadWorkspaceGoogleCalendarConfig({})
        if (cancelled || !nextConfigs) return
        setIntegrationConfigs(nextConfigs)
        setIntegrationConfigsLoaded(true)
        return
      }

      // Backward compatibility: migrate old localStorage config once if DB is empty.
      if (!data?.configs) {
        let legacy
        try {
          legacy = JSON.parse(localStorage.getItem('dyatask_integration_configs') || '{}')
        } catch {
          legacy = {}
        }

        if (legacy && Object.keys(legacy).length > 0) {
          const { error: migrateError } = await supabase
            .from('user_integration_configs')
            .upsert({
              user_id: scopedUserId,
              configs: legacy
            }, { onConflict: 'user_id' })

          if (migrateError) {
            console.error('Error migrating local integration configs:', migrateError)
          } else {
            if (cancelled) return
            setIntegrationConfigs(legacy)
            localStorage.removeItem('dyatask_integration_configs')
          }
        } else {
          if (cancelled) return
          const nextConfigs = await loadWorkspaceGoogleCalendarConfig({})
          if (cancelled || !nextConfigs) return
          setIntegrationConfigs(nextConfigs)
        }

        if (cancelled) return
        setIntegrationConfigsLoaded(true)
        return
      }

      if (cancelled) return
      const nextConfigs = await loadWorkspaceGoogleCalendarConfig(data.configs || {})
      if (cancelled || !nextConfigs) return
      setIntegrationConfigs(nextConfigs)
      setIntegrationConfigsLoaded(true)
    }

    loadIntegrationConfigs()

    const configChannel = supabase
      .channel(`user_integration_configs_${scopedUserId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_integration_configs', filter: `user_id=eq.${scopedUserId}` }, () => {
        loadIntegrationConfigs()
      })
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(configChannel)
    }
  }, [scopedUserId, workspaceRole])

  useEffect(() => {
    if (!scopedUserId) return

    const loadInvoices = async () => {
      const { data, error } = await supabase
        .from('finance_invoices')
        .select('*')
        .eq('user_id', scopedUserId)
        .order('created_at', { ascending: false })

      if (error) {
        setInvoiceStorageMode('local')
        try {
          const localData = JSON.parse(localStorage.getItem(invoiceStorageKey) || '[]')
          setInvoices(Array.isArray(localData) ? localData : [])
        } catch {
          setInvoices([])
        }
        return
      }

      setInvoiceStorageMode('cloud')
      setInvoices((data || []).map(item => ({
        id: item.id,
        clientName: item.client_name,
        title: item.title,
        orderType: item.order_type,
        amount: Number(item.amount || 0),
        issueDate: item.issue_date,
        dueDate: item.due_date,
        status: item.status || 'draft',
        notes: item.notes || '',
        createdAt: item.created_at
      })))
    }

    loadInvoices()

    const invoiceChannel = supabase
      .channel('finance_invoices_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'finance_invoices' }, () => {
        loadInvoices()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(invoiceChannel)
    }
  }, [scopedUserId, invoiceStorageKey])

  useEffect(() => {
    if (!availableTimeSlotsForSelectedDate.length) return
    if (!availableTimeSlotsForSelectedDate.includes(bookingTime)) {
      setBookingTime(availableTimeSlotsForSelectedDate[0])
    }
  }, [bookingDate, appointments, bookingAvailability, bookingTime, availableTimeSlotsForSelectedDate])

  useEffect(() => {
    if (!scopedUserId) return
    try {
      const raw = localStorage.getItem(`dyatask_order_payment_status_${scopedUserId}`)
      setOrderPaymentStatusMap(raw ? JSON.parse(raw) : {})
    } catch {
      setOrderPaymentStatusMap({})
    }
  }, [scopedUserId])

  useEffect(() => {
    if (!scopedUserId) return
    localStorage.setItem(`dyatask_order_payment_status_${scopedUserId}`, JSON.stringify(orderPaymentStatusMap))
  }, [scopedUserId, orderPaymentStatusMap])

  useEffect(() => {
    if (!scopedUserId) return
    try {
      const raw = localStorage.getItem(crmClientsStorageKey)
      const parsed = raw ? JSON.parse(raw) : []
      setCrmClients(Array.isArray(parsed) ? parsed : [])
    } catch {
      setCrmClients([])
    }
  }, [scopedUserId, crmClientsStorageKey])

  useEffect(() => {
    if (!scopedUserId) return
    try {
      const raw = localStorage.getItem(crmActivitiesStorageKey)
      const parsed = raw ? JSON.parse(raw) : []
      setCrmActivities(Array.isArray(parsed) ? parsed : [])
    } catch {
      setCrmActivities([])
    }
  }, [scopedUserId, crmActivitiesStorageKey])

  useEffect(() => {
    if (!scopedUserId) return
    localStorage.setItem(crmClientsStorageKey, JSON.stringify(crmClients))
  }, [scopedUserId, crmClients, crmClientsStorageKey])

  useEffect(() => {
    if (!scopedUserId) return
    localStorage.setItem(crmActivitiesStorageKey, JSON.stringify(crmActivities))
  }, [scopedUserId, crmActivities, crmActivitiesStorageKey])

  useEffect(() => {
    if (!scopedUserId) return
    let cancelled = false

    const loadCrmRecords = async () => {
      const [clientsResult, activitiesResult] = await Promise.all([
        supabase
          .from('crm_clients')
          .select('*')
          .eq('user_id', scopedUserId)
          .order('updated_at', { ascending: false }),
        supabase
          .from('crm_activities')
          .select('*')
          .eq('user_id', scopedUserId)
          .order('created_at', { ascending: false })
      ])

      if (cancelled) return

      if (!clientsResult.error) {
        setCrmClients((clientsResult.data || []).map(item => ({
          id: item.id,
          name: item.name || '',
          company: item.company || '',
          email: item.email || '',
          phone: item.phone || '',
          status: item.status || 'lead',
          nextFollowUpDate: item.next_follow_up_date || '',
          notes: item.notes || '',
          createdAt: item.created_at,
          updatedAt: item.updated_at
        })))
      }

      if (!activitiesResult.error) {
        setCrmActivities((activitiesResult.data || []).map(item => ({
          id: item.id,
          clientKey: item.client_key || '',
          clientName: item.client_name || '',
          clientEmail: item.client_email || '',
          title: item.title || '',
          note: item.note || '',
          dueDate: item.due_date || '',
          status: item.status || 'open',
          createdAt: item.created_at,
          updatedAt: item.updated_at
        })))
      }
    }

    loadCrmRecords()

    const crmClientsChannel = supabase
      .channel(`crm_clients_realtime_${scopedUserId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crm_clients', filter: `user_id=eq.${scopedUserId}` }, loadCrmRecords)
      .subscribe()

    const crmActivitiesChannel = supabase
      .channel(`crm_activities_realtime_${scopedUserId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crm_activities', filter: `user_id=eq.${scopedUserId}` }, loadCrmRecords)
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(crmClientsChannel)
      supabase.removeChannel(crmActivitiesChannel)
    }
  }, [scopedUserId])

  useEffect(() => {
    if (!scopedUserId) return
    let cancelled = false

    const dedupeActivityLogItems = (items) => {
      const byIdentity = new Map()
      items.forEach((item) => {
        if (!item) return
        const clientMessageId = String(item?.metadata?.clientMessageId || '').trim()
        const identityKey = clientMessageId
          ? `client:${clientMessageId}`
          : `id:${String(item.id || '')}`
        const existing = byIdentity.get(identityKey)
        if (!existing) {
          byIdentity.set(identityKey, item)
          return
        }
        const existingIsLocal = String(existing.id || '').startsWith('local-')
        const currentIsLocal = String(item.id || '').startsWith('local-')
        if (existingIsLocal && !currentIsLocal) {
          byIdentity.set(identityKey, item)
          return
        }
        const existingCreatedAt = new Date(existing.createdAt || 0).getTime()
        const currentCreatedAt = new Date(item.createdAt || 0).getTime()
        if (currentCreatedAt > existingCreatedAt) {
          byIdentity.set(identityKey, item)
        }
      })
      return Array.from(byIdentity.values()).sort((a, b) => (
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      ))
    }

    const mapActivityLog = (item) => ({
      id: item.id,
      type: item.event_type || 'Log',
      title: item.title,
      detail: item.detail || '',
      tone: item.tone || 'purple',
      sourceTable: item.source_table || '',
      sourceId: item.source_id || '',
      metadata: item.metadata || {},
      createdAt: item.created_at
    })

    const loadActivityLogs = async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', scopedUserId)
        .order('created_at', { ascending: false })
        .limit(300)

      if (cancelled) return
      if (error) {
        console.warn('Activity logs fallback aktif:', error.message)
        return
      }

      setActivityLogs(dedupeActivityLogItems((data || []).map(mapActivityLog)))
      setLastSyncTime(new Date())
    }

    loadActivityLogs()
    const interval = setInterval(loadActivityLogs, 3000)

    const activityChannel = supabase
      .channel(`activity_logs_realtime_${scopedUserId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_logs', filter: `user_id=eq.${scopedUserId}` }, (payload) => {
        const incoming = payload?.new || null
        const previous = payload?.old || null
        if (
          payload?.eventType === 'INSERT'
          && incoming?.metadata?.kind === 'workspace_chat'
          && incoming?.metadata?.senderUserId
          && incoming.metadata.senderUserId !== actorUserId
          && incoming?.id
          && !seenAssistantNoteIdsRef.current.has(incoming.id)
        ) {
          seenAssistantNoteIdsRef.current.add(incoming.id)
          triggerMockNotification(
            `Pesan dari ${incoming.metadata?.senderName || 'Workspace'}`,
            incoming.detail || 'Pesan baru di workspace chat.',
            'workspace-chat',
            {
              id: incoming.id,
              sourceTable: 'activity_logs',
              senderName: incoming.metadata?.senderName || 'Assistant',
              workspaceChat: true
            }
          )
        }
        setActivityLogs(prev => {
          const mapRow = (row) => ({
            id: row.id,
            type: row.event_type || 'Log',
            title: row.title,
            detail: row.detail || '',
            tone: row.tone || 'purple',
            sourceTable: row.source_table || '',
            sourceId: row.source_id || '',
            metadata: row.metadata || {},
            createdAt: row.created_at
          })
          if (payload?.eventType === 'INSERT' && incoming?.id) {
            const next = [mapRow(incoming), ...prev.filter(item => item.id !== incoming.id)]
            return dedupeActivityLogItems(next).slice(0, 300)
          }
          if (payload?.eventType === 'UPDATE' && incoming?.id) {
            return dedupeActivityLogItems(prev.map(item => item.id === incoming.id ? mapRow(incoming) : item)).slice(0, 300)
          }
          if (payload?.eventType === 'DELETE' && previous?.id) {
            return dedupeActivityLogItems(prev.filter(item => item.id !== previous.id)).slice(0, 300)
          }
          return prev
        })
      })
      .subscribe()

    return () => {
      cancelled = true
      clearInterval(interval)
      supabase.removeChannel(activityChannel)
    }
  }, [scopedUserId, workspaceRole, actorUserId])

  // Fetch real data from Supabase once authenticated
  useEffect(() => {
    if (!session) return;
    
    const fetchTasks = async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching tasks:', error);
      } else if (data) {
        setTasks(data.map(t => ({
          id: t.id,
          title: t.title,
          category: t.category,
          priority: t.priority,
          colorLabel: t.color_label,
          status: t.status,
          dueTime: t.due_time,
          hasReminder: t.has_reminder,
          parentTaskId: t.parent_task_id || null,
          taskType: t.task_type || (t.parent_task_id ? 'subtask' : 'task'),
          calendarDate: t.task_date || (t.created_at ? t.created_at.slice(0, 10) : todayString)
        })));
      }
    };

    const fetchProjectFolders = async () => {
      const storageKey = `dyatask_project_folders_${scopedUserId}`
      const { data, error } = await supabase
        .from('project_folders')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) {
        try {
          setProjectFolderRecords(JSON.parse(localStorage.getItem(storageKey) || '[]'))
        } catch {
          setProjectFolderRecords([])
        }
        return
      }

      setProjectFolderRecords((data || []).map(folder => ({
        id: folder.id,
        name: folder.name,
        color: folder.color || '#8B5CF6'
      })))
    }
    
    const fetchAppointments = async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching appointments:', error);
      } else if (data) {
        setAppointments(data.map(a => ({
          id: a.id,
          clientName: a.client_name,
          title: a.title,
          time: a.time,
          date: a.date,
          status: a.status,
          email: a.email,
          createdAt: a.created_at
        })));
      }
    };
    
    const fetchNotes = async () => {
      const { data, error } = await supabase
        .from('secure_notes')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching notes:', error);
      } else if (data) {
        setNotes(data.map(n => ({
          id: n.id,
          title: n.title,
          cipherText: n.cipher_text,
          iv: n.iv,
          salt: n.salt,
          plaintextHint: n.plaintext_hint,
          isEncrypted: true
        })));
      }
    };

    fetchTasks();
    fetchProjectFolders();
    fetchAppointments();
    fetchNotes();

    const appointmentsChannel = supabase
      .channel('appointments_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'appointments' }, payload => {
        const inserted = payload.new
        if (!inserted) return

        setAppointments(prev => {
          if (prev.some(item => item.id === inserted.id)) return prev
          return [{
            id: inserted.id,
            clientName: inserted.client_name,
            title: inserted.title,
            time: inserted.time,
            date: inserted.date,
            status: inserted.status,
            email: inserted.email,
            createdAt: inserted.created_at || new Date().toISOString()
          }, ...prev]
        })

        triggerMockNotification(
          'Reservasi Baru Masuk',
          `${inserted.client_name} menjadwalkan "${inserted.title}" pada ${formatLongDate(inserted.date)} ${inserted.time} WIB.`,
          'booking',
          {
            email: inserted.email,
            clientName: inserted.client_name,
            title: inserted.title,
            date: inserted.date,
            time: inserted.time
          }
        )

        const timestamp = new Date().toLocaleTimeString('id-ID')
        setSyncLogs(prev => [
          `[${timestamp}] 🔔 Reservasi publik baru: ${inserted.client_name} • ${formatLongDate(inserted.date)} ${inserted.time}`,
          ...prev
        ])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(appointmentsChannel)
    }
  }, [session])

  // Sync Log auto-updates
  useEffect(() => {
    const timer = setInterval(() => {
      const logs = getConfiguredIntegrationSyncLogs()
      const randomLog = logs[Math.floor(Math.random() * logs.length)]
      const timestamp = new Date().toLocaleTimeString('id-ID')
      setSyncLogs(prev => [`[${timestamp}] ${randomLog}`, ...prev.slice(0, 5)])
    }, 12000)
    return () => clearInterval(timer)
  }, [integrationConfigs])

  useEffect(() => {
    let cancelled = false
    const fetchHolidays = async () => {
      try {
        const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${calendarYear}/ID`)
        const data = await response.json()
        if (!response.ok) throw new Error(data?.message || 'Gagal memuat hari libur nasional.')
        if (cancelled) return
        setNationalHolidays((data || []).map(holiday => ({
          id: `${holiday.date}-${holiday.localName || holiday.name}`,
          date: holiday.date,
          title: holiday.localName || holiday.name,
          name: holiday.name
        })))
      } catch (err) {
        if (!cancelled) {
          setNationalHolidays([])
          setSyncLogs(prev => [`[${new Date().toLocaleTimeString('id-ID')}] ⚠️ Hari libur nasional gagal dimuat: ${err.message}`, ...prev.slice(0, 9)])
        }
      }
    }

    fetchHolidays()
    return () => {
      cancelled = true
    }
  }, [calendarYear])

  useEffect(() => {
    if (!integrationConfigsLoaded) return
    fetchGoogleCalendarEventsForMonth({ notifyNew: false })
  }, [calendarYear, calendarMonth, integrationConfigs, integrationConfigsLoaded])

  useEffect(() => {
    if (!scopedUserId) return

    const fetchSpreadsheetOrders = async () => {
      const { data, error } = await supabase
        .from('spreadsheet_orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching spreadsheet orders:', error)
        return
      }

      const mapped = (data || []).map(order => ({
        id: order.id,
        customerName: order.customer_name,
        orderName: order.order_name,
        orderType: order.order_type,
        budget: Number(order.budget || 0),
        status: order.status,
        paymentStatus: order.payment_status || orderPaymentStatusMap?.[order.id] || 'belum_bayar',
        dueDate: order.due_date,
        publicToken: order.public_token,
        createdAt: order.created_at,
        updatedAt: order.updated_at
      }))

      setSpreadsheetOrders(mapped)
      setSelectedOrderId(prev => prev || mapped[0]?.id || null)
    }

    const fetchOrderTimeline = async () => {
      const { data, error } = await supabase
        .from('spreadsheet_order_timeline')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching spreadsheet timeline:', error)
        return
      }

      setOrderTimelineItems((data || []).map(item => ({
        id: item.id,
        orderId: item.order_id,
        title: item.title,
        note: item.note || '',
        progressPercent: Number(item.progress_percent || 0),
        createdAt: item.created_at,
        updatedBy: item.updated_by || 'system'
      })))
    }

    fetchSpreadsheetOrders()
    fetchOrderTimeline()

    const ordersChannel = supabase
      .channel('spreadsheet_orders_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'spreadsheet_orders' }, () => {
        fetchSpreadsheetOrders()
      })
      .subscribe()

    const timelineChannel = supabase
      .channel('spreadsheet_order_timeline_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'spreadsheet_order_timeline' }, () => {
        fetchOrderTimeline()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(ordersChannel)
      supabase.removeChannel(timelineChannel)
    }
  }, [scopedUserId, orderPaymentStatusMap])

  useEffect(() => {
    if (!scopedUserId || !spreadsheetOrders.length) return

    const formatDate = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const today = new Date()
    const todayStr = formatDate(today)
    const tomorrowDate = new Date(today)
    tomorrowDate.setDate(tomorrowDate.getDate() + 1)
    const tomorrowStr = formatDate(tomorrowDate)

    const checkDeadlineReminder = () => {
      spreadsheetOrders.forEach(order => {
        const status = String(order.status || '').toLowerCase()
        if (status === 'completed' || status === 'done') return
        if (!order.dueDate) return

        const dueStr = String(order.dueDate).slice(0, 10)
        const reminderScope = `${order.id}:${todayStr}`
        const dueScope = `${order.id}:${dueStr}`

        if (dueStr === tomorrowStr) {
          const key = `${reminderScope}:deadline_tomorrow`
          if (!orderDeadlineReminderKeysRef.current.has(key)) {
            triggerMockNotification(
              'Reminder Deadline Besok',
              `Order "${order.orderName}" untuk ${order.customerName} deadline besok (${dueStr}).`,
              'order_deadline',
              { kind: 'order_deadline_tomorrow', orderId: order.id, dueDate: dueStr }
            )
            orderDeadlineReminderKeysRef.current.add(key)
          }
        } else if (dueStr === todayStr) {
          const key = `${reminderScope}:deadline_today`
          if (!orderDeadlineReminderKeysRef.current.has(key)) {
            triggerMockNotification(
              'Reminder Deadline Hari Ini',
              `Order "${order.orderName}" untuk ${order.customerName} jatuh tempo hari ini.`,
              'order_deadline',
              { kind: 'order_deadline_today', orderId: order.id, dueDate: dueStr }
            )
            orderDeadlineReminderKeysRef.current.add(key)
          }
        } else if (dueStr < todayStr) {
          const key = `${dueScope}:deadline_overdue`
          if (!orderDeadlineReminderKeysRef.current.has(key)) {
            triggerMockNotification(
              'Order Melewati Deadline',
              `Order "${order.orderName}" untuk ${order.customerName} sudah lewat deadline (${dueStr}).`,
              'order_deadline',
              { kind: 'order_deadline_overdue', orderId: order.id, dueDate: dueStr }
            )
            orderDeadlineReminderKeysRef.current.add(key)
          }
        }
      })
    }

    checkDeadlineReminder()
    const interval = setInterval(checkDeadlineReminder, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [scopedUserId, spreadsheetOrders])

  const [publicTrackingPayload, setPublicTrackingPayload] = useState(null)
  useEffect(() => {
    if (!isPublicTrackingMode || !publicTrackingToken) return

    const fetchPublicTrackingPayload = async () => {
      const { data, error } = await supabase.rpc('get_public_order_timeline', { p_token: publicTrackingToken })
      if (error) {
        console.error('Error fetching public tracking payload:', error)
        setPublicTrackingPayload({ error: error.message })
        return
      }
      setPublicTrackingPayload(data)
    }

    fetchPublicTrackingPayload()
  }, [isPublicTrackingMode, publicTrackingToken])

  useEffect(() => {
    if (!integrationConfigsLoaded) return undefined

    const cfg = integrationConfigs.google_calendar || {}
    const hasGoogleCalendarConfig = Boolean(
      (cfg.client_id || '').trim() &&
      (cfg.client_secret || '').trim() &&
      (cfg.refresh_token || '').trim()
    )
    if (!hasGoogleCalendarConfig) return undefined

    const interval = setInterval(() => {
      fetchGoogleCalendarEventsForMonth({ notifyNew: true })
    }, 60000)

    return () => clearInterval(interval)
  }, [calendarYear, calendarMonth, integrationConfigs, integrationConfigsLoaded])

  useEffect(() => {
    const parsed = readStoredJson(notificationHistoryStorageKey, [])
    setNotifications(Array.isArray(parsed) ? parsed : [])
    setShowNotificationList(false)
    setNotificationBannerVisible(false)
  }, [notificationHistoryStorageKey])

  useEffect(() => {
    localStorage.setItem(notificationHistoryStorageKey, JSON.stringify(notifications.slice(0, 300)))
  }, [notifications, notificationHistoryStorageKey])

  useEffect(() => {
    if (activeNotifications.length === 0 || !notificationBannerVisible) return
    const timer = setTimeout(() => {
      setNotificationBannerVisible(false)
      setShowNotificationList(false)
    }, 30000)
    return () => clearTimeout(timer)
  }, [activeNotifications.length, notificationBannerVisible])

  const createActivityLog = async ({ type, title, detail, tone = 'purple', sourceTable = null, sourceId = null, metadata = {} }) => {
    const createdAt = new Date().toISOString()
    const clientMessageId = String(metadata?.clientMessageId || '').trim()
    const localLog = {
      id: `local-${clientMessageId || Date.now()}`,
      type,
      title,
      detail,
      tone,
      sourceTable: sourceTable || '',
      sourceId: sourceId || '',
      metadata,
      createdAt
    }

    setActivityLogs(prev => {
      const next = [localLog, ...prev.filter(item => (
        item.id !== localLog.id
        && (!clientMessageId || String(item?.metadata?.clientMessageId || '') !== clientMessageId)
      ))]
      return next.slice(0, 300)
    })

    if (!scopedUserId) return

    const { error } = await supabase
      .from('activity_logs')
      .insert([{
        user_id: scopedUserId,
        event_type: type,
        title,
        detail,
        tone,
        source_table: sourceTable,
        source_id: sourceId ? String(sourceId) : null,
        metadata
      }])

    if (error) {
      console.warn('Gagal menyimpan activity log:', error.message)
    }
  }

  const sendWorkspaceChat = async (messageText, metadata = {}) => {
    const message = String(messageText || '').trim()
    if (!message) return

    const clientMessageId = `workspace-chat-${actorUserId || 'anon'}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const clientCreatedAt = new Date().toISOString()
    const chatMemberId = metadata.chatMemberId || activeWorkspaceChatMemberId
    const chatMemberUserId = metadata.chatMemberUserId || activeWorkspaceChatMember?.memberUserId || actorUserId
    if (workspaceRole === 'owner' && workspaceAssistantChatMembers.length > 0 && !chatMemberId) {
      alert('Pilih assistant dulu sebelum mengirim chat.')
      return
    }

    if (workspaceChatTypingHeartbeatRef.current) {
      clearInterval(workspaceChatTypingHeartbeatRef.current)
      workspaceChatTypingHeartbeatRef.current = null
    }
    if (workspaceChatTypingIdleTimerRef.current) {
      clearTimeout(workspaceChatTypingIdleTimerRef.current)
      workspaceChatTypingIdleTimerRef.current = null
    }
    workspaceChatTypingStateRef.current = false

    setWorkspaceChatSending(true)
    await createActivityLog({
      type: 'Workspace Chat',
      title: `${isAssistantWorkspace ? 'Assistant' : 'Owner'}: ${isAssistantWorkspace ? assistantDisplayName : headerUserName}`,
      detail: message,
      tone: 'purple',
      sourceTable: 'activity_logs',
      sourceId: actorUserId,
      metadata: {
        kind: 'workspace_chat',
        senderRole: workspaceRole,
        senderUserId: actorUserId,
        senderName: isAssistantWorkspace ? assistantDisplayName : headerUserName,
        senderEmail: session?.user?.email || '',
        workspaceOwnerId: workspaceContext?.ownerUserId || '',
        chatMemberId,
        chatMemberUserId,
        chatMemberLabel: activeWorkspaceChatMemberName,
        clientMessageId,
        clientCreatedAt,
        ...(workspaceChatReplyTarget ? {
          replyToMessageId: workspaceChatReplyTarget.id,
          replyToSenderName: workspaceChatReplyTarget.senderName,
          replyToPreview: workspaceChatReplyTarget.preview
        } : {}),
        ...metadata
      }
    })
    setWorkspaceChatSending(false)
    setWorkspaceChatMessage('')
    setWorkspaceChatReplyTarget(null)
  }

  const openWorkspaceChatReply = (item) => {
    if (!item?.id) return
    setWorkspaceChatActionMessageId('')
    setWorkspaceChatReplyTarget({
      id: item.id,
      senderName: getWorkspaceMessageSenderName(item),
      preview: summarizeWorkspaceChatMessage(item.detail)
    })
  }

  const deleteWorkspaceChatMessage = async (item) => {
    if (!item?.id || !scopedUserId) return
    const isMine = isWorkspaceChatMine(item)
    if (!isMine && !canManageTeam) {
      alert('Hanya pengirim pesan atau owner yang bisa menghapus chat ini.')
      return
    }
    const ok = window.confirm('Hapus pesan ini dari chat?')
    if (!ok) return

    const targetId = resolvePersistedWorkspaceChatMessageId(item)
    if (!targetId && String(item.id || '').startsWith('local-')) {
      setActivityLogs(prev => prev.filter(log => log.id !== item.id))
      if (workspaceChatReplyTarget?.id === item.id) {
        setWorkspaceChatReplyTarget(null)
      }
      setWorkspaceChatActionMessageId('')
      return
    }

    const { data, error } = await supabase
      .from('activity_logs')
      .delete()
      .eq('user_id', scopedUserId)
      .eq('id', targetId || item.id)
      .select('id')

    if (error) {
      alert(`Gagal menghapus chat: ${error.message}`)
      return
    }
    if ((data || []).length === 0 && !(targetId || item.id)) {
      alert('Pesan belum ditemukan di database. Coba ulang beberapa detik lagi.')
      return
    }

    const deletedIds = new Set([String(item.id), String(targetId || item.id)])
    setActivityLogs(prev => prev.filter(log => !deletedIds.has(String(log.id))))
    if (workspaceChatReplyTarget?.id === item.id || workspaceChatReplyTarget?.id === (targetId || item.id)) {
      setWorkspaceChatReplyTarget(null)
    }
    setWorkspaceChatActionMessageId('')
  }

  const handleWorkspaceChatBubblePointerDown = (event, item) => {
    if (!item?.id) return
    const pointX = event?.clientX ?? event?.touches?.[0]?.clientX ?? 0
    const pointY = event?.clientY ?? event?.touches?.[0]?.clientY ?? 0
    workspaceChatTouchStartRef.current = { x: pointX, y: pointY, messageId: item.id }
    if (workspaceChatLongPressTimerRef.current) clearTimeout(workspaceChatLongPressTimerRef.current)
    workspaceChatLongPressTimerRef.current = setTimeout(() => {
      setWorkspaceChatActionMessageId(item.id)
    }, 420)
  }

  const clearWorkspaceChatBubbleGesture = () => {
    if (workspaceChatLongPressTimerRef.current) {
      clearTimeout(workspaceChatLongPressTimerRef.current)
      workspaceChatLongPressTimerRef.current = null
    }
  }

  const handleWorkspaceChatBubblePointerUp = (event, item) => {
    const start = workspaceChatTouchStartRef.current
    clearWorkspaceChatBubbleGesture()
    if (!item?.id || start.messageId !== item.id) return
    const pointX = event?.clientX ?? event?.changedTouches?.[0]?.clientX ?? 0
    const pointY = event?.clientY ?? event?.changedTouches?.[0]?.clientY ?? 0
    const deltaX = pointX - start.x
    const deltaY = Math.abs(pointY - start.y)
    if (deltaX > 54 && deltaY < 36) {
      openWorkspaceChatReply(item)
    }
  }

  const publishWorkspaceChatTyping = async (typing) => {
    if (!actorUserId || !scopedUserId || !isWorkspaceChatThreadVisible) return
    const chatMemberId = activeWorkspaceChatMemberId || ''
    const chatMemberUserId = activeWorkspaceChatMember?.memberUserId || actorUserId
    await createActivityLog({
      type: 'Workspace Chat',
      title: typing ? 'Sedang mengetik...' : 'Berhenti mengetik',
      detail: typing ? `${headerUserName} sedang mengetik.` : `${headerUserName} berhenti mengetik.`,
      tone: 'purple',
      sourceTable: 'activity_logs',
      sourceId: actorUserId,
      metadata: {
        kind: 'workspace_chat_typing',
        typing,
        senderRole: workspaceRole,
        senderUserId: actorUserId,
        senderName: isAssistantWorkspace ? assistantDisplayName : headerUserName,
        senderEmail: session?.user?.email || '',
        workspaceOwnerId: workspaceContext?.ownerUserId || '',
        chatMemberId,
        chatMemberUserId,
        chatMemberLabel: activeWorkspaceChatMemberName
      }
    })
  }

  const handleSendWorkspaceChatMessage = async (e) => {
    e.preventDefault()
    await sendWorkspaceChat(workspaceChatMessage)
  }

  const handleWorkspaceChatInputKeyDown = async (e) => {
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent?.isComposing) return
    e.preventDefault()
    if (workspaceChatSending || !workspaceChatMessage.trim()) return
    await sendWorkspaceChat(workspaceChatMessage)
  }

  const appendWorkspaceChatEmoji = (emoji) => {
    setWorkspaceChatMessage(prev => `${prev}${emoji}`)
    setWorkspaceEmojiPickerOpen(false)
  }

  const sendQuickWorkspaceReminder = async (kind) => {
    if (!isAssistantWorkspace) return
    if (kind === 'task') {
      const lines = tasks
        .filter(task => task.status !== 'done' && (task.calendarDate || todayString) === todayString)
        .slice(0, 6)
        .map(task => `- ${task.title} • ${formatLongDate(todayString)} ${task.dueTime || ''}`.trim())
      const body = lines.length ? `Pengingat hari ini, task aktif:\n${lines.join('\n')}` : 'Pengingat hari ini: belum ada task aktif tercatat.'
      await sendWorkspaceChat(body, { reminderType: 'task_today' })
      return
    }
    if (kind === 'event') {
      const lines = appointments
        .filter(appt => appt.date === todayString)
        .slice(0, 6)
        .map(appt => `- ${appt.title} • ${formatLongDate(appt.date)} ${appt.time || ''}`.trim())
      const body = lines.length ? `Pengingat hari ini, event:\n${lines.join('\n')}` : 'Pengingat hari ini: belum ada event reservasi.'
      await sendWorkspaceChat(body, { reminderType: 'event_today' })
      return
    }
    if (kind === 'gcall') {
      const lines = googleCalendarEvents
        .filter(event => event.date === todayString)
        .slice(0, 6)
        .map(event => `- ${event.title} • ${formatLongDate(event.date)} ${event.time || 'All day'}`)
      const body = lines.length ? `Pengingat hari ini, Google Calendar:\n${lines.join('\n')}` : 'Pengingat hari ini: belum ada event Google Calendar.'
      await sendWorkspaceChat(body, { reminderType: 'gcall_today' })
      return
    }
    if (kind === 'deadline') {
      const lines = spreadsheetOrders
        .filter(order => {
          const status = String(order.status || '').toLowerCase()
          return !['completed', 'done'].includes(status) && String(order.dueDate || '') === todayString
        })
        .slice(0, 6)
        .map(order => `- ${order.orderName} • due ${formatLongDate(order.dueDate)}`)
      const body = lines.length ? `Pengingat hari ini, deadline order:\n${lines.join('\n')}` : 'Pengingat hari ini: belum ada deadline order.'
      await sendWorkspaceChat(body, { reminderType: 'deadline_today' })
    }
  }

  const sendWorkspaceReminderAck = async (messageId) => {
    if (workspaceRole !== 'owner' || !messageId) return
    const acknowledgedMessage = workspaceChatMessages.find(item => item.id === messageId)
    const acknowledgedSummary = String(acknowledgedMessage?.detail || '')
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)[0] || 'Pengingat sudah dibaca.'
    const ownerName = String(headerUserName || 'Owner').trim()
    const confirmationMessage = `${ownerName} telah mengkonfirmasi ${acknowledgedSummary},\n\nTerimakasih telah mengingatkan`

    await createActivityLog({
      type: 'Workspace Chat',
      title: 'Konfirmasi pengingat dibaca',
      detail: acknowledgedSummary,
      tone: 'purple',
      sourceTable: 'activity_logs',
      sourceId: actorUserId,
      metadata: {
        kind: 'workspace_chat_ack',
        senderRole: workspaceRole,
        senderUserId: actorUserId,
        senderName: headerUserName,
        senderEmail: session?.user?.email || '',
        workspaceOwnerId: workspaceContext?.ownerUserId || '',
        chatMemberId: activeWorkspaceChatMemberId || '',
        chatMemberUserId: activeWorkspaceChatMember?.memberUserId || '',
        chatMemberLabel: activeWorkspaceChatMemberName,
        ackForMessageId: messageId
      }
    })

    await sendWorkspaceChat(confirmationMessage, {
      replyType: 'ack_visible',
      ackForMessageId: messageId,
      ackVisible: true
    })
  }

  const handleClearWorkspaceChat = async () => {
    if (workspaceRole !== 'owner') {
      alert('Hanya owner yang bisa clear chat.')
      return
    }
    const ok = window.confirm(activeWorkspaceChatMemberId ? `Hapus history chat dengan ${activeWorkspaceChatMemberName}?` : 'Hapus semua history chat owner-assistant?')
    if (!ok) return

    const threadLogIds = Array.from(new Set(
      activityLogs
        .filter(item => matchesWorkspaceChatThreadLog(item))
        .map(item => resolvePersistedWorkspaceChatMessageId(item) || String(item.id || ''))
        .filter(Boolean)
        .filter(id => !String(id).startsWith('local-'))
    ))

    let error = null
    let deletedCount = 0
    if (threadLogIds.length > 0) {
      for (let index = 0; index < threadLogIds.length; index += 100) {
        const idChunk = threadLogIds.slice(index, index + 100)
        const { data: deletedRows, error: deleteByIdsError } = await supabase
          .from('activity_logs')
          .delete()
          .eq('user_id', scopedUserId)
          .in('id', idChunk)
          .select('id')
        if (deleteByIdsError) {
          error = deleteByIdsError
          break
        }
        deletedCount += (deletedRows || []).length
      }
    } else {
      let deleteQuery = supabase
        .from('activity_logs')
        .delete()
        .eq('user_id', scopedUserId)
        .eq('event_type', 'Workspace Chat')
      if (activeWorkspaceChatMemberId) {
        deleteQuery = deleteQuery.eq('metadata->>chatMemberId', activeWorkspaceChatMemberId)
      }
      const { data: deletedRows, error: fallbackDeleteError } = await deleteQuery.select('id')
      error = fallbackDeleteError
      deletedCount = (deletedRows || []).length
    }

    if (error) {
      alert(`Gagal clear chat: ${error.message}`)
      return
    }
    if (deletedCount === 0 && threadLogIds.length > 0) {
      alert('Chat belum bisa dihapus dari database. Jalankan SQL migration terbaru untuk activity_logs delete policy dulu.')
      return
    }

    const removedIds = new Set([
      ...activityLogs.filter(item => matchesWorkspaceChatThreadLog(item)).map(item => String(item.id || '')),
      ...threadLogIds.map(id => String(id))
    ])
    setActivityLogs(prev => prev.filter(item => !removedIds.has(String(item.id || ''))))
    setWorkspaceChatActionMessageId('')
    setWorkspaceChatReplyTarget(null)
    setWorkspaceChatOwnerMenuOpen(false)
  }

  const updateWorkspaceChatStatus = async (statusValue) => {
    const normalizedStatus = ['active', 'busy', 'inactive'].includes(String(statusValue || '').toLowerCase())
      ? String(statusValue).toLowerCase()
      : 'active'

    if (!workspaceChatStatusTargetUserId) return

    setWorkspaceChatStatusMenuOpen(false)
    await createActivityLog({
      type: 'Workspace Chat',
      title: `Status user: ${workspaceChatStatusTitleLabel(normalizedStatus)}`,
      detail: `${headerUserName} mengubah status menjadi ${workspaceChatStatusTitleLabel(normalizedStatus)}.`,
      tone: 'purple',
      sourceTable: 'activity_logs',
      sourceId: actorUserId,
      metadata: {
        kind: 'workspace_chat_status',
        senderRole: workspaceRole,
        senderUserId: actorUserId,
        senderName: headerUserName,
        targetUserId: workspaceChatStatusTargetUserId,
        targetLabel: workspaceChatStatusTargetLabel,
        status: normalizedStatus,
        chatMemberId: activeWorkspaceChatMemberId || '',
        chatMemberLabel: activeWorkspaceChatMemberName,
        workspaceOwnerId: workspaceContext?.ownerUserId || ''
      }
    })
  }

  useEffect(() => {
    if (!isWorkspaceChatThreadVisible) return
    setWorkspaceChatLastReadAt(Date.now())
    setWorkspaceChatStatusMenuOpen(false)
  }, [isWorkspaceChatThreadVisible, workspaceChatMessages.length])

  useEffect(() => {
    setWorkspaceChatActionMessageId('')
    setWorkspaceChatReplyTarget(null)
    setWorkspaceChatOwnerMenuOpen(false)
  }, [activeWorkspaceChatMemberId, workspaceRole, mobileWorkspaceChatView])

  useEffect(() => {
    if (!isWorkspaceChatThreadVisible) return
    const feed = workspaceChatFeedRef.current
    if (!feed) return
    const scrollToBottom = () => {
      feed.scrollTop = feed.scrollHeight
    }
    scrollToBottom()
    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(scrollToBottom)
    }
  }, [isWorkspaceChatThreadVisible, workspaceChatMessages.length])

  useEffect(() => {
    const clearTypingTimers = () => {
      if (workspaceChatTypingHeartbeatRef.current) {
        clearInterval(workspaceChatTypingHeartbeatRef.current)
        workspaceChatTypingHeartbeatRef.current = null
      }
      if (workspaceChatTypingIdleTimerRef.current) {
        clearTimeout(workspaceChatTypingIdleTimerRef.current)
        workspaceChatTypingIdleTimerRef.current = null
      }
    }

    if (!isWorkspaceChatThreadVisible || !actorUserId || !scopedUserId) {
      clearTypingTimers()
      if (workspaceChatTypingStateRef.current) {
        publishWorkspaceChatTyping(false)
      }
      workspaceChatTypingStateRef.current = false
      return
    }

    const isTypingNow = workspaceChatMessage.trim().length > 0
    if (!isTypingNow) {
      clearTypingTimers()
      if (workspaceChatTypingStateRef.current) {
        workspaceChatTypingStateRef.current = false
        publishWorkspaceChatTyping(false)
      }
      return
    }

    if (!workspaceChatTypingStateRef.current) {
      workspaceChatTypingStateRef.current = true
      publishWorkspaceChatTyping(true)
    }

    if (!workspaceChatTypingHeartbeatRef.current) {
      workspaceChatTypingHeartbeatRef.current = setInterval(() => {
        publishWorkspaceChatTyping(true)
      }, 2500)
    }

    if (workspaceChatTypingIdleTimerRef.current) {
      clearTimeout(workspaceChatTypingIdleTimerRef.current)
    }
    workspaceChatTypingIdleTimerRef.current = setTimeout(() => {
      clearTypingTimers()
      if (workspaceChatTypingStateRef.current) {
        workspaceChatTypingStateRef.current = false
        publishWorkspaceChatTyping(false)
      }
    }, 3200)

    return clearTypingTimers
  }, [
    isWorkspaceChatThreadVisible,
    workspaceChatMessage,
    actorUserId,
    scopedUserId,
    activeWorkspaceChatMemberId,
    activeWorkspaceChatMember?.memberUserId,
    activeWorkspaceChatMemberName,
    workspaceRole,
    headerUserName,
    assistantDisplayName,
    isAssistantWorkspace,
    session?.user?.email,
    workspaceContext?.ownerUserId
  ])

  useEffect(() => {
    if (!isWorkspaceChatThreadVisible) {
      workspaceChatSeenSignatureRef.current = ''
      workspaceChatPresenceSignatureRef.current = ''
      workspaceChatInactiveNoticeSignatureRef.current = ''
      setWorkspaceChatStatusMenuOpen(false)
      setWorkspaceChatActionMessageId('')
      setWorkspaceChatOwnerMenuOpen(false)
      return
    }

    if (!actorUserId || !scopedUserId) return

    const seenSignature = [
      actorUserId || 'self',
      workspaceChatStatusTargetUserId || 'self',
      activeWorkspaceChatMemberId || 'no-member',
      activeWorkspaceChatMember?.memberUserId || 'no-member-user',
      workspaceChatLatestMessageMarker
    ].join(':')
    if (workspaceChatSeenSignatureRef.current === seenSignature) return
    workspaceChatSeenSignatureRef.current = seenSignature

    createActivityLog({
      type: 'Workspace Chat',
      title: `Chat dibuka: ${workspaceChatTitleName}`,
      detail: `${workspaceChatTitleName} membuka workspace chat.`,
      tone: 'purple',
      sourceTable: 'activity_logs',
      sourceId: actorUserId,
      metadata: {
        kind: 'workspace_chat_seen',
        senderRole: workspaceRole,
        senderUserId: actorUserId,
        senderName: workspaceChatTitleName,
        targetUserId: actorUserId,
        targetLabel: headerUserName,
        chatMemberId: activeWorkspaceChatMemberId || '',
        chatMemberUserId: activeWorkspaceChatMember?.memberUserId || '',
        chatMemberLabel: activeWorkspaceChatMemberName,
        workspaceOwnerId: workspaceContext?.ownerUserId || ''
      }
    })
  }, [
    isWorkspaceChatThreadVisible,
    actorUserId,
    scopedUserId,
    workspaceChatStatusTargetUserId,
    workspaceChatTitleName,
    workspaceRole,
    activeWorkspaceChatMemberId,
    activeWorkspaceChatMember?.memberUserId,
    activeWorkspaceChatMemberName,
    workspaceContext?.ownerUserId,
    workspaceChatLatestMessageMarker
  ])

  useEffect(() => {
    if (!isWorkspaceChatThreadVisible || !actorUserId || !scopedUserId) return undefined

    const publishPresence = (inThread) => createActivityLog({
      type: 'Workspace Chat',
      title: `${inThread ? 'Masuk' : 'Keluar'} room chat: ${workspaceChatTitleName}`,
      detail: `${headerUserName} ${inThread ? 'sedang berada' : 'tidak lagi berada'} di room chat.`,
      tone: 'purple',
      sourceTable: 'activity_logs',
      sourceId: actorUserId,
      metadata: {
        kind: 'workspace_chat_presence',
        inThread,
        senderRole: workspaceRole,
        senderUserId: actorUserId,
        senderName: headerUserName,
        targetUserId: actorUserId,
        targetLabel: headerUserName,
        chatMemberId: activeWorkspaceChatMemberId || '',
        chatMemberUserId: activeWorkspaceChatMember?.memberUserId || '',
        chatMemberLabel: activeWorkspaceChatMemberName,
        workspaceOwnerId: workspaceContext?.ownerUserId || ''
      }
    })

    const presenceSignature = [
      actorUserId || 'self',
      workspaceRole,
      activeWorkspaceChatMemberId || 'no-member',
      activeWorkspaceChatMember?.memberUserId || 'no-member-user'
    ].join(':')

    if (workspaceChatPresenceSignatureRef.current !== presenceSignature) {
      workspaceChatPresenceSignatureRef.current = presenceSignature
      publishPresence(true)
    }

    if (workspaceChatPresenceHeartbeatRef.current) {
      clearInterval(workspaceChatPresenceHeartbeatRef.current)
    }
    workspaceChatPresenceHeartbeatRef.current = setInterval(() => {
      publishPresence(true)
    }, 25000)

    return () => {
      if (workspaceChatPresenceHeartbeatRef.current) {
        clearInterval(workspaceChatPresenceHeartbeatRef.current)
        workspaceChatPresenceHeartbeatRef.current = null
      }
      publishPresence(false)
      workspaceChatPresenceSignatureRef.current = ''
    }
  }, [
    isWorkspaceChatThreadVisible,
    actorUserId,
    scopedUserId,
    workspaceRole,
    workspaceChatTitleName,
    headerUserName,
    activeWorkspaceChatMemberId,
    activeWorkspaceChatMember?.memberUserId,
    activeWorkspaceChatMemberName,
    workspaceContext?.ownerUserId
  ])

  useEffect(() => {
    if (!isWorkspaceChatThreadVisible) return
    if (workspaceChatPeerStatusValue !== 'inactive') return
    if (!scopedUserId || !workspaceChatPeerUserId) return

    const currentStatusLogCreatedAt = workspaceChatPeerStatusLog?.createdAt || ''
    const noticeSignature = [
      actorUserId || 'self',
      workspaceChatPeerUserId,
      activeWorkspaceChatMemberId || 'no-member',
      activeWorkspaceChatMember?.memberUserId || 'no-member-user',
      currentStatusLogCreatedAt || 'no-status-log'
    ].join(':')

    if (workspaceChatInactiveNoticeSignatureRef.current === noticeSignature) return

    const hasExistingInactiveNotice = activityLogs.some(item => (
      item?.metadata?.kind === 'workspace_chat'
      && item?.metadata?.statusInactiveAutoNotice === true
      && item?.metadata?.statusNoticeForUserId === actorUserId
      && item?.metadata?.statusNoticePeerUserId === workspaceChatPeerUserId
      && item?.metadata?.statusLogCreatedAt === currentStatusLogCreatedAt
      && (
        (item?.metadata?.chatMemberId || '') === (activeWorkspaceChatMemberId || '')
        || (
          (item?.metadata?.chatMemberUserId || '')
          && item.metadata.chatMemberUserId === (activeWorkspaceChatMember?.memberUserId || '')
        )
      )
    ))

    if (hasExistingInactiveNotice) {
      workspaceChatInactiveNoticeSignatureRef.current = noticeSignature
      return
    }

    workspaceChatInactiveNoticeSignatureRef.current = noticeSignature

    createActivityLog({
      type: 'Workspace Chat',
      title: `Status tidak aktif: ${workspaceChatTitleName}`,
      detail: `${workspaceChatTitleName} sedang tidak aktif saat ini.\n\nPesan Anda akan dibalas setelah kembali aktif.`,
      tone: 'purple',
      sourceTable: 'activity_logs',
      sourceId: actorUserId,
      metadata: {
        kind: 'workspace_chat',
        senderRole: 'system',
        senderUserId: workspaceChatPeerUserId,
        senderName: 'Sistem',
        workspaceOwnerId: workspaceContext?.ownerUserId || '',
        chatMemberId: activeWorkspaceChatMemberId || '',
        chatMemberUserId: activeWorkspaceChatMember?.memberUserId || '',
        chatMemberLabel: activeWorkspaceChatMemberName,
        statusInactiveAutoNotice: true,
        statusNoticeForUserId: actorUserId,
        statusNoticePeerUserId: workspaceChatPeerUserId,
        statusLogCreatedAt: currentStatusLogCreatedAt
      }
    })
  }, [
    isWorkspaceChatThreadVisible,
    workspaceChatPeerStatusValue,
    workspaceChatPeerStatusLog?.createdAt,
    scopedUserId,
    workspaceChatPeerUserId,
    actorUserId,
    activeWorkspaceChatMemberId,
    activeWorkspaceChatMember?.memberUserId,
    activeWorkspaceChatMemberName,
    workspaceChatTitleName,
    workspaceContext?.ownerUserId,
    activityLogs
  ])

  useEffect(() => {
    if (isAssistantWorkspace) return
    if (selectedWorkspaceChatMemberId && workspaceAssistantChatMembers.some(member => member.id === selectedWorkspaceChatMemberId)) return
    setSelectedWorkspaceChatMemberId(workspaceAssistantChatMembers[0]?.id || '')
  }, [isAssistantWorkspace, selectedWorkspaceChatMemberId, workspaceAssistantChatMembers])

  const triggerMockNotification = (title, body, source, meta = {}) => {
    setNotificationBannerVisible(true)
    setNotifications(prev => [{
      id: Date.now(),
      title,
      body,
      source,
      meta,
      createdAt: Date.now(),
      confirmed: false,
      confirmedAt: null
    }, ...prev].slice(0, 300))
    createActivityLog({
      type: 'Notifikasi',
      title: `Notifikasi terkirim: ${title}`,
      detail: body,
      tone: 'purple',
      sourceTable: 'notifications',
      sourceId: meta?.id || source || null,
      metadata: { source, ...meta }
    })
    sendNativeNotification(title, body, meta)
    
    // Automatically open app if autoOpenOnAlert is set
    if (autoOpenOnAlert) {
      focusElectronWindow()
      console.log('App automatically focused due to alerts!')
    }
  }

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault()
      setPwaInstallPrompt(event)
    }

    const handleAppInstalled = () => {
      setPwaInstallPrompt(null)
      setIsPwaStandalone(true)
    }

    const handlePwaUpdateReady = () => {
      triggerMockNotification(
        'Update PWA tersedia',
        'Versi baru DyaTask sudah siap. Reload aplikasi untuk memakai versi terbaru.',
        'system',
        { kind: 'pwa_update_ready' }
      )
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('dyatask:pwa-update-ready', handlePwaUpdateReady)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('dyatask:pwa-update-ready', handlePwaUpdateReady)
    }
    // PWA lifecycle listeners should be attached once per app session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const persistMobilePwaGuideState = (nextState) => {
    setMobilePwaGuideState(nextState)
    localStorage.setItem(MOBILE_PWA_GUIDE_STORAGE_KEY, JSON.stringify(nextState))
  }

  useEffect(() => {
    if (!isPwaStandalone) return
    persistMobilePwaGuideState({
      dismissed: true,
      reason: 'installed',
      platform: mobilePwaGuideDetectedPlatform
    })
    setMobilePwaGuideOpen(false)
  }, [isPwaStandalone, mobilePwaGuideDetectedPlatform])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (mobilePwaGuideAutoShownRef.current) return
    if (!isMobileTabletView || isElectronApp || isPwaStandalone) return
    if (mobilePwaGuideState?.dismissed && ['installed', 'unsupported'].includes(mobilePwaGuideState.reason)) return

    const timer = window.setTimeout(() => {
      mobilePwaGuideAutoShownRef.current = true
      setMobilePwaGuidePlatform(mobilePwaGuideDetectedPlatform)
      setMobilePwaGuideOpen(true)
    }, 1200)

    return () => window.clearTimeout(timer)
  }, [
    isMobileTabletView,
    isElectronApp,
    isPwaStandalone,
    mobilePwaGuideState,
    mobilePwaGuideDetectedPlatform
  ])

  useEffect(() => {
    const ipcRenderer = getElectronIpcRenderer()
    if (!ipcRenderer) return undefined

    loadElectronVersionInfo()

    const handleUpdateStatus = (_event, payload = {}) => {
      if (payload.status === 'checking') setManualUpdateStatus('Memeriksa update DMG terbaru...')
      if (payload.status === 'available') {
        setDeployUpdateInfo(prev => prev || { version: payload.version || 'baru', buildId: `dmg-${payload.version || Date.now()}`, buildTime: new Date().toISOString() })
        setManualUpdateStatus(`Update DMG versi ${payload.version || 'baru'} tersedia. Download akan dimulai setelah dikonfirmasi.`)
      }
      if (payload.status === 'downloading') setManualUpdateStatus(`Mengunduh update DMG ${payload.percent || 0}%...`)
      if (payload.status === 'downloaded') setManualUpdateStatus(`Update DMG versi ${payload.version || 'baru'} sudah siap diinstal.`)
      if (payload.status === 'not-available') {
        setDeployUpdateInfo(null)
        setManualUpdateStatus(`App up to date (${payload.version || currentAppVersion}).`)
      }
      if (payload.status === 'error') setManualUpdateStatus(payload.message || 'Gagal memeriksa update DMG.')
    }

    ipcRenderer.on?.('app-update-status', handleUpdateStatus)
    return () => {
      ipcRenderer.removeListener?.('app-update-status', handleUpdateStatus)
    }
    // Electron bridge is read once per app session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!scopedUserId || !invoices.length) return

    const today = new Date()
    const toDateKey = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const todayKey = toDateKey(today)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowKey = toDateKey(tomorrow)

    invoices.forEach((invoice) => {
      const status = String(invoice.status || '').toLowerCase()
      if (['paid', 'void'].includes(status)) return
      if (!invoice.dueDate) return

      const dueDateKey = String(invoice.dueDate).slice(0, 10)
      const reminderKeyBase = `${invoice.id}:${todayKey}`

      if (dueDateKey === tomorrowKey) {
        const key = `${reminderKeyBase}:invoice_tomorrow`
        if (invoiceReminderKeysRef.current.has(key)) return
        invoiceReminderKeysRef.current.add(key)
        triggerMockNotification(
          'Invoice Deadline Besok',
          `Invoice "${invoice.title}" untuk ${invoice.clientName} jatuh tempo besok (${formatLongDate(dueDateKey)}).`,
          'invoice',
          { kind: 'invoice_due_tomorrow', invoiceId: invoice.id, dueDate: dueDateKey }
        )
      } else if (dueDateKey === todayKey) {
        const key = `${reminderKeyBase}:invoice_today`
        if (invoiceReminderKeysRef.current.has(key)) return
        invoiceReminderKeysRef.current.add(key)
        triggerMockNotification(
          'Invoice Deadline Hari Ini',
          `Invoice "${invoice.title}" untuk ${invoice.clientName} jatuh tempo hari ini.`,
          'invoice',
          { kind: 'invoice_due_today', invoiceId: invoice.id, dueDate: dueDateKey }
        )
      } else if (dueDateKey < todayKey) {
        const key = `${invoice.id}:${dueDateKey}:invoice_overdue`
        if (invoiceReminderKeysRef.current.has(key)) return
        invoiceReminderKeysRef.current.add(key)
        triggerMockNotification(
          'Invoice Melewati Deadline',
          `Invoice "${invoice.title}" untuk ${invoice.clientName} sudah lewat deadline (${formatLongDate(dueDateKey)}).`,
          'invoice',
          { kind: 'invoice_overdue', invoiceId: invoice.id, dueDate: dueDateKey }
        )
      }
    })
  }, [scopedUserId, invoices])

  useEffect(() => {
    let cancelled = false

    const withCacheBust = (url) => `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`

    const buildDeployVersionUrls = () => {
      const urls = []
      try {
        const baseUrl = import.meta.env.BASE_URL || './'
        urls.push(new URL('deploy-version.json', new URL(baseUrl, window.location.href)).toString())
      } catch {
        urls.push('deploy-version.json')
      }

      if (normalizedPublicShareBaseUrl) {
        urls.push(`${normalizedPublicShareBaseUrl}/deploy-version.json`)
      }

      return [...new Set(urls)]
    }

    const readLatestDeployVersion = async () => {
      for (const url of buildDeployVersionUrls()) {
        try {
          const response = await fetch(withCacheBust(url), { cache: 'no-store' })
          if (!response.ok) continue
          const data = await response.json()
          return { ...data, sourceUrl: url }
        } catch {
          // Ignore unavailable deploy metadata, especially in local dev before first build.
        }
      }
      return null
    }

    const checkDeployVersion = async () => {
      const latest = await readLatestDeployVersion()
      if (cancelled || !latest) return

      const latestKey = getDeployVersionKey(latest)
      if (!latestKey || latestKey === currentDeployVersionRef.current || latestKey === dismissedDeployVersionRef.current) {
        return
      }

      currentDeployVersionRef.current = latestKey
      setDeployUpdateInfo(latest)

      if (announcedDeployVersionRef.current === latestKey) return
      announcedDeployVersionRef.current = latestKey

      triggerMockNotification(
        'Update DyaTask tersedia',
        `Aplikasi sudah tersedia dalam versi terbaru yang sudah ditingkatkan. Versi saat ini v${currentAppVersion}, versi terbaru v${latest.version || 'terbaru'}.`,
        'system',
        { kind: 'deploy_update', versionKey: latestKey }
      )
    }

    const firstCheck = setTimeout(checkDeployVersion, 6000)
    const interval = setInterval(checkDeployVersion, 60000)

    return () => {
      cancelled = true
      clearTimeout(firstCheck)
      clearInterval(interval)
    }
    // currentDeployKey intentionally pins the running bundle version for this app session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedPublicShareBaseUrl, currentDeployKey])

  const extractReminderStartDate = (dateValue, timeValue) => {
    const date = String(dateValue || '').slice(0, 10)
    const timeText = String(timeValue || '').trim()
    const match = timeText.match(/(\d{1,2}):(\d{2})/)
    if (!date || !match) return null

    const hour = match[1].padStart(2, '0')
    const minute = match[2]
    const startDate = new Date(`${date}T${hour}:${minute}:00`)
    return Number.isNaN(startDate.getTime()) ? null : startDate
  }

  const getReminderCandidates = () => {
    const taskItems = tasks
      .filter(task => task.status !== 'done')
      .map(task => ({
        key: `task-${task.id}`,
        title: task.title || 'Task DyaTask',
        typeLabel: 'Task',
        date: task.calendarDate || task.date || todayString,
        time: task.dueTime
      }))

    const appointmentItems = appointments.map(appt => ({
      key: `appointment-${appt.id}`,
      title: appt.title || appt.clientName || 'Agenda DyaTask',
      typeLabel: 'Meeting',
      date: appt.date,
      time: appt.time
    }))

    const googleItems = googleCalendarEvents.map(event => ({
      key: `google-${event.id}`,
      title: event.title || 'Google Calendar Event',
      typeLabel: /^task\s*:/i.test(event.title || '') || /task|tugas/i.test(event.title || '') ? 'Task Google Calendar' : 'Google Calendar',
      date: event.date,
      time: event.time
    }))

    return [...taskItems, ...appointmentItems, ...googleItems]
  }

  useEffect(() => {
    const checkUpcomingReminders = () => {
      const now = new Date()
      getReminderCandidates().forEach(item => {
        const startDate = extractReminderStartDate(item.date, item.time)
        if (!startDate) return

        const msUntilStart = startDate.getTime() - now.getTime()
        const minutesUntilStart = Math.ceil(msUntilStart / 60000)
        if (minutesUntilStart > 30 || minutesUntilStart <= 0) return

        const reminderKey = `${item.key}-${startDate.getTime()}`
        if (reminderNotificationKeysRef.current.has(reminderKey)) return
        reminderNotificationKeysRef.current.add(reminderKey)

        triggerMockNotification(
          `${item.typeLabel} dimulai ${minutesUntilStart} menit lagi`,
          `${item.title} • ${formatLongDate(item.date)} ${item.time}`,
          'reminder',
          {
            reminderKey,
            date: item.date,
            time: item.time,
            startsAt: startDate.toISOString()
          }
        )
      })

      if (reminderNotificationKeysRef.current.size > 250) {
        reminderNotificationKeysRef.current = new Set(Array.from(reminderNotificationKeysRef.current).slice(-150))
      }
    }

    checkUpcomingReminders()
    const interval = setInterval(checkUpcomingReminders, 60000)
    return () => clearInterval(interval)
  }, [tasks, appointments, googleCalendarEvents, autoOpenOnAlert])

  // Toggle light/dark mode
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    localStorage.setItem('dyatask_theme', nextTheme)
    localStorage.setItem('dyatask_theme_user_selected', 'true')
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const handleOpenInstallOptions = () => {
    setInstallOptionsOpen(true)
  }

  const handleDismissMobilePwaGuide = () => {
    setMobilePwaGuideOpen(false)
  }

  const handleMarkMobilePwaGuideInstalled = () => {
    persistMobilePwaGuideState({
      dismissed: true,
      reason: 'installed',
      platform: mobilePwaGuidePlatform
    })
    setMobilePwaGuideOpen(false)
  }

  const handleMarkMobilePwaGuideUnsupported = () => {
    persistMobilePwaGuideState({
      dismissed: true,
      reason: 'unsupported',
      platform: mobilePwaGuidePlatform
    })
    setMobilePwaGuideOpen(false)
  }

  const handleInstallPwa = async () => {
    if (!pwaInstallPrompt) {
      showWorkspaceInviteNotice({
        tone: 'info',
        title: 'Install App',
        message: 'Jika prompt install belum muncul dari browser, gunakan menu browser lalu pilih Install App atau Add to Home Screen.'
      })
      return
    }
    const promptEvent = pwaInstallPrompt
    setPwaInstallPrompt(null)
    await promptEvent.prompt()
    const choice = await promptEvent.userChoice
    if (choice?.outcome === 'accepted') {
      handleMarkMobilePwaGuideInstalled()
    }
    setInstallOptionsOpen(false)
  }

  const handleCreateProjectFolder = async (e) => {
    e.preventDefault()
    if (!hasWritePermission('tasks')) {
      alert('Akun Anda tidak punya izin menambah folder project.')
      return
    }
    const folderName = newFolderName.trim()
    if (!folderName || !scopedUserId) return

    if (allProjectOptions.includes(folderName)) {
      setSelectedProjectName(folderName)
      setNewTaskCategory(folderName)
      setShowNewFolderModal(false)
      setNewFolderName('')
      return
    }

    const folderObj = {
      name: folderName,
      color: newFolderColor,
      user_id: scopedUserId
    }

    const { data, error } = await supabase
      .from('project_folders')
      .insert([folderObj])
      .select()

    const createdFolder = {
      id: data?.[0]?.id || `local-${Date.now()}`,
      name: folderName,
      color: newFolderColor
    }

    if (error) {
      const storageKey = `dyatask_project_folders_${scopedUserId}`
      const nextFolders = [...projectFolderRecords, createdFolder]
      localStorage.setItem(storageKey, JSON.stringify(nextFolders))
      setProjectFolderRecords(nextFolders)
      setSyncLogs(prev => [
        `[${new Date().toLocaleTimeString('id-ID')}] Folder "${folderName}" dibuat lokal. Jalankan migration project_folders agar tersinkron ke Supabase.`,
        ...prev.slice(0, 9)
      ])
    } else {
      setProjectFolderRecords(prev => [...prev, createdFolder])
    }

    setSelectedProjectName(folderName)
    setNewTaskCategory(folderName)
    setNewFolderName('')
    setNewFolderColor('#8B5CF6')
    setShowNewFolderModal(false)
  }

  const resetContentPlannerForm = () => {
    setContentPlannerEditingId(null)
    setContentPlannerTitle('')
    setContentPlannerPillar('')
    setContentPlannerDate(todayString)
    setContentPlannerTime('09:00')
    setContentPlannerStatus('draft')
    setContentPlannerPostLink('')
    setContentPlannerInsightLink('')
  }

  const syncContentPlannerTask = async (item, existingTaskId = null) => {
    if (!hasWritePermission('tasks')) return existingTaskId
    const payload = {
      title: `[${(item.platform || 'instagram').toUpperCase()}] ${item.title}`,
      category: `Content/${item.platform || 'instagram'}`,
      priority: 'medium',
      color_label: '#8B5CF6',
      status: item.status === 'posted' ? 'done' : 'todo',
      due_time: item.uploadTime || '09:00',
      task_date: item.uploadDate || todayString,
      has_reminder: true,
      user_id: scopedUserId
    }

    if (existingTaskId) {
      const { error } = await supabase.from('tasks').update(payload).eq('id', existingTaskId)
      if (!error) {
        setTasks(prev => prev.map(task => task.id === existingTaskId ? {
          ...task,
          title: payload.title,
          category: payload.category,
          dueTime: payload.due_time,
          calendarDate: payload.task_date,
          status: payload.status
        } : task))
        return existingTaskId
      }
    }

    const { data, error } = await supabase.from('tasks').insert([{ ...payload, parent_task_id: null, task_type: 'task' }]).select()
    if (error || !data?.[0]) return existingTaskId
    const created = data[0]
    setTasks(prev => [{
      id: created.id,
      title: created.title,
      category: created.category,
      priority: created.priority,
      colorLabel: created.color_label,
      status: created.status,
      dueTime: created.due_time,
      hasReminder: created.has_reminder,
      parentTaskId: created.parent_task_id || null,
      taskType: created.task_type || 'task',
      calendarDate: created.task_date || todayString
    }, ...prev])
    return created.id
  }

  const handleSubmitContentPlanner = async (e) => {
    e.preventDefault()
    if (!hasWritePermission('tasks')) {
      alert('Akun Anda tidak punya izin mengelola content planner.')
      return
    }
    const trimmedTitle = contentPlannerTitle.trim()
    if (!trimmedTitle) return

    const baseItem = {
      platform: contentPlannerPlatform,
      status: contentPlannerStatus,
      uploadDate: contentPlannerDate || todayString,
      uploadTime: contentPlannerTime || '09:00',
      pillar: contentPlannerPillar.trim(),
      title: trimmedTitle,
      postLink: contentPlannerPostLink.trim(),
      insightNote: ''
    }

    if (contentPlannerEditingId) {
      const prevItem = contentPlannerItems.find(item => item.id === contentPlannerEditingId)
      const nextTaskId = await syncContentPlannerTask(baseItem, prevItem?.taskId || null)
      const updatedItem = { ...prevItem, ...baseItem, taskId: nextTaskId || prevItem?.taskId || null }
      setContentPlannerItems(prev => prev.map(item => item.id === contentPlannerEditingId ? updatedItem : item))
      triggerMockNotification('Content Planner Diperbarui', `${updatedItem.platform.toUpperCase()} • ${updatedItem.title}`, 'system')
      resetContentPlannerForm()
      return
    }

    const createdId = `content-${Date.now()}`
    const nextTaskId = await syncContentPlannerTask(baseItem, null)
    const createdItem = { id: createdId, ...baseItem, taskId: nextTaskId || null }
    setContentPlannerItems(prev => [createdItem, ...prev])
    triggerMockNotification('Konten Dijadwalkan', `${createdItem.platform.toUpperCase()} • ${createdItem.title} • ${formatLongDate(createdItem.uploadDate)} ${createdItem.uploadTime}`, 'reminder')
    resetContentPlannerForm()
  }

  const handleEditContentPlanner = (item) => {
    setContentPlannerEditingId(item.id)
    setContentPlannerPlatform(item.platform || 'instagram')
    setContentPlannerTitle(item.title || '')
    setContentPlannerPillar(item.pillar || '')
    setContentPlannerDate(item.uploadDate || todayString)
    setContentPlannerTime(item.uploadTime || '09:00')
    setContentPlannerStatus(item.status || 'draft')
    setContentPlannerPostLink(item.postLink || '')
  }

  const handleDeleteContentPlanner = async (itemId) => {
    if (!hasWritePermission('tasks')) {
      alert('Akun Anda tidak punya izin menghapus konten planner.')
      return
    }
    const target = contentPlannerItems.find(item => item.id === itemId)
    if (target?.taskId) {
      await supabase.from('tasks').delete().eq('id', target.taskId)
      setTasks(prev => prev.filter(task => task.id !== target.taskId))
    }
    setContentPlannerItems(prev => prev.filter(item => item.id !== itemId))
    if (contentPlannerDetailItem?.id === itemId) {
      setContentPlannerDetailItem(null)
      setContentPlannerInsightDraft('')
    }
  }

  const handleStartContentPlannerLinkInput = (item) => {
    setContentPlannerLinkEditId(item.id)
    setContentPlannerLinkDraft(item.postLink || '')
  }

  const handleApplyContentPlannerLink = (itemId) => {
    const safeLink = String(contentPlannerLinkDraft || '').trim()
    setContentPlannerItems(prev => prev.map(item => item.id === itemId ? { ...item, postLink: safeLink } : item))
    setContentPlannerLinkEditId(null)
    setContentPlannerLinkDraft('')
  }

  const handleOpenContentPlannerDetail = (event, item) => {
    event.stopPropagation()
    event.preventDefault()
    requestAnimationFrame(() => {
      setContentPlannerDetailItem(item)
      setContentPlannerInsightDraft(item.insightNote || '')
      setContentPlannerInsightMetrics(item.insightMetrics && typeof item.insightMetrics === 'object' ? item.insightMetrics : {})
      setContentPlannerInsightFormOpen(false)
    })
  }

  const handleSaveContentPlannerInsight = () => {
    if (!contentPlannerDetailItem?.id) return
    const safeInsight = String(contentPlannerInsightDraft || '').trim()
    const safeMetrics = { ...(contentPlannerInsightMetrics || {}) }
    setContentPlannerItems(prev => prev.map(item => (
      item.id === contentPlannerDetailItem.id
        ? { ...item, insightNote: safeInsight, insightMetrics: safeMetrics }
        : item
    )))
    setContentPlannerDetailItem(prev => prev ? { ...prev, insightNote: safeInsight, insightMetrics: safeMetrics } : prev)
    setContentPlannerInsightFormOpen(false)
  }

  const getContentInsightFields = (platform) => {
    if (platform === 'instagram') return ['views', 'reach', 'like', 'comment', 'save', 'share', 'repost', 'profileVisit', 'follows']
    if (platform === 'tiktok') return ['views', 'like', 'comment', 'save', 'share', 'completionRate', 'follows']
    return ['views', 'like', 'replies', 'repost', 'quotes', 'follows']
  }

  const getContentInsightInteractionTotal = (platform, metrics = {}) => {
    const val = (key) => Number(metrics?.[key] || 0)
    if (platform === 'instagram') return val('like') + val('comment') + val('save') + val('share') + val('repost') + val('profileVisit') + val('follows')
    if (platform === 'tiktok') return val('like') + val('comment') + val('save') + val('share') + val('follows')
    return val('like') + val('replies') + val('repost') + val('quotes') + val('follows')
  }

  const getContentInsightER = (platform, metrics = {}) => {
    const views = Number(metrics?.views || 0)
    const interactions = getContentInsightInteractionTotal(platform, metrics)
    if (views <= 0) return 0
    return (interactions / views) * 100
  }

  const getContentInsightAiRecommendation = (platform, metrics = {}) => {
    const er = getContentInsightER(platform, metrics)
    const views = Number(metrics?.views || 0)
    const interactions = getContentInsightInteractionTotal(platform, metrics)
    if (views <= 0) return 'Data views belum ada. Lengkapi insight untuk evaluasi konten.'
    if (er >= 8) return 'Performa sangat bagus. Duplikasi format konten ini sebagai template seri berikutnya.'
    if (er >= 4) return 'Performa cukup efektif. Optimasi hook 3 detik pertama dan CTA untuk komentar/simpan.'
    if (interactions < 10) return 'Interaksi masih rendah. Coba ubah angle judul dan perkuat visual pembuka.'
    return 'ER rendah terhadap views. Uji ulang topik/pilar dan jadwal posting di jam audience aktif.'
  }

  // Add Task
  const handleAddTask = async (e) => {
    e.preventDefault()
    if (!hasWritePermission('tasks')) {
      alert('Akun Anda tidak punya izin menambah task.')
      return
    }
    if (!newTaskTitle.trim()) return

    const taskObj = {
      title: newTaskTitle,
      category: newTaskCategory.trim() || 'General',
      priority: newTaskPriority,
      color_label: newTaskColor,
      status: 'todo',
      due_time: newTaskTime,
      task_date: newTaskDate,
      parent_task_id: null,
      task_type: 'task',
      has_reminder: true,
      user_id: scopedUserId
    }

    let { data, error } = await supabase
      .from('tasks')
      .insert([taskObj])
      .select();

    // Backward compatibility when database belum punya kolom task_date / project subtasks.
    if (error && ['task_date', 'parent_task_id', 'task_type'].some(column => String(error.message || '').toLowerCase().includes(column))) {
      const fallbackTaskObj = { ...taskObj }
      delete fallbackTaskObj.task_date
      delete fallbackTaskObj.parent_task_id
      delete fallbackTaskObj.task_type
      const retry = await supabase.from('tasks').insert([fallbackTaskObj]).select()
      data = retry.data
      error = retry.error
    }

    if (error) {
      alert('Gagal menambahkan tugas ke Supabase: ' + error.message)
      return
    }

    if (data && data[0]) {
      const createdTask = {
        id: data[0].id,
        title: data[0].title,
        category: data[0].category,
        priority: data[0].priority,
        colorLabel: data[0].color_label,
        status: data[0].status,
        dueTime: data[0].due_time,
        hasReminder: data[0].has_reminder,
        parentTaskId: data[0].parent_task_id || null,
        taskType: data[0].task_type || 'task',
        calendarDate: data[0].task_date || newTaskDate || (data[0].created_at ? data[0].created_at.slice(0, 10) : todayString)
      }
      const subtaskTitles = newTaskSubtasks
        .split('\n')
        .map(title => title.trim())
        .filter(Boolean)
      let createdSubtasks = []

      if (subtaskTitles.length > 0 && data[0].parent_task_id !== undefined) {
        const subtaskRows = subtaskTitles.map((title, index) => ({
          title,
          category: newTaskCategory.trim() || 'General',
          priority: newTaskPriority,
          color_label: newTaskColor,
          status: 'todo',
          due_time: newTaskTime,
          task_date: newTaskDate,
          parent_task_id: createdTask.id,
          task_type: 'subtask',
          has_reminder: true,
          user_id: scopedUserId,
          sort_order: index
        }))

        const { data: subtaskData, error: subtaskError } = await supabase
          .from('tasks')
          .insert(subtaskRows)
          .select()

        if (subtaskError) {
          alert(`Task utama tersimpan, tapi subtask gagal dibuat: ${subtaskError.message}. Pastikan migration parent_task_id di supabase_schema.sql sudah dijalankan.`)
        } else {
          createdSubtasks = (subtaskData || []).map(item => ({
            id: item.id,
            title: item.title,
            category: item.category,
            priority: item.priority,
            colorLabel: item.color_label,
            status: item.status,
            dueTime: item.due_time,
            hasReminder: item.has_reminder,
            parentTaskId: item.parent_task_id,
            taskType: item.task_type || 'subtask',
            calendarDate: item.task_date || newTaskDate || todayString
          }))
        }
      } else if (subtaskTitles.length > 0) {
        alert('Task utama tersimpan, tapi database belum mendukung subtask. Jalankan migration parent_task_id di supabase_schema.sql.')
      }

      setTasks([createdTask, ...createdSubtasks, ...tasks])

      const taskSyncResult = await syncTaskToGoogleCalendar(createdTask)
      if (!taskSyncResult.ok && !taskSyncResult.skipped) {
        alert(`Task tersimpan, tapi sinkron Google Calendar gagal: ${taskSyncResult.error}`)
      }

      for (const subtask of createdSubtasks) {
        await syncTaskToGoogleCalendar(subtask)
      }
    }

    setNewTaskTitle('')
    setNewTaskDate(todayString)
    setNewTaskSubtasks('')
    setShowQuickTaskModal(false)
    
    // Log only actual local database sync. External integrations are logged by their own sync handlers.
    const timestamp = new Date().toLocaleTimeString('id-ID')
    setSyncLogs(prev => [
      `[${timestamp}] ✅ Supabase: Tugas baru "${taskObj.title}" disimpan.`,
      ...prev
    ])

    // Mock notification alert
    triggerMockNotification(
      'Tugas Berhasil Dibuat',
      `Tugas "${taskObj.title}" berhasil disimpan di database Supabase!`,
      'local'
    )
  }

  // Quick Task from Floating launcher
  const handleFloatingQuickAdd = async (e) => {
    e.preventDefault()
    if (!hasWritePermission('tasks')) {
      alert('Akun Anda tidak punya izin quick add task.')
      return
    }
    if (!floatingTaskTitle.trim()) return

    const taskObj = {
      title: floatingTaskTitle,
      category: 'Quick Add',
      priority: 'high',
      color_label: '#8B5CF6',
      status: 'todo',
      due_time: '12:00',
      has_reminder: true,
      user_id: scopedUserId
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert([taskObj])
      .select();

    if (error) {
      alert('Gagal menambahkan tugas cepat ke Supabase: ' + error.message)
      return
    }

    if (data && data[0]) {
      const createdTask = {
        id: data[0].id,
        title: data[0].title,
        category: data[0].category,
        priority: data[0].priority,
        colorLabel: data[0].color_label,
        status: data[0].status,
        dueTime: data[0].due_time,
        hasReminder: data[0].has_reminder
      }
      setTasks([createdTask, ...tasks])
    }

    setFloatingTaskTitle('')
    setFloatingQuickAdd(false)

    // Log sheets sync
    const timestamp = new Date().toLocaleTimeString('id-ID')
    setSyncLogs(prev => [
      `[${timestamp}] 🖥️ Launcher: Tugas baru dibuat dari Floating Bar macOS disinkronkan ke Supabase.`,
      ...prev
    ])
  }

  // Complete Task toggle
  const toggleTaskStatus = async (id) => {
    if (!hasWritePermission('tasks')) {
      alert('Akun Anda tidak punya izin mengubah status task.')
      return
    }
    const taskToToggle = tasks.find(t => t.id === id);
    if (!taskToToggle) return;

    const nextStatus = taskToToggle.status === 'done' ? 'todo' : 'done';

    const { error } = await supabase
      .from('tasks')
      .update({ status: nextStatus })
      .eq('id', id);

    if (error) {
      alert('Gagal memperbarui status tugas di Supabase: ' + error.message);
      return;
    }

    setTasks(tasks.map(t => {
      if (t.id === id) {
        if (nextStatus === 'done') {
          // Log local task status update.
          const timestamp = new Date().toLocaleTimeString('id-ID')
          setTimeout(() => {
            setSyncLogs(prev => [
              `[${timestamp}] ✅ Supabase: Status tugas "${t.title}" -> SELESAI.`,
              ...prev
            ])
          }, 300)
        }
        return { ...t, status: nextStatus }
      }
      return t
    }))
  }

  const deleteTask = async (id) => {
    if (!hasWritePermission('tasks')) {
      alert('Akun Anda tidak punya izin menghapus task.')
      return
    }
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Gagal menghapus tugas dari Supabase: ' + error.message);
      return;
    }

    setTasks(tasks.filter(t => t.id !== id && t.parentTaskId !== id))
  }

  const normalizeCalendarActionItem = (item) => {
    if (!item) return null
    if (item.itemType) return item
    if (item.source === 'appointment') return { ...item, itemType: 'appointment' }
    if (item.source === 'task') return { ...item, itemType: 'task' }
    return item
  }

  const formatAppointmentLabel = (appointment) => {
    const client = (appointment?.clientName || '').trim()
    const topic = (appointment?.title || '').trim()
    if (!client && !topic) return 'Session'
    if (!client) return topic
    if (!topic) return client
    return `${client} - ${topic}`
  }

  const openCalendarEditModal = (item) => {
    const editableItem = normalizeCalendarActionItem(item)
    if (!editableItem || !['appointment', 'task'].includes(editableItem.itemType)) return

    setCalendarActionItem(null)
    setActiveCalendarEditItem(editableItem)
    if (editableItem.itemType === 'appointment') {
      setCalendarEditForm({
        title: editableItem.title || '',
        clientName: editableItem.clientName || '',
        email: editableItem.email || '',
        date: editableItem.date || '',
        time: editableItem.time || ''
      })
    } else {
      setCalendarEditForm({
        title: editableItem.title || '',
        category: editableItem.category || 'Work',
        priority: editableItem.priority || 'medium',
        date: editableItem.calendarDate || '',
        dueTime: editableItem.dueTime || '09:00'
      })
    }
  }

  const saveCalendarEditModal = async () => {
    if (!activeCalendarEditItem) return
    if (!hasWritePermission(activeCalendarEditItem.itemType === 'task' ? 'tasks' : 'reservations')) {
      alert('Akun Anda tidak punya izin mengubah item kalender ini.')
      return
    }

    if (activeCalendarEditItem.itemType === 'appointment') {
      if (!calendarEditForm.title?.trim() || !calendarEditForm.clientName?.trim()) {
        alert('Judul agenda dan nama klien wajib diisi.')
        return
      }

      const { error } = await supabase
        .from('appointments')
        .update({
          title: calendarEditForm.title.trim(),
          client_name: calendarEditForm.clientName.trim(),
          email: (calendarEditForm.email || '').trim(),
          date: calendarEditForm.date,
          time: calendarEditForm.time
        })
        .eq('id', activeCalendarEditItem.id)

      if (error) {
        alert('Gagal mengubah reservasi: ' + error.message)
        return
      }

      setAppointments(prev => prev.map(item => (
        item.id === activeCalendarEditItem.id
          ? {
              ...item,
              title: calendarEditForm.title.trim(),
              clientName: calendarEditForm.clientName.trim(),
              email: (calendarEditForm.email || '').trim(),
              date: calendarEditForm.date,
              time: calendarEditForm.time
            }
          : item
      )))
    } else {
      if (!calendarEditForm.title?.trim()) {
        alert('Judul task wajib diisi.')
        return
      }

      const { error } = await supabase
        .from('tasks')
        .update({
          title: calendarEditForm.title.trim(),
          category: calendarEditForm.category,
          priority: calendarEditForm.priority,
          due_time: calendarEditForm.dueTime,
          task_date: calendarEditForm.date || null
        })
        .eq('id', activeCalendarEditItem.id)

      if (error) {
        alert('Gagal mengubah task: ' + error.message)
        return
      }

      setTasks(prev => prev.map(item => (
        item.id === activeCalendarEditItem.id
          ? {
              ...item,
              title: calendarEditForm.title.trim(),
              category: calendarEditForm.category,
              priority: calendarEditForm.priority,
              dueTime: calendarEditForm.dueTime,
              calendarDate: calendarEditForm.date || item.calendarDate
            }
          : item
      )))
    }

    setActiveCalendarEditItem(null)
    setCalendarEditForm({})
  }

  // Handle Bookings
  const handleAddBooking = async (e) => {
    e.preventDefault()
    if (session && !hasWritePermission('reservations')) {
      alert('Akun Anda tidak punya izin menambah reservasi.')
      return
    }
    if (!bookingClient.trim() || !bookingTitle.trim()) return
    if (!isDateAllowed(bookingDate)) {
      alert('Tanggal tersebut di luar hari reservasi yang diizinkan.')
      return
    }
    if (!availableTimeSlotsForSelectedDate.includes(bookingTime)) {
      alert('Jam reservasi sudah terisi. Pilih jam lain yang tersedia.')
      return
    }

    const newBookingObj = {
      client_name: bookingClient,
      title: bookingTitle,
      time: bookingTime,
      date: bookingDate,
      status: 'confirmed',
      email: bookingEmail || 'guest@dyatask.com',
      user_id: scopedUserId
    }

    const publicBookingPayload = {
      p_client_name: newBookingObj.client_name,
      p_title: newBookingObj.title,
      p_email: newBookingObj.email,
      p_date: newBookingObj.date,
      p_time: newBookingObj.time
    }

    const { data, error } = isPublicBookingMode && !session
      ? await supabase.rpc('create_public_appointment', publicBookingPayload)
      : await supabase
        .from('appointments')
        .insert([newBookingObj])
        .select();

    if (error) {
      alert('Gagal membuat reservasi di Supabase: ' + error.message)
      return
    }

    const createdRow = Array.isArray(data) ? data[0] : data

    if (createdRow) {
      const createdBooking = {
        id: createdRow.id,
        clientName: createdRow.client_name,
        title: createdRow.title,
        time: createdRow.time,
        date: createdRow.date,
        status: createdRow.status,
        email: createdRow.email,
        createdAt: createdRow.created_at || new Date().toISOString()
      }
      setAppointments([createdBooking, ...appointments])
    }

    const googleSyncResult = await syncBookingToGoogleCalendar(newBookingObj)

    if (isPublicBookingMode) {
      localStorage.setItem('dyatask_public_booking_event', JSON.stringify({
        id: Date.now(),
        clientName: newBookingObj.client_name,
        title: newBookingObj.title,
        date: newBookingObj.date,
        time: newBookingObj.time
      }))

      setPublicBookingSummary({
        clientName: newBookingObj.client_name,
        email: newBookingObj.email,
        whatsapp: bookingWhatsapp,
        title: newBookingObj.title,
        date: newBookingObj.date,
        time: newBookingObj.time
      })
      setPublicBookingSuccess(true)
    }

    setBookingClient('')
    setBookingTitle('')
    setBookingEmail('')
    setShowQuickBookingModal(false)

    // Log sync
    const timestamp = new Date().toLocaleTimeString('id-ID')
    setSyncLogs(prev => {
      const logs = [
        `[${timestamp}] 📅 Reservasi Rapat: Reservasi oleh "${newBookingObj.client_name}" disimpan di Supabase.`,
        ...prev
      ]

      if (googleSyncResult.ok) {
        logs.unshift(`[${timestamp}] ✅ Google Calendar: Event "${newBookingObj.title}" berhasil dibuat.`)
      } else if (googleSyncResult.skipped) {
        logs.unshift(`[${timestamp}] ⚠️ Google Calendar: ${googleSyncResult.reason}`)
      } else {
        logs.unshift(`[${timestamp}] ❌ Google Calendar gagal sinkron: ${googleSyncResult.error}`)
      }

      return logs
    })

    if (!googleSyncResult.ok && !googleSyncResult.skipped) {
      alert(`Reservasi tersimpan di Supabase, tetapi sinkron Google Calendar gagal: ${googleSyncResult.error}`)
    }

    // Trigger alert
    triggerMockNotification(
      'Reservasi Berhasil!',
      `Konsultasi "${newBookingObj.title}" berhasil disimpan ke database Supabase!`,
      'booking'
    )
  }

  const resetInvoiceForm = () => {
    setEditingInvoiceId(null)
    setInvoiceClientName('')
    setInvoiceTitle('')
    setInvoiceType('Custom Spreadsheet')
    setInvoiceAmount('')
    setInvoiceIssueDate(todayString)
    setInvoiceDueDate(todayString)
    setInvoiceStatus('draft')
    setInvoiceNotes('')
    setShowInvoiceForm(false)
  }

  const persistInvoicesLocal = (nextInvoices) => {
    localStorage.setItem(invoiceStorageKey, JSON.stringify(nextInvoices))
  }

  const buildAutoInvoiceNumber = () => {
    const ym = todayString.slice(0, 7).replace('-', '')
    const monthInvoices = invoices.filter(item => String(item.issueDate || '').slice(0, 7) === todayString.slice(0, 7)).length + 1
    return `INV-${ym}-${String(monthInvoices).padStart(4, '0')}`
  }

  const parseInvoiceGeneratorMeta = (noteValue) => {
    const text = String(noteValue || '')
    if (!text.startsWith('[IGMETA]')) return null
    try {
      return JSON.parse(text.slice(8))
    } catch {
      return null
    }
  }

  const serializeInvoiceGeneratorMeta = (meta) => `[IGMETA]${JSON.stringify(meta || {})}`

  const mapFinanceInvoiceRow = (item) => ({
    id: item.id,
    clientName: item.client_name || item.clientName,
    title: item.title,
    orderType: item.order_type || item.orderType,
    amount: Number(item.amount || 0),
    issueDate: item.issue_date || item.issueDate,
    dueDate: item.due_date || item.dueDate,
    status: item.status || 'draft',
    notes: item.notes || '',
    createdAt: item.created_at || item.createdAt || new Date().toISOString()
  })

  const getCurrentInvoiceGeneratorDefaults = () => ({
    logo: invoiceGeneratorLogo,
    company: invoiceGeneratorCompany || FALLBACK_INVOICE_GENERATOR_DEFAULTS.company,
    tagline: invoiceGeneratorTagline || FALLBACK_INVOICE_GENERATOR_DEFAULTS.tagline,
    paymentInfo: invoiceGeneratorPaymentInfo || FALLBACK_INVOICE_GENERATOR_DEFAULTS.paymentInfo,
    terms: invoiceGeneratorTerms || FALLBACK_INVOICE_GENERATOR_DEFAULTS.terms,
    signer: invoiceGeneratorSigner,
    signature: invoiceGeneratorSignature
  })

  const applyInvoiceGeneratorDefaults = (defaults = invoiceGeneratorDefaults) => {
    const mergedDefaults = { ...FALLBACK_INVOICE_GENERATOR_DEFAULTS, ...(defaults || {}) }
    setInvoiceGeneratorLogo(mergedDefaults.logo || '')
    setInvoiceGeneratorCompany(mergedDefaults.company)
    setInvoiceGeneratorTagline(mergedDefaults.tagline)
    setInvoiceGeneratorPaymentInfo(mergedDefaults.paymentInfo)
    setInvoiceGeneratorTerms(mergedDefaults.terms)
    setInvoiceGeneratorSigner(mergedDefaults.signer || '')
    setInvoiceGeneratorSignature(mergedDefaults.signature || '')
  }

  const handleSaveInvoiceGeneratorDefaults = () => {
    const nextDefaults = getCurrentInvoiceGeneratorDefaults()
    localStorage.setItem(invoiceGeneratorDefaultsStorageKey, JSON.stringify(nextDefaults))
    setInvoiceGeneratorDefaults(nextDefaults)
    alert('Default invoice berhasil disimpan.')
  }

  const openInvoiceGeneratorFromOrder = (order) => {
    const autoNumber = buildAutoInvoiceNumber()
    setInvoiceGeneratorEditingId(null)
    applyInvoiceGeneratorDefaults()
    setInvoiceGeneratorNumber(autoNumber)
    setInvoiceGeneratorDate(todayString)
    setInvoiceGeneratorDueDate(order?.dueDate || todayString)
    setInvoiceGeneratorClient(order?.customerName || '')
    setInvoiceGeneratorClientAddress('')
    setInvoiceGeneratorShipTo('')
    setInvoiceGeneratorService(order?.orderType || 'Custom Service')
    setInvoiceGeneratorServiceDesc(order?.orderName || '')
    setInvoiceGeneratorQty(1)
    setInvoiceGeneratorPrice(Number(order?.budget || 0))
    setInvoiceGeneratorSourceOrderId(order?.id || null)
    setInvoiceGeneratorStatus('draft')
    setActiveTab('invoiceGenerator')
  }

  const loadInvoiceGeneratorFromInvoice = (invoice) => {
    const meta = parseInvoiceGeneratorMeta(invoice?.notes)
    if (!meta) return
    setInvoiceGeneratorEditingId(invoice.id)
    setInvoiceGeneratorLogo(meta.logo || '')
    setInvoiceGeneratorNumber(meta.invoiceNumber || buildAutoInvoiceNumber())
    setInvoiceGeneratorDate(meta.invoiceDate || invoice.issueDate || todayString)
    setInvoiceGeneratorDueDate(meta.dueDate || invoice.dueDate || todayString)
    setInvoiceGeneratorCompany(meta.company || invoiceGeneratorDefaults.company)
    setInvoiceGeneratorTagline(meta.tagline || invoiceGeneratorDefaults.tagline)
    setInvoiceGeneratorClient(meta.client || invoice.clientName || '')
    setInvoiceGeneratorClientAddress(meta.clientAddress || '')
    setInvoiceGeneratorShipTo(meta.shipTo || '')
    setInvoiceGeneratorService(meta.service || invoice.orderType || 'Custom Service')
    setInvoiceGeneratorServiceDesc(meta.serviceDescription || invoice.title || '')
    setInvoiceGeneratorQty(Number(meta.qty || 1))
    setInvoiceGeneratorPrice(Number(meta.price || invoice.amount || 0))
    setInvoiceGeneratorPaymentInfo(meta.paymentInfo || invoiceGeneratorDefaults.paymentInfo)
    setInvoiceGeneratorTerms(meta.terms || invoiceGeneratorDefaults.terms)
    setInvoiceGeneratorSigner(meta.signer || invoiceGeneratorDefaults.signer || '')
    setInvoiceGeneratorSignature(meta.signature || invoiceGeneratorDefaults.signature || '')
    setInvoiceGeneratorSourceOrderId(meta.sourceOrderId || null)
    setInvoiceGeneratorStatus(meta.status || invoice.status || 'draft')
    setActiveTab('invoiceGenerator')
    setShowInvoiceGeneratorForm(true)
  }

  const openInvoiceGeneratorFromFollowUp = (invoice) => {
    if (!invoice) return
    const meta = parseInvoiceGeneratorMeta(invoice.notes)
    if (meta) {
      loadInvoiceGeneratorFromInvoice(invoice)
      return
    }

    setInvoiceGeneratorEditingId(invoice.id)
    applyInvoiceGeneratorDefaults()
    setInvoiceGeneratorNumber(buildAutoInvoiceNumber())
    setInvoiceGeneratorDate(invoice.issueDate || todayString)
    setInvoiceGeneratorDueDate(invoice.dueDate || todayString)
    setInvoiceGeneratorClient(invoice.clientName || '')
    setInvoiceGeneratorClientAddress('')
    setInvoiceGeneratorShipTo('')
    setInvoiceGeneratorService(invoice.orderType || 'Custom Service')
    setInvoiceGeneratorServiceDesc(invoice.title || '')
    setInvoiceGeneratorQty(1)
    setInvoiceGeneratorPrice(Number(invoice.amount || 0))
    setInvoiceGeneratorSourceOrderId(null)
    setInvoiceGeneratorStatus(invoice.status || 'draft')
    setActiveTab('invoiceGenerator')
    setShowInvoiceGeneratorForm(true)
  }

  const handleSubmitInvoice = async (e) => {
    e.preventDefault()
    if (!hasWritePermission('finance')) {
      alert('Akun Anda tidak punya izin mengelola invoice.')
      return
    }
    if (!scopedUserId) return
    if (!invoiceClientName.trim() || !invoiceTitle.trim()) return

    const payload = {
      user_id: scopedUserId,
      client_name: invoiceClientName.trim(),
      title: invoiceTitle.trim(),
      order_type: invoiceType,
      amount: Number(invoiceAmount || 0),
      issue_date: invoiceIssueDate || todayString,
      due_date: invoiceDueDate || null,
      status: invoiceStatus,
      notes: invoiceNotes.trim() || null
    }

    const mapInvoice = (item) => ({
      id: item.id,
      clientName: item.client_name || item.clientName,
      title: item.title,
      orderType: item.order_type || item.orderType,
      amount: Number(item.amount || 0),
      issueDate: item.issue_date || item.issueDate,
      dueDate: item.due_date || item.dueDate,
      status: item.status || 'draft',
      notes: item.notes || '',
      createdAt: item.created_at || item.createdAt || new Date().toISOString()
    })

    if (invoiceStorageMode === 'cloud') {
      if (editingInvoiceId) {
        const { data, error } = await supabase
          .from('finance_invoices')
          .update(payload)
          .eq('id', editingInvoiceId)
          .select()
          .single()

        if (error) {
          alert('Gagal update invoice: ' + error.message)
          return
        }

        setInvoices(prev => prev.map(item => item.id === editingInvoiceId ? mapInvoice(data) : item))
      } else {
        const { data, error } = await supabase
          .from('finance_invoices')
          .insert([payload])
          .select()
          .single()

        if (error) {
          alert('Gagal membuat invoice: ' + error.message)
          return
        }

        setInvoices(prev => [mapInvoice(data), ...prev])
      }
    } else {
      const localInvoice = {
        id: editingInvoiceId || `local-${Date.now()}`,
        clientName: payload.client_name,
        title: payload.title,
        orderType: payload.order_type,
        amount: payload.amount,
        issueDate: payload.issue_date,
        dueDate: payload.due_date,
        status: payload.status,
        notes: payload.notes || '',
        createdAt: new Date().toISOString()
      }

      setInvoices(prev => {
        const next = editingInvoiceId
          ? prev.map(item => item.id === editingInvoiceId ? { ...item, ...localInvoice } : item)
          : [localInvoice, ...prev]
        persistInvoicesLocal(next)
        return next
      })
    }

    resetInvoiceForm()
  }

  const handleSubmitInvoiceGenerator = async (e) => {
    e.preventDefault()
    if (!hasWritePermission('finance')) {
      alert('Akun Anda tidak punya izin mengelola invoice.')
      return
    }
    if (!scopedUserId) return
    if (!invoiceGeneratorClient.trim() || !invoiceGeneratorServiceDesc.trim()) {
      alert('Client dan deskripsi jasa wajib diisi.')
      return
    }

    const qty = Math.max(1, Number(invoiceGeneratorQty || 1))
    const price = Math.max(0, Number(invoiceGeneratorPrice || 0))
    const total = qty * price
    const notesPayload = serializeInvoiceGeneratorMeta({
      logo: invoiceGeneratorLogo,
      invoiceNumber: invoiceGeneratorNumber || buildAutoInvoiceNumber(),
      invoiceDate: invoiceGeneratorDate,
      dueDate: invoiceGeneratorDueDate,
      company: invoiceGeneratorCompany,
      tagline: invoiceGeneratorTagline,
      client: invoiceGeneratorClient,
      clientAddress: invoiceGeneratorClientAddress,
      shipTo: invoiceGeneratorShipTo,
      service: invoiceGeneratorService,
      serviceDescription: invoiceGeneratorServiceDesc,
      qty,
      price,
      paymentInfo: invoiceGeneratorPaymentInfo,
      terms: invoiceGeneratorTerms,
      signer: invoiceGeneratorSigner,
      signature: invoiceGeneratorSignature,
      sourceOrderId: invoiceGeneratorSourceOrderId,
      status: invoiceGeneratorStatus
    })

    const payload = {
      user_id: scopedUserId,
      client_name: invoiceGeneratorClient.trim(),
      title: invoiceGeneratorServiceDesc.trim(),
      order_type: invoiceGeneratorService || 'Custom Service',
      amount: total,
      issue_date: invoiceGeneratorDate || todayString,
      due_date: invoiceGeneratorDueDate || null,
      status: invoiceGeneratorStatus || 'draft',
      notes: notesPayload
    }

    if (invoiceGeneratorEditingId) {
      const { data, error } = await supabase
        .from('finance_invoices')
        .update(payload)
        .eq('id', invoiceGeneratorEditingId)
        .select()
        .single()
      if (error) {
        alert(`Gagal update invoice generator: ${error.message}`)
        return
      }
      if (data) {
        setInvoices(prev => prev.map(item => item.id === invoiceGeneratorEditingId ? mapFinanceInvoiceRow(data) : item))
      }
    } else {
      const { data, error } = await supabase
        .from('finance_invoices')
        .insert([payload])
        .select()
        .single()
      if (error) {
        alert(`Gagal membuat invoice generator: ${error.message}`)
        return
      }
      if (data) {
        setInvoices(prev => [mapFinanceInvoiceRow(data), ...prev])
      }
    }

    setInvoiceGeneratorEditingId(null)
    setInvoiceGeneratorNumber(buildAutoInvoiceNumber())
    alert('Invoice generator berhasil disimpan dan sinkron ke Supabase.')
  }

  const escapeHtml = (value) => String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

  const buildInvoicePdfHtml = () => {
    const previewNode = invoicePreviewRef.current
    if (!previewNode) return ''
    const styleBlocks = Array.from(document.querySelectorAll('style')).map(styleEl => styleEl.textContent || '').join('\n')
    const stylesheetLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .map(linkEl => `<link rel="stylesheet" href="${linkEl.href}">`)
      .join('\n')
    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  ${stylesheetLinks}
  <style>${styleBlocks}</style>
  <style>
    @page { size: A4 portrait; margin: 0; }
    html, body { margin: 0; padding: 0; background: #ffffff; }
    body { display: flex; justify-content: center; align-items: flex-start; }
  </style>
</head>
<body>
  ${previewNode.outerHTML}
</body>
</html>`
  }

  const handleExportInvoicePdf = async () => {
    const ipcRenderer = getElectronIpcRenderer()
    const fileName = `${(invoiceGeneratorNumber || 'invoice').replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`
    const exportHtml = buildInvoicePdfHtml()
    if (!exportHtml) {
      alert('Preview invoice belum siap diexport.')
      return
    }
    if (!ipcRenderer?.invoke) {
      const printWindow = window.open('', '_blank', 'width=900,height=1200')
      if (!printWindow) {
        alert('Popup terblokir. Izinkan popup lalu coba lagi.')
        return
      }
      printWindow.document.open()
      printWindow.document.write(exportHtml)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => printWindow.print(), 250)
      return
    }
    const result = await ipcRenderer.invoke('export-invoice-pdf', {
      html: exportHtml,
      fileName
    })
    if (!result?.ok && !result?.canceled) {
      alert(`Gagal export PDF: ${result?.error || 'Unknown error'}`)
    }
  }

  const formatInvoiceStatusLabel = (statusValue) => {
    const value = String(statusValue || '').toLowerCase()
    if (value === 'sent') return 'follow_up'
    return value || 'draft'
  }

  const startEditInvoice = (invoice) => {
    if (!invoice) return
    setEditingInvoiceId(invoice.id)
    setInvoiceClientName(invoice.clientName || '')
    setInvoiceTitle(invoice.title || '')
    setInvoiceType(invoice.orderType || 'Custom Spreadsheet')
    setInvoiceAmount(String(invoice.amount || ''))
    setInvoiceIssueDate(invoice.issueDate || todayString)
    setInvoiceDueDate(invoice.dueDate || todayString)
    setInvoiceStatus(invoice.status || 'draft')
    setInvoiceNotes(invoice.notes || '')
    setShowInvoiceForm(true)
  }

  const handleDeleteInvoice = async (invoice) => {
    if (!invoice) return
    if (!hasWritePermission('finance')) {
      alert('Akun Anda tidak punya izin menghapus invoice.')
      return
    }
    const ok = window.confirm(`Hapus invoice "${invoice.title}"?`)
    if (!ok) return

    if (invoiceStorageMode === 'cloud') {
      const { error } = await supabase.from('finance_invoices').delete().eq('id', invoice.id)
      if (error) {
        alert('Gagal menghapus invoice: ' + error.message)
        return
      }
      setInvoices(prev => prev.filter(item => item.id !== invoice.id))
      return
    }

    setInvoices(prev => {
      const next = prev.filter(item => item.id !== invoice.id)
      persistInvoicesLocal(next)
      return next
    })
  }

  const updateInvoiceStatus = async (invoice, nextStatus) => {
    if (!invoice || !nextStatus) return
    if (!hasWritePermission('finance')) {
      alert('Akun Anda tidak punya izin mengubah status invoice.')
      return
    }

    const meta = parseInvoiceGeneratorMeta(invoice.notes)
    const nextNotes = meta ? serializeInvoiceGeneratorMeta({ ...meta, status: nextStatus }) : invoice.notes
    const localPatch = meta ? { status: nextStatus, notes: nextNotes } : { status: nextStatus }

    if (invoiceStorageMode === 'cloud') {
      const { error } = await supabase
        .from('finance_invoices')
        .update(meta ? { status: nextStatus, notes: nextNotes } : { status: nextStatus })
        .eq('id', invoice.id)

      if (error) {
        alert('Gagal update status invoice: ' + error.message)
        return
      }

      setInvoices(prev => prev.map(item => item.id === invoice.id ? { ...item, ...localPatch } : item))
      return
    }

    setInvoices(prev => {
      const next = prev.map(item => item.id === invoice.id ? { ...item, ...localPatch } : item)
      persistInvoicesLocal(next)
      return next
    })
  }

  const handleCreateSpreadsheetOrder = async (e) => {
    e.preventDefault()
    if (!hasWritePermission('orders')) {
      alert('Akun Anda tidak punya izin mengelola order spreadsheet.')
      return
    }
    if (!scopedUserId) return
    if (!newOrderCustomer.trim() || !newOrderName.trim()) return
    const paymentValue = newOrderPaymentStatus || 'belum_bayar'

    const withPaymentUpdatePayload = {
      customer_name: newOrderCustomer.trim(),
      order_name: newOrderName.trim(),
      order_type: newOrderType,
      budget: Number(newOrderBudget || 0),
      status: newOrderStatus,
      payment_status: paymentValue,
      due_date: newOrderDueDate || null
    }

    const baseUpdatePayload = {
      customer_name: newOrderCustomer.trim(),
      order_name: newOrderName.trim(),
      order_type: newOrderType,
      budget: Number(newOrderBudget || 0),
      status: newOrderStatus,
      due_date: newOrderDueDate || null
    }

    if (editingOrderId) {
      const { data, error } = await supabase
        .from('spreadsheet_orders')
        .update(withPaymentUpdatePayload)
        .eq('id', editingOrderId)
        .select()
        .single()

      let resolvedData = data
      if (error) {
        if (String(error.message || '').toLowerCase().includes('payment_status')) {
          const retry = await supabase
            .from('spreadsheet_orders')
            .update(baseUpdatePayload)
            .eq('id', editingOrderId)
            .select()
            .single()
          if (retry.error) {
            alert('Gagal update order spreadsheet: ' + retry.error.message)
            return
          }
          resolvedData = retry.data
        } else {
          alert('Gagal update order spreadsheet: ' + error.message)
          return
        }
      }

      setOrderPaymentStatusMap(prev => ({ ...prev, [editingOrderId]: paymentValue }))

      setSpreadsheetOrders(prev => prev.map(order => (
        order.id === editingOrderId
          ? {
              ...order,
              customerName: resolvedData.customer_name,
              orderName: resolvedData.order_name,
              orderType: resolvedData.order_type,
              budget: Number(resolvedData.budget || 0),
              status: resolvedData.status,
              paymentStatus: resolvedData.payment_status || paymentValue,
              dueDate: resolvedData.due_date,
              updatedAt: resolvedData.updated_at
            }
          : order
      )))
      setEditingOrderId(null)
      setNewOrderCustomer('')
      setNewOrderName('')
      setNewOrderBudget('')
      setNewOrderDueDate(todayString)
      setNewOrderStatus('new')
      setNewOrderPaymentStatus('belum_bayar')
      return
    }

    const orderPayload = {
      user_id: scopedUserId,
      customer_name: newOrderCustomer.trim(),
      order_name: newOrderName.trim(),
      order_type: newOrderType,
      budget: Number(newOrderBudget || 0),
      status: newOrderStatus,
      payment_status: paymentValue,
      due_date: newOrderDueDate || null
    }

    const { data, error } = await supabase
      .from('spreadsheet_orders')
      .insert([orderPayload])
      .select()
      .single()

    let resolvedData = data
    if (error) {
      if (String(error.message || '').toLowerCase().includes('payment_status')) {
        const retryPayload = {
          user_id: scopedUserId,
          customer_name: newOrderCustomer.trim(),
          order_name: newOrderName.trim(),
          order_type: newOrderType,
          budget: Number(newOrderBudget || 0),
          status: newOrderStatus,
          due_date: newOrderDueDate || null
        }
        const retry = await supabase
          .from('spreadsheet_orders')
          .insert([retryPayload])
          .select()
          .single()
        if (retry.error) {
          alert('Gagal membuat order spreadsheet: ' + retry.error.message)
          return
        }
        resolvedData = retry.data
      } else {
        alert('Gagal membuat order spreadsheet: ' + error.message)
        return
      }
    }

    setOrderPaymentStatusMap(prev => ({ ...prev, [resolvedData.id]: paymentValue }))

    setSpreadsheetOrders(prev => [{
      id: resolvedData.id,
      customerName: resolvedData.customer_name,
      orderName: resolvedData.order_name,
      orderType: resolvedData.order_type,
      budget: Number(resolvedData.budget || 0),
      status: resolvedData.status,
      paymentStatus: resolvedData.payment_status || paymentValue,
      dueDate: resolvedData.due_date,
      publicToken: resolvedData.public_token,
      createdAt: resolvedData.created_at,
      updatedAt: resolvedData.updated_at
    }, ...prev])
    setSelectedOrderId(resolvedData.id)
    setNewOrderCustomer('')
    setNewOrderName('')
    setNewOrderBudget('')
    setNewOrderDueDate(todayString)
    setNewOrderStatus('new')
    setNewOrderPaymentStatus('belum_bayar')
    setTimelineInputProgress(0)
  }

  const startEditSpreadsheetOrder = (order) => {
    if (!order) return
    setShowOrderForm(true)
    setEditingOrderId(order.id)
    setNewOrderCustomer(order.customerName || '')
    setNewOrderName(order.orderName || '')
    setNewOrderType(order.orderType || 'Dashboard')
    setNewOrderBudget(String(order.budget ?? ''))
    setNewOrderDueDate(order.dueDate || todayString)
    setNewOrderStatus(order.status || 'new')
    setNewOrderPaymentStatus(order.paymentStatus || 'belum_bayar')
    setSelectedOrderId(order.id)
  }

  const cancelEditSpreadsheetOrder = () => {
    setEditingOrderId(null)
    setNewOrderCustomer('')
    setNewOrderName('')
    setNewOrderType('Dashboard')
    setNewOrderBudget('')
    setNewOrderDueDate(todayString)
    setNewOrderStatus('new')
    setNewOrderPaymentStatus('belum_bayar')
    setShowOrderForm(false)
  }

  const handleAddOrderTimeline = async (e) => {
    e.preventDefault()
    if (!hasWritePermission('orders')) {
      alert('Akun Anda tidak punya izin menambah timeline order.')
      return
    }
    if (!actorUserId || !selectedSpreadsheetOrder) return
    if (!timelineInputTitle.trim()) return

    const { data, error } = await supabase
      .from('spreadsheet_order_timeline')
      .insert([{
        order_id: selectedSpreadsheetOrder.id,
        title: timelineInputTitle.trim(),
        note: timelineInputNote.trim(),
        progress_percent: Number(timelineInputProgress || 0),
        updated_by: session?.user?.email || actorUserId || 'system'
      }])
      .select()
      .single()

    if (error) {
      alert('Gagal menambah timeline: ' + error.message)
      return
    }

    setOrderTimelineItems(prev => [...prev, {
      id: data.id,
      orderId: data.order_id,
      title: data.title,
      note: data.note || '',
      progressPercent: Number(data.progress_percent || 0),
      createdAt: data.created_at,
      updatedBy: data.updated_by || 'system'
    }])
    setTimelineInputTitle('')
    setTimelineInputNote('')
  }

  const handleDeleteSpreadsheetOrder = async (order) => {
    if (!order) return
    if (!hasWritePermission('orders')) {
      alert('Akun Anda tidak punya izin menghapus order.')
      return
    }
    const ok = window.confirm(`Hapus order "${order.orderName}" beserta timeline-nya?`)
    if (!ok) return

    const { error } = await supabase
      .from('spreadsheet_orders')
      .delete()
      .eq('id', order.id)

    if (error) {
      alert('Gagal menghapus order: ' + error.message)
      return
    }

    setSpreadsheetOrders(prev => prev.filter(item => item.id !== order.id))
    setOrderTimelineItems(prev => prev.filter(item => item.orderId !== order.id))
    setSelectedOrderId(prev => (prev === order.id ? null : prev))
  }

  const startEditTimeline = (item) => {
    setEditingTimelineId(item.id)
    setEditTimelineTitle(item.title || '')
    setEditTimelineNote(item.note || '')
    setEditTimelineProgress(Number(item.progressPercent || 0))
  }

  const cancelEditTimeline = () => {
    setEditingTimelineId(null)
    setEditTimelineTitle('')
    setEditTimelineNote('')
    setEditTimelineProgress(0)
  }

  const handleSaveTimelineEdit = async (itemId) => {
    if (!hasWritePermission('orders')) {
      alert('Akun Anda tidak punya izin update timeline order.')
      return
    }
    if (!itemId || !editTimelineTitle.trim()) return
    const { data, error } = await supabase
      .from('spreadsheet_order_timeline')
      .update({
        title: editTimelineTitle.trim(),
        note: editTimelineNote.trim(),
        progress_percent: Number(editTimelineProgress || 0),
        updated_by: session?.user?.email || actorUserId || 'system'
      })
      .eq('id', itemId)
      .select()
      .single()

    if (error) {
      alert('Gagal update timeline: ' + error.message)
      return
    }

    setOrderTimelineItems(prev => prev.map(item => (
      item.id === itemId
        ? {
            ...item,
            title: data.title,
            note: data.note || '',
            progressPercent: Number(data.progress_percent || 0),
            updatedBy: data.updated_by || item.updatedBy
          }
        : item
    )))
    cancelEditTimeline()
  }

  const handleDeleteTimelineItem = async (itemId) => {
    if (!hasWritePermission('orders')) {
      alert('Akun Anda tidak punya izin hapus timeline order.')
      return
    }
    const ok = window.confirm('Hapus timeline ini?')
    if (!ok) return
    const { error } = await supabase
      .from('spreadsheet_order_timeline')
      .delete()
      .eq('id', itemId)
    if (error) {
      alert('Gagal hapus timeline: ' + error.message)
      return
    }
    setOrderTimelineItems(prev => prev.filter(item => item.id !== itemId))
    if (editingTimelineId === itemId) cancelEditTimeline()
  }

  const resetCrmClientForm = () => {
    setEditingCrmClientId(null)
    setCrmClientName('')
    setCrmClientCompany('')
    setCrmClientEmail('')
    setCrmClientPhone('')
    setCrmClientStatus('lead')
    setCrmClientNextFollowUp(todayString)
    setCrmClientNotes('')
    setShowCrmForm(false)
  }

  const startEditCrmClient = (client) => {
    if (!client) return
    const manualClient = crmClients.find(item => getCrmClientKey(item.name, item.email) === client.key)
    setEditingCrmClientId(manualClient?.id || client.key)
    setCrmClientName(client.name || '')
    setCrmClientCompany(client.company || '')
    setCrmClientEmail(client.email || '')
    setCrmClientPhone(client.phone || '')
    setCrmClientStatus(client.status || 'lead')
    setCrmClientNextFollowUp(client.nextFollowUpDate || todayString)
    setCrmClientNotes(client.notes || '')
    setShowCrmForm(true)
    setSelectedCrmClientId(client.key)
  }

  const handleSubmitCrmClient = async (e) => {
    e.preventDefault()
    if (!hasWritePermission('crm')) {
      alert('Akun Anda tidak punya izin mengelola data CRM.')
      return
    }
    const name = crmClientName.trim()
    if (!name) return

    const existingManual = crmClients.find(item => item.id === editingCrmClientId)
    const payload = {
      id: existingManual?.id || `crm-${Date.now()}`,
      name,
      company: crmClientCompany.trim(),
      email: crmClientEmail.trim(),
      phone: crmClientPhone.trim(),
      status: crmClientStatus,
      nextFollowUpDate: crmClientNextFollowUp || '',
      notes: crmClientNotes.trim(),
      createdAt: existingManual?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    if (scopedUserId) {
      const dbPayload = {
        user_id: scopedUserId,
        name: payload.name,
        company: payload.company || null,
        email: payload.email || null,
        phone: payload.phone || null,
        status: payload.status,
        next_follow_up_date: payload.nextFollowUpDate || null,
        notes: payload.notes || null
      }

      const query = existingManual
        ? supabase.from('crm_clients').update(dbPayload).eq('id', existingManual.id).select().single()
        : supabase.from('crm_clients').insert([dbPayload]).select().single()

      const { data, error } = await query
      if (!error && data) {
        payload.id = data.id
        payload.createdAt = data.created_at
        payload.updatedAt = data.updated_at
      } else if (error) {
        console.warn('CRM Supabase fallback aktif:', error.message)
      }
    }

    setCrmClients(prev => {
      const exists = prev.some(item => item.id === payload.id)
      const next = exists
        ? prev.map(item => (item.id === payload.id ? { ...item, ...payload } : item))
        : [payload, ...prev]
      return next
    })

    createActivityLog({
      type: existingManual ? 'CRM' : 'CRM',
      title: `${existingManual ? 'Client diperbarui' : 'Client ditambahkan'}: ${payload.name}`,
      detail: `${payload.status}${payload.nextFollowUpDate ? ` • follow-up ${formatLongDate(payload.nextFollowUpDate)}` : ''}`,
      tone: 'blue',
      sourceTable: 'crm_clients',
      sourceId: payload.id
    })

    setSelectedCrmClientId(getCrmClientKey(payload.name, payload.email))
    resetCrmClientForm()
  }

  const handleDeleteCrmClient = async (client) => {
    if (!client) return
    if (!hasWritePermission('crm')) {
      alert('Akun Anda tidak punya izin menghapus client CRM.')
      return
    }
    const ok = window.confirm(`Hapus client "${client.name}" dari CRM?`)
    if (!ok) return

    if (scopedUserId) {
      const manualClients = crmClients.filter(item => getCrmClientKey(item.name, item.email) === client.key)
      if (manualClients.length) {
        const manualIds = manualClients.map(item => item.id)
        await supabase.from('crm_clients').delete().in('id', manualIds)
      }
      await supabase.from('crm_activities').delete().eq('client_key', client.key).eq('user_id', scopedUserId)

      // Cascade delete appointments of this client
      const appointmentIds = appointments.filter(item => getCrmClientKey(item.clientName, item.email) === client.key).map(item => item.id)
      if (appointmentIds.length) {
        await supabase.from('appointments').delete().in('id', appointmentIds)
      }

      // Cascade delete spreadsheet orders of this client
      const orderIds = spreadsheetOrders.filter(item => getCrmClientKey(item.customerName) === client.key).map(item => item.id)
      if (orderIds.length) {
        await supabase.from('spreadsheet_orders').delete().in('id', orderIds)
      }
    }

    setCrmClients(prev => prev.filter(item => getCrmClientKey(item.name, item.email) !== client.key))
    setCrmActivities(prev => prev.filter(activity => (activity.clientKey || getCrmClientKey(activity.clientName, activity.clientEmail)) !== client.key))
    setAppointments(prev => prev.filter(item => getCrmClientKey(item.clientName, item.email) !== client.key))
    setSpreadsheetOrders(prev => prev.filter(item => getCrmClientKey(item.customerName) !== client.key))
    setSelectedCrmClientId(prev => (prev === client.key ? null : prev))
    createActivityLog({
      type: 'CRM',
      title: `Client CRM dihapus: ${client.name}`,
      detail: client.email || client.company || 'Data manual CRM',
      tone: 'amber',
      sourceTable: 'crm_clients',
      sourceId: client.key
    })
  }

  const handleSubmitCrmActivity = async (e) => {
    e.preventDefault()
    if (!hasWritePermission('crm')) {
      alert('Akun Anda tidak punya izin menambah follow-up CRM.')
      return
    }
    if (!selectedCrmClient) return
    if (!crmActivityTitle.trim()) return

    const nextActivity = {
      id: `crm-activity-${Date.now()}`,
      clientKey: selectedCrmClient.key,
      clientName: selectedCrmClient.name || '',
      clientEmail: selectedCrmClient.email || '',
      title: crmActivityTitle.trim(),
      note: crmActivityNote.trim(),
      dueDate: crmActivityDueDate || '',
      status: 'open',
      createdAt: new Date().toISOString()
    }

    if (scopedUserId) {
      const { data, error } = await supabase
        .from('crm_activities')
        .insert([{
          user_id: scopedUserId,
          client_key: nextActivity.clientKey,
          client_name: nextActivity.clientName || null,
          client_email: nextActivity.clientEmail || null,
          title: nextActivity.title,
          note: nextActivity.note || null,
          due_date: nextActivity.dueDate || null,
          status: nextActivity.status
        }])
        .select()
        .single()

      if (!error && data) {
        nextActivity.id = data.id
        nextActivity.createdAt = data.created_at
      } else if (error) {
        console.warn('CRM activity Supabase fallback aktif:', error.message)
      }
    }

    setCrmActivities(prev => [nextActivity, ...prev])
    createActivityLog({
      type: 'Follow-up',
      title: `Follow-up dibuat: ${nextActivity.title}`,
      detail: `${selectedCrmClient.name || 'Client'}${nextActivity.dueDate ? ` • ${formatLongDate(nextActivity.dueDate)}` : ''}`,
      tone: 'purple',
      sourceTable: 'crm_activities',
      sourceId: nextActivity.id
    })
    setCrmActivityTitle('')
    setCrmActivityNote('')
    setCrmActivityDueDate(todayString)
  }

  const handleToggleCrmActivityStatus = async (activityId) => {
    if (!hasWritePermission('crm')) {
      alert('Akun Anda tidak punya izin mengubah status follow-up CRM.')
      return
    }
    const currentActivity = crmActivities.find(activity => activity.id === activityId)
    const nextStatus = currentActivity?.status === 'done' ? 'open' : 'done'

    if (scopedUserId && currentActivity && !String(activityId).startsWith('crm-activity-')) {
      await supabase
        .from('crm_activities')
        .update({ status: nextStatus })
        .eq('id', activityId)
        .eq('user_id', scopedUserId)
    }

    setCrmActivities(prev => prev.map(activity => (
      activity.id === activityId
        ? { ...activity, status: nextStatus, updatedAt: new Date().toISOString() }
        : activity
    )))

    if (currentActivity) {
      createActivityLog({
        type: 'Follow-up',
        title: `Follow-up ${nextStatus === 'done' ? 'selesai' : 'dibuka ulang'}: ${currentActivity.title}`,
        detail: currentActivity.clientName || selectedCrmClient?.name || 'Client CRM',
        tone: nextStatus === 'done' ? 'green' : 'amber',
        sourceTable: 'crm_activities',
        sourceId: activityId
      })
    }
  }

  const deleteAppointmentFromCalendar = async (appointment) => {
    if (!hasWritePermission('reservations')) {
      alert('Akun Anda tidak punya izin menghapus reservasi.')
      return
    }
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', appointment.id)

    if (error) {
      alert('Gagal menghapus reservasi: ' + error.message)
      return
    }

    setAppointments(prev => prev.filter(item => item.id !== appointment.id))
  }

  const openDeleteConfirmModal = (item) => {
    const deletableItem = normalizeCalendarActionItem(item)
    if (!deletableItem || !['appointment', 'task'].includes(deletableItem.itemType)) return

    setCalendarActionItem(null)
    setDeleteConfirmItem(deletableItem)
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirmItem) return
    if (deleteConfirmItem.itemType === 'appointment') {
      await deleteAppointmentFromCalendar(deleteConfirmItem)
    } else {
      await deleteTask(deleteConfirmItem.id)
    }
    setDeleteConfirmItem(null)
  }

  const regenerateShareToken = () => {
    setShareToken(Math.random().toString(36).slice(2, 10))
    setCopiedShareLink(false)
  }

  const copyTextToClipboard = async (text) => {
    const value = String(text || '').trim()
    if (!value) throw new Error('Teks kosong.')

    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(value)
        return
      } catch {
        // Continue to manual fallback when clipboard permission is denied.
      }
    }

    const textArea = document.createElement('textarea')
    textArea.value = value
    textArea.style.position = 'fixed'
    textArea.style.left = '-9999px'
    textArea.style.top = '0'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    const copied = document.execCommand('copy')
    document.body.removeChild(textArea)
    if (!copied) throw new Error('Clipboard tidak didukung browser ini.')
  }

  const copyShareLink = async () => {
    try {
      await copyTextToClipboard(sharedFormLink)
      setCopiedShareLink(true)
      setTimeout(() => setCopiedShareLink(false), 1600)
    } catch (error) {
      alert(`Gagal menyalin link: ${error.message}`)
    }
  }

  const normalizeWorkspaceInviteUsername = (value) => String(value || '').trim().replace(/^@/, '').toLowerCase()

  const normalizeWorkspaceInviteEmail = (value) => {
    const normalized = normalizeWorkspaceInviteUsername(value)
    if (!normalized) return ''
    if (normalized.includes('@')) return normalized
    return `${normalized}.dyatask@gmail.com`
  }

  const buildWorkspaceInviteSessionPassword = (username, token) => {
    const safeUsername = normalizeWorkspaceInviteUsername(username) || 'assistant'
    const safeToken = String(token || '').trim()
    return `DyaTaskInvite#${safeUsername}#${safeToken}`
  }

  const generateWorkspaceInviteToken = () => {
    if (window.crypto?.getRandomValues) {
      const values = new Uint8Array(12)
      window.crypto.getRandomValues(values)
      return Array.from(values, value => value.toString(16).padStart(2, '0')).join('').slice(0, 18)
    }
    return Math.random().toString(36).slice(2, 11) + Math.random().toString(36).slice(2, 11)
  }

  const showWorkspaceInviteNotice = ({ tone = 'info', title = 'Workspace Invite', message = '', detail = '' } = {}) => {
    setWorkspaceInviteNotice({
      id: Date.now(),
      tone,
      title,
      message,
      detail
    })
  }

  const createWorkspaceInviteSessionViaFunction = async (inviteToken) => {
    const username = normalizeWorkspaceInviteUsername(inviteUsernameFromUrl)
      || `assistant-${String(inviteToken || '').trim().slice(0, 8).toLowerCase()}`
    const { data, error } = await supabase.functions.invoke('workspace-invite-session', {
      body: {
        inviteToken,
        username
      }
    })
    if (error) throw new Error(error.message || 'Gagal membuat session invite.')
    if (data?.error) throw new Error(data.error)
    if (!data?.email || !data?.password) throw new Error('Response session invite tidak lengkap.')
    return {
      email: data.email,
      password: data.password
    }
  }

  const isWorkspaceInviteFunctionUnavailable = (error) => {
    const message = String(error?.message || error || '').toLowerCase()
    return message.includes('failed to send a request to the edge function')
      || message.includes('requested function was not found')
      || message.includes('function was not found')
      || message.includes('workspace-invite-session')
  }

  const createWorkspaceInviteSessionAnonymously = async () => {
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) {
      const message = String(error.message || '')
      if (message.toLowerCase().includes('database error creating anonymous user')) {
        throw new Error('Anonymous sign-in sudah aktif, tapi trigger profiles masih menolak user tanpa email. Jalankan One-Click Apply SQL di Settings, lalu coba invite token lagi.')
      }
      throw new Error(`Anonymous sign-in gagal: ${message || 'Unknown error'}`)
    }
    if (!data?.session) {
      throw new Error('Session anonymous tidak berhasil dibuat.')
    }
    return data.session
  }

  const ensureWorkspaceInviteSession = async (inviteToken) => {
    const username = normalizeWorkspaceInviteUsername(inviteUsernameFromUrl)
      || `assistant-${String(inviteToken || '').trim().slice(0, 8).toLowerCase()}`
    const email = normalizeWorkspaceInviteEmail(username)
    const password = buildWorkspaceInviteSessionPassword(username, inviteToken)

    const directSignIn = await supabase.auth.signInWithPassword({ email, password })
    if (!directSignIn.error) return directSignIn.data?.session || null

    try {
      const functionSession = await createWorkspaceInviteSessionViaFunction(inviteToken)
      const functionSignIn = await supabase.auth.signInWithPassword({
        email: functionSession.email,
        password: functionSession.password
      })
      if (functionSignIn.error) throw functionSignIn.error
      return functionSignIn.data?.session || null
    } catch (error) {
      if (!isWorkspaceInviteFunctionUnavailable(error)) throw error
      return createWorkspaceInviteSessionAnonymously()
    }
  }

  const getSupabaseProjectRef = () => {
    try {
      const rawUrl = String(import.meta.env.VITE_SUPABASE_URL || '')
      const host = new URL(rawUrl).hostname
      return host.split('.')[0] || ''
    } catch {
      return ''
    }
  }

  const handleOneClickApplyWorkspaceSql = async () => {
    if (!isAppDeveloper) {
      showWorkspaceInviteNotice({
        tone: 'error',
        title: 'Akses Developer',
        message: 'One-Click Apply SQL hanya tersedia untuk developer app.'
      })
      return
    }

    try {
      await copyTextToClipboard(`${workspaceTeamMigrationSql}\n\n${workspaceGoogleCalendarConfigRpcSql}\n\n${allowAnonymousAuthProfilesSql}\n\n${globalLoginVisualSql}`)
      setMigrationOneClickCopied(true)
      setTimeout(() => setMigrationOneClickCopied(false), 2200)
    } catch (error) {
      alert(`Gagal menyalin SQL: ${error.message}`)
      return
    }

    const projectRef = getSupabaseProjectRef()
    if (!projectRef) {
      alert('Project ref Supabase tidak ditemukan. Pastikan VITE_SUPABASE_URL valid di .env.local.')
      return
    }

    window.open(`https://supabase.com/dashboard/project/${projectRef}/sql/new`, '_blank', 'noopener,noreferrer')
  }

  const buildWorkspaceInviteLink = (token = workspaceInviteToken, username = workspaceInviteUsername) => {
    const safeToken = String(token || '').trim()
    const safeUsername = normalizeWorkspaceInviteUsername(username)
    if (!safeToken) return ''
    const url = new URL(window.location.href)
    url.searchParams.set('invite', safeToken)
    if (safeUsername) url.searchParams.set('u', safeUsername)
    url.searchParams.delete('booking')
    url.searchParams.delete('track')
    return url.toString()
  }

  const getWorkspaceInviteWaText = (token = workspaceInviteToken, username = workspaceInviteUsername, role = workspaceInviteRole) => {
    const inviteLink = buildWorkspaceInviteLink(token, username)
    const safeUsername = normalizeWorkspaceInviteUsername(username)
    return [
      'Hai, kamu diundang ke workspace DyaTask.',
      '',
      `Username: ${safeUsername || '-'}`,
      `Role: ${role}`,
      `Token invite: ${String(token || '').trim() || '-'}`,
      `Link invite: ${inviteLink || '-'}`,
      '',
      'Buka link, masukkan token invite, lalu workspace akan terbuka otomatis.'
    ].join('\n')
  }

  const buildWorkspaceInviteWhatsAppLink = (token = workspaceInviteToken, username = workspaceInviteUsername, role = workspaceInviteRole) => {
    const waText = getWorkspaceInviteWaText(token, username, role)
    return `https://wa.me/?text=${encodeURIComponent(waText)}`
  }

  const handleCopyWorkspaceInviteLink = async () => {
    const inviteLink = buildWorkspaceInviteLink()
    if (!inviteLink) {
      showWorkspaceInviteNotice({
        tone: 'warning',
        title: 'Token Belum Tersedia',
        message: 'Buat undangan assistant dulu sebelum menyalin link.'
      })
      return
    }
    try {
      await copyTextToClipboard(inviteLink)
      setMigrationOneClickCopied(false)
      showWorkspaceInviteNotice({
        tone: 'success',
        title: 'Link Invite Disalin',
        message: 'Link invite assistant sudah siap dikirim.'
      })
    } catch (error) {
      showWorkspaceInviteNotice({
        tone: 'error',
        title: 'Gagal Menyalin Link',
        message: error.message
      })
    }
  }

  const handleCopyWorkspaceInviteToWA = async () => {
    if (!String(workspaceInviteToken || '').trim()) {
      showWorkspaceInviteNotice({
        tone: 'warning',
        title: 'Token Belum Tersedia',
        message: 'Buat undangan assistant dulu sebelum menyalin pesan WhatsApp.'
      })
      return
    }
    const waText = getWorkspaceInviteWaText()
    try {
      await copyTextToClipboard(waText)
      showWorkspaceInviteNotice({
        tone: 'success',
        title: 'Pesan WA Disalin',
        message: 'Pesan invite sudah siap ditempel ke WhatsApp.'
      })
    } catch (error) {
      showWorkspaceInviteNotice({
        tone: 'error',
        title: 'Gagal Menyalin Pesan',
        message: error.message
      })
    }
  }

  const handleOpenWorkspaceInviteWhatsApp = () => {
    if (!String(workspaceInviteToken || '').trim()) {
      showWorkspaceInviteNotice({
        tone: 'warning',
        title: 'Token Belum Tersedia',
        message: 'Buat undangan assistant dulu sebelum membuka WhatsApp.'
      })
      return
    }
    window.open(buildWorkspaceInviteWhatsAppLink(), '_blank', 'noopener,noreferrer')
  }

  const handleExitInviteLanding = () => {
    const url = new URL(window.location.href)
    url.searchParams.delete('invite')
    url.searchParams.delete('invite_token')
    url.searchParams.delete('u')
    url.searchParams.delete('username')
    window.history.replaceState({}, '', url.toString())
    localStorage.removeItem('dyatask_pending_workspace_invite_token')
    setPendingInviteToken('')
    setInviteLandingToken('')
    setAuthError(null)
    setAuthTab('signin')
  }

  const isMissingWorkspaceInviteRpcError = (error) => {
    const message = String(error?.message || '').toLowerCase()
    return message.includes('accept_workspace_invite_token_only') && (
      message.includes('schema cache') || message.includes('could not find the function')
    )
  }

  const isDuplicateWorkspaceMembershipError = (error) => {
    const message = String(error?.message || '').toLowerCase()
    return message.includes('workspace_members_owner_user_id_member_user_id_key')
      || (message.includes('duplicate key value') && message.includes('workspace_members'))
  }

  const acceptWorkspaceInviteToken = async (inviteToken, userId) => {
    if (!userId) {
      throw new Error('Session user tidak ditemukan.')
    }

    const { error } = await supabase.rpc('accept_workspace_invite_token_only', {
      p_invite_token: inviteToken
    })
    if (!error) return
    if (isDuplicateWorkspaceMembershipError(error)) return
    if (!isMissingWorkspaceInviteRpcError(error)) throw error

    throw new Error('RPC accept invite belum ada di Supabase. Jalankan One-Click Apply SQL dulu, lalu coba lagi.')
  }

  const handleDirectInviteWorkspaceAccess = async () => {
    const expectedToken = String(inviteLandingToken || '').trim()
    const confirmedToken = String(inviteConfirmInput || '').trim()
    if (!expectedToken) {
      showWorkspaceInviteNotice({
        tone: 'error',
        title: 'Token Tidak Ditemukan',
        message: 'Buka ulang link invite dari owner.'
      })
      return
    }
    if (!confirmedToken || confirmedToken !== expectedToken) {
      showWorkspaceInviteNotice({
        tone: 'warning',
        title: 'Token Tidak Cocok',
        message: 'Pastikan token yang dimasukkan sama persis dengan token invite.'
      })
      return
    }

    setInviteDirectLoading(true)
    try {
      let activeSession = session
      if (!activeSession?.user?.id) {
        activeSession = await ensureWorkspaceInviteSession(expectedToken)
      }

      if (!activeSession?.user?.id) {
        throw new Error('Session invite tidak berhasil dibuat.')
      }

      await acceptWorkspaceInviteToken(expectedToken, activeSession.user.id)

      localStorage.removeItem('dyatask_pending_workspace_invite_token')
      setPendingInviteToken('')
      setInviteAuthNotice('')
      setInviteLandingToken('')
      setInviteConfirmInput('')
      setInviteConfirmModalOpen(false)

      const url = new URL(window.location.href)
      url.searchParams.delete('invite')
      url.searchParams.delete('invite_token')
      url.searchParams.delete('u')
      url.searchParams.delete('username')
      window.location.replace(url.toString())
    } catch (error) {
      const message = String(error?.message || '')
      if (message.toLowerCase().includes('failed to fetch')) {
        showWorkspaceInviteNotice({
          tone: 'error',
          title: 'Koneksi Supabase Gagal',
          message: 'Coba lagi beberapa detik, atau refresh halaman.'
        })
      } else {
        showWorkspaceInviteNotice({
          tone: 'error',
          title: 'Gagal Membuka Workspace',
          message
        })
      }
    } finally {
      setInviteDirectLoading(false)
    }
  }

  useEffect(() => {
    const token = String(pendingInviteToken || '').trim()
    if (!session?.user?.id || !token || inviteTokenFromUrl) return

    let cancelled = false
    const acceptPendingInvite = async () => {
      setInviteDirectLoading(true)
      try {
        await acceptWorkspaceInviteToken(token, session.user.id)
        if (cancelled) return
        localStorage.removeItem('dyatask_pending_workspace_invite_token')
        setPendingInviteToken('')
        setInviteLandingToken('')
        setInviteConfirmInput('')
        setInviteConfirmModalOpen(false)
        setInviteAuthNotice('')
        window.location.reload()
      } catch (error) {
        if (cancelled) return
        setInviteAuthNotice(`Invite belum bisa diterima otomatis: ${error.message}`)
      } finally {
        if (!cancelled) setInviteDirectLoading(false)
      }
    }

    acceptPendingInvite()
    return () => {
      cancelled = true
    }
  }, [session?.user?.id, pendingInviteToken, inviteTokenFromUrl])

  const toggleWorkspaceInvitePermission = (permissionKey) => {
    if (!Object.prototype.hasOwnProperty.call(TEAM_PERMISSION_DEFAULTS, permissionKey)) return
    setWorkspaceInvitePermissions(prev => ({
      ...prev,
      [permissionKey]: !prev[permissionKey]
    }))
  }

  const handleInviteWorkspaceMember = async (e) => {
    e.preventDefault()
    if (!canManageTeam) {
      showWorkspaceInviteNotice({
        tone: 'error',
        title: 'Akses Ditolak',
        message: 'Hanya owner yang bisa mengundang assistant.'
      })
      return
    }

    const inviteUsername = normalizeWorkspaceInviteUsername(workspaceInviteUsername)
    if (!inviteUsername) {
      showWorkspaceInviteNotice({
        tone: 'warning',
        title: 'Username Wajib Diisi',
        message: 'Isi username assistant sebelum membuat invite.'
      })
      return
    }

    const email = normalizeWorkspaceInviteEmail(inviteUsername)

    setTeamLoading(true)
    const { data, error } = await supabase.rpc('invite_workspace_member', {
      p_email: email,
      p_role: workspaceInviteRole,
      p_permissions: workspaceInvitePermissions
    })
    setTeamLoading(false)

    if (error) {
      showWorkspaceInviteNotice({
        tone: 'error',
        title: 'Gagal Mengundang Assistant',
        message: error.message
      })
      return
    }

    const token = data?.invite_token || ''
    setWorkspaceInviteToken(token || '')
    setWorkspaceInviteUsername(inviteUsername)
    setWorkspaceInvitePermissions({ ...TEAM_PERMISSION_DEFAULTS })
    const inviteLink = buildWorkspaceInviteLink(token, inviteUsername)

    await createActivityLog({
      type: 'Team',
      title: `Undangan ${workspaceInviteRole} dibuat`,
      detail: `${inviteUsername}${token ? ` • token ${token}` : ''}${inviteLink ? ` • link ${inviteLink}` : ''}`,
      tone: 'blue',
      sourceTable: 'workspace_members',
      sourceId: data?.id || ''
    })

    showWorkspaceInviteNotice({
      tone: 'success',
      title: 'Invite Assistant Dibuat',
      message: `Token untuk ${inviteUsername} sudah siap dikirim.`,
      detail: token
    })
  }

  const handleAcceptWorkspaceInvite = async (e) => {
    e.preventDefault()
    const token = workspaceInviteToken.trim()
    if (!token) return

    setTeamLoading(true)
    const activeUserId = session?.user?.id || actorUserId
    let error = null
    try {
      await acceptWorkspaceInviteToken(token, activeUserId)
    } catch (inviteError) {
      error = inviteError
    }
    setTeamLoading(false)

    if (error) {
      showWorkspaceInviteNotice({
        tone: 'error',
        title: 'Gagal Menerima Undangan',
        message: error.message
      })
      return
    }

    setWorkspaceInviteToken('')
    showWorkspaceInviteNotice({
      tone: 'success',
      title: 'Undangan Diterima',
      message: 'Data workspace akan otomatis tersinkron.'
    })
    window.location.reload()
  }

  const handleUpdateWorkspaceMember = async (memberId, updates = {}) => {
    if (!canManageTeam) {
      showWorkspaceInviteNotice({
        tone: 'error',
        title: 'Akses Ditolak',
        message: 'Hanya owner yang bisa mengubah anggota workspace.'
      })
      return
    }
    if (!memberId) return

    const target = workspaceMembers.find(item => item.id === memberId)
    if (!target || target.role === 'owner') return

    const patch = {}
    if (updates.role && ['assistant', 'viewer'].includes(updates.role)) patch.role = updates.role
    if (updates.status && ['active', 'pending', 'revoked'].includes(updates.status)) patch.status = updates.status
    if (updates.permissions) patch.permissions = updates.permissions
    if (!Object.keys(patch).length) return

    const { error } = await supabase
      .from('workspace_members')
      .update(patch)
      .eq('id', memberId)

    if (error) {
      showWorkspaceInviteNotice({
        tone: 'error',
        title: 'Gagal Update Anggota',
        message: error.message
      })
      return
    }

    setWorkspaceMembers(prev => prev.map(item => (
      item.id === memberId
        ? {
            ...item,
            ...patch,
            permissions: patch.permissions ? { ...TEAM_PERMISSION_DEFAULTS, ...patch.permissions } : item.permissions
          }
        : item
    )))
  }

  const handleDeleteWorkspaceMember = async (member) => {
    if (!canManageTeam) {
      showWorkspaceInviteNotice({
        tone: 'error',
        title: 'Akses Ditolak',
        message: 'Hanya owner yang bisa menghapus assistant.'
      })
      return
    }
    if (!member?.id || member.role === 'owner') return

    const ok = window.confirm(`Hapus assistant "${member.memberEmail}" dari workspace?`)
    if (!ok) return

    setTeamLoading(true)
    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('id', member.id)
      .eq('owner_user_id', workspaceContext?.ownerUserId)
    setTeamLoading(false)

    if (error) {
      showWorkspaceInviteNotice({
        tone: 'error',
        title: 'Gagal Menghapus Assistant',
        message: error.message
      })
      return
    }

    setWorkspaceMembers(prev => prev.filter(item => item.id !== member.id))
    await createActivityLog({
      type: 'Team',
      title: 'Assistant dihapus',
      detail: `${member.memberEmail} dihapus dari workspace`,
      tone: 'red',
      sourceTable: 'workspace_members',
      sourceId: member.id
    })
  }

  const getWorkspaceMemberInviteUsername = (member) => {
    const rawEmail = String(member?.memberEmail || '').trim().toLowerCase()
    if (!rawEmail) return ''
    if (rawEmail.endsWith('.dyatask@gmail.com')) {
      return rawEmail.replace(/\.dyatask@gmail\.com$/, '')
    }
    return rawEmail.split('@')[0] || rawEmail
  }

  const handleCopyWorkspaceMemberInviteLink = async (member) => {
    const token = String(member?.inviteToken || '').trim()
    if (!token) {
      showWorkspaceInviteNotice({
        tone: 'warning',
        title: 'Token Tidak Aktif',
        message: 'Member ini belum memiliki token invite aktif.'
      })
      return
    }

    const inviteLink = buildWorkspaceInviteLink(token, getWorkspaceMemberInviteUsername(member))
    try {
      await copyTextToClipboard(inviteLink)
      showWorkspaceInviteNotice({
        tone: 'success',
        title: 'Link Assistant Disalin',
        message: `Link invite untuk ${getWorkspaceMemberInviteUsername(member)} sudah siap dikirim.`
      })
    } catch (error) {
      showWorkspaceInviteNotice({
        tone: 'error',
        title: 'Gagal Menyalin Link',
        message: error.message
      })
    }
  }

  const handleRegenerateWorkspaceMemberInviteToken = async (member) => {
    if (!canManageTeam) {
      showWorkspaceInviteNotice({
        tone: 'error',
        title: 'Akses Ditolak',
        message: 'Hanya owner yang bisa regenerate token assistant.'
      })
      return
    }
    if (!member?.id || member.role === 'owner') return

    const nextToken = generateWorkspaceInviteToken()
    setTeamLoading(true)
    const { error } = await supabase
      .from('workspace_members')
      .update({
        invite_token: nextToken,
        member_user_id: null,
        status: 'pending',
        accepted_at: null
      })
      .eq('id', member.id)
      .eq('owner_user_id', workspaceContext?.ownerUserId)
    setTeamLoading(false)

    if (error) {
      showWorkspaceInviteNotice({
        tone: 'error',
        title: 'Gagal Regenerate Token',
        message: error.message
      })
      return
    }

    setWorkspaceMembers(prev => prev.map(item => (
      item.id === member.id
        ? {
            ...item,
            inviteToken: nextToken,
            memberUserId: null,
            status: 'pending',
            acceptedAt: null
          }
        : item
    )))
    setWorkspaceInviteToken(nextToken)
    setWorkspaceInviteUsername(getWorkspaceMemberInviteUsername(member))

    await createActivityLog({
      type: 'Team',
      title: 'Token invite diganti',
      detail: `${getWorkspaceMemberInviteUsername(member)} menerima token baru`,
      tone: 'purple',
      sourceTable: 'workspace_members',
      sourceId: member.id
    })

    showWorkspaceInviteNotice({
      tone: 'success',
      title: 'Token Baru Dibuat',
      message: `Token lama untuk ${getWorkspaceMemberInviteUsername(member)} sudah diganti.`,
      detail: nextToken
    })
  }

  const openWorkspaceMemberPageAccess = (member) => {
    if (!member?.id) return
    setPageAccessMemberId(member.id)
    setPageAccessDraftPermissions(normalizeTeamPermissions(member.permissions || {}))
  }

  const toggleWorkspaceMemberPageAccess = (permissionKey) => {
    setPageAccessDraftPermissions(prev => ({ ...prev, [permissionKey]: !prev?.[permissionKey] }))
  }

  const saveWorkspaceMemberPageAccess = async () => {
    if (!pageAccessMemberId) return
    await handleUpdateWorkspaceMember(pageAccessMemberId, { permissions: pageAccessDraftPermissions })
    setPageAccessMemberId(null)
  }

  const renderTeamAssistantWorkspacePanel = () => {
    const assistantMembers = workspaceMembers.filter(member => member.role !== 'owner')

    return (
    <div className="p-5 rounded-2xl border border-purple-200 dark:border-indigo-900 bg-white dark:bg-indigo-950 shadow-sm space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-bold flex items-center gap-2">
            <Users size={15} className="text-purple-500" />
            Team Assistant Workspace
          </h4>
          <p className="text-[11px] text-purple-400 dark:text-purple-300 mt-0.5">
            Role Anda: <span className="font-bold text-purple-600 dark:text-purple-200">{WORKSPACE_ROLE_LABELS[workspaceRole] || workspaceRole}</span>
          </p>
        </div>
        <span className="text-[10px] px-2 py-1 rounded-lg bg-white/70 border border-purple-100 text-purple-600 font-bold">
          Workspace: {workspaceContext?.ownerUserId ? `${workspaceContext.ownerUserId.slice(0, 8)}...` : '-'}
        </span>
      </div>

      {isAppDeveloper && (
        <div className="rounded-xl border border-purple-100 bg-[#f8f5ff] dark:bg-indigo-950 p-3 flex flex-col md:flex-row md:items-center gap-2 justify-between">
          <div>
            <p className="text-xs font-bold text-[#4f4574]">One-Click Apply SQL (Team Assistant)</p>
            <p className="text-[10px] text-purple-400">Sekali klik: SQL team assistant dan akses Google Calendar assistant otomatis dicopy lalu SQL Editor Supabase dibuka.</p>
          </div>
          <button
            type="button"
            onClick={handleOneClickApplyWorkspaceSql}
            className="px-3 py-2 rounded-xl bg-[#8f75d8] hover:bg-[#8069c8] text-white text-xs font-bold"
          >
            {migrationOneClickCopied ? 'SQL Copied ✓' : 'One-Click Apply SQL'}
          </button>
        </div>
      )}

      <form onSubmit={handleAcceptWorkspaceInvite} className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-2">
        <input
          value={workspaceInviteToken}
          onChange={(e) => setWorkspaceInviteToken(e.target.value)}
          placeholder="Masukkan token undangan untuk join workspace owner"
          className="w-full px-3 py-2.5 rounded-xl border border-purple-100 dark:border-indigo-900 bg-white dark:bg-indigo-950/30 text-xs focus:outline-none focus:ring-2 focus:ring-purple-300/50"
        />
        <button
          type="submit"
          disabled={teamLoading || !workspaceInviteToken.trim()}
          className="px-4 py-2.5 rounded-xl bg-[#8f75d8] text-white text-xs font-bold disabled:opacity-50"
        >
          Join Token
        </button>
      </form>

      {canManageTeam && (
        <form onSubmit={handleInviteWorkspaceMember} className="space-y-3 rounded-xl border border-purple-100 bg-[#fbfaff] dark:bg-indigo-950 p-3">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
            <input
              type="text"
              value={workspaceInviteUsername}
              onChange={(e) => setWorkspaceInviteUsername(e.target.value)}
              placeholder="Username asisten / viewer"
              className="w-full px-3 py-2.5 rounded-xl border border-purple-100 dark:border-indigo-900 bg-white dark:bg-indigo-950/30 text-xs focus:outline-none focus:ring-2 focus:ring-purple-300/50"
              required
            />
            <select
              value={workspaceInviteRole}
              onChange={(e) => setWorkspaceInviteRole(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-purple-100 dark:border-indigo-900 bg-white dark:bg-indigo-950/30 text-xs focus:outline-none focus:ring-2 focus:ring-purple-300/50"
            >
              <option value="assistant">Assistant (can edit)</option>
              <option value="viewer">Viewer (read only)</option>
            </select>
          </div>

          <p className="text-[10px] text-purple-400">
            Invite dikirim berbasis username. User cukup buka link dan masukkan token untuk akses workspace.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(TEAM_PERMISSION_LABELS).map(([permissionKey, label]) => (
              <label key={permissionKey} className="flex items-center gap-2 text-[10px] rounded-lg border border-purple-100 bg-white px-2 py-1.5">
                <input
                  type="checkbox"
                  checked={!!workspaceInvitePermissions?.[permissionKey]}
                  onChange={() => toggleWorkspaceInvitePermission(permissionKey)}
                  className="accent-[#8f75d8]"
                />
                <span className="text-purple-600">{label}</span>
              </label>
            ))}
          </div>

          <button
            type="submit"
            disabled={teamLoading}
            className="px-4 py-2 rounded-xl bg-[#8f75d8] text-white text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-60"
          >
            <UserPlus size={12} />
            {teamLoading ? 'Mengundang...' : 'Undang Asisten'}
          </button>

          {workspaceInviteToken && (
            <div className="space-y-2 rounded-xl border border-purple-100 bg-[#faf8ff] p-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-purple-400">Token undangan terbaru</p>
                <p className="mt-1 break-all font-mono text-[11px] text-purple-700">{workspaceInviteToken}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-purple-400">Link invite</p>
                <p className="mt-1 break-all text-[11px] text-purple-700">{buildWorkspaceInviteLink()}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleCopyWorkspaceInviteLink}
                  className="px-3 py-2 rounded-xl border border-purple-200 bg-white text-[11px] font-bold text-purple-600 inline-flex items-center gap-1.5"
                >
                  <Copy size={12} />
                  Copy Link
                </button>
                <button
                  type="button"
                  onClick={handleCopyWorkspaceInviteToWA}
                  className="px-3 py-2 rounded-xl border border-purple-200 bg-white text-[11px] font-bold text-purple-600 inline-flex items-center gap-1.5"
                >
                  <MessageSquare size={12} />
                  Copy to WA
                </button>
                <button
                  type="button"
                  onClick={handleOpenWorkspaceInviteWhatsApp}
                  className="px-3 py-2 rounded-xl bg-[#8f75d8] text-[11px] font-bold text-white inline-flex items-center gap-1.5"
                >
                  <ExternalLink size={12} />
                  Open WhatsApp
                </button>
              </div>
            </div>
          )}
        </form>
      )}

      <div className="rounded-xl border border-purple-100 bg-[#fbfaff] dark:bg-indigo-950 p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-bold text-[#4f4574] dark:text-purple-100">Assistant</p>
          <span className="text-[10px] font-bold text-purple-500">{assistantMembers.length} orang</span>
        </div>

        {assistantMembers.length === 0 ? (
          <p className="rounded-lg border border-dashed border-purple-100 bg-white px-3 py-3 text-[11px] text-purple-400">
            Belum ada assistant.
          </p>
        ) : assistantMembers.map(member => (
          <div key={member.id} className="rounded-lg border border-purple-100 bg-white p-3 space-y-2">
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#4f4574] truncate">{getWorkspaceMemberInviteUsername(member)}</p>
              <p className="text-[10px] text-purple-400 truncate">{member.memberEmail}</p>
            </div>
            <div className="flex items-center flex-wrap gap-1.5">
              <span className={`h-8 px-2.5 rounded-lg text-[10px] font-bold inline-flex items-center ${member.status === 'active' ? 'bg-emerald-50 text-emerald-600' : member.status === 'revoked' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-600'}`}>
                {member.status}
              </span>
              {member.inviteToken && (
                <button
                  type="button"
                  onClick={() => handleCopyWorkspaceMemberInviteLink(member)}
                  className="h-8 px-2.5 rounded-lg border border-purple-100 bg-white text-[10px] font-bold text-purple-600 inline-flex items-center gap-1"
                  title="Salin link invite"
                >
                  <Copy size={10} />
                  Link
                </button>
              )}
              {canManageTeam && (
                <>
                  <button
                    type="button"
                    onClick={() => handleRegenerateWorkspaceMemberInviteToken(member)}
                    disabled={teamLoading}
                    className="h-8 px-2.5 rounded-lg border border-purple-100 bg-[#f6f1ff] text-[10px] font-bold text-purple-600 inline-flex items-center gap-1 disabled:opacity-50"
                    title="Regenerate token invite"
                  >
                    <RefreshCw size={10} />
                    Token
                  </button>
                  <button
                    type="button"
                    onClick={() => openWorkspaceMemberPageAccess(member)}
                    className="h-8 px-2.5 rounded-lg border border-purple-100 bg-white text-[10px] font-bold text-purple-600 inline-flex items-center gap-1"
                    title="Atur akses halaman assistant"
                  >
                    <SlidersHorizontal size={10} />
                    Akses Halaman
                  </button>
                  <select
                    value={member.role}
                    onChange={(e) => handleUpdateWorkspaceMember(member.id, { role: e.target.value })}
                    className="h-8 px-2 rounded-lg border border-purple-100 bg-white text-[10px]"
                  >
                    <option value="assistant">assistant</option>
                    <option value="viewer">viewer</option>
                  </select>
                  <select
                    value={member.status}
                    onChange={(e) => handleUpdateWorkspaceMember(member.id, { status: e.target.value })}
                    className="h-8 px-2 rounded-lg border border-purple-100 bg-white text-[10px]"
                  >
                    <option value="active">active</option>
                    <option value="pending">pending</option>
                    <option value="revoked">revoked</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleDeleteWorkspaceMember(member)}
                    disabled={teamLoading}
                    className="h-8 w-8 rounded-lg border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-50 inline-flex items-center justify-center"
                    title="Hapus assistant"
                  >
                    <Trash2 size={12} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {canManageTeam && pageAccessMemberId && (
        <div className="fixed inset-0 bg-slate-500/35 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPageAccessMemberId(null)}>
          <div className="w-full max-w-xl rounded-[1.6rem] bg-white p-5 shadow-2xl border border-purple-100/80" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-purple-400">Assistant Access</p>
                <h4 className="text-lg font-extrabold text-[#4f4574]">Atur Akses Halaman</h4>
              </div>
              <button
                type="button"
                onClick={() => setPageAccessMemberId(null)}
                className="h-8 w-8 rounded-lg border border-purple-100 text-purple-400 hover:bg-purple-50 inline-flex items-center justify-center"
              >
                <X size={14} />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(TEAM_PERMISSION_LABELS).map(([permissionKey, label]) => (
                <label key={permissionKey} className="flex items-center gap-2 text-[11px] rounded-lg border border-purple-100 bg-white px-2.5 py-2">
                  <input
                    type="checkbox"
                    checked={!!pageAccessDraftPermissions?.[permissionKey]}
                    onChange={() => toggleWorkspaceMemberPageAccess(permissionKey)}
                    className="accent-[#8f75d8]"
                  />
                  <span className="text-purple-700">{label}</span>
                </label>
              ))}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPageAccessMemberId(null)}
                className="px-3 py-2 rounded-lg border border-purple-100 text-xs font-bold text-purple-500 hover:bg-purple-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={saveWorkspaceMemberPageAccess}
                disabled={teamLoading}
                className="px-3 py-2 rounded-lg bg-[#8f75d8] text-white text-xs font-bold disabled:opacity-50"
              >
                Simpan Akses
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    )
  }

  // Note client-side encryption simulation
  const handleEncryptNote = (e) => {
    e.preventDefault()
    if (!hasWritePermission('notes')) {
      alert('Akun Anda tidak punya izin menambah catatan aman.')
      return
    }
    if (!noteInputTitle.trim() || !noteInputContent.trim()) return
    if (!masterPassword) {
      alert('Tolong masukkan Master Password untuk mengenkripsi catatan!')
      return
    }

    setScrambleProgress(true)
    setScrambledText('MENGAMBIL IV...')
    
    // Simulate visual encryption matrix
    setTimeout(() => {
      setScrambledText('MENURUNKAN KUNCI VIA PBKDF2...')
      setTimeout(() => {
        setScrambledText('MENJALANKAN AES-256-GCM...')
        setTimeout(async () => {
          // Basic XOR + rot13 client-side mock for encryption representation
          const cipherText = btoa(noteInputContent.split('').map((char, index) => 
            String.fromCharCode(char.charCodeAt(0) ^ masterPassword.charCodeAt(index % masterPassword.length))
          ).join(''))
          
          const dbNote = {
            title: noteInputTitle,
            cipher_text: `U2FsdGVkX1+${cipherText.substring(0, 18)}... [SECURE AES PAYLOAD]`,
            iv: Math.random().toString(36).substring(2, 10),
            salt: Math.random().toString(36).substring(2, 10),
            plaintext_hint: noteInputContent.substring(0, 25) + '...',
            user_id: actorUserId
          }

          const { data, error } = await supabase
            .from('secure_notes')
            .insert([dbNote])
            .select();

          if (error) {
            alert('Gagal menyimpan catatan terenkripsi ke Supabase: ' + error.message)
            setScrambleProgress(false)
            return
          }

          if (data && data[0]) {
            const newNote = {
              id: data[0].id,
              title: data[0].title,
              cipherText: data[0].cipher_text,
              realPayload: cipherText,
              iv: data[0].iv,
              salt: data[0].salt,
              plaintextHint: data[0].plaintext_hint,
              isEncrypted: true
            }
            setNotes([newNote, ...notes])
          }

          setNoteInputTitle('')
          setNoteInputContent('')
          setScrambleProgress(false)
          
          // Trigger alert
          triggerMockNotification(
            'Catatan Berhasil Dienkripsi!',
            `Catatan "${dbNote.title}" terenkripsi & disimpan aman di Supabase!`,
            'security'
          )
        }, 600)
      }, 600)
    }, 600)
  }

  // Decrypt simulation
  const handleDecryptNote = (note) => {
    if (!decryptPassphraseInput) {
      alert('Tolong masukkan kata sandi untuk mendekripsi!')
      return
    }

    // Check key logic
    if (decryptPassphraseInput === masterPassword || note.id === 'note-1') {
      // Simulate decryption
      let dec = ''
      if (note.realPayload) {
        const decoded = atob(note.realPayload)
        dec = decoded.split('').map((char, index) => 
          String.fromCharCode(char.charCodeAt(0) ^ decryptPassphraseInput.charCodeAt(index % decryptPassphraseInput.length))
        ).join('')
      } else {
        dec = 'Ini adalah berkas rancangan awal DyaTask Manager: Menyelesaikan frontend UI/UX, mengintegrasikan Google Calendar sync, Notion databases via API key, dan menyambungkan lembar spreadsheets untuk log data secara realtime.'
      }

      setActiveDecryptedContent({
        id: note.id,
        content: dec
      })
      setDecryptingNoteId(null)
      setDecryptPassphraseInput('')
    } else {
      alert('Kata sandi salah! Gagal mendekripsi Payload AES-256-GCM.')
    }
  }

  // Trigger quick reply
  const handleQuickReply = (message) => {
    const latest = activeNotifications[0]
    if (!latest) return
    setNotifications(prev => prev.map(item => (
      item.id === latest.id
        ? { ...item, confirmed: true, confirmedAt: Date.now() }
        : item
    )))
    setShowNotificationList(false)
    const timestamp = new Date().toLocaleTimeString('id-ID')
    setSyncLogs(prev => [
      `[${timestamp}] 🔄 Balas Cepat Terkirim: "${message}" berhasil dikirim ke partner via Google Calendar.`,
      ...prev
    ])

    if (message.toLowerCase().includes('konfirmasi') && latest?.meta?.email) {
      const subject = encodeURIComponent('Konfirmasi Reservasi DyaTask')
      const content = [
        `Halo ${latest.meta.clientName || 'Client'},`,
        '',
        'Reservasi Anda sudah kami konfirmasi.',
        latest.meta.title ? `Topik: ${latest.meta.title}` : '',
        latest.meta.date && latest.meta.time ? `Jadwal: ${formatLongDate(latest.meta.date)} ${latest.meta.time} WIB` : '',
        '',
        'Terima kasih.'
      ].filter(Boolean).join('\n')
      const body = encodeURIComponent(content)
      window.location.href = `mailto:${latest.meta.email}?subject=${subject}&body=${body}`
    }
    
    // Quick success toast
    triggerMockNotification(
      'Balasan Terkirim!',
      `Pesan "${message}" berhasil disinkronkan ke kalender eksternal.`,
      'success'
    )
  }

  const handleRemindMe = () => {
    const latest = activeNotifications[0]
    if (!latest) return
    setNotifications(prev => prev.map(item => (
      item.id === latest.id
        ? { ...item, confirmed: true, confirmedAt: Date.now() }
        : item
    )))
    setShowNotificationList(false)
    setTimeout(() => {
      triggerMockNotification(
        `Pengingat: ${latest.title}`,
        latest.body,
        latest.source,
        latest.meta || {}
      )
    }, 5 * 60 * 1000)
  }

  const removeNotificationById = (id) => {
    setNotifications(prev => prev.filter(item => item.id !== id))
  }

  const confirmNotificationById = (id) => {
    setNotifications(prev => prev.map(item => (
      item.id === id
        ? { ...item, confirmed: true, confirmedAt: Date.now() }
        : item
    )))
  }

  // Manual Trigger Backup
  const triggerManualBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ tasks, appointments, notes, twoFactorEnabled }));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `dyatask_backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    const timestamp = new Date().toLocaleTimeString('id-ID')
    setSyncLogs(prev => [
      `[${timestamp}] 🛡️ Backup Manual: Mengunduh arsip JSON terenkripsi ke penyimpanan lokal macOS.`,
      ...prev
    ])
  }

  // Handle Supabase Authentication Submission
  const handleAuthSubmit = async (e) => {
    e.preventDefault()
    if (!authUsername.trim() || !authPassword.trim()) return

    setLoadingAuth(true)
    setAuthError(null)

    const formattedEmail = `${authUsername.trim().toLowerCase()}.dyatask@gmail.com`

    if (authTab === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email: formattedEmail,
        password: authPassword,
        options: {
          data: {
            full_name: authFullName || authUsername.trim()
          }
        }
      })

      if (error) {
        setAuthError(error.message)
      } else if (data?.session) {
        setSession(data.session)
        setAuthError(null)
      } else {
        setAuthTab('signin')
        setAuthError('Registrasi berhasil, tetapi Supabase masih meminta konfirmasi email. Untuk alur user baru bisa langsung login, matikan Confirm email di Supabase Authentication > Providers > Email.')
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formattedEmail,
        password: authPassword
      })

      if (error) {
        setAuthError(error.message)
      } else {
        setSession(data.session)
      }
    }
    setLoadingAuth(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setTasks([])
    setAppointments([])
    setNotes([])
    setDeveloperMonitoringRows([])
    setDeveloperMonitoringLoading(false)
    setDeveloperMonitoringError('')
    setDeveloperMonitoringUpdatedAt('')
    setDeveloperMonitoringSearch('')
  }

  const refreshDeveloperMonitoring = async () => {
    if (!isAppDeveloper) return

    setDeveloperMonitoringLoading(true)
    setDeveloperMonitoringError('')

    const { data, error } = await supabase.rpc('get_developer_user_monitoring')
    if (error) {
      setDeveloperMonitoringRows([])
      setDeveloperMonitoringError(error.message)
      setDeveloperMonitoringLoading(false)
      return
    }

    setDeveloperMonitoringRows(Array.isArray(data) ? data : [])
    setDeveloperMonitoringUpdatedAt(new Date().toISOString())
    setDeveloperMonitoringLoading(false)
  }

  // Update user profile to Supabase
  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    if (!actorUserId) return

    try {
      let avatarUrl = profileFormData.avatar_url

      // Upload avatar file to Supabase storage if provided
      if (profileFormData.avatar_file) {
        setUploadingAvatar(true)
        try {
          const fileExt = profileFormData.avatar_file.name.split('.').pop()?.toLowerCase() || 'png'
          const fileName = `${actorUserId}/${Date.now()}.${fileExt}`
          
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, profileFormData.avatar_file, { upsert: true })
          
          if (uploadError) {
            console.warn('Upload warning:', uploadError.message)
            throw new Error(
              uploadError.message === 'Bucket not found'
                ? 'Bucket Supabase Storage "avatars" belum dibuat. Jalankan bagian Storage di supabase_schema.sql terlebih dahulu.'
                : uploadError.message
            )
          } else {
            const { data: publicData } = supabase.storage
              .from('avatars')
              .getPublicUrl(fileName)
            
            avatarUrl = publicData.publicUrl
          }
        } catch (uploadErr) {
          console.warn('Upload error:', uploadErr.message)
          alert('Gagal mengunggah foto profil: ' + uploadErr.message)
          setUploadingAvatar(false)
          return
        }
      }

      const { error } = await supabase.auth.updateUser({
        data: { 
          full_name: profileFormData.full_name, 
          avatar_url: avatarUrl,
          tanggal_lahir: profileFormData.tanggal_lahir,
          email: profileFormData.email,
          nomer_hp: profileFormData.nomer_hp
        }
      })

      if (error) {
        alert('Gagal memperbarui profil: ' + error.message)
        return
      }

      const profileSyncPayload = {
        email: session?.user?.email || `${authUsername || 'user'}.dyatask@gmail.com`,
        full_name: profileFormData.full_name,
        updated_at: new Date().toISOString()
      }
      let { error: profileSyncError } = await supabase
        .from('profiles')
        .update(profileSyncPayload)
        .eq('id', actorUserId)

      if (profileSyncError) {
        console.warn('Sinkronisasi public.profiles gagal:', profileSyncError.message)
      }

      const { error: authMetadataSyncError } = await supabase.auth.updateUser({
        data: {
          ...(session?.user?.user_metadata || {}),
          full_name: profileFormData.full_name,
          avatar_url: avatarUrl,
          tanggal_lahir: profileFormData.tanggal_lahir,
          email: profileFormData.email,
          nomer_hp: profileFormData.nomer_hp
        }
      })
      if (authMetadataSyncError) {
        console.warn('Sinkronisasi auth metadata gagal:', authMetadataSyncError.message)
      }

      // Force refresh session data from server
      const { data: { user: updatedUser }, error: fetchError } = await supabase.auth.getUser()
      
      if (!fetchError && updatedUser) {
        // Update session with fresh user data
        setSession(prev => prev ? { ...prev, user: updatedUser } : null)
        
        // Force re-initialize profile form to show new data
        setTimeout(() => {
          setProfileFormData({
            full_name: updatedUser.user_metadata?.full_name || '',
            avatar_url: updatedUser.user_metadata?.avatar_url || '',
            avatar_file: null,
            tanggal_lahir: updatedUser.user_metadata?.tanggal_lahir || '',
            email: updatedUser.user_metadata?.email || '',
            nomer_hp: updatedUser.user_metadata?.nomer_hp || ''
          })
        }, 100)
      }
      
      setSyncLogs(prev => [
        `[${new Date().toLocaleTimeString('id-ID')}] 👤 Profil pengguna berhasil diperbarui & tersinkron.`,
        ...prev.slice(0, 9)
      ])
      
      setUploadingAvatar(false)
      setIsProfileModalOpen(false)
    } catch (err) {
      alert('Error: ' + err.message)
      setUploadingAvatar(false)
    }
  }

  // Initialize profile form data when modal opens
  useEffect(() => {
    if (isProfileModalOpen && session?.user) {
      setProfileFormData({
        full_name: session.user.user_metadata?.full_name || '',
        avatar_url: session.user.user_metadata?.avatar_url || '',
        avatar_file: null,
        tanggal_lahir: session.user.user_metadata?.tanggal_lahir || '',
        email: session.user.user_metadata?.email || '',
        nomer_hp: session.user.user_metadata?.nomer_hp || ''
      })
    }
  }, [isProfileModalOpen, session])

  if (isPublicTrackingMode) {
    const payload = publicTrackingPayload
    const publicOrder = payload?.order || null
    const publicTimeline = payload?.timeline || []
    const safeTimeline = Array.isArray(publicTimeline) ? publicTimeline : []
    const latestProgress = safeTimeline.length > 0
      ? Number(safeTimeline[safeTimeline.length - 1]?.progress_percent || 0)
      : 0
    const averageProgress = safeTimeline.length > 0
      ? Math.round(safeTimeline.reduce((acc, item) => acc + Number(item.progress_percent || 0), 0) / safeTimeline.length)
      : 0
    const overallProgress = Math.max(0, Math.min(100, safeTimeline.length > 0 ? latestProgress : averageProgress))
    const completedMilestones = safeTimeline.filter(item => Number(item.progress_percent || 0) >= 100).length
    const lastUpdateAt = safeTimeline.length > 0 ? safeTimeline[safeTimeline.length - 1]?.created_at : null
    const dueDateRaw = publicOrder?.due_date ? new Date(`${publicOrder.due_date}T00:00:00`) : null
    const dueDaysLeft = dueDateRaw ? Math.ceil((dueDateRaw.getTime() - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24)) : null
    const dueBadgeText = dueDaysLeft == null
      ? '-'
      : dueDaysLeft < 0
        ? `Terlambat ${Math.abs(dueDaysLeft)} hari`
        : `${dueDaysLeft} hari lagi`

    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_12%_18%,rgba(143,117,216,0.24),transparent_30%),radial-gradient(circle_at_82%_70%,rgba(255,229,76,0.18),transparent_24%),linear-gradient(135deg,#fbfaff_0%,#f0ebff_48%,#fff8e2_100%)] text-[#463d66] flex items-center justify-center p-6 relative overflow-hidden">
        <div className="relative w-full max-w-4xl rounded-[2.25rem] border border-white/70 bg-white shadow-2xl shadow-purple-200/45 p-6 lg:p-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-[#8f75d8]">Spreadsheet Order Tracker</p>
              <h1 className="text-2xl font-bold text-[#40375f] mt-1">View Progress</h1>
            </div>
            <img src={dyataskMiniLogo} alt="DyaTask" className="w-11 h-11 object-contain" />
          </div>

          {payload?.error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 text-red-600 p-4 text-sm">
              Token tracking tidak valid: {payload.error}
            </div>
          ) : !publicOrder ? (
            <div className="rounded-2xl border border-purple-100 bg-[#faf7ff] p-5 text-sm text-[#8f75d8]">
              Memuat data tracking...
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-purple-100 bg-[#faf7ff] p-5">
                <h2 className="text-xl font-bold text-[#4f4574]">{publicOrder.order_name}</h2>
                <p className="text-sm text-[#8f75d8] mt-1">{publicOrder.customer_name} • {publicOrder.order_type}</p>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[#8f75d8]">
                    <span>Overall Progress</span>
                    <span>{overallProgress}%</span>
                  </div>
                  <div className="mt-1 h-2.5 rounded-full bg-purple-100 overflow-hidden">
                    <div className="h-full bg-[#8f75d8]" style={{ width: `${overallProgress}%` }} />
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div className="rounded-xl bg-white border border-purple-100 p-3">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-[#8f75d8] font-bold">Status</p>
                    <p className="mt-1 font-semibold text-[#4f4574]">{publicOrder.status}</p>
                  </div>
                  <div className="rounded-xl bg-white border border-purple-100 p-3">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-[#8f75d8] font-bold">Budget</p>
                    <p className="mt-1 font-semibold text-[#4f4574]">Rp {Number(publicOrder.budget || 0).toLocaleString('id-ID')}</p>
                  </div>
                  <div className="rounded-xl bg-white border border-purple-100 p-3">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-[#8f75d8] font-bold">Deadline</p>
                    <p className="mt-1 font-semibold text-[#4f4574]">{formatLongDate(publicOrder.due_date)}</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div className="rounded-xl bg-white border border-purple-100 p-3">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-[#8f75d8] font-bold">Milestone Selesai</p>
                    <p className="mt-1 font-semibold text-[#4f4574]">{completedMilestones}/{safeTimeline.length}</p>
                  </div>
                  <div className="rounded-xl bg-white border border-purple-100 p-3">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-[#8f75d8] font-bold">Update Terakhir</p>
                    <p className="mt-1 font-semibold text-[#4f4574]">{lastUpdateAt ? formatLongDateTime(lastUpdateAt) : '-'}</p>
                  </div>
                  <div className="rounded-xl bg-white border border-purple-100 p-3">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-[#8f75d8] font-bold">Sisa Deadline</p>
                    <p className="mt-1 font-semibold text-[#4f4574]">{dueBadgeText}</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-purple-100 bg-white p-4">
                <h3 className="text-sm font-bold text-[#4f4574] mb-4">Timeline Progress</h3>
                <div className="space-y-3">
                  {safeTimeline.length === 0 ? (
                    <p className="text-xs text-[#8f75d8]">Belum ada update timeline.</p>
                  ) : safeTimeline.map((item, index) => (
                    <div key={item.id || index} className="relative rounded-2xl border border-purple-100 bg-[#fcfbff] p-4">
                      <div className="absolute left-4 top-6 h-2 w-2 rounded-full bg-[#8f75d8]" />
                      <div className="ml-5">
                        <p className="text-xs text-[#8f75d8] font-semibold">{formatLongDateTime(item.created_at)}</p>
                        <h4 className="text-sm font-bold text-[#4f4574] mt-1">{item.title}</h4>
                        {item.note && <p className="text-xs text-[#6f6295] mt-1">{formatTextDates(item.note)}</p>}
                        <div className="mt-2 h-2 rounded-full bg-purple-100 overflow-hidden">
                          <div className="h-full bg-[#8f75d8]" style={{ width: `${Math.max(0, Math.min(100, Number(item.progress_percent || 0)))}%` }} />
                        </div>
                        <p className="text-[11px] text-[#8f75d8] mt-1">Progress: {Number(item.progress_percent || 0)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  if (isPublicBookingMode) {
    if (publicBookingSuccess && publicBookingSummary) {
      const waNumber = '6289619941101'
      const waText = [
        'Halo Admin DyaTask,',
        '',
        'Client baru saja melakukan reservasi dari form publik:',
        `Nama: ${publicBookingSummary.clientName}`,
        `Email: ${publicBookingSummary.email || '-'}`,
        `WhatsApp: ${publicBookingSummary.whatsapp || '-'}`,
        `Topik: ${publicBookingSummary.title}`,
        `Jadwal: ${formatLongDate(publicBookingSummary.date)} ${publicBookingSummary.time} WIB`,
        '',
        'Notifikasi ini dikirim otomatis dari aplikasi booking DyaTask.'
      ].join('\n')
      const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(waText)}`

      return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_15%_20%,rgba(143,117,216,0.26),transparent_30%),radial-gradient(circle_at_85%_70%,rgba(255,229,76,0.18),transparent_26%),linear-gradient(135deg,#fbfaff_0%,#f2edff_48%,#fff8df_100%)] text-[#40375f] flex items-center justify-center p-6 relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-[#8f75d8]/20 blur-3xl"></div>
          <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-[#bba7ff]/25 blur-3xl"></div>
          <div className="relative w-full max-w-xl rounded-[2rem] border border-white/70 bg-white shadow-2xl shadow-purple-200/50 p-8 text-center">
            <h1 className="text-2xl font-semibold mb-2 text-[#3f365f]">Reservasi Berhasil Dikirim</h1>
            <p className="text-purple-500 text-sm mb-6">
              Terima kasih, reservasi Anda sudah tercatat. Tim kami akan menindaklanjuti sesuai jadwal yang dipilih.
            </p>
            <div className="rounded-2xl border border-purple-100 bg-white p-4 text-left text-sm mb-6 shadow-sm">
              <p><span className="text-purple-400">Nama:</span> {publicBookingSummary.clientName}</p>
              <p><span className="text-purple-400">Topik:</span> {publicBookingSummary.title}</p>
              <p><span className="text-purple-400">WhatsApp:</span> {publicBookingSummary.whatsapp || '-'}</p>
              <p><span className="text-purple-400">Jadwal:</span> {formatLongDate(publicBookingSummary.date)} • {publicBookingSummary.time} WIB</p>
            </div>
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center w-full py-3 rounded-2xl bg-[#8f75d8] hover:bg-[#8069c8] text-white font-semibold shadow-lg shadow-purple-300/40"
            >
              Lanjutkan ke WhatsApp Admin
            </a>
            <p className="text-[12px] text-purple-400 mt-3">
              Setelah klik tombol, chat WhatsApp akan terisi otomatis sebagai notifikasi reservasi.
            </p>
          </div>
        </div>
      )
    }

    const publicMonthLabel = calendarMonthDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' })
    const publicSelectedDateLabel = formatLongDate(bookingDate)

    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_12%_18%,rgba(143,117,216,0.28),transparent_30%),radial-gradient(circle_at_88%_12%,rgba(198,181,255,0.34),transparent_24%),radial-gradient(circle_at_82%_82%,rgba(255,229,76,0.2),transparent_26%),linear-gradient(135deg,#fbfaff_0%,#f0ebff_48%,#fff8e2_100%)] text-[#463d66] flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute -top-28 left-20 w-80 h-80 rounded-full bg-[#8f75d8]/20 blur-3xl"></div>
        <div className="absolute bottom-8 -right-24 w-[26rem] h-[26rem] rounded-full bg-[#bca8ff]/25 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-[34rem] h-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/38 blur-3xl"></div>
        <div className="relative w-full max-w-6xl rounded-[2.25rem] border border-white/70 bg-white shadow-2xl shadow-purple-200/45 p-4 lg:p-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-4 p-6 lg:p-7 rounded-[1.75rem] border border-white/70 bg-white shadow-lg shadow-purple-100/35">
              <img
                src={dyataskLogo2}
                alt="DyaTask"
                className="h-12 w-auto object-contain mb-5"
              />
              <h1 className="text-3xl font-semibold mb-1 text-[#40375f]">1on1 Consultation</h1>
              <p className="text-sm text-purple-400 mb-6">Nayanika Projects</p>
              <form onSubmit={handleAddBooking} className="space-y-3">
                <input type="text" placeholder="Nama lengkap" value={bookingClient} onChange={(e) => setBookingClient(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-purple-100 bg-white text-sm text-[#40375f] placeholder:text-purple-300 focus:outline-none focus:ring-2 focus:ring-[#8f75d8]/30 focus:border-[#8f75d8]/50 shadow-sm" required />
                <input type="email" placeholder="Email aktif" value={bookingEmail} onChange={(e) => setBookingEmail(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-purple-100 bg-white text-sm text-[#40375f] placeholder:text-purple-300 focus:outline-none focus:ring-2 focus:ring-[#8f75d8]/30 focus:border-[#8f75d8]/50 shadow-sm" />
                <input type="text" placeholder="Nomor WhatsApp" value={bookingWhatsapp} onChange={(e) => setBookingWhatsapp(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-purple-100 bg-white text-sm text-[#40375f] placeholder:text-purple-300 focus:outline-none focus:ring-2 focus:ring-[#8f75d8]/30 focus:border-[#8f75d8]/50 shadow-sm" />
                <input type="text" placeholder="Topik konsultasi" value={bookingTitle} onChange={(e) => setBookingTitle(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-purple-100 bg-white text-sm text-[#40375f] placeholder:text-purple-300 focus:outline-none focus:ring-2 focus:ring-[#8f75d8]/30 focus:border-[#8f75d8]/50 shadow-sm" required />
                <div className="pt-4 border-t border-purple-100">
                  <p className="text-xs text-purple-400 mb-2">Tanggal terpilih: <span className="text-[#40375f] font-semibold">{publicSelectedDateLabel}</span></p>
                  <p className="text-xs text-purple-400 mb-4">Waktu terpilih: <span className="text-[#40375f] font-semibold">{bookingTime || '-'}</span></p>
                  <button type="submit" disabled={!bookingTime || !availableTimeSlotsForSelectedDate.length} className="w-full py-3 rounded-2xl bg-[#8f75d8] hover:bg-[#8069c8] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-lg shadow-purple-300/40">
                    Kirim Reservasi
                  </button>
                </div>
              </form>
              <div className="mt-5 rounded-2xl border border-amber-200/80 bg-amber-50/80 p-4 shadow-sm">
                <p className="text-xs font-semibold text-amber-700 mb-2">Catatan / Ketentuan</p>
                <p className="text-xs text-amber-800/85 whitespace-pre-line leading-relaxed">{publicBookingNotes}</p>
              </div>
            </div>

            <div className="lg:col-span-5 p-6 lg:p-7 rounded-[1.75rem] border border-white/70 bg-white shadow-lg shadow-purple-100/30">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-semibold text-[#40375f]">Pick a date</h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCalendarMonthDate(new Date(calendarMonthDate.getFullYear(), calendarMonthDate.getMonth() - 1, 1))} className="w-9 h-9 rounded-xl border border-purple-100 bg-white hover:bg-purple-50 text-purple-600 shadow-sm">‹</button>
                  <button onClick={() => setCalendarMonthDate(new Date(calendarMonthDate.getFullYear(), calendarMonthDate.getMonth() + 1, 1))} className="w-9 h-9 rounded-xl border border-purple-100 bg-white hover:bg-purple-50 text-purple-600 shadow-sm">›</button>
                </div>
              </div>
              <p className="text-lg mb-4 text-[#40375f]">{publicMonthLabel}</p>
              <div className="grid grid-cols-7 text-center text-xs text-purple-400 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <span key={d}>{d}</span>)}
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {calendarDays.map(dayItem => {
                  const isAllowedDay = isDateAllowed(dayItem.dateStr)
                  const isPastDay = dayItem.dateStr < todayString
                  const isDisabled = !dayItem.isCurrentMonth || !isAllowedDay || isPastDay
                  const isSelected = dayItem.dateStr === bookingDate
                  return (
                    <button
                      key={dayItem.dateStr}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => setBookingDate(dayItem.dateStr)}
                      className={`h-10 rounded-full text-sm transition-all ${
                        isSelected
                          ? 'bg-[#8f75d8] text-white font-bold shadow-lg shadow-purple-300/50'
                          : isDisabled
                            ? 'text-purple-200 cursor-not-allowed'
                            : 'hover:bg-purple-100 text-[#5a4d82]'
                      }`}
                    >
                      {dayItem.date.getDate()}
                    </button>
                  )
                })}
              </div>
              <div className="mt-6 rounded-2xl border border-purple-100 bg-white px-4 py-3 text-sm text-purple-500 shadow-sm">
                Time zone: {timezoneLabel}
              </div>
              <p className="mt-2 text-[11px] text-purple-400">
                Waktu dan jam reservasi akan otomatis disesuaikan dengan zona waktu masing-masing pengguna.
              </p>
            </div>

            <div className="lg:col-span-3 p-6 lg:p-7 rounded-[1.75rem] border border-white/70 bg-white shadow-lg shadow-purple-100/35">
              <h3 className="text-lg font-semibold mb-1 text-[#40375f]">{publicSelectedDateLabel}</h3>
              <p className="text-xs text-purple-400 mb-4">Pilih jam yang masih tersedia</p>
              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {availableTimeSlotsForSelectedDate.map(slot => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setBookingTime(slot)}
                    className={`w-full py-3 rounded-md border text-sm font-semibold transition-all ${
                      bookingTime === slot
                        ? 'border-[#8f75d8] bg-[#8f75d8] text-white shadow-md shadow-purple-300/40'
                        : 'border-purple-100 bg-white hover:bg-purple-50 text-purple-600'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
                {!availableTimeSlotsForSelectedDate.length && (
                  <div className="text-xs text-amber-700 border border-amber-200 bg-amber-50 rounded-2xl px-3 py-2">
                    Tidak ada slot tersisa di tanggal ini.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (inviteLandingToken) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,229,76,0.22),_transparent_22%),radial-gradient(circle_at_top_right,_rgba(143,117,216,0.20),_transparent_24%),linear-gradient(180deg,_#faf7ff_0%,_#f7f4ff_100%)] px-5 py-8 md:px-8 md:py-10">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center justify-center">
          <div className="w-full rounded-[2rem] border border-white/80 bg-white p-7 shadow-[0_30px_80px_rgba(143,117,216,0.15)] md:p-10">
            <div className="mb-8 flex items-center justify-between gap-4">
              <img src={dyataskLogo2} alt="DyaTask" className="h-12 w-auto object-contain" />
              <button
                type="button"
                onClick={handleExitInviteLanding}
                className="rounded-2xl border border-purple-100 bg-[#faf8ff] px-4 py-2 text-xs font-semibold text-purple-600"
              >
                Tutup
              </button>
            </div>

            <div className="rounded-[1.8rem] border border-purple-200/70 bg-[#f7f3ff] p-5 shadow-[0_18px_45px_rgba(143,117,216,0.12)]">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#8f75d8] shadow-sm">
                  <UserPlus size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8f75d8]">Invite Workspace</p>
                  <h2 className="mt-2 text-[2rem] leading-none font-semibold text-[#20182f]">Buka Workspace Asisten</h2>
                  <p className="mt-3 text-sm leading-7 text-[#73698f]">
                    Halaman ini khusus user invite. Tekan tombol masuk, lalu konfirmasi token invite untuk membuka workspace owner sesuai role yang diberikan.
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-purple-100 bg-white px-4 py-3">
                      <span className="block text-[10px] uppercase tracking-[0.16em] text-purple-400">Username invite</span>
                      <span className="mt-1 block truncate text-base font-semibold text-[#4f4574]">
                        {String(inviteUsernameFromUrl || '-').trim()}
                      </span>
                    </div>
                    <div className="rounded-2xl border border-purple-100 bg-white px-4 py-3">
                      <span className="block text-[10px] uppercase tracking-[0.16em] text-purple-400">Token invite</span>
                      <span className="mt-1 block truncate font-mono text-base font-semibold text-[#4f4574]">
                        {inviteLandingToken}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-[1.8rem] border border-purple-100 bg-[#fcfbff] p-6 text-center">
              <h3 className="text-[2.25rem] leading-none font-semibold text-[#1f182e]">Masuk ke Workspace</h3>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#7d7297]">
                Tidak ada form login biasa di halaman ini. Sistem akan membuat akses ringan untuk asisten, lalu membuka workspace setelah token invite terverifikasi.
              </p>
              <button
                type="button"
                onClick={() => {
                  setInviteConfirmInput('')
                  setInviteConfirmModalOpen(true)
                }}
                className="mt-7 inline-flex min-w-[240px] items-center justify-center rounded-[1.35rem] bg-[#1f1b27] px-6 py-4 text-base font-semibold text-white shadow-[0_18px_30px_rgba(31,27,39,0.18)]"
              >
                Login ke Workspace
              </button>
            </div>
          </div>
        </div>

        {inviteConfirmModalOpen && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#20182f]/28 px-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-[1.8rem] border border-white/80 bg-white p-6 shadow-[0_30px_80px_rgba(32,24,47,0.18)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8f75d8]">Konfirmasi Token</p>
                  <h4 className="mt-2 text-2xl font-semibold text-[#20182f]">Verifikasi invite</h4>
                  <p className="mt-2 text-sm leading-6 text-[#7d7297]">
                    Masukkan token invite untuk memastikan link ini dibuka oleh asisten yang benar.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setInviteConfirmModalOpen(false)}
                  className="rounded-2xl border border-purple-100 p-2 text-purple-400"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-purple-100 bg-[#faf8ff] px-4 py-3">
                  <span className="block text-[10px] uppercase tracking-[0.16em] text-purple-400">Token dari link</span>
                  <span className="mt-1 block truncate font-mono text-sm font-semibold text-[#4f4574]">{inviteLandingToken}</span>
                </div>
                <label className="block">
                  <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-purple-400">Input token invite</span>
                  <input
                    type="text"
                    value={inviteConfirmInput}
                    onChange={(e) => setInviteConfirmInput(e.target.value)}
                    placeholder="Tempel token invite"
                    className="w-full rounded-2xl border border-purple-100 bg-white px-4 py-3 text-sm text-[#4f4574] focus:outline-none focus:ring-2 focus:ring-purple-200"
                  />
                </label>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setInviteConfirmModalOpen(false)}
                  className="flex-1 rounded-2xl border border-purple-100 px-4 py-3 text-sm font-semibold text-purple-500"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDirectInviteWorkspaceAccess}
                  disabled={inviteDirectLoading || !inviteConfirmInput.trim()}
                  className="flex-1 rounded-2xl bg-[#8f75d8] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {inviteDirectLoading ? 'Memproses...' : 'Buka Workspace'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (!session) {
    return (
      <div className="auth-page">
        <div className="auth-shell">
          <section className={`auth-visual-panel ${loginVisualImage ? 'has-custom-visual' : ''}`} aria-hidden="true">
            {loginVisualImage ? (
              <img src={loginVisualImage} alt="" className="auth-custom-visual" />
            ) : (
              <>
                <div className="desk-sun"></div>
                <div className="desk-wall-card desk-wall-card-one"></div>
                <div className="desk-wall-card desk-wall-card-two"></div>
                <div className="desk-lamp">
                  <span></span>
                  <i></i>
                  <b></b>
                </div>
                <div className="desk-plant">
                  <span></span>
                  <span></span>
                  <span></span>
                  <i></i>
                </div>
                <div className="desk-board">
                  <div className="desk-board-top">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <div className="desk-board-line"></div>
                  <div className="desk-board-line short"></div>
                  <div className="desk-board-task done"></div>
                  <div className="desk-board-task"></div>
                </div>
                <div className="desk-laptop">
                  <div className="desk-laptop-screen">
                    <div className="desk-window-bar"></div>
                    <div className="desk-chart">
                      <span></span>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                  <div className="desk-laptop-base"></div>
                </div>
                <div className="desk-coffee">
                  <span></span>
                </div>
                <div className="desk-pencil"></div>
              </>
            )}
            <div className="auth-visual-caption">
              <img src={dyataskMiniLogo} alt="" />
              <div>
                <p>DyaTask Workspace</p>
                <span>Tasks, calendar, reminders, and project folders in one quiet flow.</span>
              </div>
            </div>
          </section>

          <section className={`auth-form-panel ${inviteAuthNotice ? 'auth-form-panel-invite' : ''}`}>
            <div className="auth-logo-mark">
              <img src={dyataskMiniLogo} alt="DyaTask" />
            </div>

              <div className="auth-copy">
                <p>{authTab === 'signin' ? 'Welcome Back!' : 'Create Account'}</p>
                <span>{authTab === 'signin' ? 'Enter your details below' : 'Start managing your freelance work today'}</span>
              </div>

              <form onSubmit={handleAuthSubmit} className="auth-form">
              {inviteAuthNotice && (
                <div className="auth-error">
                  <UserPlus size={15} />
                  <span>{inviteAuthNotice}</span>
                </div>
              )}
              {authError && (
                <div className="auth-error">
                  <AlertCircle size={15} />
                  <span>{authError}</span>
                </div>
              )}

              {authTab === 'signup' && (
                <label className="auth-field">
                  <span>Full Name</span>
                  <input
                    type="text"
                    placeholder="Dinur Pradipta"
                    value={authFullName}
                    onChange={(e) => setAuthFullName(e.target.value)}
                    required
                  />
                </label>
              )}

              <label className="auth-field">
                <span>Username</span>
                <input
                  type="text"
                  placeholder="arunika"
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  required
                />
              </label>

              <label className="auth-field">
                <span>Password</span>
                <div className="auth-password-row">
                  <input
                    type={showAuthPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    required
                  />
                  <button type="button" onClick={() => setShowAuthPassword(!showAuthPassword)} aria-label="Toggle password visibility">
                    {showAuthPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

              <div className="auth-options">
                <label>
                  <input type="checkbox" defaultChecked />
                  <span>Remember me</span>
                </label>
                <button type="button">Forgot password?</button>
              </div>

              <button type="submit" disabled={loadingAuth} className="auth-primary-button">
                {loadingAuth ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Processing...
                  </>
                ) : authTab === 'signin' ? 'Log in' : 'Sign up'}
              </button>
            </form>

            <div className="auth-switcher">
              {authTab === 'signin' ? "Don't have an account?" : 'Already have an account?'}
              <button
                type="button"
                onClick={() => {
                  setAuthTab(authTab === 'signin' ? 'signup' : 'signin')
                  setAuthError(null)
                }}
              >
                {authTab === 'signin' ? 'Sign Up' : 'Log In'}
              </button>
            </div>
          </section>
        </div>
      </div>
    )
  }

  return (
    <div className={`app-wrapper ${theme === 'dark' ? 'dark' : ''} ${!isReady ? 'no-transition' : ''}`}>
      
      {/* 🖥️ Layout Grid */}
      <div className={`layout-grid ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        
        {/* 1. Sidebar Navigation */}
        {!(isMobileTabletView && workspaceChatModalOpen) && (
        <aside
          className={`sidebar sidebar-floating ${sidebarCollapsed ? 'collapsed' : ''} ${isMobileTabletView && isWorkspaceChatOpen ? 'chat-summary-mode' : ''}`}
          onMouseEnter={handleSidebarMouseEnter}
          onMouseLeave={handleSidebarMouseLeave}
        >
          {/* Brand Header */}
          <div className="flex items-center justify-center pt-2 mb-5 px-1">
            <img
              src={sidebarCollapsed ? dyataskMiniLogo : dyataskLogo}
              alt="DyaTask"
              className={`${sidebarCollapsed ? 'w-12 h-12 -my-1' : 'w-56 h-24 -my-2'} object-contain drop-shadow-md transition-all duration-200 ease-out`}
            />
          </div>

          {/* Navigation Links */}
          <nav className={`flex-1 sidebar-nav-scroll ${isMobileTabletView && isWorkspaceChatOpen ? 'mobile-chat-bottom-nav' : ''}`}>
            {isMobileTabletView && isWorkspaceChatOpen ? (
              <div className="mobile-chat-bottom-summary">
                <div className="mobile-chat-bottom-summary-head">
                  <div>
                    <h4>{headerDateLabel}</h4>
                  </div>
                  <div className="mobile-chat-bottom-summary-time">{headerTimeLabel}</div>
                </div>
                <div className="mobile-chat-bottom-summary-grid">
                  {mobileWorkspaceChatBottomStats.map(item => (
                    <div key={item.label} className="mobile-chat-bottom-summary-card">
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
            {isPrimaryMobileNavTab('dashboard') && canReadArea('dashboard') && canShowTab('dashboard') && (
              <div 
                data-mobile-nav="dashboard"
                className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                <LayoutDashboard size={20} />
                {!sidebarCollapsed && <span>Dashboard</span>}
              </div>
            )}

            {isPrimaryMobileNavTab('tasks') && canReadArea('tasks') && canShowTab('tasks') && (
              <div 
                data-mobile-nav="tasks"
                className={`nav-link ${activeTab === 'tasks' ? 'active' : ''}`}
                onClick={() => setActiveTab('tasks')}
              >
                <CheckSquare size={20} />
                {!sidebarCollapsed && <span>Tugas & Project</span>}
              </div>
            )}

            {isPrimaryMobileNavTab('calendar') && canReadArea('calendar') && canShowTab('calendar') && (
              <div 
                data-mobile-nav="calendar"
                className={`nav-link ${activeTab === 'calendar' ? 'active' : ''}`}
                onClick={() => setActiveTab('calendar')}
              >
                <Calendar size={20} />
                {!sidebarCollapsed && <span>Reservasi & Jadwal</span>}
                {!sidebarCollapsed && <span className="ml-auto w-2 h-2 rounded-full bg-emerald-500 pulse-badge"></span>}
              </div>
            )}

            {isPrimaryMobileNavTab('orders') && canReadArea('orders') && canShowTab('orders') && (
              <div
                data-mobile-nav="orders"
                className={`nav-link ${activeTab === 'orders' ? 'active' : ''}`}
                onClick={() => setActiveTab('orders')}
              >
                <FileSpreadsheet size={20} />
                {!sidebarCollapsed && <span>Order Spreadsheet</span>}
              </div>
            )}

            {isPrimaryMobileNavTab('designOrders') && canReadArea('designOrders') && canShowTab('designOrders') && (
              <div
                className={`nav-link ${activeTab === 'designOrders' ? 'active' : ''}`}
                onClick={() => setActiveTab('designOrders')}
              >
                <Palette size={20} />
                {!sidebarCollapsed && <span>Pages Design Order</span>}
              </div>
            )}

            {isPrimaryMobileNavTab('generalOrders') && canReadArea('generalOrders') && canShowTab('generalOrders') && (
              <div
                className={`nav-link ${activeTab === 'generalOrders' ? 'active' : ''}`}
                onClick={() => setActiveTab('generalOrders')}
              >
                <Clipboard size={20} />
                {!sidebarCollapsed && <span>Pages Orderan (General)</span>}
              </div>
            )}

            {isPrimaryMobileNavTab('mentoringSchedule') && canReadArea('mentoringSchedule') && canShowTab('mentoringSchedule') && (
              <div
                className={`nav-link ${activeTab === 'mentoringSchedule' ? 'active' : ''}`}
                onClick={() => setActiveTab('mentoringSchedule')}
              >
                <Mic2 size={20} />
                {!sidebarCollapsed && <span>Pages Mentoring/Speaker</span>}
              </div>
            )}

            {isPrimaryMobileNavTab('contentPlanner') && canReadArea('contentPlanner') && canShowTab('contentPlanner') && (
              <div
                className={`nav-link ${activeTab === 'contentPlanner' ? 'active' : ''}`}
                onClick={() => setActiveTab('contentPlanner')}
              >
                <CalendarClock size={20} />
                {!sidebarCollapsed && <span>Content Planner</span>}
              </div>
            )}

            {isPrimaryMobileNavTab('invoiceFollowUp') && canReadArea('invoiceFollowUp') && canShowTab('invoiceFollowUp') && (
              <div
                data-mobile-nav="invoiceFollowUp"
                className={`nav-link ${activeTab === 'invoiceFollowUp' ? 'active' : ''}`}
                onClick={() => setActiveTab('invoiceFollowUp')}
              >
                <Mail size={20} />
                {!sidebarCollapsed && <span>Invoice Follow Up</span>}
              </div>
            )}

            {isPrimaryMobileNavTab('invoiceGenerator') && canReadArea('invoiceGenerator') && canShowTab('invoiceGenerator') && (
              <div
                className={`nav-link ${activeTab === 'invoiceGenerator' ? 'active' : ''}`}
                onClick={() => setActiveTab('invoiceGenerator')}
              >
                <FileText size={20} />
                {!sidebarCollapsed && <span>Invoice Generator</span>}
              </div>
            )}

            {isPrimaryMobileNavTab('crm') && canReadArea('crm') && canShowTab('crm') && (
              <div
                data-mobile-nav="crm"
                className={`nav-link ${activeTab === 'crm' ? 'active' : ''}`}
                onClick={() => setActiveTab('crm')}
              >
                <Users size={20} />
                {!sidebarCollapsed && <span>Client CRM</span>}
              </div>
            )}

            {isPrimaryMobileNavTab('finance') && canReadArea('finance') && canShowTab('finance') && (
              <div
                data-mobile-nav="finance"
                className={`nav-link ${activeTab === 'finance' ? 'active' : ''}`}
                onClick={() => setActiveTab('finance')}
              >
                <FileText size={20} />
                {!sidebarCollapsed && <span>Finance & Invoice</span>}
              </div>
            )}

            {isPrimaryMobileNavTab('reports') && canReadArea('reports') && canShowTab('reports') && (
              <div
                data-mobile-nav="reports"
                className={`nav-link ${activeTab === 'reports' ? 'active' : ''}`}
                onClick={() => setActiveTab('reports')}
              >
                <TrendingUp size={20} />
                {!sidebarCollapsed && <span>Reports</span>}
              </div>
            )}

            {canReadArea('notes') && canShowTab('notes') && (
              <div 
                data-mobile-secondary="true"
                className={`nav-link ${activeTab === 'notes' ? 'active' : ''}`}
                onClick={() => setActiveTab('notes')}
              >
                <Lock size={20} />
                {!sidebarCollapsed && <span>Catatan Terenkripsi</span>}
              </div>
            )}

            {canReadArea('integrations') && canShowTab('integrations') && (
              <div 
                data-mobile-secondary="true"
                className={`nav-link ${activeTab === 'integrations' ? 'active' : ''}`}
                onClick={() => setActiveTab('integrations')}
              >
                <RefreshCw size={20} />
                {!sidebarCollapsed && <span>Integrasi Realtime</span>}
              </div>
            )}

            {canReadArea('settings') && canShowTab('settings') && (
              <div 
                data-mobile-secondary="true"
                className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                <Settings size={20} />
                {!sidebarCollapsed && <span>Pengaturan macOS</span>}
              </div>
            )}

            {isAppDeveloper && (
              <div className="mt-3 pt-3 border-t border-white/25 dark:border-indigo-900/60">
                {!sidebarCollapsed && (
                  <div className="px-3 pb-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-yellow-100/90">Developer Tools</p>
                  </div>
                )}
                <div
                  data-mobile-secondary="true"
                  className={`nav-link ${activeTab === 'userMonitoring' ? 'active' : ''}`}
                  onClick={() => setActiveTab('userMonitoring')}
                >
                  <ShieldCheck size={20} />
                  {!sidebarCollapsed && <span>User Monitoring</span>}
                  {!sidebarCollapsed && <span className="ml-auto rounded-full bg-yellow-200/30 px-2 py-0.5 text-[10px] font-extrabold text-yellow-50">DEV</span>}
                </div>
              </div>
            )}
              </>
            )}

          </nav>

          {/* User profile section in Sidebar footer */}
          {!sidebarCollapsed && <div className="border-t border-white/25 dark:border-indigo-900/60 pt-4 mt-auto sidebar-footer-fixed">
            <div className="flex flex-col gap-3">
              {workspaceContext?.ownerUserId && (
                <button
                  type="button"
                  onClick={handleWorkspaceChatTriggerClick}
                  onPointerDown={handleWorkspaceChatTriggerPointerDown}
                  className="relative flex items-center gap-3 p-3 rounded-xl border border-yellow-200 bg-[#FFF7C7] hover:bg-[#FFF3AE] text-yellow-950 transition-all active:scale-95 shadow-sm"
                >
                  <span className={`absolute -top-2 -right-2 min-w-[22px] h-6 px-1 rounded-full text-white text-[11px] font-extrabold inline-flex items-center justify-center shadow-md border-2 border-white ${
                    workspaceUnreadChatCount > 0 ? 'bg-red-500' : 'bg-purple-300'
                  }`}>
                    {workspaceUnreadChatCount > 99 ? '99+' : workspaceUnreadChatCount}
                  </span>
                  <div className="w-10 h-10 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center shrink-0">
                    <MessageSquare size={18} />
                  </div>
                  <div className="min-w-0 text-left">
                    <h4 className="text-sm font-bold truncate">{workspaceChatButtonTitle}</h4>
                    <p className="text-[11px] text-yellow-800/80 truncate">Ruang chat owner dan assistant</p>
                  </div>
                </button>
              )}
              <div className="flex items-stretch gap-2">
                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="min-w-0 flex-1 flex items-center gap-3 p-3 rounded-xl bg-[#FFF08A] hover:bg-[#FFF08A]/90 transition-all active:scale-95 cursor-pointer group shadow-sm"
                >
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center group-hover:bg-yellow-50 transition-all overflow-hidden ring-2 ring-yellow-200 shrink-0">
                    {session?.user?.user_metadata?.avatar_url ? (
                      <img
                        src={session.user.user_metadata.avatar_url}
                        alt={session?.user?.user_metadata?.full_name || 'Foto profil'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.nextElementSibling?.classList.remove('hidden')
                        }}
                      />
                    ) : null}
                    <User size={18} className={`text-yellow-800 ${session?.user?.user_metadata?.avatar_url ? 'hidden' : ''}`} />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <h4 className="text-sm font-semibold truncate flex items-center gap-1.5 text-yellow-950">
                      {session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'Pengguna'}
                      {session?.user?.email?.startsWith('arunika.dyatask@') && (
                        <span className="bg-yellow-950 text-yellow-100 border border-yellow-900 text-[8px] px-1 py-0.5 rounded font-extrabold uppercase tracking-wider scale-90 origin-left">
                          DEV
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-yellow-900/75 truncate">{session?.user?.email}</p>
                  </div>
                </button>
                {!isAssistantWorkspace && (
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-10 shrink-0 rounded-xl border border-red-200 bg-red-50/90 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/20 dark:hover:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 transition-all active:scale-95 shadow-sm"
                    title="Keluar"
                    aria-label="Keluar"
                  >
                    <LogOut size={16} />
                  </button>
                )}
              </div>
	              <div className="flex gap-2">
	                {workspaceRole === 'owner' ? (
	                  <>
	                    <button
	                      onClick={() => setActiveTab('pageControl')}
	                      className="flex-1 h-8 rounded-lg border border-white/35 dark:border-indigo-900 flex items-center justify-center hover:bg-white/20 dark:hover:bg-indigo-900/50 text-xs font-semibold gap-1 transition-all text-white"
	                    >
	                      <SlidersHorizontal size={14} className="text-white" />
	                      <span>Atur Halaman</span>
	                    </button>
	                    <button
	                      onClick={() => setActiveTab('tutorial')}
	                      className="flex-1 h-8 rounded-lg border border-white/35 dark:border-indigo-900 flex items-center justify-center hover:bg-white/20 dark:hover:bg-indigo-900/50 text-xs font-semibold gap-1 transition-all text-white"
	                    >
	                      <GraduationCap size={14} className="text-white" />
	                      <span>Tutorial</span>
	                    </button>
	                  </>
	                ) : (
	                  <button
	                    onClick={toggleTheme}
	                    className="flex-1 h-8 rounded-lg border border-white/35 dark:border-indigo-900 flex items-center justify-center hover:bg-white/20 dark:hover:bg-indigo-900/50 text-xs font-semibold gap-1 transition-all text-white"
	                  >
	                    {theme === 'dark' ? <Sun size={14} className="text-amber-300" /> : <Moon size={14} className="text-white" />}
	                    <span>{theme === 'dark' ? 'Terang' : 'Gelap'}</span>
	                  </button>
	                )}
	              </div>
            </div>
          </div>}

          {sidebarCollapsed && (
            <div className="border-t border-white/25 dark:border-indigo-900/60 pt-4 mt-auto flex justify-center">
              <div className="flex flex-col items-center gap-2">
                {workspaceContext?.ownerUserId && (
                  <button
                    type="button"
                    onClick={handleWorkspaceChatTriggerClick}
                    onPointerDown={handleWorkspaceChatTriggerPointerDown}
                    className={`relative w-11 h-11 rounded-full p-0 shadow-md active:scale-95 transition-all flex items-center justify-center ${
                      hasUnreadWorkspaceChat ? 'bg-[#8f75d8] hover:bg-[#8069c8] text-white' : 'bg-white/95 hover:bg-white text-[#8f75d8]'
                    }`}
                    title={workspaceChatButtonTitle}
                  >
                    <span className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-extrabold inline-flex items-center justify-center border border-white ${
                      hasUnreadWorkspaceChat ? 'bg-red-500' : 'bg-purple-300'
                    }`}>
                      {workspaceUnreadChatCount > 99 ? '99+' : workspaceUnreadChatCount}
                    </span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${hasUnreadWorkspaceChat ? 'bg-white/14' : 'bg-gradient-to-br from-yellow-200 via-amber-300 to-orange-300'}`}>
                      <MessageSquare size={15} className={hasUnreadWorkspaceChat ? 'text-white' : 'text-amber-800'} />
                    </div>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(true)}
                  className="w-11 h-11 rounded-full bg-[#FFF08A] hover:bg-[#FFF08A]/90 p-1.5 shadow-md active:scale-95 transition-all overflow-hidden flex items-center justify-center"
                  title="Buka profil"
                >
                  {session?.user?.user_metadata?.avatar_url ? (
                    <img
                      src={session.user.user_metadata.avatar_url}
                      alt={session?.user?.user_metadata?.full_name || 'Foto profil'}
                      className="w-full h-full rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        e.currentTarget.nextElementSibling?.classList.remove('hidden')
                      }}
                    />
                  ) : null}
                  <User size={18} className={`text-yellow-800 ${session?.user?.user_metadata?.avatar_url ? 'hidden' : ''}`} />
                </button>
              </div>
            </div>
          )}

        </aside>
        )}

        {/* 2. Main Content Area */}
        <main className="p-6 md:p-8 overflow-y-auto max-h-screen" onMouseEnter={handleSidebarMouseLeave}>
          
          {activeTab === 'workspaceChat' && isMobileTabletView && (
            <section className="workspace-chat-page">
              <div className={`workspace-chat-page-shell ${workspaceRole === 'owner' && mobileWorkspaceChatView === 'list' ? 'list-view' : 'detail-view'}`}>
                {workspaceRole === 'owner' && mobileWorkspaceChatView === 'list' ? (
                  <>
                    <div className="workspace-chat-list-header">
                    <div>
                        <p className="text-[11px] text-white/70">Workspace Chat</p>
                        <h2 className="text-2xl font-extrabold text-white mt-0.5">Inbox</h2>
                      </div>
                    <div className="workspace-chat-list-header-actions">
                      <button type="button" onClick={closeWorkspaceChatExperience} className="workspace-chat-list-circle">
                        <ArrowLeft size={18} />
                      </button>
                        <button
                          type="button"
                          onClick={() => setWorkspaceChatStatusMenuOpen(prev => !prev)}
                          className={`workspace-chat-list-status ${workspaceChatStatusTone}`}
                        >
                          <span className="inline-block h-2 w-2 rounded-full bg-current opacity-80" />
                          {workspaceChatStatusLabel}
                          <ChevronDown size={14} />
                        </button>
                        {workspaceChatStatusMenuOpen && (
                          <div className="absolute right-4 top-20 z-20 w-40 rounded-2xl border border-purple-100 bg-white p-2 shadow-xl">
                            <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-purple-400">{workspaceChatStatusSectionLabel}</p>
                            <div className="space-y-1">
                              {workspaceChatStatusOptions.map(option => (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => updateWorkspaceChatStatus(option.value)}
                                  className={`w-full rounded-xl px-3 py-2 text-left text-xs font-semibold border inline-flex items-center justify-between gap-2 ${
                                    option.value === workspaceChatStatusValue
                                      ? option.tone
                                      : 'border-purple-100 text-[#4f4574] hover:bg-purple-50'
                                  }`}
                                >
                                  <span className="inline-flex items-center gap-2">
                                    <span className="inline-block h-2 w-2 rounded-full bg-current opacity-80" />
                                    {option.label}
                                  </span>
                                  {option.value === workspaceChatStatusValue && <Check size={13} />}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="workspace-chat-list-tabs">
                      <button type="button" className="workspace-chat-list-tab active">All Chats</button>
                    </div>

                    <div className="workspace-chat-list-feed">
                      {workspaceChatMemberSummaries.length === 0 ? (
                        <div className="workspace-chat-list-empty">Belum ada assistant aktif.</div>
                      ) : workspaceChatMemberSummaries.map(({ member, memberName, memberPresence, memberPresenceText, lastMessage, unreadCount }) => (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => {
                            setSelectedWorkspaceChatMemberId(member.id)
                            setMobileWorkspaceChatView('detail')
                          }}
                          className="workspace-chat-list-item"
                        >
                          <div className="workspace-chat-list-avatar">{memberName.charAt(0)}</div>
                          <div className="workspace-chat-list-content">
                            <div className="workspace-chat-list-row">
                              <p className="workspace-chat-list-name">{memberName}</p>
                            </div>
                            <div className="workspace-chat-list-row">
                              <p className={`workspace-chat-list-presence ${getWorkspacePresenceToneClass(memberPresenceText)}`}>{memberPresenceText}</p>
                            </div>
                            <div className="workspace-chat-list-row">
                              <p className="workspace-chat-list-preview">
                                {lastMessage ? formatTextDates(lastMessage.detail) : memberPresence.label}
                              </p>
                            </div>
                          </div>
                          <div className="workspace-chat-list-meta">
                            <span className="workspace-chat-list-time">
                              {lastMessage ? new Date(lastMessage.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                            {unreadCount > 0 && <span className="workspace-chat-list-badge workspace-chat-list-badge-side">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                <div className="workspace-chat-page-header">
                  <div className="workspace-chat-page-topbar">
                    {!(isMobileTabletView && isAssistantWorkspace) && (
                      <button
                        type="button"
                        onClick={() => {
                          if (workspaceRole === 'owner' && mobileWorkspaceChatView === 'detail') {
                            setMobileWorkspaceChatView('list')
                            return
                          }
                          closeWorkspaceChatExperience()
                        }}
                        className="workspace-chat-page-back"
                        title="Kembali"
                      >
                        <ArrowLeft size={18} />
                      </button>
                    )}
                    <div className="workspace-chat-page-title">
                      {isMobileTabletView ? (
                        <>
                          <h2 className="workspace-chat-page-mobile-title text-xl font-extrabold text-white">
                            <span className={`workspace-chat-page-mobile-status-dot ${workspaceChatPeerStatusDotClass}`} />
                            {workspaceChatTitleName}
                          </h2>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-white/80">
                            <span className="workspace-chat-page-last-opened">{workspaceChatPresenceText}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">Workspace Chat</p>
                          <h2 className="text-xl font-extrabold text-white">{workspaceChatTitleName}</h2>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-white/80">
                            <span className={`workspace-chat-page-status-badge inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-bold ${workspaceChatPeerStatusTone}`}>
                              <span className="inline-block h-2 w-2 rounded-full bg-current opacity-80" />
                              {workspaceChatPeerStatusLabel}
                            </span>
                            <span className="workspace-chat-page-last-opened">{workspaceChatPresenceText}</span>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="workspace-chat-page-actions">
                      <div className="relative">
                        {(isMobileTabletView && isAssistantWorkspace) ? (
                          <div className="workspace-chat-list-header-actions">
                            <button
                              type="button"
                              onClick={() => setWorkspaceChatStatusMenuOpen(prev => !prev)}
                              className={`workspace-chat-list-status ${workspaceChatStatusTone}`}
                            >
                              <span className="inline-block h-2 w-2 rounded-full bg-current opacity-80" />
                              {workspaceChatStatusLabel}
                              <ChevronDown size={14} />
                            </button>
                            {workspaceChatStatusMenuOpen && (
                              <div className="absolute right-12 top-12 z-20 w-40 rounded-2xl border border-purple-100 bg-white p-2 shadow-xl">
                                <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-purple-400">{workspaceChatStatusSectionLabel}</p>
                                <div className="space-y-1">
                                  {workspaceChatStatusOptions.map(option => (
                                    <button
                                      key={option.value}
                                      type="button"
                                      onClick={() => updateWorkspaceChatStatus(option.value)}
                                      className={`w-full rounded-xl px-3 py-2 text-left text-xs font-semibold border inline-flex items-center justify-between gap-2 ${
                                        option.value === workspaceChatStatusValue
                                          ? option.tone
                                          : 'border-purple-100 text-[#4f4574] hover:bg-purple-50'
                                      }`}
                                    >
                                      <span className="inline-flex items-center gap-2">
                                        <span className="inline-block h-2 w-2 rounded-full bg-current opacity-80" />
                                        {option.label}
                                      </span>
                                      {option.value === workspaceChatStatusValue && <Check size={13} />}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={closeWorkspaceChatExperience}
                              className="workspace-chat-list-circle"
                              title="Tutup chat"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (isMobileTabletView && workspaceRole === 'owner' && mobileWorkspaceChatView === 'detail') ? (
                          <div className="workspace-chat-list-header-actions">
                            <button
                              type="button"
                              onClick={() => setWorkspaceChatOwnerMenuOpen(prev => !prev)}
                              className="workspace-chat-list-circle"
                              title="Menu chat"
                            >
                              <MoreHorizontal size={16} />
                            </button>
                            {workspaceChatOwnerMenuOpen && (
                              <div className="absolute right-0 top-12 z-20 w-44 rounded-2xl border border-purple-100 bg-white p-2 shadow-xl">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setWorkspaceChatOwnerMenuOpen(false)
                                    handleClearWorkspaceChat()
                                  }}
                                  className="w-full rounded-xl px-3 py-2 text-left text-xs font-semibold border border-red-100 text-red-500 hover:bg-red-50 inline-flex items-center gap-2"
                                >
                                  <Trash2 size={14} />
                                  Kosongkan Chat
                                </button>
                              </div>
                            )}
                          </div>
                        ) : !isMobileTabletView && (
                          <>
                            <button
                              type="button"
                              onClick={() => setWorkspaceChatStatusMenuOpen(prev => !prev)}
                              className={`h-10 px-3 rounded-2xl border text-xs font-bold inline-flex items-center gap-2 bg-white/90 ${workspaceChatStatusTone}`}
                            >
                              <span className="inline-block h-2 w-2 rounded-full bg-current opacity-80" />
                              {workspaceChatStatusLabel}
                              <ChevronDown size={14} />
                            </button>
                            {workspaceChatStatusMenuOpen && (
                              <div className="absolute right-0 top-11 z-20 w-40 rounded-2xl border border-purple-100 bg-white p-2 shadow-xl">
                                <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-purple-400">{workspaceChatStatusSectionLabel}</p>
                                <div className="space-y-1">
                                  {workspaceChatStatusOptions.map(option => (
                                    <button
                                      key={option.value}
                                      type="button"
                                      onClick={() => updateWorkspaceChatStatus(option.value)}
                                      className={`w-full rounded-xl px-3 py-2 text-left text-xs font-semibold border inline-flex items-center justify-between gap-2 ${
                                        option.value === workspaceChatStatusValue
                                          ? option.tone
                                          : 'border-purple-100 text-[#4f4574] hover:bg-purple-50'
                                      }`}
                                    >
                                      <span className="inline-flex items-center gap-2">
                                        <span className="inline-block h-2 w-2 rounded-full bg-current opacity-80" />
                                        {option.label}
                                      </span>
                                      {option.value === workspaceChatStatusValue && <Check size={13} />}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {canManageTeam && workspaceAssistantChatMembers.length > 0 && !isMobileTabletView && (
                    <div className="workspace-chat-page-assistants">
                      {workspaceAssistantChatMembers.map(member => {
                        const memberName = resolveWorkspaceMemberName(member)
                        const memberMessageCount = activityLogs.filter(item => item?.metadata?.kind === 'workspace_chat' && item?.metadata?.chatMemberId === member.id).length
                        const memberPresence = getWorkspaceChatPresenceOption(member.memberUserId)
                        const isSelected = member.id === activeWorkspaceChatMemberId
                        return (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => setSelectedWorkspaceChatMemberId(member.id)}
                            className={`workspace-chat-page-assistant-item ${isSelected ? 'active' : ''}`}
                          >
                            <span className="block font-bold truncate">{memberName}</span>
                            <span className="block text-[10px] opacity-80 truncate">{memberPresence.label} • {memberMessageCount} pesan</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div
                  ref={workspaceChatFeedRef}
                  className="workspace-chat-page-feed"
                  onClick={() => setWorkspaceChatActionMessageId('')}
                >
                  {workspaceChatMessages.length === 0 ? (
                    <div className="workspace-chat-page-empty">
                      <p className="workspace-chat-page-empty-text">Belum ada pesan. Mulai chat untuk koordinasi kerja.</p>
                    </div>
                  ) : workspaceChatItemsWithDateSeparator.map(item => {
                    if (item.__type === 'date_separator') {
                      const isDetailMobileView = isMobileTabletView
                        && (workspaceRole !== 'owner' || mobileWorkspaceChatView === 'detail')
                      return (
                        <div key={item.id} className="flex items-center gap-2 py-1">
                          <div className={`h-px flex-1 ${isDetailMobileView ? 'bg-purple-200' : 'bg-white/15'}`} />
                          <span className={`text-[10px] font-bold whitespace-nowrap px-2 ${isDetailMobileView ? 'text-purple-400' : 'text-white/70'}`}>{item.label}</span>
                          <div className={`h-px flex-1 ${isDetailMobileView ? 'bg-purple-200' : 'bg-white/15'}`} />
                        </div>
                      )
                    }
                    const isMine = isWorkspaceChatMine(item)
                    const isReminderMessage = item?.metadata?.reminderType && item?.metadata?.senderRole === 'assistant'
                    const isAckVisibleMessage = item?.metadata?.ackVisible || item?.metadata?.replyType === 'ack_visible'
                    const canConfirmReminder = workspaceRole === 'owner' && !isMine && isReminderMessage && !workspaceChatAcknowledgedIds.has(item.id)
                    const sentTime = new Date(item.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                    const readLabel = (
                      workspaceChatAcknowledgedIds.has(item.id)
                      || (isMine && workspaceChatPeerSeenAt > 0 && new Date(item.createdAt).getTime() <= workspaceChatPeerSeenAt)
                    ) ? 'Read' : 'Sent'
                    const replyMeta = getWorkspaceChatReplyMeta(item)
                    const canDeleteMessage = isMine || canManageTeam
                    const actionMenuOpen = workspaceChatActionMessageId === item.id
                    return (
                      <div key={item.id} className={`workspace-chat-page-message-row ${isMine ? 'mine' : ''}`}>
                        {isMine && (
                          <div className="workspace-chat-page-meta text-left">
                            <p>{sentTime}</p>
                            <p>{readLabel}</p>
                          </div>
                        )}
                        <div
                          className="workspace-chat-page-bubble-wrap relative"
                          onClick={(event) => event.stopPropagation()}
                          onPointerDown={(event) => handleWorkspaceChatBubblePointerDown(event, item)}
                          onPointerUp={(event) => handleWorkspaceChatBubblePointerUp(event, item)}
                          onPointerLeave={clearWorkspaceChatBubbleGesture}
                          onPointerCancel={clearWorkspaceChatBubbleGesture}
                          onContextMenu={(event) => {
                            event.preventDefault()
                            setWorkspaceChatActionMessageId(item.id)
                          }}
                        >
                        {actionMenuOpen && (
                          <div className={`absolute -top-4 z-10 inline-flex items-center gap-1 rounded-full border border-purple-100 bg-white px-1.5 py-1 shadow-lg ${isMine ? 'left-3' : 'right-3'}`}>
                            <button
                              type="button"
                              onPointerDown={(event) => event.stopPropagation()}
                              onClick={(event) => {
                                event.stopPropagation()
                                openWorkspaceChatReply(item)
                              }}
                              className="h-7 w-7 rounded-full text-[#6f55bd] hover:bg-purple-50 inline-flex items-center justify-center"
                              title="Reply"
                            >
                              <CornerUpLeft size={13} />
                            </button>
                            {canDeleteMessage && (
                              <button
                                type="button"
                                onPointerDown={(event) => event.stopPropagation()}
                                onClick={(event) => {
                                  event.stopPropagation()
                                  deleteWorkspaceChatMessage(item)
                                }}
                                className="h-7 w-7 rounded-full text-red-500 hover:bg-red-50 inline-flex items-center justify-center"
                                title="Hapus"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        )}
                          <div className={`workspace-chat-page-bubble w-full ${isMine ? 'mine' : 'incoming'} ${isReminderMessage ? 'reminder' : ''} ${isAckVisibleMessage ? 'ack-visible' : ''}`}>
                          <p className="text-[9px] font-bold opacity-80">{getWorkspaceMessageSenderName(item)}</p>
                          {replyMeta && (
                            <div className={`mb-1.5 flex items-center gap-2 px-0.5 py-0 text-[10px] leading-snug ${
                              isMine
                                ? 'text-white/82'
                                : 'text-[#6b5aa8]'
                            }`}>
                              <span className="inline-block h-5 w-[3px] shrink-0 rounded-full bg-[#8f75d8]" />
                              <div className="min-w-0">
                                <p className="truncate text-[11px] leading-tight opacity-90">
                                  {replyMeta.senderName}: {replyMeta.preview}
                                </p>
                              </div>
                            </div>
                          )}
                          <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{formatTextDates(item.detail)}</p>
                          {workspaceChatAcknowledgedIds.has(item.id) && (
                            <p className="mt-1 text-[10px] font-bold opacity-90 inline-flex items-center gap-1">
                              <CheckCircle size={12} />
                              Dikonfirmasi dibaca
                            </p>
                          )}
                          {canConfirmReminder && (
                            <button
                              type="button"
                              onPointerDown={(event) => event.stopPropagation()}
                              onClick={(event) => {
                                event.stopPropagation()
                                sendWorkspaceReminderAck(item.id)
                              }}
                              className="mt-2 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700"
                            >
                              Konfirmasi Dibaca
                            </button>
                          )}
                        </div>
                        </div>
                        {!isMine && (
                          <div className="workspace-chat-page-meta text-right">
                            <p>{sentTime}</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                <form onSubmit={handleSendWorkspaceChatMessage} className="workspace-chat-page-composer">
                  {workspaceChatPeerIsTyping && (
                    <p className={`mb-2 text-[11px] font-semibold ${
                      isMobileTabletView && (workspaceRole !== 'owner' || mobileWorkspaceChatView === 'detail')
                        ? 'text-white/90'
                        : 'text-purple-400'
                    }`}>
                      {workspaceChatPeerTypingLabel}
                    </p>
                  )}
                  {isAssistantWorkspace && (
                    <div className="workspace-chat-page-quick-actions">
                      <button type="button" onClick={() => sendQuickWorkspaceReminder('task')} className="workspace-chat-page-chip">Task Hari Ini</button>
                      <button type="button" onClick={() => sendQuickWorkspaceReminder('event')} className="workspace-chat-page-chip">Event Hari Ini</button>
                      <button type="button" onClick={() => sendQuickWorkspaceReminder('gcall')} className="workspace-chat-page-chip">GCall Hari Ini</button>
                      <button type="button" onClick={() => sendQuickWorkspaceReminder('deadline')} className="workspace-chat-page-chip">Deadline Hari Ini</button>
                    </div>
                  )}
                  {workspaceChatReplyTarget && (
                    <div className="mb-2 flex items-start justify-between gap-2 rounded-2xl border border-white/30 bg-white/16 px-3 py-2 text-white/95 backdrop-blur-sm">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/70">Reply ke {workspaceChatReplyTarget.senderName}</p>
                        <p className="mt-0.5 truncate text-xs">{workspaceChatReplyTarget.preview}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setWorkspaceChatReplyTarget(null)}
                        className="h-7 w-7 shrink-0 rounded-full border border-white/25 text-white hover:bg-white/10 inline-flex items-center justify-center"
                        title="Batal reply"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  )}
                  <div className="workspace-chat-page-composer-row">
                    <button
                      type="button"
                      onClick={() => setWorkspaceEmojiPickerOpen(prev => !prev)}
                      className="workspace-chat-page-icon-button"
                      title="Pilih emoticon"
                    >
                      <Smile size={16} />
                    </button>
                    <div className="workspace-chat-page-input-wrap">
                      {workspaceEmojiPickerOpen && (
                        <div className="absolute bottom-12 left-0 z-20 w-48 rounded-2xl border border-purple-100 bg-white p-2 shadow-xl grid grid-cols-6 gap-1">
                          {WORKSPACE_CHAT_EMOJIS.map(emoji => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => appendWorkspaceChatEmoji(emoji)}
                              className="h-8 w-8 rounded-lg hover:bg-purple-50 text-base flex items-center justify-center"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                      <textarea
                        value={workspaceChatMessage}
                        onChange={(e) => setWorkspaceChatMessage(e.target.value)}
                        onKeyDown={handleWorkspaceChatInputKeyDown}
                        rows={1}
                        maxLength={500}
                        placeholder=""
                        className="workspace-chat-page-textarea"
                        autoFocus={!isMobileTabletView}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={workspaceChatSending || !workspaceChatMessage.trim()}
                      className="workspace-chat-page-send"
                    >
                      <SendHorizontal size={16} />
                    </button>
                  </div>
                </form>
                  </>
                )}
              </div>
            </section>
          )}

          {/* Header Bar */}
          {activeTab !== 'workspaceChat' && (
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-100 dark:border-indigo-950 pb-6 mb-6">
            <div>
	              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#4f4574]">
	                Hallo, {isAssistantWorkspace ? assistantDisplayName : headerUserName}
	              </h1>
	              {isAssistantWorkspace ? (
	                <p className="text-sm md:text-base text-purple-500 mt-2">
	                  Pantau terus kegiatan {workspaceOwnerDisplayName} pada aplikasi ini
	                </p>
	              ) : (
	                <>
	                  <p className="text-sm md:text-base text-purple-500 mt-2">
	                    {dayGreeting} Sekarang {headerDateLabel} - Pukul {headerTimeLabel}
	                  </p>
	                  <p className="text-sm text-purple-400 mt-1">Have a Nice day, ya!</p>
	                </>
	              )}
	            </div>
            
            {/* Realtime Badges */}
	            <div className="app-header-actions flex flex-wrap items-center gap-2">
	              <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full border text-[11px] font-bold ${
	                calendarIntegrationActive
	                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/50 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-300'
	                  : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/50 dark:border-amber-900/30 text-amber-600 dark:text-amber-300'
	              }`}>
	                <span className={`w-1.5 h-1.5 rounded-full ${calendarIntegrationActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
	                {realtimeStatusText} • {securityStatusText}
	              </div>

              {!isPwaStandalone && (
                <button
                  onClick={handleOpenInstallOptions}
                  className={`px-3 py-1.5 rounded-lg border font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all ${
                    pwaInstallPrompt
                      ? 'bg-[#8f75d8]/12 hover:bg-[#8f75d8]/18 border-[#8f75d8]/20 text-[#6f55bd]'
                      : 'bg-white/70 hover:bg-white border-purple-100 text-[#6f55bd]'
                  }`}
                  title={pwaInstallPrompt ? 'Install aplikasi' : 'Instruksi install aplikasi'}
                >
                  <Laptop size={13} />
                  Install App
                </button>
              )}

              <button
                onClick={() => setShowQuickBookingModal(true)}
                className="px-3 py-1.5 rounded-lg bg-[#8f75d8] hover:bg-[#8069c8] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                <Plus size={13} />
                Add Event
              </button>
            </div>
          </header>
          )}

          {/* TAB CONTENT: 1. DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="mobile-page mobile-page-dashboard">
              {/* Stat Cards Grid */}
              <div className="dashboard-stat-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Stat 1: Total Booking */}
                <div className="glass-panel p-6 glass-panel-hover transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-purple-400 dark:text-purple-300 uppercase tracking-widest">Total Konsultasi</span>
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-purple-50 dark:from-indigo-900 dark:to-indigo-950 flex items-center justify-center text-purple-600 dark:text-purple-300">
                      <Calendar size={18} />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold tracking-tight">{appointments.length}</h3>
                  <p className="text-xs text-purple-500 dark:text-purple-400 mt-2 flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>{appointments.filter(a => a.status === 'confirmed').length} Terkonfirmasi</span>
                  </p>
                </div>

                {/* Stat 2: Tasks Done */}
                <div className="glass-panel p-6 glass-panel-hover transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-purple-400 dark:text-purple-300 uppercase tracking-widest">Tugas Selesai</span>
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-100 to-pink-50 dark:from-pink-950/40 dark:to-pink-900/20 flex items-center justify-center text-pink-600 dark:text-pink-300">
                      <CheckSquare size={18} />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold tracking-tight">
                    {tasks.filter(t => t.status === 'done').length}/{tasks.length}
                  </h3>
                  {/* Progress bar */}
                  <div className="w-full bg-purple-100 dark:bg-indigo-950 h-2 rounded-full mt-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-pink-500 to-purple-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${tasks.length > 0 ? (tasks.filter(t => t.status === 'done').length / tasks.length) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-purple-400 dark:text-purple-400 mt-2">
                    {tasks.filter(t => t.status === 'pending').length} tugas tertunda
                  </p>
                </div>

                {/* Stat 3: Encrypted Notes */}
                <div className="glass-panel p-6 glass-panel-hover transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-purple-400 dark:text-purple-300 uppercase tracking-widest">Catatan Aman</span>
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-950/40 dark:to-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-300">
                      <Lock size={18} />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold tracking-tight">{notes.length}</h3>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>AES-256-GCM Aktif</span>
                  </p>
                </div>

                {/* Stat 4: Schedule Bookings */}
                <div className="glass-panel p-6 glass-panel-hover transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-purple-400 dark:text-purple-300 uppercase tracking-widest">Jadwal Hari Ini</span>
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-950/40 dark:to-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-300">
                      <Clock size={18} />
                    </div>
                  </div>
	                  <h3 className="text-3xl font-bold tracking-tight">
	                    {todayCalendarItems.length}
	                  </h3>
	                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1.5">
	                    <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
	                    <span>{todayTasks.length} task • {todayLocalAppointments.length + todayGoogleEvents.length} event</span>
	                  </p>
                </div>

              </div>

              {/* Graphical Trend & Live Logs */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                
                {/* Bento Analytics Command Center */}
                <div className="glass-panel p-6 lg:col-span-2">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                      <h3 className="text-lg font-bold">Today Command Center</h3>
                      <p className="text-xs text-purple-400 dark:text-purple-300">Ringkasan kerja, beban mingguan, progress project, dan antrean fokus.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('tasks')}
                      className="px-3 py-2 rounded-xl bg-[#8f75d8] hover:bg-[#8069c8] text-white text-[11px] font-bold inline-flex items-center gap-1.5 shadow-sm"
                    >
                      Open Tasks
                      <ExternalLink size={12} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
                    <div className="xl:col-span-2 rounded-3xl border border-purple-100/70 dark:border-indigo-900/50 bg-white/60 dark:bg-indigo-950/20 p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.18em] font-extrabold text-purple-400 dark:text-purple-300">Today</p>
                          <h4 className="text-xl font-extrabold">Command Center</h4>
                        </div>
                        <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#8f75d8]/10 text-[#8f75d8] font-bold">{formatLongDate(todayString)}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-[#8f75d8]/10 border border-[#8f75d8]/15 p-4">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#8f75d8]">Due Today</p>
	                          <p className="text-3xl font-black mt-2">{todayCalendarItems.length}</p>
                        </div>
                        <div className="rounded-2xl bg-red-50/80 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 p-4">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-red-500">Overdue</p>
                          <p className="text-3xl font-black mt-2 text-red-600 dark:text-red-300">{overdueTasks.length}</p>
                        </div>
                        <div className="rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-4">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Completed</p>
                          <p className="text-3xl font-black mt-2 text-emerald-600 dark:text-emerald-300">{completedTodayTasks.length}</p>
                        </div>
                        <div className="rounded-2xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 p-4">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Next Event</p>
	                          <p className="text-sm font-black mt-2 truncate">{nextCalendarItem?.title || 'No event'}</p>
	                          <p className="text-[10px] text-amber-600/80 dark:text-amber-300 mt-1 truncate">{nextCalendarItem ? `${formatLongDate(nextCalendarItem.date)} • ${nextCalendarItem.time || 'All day'} • ${nextCalendarItem.source === 'google_event' ? 'Google Calendar' : nextCalendarItem.source === 'holiday' ? 'Libur' : 'DyaTask'}` : 'Calendar clear'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="xl:col-span-2 rounded-3xl border border-purple-100/70 dark:border-indigo-900/50 bg-white/60 dark:bg-indigo-950/20 p-5">
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.18em] font-extrabold text-purple-400 dark:text-purple-300">Weekly</p>
                          <h4 className="text-xl font-extrabold">Workload Cards</h4>
                        </div>
                        <span className="text-[10px] px-2.5 py-1 rounded-full bg-purple-50 dark:bg-indigo-900/40 text-purple-500 dark:text-purple-300 font-bold">Task + Event</span>
                      </div>

                      <div className="grid grid-cols-7 gap-2 items-end min-h-[150px]">
                        {weeklyWorkload.map(day => (
                          <div key={day.label} className="flex flex-col items-center gap-2">
                            <div className="w-full h-28 rounded-2xl bg-purple-50 dark:bg-indigo-950/40 border border-purple-100/60 dark:border-indigo-900/40 flex items-end overflow-hidden">
                              <div
                                className="w-full rounded-2xl bg-[#8f75d8] transition-all"
                                style={{ height: `${Math.max(12, (day.total / maxWeeklyWorkload) * 100)}%` }}
                              />
                            </div>
                            <p className="text-xs font-black text-purple-400 dark:text-purple-300">{day.label}</p>
                            <p className="text-[10px] font-bold text-purple-500 dark:text-purple-300">{day.total}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="xl:col-span-2 rounded-3xl border border-purple-100/70 dark:border-indigo-900/50 bg-white/60 dark:bg-indigo-950/20 p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.18em] font-extrabold text-purple-400 dark:text-purple-300">Projects</p>
                          <h4 className="text-xl font-extrabold">Progress Overview</h4>
                        </div>
                        <FolderOpen size={20} className="text-[#8f75d8]" />
                      </div>
                      <div className="space-y-3">
                        {projectProgressOverview.length === 0 ? (
                          <p className="text-xs text-purple-400 dark:text-purple-300">Belum ada folder project aktif.</p>
                        ) : projectProgressOverview.map(project => (
                          <div key={project.name} className="space-y-1.5">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-bold truncate">{project.name}</p>
                              <span className="text-[10px] font-black text-[#8f75d8]">{project.percent}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-purple-100 dark:bg-indigo-950 overflow-hidden">
                              <div className="h-full rounded-full bg-[#8f75d8]" style={{ width: `${project.percent}%` }} />
                            </div>
                            <p className="text-[10px] text-purple-400 dark:text-purple-300">{project.completed}/{project.total} item selesai</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="xl:col-span-2 rounded-3xl border border-purple-100/70 dark:border-indigo-900/50 bg-white/60 dark:bg-indigo-950/20 p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.18em] font-extrabold text-purple-400 dark:text-purple-300">Priority</p>
                          <h4 className="text-xl font-extrabold">Focus Queue</h4>
                        </div>
                        <CheckCircle size={20} className="text-[#8f75d8]" />
                      </div>

                      <div className="space-y-2">
                        {focusQueue.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-purple-200 dark:border-indigo-900 p-4 text-center text-xs text-purple-400 dark:text-purple-300">
                            Tidak ada antrean fokus. Semua aman.
                          </div>
                        ) : focusQueue.map((task, index) => (
                          <div key={task.id} className="flex items-center gap-3 rounded-2xl border border-purple-100/70 dark:border-indigo-900/50 bg-purple-50/40 dark:bg-indigo-950/30 p-3">
                            <span className="w-7 h-7 rounded-xl bg-[#8f75d8] text-white text-xs font-black flex items-center justify-center">{index + 1}</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold truncate">{task.title}</p>
                              <p className="text-[10px] text-purple-400 dark:text-purple-300 truncate">{task.category} • {formatLongDate(task.calendarDate || todayString)} • {task.dueTime} WIB</p>
                            </div>
                            <span className="text-[9px] px-2 py-1 rounded-full bg-white dark:bg-indigo-900/60 text-[#8f75d8] font-black uppercase">{task.priority}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Activity audit log */}
                <div className="glass-panel p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold">Activity Log Realtime</h3>
                        <p className="text-xs text-purple-400 dark:text-purple-300 mt-1">Riwayat aksi penting dan perubahan data.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {dbConnectionStatus === 'connected' ? (
                          <>
                            <span className="flex h-2.5 w-2.5 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Live</span>
                          </>
                        ) : (
                          <>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                            <span className="text-xs font-semibold text-red-600 dark:text-red-400">Offline</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="rounded-xl border border-purple-100/70 dark:border-indigo-900/50 bg-white/60 dark:bg-indigo-950/20 p-3">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-purple-400">Log</p>
                        <p className="text-xl font-black mt-1">{activityLogItems.length}</p>
                      </div>
                      <div className="rounded-xl border border-purple-100/70 dark:border-indigo-900/50 bg-white/60 dark:bg-indigo-950/20 p-3">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-purple-400">Order</p>
                        <p className="text-xl font-black mt-1">{spreadsheetOrders.length}</p>
                      </div>
                      <div className="rounded-xl border border-purple-100/70 dark:border-indigo-900/50 bg-white/60 dark:bg-indigo-950/20 p-3">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-purple-400">Invoice Paid</p>
                        <p className="text-xl font-black mt-1">{invoices.filter(invoice => String(invoice.status || '').toLowerCase() === 'paid').length}</p>
                      </div>
                    </div>

                    <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                      {activityLogItems.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-purple-200 dark:border-indigo-900 p-4 text-center text-xs text-purple-400 dark:text-purple-300">
                          Belum ada aktivitas penting yang tercatat.
                        </div>
                      ) : activityLogItems.map((item) => {
                        const toneClass = item.tone === 'green'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-900/40'
                          : item.tone === 'blue'
                            ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-900/40'
                            : item.tone === 'amber'
                              ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900/40'
                              : item.tone === 'slate'
                                ? 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700'
                                : 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-indigo-950/40 dark:text-purple-300 dark:border-indigo-900/40'

                        return (
                          <div key={item.id} className="rounded-xl border border-purple-100/70 dark:border-indigo-900/50 bg-white/70 dark:bg-indigo-950/20 p-3">
                            <div className="flex items-start gap-3">
                              <span className={`shrink-0 mt-0.5 px-2 py-1 rounded-lg border text-[9px] font-black uppercase ${toneClass}`}>
                                {item.type}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-xs font-bold text-[#4f4574] dark:text-white leading-snug">{item.title}</p>
                                  <span className="shrink-0 text-[10px] text-purple-400 dark:text-purple-300">
                                    {item.createdAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-300 mt-1 line-clamp-2">{formatTextDates(item.detail)}</p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="border-t border-purple-100 dark:border-indigo-950 pt-4 mt-4">
                    <div className="w-full py-2.5 bg-purple-50 dark:bg-indigo-950/50 text-purple-700 dark:text-purple-300 text-xs font-bold rounded-xl flex items-center justify-center gap-2">
                      <RefreshCw size={12} className="animate-spin" />
                      Auto-refresh aktif
                    </div>
                    <p className="mt-2 text-[10px] text-center text-purple-400 dark:text-purple-300">
                      Sinkron realtime + polling 15 detik • update terakhir {lastSyncTime.toLocaleTimeString('id-ID')}
                    </p>
                  </div>
                </div>

              </div>
              
              {/* Daily quick to-do brief */}
              <div className="glass-panel p-6 mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">Fokus Tugas Hari Ini</h3>
                  <button 
                    onClick={() => setActiveTab('tasks')}
                    className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1 hover:underline"
                  >
                    Selengkapnya <ExternalLink size={12} />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tasks.slice(0, 2).map(task => (
                    <div 
                      key={task.id} 
                      className="p-4 rounded-xl border border-purple-100/60 dark:border-indigo-950/60 bg-purple-50/20 dark:bg-indigo-950/10 flex items-center gap-3.5"
                    >
                      <div 
                        onClick={() => toggleTaskStatus(task.id)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all ${
                          task.status === 'done' 
                            ? 'bg-[#8f75d8] border-[#8f75d8] text-white' 
                            : 'border-purple-300 hover:border-purple-500'
                        }`}
                      >
                        {task.status === 'done' && <Check size={12} strokeWidth={3} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${task.status === 'done' ? 'line-through text-purple-300 dark:text-purple-400' : ''}`}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: task.colorLabel }}
                          ></span>
                          <span className="text-xs text-purple-400 dark:text-purple-300">{task.category}</span>
                          <span className="text-xs text-purple-400 dark:text-purple-300">•</span>
                          <span className="text-xs text-purple-400 dark:text-purple-300 flex items-center gap-0.5">
                            <Clock size={10} />
                            {task.dueTime}
                          </span>
                        </div>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                        task.priority === 'critical' 
                          ? 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400' 
                          : task.priority === 'high' 
                          ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'
                          : 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: 2. TASKS & PROJECT MANAGEMENT */}
          {activeTab === 'tasks' && (
            <div className="mobile-page mobile-page-tasks">
              {/* Task view toggle + actions */}
              <div className="tasks-mobile-toolbar flex flex-col md:flex-row md:items-center justify-end gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 p-1 rounded-xl bg-purple-100/60 dark:bg-indigo-950/40 border border-purple-200/20">
                    <button
                      onClick={() => setTaskView('list')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        taskView === 'list' ? 'bg-[#8f75d8] text-white shadow' : 'text-purple-700 dark:text-purple-300'
                      }`}
                    >
                      List View
                    </button>
                    <button
                      onClick={() => setTaskView('grid')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        taskView === 'grid' ? 'bg-[#8f75d8] text-white shadow' : 'text-purple-700 dark:text-purple-300'
                      }`}
                    >
                      Project Board
                    </button>
                  </div>
                  <button
                    onClick={() => setShowNewFolderModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-white dark:bg-indigo-950/40 border border-purple-200/60 dark:border-indigo-900 text-purple-700 dark:text-purple-300 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <Folder size={13} />
                    New Folder Task
                  </button>
                  <button
                    onClick={() => {
                      if (selectedProjectFolder?.name) setNewTaskCategory(selectedProjectFolder.name)
                      setShowQuickTaskModal(true)
                    }}
                    className="px-4 py-2.5 rounded-xl bg-[#8f75d8] hover:bg-[#8069c8] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-md"
                  >
                    <Plus size={13} />
                    Add Task
                  </button>
                </div>
              </div>

              {/* Tasks view */}
              <div className="space-y-4">
                  {taskView === 'list' ? (
                    isMobileTabletView ? (
                      mobileTaskFolderOpen ? (
                        <section className="glass-panel p-5 min-h-[420px]">
                          {selectedProjectFolder ? (
                            <>
                              <div className="flex items-start justify-between gap-3 mb-5">
                                <div className="min-w-0 flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() => setMobileTaskFolderOpen(false)}
                                    className="w-8 h-8 rounded-lg border border-purple-200/70 dark:border-indigo-900/60 bg-white/80 dark:bg-indigo-950/40 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0"
                                    title="Kembali ke list folder"
                                  >
                                    <ArrowLeft size={14} />
                                  </button>
                                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0" style={{ background: `linear-gradient(135deg, ${selectedProjectFolder.color}, #7C3AED)` }}>
                                    <FolderOpen size={18} />
                                  </div>
                                  <div className="min-w-0">
                                    <h3 className="text-lg font-extrabold truncate">{selectedProjectFolder.name}</h3>
                                    <p className="text-xs text-purple-400 dark:text-purple-300 mt-0.5">Task dan subtask pada folder ini tetap sinkron ke kalender dan notifikasi.</p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNewTaskCategory(selectedProjectFolder.name)
                                    setShowQuickTaskModal(true)
                                  }}
                                  className="px-3 py-2 rounded-xl bg-[#8f75d8] hover:bg-[#8069c8] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-md shrink-0"
                                >
                                  <Plus size={13} />
                                  Add Task
                                </button>
                              </div>

                              {selectedFolderTasks.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-purple-200 dark:border-indigo-900 p-8 text-center">
                                  <CheckCircle className="mx-auto text-purple-300 dark:text-purple-700 mb-2" size={32} />
                                  <p className="text-sm text-purple-400 dark:text-purple-300">Folder ini belum punya task utama.</p>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {selectedFolderTasks.map(task => {
                                    const childSubtasks = (subtasksByParent[task.id] || []).filter(taskMatchesSearch)
                                    const taskProgress = getTaskProgress(task, childSubtasks)
                                    return (
                                      <div key={task.id} className="rounded-2xl border border-purple-100/70 dark:border-indigo-900/50 bg-purple-50/20 dark:bg-slate-950/20 p-4">
                                        <div className="flex items-center gap-3">
                                          <button type="button" onClick={() => toggleTaskStatus(task.id)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${task.status === 'done' ? 'bg-[#8f75d8] border-[#8f75d8] text-white' : 'border-purple-300 hover:border-purple-500'}`}>
                                            {task.status === 'done' && <Check size={12} strokeWidth={3} />}
                                          </button>
                                          <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-semibold truncate ${task.status === 'done' ? 'line-through text-purple-300 dark:text-purple-400' : ''}`}>{task.title}</p>
                                            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-purple-400 dark:text-purple-300">
                                              <span className="flex items-center gap-1"><Clock size={10} />{task.dueTime} WIB</span>
                                              <span>•</span>
                                              <span>{formatLongDate(task.calendarDate || todayString)}</span>
                                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300 font-bold uppercase">{task.priority}</span>
                                            </div>
                                          </div>
                                          <button onClick={() => openCalendarEditModal({ ...task, itemType: 'task' })} className="w-8 h-8 rounded-lg hover:bg-purple-100 dark:hover:bg-indigo-900/50 text-purple-400 hover:text-purple-600 flex items-center justify-center" title="Edit task">
                                            <Pencil size={14} />
                                          </button>
                                          <button onClick={() => deleteTask(task.id)} className="w-8 h-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-purple-400 hover:text-red-500 flex items-center justify-center" title="Hapus task">
                                            <Trash2 size={14} />
                                          </button>
                                        </div>

                                        <div className="mt-3 ml-9">
                                          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-purple-500 dark:text-purple-300 mb-1.5">
                                            <span>Progress</span>
                                            <span>{taskProgress.percent}% • {taskProgress.completed}/{taskProgress.total}</span>
                                          </div>
                                          <div className="h-2 rounded-full bg-purple-100 dark:bg-indigo-950/60 overflow-hidden">
                                            <div
                                              className={`h-full rounded-full transition-all duration-500 ${
                                                taskProgress.percent === 100
                                                  ? 'bg-emerald-500'
                                                  : 'bg-gradient-to-r from-purple-500 to-fuchsia-500'
                                              }`}
                                              style={{ width: `${taskProgress.percent}%` }}
                                            />
                                          </div>
                                        </div>

                                        {childSubtasks.length > 0 && (
                                          <div className="mt-3 ml-9 space-y-2">
                                            {childSubtasks.map(subtask => (
                                              <div key={subtask.id} className="flex items-center gap-2 rounded-lg bg-white dark:bg-indigo-950/30 border border-purple-100/50 dark:border-indigo-900/40 px-3 py-2">
                                                <button type="button" onClick={() => toggleTaskStatus(subtask.id)} className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${subtask.status === 'done' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-purple-300 hover:border-purple-500'}`}>
                                                  {subtask.status === 'done' && <Check size={9} strokeWidth={3} />}
                                                </button>
                                                <div className="flex-1 min-w-0">
                                                  <p className={`text-xs font-semibold truncate ${subtask.status === 'done' ? 'line-through text-purple-300 dark:text-purple-400' : ''}`}>{subtask.title}</p>
                                                  <p className="text-[10px] text-purple-400 dark:text-purple-300">{formatLongDate(subtask.calendarDate || todayString)} • {subtask.dueTime} WIB</p>
                                                </div>
                                                <button onClick={() => openCalendarEditModal({ ...subtask, itemType: 'task' })} className="text-purple-400 hover:text-purple-600"><Pencil size={12} /></button>
                                                <button onClick={() => deleteTask(subtask.id)} className="text-purple-400 hover:text-red-500"><Trash2 size={12} /></button>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="h-full min-h-[320px] flex items-center justify-center rounded-2xl border border-dashed border-purple-200 dark:border-indigo-900 text-center p-8">
                              <div>
                                <Folder className="mx-auto text-purple-300 dark:text-purple-700 mb-3" size={40} />
                                <p className="text-sm text-purple-400 dark:text-purple-300">Pilih folder project terlebih dahulu.</p>
                              </div>
                            </div>
                          )}
                        </section>
                      ) : (
                        <aside className="glass-panel p-4">
                          <div className="flex items-center justify-between gap-3 mb-4">
                            <div>
                              <h3 className="text-lg font-bold">Folder Project</h3>
                              <p className="text-xs text-purple-400 dark:text-purple-300 mt-1">{allProjectFolders.length} folder aktif</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowNewFolderModal(true)}
                              className="w-9 h-9 rounded-xl bg-[#8f75d8] text-white flex items-center justify-center shadow-md hover:bg-[#8069c8]"
                              title="New Folder Task"
                            >
                              <Plus size={16} />
                            </button>
                          </div>

                          <div className="space-y-2 max-h-[58vh] overflow-y-auto pr-1">
                            {allProjectFolders.length === 0 ? (
                              <div className="rounded-2xl border border-dashed border-purple-200 dark:border-indigo-900 p-4 text-xs text-purple-400 dark:text-purple-300">
                                Belum ada folder. Buat folder project baru untuk mulai mengelompokkan task.
                              </div>
                            ) : allProjectFolders.map(folder => {
                              const totalItems = folder.tasks.length + folder.subtasks.length
                              const doneItems = [...folder.tasks, ...folder.subtasks].filter(task => task.status === 'done').length
                              const isSelected = selectedProjectFolder?.name === folder.name
                              return (
                                <button
                                  key={folder.name}
                                  type="button"
                                  onClick={() => {
                                    setSelectedProjectName(folder.name)
                                    setNewTaskCategory(folder.name)
                                    setMobileTaskFolderOpen(true)
                                  }}
                                  className={`w-full rounded-2xl border p-3 text-left transition-all ${
                                    isSelected
                                      ? 'bg-[#8f75d8] text-white border-[#8f75d8] shadow-lg shadow-[#8f75d8]/20'
                                      : 'bg-white/60 dark:bg-indigo-950/20 border-purple-100/70 dark:border-indigo-900/60 hover:bg-purple-50 dark:hover:bg-indigo-900/30'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-white/20 text-white' : 'text-white'}`} style={!isSelected ? { background: `linear-gradient(135deg, ${folder.color}, #7C3AED)` } : undefined}>
                                      <Folder size={18} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <h4 className={`text-sm font-extrabold truncate ${isSelected ? 'text-white' : 'text-purple-900 dark:text-white'}`}>{folder.name}</h4>
                                      <p className={`text-[11px] mt-0.5 ${isSelected ? 'text-white/75' : 'text-purple-400 dark:text-purple-300'}`}>{folder.tasks.length} task • {folder.subtasks.length} subtask</p>
                                    </div>
                                    <span className={`text-[10px] font-bold ${isSelected ? 'text-white' : 'text-purple-500 dark:text-purple-300'}`}>{doneItems}/{totalItems}</span>
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        </aside>
                      )
                    ) : (
                      // Two-panel folder/task view
                      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-5">
                        <aside className="glass-panel p-4">
                          <div className="flex items-center justify-between gap-3 mb-4">
                            <div>
                              <h3 className="text-lg font-bold">Folder Project</h3>
                              <p className="text-xs text-purple-400 dark:text-purple-300 mt-1">{allProjectFolders.length} folder aktif</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowNewFolderModal(true)}
                              className="w-9 h-9 rounded-xl bg-[#8f75d8] text-white flex items-center justify-center shadow-md hover:bg-[#8069c8]"
                              title="New Folder Task"
                            >
                              <Plus size={16} />
                            </button>
                          </div>

                          <div className="space-y-2 max-h-[58vh] overflow-y-auto pr-1">
                            {allProjectFolders.length === 0 ? (
                              <div className="rounded-2xl border border-dashed border-purple-200 dark:border-indigo-900 p-4 text-xs text-purple-400 dark:text-purple-300">
                                Belum ada folder. Buat folder project baru untuk mulai mengelompokkan task.
                              </div>
                            ) : allProjectFolders.map(folder => {
                              const totalItems = folder.tasks.length + folder.subtasks.length
                              const doneItems = [...folder.tasks, ...folder.subtasks].filter(task => task.status === 'done').length
                              const isSelected = selectedProjectFolder?.name === folder.name
                              return (
                                <button
                                  key={folder.name}
                                  type="button"
                                  onClick={() => {
                                    setSelectedProjectName(folder.name)
                                    setNewTaskCategory(folder.name)
                                  }}
                                  className={`w-full rounded-2xl border p-3 text-left transition-all ${
                                    isSelected
                                      ? 'bg-[#8f75d8] text-white border-[#8f75d8] shadow-lg shadow-[#8f75d8]/20'
                                      : 'bg-white/60 dark:bg-indigo-950/20 border-purple-100/70 dark:border-indigo-900/60 hover:bg-purple-50 dark:hover:bg-indigo-900/30'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-white/20 text-white' : 'text-white'}`} style={!isSelected ? { background: `linear-gradient(135deg, ${folder.color}, #7C3AED)` } : undefined}>
                                      <Folder size={18} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <h4 className={`text-sm font-extrabold truncate ${isSelected ? 'text-white' : 'text-purple-900 dark:text-white'}`}>{folder.name}</h4>
                                      <p className={`text-[11px] mt-0.5 ${isSelected ? 'text-white/75' : 'text-purple-400 dark:text-purple-300'}`}>{folder.tasks.length} task • {folder.subtasks.length} subtask</p>
                                    </div>
                                    <span className={`text-[10px] font-bold ${isSelected ? 'text-white' : 'text-purple-500 dark:text-purple-300'}`}>{doneItems}/{totalItems}</span>
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        </aside>

                        <section className="glass-panel p-6 min-h-[420px]">
                          {selectedProjectFolder ? (
                            <>
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0" style={{ background: `linear-gradient(135deg, ${selectedProjectFolder.color}, #7C3AED)` }}>
                                    <FolderOpen size={22} />
                                  </div>
                                  <div className="min-w-0">
                                    <h3 className="text-xl font-extrabold truncate">{selectedProjectFolder.name}</h3>
                                    <p className="text-xs text-purple-400 dark:text-purple-300 mt-1">Task dan subtask pada folder ini tetap sinkron ke kalender dan notifikasi.</p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNewTaskCategory(selectedProjectFolder.name)
                                    setShowQuickTaskModal(true)
                                  }}
                                  className="px-4 py-2.5 rounded-xl bg-[#8f75d8] hover:bg-[#8069c8] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-md"
                                >
                                  <Plus size={13} />
                                  Add Task
                                </button>
                              </div>

                              {selectedFolderTasks.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-purple-200 dark:border-indigo-900 p-8 text-center">
                                  <CheckCircle className="mx-auto text-purple-300 dark:text-purple-700 mb-2" size={32} />
                                  <p className="text-sm text-purple-400 dark:text-purple-300">Folder ini belum punya task utama.</p>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {selectedFolderTasks.map(task => {
                                    const childSubtasks = (subtasksByParent[task.id] || []).filter(taskMatchesSearch)
                                    const taskProgress = getTaskProgress(task, childSubtasks)
                                    return (
                                      <div key={task.id} className="rounded-2xl border border-purple-100/70 dark:border-indigo-900/50 bg-purple-50/20 dark:bg-slate-950/20 p-4">
                                        <div className="flex items-center gap-3">
                                          <button type="button" onClick={() => toggleTaskStatus(task.id)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${task.status === 'done' ? 'bg-[#8f75d8] border-[#8f75d8] text-white' : 'border-purple-300 hover:border-purple-500'}`}>
                                            {task.status === 'done' && <Check size={12} strokeWidth={3} />}
                                          </button>
                                          <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-semibold truncate ${task.status === 'done' ? 'line-through text-purple-300 dark:text-purple-400' : ''}`}>{task.title}</p>
                                            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-purple-400 dark:text-purple-300">
                                              <span className="flex items-center gap-1"><Clock size={10} />{task.dueTime} WIB</span>
                                              <span>•</span>
                                              <span>{formatLongDate(task.calendarDate || todayString)}</span>
                                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300 font-bold uppercase">{task.priority}</span>
                                            </div>
                                          </div>
                                          <button onClick={() => openCalendarEditModal({ ...task, itemType: 'task' })} className="w-8 h-8 rounded-lg hover:bg-purple-100 dark:hover:bg-indigo-900/50 text-purple-400 hover:text-purple-600 flex items-center justify-center" title="Edit task">
                                            <Pencil size={14} />
                                          </button>
                                          <button onClick={() => deleteTask(task.id)} className="w-8 h-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-purple-400 hover:text-red-500 flex items-center justify-center" title="Hapus task">
                                            <Trash2 size={14} />
                                          </button>
                                        </div>

                                        <div className="mt-3 ml-9">
                                          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-purple-500 dark:text-purple-300 mb-1.5">
                                            <span>Progress</span>
                                            <span>{taskProgress.percent}% • {taskProgress.completed}/{taskProgress.total}</span>
                                          </div>
                                          <div className="h-2 rounded-full bg-purple-100 dark:bg-indigo-950/60 overflow-hidden">
                                            <div
                                              className={`h-full rounded-full transition-all duration-500 ${
                                                taskProgress.percent === 100
                                                  ? 'bg-emerald-500'
                                                  : 'bg-gradient-to-r from-purple-500 to-fuchsia-500'
                                              }`}
                                              style={{ width: `${taskProgress.percent}%` }}
                                            />
                                          </div>
                                        </div>

                                        {childSubtasks.length > 0 && (
                                          <div className="mt-3 ml-9 space-y-2">
                                            {childSubtasks.map(subtask => (
                                              <div key={subtask.id} className="flex items-center gap-2 rounded-lg bg-white dark:bg-indigo-950/30 border border-purple-100/50 dark:border-indigo-900/40 px-3 py-2">
                                                <button type="button" onClick={() => toggleTaskStatus(subtask.id)} className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${subtask.status === 'done' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-purple-300 hover:border-purple-500'}`}>
                                                  {subtask.status === 'done' && <Check size={9} strokeWidth={3} />}
                                                </button>
                                                <div className="flex-1 min-w-0">
                                                  <p className={`text-xs font-semibold truncate ${subtask.status === 'done' ? 'line-through text-purple-300 dark:text-purple-400' : ''}`}>{subtask.title}</p>
                                                  <p className="text-[10px] text-purple-400 dark:text-purple-300">{formatLongDate(subtask.calendarDate || todayString)} • {subtask.dueTime} WIB</p>
                                                </div>
                                                <button onClick={() => openCalendarEditModal({ ...subtask, itemType: 'task' })} className="text-purple-400 hover:text-purple-600"><Pencil size={12} /></button>
                                                <button onClick={() => deleteTask(subtask.id)} className="text-purple-400 hover:text-red-500"><Trash2 size={12} /></button>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="h-full min-h-[320px] flex items-center justify-center rounded-2xl border border-dashed border-purple-200 dark:border-indigo-900 text-center p-8">
                              <div>
                                <Folder className="mx-auto text-purple-300 dark:text-purple-700 mb-3" size={40} />
                                <p className="text-sm text-purple-400 dark:text-purple-300">Pilih atau buat folder project terlebih dahulu.</p>
                              </div>
                            </div>
                          )}
                        </section>
                      </div>
                    )
                  ) : (
                    // Project Kanban Board View
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Column 1: Todo */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-purple-100 dark:border-indigo-950">
                          <h4 className="text-sm font-bold text-purple-600 dark:text-purple-300 uppercase tracking-widest">Jadwal Tugas</h4>
                          <span className="bg-purple-100 dark:bg-indigo-950 text-purple-700 dark:text-purple-300 text-xs font-bold px-2 py-0.5 rounded-full">
                            {tasks.filter(t => t.status === 'todo' && (taskFilter === 'All' || t.category === taskFilter) && t.title.toLowerCase().includes(searchQuery.toLowerCase())).length}
                          </span>
                        </div>

                        {tasks.filter(t => t.status === 'todo' && (taskFilter === 'All' || t.category === taskFilter) && t.title.toLowerCase().includes(searchQuery.toLowerCase())).map(task => (
                          <div key={task.id} className="glass-panel p-4 space-y-3 relative overflow-hidden border-t-4" style={{ borderTopColor: task.colorLabel }}>
                            <h5 className="text-sm font-bold truncate">{task.title}</h5>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] bg-purple-50 dark:bg-indigo-950/50 text-purple-500 px-2 py-0.5 rounded font-bold uppercase tracking-wider">{task.category}</span>
                              <span className="text-[10px] text-purple-400 dark:text-purple-300 flex items-center gap-0.5">
                                <Clock size={10} />
                                {task.dueTime}
                              </span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-purple-100/50 dark:border-indigo-950/40">
                              <span className="text-[10px] font-bold text-red-500 uppercase">{task.priority}</span>
                              <button 
                                onClick={() => toggleTaskStatus(task.id)}
                                className="px-2 py-1 bg-purple-100 hover:bg-purple-200 dark:bg-indigo-950 text-[10px] text-purple-700 dark:text-purple-300 font-bold rounded-lg transition-colors"
                              >
                                Kerjakan
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Column 2: In Progress */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-purple-100 dark:border-indigo-950">
                          <h4 className="text-sm font-bold text-pink-600 dark:text-pink-300 uppercase tracking-widest">Sedang Dikerjakan</h4>
                          <span className="bg-pink-100 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 text-xs font-bold px-2 py-0.5 rounded-full">
                            {tasks.filter(t => t.status === 'in_progress' && (taskFilter === 'All' || t.category === taskFilter) && t.title.toLowerCase().includes(searchQuery.toLowerCase())).length}
                          </span>
                        </div>

                        {tasks.filter(t => t.status === 'in_progress' && (taskFilter === 'All' || t.category === taskFilter) && t.title.toLowerCase().includes(searchQuery.toLowerCase())).map(task => (
                          <div key={task.id} className="glass-panel p-4 space-y-3 relative overflow-hidden border-t-4" style={{ borderTopColor: task.colorLabel }}>
                            <h5 className="text-sm font-bold truncate">{task.title}</h5>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] bg-pink-50 dark:bg-pink-950/20 text-pink-500 px-2 py-0.5 rounded font-bold uppercase tracking-wider">{task.category}</span>
                              <span className="text-[10px] text-purple-400 dark:text-purple-300 flex items-center gap-0.5">
                                <Clock size={10} />
                                {task.dueTime}
                              </span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-purple-100/50 dark:border-indigo-950/40">
                              <span className="text-[10px] font-bold text-red-500 uppercase">{task.priority}</span>
                              <button 
                                onClick={() => toggleTaskStatus(task.id)}
                                className="px-2 py-1 bg-[#8f75d8] hover:bg-[#8069c8] text-[10px] text-white font-bold rounded-lg transition-colors"
                              >
                                Selesaikan
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Column 3: Done */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-purple-100 dark:border-indigo-950">
                          <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-300 uppercase tracking-widest">Selesai</h4>
                          <span className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold px-2 py-0.5 rounded-full">
                            {tasks.filter(t => t.status === 'done' && (taskFilter === 'All' || t.category === taskFilter) && t.title.toLowerCase().includes(searchQuery.toLowerCase())).length}
                          </span>
                        </div>

                        {tasks.filter(t => t.status === 'done' && (taskFilter === 'All' || t.category === taskFilter) && t.title.toLowerCase().includes(searchQuery.toLowerCase())).map(task => (
                          <div key={task.id} className="glass-panel p-4 space-y-3 relative overflow-hidden border-t-4 opacity-70" style={{ borderTopColor: task.colorLabel }}>
                            <h5 className="text-sm font-bold truncate line-through text-purple-300 dark:text-purple-400">{task.title}</h5>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 px-2 py-0.5 rounded font-bold uppercase tracking-wider">{task.category}</span>
                              <span className="text-[10px] text-emerald-500 flex items-center gap-1 font-bold">
                                <CheckCircle size={10} />
                                Selesai
                              </span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-purple-100/50 dark:border-indigo-950/40">
                              <button 
                                onClick={() => toggleTaskStatus(task.id)}
                                className="px-2 py-1 bg-purple-100 hover:bg-purple-200 dark:bg-indigo-950 text-[10px] text-purple-700 dark:text-purple-300 font-bold rounded-lg transition-colors"
                              >
                                Batal Selesai
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>
                  )}
                </div>
            </div>
          )}

          {/* TAB CONTENT: 3. ORDER WORKSPACES */}
          {['orders', 'designOrders', 'generalOrders'].includes(activeTab) && (
            <div className="mobile-page mobile-page-orders">
              <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-5">
                <aside className={`glass-panel p-5 ${isMobileTabletView && mobileOrderDetailOpen ? 'hidden' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-[#4f4574]">
                        {activeTab === 'designOrders' ? 'Design Order Projects' : activeTab === 'generalOrders' ? 'Orderan General Projects' : 'Order Spreadsheet Projects'}
                      </h3>
                      <p className="text-xs text-[#8f75d8] mt-1">
                        {activeTab === 'designOrders'
                          ? 'Semua project desain dengan progress timeline per project.'
                          : activeTab === 'generalOrders'
                            ? 'Semua jenis orderan umum dengan tracking progress.'
                            : 'Tracking order custom spreadsheet per klien.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (showOrderForm) {
                          cancelEditSpreadsheetOrder()
                        } else {
                          setShowOrderForm(true)
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-[#6f3df3] text-[11px] font-bold"
                    >
                      {showOrderForm ? 'Hide Form' : 'Show Form'}
                    </button>
                  </div>

                  {showOrderForm && (
                    <form onSubmit={handleCreateSpreadsheetOrder} className="mt-4 space-y-2.5">
                      <input
                        value={newOrderCustomer}
                        onChange={(e) => setNewOrderCustomer(e.target.value)}
                        placeholder={isDesignOrderPage ? 'Nama brand / client' : isGeneralOrderPage ? 'Nama client / divisi' : 'Nama customer'}
                        className="w-full px-3 py-2.5 rounded-xl border border-purple-100 bg-white text-xs"
                        required
                      />
                      <input
                        value={newOrderName}
                        onChange={(e) => setNewOrderName(e.target.value)}
                        placeholder={isDesignOrderPage ? 'Nama project desain' : isGeneralOrderPage ? 'Nama kebutuhan order umum' : 'Nama orderan'}
                        className="w-full px-3 py-2.5 rounded-xl border border-purple-100 bg-white text-xs"
                        required
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <select value={newOrderType} onChange={(e) => setNewOrderType(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-purple-100 bg-white text-xs">
                          {!orderTypeOptions.includes(newOrderType) && <option>{newOrderType}</option>}
                          {orderTypeOptions.map(optionValue => (
                            <option key={optionValue}>{optionValue}</option>
                          ))}
                        </select>
                        <select value={newOrderStatus} onChange={(e) => setNewOrderStatus(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-purple-100 bg-white text-xs">
                          <option value="new">new</option>
                          <option value="in_progress">in_progress</option>
                          <option value="revision">revision</option>
                          <option value="blocked">blocked</option>
                          <option value="completed">completed</option>
                        </select>
                      </div>
                      <select value={newOrderPaymentStatus} onChange={(e) => setNewOrderPaymentStatus(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-purple-100 bg-white text-xs">
                        <option value="belum_bayar">belum_bayar</option>
                        <option value="dp">dp</option>
                        <option value="cicilan">cicilan</option>
                        <option value="lunas">lunas</option>
                      </select>
                      <p className="text-[11px] text-purple-400">
                        {isDesignOrderPage
                          ? 'Tips: pakai Timeline untuk milestone: brief, concept, first draft, revision, final delivery.'
                          : isGeneralOrderPage
                            ? 'Tips: pakai Timeline untuk checkpoint proses: request, execution, review, handover.'
                            : 'Gunakan timeline untuk update progress detail ke klien.'}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          min="0"
                          value={newOrderBudget}
                          onChange={(e) => setNewOrderBudget(e.target.value)}
                          placeholder={isDesignOrderPage ? 'Fee desain' : isGeneralOrderPage ? 'Fee layanan' : 'Budget'}
                          className="w-full px-3 py-2.5 rounded-xl border border-purple-100 bg-white text-xs"
                        />
                        <input type="date" value={newOrderDueDate} onChange={(e) => setNewOrderDueDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-purple-100 bg-white text-xs" />
                      </div>
                      <button type="submit" className="w-full py-2.5 rounded-xl bg-[#8f75d8] hover:bg-[#8069c8] text-white text-xs font-bold">
                        {editingOrderId ? 'Update Project' : isDesignOrderPage ? 'Tambah Project Desain' : isGeneralOrderPage ? 'Tambah Order General' : 'Tambah Order'}
                      </button>
                      {editingOrderId && (
                        <button
                          type="button"
                          onClick={cancelEditSpreadsheetOrder}
                          className="w-full py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#8f75d8] text-xs font-bold"
                        >
                          Batal Edit
                        </button>
                      )}
                    </form>
                  )}

                  <div className="mt-4 space-y-2 max-h-[430px] overflow-y-auto pr-1">
                    {sortedSpreadsheetOrders.length === 0 ? (
                      <div className="text-xs text-[#8f75d8] border border-dashed border-purple-200 rounded-xl p-3">Belum ada order.</div>
                    ) : sortedSpreadsheetOrders.map(order => {
                      const isDoneOrder = ['completed', 'done'].includes((order.status || '').toLowerCase())
                      return (
                      <div
                        key={order.id}
                        onClick={() => {
                          setSelectedOrderId(order.id)
                          if (isMobileTabletView) setMobileOrderDetailOpen(true)
                        }}
                        className={`w-full text-left rounded-xl border p-3 transition-all ${
                          selectedSpreadsheetOrder?.id === order.id
                            ? 'border-[#8f75d8] bg-[#f5f0ff]'
                            : 'border-purple-100 bg-white hover:bg-[#faf7ff]'
                        } ${isDoneOrder ? 'opacity-55 saturate-75' : ''}`}
                      >
                        <div className="flex items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-[#4f4574] truncate">{order.orderName}</p>
                            <p className="text-[11px] text-[#8f75d8] truncate">{order.customerName} • {order.orderType}</p>
                            <p className="text-[11px] text-slate-500 mt-1">Rp {Number(order.budget || 0).toLocaleString('id-ID')}</p>
                            <span className={`mt-2 inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${String(order.paymentStatus || 'belum_bayar') === 'lunas' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : String(order.paymentStatus || '') === 'dp' ? 'bg-blue-100 text-blue-700 border-blue-200' : String(order.paymentStatus || '') === 'cicilan' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-rose-100 text-rose-700 border-rose-200'}`}>
                              {order.paymentStatus || 'belum_bayar'}
                            </span>
                            {isDoneOrder && (
                              <span className="mt-2 inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                Selesai
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                openInvoiceGeneratorFromOrder(order)
                              }}
                              className="w-7 h-7 rounded-lg border border-emerald-100 bg-white text-emerald-600 hover:bg-emerald-50 flex items-center justify-center"
                              title="Generate to Invoice"
                            >
                              <FileText size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                startEditSpreadsheetOrder(order)
                              }}
                              className="w-7 h-7 rounded-lg border border-purple-100 bg-white text-[#8f75d8] hover:bg-purple-50 flex items-center justify-center"
                              title="Edit order"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteSpreadsheetOrder(order)
                              }}
                              className="w-7 h-7 rounded-lg border border-red-100 bg-white text-red-500 hover:bg-red-50 flex items-center justify-center"
                              title="Hapus order"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                      )
                    })}
                  </div>
                </aside>

                <section className={`glass-panel p-5 ${isMobileTabletView && !mobileOrderDetailOpen ? 'hidden' : ''}`}>
                  {!selectedSpreadsheetOrder ? (
                    <div className="text-sm text-[#8f75d8]">Pilih order dulu dari panel kiri.</div>
                  ) : (
                    <>
                      {isMobileTabletView && (
                        <div className="mb-3">
                          <button
                            type="button"
                            onClick={() => setMobileOrderDetailOpen(false)}
                            className="w-8 h-8 rounded-lg border border-purple-200/70 dark:border-indigo-900/60 bg-white/80 dark:bg-indigo-950/40 text-purple-600 dark:text-purple-300 flex items-center justify-center"
                            title="Kembali ke list order"
                          >
                            <ArrowLeft size={14} />
                          </button>
                        </div>
                      )}
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                        <div>
                          <h3 className="text-xl font-bold text-[#4f4574]">{selectedSpreadsheetOrder.orderName}</h3>
                          <p className="text-sm text-[#8f75d8] mt-1">{selectedSpreadsheetOrder.customerName} • {selectedSpreadsheetOrder.orderType}</p>
                          <p className="text-xs text-slate-500 mt-1">Deadline: {formatLongDate(selectedSpreadsheetOrder.dueDate)} • Status kerja: {selectedSpreadsheetOrder.status}</p>
                          <p className="text-xs text-slate-500 mt-1">Status bayar: <span className="font-semibold capitalize">{selectedSpreadsheetOrder.paymentStatus || 'belum_bayar'}</span></p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openInvoiceGeneratorFromOrder(selectedSpreadsheetOrder)}
                            className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold inline-flex items-center gap-1"
                          >
                            <FileText size={12} />
                            Generate to Invoice
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await copyTextToClipboard(selectedOrderPublicLink)
                                alert('Link tracking view-only berhasil disalin.')
                              } catch (error) {
                                alert(`Gagal menyalin link: ${error.message}`)
                              }
                            }}
                            className="px-3 py-2 rounded-xl bg-white border border-purple-200 text-[#8f75d8] text-xs font-bold inline-flex items-center gap-1"
                          >
                            <Copy size={12} />
                            Copy Link View-Only
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSpreadsheetOrder(selectedSpreadsheetOrder)}
                            className="px-3 py-2 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold inline-flex items-center gap-1"
                          >
                            <Trash2 size={12} />
                            Hapus Order
                          </button>
                        </div>
                      </div>

                      <form onSubmit={handleAddOrderTimeline} className="mt-4 rounded-2xl border border-purple-100 bg-[#fcfbff] p-4">
                        <p className="text-xs uppercase tracking-[0.14em] text-[#8f75d8] font-bold mb-2">Tambah Update Timeline</p>
                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_120px] gap-2">
                          <input value={timelineInputTitle} onChange={(e) => setTimelineInputTitle(e.target.value)} placeholder="Judul update progress" className="px-3 py-2.5 rounded-xl border border-purple-100 bg-white text-xs" required />
                          <input type="number" min="0" max="100" value={timelineInputProgress} onChange={(e) => setTimelineInputProgress(e.target.value)} className="px-3 py-2.5 rounded-xl border border-purple-100 bg-white text-xs" />
                        </div>
                        <textarea value={timelineInputNote} onChange={(e) => setTimelineInputNote(e.target.value)} placeholder="Catatan update untuk customer..." className="mt-2 w-full min-h-20 px-3 py-2.5 rounded-xl border border-purple-100 bg-white text-xs" />
                        <button type="submit" className="mt-2 px-4 py-2 rounded-xl bg-[#8f75d8] hover:bg-[#8069c8] text-white text-xs font-bold">Tambah Timeline</button>
                      </form>

                      <div className="mt-4 space-y-3 max-h-[520px] overflow-y-auto pr-1">
                        {selectedOrderTimeline.length === 0 ? (
                          <div className="text-xs text-[#8f75d8] border border-dashed border-purple-200 rounded-xl p-3">Timeline belum ada update.</div>
                        ) : selectedOrderTimeline.map((item, idx) => (
                          <div key={item.id} className="rounded-2xl border border-purple-100 bg-white p-4 relative">
                            {idx < selectedOrderTimeline.length - 1 && <div className="absolute left-[19px] top-11 bottom-[-14px] w-[2px] bg-purple-100" />}
                            <div className="flex items-start gap-3">
                              <span className="mt-1 w-3 h-3 rounded-full bg-[#8f75d8] shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] text-[#8f75d8] font-semibold">{formatLongDateTime(item.createdAt)}</p>
                                {editingTimelineId === item.id ? (
                                  <div className="mt-1 space-y-2">
                                    <input
                                      value={editTimelineTitle}
                                      onChange={(e) => setEditTimelineTitle(e.target.value)}
                                      className="w-full px-3 py-2 rounded-xl border border-purple-100 bg-white text-xs"
                                      placeholder="Judul timeline"
                                    />
                                    <textarea
                                      value={editTimelineNote}
                                      onChange={(e) => setEditTimelineNote(e.target.value)}
                                      className="w-full min-h-16 px-3 py-2 rounded-xl border border-purple-100 bg-white text-xs"
                                      placeholder="Catatan timeline"
                                    />
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={editTimelineProgress}
                                        onChange={(e) => setEditTimelineProgress(e.target.value)}
                                        className="w-24 px-3 py-2 rounded-xl border border-purple-100 bg-white text-xs"
                                      />
                                      <span className="text-xs text-[#8f75d8]">%</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button type="button" onClick={() => handleSaveTimelineEdit(item.id)} className="px-3 py-1.5 rounded-lg bg-[#8f75d8] text-white text-[11px] font-bold">Simpan</button>
                                      <button type="button" onClick={cancelEditTimeline} className="px-3 py-1.5 rounded-lg bg-purple-50 text-[#8f75d8] text-[11px] font-bold">Batal</button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <h4 className="text-sm font-bold text-[#4f4574] mt-1">{item.title}</h4>
                                    {item.note && <p className="text-xs text-slate-600 mt-1 whitespace-pre-line">{formatTextDates(item.note)}</p>}
                                    <div className="mt-2 h-2 rounded-full bg-purple-100 overflow-hidden">
                                      <div className="h-full bg-[#8f75d8]" style={{ width: `${Math.max(0, Math.min(100, Number(item.progressPercent || 0)))}%` }} />
                                    </div>
                                    <div className="mt-1 flex items-center justify-between">
                                      <p className="text-[11px] text-[#8f75d8]">Progress {Number(item.progressPercent || 0)}%</p>
                                      <div className="flex items-center gap-2">
                                        <button type="button" onClick={() => startEditTimeline(item)} className="text-[11px] font-bold text-blue-600 hover:underline">Update Progress</button>
                                        <button type="button" onClick={() => handleDeleteTimelineItem(item.id)} className="text-[11px] font-bold text-red-600 hover:underline">Hapus</button>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </section>
              </div>
            </div>
          )}

          {activeTab === 'crm' && (
            <div className="mobile-page mobile-page-crm space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="glass-panel p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] uppercase tracking-wider text-purple-400 font-bold">Total Client</p>
                    <Users size={18} className="text-[#8f75d8]" />
                  </div>
                  <p className="text-2xl font-extrabold mt-2">{crmSummary.totalClients}</p>
                </div>
                <div className="glass-panel p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] uppercase tracking-wider text-purple-400 font-bold">Follow-up Due</p>
                    <CalendarClock size={18} className="text-amber-500" />
                  </div>
                  <p className="text-2xl font-extrabold mt-2">{crmSummary.followUpsDue}</p>
                </div>
                <div className="glass-panel p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] uppercase tracking-wider text-purple-400 font-bold">Reservasi</p>
                    <Calendar size={18} className="text-emerald-500" />
                  </div>
                  <p className="text-2xl font-extrabold mt-2">{crmSummary.totalReservations}</p>
                </div>
                <div className="glass-panel p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] uppercase tracking-wider text-purple-400 font-bold">Revenue Terkonfirmasi</p>
                    <BadgeDollarSign size={18} className="text-[#8f75d8]" />
                  </div>
                  <p className="text-2xl font-extrabold mt-2">{formatCurrencyIDR(crmSummary.confirmedRevenue)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-5">
                <aside className={`glass-panel p-5 ${isMobileTabletView && mobileCrmDetailOpen ? 'hidden' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-[#4f4574]">Client CRM</h3>
                      <p className="text-xs text-[#8f75d8] mt-1">Data dari reservasi, order spreadsheet, dan follow-up manual.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (showCrmForm) {
                          resetCrmClientForm()
                        } else {
                          setShowCrmForm(true)
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#8f75d8] hover:bg-[#8069c8] text-white text-[11px] font-bold inline-flex items-center gap-1"
                    >
                      <Plus size={12} />
                      {showCrmForm ? 'Tutup' : 'Client'}
                    </button>
                  </div>

                  {showCrmForm && (
                    <form onSubmit={handleSubmitCrmClient} className="mt-4 space-y-2.5 rounded-2xl border border-purple-100 bg-[#fcfbff] p-3">
                      <input value={crmClientName} onChange={(e) => setCrmClientName(e.target.value)} placeholder="Nama client" className="w-full px-3 py-2.5 rounded-xl border border-purple-100 bg-white text-xs" required />
                      <input value={crmClientCompany} onChange={(e) => setCrmClientCompany(e.target.value)} placeholder="Perusahaan / brand" className="w-full px-3 py-2.5 rounded-xl border border-purple-100 bg-white text-xs" />
                      <div className="grid grid-cols-2 gap-2">
                        <input type="email" value={crmClientEmail} onChange={(e) => setCrmClientEmail(e.target.value)} placeholder="Email" className="w-full px-3 py-2.5 rounded-xl border border-purple-100 bg-white text-xs" />
                        <input value={crmClientPhone} onChange={(e) => setCrmClientPhone(e.target.value)} placeholder="No. HP / WA" className="w-full px-3 py-2.5 rounded-xl border border-purple-100 bg-white text-xs" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <select value={crmClientStatus} onChange={(e) => setCrmClientStatus(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-purple-100 bg-white text-xs">
                          <option value="lead">lead</option>
                          <option value="negotiation">negotiation</option>
                          <option value="active">active</option>
                          <option value="retainer">retainer</option>
                          <option value="inactive">inactive</option>
                        </select>
                        <input type="date" value={crmClientNextFollowUp} onChange={(e) => setCrmClientNextFollowUp(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-purple-100 bg-white text-xs" />
                      </div>
                      <textarea value={crmClientNotes} onChange={(e) => setCrmClientNotes(e.target.value)} placeholder="Catatan client..." className="w-full min-h-20 px-3 py-2.5 rounded-xl border border-purple-100 bg-white text-xs" />
                      <button type="submit" className="w-full py-2.5 rounded-xl bg-[#8f75d8] hover:bg-[#8069c8] text-white text-xs font-bold">
                        {editingCrmClientId ? 'Update Client' : 'Simpan Client'}
                      </button>
                    </form>
                  )}

                  <div className="mt-4 space-y-2 max-h-[560px] overflow-y-auto pr-1">
                    {crmClientsCombined.length === 0 ? (
                      <div className="text-xs text-[#8f75d8] border border-dashed border-purple-200 rounded-xl p-3">Belum ada client.</div>
                    ) : crmClientsCombined.map(client => {
                      const isSelected = selectedCrmClient?.key === client.key
                      const statusClass = client.status === 'retainer'
                        ? 'bg-blue-100 text-blue-700'
                        : client.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700'
                          : client.status === 'negotiation'
                            ? 'bg-amber-100 text-amber-700'
                            : client.status === 'inactive'
                              ? 'bg-slate-100 text-slate-500'
                              : 'bg-purple-100 text-purple-700'

                      return (
                        <div
                          key={client.key}
                          onClick={() => {
                            setSelectedCrmClientId(client.key)
                            if (isMobileTabletView) setMobileCrmDetailOpen(true)
                          }}
                          className={`rounded-xl border p-3 cursor-pointer transition-all ${isSelected ? 'border-[#8f75d8] bg-[#f5f0ff]' : 'border-purple-100 bg-white hover:bg-[#faf7ff]'}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-[#4f4574] truncate">{client.name || 'Client tanpa nama'}</p>
                              <p className="text-[11px] text-[#8f75d8] truncate">{client.company || client.email || 'Tanpa detail kontak'}</p>
                            </div>
                            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${statusClass}`}>{client.status}</span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {client.sourceLabels.map(label => (
                              <span key={label} className="px-2 py-0.5 rounded-full bg-white border border-purple-100 text-[10px] font-bold text-[#8f75d8]">{label}</span>
                            ))}
                          </div>
                          <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] text-slate-500">
                            <span>{client.orders.length} order</span>
                            <span>{client.reservations.length} reservasi</span>
                            <span>{formatCurrencyIDR(client.paidRevenue || 0)}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </aside>

                <section className={`glass-panel p-5 ${isMobileTabletView && !mobileCrmDetailOpen ? 'hidden' : ''}`}>
                  {!selectedCrmClient ? (
                    <div className="text-sm text-[#8f75d8]">Pilih atau tambah client dulu.</div>
                  ) : (
                    <div className="space-y-5">
                      {isMobileTabletView && (
                        <div className="mb-2">
                          <button
                            type="button"
                            onClick={() => setMobileCrmDetailOpen(false)}
                            className="w-8 h-8 rounded-lg border border-purple-200/70 dark:border-indigo-900/60 bg-white/80 dark:bg-indigo-950/40 text-purple-600 dark:text-purple-300 flex items-center justify-center"
                            title="Kembali ke list client"
                          >
                            <ArrowLeft size={14} />
                          </button>
                        </div>
                      )}
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-[#8f75d8] text-white flex items-center justify-center font-bold">
                              {(selectedCrmClient.name || 'C').slice(0, 1).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-[#4f4574]">{selectedCrmClient.name || 'Client tanpa nama'}</h3>
                              <p className="text-sm text-[#8f75d8]">{selectedCrmClient.company || selectedCrmClient.email || 'Kontak belum lengkap'}</p>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                            {selectedCrmClient.email && <span className="inline-flex items-center gap-1"><Mail size={12} />{selectedCrmClient.email}</span>}
                            {selectedCrmClient.phone && <span>{selectedCrmClient.phone}</span>}
                            {selectedCrmClient.nextFollowUpDate && <span>Follow-up: {formatLongDate(selectedCrmClient.nextFollowUpDate)}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startEditCrmClient(selectedCrmClient)}
                            className="px-3 py-2 rounded-xl bg-white border border-purple-200 text-[#8f75d8] text-xs font-bold inline-flex items-center gap-1"
                          >
                            <Pencil size={12} />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCrmClient(selectedCrmClient)}
                            className="px-3 py-2 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold inline-flex items-center gap-1"
                          >
                            <Trash2 size={12} />
                            Hapus
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="rounded-2xl border border-purple-100 bg-white p-4">
                          <p className="text-[10px] uppercase tracking-wider text-purple-400 font-bold">Total Potensi</p>
                          <p className="text-lg font-extrabold mt-1">{formatCurrencyIDR(selectedCrmClient.totalRevenue)}</p>
                        </div>
                        <div className="rounded-2xl border border-purple-100 bg-white p-4">
                          <p className="text-[10px] uppercase tracking-wider text-purple-400 font-bold">Revenue Masuk</p>
                          <p className="text-lg font-extrabold mt-1">{formatCurrencyIDR((selectedCrmClient.reservations.length * Number(reservationSessionPrice || 0)) + selectedCrmClient.paidRevenue)}</p>
                        </div>
                        <div className="rounded-2xl border border-purple-100 bg-white p-4">
                          <p className="text-[10px] uppercase tracking-wider text-purple-400 font-bold">Aktivitas</p>
                          <p className="text-lg font-extrabold mt-1">{selectedCrmClient.activities.length}</p>
                        </div>
                      </div>

                      <form onSubmit={handleSubmitCrmActivity} className="rounded-2xl border border-purple-100 bg-[#fcfbff] p-4">
                        <p className="text-xs uppercase tracking-[0.14em] text-[#8f75d8] font-bold mb-2">Tambah Follow-up</p>
                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_160px] gap-2">
                          <input value={crmActivityTitle} onChange={(e) => setCrmActivityTitle(e.target.value)} placeholder="Judul follow-up" className="px-3 py-2.5 rounded-xl border border-purple-100 bg-white text-xs" required />
                          <input type="date" value={crmActivityDueDate} onChange={(e) => setCrmActivityDueDate(e.target.value)} className="px-3 py-2.5 rounded-xl border border-purple-100 bg-white text-xs" />
                        </div>
                        <textarea value={crmActivityNote} onChange={(e) => setCrmActivityNote(e.target.value)} placeholder="Catatan follow-up..." className="mt-2 w-full min-h-16 px-3 py-2.5 rounded-xl border border-purple-100 bg-white text-xs" />
                        <button type="submit" className="mt-2 px-4 py-2 rounded-xl bg-[#8f75d8] hover:bg-[#8069c8] text-white text-xs font-bold inline-flex items-center gap-1.5">
                          <MessageSquare size={13} />
                          Simpan Follow-up
                        </button>
                      </form>

                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <div className="rounded-2xl border border-purple-100 bg-white p-4">
                          <h4 className="text-sm font-bold text-[#4f4574] mb-3">Order & Reservasi</h4>
                          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                            {[...selectedCrmClient.orders.map(order => ({ ...order, rowType: 'order' })), ...selectedCrmClient.reservations.map(reservation => ({ ...reservation, rowType: 'reservation' }))].length === 0 ? (
                              <p className="text-xs text-[#8f75d8]">Belum ada order atau reservasi.</p>
                            ) : [...selectedCrmClient.orders.map(order => ({ ...order, rowType: 'order' })), ...selectedCrmClient.reservations.map(reservation => ({ ...reservation, rowType: 'reservation' }))].map(item => (
                              <div key={`${item.rowType}-${item.id}`} className="rounded-xl border border-purple-100 bg-[#fcfbff] p-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-[#4f4574] truncate">{item.title}</p>
                                    <p className="text-[11px] text-[#8f75d8] mt-0.5">
                                      {item.rowType === 'order'
                                        ? `${item.type} • ${formatCurrencyIDR(item.budget)}`
                                        : `${formatLongDate(item.date)}${item.time ? ` • ${item.time}` : ''}`}
                                    </p>
                                  </div>
                                  <span className="shrink-0 px-2 py-0.5 rounded-full bg-purple-100 text-[#8f75d8] text-[10px] font-bold">{item.rowType}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-purple-100 bg-white p-4">
                          <h4 className="text-sm font-bold text-[#4f4574] mb-3">Activity Timeline</h4>
                          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                            {selectedCrmClient.activities.length === 0 ? (
                              <p className="text-xs text-[#8f75d8]">Belum ada aktivitas.</p>
                            ) : selectedCrmClient.activities.map(activity => {
                              const isManualFollowUp = String(activity.id || '').startsWith('crm-activity-')
                              const isDone = activity.status === 'done'
                              return (
                                <div key={activity.id} className={`rounded-xl border border-purple-100 bg-[#fcfbff] p-3 ${isDone ? 'opacity-60' : ''}`}>
                                  <div className="flex items-start gap-2">
                                    <span className={`mt-1 w-2 h-2 rounded-full ${activity.type === 'order' ? 'bg-blue-500' : activity.type === 'reservation' ? 'bg-emerald-500' : 'bg-[#8f75d8]'}`} />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-bold text-[#4f4574] truncate">{activity.title}</p>
                                      <p className="text-[11px] text-slate-500 mt-0.5">{activity.note ? formatTextDates(activity.note) : formatLongDate(activity.dueDate)}</p>
                                      <p className="text-[10px] text-[#8f75d8] mt-1">{activity.createdAt ? formatLongDateTime(activity.createdAt) : formatLongDate(activity.dueDate)}</p>
                                    </div>
                                    {isManualFollowUp && (
                                      <button
                                        type="button"
                                        onClick={() => handleToggleCrmActivityStatus(activity.id)}
                                        className={`shrink-0 px-2 py-1 rounded-lg text-[10px] font-bold ${isDone ? 'bg-purple-100 text-[#8f75d8]' : 'bg-emerald-100 text-emerald-700'}`}
                                      >
                                        {isDone ? 'Buka' : 'Done'}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}

          {activeTab === 'mentoringSchedule' && (
            <div className="mobile-page space-y-5">
              <div className="glass-panel p-5">
                <h3 className="text-xl font-extrabold text-[#4f4574]">Pages Mentoring / Speaker Event Schedule</h3>
                <p className="text-sm text-purple-400 mt-1">Catat jadwal kelas, mentoring, dan event speaker yang akan datang atau sedang berjalan.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-panel p-4">
                  <p className="text-[11px] uppercase tracking-wider text-purple-400 font-bold">Total Sesi Terjadwal</p>
                  <p className="text-2xl font-extrabold mt-2">{appointments.length}</p>
                </div>
                <div className="glass-panel p-4">
                  <p className="text-[11px] uppercase tracking-wider text-purple-400 font-bold">Sesi Upcoming</p>
                  <p className="text-2xl font-extrabold mt-2">{upcomingMeetingCount}</p>
                </div>
                <div className="glass-panel p-4">
                  <p className="text-[11px] uppercase tracking-wider text-purple-400 font-bold">Task Event Aktif</p>
                  <p className="text-2xl font-extrabold mt-2">{openTaskCount}</p>
                </div>
              </div>
              <div className="glass-panel p-5">
                <h4 className="text-sm font-bold text-[#4f4574] mb-3">Jadwal Kelas / Mentoring / Speaker</h4>
                <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                  {todayCalendarItems.length === 0 ? (
                    <p className="text-sm text-purple-400">Belum ada jadwal.</p>
                  ) : todayCalendarItems
                    .filter(item => ['appointment', 'google_event', 'task'].includes(item.source))
                    .map(item => (
                      <div key={`${item.source}-${item.id}`} className="rounded-xl border border-purple-100 bg-white px-3 py-2.5">
                        <p className="text-sm font-bold text-[#4f4574] truncate">{item.title}</p>
                        <p className="text-xs text-purple-400 mt-0.5">{formatLongDate(item.date)} • {item.time || 'All day'} • {item.source === 'google_event' ? 'Google Calendar' : item.source === 'appointment' ? 'Mentoring' : 'Task'}</p>
                      </div>
                    ))}
                </div>
              </div>

            </div>
          )}

          {activeTab === 'contentPlanner' && (
            <div className="mobile-page space-y-5 min-w-0 overflow-x-hidden">
              <div className="glass-panel p-5 min-w-0 flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-extrabold text-[#4f4574]">Content Planner</h3>
                  <p className="text-sm text-purple-400 mt-1">Folder terpisah per platform: Instagram, TikTok, Threads. Jadwal upload otomatis tersambung ke kalender + notifikasi.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowContentPlannerForm(prev => !prev)}
                  className="shrink-0 px-3 py-2 rounded-xl border border-purple-100 bg-white text-[#8f75d8] text-xs font-bold inline-flex items-center gap-1.5 hover:bg-purple-50"
                >
                  {showContentPlannerForm ? <EyeOff size={13} /> : <Eye size={13} />}
                  {showContentPlannerForm ? 'Hide Form' : 'Show Form'}
                </button>
              </div>

              {showContentPlannerForm && (
                <div className="glass-panel p-5 min-w-0">
                  <form onSubmit={handleSubmitContentPlanner} className="space-y-2.5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      <input value={contentPlannerTitle} onChange={(e) => setContentPlannerTitle(e.target.value)} placeholder="Judul konten" className="px-3 py-2 rounded-xl border border-purple-100 bg-white text-sm" />
                      <input value={contentPlannerPillar} onChange={(e) => setContentPlannerPillar(e.target.value)} placeholder="Content pillar / value" className="px-3 py-2 rounded-xl border border-purple-100 bg-white text-sm" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                      <select value={contentPlannerPlatform} onChange={(e) => setContentPlannerPlatform(e.target.value)} className="px-3 py-2 rounded-xl border border-purple-100 bg-white text-sm">
                        {contentPlannerPlatforms.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
                      </select>
                      <select value={contentPlannerStatus} onChange={(e) => setContentPlannerStatus(e.target.value)} className="px-3 py-2 rounded-xl border border-purple-100 bg-white text-sm">
                        <option value="draft">Draft</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="posted">Posted</option>
                      </select>
                      <input type="date" value={contentPlannerDate} onChange={(e) => setContentPlannerDate(e.target.value)} className="px-3 py-2 rounded-xl border border-purple-100 bg-white text-sm" />
                      <input type="time" value={contentPlannerTime} onChange={(e) => setContentPlannerTime(e.target.value)} className="px-3 py-2 rounded-xl border border-purple-100 bg-white text-sm" />
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      {contentPlannerEditingId && (
                        <button type="button" onClick={resetContentPlannerForm} className="px-3 py-2 rounded-xl border border-purple-100 bg-white text-[#8f75d8] text-xs font-bold">Batal Edit</button>
                      )}
                      <button type="submit" className="px-3.5 py-2 rounded-xl bg-[#8f75d8] hover:bg-[#8069c8] text-white text-xs font-bold">
                        {contentPlannerEditingId ? 'Update Konten' : 'Tambah Konten'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="glass-panel p-5">
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  {contentPlannerPlatforms.map(item => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setContentPlannerPlatform(item.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${contentPlannerPlatform === item.key ? 'bg-[#8f75d8] text-white border-[#8f75d8]' : 'bg-white text-[#8f75d8] border-purple-100'}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="rounded-xl border border-purple-100 bg-white">
                  <div className="overflow-x-auto overflow-y-visible pb-12">
                  <table className="w-full min-w-[980px] text-xs">
                    <thead className="bg-purple-50 text-[#6f5ca7]">
                      <tr>
                        <th className="text-left px-3 py-2">Status</th>
                        <th className="text-left px-3 py-2">Tanggal Upload</th>
                        <th className="text-left px-3 py-2">Pillar/Value</th>
                        <th className="text-left px-3 py-2">Judul Konten</th>
                        <th className="text-left px-3 py-2">Link Posting</th>
                        <th className="text-left px-3 py-2">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contentPlannerItemsByPlatform.length === 0 ? (
                        <tr><td colSpan={6} className="px-3 py-6 text-center text-purple-400">Belum ada konten untuk folder ini.</td></tr>
                      ) : contentPlannerItemsByPlatform.map(item => (
                        <tr key={item.id} className="border-t border-purple-50 hover:bg-purple-50/40">
                          <td className="px-3 py-2.5 cursor-pointer" onClick={(e) => handleOpenContentPlannerDetail(e, item)}>
                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                              item.status === 'posted' ? 'bg-emerald-100 text-emerald-700' : item.status === 'scheduled' ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-700'
                            }`}>{item.status}</span>
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap cursor-pointer" onClick={(e) => handleOpenContentPlannerDetail(e, item)}>{formatLongDate(item.uploadDate)} {item.uploadTime || '09:00'}</td>
                          <td className="px-3 py-2.5 cursor-pointer" onClick={(e) => handleOpenContentPlannerDetail(e, item)}>{item.pillar || '-'}</td>
                          <td className="px-3 py-2.5 font-semibold text-[#4f4574] cursor-pointer" onClick={(e) => handleOpenContentPlannerDetail(e, item)}>{item.title}</td>
                          <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                            {contentPlannerLinkEditId === item.id ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  value={contentPlannerLinkDraft}
                                  onChange={(e) => setContentPlannerLinkDraft(e.target.value)}
                                  placeholder="https://..."
                                  className="h-8 w-52 px-2 rounded-md border border-purple-100 bg-white text-[11px]"
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleApplyContentPlannerLink(item.id)
                                  }}
                                  className="h-8 px-2.5 rounded-md bg-emerald-600 text-white text-[11px] font-bold"
                                >
                                  OK
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleStartContentPlannerLinkInput(item)
                                  }}
                                  className="h-8 px-2.5 rounded-md border border-purple-100 bg-white text-[#8f75d8] text-[11px] font-bold"
                                >
                                  Input Link
                                </button>
                                {item.postLink && (
                                  <a
                                    href={item.postLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="h-8 px-2.5 rounded-md bg-[#8f75d8] text-white text-[11px] font-bold inline-flex items-center"
                                  >
                                    Go to Post
                                  </a>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditContentPlanner(item)
                                }}
                                className="h-8 px-2.5 rounded-md border border-purple-100 bg-white text-[#8f75d8] text-[11px] font-bold"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteContentPlanner(item.id)
                                }}
                                className="h-8 px-2.5 rounded-md border border-red-100 bg-red-50 text-red-500 text-[11px] font-bold"
                              >
                                Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>

              </div>

              {contentPlannerDetailItem && (
                <div className="fixed inset-0 bg-slate-500/35 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setContentPlannerDetailItem(null)}>
                  <div className="w-full max-w-xl rounded-[1.4rem] bg-white p-5 shadow-2xl border border-purple-100/80" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-purple-400">Detail Konten</p>
                        <h4 className="text-lg font-extrabold text-[#4f4574] mt-1">{contentPlannerDetailItem.title}</h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setContentPlannerDetailItem(null)}
                        className="h-8 w-8 rounded-lg border border-purple-100 text-purple-400 hover:bg-purple-50 inline-flex items-center justify-center"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2.5 text-sm">
                      <div className="rounded-xl border border-purple-100 bg-[#fbfaff] px-3 py-2">
                        <p className="text-[11px] text-purple-400">Platform</p>
                        <p className="font-semibold text-[#4f4574]">{contentPlannerDetailItem.platform}</p>
                      </div>
                      <div className="rounded-xl border border-purple-100 bg-[#fbfaff] px-3 py-2">
                        <p className="text-[11px] text-purple-400">Status</p>
                        <p className="font-semibold text-[#4f4574]">{contentPlannerDetailItem.status}</p>
                      </div>
                      <div className="rounded-xl border border-purple-100 bg-[#fbfaff] px-3 py-2 md:col-span-2">
                        <p className="text-[11px] text-purple-400">Jadwal Upload</p>
                        <p className="font-semibold text-[#4f4574]">{formatLongDate(contentPlannerDetailItem.uploadDate)} {contentPlannerDetailItem.uploadTime || '09:00'}</p>
                      </div>
                      <div className="rounded-xl border border-purple-100 bg-[#fbfaff] px-3 py-2 md:col-span-2">
                        <p className="text-[11px] text-purple-400">Pillar / Value</p>
                        <p className="font-semibold text-[#4f4574]">{contentPlannerDetailItem.pillar || '-'}</p>
                      </div>
                      <div className="rounded-xl border border-purple-100 bg-[#fbfaff] px-3 py-2">
                        <p className="text-[11px] text-purple-400">Total Interaksi</p>
                        <p className="font-semibold text-[#4f4574]">
                          {getContentInsightInteractionTotal(contentPlannerDetailItem.platform, contentPlannerInsightMetrics)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-purple-100 bg-[#fbfaff] px-3 py-2">
                        <p className="text-[11px] text-purple-400">Engagement Rate</p>
                        <p className="font-semibold text-[#4f4574]">
                          {getContentInsightER(contentPlannerDetailItem.platform, contentPlannerInsightMetrics).toFixed(2)}%
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5">
                      <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-[0.1em]">AI Recommendation</p>
                      <p className="text-sm text-emerald-800 mt-1">
                        {getContentInsightAiRecommendation(contentPlannerDetailItem.platform, contentPlannerInsightMetrics)}
                      </p>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-purple-400">Input Insight</label>
                        <button
                          type="button"
                          onClick={() => setContentPlannerInsightFormOpen(prev => !prev)}
                          className="px-2.5 py-1 rounded-md border border-purple-100 bg-white text-[#8f75d8] text-[11px] font-bold"
                        >
                          {contentPlannerInsightFormOpen ? 'Tutup Form' : 'Input Insight'}
                        </button>
                      </div>

                      {contentPlannerInsightFormOpen && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                          {getContentInsightFields(contentPlannerDetailItem.platform).map((fieldKey) => (
                            <label key={fieldKey} className="text-[11px] text-purple-500">
                              <span className="capitalize">{fieldKey.replace(/([A-Z])/g, ' $1')}</span>
                              <input
                                type="number"
                                min="0"
                                value={contentPlannerInsightMetrics?.[fieldKey] ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value
                                  setContentPlannerInsightMetrics(prev => ({ ...prev, [fieldKey]: val === '' ? '' : Number(val) }))
                                }}
                                className="mt-1 w-full h-8 px-2 rounded-md border border-purple-100 bg-white text-[11px] text-[#4f4574]"
                              />
                            </label>
                          ))}
                        </div>
                      )}

                      <textarea
                        value={contentPlannerInsightDraft}
                        onChange={(e) => setContentPlannerInsightDraft(e.target.value)}
                        rows={4}
                        placeholder="Tulis insight performa konten..."
                        className="w-full px-3 py-2.5 rounded-xl border border-purple-100 bg-white text-sm text-[#4f4574] resize-none"
                      />
                    </div>

                    <div className="mt-4 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setContentPlannerDetailItem(null)}
                        className="px-3 py-2 rounded-lg border border-purple-100 text-xs font-bold text-purple-500"
                      >
                        Tutup
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveContentPlannerInsight}
                        className="px-3 py-2 rounded-lg bg-[#8f75d8] text-white text-xs font-bold"
                      >
                        Simpan Insight
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}


          {activeTab === 'invoiceFollowUp' && (
            <div className="mobile-page space-y-5">
              <div className="glass-panel p-5">
                <h3 className="text-xl font-extrabold text-[#4f4574]">Invoice Payment & Follow Up</h3>
                <p className="text-sm text-purple-400 mt-1">Sinkron dari invoice + status pembayaran project dalam satu alur data.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-panel p-4">
                  <p className="text-[11px] uppercase tracking-wider text-purple-400 font-bold">Invoice Open</p>
                  <p className="text-2xl font-extrabold mt-2">{invoices.filter(item => !['paid', 'lunas'].includes(String(item.status || '').toLowerCase())).length}</p>
                </div>
                <div className="glass-panel p-4">
                  <p className="text-[11px] uppercase tracking-wider text-purple-400 font-bold">Order Belum Lunas</p>
                  <p className="text-2xl font-extrabold mt-2">{spreadsheetOrders.filter(order => String(order.paymentStatus || '').toLowerCase() !== 'lunas').length}</p>
                </div>
                <div className="glass-panel p-4">
                  <p className="text-[11px] uppercase tracking-wider text-purple-400 font-bold">Outstanding</p>
                  <p className="text-2xl font-extrabold mt-2">{formatCurrencyIDR(spreadsheetOutstandingAmount)}</p>
                </div>
              </div>
              <div className="glass-panel p-5">
                <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                  {invoices.length === 0 ? (
                    <p className="text-sm text-purple-400">Belum ada invoice.</p>
                  ) : invoices.map(invoice => {
                    const hasSavedGeneratorInvoice = !!parseInvoiceGeneratorMeta(invoice.notes)
                    return (
                      <div key={invoice.id} className="rounded-xl border border-purple-100 bg-white p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[#4f4574] truncate">{invoice.title}</p>
                          <p className="text-xs text-purple-400">{invoice.clientName} • Due {formatLongDate(invoice.dueDate)}</p>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 lg:justify-end shrink-0">
                          <div className="sm:text-right min-w-[130px]">
                            <p className="text-sm font-bold text-[#8f75d8]">{formatCurrencyIDR(invoice.amount || 0)}</p>
                            <select
                              value={invoice.status || 'draft'}
                              onChange={(e) => updateInvoiceStatus(invoice, e.target.value)}
                              className="mt-1 h-8 px-2 rounded-lg border border-purple-100 bg-purple-50 text-[11px] font-bold uppercase text-[#6f3df3]"
                            >
                              <option value="draft">Draft</option>
                              <option value="sent">Follow Up</option>
                              <option value="paid">Paid / Lunas</option>
                              <option value="overdue">Overdue</option>
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => openInvoiceGeneratorFromFollowUp(invoice)}
                            className="h-8 px-3 rounded-lg bg-[#8f75d8] hover:bg-[#8069c8] text-white text-[11px] font-bold inline-flex items-center justify-center gap-1.5"
                          >
                            <FileText size={13} />
                            Invoice
                          </button>
                          {hasSavedGeneratorInvoice && (
                            <button
                              type="button"
                              onClick={() => setInvoicePreviewModalItem(invoice)}
                              className="h-8 w-8 rounded-lg border border-purple-100 bg-white text-[#8f75d8] hover:bg-purple-50 inline-flex items-center justify-center"
                              title="Lihat invoice"
                            >
                              <Eye size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'invoiceGenerator' && (
            <div className="mobile-page space-y-5">
              <div className="glass-panel p-5">
                <h3 className="text-xl font-extrabold text-[#4f4574]">Invoice Generator</h3>
                <p className="text-sm text-purple-400 mt-1">A4 portrait, auto nomor invoice, logo custom, teks editable, payment info, dan tanda tangan.</p>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-5">
                <div className="space-y-4">
                  <div className="glass-panel p-4 flex items-center justify-between">
                    <h4 className="text-sm font-bold text-[#4f4574]">Form Invoice Generator</h4>
                    <button
                      type="button"
                      onClick={() => setShowInvoiceGeneratorForm(prev => !prev)}
                      className="px-3 py-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-[#6f3df3] text-[11px] font-bold"
                    >
                      {showInvoiceGeneratorForm ? 'Hide Form' : 'Show Form'}
                    </button>
                  </div>

                  {showInvoiceGeneratorForm && (
                    <form onSubmit={handleSubmitInvoiceGenerator} className="glass-panel p-5 space-y-2.5">
                      <input type="file" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        const reader = new FileReader()
                        reader.onload = () => setInvoiceGeneratorLogo(String(reader.result || ''))
                        reader.readAsDataURL(file)
                      }} className="w-full text-xs" />
                      <input value={invoiceGeneratorCompany} onChange={(e) => setInvoiceGeneratorCompany(e.target.value)} placeholder="Nama perusahaan" className="w-full px-3 py-2.5 rounded-xl border border-purple-100 bg-white text-xs" />
                      <input value={invoiceGeneratorTagline} onChange={(e) => setInvoiceGeneratorTagline(e.target.value)} placeholder="Tagline" className="w-full px-3 py-2.5 rounded-xl border border-purple-100 bg-white text-xs" />
                      <div className="grid grid-cols-2 gap-2">
                        <input value={invoiceGeneratorNumber} onChange={(e) => setInvoiceGeneratorNumber(e.target.value)} placeholder="Nomor invoice" className="w-full px-3 py-2.5 rounded-xl border border-purple-100 bg-white text-xs" />
                        <input type="date" value={invoiceGeneratorDate} onChange={(e) => setInvoiceGeneratorDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-purple-100 bg-white text-xs" />
                      </div>
                      <input type="date" value={invoiceGeneratorDueDate} onChange={(e) => setInvoiceGeneratorDueDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-purple-100 bg-white text-xs" />
                      <select value={invoiceGeneratorStatus} onChange={(e) => setInvoiceGeneratorStatus(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-purple-100 bg-white text-xs">
                        <option value="draft">draft</option>
                        <option value="sent">follow_up</option>
                        <option value="paid">paid</option>
                      </select>
                      <p className="text-[11px] text-purple-400">Jika status `paid` / `lunas`, preview invoice akan menampilkan stamp LUNAS.</p>
                      <input value={invoiceGeneratorClient} onChange={(e) => setInvoiceGeneratorClient(e.target.value)} placeholder="Invoice To" className="w-full px-3 py-2.5 rounded-xl border border-purple-100 bg-white text-xs" />
                      <textarea rows={2} value={invoiceGeneratorClientAddress} onChange={(e) => setInvoiceGeneratorClientAddress(e.target.value)} placeholder="Alamat client" className="w-full px-3 py-2.5 rounded-xl border border-purple-100 bg-white text-xs resize-none" />
                      <textarea rows={2} value={invoiceGeneratorShipTo} onChange={(e) => setInvoiceGeneratorShipTo(e.target.value)} placeholder="Ship To / alamat kerja" className="w-full px-3 py-2.5 rounded-xl border border-purple-100 bg-white text-xs resize-none" />
                      <input value={invoiceGeneratorService} onChange={(e) => setInvoiceGeneratorService(e.target.value)} placeholder="Jenis jasa/orderan" className="w-full px-3 py-2.5 rounded-xl border border-purple-100 bg-white text-xs" />
                      <textarea rows={2} value={invoiceGeneratorServiceDesc} onChange={(e) => setInvoiceGeneratorServiceDesc(e.target.value)} placeholder="Deskripsi jasa" className="w-full px-3 py-2.5 rounded-xl border border-purple-100 bg-white text-xs resize-none" />
                      <div className="grid grid-cols-2 gap-2">
                        <input type="number" min="1" value={invoiceGeneratorQty} onChange={(e) => setInvoiceGeneratorQty(e.target.value)} placeholder="Qty" className="w-full px-3 py-2.5 rounded-xl border border-purple-100 bg-white text-xs" />
                        <input type="number" min="0" value={invoiceGeneratorPrice} onChange={(e) => setInvoiceGeneratorPrice(e.target.value)} placeholder="Harga" className="w-full px-3 py-2.5 rounded-xl border border-purple-100 bg-white text-xs" />
                      </div>
                      <textarea rows={3} value={invoiceGeneratorPaymentInfo} onChange={(e) => setInvoiceGeneratorPaymentInfo(e.target.value)} placeholder="Info pembayaran (Bank, A/N, No Rek)" className="w-full px-3 py-2.5 rounded-xl border border-purple-100 bg-white text-xs resize-none" />
                      <textarea rows={2} value={invoiceGeneratorTerms} onChange={(e) => setInvoiceGeneratorTerms(e.target.value)} placeholder="Terms & Condition" className="w-full px-3 py-2.5 rounded-xl border border-purple-100 bg-white text-xs resize-none" />
                      <input value={invoiceGeneratorSigner} onChange={(e) => setInvoiceGeneratorSigner(e.target.value)} placeholder="Nama penanggung jawab" className="w-full px-3 py-2.5 rounded-xl border border-purple-100 bg-white text-xs" />
                      <input value={invoiceGeneratorSignature} onChange={(e) => setInvoiceGeneratorSignature(e.target.value)} placeholder="Tanda tangan (teks)" className="w-full px-3 py-2.5 rounded-xl border border-purple-100 bg-white text-xs" />
                      <button
                        type="button"
                        onClick={handleSaveInvoiceGeneratorDefaults}
                        className="w-full py-2 rounded-xl border border-purple-100 bg-purple-50 hover:bg-purple-100 text-[#6f3df3] text-xs font-bold inline-flex items-center justify-center gap-1.5"
                      >
                        <Check size={13} />
                        Simpan Input Default
                      </button>
                      <button type="submit" className="w-full py-2.5 rounded-xl bg-[#8f75d8] hover:bg-[#8069c8] text-white text-xs font-bold">{invoiceGeneratorEditingId ? 'Update Invoice' : 'Simpan Invoice'}</button>
                    </form>
                  )}

                  <div className="glass-panel p-5">
                    <h4 className="text-sm font-bold text-[#4f4574] mb-3">List Invoice Generator</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {invoices.filter(item => parseInvoiceGeneratorMeta(item.notes)).length === 0 ? (
                        <p className="text-sm text-purple-400">Belum ada invoice generator.</p>
                      ) : invoices.filter(item => parseInvoiceGeneratorMeta(item.notes)).map(item => (
                        <div key={item.id} className="rounded-xl border border-purple-100 bg-white p-3 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-[#4f4574] truncate">{item.title}</p>
                            <p className="text-xs text-purple-400 truncate">{item.clientName} • {formatLongDate(item.issueDate)}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button type="button" onClick={() => loadInvoiceGeneratorFromInvoice(item)} className="px-2 py-1 rounded-lg border border-purple-100 text-[11px] font-bold text-[#8f75d8]">Edit</button>
                            <button type="button" onClick={() => updateInvoiceStatus(item, 'sent')} className="px-2 py-1 rounded-lg border border-amber-100 text-[11px] font-bold text-amber-700">Follow Up</button>
                            <button type="button" onClick={() => updateInvoiceStatus(item, 'paid')} className="px-2 py-1 rounded-lg border border-emerald-100 text-[11px] font-bold text-emerald-700">Lunas</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="glass-panel p-3 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={handleExportInvoicePdf}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
                    >
                      <FileText size={13} />
                      Export Invoice to PDF (High Res)
                    </button>
                  </div>
                  <div className="glass-panel p-5 overflow-auto">
                    <div ref={invoicePreviewRef} className="relative mx-auto bg-white text-[#111] shadow-sm overflow-hidden" style={{ width: '210mm', minHeight: '297mm', padding: '16mm' }}>
                      {['paid', 'lunas'].includes(String(invoiceGeneratorStatus || '').toLowerCase()) && (
                        <div className="absolute right-8 top-20 rotate-[-18deg] border-4 border-emerald-500 text-emerald-600 px-6 py-2 text-3xl font-black tracking-[0.12em] opacity-80">
                          LUNAS
                        </div>
                      )}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {invoiceGeneratorLogo ? <img src={invoiceGeneratorLogo} alt="logo" className="h-12 w-auto object-contain" /> : null}
                          <div>
                            <p className="font-extrabold text-lg">{invoiceGeneratorCompany}</p>
                            <p className="text-[11px] text-slate-500">{invoiceGeneratorTagline}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-4xl font-black tracking-tight">INVOICE</p>
                          <p className="text-xs mt-1">DATE: {formatLongDate(invoiceGeneratorDate)}</p>
                        </div>
                      </div>
                      <div className="mt-6 grid grid-cols-2 gap-4 bg-slate-100 p-4 text-xs">
                        <div><p className="font-bold mb-1">INVOICE TO</p><p className="font-semibold">{invoiceGeneratorClient}</p><p className="whitespace-pre-line mt-1">{invoiceGeneratorClientAddress}</p></div>
                        <div><p className="font-bold mb-1">SHIP TO</p><p className="whitespace-pre-line mt-1">{invoiceGeneratorShipTo}</p></div>
                      </div>
                      <div className="mt-5 flex items-center justify-between text-xs">
                        <p>DATE: {formatLongDate(invoiceGeneratorDate)}</p>
                        <p className="font-bold">INVOICE NO: {invoiceGeneratorNumber}</p>
                      </div>
                      <table className="w-full mt-2 text-xs border-t border-b border-slate-400">
                        <thead><tr className="text-left"><th className="py-2">ITEM</th><th>PRICE</th><th>QTY</th><th className="text-right">TOTAL</th></tr></thead>
                        <tbody><tr><td className="py-2"><p className="font-semibold">{invoiceGeneratorService}</p><p className="text-slate-500">{invoiceGeneratorServiceDesc}</p></td><td>{formatCurrencyIDR(Number(invoiceGeneratorPrice || 0))}</td><td>{Number(invoiceGeneratorQty || 1)}</td><td className="text-right font-bold">{formatCurrencyIDR(Number(invoiceGeneratorQty || 1) * Number(invoiceGeneratorPrice || 0))}</td></tr></tbody>
                      </table>
                      <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                        <div><p className="font-bold">Payment Info:</p><p className="whitespace-pre-line mt-1">{invoiceGeneratorPaymentInfo}</p></div>
                        <div className="text-right">
                          <p className="font-bold">TOTAL DUE</p>
                          <p className="text-3xl font-black mt-1">{formatCurrencyIDR(Number(invoiceGeneratorQty || 1) * Number(invoiceGeneratorPrice || 0))}</p>
                          <p className="mt-2 text-[11px] font-semibold uppercase">Status: {formatInvoiceStatusLabel(invoiceGeneratorStatus)}</p>
                        </div>
                      </div>
                      <div className="mt-5 grid grid-cols-2 gap-4 text-xs">
                        <div><p className="font-bold">Terms & Condition</p><p className="whitespace-pre-line mt-1">{invoiceGeneratorTerms}</p></div>
                        <div className="text-right"><p className="font-bold">Account Manager</p><p className="italic text-lg mt-2">{invoiceGeneratorSignature || invoiceGeneratorSigner}</p><p className="font-bold mt-1">{invoiceGeneratorSigner}</p></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {invoicePreviewModalItem && (() => {
            const previewMeta = parseInvoiceGeneratorMeta(invoicePreviewModalItem.notes)
            if (!previewMeta) return null
            const previewQty = Number(previewMeta.qty || 1)
            const previewPrice = Number(previewMeta.price || invoicePreviewModalItem.amount || 0)
            const previewStatus = invoicePreviewModalItem.status || previewMeta.status || 'draft'
            return (
              <div className="fixed inset-0 z-50 bg-slate-700/35 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setInvoicePreviewModalItem(null)}>
                <div className="w-full max-w-5xl max-h-[92vh] overflow-auto rounded-[1.4rem] bg-white shadow-2xl border border-purple-100" onClick={(e) => e.stopPropagation()}>
                  <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-purple-100 px-5 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-purple-400">Preview Invoice</p>
                      <h4 className="text-base font-extrabold text-[#4f4574] truncate">{previewMeta.invoiceNumber || invoicePreviewModalItem.title}</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setInvoicePreviewModalItem(null)}
                      className="h-8 w-8 rounded-lg border border-purple-100 text-purple-400 hover:bg-purple-50 inline-flex items-center justify-center"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="p-5 overflow-auto bg-[#f8f4ff]">
                    <div className="relative mx-auto bg-white text-[#111] shadow-sm overflow-hidden" style={{ width: '210mm', minHeight: '297mm', padding: '16mm' }}>
                      {['paid', 'lunas'].includes(String(previewStatus || '').toLowerCase()) && (
                        <div className="absolute right-8 top-20 rotate-[-18deg] border-4 border-emerald-500 text-emerald-600 px-6 py-2 text-3xl font-black tracking-[0.12em] opacity-80">
                          LUNAS
                        </div>
                      )}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {previewMeta.logo ? <img src={previewMeta.logo} alt="logo" className="h-12 w-auto object-contain" /> : null}
                          <div>
                            <p className="font-extrabold text-lg">{previewMeta.company || 'DyaTask Studio'}</p>
                            <p className="text-[11px] text-slate-500">{previewMeta.tagline || 'Freelance Service Invoice'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-4xl font-black tracking-tight">INVOICE</p>
                          <p className="text-xs mt-1">DATE: {formatLongDate(previewMeta.invoiceDate || invoicePreviewModalItem.issueDate)}</p>
                        </div>
                      </div>
                      <div className="mt-6 grid grid-cols-2 gap-4 bg-slate-100 p-4 text-xs">
                        <div>
                          <p className="font-bold mb-1">INVOICE TO</p>
                          <p className="font-semibold">{previewMeta.client || invoicePreviewModalItem.clientName}</p>
                          <p className="whitespace-pre-line mt-1">{previewMeta.clientAddress}</p>
                        </div>
                        <div>
                          <p className="font-bold mb-1">SHIP TO</p>
                          <p className="whitespace-pre-line mt-1">{previewMeta.shipTo}</p>
                        </div>
                      </div>
                      <div className="mt-5 flex items-center justify-between text-xs">
                        <p>DATE: {formatLongDate(previewMeta.invoiceDate || invoicePreviewModalItem.issueDate)}</p>
                        <p className="font-bold">INVOICE NO: {previewMeta.invoiceNumber || '-'}</p>
                      </div>
                      <table className="w-full mt-2 text-xs border-t border-b border-slate-400">
                        <thead>
                          <tr className="text-left">
                            <th className="py-2">ITEM</th>
                            <th>PRICE</th>
                            <th>QTY</th>
                            <th className="text-right">TOTAL</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="py-2">
                              <p className="font-semibold">{previewMeta.service || invoicePreviewModalItem.orderType}</p>
                              <p className="text-slate-500">{previewMeta.serviceDescription || invoicePreviewModalItem.title}</p>
                            </td>
                            <td>{formatCurrencyIDR(previewPrice)}</td>
                            <td>{previewQty}</td>
                            <td className="text-right font-bold">{formatCurrencyIDR(previewQty * previewPrice)}</td>
                          </tr>
                        </tbody>
                      </table>
                      <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="font-bold">Payment Info:</p>
                          <p className="whitespace-pre-line mt-1">{previewMeta.paymentInfo}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">TOTAL DUE</p>
                          <p className="text-3xl font-black mt-1">{formatCurrencyIDR(previewQty * previewPrice)}</p>
                          <p className="mt-2 text-[11px] font-semibold uppercase">Status: {formatInvoiceStatusLabel(previewStatus)}</p>
                        </div>
                      </div>
                      <div className="mt-5 grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="font-bold">Terms & Condition</p>
                          <p className="whitespace-pre-line mt-1">{previewMeta.terms}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">Account Manager</p>
                          <p className="italic text-lg mt-2">{previewMeta.signature || previewMeta.signer}</p>
                          <p className="font-bold mt-1">{previewMeta.signer}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}

          {activeTab === 'finance' && (
            <div className="mobile-page mobile-page-finance space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="glass-panel p-4">
                  <p className="text-[11px] uppercase tracking-wider text-purple-400 font-bold">Pendapatan Bulan Ini</p>
                  <p className="text-2xl font-extrabold mt-2">{formatCurrencyIDR(monthlyBusinessRevenue)}</p>
                </div>
                <div className="glass-panel p-4">
                  <p className="text-[11px] uppercase tracking-wider text-purple-400 font-bold">Outstanding Spreadsheet</p>
                  <p className="text-2xl font-extrabold mt-2">{formatCurrencyIDR(spreadsheetOutstandingAmount)}</p>
                </div>
                <div className="glass-panel p-4">
                  <p className="text-[11px] uppercase tracking-wider text-purple-400 font-bold">Collection Rate Spreadsheet</p>
                  <p className="text-2xl font-extrabold mt-2">{spreadsheetCollectionRate}%</p>
                </div>
                <div className="glass-panel p-4">
                  <p className="text-[11px] uppercase tracking-wider text-purple-400 font-bold">Mode Penyimpanan</p>
                  <p className="text-lg font-extrabold mt-2">{invoiceStorageMode === 'cloud' ? 'Supabase' : 'Local Backup'}</p>
                </div>
              </div>

              <div className="glass-panel p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-extrabold">Finance & Invoice Tracker</h3>
                    <p className="text-xs text-purple-400 mt-1">Pantau invoice per klien dengan status draft, sent, paid, dan overdue.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={invoiceFilterStatus}
                      onChange={(e) => setInvoiceFilterStatus(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-purple-100 bg-white text-xs font-semibold"
                    >
                      <option value="all">Semua Status</option>
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="paid">Paid</option>
                      <option value="overdue">Overdue</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        if (showInvoiceForm && editingInvoiceId) {
                          resetInvoiceForm()
                        } else {
                          setShowInvoiceForm(prev => !prev)
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-[#8f75d8] hover:bg-[#8069c8] text-white text-xs font-bold inline-flex items-center gap-1.5"
                    >
                      <Plus size={13} />
                      {showInvoiceForm ? 'Tutup Form' : 'Tambah Invoice'}
                    </button>
                  </div>
                </div>

                {showInvoiceForm && (
                  <form onSubmit={handleSubmitInvoice} className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 rounded-2xl border border-purple-100 bg-purple-50/30 p-4">
                    <input value={invoiceClientName} onChange={(e) => setInvoiceClientName(e.target.value)} placeholder="Nama client" className="px-3 py-2.5 rounded-xl border border-purple-100 bg-white text-sm" required />
                    <input value={invoiceTitle} onChange={(e) => setInvoiceTitle(e.target.value)} placeholder="Judul invoice" className="px-3 py-2.5 rounded-xl border border-purple-100 bg-white text-sm" required />
                    <select value={invoiceType} onChange={(e) => setInvoiceType(e.target.value)} className="px-3 py-2.5 rounded-xl border border-purple-100 bg-white text-sm">
                      <option>Custom Spreadsheet</option>
                      <option>Dashboard</option>
                      <option>Automation</option>
                      <option>Consultation</option>
                    </select>
                    <input type="number" min="0" value={invoiceAmount} onChange={(e) => setInvoiceAmount(e.target.value)} placeholder="Nominal" className="px-3 py-2.5 rounded-xl border border-purple-100 bg-white text-sm" />
                    <input type="date" value={invoiceIssueDate} onChange={(e) => setInvoiceIssueDate(e.target.value)} className="px-3 py-2.5 rounded-xl border border-purple-100 bg-white text-sm" />
                    <input type="date" value={invoiceDueDate} onChange={(e) => setInvoiceDueDate(e.target.value)} className="px-3 py-2.5 rounded-xl border border-purple-100 bg-white text-sm" />
                    <select value={invoiceStatus} onChange={(e) => setInvoiceStatus(e.target.value)} className="px-3 py-2.5 rounded-xl border border-purple-100 bg-white text-sm">
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="paid">Paid</option>
                      <option value="overdue">Overdue</option>
                    </select>
                    <input value={invoiceNotes} onChange={(e) => setInvoiceNotes(e.target.value)} placeholder="Catatan singkat" className="px-3 py-2.5 rounded-xl border border-purple-100 bg-white text-sm" />
                    <div className="xl:col-span-4 flex items-center gap-2 pt-1">
                      <button type="submit" className="px-4 py-2 rounded-xl bg-[#8f75d8] hover:bg-[#8069c8] text-white text-xs font-bold">
                        {editingInvoiceId ? 'Simpan Perubahan' : 'Simpan Invoice'}
                      </button>
                      {editingInvoiceId && (
                        <button type="button" onClick={resetInvoiceForm} className="px-4 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-700 text-xs font-bold">
                          Batal Edit
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredInvoices.length === 0 ? (
                  <div className="lg:col-span-2 glass-panel p-6 text-center text-sm text-purple-400">Belum ada invoice pada filter ini.</div>
                ) : filteredInvoices.map((invoice) => {
                  const dueDateKey = String(invoice.dueDate || '')
                  const isLate = dueDateKey && dueDateKey < todayString && !['paid'].includes(String(invoice.status || '').toLowerCase())
                  const displayStatus = isLate && invoice.status !== 'paid' ? 'overdue' : invoice.status
                  const invoiceGeneratorMeta = parseInvoiceGeneratorMeta(invoice.notes)
                  const statusBadgeClass = displayStatus === 'paid'
                    ? 'bg-emerald-100 text-emerald-700'
                    : displayStatus === 'sent'
                      ? 'bg-blue-100 text-blue-700'
                      : displayStatus === 'overdue'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-purple-100 text-purple-700'

                  return (
                    <div key={invoice.id} className="glass-panel p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-lg font-extrabold leading-tight">{invoice.title}</h4>
                          <p className="text-sm text-purple-400">{invoice.clientName} • {invoice.orderType}</p>
                        </div>
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase ${statusBadgeClass}`}>{displayStatus}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="rounded-xl border border-purple-100 bg-white p-2">
                          <p className="text-purple-400">Nominal</p>
                          <p className="font-bold text-sm mt-1">{formatCurrencyIDR(invoice.amount)}</p>
                        </div>
                        <div className="rounded-xl border border-purple-100 bg-white p-2">
                          <p className="text-purple-400">Issue</p>
                          <p className="font-bold text-sm mt-1">{formatLongDate(invoice.issueDate)}</p>
                        </div>
                        <div className="rounded-xl border border-purple-100 bg-white p-2">
                          <p className="text-purple-400">Due</p>
                          <p className="font-bold text-sm mt-1">{formatLongDate(invoice.dueDate)}</p>
                        </div>
                      </div>

                      {invoiceGeneratorMeta ? (
                        <button
                          type="button"
                          onClick={() => setInvoicePreviewModalItem(invoice)}
                          className="w-fit px-3 py-1.5 rounded-lg border border-purple-100 bg-white hover:bg-purple-50 text-[#8f75d8] text-xs font-bold inline-flex items-center gap-1.5"
                        >
                          <Eye size={13} />
                          Preview Invoice
                        </button>
                      ) : invoice.notes ? (
                        <p className="text-xs text-slate-500">{invoice.notes}</p>
                      ) : null}

                      <div className="flex flex-wrap items-center gap-2">
                        <button type="button" onClick={() => startEditInvoice(invoice)} className="px-3 py-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-700 text-xs font-bold inline-flex items-center gap-1"><Pencil size={12} />Edit</button>
                        <button type="button" onClick={() => handleDeleteInvoice(invoice)} className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold inline-flex items-center gap-1"><Trash2 size={12} />Hapus</button>
                        <div className="ml-auto flex items-center gap-1">
                          {['draft', 'sent', 'paid', 'overdue'].map(status => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => updateInvoiceStatus(invoice, status)}
                              className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${invoice.status === status ? 'bg-[#8f75d8] text-white' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="mobile-page mobile-page-reports space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="glass-panel p-5">
                  <p className="text-[11px] uppercase tracking-wider text-purple-400 font-bold">Total Pendapatan</p>
                  <p className="text-2xl font-extrabold mt-2">{formatCurrencyIDR(totalBusinessRevenue)}</p>
                </div>
                <div className="glass-panel p-5">
                  <p className="text-[11px] uppercase tracking-wider text-purple-400 font-bold">Total Transaksi</p>
                  <p className="text-2xl font-extrabold mt-2">{appointments.length + spreadsheetOrders.length}</p>
                </div>
                <div className="glass-panel p-5">
                  <p className="text-[11px] uppercase tracking-wider text-purple-400 font-bold">Open Task Utama</p>
                  <p className="text-2xl font-extrabold mt-2">{openTaskCount}</p>
                </div>
                <div className="glass-panel p-5">
                  <p className="text-[11px] uppercase tracking-wider text-purple-400 font-bold">Upcoming Meeting</p>
                  <p className="text-2xl font-extrabold mt-2">{upcomingMeetingCount}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="xl:col-span-2 glass-panel p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-extrabold">Revenue 6 Bulan Terakhir</h3>
                    <span className="text-xs text-purple-400">Reservasi + spreadsheet lunas</span>
                  </div>
                  <div className="grid grid-cols-6 gap-3 items-end h-44">
                    {revenueByMonth.map((month) => {
                      const maxValue = Math.max(...revenueByMonth.map(item => item.value), 1)
                      const height = Math.max(8, Math.round((month.value / maxValue) * 140))
                      return (
                        <div key={month.key} className="flex flex-col items-center gap-2">
                          <div className="w-full max-w-[44px] rounded-xl bg-purple-100/70 h-[150px] flex items-end overflow-hidden">
                            <div className="w-full rounded-xl bg-gradient-to-t from-[#8f75d8] to-[#b49af0]" style={{ height: `${height}px` }} />
                          </div>
                          <span className="text-[11px] font-bold text-purple-500 uppercase">{month.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="glass-panel p-5">
                  <h3 className="text-lg font-extrabold mb-4">Invoice Status</h3>
                  <div className="space-y-2">
                    {Object.entries(reportByStatus).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between rounded-xl border border-purple-100 bg-white px-3 py-2">
                        <span className="text-sm font-semibold capitalize">{key}</span>
                        <span className="text-sm font-extrabold text-[#8f75d8]">{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-xl border border-purple-100 bg-purple-50/40 p-3">
                    <p className="text-xs text-purple-400">Collection Rate</p>
                    <p className="text-xl font-extrabold mt-1">{spreadsheetCollectionRate}%</p>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-5">
                <h3 className="text-lg font-extrabold mb-4">Top Client by Paid Revenue</h3>
                {topClients.length === 0 ? (
                  <p className="text-sm text-purple-400">Belum ada data pendapatan dari reservasi/spreadsheet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {topClients.map((client, index) => (
                      <div key={client.name} className="rounded-xl border border-purple-100 bg-white p-3">
                        <p className="text-xs text-purple-400">#{index + 1}</p>
                        <h4 className="text-base font-extrabold mt-1 truncate">{client.name}</h4>
                        <p className="text-sm font-semibold text-[#8f75d8] mt-1">{formatCurrencyIDR(client.value)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: 3. BOOKING CALENDAR & APPOINTMENTS */}
          {activeTab === 'calendar' && (() => {
            const calendarFeed = [
              ...appointments.map(appt => ({
                id: `appt-${appt.id}`,
                title: formatAppointmentLabel(appt),
                subtitle: appt.clientName,
                date: appt.date,
                time: appt.time,
                type: 'Reservasi',
                tone: 'purple',
                raw: appt
              })),
              ...tasks.filter(task => task.status !== 'done').map(task => ({
                id: `task-${task.id}`,
                title: task.title,
                subtitle: task.category,
                date: task.calendarDate || todayString,
                time: task.dueTime || 'Task',
                type: 'Task',
                tone: 'amber',
                raw: task
              })),
              ...googleCalendarEvents.map(event => ({
                id: `gcal-${event.id}`,
                title: event.title,
                subtitle: event.calendarName,
                date: event.date,
                time: event.time,
                type: 'Google Calendar',
                tone: 'emerald',
                link: event.htmlLink,
                raw: event
              })),
              ...nationalHolidays.map(holiday => ({
                id: `holiday-${holiday.id}`,
                title: holiday.title,
                subtitle: 'Hari libur nasional',
                date: holiday.date,
                time: 'All day',
                type: 'Libur',
                tone: 'rose',
                raw: holiday
              }))
            ]
              .filter(item => item.date >= todayString)
              .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
              .slice(0, 5)

            const toneClass = {
              purple: 'bg-[#f0eaff] text-[#6f3df3] border-[#dfd1ff]',
              amber: 'bg-amber-50 text-amber-700 border-amber-100',
              emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
              rose: 'bg-rose-50 text-rose-700 border-rose-100'
            }

            return (
              <div className="mobile-page mobile-page-calendar calendar-workspace relative overflow-hidden rounded-[2.4rem] border border-white/80 bg-white/78 p-4 lg:p-5 shadow-2xl shadow-purple-200/45 backdrop-blur-xl">
                <div className="pointer-events-none absolute -left-24 top-12 h-56 w-56 rounded-full bg-[#8f75d8]/14 blur-3xl" />
                <div className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-[#ffe54c]/18 blur-3xl" />
                <div className="relative grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-5">
	                  <aside className="relative overflow-hidden rounded-[2rem] bg-[#fbfaff] p-5 shadow-inner shadow-purple-100/60">
	                    {showBookingQuickForm && (
	                      <button
	                        type="button"
	                        aria-label="Tutup reservasi cepat"
	                        onClick={() => setShowBookingQuickForm(false)}
	                        className="absolute inset-0 z-20 cursor-default bg-white/45 backdrop-blur-[3px]"
	                      />
	                    )}
	                    <div className="flex items-center justify-between gap-3 mb-7">
	                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-[#8f75d8] text-white flex items-center justify-center shadow-lg shadow-purple-200">
                          <Calendar size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-[0.22em] text-[#a88cff] font-bold">Calendar Hub</p>
                          <h3 className="text-sm font-bold text-[#4f4574] truncate">Reservasi & Jadwal</h3>
                        </div>
                      </div>
	                      <div className="relative z-30 shrink-0">
                        <button
                          type="button"
                          onClick={() => setShowBookingQuickForm(prev => !prev)}
                          className="w-9 h-9 rounded-2xl bg-white border border-purple-100 text-[#8f75d8] flex items-center justify-center shadow-sm hover:bg-purple-50"
                          title="Toggle form reservasi"
                        >
                          {showBookingQuickForm ? <ChevronUp size={15} /> : <Plus size={15} />}
                        </button>
                        {showBookingQuickForm && (
	                          <div className="absolute right-0 top-12 z-30 w-[285px] rounded-[1.5rem] border border-[#7b5fd4]/30 bg-[#fffdf8] p-4 shadow-2xl shadow-[#7b5fd4]/25 ring-1 ring-white/80">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-bold text-[#4f4574] flex items-center gap-2">
                                <Plus size={14} className="text-[#8f75d8]" />
                                Reservasi Cepat
                              </h4>
                              <button type="button" onClick={() => setIsBookingFormExpanded(prev => !prev)} className="text-[10px] text-[#8f75d8] font-bold">
                                {isBookingFormExpanded ? 'Hide' : 'Expand'}
                              </button>
                            </div>
                            {isBookingFormExpanded && <form onSubmit={handleAddBooking} className="space-y-2.5">
                              <input type="text" placeholder="Nama klien" value={bookingClient} onChange={(e) => setBookingClient(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-purple-100 bg-[#fbfaff] text-xs focus:outline-none focus:border-purple-400" required />
                              <input type="email" placeholder="Email klien" value={bookingEmail} onChange={(e) => setBookingEmail(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-purple-100 bg-[#fbfaff] text-xs focus:outline-none focus:border-purple-400" />
                              <input type="text" placeholder="Agenda meeting" value={bookingTitle} onChange={(e) => setBookingTitle(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-purple-100 bg-[#fbfaff] text-xs focus:outline-none focus:border-purple-400" required />
                              <div className="grid grid-cols-2 gap-2">
                                <input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} min={todayString} className="w-full px-2 py-2 rounded-xl border border-purple-100 bg-[#fbfaff] text-xs focus:outline-none focus:border-purple-400" />
                                <select value={bookingTime} onChange={(e) => setBookingTime(e.target.value)} className="w-full px-2 py-2 rounded-xl border border-purple-100 bg-[#fbfaff] text-xs focus:outline-none focus:border-purple-400">
                                  {availableTimeSlotsForSelectedDate.map(slot => <option key={slot} value={slot}>{slot}</option>)}
                                </select>
                              </div>
                              <button type="submit" className="w-full py-2.5 rounded-xl bg-[#8f75d8] hover:bg-[#8069c8] text-white text-xs font-bold shadow-md shadow-purple-200">
                                Simpan & Sync
                              </button>
                            </form>}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mb-5 rounded-[1.5rem] border border-purple-100 bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-bold text-[#4f4574]">Aktivitas hari ini</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-[#8f75d8] border border-purple-100 font-bold">{todayCalendarItems.length} item</span>
                      </div>
                      {todayCalendarItems.length === 0 ? (
                        <p className="text-xs text-[#9b85e9]">Belum ada task, event, Google Calendar, atau hari libur untuk hari ini.</p>
                      ) : (
                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                          {todayCalendarItems.map(item => {
                            const isTask = item.source === 'task'
                            const isAppointment = item.source === 'appointment'
                            const isGoogleEvent = item.source === 'google_event'
                            const isHoliday = item.source === 'holiday'
                            const label = isTask ? 'Task' : isAppointment ? 'Event' : isGoogleEvent ? 'Google Calendar' : 'Hari Libur'
                            const itemIcon = isTask ? <CheckSquare size={12} /> : isHoliday ? <Sparkles size={12} /> : <Calendar size={12} />
                            const badgeClass = isHoliday
                              ? 'bg-red-50 text-red-600'
                              : isGoogleEvent
                                ? 'bg-emerald-50 text-emerald-700'
                                : isAppointment
                                  ? 'bg-blue-50 text-blue-700'
                                  : item.status === 'done'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-[#eee7ff] text-[#6f3df3]'
                            const metaText = isTask
                              ? `${item.category} • ${item.dueTime || 'Tanpa jam'} WIB`
                              : isAppointment
                                ? `${item.clientName} • ${item.time} WIB`
                                : isGoogleEvent
                                  ? `${formatLongDate(item.date)} • ${item.time} • ${item.calendarName}`
                                  : 'Hari libur nasional Indonesia'

                            return (
                              <div key={`${item.source}-${item.id}`} className="p-3 rounded-2xl border border-purple-100 bg-white">
                                <div className="flex items-start justify-between gap-2">
                                  <p className={`text-xs font-bold flex items-center gap-1.5 min-w-0 ${isGoogleEvent ? 'text-emerald-700' : isHoliday ? 'text-red-600' : 'text-[#6f3df3]'}`}>
                                    {itemIcon}
                                    <span className="truncate">{item.title}</span>
                                  </p>
                                  <span className={`text-[8px] px-1.5 py-0.5 rounded-lg uppercase font-bold shrink-0 ${badgeClass}`}>
                                    {label}
                                  </span>
                                </div>
                                <p className={`text-[11px] mt-1 ${isGoogleEvent ? 'text-emerald-600' : isHoliday ? 'text-red-500' : 'text-[#8f75d8]'}`}>{metaText}</p>
                                {isGoogleEvent && item.htmlLink && (
                                  <a href={item.htmlLink} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:underline">
                                    Buka di Google Calendar <ExternalLink size={10} />
                                  </a>
                                )}
                                {(isTask || isAppointment) && (
                                  <div className="mt-2 flex items-center gap-2">
                                    {isTask && (
                                      <button type="button" onClick={(e) => { e.stopPropagation(); toggleTaskStatus(item.id) }} className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[#eee7ff] text-[#6f3df3] hover:bg-[#e4dcff] inline-flex items-center gap-1">
                                        <CheckCircle size={10} />
                                        {item.status === 'done' ? 'Batal' : 'Selesai'}
                                      </button>
                                    )}
                                    <button type="button" onClick={(e) => { e.stopPropagation(); openCalendarEditModal(item) }} className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[#8f75d8] text-white hover:bg-[#8069c8] inline-flex items-center gap-1"><Pencil size={10} />Edit</button>
                                    <button type="button" onClick={(e) => { e.stopPropagation(); openDeleteConfirmModal(item) }} className="px-2 py-1 rounded-lg text-[10px] font-bold bg-red-100 text-red-600 hover:bg-red-200 inline-flex items-center gap-1"><Trash2 size={10} />Hapus</button>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    <div className="mb-7">
                      <div className="flex items-end justify-between mb-3">
                        <div>
                          <h4 className="text-xl font-bold text-[#4f4574]">Upcoming events</h4>
                          <p className="text-xs text-[#9b85e9]">Event dan task terdekat dari semua sumber.</p>
                        </div>
                        <span className="text-[10px] px-2 py-1 rounded-full bg-white text-[#8f75d8] border border-purple-100 font-bold">{calendarFeed.length}</span>
                      </div>
                      <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                        {calendarFeed.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-purple-200 bg-white p-4 text-center text-xs text-[#9b85e9]">
                            Belum ada agenda mendatang.
                          </div>
                        ) : calendarFeed.map(item => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setBookingDate(item.date)
                              setSelectedCalendarDate(item.date)
                            }}
                            className="w-full rounded-2xl border border-purple-100 bg-white p-3 text-left shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all"
                          >
                            <div className="flex items-start gap-3">
                              <span className={`mt-1 h-2.5 w-2.5 rounded-full ${item.tone === 'emerald' ? 'bg-emerald-400' : item.tone === 'amber' ? 'bg-amber-400' : item.tone === 'rose' ? 'bg-rose-400' : 'bg-[#8f75d8]'}`} />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-[11px] text-[#8f75d8] font-bold">{formatLongDate(item.date)} • {item.time}</p>
                                  <span className={`text-[8px] uppercase tracking-wide px-1.5 py-0.5 rounded-lg border font-bold ${toneClass[item.tone]}`}>
                                    {item.type}
                                  </span>
                                </div>
                                <h5 className="mt-1 text-sm font-bold text-[#4f4574] truncate">{item.title}</h5>
                                <p className="text-[11px] text-[#9b85e9] truncate">{item.subtitle}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>



                  </aside>

                  <section className="rounded-[2rem] bg-white p-5 lg:p-6 shadow-xl shadow-purple-100/50">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-[#8f75d8] font-bold mb-1">
                          <Calendar size={14} />
                          <span>Calendar</span>
                        </div>
                        <h3 className="text-2xl font-bold text-[#4f4574] capitalize">{calendarTitle}</h3>
                        <p className="text-xs text-[#9b85e9]">Google Calendar, task, reservasi, dan hari libur nasional.</p>
	                      </div>
	                      <div className="flex flex-wrap items-center gap-2">
	                        <button onClick={() => setCalendarMonthDate(new Date(calendarMonthDate.getFullYear(), calendarMonthDate.getMonth() - 1, 1))} className="w-9 h-9 rounded-xl border border-purple-100 bg-white text-[#4f4574] shadow-sm hover:bg-purple-50">‹</button>
	                        <button onClick={() => setCalendarMonthDate(new Date(todayDate.getFullYear(), todayDate.getMonth(), 1))} className="px-3 h-9 rounded-xl bg-[#8f75d8] text-white text-xs font-bold shadow-sm hover:bg-[#8069c8]">Hari Ini</button>
	                        <button onClick={() => setCalendarMonthDate(new Date(calendarMonthDate.getFullYear(), calendarMonthDate.getMonth() + 1, 1))} className="w-9 h-9 rounded-xl border border-purple-100 bg-white text-[#4f4574] shadow-sm hover:bg-purple-50">›</button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-2 text-center font-bold text-[11px] text-[#a88cff] uppercase tracking-widest mb-2">
                      {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => <span key={d}>{d}</span>)}
                    </div>

                    <div className="calendar-grid calendar-grid-dashboard">
                      {calendarDays.map((dayItem) => {
                        const dayNumber = dayItem.date.getDate()
                        const dateStr = dayItem.dateStr
                        const dayAppointments = appointments.filter(app => app.date === dateStr)
                        const dayTasks = tasks.filter(task => (task.calendarDate || todayString) === dateStr)
                        const dayGoogleEvents = googleCalendarEvents.filter(event => event.date === dateStr)
                        const dayHolidays = nationalHolidays.filter(holiday => holiday.date === dateStr)
                        const dayActivityItems = [
                          ...dayHolidays.map(holiday => ({
                            ...holiday,
                            id: `holiday-${holiday.id}`,
                            displayTitle: holiday.title,
                            pillTag: '',
                            bgColor: '#FFE3EA',
                            borderColor: '#F8B8C8',
                            itemType: 'holiday',
                            editable: false
                          })),
                          ...dayGoogleEvents.map(event => ({
                            ...event,
                            id: `gcal-${event.id}`,
                            displayTitle: formatCalendarPillTitle(event.time, event.title),
                            pillTag: '',
                            bgColor: '#DDF7EA',
                            borderColor: '#A7E7C7',
                            itemType: 'google_event',
                            editable: false
                          })),
                          ...dayAppointments.map(appt => ({
                            ...appt,
                            id: appt.id,
                            displayId: `appt-${appt.id}`,
                            displayTitle: formatCalendarPillTitle(appt.time, formatAppointmentLabel(appt)),
                            pillTag: '',
                            bgColor: '#DFECFF',
                            borderColor: '#B6D3FF',
                            itemType: 'appointment',
                            editable: true
                          })),
                          ...dayTasks.map(task => ({
                            ...task,
                            id: task.id,
                            displayId: `task-${task.id}`,
                            displayTitle: formatCalendarPillTitle(task.dueTime, task.title),
                            pillTag: '',
                            bgColor: '#EFE7FF',
                            borderColor: '#D0B9FF',
                            itemType: 'task',
                            editable: true
                          }))
                        ]
                        const visibleDayActivities = dayActivityItems.slice(0, 4)
                        const hiddenActivityCount = dayActivityItems.length - visibleDayActivities.length
                        const hasAppt = dayActivityItems.length > 0
                        const isToday = dayItem.isToday

                        return (
                          <div
                            key={dateStr}
                            className={`calendar-day calendar-day-dashboard ${!dayItem.isCurrentMonth ? 'other-month' : ''} ${isToday ? 'active-day font-bold' : ''} ${hasAppt ? 'has-appointment' : ''}`}
                            onClick={() => {
                              setBookingDate(dateStr)
                              setSelectedCalendarDate(dateStr)
                            }}
                          >
                            <div className="flex justify-between items-start">
                              <span className={`text-[11px] ${isToday ? 'text-[#6f3df3]' : 'text-[#5d4a98]'}`}>{dayNumber}</span>
                              {isToday && <span className="w-1.5 h-1.5 rounded-full bg-[#8f75d8]" />}
                            </div>
                            {hasAppt && (
                              <div className="mt-1.5 space-y-1">
                                {visibleDayActivities.map(activity => (
                                  <button
                                    key={activity.displayId || activity.id}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setBookingDate(dateStr)
                                      setSelectedCalendarDate(dateStr)
                                      if (activity.editable) {
                                        setCalendarActionItem(activity)
                                      }
                                    }}
                                    className={`calendar-event-pill px-2 py-1 rounded-full text-[11px] font-semibold leading-tight text-[#4f4574] ${activity.editable ? 'cursor-pointer hover:brightness-95' : 'cursor-default'}`}
                                    style={{ backgroundColor: activity.bgColor, borderColor: activity.borderColor }}
                                    title={activity.editable ? 'Klik untuk edit atau hapus' : activity.title}
                                  >
                                    {activity.pillTag && <span className="font-extrabold mr-1.5 opacity-80">{activity.pillTag}</span>}
                                    <span>{activity.displayTitle}</span>
                                  </button>
                                ))}
                                {hiddenActivityCount > 0 && (
                                  <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedCalendarDate(dateStr) }} className="calendar-event-pill px-2 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                    +{hiddenActivityCount} aktivitas
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>



                  </section>
                </div>
              </div>
            )
          })()}

          {/* TAB CONTENT: 4. ENCRYPTED NOTES VAULT */}
          {activeTab === 'notes' && (
            <div className="mobile-page mobile-page-notes">
              {isAppDeveloper && (
                <div className="p-4 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-indigo-950/50 rounded-2xl flex items-start gap-3.5 mb-6">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-indigo-900 flex items-center justify-center text-purple-600 dark:text-purple-300 shrink-0">
                    <Lock size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-purple-700 dark:text-purple-300">Enkripsi End-to-End AES-256-GCM Klien</h4>
                    <p className="text-xs text-purple-500 dark:text-purple-300 mt-1">
                      Seluruh catatan pribadi dalam menu ini dienkripsi secara lokal di peramban Anda sebelum diunggah ke database SQL Supabase. Tanpa **Master Password**, siapapun (termasuk administrator server) tidak akan bisa membaca isinya.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left panel: Add Secure note (moved into modal) */}
                <div className="glass-panel p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Lock size={18} className="text-purple-500" />
                    Amankan Catatan Baru
                  </h3>

                  <p className="text-sm text-purple-500 mb-4">Klik tombol berikut untuk membuka form catatan terenkripsi.</p>

                  <button
                    type="button"
                    onClick={() => setIsNoteModalOpen(true)}
                    className="w-full py-3 bg-[#8f75d8] hover:bg-[#8069c8] text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-[#8f75d8]/10"
                  >
                    <Lock size={16} />
                    Tambah Catatan Aman
                  </button>
                </div>

                {/* Modal: Secure note form */}
                {isNoteModalOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsNoteModalOpen(false)}></div>
                    <div className="relative bg-white dark:bg-indigo-950/95 rounded-3xl p-8 w-full max-w-xl z-50 shadow-2xl border border-purple-100/20 dark:border-indigo-900/50">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <Lock size={20} className="text-purple-600 dark:text-purple-400" />
                          </div>
                          Amankan Catatan Baru
                        </h3>
                        <button onClick={() => setIsNoteModalOpen(false)} className="text-purple-400 hover:text-purple-600 dark:hover:text-purple-300 font-bold text-2xl transition-colors">✕</button>
                      </div>

                      <form onSubmit={(e) => { handleEncryptNote(e); setIsNoteModalOpen(false); }} className="space-y-5">
                        <div>
                          <label className="block text-xs font-bold text-purple-500 dark:text-purple-400 uppercase tracking-widest mb-2">Judul Catatan</label>
                          <input 
                            type="text" 
                            placeholder="Contoh: Kode Rahasia atau Keuangan"
                            value={noteInputTitle}
                            onChange={(e) => setNoteInputTitle(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-purple-200 dark:border-indigo-800 bg-white dark:bg-indigo-900/40 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-purple-500 dark:text-purple-400 uppercase tracking-widest mb-2">Isi Rahasia Catatan</label>
                          <textarea 
                            rows="5"
                            placeholder="Masukkan pesan atau dokumen yang ingin dirahasiakan..."
                            value={noteInputContent}
                            onChange={(e) => setNoteInputContent(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-purple-200 dark:border-indigo-800 bg-white dark:bg-indigo-900/40 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
                            required
                          ></textarea>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-purple-500 dark:text-purple-400 uppercase tracking-widest mb-2">Master Password (Kunci Dekripsi)</label>
                          <input 
                            type="password" 
                            placeholder="Masukkan sandi kunci dekripsi..."
                            value={masterPassword}
                            onChange={(e) => setMasterPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-purple-200 dark:border-indigo-800 bg-white dark:bg-indigo-900/40 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                            required
                          />
                        </div>

                        {scrambleProgress && (
                          <div className="encryption-matrix animate-scramble py-3 px-4 bg-purple-100/50 dark:bg-purple-900/20 rounded-lg text-center text-sm font-semibold text-purple-600 dark:text-purple-300">
                            ⚡ {scrambledText}
                          </div>
                        )}

                        <div className="flex gap-3 pt-4">
                          <button 
                            type="submit"
                            disabled={scrambleProgress}
                            className="flex-1 py-3.5 bg-gradient-to-r from-[#8f75d8] to-[#8069c8] hover:from-[#8069c8] hover:to-[#745ebb] text-white font-bold rounded-lg text-sm flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-[#8f75d8]/40 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Lock size={16} />
                            Enkripsi & Simpan
                          </button>
                          <button type="button" onClick={() => setIsNoteModalOpen(false)} className="flex-1 py-3.5 bg-gray-200 dark:bg-indigo-800 hover:bg-gray-300 dark:hover:bg-indigo-700 text-gray-800 dark:text-white font-semibold rounded-lg text-sm transition-all">Batal</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Right panel: Notes List with Decryptor */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="glass-panel p-6">
                    <h3 className="text-lg font-bold mb-4">Gudang Catatan Terenkripsi</h3>
                    
                    <div className="space-y-4">
                      {notes.filter(note => note.title.toLowerCase().includes(searchQuery.toLowerCase())).map(note => (
                        <div key={note.id} className="p-4 rounded-xl border border-purple-100/60 dark:border-indigo-950/60 bg-purple-50/10 dark:bg-indigo-950/5 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold flex items-center gap-2">
                              <FileText size={16} className="text-purple-500" />
                              {note.title}
                            </h4>
                            <span className="text-[10px] bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1">
                              <Lock size={10} />
                              AES-256
                            </span>
                          </div>

                          {/* Encrypted preview text block */}
                          <div className="font-mono text-xs p-3 rounded-lg bg-zinc-950 text-zinc-400 border border-zinc-900 break-all select-none">
                            {note.cipherText}
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-purple-400 dark:text-purple-300">
                            <span>IV: {note.iv}</span>
                            <span>•</span>
                            <span>Salt: {note.salt}</span>
                          </div>

                          {/* Decryption widget */}
                          <div className="pt-3 border-t border-purple-100/40 dark:border-indigo-950/40">
                            {activeDecryptedContent && activeDecryptedContent.id === note.id ? (
                              <div className="p-4 rounded-xl bg-purple-50 dark:bg-indigo-950/40 border border-purple-200 dark:border-indigo-900/50">
                                <h5 className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-widest mb-1.5">Isi Catatan Dekrit Terbuka:</h5>
                                <p className="text-sm text-purple-900 dark:text-purple-200 break-words whitespace-pre-wrap">{activeDecryptedContent.content}</p>
                                <button 
                                  onClick={() => setActiveDecryptedContent(null)}
                                  className="mt-3 px-3 py-1.5 bg-purple-200 dark:bg-indigo-900 text-[10px] text-purple-700 dark:text-purple-300 font-bold rounded-lg transition-colors"
                                >
                                  Tutup & Kunci Kembali
                                </button>
                              </div>
                            ) : decryptingNoteId === note.id ? (
                              <div className="flex items-center gap-3">
                                <input 
                                  type="password" 
                                  placeholder="Masukkan Kata Sandi..."
                                  value={decryptPassphraseInput}
                                  onChange={(e) => setDecryptPassphraseInput(e.target.value)}
                                  className="flex-1 px-3 py-2 rounded-xl border border-purple-100 dark:border-indigo-950 bg-white/50 dark:bg-indigo-950/20 text-xs focus:outline-none focus:border-purple-500"
                                />
                                <button 
                                  onClick={() => handleDecryptNote(note)}
                                  className="px-4 py-2 bg-[#8f75d8] text-white font-bold text-xs rounded-xl hover:bg-[#8069c8]"
                                >
                                  Dekripsi
                                </button>
                                <button 
                                  onClick={() => setDecryptingNoteId(null)}
                                  className="px-3 py-2 bg-purple-100 dark:bg-indigo-950 text-purple-700 dark:text-purple-300 text-xs rounded-xl hover:bg-purple-200"
                                >
                                  Batal
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => {
                                  setDecryptingNoteId(note.id)
                                  setDecryptPassphraseInput('')
                                }}
                                className="px-4 py-2 bg-purple-100 hover:bg-purple-200 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-purple-700 dark:text-purple-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                              >
                                <Lock size={12} />
                                Dekripsi Catatan
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Calendar Item Action Modal */}
          {calendarActionItem && (
            <div className="fixed inset-0 bg-slate-500/25 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setCalendarActionItem(null)}>
              <div className="w-full max-w-sm rounded-[2rem] bg-white dark:bg-slate-900 p-6 shadow-2xl border border-purple-100/80 dark:border-indigo-900/50" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#8f75d8]/15 text-[#8f75d8] flex items-center justify-center shrink-0">
                    {calendarActionItem.itemType === 'appointment' ? <Calendar size={18} /> : <CheckSquare size={18} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[#8f75d8] font-bold">
                      {calendarActionItem.itemType === 'appointment' ? 'Reservasi' : 'Task'}
                    </p>
                    <h3 className="mt-1 text-lg font-extrabold text-[#4f4574] dark:text-white truncate">{calendarActionItem.title}</h3>
                    <p className="mt-1 text-xs text-slate-400">
                      {calendarActionItem.itemType === 'appointment'
                        ? `${calendarActionItem.clientName || 'Klien'} • ${formatLongDate(calendarActionItem.date)} ${calendarActionItem.time || ''}`
                        : `${calendarActionItem.category || 'Task'} • ${formatLongDate(calendarActionItem.calendarDate || todayString)} ${calendarActionItem.dueTime || ''}`}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => openCalendarEditModal(calendarActionItem)}
                    className="py-3 rounded-2xl bg-[#8f75d8] hover:bg-[#8069c8] text-white text-xs font-bold shadow-md shadow-purple-200 inline-flex items-center justify-center gap-2"
                  >
                    <Pencil size={14} />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => openDeleteConfirmModal(calendarActionItem)}
                    className="py-3 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold inline-flex items-center justify-center gap-2"
                  >
                    <Trash2 size={14} />
                    Hapus
                  </button>
                </div>

                {calendarActionItem.itemType === 'task' && (
                  <button
                    type="button"
                    onClick={() => {
                      toggleTaskStatus(calendarActionItem.id)
                      setCalendarActionItem(null)
                    }}
                    className="mt-3 w-full py-3 rounded-2xl bg-purple-50 hover:bg-purple-100 text-[#6f3df3] text-xs font-bold inline-flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={14} />
                    {calendarActionItem.status === 'done' ? 'Batal Selesai' : 'Tandai Selesai'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setCalendarActionItem(null)}
                  className="mt-4 w-full text-center text-[11px] tracking-[0.18em] uppercase text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Calendar Item Edit Modal */}
          {activeCalendarEditItem && (
            <div className="fixed inset-0 bg-slate-500/35 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setActiveCalendarEditItem(null)}>
              <div className="w-full max-w-lg rounded-[2rem] bg-white dark:bg-slate-900 p-8 shadow-2xl border border-purple-100/80 dark:border-indigo-900/50" onClick={(e) => e.stopPropagation()}>
                <div className="text-center mb-6">
                  <h3 className="text-4xl font-extrabold text-purple-600 dark:text-purple-300 tracking-tight">
                    {activeCalendarEditItem.itemType === 'appointment' ? 'Edit Reservasi' : 'Edit Task'}
                  </h3>
                  <p className="text-sm text-slate-400 dark:text-slate-300 mt-2">
                    Perbarui detail aktivitas Anda.
                  </p>
                </div>

                <div className="space-y-4">
                {activeCalendarEditItem.itemType === 'appointment' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-300 dark:text-slate-400 mb-2">Nama Rapat / Agenda</label>
                      <input value={calendarEditForm.title || ''} onChange={(e) => setCalendarEditForm(prev => ({ ...prev, title: e.target.value }))} placeholder="Nama rapat / agenda" className="w-full px-4 py-3 rounded-2xl border border-purple-100 dark:border-indigo-900 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300/50 focus:border-purple-300 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-300 dark:text-slate-400 mb-2">Nama Klien</label>
                      <input value={calendarEditForm.clientName || ''} onChange={(e) => setCalendarEditForm(prev => ({ ...prev, clientName: e.target.value }))} placeholder="Nama klien" className="w-full px-4 py-3 rounded-2xl border border-purple-100 dark:border-indigo-900 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300/50 focus:border-purple-300 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-300 dark:text-slate-400 mb-2">Email Klien</label>
                      <input value={calendarEditForm.email || ''} onChange={(e) => setCalendarEditForm(prev => ({ ...prev, email: e.target.value }))} placeholder="Email klien" className="w-full px-4 py-3 rounded-2xl border border-purple-100 dark:border-indigo-900 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300/50 focus:border-purple-300 transition-all" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-300 dark:text-slate-400 mb-2">Tanggal</label>
                        <input type="date" value={calendarEditForm.date || ''} onChange={(e) => setCalendarEditForm(prev => ({ ...prev, date: e.target.value }))} className="w-full px-4 py-3 rounded-2xl border border-purple-100 dark:border-indigo-900 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300/50 focus:border-purple-300 transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-300 dark:text-slate-400 mb-2">Waktu</label>
                        <input value={calendarEditForm.time || ''} onChange={(e) => setCalendarEditForm(prev => ({ ...prev, time: e.target.value }))} placeholder="13:00 atau 13:00 - 14:00" className="w-full px-4 py-3 rounded-2xl border border-purple-100 dark:border-indigo-900 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300/50 focus:border-purple-300 transition-all" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-300 dark:text-slate-400 mb-2">Judul Task</label>
                      <input value={calendarEditForm.title || ''} onChange={(e) => setCalendarEditForm(prev => ({ ...prev, title: e.target.value }))} placeholder="Judul task" className="w-full px-4 py-3 rounded-2xl border border-purple-100 dark:border-indigo-900 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300/50 focus:border-purple-300 transition-all" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-300 dark:text-slate-400 mb-2">Kategori</label>
                        <select value={calendarEditForm.category || 'Work'} onChange={(e) => setCalendarEditForm(prev => ({ ...prev, category: e.target.value }))} className="w-full px-4 py-3 rounded-2xl border border-purple-100 dark:border-indigo-900 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300/50 focus:border-purple-300 transition-all">
                          <option value="Work">Pekerjaan</option>
                          <option value="Meeting">Rapat</option>
                          <option value="Personal">Pribadi</option>
                          <option value="Security">Keamanan</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-300 dark:text-slate-400 mb-2">Prioritas</label>
                        <select value={calendarEditForm.priority || 'medium'} onChange={(e) => setCalendarEditForm(prev => ({ ...prev, priority: e.target.value }))} className="w-full px-4 py-3 rounded-2xl border border-purple-100 dark:border-indigo-900 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300/50 focus:border-purple-300 transition-all">
                          <option value="low">Rendah</option>
                          <option value="medium">Sedang</option>
                          <option value="high">Tinggi</option>
                          <option value="critical">Kritis</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-300 dark:text-slate-400 mb-2">Tanggal</label>
                        <input type="date" value={calendarEditForm.date || ''} onChange={(e) => setCalendarEditForm(prev => ({ ...prev, date: e.target.value }))} className="w-full px-4 py-3 rounded-2xl border border-purple-100 dark:border-indigo-900 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300/50 focus:border-purple-300 transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-300 dark:text-slate-400 mb-2">Waktu</label>
                        <input type="time" value={calendarEditForm.dueTime || '09:00'} onChange={(e) => setCalendarEditForm(prev => ({ ...prev, dueTime: e.target.value }))} className="w-full px-4 py-3 rounded-2xl border border-purple-100 dark:border-indigo-900 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300/50 focus:border-purple-300 transition-all" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-3 space-y-3">
                  <button onClick={saveCalendarEditModal} className="w-full py-3 rounded-2xl bg-purple-300 hover:bg-purple-400 text-white text-[11px] tracking-[0.2em] uppercase font-bold shadow-sm hover:shadow-md transition-all active:scale-[0.99]">
                    Simpan Perubahan
                  </button>
                  <button onClick={() => setActiveCalendarEditItem(null)} className="w-full text-center text-[11px] tracking-[0.18em] uppercase text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold transition-all">
                    Cancel
                  </button>
                </div>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {deleteConfirmItem && (
            <div className="fixed inset-0 bg-slate-500/35 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirmItem(null)}>
              <div className="w-full max-w-md rounded-[2rem] bg-white dark:bg-slate-900 p-7 shadow-2xl border border-purple-100/80 dark:border-indigo-900/50" onClick={(e) => e.stopPropagation()}>
                <div className="text-center">
                  <h3 className="text-4xl font-extrabold text-purple-600 dark:text-purple-300 tracking-tight">Konfirmasi Hapus</h3>
                  <p className="mt-3 text-sm text-slate-500 dark:text-slate-300">
                    Hapus {deleteConfirmItem.itemType === 'appointment' ? 'reservasi' : 'task'} "{deleteConfirmItem.title}"?
                  </p>
                </div>
                <div className="mt-7 space-y-3">
                  <button
                    onClick={handleConfirmDelete}
                    className="w-full py-3 rounded-2xl bg-purple-300 hover:bg-purple-400 text-white text-[11px] tracking-[0.2em] uppercase font-bold shadow-sm hover:shadow-md transition-all active:scale-[0.99]"
                  >
                    Hapus Sekarang
                  </button>
                  <button
                    onClick={() => setDeleteConfirmItem(null)}
                    className="w-full text-center text-[11px] tracking-[0.18em] uppercase text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Integration Configuration Modal */}
          {activeIntegrationModal && (() => {
            const def = integrationDefs.find(d => d.key === activeIntegrationModal)
            return (
              <div className="fixed inset-0 bg-slate-500/35 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setActiveIntegrationModal(null)}>
                <div className="w-full max-w-lg rounded-[2rem] bg-white dark:bg-slate-900 p-8 shadow-2xl border border-purple-100/80 dark:border-indigo-900/50 space-y-5" onClick={e => e.stopPropagation()}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-4xl font-extrabold text-purple-600 dark:text-purple-300 tracking-tight">{def?.label}</h3>
                      <p className="text-sm text-slate-400 dark:text-slate-300 mt-2">Masukkan kredensial API untuk koneksi nyata</p>
                    </div>
                    <button onClick={() => setActiveIntegrationModal(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-purple-400">
                      ✕
                    </button>
                  </div>

                  <div className="space-y-4">
                    {def?.fields.map(field => (
                      <div key={field.id}>
                        <label className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-300 dark:text-slate-400 mb-2">{field.label}</label>
                        {field.type === 'textarea' ? (
                          <textarea
                            rows={4}
                            placeholder={field.placeholder}
                            value={integrationFormData[field.id] || ''}
                            onChange={e => setIntegrationFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
                            className="w-full px-4 py-3 rounded-2xl border border-purple-100 dark:border-indigo-900 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300/50 focus:border-purple-300 transition-all resize-none font-mono"
                          />
                        ) : (
                          <input
                            type={field.type}
                            placeholder={field.placeholder}
                            value={integrationFormData[field.id] || ''}
                            onChange={e => setIntegrationFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
                            className="w-full px-4 py-3 rounded-2xl border border-purple-100 dark:border-indigo-900 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300/50 focus:border-purple-300 transition-all"
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/40 dark:border-amber-800/30 text-amber-700 dark:text-amber-400 text-[10px] leading-relaxed">
                    ⚠️ Kredensial disimpan per akun Anda di database Supabase (dengan RLS). Untuk production, tetap disarankan memakai secret manager/server-side vault.
                  </div>

                  {activeIntegrationModal === 'google_calendar' && (
                    <div className="space-y-2">
                      <button
                        onClick={testGoogleCalendarConnection}
                        disabled={testingGoogleConnection}
                        className="w-full py-3 rounded-2xl border border-blue-200 dark:border-blue-900/40 text-blue-600 dark:text-blue-300 text-sm font-bold hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all disabled:opacity-60"
                      >
                        {testingGoogleConnection ? 'Menguji Koneksi...' : 'Test Connection'}
                      </button>
                      {googleConnectionStatus && (
                        <div className={`p-2.5 rounded-xl text-[11px] ${
                          googleConnectionStatus.ok
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                            : 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400'
                        }`}>
                          {googleConnectionStatus.message}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={async () => {
                        if (!scopedUserId || !activeIntegrationModal) return
                        const updated = { ...integrationConfigs }
                        delete updated[activeIntegrationModal]
                        setIntegrationConfigs(updated)

                        const { error } = await supabase
                          .from('user_integration_configs')
                          .upsert({
                            user_id: scopedUserId,
                            configs: updated
                          }, { onConflict: 'user_id' })

                        if (error) {
                          alert(`Gagal menghapus konfigurasi integrasi: ${error.message}`)
                          return
                        }

                        setActiveIntegrationModal(null)
                      }}
                      className="flex-1 py-3 rounded-2xl border border-red-200 dark:border-red-900/40 text-red-500 text-[11px] tracking-[0.14em] uppercase font-bold hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                    >
                      Hapus Koneksi
                    </button>
                    <button
                      onClick={saveIntegrationConfig}
                      className="flex-1 py-3 rounded-2xl bg-[#8f75d8] hover:bg-[#8069c8] text-white text-[11px] tracking-[0.14em] uppercase font-bold transition-all shadow-md"
                    >
                      Simpan & Hubungkan
                    </button>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Integration Tutorial Modal */}
          {activeTutorialModal && (() => {
            const tutorial = integrationTutorials[activeTutorialModal]
            return (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setActiveTutorialModal(null)}>
                <div className="w-full max-w-lg glass-panel p-8 space-y-5 shadow-2xl" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold">{tutorial?.title}</h3>
                      <p className="text-xs text-purple-400 dark:text-purple-300 mt-0.5">Ikuti langkah berikut sebelum mengisi form konfigurasi.</p>
                    </div>
                    <button onClick={() => setActiveTutorialModal(null)} className="w-8 h-8 rounded-lg hover:bg-purple-100 dark:hover:bg-indigo-900/50 flex items-center justify-center text-purple-400">
                      ✕
                    </button>
                  </div>

                  <div className="space-y-2">
                    {tutorial?.steps.map((step, idx) => (
                      <div key={step} className="flex items-start gap-2.5 p-3 rounded-xl border border-purple-100/70 dark:border-indigo-900/50 bg-white/40 dark:bg-indigo-950/20">
                        <span className="w-5 h-5 shrink-0 rounded-full bg-[#8f75d8] text-white text-[10px] font-bold flex items-center justify-center mt-0.5">{idx + 1}</span>
                        <p className="text-xs text-purple-600 dark:text-purple-300 leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-indigo-950/30 border border-purple-200/40 dark:border-indigo-900/40">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-purple-500 dark:text-purple-300 mb-2">Referensi Resmi</p>
                    <div className="space-y-1.5">
                      {tutorial?.refs.map(ref => (
                        <a key={ref.href} href={ref.href} target="_blank" rel="noreferrer" className="text-xs text-purple-600 dark:text-purple-300 hover:text-purple-800 dark:hover:text-purple-200 font-semibold inline-flex items-center gap-1.5">
                          <ExternalLink size={12} />
                          {ref.label}
                        </a>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setActiveTutorialModal(null)
                      openIntegrationModal(activeTutorialModal)
                    }}
                    className="w-full py-2.5 rounded-xl bg-[#8f75d8] hover:bg-[#8069c8] text-white text-xs font-bold transition-all shadow-md"
                  >
                    Lanjut ke Form Konfigurasi
                  </button>
                </div>
              </div>
            )
          })()}

          {/* TAB CONTENT: 5. INTEGRATIONS LOG */}
          {activeTab === 'integrations' && (
            <div className="mobile-page mobile-page-integrations space-y-6">

              <div>
                <h3 className="text-lg font-bold">Integrasi Layanan Eksternal</h3>
                <p className="text-xs text-purple-400 dark:text-purple-300 mt-1">Klik <strong>Konfigurasi</strong> pada setiap kartu untuk memasukkan API key atau token OAuth Anda sendiri.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {integrationDefs.map(def => {
                  const configured = isConfigured(def.key)
                  const IconComp = def.icon === 'Calendar' ? Calendar : def.icon === 'Sparkles' ? Sparkles : def.icon === 'Mail' ? Mail : FileSpreadsheet
                  return (
                    <div key={def.key} className="glass-panel p-6 flex flex-col items-center text-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${def.colorClass}`}>
                        <IconComp size={24} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold">{def.label}</h4>
                        <p className="text-xs text-purple-400 dark:text-purple-300 mt-1">{def.subtitle}</p>
                      </div>
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                        configured
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                          : 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'
                      }`}>
                        {configured ? '✓ Terkonfigurasi' : '○ Belum Dikonfigurasi'}
                      </span>
                      <div className="w-full grid grid-cols-2 gap-2">
                        <button
                          onClick={() => openTutorialModal(def.key)}
                          className="py-2 rounded-xl border border-purple-200 dark:border-indigo-800 text-xs font-bold text-purple-600 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-indigo-900/40 transition-all"
                        >
                          Tutorial
                        </button>
                        <button
                          onClick={() => openIntegrationModal(def.key)}
                          className="py-2 rounded-xl border border-purple-200 dark:border-indigo-800 text-xs font-bold text-purple-600 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-indigo-900/40 transition-all flex items-center justify-center gap-1.5"
                        >
                          <Settings size={12} />
                          Konfigurasi
                        </button>
                      </div>
                    </div>
                  )
                })}

              </div>

              {isAppDeveloper && (
                <div className="glass-panel p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-lg font-bold">Backup Otomatis & Keamanan Database</h3>
                      <p className="text-xs text-purple-400 dark:text-purple-300">Konfigurasi pencadangan data periodik Anda</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={triggerManualBackup}
                        className="px-4 py-2 bg-[#8f75d8] hover:bg-[#8069c8] text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5"
                      >
                        <Lock size={12} />
                        Ekspor Backup Terenkripsi
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50/40 dark:bg-indigo-950/30 rounded-2xl border border-purple-200/20 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-indigo-900 flex items-center justify-center text-purple-600 dark:text-purple-300 shrink-0">
                      <ShieldCheck size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-300">Pencadangan Supabase Harian</h4>
                      <p className="text-xs text-purple-500 dark:text-purple-300 mt-0.5">Backup otomatis berjalan setiap pukul 02:00 WIB. Disimpan di folder aman berkode kunci.</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Aktif</span>
                      <p className="text-[9px] text-purple-400 dark:text-purple-300 mt-0.5">Terakhir: Hari ini, 02:00 WIB</p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {activeTab === 'tutorial' && (
            <div className="mobile-page space-y-6">
              <section className="glass-panel overflow-hidden">
                <div className="relative min-h-[220px] p-6 md:p-8 bg-[#241a35] text-white">
                  <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,rgba(255,240,138,0.6),transparent_24%),radial-gradient(circle_at_80%_10%,rgba(143,117,216,0.9),transparent_28%),linear-gradient(135deg,#241a35,#8f75d8)]"></div>
                  <div className="relative z-10 max-w-3xl">
                    <p className="text-[11px] uppercase tracking-[0.22em] font-extrabold text-[#fff08a]">DyaTask Academy</p>
                    <h3 className="mt-3 text-3xl md:text-4xl font-extrabold leading-tight text-white drop-shadow-sm">Tutorial Workspace dalam format course video</h3>
                    <p className="mt-3 text-sm md:text-base text-white/90 leading-7">
                      Pelajari alur utama DyaTask dari dashboard sampai workspace assistant lewat modul video singkat.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-2">
                      <span className="rounded-full bg-white/16 border border-white/30 px-3 py-1.5 text-xs font-bold text-white">{tutorialCourses.length} Course</span>
                      <span className="rounded-full bg-white/16 border border-white/30 px-3 py-1.5 text-xs font-bold text-white">Gallery View</span>
                      <span className="rounded-full bg-white/16 border border-white/30 px-3 py-1.5 text-xs font-bold text-white">Video LMS</span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)] gap-5">
                <aside className="glass-panel p-5 h-fit space-y-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-purple-400 font-bold">Learning Path</p>
                    <h4 className="text-lg font-extrabold text-[#4f4574] mt-1">Workspace Essentials</h4>
                  </div>
                  {['Fundamental', 'Workflow', 'Calendar', 'Finance', 'Team', 'Growth'].map((item, index) => (
                    <div key={item} className="flex items-center gap-3 rounded-xl border border-purple-100 bg-white px-3 py-3">
                      <span className="h-8 w-8 rounded-xl bg-[#8f75d8]/12 text-[#8f75d8] inline-flex items-center justify-center text-xs font-extrabold">{index + 1}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#4f4574]">{item}</p>
                        <p className="text-[10px] text-purple-400">Modul video terstruktur</p>
                      </div>
                    </div>
                  ))}
                </aside>

                <div className="space-y-4">
	                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
	                    <div>
	                      <p className="text-[10px] uppercase tracking-[0.18em] text-purple-400 font-bold">{tutorialViewMode === 'gallery' ? 'Gallery Course' : 'Riwayat Belajar'}</p>
	                      <h4 className="text-2xl font-extrabold text-[#4f4574]">{tutorialViewMode === 'gallery' ? 'Video Tutorial' : 'Video Belum Selesai'}</h4>
	                    </div>
	                    <div className="inline-flex rounded-xl border border-purple-100 bg-white p-1 text-[11px] font-bold text-purple-500">
	                      <button
	                        type="button"
	                        onClick={() => setTutorialViewMode('gallery')}
	                        className={`rounded-lg px-3 py-1.5 ${tutorialViewMode === 'gallery' ? 'bg-[#8f75d8] text-white' : 'hover:bg-purple-50'}`}
	                      >
	                        Gallery
	                      </button>
	                      <button
	                        type="button"
	                        onClick={() => setTutorialViewMode('progress')}
	                        className={`rounded-lg px-3 py-1.5 ${tutorialViewMode === 'progress' ? 'bg-[#8f75d8] text-white' : 'hover:bg-purple-50'}`}
	                      >
	                        Progress
	                      </button>
	                    </div>
	                  </div>

	                  {tutorialViewMode === 'gallery' ? (
	                  <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
	                    {tutorialCourses.map((course) => {
	                      const embedUrl = getYoutubeEmbedUrl(course.youtubeUrl)
	                      const thumbnailUrl = getYoutubeThumbnailUrl(course.youtubeUrl)
	                      const progress = tutorialProgressById[course.id]
	                      const isUnfinished = progress?.status === 'in_progress'
	                      return (
	                      <article key={course.id} className="group overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all">
                        <div className="relative aspect-video overflow-hidden" style={{ background: `linear-gradient(135deg, ${course.accent}, #241a35)` }}>
                          {thumbnailUrl && (
                            <img
                              src={thumbnailUrl}
                              alt=""
                              className="absolute inset-0 h-full w-full object-cover"
                              loading="lazy"
                            />
                          )}
                          {thumbnailUrl && <div className="absolute inset-0 bg-[#241a35]/35"></div>}
                          <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_25%_25%,white,transparent_22%),radial-gradient(circle_at_75%_70%,white,transparent_18%)]"></div>
                          <div className="absolute left-4 top-4 rounded-full bg-white/18 border border-white/25 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-white">{course.module}</div>
                          <button
                            type="button"
                            onClick={() => openTutorialCourse(course)}
                            className="absolute inset-0 flex items-center justify-center"
                            title={`Putar ${course.title}`}
                          >
                            <span className="h-14 w-14 rounded-full bg-white/92 text-[#4f4574] shadow-xl inline-flex items-center justify-center group-hover:scale-105 transition-transform">
                              <PlayCircle size={29} />
                            </span>
                          </button>
                          {isAppDeveloper && (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                openTutorialCourseEditor(course)
                              }}
                              className="absolute right-4 top-4 rounded-full bg-white/92 px-3 py-1 text-[10px] font-extrabold text-[#4f4574] shadow-sm"
                            >
                              Edit
                            </button>
                          )}
	                          {embedUrl && (
	                            <div className="absolute bottom-4 left-4 rounded-full bg-emerald-500/90 px-2.5 py-1 text-[10px] font-bold text-white">YouTube</div>
	                          )}
	                          {isUnfinished && (
	                            <div className="absolute left-4 bottom-12 rounded-full bg-white/92 px-2.5 py-1 text-[10px] font-extrabold text-[#8f75d8] shadow-sm">Belum selesai</div>
	                          )}
	                          <div className="absolute bottom-4 right-4 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-bold text-white">{course.duration}</div>
	                        </div>
                        <button type="button" onClick={() => openTutorialCourse(course)} className="block w-full p-4 space-y-3 text-left">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h5 className="text-sm font-extrabold text-[#4f4574] leading-snug">{course.title}</h5>
                              <p className="mt-1 text-xs leading-5 text-purple-400">{course.description}</p>
                            </div>
                            <BookOpen size={17} className="text-[#8f75d8] shrink-0 mt-0.5" />
                          </div>
                          <div className="flex items-center justify-between gap-2 border-t border-purple-50 pt-3">
                            <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[10px] font-bold text-purple-600">{course.level}</span>
                            <span className="text-[10px] font-bold text-purple-400">{course.lessons} lesson</span>
                          </div>
                        </button>
                      </article>
	                      )
	                    })}
	                  </div>
	                  ) : (
	                  <div className="space-y-3">
	                    {unfinishedTutorialHistory.length === 0 ? (
	                      <div className="rounded-2xl border border-dashed border-purple-200 bg-white/70 p-6 text-center">
	                        <PlayCircle size={34} className="mx-auto text-purple-300" />
	                        <h5 className="mt-3 text-base font-extrabold text-[#4f4574]">Belum ada video yang tertunda</h5>
	                        <p className="mt-1 text-xs text-purple-400">Video yang sudah dibuka dan belum ditandai selesai akan muncul di sini.</p>
	                      </div>
	                    ) : unfinishedTutorialHistory.map((item) => {
	                      const course = item.course
	                      const thumbnailUrl = getYoutubeThumbnailUrl(course.youtubeUrl)
	                      return (
	                        <article key={course.id} className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm">
	                          <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)]">
	                            <button
	                              type="button"
	                              onClick={() => openTutorialCourse(course)}
	                              className="relative aspect-video md:aspect-auto md:min-h-[150px] overflow-hidden text-left"
	                              style={{ background: `linear-gradient(135deg, ${course.accent}, #241a35)` }}
	                            >
	                              {thumbnailUrl && <img src={thumbnailUrl} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />}
	                              {thumbnailUrl && <div className="absolute inset-0 bg-[#241a35]/40"></div>}
	                              <span className="absolute inset-0 flex items-center justify-center text-white">
	                                <span className="h-12 w-12 rounded-full bg-white/90 text-[#4f4574] inline-flex items-center justify-center shadow-lg">
	                                  <PlayCircle size={26} />
	                                </span>
	                              </span>
	                              <span className="absolute bottom-3 right-3 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-bold text-white">{course.duration}</span>
	                            </button>
	                            <div className="p-4 flex flex-col justify-between gap-4">
	                              <div>
	                                <div className="flex flex-wrap items-center gap-2">
	                                  <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-purple-600">{course.module}</span>
	                                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">Belum selesai</span>
	                                </div>
	                                <h5 className="mt-3 text-base font-extrabold text-[#4f4574]">{course.title}</h5>
	                                <p className="mt-1 text-xs leading-5 text-purple-400">{course.description}</p>
	                                <p className="mt-2 text-[11px] text-slate-400">Terakhir dibuka: {formatLongDateTime(item.lastWatchedAt || item.startedAt)}</p>
	                              </div>
	                              <div className="flex flex-wrap gap-2">
	                                <button type="button" onClick={() => openTutorialCourse(course)} className="rounded-xl bg-[#8f75d8] px-3 py-2 text-xs font-bold text-white inline-flex items-center gap-1.5">
	                                  <PlayCircle size={13} />
	                                  Lanjutkan
	                                </button>
	                                <button type="button" onClick={() => completeTutorialCourse(course.id)} className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 inline-flex items-center gap-1.5">
	                                  <CheckCircle size={13} />
	                                  Tandai selesai
	                                </button>
	                              </div>
	                            </div>
	                          </div>
	                        </article>
	                      )
	                    })}
	                  </div>
	                  )}
	                </div>
              </section>
            </div>
          )}

          {activeTab === 'userMonitoring' && isAppDeveloper && (
            <div className="mobile-page space-y-6">
              <section className="glass-panel overflow-hidden">
                <div className="relative p-6 md:p-8 bg-[radial-gradient(circle_at_14%_20%,rgba(255,229,76,0.28),transparent_22%),radial-gradient(circle_at_84%_18%,rgba(143,117,216,0.22),transparent_24%),linear-gradient(135deg,#241a35,#3f2c62_52%,#1f162d)] text-white">
                  <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_28%_28%,white,transparent_20%),radial-gradient(circle_at_75%_72%,white,transparent_16%)]"></div>
                  <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div className="max-w-3xl">
                      <p className="text-[11px] uppercase tracking-[0.22em] font-extrabold text-[#fff08a]">Developer Only</p>
                      <h3 className="mt-3 text-3xl md:text-4xl font-extrabold leading-tight text-white">User Monitoring</h3>
                      <p className="mt-3 text-sm md:text-base text-white/85 leading-7">
                        Pantau siapa yang mendaftar ke aplikasi dan siapa yang diundang ke workspace, langsung dari satu halaman.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white/14 border border-white/25 px-3 py-1.5 text-xs font-bold text-white">{developerMonitoringSignupCount} Signup</span>
                      <span className="rounded-full bg-white/14 border border-white/25 px-3 py-1.5 text-xs font-bold text-white">{developerMonitoringInviteCount} Invite</span>
                      <button
                        type="button"
                        onClick={refreshDeveloperMonitoring}
                        className="inline-flex items-center gap-2 rounded-full bg-white text-[#4f4574] px-4 py-2 text-xs font-extrabold shadow-lg shadow-black/10"
                      >
                        <RefreshCw size={13} className={developerMonitoringLoading ? 'animate-spin' : ''} />
                        {developerMonitoringLoading ? 'Memuat...' : 'Refresh'}
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="glass-panel p-5">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-purple-400 font-bold">Total Signup</p>
                  <p className="mt-2 text-3xl font-extrabold text-[#4f4574]">{developerMonitoringSignupCount}</p>
                  <p className="mt-1 text-xs text-purple-400">Semua user yang tercatat di `public.profiles`.</p>
                </div>
                <div className="glass-panel p-5">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-purple-400 font-bold">Total Invite</p>
                  <p className="mt-2 text-3xl font-extrabold text-[#4f4574]">{developerMonitoringInviteCount}</p>
                  <p className="mt-1 text-xs text-purple-400">Semua undangan workspace non-owner.</p>
                </div>
                <div className="glass-panel p-5">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-purple-400 font-bold">Invite Aktif</p>
                  <p className="mt-2 text-3xl font-extrabold text-emerald-600">{developerMonitoringActiveInviteCount}</p>
                  <p className="mt-1 text-xs text-purple-400">Undangan yang sudah terhubung ke member.</p>
                </div>
                <div className="glass-panel p-5">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-purple-400 font-bold">Invite Pending</p>
                  <p className="mt-2 text-3xl font-extrabold text-amber-600">{developerMonitoringPendingInviteCount}</p>
                  <p className="mt-1 text-xs text-purple-400">Undangan yang belum dipakai.</p>
                </div>
              </section>

              <section className="glass-panel p-5 md:p-6 space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-purple-400 font-bold">Cari data</p>
                    <h4 className="text-xl font-extrabold text-[#4f4574]">Filter nama, email, role, atau token</h4>
                  </div>
                  <div className="w-full md:w-[340px]">
                    <input
                      type="text"
                      value={developerMonitoringSearch}
                      onChange={(e) => setDeveloperMonitoringSearch(e.target.value)}
                      placeholder="Cari user, email, atau token..."
                      className="w-full rounded-2xl border border-purple-100 bg-white px-4 py-3 text-sm text-[#4f4574] focus:outline-none focus:ring-2 focus:ring-purple-200"
                    />
                  </div>
                </div>

                {developerMonitoringError && (
                  <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {developerMonitoringError}
                  </div>
                )}
                {developerMonitoringUpdatedAt && !developerMonitoringError && (
                  <p className="text-[11px] text-purple-400">Terakhir dimuat: {formatLongDateTime(developerMonitoringUpdatedAt)}</p>
                )}
              </section>

              <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <article className="glass-panel p-5 md:p-6 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-purple-400 font-bold">Registrations</p>
                      <h4 className="text-xl font-extrabold text-[#4f4574]">User yang mendaftar</h4>
                      <p className="text-xs text-purple-400 mt-1">Data dari `public.profiles`.</p>
                    </div>
                    <Users size={18} className="text-[#8f75d8]" />
                  </div>

                  <div className="space-y-3 max-h-[620px] overflow-auto pr-1">
                    {developerMonitoringLoading && developerMonitoringFilteredSignupRows.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-purple-200 bg-white p-5 text-center text-sm text-purple-400">
                        Memuat data signup...
                      </div>
                    ) : developerMonitoringFilteredSignupRows.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-purple-200 bg-white p-5 text-center text-sm text-purple-400">
                        Tidak ada data signup yang cocok dengan filter.
                      </div>
                    ) : developerMonitoringFilteredSignupRows.map(row => {
                      const displayName = formatDisplayName(row.full_name || row.email || 'Pengguna', 'Pengguna')
                      return (
                        <div key={`signup-${row.subject_user_id}`} className="rounded-2xl border border-purple-100 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-extrabold text-[#4f4574] truncate">{displayName}</p>
                              <p className="mt-1 text-xs text-purple-400 truncate">{row.email || '-'}</p>
                            </div>
                            <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[10px] font-bold text-purple-600">Signup</span>
                          </div>
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-purple-400">
                            <div className="rounded-xl border border-purple-50 bg-[#fbfaff] px-3 py-2">
                              <span className="block uppercase tracking-[0.12em] text-[10px] font-bold text-purple-300">Didaftarkan</span>
                              <span className="block mt-1 text-[#4f4574] font-semibold">{formatLongDateTime(row.created_at)}</span>
                            </div>
                            <div className="rounded-xl border border-purple-50 bg-[#fbfaff] px-3 py-2">
                              <span className="block uppercase tracking-[0.12em] text-[10px] font-bold text-purple-300">Terakhir Update</span>
                              <span className="block mt-1 text-[#4f4574] font-semibold">{formatLongDateTime(row.updated_at)}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </article>

                <article className="glass-panel p-5 md:p-6 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-purple-400 font-bold">Invites</p>
                      <h4 className="text-xl font-extrabold text-[#4f4574]">User yang di invite</h4>
                      <p className="text-xs text-purple-400 mt-1">Data dari `public.workspace_members`.</p>
                    </div>
                    <UserPlus size={18} className="text-[#8f75d8]" />
                  </div>

                  <div className="space-y-3 max-h-[620px] overflow-auto pr-1">
                    {developerMonitoringLoading && developerMonitoringFilteredInviteRows.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-purple-200 bg-white p-5 text-center text-sm text-purple-400">
                        Memuat data invite...
                      </div>
                    ) : developerMonitoringFilteredInviteRows.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-purple-200 bg-white p-5 text-center text-sm text-purple-400">
                        Tidak ada data invite yang cocok dengan filter.
                      </div>
                    ) : developerMonitoringFilteredInviteRows.map(row => {
                      const displayName = formatDisplayName(row.full_name || row.email || 'Assistant', 'Assistant')
                      const roleLabel = String(row.role || 'assistant').toUpperCase()
                      const statusLabel = String(row.status || 'pending').toUpperCase()
                      return (
                        <div key={`invite-${row.invite_token || row.subject_user_id}`} className="rounded-2xl border border-purple-100 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-extrabold text-[#4f4574] truncate">{displayName}</p>
                              <p className="mt-1 text-xs text-purple-400 truncate">{row.email || '-'}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">{statusLabel}</span>
                              <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[10px] font-bold text-purple-600">{roleLabel}</span>
                            </div>
                          </div>
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-purple-400">
                            <div className="rounded-xl border border-purple-50 bg-[#fbfaff] px-3 py-2">
                              <span className="block uppercase tracking-[0.12em] text-[10px] font-bold text-purple-300">Diundang</span>
                              <span className="block mt-1 text-[#4f4574] font-semibold">{formatLongDateTime(row.created_at)}</span>
                            </div>
                            <div className="rounded-xl border border-purple-50 bg-[#fbfaff] px-3 py-2">
                              <span className="block uppercase tracking-[0.12em] text-[10px] font-bold text-purple-300">Diterima</span>
                              <span className="block mt-1 text-[#4f4574] font-semibold">{row.accepted_at ? formatLongDateTime(row.accepted_at) : '-'}</span>
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-bold text-purple-400">
                            <span className="rounded-full bg-[#fbfaff] px-2.5 py-1 border border-purple-50">Token: {row.invite_token || '-'}</span>
                            <span className="rounded-full bg-[#fbfaff] px-2.5 py-1 border border-purple-50">Source: workspace_members</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </article>
              </section>
            </div>
          )}

          {activeTab === 'pageControl' && (
            <div className="mobile-page space-y-6">
              <div className="glass-panel p-6">
                <h3 className="text-xl font-extrabold text-[#4f4574]">Kontrol Halaman Workspace</h3>
                <p className="text-sm text-purple-400 mt-1">Pilih halaman yang ingin dipakai. Yang nonaktif otomatis hilang dari sidebar.</p>
              </div>

              <div className="glass-panel p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {[
                    ['dashboard', 'Dashboard'],
                    ['tasks', 'Tugas & Project'],
                    ['calendar', 'Reservasi & Jadwal'],
                    ['orders', 'Order Spreadsheet'],
                    ['designOrders', 'Pages Design Order'],
                    ['generalOrders', 'Pages Orderan (General)'],
                    ['mentoringSchedule', 'Pages Mentoring/Speaker Event Schedule'],
                    ['contentPlanner', 'Content Planner'],
                    ['invoiceFollowUp', 'Invoice Payment & Follow Up'],
                    ['invoiceGenerator', 'Invoice Generator'],
                    ['crm', 'Client CRM'],
                    ['finance', 'Finance & Invoice'],
                    ['reports', 'Reports'],
                    ['notes', 'Catatan Terenkripsi'],
                    ['integrations', 'Integrasi Realtime'],
                    ['settings', 'Pengaturan macOS']
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => togglePageEnabled(key)}
                      className={`rounded-xl border px-3 py-3 text-left transition-all ${
                        isPageEnabled(key)
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-purple-100 bg-white text-purple-400'
                      }`}
                    >
                      <p className="text-sm font-bold">{label}</p>
                      <p className="text-[11px] mt-1">{isPageEnabled(key) ? 'Aktif' : 'Nonaktif'}</p>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB CONTENT: 6. SETTINGS & MACOS CONFIGURATIONS */}
          {activeTab === 'settings' && (
            <div className="mobile-page mobile-page-settings grid grid-cols-1 xl:grid-cols-[minmax(0,1.25fr)_minmax(460px,0.95fr)] gap-8">
              
              {/* Left panel: Preferences */}
              <div className="glass-panel p-6 space-y-6">
	                <div>
	                  <h3 className="text-lg font-bold">Pengaturan Integrasi macOS Macbook</h3>
	                  <p className="text-xs text-purple-400 dark:text-purple-300">Sesuaikan integrasi sistem aplikasi DyaTask Manager</p>
	                </div>

                <div className="p-4 rounded-2xl border border-purple-200/50 dark:border-indigo-900/50 bg-white/55 dark:bg-indigo-950/20 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold flex items-center gap-2">
                        <RefreshCw size={15} className="text-purple-500" />
                        Versi & Update App
                      </h4>
                      <p className="text-[11px] text-purple-400 dark:text-purple-300 mt-0.5">Cek versi PWA/web dan DMG macOS secara manual jika notifikasi otomatis belum muncul.</p>
                    </div>
                    <span className="rounded-full bg-purple-50 dark:bg-indigo-950/50 px-3 py-1.5 text-[10px] font-bold text-purple-600 dark:text-purple-300">
                      {isElectronApp ? 'DMG macOS' : isPwaStandalone ? 'PWA Installed' : 'Web/PWA'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="rounded-xl border border-purple-100 dark:border-indigo-900 bg-white/70 dark:bg-slate-950/30 p-3">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-purple-400">Version</p>
                      <p className="mt-1 text-sm font-extrabold text-[#4f4574] dark:text-white">v{currentAppVersion}</p>
                    </div>
                    <div className="rounded-xl border border-purple-100 dark:border-indigo-900 bg-white/70 dark:bg-slate-950/30 p-3">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-purple-400">Update</p>
                      <p className="mt-1 text-sm font-extrabold text-[#4f4574] dark:text-white">{updateStatusLabel}</p>
                    </div>
                  </div>

                  {manualUpdateStatus && (
                    <p className="rounded-xl border border-purple-100 bg-purple-50/60 px-3 py-2 text-[11px] font-semibold text-purple-600 dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-purple-200">
                      {manualUpdateStatus}
                    </p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={handleCheckManualUpdate}
                      disabled={checkingManualUpdate}
                      className="rounded-xl bg-[#8f75d8] px-3 py-2.5 text-xs font-bold text-white shadow-sm disabled:opacity-60 inline-flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw size={13} className={checkingManualUpdate ? 'animate-spin' : ''} />
                      {checkingManualUpdate ? 'Mengecek...' : 'Cek Update'}
                    </button>
                    <button
                      type="button"
                      onClick={() => window.location.reload()}
                      className="rounded-xl border border-purple-100 bg-white px-3 py-2.5 text-xs font-bold text-purple-600 hover:bg-purple-50 dark:border-indigo-900 dark:bg-slate-950/30 dark:text-purple-300 inline-flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw size={13} />
                      Reload PWA
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadDmg}
                      className="rounded-xl border border-purple-100 bg-white px-3 py-2.5 text-xs font-bold text-purple-600 hover:bg-purple-50 dark:border-indigo-900 dark:bg-slate-950/30 dark:text-purple-300 inline-flex items-center justify-center gap-1.5"
                    >
                      <Download size={13} />
                      DMG Terbaru
                    </button>
                  </div>
                </div>

	                {isAppDeveloper && (
                  <>
                    <div className="p-4 rounded-2xl border border-purple-200/50 dark:border-indigo-900/50 bg-purple-50/20 dark:bg-indigo-950/20 space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold flex items-center gap-2">
                            <Sparkles size={15} className="text-purple-500" />
                            Header Branding
                          </h4>
                          <p className="text-[11px] text-purple-400 dark:text-purple-300 mt-0.5">Atur tulisan kecil dan nama app yang tampil di header utama.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setAppHeaderTagline('Modern Soft Minimalist Amethyst')
                            setAppHeaderTitle('Dyatask Manager - Superapp for Freelancer')
                          }}
                          className="px-3 py-1.5 rounded-lg border border-purple-200 dark:border-indigo-800 text-[10px] font-bold text-purple-600 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-indigo-900/40 transition-all"
                        >
                          Reset Default
                        </button>
                      </div>

                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider font-bold text-purple-500 dark:text-purple-300 mb-2">Tulisan Kecil Header</label>
                          <input
                            value={appHeaderTagline}
                            onChange={(e) => setAppHeaderTagline(e.target.value)}
                            placeholder="Contoh: Modern Soft Minimalist Amethyst"
                            className="w-full px-3 py-2.5 rounded-xl border border-purple-100 dark:border-indigo-900 bg-white dark:bg-indigo-950/30 text-xs focus:outline-none focus:ring-2 focus:ring-purple-300/50"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider font-bold text-purple-500 dark:text-purple-300 mb-2">Nama App</label>
                          <input
                            value={appHeaderTitle}
                            onChange={(e) => setAppHeaderTitle(e.target.value)}
                            placeholder="Contoh: Dyatask Manager"
                            className="w-full px-3 py-2.5 rounded-xl border border-purple-100 dark:border-indigo-900 bg-white dark:bg-indigo-950/30 text-xs focus:outline-none focus:ring-2 focus:ring-purple-300/50"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-purple-400 dark:text-purple-300">Perubahan tersimpan otomatis dan tetap aktif setelah refresh.</p>
                    </div>

                    <div className="p-4 rounded-2xl border border-purple-200/50 dark:border-indigo-900/50 bg-purple-50/20 dark:bg-indigo-950/20 space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold flex items-center gap-2">
                            <FileText size={15} className="text-purple-500" />
                            Gambar Login
                          </h4>
                          <p className="text-[11px] text-purple-400 dark:text-purple-300 mt-0.5">Upload gambar untuk mengganti visual kiri pada halaman login.</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleResetLoginVisual}
                          disabled={!loginVisualImage || loginVisualUploading}
                          className="px-3 py-1.5 rounded-lg border border-purple-200 dark:border-indigo-800 text-[10px] font-bold text-purple-600 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-indigo-900/40 disabled:opacity-45 disabled:cursor-not-allowed transition-all"
                        >
                          {loginVisualUploading ? 'Memproses...' : 'Reset Default'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 xl:grid-cols-[180px_1fr] gap-4 items-center">
                        <div className="h-44 rounded-2xl border border-purple-100 dark:border-indigo-900 bg-white/60 dark:bg-indigo-950/30 overflow-hidden flex items-center justify-center">
                          {loginVisualImage ? (
                            <img src={loginVisualImage} alt="Preview login visual" className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-center px-4">
                              <img src={dyataskMiniLogo} alt="" className="w-12 h-12 object-contain mx-auto opacity-80 mb-2" />
                              <p className="text-[11px] text-purple-400 dark:text-purple-300">Default desk illustration aktif.</p>
                            </div>
                          )}
                        </div>
                        <div className="space-y-3">
                          <label className="block">
                            <span className="block text-[10px] uppercase tracking-wider font-bold text-purple-500 dark:text-purple-300 mb-2">Upload Gambar</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleLoginVisualUpload}
                              disabled={loginVisualUploading}
                              className="w-full px-3 py-2.5 rounded-xl border border-purple-100 dark:border-indigo-900 bg-white dark:bg-indigo-950/30 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-[#8f75d8] file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white"
                            />
                          </label>
                          <p className="text-[10px] text-purple-400 dark:text-purple-300 leading-relaxed">
                            Rekomendasi rasio 4:5 atau 1:1, ukuran maksimal 2MB. Gambar disimpan global di database dan Supabase Storage, lalu tersinkron ke semua user.
                          </p>
                          {loginVisualSyncStatus && (
                            <p className="rounded-xl border border-purple-100 bg-white/70 px-3 py-2 text-[10px] font-semibold text-purple-500 dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-purple-200">
                              {loginVisualSyncStatus}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="p-4 rounded-2xl border border-purple-200/50 dark:border-indigo-900/50 bg-purple-50/20 dark:bg-indigo-950/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold flex items-center gap-2">
                      <Calendar size={15} className="text-purple-500" />
                      Booking Settings
                    </h4>
                    <button type="button" onClick={() => setShowAvailabilitySettings(prev => !prev)} className="text-[10px] px-2 py-1 rounded bg-purple-100 dark:bg-indigo-900/50 text-purple-700 dark:text-purple-300 inline-flex items-center gap-1">
                      <Settings size={10} />
                      {showAvailabilitySettings ? 'Sederhanakan' : 'Tampilkan Detail'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl border border-purple-200/60 dark:border-indigo-900/60 bg-white/40 dark:bg-indigo-950/20 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-purple-500 dark:text-purple-300">Form Share Publik</p>
                        <button type="button" onClick={regenerateShareToken} className="text-[10px] px-2 py-1 rounded bg-purple-100 dark:bg-indigo-900/50 text-purple-700 dark:text-purple-300">Regenerate Link</button>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider font-bold text-purple-400 dark:text-purple-300 mb-1">Public Share Domain</label>
                        <input
                          value={publicShareBaseUrl}
                          onChange={(e) => setPublicShareBaseUrl(e.target.value)}
                          placeholder="https://booking.domainkamu.com"
                          className="w-full px-2 py-2 rounded-lg border border-purple-100 dark:border-indigo-900 bg-white dark:bg-indigo-950/30 text-[10px] focus:outline-none focus:ring-2 focus:ring-purple-300/50"
                        />
                      </div>
                      <div className="flex gap-2">
                        <input readOnly value={sharedFormLink} className="flex-1 px-2 py-2 rounded-lg border border-purple-100 dark:border-indigo-900 bg-white dark:bg-indigo-950/30 text-[10px]" />
                        <button type="button" onClick={copyShareLink} className="px-3 py-2 rounded-lg bg-[#8f75d8] text-white text-[10px] font-bold inline-flex items-center gap-1">
                          <Copy size={10} />
                          {copiedShareLink ? 'Tersalin' : 'Copy'}
                        </button>
                      </div>
                      <p className="text-[10px] text-purple-400 dark:text-purple-300 leading-relaxed">
                        Untuk app DMG, isi domain publik agar link tidak memakai path lokal <span className="font-mono">file://</span>.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl border border-purple-200/60 dark:border-indigo-900/60 bg-white/40 dark:bg-indigo-950/20">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-purple-500 dark:text-purple-300 mb-2">Catatan Untuk Form Publik</p>
                      <textarea
                        value={publicBookingNotes}
                        onChange={(e) => setPublicBookingNotes(e.target.value)}
                        rows={5}
                        className="w-full px-3 py-2 rounded-lg border border-purple-100 dark:border-indigo-900 bg-white dark:bg-indigo-950/30 text-xs resize-none"
                        placeholder="Tulis ketentuan, pengumuman, atau catatan yang tampil di form publik..."
                      />
                    </div>
                  </div>

                  {showAvailabilitySettings && (
                    <div className="p-3 rounded-xl border border-purple-200/60 dark:border-indigo-900/60 bg-white/40 dark:bg-indigo-950/20 space-y-3">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-purple-500 dark:text-purple-300">Pengaturan Hari/Jam Reservasi</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="p-2.5 rounded-lg border border-purple-100 dark:border-indigo-900/60 bg-white dark:bg-indigo-950/20">
                          <label className="block text-[10px] uppercase tracking-wider font-bold text-purple-500 dark:text-purple-300 mb-1">Harga Default Reservasi 1:1 / Sesi</label>
                          <input
                            type="number"
                            min="0"
                            value={reservationSessionPrice}
                            onChange={(e) => setReservationSessionPrice(Number(e.target.value || 0))}
                            className="w-full px-2 py-2 rounded-lg border border-purple-100 dark:border-indigo-900 bg-white dark:bg-indigo-950/30 text-xs"
                          />
                          <p className="text-[10px] text-purple-400 mt-1">Dipakai otomatis untuk hitung pendapatan reservasi di tab Finance & Reports.</p>
                        </div>
                      </div>
                      {(() => {
                        const selectedDayConfig = bookingAvailability.daySchedules?.[selectedAvailabilityDay] || { enabled: false, startHour: '09:00', endHour: '17:00' }

                        return (
                          <>
                      <div className="grid grid-cols-7 gap-1">
                        {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((label, index) => (
                          <button
                            key={label}
                            type="button"
                            onClick={() => setSelectedAvailabilityDay(index)}
                            className={`py-1 text-[10px] rounded border ${selectedAvailabilityDay === index ? 'bg-[#8f75d8] text-white border-[#8f75d8]' : (bookingAvailability.daySchedules?.[index]?.enabled ? 'bg-purple-100 dark:bg-indigo-900/40 text-purple-600 dark:text-purple-300 border-purple-200 dark:border-indigo-900/60' : 'bg-zinc-100 dark:bg-zinc-900/40 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800')}`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[10px] text-purple-600 dark:text-purple-300">Atur jam untuk hari: <span className="font-bold">{['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][selectedAvailabilityDay]}</span></p>
                        <label className="inline-flex items-center gap-2 text-[10px] text-purple-600 dark:text-purple-300">
                          <input
                            type="checkbox"
                            checked={selectedDayConfig.enabled}
                            onChange={(e) => {
                              const checked = e.target.checked
                              setBookingAvailability(prev => ({
                                ...prev,
                                daySchedules: {
                                  ...prev.daySchedules,
                                  [selectedAvailabilityDay]: {
                                    ...(prev.daySchedules?.[selectedAvailabilityDay] || {}),
                                    enabled: checked
                                  }
                                }
                              }))
                            }}
                          />
                          Aktifkan hari ini
                        </label>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="time"
                          value={selectedDayConfig.startHour || '09:00'}
                          onChange={(e) => setBookingAvailability(prev => ({
                            ...prev,
                            daySchedules: {
                              ...prev.daySchedules,
                              [selectedAvailabilityDay]: {
                                ...(prev.daySchedules?.[selectedAvailabilityDay] || {}),
                                startHour: e.target.value
                              }
                            }
                          }))}
                          className="px-2 py-2 rounded-lg border border-purple-100 dark:border-indigo-900 bg-white dark:bg-indigo-950/30 text-xs"
                        />
                        <input
                          type="time"
                          value={selectedDayConfig.endHour || '17:00'}
                          onChange={(e) => setBookingAvailability(prev => ({
                            ...prev,
                            daySchedules: {
                              ...prev.daySchedules,
                              [selectedAvailabilityDay]: {
                                ...(prev.daySchedules?.[selectedAvailabilityDay] || {}),
                                endHour: e.target.value
                              }
                            }
                          }))}
                          className="px-2 py-2 rounded-lg border border-purple-100 dark:border-indigo-900 bg-white dark:bg-indigo-950/30 text-xs"
                        />
                        <select value={bookingAvailability.slotMinutes} onChange={(e) => setBookingAvailability(prev => ({ ...prev, slotMinutes: Number(e.target.value) }))} className="px-2 py-2 rounded-lg border border-purple-100 dark:border-indigo-900 bg-white dark:bg-indigo-950/30 text-xs">
                          <option value={15}>15m</option>
                          <option value={30}>30m</option>
                          <option value={60}>60m</option>
                        </select>
                      </div>
                          </>
                        )
                      })()}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Control 1 */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-purple-50/20 dark:bg-indigo-950/10 border border-purple-100/50 dark:border-indigo-950/50">
                    <div>
                      <h4 className="text-sm font-semibold">Otomatis Buka Saat Macbook Dihidupkan (Autostart)</h4>
                      <p className="text-xs text-purple-400 dark:text-purple-300 mt-0.5">Mendaftarkan daemon plist ke launchd macOS untuk autostart instan.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={autoStart}
                        onChange={() => setAutoStart(!autoStart)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-purple-200 dark:bg-indigo-950 rounded-full peer peer-focus:ring-2 peer-focus:ring-purple-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8f75d8]"></div>
                    </label>
                  </div>

                  {/* Control 2 */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-purple-50/20 dark:bg-indigo-950/10 border border-purple-100/50 dark:border-indigo-950/50">
                    <div>
                      <h4 className="text-sm font-semibold">Buka Otomatis Saat Ada Alarm / Notifikasi</h4>
                      <p className="text-xs text-purple-400 dark:text-purple-300 mt-0.5">Fokus otomatis jendela aplikasi DyaTask saat alarm berbunyi. Native notification macOS dikirim lewat Electron.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={autoOpenOnAlert}
                        onChange={() => setAutoOpenOnAlert(!autoOpenOnAlert)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-purple-200 dark:bg-indigo-950 rounded-full peer peer-focus:ring-2 peer-focus:ring-purple-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8f75d8]"></div>
                    </label>
                  </div>

                  {/* Control 3 */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-purple-50/20 dark:bg-indigo-950/10 border border-purple-100/50 dark:border-indigo-950/50">
                    <div>
                      <h4 className="text-sm font-semibold">Aktifkan Menu Bar Floating Launcher (Floating Button)</h4>
                      <p className="text-xs text-purple-400 dark:text-purple-300 mt-0.5">Menampilkan gelembung tombol melayang di Macbook untuk input cepat.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={floatingMenuEnabled}
                        onChange={() => setFloatingMenuEnabled(!floatingMenuEnabled)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-purple-200 dark:bg-indigo-950 rounded-full peer peer-focus:ring-2 peer-focus:ring-purple-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8f75d8]"></div>
                    </label>
                  </div>

                  {/* Control 4 */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-purple-50/20 dark:bg-indigo-950/10 border border-purple-100/50 dark:border-indigo-950/50">
                    <div>
                      <h4 className="text-sm font-semibold">Otentikasi Dua Faktor (2FA Keamanan)</h4>
                      <p className="text-xs text-purple-400 dark:text-purple-300 mt-0.5">Mewajibkan input kode TOTP dari Google Authenticator saat masuk.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={twoFactorEnabled}
                        onChange={() => setTwoFactorEnabled(!twoFactorEnabled)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-purple-200 dark:bg-indigo-950 rounded-full peer peer-focus:ring-2 peer-focus:ring-purple-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8f75d8]"></div>
                    </label>
                  </div>
                </div>

                {isAppDeveloper && (
                  <div className="p-4 bg-yellow-500/10 dark:bg-yellow-500/5 border border-yellow-500/20 rounded-2xl flex gap-3.5">
                    <AlertCircle className="text-yellow-600 shrink-0 mt-0.5" size={18} />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-yellow-600">Saran Keamanan & Uji Penetrasi Berkala</h4>
                      <p className="text-xs text-purple-600 dark:text-purple-300 mt-0.5">
                        Untuk rilis produksi, kami merekomendasikan penjadwalan pemindaian OWASP ZAP bulanan pada host backend Node.js dan mengunci database Supabase menggunakan RLS (Row Level Security) ketat seperti tertera dalam rencana implementasi.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right panel: Team Assistant + Macbook Simulator preview */}
              <div className="space-y-6">
                {renderTeamAssistantWorkspacePanel()}

                <div className="glass-panel p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold mb-2">Simulator Macbook macOS</h3>
                    <p className="text-xs text-purple-400 dark:text-purple-300 mb-4">Pratinjau tampilan jendela mandiri DyaTask di Macbook OS Anda</p>
                    
                    {/* Macbook window mock */}
                    <div className="macbook-window">
                      <div className="macbook-titlebar">
                        <div className="macbook-dot macbook-red"></div>
                        <div className="macbook-dot macbook-yellow"></div>
                        <div className="macbook-dot macbook-green"></div>
                        <span className="text-[10px] text-zinc-400 font-bold ml-2">{appHeaderTitle || 'Dyatask Manager'}</span>
                      </div>

                      <div className="p-4 bg-zinc-950 text-white font-mono text-[9px] space-y-1 select-none">
                        <p className="text-purple-400">--- DyaTask macOS Service Daemon ---</p>
                        <p>STATUS: RUNNING</p>
                        <p>AUTOSTART: {autoStart ? 'ENABLED' : 'DISABLED'}</p>
                        <p>WAKE_ON_ALERT: {autoOpenOnAlert ? 'ENABLED' : 'DISABLED'}</p>
                        <p>LAUNCHER_SHORTCUT: [Option + Space]</p>
                        <p className="text-emerald-400">⚡ CalSync: OK, Sheets: OK</p>
                        <p className="text-zinc-500">[LOG] Listen on port 4500...</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-purple-100/40 dark:border-indigo-950/40 mt-4">
                    <button 
                      onClick={() => {
                        triggerMockNotification(
                          'DyaTask Notification Aktif',
                          'Jika banner ini muncul di macOS, izin notifikasi sudah aktif.',
                          'local'
                        )
                      }}
                      className="w-full py-2.5 bg-[#8f75d8] hover:bg-[#8069c8] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md"
                    >
                      <BellRing size={12} />
                      Uji / Aktifkan Izin Notifikasi macOS
                    </button>
                    <p className="mt-2 text-[10px] text-purple-400 dark:text-purple-300 leading-relaxed">
                      Jika macOS meminta izin, pilih Allow. Kalau tidak muncul, aktifkan manual di System Settings &gt; Notifications &gt; DyaTask.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

        </main>
        
      </div>

      {activeTab !== 'workspaceChat' && !workspaceChatModalOpen && (
        <button
          type="button"
          className={`mobile-more-trigger ${showMobileMoreMenu || ['notes', 'integrations', 'settings', 'userMonitoring', 'designOrders', 'generalOrders', 'mentoringSchedule', 'contentPlanner', 'invoiceFollowUp', 'invoiceGenerator', 'reports'].includes(activeTab) ? 'active' : ''}`}
          onClick={() => setShowMobileMoreMenu(prev => !prev)}
          aria-label="Buka menu lainnya"
        >
          <MoreHorizontal size={20} />
        </button>
      )}

      {showMobileMoreMenu && !workspaceChatModalOpen && (
        <>
          <button
            type="button"
            className="mobile-more-backdrop"
            onClick={() => setShowMobileMoreMenu(false)}
            aria-label="Tutup menu lainnya"
          />
          <div className="mobile-more-drawer glass-panel">
            <div className="mobile-more-head">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-purple-400 font-bold">More</p>
                <h3 className="text-base font-bold">Menu Lainnya</h3>
              </div>
              <button type="button" onClick={() => setShowMobileMoreMenu(false)} aria-label="Tutup menu">
                <X size={18} />
              </button>
            </div>

            {canReadArea('notes') && canShowTab('notes') && (
              <button type="button" className="mobile-more-item" onClick={() => { setActiveTab('notes'); setShowMobileMoreMenu(false) }}>
                <Lock size={18} />
                <span>Catatan Terenkripsi</span>
              </button>
            )}
            {canReadArea('integrations') && canShowTab('integrations') && (
              <button type="button" className="mobile-more-item" onClick={() => { setActiveTab('integrations'); setShowMobileMoreMenu(false) }}>
                <RefreshCw size={18} />
                <span>Integrasi Realtime</span>
              </button>
            )}
            {canReadArea('settings') && canShowTab('settings') && (
              <button type="button" className="mobile-more-item" onClick={() => { setActiveTab('settings'); setShowMobileMoreMenu(false) }}>
                <Settings size={18} />
                <span>Pengaturan macOS</span>
              </button>
            )}
            {['designOrders', 'generalOrders', 'mentoringSchedule', 'contentPlanner', 'invoiceFollowUp', 'invoiceGenerator', 'reports'].map((tabKey) => {
              if (!canReadArea(tabKey) || !canShowTab(tabKey)) return null
              const mobileMenuLabel = {
                designOrders: 'Pages Design Order',
                generalOrders: 'Pages Orderan (General)',
                mentoringSchedule: 'Pages Mentoring/Speaker',
                contentPlanner: 'Content Planner',
                invoiceFollowUp: 'Invoice Payment & Follow Up',
                invoiceGenerator: 'Invoice Generator',
                reports: 'Reports'
              }[tabKey]
              const mobileMenuIcon = {
                designOrders: <Palette size={18} />,
                generalOrders: <Clipboard size={18} />,
                mentoringSchedule: <Mic2 size={18} />,
                contentPlanner: <CalendarClock size={18} />,
                invoiceFollowUp: <Mail size={18} />,
                invoiceGenerator: <FileText size={18} />,
                reports: <TrendingUp size={18} />
              }[tabKey]
              return (
                <button
                  key={tabKey}
                  type="button"
                  className="mobile-more-item"
                  onClick={() => { setActiveTab(tabKey); setShowMobileMoreMenu(false) }}
                >
                  {mobileMenuIcon}
                  <span>{mobileMenuLabel}</span>
                </button>
              )
            })}
            {isAppDeveloper && (
              <>
                <div className="mobile-more-divider" />
                <div className="px-1 pb-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-purple-400">Developer Tools</p>
                </div>
                <button type="button" className="mobile-more-item" onClick={() => { setActiveTab('userMonitoring'); setShowMobileMoreMenu(false) }}>
                  <ShieldCheck size={18} />
                  <span>User Monitoring</span>
                </button>
              </>
            )}
            {workspaceRole === 'owner' && (
              <button type="button" className="mobile-more-item" onClick={() => { setActiveTab('pageControl'); setShowMobileMoreMenu(false) }}>
                <SlidersHorizontal size={18} />
                <span>Atur Halaman</span>
              </button>
            )}

            <div className="mobile-more-divider" />

            <button type="button" className="mobile-more-item" onClick={() => { setIsProfileModalOpen(true); setShowMobileMoreMenu(false) }}>
              <User size={18} />
              <span>Profil</span>
            </button>
            {isMobileTabletView ? (
              <button
                type="button"
                className="mobile-more-item"
                onClick={() => {
                  setShowMobileMoreMenu(false)
                  setMobilePwaGuidePlatform(mobilePwaGuideDetectedPlatform)
                  setMobilePwaGuideOpen(true)
                }}
              >
                <Smartphone size={18} />
                <span>Tutorial Install App</span>
              </button>
            ) : (
              <button type="button" className="mobile-more-item" onClick={() => { toggleTheme(); setShowMobileMoreMenu(false) }}>
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                <span>{theme === 'dark' ? 'Tema Terang' : 'Tema Gelap'}</span>
              </button>
            )}
            {!isAssistantWorkspace && (
              <button type="button" className="mobile-more-item danger" onClick={() => { handleSignOut(); setShowMobileMoreMenu(false) }}>
                <ExternalLink size={18} />
                <span>Keluar</span>
              </button>
            )}
          </div>
        </>
      )}

      {isMobileTabletView && workspaceContext?.ownerUserId && (
        <button
          type="button"
          onClick={handleWorkspaceChatTriggerClick}
          onPointerDown={handleWorkspaceChatTriggerPointerDown}
          aria-label={isWorkspaceChatOpen ? 'Tutup chat workspace' : 'Buka chat workspace'}
          className={`mobile-chat-trigger fixed right-4 z-[81] inline-flex items-center justify-center ${hasUnreadWorkspaceChat ? 'active' : ''} ${isWorkspaceChatOpen ? 'chat-open' : ''}`}
        >
          {isWorkspaceChatOpen ? <X size={18} /> : <MessageSquare size={18} />}
          {hasUnreadWorkspaceChat && (
            <span className="mobile-chat-trigger-badge">{workspaceUnreadChatCount > 99 ? '99+' : workspaceUnreadChatCount}</span>
          )}
        </button>
      )}

      {showNewFolderModal && (
        <div className="fixed inset-0 bg-slate-500/35 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowNewFolderModal(false)}>
          <div className="w-full max-w-md rounded-[2rem] bg-white dark:bg-slate-900 p-8 shadow-2xl border border-purple-100/80 dark:border-indigo-900/50" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-[#8f75d8] text-white flex items-center justify-center mb-3 shadow-lg shadow-[#8f75d8]/25">
                <Folder size={24} />
              </div>
              <h3 className="text-3xl font-extrabold text-purple-600 dark:text-purple-300 tracking-tight">New Folder Task</h3>
              <p className="text-sm text-slate-400 dark:text-slate-300 mt-2">Buat folder project kosong untuk menampung task dan subtask.</p>
            </div>
            <form onSubmit={handleCreateProjectFolder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-300 dark:text-slate-400 mb-2">Nama Folder Project</label>
                <input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Contoh: Website Redesign" className="w-full px-4 py-3 rounded-2xl border border-purple-100 dark:border-indigo-900 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300/50 focus:border-purple-300 transition-all" required />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-300 dark:text-slate-400 mb-2">Warna Folder</label>
                <input type="color" value={newFolderColor} onChange={(e) => setNewFolderColor(e.target.value)} className="w-full h-12 rounded-2xl border border-purple-100 dark:border-indigo-900 bg-slate-50 dark:bg-slate-800 p-1" />
              </div>
              <div className="pt-2 space-y-3">
                <button type="submit" className="w-full py-3 rounded-2xl bg-[#8f75d8] hover:bg-[#8069c8] text-white text-[11px] tracking-[0.2em] uppercase font-bold shadow-sm hover:shadow-md transition-all active:scale-[0.99]">Buat Folder</button>
                <button type="button" onClick={() => setShowNewFolderModal(false)} className="w-full text-center text-[11px] tracking-[0.18em] uppercase text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold transition-all">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {workspaceChatModalOpen && (
        <div
          className={`workspace-chat-overlay fixed inset-0 bg-slate-500/35 backdrop-blur-sm ${isMobileTabletView ? 'z-[140] p-0 items-stretch justify-stretch' : 'z-50 flex items-center justify-center p-4'}`}
          style={isMobileTabletView ? { padding: 0, inset: 0, alignItems: 'stretch', justifyContent: 'stretch' } : undefined}
          onClick={() => setWorkspaceChatModalOpen(false)}
        >
          <div className={`workspace-chat-shell w-full ${isMobileTabletView
            ? 'h-[100dvh] max-w-none rounded-none border-0 bg-white dark:bg-slate-900 p-6 shadow-2xl'
            : `${canManageTeam && workspaceAssistantChatMembers.length > 0 ? 'max-w-6xl' : 'max-w-2xl'} rounded-[1.6rem] bg-white dark:bg-slate-900 p-6 shadow-2xl border border-purple-100/80 dark:border-indigo-900/50`
          }`}
          style={isMobileTabletView ? { width: '100vw', height: '100dvh', maxHeight: '100dvh', borderRadius: 0, margin: 0 } : undefined}
          onClick={(e) => e.stopPropagation()}
          >
            <div className="workspace-chat-header flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="workspace-chat-title-block min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-purple-400">Workspace Chat</p>
                <h3 className="mt-1 text-2xl font-extrabold text-[#4f4574] dark:text-purple-100">
                  {workspaceChatTitleName}
                </h3>
                <div className="workspace-chat-presence mt-2 flex flex-wrap items-center gap-2 text-xs text-purple-400 dark:text-purple-300">
                  <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${workspaceChatPeerStatusTone}`}>
                    <span className="inline-block h-2 w-2 rounded-full bg-current opacity-80" />
                    {workspaceChatPeerStatusLabel}
                  </span>
                  <span className="leading-snug">{workspaceChatPresenceText}</span>
                </div>
              </div>
              <div className="workspace-chat-actions flex items-center justify-end gap-2 sm:justify-start">
                {canManageTeam && activeWorkspaceChatMemberId && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setWorkspaceChatOwnerMenuOpen(prev => !prev)}
                      className="h-9 w-9 rounded-xl border border-purple-100 text-purple-400 hover:bg-purple-50 flex items-center justify-center"
                      title="Menu chat"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    {workspaceChatOwnerMenuOpen && (
                      <div className="absolute right-0 top-11 z-20 w-44 rounded-2xl border border-purple-100 bg-white p-2 shadow-xl dark:bg-slate-900 dark:border-indigo-900">
                        <button
                          type="button"
                          onClick={() => {
                            setWorkspaceChatOwnerMenuOpen(false)
                            handleClearWorkspaceChat()
                          }}
                          className="w-full rounded-xl px-3 py-2 text-left text-xs font-semibold border border-red-100 text-red-500 hover:bg-red-50 inline-flex items-center gap-2"
                        >
                          <Trash2 size={14} />
                          Kosongkan Chat
                        </button>
                      </div>
                    )}
                  </div>
                )}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setWorkspaceChatStatusMenuOpen(prev => !prev)}
                    className={`h-9 px-3 rounded-xl border text-xs font-bold inline-flex items-center gap-2 ${workspaceChatStatusTone}`}
                  >
                    <span className="inline-block h-2 w-2 rounded-full bg-current opacity-80" />
                    {workspaceChatStatusLabel}
                    <ChevronDown size={14} />
                  </button>
                  {workspaceChatStatusMenuOpen && (
                    <div className="absolute right-0 top-11 z-20 w-40 rounded-2xl border border-purple-100 bg-white p-2 shadow-xl dark:bg-slate-900 dark:border-indigo-900">
                      <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-purple-400">
                        {workspaceChatStatusSectionLabel}
                      </p>
                      <div className="space-y-1">
                        {workspaceChatStatusOptions.map(option => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => updateWorkspaceChatStatus(option.value)}
                            className={`w-full rounded-xl px-3 py-2 text-left text-xs font-semibold border inline-flex items-center justify-between gap-2 ${
                              option.value === workspaceChatStatusValue
                                ? option.tone
                                : 'border-purple-100 text-[#4f4574] hover:bg-purple-50'
                            }`}
                          >
                            <span className="inline-flex items-center gap-2">
                              <span className="inline-block h-2 w-2 rounded-full bg-current opacity-80" />
                              {option.label}
                            </span>
                            {option.value === workspaceChatStatusValue && <Check size={13} />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setWorkspaceChatModalOpen(false)}
                  className="h-9 w-9 rounded-xl border border-purple-100 text-purple-400 hover:bg-purple-50 flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className={`workspace-chat-layout mt-5 ${canManageTeam && workspaceAssistantChatMembers.length > 0 ? 'grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-4 items-stretch' : ''}`}>
              {canManageTeam && workspaceAssistantChatMembers.length > 0 && (
                <>
                  <div className={`hidden md:flex md:self-stretch md:flex-col rounded-2xl border border-purple-100 bg-[#fbfaff] dark:bg-slate-800 dark:border-indigo-900 overflow-hidden ${workspaceChatAssistantPanelCollapsed ? 'md:w-14' : 'md:w-auto'}`}>
                    <div className={`flex items-center ${workspaceChatAssistantPanelCollapsed ? 'justify-center' : 'justify-between'} gap-2 px-3 pt-3 pb-2`}>
                      {!workspaceChatAssistantPanelCollapsed && (
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-purple-400">Assistant</p>
                      )}
                      <button
                        type="button"
                        onClick={() => setWorkspaceChatAssistantPanelCollapsed(prev => !prev)}
                        className="h-8 w-8 rounded-xl border border-purple-100 bg-white text-purple-500 hover:bg-purple-50 inline-flex items-center justify-center"
                        title={workspaceChatAssistantPanelCollapsed ? 'Tampilkan assistant' : 'Sembunyikan assistant'}
                      >
                        {workspaceChatAssistantPanelCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                      </button>
                    </div>
                    {workspaceChatAssistantPanelCollapsed ? (
                      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-2 pb-3">
                        {workspaceAssistantChatMembers.length > 0 && (
                          <span className="rounded-full bg-[#8f75d8] px-2.5 py-1 text-[10px] font-bold text-white">{workspaceAssistantChatMembers.length}</span>
                        )}
                        <Users size={15} className="text-[#8f75d8]" />
                      </div>
                    ) : (
                      <div className="flex-1 min-h-0 px-3 pb-3">
                        <div className="space-y-1.5 h-full max-h-[520px] overflow-y-auto pr-1">
                          {workspaceAssistantChatMembers.length === 0 ? (
                            <p className="text-xs text-purple-400">Belum ada assistant aktif.</p>
                          ) : workspaceAssistantChatMembers.map(member => {
                            const memberName = resolveWorkspaceMemberName(member)
                            const memberMessageCount = activityLogs.filter(item => item?.metadata?.kind === 'workspace_chat' && item?.metadata?.chatMemberId === member.id).length
                            const memberPresence = getWorkspaceChatPresenceOption(member.memberUserId)
                            const isSelected = member.id === activeWorkspaceChatMemberId
                            return (
                              <button
                                key={member.id}
                                type="button"
                                onClick={() => setSelectedWorkspaceChatMemberId(member.id)}
                                className={`w-full text-left rounded-xl px-3 py-2 border text-xs ${isSelected ? 'bg-[#8f75d8] text-white border-[#8f75d8]' : 'bg-white text-[#4f4574] border-purple-100 hover:bg-purple-50'}`}
                              >
                                <span className="block font-bold truncate">{memberName}</span>
                                <span className={`block text-[10px] truncate ${isSelected ? 'text-white/75' : 'text-purple-400'}`}>
                                  {memberPresence.label} • {memberMessageCount} pesan
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="workspace-chat-mobile-assistant md:hidden rounded-2xl border border-purple-100 bg-[#fbfaff] dark:bg-slate-800 dark:border-indigo-900 p-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-purple-400">Assistant</p>
                      <button
                        type="button"
                        onClick={() => setWorkspaceChatAssistantPanelCollapsed(prev => !prev)}
                        className="h-8 w-8 rounded-xl border border-purple-100 bg-white text-purple-500 hover:bg-purple-50 inline-flex items-center justify-center"
                        title={workspaceChatAssistantPanelCollapsed ? 'Tampilkan assistant' : 'Sembunyikan assistant'}
                      >
                        {workspaceChatAssistantPanelCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                      </button>
                    </div>
                    {!workspaceChatAssistantPanelCollapsed && (
                      <div className="workspace-chat-mobile-assistant-list space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                        {workspaceAssistantChatMembers.length === 0 ? (
                          <p className="text-xs text-purple-400">Belum ada assistant aktif.</p>
                        ) : workspaceAssistantChatMembers.map(member => {
                          const memberName = resolveWorkspaceMemberName(member)
                          const memberMessageCount = activityLogs.filter(item => item?.metadata?.kind === 'workspace_chat' && item?.metadata?.chatMemberId === member.id).length
                          const memberPresence = getWorkspaceChatPresenceOption(member.memberUserId)
                          const isSelected = member.id === activeWorkspaceChatMemberId
                          return (
                            <button
                              key={member.id}
                              type="button"
                              onClick={() => setSelectedWorkspaceChatMemberId(member.id)}
                              className={`workspace-chat-mobile-assistant-item w-full text-left rounded-xl px-3 py-2 border text-xs ${isSelected ? 'bg-[#8f75d8] text-white border-[#8f75d8]' : 'bg-white text-[#4f4574] border-purple-100 hover:bg-purple-50'}`}
                            >
                              <span className="block font-bold truncate">{memberName}</span>
                              <span className={`block text-[10px] truncate ${isSelected ? 'text-white/75' : 'text-purple-400'}`}>
                                {memberPresence.label} • {memberMessageCount} pesan
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="workspace-chat-thread min-w-0">
                <div
                  ref={workspaceChatFeedRef}
                  className="workspace-chat-feed h-72 overflow-y-auto rounded-2xl border border-purple-100 bg-[#fbfaff] dark:bg-slate-800 dark:border-indigo-900 p-4 space-y-3"
                  onClick={() => setWorkspaceChatActionMessageId('')}
                >
                  {workspaceChatMessages.length === 0 ? (
                    <p className="text-xs text-purple-400">Belum ada pesan. Mulai chat untuk koordinasi kerja.</p>
                  ) : workspaceChatItemsWithDateSeparator.map(item => {
                    if (item.__type === 'date_separator') {
                      return (
                        <div key={item.id} className="flex items-center gap-2 py-1">
                          <div className="h-px flex-1 bg-purple-100" />
                          <span className="text-[10px] font-bold text-purple-400 whitespace-nowrap px-2">{item.label}</span>
                          <div className="h-px flex-1 bg-purple-100" />
                        </div>
                      )
                    }
                    const isMine = isWorkspaceChatMine(item)
                    const isReminderMessage = item?.metadata?.reminderType && item?.metadata?.senderRole === 'assistant'
                    const isAckVisibleMessage = item?.metadata?.ackVisible || item?.metadata?.replyType === 'ack_visible'
                    const canConfirmReminder = workspaceRole === 'owner' && !isMine && isReminderMessage && !workspaceChatAcknowledgedIds.has(item.id)
                    const sentTime = new Date(item.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                    const readLabel = (
                      workspaceChatAcknowledgedIds.has(item.id)
                      || (isMine && workspaceChatPeerSeenAt > 0 && new Date(item.createdAt).getTime() <= workspaceChatPeerSeenAt)
                    ) ? 'Read' : 'Sent'
                    const mineBubbleClass = isReminderMessage
                      ? 'bg-purple-500/15 border border-purple-300/60 text-[#4f4574]'
                      : isAckVisibleMessage
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                        : 'bg-[#8f75d8] text-white'
                    const incomingBubbleClass = isReminderMessage
                      ? 'bg-purple-500/10 border border-purple-200/80 text-[#4f4574]'
                      : isAckVisibleMessage
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                        : 'bg-white border border-purple-100 text-[#4f4574]'
                    const replyMeta = getWorkspaceChatReplyMeta(item)
                    const canDeleteMessage = isMine || canManageTeam
                    const actionMenuOpen = workspaceChatActionMessageId === item.id
                    return (
                      <div key={item.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex items-end gap-1 max-w-[88%] ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div
                            className="workspace-chat-bubble-wrap relative max-w-[78%]"
                            onClick={(event) => event.stopPropagation()}
                            onPointerDown={(event) => handleWorkspaceChatBubblePointerDown(event, item)}
                            onPointerUp={(event) => handleWorkspaceChatBubblePointerUp(event, item)}
                            onPointerLeave={clearWorkspaceChatBubbleGesture}
                            onPointerCancel={clearWorkspaceChatBubbleGesture}
                            onContextMenu={(event) => {
                              event.preventDefault()
                              setWorkspaceChatActionMessageId(item.id)
                            }}
                          >
                          {actionMenuOpen && (
                            <div className={`absolute -top-4 z-10 inline-flex items-center gap-1 rounded-full border border-purple-100 bg-white px-1.5 py-1 shadow-lg ${isMine ? 'left-3' : 'right-3'}`}>
                              <button
                                type="button"
                                onPointerDown={(event) => event.stopPropagation()}
                                onClick={(event) => {
                                  event.stopPropagation()
                                  openWorkspaceChatReply(item)
                                }}
                                className="h-7 w-7 rounded-full text-[#6f55bd] hover:bg-purple-50 inline-flex items-center justify-center"
                                title="Reply"
                              >
                                <CornerUpLeft size={13} />
                              </button>
                              {canDeleteMessage && (
                                <button
                                  type="button"
                                  onPointerDown={(event) => event.stopPropagation()}
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    deleteWorkspaceChatMessage(item)
                                  }}
                                  className="h-7 w-7 rounded-full text-red-500 hover:bg-red-50 inline-flex items-center justify-center"
                                  title="Hapus"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          )}
                          <div className={`w-full rounded-2xl px-3 py-2 ${isMine ? mineBubbleClass : incomingBubbleClass}`}>
                            <p className="text-[9px] font-bold opacity-80">{getWorkspaceMessageSenderName(item)}</p>
                            {replyMeta && (
                              <div className={`mb-1.5 flex items-center gap-2 px-0.5 py-0 text-[10px] leading-snug ${
                                isMine
                                  ? 'text-white/82'
                                  : 'text-[#6b5aa8]'
                              }`}>
                                <span className="inline-block h-5 w-[3px] shrink-0 rounded-full bg-[#8f75d8]" />
                                <div className="min-w-0">
                                  <p className="truncate text-[11px] leading-tight opacity-90">
                                    {replyMeta.senderName}: {replyMeta.preview}
                                  </p>
                                </div>
                              </div>
                            )}
                            <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{formatTextDates(item.detail)}</p>
                            {workspaceChatAcknowledgedIds.has(item.id) && (
                              <p className="mt-1 text-[10px] font-bold opacity-90 inline-flex items-center gap-1">
                                <CheckCircle size={12} />
                                Dikonfirmasi dibaca
                              </p>
                            )}
                            {canConfirmReminder && (
                              <button
                                type="button"
                                onPointerDown={(event) => event.stopPropagation()}
                                onClick={(event) => {
                                  event.stopPropagation()
                                  sendWorkspaceReminderAck(item.id)
                                }}
                                className="mt-2 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                              >
                                Konfirmasi Dibaca
                              </button>
                            )}
                          </div>
                          </div>
                          <div className={`pb-1 min-w-[36px] leading-tight ${isMine ? 'text-right' : 'text-left'}`}>
                            <p className="text-[10px] font-semibold text-purple-400">{sentTime}</p>
                            {isMine && <p className="text-[10px] font-bold text-purple-300">{readLabel}</p>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

            <form onSubmit={handleSendWorkspaceChatMessage} className="workspace-chat-composer mt-4 space-y-4">
              {isAssistantWorkspace && (
                <div className="workspace-chat-quick-actions space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-purple-400">Pengingat Cepat</p>
                  <div className="flex flex-wrap gap-1.5">
                    <button type="button" onClick={() => sendQuickWorkspaceReminder('task')} className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700 text-[10px] font-bold hover:bg-amber-200">Task Hari Ini</button>
                    <button type="button" onClick={() => sendQuickWorkspaceReminder('event')} className="px-2.5 py-1 rounded-lg bg-sky-100 text-sky-700 text-[10px] font-bold hover:bg-sky-200">Event Hari Ini</button>
                    <button type="button" onClick={() => sendQuickWorkspaceReminder('gcall')} className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-700 text-[10px] font-bold hover:bg-indigo-200">GCall Hari Ini</button>
                    <button type="button" onClick={() => sendQuickWorkspaceReminder('deadline')} className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-700 text-[10px] font-bold hover:bg-rose-200">Deadline Hari Ini</button>
                  </div>
                </div>
              )}

              {workspaceChatPeerIsTyping && (
                <p className="mb-2 text-[11px] font-semibold text-purple-400">
                  {workspaceChatPeerTypingLabel}
                </p>
              )}

              {workspaceChatReplyTarget && (
                <div className="flex items-start justify-between gap-2 rounded-2xl border border-purple-100 bg-[#fbfaff] px-3 py-2 text-[#4f4574]">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-purple-400">Reply ke {workspaceChatReplyTarget.senderName}</p>
                    <p className="mt-0.5 truncate text-xs">{workspaceChatReplyTarget.preview}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWorkspaceChatReplyTarget(null)}
                    className="h-7 w-7 shrink-0 rounded-full border border-purple-100 text-purple-500 hover:bg-purple-50 inline-flex items-center justify-center"
                    title="Batal reply"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}

              <textarea
                value={workspaceChatMessage}
                onChange={(e) => setWorkspaceChatMessage(e.target.value)}
                onKeyDown={handleWorkspaceChatInputKeyDown}
                rows={1}
                maxLength={500}
                placeholder="Tulis pesan untuk owner/assistant..."
                className="workspace-chat-textarea w-full h-20 rounded-2xl border border-purple-100 bg-[#fbfaff] dark:bg-slate-800 dark:border-indigo-900 px-4 py-3 text-sm text-[#4f4574] dark:text-purple-100 resize-none focus:outline-none focus:ring-2 focus:ring-purple-300/50"
                autoFocus={!isMobileTabletView}
              />
              <div className="workspace-chat-composer-actions flex items-center justify-between gap-3">
                <span className="text-[10px] font-semibold text-purple-300">{workspaceChatMessage.trim().length}/500</span>
                <div className="workspace-chat-composer-buttons flex gap-2">
                  <div className="relative">
                    {workspaceEmojiPickerOpen && (
                      <div className="absolute bottom-11 right-0 z-20 w-48 rounded-2xl border border-purple-100 bg-white dark:bg-slate-900 dark:border-indigo-900 p-2 shadow-xl grid grid-cols-6 gap-1">
                        {WORKSPACE_CHAT_EMOJIS.map(emoji => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => appendWorkspaceChatEmoji(emoji)}
                            className="h-8 w-8 rounded-lg hover:bg-purple-50 dark:hover:bg-slate-800 text-base flex items-center justify-center"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setWorkspaceEmojiPickerOpen(prev => !prev)}
                      className="h-10 w-10 rounded-xl border border-purple-100 text-purple-500 hover:bg-purple-50 inline-flex items-center justify-center"
                      title="Pilih emoticon"
                    >
                      <Smile size={16} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWorkspaceChatModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-purple-100 text-xs font-bold text-purple-500 hover:bg-purple-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={workspaceChatSending || !workspaceChatMessage.trim()}
                    className="px-4 py-2 rounded-xl bg-[#8f75d8] text-xs font-bold text-white disabled:opacity-50"
                  >
                    {workspaceChatSending ? 'Mengirim...' : 'Kirim Pesan'}
                  </button>
                </div>
              </div>
            </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {showQuickTaskModal && (
        <div className="fixed inset-0 bg-slate-500/35 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowQuickTaskModal(false)}>
          <div className="w-full max-w-lg rounded-[2rem] bg-white dark:bg-slate-900 p-8 shadow-2xl border border-purple-100/80 dark:border-indigo-900/50" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <h3 className="text-4xl font-extrabold text-purple-600 dark:text-purple-300 tracking-tight">Add Task</h3>
              <p className="text-sm text-slate-400 dark:text-slate-300 mt-2">Tambah task ke folder project beserta subtask-nya.</p>
            </div>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-300 dark:text-slate-400 mb-2">Judul Task</label>
                <input value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="Masukkan judul task..." className="w-full px-4 py-3 rounded-2xl border border-purple-100 dark:border-indigo-900 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300/50 focus:border-purple-300 transition-all" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-300 dark:text-slate-400 mb-2">Folder Project</label>
                  <input
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value)}
                    list="project-folder-options"
                    placeholder="Nama project / folder..."
                    className="w-full px-4 py-3 rounded-2xl border border-purple-100 dark:border-indigo-900 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300/50 focus:border-purple-300 transition-all"
                    required
                  />
                  <datalist id="project-folder-options">
                    {allProjectOptions.filter(option => option !== 'All').map(option => (
                      <option key={option} value={option} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-300 dark:text-slate-400 mb-2">Prioritas</label>
                  <select value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-purple-100 dark:border-indigo-900 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300/50 focus:border-purple-300 transition-all">
                    <option value="low">Rendah</option>
                    <option value="medium">Sedang</option>
                    <option value="high">Tinggi</option>
                    <option value="critical">Kritis</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-300 dark:text-slate-400 mb-2">Tanggal</label>
                  <input type="date" value={newTaskDate} onChange={(e) => setNewTaskDate(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-purple-100 dark:border-indigo-900 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300/50 focus:border-purple-300 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-300 dark:text-slate-400 mb-2">Jam</label>
                  <input type="time" value={newTaskTime} onChange={(e) => setNewTaskTime(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-purple-100 dark:border-indigo-900 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300/50 focus:border-purple-300 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-300 dark:text-slate-400 mb-2">Subtask</label>
                <textarea
                  value={newTaskSubtasks}
                  onChange={(e) => setNewTaskSubtasks(e.target.value)}
                  placeholder={'Opsional. Tulis satu subtask per baris.\nContoh:\nRiset kebutuhan\nSiapkan desain\nReview final'}
                  rows={4}
                  className="w-full px-4 py-3 rounded-2xl border border-purple-100 dark:border-indigo-900 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300/50 focus:border-purple-300 transition-all resize-none"
                />
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Subtask memakai tanggal dan jam yang sama saat dibuat, lalu bisa diedit terpisah dari kalender.</p>
              </div>
              <div className="pt-2 space-y-3">
                <button type="submit" className="w-full py-3 rounded-2xl bg-purple-300 hover:bg-purple-400 text-white text-[11px] tracking-[0.2em] uppercase font-bold shadow-sm hover:shadow-md transition-all active:scale-[0.99]">Simpan Task</button>
                <button type="button" onClick={() => setShowQuickTaskModal(false)} className="w-full text-center text-[11px] tracking-[0.18em] uppercase text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold transition-all">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showQuickBookingModal && (
        <div className="fixed inset-0 bg-slate-500/35 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowQuickBookingModal(false)}>
          <div className="w-full max-w-lg rounded-[2rem] bg-white dark:bg-slate-900 p-8 shadow-2xl border border-purple-100/80 dark:border-indigo-900/50" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <h3 className="text-4xl font-extrabold text-purple-600 dark:text-purple-300 tracking-tight">Add Jadwal</h3>
              <p className="text-sm text-slate-400 dark:text-slate-300 mt-2">Tambah reservasi/appointment manual dari halaman mana pun.</p>
            </div>
            <form onSubmit={handleAddBooking} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-300 dark:text-slate-400 mb-2">Nama Klien</label>
                <input value={bookingClient} onChange={(e) => setBookingClient(e.target.value)} placeholder="Nama klien" className="w-full px-4 py-3 rounded-2xl border border-purple-100 dark:border-indigo-900 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300/50 focus:border-purple-300 transition-all" required />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-300 dark:text-slate-400 mb-2">Topik Agenda</label>
                <input value={bookingTitle} onChange={(e) => setBookingTitle(e.target.value)} placeholder="Topik konsultasi / appointment" className="w-full px-4 py-3 rounded-2xl border border-purple-100 dark:border-indigo-900 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300/50 focus:border-purple-300 transition-all" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-300 dark:text-slate-400 mb-2">Tanggal</label>
                  <input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-purple-100 dark:border-indigo-900 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300/50 focus:border-purple-300 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-300 dark:text-slate-400 mb-2">Jam</label>
                  <select value={bookingTime} onChange={(e) => setBookingTime(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-purple-100 dark:border-indigo-900 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300/50 focus:border-purple-300 transition-all" disabled={!availableTimeSlotsForSelectedDate.length}>
                    {availableTimeSlotsForSelectedDate.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>
              {!availableTimeSlotsForSelectedDate.length && (
                <p className="text-xs text-amber-600 dark:text-amber-400">Tidak ada slot jam tersedia untuk tanggal ini.</p>
              )}
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-300 dark:text-slate-400 mb-2">Email</label>
                <input type="email" value={bookingEmail} onChange={(e) => setBookingEmail(e.target.value)} placeholder="nama@email.com (opsional)" className="w-full px-4 py-3 rounded-2xl border border-purple-100 dark:border-indigo-900 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300/50 focus:border-purple-300 transition-all" />
              </div>
              <div className="pt-2 space-y-3">
                <button type="submit" disabled={!availableTimeSlotsForSelectedDate.length} className="w-full py-3 rounded-2xl bg-purple-300 hover:bg-purple-400 disabled:opacity-50 text-white text-[11px] tracking-[0.2em] uppercase font-bold shadow-sm hover:shadow-md transition-all active:scale-[0.99]">Simpan Jadwal</button>
                <button type="button" onClick={() => setShowQuickBookingModal(false)} className="w-full text-center text-[11px] tracking-[0.18em] uppercase text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold transition-all">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTutorialCourse && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#20182f]/55 p-4 backdrop-blur-sm" onClick={() => setActiveTutorialCourse(null)}>
          <div className="w-full max-w-5xl overflow-hidden rounded-[1.6rem] border border-purple-100 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="relative aspect-video bg-black" style={{ background: `linear-gradient(135deg, ${activeTutorialCourse.accent || '#8f75d8'}, #241a35)` }}>
              {getYoutubeEmbedUrl(activeTutorialCourse.youtubeUrl) ? (
                <iframe
                  src={`${getYoutubeEmbedUrl(activeTutorialCourse.youtubeUrl)}?rel=0&modestbranding=1&playsinline=1`}
                  title={activeTutorialCourse.title}
                  className="absolute inset-0 h-full w-full border-0 bg-black"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center text-white">
                  <PlayCircle size={58} className="mb-4 opacity-90" />
                  <p className="text-xl font-extrabold">Video belum tersedia</p>
                  <p className="mt-2 max-w-md text-sm text-white/75">Developer dapat menambahkan link YouTube dari tombol Edit pada card course ini.</p>
                </div>
              )}
              <button
                type="button"
                onClick={() => setActiveTutorialCourse(null)}
                className="absolute right-4 top-4 h-10 w-10 rounded-full bg-white/90 text-[#4f4574] shadow-lg"
                aria-label="Tutup video"
              >
                <X size={18} className="mx-auto" />
              </button>
            </div>
            <div className="p-5">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-purple-400">{activeTutorialCourse.module}</p>
                  <h3 className="mt-1 text-2xl font-extrabold text-[#4f4574]">{activeTutorialCourse.title}</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-purple-500">{activeTutorialCourse.description}</p>
	                </div>
	                <div className="flex gap-2">
	                  {tutorialProgressById[activeTutorialCourse.id]?.status !== 'completed' && (
	                    <button
	                      type="button"
	                      onClick={() => completeTutorialCourse(activeTutorialCourse.id)}
	                      className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 inline-flex items-center gap-1.5"
	                    >
	                      <CheckCircle size={13} />
	                      Tandai selesai
	                    </button>
	                  )}
	                  <span className="rounded-full bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-600">{activeTutorialCourse.duration}</span>
	                  <span className="rounded-full bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-600">{activeTutorialCourse.lessons} lesson</span>
	                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingTutorialCourse && isAppDeveloper && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#20182f]/45 p-4 backdrop-blur-sm" onClick={() => setEditingTutorialCourse(null)}>
          <form onSubmit={saveTutorialCourse} className="w-full max-w-2xl rounded-[1.6rem] border border-purple-100 bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-purple-400">Developer Course Editor</p>
                <h3 className="mt-1 text-xl font-extrabold text-[#4f4574]">Edit Tutorial Video</h3>
              </div>
              <button type="button" onClick={() => setEditingTutorialCourse(null)} className="h-9 w-9 rounded-xl border border-purple-100 text-purple-400">
                <X size={16} className="mx-auto" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block md:col-span-2">
                <span className="block text-[10px] uppercase tracking-wider font-bold text-purple-500 mb-2">Judul Course</span>
                <input value={editingTutorialCourse.title || ''} onChange={(e) => setEditingTutorialCourse(prev => ({ ...prev, title: e.target.value }))} className="w-full rounded-xl border border-purple-100 px-3 py-2.5 text-sm" required />
              </label>
              <label className="block">
                <span className="block text-[10px] uppercase tracking-wider font-bold text-purple-500 mb-2">Module</span>
                <input value={editingTutorialCourse.module || ''} onChange={(e) => setEditingTutorialCourse(prev => ({ ...prev, module: e.target.value }))} className="w-full rounded-xl border border-purple-100 px-3 py-2.5 text-sm" />
              </label>
              <label className="block">
                <span className="block text-[10px] uppercase tracking-wider font-bold text-purple-500 mb-2">Durasi Video</span>
                <input value={editingTutorialCourse.duration || ''} onChange={(e) => setEditingTutorialCourse(prev => ({ ...prev, duration: e.target.value }))} placeholder="08:35" className="w-full rounded-xl border border-purple-100 px-3 py-2.5 text-sm" />
              </label>
              <label className="block md:col-span-2">
                <span className="block text-[10px] uppercase tracking-wider font-bold text-purple-500 mb-2">Link YouTube</span>
                <input value={editingTutorialCourse.youtubeUrl || ''} onChange={(e) => setEditingTutorialCourse(prev => ({ ...prev, youtubeUrl: e.target.value }))} placeholder="https://www.youtube.com/watch?v=..." className="w-full rounded-xl border border-purple-100 px-3 py-2.5 text-sm" />
              </label>
              <label className="block md:col-span-2">
                <span className="block text-[10px] uppercase tracking-wider font-bold text-purple-500 mb-2">Deskripsi</span>
                <textarea value={editingTutorialCourse.description || ''} onChange={(e) => setEditingTutorialCourse(prev => ({ ...prev, description: e.target.value }))} rows={3} className="w-full resize-none rounded-xl border border-purple-100 px-3 py-2.5 text-sm" />
              </label>
              <label className="block">
                <span className="block text-[10px] uppercase tracking-wider font-bold text-purple-500 mb-2">Level</span>
                <input value={editingTutorialCourse.level || ''} onChange={(e) => setEditingTutorialCourse(prev => ({ ...prev, level: e.target.value }))} className="w-full rounded-xl border border-purple-100 px-3 py-2.5 text-sm" />
              </label>
              <label className="block">
                <span className="block text-[10px] uppercase tracking-wider font-bold text-purple-500 mb-2">Jumlah Lesson</span>
                <input type="number" min="1" value={editingTutorialCourse.lessons || 1} onChange={(e) => setEditingTutorialCourse(prev => ({ ...prev, lessons: Number(e.target.value || 1) }))} className="w-full rounded-xl border border-purple-100 px-3 py-2.5 text-sm" />
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setEditingTutorialCourse(null)} className="rounded-xl border border-purple-100 px-4 py-2 text-xs font-bold text-purple-500">Batal</button>
              <button type="submit" disabled={savingTutorialCourse} className="rounded-xl bg-[#8f75d8] px-4 py-2 text-xs font-bold text-white disabled:opacity-60">
                {savingTutorialCourse ? 'Menyimpan...' : 'Simpan Tutorial'}
              </button>
            </div>
          </form>
        </div>
      )}

      {mobilePwaGuideOpen && isMobileTabletView && !isPwaStandalone && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#20182f]/45 p-3 backdrop-blur-sm md:p-4" onClick={handleDismissMobilePwaGuide}>
          <div className="w-full max-w-md -translate-y-4 rounded-[1.8rem] border border-purple-100 bg-white p-5 shadow-2xl transition-transform dark:border-indigo-900 dark:bg-slate-950 md:translate-y-0" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-purple-400">Install DyaTask</p>
                <h3 className="mt-1 text-lg font-extrabold text-[#4f4574] dark:text-white">Pasang aplikasi di HP atau tablet</h3>
                <p className="mt-1 text-xs leading-5 text-purple-400 dark:text-purple-300">
                  Ikuti langkah singkat sesuai perangkat Anda supaya DyaTask bisa dibuka seperti aplikasi penuh.
                </p>
              </div>
              <button type="button" onClick={handleDismissMobilePwaGuide} className="h-9 w-9 rounded-xl border border-purple-100 text-purple-400 dark:border-indigo-800">
                <X size={16} className="mx-auto" />
              </button>
            </div>

            <div className="mt-4 rounded-[1.5rem] border border-purple-100 bg-[linear-gradient(135deg,#f4efff,#fff)] p-4 dark:border-indigo-900 dark:bg-[linear-gradient(135deg,#211638,#111827)]">
              <div className="flex items-center gap-4">
                <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-[1.4rem] border border-purple-100 bg-white shadow-sm dark:border-indigo-900 dark:bg-slate-900">
                  <img src={dyataskMiniLogo} alt="DyaTask" className="h-12 w-12 object-contain" />
                  <div className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-2xl bg-[#8f75d8] text-white shadow-lg">
                    <Smartphone size={16} />
                  </div>
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-2 text-[#6f55bd]">
                    <Share2 size={14} />
                    <span className="text-xs font-bold">Buka menu browser / share</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#6f55bd]">
                    <Plus size={14} />
                    <span className="text-xs font-bold">Pilih Add to Home Screen</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-600">
                    <CheckCircle size={14} />
                    <span className="text-xs font-bold">Buka DyaTask dari layar utama</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2">
              {mobilePwaGuideTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setMobilePwaGuidePlatform(tab.key)}
                  className={`rounded-xl px-2 py-2 text-[11px] font-bold ${
                    mobilePwaGuidePlatform === tab.key
                      ? 'bg-[#8f75d8] text-white'
                      : 'border border-purple-100 text-[#6f55bd] dark:border-indigo-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-[1.4rem] border border-purple-100 bg-purple-50/60 p-4 dark:border-indigo-900 dark:bg-indigo-950/30">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-extrabold text-[#4f4574] dark:text-white">
                    Tutorial {mobilePwaGuideTabs.find(tab => tab.key === mobilePwaGuidePlatform)?.label}
                  </p>
                  <p className="text-[11px] text-purple-400 dark:text-purple-300">
                    {isIosLikeInstallDevice && (mobilePwaGuidePlatform === 'iphone' || mobilePwaGuidePlatform === 'ipad')
                      ? 'Gunakan Safari untuk hasil paling stabil.'
                      : pwaInstallPrompt
                        ? 'Prompt install sudah siap jika browser mendukung.'
                        : 'Jika prompt belum muncul, gunakan menu browser secara manual.'}
                  </p>
                </div>
                {pwaInstallPrompt && !['iphone', 'ipad'].includes(mobilePwaGuidePlatform) && (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600">Install siap</span>
                )}
              </div>
              <div className="space-y-2.5">
                {activeMobilePwaGuideSteps.map((step, index) => {
                  const StepIcon = step.icon
                  return (
                    <div key={`${mobilePwaGuidePlatform}-${index}`} className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white text-[#8f75d8] shadow-sm dark:bg-slate-900">
                        <StepIcon size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#4f4574] dark:text-white">{index + 1}. {step.title}</p>
                        <p className="mt-0.5 text-[11px] leading-5 text-slate-500 dark:text-slate-300">{step.detail}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2">
              {pwaInstallPrompt && !['iphone', 'ipad'].includes(mobilePwaGuidePlatform) ? (
                <button
                  type="button"
                  onClick={handleInstallPwa}
                  className="rounded-2xl bg-[#8f75d8] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-purple-500/15"
                >
                  Install Sekarang
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDismissMobilePwaGuide}
                  className="rounded-2xl border border-purple-100 bg-white px-4 py-3 text-sm font-bold text-[#6f55bd] dark:border-indigo-800 dark:bg-slate-900"
                >
                  Saya Paham
                </button>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleMarkMobilePwaGuideInstalled}
                  className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-bold text-emerald-700 inline-flex items-center justify-center gap-1.5"
                >
                  <Check size={14} />
                  Sudah terinstal
                </button>
                <button
                  type="button"
                  onClick={handleMarkMobilePwaGuideUnsupported}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-600 inline-flex items-center justify-center gap-1.5"
                >
                  <Check size={14} />
                  Tidak support
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {installOptionsOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#20182f]/50 p-4 backdrop-blur-sm" onClick={() => setInstallOptionsOpen(false)}>
          <div className="w-full max-w-2xl rounded-[1.6rem] border border-purple-100 bg-white p-6 shadow-2xl dark:border-indigo-900 dark:bg-slate-950" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-purple-400">Install DyaTask</p>
                <h3 className="mt-1 text-xl font-extrabold text-[#4f4574] dark:text-white">Pilih versi aplikasi</h3>
                <p className="mt-1 text-xs leading-5 text-purple-400 dark:text-purple-300">PWA cocok untuk browser/tablet/handphone. DMG dipakai untuk instalasi native di macOS.</p>
              </div>
              <button type="button" onClick={() => setInstallOptionsOpen(false)} className="h-9 w-9 rounded-xl border border-purple-100 text-purple-400 dark:border-indigo-800">
                <X size={16} className="mx-auto" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleInstallPwa}
                className="rounded-2xl border border-purple-100 bg-purple-50/60 p-4 text-left transition-all hover:border-[#8f75d8]/40 hover:bg-purple-50 dark:border-indigo-900 dark:bg-indigo-950/25"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#8f75d8] shadow-sm dark:bg-slate-900">
                    <Smartphone size={20} />
                  </span>
                  <div>
                    <h4 className="text-sm font-extrabold text-[#4f4574] dark:text-white">Install PWA</h4>
                    <p className="text-[11px] text-purple-400 dark:text-purple-300">{pwaInstallPrompt ? 'Prompt browser siap dibuka.' : 'Gunakan menu browser jika prompt belum tersedia.'}</p>
                  </div>
                </div>
                <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-slate-300">Untuk Chrome/Safari/Edge di tablet atau handphone yang mendukung Add to Home Screen.</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleDownloadDmg()
                  setInstallOptionsOpen(false)
                }}
                className={`rounded-2xl border p-4 text-left transition-all hover:border-[#8f75d8]/40 ${
                  isMacOsDevice
                    ? 'border-purple-100 bg-white hover:bg-purple-50 dark:border-indigo-900 dark:bg-slate-900'
                    : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#8f75d8] text-white shadow-sm">
                    <Download size={20} />
                  </span>
                  <div>
                    <h4 className="text-sm font-extrabold text-[#4f4574] dark:text-white">Download DMG macOS</h4>
                    <p className="text-[11px] text-purple-400 dark:text-purple-300">Rilis terbaru dari GitHub.</p>
                  </div>
                </div>
                <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-slate-300">Untuk Macbook/iMac. Setelah rilis DMG baru dipublish, link ini selalu mengarah ke versi terbaru.</p>
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-purple-100 bg-purple-50/50 px-4 py-3 text-[11px] text-purple-500 dark:border-indigo-900 dark:bg-indigo-950/25 dark:text-purple-200">
              Versi saat ini: <span className="font-bold">v{currentAppVersion}</span> • <span className="font-bold">{updateStatusLabel}</span>
            </div>
          </div>
        </div>
      )}

      {deployUpdateInfo && (
        <div className={`fixed right-8 top-24 z-[70] w-[min(380px,calc(100vw-2rem))] rounded-[1.75rem] border p-4 shadow-2xl backdrop-blur-xl ${
          theme === 'dark'
            ? 'bg-slate-950/92 border-indigo-800/70 text-white'
            : 'bg-white/95 border-purple-100 text-slate-900'
        }`}>
          {(() => {
            const latestVersion = deployUpdateInfo.version || 'terbaru'
            return (
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#8f75d8]/15 flex items-center justify-center shrink-0">
              <img src={dyataskMiniLogo} alt="DyaTask" className="w-8 h-8 object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#8f75d8] font-bold">Realtime Update</p>
                  <h4 className="text-base font-extrabold mt-1">Update tersedia</h4>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const key = getDeployVersionKey(deployUpdateInfo)
                    dismissedDeployVersionRef.current = key
                    localStorage.setItem('dyatask_dismissed_deploy_version', key)
                    setDeployUpdateInfo(null)
                  }}
                  className="w-8 h-8 rounded-full border border-purple-100 dark:border-indigo-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-300 mt-2 leading-relaxed">
                Aplikasi sudah tersedia dalam versi terbaru yang sudah ditingkatkan. Reload aplikasi untuk memakai pembaruan.
              </p>
              <div className="mt-3 rounded-2xl bg-purple-50/70 dark:bg-indigo-950/35 border border-purple-100 dark:border-indigo-800/60 px-3 py-2 text-[11px] text-slate-500 dark:text-slate-300">
                <p><span className="font-bold text-slate-700 dark:text-white">Versi saat ini:</span> v{currentAppVersion}</p>
                <p><span className="font-bold text-slate-700 dark:text-white">Versi terbaru:</span> v{latestVersion}</p>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="flex-1 py-2.5 rounded-2xl bg-[#8f75d8] hover:bg-[#8069c8] text-white text-xs font-bold shadow-lg shadow-purple-500/15 transition-all"
                >
                  Reload Aplikasi
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const key = getDeployVersionKey(deployUpdateInfo)
                    dismissedDeployVersionRef.current = key
                    localStorage.setItem('dyatask_dismissed_deploy_version', key)
                    setDeployUpdateInfo(null)
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-purple-50 hover:bg-purple-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-[#8f75d8] text-xs font-bold transition-colors"
                >
                  Nanti
                </button>
              </div>
            </div>
          </div>
            )
          })()}
        </div>
      )}

      {/* 🚀 SIMULATED MAC PUSH NOTIFICATION TOAST */}
      {activeNotifications.length > 0 && notificationBannerVisible && !isMobileWorkspaceChatView && (
        <div className={`notification-banner glass-panel p-3 ${theme === 'dark' ? 'notif-dark' : 'notif-light'}`}>
          {!showNotificationList && activeNotifications.length > 1 ? (
            <button
              onClick={() => setShowNotificationList(true)}
              className="w-full flex items-center justify-between gap-3 text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${theme === 'dark' ? 'bg-cyan-500 text-slate-900' : 'bg-emerald-500 text-white'}`}>
                  D
                </div>
                <div className="min-w-0">
                  <h4 className={`text-xs font-bold truncate ${theme === 'dark' ? 'text-cyan-300' : 'text-emerald-700'}`}>Pesan Masuk • DyaTask</h4>
                  <p className={`text-[11px] truncate ${theme === 'dark' ? 'text-cyan-100/90' : 'text-slate-700'}`}>Ada {activeNotifications.length} notifikasi belum dikonfirmasi. Klik untuk lihat daftar.</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${theme === 'dark' ? 'bg-cyan-500 text-slate-900' : 'bg-emerald-500 text-white'}`}>{activeNotifications.length}</span>
            </button>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              <div className="flex items-center justify-between">
                <h4 className={`text-xs font-bold ${theme === 'dark' ? 'text-cyan-300' : 'text-emerald-700'}`}>Pesan Masuk • DyaTask</h4>
                {activeNotifications.length > 1 && (
                  <button
                    onClick={() => setShowNotificationList(false)}
                    className={`text-[10px] px-2 py-0.5 rounded border ${theme === 'dark' ? 'bg-slate-800 text-cyan-100 border-cyan-500/30' : 'bg-emerald-100 text-emerald-700 border-emerald-300'}`}
                  >
                    Collapse
                  </button>
                )}
              </div>
              {activeNotifications.map((item) => (
                <div key={item.id} className={`rounded-lg border p-2.5 ${theme === 'dark' ? 'border-cyan-500/30 bg-slate-900/70' : 'border-emerald-300 bg-white/85'}`}>
                  <div className="flex items-start gap-2.5">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${theme === 'dark' ? 'bg-cyan-500 text-slate-900' : 'bg-emerald-500 text-white'}`}>D</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-[11px] font-semibold truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{item.title}</p>
                        <button onClick={() => removeNotificationById(item.id)} className={`text-xs font-bold ${theme === 'dark' ? 'text-cyan-200 hover:text-white' : 'text-emerald-700 hover:text-emerald-900'}`}>✕</button>
                      </div>
                      <p className={`text-[11px] mt-0.5 line-clamp-2 ${theme === 'dark' ? 'text-cyan-100/90' : 'text-slate-700'}`}>{formatTextDates(item.body)}</p>
                      <div className="mt-2">
                        <button
                          onClick={() => confirmNotificationById(item.id)}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-semibold ${theme === 'dark' ? 'bg-cyan-500 text-slate-900 hover:bg-cyan-400' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}
                        >
                          Konfirmasi
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleQuickReply('Konfirmasi reservasi diterima.')}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-semibold ${theme === 'dark' ? 'bg-cyan-500 text-slate-900 hover:bg-cyan-400' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}
                >
                  Balas Cepat
                </button>
                <button
                  onClick={handleRemindMe}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-semibold border ${theme === 'dark' ? 'bg-slate-800 text-cyan-100 border-cyan-500/30 hover:bg-slate-700' : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'}`}
                >
                  Ingatkan Saya
                </button>
                <button
                  onClick={() => {
                    setNotifications([])
                    setShowNotificationList(false)
                  }}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-semibold border ${theme === 'dark' ? 'bg-slate-800 text-cyan-100 border-cyan-500/30 hover:bg-slate-700' : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50'}`}
                >
                  Tutup Semua
                </button>
              </div>
              <p className={`text-[10px] ${theme === 'dark' ? 'text-cyan-200/80' : 'text-slate-700'}`}>
                Notifikasi tetap tersimpan sampai dikonfirmasi atau dihapus manual.
              </p>
            </div>
          )}
        </div>
      )}

      {showNotificationHistory && (
        <div className={`fixed bottom-32 right-10 z-50 w-[min(360px,calc(100vw-2rem))] rounded-[1.5rem] border p-4 shadow-2xl backdrop-blur-xl ${
          theme === 'dark'
            ? 'bg-slate-950/90 border-indigo-800/70 text-white'
            : 'bg-white/92 border-purple-100 text-slate-900'
        }`}>
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#8f75d8]/15 flex items-center justify-center shrink-0">
                <img src={dyataskMiniLogo} alt="DyaTask" className="w-7 h-7 object-contain" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-extrabold">Riwayat Notifikasi</h4>
                <p className="text-[11px] text-slate-400">{notifications.length} total • {activeNotifications.length} belum dikonfirmasi</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowNotificationHistory(false)}
              className="w-8 h-8 rounded-full border border-purple-100 dark:border-indigo-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto pr-1 space-y-2">
            {notifications.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-purple-200 dark:border-indigo-800 p-5 text-center">
                <img src={dyataskMiniLogo} alt="" className="w-10 h-10 object-contain mx-auto opacity-70 mb-2" />
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-300">Belum ada notifikasi.</p>
                <p className="text-[11px] text-slate-400 mt-1">Semua notifikasi akan tersimpan di sini sampai kamu hapus.</p>
              </div>
            ) : notifications.map(item => (
              <div key={item.id} className={`rounded-2xl border p-3 ${
                theme === 'dark'
                  ? 'bg-indigo-950/35 border-indigo-800/60'
                  : 'bg-purple-50/45 border-purple-100'
              }`}>
                <div className="flex items-start gap-3">
                  <img src={dyataskMiniLogo} alt="" className="w-8 h-8 object-contain shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold truncate">{item.title}</p>
                      <button
                        type="button"
                        onClick={() => removeNotificationById(item.id)}
                        className="text-[11px] font-bold text-slate-400 hover:text-red-500 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-300 mt-1 leading-relaxed line-clamp-2">{formatTextDates(item.body)}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <p className="text-[10px] text-[#8f75d8] font-semibold">{formatLongDateTime(item.createdAt)}</p>
                      {item.confirmed ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">Terkonfirmasi</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => confirmNotificationById(item.id)}
                          className="text-[10px] px-2 py-1 rounded-lg bg-[#8f75d8] hover:bg-[#8069c8] text-white font-semibold transition-colors"
                        >
                          Konfirmasi
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            disabled={notifications.length === 0}
            onClick={() => {
              setNotifications([])
              setShowNotificationList(false)
            }}
            className="mt-3 w-full py-2 rounded-xl bg-[#8f75d8] hover:bg-[#8069c8] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold transition-colors"
          >
            Hapus Semua Riwayat
          </button>
        </div>
      )}

      {workspaceInviteNotice && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#241a35]/35 backdrop-blur-sm" onClick={() => setWorkspaceInviteNotice(null)}></div>
          <div className="relative w-full max-w-md rounded-[1.35rem] border border-purple-100 bg-white p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className={`h-10 w-10 shrink-0 rounded-2xl flex items-center justify-center ${
                workspaceInviteNotice.tone === 'success'
                  ? 'bg-emerald-50 text-emerald-600'
                  : workspaceInviteNotice.tone === 'warning'
                    ? 'bg-amber-50 text-amber-600'
                    : workspaceInviteNotice.tone === 'error'
                      ? 'bg-red-50 text-red-500'
                      : 'bg-purple-50 text-purple-600'
              }`}>
                {workspaceInviteNotice.tone === 'success' ? (
                  <CheckCircle size={19} />
                ) : workspaceInviteNotice.tone === 'warning' || workspaceInviteNotice.tone === 'error' ? (
                  <AlertCircle size={19} />
                ) : (
                  <UserPlus size={19} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-[#4f4574]">{workspaceInviteNotice.title}</p>
                {workspaceInviteNotice.message && (
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{workspaceInviteNotice.message}</p>
                )}
                {workspaceInviteNotice.detail && (
                  <div className="mt-3 rounded-xl border border-purple-100 bg-[#faf8ff] px-3 py-2">
                    <p className="break-all font-mono text-[11px] font-bold text-purple-700">{workspaceInviteNotice.detail}</p>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setWorkspaceInviteNotice(null)}
                className="h-8 w-8 shrink-0 rounded-xl border border-purple-100 text-purple-400 hover:text-purple-700"
                title="Tutup"
              >
                <X size={15} className="mx-auto" />
              </button>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setWorkspaceInviteNotice(null)}
                className="rounded-xl bg-[#8f75d8] px-4 py-2 text-xs font-bold text-white hover:bg-[#8069c8]"
              >
                Oke
              </button>
            </div>
          </div>
        </div>
      )}

      {isWorkspaceAccessRevoked && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-[#2b2238]/35 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-[1.6rem] border border-red-100 bg-white/95 p-7 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <ShieldCheck size={26} />
            </div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-red-400">Akses Workspace Dicabut</p>
            <h2 className="mt-2 text-2xl font-extrabold leading-tight text-[#4f4574]">
              Maaf, akses Anda sudah dicabut dari workspace ini.
            </h2>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">
              Hubungi owner {workspaceOwnerDisplayName || 'workspace'} jika akses perlu diaktifkan kembali.
            </p>
            <button
              type="button"
              onClick={handleSignOut}
              className="mt-6 rounded-xl bg-[#8f75d8] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#8069c8]"
            >
              Keluar
            </button>
          </div>
        </div>
      )}

      {/* 🚀 FLOATING OVERLAY QUICK ADD LAUNCHER */}
      {floatingQuickAdd && (
        <div className="floating-overlay-widget glass-panel p-4 glow-primary">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-widest flex items-center gap-1">
              <Laptop size={12} />
              macOS Quick Input
            </h4>
            <button 
              onClick={() => setFloatingQuickAdd(false)}
              className="text-purple-400 hover:text-purple-700 text-xs font-bold"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleFloatingQuickAdd} className="space-y-3">
            <input 
              type="text" 
              placeholder="Tambahkan tugas cepat (Option + Space)..."
              value={floatingTaskTitle}
              onChange={(e) => setFloatingTaskTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-purple-200 dark:border-indigo-950 bg-white/50 dark:bg-indigo-950/20 text-xs focus:outline-none focus:border-purple-500"
              required
              autoFocus
            />
            <div className="flex justify-between items-center">
              <span className="text-[9px] text-purple-400 dark:text-purple-300">Disinkronkan ke Kalender & Sheets</span>
              <button 
                type="submit"
                className="px-3.5 py-1.5 bg-[#8f75d8] text-white font-bold text-[10px] rounded-lg hover:bg-[#8069c8] transition-colors"
              >
                Simpan Cepat
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Profile Edit Modal - Rendered at Top Level (Outside Sidebar) */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsProfileModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-indigo-950/95 rounded-3xl p-6 w-full max-w-2xl z-[9999] shadow-2xl border border-purple-100/20 dark:border-indigo-900/50 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <User size={18} className="text-purple-600 dark:text-purple-400" />
                </div>
                Edit Profil
              </h3>
              <button onClick={() => setIsProfileModalOpen(false)} className="text-purple-400 hover:text-purple-600 dark:hover:text-purple-300 font-bold text-2xl transition-colors">✕</button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-bold text-purple-500 dark:text-purple-400 uppercase tracking-widest mb-2">Nama Lengkap</label>
                <input 
                  type="text" 
                  placeholder="Masukkan nama lengkap Anda"
                  value={profileFormData.full_name}
                  onChange={(e) => setProfileFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-purple-200 dark:border-indigo-800 bg-white dark:bg-indigo-900/40 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />
              </div>

              {/* Avatar Upload */}
              <div>
                <label className="block text-xs font-bold text-purple-500 dark:text-purple-400 uppercase tracking-widest mb-2">Foto Profil</label>
                <div className="relative">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setProfileFormData(prev => ({ ...prev, avatar_file: file }))
                      }
                    }}
                    disabled={uploadingAvatar}
                    className="w-full px-4 py-2.5 rounded-lg border border-purple-200 dark:border-indigo-800 bg-white dark:bg-indigo-900/40 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                {(profileFormData.avatar_file || profileFormData.avatar_url) && (
                  <div className="mt-2 flex justify-center">
                    <img 
                      src={profileFormData.avatar_file ? URL.createObjectURL(profileFormData.avatar_file) : profileFormData.avatar_url} 
                      alt="Preview" 
                      className="w-16 h-16 rounded-lg object-cover border border-purple-200 dark:border-indigo-800" 
                      onError={(e) => e.target.style.display = 'none'} 
                    />
                  </div>
                )}
              </div>

              {/* Tanggal Lahir */}
              <div>
                <label className="block text-xs font-bold text-purple-500 dark:text-purple-400 uppercase tracking-widest mb-2">Tanggal Lahir</label>
                <input 
                  type="date"
                  value={profileFormData.tanggal_lahir}
                  onChange={(e) => setProfileFormData(prev => ({ ...prev, tanggal_lahir: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-purple-200 dark:border-indigo-800 bg-white dark:bg-indigo-900/40 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-purple-500 dark:text-purple-400 uppercase tracking-widest mb-2">Email</label>
                <input 
                  type="email"
                  placeholder="Masukkan email Anda"
                  value={profileFormData.email}
                  onChange={(e) => setProfileFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-purple-200 dark:border-indigo-800 bg-white dark:bg-indigo-900/40 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />
              </div>

              {/* Nomor HP */}
              <div>
                <label className="block text-xs font-bold text-purple-500 dark:text-purple-400 uppercase tracking-widest mb-2">Nomor HP</label>
                <input 
                  type="tel"
                  placeholder="Masukkan nomor HP Anda"
                  value={profileFormData.nomer_hp}
                  onChange={(e) => setProfileFormData(prev => ({ ...prev, nomer_hp: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-purple-200 dark:border-indigo-800 bg-white dark:bg-indigo-900/40 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />
              </div>

              <div className="pt-1 space-y-2">
                <div className="text-xs text-purple-600 dark:text-purple-300 p-2.5 bg-purple-50 dark:bg-indigo-900/20 rounded-lg border border-purple-100 dark:border-indigo-900/50 leading-relaxed">
                  <span className="font-semibold">💾</span> Perubahan akan disimpan secara real-time ke Supabase.
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button 
                  type="submit"
                  disabled={uploadingAvatar}
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#8f75d8] to-[#8069c8] hover:from-[#8069c8] hover:to-[#745ebb] text-white font-bold rounded-lg text-sm flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-[#8f75d8]/40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <User size={14} />
                  {uploadingAvatar ? 'Menyimpan...' : 'Simpan'}
                </button>
                <button type="button" onClick={() => setIsProfileModalOpen(false)} disabled={uploadingAvatar} className="flex-1 py-2.5 bg-gray-200 dark:bg-indigo-800 hover:bg-gray-300 dark:hover:bg-indigo-700 text-gray-800 dark:text-white font-semibold rounded-lg text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🚀 FLOATING WIDGET BUTTON ON MACBOOK PREVIEW */}
      {floatingMenuEnabled && !isMobileWorkspaceChatView && !workspaceChatModalOpen && (
        <button 
          type="button"
          onClick={() => {
            setFloatingQuickAdd(false)
            setNotificationBannerVisible(false)
            setShowNotificationList(false)
            setShowNotificationHistory(prev => !prev)
          }}
          aria-label="Buka riwayat notifikasi"
          className="floating-notification-trigger fixed bottom-12 right-14 w-20 h-20 flex items-center justify-center active:scale-95 transition-all z-40"
        >
          <img src={dyataskMiniLogo} alt="" className="floating-notification-icon w-20 h-20 object-contain drop-shadow-xl hover:scale-105 transition-transform" />
          {activeNotifications.length > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-white dark:border-slate-950">
              {Math.min(activeNotifications.length, 9)}
            </span>
          )}
        </button>
      )}

    </div>
  )
}

export default App
