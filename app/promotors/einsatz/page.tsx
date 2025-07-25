"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Calendar,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Info,
  MessageSquare,
  Package,
  Play,
  Plus,
  Send,
  X,
  ArrowLeft,
  ArrowRight,
  MapPin,
  PlayCircle,
  PauseCircle,
  StopCircle,
  Check,
  AlertTriangle,
  ClipboardList,
  Video,
  Briefcase,
  Stethoscope,
  Upload,
  Camera,
  Image,
  Thermometer,
  MoreHorizontal,
  AlertCircle,
  SlidersHorizontal,
  ShoppingCart,
  Minus,
  Box,
  Truck,
  RotateCcw,
  GraduationCap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"

// Mock data for today's assignment
const getFutureDate = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

// Array of assignments instead of single mock
const assignmentsMock = [
  {
    id: 101,
    title: "Samsung Galaxy S24 Launch Event",
    location: "Saturn Alexanderplatz, Berlin",
    time: "15:00 - 16:15", // Shift ends at 4:15 PM for today
    date: new Date(), // Assignment is for today
    type: "promotion",
    details: "Presentation and sales support for the new Samsung Galaxy S24 series. Focus on key selling points and customer engagement."
  },
  {
    id: 102,
    title: "Huawei Nova 12 Product Demo",
    location: "MediaMarkt Europa-Center, Berlin",
    time: "09:30 - 17:30",
    date: getFutureDate(3), // Assignment is 3 days from now
    type: "promotion",
    details: "Product demonstration and customer support for the new Huawei Nova series."
  }
];

// For convenience - today's assignment is the first one
const todayAssignmentMock = assignmentsMock[0];

// Mock data for newcomer proposals
const newcomerProposalsMock = [
  { id: 1, date: "Mo 12.06.2023 10:00-16:00", location: "MediaMarkt Spandau", description: "Smartphone Promotion" },
  { id: 2, date: "Di 13.06.2023 12:00-18:00", location: "Saturn Charlottenburg", description: "Tablet Sales Demo" },
  { id: 3, date: "Mi 14.06.2023 09:00-15:00", location: "Telekom Shop Mitte", description: "Router Support Event" },
  { id: 4, date: "Do 15.06.2023 11:00-17:00", location: "Vodafone Store Steglitz", description: "New Tariff Info Day" },
  { id: 5, date: "Fr 16.06.2023 13:00-19:00", location: "O2 Shop Zehlendorf", description: "Accessory Sales" },
];

// Mock data for assignment selection
const assignmentSelectionMock = [
  { id: 1, date: "Mo 19.06.2023", time: "10:00-16:00", location: "MediaMarkt Berlin Mitte", description: "Samsung Galaxy Promotion" },
  { id: 2, date: "Di 20.06.2023", time: "12:00-18:00", location: "Saturn Alexanderplatz", description: "iPhone Sales Event" },
  { id: 3, date: "Mi 21.06.2023", time: "09:00-15:00", location: "Telekom Store Potsdamer Platz", description: "5G Router Demo" },
  { id: 4, date: "Do 22.06.2023", time: "11:00-17:00", location: "Vodafone Shop Friedrichshain", description: "Contract Consultation Day" },
  { id: 5, date: "Fr 23.06.2023", time: "13:00-19:00", location: "O2 Store Prenzlauer Berg", description: "Accessory Showcase" },
  { id: 6, date: "Sa 24.06.2023", time: "10:00-16:00", location: "MediaMarkt Steglitz", description: "Weekend Special Event" },
];

// Mock data for replacement assignments
const replacementAssignmentsMock = [
  { id: 101, date: "So 25.06.2023", time: "11:00-17:00", location: "Telekom Shop Charlottenburg", description: "Sunday Special Promotion" },
  { id: 102, date: "Mo 26.06.2023", time: "14:00-20:00", location: "MediaMarkt Tempelhof", description: "Evening Electronics Event" },
  { id: 103, date: "Di 27.06.2023", time: "10:00-16:00", location: "Saturn Spandau", description: "Tuesday Tech Showcase" },
];

export default function EinsatzPage() {
  const router = useRouter();
  const [showMapsModal, setShowMapsModal] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<typeof newcomerProposalsMock[0] | null>(null);

  const [einsatzStatus, setEinsatzStatus] = useState<"idle" | "started" | "completed">("idle");
  const [remainingTime, setRemainingTime] = useState(0); // in seconds
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const assignmentEndDateRef = useRef<Date | null>(null); // To store the specific end date of the current/last assignment

  const [isSwiped, setIsSwiped] = useState(false); // New state for swipe toggle

  const [lastCompletedAssignmentDate, setLastCompletedAssignmentDate] = useState<Date | null>(null);

  // Early start functionality
  const [showEarlyStartModal, setShowEarlyStartModal] = useState(false);
  const [earlyStartReason, setEarlyStartReason] = useState("");
  const [minutesEarly, setMinutesEarly] = useState(0);

  // Active einsatz functionality
  const [abweichendePauseSubmitted, setAbweichendePauseSubmitted] = useState(false);
  const [showEarlyEndModal, setShowEarlyEndModal] = useState(false);
  const [earlyEndReason, setEarlyEndReason] = useState("");
  const [minutesEarlyEnd, setMinutesEarlyEnd] = useState(0);

  // For newcomer proposals
  const [isNewcomer, setIsNewcomer] = useState(true); // Simulate newcomer status
  const [proposals, setProposals] = useState(newcomerProposalsMock);
  const [selectedProposalId, setSelectedProposalId] = useState<number | null>(null);
  const [showProposalConfirmation, setShowProposalConfirmation] = useState(false);

  // For assignment selection
  const [assignments, setAssignments] = useState(assignmentSelectionMock);
  const [selectedAssignmentIds, setSelectedAssignmentIds] = useState<number[]>([]);
  const [showAssignmentSubmittedMessage, setShowAssignmentSubmittedMessage] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<typeof assignmentSelectionMock[0] | null>(null);
  const [isAssignmentCollapsed, setIsAssignmentCollapsed] = useState(false);
  const [assignmentStatuses, setAssignmentStatuses] = useState<{[key: number]: 'pending' | 'confirmed' | 'declined'}>({});
  const [showAssignmentConfirmation, setShowAssignmentConfirmation] = useState(false);
  const [showReplacementAssignments, setShowReplacementAssignments] = useState(false);
  const [selectedReplacementIds, setSelectedReplacementIds] = useState<number[]>([]);
  const [replacementStatuses, setReplacementStatuses] = useState<{[key: number]: 'pending' | 'confirmed' | 'declined'}>({});
  const [hasAvailableAssignments, setHasAvailableAssignments] = useState(true);

  // For sickness and emergency reporting
  const [activeTab, setActiveTab] = useState<"krankheit" | "notfall">("krankheit");
  const [isWaitingForSickConfirmation, setIsWaitingForSickConfirmation] = useState(false);
  const [isSickConfirmed, setIsSickConfirmed] = useState(false);
  const [showDoctorNoteUpload, setShowDoctorNoteUpload] = useState(false);
  const [doctorNoteUploaded, setDoctorNoteUploaded] = useState(false);
  const [isWaitingForEmergencyConfirmation, setIsWaitingForEmergencyConfirmation] = useState(false);
  const [isEmergencyConfirmed, setIsEmergencyConfirmed] = useState(false);

  // For equipment ordering
  const [showEquipmentCard, setShowEquipmentCard] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);
  const [equipmentQuantity, setEquipmentQuantity] = useState(1);
  const [equipmentOrderStep, setEquipmentOrderStep] = useState<"list" | "confirm">("list");

  // For rotating calendar
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date());
  const [animating, setAnimating] = useState(false);
  const [showMiniCalendar, setShowMiniCalendar] = useState(false);
  const [miniCalendarDisplayMonth, setMiniCalendarDisplayMonth] = useState(new Date());
  const miniCalendarButtonRef = useRef<HTMLButtonElement>(null);
  const miniCalendarPopupRef = useRef<HTMLDivElement>(null);
  const [hoveredMiniCalendarDate, setHoveredMiniCalendarDate] = useState<Date | null>(null);
  const [showLegendPopup, setShowLegendPopup] = useState(false);
  const legendIconRef = useRef<HTMLButtonElement>(null);
  const legendPopupRef = useRef<HTMLDivElement>(null);

  // Mock equipment data
  const equipmentItems = [
    { id: 1, name: "Samsung Smartphones", description: "Dummy-Geräte für Präsentation", image: "/placeholder-phone.jpg" },
    { id: 2, name: "Tablet Ständer", description: "Display-Ständer für Tablets", image: "/placeholder-stand.jpg" },
    { id: 3, name: "Werbeflyer", description: "Produktinformationen", image: "/placeholder-flyer.jpg" },
    { id: 4, name: "Netzteile", description: "Ladegeräte für Vorführung", image: "/placeholder-charger.jpg" },
    { id: 5, name: "Bluetooth Kopfhörer", description: "Demonstration Audio-Features", image: "/placeholder-headphones.jpg" },
    { id: 6, name: "Displayreiniger", description: "Reinigungsset für Geräte", image: "/placeholder-cleaner.jpg" },
  ];

  // Helper functions for calendar
  const getCalendarDays = () => {
    const days = [];
    const startDay = new Date(currentCalendarDate);
    startDay.setDate(currentCalendarDate.getDate() - 4);
    for (let i = 0; i < 9; i++) {
      const day = new Date(startDay);
      day.setDate(startDay.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const navigateDays = (steps: number) => {
    if (animating || steps === 0) return;
    setAnimating(true);
    setTimeout(() => {
      const newCurrentDate = new Date(currentCalendarDate);
      newCurrentDate.setDate(currentCalendarDate.getDate() + steps);
      setCurrentCalendarDate(newCurrentDate);
      setSelectedCalendarDate(newCurrentDate);
      setTimeout(() => setAnimating(false), 400);
    }, 50);
  };

  const formatDateRange = (startDate: Date, endDate: Date): string => {
    const startMonth = startDate.toLocaleDateString('de-DE', { month: 'short' });
    const endMonth = endDate.toLocaleDateString('de-DE', { month: 'short' });
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    if (startMonth === endMonth) {
      return `${startMonth}, ${String(startDay).padStart(2, '0')} - ${String(endDay).padStart(2, '0')}`;
    }
    return `${startMonth} ${String(startDay).padStart(2, '0')} - ${endMonth} ${String(endDay).padStart(2, '0')}`;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = [];
    let startingDayOfWeek = firstDayOfMonth.getDay();
    startingDayOfWeek = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
    for (let i = 0; i < startingDayOfWeek; i++) {
      daysInMonth.push(null);
    }
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      daysInMonth.push(new Date(year, month, i));
    }
    return daysInMonth;
  };

  const navigateMiniCalendarMonth = (direction: number) => {
    setMiniCalendarDisplayMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + direction);
      return newMonth;
    });
  };

  // Effect for mini calendar outside click
  useEffect(() => {
    const handleClickOutsideMiniCalendar = (event: MouseEvent) => {
      if (showMiniCalendar && miniCalendarButtonRef.current && !miniCalendarButtonRef.current.contains(event.target as Node) && miniCalendarPopupRef.current && !miniCalendarPopupRef.current.contains(event.target as Node)) {
        setShowMiniCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutsideMiniCalendar);
    return () => document.removeEventListener('mousedown', handleClickOutsideMiniCalendar);
  }, [showMiniCalendar]);

  // Effect for legend popup outside click
  useEffect(() => {
    const handleClickOutsideLegend = (event: MouseEvent) => {
      if (showLegendPopup && legendIconRef.current && !legendIconRef.current.contains(event.target as Node) && legendPopupRef.current && !legendPopupRef.current.contains(event.target as Node)) {
        setShowLegendPopup(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutsideLegend);
    return () => document.removeEventListener('mousedown', handleClickOutsideLegend);
  }, [showLegendPopup]);

  // Maps Modal Logic (copied from dashboard)
  const handleAddressClick = (address: string) => {
    setSelectedAddress(address);
    setShowMapsModal(true);
  };

  // Handle info icon click to show details modal
  const handleInfoClick = (e: React.MouseEvent, proposal: typeof newcomerProposalsMock[0]) => {
    e.stopPropagation(); // Prevent triggering the parent card onClick
    setSelectedProposal(proposal);
    setShowDetailsModal(true);
  };

  const openInGoogleMaps = () => {
    if (!selectedAddress) return;
    const encodedAddress = encodeURIComponent(selectedAddress);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
    setShowMapsModal(false);
  };

  const openInAppleMaps = () => {
    if (!selectedAddress) return;
    const encodedAddress = encodeURIComponent(selectedAddress);
    window.open(`maps://maps.apple.com/?q=${encodedAddress}`, '_blank');
    setShowMapsModal(false);
  };

  const handleEinsatzStart = (assignment: any) => {
    router.push(`/einsatz/${assignment.id}`);
  };

  // New Timer Logic
  useEffect(() => {
    if (einsatzStatus === "started") {
      const timeParts = todayAssignmentMock.time.split(" - ");
      const endTimeString = timeParts[1];
      const [endHours, endMinutes] = endTimeString.split(":").map(Number);

      const now = new Date();
      // Ensure endDate is based on todayAssignmentMock.date for multi-day scenarios
      const assignmentDateForEndDate = new Date(todayAssignmentMock.date);
      const endDate = new Date(assignmentDateForEndDate);
      endDate.setHours(endHours, endMinutes, 0, 0);
      assignmentEndDateRef.current = new Date(endDate); // Store the actual end date for this assignment

      let initialRemaining = Math.floor((endDate.getTime() - now.getTime()) / 1000);
      
      // If the assignment is for a future date, remaining time should be calculated from its start, or simply be very large
      // For now, if it's a future assignment being "started", the countdown will be negative or huge.
      // This test setup assumes we are "forcing" a start.
      // If assignmentDateForEndDate is today, initialRemaining is correct.
      // If assignmentDateForEndDate is future, this countdown is not really "active" until that day.
      // For the purpose of testing the "completed" state by setting a past time, this is okay.
      // For a real scenario, one wouldn't "start" a future assignment this way.

      if (new Date(todayAssignmentMock.date).toDateString() !== now.toDateString() && initialRemaining > 0) {
         // If starting a future assignment, we might not want the timer to run realistically yet.
         // However, for testing the 'completed' state by setting a past time on the mock, we let it run.
      }
      
      if (initialRemaining < 0) initialRemaining = 0; // If already past
      
      setRemainingTime(initialRemaining);

      if (initialRemaining === 0) {
        setEinsatzStatus("completed");
        setLastCompletedAssignmentDate(assignmentEndDateRef.current ? new Date(assignmentEndDateRef.current) : new Date());
        return;
      }

      timerIntervalRef.current = setInterval(() => {
        setRemainingTime(prevTime => {
          if (prevTime <= 1) {
            if(timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            setEinsatzStatus("completed");
            setLastCompletedAssignmentDate(assignmentEndDateRef.current ? new Date(assignmentEndDateRef.current) : new Date());
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [einsatzStatus, todayAssignmentMock.date, todayAssignmentMock.time]); // Added dependencies

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60; // Kept for potential future use, but prompt asked for HH:MM
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };
  
  const handleStartEinsatz = () => {
    setEinsatzStatus("started");
    setIsSwiped(true); // Set swiped to true
  };

  const handleSwipeStart = () => {
    if (!isSwiped) {
      // Check if this is an early start (15+ minutes before 10:00)
      const now = new Date();
      const today = new Date();
      const startTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 0, 0); // 15:00 (3:00 PM)
      const timeDiffMinutes = (startTime.getTime() - now.getTime()) / (1000 * 60);
      
      if (timeDiffMinutes >= 15) {
        // Early start - show modal for reason
        setMinutesEarly(Math.round(timeDiffMinutes));
        setShowEarlyStartModal(true);
      } else {
        // Normal start
      handleStartEinsatz();
      }
    }
  };

  const handleEarlyStartSubmit = () => {
    if (earlyStartReason.trim()) {
      setShowEarlyStartModal(false);
      setEarlyStartReason("");
      handleStartEinsatz();
    }
  };

  const handleAbweichendePause = () => {
    setAbweichendePauseSubmitted(true);
    setTimeout(() => setAbweichendePauseSubmitted(false), 3000); // Reset after 3 seconds
  };

  const handleEarlyEnd = () => {
    // Calculate how many minutes early (before 16:15)
    const now = new Date();
    const today = new Date();
    const endTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 15, 0); // 16:15
    const timeDiffMinutes = (endTime.getTime() - now.getTime()) / (1000 * 60);
    
    setMinutesEarlyEnd(Math.round(timeDiffMinutes));
    setShowEarlyEndModal(true);
  };

  const handleEarlyEndSubmit = () => {
    if (earlyEndReason.trim()) {
      setShowEarlyEndModal(false);
      setEarlyEndReason("");
      setEinsatzStatus("completed");
      setLastCompletedAssignmentDate(new Date());
    }
  };

  const handleProposalSelect = (id: number) => {
    setSelectedProposalId(id);
  };

  const handleSubmitProposal = () => {
    if (selectedProposalId !== null) {
      console.log("Submitted proposal ID:", selectedProposalId);
      // Here, you'd typically send this to a backend.
      // For UI demo, we can disable the card or show a message.
      setProposals([]); // Or mark as submitted
      setShowProposalConfirmation(true);
      setTimeout(() => {
        setShowProposalConfirmation(false);
        setIsNewcomer(false);
        setSelectedProposalId(null);
      }, 7000); // Hide message after 7s and reset state
    }
  };

  const handleAssignmentSelect = (id: number) => {
    setSelectedAssignmentIds(prev => 
      prev.includes(id) 
        ? prev.filter(assignmentId => assignmentId !== id)
        : [...prev, id]
    );
  };

  const handleSubmitAssignment = () => {
    if (selectedAssignmentIds.length > 0) {
      console.log("Submitted assignment IDs:", selectedAssignmentIds);
      // Set all selected assignments to pending status
      const newStatuses: {[key: number]: 'pending' | 'confirmed' | 'declined'} = {};
      selectedAssignmentIds.forEach(id => {
        newStatuses[id] = 'pending';
      });
      setAssignmentStatuses(newStatuses);
      setIsAssignmentCollapsed(true);
    }
  };

  // Temp test function for assignment statuses
  const handleTestAssignmentStatus = (status: 'confirmed' | 'declined') => {
    const newStatuses: {[key: number]: 'pending' | 'confirmed' | 'declined'} = {};
    selectedAssignmentIds.forEach(id => {
      newStatuses[id] = status;
    });
    setAssignmentStatuses(newStatuses);
  };

  // Temp test function for mixed assignment statuses (some declined, some confirmed)
  const handleTestMixedAssignmentStatus = () => {
    const newStatuses: {[key: number]: 'pending' | 'confirmed' | 'declined'} = {};
    selectedAssignmentIds.forEach((id, index) => {
      // Make the first assignment declined and the rest confirmed
      newStatuses[id] = index === 0 ? 'declined' : 'confirmed';
    });
    setAssignmentStatuses(newStatuses);
  };

  const handleAssignmentInfoClick = (e: React.MouseEvent, assignment: typeof assignmentSelectionMock[0]) => {
    e.stopPropagation(); // Prevent triggering the parent card onClick
    setSelectedAssignment(assignment);
    setShowDetailsModal(true);
  };

  const handleReplacementSelect = (id: number) => {
    const maxReplacements = selectedAssignmentIds.filter(assignmentId => assignmentStatuses[assignmentId] === 'declined').length;
    
    setSelectedReplacementIds(prev => {
      if (prev.includes(id)) {
        // If already selected, remove it
        return prev.filter(assignmentId => assignmentId !== id);
      } else if (prev.length < maxReplacements) {
        // If not selected and under limit, add it
        return [...prev, id];
      } else {
        // If at limit, don't add
        return prev;
      }
    });
  };

  const handleSubmitReplacement = () => {
    if (selectedReplacementIds.length > 0) {
      // Set replacement assignments as confirmed and keep existing confirmed assignments
      const newStatuses: {[key: number]: 'pending' | 'confirmed' | 'declined'} = {...assignmentStatuses};
      selectedReplacementIds.forEach(id => {
        newStatuses[id] = 'confirmed';
      });
      setAssignmentStatuses(newStatuses);
      
      // Update selected assignment IDs to include confirmed originals + confirmed replacements
      setSelectedAssignmentIds(prev => [
        ...prev.filter(id => assignmentStatuses[id] === 'confirmed'),
        ...selectedReplacementIds
      ]);
      
      // Clear replacement-specific states
      setSelectedReplacementIds([]);
      setReplacementStatuses({});
      setShowReplacementAssignments(false);
      
      // Update assignments data to include replacements
      setAssignments([...assignments, ...replacementAssignmentsMock]);
    }
  };

  // Helper Date Functions
  const isDateToday = (date: Date): boolean => {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const getCalendarDaysUntil = (date: Date): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Determine which assignment to display in the top card
  // Logic: If today's assignment is completed, show the next future assignment
  const shouldShowNextAssignment = einsatzStatus === "completed" && 
                                   lastCompletedAssignmentDate && 
                                   isDateToday(lastCompletedAssignmentDate);
  
  const displayedAssignment = shouldShowNextAssignment ? assignmentsMock[1] : assignmentsMock[0];

  // Prepare data for the top card
  const assignmentDate = new Date(displayedAssignment.date);
  const isAssignmentForToday = isDateToday(assignmentDate);
  const daysUntilAssignment = getCalendarDaysUntil(assignmentDate);

  let cardTitle = isAssignmentForToday ? "Heutiger Einsatz" : "Nächster Einsatz";
  let daysIndicatorValue: number | null = null;
  let daysIndicatorUnit: string | null = null;

  if (!isAssignmentForToday && daysUntilAssignment >= 0) {
    daysIndicatorValue = daysUntilAssignment;
    if (daysUntilAssignment === 1) {
      daysIndicatorUnit = "Tag";
    } else {
      daysIndicatorUnit = "Tage";
    }
  }

  return (
    <>
        {/* Welcome section specific to Einsatz Page - can use a general greeting or a specific one */}
        <section className="mb-6">
          {/* Example of a page-specific greeting if needed, otherwise SiteLayout provides one */}
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-1">Deine Einsätze</h1>
          <div className="text-gray-600 dark:text-gray-400">
            <div className="inline-block typing-animation typing-container" style={{animationDuration: '2.5s', width: 'fit-content'}}>
              Verwalte hier deine geplanten Einsätze.
            </div>
          </div>
        </section>

        {/* Today's Planned Einsatz / Next Einsatz */}
        <Card className="mb-6 border-blue-300 dark:border-blue-700 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg flex flex-row justify-between items-center py-3 px-4">
            <div>
              <CardTitle className="flex items-center text-lg md:text-xl">
                <Briefcase className="mr-2 h-5 w-5" /> {cardTitle}
              </CardTitle>
              <CardDescription className="text-blue-100 mt-0.5 text-xs md:text-sm">
                {assignmentDate.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </CardDescription>
            </div>
            {daysIndicatorValue !== null && daysIndicatorUnit !== null && (
              <div className="text-right">
                <p className="text-2xl font-bold">{daysIndicatorValue}</p>
                <p className="text-xs uppercase -mt-1">{daysIndicatorUnit}</p>
              </div>
            )}
          </CardHeader>
          <CardContent className="pt-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{displayedAssignment.title}</h3>
            {/* Time display with pill style - made smaller */}
            <div className="mb-2 mt-1">
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm">
                <Clock className="h-3.5 w-3.5 mr-1" /> 
                <span className="text-xs font-medium">{displayedAssignment.time}</span>
              </div>
            </div>
            <div 
              className="text-sm text-gray-600 dark:text-gray-400 flex items-center cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-3"
              onClick={() => handleAddressClick(displayedAssignment.location)}
            >
              <MapPin className="h-4 w-4 mr-1.5 text-blue-500" /> {displayedAssignment.location}
            </div>
            
            {/* Swipe to Start Einsatz - available from beginning of assignment day, status is idle, and not sick or in emergency */}
                          {isAssignmentForToday && einsatzStatus === "idle" && !isSwiped && !isSickConfirmed && !isEmergencyConfirmed && (
              <div className="mt-4">
                <div 
                  className="relative w-full h-14 bg-gray-100 dark:bg-gray-800 rounded-full p-1 cursor-pointer select-none flex items-center justify-center shadow-inner"
                  onClick={handleSwipeStart}
                >
                  <div 
                    className={`absolute left-1 top-1 flex items-center justify-center w-12 h-12 bg-blue-500 rounded-full shadow-md transition-transform duration-300 ease-in-out transform ${
                      isSwiped ? 'translate-x-[calc(100%-3.5rem)]' : 'translate-x-0'
                    }`}
                  >
                    <ChevronRight className="h-6 w-6 text-white" />
                  </div>
                  <span className={`text-sm font-medium transition-opacity duration-300 ${isSwiped ? 'opacity-0' : 'opacity-100 text-gray-700 dark:text-gray-300'}`}>
                    Swipe zum Starten
                  </span>
                  {isSwiped && (
                     <span className="text-sm font-medium text-green-500 dark:text-green-400">
                        Einsatz gestartet!
                     </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">Bestätige hier den Beginn deines Einsatzes.</p>
              </div>
            )}
            {/* Sick status - Show instead of swipe if user is sick */}
              {isAssignmentForToday && isSickConfirmed && (
              <div className="mt-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700 flex items-center">
                <Thermometer className="h-5 w-5 text-red-600 mr-3 ml-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-700 dark:text-red-400">Im Krankenstand</p>
                  <p className="text-xs text-red-600/80 dark:text-red-300/80 mt-0.5">
                    Du kannst diesen Einsatz nicht wahrnehmen.
                  </p>
                </div>
              </div>
            )}
            {/* Emergency status - Show instead of swipe if user has confirmed emergency */}
            {isAssignmentForToday && isEmergencyConfirmed && (
              <div className="mt-4 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 flex items-center">
                <AlertTriangle className="h-5 w-5 text-orange-500 mr-3 ml-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-orange-700 dark:text-orange-400">Notfall gemeldet</p>
                  <p className="text-xs text-orange-600/80 dark:text-orange-300/80 mt-0.5">
                    Du kannst diesen Einsatz aufgrund eines Notfalls nicht wahrnehmen.
                  </p>
                </div>
              </div>
            )}
            {/* Confirmation message after swipe, if assignment was for today */}
             {isAssignmentForToday && isSwiped && einsatzStatus === "started" && (
                <div className="mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-300 dark:border-green-700 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">Einsatz gestartet!</p>
                </div>
            )}
            {/* If not for today, maybe show a placeholder or different info if needed, for now it's blank if no swipe */}
            {!isAssignmentForToday && (
                 <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Dieser Einsatz ist für einen zukünftigen Tag geplant.</p>
                 </div>
            )}
          </CardContent>
        </Card>

        {/* Einsatz Control: Start / In Progress / Finish */}
        {/* The existing button to start Einsatz is now removed if the swipe toggle is the primary way */}
        {/* {einsatzStatus === "idle" && !isSwiped && (
          <Card className="mb-6 shadow-md">
// ... existing code ...
          </Card>
        )} */}

        {einsatzStatus === "started" && (
          <Card className="mb-6 border-green-300 dark:border-green-700 shadow-xl bg-gradient-to-br from-green-50 dark:from-green-900/30 to-transparent">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-green-600 dark:text-green-400">
                <div className="relative flex items-center mr-2">
                    <div className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping"></div>
                    <PlayCircle className="h-5 w-5 text-green-500" />
                </div>
                Einsatz aktiv
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-5xl font-bold my-4 text-gray-800 dark:text-gray-100">{formatTime(remainingTime)}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Verbleibende Zeit. Dein Einsatz wird erfasst.</p>
              
              {/* Action buttons */}
              <div className="space-y-3">
                <Button 
                  onClick={handleAbweichendePause}
                  disabled={abweichendePauseSubmitted}
                  className={`w-full py-2.5 transition-all duration-200 ${
                    abweichendePauseSubmitted 
                      ? "bg-green-500 hover:bg-green-500 text-white" 
                      : "bg-blue-500 hover:bg-blue-600 text-white"
                  }`}
                >
                  {abweichendePauseSubmitted ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Gemeldet
                    </>
                  ) : (
                    "Abweichende Pause"
                  )}
                </Button>
                
                <Button 
                  onClick={handleEarlyEnd}
                  variant="outline"
                  className="w-full py-2.5 border-rose-200 dark:border-rose-700 text-red-600 dark:text-red-400 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                >
                  Einsatz frühzeitig beenden
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Einsatz abgeschlossen Card - conditional on lastCompletedAssignmentDate being today */}
        {einsatzStatus === "completed" && lastCompletedAssignmentDate && isDateToday(lastCompletedAssignmentDate) && (
          <Card className="mb-6 border-sky-300 dark:border-sky-700 shadow-lg bg-gradient-to-br from-sky-50 dark:from-sky-900/40 to-transparent">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-sky-600 dark:text-sky-400">
                <CheckCircle2 className="mr-2.5 h-6 w-6" />
                Einsatz abgeschlossen
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="my-4 space-y-2">
                <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">Dein Einsatz für heute ist beendet.</p> {/* Clarified "for today" */}
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md text-sm text-gray-700 dark:text-gray-300">
                  <Info className="inline-block h-4 w-4 mr-1.5 mb-0.5 text-sky-500" />
                  Bitte vergiss nicht, deine genauen Arbeits- und Pausenzeiten im <strong>Demotool</strong> einzutragen.
                </div>
              </div>
               <Button 
                size="lg" 
                variant="outline"
                className="w-full py-3 mt-3 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => {
                  setEinsatzStatus("idle");
                  setIsSwiped(false);
                  setLastCompletedAssignmentDate(null); // Clear this so the card doesn't reappear until next completion
                }}
              >
                Zurück zur Übersicht
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Newcomer Date Selection Card */}
        {!showProposalConfirmation ? (
          isNewcomer && proposals.length > 0 ? (
          <Card className="mb-6 border-dashed border-blue-400 dark:border-blue-600 shadow-sm">
            <CardHeader>
              <CardTitle className="text-blue-600 dark:text-blue-400 text-center">
                Suche dir <span className="text-blue-600 dark:text-blue-400">deinen</span> <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Buddy Tag</span> <span className="text-blue-600 dark:text-blue-400">selber aus!</span>
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400 text-center">Bitte wähle einen der vorgeschlagenen Termine für deinen nächsten Einsatz aus.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {proposals.map((proposal) => (
                  <div
                    key={proposal.id}
                    className={`p-2.5 border rounded-lg cursor-pointer transition-all relative min-h-[100px]
                                ${selectedProposalId === proposal.id 
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-md scale-105' 
                                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'}`}
                    onClick={() => handleProposalSelect(proposal.id)}
                  >
                    <button 
                      className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 opacity-40 hover:opacity-100 transition-opacity"
                      onClick={(e) => handleInfoClick(e, proposal)}
                      aria-label="Mehr Details"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                        <div className="flex flex-col">
      <div className="text-base font-medium text-gray-800 dark:text-gray-200">
        {proposal.date.split(' ')[0]} {proposal.date.split(' ')[1]} {/* Day of week + Date */}
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 mb-1.5">
        {proposal.location}
      </div>
      <div className="flex items-center justify-between">
        <div className="relative inline-flex">
          <div className="absolute inset-0 bg-white dark:bg-white opacity-30 rounded-full"></div>
          <Badge className="relative text-xs font-medium px-2 py-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-sm whitespace-nowrap rounded-full">
            <span className="flex items-center">{proposal.date.split(' ')[2]}</span>
          </Badge>
        </div>
                        <Badge className="text-xs font-medium px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-sm whitespace-nowrap rounded-full">
                          <span className="flex items-center">Buddy: Cesira</span>
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button 
                className="w-full mt-4 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
                onClick={handleSubmitProposal}
                disabled={selectedProposalId === null}
              >
                <Check className="mr-2 h-4 w-4" /> Auswahl bestätigen
              </Button>
            </CardContent>
          </Card>
          ) : null
        ) : (
          <div className="w-full max-w-md mx-auto mb-6">
            <div className="relative">
              {/* Outer glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-purple-500 to-pink-500 rounded-lg blur-sm opacity-75 animate-pulse"></div>
              
              {/* Main card */}
              <Card className="relative bg-gradient-to-r from-purple-400 via-purple-500 to-pink-500 border-0 shadow-xl overflow-hidden">
                {/* Animated background pattern */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-purple-500/20 to-pink-500/20 animate-pulse"></div>
                
                {/* Content */}
                <CardContent className="relative p-0">
                  <div className="text-center">
                    <div className="flex items-center justify-center h-[140px] w-full px-4">
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 text-center">
                        <div className="text-white">
                          <div className="text-lg font-semibold mb-2">✓ Danke fürs Auswählen!</div>
                          <div className="text-sm">Die Aufgabe ist in der To-Do Liste als erledigt markiert.</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Assignment Selection Card */}
        {showAssignmentConfirmation ? (
          <div className="w-full max-w-md mx-auto mb-6">
            <div className="relative">
              {/* Outer glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-500 rounded-lg blur-sm opacity-75 animate-pulse"></div>
              
              {/* Main card */}
              <Card className="relative bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-500 border-0 shadow-xl overflow-hidden">
                {/* Animated background pattern */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-blue-500/20 to-indigo-500/20 animate-pulse"></div>
                
                {/* Content */}
                <CardContent className="relative p-0">
                  <div className="text-center">
                    <div className="flex items-center justify-center h-[140px] w-full px-4">
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 text-center">
                        <div className="text-white">
                          <div className="text-lg font-semibold mb-2">✓ Danke fürs Auswählen!</div>
                          <div className="text-sm">Die Aufgabe ist in der To-Do Liste als erledigt markiert.</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : hasAvailableAssignments ? (
          <Card className="mb-6 border-dashed border-blue-400 dark:border-blue-600 shadow-sm">
            {!isAssignmentCollapsed ? (
            <>
              <CardHeader>
                <CardTitle className="text-gray-600 dark:text-gray-400 text-center">
                  Suche dir <span className="text-gray-600 dark:text-gray-400">deinen</span> <span className="bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">nächsten Einsatz</span> <span className="text-gray-600 dark:text-gray-400">selber aus!</span>
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400 text-center">Wähle einen verfügbaren Einsatz für die kommenden Tage aus.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[280px] overflow-y-auto py-3 px-4">
                  {assignments.slice(0, 6).map((assignment) => (
                    <div
                      key={assignment.id}
                      className={`p-2.5 border rounded-lg cursor-pointer transition-all relative min-h-[80px]
                                  ${selectedAssignmentIds.includes(assignment.id) 
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-md scale-105 z-10' 
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm z-0'}`}
                      onClick={() => handleAssignmentSelect(assignment.id)}
                    >
                      <button 
                        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 opacity-40 hover:opacity-100 transition-opacity"
                        onClick={(e) => handleAssignmentInfoClick(e, assignment)}
                        aria-label="Mehr Details"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                      <div className="flex flex-col">
                        <div className="text-base font-medium text-gray-800 dark:text-gray-200 mb-1">
                          {assignment.date}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {assignment.location}
                          </div>
                          <div className="relative inline-flex">
                            <div className="absolute inset-0 bg-white dark:bg-white opacity-30 rounded-full"></div>
                            <Badge className="relative text-xs font-medium px-1.5 py-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-sm whitespace-nowrap rounded-full text-[10px]">
                              <span className="flex items-center">{assignment.time}</span>
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button 
                  className="w-full mt-4 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
                  onClick={handleSubmitAssignment}
                  disabled={selectedAssignmentIds.length === 0}
                >
                  <Check className="mr-2 h-4 w-4" /> Auswahl bestätigen
                </Button>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="pb-3">
                <CardTitle className="text-blue-600 dark:text-blue-400 text-center text-lg">
                  <span className="bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">Einsatz-Anfragen</span>
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400 text-center text-sm">
                  {selectedAssignmentIds.every(id => assignmentStatuses[id] === 'declined') 
                    ? "Leider war jemand schneller als du, suche dir bitte einen Ersatztermin aus."
                    : selectedAssignmentIds.some(id => assignmentStatuses[id] === 'declined')
                    ? `Einige deiner Einsätze wurden abgelehnt. Suche dir bitte ${selectedAssignmentIds.filter(id => assignmentStatuses[id] === 'declined').length} Ersatztermin${selectedAssignmentIds.filter(id => assignmentStatuses[id] === 'declined').length > 1 ? 'e' : ''} aus.`
                    : selectedAssignmentIds.every(id => assignmentStatuses[id] === 'confirmed')
                    ? "Deine Einsätze wurden bestätigt und sind jetzt in deinem Kalender sichtbar. Drücke 'Verstanden' um diese Aufgabe als erledigt zu markieren."
                    : "Du bist in der Warteschlange für diese Termine. Sobald sie vom Nespresso Team bestätigt sind, werden sie in deinem Kalender erscheinen."
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {selectedAssignmentIds.length > 0 && selectedAssignmentIds.map((assignmentId) => {
                    // Look in both original and replacement assignments
                    let assignment = assignments.find(a => a.id === assignmentId);
                    if (!assignment) {
                      assignment = replacementAssignmentsMock.find(a => a.id === assignmentId);
                    }
                    const status = assignmentStatuses[assignmentId] || 'pending';
                    if (!assignment) return null;
                    
                    return (
                      <div key={assignmentId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {assignment.date}
                            </div>
                            <Badge className="text-xs px-1.5 py-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 rounded-full text-[10px]">
                              {assignment.time}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {assignment.location}
                          </div>
                        </div>
                        <div className="flex items-center ml-3">
                          {status === 'pending' && (
                            <Loader2 className="h-4 w-4 text-orange-400 animate-spin" />
                          )}
                          {status === 'confirmed' && (
                            <Check className="h-4 w-4 text-green-500" />
                          )}
                          {status === 'declined' && (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Replacement Assignment Selection - Integrated */}
                {selectedAssignmentIds.some(id => assignmentStatuses[id] === 'declined') && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        <span className="bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">Ersatztermine auswählen</span>
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Wähle {selectedAssignmentIds.filter(id => assignmentStatuses[id] === 'declined').length} Ersatztermin{selectedAssignmentIds.filter(id => assignmentStatuses[id] === 'declined').length > 1 ? 'e' : ''} aus ({selectedReplacementIds.length}/{selectedAssignmentIds.filter(id => assignmentStatuses[id] === 'declined').length} ausgewählt)
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      {replacementAssignmentsMock.map((assignment) => {
                        const maxReplacements = selectedAssignmentIds.filter(id => assignmentStatuses[id] === 'declined').length;
                        const isSelected = selectedReplacementIds.includes(assignment.id);
                        const isDisabled = !isSelected && selectedReplacementIds.length >= maxReplacements;
                        
                        return (
                        <div
                          key={assignment.id}
                          className={`p-2.5 border rounded-lg transition-all relative min-h-[80px]
                                      ${isSelected 
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-md scale-[1.02] z-10 cursor-pointer' 
                                        : isDisabled
                                        ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 opacity-50 cursor-not-allowed z-0'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm z-0 cursor-pointer'}`}
                          onClick={() => !isDisabled && handleReplacementSelect(assignment.id)}
                        >
                          <button 
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 opacity-40 hover:opacity-100 transition-opacity"
                            onClick={(e) => handleAssignmentInfoClick(e, assignment)}
                            aria-label="Mehr Details"
                          >
                            <Info className="h-4 w-4" />
                          </button>
                          <div className="flex flex-col">
                            <div className="text-base font-medium text-gray-800 dark:text-gray-200 mb-1">
                              {assignment.date}
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {assignment.location}
                              </div>
                              <div className="relative inline-flex">
                                <div className="absolute inset-0 bg-white dark:bg-white opacity-30 rounded-full"></div>
                                <Badge className="relative text-xs font-medium px-1.5 py-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-sm whitespace-nowrap rounded-full text-[10px]">
                                  <span className="flex items-center">{assignment.time}</span>
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                    
                    <Button 
                      className="w-full mt-3 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-sm"
                      onClick={handleSubmitReplacement}
                      disabled={selectedReplacementIds.length === 0}
                    >
                      <Check className="mr-2 h-3 w-3" /> Auswahl bestätigen
                    </Button>
                  </div>
                )}
                

                
                {/* Show "Verstanden" button when all assignments are confirmed */}
                {selectedAssignmentIds.every(id => assignmentStatuses[id] === 'confirmed') && (
                  <Button 
                    className="w-full mt-4 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white"
                    onClick={() => {
                      setShowAssignmentConfirmation(true);
                      setTimeout(() => {
                        setShowAssignmentConfirmation(false);
                        setIsAssignmentCollapsed(false);
                        setSelectedAssignmentIds([]);
                        setAssignmentStatuses({});
                        setSelectedReplacementIds([]);
                        setReplacementStatuses({});
                        setShowReplacementAssignments(false);
                        setHasAvailableAssignments(false);
                      }, 7000);
                    }}
                  >
                    <Check className="mr-2 h-4 w-4" /> Verstanden
                  </Button>
                )}
                
                {/* Temp testing buttons */}
                {selectedReplacementIds.length === 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => handleTestAssignmentStatus('confirmed')}
                      >
                        Test: Bestätigt
                      </Button>
                      <Button 
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => handleTestAssignmentStatus('declined')}
                      >
                        Test: Abgelehnt
                      </Button>
                    </div>
                    <Button 
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={handleTestMixedAssignmentStatus}
                    >
                      Test: Nur eines von mehreren abgelehnt
                    </Button>
                  </div>
                )}
              </CardContent>
            </>
          )}
          </Card>
        ) : null}



        {/* Health Status Card - Always show this card */}
        <Card className="mb-6 border-gray-200 dark:border-gray-700 shadow-md overflow-hidden">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button 
              className={`flex-1 py-2.5 px-4 text-sm font-medium transition-colors relative ${
                activeTab === "krankheit" 
                  ? "text-red-600 dark:text-red-400 bg-gradient-to-t from-rose-50/50 to-transparent dark:from-rose-900/10 dark:to-transparent" 
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
              onClick={() => setActiveTab("krankheit")}
            >
              <div className="flex items-center justify-center">
                <Thermometer className="h-4 w-4 mr-2 ml-0.5" />
                Krankheit
                {isSickConfirmed && (
                  <span className="ml-1.5 w-2 h-2 bg-red-600 rounded-full"></span>
                )}
              </div>
              {activeTab === "krankheit" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 via-red-600 to-rose-600"></div>
              )}
            </button>
            <button 
              className={`flex-1 py-2.5 px-4 text-sm font-medium transition-colors relative ${
                activeTab === "notfall" 
                  ? "text-orange-600 dark:text-orange-400 bg-gradient-to-t from-orange-50/50 to-transparent dark:from-orange-900/10 dark:to-transparent" 
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
              onClick={() => setActiveTab("notfall")}
            >
              <div className="flex items-center justify-center">
                <AlertCircle className="h-4 w-4 mr-2 ml-0.5" />
                Notfall
              </div>
              {activeTab === "notfall" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"></div>
              )}
            </button>
          </div>
          
          <CardContent className={`p-4 ${activeTab === "krankheit" ? "bg-gradient-to-b from-rose-50/60 to-white dark:from-rose-900/10 dark:to-transparent" : "bg-gradient-to-b from-orange-50/60 to-white dark:from-orange-900/10 dark:to-transparent"}`}>
            {activeTab === "krankheit" && (
              <div className="bg-white/80 dark:bg-gray-900/30 rounded-lg p-4 shadow-sm">
                <div className="flex items-center mb-3 justify-center">
                  <Thermometer className="h-5 w-5 text-red-600 mr-2" />
                  <h3 className="text-sm font-medium text-red-600 dark:text-red-400">Krankenstand-Center</h3>
                  </div>
                
                <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg p-3 mb-3">
                  <div className="text-sm text-gray-700 dark:text-gray-300 mb-2 text-center">
                    <p className="mb-2 text-sm whitespace-nowrap">Bei Krankheit ruf bitte diese Nummer an:</p>
                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      <div>Mo-Do 7:30-17:00</div>
                      <div>Fr 7:30-14:00</div>
                      <div>Sa 9:00-12:00</div>
                        </div>
                            </div>
                  <a 
                    href="tel:+43699141630" 
                    className="flex items-center justify-center bg-white dark:bg-gray-800 p-2 rounded-lg border border-rose-100 dark:border-rose-800/50 mb-1.5 hover:bg-rose-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span className="font-medium text-base text-red-600 dark:text-red-400">+43 699 141 630</span>
                  </a>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    Nachdem du angerufen hast, drücke den Button, um einen Krankenstand zu beantragen.
                  </p>
                            </div>
                            
                {isSickConfirmed ? (
                  <div className="space-y-3">
                    <div className="w-full py-2 px-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-medium rounded-lg shadow-md flex items-center justify-center text-sm">
                      <div className="flex items-center">
                        <div className="relative mr-2">
                          <div className="absolute inset-0 rounded-full bg-green-200 dark:bg-green-700 animate-ping opacity-50"></div>
                          <CheckCircle2 className="h-4 w-4 relative" />
                            </div>
                        <span>Krankenstand bestätigt</span>
                          </div>
                        </div>
                    
                        <Button 
                      onClick={() => setShowDoctorNoteUpload(true)}
                      className="w-full py-2 px-3 bg-gradient-to-r from-red-500 via-red-600 to-rose-600 hover:from-red-600 hover:via-red-700 hover:to-rose-700 text-white font-medium rounded-lg shadow-md transition-all flex items-center justify-center text-sm"
                        >
                      <FileText className="h-4 w-4 mr-1.5" />
                      Krankenbestätigung hinzufügen
                        </Button>
                    

        </div>
                ) : !isWaitingForSickConfirmation ? (
        <button 
                    className="w-full py-2 px-3 bg-gradient-to-r from-red-500 via-red-600 to-rose-600 hover:from-red-600 hover:via-red-700 hover:to-rose-700 text-white font-medium rounded-lg shadow-md transition-all flex items-center justify-center text-sm"
                    onClick={() => setIsWaitingForSickConfirmation(true)}
        >
                    <Thermometer className="h-4 w-4 mr-1.5" />
                    Krankenstand anfordern
        </button>
                ) : (
                  <div className="space-y-3">
                    <div className="w-full py-2 px-3 bg-gray-100 dark:bg-gray-800 text-red-600 dark:text-red-400 font-medium rounded-lg shadow-md flex items-center justify-center text-sm">
                            <div className="flex items-center">
                        <span>Warten auf Bestätigung</span>
                        <span className="ml-1.5 flex">
                          <span className="animate-bounce mx-0.5 delay-0">.</span>
                          <span className="animate-bounce mx-0.5 delay-100">.</span>
                          <span className="animate-bounce mx-0.5 delay-200">.</span>
                        </span>
                              </div>
                      </div>
                      

                  </div>
                )}
              </div>
            )}
            
            {activeTab === "notfall" && (
              <div className="bg-white/80 dark:bg-gray-900/30 rounded-lg p-4 shadow-sm">
                <div className="flex items-center mb-3 justify-center">
                  <AlertCircle className="h-5 w-5 text-orange-500 mr-2" />
                  <h3 className="text-sm font-medium text-orange-600 dark:text-orange-400">Notfall-Center</h3>
                </div>
                
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 mb-3">
                  <div className="text-sm text-gray-700 dark:text-gray-300 mb-2 text-center">
                    <p className="mb-2">Im Notfall ruf bitte diese Nummer an:</p>
                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      <div>Mo-Do 7:30-17:00</div>
                      <div>Fr 7:30-14:00</div>
                      <div>Sa 9:00-12:00</div>
                    </div>
                  </div>
                  <a 
                    href="tel:+43699141630" 
                    className="flex items-center justify-center bg-white dark:bg-gray-800 p-2 rounded-lg border border-orange-100 dark:border-orange-800/50 mb-1.5 hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span className="font-medium text-base text-orange-600 dark:text-orange-400">+43 699 141 630</span>
                  </a>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    Nachdem du angerufen hast, drücke den Button, um einen Notfall zu beantragen.
                  </p>
                </div>
                
                {isEmergencyConfirmed ? (
                  <div className="w-full py-2 px-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-medium rounded-lg shadow-md flex items-center justify-center text-sm">
                    <div className="flex items-center">
                      <div className="relative mr-2">
                        <div className="absolute inset-0 rounded-full bg-green-200 dark:bg-green-700 animate-ping opacity-50"></div>
                        <CheckCircle2 className="h-4 w-4 relative" />
                      </div>
                      <span>Notfall bestätigt</span>
                    </div>
                  </div>
                ) : !isWaitingForEmergencyConfirmation ? (
                  <button 
                    className="w-full py-2 px-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg shadow-md transition-colors flex items-center justify-center text-sm"
                    onClick={() => setIsWaitingForEmergencyConfirmation(true)}
                  >
                    <AlertTriangle className="h-4 w-4 mr-1.5" />
                    Notfall anfordern
                  </button>
                ) : (
                  <div className="w-full py-2 px-3 bg-gray-100 dark:bg-gray-800 text-orange-600 dark:text-orange-400 font-medium rounded-lg shadow-md flex items-center justify-center text-sm">
                    <div className="flex items-center">
                      <span>Warten auf Bestätigung</span>
                      <span className="ml-1.5 flex">
                        <span className="animate-bounce mx-0.5 delay-0">.</span>
                        <span className="animate-bounce mx-0.5 delay-100">.</span>
                        <span className="animate-bounce mx-0.5 delay-200">.</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Equipment Ordering Card */}
        <Card className="mb-6 border-gray-200 dark:border-gray-700 shadow-md overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4">
            <CardTitle className="text-lg flex items-center">
              <Box className="mr-2 h-5 w-5" />
              Equipment bestellen
            </CardTitle>
            <CardDescription className="text-green-100">
              Bestelle Artikel für deinen nächsten Einsatz
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-4">
            {equipmentOrderStep === "list" ? (
              <div className="space-y-3 h-64 overflow-y-auto">
                {equipmentItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800/70 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedEquipment(item);
                      setEquipmentOrderStep("confirm");
                    }}
                  >
                    {/* Placeholder image container */}
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                    </div>
                    
                    {/* Item details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {item.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {item.description}
                      </p>
                    </div>
                    
                    {/* Arrow indicator */}
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Selected item display */}
                <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-200 to-green-300 dark:from-green-700 dark:to-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {selectedEquipment?.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedEquipment?.description}
                    </p>
                  </div>
                </div>
                
                {/* Quantity selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Anzahl
                  </label>
                  <div className="flex items-center justify-center space-x-6">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEquipmentQuantity(Math.max(1, equipmentQuantity - 1))}
                      disabled={equipmentQuantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <input
                      type="number"
                      min="1"
                      value={equipmentQuantity}
                      onChange={(e) => setEquipmentQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="text-lg font-medium w-16 text-center bg-transparent border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEquipmentQuantity(equipmentQuantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex space-x-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setEquipmentOrderStep("list");
                      setSelectedEquipment(null);
                      setEquipmentQuantity(1);
                    }}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Zurück
                  </Button>
                  <Button
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                    onClick={() => {
                      // Handle order submission here
                      console.log(`Ordered ${equipmentQuantity}x ${selectedEquipment?.name}`);
                      // Reset to list view
                      setEquipmentOrderStep("list");
                      setSelectedEquipment(null);
                      setEquipmentQuantity(1);
                    }}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Bestellen
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Anstehende Einsätze with Rotating Calendar - REMOVED (belongs only on main dashboard) */}

        {/* Quick Actions - REMOVED (belongs only on main dashboard) */}



      {/* Details Modal */}
      {showDetailsModal && (selectedProposal || selectedAssignment) && (
        <>
          <div 
            className="fixed inset-0 bg-black/30 z-[60] backdrop-blur-sm"
            onClick={() => setShowDetailsModal(false)}
          ></div>
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-lg shadow-xl z-[70] p-0 w-96 overflow-hidden">
            {/* Header section */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 text-white">
              <h3 className="text-lg font-medium flex items-center">
                <Briefcase className="h-5 w-5 mr-2" /> Einsatz Details
              </h3>
              <p className="text-sm text-blue-100 mt-1">
                {selectedProposal ? selectedProposal.date.split(' ')[0] + ' ' + selectedProposal.date.split(' ')[1] : selectedAssignment?.date} 
                <span className="relative inline-flex ml-1">
                <div className="absolute inset-0 bg-white dark:bg-white opacity-15 rounded-full"></div>
                  <span className="relative px-2 py-0.5 rounded-full">
                    {selectedProposal ? selectedProposal.date.split(' ')[2] : selectedAssignment?.time}
                  </span>
                </span>
              </p>
            </div>
            
            {/* Content section */}
            <div className="p-4 space-y-4">
              {/* Market name */}
              <div className="mb-1">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {selectedProposal ? selectedProposal.location : selectedAssignment?.location}
                </h4>
                <p 
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer mt-1 flex items-center"
                  onClick={() => handleAddressClick(selectedProposal ? selectedProposal.location : selectedAssignment?.location || '')}
                >
                  <MapPin className="h-4 w-4 mr-1.5 text-blue-500" />
                  {selectedProposal ? selectedProposal.location : selectedAssignment?.location}
                </p>
              </div>
              
              {/* Buddy pill - only show for proposals */}
              {selectedProposal && (
              <div className="flex items-center mt-3">
                <Badge className="text-xs font-medium px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-md whitespace-nowrap rounded-full">
                  <span className="flex items-center">Buddy: Cesira</span>
                </Badge>
              </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-3">
              <button 
                onClick={() => setShowDetailsModal(false)}
                className="w-full p-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Schließen
              </button>
            </div>
          </div>
        </>
      )}

      {/* Doctor Note Upload Modal */}
      {showDoctorNoteUpload && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" 
            onClick={() => setShowDoctorNoteUpload(false)}
          ></div>
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl z-50 w-[90vw] max-w-md overflow-hidden">
            {/* Header with red gradient */}
            <div className="relative bg-gradient-to-r from-red-500 via-red-600 to-rose-600 text-white p-6">
              <button 
                onClick={() => setShowDoctorNoteUpload(false)}
                className="absolute top-4 right-4 p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full mb-3">
                  <FileText className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-bold mb-1">Krankenbestätigung</h2>
                <p className="text-red-100 text-sm">Füge deine ärztliche Krankenbestätigung hinzu</p>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6">
              {!doctorNoteUploaded ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
                    Wähle eine Option, um deine Krankenbestätigung hinzuzufügen:
                  </p>
                  
                  <div className="flex flex-col space-y-3">
              <Button 
                      onClick={() => setDoctorNoteUploaded(true)}
                      className="w-full py-3 bg-gradient-to-r from-red-500 via-red-600 to-rose-600 hover:from-red-600 hover:via-red-700 hover:to-rose-700 text-white font-medium rounded-lg shadow-md transition-all flex items-center justify-center"
                    >
                      <Camera className="h-5 w-5 mr-2" />
                      Mit Kamera aufnehmen
                    </Button>
                    
                    <Button 
                      onClick={() => setDoctorNoteUploaded(true)}
                variant="outline"
                      className="w-full py-3 border-rose-200 dark:border-rose-700 text-red-600 dark:text-red-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 font-medium rounded-lg shadow-md transition-all flex items-center justify-center"
              >
                      <Image className="h-5 w-5 mr-2" />
                      Aus Galerie wählen
              </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
                      Erfolgreich hochgeladen
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Deine Krankenbestätigung wurde erfolgreich übermittelt.
                    </p>
                  </div>
              <Button 
                    onClick={() => setShowDoctorNoteUpload(false)}
                    className="w-full py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                  >
                    Schließen
              </Button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Early Start Reason Modal */}
      {showEarlyStartModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" 
            onClick={() => setShowEarlyStartModal(false)}
          ></div>
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl z-50 w-[90vw] max-w-md overflow-hidden">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6">
                  <button 
                onClick={() => setShowEarlyStartModal(false)}
                className="absolute top-4 right-4 p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
                  </button>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full mb-3">
                  <Clock className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-bold mb-1">Früher Start</h2>
                <p className="text-blue-100 text-sm">Du startest {minutesEarly} Minuten vor der geplanten Zeit</p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Grund für den frühen Start
                </label>
                <Textarea
                  value={earlyStartReason}
                  onChange={(e) => setEarlyStartReason(e.target.value)}
                  placeholder="Bitte gib einen Grund für den frühen Start an..."
                  className="w-full min-h-[100px] resize-none border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                </div>
                
              <div className="flex space-x-3">
                <Button 
                  variant="outline"
                  onClick={() => setShowEarlyStartModal(false)}
                  className="flex-1 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Abbrechen
                </Button>
                <Button 
                  onClick={handleEarlyStartSubmit}
                  disabled={!earlyStartReason.trim()}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Einsatz starten
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Early End Reason Modal */}
      {showEarlyEndModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" 
            onClick={() => setShowEarlyEndModal(false)}
          ></div>
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl z-50 w-[90vw] max-w-md overflow-hidden">
            {/* Header with red gradient */}
            <div className="relative bg-gradient-to-r from-red-500 via-red-600 to-rose-600 text-white p-6">
                  <button
                onClick={() => setShowEarlyEndModal(false)}
                className="absolute top-4 right-4 p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
                  </button>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full mb-3">
                  <StopCircle className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-bold mb-1">Früher Abschluss</h2>
                <p className="text-red-100 text-sm">Du beendest {minutesEarlyEnd} Minuten vor der geplanten Zeit</p>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Grund für das frühe Ende
                </label>
                <Textarea
                  value={earlyEndReason}
                  onChange={(e) => setEarlyEndReason(e.target.value)}
                  placeholder="Bitte gib einen Grund für das frühe Ende an..."
                  className="w-full min-h-[100px] resize-none border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex space-x-3">
                <Button 
                  variant="outline"
                  onClick={() => setShowEarlyEndModal(false)}
                  className="flex-1 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Abbrechen
                </Button>
                <Button 
                  onClick={handleEarlyEndSubmit}
                  disabled={!earlyEndReason.trim()}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
                  Einsatz beenden
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Maps Modal (copied from dashboard) */}
      {showMapsModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/30 z-[60] backdrop-blur-sm" // Ensure modal overlay is above footer but below modal content
            onClick={() => setShowMapsModal(false)}
          ></div>
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-lg shadow-xl z-[70] p-4 w-72">
            <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-gray-100">Wegbeschreibung zu</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{selectedAddress}</p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={openInGoogleMaps}
                className="flex items-center justify-center py-2.5 px-3 bg-white border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
              >
                <img src="/icons/google-maps-icon.svg" alt="Google Maps" width={20} height={20} className="mr-2"/>
                <span className="font-medium text-sm text-gray-800 dark:text-gray-200">Google Maps</span>
              </button>
              <button 
                onClick={openInAppleMaps}
                className="flex items-center justify-center py-2.5 px-3 bg-white border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
              >
                 <img src="/icons/apple-maps-icon.svg" alt="Apple Maps" width={20} height={20} className="mr-2"/>
                <span className="font-medium text-sm text-gray-800 dark:text-gray-200">Apple Maps</span>
              </button>
            </div>
            <button 
              onClick={() => setShowMapsModal(false)}
              className="w-full mt-3 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm text-gray-700 dark:text-gray-200"
            >
              Abbrechen
            </button>
          </div>
        </>
      )}
    </>
  );
} 