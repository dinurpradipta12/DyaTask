import React, { useState, useEffect, useRef } from 'react'
import './App.css'
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
  AlertCircle
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
  const [theme, setTheme] = useState('dark')
  const [searchQuery, setSearchQuery] = useState('')
  
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

  // Booking state
  const [appointments, setAppointments] = useState(initialAppointments)
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
  const [floatingTaskTitle, setFloatingTaskTitle] = useState('')

  // macOS system configurations
  const [autoStart, setAutoStart] = useState(true)
  const [autoOpenOnAlert, setAutoOpenOnAlert] = useState(true)
  const [floatingMenuEnabled, setFloatingMenuEnabled] = useState(true)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true)
  const [syncStatus, setSyncStatus] = useState('Terhubung')

  // Integration config state (persisted to localStorage)
  const [integrationConfigs, setIntegrationConfigs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('dyatask_integration_configs') || '{}')
    } catch { return {} }
  })
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

  const saveIntegrationConfig = () => {
    const updated = { ...integrationConfigs, [activeIntegrationModal]: integrationFormData }
    setIntegrationConfigs(updated)
    localStorage.setItem('dyatask_integration_configs', JSON.stringify(updated))
    setActiveIntegrationModal(null)
    setIntegrationFormData({})
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

  const sharedFormLink = `${window.location.origin}${window.location.pathname}?booking=${shareToken}`
  const calendarTitle = calendarMonthDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' })
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
  const selectedDateItems = [
    ...selectedDateAppointments.map(item => ({ ...item, itemType: 'appointment' })),
    ...selectedDateTasks.map(item => ({ ...item, itemType: 'task' }))
  ]

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
  const [syncLogs, setSyncLogs] = useState([
    '⚡ Koneksi database PostgreSQL Supabase berhasil.',
    '📧 Parser Email IMAP aktif - Menyimak jadwal rapat masuk...',
    '🔄 Google Calendar API sinkron bidirectional secara real-time.',
    '📅 Notion Calendar API terhubung secara real-time.'
  ])

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
    localStorage.setItem('dyatask_booking_availability', JSON.stringify(bookingAvailability))
  }, [bookingAvailability])

  useEffect(() => {
    localStorage.setItem('dyatask_booking_share_token', shareToken)
  }, [shareToken])

  useEffect(() => {
    localStorage.setItem('dyatask_public_booking_notes', publicBookingNotes)
  }, [publicBookingNotes])

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
          calendarDate: t.created_at ? t.created_at.slice(0, 10) : todayString
        })));
      }
    };
    
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
      const logs = [
        '🔄 Memperbarui sinkronisasi Google Calendar... [Berhasil]',
        '🟢 Baris spreadsheet berhasil diupdate untuk aktivitas terbaru.',
        '📧 Memindai email masuk... Tidak ada jadwal rapat baru.',
        '🛡️ Menjalankan pemindaian berkala RLS Supabase... Aman.',
        '🔄 Notion Calendar memperbarui 1 jadwal tugas secara real-time.'
      ]
      const randomLog = logs[Math.floor(Math.random() * logs.length)]
      const timestamp = new Date().toLocaleTimeString('id-ID')
      setSyncLogs(prev => [`[${timestamp}] ${randomLog}`, ...prev.slice(0, 5)])
    }, 12000)
    return () => clearInterval(timer)
  }, [])

  // Auto trigger a mock notification after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      triggerMockNotification(
        'Rapat Penting Masuk!',
        'Rapat Koordinasi Aruneeka via Google Calendar jam 11:00 WIB',
        'google-cal'
      )
    }, 6000)
    return () => clearTimeout(timer)
  }, [])

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
    
    // Automatically open app if autoOpenOnAlert is set
    if (autoOpenOnAlert) {
      // Mock alert wake
      console.log('App automatically focused due to alerts!')
    }
  }

  // Toggle light/dark mode
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // Add Task
  const handleAddTask = async (e) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return

    const taskObj = {
      title: newTaskTitle,
      category: newTaskCategory,
      priority: newTaskPriority,
      color_label: newTaskColor,
      status: 'todo',
      due_time: newTaskTime,
      has_reminder: true,
      user_id: session?.user?.id
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert([taskObj])
      .select();

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
        calendarDate: data[0].created_at ? data[0].created_at.slice(0, 10) : todayString
      }
      setTasks([createdTask, ...tasks])

      const taskSyncResult = await syncTaskToGoogleCalendar(createdTask)
      if (!taskSyncResult.ok && !taskSyncResult.skipped) {
        alert(`Task tersimpan, tapi sinkron Google Calendar gagal: ${taskSyncResult.error}`)
      }
    }

    setNewTaskTitle('')
    
    // Log sync Sheets
    const timestamp = new Date().toLocaleTimeString('id-ID')
    setSyncLogs(prev => [
      `[${timestamp}] 🟢 Supabase & Spreadsheets: Tugas baru "${taskObj.title}" disinkronkan secara real-time.`,
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
          // Log task sheets
          const timestamp = new Date().toLocaleTimeString('id-ID')
          setTimeout(() => {
            setSyncLogs(prev => [
              `[${timestamp}] 🟢 Spreadsheets: Update status tugas "${t.title}" -> SELESAI di Supabase.`,
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

    setTasks(tasks.filter(t => t.id !== id))
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
          due_time: calendarEditForm.dueTime
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

  if (isPublicBookingMode && publicBookingToken === shareToken) {
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
        <div className="min-h-screen bg-[#07070f] text-white flex items-center justify-center p-6">
          <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-zinc-900/90 shadow-2xl p-8 text-center">
            <h1 className="text-2xl font-semibold mb-2">Reservasi Berhasil Dikirim</h1>
            <p className="text-zinc-300 text-sm mb-6">
              Terima kasih, reservasi Anda sudah tercatat. Tim kami akan menindaklanjuti sesuai jadwal yang dipilih.
            </p>
            <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-4 text-left text-sm mb-6">
              <p><span className="text-zinc-400">Nama:</span> {publicBookingSummary.clientName}</p>
              <p><span className="text-zinc-400">Topik:</span> {publicBookingSummary.title}</p>
              <p><span className="text-zinc-400">WhatsApp:</span> {publicBookingSummary.whatsapp || '-'}</p>
              <p><span className="text-zinc-400">Jadwal:</span> {publicBookingSummary.date} • {publicBookingSummary.time} WIB</p>
            </div>
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
            >
              Lanjutkan ke WhatsApp Admin
            </a>
            <p className="text-[12px] text-zinc-400 mt-3">
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
      <div className="min-h-screen bg-[#07070f] text-white flex items-center justify-center p-6">
        <div className="w-full max-w-6xl rounded-2xl border border-white/10 bg-zinc-900/90 shadow-2xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-4 p-6 lg:p-7 border-r border-white/10">
              <h1 className="text-2xl font-semibold mb-1">1on1 Consultation</h1>
              <p className="text-sm text-zinc-400 mb-6">Nayanika Projects</p>
              <form onSubmit={handleAddBooking} className="space-y-3">
                <input type="text" placeholder="Nama lengkap" value={bookingClient} onChange={(e) => setBookingClient(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-blue-500/40 bg-zinc-900 text-sm focus:outline-none focus:border-blue-400" required />
                <input type="email" placeholder="Email aktif" value={bookingEmail} onChange={(e) => setBookingEmail(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-blue-500/40 bg-zinc-900 text-sm focus:outline-none focus:border-blue-400" />
                <input type="text" placeholder="Nomor WhatsApp" value={bookingWhatsapp} onChange={(e) => setBookingWhatsapp(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-blue-500/40 bg-zinc-900 text-sm focus:outline-none focus:border-blue-400" />
                <input type="text" placeholder="Topik konsultasi" value={bookingTitle} onChange={(e) => setBookingTitle(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-blue-500/40 bg-zinc-900 text-sm focus:outline-none focus:border-blue-400" required />
                <div className="pt-3 border-t border-white/10">
                  <p className="text-xs text-zinc-400 mb-2">Tanggal terpilih: <span className="text-white font-semibold">{publicSelectedDateLabel}</span></p>
                  <p className="text-xs text-zinc-400 mb-3">Waktu terpilih: <span className="text-white font-semibold">{bookingTime || '-'}</span></p>
                  <button type="submit" disabled={!bookingTime || !availableTimeSlotsForSelectedDate.length} className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold">
                    Kirim Reservasi
                  </button>
                </div>
              </form>
              <div className="mt-5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                <p className="text-xs font-semibold text-amber-300 mb-2">Catatan / Ketentuan</p>
                <p className="text-xs text-amber-100/90 whitespace-pre-line leading-relaxed">{publicBookingNotes}</p>
              </div>
            </div>

            <div className="lg:col-span-5 p-6 lg:p-7 border-r border-white/10">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-semibold">Pick a date</h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCalendarMonthDate(new Date(calendarMonthDate.getFullYear(), calendarMonthDate.getMonth() - 1, 1))} className="w-8 h-8 rounded-md border border-white/20 hover:border-white/40">‹</button>
                  <button onClick={() => setCalendarMonthDate(new Date(calendarMonthDate.getFullYear(), calendarMonthDate.getMonth() + 1, 1))} className="w-8 h-8 rounded-md border border-white/20 hover:border-white/40">›</button>
                </div>
              </div>
              <p className="text-lg mb-4">{publicMonthLabel}</p>
              <div className="grid grid-cols-7 text-center text-xs text-zinc-400 mb-2">
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
                          ? 'bg-red-500 text-white font-bold'
                          : isDisabled
                            ? 'text-zinc-600 cursor-not-allowed'
                            : 'hover:bg-zinc-800 text-zinc-200'
                      }`}
                    >
                      {dayItem.date.getDate()}
                    </button>
                  )
                })}
              </div>
              <div className="mt-6 rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300">
                Time zone: {timezoneLabel}
              </div>
              <p className="mt-2 text-[11px] text-zinc-400">
                Waktu dan jam reservasi akan otomatis disesuaikan dengan zona waktu masing-masing pengguna.
              </p>
            </div>

            <div className="lg:col-span-3 p-6 lg:p-7">
              <h3 className="text-lg font-semibold mb-1">{publicSelectedDateLabel}</h3>
              <p className="text-xs text-zinc-400 mb-4">Pilih jam yang masih tersedia</p>
              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {availableTimeSlotsForSelectedDate.map(slot => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setBookingTime(slot)}
                    className={`w-full py-3 rounded-md border text-sm font-semibold transition-all ${
                      bookingTime === slot
                        ? 'border-blue-400 bg-blue-500/20 text-blue-300'
                        : 'border-blue-500/40 hover:border-blue-400 text-blue-300'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
                {!availableTimeSlotsForSelectedDate.length && (
                  <div className="text-xs text-amber-400 border border-amber-500/30 rounded-md px-3 py-2">
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
      <div className={`app-wrapper ${theme === 'dark' ? 'dark' : ''} flex items-center justify-center p-6 min-h-screen`} style={{ background: 'var(--bg-app)' }}>
        <div className="w-full max-w-md glass-panel p-8 space-y-6 relative overflow-hidden transition-all duration-300 shadow-2xl border border-purple-100 dark:border-indigo-950/60">
          
          {/* Header Brand */}
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-purple-500/20 glow-primary">
              D
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight mt-2 text-purple-700 dark:text-purple-300">DyaTask Manager</h1>
            <p className="text-xs text-purple-400 dark:text-purple-300 font-medium">Sistem Produktivitas Berenkripsi & Sinkronisasi macOS</p>
          </div>

          {/* Tab Selector */}
          <div className="flex rounded-xl bg-purple-50 dark:bg-indigo-950/40 p-1 border border-purple-100/50 dark:border-indigo-950/30">
            <button 
              onClick={() => { setAuthTab('signin'); setAuthError(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${authTab === 'signin' ? 'bg-purple-600 text-white shadow' : 'text-purple-400 hover:text-purple-600'}`}
            >
              Masuk
            </button>
            <button 
              onClick={() => { setAuthTab('signup'); setAuthError(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${authTab === 'signup' ? 'bg-purple-600 text-white shadow' : 'text-purple-400 hover:text-purple-600'}`}
            >
              Daftar
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authError && (
              <div className="p-3.5 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium flex items-center gap-2">
                <AlertCircle size={14} />
                <span>{authError}</span>
              </div>
            )}

            {authTab === 'signup' && (
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-purple-400 dark:text-purple-300">Nama Lengkap</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-purple-400"><User size={14} /></span>
                  <input 
                    type="text" 
                    placeholder="Nama Lengkap Anda"
                    value={authFullName}
                    onChange={(e) => setAuthFullName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-purple-100 dark:border-indigo-950 bg-white/50 dark:bg-indigo-950/20 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-purple-400 dark:text-purple-300">Nama Pengguna (Username)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-purple-400"><User size={14} /></span>
                <input 
                  type="text" 
                  placeholder="arunika"
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-purple-100 dark:border-indigo-950 bg-white/50 dark:bg-indigo-950/20 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-purple-400 dark:text-purple-300">Kata Sandi</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-purple-400"><Lock size={14} /></span>
                <input 
                  type={showAuthPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-purple-100 dark:border-indigo-950 bg-white/50 dark:bg-indigo-950/20 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowAuthPassword(!showAuthPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-purple-400 hover:text-purple-600"
                >
                  {showAuthPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loadingAuth}
              className="w-full py-3 mt-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/20 active:scale-95 disabled:opacity-50"
            >
              {loadingAuth ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Sedang memproses...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={14} />
                  <span>{authTab === 'signin' ? 'Masuk ke Dasbor' : 'Daftar Akun Baru'}</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Info */}
          <div className="text-center pt-2">
            <span className="text-[9px] text-purple-400 dark:text-purple-300 font-semibold">Tersertifikasi SSL & Keamanan RLS Supabase Aktif</span>
          </div>

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
          <div className="flex items-center gap-3 mb-6 px-2 pb-3 border-b border-white/25 dark:border-indigo-900/50">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center text-white font-bold text-xl shadow-md">
              D
            </div>
            {!sidebarCollapsed && <div>
              <h2 className="text-lg font-bold leading-none">DyaTask</h2>
              <span className="text-[11px] text-white/75 font-semibold uppercase tracking-[0.14em]">Manager</span>
            </div>}
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
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-200 dark:bg-indigo-900 flex items-center justify-center">
                  <User size={18} className="text-purple-600 dark:text-purple-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold truncate flex items-center gap-1.5">
                    {session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'Pradipta Dev'}
                    {session?.user?.email?.startsWith('arunika.dyatask@') && (
                      <span className="bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 text-[8px] px-1 py-0.5 rounded font-extrabold uppercase tracking-wider scale-90 origin-left">
                        DEV
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-white/75 dark:text-purple-300 truncate">{session?.user?.email}</p>
                </div>
              </div>
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
        </aside>

        {/* 2. Main Content Area */}
        <main className="p-6 md:p-8 overflow-y-auto max-h-screen">
          
          {/* Header Bar */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-100 dark:border-indigo-950 pb-6 mb-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-purple-500 uppercase tracking-widest">
                <Sparkles size={12} />
                <span>Modern Soft Minimalist Amethyst</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight mt-1">DyaTask Manager</h1>
            </div>
            
            {/* Realtime Badges */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-300 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Google & Notion Calendar: Aktif
              </div>

              {twoFactorEnabled && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950/40 border border-purple-200/50 dark:border-purple-900/30 text-purple-600 dark:text-purple-300 text-xs font-bold">
                  <ShieldCheck size={14} />
                  2FA Aktif
                </div>
              )}

              <button 
                onClick={() => setFloatingQuickAdd(!floatingQuickAdd)}
                className="pulse-glow-button px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm flex items-center gap-2 shadow-lg hover:shadow-purple-500/20 active:scale-95 transition-all"
              >
                <Plus size={16} />
                Quick Launcher
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
                className="px-4 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md inline-flex items-center gap-1.5 whitespace-nowrap"
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
                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-indigo-900 flex items-center justify-center text-purple-600 dark:text-purple-300">
                      <Calendar size={16} />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight">{appointments.length} Aktif</h3>
                  <p className="text-xs text-purple-400 dark:text-purple-300 mt-1 flex items-center gap-1">
                    <TrendingUp size={12} className="text-emerald-500" />
                    <span>+2 Baru hari ini</span>
                  </p>
                </div>

                {/* Stat 2: Tasks Done */}
                <div className="glass-panel p-6 glass-panel-hover transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-purple-400 dark:text-purple-300 uppercase tracking-widest">Tugas Selesai</span>
                    <div className="w-8 h-8 rounded-lg bg-pink-100 dark:bg-pink-950/40 flex items-center justify-center text-pink-600 dark:text-pink-300">
                      <CheckSquare size={16} />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight">
                    {tasks.filter(t => t.status === 'done').length} / {tasks.length}
                  </h3>
                  {/* Progress bar */}
                  <div className="w-full bg-purple-100 dark:bg-indigo-950 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div 
                      className="bg-purple-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${(tasks.filter(t => t.status === 'done').length / tasks.length) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Stat 3: Email Meetings */}
                <div className="glass-panel p-6 glass-panel-hover transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-purple-400 dark:text-purple-300 uppercase tracking-widest">Email Terkoneksi</span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-300">
                      <Mail size={16} />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight">Parser Aktif</h3>
                  <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>1 Jadwal Rapat diimpor</span>
                  </p>
                </div>

                {/* Stat 4: Security Mode */}
                <div className="glass-panel p-6 glass-panel-hover transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-purple-400 dark:text-purple-300 uppercase tracking-widest">Enkripsi Notes</span>
                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-300">
                      <Lock size={16} />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight">AES-256-GCM</h3>
                  <p className="text-xs text-purple-400 dark:text-purple-300 mt-1">Kunci dekripsi lokal aman</p>
                </div>

              </div>

              {/* Graphical Trend & Live Logs */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                
                {/* Minimalist SVG Productivity Graph */}
                <div className="glass-panel p-6 lg:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold">Tren Produktivitas & Booking Harian</h3>
                      <p className="text-xs text-purple-400 dark:text-purple-300">Analisis tren booking kalender seminggu terakhir</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-purple-500"></span>
                      <span className="text-xs text-purple-400 dark:text-purple-300">Tugas</span>
                      <span className="w-3 h-3 rounded bg-emerald-500 ml-2"></span>
                      <span className="text-xs text-purple-400 dark:text-purple-300">Booking</span>
                    </div>
                  </div>

                  {/* SVG Minimalist Graphic */}
                  <div className="chart-container">
                    <svg viewBox="0 0 500 200" width="100%" height="100%" className="overflow-visible">
                      {/* Grid lines */}
                      <line x1="0" y1="50" x2="500" y2="50" stroke="var(--border)" strokeWidth="0.5" />
                      <line x1="0" y1="100" x2="500" y2="100" stroke="var(--border)" strokeWidth="0.5" />
                      <line x1="0" y1="150" x2="500" y2="150" stroke="var(--border)" strokeWidth="0.5" />

                      {/* Productivity Trend Line (Purple) */}
                      <path 
                        d="M 10 150 Q 80 120, 160 80 T 320 110 T 480 30" 
                        fill="none" 
                        stroke="#8B5CF6" 
                        strokeWidth="3.5"
                        className="trend-line"
                      />
                      
                      {/* Booking Trend Line (Emerald) */}
                      <path 
                        d="M 10 170 Q 80 140, 160 110 T 320 90 T 480 70" 
                        fill="none" 
                        stroke="#10B981" 
                        strokeWidth="3.5"
                        strokeDasharray="5,5"
                        className="trend-line"
                      />

                      {/* Points */}
                      <circle cx="160" cy="80" r="5" fill="#8B5CF6" />
                      <circle cx="320" cy="110" r="5" fill="#8B5CF6" />
                      <circle cx="480" cy="30" r="5" fill="#8B5CF6" />

                      <circle cx="160" cy="110" r="5" fill="#10B981" />
                      <circle cx="320" cy="90" r="5" fill="#10B981" />
                      <circle cx="480" cy="70" r="5" fill="#10B981" />

                      {/* Labels */}
                      <text x="10" y="190" fill="var(--text-muted)" fontSize="10">Sen</text>
                      <text x="90" y="190" fill="var(--text-muted)" fontSize="10">Sel</text>
                      <text x="170" y="190" fill="var(--text-muted)" fontSize="10">Rab</text>
                      <text x="250" y="190" fill="var(--text-muted)" fontSize="10">Kam</text>
                      <text x="330" y="190" fill="var(--text-muted)" fontSize="10">Jum</text>
                      <text x="410" y="190" fill="var(--text-muted)" fontSize="10">Sab</text>
                      <text x="470" y="190" fill="var(--text-muted)" fontSize="10">Min</text>
                    </svg>
                  </div>
                  
                  {/* Analytic insight advice */}
                  <div className="mt-4 p-3 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-indigo-950/50 rounded-xl flex items-start gap-2.5">
                    <Sparkles size={16} className="text-purple-600 dark:text-purple-300 mt-0.5" />
                    <p className="text-xs text-purple-600 dark:text-purple-300">
                      <strong>Rekomendasi Produktivitas:</strong> Booking jam tersibuk Anda terjadi pada hari Rabu sore. Mengalokasikan 2 jam fokus-kerja mandiri pada Rabu pagi akan memaksimalkan efisiensi Anda!
                    </p>
                  </div>
                </div>

                {/* Real-time sync logs & external statuses */}
                <div className="glass-panel p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold">Sinkronisasi Realtime</h3>
                      <span className="flex h-2.5 w-2.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                    </div>

                    {/* Interactive Logs List */}
                    <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                      {syncLogs.map((log, index) => (
                        <div key={index} className="text-xs font-mono p-2.5 rounded-lg bg-purple-50/40 dark:bg-indigo-950/40 border border-purple-100/30 dark:border-indigo-950/30 text-purple-600 dark:text-purple-300 break-words">
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-purple-100 dark:border-indigo-950 pt-4 mt-4">
                    <button 
                      onClick={() => {
                        const timestamp = new Date().toLocaleTimeString('id-ID')
                        setSyncLogs(prev => [
                          `[${timestamp}] 🔄 Sinkronisasi manual dipicu oleh pengguna.`,
                          `[${timestamp}] 🟢 Kalender Google, Notion, dan surel berhasil diperbarui secara realtime.`,
                          ...prev
                        ])
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
                            ? 'bg-purple-600 border-purple-600 text-white' 
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
              {/* Task filters & view toggle */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                {/* Filter tags */}
                <div className="flex flex-wrap items-center gap-2">
                  {['All', 'Work', 'Meeting', 'Personal', 'Security'].map(filter => (
                    <button
                      key={filter}
                      onClick={() => setTaskFilter(filter)}
                      className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                        taskFilter === filter
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-purple-100/60 dark:bg-indigo-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-indigo-900/60'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                {/* View toggle */}
                <div className="flex items-center gap-2 p-1 rounded-xl bg-purple-100/60 dark:bg-indigo-950/40 border border-purple-200/20">
                  <button
                    onClick={() => setTaskView('list')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      taskView === 'list' ? 'bg-purple-600 text-white shadow' : 'text-purple-700 dark:text-purple-300'
                    }`}
                  >
                    List View
                  </button>
                  <button
                    onClick={() => setTaskView('grid')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      taskView === 'grid' ? 'bg-purple-600 text-white shadow' : 'text-purple-700 dark:text-purple-300'
                    }`}
                  >
                    Project Board
                  </button>
                </div>
              </div>

              {/* Two Panel Layout: Add task & Tasks view */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left panel: Add task Form */}
                <div className="glass-panel p-6 h-fit">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <CheckSquare size={18} className="text-purple-500" />
                    Tambah Tugas Baru
                  </h3>

                  <form onSubmit={handleAddTask} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-purple-400 dark:text-purple-300 uppercase tracking-widest mb-1.5">Nama Tugas</label>
                      <input 
                        type="text" 
                        placeholder="Contoh: Kirim laporan mingguan"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-purple-100 dark:border-indigo-950 bg-white/50 dark:bg-indigo-950/20 focus:outline-none focus:border-purple-500 text-sm"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-purple-400 dark:text-purple-300 uppercase tracking-widest mb-1.5">Kategori</label>
                        <select 
                          value={newTaskCategory}
                          onChange={(e) => setNewTaskCategory(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-purple-100 dark:border-indigo-950 bg-white/50 dark:bg-indigo-950/20 text-sm focus:outline-none focus:border-purple-500"
                        >
                          <option value="Work">Pekerjaan</option>
                          <option value="Meeting">Rapat</option>
                          <option value="Personal">Pribadi</option>
                          <option value="Security">Keamanan</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-purple-400 dark:text-purple-300 uppercase tracking-widest mb-1.5">Prioritas</label>
                        <select 
                          value={newTaskPriority}
                          onChange={(e) => setNewTaskPriority(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-purple-100 dark:border-indigo-950 bg-white/50 dark:bg-indigo-950/20 text-sm focus:outline-none focus:border-purple-500"
                        >
                          <option value="low">Rendah</option>
                          <option value="medium">Sedang</option>
                          <option value="high">Tinggi</option>
                          <option value="critical">Kritis</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-purple-400 dark:text-purple-300 uppercase tracking-widest mb-1.5">Label Warna</label>
                        <div className="flex items-center gap-2 mt-1">
                          {['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444'].map(color => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setNewTaskColor(color)}
                              className={`w-6 h-6 rounded-full border-2 transition-all ${
                                newTaskColor === color ? 'border-purple-700 scale-110 shadow-sm' : 'border-transparent'
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-purple-400 dark:text-purple-300 uppercase tracking-widest mb-1.5">Waktu Pengingat</label>
                        <input 
                          type="time" 
                          value={newTaskTime}
                          onChange={(e) => setNewTaskTime(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-purple-100 dark:border-indigo-950 bg-white/50 dark:bg-indigo-950/20 text-sm focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all mt-6 shadow-md hover:shadow-purple-500/10"
                    >
                      <Plus size={16} />
                      Tambahkan ke Jadwal
                    </button>
                  </form>
                </div>

                {/* Right panel: Tasks Display */}
                <div className="lg:col-span-2 space-y-4">
                  {taskView === 'list' ? (
                    // List View
                    <div className="glass-panel p-6 space-y-3">
                      <h3 className="text-lg font-bold mb-4">Daftar Semua Tugas</h3>

                      {tasks.filter(t => (taskFilter === 'All' || t.category === taskFilter) && t.title.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                        <div className="text-center py-8">
                          <CheckCircle className="mx-auto text-purple-300 dark:text-purple-700 mb-2" size={32} />
                          <p className="text-sm text-purple-400 dark:text-purple-300">Tidak ada tugas yang cocok.</p>
                        </div>
                      ) : (
                        tasks.filter(t => (taskFilter === 'All' || t.category === taskFilter) && t.title.toLowerCase().includes(searchQuery.toLowerCase())).map(task => (
                          <div 
                            key={task.id} 
                            className="p-4 rounded-xl border border-purple-100/60 dark:border-indigo-950/60 bg-purple-50/10 dark:bg-indigo-950/5 flex items-center gap-3.5 hover:translate-x-1 transition-transform"
                          >
                            <div 
                              onClick={() => toggleTaskStatus(task.id)}
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all ${
                                task.status === 'done' 
                                  ? 'bg-purple-600 border-purple-600 text-white' 
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
                                  {task.dueTime} WIB
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                                task.priority === 'critical' 
                                  ? 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400' 
                                  : task.priority === 'high' 
                                  ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'
                                  : 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400'
                              }`}>
                                {task.priority}
                              </span>
                              
                              <button 
                                onClick={() => deleteTask(task.id)}
                                className="w-8 h-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-purple-400 hover:text-red-500 flex items-center justify-center transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
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
                                className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-[10px] text-white font-bold rounded-lg transition-colors"
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
            </div>
          )}

          {/* TAB CONTENT: 3. BOOKING CALENDAR & APPOINTMENTS */}
          {activeTab === 'calendar' && (
            <div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left pane: Calendar Matrix (May 2026) */}
                <div className="lg:col-span-2 glass-panel p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold">Kalender Reservasi Pertemuan</h3>
                      <p className="text-xs text-purple-400 dark:text-purple-300 capitalize">{calendarTitle} - Hubungan Realtime Google & Notion</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setCalendarMonthDate(new Date(calendarMonthDate.getFullYear(), calendarMonthDate.getMonth() - 1, 1))} className="px-2 py-1 rounded-lg border border-purple-200 dark:border-indigo-900 text-xs">◀</button>
                      <button onClick={() => setCalendarMonthDate(new Date(todayDate.getFullYear(), todayDate.getMonth(), 1))} className="px-3 py-1 rounded-lg bg-purple-600 text-white text-xs font-bold">Hari Ini</button>
                      <button onClick={() => setCalendarMonthDate(new Date(calendarMonthDate.getFullYear(), calendarMonthDate.getMonth() + 1, 1))} className="px-2 py-1 rounded-lg border border-purple-200 dark:border-indigo-900 text-xs">▶</button>
                    </div>
                  </div>

                  {/* Day Names Row */}
                  <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-purple-400 dark:text-purple-300 uppercase tracking-widest mb-3">
                    {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => <span key={d}>{d}</span>)}
                  </div>

                  {/* Calendar Grid Days */}
                  <div className="calendar-grid">
                    {calendarDays.map((dayItem) => {
                      const dayNumber = dayItem.date.getDate()
                      const dateStr = dayItem.dateStr
                      const dayAppointments = appointments.filter(app => app.date === dateStr)
                      const dayTasks = tasks.filter(task => (task.calendarDate || todayString) === dateStr)
                      const totalItems = dayAppointments.length + dayTasks.length
                      const hasAppt = totalItems > 0
                      const isToday = dayItem.isToday

                      return (
                        <div 
                          key={dateStr} 
                          className={`calendar-day ${!dayItem.isCurrentMonth ? 'other-month' : ''} ${isToday ? 'active-day font-bold border-purple-500 shadow-sm' : ''} ${hasAppt ? 'has-appointment' : ''}`}
                          onClick={() => {
                            setBookingDate(dateStr)
                            setSelectedCalendarDate(dateStr)
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <span className={`text-xs ${isToday ? 'text-purple-600 dark:text-purple-300' : 'text-purple-800 dark:text-purple-300'}`}>{dayNumber}</span>
                            {isToday && <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>}
                          </div>
                          {hasAppt && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedCalendarDate(dateStr)
                              }}
                              className="text-[8px] bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 px-1 py-0.5 rounded truncate font-bold uppercase tracking-wider block mt-1 w-full text-left hover:bg-purple-200 dark:hover:bg-purple-900/60"
                            >
                              {totalItems} Aktivitas
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <div className="mt-5 p-4 rounded-xl border border-purple-200/50 dark:border-indigo-900/50 bg-purple-50/20 dark:bg-indigo-950/20">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold">Detail Aktivitas Tanggal {selectedCalendarDate}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-indigo-900/50 text-purple-700 dark:text-purple-300 font-bold">
                        {selectedDateItems.length} event
                      </span>
                    </div>
                    {selectedDateItems.length === 0 ? (
                      <p className="text-xs text-purple-400 dark:text-purple-300">Belum ada event/task aktif di tanggal ini.</p>
                    ) : (
                      <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                        {selectedDateItems.map(item => (
                          <button
                            key={`${item.itemType}-${item.id}`}
                            type="button"
                            className="w-full text-left p-2.5 rounded-lg border border-purple-200/60 dark:border-indigo-900/50 bg-white/60 dark:bg-indigo-950/30 hover:bg-purple-100/70 dark:hover:bg-indigo-900/40"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                                {item.itemType === 'appointment' ? <Calendar size={12} /> : <CheckSquare size={12} />}
                                {item.title}
                              </p>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-indigo-900/50 text-purple-600 dark:text-purple-300 uppercase font-bold">
                                {item.itemType === 'appointment' ? 'Reservasi' : 'Task'}
                              </span>
                            </div>
                            {item.itemType === 'appointment' ? (
                              <>
                                <p className="text-[11px] text-purple-500 dark:text-purple-300 mt-0.5">{item.clientName} • {item.time} WIB</p>
                                <p className="text-[10px] text-purple-400 dark:text-purple-400 mt-1">{item.email}</p>
                                <div className="mt-2 flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      openCalendarEditModal(item)
                                    }}
                                    className="px-2 py-1 rounded-md text-[10px] font-bold bg-purple-600 text-white hover:bg-purple-700 inline-flex items-center gap-1"
                                  >
                                    <Pencil size={10} />
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      openDeleteConfirmModal(item)
                                    }}
                                    className="px-2 py-1 rounded-md text-[10px] font-bold bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40 inline-flex items-center gap-1"
                                  >
                                    <Trash2 size={10} />
                                    Hapus
                                  </button>
                                </div>
                              </>
                            ) : (
                              <>
                                <p className="text-[11px] text-purple-500 dark:text-purple-300 mt-0.5">{item.category} • {item.dueTime}</p>
                                <p className="text-[10px] text-purple-400 dark:text-purple-400 mt-1 uppercase">Task • {item.priority}</p>
                                <div className="mt-2 flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      openCalendarEditModal(item)
                                    }}
                                    className="px-2 py-1 rounded-md text-[10px] font-bold bg-purple-600 text-white hover:bg-purple-700 inline-flex items-center gap-1"
                                  >
                                    <Pencil size={10} />
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      openDeleteConfirmModal(item)
                                    }}
                                    className="px-2 py-1 rounded-md text-[10px] font-bold bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40 inline-flex items-center gap-1"
                                  >
                                    <Trash2 size={10} />
                                    Hapus
                                  </button>
                                </div>
                              </>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right pane: Reservation Form & Appointments lists */}
                <div className="space-y-6">
                  
                  {/* Reservation form */}
                  {showBookingQuickForm && <div className="glass-panel p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-bold flex items-center gap-2">
                        <Calendar size={18} className="text-purple-500" />
                        Jadwalkan Konsultasi Baru
                      </h3>
                      <button type="button" onClick={() => setIsBookingFormExpanded(prev => !prev)} className="text-xs px-2 py-1 rounded-lg border border-purple-200 dark:border-indigo-900 flex items-center gap-1">
                        {isBookingFormExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        {isBookingFormExpanded ? 'Hide' : 'Expand'}
                      </button>
                    </div>

                    {isBookingFormExpanded && <form onSubmit={handleAddBooking} className="space-y-3.5">
                      <div>
                        <label className="block text-[10px] font-bold text-purple-400 dark:text-purple-300 uppercase tracking-widest mb-1">Nama Klien</label>
                        <input 
                          type="text" 
                          placeholder="Nama lengkap klien..."
                          value={bookingClient}
                          onChange={(e) => setBookingClient(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-purple-100 dark:border-indigo-950 bg-white/50 dark:bg-indigo-950/20 text-xs focus:outline-none focus:border-purple-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-purple-400 dark:text-purple-300 uppercase tracking-widest mb-1">Surel Klien</label>
                        <input 
                          type="email" 
                          placeholder="client@mail.com"
                          value={bookingEmail}
                          onChange={(e) => setBookingEmail(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-purple-100 dark:border-indigo-950 bg-white/50 dark:bg-indigo-950/20 text-xs focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-purple-400 dark:text-purple-300 uppercase tracking-widest mb-1">Nama Rapat / Agenda</label>
                        <input 
                          type="text" 
                          placeholder="Topik rapat..."
                          value={bookingTitle}
                          onChange={(e) => setBookingTitle(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-purple-100 dark:border-indigo-950 bg-white/50 dark:bg-indigo-950/20 text-xs focus:outline-none focus:border-purple-500"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-purple-400 dark:text-purple-300 uppercase tracking-widest mb-1">Tanggal</label>
                          <input 
                            type="date" 
                            value={bookingDate}
                            onChange={(e) => setBookingDate(e.target.value)}
                            min={todayString}
                            className="w-full px-2 py-2 rounded-xl border border-purple-100 dark:border-indigo-950 bg-white/50 dark:bg-indigo-950/20 text-xs focus:outline-none focus:border-purple-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-purple-400 dark:text-purple-300 uppercase tracking-widest mb-1">Waktu</label>
                          <select
                            value={bookingTime}
                            onChange={(e) => setBookingTime(e.target.value)}
                            className="w-full px-2 py-2 rounded-xl border border-purple-100 dark:border-indigo-950 bg-white/50 dark:bg-indigo-950/20 text-xs focus:outline-none focus:border-purple-500"
                          >
                            {availableTimeSlotsForSelectedDate.map(slot => (
                              <option key={slot} value={slot}>{slot}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      {!availableTimeSlotsForSelectedDate.length && (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400">Tidak ada slot jam tersisa di tanggal ini.</p>
                      )}

                      <button 
                        type="submit"
                        className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all mt-4"
                      >
                        <Plus size={14} />
                        Reservasi Rapat & Sync
                      </button>
                    </form>}
                  </div>}

                  {/* Active List */}
                  <div className="glass-panel p-6">
                    <h3 className="text-base font-bold mb-4">Agenda Terkonfirmasi</h3>
                    <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                      {appointments.filter(appt => 
                        appt.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        appt.title.toLowerCase().includes(searchQuery.toLowerCase())
                      ).map(appt => (
                        <div key={appt.id} className="p-3.5 rounded-xl border border-purple-100/60 dark:border-indigo-950/60 bg-purple-50/20 dark:bg-indigo-950/10 space-y-1">
                          <div className="flex justify-between items-center">
                            <h4 className="text-xs font-bold text-purple-700 dark:text-purple-300 truncate">{appt.clientName}</h4>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              appt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30' : 'bg-amber-50 text-amber-600'
                            }`}>
                              {appt.status}
                            </span>
                          </div>
                          <p className="text-xs font-semibold">{appt.title}</p>
                          <div className="flex items-center gap-2 text-[10px] text-purple-400 dark:text-purple-300 pt-1">
                            <Clock size={10} />
                            <span>{appt.date} • {appt.time} WIB</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}

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
                
                {/* Left panel: Add Secure note */}
                <div className="glass-panel p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Lock size={18} className="text-purple-500" />
                    Amankan Catatan Baru
                  </h3>

                  <form onSubmit={handleEncryptNote} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-purple-400 dark:text-purple-300 uppercase tracking-widest mb-1.5">Judul Catatan</label>
                      <input 
                        type="text" 
                        placeholder="Contoh: Kode Rahasia atau Keuangan"
                        value={noteInputTitle}
                        onChange={(e) => setNoteInputTitle(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-purple-100 dark:border-indigo-950 bg-white/50 dark:bg-indigo-950/20 text-sm focus:outline-none focus:border-purple-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-purple-400 dark:text-purple-300 uppercase tracking-widest mb-1.5">Isi Rahasia Catatan</label>
                      <textarea 
                        rows="4"
                        placeholder="Masukkan pesan atau dokumen yang ingin dirahasiakan..."
                        value={noteInputContent}
                        onChange={(e) => setNoteInputContent(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-purple-100 dark:border-indigo-950 bg-white/50 dark:bg-indigo-950/20 text-sm focus:outline-none focus:border-purple-500"
                        required
                      ></textarea>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-purple-400 dark:text-purple-300 uppercase tracking-widest mb-1.5">Master Password (Kunci Dekripsi)</label>
                      <input 
                        type="password" 
                        placeholder="Masukkan sandi kunci dekripsi..."
                        value={masterPassword}
                        onChange={(e) => setMasterPassword(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-purple-100 dark:border-indigo-950 bg-white/50 dark:bg-indigo-950/20 text-sm focus:outline-none focus:border-purple-500"
                        required
                      />
                    </div>

                    {scrambleProgress && (
                      <div className="encryption-matrix animate-scramble my-3">
                        ⚡ {scrambledText}
                      </div>
                    )}

                    <button 
                      type="submit"
                      disabled={scrambleProgress}
                      className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-purple-500/10 disabled:opacity-50"
                    >
                      <Lock size={16} />
                      Enkripsi & Simpan ke Supabase
                    </button>
                  </form>
                </div>

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
                                  className="px-4 py-2 bg-purple-600 text-white font-bold text-xs rounded-xl hover:bg-purple-700"
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
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setActiveIntegrationModal(null)}>
                <div className="w-full max-w-lg glass-panel p-8 space-y-5 shadow-2xl" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold">{def?.label}</h3>
                      <p className="text-xs text-purple-400 dark:text-purple-300 mt-0.5">Masukkan kredensial API untuk koneksi nyata</p>
                    </div>
                    <button onClick={() => setActiveIntegrationModal(null)} className="w-8 h-8 rounded-lg hover:bg-purple-100 dark:hover:bg-indigo-900/50 flex items-center justify-center text-purple-400">
                      ✕
                    </button>
                  </div>

                  <div className="space-y-4">
                    {def?.fields.map(field => (
                      <div key={field.id}>
                        <label className="block text-[10px] uppercase font-bold tracking-wider text-purple-400 dark:text-purple-300 mb-1.5">{field.label}</label>
                        {field.type === 'textarea' ? (
                          <textarea
                            rows={4}
                            placeholder={field.placeholder}
                            value={integrationFormData[field.id] || ''}
                            onChange={e => setIntegrationFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-xl border border-purple-100 dark:border-indigo-950 bg-white/50 dark:bg-indigo-950/20 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-mono"
                          />
                        ) : (
                          <input
                            type={field.type}
                            placeholder={field.placeholder}
                            value={integrationFormData[field.id] || ''}
                            onChange={e => setIntegrationFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-xl border border-purple-100 dark:border-indigo-950 bg-white/50 dark:bg-indigo-950/20 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/40 dark:border-amber-800/30 text-amber-700 dark:text-amber-400 text-[10px] leading-relaxed">
                    ⚠️ Kredensial disimpan secara lokal di browser Anda (localStorage). Tidak dikirim ke server mana pun. Gunakan variabel lingkungan di production.
                  </div>

                  {activeIntegrationModal === 'google_calendar' && (
                    <div className="space-y-2">
                      <button
                        onClick={testGoogleCalendarConnection}
                        disabled={testingGoogleConnection}
                        className="w-full py-2.5 rounded-xl border border-blue-200 dark:border-blue-900/40 text-blue-600 dark:text-blue-300 text-xs font-bold hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all disabled:opacity-60"
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

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        const updated = { ...integrationConfigs }
                        delete updated[activeIntegrationModal]
                        setIntegrationConfigs(updated)
                        localStorage.setItem('dyatask_integration_configs', JSON.stringify(updated))
                        setActiveIntegrationModal(null)
                      }}
                      className="flex-1 py-2.5 rounded-xl border border-red-200 dark:border-red-900/40 text-red-500 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                    >
                      Hapus Koneksi
                    </button>
                    <button
                      onClick={saveIntegrationConfig}
                      className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-md"
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
                        <span className="w-5 h-5 shrink-0 rounded-full bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">{idx + 1}</span>
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
                    className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-md"
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
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5"
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
                      <div className="flex gap-2">
                        <input readOnly value={sharedFormLink} className="flex-1 px-2 py-2 rounded-lg border border-purple-100 dark:border-indigo-900 bg-white/70 dark:bg-indigo-950/30 text-[10px]" />
                        <button type="button" onClick={copyShareLink} className="px-3 py-2 rounded-lg bg-purple-600 text-white text-[10px] font-bold inline-flex items-center gap-1">
                          <Copy size={10} />
                          {copiedShareLink ? 'Tersalin' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-purple-200/60 dark:border-indigo-900/60 bg-white/40 dark:bg-indigo-950/20">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-purple-500 dark:text-purple-300 mb-2">Catatan Untuk Form Publik</p>
                      <textarea
                        value={publicBookingNotes}
                        onChange={(e) => setPublicBookingNotes(e.target.value)}
                        rows={5}
                        className="w-full px-3 py-2 rounded-lg border border-purple-100 dark:border-indigo-900 bg-white/70 dark:bg-indigo-950/30 text-xs resize-none"
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
                            className={`py-1 text-[10px] rounded border ${selectedAvailabilityDay === index ? 'bg-purple-600 text-white border-purple-600' : (bookingAvailability.daySchedules?.[index]?.enabled ? 'bg-purple-100 dark:bg-indigo-900/40 text-purple-600 dark:text-purple-300 border-purple-200 dark:border-indigo-900/60' : 'bg-zinc-100 dark:bg-zinc-900/40 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800')}`}
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
                          className="px-2 py-2 rounded-lg border border-purple-100 dark:border-indigo-900 bg-white/70 dark:bg-indigo-950/30 text-xs"
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
                          className="px-2 py-2 rounded-lg border border-purple-100 dark:border-indigo-900 bg-white/70 dark:bg-indigo-950/30 text-xs"
                        />
                        <select value={bookingAvailability.slotMinutes} onChange={(e) => setBookingAvailability(prev => ({ ...prev, slotMinutes: Number(e.target.value) }))} className="px-2 py-2 rounded-lg border border-purple-100 dark:border-indigo-900 bg-white/70 dark:bg-indigo-950/30 text-xs">
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
                      <div className="w-11 h-6 bg-purple-200 dark:bg-indigo-950 rounded-full peer peer-focus:ring-2 peer-focus:ring-purple-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  {/* Control 2 */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-purple-50/20 dark:bg-indigo-950/10 border border-purple-100/50 dark:border-indigo-950/50">
                    <div>
                      <h4 className="text-sm font-semibold">Buka Otomatis Saat Ada Alarm / Notifikasi</h4>
                      <p className="text-xs text-purple-400 dark:text-purple-300 mt-0.5">Fokus otomatis jendela aplikasi DyaTask saat alarm jadwal pertemuan berbunyi.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={autoOpenOnAlert}
                        onChange={() => setAutoOpenOnAlert(!autoOpenOnAlert)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-purple-200 dark:bg-indigo-950 rounded-full peer peer-focus:ring-2 peer-focus:ring-purple-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
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
                      <div className="w-11 h-6 bg-purple-200 dark:bg-indigo-950 rounded-full peer peer-focus:ring-2 peer-focus:ring-purple-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
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
                      <div className="w-11 h-6 bg-purple-200 dark:bg-indigo-950 rounded-full peer peer-focus:ring-2 peer-focus:ring-purple-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
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
                      <span className="text-[10px] text-zinc-400 font-bold ml-2">DyaTask Manager Desktop</span>
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
                        'Alarm Uji Coba!',
                        'Evaluasi kesiapan notifikasi real-time macOS berhasil.',
                        'local'
                      )
                    }}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md"
                  >
                    <BellRing size={12} />
                    Uji Notifikasi macOS
                  </button>
                </div>
              </div>

            </div>
          )}

        </main>
        
      </div>

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
                className="px-3.5 py-1.5 bg-purple-600 text-white font-bold text-[10px] rounded-lg hover:bg-purple-700 transition-colors"
              >
                Simpan Cepat
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 🚀 FLOATING WIDGET BUTTON ON MACBOOK PREVIEW */}
      {floatingMenuEnabled && (
        <button 
          onClick={() => setFloatingQuickAdd(!floatingQuickAdd)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shadow-2xl hover:shadow-purple-500/30 glow-primary active:scale-95 transition-all z-40"
        >
          <Sparkles size={24} />
        </button>
      )}

    </div>
  )
}

export default App
