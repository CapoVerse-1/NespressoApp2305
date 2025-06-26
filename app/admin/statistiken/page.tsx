"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Settings, Send, FileText, Download, Phone, Crown, Check, Zap, Mail, ChevronDown, Copy, Edit, X, TrendingUp, PieChart, Percent, ChevronUp } from "lucide-react";
import { IoColorWandOutline } from "react-icons/io5";
import { FiSliders, FiSmile, FiThumbsUp, FiTrendingUp, FiMessageSquare, FiTrendingDown } from 'react-icons/fi';
import { CgSpinner } from 'react-icons/cg';
import * as XLSX from 'xlsx';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import AdminNavigation from "@/components/AdminNavigation";
import AdminEddieAssistant from "@/components/AdminEddieAssistant";

interface CardData {
  id: string;
  name: string;
  email: string;
  mcet: number;
  tma: number;
  vlShare: number;
}

interface HistoryCardData extends CardData {
  magicTouchCategory?: string;
  matchedPromoter?: string | null;
  generatedText?: string;
  sentAt?: Date;
}

export default function StatistikenPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState("overview");
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [magicTouchCategories, setMagicTouchCategories] = useState<Record<string, string>>({});
  const [generatingStates, setGeneratingStates] = useState<Record<string, boolean>>({});
  const [generatedStates, setGeneratedStates] = useState<Record<string, boolean>>({});
  const [copiedText, setCopiedText] = useState<Record<string, boolean>>({});
  const [editingStates, setEditingStates] = useState<Record<string, boolean>>({});
  const [editedTexts, setEditedTexts] = useState<Record<string, string>>({});
  const [generatingAll, setGeneratingAll] = useState(false);
  const shouldStopGenerationRef = useRef(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [cardData, setCardData] = useState<CardData[]>([]);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
  const [showCallsModal, setShowCallsModal] = useState(false);
  const [activeCallsTab, setActiveCallsTab] = useState("geplante");
  const [scheduledCalls, setScheduledCalls] = useState<{id: string, name: string, email: string}[]>([]);
  const [callHistory, setCallHistory] = useState<{id: string, name: string, email: string, completedAt: Date}[]>([]);
  const [showRanksModal, setShowRanksModal] = useState(false);
  const [activeRanksTab, setActiveRanksTab] = useState<"mcet" | "tma" | "vlshare">("mcet");
  const [recentlyScheduled, setRecentlyScheduled] = useState<{[key: string]: boolean}>({});
  const [matchedPromoters, setMatchedPromoters] = useState<{[cardId: string]: string | null}>({});
  const [showPromoterDropdown, setShowPromoterDropdown] = useState<{[cardId: string]: boolean}>({});
  const [promoterSearch, setPromoterSearch] = useState<{[cardId: string]: string}>({});
  const [validationStates, setValidationStates] = useState<Record<string, boolean>>({});
  const [historyCards, setHistoryCards] = useState<HistoryCardData[]>([]);
  const [pendingHistoryDelete, setPendingHistoryDelete] = useState<Record<string, boolean>>({});
  const [selectedPromoterFilter, setSelectedPromoterFilter] = useState("all");
  const [showPromoterFilterDropdown, setShowPromoterFilterDropdown] = useState(false);
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);
  const [chartTimeFilter, setChartTimeFilter] = useState<"3months" | "6months" | "1year" | "all">("all");

  // Sample promoter list for matching
  const availablePromoters = [
    "Max Mustermann",
    "Anna Schmidt", 
    "Peter Weber",
    "Lisa Mueller",
    "Tom Fischer",
    "Sarah Johnson",
    "Michael Brown",
    "Emma Wilson"
  ];

  // Promoters from admin/team page for filtering
  const teamPromoters = [
    "Sarah Schmidt",
    "Michael Weber",
    "Jan Müller", 
    "Lisa König",
    "Anna Bauer",
    "Tom Fischer"
  ];

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Color functions for KPI values - same as promoter statistics
  const getColorForMcEt = (value: number) => {
    if (value >= 4.5) return "text-green-600 dark:text-green-400"
    if (value >= 4.0) return "custom-orange"
    return "text-red-600 dark:text-red-400"
  }

  const getColorForTma = (value: number) => {
    if (value >= 75) return "text-green-600 dark:text-green-400"
    if (value >= 65) return "custom-orange"
    return "text-red-600 dark:text-red-400"
  }

  const getColorForVlShare = (value: number) => {
    if (value >= 10) return "text-green-600 dark:text-green-400"
    if (value >= 6) return "custom-orange"
    return "text-red-600 dark:text-red-400"
  }

  const getStyleForColor = (colorClass: string) => {
    if (colorClass === "custom-orange") {
      return { color: "#FD7E14" }
    }
    return {}
  }

  // Handle KPI container click to open stats modal
  const handleKPIClick = (card: CardData) => {
    setSelectedCard(card);
    setShowStatsModal(true);
  };

  // Excel processing function
  const processStatisticsExcel = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        
        // Process the data starting from row 2 (index 1) to skip headers
        const newCardData: any[] = [];
        
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          
          // Extract data from specific columns
          const name = row[0] || ''; // Column A
          const email = row[1] || ''; // Column B
          const mcet = parseFloat(row[8]) || 0; // Column I (index 8)
          const tma = (parseFloat(row[11]) || 0) * 100; // Column L (index 11) - multiply by 100 to convert from decimal to percentage
          const vlShare = (parseFloat(row[16]) || 0) * 100; // Column Q (index 16) - multiply by 100 to convert from decimal to percentage
          
          // Skip empty rows
          if (!name && !email) continue;
          
          // Generate ID from name
          const id = name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
          
          newCardData.push({
            id: id || `card_${i}`,
            name,
            email,
            mcet,
            tma,
            vlShare
          });
        }
        
        if (newCardData.length > 0) {
          setCardData(newCardData);
          console.log('Imported', newCardData.length, 'records');
        }
        
      } catch (error) {
        console.error('Error processing Excel file:', error);
        alert('Fehler beim Verarbeiten der Excel-Datei. Bitte überprüfen Sie das Format.');
      }
    };
    reader.readAsBinaryString(file);
  };

  // File handling functions
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processStatisticsExcel(file);
      setShowImportModal(false);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          file.type === 'application/vnd.ms-excel' ||
          file.name.endsWith('.xlsx') || 
          file.name.endsWith('.xls')) {
        processStatisticsExcel(file);
        setShowImportModal(false);
      } else {
        alert('Bitte wählen Sie eine Excel-Datei (.xlsx oder .xls)');
      }
    }
  };

  const handleEmailCopy = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(email);
      setTimeout(() => {
        setCopiedEmail(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy email:', err);
    }
  };

  const handleGenerateEmail = (cardId: string) => {
    setGeneratingStates(prev => ({ ...prev, [cardId]: true }));
    
    setTimeout(() => {
      setGeneratingStates(prev => ({ ...prev, [cardId]: false }));
      setGeneratedStates(prev => ({ ...prev, [cardId]: true }));
    }, 3000);
  };

  const handleCopyGeneratedText = async (cardId: string) => {
    try {
      const textToCopy = editedTexts[cardId] || getGeneratedEmailText();
      await navigator.clipboard.writeText(textToCopy);
      setCopiedText(prev => ({ ...prev, [cardId]: true }));
      setTimeout(() => {
        setCopiedText(prev => ({ ...prev, [cardId]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy generated text:', err);
    }
  };

  const handleEditText = (cardId: string) => {
    if (editingStates[cardId]) {
      // Save changes
      setEditingStates(prev => ({ ...prev, [cardId]: false }));
    } else {
      // Start editing
      if (!editedTexts[cardId]) {
        setEditedTexts(prev => ({ ...prev, [cardId]: getGeneratedEmailText() }));
      }
      setEditingStates(prev => ({ ...prev, [cardId]: true }));
    }
  };

  const handleTextChange = (cardId: string, newText: string) => {
    setEditedTexts(prev => ({ ...prev, [cardId]: newText }));
  };

  const handleValidateText = (cardId: string) => {
    setValidationStates(prev => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  const handleSendToHistory = () => {
    // Get all validated cards with their complete state
    const validatedCards = cardData.filter(card => 
      validationStates[card.id] && generatedStates[card.id]
    ).map(card => ({
      ...card,
      magicTouchCategory: magicTouchCategories[card.id],
      matchedPromoter: matchedPromoters[card.id],
      generatedText: editedTexts[card.id] || getGeneratedEmailText(),
      sentAt: new Date()
    }));
    
    // Add to history
    setHistoryCards(prev => [...prev, ...validatedCards]);
    
    // Remove from current cards
    const validatedCardIds = validatedCards.map(card => card.id);
    setCardData(prev => prev.filter(card => !validatedCardIds.includes(card.id)));
    
    // Clean up states for moved cards
    validatedCardIds.forEach(cardId => {
      setValidationStates(prev => {
        const newState = { ...prev };
        delete newState[cardId];
        return newState;
      });
      setGeneratedStates(prev => {
        const newState = { ...prev };
        delete newState[cardId];
        return newState;
      });
      setGeneratingStates(prev => {
        const newState = { ...prev };
        delete newState[cardId];
        return newState;
      });
      setEditedTexts(prev => {
        const newState = { ...prev };
        delete newState[cardId];
        return newState;
      });
      setEditingStates(prev => {
        const newState = { ...prev };
        delete newState[cardId];
        return newState;
      });
      setMagicTouchCategories(prev => {
        const newState = { ...prev };
        delete newState[cardId];
        return newState;
      });
      setMatchedPromoters(prev => {
        const newState = { ...prev };
        delete newState[cardId];
        return newState;
      });
    });
  };

  const handleRegenerateEmail = (cardId: string) => {
    // Collapse the card and show generating state like initial generation
    setGeneratedStates(prev => ({ ...prev, [cardId]: false }));
    setGeneratingStates(prev => ({ ...prev, [cardId]: true }));
    
    setTimeout(() => {
      setGeneratingStates(prev => ({ ...prev, [cardId]: false }));
      setGeneratedStates(prev => ({ ...prev, [cardId]: true }));
      setEditedTexts(prev => ({ ...prev, [cardId]: getGeneratedEmailText() }));
    }, 3000);
  };

  const getGeneratedEmailText = () => {
    return `Liebe Ulrike,

ich darf dir heute deine Mai KPIs zukommen lassen.

Trotz der stabilen Marktlage machst du das Beste draus und dafür ein großes Dankeschön unsererseits. 😊

Hier ein Rückblick auf deine Mai-Zahlen:

MC/ET: 7.3 (Platz 1)
TMA Anteil: 94%
VL Share: 23% (Platz 2)

Du hast im Mai mit deinem MC/ET den ersten Platz erreicht – eine wirklich beeindruckende Leistung! Deine hohe Verkaufszahl spiegelt dein Engagement wider und zeigt, dass du genau weißt, wie man Kunden begeistert. Auch dein VL Share ist mit Platz 2 bemerkenswert und zeigt, dass du einen hervorragenden Job machst. Beim TMA-Anteil gehörst du zu den Besten, was zeigt, wie effektiv du die Kundenbindung vor Ort gestaltest.

Mach weiter so, deine Arbeit ist inspirierend!

Liebe Grüße, dein Nespresso Team`;
  };

  const handleGenerateAllEmails = async () => {
    // If currently generating, stop the process
    if (generatingAll) {
      shouldStopGenerationRef.current = true;
      setGeneratingAll(false);
      return;
    }
    
    setGeneratingAll(true);
    shouldStopGenerationRef.current = false;
    const cardIds = cardData.map(card => card.id);
    
    for (const cardId of cardIds) {
      // Check if generation should stop
      if (shouldStopGenerationRef.current) break;
      
      // Skip if already generated
      if (generatedStates[cardId]) continue;
      
      // Start generating this card
      setGeneratingStates(prev => ({ ...prev, [cardId]: true }));
      
      // Wait for 3 seconds (let current card finish completely)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mark as generated and stop generating
      setGeneratingStates(prev => ({ ...prev, [cardId]: false }));
      setGeneratedStates(prev => ({ ...prev, [cardId]: true }));
      
      // Check if generation should stop after current card completes
      if (shouldStopGenerationRef.current) {
        break;
      }
    }
    
    setGeneratingAll(false);
    shouldStopGenerationRef.current = false;
  };

  const categories = [
    { name: 'Neutral', color: '#f8f9fa', bgColor: '#f8f9fa', borderColor: '#e9ecef', icon: <FiSliders className="h-3 w-3" /> },
    { name: 'Beeindruckt', color: '#d1f7eb', bgColor: '#d1f7eb', borderColor: '#a7f3d0', icon: <FiSmile className="h-3 w-3" /> },
    { name: 'Zufrieden', color: '#fff0c7', bgColor: '#fff0c7', borderColor: '#fde68a', icon: <FiThumbsUp className="h-3 w-3" /> },
    { name: 'Verbesserung', color: '#d7ecfb', bgColor: '#d7ecfb', borderColor: '#bfdbfe', icon: <FiTrendingUp className="h-3 w-3" /> },
    { name: 'Motivierend (unzufrieden)', color: '#eadaff', bgColor: '#eadaff', borderColor: '#ddd6fe', icon: <FiMessageSquare className="h-3 w-3" /> },
    { name: 'Verschlechterung', color: '#ffe3e3', bgColor: '#ffe3e3', borderColor: '#fecaca', icon: <FiTrendingDown className="h-3 w-3" /> }
  ];

  const handleMagicTouchClick = (cardId: string) => {
    setOpenDropdown(openDropdown === cardId ? null : cardId);
  };

  const handleCategorySelect = (cardId: string, category: string) => {
    setMagicTouchCategories(prev => ({ ...prev, [cardId]: category }));
    setOpenDropdown(null);
  };

  const getMagicTouchStyle = (cardId: string) => {
    const selectedCategory = magicTouchCategories[cardId];
    if (!selectedCategory) return {};
    
    // If Neutral is selected, return empty object to use default styling
    if (selectedCategory === 'Neutral') return {};
    
    const category = categories.find(c => c.name === selectedCategory);
    if (!category) return {};
    
    // Convert hex to rgba with 80% opacity for background
    const hexToRgba = (hex: string, alpha: number) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };
    
    return { 
      backgroundColor: hexToRgba(category.bgColor, 0.8),
      borderColor: category.borderColor,
      boxShadow: `0 1px 3px 0 ${category.borderColor}40, 0 1px 2px 0 ${category.borderColor}60`
    };
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Close magic touch dropdown
      if (!target.closest('.magic-touch-dropdown')) {
        setOpenDropdown(null);
      }
      
      // Close promoter dropdown
      if (!target.closest('[data-promoter-dropdown]')) {
        setShowPromoterDropdown({});
      }
      
      // Close promoter filter dropdown in stats modal
      if (!target.closest('.promoter-filter-dropdown')) {
        setShowPromoterFilterDropdown(false);
      }
    };

    if (openDropdown || Object.values(showPromoterDropdown).some(Boolean) || showPromoterFilterDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openDropdown, showPromoterDropdown, showPromoterFilterDropdown]);

  const handleScheduleCall = (card: CardData) => {
    // Check if already scheduled
    if (!scheduledCalls.find(call => call.id === card.id)) {
      setScheduledCalls(prev => [...prev, { id: card.id, name: card.name, email: card.email }]);
    }
    
    // Show green check for 2 seconds
    setRecentlyScheduled(prev => ({ ...prev, [card.id]: true }));
    setTimeout(() => {
      setRecentlyScheduled(prev => ({ ...prev, [card.id]: false }));
    }, 2000);
  };

  const handleCompleteCall = (callId: string) => {
    const call = scheduledCalls.find(c => c.id === callId);
    if (call) {
      // Move to history
      setCallHistory(prev => [...prev, { ...call, completedAt: new Date() }]);
      // Remove from scheduled
      setScheduledCalls(prev => prev.filter(c => c.id !== callId));
    }
  };

  const handleDeleteScheduledCall = (callId: string) => {
    setScheduledCalls(prev => prev.filter(c => c.id !== callId));
  };

  const handleDeleteHistoryCard = (cardId: string) => {
    if (pendingHistoryDelete[cardId]) {
      // Second click - delete the card
      setHistoryCards(prev => prev.filter(card => card.id !== cardId));
      setPendingHistoryDelete(prev => {
        const newState = { ...prev };
        delete newState[cardId];
        return newState;
      });
    } else {
      // First click - start wobble and set pending state
      setPendingHistoryDelete(prev => ({ ...prev, [cardId]: true }));
      
      // Clear pending state after 2 seconds
      setTimeout(() => {
        setPendingHistoryDelete(prev => {
          const newState = { ...prev };
          delete newState[cardId];
          return newState;
        });
      }, 2000);
    }
  };

  const handleDeleteCard = (cardId: string) => {
    setCardData(prev => prev.filter(card => card.id !== cardId));
    // Also remove from scheduled calls and call history if present
    setScheduledCalls(prev => prev.filter(c => c.id !== cardId));
    setCallHistory(prev => prev.filter(c => c.id !== cardId));
    // Clean up any related states
    setGeneratedStates(prev => {
      const newState = { ...prev };
      delete newState[cardId];
      return newState;
    });
    setGeneratingStates(prev => {
      const newState = { ...prev };
      delete newState[cardId];
      return newState;
    });
    setEditedTexts(prev => {
      const newState = { ...prev };
      delete newState[cardId];
      return newState;
    });
    setEditingStates(prev => {
      const newState = { ...prev };
      delete newState[cardId];
      return newState;
    });
  };

  // Handle promoter matching functionality
  const handlePromoterContainerClick = (cardId: string) => {
    // Toggle dropdown regardless of whether a promoter is matched
    setShowPromoterDropdown(prev => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  const handlePromoterSelect = (cardId: string, promoterName: string) => {
    setMatchedPromoters(prev => ({ ...prev, [cardId]: promoterName }));
    setShowPromoterDropdown(prev => ({ ...prev, [cardId]: false }));
    setPromoterSearch(prev => ({ ...prev, [cardId]: '' }));
  };

  const getPromoterMatchStatus = (cardName: string) => {
    // Simple name matching logic - check if card name exists in available promoters
    const matchedPromoter = availablePromoters.find(promoter => 
      promoter.toLowerCase() === cardName.toLowerCase()
    );
    return matchedPromoter || null;
  };

  // Auto-match promoters when card data changes
  useEffect(() => {
    const newMatches: {[cardId: string]: string | null} = {};
    cardData.forEach(card => {
      if (!matchedPromoters[card.id]) {
        const match = getPromoterMatchStatus(card.name);
        newMatches[card.id] = match;
      }
    });
    
    if (Object.keys(newMatches).length > 0) {
      setMatchedPromoters(prev => ({ ...prev, ...newMatches }));
    }
  }, [cardData]);

  const getSortedLeaderboard = (metric: "mcet" | "tma" | "vlshare") => {
    return [...cardData]
      .sort((a, b) => {
        if (metric === "mcet") return b.mcet - a.mcet;
        if (metric === "tma") return b.tma - a.tma;
        if (metric === "vlshare") return b.vlShare - a.vlShare;
        return 0;
      })
      .map((card, index) => ({
        ...card,
        rank: index + 1
      }));
  };

  const getLeaderboardItemStyling = (rank: number, metric: "mcet" | "tma" | "vlshare", value: number) => {
    if (rank === 1) {
      return 'border-yellow-200/50 bg-gradient-to-r from-yellow-50/20 to-amber-50/20 hover:from-yellow-50/40 hover:to-amber-50/40';
    }
    if (rank === 2) {
      return 'border-gray-200/50 bg-gradient-to-r from-gray-50/20 to-slate-50/20 hover:from-gray-50/40 hover:to-slate-50/40';
    }
    if (rank === 3) {
      return 'border-amber-200/50 bg-gradient-to-r from-amber-50/20 to-orange-50/20 hover:from-amber-50/40 hover:to-orange-50/40';
    }
    
    // For rank 4+, use color based on KPI value
    const colorClass = metric === "mcet" ? getColorForMcEt(value) : 
                      metric === "tma" ? getColorForTma(value) : 
                      getColorForVlShare(value);
    
    if (colorClass === "text-green-600 dark:text-green-400") {
      return 'border-green-200/50 bg-gradient-to-r from-green-50/20 to-emerald-50/20 hover:from-green-50/40 hover:to-emerald-50/40';
    }
    if (colorClass === "custom-orange") {
      return 'border-orange-200/50 bg-gradient-to-r from-orange-50/20 to-amber-50/20 hover:from-orange-50/40 hover:to-amber-50/40';
    }
    return 'border-red-200/50 bg-gradient-to-r from-red-50/20 to-rose-50/20 hover:from-red-50/40 hover:to-rose-50/40';
  };

  const getRankIconStyle = (rank: number) => {
    if (rank === 1) {
      return { background: 'linear-gradient(135deg, #EEB34B 0%, #FFED99 25%, #FCD33D 50%, #FAF995 75%, #EFC253 100%)' };
    }
    if (rank === 2) {
      return { background: 'linear-gradient(135deg, #DEDFE1 0%, #BCBDC1 25%, #ECEEED 75%, #B6BCBC 100%)' };
    }
    if (rank === 3) {
      return { background: 'linear-gradient(135deg, #BD965D 0%, #99774A 25%, #DEBF93 75%, #AC9071 100%)' };
    }
    return { background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' };
  };

  // Get magic touch style for history cards
  const getHistoryMagicTouchStyle = (magicTouchCategory?: string) => {
    if (!magicTouchCategory) return {};
    
    // If Neutral is selected, return empty object to use default styling
    if (magicTouchCategory === 'Neutral') return {};
    
    const category = categories.find(c => c.name === magicTouchCategory);
    if (!category) return {};
    
    // Convert hex to rgba with 80% opacity for background
    const hexToRgba = (hex: string, alpha: number) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };
    
    return { 
      backgroundColor: hexToRgba(category.bgColor, 0.8),
      borderColor: category.borderColor,
      boxShadow: `0 1px 3px 0 ${category.borderColor}40, 0 1px 2px 0 ${category.borderColor}60`
    };
  };

  // Group history cards by date
  const groupCardsByDate = (cards: HistoryCardData[]) => {
    // Sort cards by sentAt date (newest first)
    const sortedCards = [...cards].sort((a, b) => {
      if (!a.sentAt || !b.sentAt) return 0;
      return b.sentAt.getTime() - a.sentAt.getTime();
    });

    // Group by date
    const grouped: { [date: string]: HistoryCardData[] } = {};
    sortedCards.forEach(card => {
      if (card.sentAt) {
        const dateKey = card.sentAt.toLocaleDateString('de-DE');
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(card);
      }
    });

    return grouped;
  };

  const calculateAverages = (timeframe: "alltime" | "30days" | "6months") => {
    if (historyCards.length === 0) {
      return {
        mcet: "N/A",
        tma: "N/A", 
        vlShare: "N/A",
        count: 0
      };
    }

    let relevantCards = historyCards;

    if (timeframe === "30days") {
      // Get the last wave (group of cards sent within 3 days of each other)
      const sortedCards = [...historyCards].sort((a, b) => 
        new Date(b.sentAt!).getTime() - new Date(a.sentAt!).getTime()
      );
      
      if (sortedCards.length > 0) {
        const lastSentDate = new Date(sortedCards[0].sentAt!);
        const threeDaysAgo = new Date(lastSentDate.getTime() - (3 * 24 * 60 * 60 * 1000));
        
        relevantCards = sortedCards.filter(card => 
          new Date(card.sentAt!) >= threeDaysAgo
        );
      }
    } else if (timeframe === "6months") {
      // Group cards by waves (within 3 days of each other) and take last 6 waves
      const sortedCards = [...historyCards].sort((a, b) => 
        new Date(b.sentAt!).getTime() - new Date(a.sentAt!).getTime()
      );
      
      const waves: HistoryCardData[][] = [];
      let currentWave: HistoryCardData[] = [];
      let lastDate: Date | null = null;
      
      for (const card of sortedCards) {
        const cardDate = new Date(card.sentAt!);
        
        if (!lastDate || (lastDate.getTime() - cardDate.getTime()) > (3 * 24 * 60 * 60 * 1000)) {
          // Start new wave
          if (currentWave.length > 0) {
            waves.push([...currentWave]);
          }
          currentWave = [card];
          lastDate = cardDate;
        } else {
          // Add to current wave
          currentWave.push(card);
        }
      }
      
      if (currentWave.length > 0) {
        waves.push(currentWave);
      }
      
      // Take last 6 waves
      const last6Waves = waves.slice(0, 6);
      relevantCards = last6Waves.flat();
    }

    // Calculate averages
    const count = relevantCards.length;
    const avgMcet = relevantCards.reduce((sum, card) => sum + card.mcet, 0) / count;
    const avgTma = relevantCards.reduce((sum, card) => sum + card.tma, 0) / count;
    const avgVlShare = relevantCards.reduce((sum, card) => sum + card.vlShare, 0) / count;

    return {
      mcet: avgMcet.toFixed(1),
      tma: avgTma.toFixed(1),
      vlShare: avgVlShare.toFixed(1),
      count
    };
  };

  const calculateWaveChanges = () => {
    if (historyCards.length === 0) {
      return {
        mcet: null,
        tma: null,
        vlShare: null
      };
    }

    // Group cards by waves (within 3 days of each other)
    const sortedCards = [...historyCards].sort((a, b) => 
      new Date(b.sentAt!).getTime() - new Date(a.sentAt!).getTime()
    );
    
    const waves: HistoryCardData[][] = [];
    let currentWave: HistoryCardData[] = [];
    let lastDate: Date | null = null;
    
    for (const card of sortedCards) {
      const cardDate = new Date(card.sentAt!);
      
      if (!lastDate || (lastDate.getTime() - cardDate.getTime()) > (3 * 24 * 60 * 60 * 1000)) {
        // Start new wave
        if (currentWave.length > 0) {
          waves.push([...currentWave]);
        }
        currentWave = [card];
        lastDate = cardDate;
      } else {
        // Add to current wave
        currentWave.push(card);
      }
    }
    
    if (currentWave.length > 0) {
      waves.push(currentWave);
    }

    // Need at least 2 waves to compare
    if (waves.length < 2) {
      return {
        mcet: null,
        tma: null,
        vlShare: null
      };
    }

    // Calculate averages for last 2 waves
    const lastWave = waves[0];
    const secondLastWave = waves[1];

    const lastAvgs = {
      mcet: lastWave.reduce((sum, card) => sum + card.mcet, 0) / lastWave.length,
      tma: lastWave.reduce((sum, card) => sum + card.tma, 0) / lastWave.length,
      vlShare: lastWave.reduce((sum, card) => sum + card.vlShare, 0) / lastWave.length
    };

    const secondLastAvgs = {
      mcet: secondLastWave.reduce((sum, card) => sum + card.mcet, 0) / secondLastWave.length,
      tma: secondLastWave.reduce((sum, card) => sum + card.tma, 0) / secondLastWave.length,
      vlShare: secondLastWave.reduce((sum, card) => sum + card.vlShare, 0) / secondLastWave.length
    };

    // Calculate percentage changes
    const mcetChange = ((lastAvgs.mcet - secondLastAvgs.mcet) / secondLastAvgs.mcet) * 100;
    const tmaChange = ((lastAvgs.tma - secondLastAvgs.tma) / secondLastAvgs.tma) * 100;
    const vlShareChange = ((lastAvgs.vlShare - secondLastAvgs.vlShare) / secondLastAvgs.vlShare) * 100;

    return {
      mcet: mcetChange,
      tma: tmaChange,
      vlShare: vlShareChange
    };
  };

  const calculate6MonthsWaveChanges = () => {
    if (historyCards.length === 0) {
      return {
        mcet: null,
        tma: null,
        vlShare: null
      };
    }

    // Group cards by waves (within 3 days of each other)
    const sortedCards = [...historyCards].sort((a, b) => 
      new Date(b.sentAt!).getTime() - new Date(a.sentAt!).getTime()
    );
    
    const waves: HistoryCardData[][] = [];
    let currentWave: HistoryCardData[] = [];
    let lastDate: Date | null = null;
    
    for (const card of sortedCards) {
      const cardDate = new Date(card.sentAt!);
      
      if (!lastDate || (lastDate.getTime() - cardDate.getTime()) > (3 * 24 * 60 * 60 * 1000)) {
        // Start new wave
        if (currentWave.length > 0) {
          waves.push([...currentWave]);
        }
        currentWave = [card];
        lastDate = cardDate;
      } else {
        // Add to current wave
        currentWave.push(card);
      }
    }
    
    if (currentWave.length > 0) {
      waves.push(currentWave);
    }

    // Need at least 7 waves to compare (current + 6 waves ago)
    if (waves.length < 7) {
      return {
        mcet: null,
        tma: null,
        vlShare: null
      };
    }

    // Calculate averages for current wave and 6 waves ago
    const currentWave_calc = waves[0];
    const sixWavesAgo = waves[6];

    const currentAvgs = {
      mcet: currentWave_calc.reduce((sum, card) => sum + card.mcet, 0) / currentWave_calc.length,
      tma: currentWave_calc.reduce((sum, card) => sum + card.tma, 0) / currentWave_calc.length,
      vlShare: currentWave_calc.reduce((sum, card) => sum + card.vlShare, 0) / currentWave_calc.length
    };

    const sixWavesAgoAvgs = {
      mcet: sixWavesAgo.reduce((sum, card) => sum + card.mcet, 0) / sixWavesAgo.length,
      tma: sixWavesAgo.reduce((sum, card) => sum + card.tma, 0) / sixWavesAgo.length,
      vlShare: sixWavesAgo.reduce((sum, card) => sum + card.vlShare, 0) / sixWavesAgo.length
    };

    // Calculate percentage changes
    const mcetChange = ((currentAvgs.mcet - sixWavesAgoAvgs.mcet) / sixWavesAgoAvgs.mcet) * 100;
    const tmaChange = ((currentAvgs.tma - sixWavesAgoAvgs.tma) / sixWavesAgoAvgs.tma) * 100;
    const vlShareChange = ((currentAvgs.vlShare - sixWavesAgoAvgs.vlShare) / sixWavesAgoAvgs.vlShare) * 100;

    return {
      mcet: mcetChange,
      tma: tmaChange,
      vlShare: vlShareChange
    };
  };

  // Generate chart data for trend visualization
  const generateChartData = () => {
    // Only show chart data if there are actual history cards
    if (historyCards.length === 0) {
      return [];
    }

    // Filter cards based on time filter
    const now = new Date();
    const filteredCards = historyCards.filter(card => {
      if (!card.sentAt || chartTimeFilter === "all") return true;
      
      const monthsAgo = chartTimeFilter === "3months" ? 3 : chartTimeFilter === "6months" ? 6 : 12;
      const cutoffDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
      return card.sentAt >= cutoffDate;
    });

    // Group history cards by month-year and calculate averages
    const monthlyData: Record<string, { mcet: number[], tma: number[], vlShare: number[], date: Date }> = {};
    
    filteredCards.forEach(card => {
      if (card.sentAt) {
        const monthKey = card.sentAt.toLocaleDateString('de-DE', { month: 'short', year: 'numeric' });
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { 
            mcet: [], 
            tma: [], 
            vlShare: [], 
            date: new Date(card.sentAt.getFullYear(), card.sentAt.getMonth(), 1)
          };
        }
        
        monthlyData[monthKey].mcet.push(card.mcet);
        monthlyData[monthKey].tma.push(card.tma);
        monthlyData[monthKey].vlShare.push(card.vlShare);
      }
    });

    // Convert to chart format with averages and sort by date
    const chartData = Object.entries(monthlyData).map(([month, data]) => ({
      month: month.replace(' 2024', ''), // Remove year for cleaner display
      mcet: parseFloat((data.mcet.reduce((sum, val) => sum + val, 0) / data.mcet.length).toFixed(1)),
      tma: parseFloat((data.tma.reduce((sum, val) => sum + val, 0) / data.tma.length).toFixed(1)),
      vlShare: parseFloat((data.vlShare.reduce((sum, val) => sum + val, 0) / data.vlShare.length).toFixed(1)),
      sortDate: data.date
    })).sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime());

    // Limit to maximum 12 data points, showing newest
    const maxPoints = 12;
    if (chartData.length > maxPoints) {
      return chartData.slice(-maxPoints);
    }
    
    return chartData;
  };

  // Get PDF color for KPI values
  const getPdfColor = (type: 'mcet' | 'tma' | 'vlshare', value: number) => {
    if (type === 'mcet') {
      if (value >= 4.5) return [22, 163, 74]; // green
      if (value >= 4.0) return [253, 126, 20]; // orange
      return [220, 38, 38]; // red
    } else if (type === 'tma') {
      if (value >= 75) return [22, 163, 74]; // green
      if (value >= 65) return [253, 126, 20]; // orange
      return [220, 38, 38]; // red
    } else { // vlshare
      if (value >= 10) return [22, 163, 74]; // green
      if (value >= 6) return [253, 126, 20]; // orange
      return [220, 38, 38]; // red
    }
  };

  // Generate PDF of the chart and statistics
  const generatePDF = async () => {
    const pdf = new jsPDF('landscape', 'mm', 'a4');
    
    // A4 landscape dimensions: 297mm x 210mm
    const pageWidth = 297;
    const pageHeight = 210;
    
    // Add header
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Nespresso CA KPI Graph Export', 20, 25);
    
    // Add export date to top right
    const currentDate = new Date().toLocaleDateString('de-DE', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    pdf.text(currentDate, 270, 25);
    
    // Reset text color
    pdf.setTextColor(0, 0, 0);
    
    // Add statistics in horizontal layout (three pyramids side by side)
    let yPosition = 45;
    
    // Get all statistics data
    const allTimeStats = calculateAverages("alltime");
    const thirtyDaysStats = calculateAverages("30days");
    const waveChanges = calculateWaveChanges();
    const sixMonthsStats = calculateAverages("6months");
    const sixMonthChanges = calculate6MonthsWaveChanges();
    
    // Define column widths and positions
    const columnWidth = 90;
    const col1X = 20;
    const col2X = col1X + columnWidth;
    const col3X = col2X + columnWidth;
    
    // Column Headers
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`All Time (${allTimeStats.count}):`, col1X, yPosition);
    pdf.text(`Last 30 Days (${thirtyDaysStats.count}):`, col2X, yPosition);
    pdf.text(`Last 6 Months (${sixMonthsStats.count}):`, col3X, yPosition);
    
    yPosition += 8;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    // MC/ET Row - All Time
    pdf.text('Avg MC/ET: ', col1X, yPosition);
    if (allTimeStats.mcet !== "N/A") {
      const mcetValue = parseFloat(allTimeStats.mcet);
      const mcetColor = getPdfColor('mcet', mcetValue);
      pdf.setTextColor(mcetColor[0], mcetColor[1], mcetColor[2]);
      pdf.text(allTimeStats.mcet, col1X + 20, yPosition);
      pdf.setTextColor(0, 0, 0);
    } else {
      pdf.text(allTimeStats.mcet, col1X + 20, yPosition);
    }
    
    // MC/ET Row - 30 Days
    pdf.text('Avg MC/ET: ', col2X, yPosition);
    if (thirtyDaysStats.mcet !== "N/A") {
      const mcetValue = parseFloat(thirtyDaysStats.mcet);
      const mcetColor = getPdfColor('mcet', mcetValue);
      pdf.setTextColor(mcetColor[0], mcetColor[1], mcetColor[2]);
      pdf.text(thirtyDaysStats.mcet, col2X + 20, yPosition);
      pdf.setTextColor(0, 0, 0);
      if (waveChanges.mcet !== null) {
        pdf.text(`(${waveChanges.mcet >= 0 ? '+' : ''}${waveChanges.mcet.toFixed(0)}%)`, col2X + 35, yPosition);
      }
    } else {
      pdf.text(thirtyDaysStats.mcet, col2X + 20, yPosition);
    }
    
    // MC/ET Row - 6 Months
    pdf.text('Avg MC/ET: ', col3X, yPosition);
    if (sixMonthsStats.mcet !== "N/A") {
      const mcetValue = parseFloat(sixMonthsStats.mcet);
      const mcetColor = getPdfColor('mcet', mcetValue);
      pdf.setTextColor(mcetColor[0], mcetColor[1], mcetColor[2]);
      pdf.text(sixMonthsStats.mcet, col3X + 20, yPosition);
      pdf.setTextColor(0, 0, 0);
      if (sixMonthChanges.mcet !== null) {
        pdf.text(`(${sixMonthChanges.mcet >= 0 ? '+' : ''}${sixMonthChanges.mcet.toFixed(0)}%)`, col3X + 35, yPosition);
      }
    } else {
      pdf.text(sixMonthsStats.mcet, col3X + 20, yPosition);
    }
    
    yPosition += 8;
    
    // TMA Row - All Time
    pdf.text('Avg TMA: ', col1X, yPosition);
    if (allTimeStats.tma !== "N/A") {
      const tmaValue = parseFloat(allTimeStats.tma);
      const tmaColor = getPdfColor('tma', tmaValue);
      pdf.setTextColor(tmaColor[0], tmaColor[1], tmaColor[2]);
      pdf.text(`${allTimeStats.tma}%`, col1X + 17, yPosition);
      pdf.setTextColor(0, 0, 0);
    } else {
      pdf.text(allTimeStats.tma, col1X + 17, yPosition);
    }
    
    // TMA Row - 30 Days
    pdf.text('Avg TMA: ', col2X, yPosition);
    if (thirtyDaysStats.tma !== "N/A") {
      const tmaValue = parseFloat(thirtyDaysStats.tma);
      const tmaColor = getPdfColor('tma', tmaValue);
      pdf.setTextColor(tmaColor[0], tmaColor[1], tmaColor[2]);
      pdf.text(`${thirtyDaysStats.tma}%`, col2X + 17, yPosition);
      pdf.setTextColor(0, 0, 0);
      if (waveChanges.tma !== null) {
        pdf.text(`(${waveChanges.tma >= 0 ? '+' : ''}${waveChanges.tma.toFixed(0)}%)`, col2X + 32, yPosition);
      }
    } else {
      pdf.text(thirtyDaysStats.tma, col2X + 17, yPosition);
    }
    
    // TMA Row - 6 Months
    pdf.text('Avg TMA: ', col3X, yPosition);
    if (sixMonthsStats.tma !== "N/A") {
      const tmaValue = parseFloat(sixMonthsStats.tma);
      const tmaColor = getPdfColor('tma', tmaValue);
      pdf.setTextColor(tmaColor[0], tmaColor[1], tmaColor[2]);
      pdf.text(`${sixMonthsStats.tma}%`, col3X + 17, yPosition);
      pdf.setTextColor(0, 0, 0);
      if (sixMonthChanges.tma !== null) {
        pdf.text(`(${sixMonthChanges.tma >= 0 ? '+' : ''}${sixMonthChanges.tma.toFixed(0)}%)`, col3X + 32, yPosition);
      }
    } else {
      pdf.text(sixMonthsStats.tma, col3X + 17, yPosition);
    }
    
    yPosition += 8;
    
    // VL Share Row - All Time
    pdf.text('Avg VL Share: ', col1X, yPosition);
    if (allTimeStats.vlShare !== "N/A") {
      const vlValue = parseFloat(allTimeStats.vlShare);
      const vlColor = getPdfColor('vlshare', vlValue);
      pdf.setTextColor(vlColor[0], vlColor[1], vlColor[2]);
      pdf.text(`${allTimeStats.vlShare}%`, col1X + 25, yPosition);
      pdf.setTextColor(0, 0, 0);
    } else {
      pdf.text(allTimeStats.vlShare, col1X + 25, yPosition);
    }
    
    // VL Share Row - 30 Days
    pdf.text('Avg VL Share: ', col2X, yPosition);
    if (thirtyDaysStats.vlShare !== "N/A") {
      const vlValue = parseFloat(thirtyDaysStats.vlShare);
      const vlColor = getPdfColor('vlshare', vlValue);
      pdf.setTextColor(vlColor[0], vlColor[1], vlColor[2]);
      pdf.text(`${thirtyDaysStats.vlShare}%`, col2X + 25, yPosition);
      pdf.setTextColor(0, 0, 0);
      if (waveChanges.vlShare !== null) {
        pdf.text(`(${waveChanges.vlShare >= 0 ? '+' : ''}${waveChanges.vlShare.toFixed(0)}%)`, col2X + 40, yPosition);
      }
    } else {
      pdf.text(thirtyDaysStats.vlShare, col2X + 25, yPosition);
    }
    
    // VL Share Row - 6 Months
    pdf.text('Avg VL Share: ', col3X, yPosition);
    if (sixMonthsStats.vlShare !== "N/A") {
      const vlValue = parseFloat(sixMonthsStats.vlShare);
      const vlColor = getPdfColor('vlshare', vlValue);
      pdf.setTextColor(vlColor[0], vlColor[1], vlColor[2]);
      pdf.text(`${sixMonthsStats.vlShare}%`, col3X + 25, yPosition);
      pdf.setTextColor(0, 0, 0);
      if (sixMonthChanges.vlShare !== null) {
        pdf.text(`(${sixMonthChanges.vlShare >= 0 ? '+' : ''}${sixMonthChanges.vlShare.toFixed(0)}%)`, col3X + 40, yPosition);
      }
    } else {
      pdf.text(sixMonthsStats.vlShare, col3X + 25, yPosition);
    }
    
    // Capture chart (excluding the button, legend, and timeframe menu)
    const chartElement = document.getElementById('trend-chart-content');
    if (chartElement) {
      // Hide legend and timeframe menu for PDF capture
      const legendContainer = chartElement.querySelector('.relative.flex.justify-center.items-center.mt-4') as HTMLElement;
      const originalDisplay = legendContainer?.style.display;
      if (legendContainer) {
        legendContainer.style.display = 'none';
      }
      
      const canvas = await html2canvas(chartElement, {
        backgroundColor: '#ffffff',
        scale: 2
      });
      
      // Restore legend visibility
      if (legendContainer) {
        legendContainer.style.display = originalDisplay || '';
      }
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 240;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Calculate safe boundaries - ensure bottom margin of 15mm
      const chartStartY = yPosition + 5;
      const maxAllowedHeight = pageHeight - chartStartY - 15; // 15mm bottom margin
      
      const finalHeight = Math.min(imgHeight, maxAllowedHeight);
      const finalWidth = imgHeight > maxAllowedHeight ? (imgWidth * maxAllowedHeight) / imgHeight : imgWidth;
      
      pdf.addImage(imgData, 'PNG', 20, chartStartY, finalWidth, finalHeight);
      
      // Add custom legend below the chart in a horizontal line (centered and smaller)
      const legendY = chartStartY + finalHeight + 8; // 8mm spacing below chart
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      
      // Center the legend - calculate starting position
      const totalLegendWidth = 120; // approximate total width
      const legendStartX = 20 + (finalWidth - totalLegendWidth) / 2;
      
      // MC/ET legend item
      const legend1X = legendStartX;
      pdf.setFillColor(59, 130, 246); // blue
      pdf.circle(legend1X, legendY, 1, 'F');
      pdf.setTextColor(0, 0, 0);
      pdf.text('MC/ET (Linke Skala)', legend1X + 3, legendY + 1);
      
      // TMA legend item  
      const legend2X = legend1X + 40;
      pdf.setFillColor(16, 185, 129); // green
      pdf.circle(legend2X, legendY, 1, 'F');
      pdf.text('TMA (%)', legend2X + 3, legendY + 1);
      
      // VL Share legend item
      const legend3X = legend2X + 25;
      pdf.setFillColor(139, 92, 246); // purple
      pdf.circle(legend3X, legendY, 1, 'F');
      pdf.text('VL Share (%)', legend3X + 3, legendY + 1);
      
      // Add white bottom margin to ensure nothing gets cut off
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, pageHeight - 15, pageWidth, 15, 'F');
    }
    
    // Save the PDF
    pdf.save('nespresso-ca-kpi-export.pdf');
  };



  return (
    <div className="min-h-screen bg-gray-50/30">
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        textarea.scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        textarea.scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-minimal {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e0 transparent;
        }
        .scrollbar-minimal::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-minimal::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-minimal::-webkit-scrollbar-thumb {
          background-color: #cbd5e0;
          border-radius: 3px;
        }
        .scrollbar-minimal::-webkit-scrollbar-thumb:hover {
          background-color: #a0aec0;
        }
        .wobble {
          animation: wobble 0.5s ease-in-out;
        }
        @keyframes wobble {
          0% { transform: rotate(0deg); }
          15% { transform: rotate(-8deg); }
          30% { transform: rotate(8deg); }
          45% { transform: rotate(-6deg); }
          60% { transform: rotate(6deg); }
          75% { transform: rotate(-3deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>
      {/* Admin Navigation */}
      <AdminNavigation sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-56' : 'ml-14'}`}>
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-8 py-6 relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Statistiken</h1>
              <p className="text-gray-500 text-sm">CA KPIs und Mystery Shops Verwaltung</p>
            </div>
            
            {/* Menu Buttons and Action Buttons */}
            <div className="flex items-center space-x-3">
              {/* Menu Buttons - Overview and History */}
              <button 
                onClick={() => setSelectedMenu('overview')}
                className={`flex items-center space-x-2 px-3 py-2 text-sm border rounded-lg transition-all duration-200 ${
                  selectedMenu === 'overview' 
                    ? 'bg-gray-100 text-gray-900 border-gray-300 scale-[1.02] shadow-sm' 
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Send className="h-4 w-4" />
                <span>Overview</span>
              </button>
              <button 
                onClick={() => setSelectedMenu('history')}
                className={`flex items-center space-x-2 px-3 py-2 text-sm border rounded-lg transition-all duration-200 ${
                  selectedMenu === 'history' 
                    ? 'bg-gray-100 text-gray-900 border-gray-300 scale-[1.02] shadow-sm' 
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>History ({historyCards.length})</span>
              </button>
              
              {/* Vertical Divider */}
              <div className="h-8 w-px bg-gray-300 opacity-60 mx-3"></div>
              <button 
                onClick={() => setShowImportModal(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-white text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                <Download className="h-4 w-4" />
                <span>Import</span>
              </button>
              <button 
                onClick={() => setShowCallsModal(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-white text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                <Phone className="h-4 w-4" />
                <span>Calls ({scheduledCalls.length})</span>
              </button>
              <button 
                onClick={() => setShowRanksModal(true)}
                className="flex items-center space-x-2 px-3 py-2 text-black text-sm rounded-lg hover:opacity-90 transition-all duration-200 opacity-80"
                style={{
                  background: 'linear-gradient(135deg, #EEB34B 0%, #FFED99 25%, #FCD33D 50%, #FAF995 75%, #EFC253 100%)',
                  border: 'none'
                }}
              >
                <Crown className="h-4 w-4" />
                <span>Ranks</span>
              </button>
              <button 
                onClick={handleGenerateAllEmails}
                className="flex items-center space-x-2 px-3 py-2 text-white text-sm rounded-lg hover:opacity-90 transition-all duration-200 opacity-80"
                style={{
                  background: 'linear-gradient(135deg, #22C55E, #105F2D)',
                  border: 'none'
                }}
              >
                <Zap className={`h-4 w-4 ${generatingAll ? 'animate-spin' : ''}`} />
                <span>Generate All Emails</span>
              </button>
              <button className="p-2 bg-white text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">
          {selectedMenu === "overview" && (
            <>
              {/* Promoter Cards Grid */}
              <div className="grid grid-cols-5 gap-4">
                {cardData.map((card) => (
                  <div key={card.id} className="bg-white border border-gray-100 rounded-lg p-4 shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{card.name}</h3>
                      <button 
                        className="text-red-500 hover:text-red-600"
                        onClick={() => handleDeleteCard(card.id)}
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M5 6v14a2 2 0 002 2h10a2 2 0 002-2V6M10 11v6M14 11v6" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex items-center space-x-2 mb-3 cursor-pointer" onClick={() => handleEmailCopy(card.email)}>
                      {copiedEmail === card.email ? (
                        <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                      ) : (
                        <Mail className="h-3 w-3 text-gray-400 flex-shrink-0" />
                      )}
                      <p className="text-sm text-gray-600 truncate">{card.email}</p>
                    </div>
                    
                    {/* KPI Metrics */}
                    <div 
                      className="bg-gray-100 border border-gray-200 rounded px-3 py-2 mb-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handleKPIClick(card)}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="text-center">
                          <div className="text-gray-500">MC/ET:</div>
                          <div 
                            className={`font-semibold ${getColorForMcEt(card.mcet) !== "custom-orange" ? getColorForMcEt(card.mcet) : ""}`}
                            style={{...getStyleForColor(getColorForMcEt(card.mcet))}}
                          >
                            {card.mcet.toFixed(1)}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-500">TMA:</div>
                          <div 
                            className={`font-semibold ${getColorForTma(card.tma) !== "custom-orange" ? getColorForTma(card.tma) : ""}`}
                            style={{...getStyleForColor(getColorForTma(card.tma))}}
                          >
                            {card.tma.toFixed(1)}%
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-500">VL:</div>
                          <div 
                            className={`font-semibold ${getColorForVlShare(card.vlShare) !== "custom-orange" ? getColorForVlShare(card.vlShare) : ""}`}
                            style={{...getStyleForColor(getColorForVlShare(card.vlShare))}}
                          >
                            {card.vlShare.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Separator Line */}
                    <hr className="border-gray-200 mb-3" />

                    {/* Magic Touch Section */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-1">
                        <IoColorWandOutline className="h-3 w-3 text-gray-600" />
                        <span className="text-xs text-gray-600 font-semibold">Magic Touch</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          className={`${recentlyScheduled[card.id] ? 'text-green-500' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
                          onClick={() => handleScheduleCall(card)}
                        >
                          {recentlyScheduled[card.id] ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          )}
                        </button>
                        <button 
                          className="text-gray-400 hover:text-gray-600"
                          onClick={() => generatedStates[card.id] ? handleRegenerateEmail(card.id) : handleGenerateEmail(card.id)}
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                        {generatedStates[card.id] && (
                          <>
                            <button 
                              className={`${copiedText[card.id] ? 'text-green-500' : 'text-gray-400 hover:text-gray-600'}`}
                              onClick={() => handleCopyGeneratedText(card.id)}
                            >
                              {copiedText[card.id] ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </button>
                            <button 
                              className={`${editingStates[card.id] ? 'text-green-500' : 'text-gray-400 hover:text-gray-600'}`}
                              onClick={() => handleEditText(card.id)}
                            >
                              {editingStates[card.id] ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Edit className="h-4 w-4" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="relative magic-touch-dropdown">
                      <div 
                        className="flex items-center justify-between mb-3 px-2 py-1 rounded-md border border-gray-300 shadow-sm text-xs bg-gray-50 text-gray-600 cursor-pointer"
                        style={getMagicTouchStyle(card.id)}
                        onClick={() => handleMagicTouchClick(card.id)}
                      >
                        <div className="flex items-center space-x-1">
                          <span>
                            {magicTouchCategories[card.id] ? (
                              <div className="flex items-center space-x-1">
                                {categories.find(c => c.name === magicTouchCategories[card.id])?.icon}
                                <span>{magicTouchCategories[card.id]}</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1">
                                <FiSliders className="h-3 w-3" />
                                <span>Neutral</span>
                              </div>
                            )}
                          </span>
                        </div>
                        <ChevronDown className="h-3 w-3 text-gray-400" />
                      </div>
                      
                      {openDropdown === card.id && (
                        <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-md shadow-lg z-10 mt-1">
                          {categories.map((category) => (
                            <div
                              key={category.name}
                              className="px-3 py-2 text-xs cursor-pointer transition-colors"
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.backgroundColor = category.color;
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.backgroundColor = '';
                              }}
                              onClick={() => handleCategorySelect(card.id, category.name)}
                            >
                              <div className="flex items-center space-x-2">
                                {category.icon}
                                <span>{category.name}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div 
                      className={`px-2 py-1 rounded-md border text-xs mb-3 mt-2.5 flex items-center space-x-2 relative border-gray-200 bg-gray-100 text-gray-600 cursor-pointer hover:bg-gray-50 ${showPromoterDropdown[card.id] ? 'z-[9999]' : ''}`}
                      onClick={() => handlePromoterContainerClick(card.id)}
                      data-promoter-dropdown
                    >
                      {/* Status indicator dot */}
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        matchedPromoters[card.id] 
                          ? 'bg-green-600 shadow-sm shadow-green-600/50 ring-2 ring-green-600/20 opacity-50' 
                          : 'bg-red-500 shadow-sm shadow-red-500/50 ring-2 ring-red-500/20 opacity-50'
                      }`}></div>
                      
                      {/* Text content */}
                      <span className="opacity-50">
                        {matchedPromoters[card.id] || 'Kein Promotor gefunden'}
                      </span>

                      {/* Dropdown for all promoters */}
                      {showPromoterDropdown[card.id] && (
                        <div className="absolute top-full -left-2 right-0 mt-1 border border-gray-200 rounded-md shadow-lg z-[9999] overflow-hidden" style={{backgroundColor: '#ffffff', opacity: 1}}>
                          <input
                            type="text"
                            placeholder="Suchen..."
                            className="w-full px-3 py-2 text-xs border-b border-gray-200 outline-none focus:outline-none focus:ring-0"
                            value={promoterSearch[card.id] || ''}
                            onChange={(e) => {
                              e.stopPropagation();
                              setPromoterSearch(prev => ({ ...prev, [card.id]: e.target.value }));
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="max-h-32 overflow-y-auto scrollbar-hide">
                            {availablePromoters
                              .filter(promoter => 
                                !promoterSearch[card.id] || 
                                promoter.toLowerCase().includes(promoterSearch[card.id].toLowerCase())
                              )
                              .map((promoter) => (
                                <button
                                  key={promoter}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePromoterSelect(card.id, promoter);
                                  }}
                                  className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  {promoter}
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className={`bg-gray-100 border border-dashed rounded-lg overflow-hidden ${
                      generatedStates[card.id] ? 'max-h-96 p-4' : 'p-6 h-24'
                    } ${editingStates[card.id] ? 'border-green-500' : 'border-gray-300'}`}
                    style={editingStates[card.id] ? {boxShadow: '0 0 6px 3px rgba(34, 197, 94, 0.2)'} : {}}>
                      {!generatingStates[card.id] && !generatedStates[card.id] && (
                        <div className="flex justify-center items-center h-full">
                          <button 
                            onClick={() => handleGenerateEmail(card.id)}
                            className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs text-white rounded-lg transition-all duration-200 opacity-85" 
                            style={{background: 'linear-gradient(135deg, #22C55E, #105F2D)'}}
                          >
                            <Zap className="h-3.5 w-3.5" />
                            <span>Generate Email</span>
                          </button>
                        </div>
                      )}
                      
                      {generatingStates[card.id] && (
                        <div className="flex justify-center items-center">
                          <div className="flex flex-col items-center space-y-1">
                            <CgSpinner className="h-6 w-6 text-gray-500 animate-spin" />
                            <div className="flex items-center">
                              <span className="text-sm text-gray-500 font-medium">Generating</span>
                              <span className="text-sm text-gray-500 animate-bounce" style={{animationDelay: '0ms'}}>.</span>
                              <span className="text-sm text-gray-500 animate-bounce" style={{animationDelay: '150ms'}}>.</span>
                              <span className="text-sm text-gray-500 animate-bounce" style={{animationDelay: '300ms'}}>.</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {generatedStates[card.id] && (
                        <div className="text-xs text-gray-600 leading-relaxed h-72 overflow-y-auto scrollbar-hide w-full">
                          {editingStates[card.id] ? (
                            <textarea
                              className="w-full h-full text-xs text-gray-600 leading-relaxed resize-none bg-transparent border-none outline-none font-sans scrollbar-hide"
                              value={editedTexts[card.id] || getGeneratedEmailText()}
                              onChange={(e) => handleTextChange(card.id, e.target.value)}
                              style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}
                            />
                          ) : (
                            <pre className="whitespace-pre-wrap font-sans">{editedTexts[card.id] || getGeneratedEmailText()}</pre>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Validation Button - Only show when text is generated */}
                    {generatedStates[card.id] && (
                      <div className="-mb-3">
                        <button
                          onClick={() => handleValidateText(card.id)}
                          className={`w-full flex items-center justify-center space-x-2 px-3 py-1 mt-1 text-xs text-white rounded-lg transition-all duration-200 ${validationStates[card.id] ? 'opacity-85' : 'opacity-40'}`}
                          style={{background: 'linear-gradient(135deg, #22C55E, #105F2D)'}}
                        >
                          {validationStates[card.id] && <Check className="h-3.5 w-3.5" />}
                          <span>Validiert</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Send & Save to History Button - Only show when there are validated cards */}
              {Object.values(validationStates).some(isValidated => isValidated) && (
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={handleSendToHistory}
                    className="flex items-center justify-center space-x-2 px-6 py-3 text-sm text-white rounded-lg transition-all duration-200 opacity-85"
                    style={{background: 'linear-gradient(135deg, #22C55E, #105F2D)'}}
                  >
                    <span>Send & Save to History</span>
                  </button>
                </div>
              )}
            </>
          )}

          {selectedMenu === "history" && (
            <>
              {/* History Statistics Container */}
              <div className="border border-gray-200 rounded-lg p-6 mb-6">
                <div className="relative">
                  {/* Chevron Icon */}
                  <button
                    onClick={() => setIsStatsExpanded(!isStatsExpanded)}
                    className="absolute right-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    style={{ top: '-6px' }}
                  >
                    {isStatsExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>

                  <div className="grid grid-cols-3">
                    {/* All Time */}
                    <div className="text-center px-6">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">
                        All Time ({calculateAverages("alltime").count})
                      </h3>
                    </div>

                    {/* Last 30 Days */}
                    <div className="text-center px-6">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">
                        Last 30 Days ({calculateAverages("30days").count})
                      </h3>
                    </div>

                    {/* Last 6 Months */}
                    <div className="text-center px-6">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">
                        Last 6 Months ({calculateAverages("6months").count})
                      </h3>
                    </div>
                  </div>
                </div>
                
                {/* Continuous horizontal line */}
                <hr className="border-gray-200 mb-3" />
                
                <div className="grid grid-cols-3">
                  {/* All Time Data */}
                  <div className="text-center px-6">
                    <div className="space-y-1">
                      <div className="text-sm text-gray-600 flex items-center justify-center space-x-2">
                        <span>
                          Avg MC/ET: {calculateAverages("alltime").mcet !== "N/A" ? (
                            <span 
                              className={`font-medium ${getColorForMcEt(parseFloat(calculateAverages("alltime").mcet)) !== "custom-orange" ? getColorForMcEt(parseFloat(calculateAverages("alltime").mcet)) : ""}`}
                              style={{...getStyleForColor(getColorForMcEt(parseFloat(calculateAverages("alltime").mcet)))}}
                            >
                              {calculateAverages("alltime").mcet}
                            </span>
                          ) : (
                            <span className="font-medium text-gray-900">{calculateAverages("alltime").mcet}</span>
                          )}
                        </span>
                        {calculateAverages("alltime").mcet !== "N/A" && (
                          <span className={`inline-flex items-center px-1 py-0 rounded text-[10px] font-medium bg-gray-100 ${
                            parseFloat(calculateAverages("alltime").mcet) >= 4.5 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {parseFloat(calculateAverages("alltime").mcet) >= 4.5 ? '+' : ''}{(parseFloat(calculateAverages("alltime").mcet) - 4.5).toFixed(1)}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 flex items-center justify-center space-x-2">
                        <span>
                          Avg TMA: {calculateAverages("alltime").tma !== "N/A" ? (
                            <span 
                              className={`font-medium ${getColorForTma(parseFloat(calculateAverages("alltime").tma)) !== "custom-orange" ? getColorForTma(parseFloat(calculateAverages("alltime").tma)) : ""}`}
                              style={{...getStyleForColor(getColorForTma(parseFloat(calculateAverages("alltime").tma)))}}
                            >
                              {calculateAverages("alltime").tma}%
                            </span>
                          ) : (
                            <span className="font-medium text-gray-900">{calculateAverages("alltime").tma}</span>
                          )}
                        </span>
                        {calculateAverages("alltime").tma !== "N/A" && (
                          <span className={`inline-flex items-center px-1 py-0 rounded text-[10px] font-medium bg-gray-100 ${
                            parseFloat(calculateAverages("alltime").tma) >= 75 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {parseFloat(calculateAverages("alltime").tma) >= 75 ? '+' : ''}{(parseFloat(calculateAverages("alltime").tma) - 75).toFixed(1)}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 flex items-center justify-center space-x-2">
                        <span>
                          Avg VL Share: {calculateAverages("alltime").vlShare !== "N/A" ? (
                            <span 
                              className={`font-medium ${getColorForVlShare(parseFloat(calculateAverages("alltime").vlShare)) !== "custom-orange" ? getColorForVlShare(parseFloat(calculateAverages("alltime").vlShare)) : ""}`}
                              style={{...getStyleForColor(getColorForVlShare(parseFloat(calculateAverages("alltime").vlShare)))}}
                            >
                              {calculateAverages("alltime").vlShare}%
                            </span>
                          ) : (
                            <span className="font-medium text-gray-900">{calculateAverages("alltime").vlShare}</span>
                          )}
                        </span>
                        {calculateAverages("alltime").vlShare !== "N/A" && (
                          <span className={`inline-flex items-center px-1 py-0 rounded text-[10px] font-medium bg-gray-100 ${
                            parseFloat(calculateAverages("alltime").vlShare) >= 10 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {parseFloat(calculateAverages("alltime").vlShare) >= 10 ? '+' : ''}{(parseFloat(calculateAverages("alltime").vlShare) - 10).toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Last 30 Days Data */}
                  <div className="text-center px-6">
                    <div className="space-y-1">
                      <div className="text-sm text-gray-600 flex items-center justify-center space-x-2">
                        <span>
                          Avg MC/ET: {calculateAverages("30days").mcet !== "N/A" ? (
                            <span 
                              className={`font-medium ${getColorForMcEt(parseFloat(calculateAverages("30days").mcet)) !== "custom-orange" ? getColorForMcEt(parseFloat(calculateAverages("30days").mcet)) : ""}`}
                              style={{...getStyleForColor(getColorForMcEt(parseFloat(calculateAverages("30days").mcet)))}}
                            >
                              {calculateAverages("30days").mcet}
                            </span>
                          ) : (
                            <span className="font-medium text-gray-900">{calculateAverages("30days").mcet}</span>
                          )}
                        </span>
                        {calculateWaveChanges().mcet !== null && (
                          <span className={`inline-flex items-center px-1 py-0 rounded text-[10px] font-medium bg-gray-100 ${
                            calculateWaveChanges().mcet! >= 0 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {calculateWaveChanges().mcet! >= 0 ? '+' : ''}{calculateWaveChanges().mcet!.toFixed(0)}%
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 flex items-center justify-center space-x-2">
                        <span>
                          Avg TMA: {calculateAverages("30days").tma !== "N/A" ? (
                            <span 
                              className={`font-medium ${getColorForTma(parseFloat(calculateAverages("30days").tma)) !== "custom-orange" ? getColorForTma(parseFloat(calculateAverages("30days").tma)) : ""}`}
                              style={{...getStyleForColor(getColorForTma(parseFloat(calculateAverages("30days").tma)))}}
                            >
                              {calculateAverages("30days").tma}%
                            </span>
                          ) : (
                            <span className="font-medium text-gray-900">{calculateAverages("30days").tma}</span>
                          )}
                        </span>
                        {calculateWaveChanges().tma !== null && (
                          <span className={`inline-flex items-center px-1 py-0 rounded text-[10px] font-medium bg-gray-100 ${
                            calculateWaveChanges().tma! >= 0 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {calculateWaveChanges().tma! >= 0 ? '+' : ''}{calculateWaveChanges().tma!.toFixed(0)}%
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 flex items-center justify-center space-x-2">
                        <span>
                          Avg VL Share: {calculateAverages("30days").vlShare !== "N/A" ? (
                            <span 
                              className={`font-medium ${getColorForVlShare(parseFloat(calculateAverages("30days").vlShare)) !== "custom-orange" ? getColorForVlShare(parseFloat(calculateAverages("30days").vlShare)) : ""}`}
                              style={{...getStyleForColor(getColorForVlShare(parseFloat(calculateAverages("30days").vlShare)))}}
                            >
                              {calculateAverages("30days").vlShare}%
                            </span>
                          ) : (
                            <span className="font-medium text-gray-900">{calculateAverages("30days").vlShare}</span>
                          )}
                        </span>
                        {calculateWaveChanges().vlShare !== null && (
                          <span className={`inline-flex items-center px-1 py-0 rounded text-[10px] font-medium bg-gray-100 ${
                            calculateWaveChanges().vlShare! >= 0 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {calculateWaveChanges().vlShare! >= 0 ? '+' : ''}{calculateWaveChanges().vlShare!.toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Last 6 Months Data */}
                  <div className="text-center px-6">
                    <div className="space-y-1">
                      <div className="text-sm text-gray-600 flex items-center justify-center space-x-2">
                        <span>
                          Avg MC/ET: {calculateAverages("6months").mcet !== "N/A" ? (
                            <span 
                              className={`font-medium ${getColorForMcEt(parseFloat(calculateAverages("6months").mcet)) !== "custom-orange" ? getColorForMcEt(parseFloat(calculateAverages("6months").mcet)) : ""}`}
                              style={{...getStyleForColor(getColorForMcEt(parseFloat(calculateAverages("6months").mcet)))}}
                            >
                              {calculateAverages("6months").mcet}
                            </span>
                          ) : (
                            <span className="font-medium text-gray-900">{calculateAverages("6months").mcet}</span>
                          )}
                        </span>
                        {calculate6MonthsWaveChanges().mcet !== null && (
                          <span className={`inline-flex items-center px-1 py-0 rounded text-[10px] font-medium bg-gray-100 ${
                            calculate6MonthsWaveChanges().mcet! >= 0 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {calculate6MonthsWaveChanges().mcet! >= 0 ? '+' : ''}{calculate6MonthsWaveChanges().mcet!.toFixed(0)}%
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 flex items-center justify-center space-x-2">
                        <span>
                          Avg TMA: {calculateAverages("6months").tma !== "N/A" ? (
                            <span 
                              className={`font-medium ${getColorForTma(parseFloat(calculateAverages("6months").tma)) !== "custom-orange" ? getColorForTma(parseFloat(calculateAverages("6months").tma)) : ""}`}
                              style={{...getStyleForColor(getColorForTma(parseFloat(calculateAverages("6months").tma)))}}
                            >
                              {calculateAverages("6months").tma}%
                            </span>
                          ) : (
                            <span className="font-medium text-gray-900">{calculateAverages("6months").tma}</span>
                          )}
                        </span>
                        {calculate6MonthsWaveChanges().tma !== null && (
                          <span className={`inline-flex items-center px-1 py-0 rounded text-[10px] font-medium bg-gray-100 ${
                            calculate6MonthsWaveChanges().tma! >= 0 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {calculate6MonthsWaveChanges().tma! >= 0 ? '+' : ''}{calculate6MonthsWaveChanges().tma!.toFixed(0)}%
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 flex items-center justify-center space-x-2">
                        <span>
                          Avg VL Share: {calculateAverages("6months").vlShare !== "N/A" ? (
                            <span 
                              className={`font-medium ${getColorForVlShare(parseFloat(calculateAverages("6months").vlShare)) !== "custom-orange" ? getColorForVlShare(parseFloat(calculateAverages("6months").vlShare)) : ""}`}
                              style={{...getStyleForColor(getColorForVlShare(parseFloat(calculateAverages("6months").vlShare)))}}
                            >
                              {calculateAverages("6months").vlShare}%
                            </span>
                          ) : (
                            <span className="font-medium text-gray-900">{calculateAverages("6months").vlShare}</span>
                          )}
                        </span>
                        {calculate6MonthsWaveChanges().vlShare !== null && (
                          <span className={`inline-flex items-center px-1 py-0 rounded text-[10px] font-medium bg-gray-100 ${
                            calculate6MonthsWaveChanges().vlShare! >= 0 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {calculate6MonthsWaveChanges().vlShare! >= 0 ? '+' : ''}{calculate6MonthsWaveChanges().vlShare!.toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expandable Content */}
                {isStatsExpanded && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                                        {/* Trend Chart */}
                    <div className="bg-white p-6 rounded-lg border border-gray-200 relative" id="trend-chart">
                      <button
                        onClick={generatePDF}
                        className="absolute top-4 right-4 flex items-center space-x-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
                      >
                        <FileText className="h-4 w-4" />
                        <span>Create PDF</span>
                      </button>
                      <div id="trend-chart-content">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Monatlicher Trend-Verlauf</h3>
                        {generateChartData().length > 0 ? (
                          <>
                            <ResponsiveContainer width="100%" height={300}>
                              <LineChart data={generateChartData()} margin={{ left: 20, right: 30, top: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis 
                                  dataKey="month" 
                                  stroke="#6b7280"
                                  fontSize={12}
                                  type="category"
                                  interval={0}
                                  tick={{ fontSize: 12 }}
                                />
                                <YAxis 
                                  yAxisId="mcet"
                                  domain={[0, 6]}
                                  stroke="#6b7280"
                                  fontSize={12}
                                  label={{ value: 'MC/ET', angle: -90, position: 'insideLeft' }}
                                />
                                <YAxis 
                                  yAxisId="percentage"
                                  orientation="right"
                                  domain={[0, 100]}
                                  stroke="#6b7280"
                                  fontSize={12}
                                  label={{ value: 'Prozent (%)', angle: 90, position: 'insideRight' }}
                                />
                                <Tooltip 
                                  contentStyle={{
                                    backgroundColor: '#f9fafb',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    fontSize: '12px'
                                  }}
                                  formatter={(value, name) => [
                                    name === 'mcet' ? value : `${value}%`,
                                    name === 'mcet' ? 'MC/ET' : name === 'tma' ? 'TMA' : 'VL Share'
                                  ]}
                                />
                                <Line 
                                  yAxisId="mcet"
                                  type="monotone" 
                                  dataKey="mcet" 
                                  stroke="#3b82f6" 
                                  strokeWidth={2}
                                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                                  activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                                  connectNulls={false}
                                />
                                <Line 
                                  yAxisId="percentage"
                                  type="monotone" 
                                  dataKey="tma" 
                                  stroke="#10b981" 
                                  strokeWidth={2}
                                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                                  activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                                  connectNulls={false}
                                />
                                <Line 
                                  yAxisId="percentage"
                                  type="monotone" 
                                  dataKey="vlShare" 
                                  stroke="#8b5cf6" 
                                  strokeWidth={2}
                                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                                  activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2 }}
                                  connectNulls={false}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                            
                            {/* Legend and Time Filter */}
                            <div className="relative flex justify-center items-center mt-4">
                              {/* Legend */}
                              <div className="flex space-x-6">
                                <div className="flex items-center space-x-2">
                                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                  <span className="text-sm text-gray-600">MC/ET (Linke Skala)</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                  <span className="text-sm text-gray-600">TMA (%)</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                                  <span className="text-sm text-gray-600">VL Share (%)</span>
                                </div>
                              </div>
                              
                              {/* Time Filter Buttons */}
                              <div className="absolute right-0 flex space-x-1 bg-gray-100 p-1 rounded-lg">
                                <button
                                  onClick={() => setChartTimeFilter("3months")}
                                  className={`px-3 py-1 text-xs rounded transition-all duration-200 ${
                                    chartTimeFilter === "3months" 
                                      ? 'bg-white text-gray-900 shadow-sm' 
                                      : 'text-gray-600 hover:text-gray-900'
                                  }`}
                                >
                                  3M
                                </button>
                                <button
                                  onClick={() => setChartTimeFilter("6months")}
                                  className={`px-3 py-1 text-xs rounded transition-all duration-200 ${
                                    chartTimeFilter === "6months" 
                                      ? 'bg-white text-gray-900 shadow-sm' 
                                      : 'text-gray-600 hover:text-gray-900'
                                  }`}
                                >
                                  6M
                                </button>
                                <button
                                  onClick={() => setChartTimeFilter("1year")}
                                  className={`px-3 py-1 text-xs rounded transition-all duration-200 ${
                                    chartTimeFilter === "1year" 
                                      ? 'bg-white text-gray-900 shadow-sm' 
                                      : 'text-gray-600 hover:text-gray-900'
                                  }`}
                                >
                                  1J
                                </button>
                                <button
                                  onClick={() => setChartTimeFilter("all")}
                                  className={`px-3 py-1 text-xs rounded transition-all duration-200 ${
                                    chartTimeFilter === "all" 
                                      ? 'bg-white text-gray-900 shadow-sm' 
                                      : 'text-gray-600 hover:text-gray-900'
                                  }`}
                                >
                                  Alle
                                </button>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-12">
                            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                              Keine Trend-Daten verfügbar
                            </h3>
                            <p className="text-sm text-gray-600">
                              Senden Sie CA KPIs an die History, um Trend-Analysen zu sehen
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Filter Section */}
              <div className="border border-gray-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center space-x-6">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600">Filter by Promoter:</span>
                    <div className="relative promoter-filter-dropdown">
                      <button
                        onClick={() => setShowPromoterFilterDropdown(!showPromoterFilterDropdown)}
                        className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
                      >
                        <span>{selectedPromoterFilter === "all" ? "All Promoters" : selectedPromoterFilter}</span>
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      </button>
                      
                      {showPromoterFilterDropdown && (
                        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                          <div 
                            onClick={() => {
                              setSelectedPromoterFilter("all");
                              setShowPromoterFilterDropdown(false);
                            }}
                            className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                          >
                            All Promoters
                          </div>
                          {teamPromoters.map((promoter) => (
                            <div
                              key={promoter}
                              onClick={() => {
                                setSelectedPromoterFilter(promoter);
                                setShowPromoterFilterDropdown(false);
                              }}
                              className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
                            >
                              {promoter}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">(0 entries found)</span>
                </div>
              </div>

              {/* History Cards */}
              {historyCards.length > 0 ? (
                <div className="space-y-8">
                  {Object.entries(groupCardsByDate(historyCards)).map(([date, cards]) => (
                    <div key={date}>
                      {/* Date Header */}
                      <h2 className="text-lg font-bold text-gray-900 mb-4">{date}</h2>
                      
                      {/* Cards Grid for this date */}
                      <div className="grid grid-cols-5 gap-4">
                        {cards.map((card) => (
                          <div key={card.id} className="bg-white border border-gray-100 rounded-lg p-4 shadow">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-medium text-gray-900">{card.name}</h3>
                              <button 
                                className={`text-red-500 hover:text-red-600 ${pendingHistoryDelete[card.id] ? 'wobble' : ''}`}
                                onClick={() => handleDeleteHistoryCard(card.id)}
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M5 6v14a2 2 0 002 2h10a2 2 0 002-2V6M10 11v6M14 11v6" />
                                </svg>
                              </button>
                            </div>
                            <div className="flex items-center space-x-2 mb-3">
                              <Mail className="h-3 w-3 text-gray-400 flex-shrink-0" />
                              <p className="text-sm text-gray-600 truncate">{card.email}</p>
                            </div>
                            
                            {/* KPI Metrics */}
                            <div className="bg-gray-100 border border-gray-200 rounded px-3 py-2 mb-4">
                              <div className="flex items-center justify-between text-xs">
                                <div className="text-center">
                                  <div className="text-gray-500">MC/ET:</div>
                                  <div 
                                    className={`font-semibold ${getColorForMcEt(card.mcet) !== "custom-orange" ? getColorForMcEt(card.mcet) : ""}`}
                                    style={{...getStyleForColor(getColorForMcEt(card.mcet))}}
                                  >
                                    {card.mcet.toFixed(1)}
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-gray-500">TMA:</div>
                                  <div 
                                    className={`font-semibold ${getColorForTma(card.tma) !== "custom-orange" ? getColorForTma(card.tma) : ""}`}
                                    style={{...getStyleForColor(getColorForTma(card.tma))}}
                                  >
                                    {card.tma.toFixed(1)}%
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-gray-500">VL:</div>
                                  <div 
                                    className={`font-semibold ${getColorForVlShare(card.vlShare) !== "custom-orange" ? getColorForVlShare(card.vlShare) : ""}`}
                                    style={{...getStyleForColor(getColorForVlShare(card.vlShare))}}
                                  >
                                    {card.vlShare.toFixed(1)}%
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Separator Line */}
                            <hr className="border-gray-200 mb-3" />

                            {/* Magic Touch Section */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-1">
                                <IoColorWandOutline className="h-3 w-3 text-gray-600" />
                                <span className="text-xs text-gray-600 font-semibold">Magic Touch</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between mb-3 px-2 py-1 rounded-md border border-gray-300 shadow-sm text-xs bg-gray-50 text-gray-600"
                              style={getHistoryMagicTouchStyle(card.magicTouchCategory)}>
                              <div className="flex items-center space-x-1">
                                <span>
                                  {card.magicTouchCategory ? (
                                    <div className="flex items-center space-x-1">
                                      {categories.find(c => c.name === card.magicTouchCategory)?.icon}
                                      <span>{card.magicTouchCategory}</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center space-x-1">
                                      <FiSliders className="h-3 w-3" />
                                      <span>Neutral</span>
                                    </div>
                                  )}
                                </span>
                              </div>
                            </div>

                            <div className="px-2 py-1 rounded-md border text-xs mb-3 mt-2.5 flex items-center space-x-2 relative border-gray-200 bg-gray-100 text-gray-600">
                              {/* Status indicator dot */}
                              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                card.matchedPromoter 
                                  ? 'bg-green-600 shadow-sm shadow-green-600/50 ring-2 ring-green-600/20 opacity-50' 
                                  : 'bg-red-500 shadow-sm shadow-red-500/50 ring-2 ring-red-500/20 opacity-50'
                              }`}></div>
                              
                              {/* Text content */}
                              <span className="opacity-50">
                                {card.matchedPromoter || 'Kein Promotor gefunden'}
                              </span>
                            </div>

                            <div className="bg-gray-100 border border-dashed rounded-lg overflow-hidden max-h-96 p-4 border-gray-300">
                              <div className="text-xs text-gray-600 leading-relaxed h-72 overflow-y-auto scrollbar-hide w-full">
                                <pre className="whitespace-pre-wrap font-sans">{card.generatedText || 'Generated email text'}</pre>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border border-gray-200 rounded-lg">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No History Yet
                  </h3>
                  <p className="text-sm text-gray-600">
                    Validated cards that are sent will appear here
                  </p>
                </div>
              )}
            </>
          )}
        </main>

        {/* Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-96 max-w-[90vw]">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Import Statistiken</h3>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="p-1 rounded hover:bg-gray-100 transition-colors"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* Drag and Drop Area */}
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="space-y-3">
                    <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        Excel-Datei hier ablegen oder
                      </p>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Datei auswählen
                      </button>
                    </div>
                    <p className="text-xs text-gray-400">
                      Unterstützte Formate: .xlsx, .xls
                    </p>
                    <div className="text-xs text-gray-500 mt-4">
                      <p className="font-medium mb-1">Erwartete Excel-Struktur:</p>
                      <p>• Spalte A: Name</p>
                      <p>• Spalte B: Email</p>
                      <p>• Spalte I: MC/ET</p>
                      <p>• Spalte L: TMA (%)</p>
                      <p>• Spalte Q: VL Share (%)</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowImportModal(false)}
                    className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Calls Modal */}
        {showCallsModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-[800px] max-w-[90vw] h-[80vh] overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Calls Verwaltung</h3>
                <button
                  onClick={() => setShowCallsModal(false)}
                  className="p-1 rounded hover:bg-gray-100 transition-colors"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto scrollbar-minimal" style={{height: 'calc(80vh - 80px)'}}>
                {/* Tab Navigation */}
                <div className="relative mb-6">
                  <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg relative">
                    {/* Sliding indicator */}
                    <div 
                      className={`absolute top-1 bottom-1 bg-white rounded-md shadow-sm transition-all duration-300 ease-in-out ${
                        activeCallsTab === "geplante" 
                          ? "left-1 right-1/2 mr-0.5" 
                          : "left-1/2 right-1 ml-0.5"
                      }`}
                    />
                    
                    <button
                      onClick={() => setActiveCallsTab("geplante")}
                      className="relative flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 z-10"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <Phone className={`h-4 w-4 transition-colors duration-200 ${
                          activeCallsTab === "geplante" 
                            ? "text-blue-500" 
                            : "text-gray-600"
                        }`} />
                        <span className={`transition-all duration-200 ${
                          activeCallsTab === "geplante" 
                            ? "text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-blue-600" 
                            : "text-gray-600"
                        }`}>Geplante Anrufe</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveCallsTab("verlauf")}
                      className="relative flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 z-10"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <FileText className={`h-4 w-4 transition-colors duration-200 ${
                          activeCallsTab === "verlauf" 
                            ? "text-purple-500" 
                            : "text-gray-600"
                        }`} />
                        <span className={`transition-all duration-200 ${
                          activeCallsTab === "verlauf" 
                            ? "text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500" 
                            : "text-gray-600"
                        }`}>Verlauf</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Content */}
                {activeCallsTab === "geplante" && (
                  <div className="space-y-4">
                    {scheduledCalls.length > 0 ? (
                      scheduledCalls.map((call) => (
                        <div key={call.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between shadow-sm">
                          <div className="font-medium text-gray-900">{call.name}</div>
                          <div className="text-gray-500 text-sm">Nummer wird später hinzugefügt</div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleCompleteCall(call.id)}
                              className="text-green-500 hover:text-green-600 transition-colors"
                            >
                              <Check className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteScheduledCall(call.id)}
                              className="text-red-500 hover:text-red-600 transition-colors"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Keine geplanten Anrufe
                        </h3>
                        <p className="text-sm text-gray-600">
                          Klicken Sie auf das Telefon-Icon bei den Promoter-Karten, um Anrufe zu planen
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeCallsTab === "verlauf" && (
                  <div className="space-y-4">
                    {callHistory.length > 0 ? (
                      callHistory.map((call) => (
                        <div key={call.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                          <div className="font-medium text-gray-900">{call.name}</div>
                          <div className="text-gray-500 text-sm">Nummer wird später hinzugefügt</div>
                          <div className="text-gray-500 text-xs">
                            Abgeschlossen: {call.completedAt.toLocaleDateString('de-DE')} {call.completedAt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Kein Anrufverlauf
                        </h3>
                        <p className="text-sm text-gray-600">
                          Abgeschlossene Anrufe werden hier angezeigt
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Ranks Modal */}
        {showRanksModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-[800px] max-w-[90vw] h-[80vh] overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Ranks Leaderboard</h3>
                <button
                  onClick={() => setShowRanksModal(false)}
                  className="p-1 rounded hover:bg-gray-100 transition-colors"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto scrollbar-minimal" style={{height: 'calc(80vh - 80px)'}}>
                {/* Tab Navigation */}
                <div className="relative mb-6">
                  <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg relative">
                    {/* Sliding indicator */}
                    <div 
                      className={`absolute top-1 bottom-1 bg-white rounded-md shadow-sm transition-all duration-300 ease-in-out ${
                        activeRanksTab === "mcet" 
                          ? "left-1 right-2/3 mr-0.5" 
                          : activeRanksTab === "tma"
                          ? "left-1/3 right-1/3"
                          : "left-2/3 right-1 ml-0.5"
                      }`}
                    />
                    
                    <button
                      onClick={() => setActiveRanksTab("mcet")}
                      className="relative flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 z-10"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <span className={`transition-all duration-200 ${
                          activeRanksTab === "mcet" 
                            ? "text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-blue-600" 
                            : "text-gray-600"
                        }`}>MC/ET</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveRanksTab("tma")}
                      className="relative flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 z-10"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <span className={`transition-all duration-200 ${
                          activeRanksTab === "tma" 
                            ? "text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600" 
                            : "text-gray-600"
                        }`}>TMA</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveRanksTab("vlshare")}
                      className="relative flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 z-10"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <span className={`transition-all duration-200 ${
                          activeRanksTab === "vlshare" 
                            ? "text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500" 
                            : "text-gray-600"
                        }`}>VL Share</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Leaderboard Content */}
                <div className="space-y-2">
                  {cardData.length > 0 ? (
                    getSortedLeaderboard(activeRanksTab).map((entry) => {
                      const currentValue = activeRanksTab === "mcet" ? entry.mcet : 
                                         activeRanksTab === "tma" ? entry.tma : 
                                         entry.vlShare;
                      
                      return (
                        <div 
                          key={entry.id} 
                          className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 hover:shadow-sm ${
                            getLeaderboardItemStyling(entry.rank, activeRanksTab, currentValue)
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            {/* Placement Icon */}
                            <div 
                              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                              style={getRankIconStyle(entry.rank)}
                            >
                              <span className="text-white font-bold text-sm">{entry.rank}</span>
                            </div>
                            
                            {/* Promoter Info */}
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">{entry.name}</h4>
                              <p className="text-xs text-gray-500">{entry.email}</p>
                            </div>
                          </div>
                          
                          {/* Value */}
                          <div className="text-right">
                            <div 
                              className={`text-sm font-bold ${
                                activeRanksTab === "mcet" ? 
                                  (getColorForMcEt(entry.mcet) !== "custom-orange" ? getColorForMcEt(entry.mcet) : "") :
                                activeRanksTab === "tma" ? 
                                  (getColorForTma(entry.tma) !== "custom-orange" ? getColorForTma(entry.tma) : "") :
                                  (getColorForVlShare(entry.vlShare) !== "custom-orange" ? getColorForVlShare(entry.vlShare) : "")
                              }`}
                              style={{
                                ...(activeRanksTab === "mcet" ? getStyleForColor(getColorForMcEt(entry.mcet)) :
                                    activeRanksTab === "tma" ? getStyleForColor(getColorForTma(entry.tma)) :
                                    getStyleForColor(getColorForVlShare(entry.vlShare)))
                              }}
                            >
                              {activeRanksTab === "mcet" ? entry.mcet.toFixed(1) :
                               activeRanksTab === "tma" ? `${entry.tma.toFixed(1)}%` :
                               `${entry.vlShare.toFixed(1)}%`}
                            </div>
                            <p className="text-xs text-gray-400">
                              {activeRanksTab === "mcet" ? "MC/ET" :
                               activeRanksTab === "tma" ? "TMA" :
                               "VL Share"}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12">
                      <Crown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Keine Daten verfügbar
                      </h3>
                      <p className="text-sm text-gray-600">
                        Importieren Sie Promoter-Daten, um das Leaderboard zu sehen
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Overview Modal */}
        {showStatsModal && selectedCard && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-[550px] max-w-[90vw] h-[80vh] overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">{selectedCard.name} - Stats Overview</h3>
                <button
                  onClick={() => setShowStatsModal(false)}
                  className="p-1 rounded hover:bg-gray-100 transition-colors"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto flex flex-col" style={{height: 'calc(80vh - 80px)'}}>
                {/* Current Stats - Larger Display */}
                <div className="bg-gray-100/60 border border-gray-200 rounded px-4 py-3 mb-4">
                  <div className="flex justify-around">
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 text-gray-500 text-xs mb-1">
                        <TrendingUp className="h-3 w-3" />
                        <span>MC/ET:</span>
                      </div>
                      <div 
                        className={`text-xl font-semibold ${getColorForMcEt(selectedCard.mcet) !== "custom-orange" ? getColorForMcEt(selectedCard.mcet) : ""}`}
                        style={{...getStyleForColor(getColorForMcEt(selectedCard.mcet))}}
                      >
                        {selectedCard.mcet.toFixed(1)}
                      </div>
                      {calculateWaveChanges().mcet !== null ? (
                        <div className={`inline-block px-1 py-0 rounded text-[10px] font-medium bg-gray-100 mt-0.5 ${
                          calculateWaveChanges().mcet! >= 0 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {calculateWaveChanges().mcet! >= 0 ? '+' : ''}{calculateWaveChanges().mcet!.toFixed(0)}%
                        </div>
                      ) : (
                        <div className="inline-block px-1 py-0.5 bg-gray-200 rounded text-[10px] text-gray-400 mt-0.5">0.0%</div>
                      )}
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 text-gray-500 text-xs mb-1">
                        <PieChart className="h-3 w-3" />
                        <span>TMA:</span>
                      </div>
                      <div 
                        className={`text-xl font-semibold ${getColorForTma(selectedCard.tma) !== "custom-orange" ? getColorForTma(selectedCard.tma) : ""}`}
                        style={{...getStyleForColor(getColorForTma(selectedCard.tma))}}
                      >
                        {selectedCard.tma.toFixed(0)}%
                      </div>
                      {calculateWaveChanges().tma !== null ? (
                        <div className={`inline-block px-1 py-0 rounded text-[10px] font-medium bg-gray-100 mt-0.5 ${
                          calculateWaveChanges().tma! >= 0 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {calculateWaveChanges().tma! >= 0 ? '+' : ''}{calculateWaveChanges().tma!.toFixed(0)}%
                        </div>
                      ) : (
                        <div className="inline-block px-1 py-0.5 bg-gray-200 rounded text-[10px] text-gray-400 mt-0.5">0.0%</div>
                      )}
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 text-gray-500 text-xs mb-1">
                        <Percent className="h-3 w-3" />
                        <span>VL:</span>
                      </div>
                      <div 
                        className={`text-xl font-semibold ${getColorForVlShare(selectedCard.vlShare) !== "custom-orange" ? getColorForVlShare(selectedCard.vlShare) : ""}`}
                        style={{...getStyleForColor(getColorForVlShare(selectedCard.vlShare))}}
                      >
                        {selectedCard.vlShare.toFixed(0)}%
                      </div>
                      {calculateWaveChanges().vlShare !== null ? (
                        <div className={`inline-block px-1 py-0 rounded text-[10px] font-medium bg-gray-100 mt-0.5 ${
                          calculateWaveChanges().vlShare! >= 0 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {calculateWaveChanges().vlShare! >= 0 ? '+' : ''}{calculateWaveChanges().vlShare!.toFixed(0)}%
                        </div>
                      ) : (
                        <div className="inline-block px-1 py-0.5 bg-gray-200 rounded text-[10px] text-gray-400 mt-0.5">0.0%</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* History Section */}
                <div className="mb-6">
                  <div className="flex flex-col items-center mb-4">
                    <h4 className="font-medium text-gray-700 mb-1">History</h4>
                    <div className="w-12 h-px bg-gray-300"></div>
                  </div>
                  <div className="relative">
                    <div className="overflow-y-auto scrollbar-hide space-y-2 max-h-52 px-1">
                    {/* Historical KPI Entries as Rows */}
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded p-2 transition-transform duration-300 hover:scale-[1.003] cursor-pointer">
                      <div className="text-xs text-gray-600 w-20">Mai 2024</div>
                      <div className="flex items-center space-x-4 ml-auto">
                        <div className="text-sm font-medium text-green-600 w-8 text-center">4.8</div>
                        <div className="text-sm font-medium text-red-600 w-12 text-center">62%</div>
                        <div className="text-sm font-medium text-green-600 w-12 text-center">12%</div>
                      </div>
                    </div>
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded p-2 transition-transform duration-300 hover:scale-[1.003] cursor-pointer">
                      <div className="text-xs text-gray-600 w-20">Apr 2024</div>
                      <div className="flex items-center space-x-4 ml-auto">
                        <div className="text-sm font-medium text-green-600 w-8 text-center">4.2</div>
                        <div className="text-sm font-medium w-12 text-center" style={{color: "#FD7E14"}}>68%</div>
                        <div className="text-sm font-medium w-12 text-center" style={{color: "#FD7E14"}}>8%</div>
                      </div>
                    </div>
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded p-2 transition-transform duration-300 hover:scale-[1.003] cursor-pointer">
                      <div className="text-xs text-gray-600 w-20">Mär 2024</div>
                      <div className="flex items-center space-x-4 ml-auto">
                        <div className="text-sm font-medium text-red-600 w-8 text-center">3.8</div>
                        <div className="text-sm font-medium text-green-600 w-12 text-center">78%</div>
                        <div className="text-sm font-medium text-red-600 w-12 text-center">4%</div>
                      </div>
                    </div>
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded p-2 transition-transform duration-300 hover:scale-[1.003] cursor-pointer">
                      <div className="text-xs text-gray-600 w-20">Feb 2024</div>
                      <div className="flex items-center space-x-4 ml-auto">
                        <div className="text-sm font-medium w-8 text-center" style={{color: "#FD7E14"}}>4.1</div>
                        <div className="text-sm font-medium text-red-600 w-12 text-center">61%</div>
                        <div className="text-sm font-medium text-green-600 w-12 text-center">15%</div>
                      </div>
                    </div>
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded p-2 transition-transform duration-300 hover:scale-[1.003] cursor-pointer">
                      <div className="text-xs text-gray-600 w-20">Jan 2024</div>
                      <div className="flex items-center space-x-4 ml-auto">
                        <div className="text-sm font-medium text-green-600 w-8 text-center">4.6</div>
                        <div className="text-sm font-medium text-green-600 w-12 text-center">76%</div>
                        <div className="text-sm font-medium w-12 text-center" style={{color: "#FD7E14"}}>7%</div>
                      </div>
                    </div>
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded p-2 transition-transform duration-300 hover:scale-[1.003] cursor-pointer">
                      <div className="text-xs text-gray-600 w-20">Dez 2023</div>
                      <div className="flex items-center space-x-4 ml-auto">
                        <div className="text-sm font-medium text-red-600 w-8 text-center">3.9</div>
                        <div className="text-sm font-medium w-12 text-center" style={{color: "#FD7E14"}}>67%</div>
                        <div className="text-sm font-medium text-green-600 w-12 text-center">11%</div>
                      </div>
                    </div>
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded p-2 transition-transform duration-300 hover:scale-[1.003] cursor-pointer">
                      <div className="text-xs text-gray-600 w-20">Nov 2023</div>
                      <div className="flex items-center space-x-4 ml-auto">
                        <div className="text-sm font-medium text-green-600 w-8 text-center">4.3</div>
                        <div className="text-sm font-medium text-red-600 w-12 text-center">63%</div>
                        <div className="text-sm font-medium text-green-600 w-12 text-center">13%</div>
                      </div>
                    </div>
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded p-2 transition-transform duration-300 hover:scale-[1.003] cursor-pointer">
                      <div className="text-xs text-gray-600 w-20">Okt 2023</div>
                      <div className="flex items-center space-x-4 ml-auto">
                        <div className="text-sm font-medium w-8 text-center" style={{color: "#FD7E14"}}>4.0</div>
                        <div className="text-sm font-medium text-green-600 w-12 text-center">72%</div>
                        <div className="text-sm font-medium text-red-600 w-12 text-center">5%</div>
                      </div>
                    </div>
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded p-2 transition-transform duration-300 hover:scale-[1.003] cursor-pointer">
                      <div className="text-xs text-gray-600 w-20">Sep 2023</div>
                      <div className="flex items-center space-x-4 ml-auto">
                        <div className="text-sm font-medium text-green-600 w-8 text-center">4.5</div>
                        <div className="text-sm font-medium w-12 text-center" style={{color: "#FD7E14"}}>69%</div>
                        <div className="text-sm font-medium w-12 text-center" style={{color: "#FD7E14"}}>9%</div>
                      </div>
                    </div>
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded p-2 transition-transform duration-300 hover:scale-[1.003] cursor-pointer">
                      <div className="text-xs text-gray-600 w-20">Aug 2023</div>
                      <div className="flex items-center space-x-4 ml-auto">
                        <div className="text-sm font-medium text-red-600 w-8 text-center">3.7</div>
                        <div className="text-sm font-medium text-red-600 w-12 text-center">59%</div>
                        <div className="text-sm font-medium text-green-600 w-12 text-center">14%</div>
                      </div>
                    </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                  </div>
                </div>

                {/* Performance Averages */}
                <div className="mt-auto">
                  <h4 className="text-center font-medium text-gray-700 mb-4">Performance Averages</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {/* All Time */}
                    <div className="bg-gray-100 border border-gray-200 rounded px-3 py-3 shadow">
                      <h5 className="font-medium text-gray-600 mb-3 text-center">All Time</h5>
                      <hr className="border-gray-300 mb-3" />
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Avg MC/ET:</span>
                          <span className="text-gray-400">N/A</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Avg TMA:</span>
                          <span className="text-gray-400">N/A</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Avg VL Share:</span>
                          <span className="text-gray-400">N/A</span>
                        </div>
                      </div>
                    </div>

                    {/* Last 30 Days */}
                    <div className="bg-gray-100 border border-gray-200 rounded px-3 py-3 shadow">
                      <h5 className="font-medium text-gray-600 mb-3 text-center">Last 30 Days</h5>
                      <hr className="border-gray-300 mb-3" />
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Avg MC/ET:</span>
                          <span className="text-gray-400">N/A</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Avg TMA:</span>
                          <span className="text-gray-400">N/A</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Avg VL Share:</span>
                          <span className="text-gray-400">N/A</span>
                        </div>
                      </div>
                    </div>

                    {/* Last 6 Months */}
                    <div className="bg-gray-100 border border-gray-200 rounded px-3 py-3 shadow">
                      <h5 className="font-medium text-gray-600 mb-3 text-center">Last 6 Months</h5>
                      <hr className="border-gray-300 mb-3" />
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Avg MC/ET:</span>
                          <span className="text-gray-400">N/A</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Avg TMA:</span>
                          <span className="text-gray-400">N/A</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Avg VL Share:</span>
                          <span className="text-gray-400">N/A</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Eddie KI Assistant */}
      <AdminEddieAssistant />
    </div>
  );
} 