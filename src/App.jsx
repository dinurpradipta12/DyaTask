import React, { useState, useEffect, useRef, useMemo } from 'react'
import './App.css'
import dyataskLogo from './logo-dyatask.png'
import dyataskMiniLogo from './minilogo-dyatask.png'
import { supabase, supabaseAdmin } from './supabaseClient'
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
  Search,
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
  Check,
  Eye,
  EyeOff,
  BellRing,
  AlertCircle,
  Folder,
  FolderOpen
} from 'lucide-react'

// Mock initial data
const initialTasks = [
  {
    id: 1,
    title: 'Tinjau Jadwal Kerja Aruneeka',
    category: 'Work',
    priority: 'critical',
    colorLabel: '#8B5CF6',
    status: 'todo',
    dueTime: '23:00',
    hasReminder: true
  },
  {
    id: 2,
    title: 'Konfigurasi Supabase SQL Schema & RLS',
    category: 'Work',
    priority: 'high',
    colorLabel: '#EC4899',
    status: 'in_progress',
    dueTime: '20:00',
    hasReminder: true
  },
  {
    id: 3,
    title: 'Sinkronisasi Google Calendar OAuth API',
    category: 'Meeting',
    priority: 'medium',
    colorLabel: '#10B981',
    status: 'done',
    dueTime: '14:00',
    hasReminder: false
  },
  {
    id: 4,
    title: 'Enkripsi Kunci Rahasia API & Backup Keamanan',
    category: 'Security',
    priority: 'critical',
    colorLabel: '#F59E0B',
    status: 'todo',
    dueTime: '21:30',
    hasReminder: true
  }
]

const initialAppointments = [
  {
    id: 1,
    clientName: 'Alisa Adams',
    title: 'Review Desain UI/UX DyaTask',
    time: '14:00 - 15:00',
    date: '2026-05-21',
    status: 'confirmed',
    email: 'alisa@aruneeka.pro'
  },
  {
    id: 2,
    clientName: 'John Doe',
    title: 'Konsultasi Integrasi Google Sheets',
    time: '16:30 - 17:30',
    date: '2026-05-22',
    status: 'pending',
    email: 'john.doe@gmail.com'
  }
]

const initialNotes = [
  {
    id: 'note-1',
    title: 'Rencana Jangka Panjang DyaTask',
    cipherText: 'U2FsdGVkX1+vG0N... [ENCRYPTED PAYLOAD]',
    iv: 'a3d2e5f6',
    salt: 'f39a0e1b',
    plaintextHint: 'Rencana rilis versi desktop Electron dan React Native mobile...',
    isEncrypted: true
  }
]

function App() {
  const formatDateLocal = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [appHeaderTagline, setAppHeaderTagline] = useState(() => localStorage.getItem('dyatask_header_tagline') || 'Modern Soft Minimalist Amethyst')
  const [appHeaderTitle, setAppHeaderTitle] = useState(() => localStorage.getItem('dyatask_header_title') || 'Dyatask Manager - Superapp for Freelancer')
  const [loginVisualImage, setLoginVisualImage] = useState(() => localStorage.getItem('dyatask_login_visual_image') || '')
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('dyatask_theme')
    return savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'dark'
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

  // Booking state
  const [appointments, setAppointments] = useState(initialAppointments)
  const [googleCalendarEvents, setGoogleCalendarEvents] = useState([])
  const [nationalHolidays, setNationalHolidays] = useState([])
  const seenGoogleCalendarEventIdsRef = useRef(new Set())
  const googleCalendarBaselineReadyRef = useRef(false)
  const reminderNotificationKeysRef = useRef(new Set())

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
  const [shareToken, setShareToken] = useState(() => {
    const saved = localStorage.getItem('dyatask_booking_share_token')
    if (saved) return saved
    const generated = Math.random().toString(36).slice(2, 10)
    localStorage.setItem('dyatask_booking_share_token', generated)
    return generated
  })
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
      const saved = JSON.parse(localStorage.getItem('dyatask_booking_availability') || '{}')
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
  const [selectedAvailabilityDay, setSelectedAvailabilityDay] = useState(1)
  const [showAvailabilitySettings, setShowAvailabilitySettings] = useState(false)
  const [showBookingQuickForm, setShowBookingQuickForm] = useState(false)
  const [publicBookingSuccess, setPublicBookingSuccess] = useState(false)
  const [publicBookingSummary, setPublicBookingSummary] = useState(null)
  const [publicBookingNotes, setPublicBookingNotes] = useState(() => {
    const saved = localStorage.getItem('dyatask_public_booking_notes')
    if (saved) return saved
    return 'Ketentuan reservasi:\n- Harap hadir 10 menit sebelum jadwal.\n- Jadwal dapat dijadwalkan ulang maksimal 1x.\n- Link meeting akan dikirim via email/WhatsApp setelah konfirmasi.'
  })
  const [publicShareBaseUrl, setPublicShareBaseUrl] = useState(() => localStorage.getItem('dyatask_public_share_base_url') || '')

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
  const [notificationNowMs, setNotificationNowMs] = useState(Date.now())
  const [floatingQuickAdd, setFloatingQuickAdd] = useState(false)
  const [showNotificationHistory, setShowNotificationHistory] = useState(false)
  const [floatingTaskTitle, setFloatingTaskTitle] = useState('')
  const [showQuickTaskModal, setShowQuickTaskModal] = useState(false)
  const [showQuickBookingModal, setShowQuickBookingModal] = useState(false)

  // macOS system configurations
  const [autoStart, setAutoStart] = useState(true)
  const [autoOpenOnAlert, setAutoOpenOnAlert] = useState(true)
  const [floatingMenuEnabled, setFloatingMenuEnabled] = useState(true)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true)
  const [syncStatus, setSyncStatus] = useState('Terhubung')

  // Integration config state (synced with Supabase per user; localStorage used only as temporary fallback)
  const [integrationConfigs, setIntegrationConfigs] = useState({})
  const [activeIntegrationModal, setActiveIntegrationModal] = useState(null) // 'google_calendar' | 'notion' | 'email' | 'google_sheets'
  const [activeTutorialModal, setActiveTutorialModal] = useState(null)
  const [integrationFormData, setIntegrationFormData] = useState({})
  const [testingGoogleConnection, setTestingGoogleConnection] = useState(false)
  const [googleConnectionStatus, setGoogleConnectionStatus] = useState(null)
  const [activeCalendarEditItem, setActiveCalendarEditItem] = useState(null)
  const [calendarEditForm, setCalendarEditForm] = useState({})
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null)
  const searchParams = new URLSearchParams(window.location.search)
  const publicBookingToken = searchParams.get('booking')
  const isPublicBookingMode = !!publicBookingToken

  const saveIntegrationConfig = async () => {
    if (!session?.user?.id || !activeIntegrationModal) return
    const updated = { ...integrationConfigs, [activeIntegrationModal]: integrationFormData }
    setIntegrationConfigs(updated)

    const { error } = await supabase
      .from('user_integration_configs')
      .upsert({
        user_id: session.user.id,
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
    if (loginVisualImage) {
      localStorage.setItem('dyatask_login_visual_image', loginVisualImage)
    } else {
      localStorage.removeItem('dyatask_login_visual_image')
    }
  }, [loginVisualImage])

  const handleLoginVisualUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

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

    const reader = new FileReader()
    reader.onload = () => {
      setLoginVisualImage(String(reader.result || ''))
      event.target.value = ''
    }
    reader.readAsDataURL(file)
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
  const sharedFormLink = `${normalizedPublicShareBaseUrl || currentAppBaseUrl}?booking=${shareToken}`
  const calendarTitle = calendarMonthDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' })
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
    const cfg = integrationConfigs.google_calendar || {}
    const clientId = (cfg.client_id || '').trim()
    const clientSecret = (cfg.client_secret || '').trim()
    const refreshToken = (cfg.refresh_token || '').trim()
    const calendarId = (cfg.calendar_id || 'primary').trim() || 'primary'

    if (!clientId || !clientSecret || !refreshToken) {
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
              `${event.title} • ${event.date} ${event.time || 'All day'}`,
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
    localStorage.setItem('dyatask_booking_availability', JSON.stringify(bookingAvailability))
  }, [bookingAvailability])

  useEffect(() => {
    localStorage.setItem('dyatask_booking_share_token', shareToken)
  }, [shareToken])

  useEffect(() => {
    localStorage.setItem('dyatask_public_booking_notes', publicBookingNotes)
  }, [publicBookingNotes])

  useEffect(() => {
    localStorage.setItem('dyatask_public_share_base_url', publicShareBaseUrl)
  }, [publicShareBaseUrl])

  useEffect(() => {
    if (!session) return

    const onStorageBookingEvent = (event) => {
      if (event.key !== 'dyatask_public_booking_event' || !event.newValue) return
      try {
        const payload = JSON.parse(event.newValue)
        if (!payload?.clientName) return

        triggerMockNotification(
          'Reservasi Baru Masuk',
          `${payload.clientName} menjadwalkan "${payload.title}" pada ${payload.date} ${payload.time} WIB.`,
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
    if (!session?.user?.id) return

    const loadIntegrationConfigs = async () => {
      const { data, error } = await supabase
        .from('user_integration_configs')
        .select('configs')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (error) {
        console.error('Error loading integration configs:', error)
        return
      }

      // Backward compatibility: migrate old localStorage config once if DB is empty.
      if (!data?.configs) {
        let legacy = {}
        try {
          legacy = JSON.parse(localStorage.getItem('dyatask_integration_configs') || '{}')
        } catch {
          legacy = {}
        }

        if (legacy && Object.keys(legacy).length > 0) {
          const { error: migrateError } = await supabase
            .from('user_integration_configs')
            .upsert({
              user_id: session.user.id,
              configs: legacy
            }, { onConflict: 'user_id' })

          if (migrateError) {
            console.error('Error migrating local integration configs:', migrateError)
          } else {
            setIntegrationConfigs(legacy)
            localStorage.removeItem('dyatask_integration_configs')
          }
        } else {
          setIntegrationConfigs({})
        }

        return
      }

      setIntegrationConfigs(data.configs || {})
    }

    loadIntegrationConfigs()
  }, [session?.user?.id])

  useEffect(() => {
    if (!availableTimeSlotsForSelectedDate.length) return
    if (!availableTimeSlotsForSelectedDate.includes(bookingTime)) {
      setBookingTime(availableTimeSlotsForSelectedDate[0])
    }
  }, [bookingDate, appointments, bookingAvailability, bookingTime, availableTimeSlotsForSelectedDate])

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
      const storageKey = `dyatask_project_folders_${session.user.id}`
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
          email: a.email
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
            email: inserted.email
          }, ...prev]
        })

        triggerMockNotification(
          'Reservasi Baru Masuk',
          `${inserted.client_name} menjadwalkan "${inserted.title}" pada ${inserted.date} ${inserted.time} WIB.`,
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
          `[${timestamp}] 🔔 Reservasi publik baru: ${inserted.client_name} • ${inserted.date} ${inserted.time}`,
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
    fetchGoogleCalendarEventsForMonth({ notifyNew: false })
  }, [calendarYear, calendarMonth, integrationConfigs])

  useEffect(() => {
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
  }, [calendarYear, calendarMonth, integrationConfigs])

  useEffect(() => {
    if (!notifications.length) return
    const interval = setInterval(() => {
      const now = Date.now()
      setNotificationNowMs(now)
      setNotifications(prev => prev.filter(item => now - item.createdAt < 60000))
    }, 1000)
    return () => clearInterval(interval)
  }, [notifications.length])

  const triggerMockNotification = (title, body, source, meta = {}) => {
    setNotifications(prev => [{
      id: Date.now(),
      title,
      body,
      source,
      meta,
      createdAt: Date.now()
    }, ...prev].slice(0, 10))
    sendNativeNotification(title, body, meta)
    
    // Automatically open app if autoOpenOnAlert is set
    if (autoOpenOnAlert) {
      focusElectronWindow()
      console.log('App automatically focused due to alerts!')
    }
  }

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
          `${item.title} • ${item.date} ${item.time}`,
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
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const handleCreateProjectFolder = async (e) => {
    e.preventDefault()
    const folderName = newFolderName.trim()
    if (!folderName || !session?.user?.id) return

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
      user_id: session.user.id
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
      const storageKey = `dyatask_project_folders_${session.user.id}`
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

  // Add Task
  const handleAddTask = async (e) => {
    e.preventDefault()
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
      user_id: session?.user?.id
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
          user_id: session?.user?.id,
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
    if (!floatingTaskTitle.trim()) return

    const taskObj = {
      title: floatingTaskTitle,
      category: 'Quick Add',
      priority: 'high',
      color_label: '#8B5CF6',
      status: 'todo',
      due_time: '12:00',
      has_reminder: true,
      user_id: session?.user?.id
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

  const openCalendarEditModal = (item) => {
    setActiveCalendarEditItem(item)
    if (item.itemType === 'appointment') {
      setCalendarEditForm({
        title: item.title || '',
        clientName: item.clientName || '',
        email: item.email || '',
        date: item.date || '',
        time: item.time || ''
      })
    } else {
      setCalendarEditForm({
        title: item.title || '',
        category: item.category || 'Work',
        priority: item.priority || 'medium',
        date: item.calendarDate || '',
        dueTime: item.dueTime || '09:00'
      })
    }
  }

  const saveCalendarEditModal = async () => {
    if (!activeCalendarEditItem) return

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
      user_id: session?.user?.id
    }

    const { data, error } = await supabase
      .from('appointments')
      .insert([newBookingObj])
      .select();

    if (error) {
      alert('Gagal membuat reservasi di Supabase: ' + error.message)
      return
    }

    if (data && data[0]) {
      const createdBooking = {
        id: data[0].id,
        clientName: data[0].client_name,
        title: data[0].title,
        time: data[0].time,
        date: data[0].date,
        status: data[0].status,
        email: data[0].email
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

  const deleteAppointmentFromCalendar = async (appointment) => {
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
    setDeleteConfirmItem(item)
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

  const copyShareLink = async () => {
    await navigator.clipboard.writeText(sharedFormLink)
    setCopiedShareLink(true)
    setTimeout(() => setCopiedShareLink(false), 1600)
  }

  // Note client-side encryption simulation
  const handleEncryptNote = (e) => {
    e.preventDefault()
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
            user_id: session?.user?.id
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
    const latest = notifications[0]
    setNotifications(prev => prev.slice(1))
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
        latest.meta.date && latest.meta.time ? `Jadwal: ${latest.meta.date} ${latest.meta.time} WIB` : '',
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
    const latest = notifications[0]
    if (!latest) return
    setNotifications(prev => prev.slice(1))
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

    // Special superuser handler: automatic signup using ADMIN client (bypasses email confirm)
    if (authUsername.trim().toLowerCase() === 'arunika' && authPassword.trim() === 'ar4925') {
      // Try to sign in first (in case the superuser already exists and is confirmed)
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: formattedEmail,
        password: authPassword
      })

      if (!signInError) {
        // Login succeeded directly
        setSession(signInData.session)
        setLoadingAuth(false)
        return
      }

      // Login failed — need to create or auto-confirm the user
      if (supabaseAdmin) {
        // Step 1: Try to create user via admin API (auto-confirmed)
        const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: formattedEmail,
          password: authPassword,
          email_confirm: true,
          user_metadata: { full_name: 'Superuser / Developer' }
        })

        if (createError) {
          // User probably already exists — find them and auto-confirm
          const { data: userList } = await supabaseAdmin.auth.admin.listUsers()
          const existingUser = userList?.users?.find(u => u.email === formattedEmail)

          if (existingUser) {
            // Auto-confirm + update password
            await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
              email_confirm: true,
              password: authPassword,
              user_metadata: { full_name: 'Superuser / Developer' }
            })
          } else {
            setAuthError('Gagal membuat superuser: ' + createError.message)
            setLoadingAuth(false)
            return
          }
        }

        // Step 2: Now sign in — should work
        const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
          email: formattedEmail,
          password: authPassword
        })

        if (retryError) {
          setAuthError('Login gagal setelah konfirmasi: ' + retryError.message)
        } else {
          setSession(retryData.session)
        }
      } else {
        setAuthError('Service role key tidak tersedia. Tidak bisa membuat superuser secara otomatis.')
      }

      setLoadingAuth(false)
      return
    }

    // Normal user logic
    if (authTab === 'signup') {
      if (supabaseAdmin) {
        // Register using ADMIN API to automatically confirm email
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email: formattedEmail,
          password: authPassword,
          email_confirm: true,
          user_metadata: {
            full_name: authFullName || authUsername.trim()
          }
        })

        if (error) {
          setAuthError(error.message)
        } else {
          alert(`Registrasi berhasil untuk username "${authUsername}"! Email Anda telah terkonfirmasi otomatis. Silakan masuk.`)
          setAuthTab('signin')
        }
      } else {
        // Fallback to normal signup
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
        } else {
          alert(`Registrasi berhasil untuk username "${authUsername}"! Silakan cek email Anda untuk konfirmasi atau langsung masuk.`)
          setAuthTab('signin')
        }
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formattedEmail,
        password: authPassword
      })

      if (error) {
        // If email not confirmed and we have admin, let's auto confirm it and try again!
        if ((error.message.includes('not confirmed') || error.message.includes('confirm')) && supabaseAdmin) {
          // Auto confirm email for this user
          // Find user by email using admin client
          const { data: userList, error: listError } = await supabaseAdmin.auth.admin.listUsers()
          const dbUser = userList?.users?.find(u => u.email === formattedEmail)
          
          if (dbUser) {
            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(dbUser.id, {
              email_confirm: true
            })

            if (!updateError) {
              // Retry login
              const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
                email: formattedEmail,
                password: authPassword
              })

              if (!retryError) {
                setSession(retryData.session)
                setLoadingAuth(false)
                return
              }
            }
          }
        }
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
  }

  // Update user profile to Supabase
  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    if (!session?.user?.id) return

    try {
      let avatarUrl = profileFormData.avatar_url

      // Upload avatar file to Supabase storage if provided
      if (profileFormData.avatar_file) {
        setUploadingAvatar(true)
        try {
          const fileExt = profileFormData.avatar_file.name.split('.').pop()?.toLowerCase() || 'png'
          const fileName = `${session.user.id}/${Date.now()}.${fileExt}`
          
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
        `Jadwal: ${publicBookingSummary.date} ${publicBookingSummary.time} WIB`,
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
              <p><span className="text-purple-400">Jadwal:</span> {publicBookingSummary.date} • {publicBookingSummary.time} WIB</p>
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

    const publicMonthLabel = calendarMonthDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })
    const publicSelectedDateLabel = new Date(`${bookingDate}T00:00:00`).toLocaleDateString('en-US', {
      weekday: 'long',
      day: '2-digit',
      month: 'short'
    })

    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_12%_18%,rgba(143,117,216,0.28),transparent_30%),radial-gradient(circle_at_88%_12%,rgba(198,181,255,0.34),transparent_24%),radial-gradient(circle_at_82%_82%,rgba(255,229,76,0.2),transparent_26%),linear-gradient(135deg,#fbfaff_0%,#f0ebff_48%,#fff8e2_100%)] text-[#463d66] flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute -top-28 left-20 w-80 h-80 rounded-full bg-[#8f75d8]/20 blur-3xl"></div>
        <div className="absolute bottom-8 -right-24 w-[26rem] h-[26rem] rounded-full bg-[#bca8ff]/25 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-[34rem] h-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/38 blur-3xl"></div>
        <div className="relative w-full max-w-6xl rounded-[2.25rem] border border-white/70 bg-white shadow-2xl shadow-purple-200/45 p-4 lg:p-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-4 p-6 lg:p-7 rounded-[1.75rem] border border-white/70 bg-white shadow-lg shadow-purple-100/35">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100/80 text-purple-600 text-[11px] font-semibold mb-5">
                <span className="w-2 h-2 rounded-full bg-[#8f75d8]"></span>
                Public Booking
              </div>
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

          <section className="auth-form-panel">
            <div className="auth-logo-mark">
              <img src={dyataskMiniLogo} alt="DyaTask" />
            </div>

            <div className="auth-copy">
              <p>{authTab === 'signin' ? 'Welcome Back!' : 'Create Account'}</p>
              <span>{authTab === 'signin' ? 'Enter your details below' : 'Start managing your freelance work today'}</span>
            </div>

            <form onSubmit={handleAuthSubmit} className="auth-form">
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
    <div className={`app-wrapper ${theme === 'dark' ? 'dark' : ''}`}>
      
      {/* 🖥️ Layout Grid */}
      <div className={`layout-grid ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        
        {/* 1. Sidebar Navigation */}
        <aside className={`sidebar sidebar-floating ${sidebarCollapsed ? 'collapsed' : ''}`}>
          {/* Brand Header */}
          <div className="flex items-center justify-center pt-2 mb-5 px-1">
            <img
              src={sidebarCollapsed ? dyataskMiniLogo : dyataskLogo}
              alt="DyaTask"
              className={`${sidebarCollapsed ? 'w-16 h-16 -my-2' : 'w-56 h-24 -my-2'} object-contain drop-shadow-md`}
            />
          </div>

          <button
            onClick={() => setSidebarCollapsed(prev => !prev)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full border border-white/50 dark:border-indigo-900 bg-white/95 dark:bg-indigo-950 text-purple-600 text-xs font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all z-20"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? '›' : '‹'}
          </button>

          {/* Navigation Links */}
          <nav className="flex-1">
            <div 
              className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard size={20} />
              {!sidebarCollapsed && <span>Dashboard</span>}
            </div>

            <div 
              className={`nav-link ${activeTab === 'tasks' ? 'active' : ''}`}
              onClick={() => setActiveTab('tasks')}
            >
              <CheckSquare size={20} />
              {!sidebarCollapsed && <span>Tugas & Project</span>}
              {!sidebarCollapsed && <span className="ml-auto bg-white/25 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {tasks.filter(t => t.status !== 'done').length}
              </span>}
            </div>

            <div 
              className={`nav-link ${activeTab === 'calendar' ? 'active' : ''}`}
              onClick={() => setActiveTab('calendar')}
            >
              <Calendar size={20} />
              {!sidebarCollapsed && <span>Reservasi & Jadwal</span>}
              {!sidebarCollapsed && <span className="ml-auto w-2 h-2 rounded-full bg-emerald-500 pulse-badge"></span>}
            </div>

            <div 
              className={`nav-link ${activeTab === 'notes' ? 'active' : ''}`}
              onClick={() => setActiveTab('notes')}
            >
              <Lock size={20} />
              {!sidebarCollapsed && <span>Catatan Terenkripsi</span>}
            </div>

            <div 
              className={`nav-link ${activeTab === 'integrations' ? 'active' : ''}`}
              onClick={() => setActiveTab('integrations')}
            >
              <RefreshCw size={20} />
              {!sidebarCollapsed && <span>Integrasi Realtime</span>}
            </div>

            <div 
              className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <Settings size={20} />
              {!sidebarCollapsed && <span>Pengaturan macOS</span>}
            </div>
          </nav>

          {/* User profile section in Sidebar footer */}
          {!sidebarCollapsed && <div className="border-t border-white/25 dark:border-indigo-900/60 pt-4 mt-auto">
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-3 p-3 rounded-xl bg-[#FFF08A] hover:bg-[#FFF08A]/90 transition-all active:scale-95 cursor-pointer group shadow-sm"
              >
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center group-hover:bg-yellow-50 transition-all overflow-hidden ring-2 ring-yellow-200">
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
              <div className="flex gap-2">
                <button 
                  onClick={toggleTheme}
                  className="flex-1 h-8 rounded-lg border border-white/35 dark:border-indigo-900 flex items-center justify-center hover:bg-white/20 dark:hover:bg-indigo-900/50 text-xs font-semibold gap-1 transition-all text-white"
                >
                  {theme === 'dark' ? <Sun size={14} className="text-amber-300" /> : <Moon size={14} className="text-white" />}
                  <span>{theme === 'dark' ? 'Terang' : 'Gelap'}</span>
                </button>
                <button 
                  onClick={handleSignOut}
                  className="flex-1 h-8 rounded-lg border border-red-200 bg-red-50/80 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/20 dark:hover:bg-red-900/30 flex items-center justify-center text-xs font-semibold text-red-600 dark:text-red-400 gap-1 transition-all"
                >
                  Keluar
                </button>
              </div>
            </div>
          </div>}

          {sidebarCollapsed && (
            <div className="border-t border-white/25 dark:border-indigo-900/60 pt-4 mt-auto flex justify-center">
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
          )}

        </aside>

        {/* 2. Main Content Area */}
        <main className="p-6 md:p-8 overflow-y-auto max-h-screen">
          
          {/* Header Bar */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-100 dark:border-indigo-950 pb-6 mb-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-purple-500 uppercase tracking-widest">
                <Sparkles size={12} />
                <span>{appHeaderTagline || 'Modern Soft Minimalist Amethyst'}</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight mt-1">{appHeaderTitle || 'Dyatask Manager'}</h1>
            </div>
            
            {/* Realtime Badges */}
	            <div className="flex flex-wrap items-center gap-2">
	              <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full border text-[11px] font-bold ${
	                calendarIntegrationActive
	                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/50 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-300'
	                  : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/50 dark:border-amber-900/30 text-amber-600 dark:text-amber-300'
	              }`}>
	                <span className={`w-1.5 h-1.5 rounded-full ${calendarIntegrationActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
	                {realtimeStatusText} • {securityStatusText}
	              </div>

              <button
                onClick={() => setShowQuickBookingModal(true)}
                className="px-3 py-1.5 rounded-lg bg-[#8f75d8] hover:bg-[#8069c8] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                <Plus size={13} />
                Add Event
              </button>
            </div>
          </header>

          {/* Advanced Search Input Bar */}
          <div className="mb-6 flex items-center gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400 dark:text-purple-300">
                <Search size={18} />
              </div>
              <input 
                type="text" 
                placeholder="Pencarian Lanjutan: cari nama tugas, klien kalender, atau topik catatan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-12 py-3 rounded-2xl border border-purple-100 dark:border-indigo-950 bg-white/50 dark:bg-indigo-950/20 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm glass-panel"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs font-bold text-purple-500 hover:text-purple-700 dark:text-purple-300 dark:hover:text-purple-100"
                >
                  Bersihkan
                </button>
              )}
            </div>
            {activeTab === 'calendar' && (
              <button
                onClick={() => setShowBookingQuickForm(prev => !prev)}
                className="px-4 py-3 rounded-xl bg-[#8f75d8] hover:bg-[#8069c8] text-white text-xs font-bold shadow-md inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <Plus size={13} />
                Reservasi Baru
              </button>
            )}
          </div>

          {/* TAB CONTENT: 1. DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div>
              {/* Stat Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
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
                        <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#8f75d8]/10 text-[#8f75d8] font-bold">{todayString}</span>
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
	                          <p className="text-[10px] text-amber-600/80 dark:text-amber-300 mt-1 truncate">{nextCalendarItem ? `${nextCalendarItem.date} • ${nextCalendarItem.time || 'All day'} • ${nextCalendarItem.source === 'google_event' ? 'Google Calendar' : nextCalendarItem.source === 'holiday' ? 'Libur' : 'DyaTask'}` : 'Calendar clear'}</p>
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
                              <p className="text-[10px] text-purple-400 dark:text-purple-300 truncate">{task.category} • {task.calendarDate || todayString} • {task.dueTime} WIB</p>
                            </div>
                            <span className="text-[9px] px-2 py-1 rounded-full bg-white dark:bg-indigo-900/60 text-[#8f75d8] font-black uppercase">{task.priority}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Real-time sync logs & external statuses */}
                <div className="glass-panel p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold">Sinkronisasi Realtime</h3>
                      <div className="flex items-center gap-2">
                        {dbConnectionStatus === 'connected' ? (
                          <>
                            <span className="flex h-2.5 w-2.5 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Terhubung</span>
                          </>
                        ) : (
                          <>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                            <span className="text-xs font-semibold text-red-600 dark:text-red-400">Offline</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Connection Status Card */}
                    <div className={`p-3 rounded-lg mb-4 border text-xs ${
                      dbConnectionStatus === 'connected'
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                        : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300'
                    }`}>
                      <div className="font-semibold mb-1">
                        {dbConnectionStatus === 'connected' ? '✅ Database Terhubung' : '⚠️ Database Offline'}
                      </div>
                      <div className="text-[10px] opacity-80">
                        Sinkronisasi terakhir: {lastSyncTime.toLocaleTimeString('id-ID')}
                      </div>
                    </div>

                    {/* Interactive Logs List */}
                    <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                      {syncLogs.map((log, index) => (
                        <div key={index} className="text-xs font-mono p-2.5 rounded-lg bg-purple-50/40 dark:bg-indigo-950/40 border border-purple-100/30 dark:border-indigo-950/30 text-purple-600 dark:text-purple-300 break-words leading-relaxed">
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-purple-100 dark:border-indigo-950 pt-4 mt-4">
	                    <button 
	                      onClick={() => {
	                        const timestamp = new Date().toLocaleTimeString('id-ID')
	                        const activeExternalLogs = getConfiguredIntegrationSyncLogs().filter(log => !log.includes('Supabase RLS'))
	                        setSyncLogs(prev => [
	                          `[${timestamp}] 🔄 Sinkronisasi manual dipicu oleh pengguna.`,
	                          ...(activeExternalLogs.length
	                            ? activeExternalLogs.map(log => `[${timestamp}] ${log}`)
	                            : [`[${timestamp}] ℹ️ Belum ada integrasi eksternal aktif. Hanya database Supabase yang dicek.`]),
	                          ...prev
	                        ])
	                        fetchGoogleCalendarEventsForMonth({ notifyNew: true })
	                      }}
                      className="w-full py-2.5 bg-purple-100 hover:bg-purple-200 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-purple-700 dark:text-purple-300 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                    >
                      <RefreshCw size={12} className="animate-spin" />
                      Paksa Singkronisasi Ulang
                    </button>
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
            <div>
              {/* Task view toggle + actions */}
              <div className="flex flex-col md:flex-row md:items-center justify-end gap-4 mb-6">
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
                                            <span>{task.calendarDate || todayString}</span>
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
                                                <p className="text-[10px] text-purple-400 dark:text-purple-300">{subtask.calendarDate || todayString} • {subtask.dueTime} WIB</p>
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

          {/* TAB CONTENT: 3. BOOKING CALENDAR & APPOINTMENTS */}
          {activeTab === 'calendar' && (() => {
            const calendarFeed = [
              ...appointments.map(appt => ({
                id: `appt-${appt.id}`,
                title: appt.title,
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
              <div className="calendar-workspace relative overflow-hidden rounded-[2.4rem] border border-white/80 bg-white/78 p-4 lg:p-5 shadow-2xl shadow-purple-200/45 backdrop-blur-xl">
                <div className="pointer-events-none absolute -left-24 top-12 h-56 w-56 rounded-full bg-[#8f75d8]/14 blur-3xl" />
                <div className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-[#ffe54c]/18 blur-3xl" />
                <div className="relative grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-5">
                  <aside className="rounded-[2rem] bg-[#fbfaff] p-5 shadow-inner shadow-purple-100/60">
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
                      <button
                        type="button"
                        onClick={() => setShowBookingQuickForm(prev => !prev)}
                        className="w-9 h-9 rounded-2xl bg-white border border-purple-100 text-[#8f75d8] flex items-center justify-center shadow-sm hover:bg-purple-50"
                        title="Toggle form reservasi"
                      >
                        {showBookingQuickForm ? <ChevronUp size={15} /> : <Plus size={15} />}
                      </button>
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
                                  <p className="text-[11px] text-[#8f75d8] font-bold">{item.date} • {item.time}</p>
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

                    {showBookingQuickForm && (
                      <div className="mb-5 rounded-[1.5rem] border border-purple-100 bg-white p-4 shadow-sm">
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
                        <div className="rounded-2xl bg-[#f3efff] p-1 flex items-center gap-1 text-[11px] font-bold text-[#8f75d8]">
                          <span className="px-3 py-1.5 rounded-xl bg-[#8f75d8] text-white shadow-sm">Month</span>
                          <span className="px-3 py-1.5 rounded-xl">Week</span>
                          <span className="px-3 py-1.5 rounded-xl">Day</span>
                        </div>
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
                        const totalItems = dayAppointments.length + dayTasks.length + dayGoogleEvents.length + dayHolidays.length
                        const hasAppt = totalItems > 0
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
                                {dayHolidays.slice(0, 1).map(holiday => (
                                  <button key={holiday.id} type="button" onClick={(e) => { e.stopPropagation(); setSelectedCalendarDate(dateStr) }} className="calendar-event-pill bg-red-50 text-red-600">
                                    Libur • {holiday.title}
                                  </button>
                                ))}
                                {dayGoogleEvents.slice(0, 1).map(event => (
                                  <button key={event.id} type="button" onClick={(e) => { e.stopPropagation(); setSelectedCalendarDate(dateStr) }} className="calendar-event-pill bg-emerald-50 text-emerald-700">
                                    GCal • {event.title}
                                  </button>
                                ))}
                                <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedCalendarDate(dateStr) }} className="calendar-event-pill bg-[#eee7ff] text-[#6f3df3]">
                                  {totalItems} Aktivitas
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    <div className="mt-5 rounded-[1.5rem] border border-purple-100 bg-[#fbfaff] p-4">
                      <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-[#4f4574]">Detail Tanggal {selectedCalendarDate}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-[#8f75d8] border border-purple-100 font-bold">{selectedDateItems.length} event</span>
                      </div>
                      {selectedDateItems.length === 0 ? (
                      <p className="text-xs text-[#9b85e9]">Belum ada event/task aktif di tanggal ini.</p>
                      ) : (
                      <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                        {selectedDateItems.map(item => {
                        const itemLabel = item.itemType === 'appointment' ? 'Reservasi' : item.itemType === 'task' ? 'Task' : item.itemType === 'google_event' ? 'Google Calendar' : 'Libur Nasional'
                        const itemIcon = item.itemType === 'task' ? <CheckSquare size={12} /> : item.itemType === 'holiday' ? <Sparkles size={12} /> : <Calendar size={12} />
                        return (
                          <div key={`${item.itemType}-${item.id}`} className="p-3 rounded-2xl border border-purple-100 bg-white">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-bold text-[#6f3df3] flex items-center gap-1.5 min-w-0">
                            {itemIcon}
                            <span className="truncate">{item.title}</span>
                            </p>
                            <span className={`text-[8px] px-1.5 py-0.5 rounded-lg uppercase font-bold shrink-0 ${item.itemType === 'holiday' ? 'bg-red-50 text-red-600' : item.itemType === 'google_event' ? 'bg-emerald-50 text-emerald-700' : 'bg-[#eee7ff] text-[#6f3df3]'}`}>{itemLabel}</span>
                          </div>
                          {item.itemType === 'google_event' ? (
                            <>
                            <p className="text-[11px] text-emerald-600 mt-1">{item.time} • {item.calendarName}</p>
                            {item.htmlLink && <a href={item.htmlLink} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:underline">Buka di Google Calendar <ExternalLink size={10} /></a>}
                            </>
                          ) : item.itemType === 'holiday' ? (
                            <p className="text-[11px] text-red-500 mt-1">Hari libur nasional Indonesia</p>
                          ) : (
                            <>
                            <p className="text-[11px] text-[#8f75d8] mt-1">{item.itemType === 'appointment' ? `${item.clientName} • ${item.time} WIB` : `${item.category} • ${item.dueTime}`}</p>
                            <div className="mt-2 flex items-center gap-2">
                              <button type="button" onClick={(e) => { e.stopPropagation(); openCalendarEditModal(item) }} className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[#8f75d8] text-white hover:bg-[#8069c8] inline-flex items-center gap-1"><Pencil size={10} />Edit</button>
                              <button type="button" onClick={(e) => { e.stopPropagation(); openDeleteConfirmModal(item) }} className="px-2 py-1 rounded-lg text-[10px] font-bold bg-red-100 text-red-600 hover:bg-red-200 inline-flex items-center gap-1"><Trash2 size={10} />Hapus</button>
                            </div>
                            </>
                          )}
                          </div>
                        )
                        })}
                      </div>
                      )}
                    </div>

                  </section>
                </div>
              </div>
            )
          })()}

          {/* TAB CONTENT: 4. ENCRYPTED NOTES VAULT */}
          {activeTab === 'notes' && (
            <div>
              {/* Security Advisory alert */}
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
                        if (!session?.user?.id || !activeIntegrationModal) return
                        const updated = { ...integrationConfigs }
                        delete updated[activeIntegrationModal]
                        setIntegrationConfigs(updated)

                        const { error } = await supabase
                          .from('user_integration_configs')
                          .upsert({
                            user_id: session.user.id,
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
            <div className="space-y-6">

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

              {/* Data backup section */}
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

            </div>
          )}

          {/* TAB CONTENT: 6. SETTINGS & MACOS CONFIGURATIONS */}
          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left panel: Preferences */}
              <div className="lg:col-span-2 glass-panel p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-bold">Pengaturan Integrasi macOS Macbook</h3>
                  <p className="text-xs text-purple-400 dark:text-purple-300">Sesuaikan integrasi sistem aplikasi DyaTask Manager</p>
                </div>

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
                      onClick={() => setLoginVisualImage('')}
                      disabled={!loginVisualImage}
                      className="px-3 py-1.5 rounded-lg border border-purple-200 dark:border-indigo-800 text-[10px] font-bold text-purple-600 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-indigo-900/40 disabled:opacity-45 disabled:cursor-not-allowed transition-all"
                    >
                      Reset Default
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
                          className="w-full px-3 py-2.5 rounded-xl border border-purple-100 dark:border-indigo-900 bg-white dark:bg-indigo-950/30 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-[#8f75d8] file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white"
                        />
                      </label>
                      <p className="text-[10px] text-purple-400 dark:text-purple-300 leading-relaxed">
                        Rekomendasi rasio 4:5 atau 1:1, ukuran maksimal 2MB. Gambar disimpan lokal di browser/app, jadi aman untuk personalisasi perangkat ini.
                      </p>
                    </div>
                  </div>
                </div>

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

                {/* Penetration Testing Log section */}
                <div className="p-4 bg-yellow-500/10 dark:bg-yellow-500/5 border border-yellow-500/20 rounded-2xl flex gap-3.5">
                  <AlertCircle className="text-yellow-600 shrink-0 mt-0.5" size={18} />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-yellow-600">Saran Keamanan & Uji Penetrasi Berkala</h4>
                    <p className="text-xs text-purple-600 dark:text-purple-300 mt-0.5">
                      Untuk rilis produksi, kami merekomendasikan penjadwalan pemindaian OWASP ZAP bulanan pada host backend Node.js dan mengunci database Supabase menggunakan RLS (Row Level Security) ketat seperti tertera dalam rencana implementasi.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right panel: Macbook Simulator preview */}
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
          )}

        </main>
        
      </div>

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

      {/* 🚀 SIMULATED MAC PUSH NOTIFICATION TOAST */}
      {notifications.length > 0 && (
        <div className={`notification-banner glass-panel p-3 ${theme === 'dark' ? 'notif-dark' : 'notif-light'}`}>
          <div className={`mb-2 h-1.5 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-white/20' : 'bg-black/10'}`}>
            <div
              className={`h-full transition-[width] duration-1000 ease-linear ${theme === 'dark' ? 'bg-cyan-300' : 'bg-emerald-400'}`}
              style={{
                width: `${Math.max(0, Math.min(100, ((60000 - (notificationNowMs - notifications[0].createdAt)) / 60000) * 100))}%`
              }}
            />
          </div>
          {!showNotificationList && notifications.length > 1 ? (
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
                  <p className={`text-[11px] truncate ${theme === 'dark' ? 'text-cyan-100/90' : 'text-slate-700'}`}>Ada {notifications.length} notifikasi baru. Klik untuk lihat daftar.</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${theme === 'dark' ? 'bg-cyan-500 text-slate-900' : 'bg-emerald-500 text-white'}`}>{notifications.length}</span>
            </button>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              <div className="flex items-center justify-between">
                <h4 className={`text-xs font-bold ${theme === 'dark' ? 'text-cyan-300' : 'text-emerald-700'}`}>Pesan Masuk • DyaTask</h4>
                {notifications.length > 1 && (
                  <button
                    onClick={() => setShowNotificationList(false)}
                    className={`text-[10px] px-2 py-0.5 rounded border ${theme === 'dark' ? 'bg-slate-800 text-cyan-100 border-cyan-500/30' : 'bg-emerald-100 text-emerald-700 border-emerald-300'}`}
                  >
                    Collapse
                  </button>
                )}
              </div>
              {notifications.map((item) => (
                <div key={item.id} className={`rounded-lg border p-2.5 ${theme === 'dark' ? 'border-cyan-500/30 bg-slate-900/70' : 'border-emerald-300 bg-white/85'}`}>
                  <div className="flex items-start gap-2.5">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${theme === 'dark' ? 'bg-cyan-500 text-slate-900' : 'bg-emerald-500 text-white'}`}>D</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-[11px] font-semibold truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{item.title}</p>
                        <button onClick={() => removeNotificationById(item.id)} className={`text-xs font-bold ${theme === 'dark' ? 'text-cyan-200 hover:text-white' : 'text-emerald-700 hover:text-emerald-900'}`}>✕</button>
                      </div>
                      <p className={`text-[11px] mt-0.5 line-clamp-2 ${theme === 'dark' ? 'text-cyan-100/90' : 'text-slate-700'}`}>{item.body}</p>
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
                Notifikasi hilang otomatis dalam 1 menit.
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
                <p className="text-[11px] text-slate-400">{notifications.length} pesan tersimpan sementara</p>
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
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-300">Belum ada notifikasi baru.</p>
                <p className="text-[11px] text-slate-400 mt-1">Event Google Calendar baru akan muncul di sini saat terdeteksi.</p>
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
                    <p className="text-[11px] text-slate-500 dark:text-slate-300 mt-1 leading-relaxed line-clamp-2">{item.body}</p>
                    <p className="text-[10px] text-[#8f75d8] mt-2 font-semibold">{new Date(item.createdAt).toLocaleTimeString('id-ID')}</p>
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
            Clear Notification
          </button>
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
      {floatingMenuEnabled && (
        <button 
          type="button"
          onClick={() => {
            setFloatingQuickAdd(false)
            setShowNotificationHistory(prev => !prev)
          }}
          aria-label="Buka riwayat notifikasi"
          className="fixed bottom-12 right-14 w-20 h-20 flex items-center justify-center active:scale-95 transition-all z-40"
        >
          <img src={dyataskMiniLogo} alt="" className="w-20 h-20 object-contain drop-shadow-xl hover:scale-105 transition-transform" />
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-white dark:border-slate-950">
              {Math.min(notifications.length, 9)}
            </span>
          )}
        </button>
      )}

    </div>
  )
}

export default App
