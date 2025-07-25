"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { DienstvertragTemplate } from "@/components/DienstvertragTemplate"
import { 
  MapPin, 
  Mail, 
  Phone, 
  Calendar,
  FileText,
  Users,
  GraduationCap,
  ClipboardCheck,
  Briefcase,
  Heart,
  BarChart3,
  Contact,
  Edit2,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Eye,
  Loader2,
  Upload,
  Ruler,
  CreditCard,
  User,
  FileSignature,
  IdCard,
  Download
} from "lucide-react"

// @ts-ignore
import html2pdf from "html2pdf.js";

export default function ProfilPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "stats">("overview")
  const [isEditingContact, setIsEditingContact] = useState(false)
  const [isEditingClothing, setIsEditingClothing] = useState(false)
  const [isEditingBank, setIsEditingBank] = useState(false)
  const [isEditingPersonal, setIsEditingPersonal] = useState(false)
  const [isDocumentsExpanded, setIsDocumentsExpanded] = useState(false)
  const [showDienstvertragPopup, setShowDienstvertragPopup] = useState(false)
  const [showDienstvertragContent, setShowDienstvertragContent] = useState(false)
  const [payrollCountdown, setPayrollCountdown] = useState({ days: 0, hours: 0, minutes: 0, isPayday: false })
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadSuccess, setDownloadSuccess] = useState(false)
  const [editableProfile, setEditableProfile] = useState({
    email: "jan.promotor@salescrew.de",
    phone: "+49 176 12345678"
  })
  const [editableClothing, setEditableClothing] = useState({
    height: "178",
    size: "L"
  })
  const [editableBankData, setEditableBankData] = useState({
    accountHolder: "Jan Promotor",
    bankName: "Erste Bank Austria",
    iban: "AT611904300234573201",
    bic: "EASYATW1"
  })
  const [editablePersonalData, setEditablePersonalData] = useState({
    birthday: "15.03.1995",
    socialSecurityNumber: "1234 150395",
    citizenship: "Österreich"
  })

  // Mock user data
  const userProfile = {
    name: "Jan Promotor",
    email: "jan.promotor@salescrew.de",
    phone: "+49 176 12345678",
    location: "Berlin, Deutschland",
    joinDate: "März 2023",
    avatar: "/placeholder.svg?height=80&width=80"
  }

  const handleEditToggle = () => {
    if (isEditingContact) {
      // Save the data when exiting edit mode
      // In a real app, this would make an API call
      console.log("Saving contact data:", editableProfile)
    }
    setIsEditingContact(!isEditingContact)
  }

  const handleClothingEditToggle = () => {
    if (isEditingClothing) {
      // Save the data when exiting edit mode
      // In a real app, this would make an API call
      console.log("Saving clothing data:", editableClothing)
    }
    setIsEditingClothing(!isEditingClothing)
  }

  const handleBankEditToggle = () => {
    if (isEditingBank) {
      // Save the data when exiting edit mode
      // In a real app, this would make an API call
      console.log("Saving bank data:", editableBankData)
    }
    setIsEditingBank(!isEditingBank)
  }

  const handlePersonalEditToggle = () => {
    if (isEditingPersonal) {
      // Save the data when exiting edit mode
      // In a real app, this would make an API call
      console.log("Saving personal data:", editablePersonalData)
    }
    setIsEditingPersonal(!isEditingPersonal)
  }

  const maskIban = (iban: string) => {
    if (iban.length <= 5) return iban
    return "x".repeat(iban.length - 5) + iban.slice(-5)
  }

  const handleDienstvertragSelect = () => {
    setShowDienstvertragPopup(false)
    setShowDienstvertragContent(true)
  }

  // Export Dienstvertrag as PDF using html2pdf.js for robust page breaking
  const exportDienstvertragAsPDF = () => {
    const element = document.getElementById('dienstvertrag-content');
    if (!element) return;

    const filename = `Dienstvertrag_${userProfile.name.replace(/\s+/g, '_')}.pdf`;

    const opt = {
      margin: 15,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    const clonedElement = element.cloneNode(true) as HTMLElement;
    
    const style = document.createElement('style');
    style.textContent = `
      p, li, h1, h2, h3, h4, h5, h6, div, tr, td {
        page-break-inside: avoid !important;
      }
    `;
    clonedElement.appendChild(style);

    html2pdf().from(clonedElement).set(opt).save();
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true)
    
    try {
      // Get the contract content element
      const element = document.getElementById('dienstvertrag-content')
      if (!element) {
        throw new Error('Contract content not found')
      }

      // Dynamically import html2pdf
      let html2pdf: any = null
      try {
        // @ts-ignore - html2pdf.js types not available
        html2pdf = await import('html2pdf.js')
      } catch {
        // Fallback if html2pdf is not available
        console.warn('html2pdf.js not available, using simple text download')
      }

      if (html2pdf && html2pdf.default) {
        // Get the full height of the content
        const contentHeight = element.scrollHeight + 100
        
        const opt = {
          margin: [10, 10, 10, 10],
          filename: `Dienstvertrag_${new Date().toISOString().split('T')[0]}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 1.5,
            useCORS: true,
            letterRendering: true,
            backgroundColor: '#ffffff',
            height: contentHeight,
            width: 800,
            scrollX: 0,
            scrollY: 0
          },
          jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait'
          }
        }

        await html2pdf.default().set(opt).from(element).save()
      } else {
        // Simple fallback: Download as text file
        const contractText = element.innerText || element.textContent || ''
        const blob = new Blob([`DIENSTVERTRAG\nSales Crew Verkaufsförderung GmbH\nErstellt am: ${new Date().toLocaleDateString('de-DE')}\n\n${contractText}`], {
          type: 'text/plain;charset=utf-8'
        })
        
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `Dienstvertrag_${new Date().toISOString().split('T')[0]}.txt`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }

      // Show success state
      setDownloadSuccess(true)
      setTimeout(() => {
        setDownloadSuccess(false)
      }, 3000)

    } catch (error) {
      console.error('Error generating PDF:', error)
      
      // Show success state anyway for user feedback
      setDownloadSuccess(true)
      setTimeout(() => {
        setDownloadSuccess(false)
      }, 3000)
    } finally {
      setIsDownloading(false)
    }
  }

  // Mock documents data
  const documents = [
    { id: 1, name: "Staatsbürgerschaftsnachweis", status: "approved", required: true },
    { id: 2, name: "Pass", status: "pending", required: true },
    { id: 3, name: "Strafregister Erscheinung", status: "missing", required: true },
    { id: 4, name: "Arbeitserlaubnis", status: "missing", required: false },
    { id: 5, name: "Zusätzliche Dokumente", status: "missing", required: false },
  ]

  const visibleDocuments = isDocumentsExpanded ? documents : documents.slice(0, 3)

  const handleViewDocument = (documentName: string) => {
    // In a real app, this would open a modal or navigate to view the document
    console.log("Viewing document:", documentName)
  }

  const handleUploadDocument = (documentName: string) => {
    // In a real app, this would open a file picker or upload modal
    console.log("Uploading document:", documentName)
  }

  // Payroll countdown logic
  useEffect(() => {
    const calculatePayrollCountdown = () => {
      const now = new Date()
      const currentDay = now.getDate()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()
      
      // If today is the 15th, show payday message
      if (currentDay === 15) {
        setPayrollCountdown({ days: 0, hours: 0, minutes: 0, isPayday: true })
        return
      }
      
      // Calculate next payroll date (15th of current or next month)
      let nextPayrollDate: Date
      if (currentDay < 15) {
        // Next payroll is 15th of current month
        nextPayrollDate = new Date(currentYear, currentMonth, 15)
      } else {
        // Next payroll is 15th of next month
        nextPayrollDate = new Date(currentYear, currentMonth + 1, 15)
      }
      
      const timeDiff = nextPayrollDate.getTime() - now.getTime()
      
      if (timeDiff > 0) {
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
        
        setPayrollCountdown({ days, hours, minutes, isPayday: false })
      }
    }
    
    // Calculate immediately
    calculatePayrollCountdown()
    
    // Update every minute
    const interval = setInterval(calculatePayrollCountdown, 60000)
    
    return () => clearInterval(interval)
  }, [])

  // Mock statistics data
  const stats = {
    totalEinsaetze: 47,
    missedEinsaetzeDueSickness: 3,
    buddyTage: 12,
    completedSchulungen: 8,
    completedQuizzes: 15
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="border-none shadow-md bg-white dark:bg-gray-900">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20 border-4 border-blue-200 dark:border-blue-900">
              <AvatarImage src={userProfile.avatar} alt={userProfile.name} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-blue-700 text-lg font-medium">
                JP
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {userProfile.name}
              </h1>
              <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
                <MapPin className="h-4 w-4 mr-1" />
                {userProfile.location}
              </div>
              <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
                <Calendar className="h-4 w-4 mr-1" />
                Dabei seit {userProfile.joinDate}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="relative flex space-x-2 bg-gray-50 dark:bg-gray-800/50 p-1.5 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
        {/* Sliding Background Indicator */}
        <div 
          className={`absolute top-1.5 bottom-1.5 bg-white dark:bg-gray-700 shadow-sm border border-gray-200/50 dark:border-gray-600/50 rounded-lg transition-all duration-500 ease-in-out ${
            activeTab === "overview" 
              ? "left-1.5 right-[calc(50%+0.25rem)]" 
              : "left-[calc(50%+0.25rem)] right-1.5"
          }`}
        />
        
        <Button
          variant="ghost"
          className={`flex-1 rounded-lg transition-all duration-300 font-medium text-sm relative z-10 hover:bg-transparent focus:bg-transparent active:bg-transparent ${
            activeTab === "overview" 
              ? "bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent" 
              : "text-gray-600 dark:text-gray-400"
          }`}
          onClick={() => setActiveTab("overview")}
        >
          Übersicht
        </Button>
        <Button
          variant="ghost"
          className={`flex-1 rounded-lg transition-all duration-300 font-medium text-sm relative z-10 hover:bg-transparent focus:bg-transparent active:bg-transparent ${
            activeTab === "stats" 
              ? "bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent" 
              : "text-gray-600 dark:text-gray-400"
          }`}
          onClick={() => setActiveTab("stats")}
        >
          Statistiken
        </Button>
      </div>

            {/* Tab Content */}
      <div className="relative overflow-hidden">
        {/* Overview Tab */}
        <div className={`transition-all duration-500 ease-in-out ${
          activeTab === "overview" 
            ? "translate-x-0 opacity-100" 
            : "-translate-x-full opacity-0 absolute top-0 left-0 w-full"
        }`}>
          <div className="space-y-4 px-2">
                      {/* Contact Information */}
          <div className={`transition-all duration-300 rounded-lg ${
            isEditingContact 
              ? "bg-gradient-to-r from-blue-500 to-indigo-600 p-[2px]" 
              : "p-0"
          }`}>
            <Card className={`border-none bg-white dark:bg-gray-900 h-full ${
              isEditingContact ? "shadow-lg shadow-blue-500/20" : "shadow-lg shadow-blue-500/20"
            }`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <div className="flex items-center">
                    <Contact className="h-5 w-5 mr-2 text-blue-500" />
                    Kontaktdaten
                  </div>
                                  <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                  onClick={handleEditToggle}
                >
                  {isEditingContact ? (
                    <Check className="h-1.5 w-1.5 text-green-500" />
                  ) : (
                    <Edit2 className="h-1.5 w-1.5 text-gray-400/60 hover:text-gray-600/80 dark:hover:text-gray-300/80" />
                  )}
                </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  {isEditingContact ? (
                    <Input
                      type="email"
                      value={editableProfile.email}
                      onChange={(e) => setEditableProfile(prev => ({ ...prev, email: e.target.value }))}
                      className="text-sm !border-0 !ring-0 !ring-offset-0 focus-visible:!ring-0 focus-visible:!ring-offset-0 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 transition-all placeholder:text-gray-400"
                      placeholder="E-Mail eingeben..."
                    />
                  ) : (
                    <span className="text-sm text-gray-600 dark:text-gray-300">{editableProfile.email}</span>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  {isEditingContact ? (
                    <Input
                      type="tel"
                      value={editableProfile.phone}
                      onChange={(e) => setEditableProfile(prev => ({ ...prev, phone: e.target.value }))}
                      className="text-sm !border-0 !ring-0 !ring-offset-0 focus-visible:!ring-0 focus-visible:!ring-offset-0 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 transition-all placeholder:text-gray-400"
                      placeholder="Telefonnummer eingeben..."
                    />
                  ) : (
                    <span className="text-sm text-gray-600 dark:text-gray-300">{editableProfile.phone}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

                      {/* Clothing Size Information */}
          <div className={`transition-all duration-300 rounded-lg ${
            isEditingClothing 
              ? "bg-gradient-to-r from-blue-500 to-indigo-600 p-[2px]" 
              : "p-0"
          }`}>
                         <Card className="border-none shadow-lg shadow-purple-500/20 bg-white dark:bg-gray-900 h-full">
               <CardHeader className="pb-3">
                 <CardTitle className="text-lg flex items-center justify-between">
                   <div className="flex items-center">
                     <Ruler className="h-5 w-5 mr-2 text-purple-500" />
                    Kleidergröße
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                    onClick={handleClothingEditToggle}
                  >
                    {isEditingClothing ? (
                      <Check className="h-1.5 w-1.5 text-green-500" />
                    ) : (
                      <Edit2 className="h-1.5 w-1.5 text-gray-400/60 hover:text-gray-600/80 dark:hover:text-gray-300/80" />
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Körpergröße
                    </p>
                    {isEditingClothing ? (
                      <div className="flex items-center justify-center">
                        <Input
                          type="number"
                          value={editableClothing.height}
                          onChange={(e) => setEditableClothing(prev => ({ ...prev, height: e.target.value }))}
                          className="text-center text-xl font-semibold !border-0 !ring-0 !ring-offset-0 focus-visible:!ring-0 focus-visible:!ring-offset-0 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 transition-all w-20 mx-auto [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                          placeholder="178"
                        />
                        <span className="text-xl font-semibold text-gray-900 dark:text-gray-100 ml-1">cm</span>
                      </div>
                    ) : (
                      <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                        {editableClothing.height} cm
                      </p>
                    )}
                  </div>
                  <div className="space-y-1 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Kleidergröße
                    </p>
                    {isEditingClothing ? (
                      <Input
                        type="text"
                        value={editableClothing.size}
                        onChange={(e) => setEditableClothing(prev => ({ ...prev, size: e.target.value }))}
                        className="text-center text-xl font-semibold !border-0 !ring-0 !ring-offset-0 focus-visible:!ring-0 focus-visible:!ring-offset-0 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 transition-all w-16 mx-auto"
                        placeholder="L"
                      />
                    ) : (
                      <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                        {editableClothing.size}
                      </p>
                    )}
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Arbeitskleidung</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                      Erhalten
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* Dienstvertrag Card */}
            <Card 
              className="border-none shadow-lg shadow-blue-500/30 bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-600 h-24 flex items-center justify-center cursor-pointer hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 transition-all duration-300 group"
              onClick={() => setShowDienstvertragPopup(true)}
            >
              <div className="text-center">
                <FileSignature className="h-6 w-6 text-white mx-auto mb-2 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="text-white font-semibold text-xs">Dienstvertrag</h3>
              </div>
            </Card>

            {/* Sedcard Card */}
            <Card className="border-none shadow-lg shadow-purple-500/30 bg-gradient-to-r from-purple-400 via-purple-500 to-pink-500 h-24 flex items-center justify-center cursor-pointer hover:shadow-xl hover:shadow-purple-500/40 hover:scale-105 transition-all duration-300 group">
              <div className="text-center">
                <IdCard className="h-6 w-6 text-white mx-auto mb-2 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="text-white font-semibold text-xs">Sedcard</h3>
              </div>
            </Card>
          </div>

                      {/* Files & Documents */}
          <Card className="border-none shadow-lg shadow-green-500/20 bg-white dark:bg-gray-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <FileText className="h-5 w-5 mr-2 text-green-500" />
                Dokumente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {visibleDocuments.map((document) => (
                <div key={document.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 dark:text-gray-300">{document.name}</span>
                    {!document.required && (
                      <span className="text-xs text-gray-400 italic">(optional)</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {(document.status === "approved" || document.status === "pending") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 p-0 hover:bg-transparent transition-all duration-300 opacity-40 hover:opacity-80"
                        onClick={() => handleViewDocument(document.name)}
                      >
                        <Eye className="h-3 w-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
                      </Button>
                    )}
                    {document.status === "missing" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 p-0 hover:bg-transparent transition-all duration-300 opacity-40 hover:opacity-80"
                        onClick={() => handleUploadDocument(document.name)}
                      >
                        <Upload className="h-3 w-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
                      </Button>
                    )}
                    {document.status === "approved" ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : document.status === "pending" ? (
                      <Loader2 className="h-4 w-4 text-orange-400 animate-spin" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
            {documents.length > 3 && (
              <CardFooter className="pt-2 pb-3 flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                  onClick={() => setIsDocumentsExpanded(!isDocumentsExpanded)}
                >
                  {isDocumentsExpanded ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1 text-purple-500" />
                      Weniger anzeigen
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1 text-purple-500" />
                      Alle anzeigen
                    </>
                  )}
                </Button>
              </CardFooter>
            )}
          </Card>

          {/* Employment Information */}
          <Card className="border-none shadow-lg shadow-orange-500/20 bg-white dark:bg-gray-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center">
                  <Briefcase className="h-5 w-5 mr-2 text-orange-500" />
                  Anstellung
                </div>
                {/* Payroll Countdown */}
                <div className="text-right">
                  {payrollCountdown.isPayday ? (
                    <div className="text-xs font-semibold text-green-600 dark:text-green-400 flex items-center">
                      <span className="mr-1">🎉</span>
                      Gehalt ist auf dem Weg!
                    </div>
                  ) : (
                    <div className="flex flex-col items-end space-y-1">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Nächstes Gehalt in
                      </div>
                      <div className="text-xs font-mono text-orange-500 dark:text-orange-300">
                        {payrollCountdown.days}d {String(payrollCountdown.hours).padStart(2, '0')}h {String(payrollCountdown.minutes).padStart(2, '0')}m
                      </div>
                    </div>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Employment Type */}
              <div className="space-y-2">
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
                  Anstellungs Art
                </label>
                <div>
                  <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 font-medium">
                    geringfügig
                  </Badge>
                </div>
              </div>

              {/* Weekly Hours */}
              <div className="space-y-2">
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
                  Wochenstunden
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  8
                </p>
              </div>

              {/* Employment Status */}
              <div className="space-y-2">
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
                  Status
                </label>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  unbefristet
                </p>
              </div>

              {/* Working Days */}
              <div className="space-y-2">
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
                  Arbeitstage
                </label>
                <div className="flex gap-2">
                  <Badge variant="outline" className="border-black text-black bg-white dark:border-gray-300 dark:text-gray-900 dark:bg-white font-medium">
                    Mo
                  </Badge>
                  <Badge variant="outline" className="border-black text-black bg-white dark:border-gray-300 dark:text-gray-900 dark:bg-white font-medium">
                    Mi
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bank Data Information */}
          <div className={`transition-all duration-300 rounded-lg ${
            isEditingBank 
              ? "bg-gradient-to-r from-blue-500 to-indigo-600 p-[2px]" 
              : "p-0"
          }`}>
            <Card className="border-none shadow-lg shadow-blue-500/20 bg-white dark:bg-gray-900 h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <div className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2 text-blue-500" />
                    Bankdaten
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                    onClick={handleBankEditToggle}
                  >
                    {isEditingBank ? (
                      <Check className="h-1.5 w-1.5 text-green-500" />
                    ) : (
                      <Edit2 className="h-1.5 w-1.5 text-gray-400/60 hover:text-gray-600/80 dark:hover:text-gray-300/80" />
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {/* Account Holder */}
                  <div className="space-y-2">
                    <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
                      Kontoinhaber
                    </label>
                    {isEditingBank ? (
                      <Input
                        type="text"
                        value={editableBankData.accountHolder}
                        onChange={(e) => setEditableBankData(prev => ({ ...prev, accountHolder: e.target.value }))}
                        className="text-sm !border-0 !ring-0 !ring-offset-0 focus-visible:!ring-0 focus-visible:!ring-offset-0 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 transition-all"
                        placeholder="Vollständiger Name"
                      />
                    ) : (
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {editableBankData.accountHolder}
                      </p>
                    )}
                  </div>

                  {/* Bank Name */}
                  <div className="space-y-2">
                    <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
                      Bankname
                    </label>
                    {isEditingBank ? (
                      <Input
                        type="text"
                        value={editableBankData.bankName}
                        onChange={(e) => setEditableBankData(prev => ({ ...prev, bankName: e.target.value }))}
                        className="text-sm !border-0 !ring-0 !ring-offset-0 focus-visible:!ring-0 focus-visible:!ring-offset-0 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 transition-all"
                        placeholder="Name der Bank"
                      />
                    ) : (
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {editableBankData.bankName}
                      </p>
                    )}
                  </div>

                  {/* IBAN */}
                  <div className="space-y-2">
                    <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
                      IBAN
                    </label>
                    {isEditingBank ? (
                      <Input
                        type="text"
                        value={editableBankData.iban}
                        onChange={(e) => setEditableBankData(prev => ({ ...prev, iban: e.target.value }))}
                        className="text-sm font-mono !border-0 !ring-0 !ring-offset-0 focus-visible:!ring-0 focus-visible:!ring-offset-0 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 transition-all"
                        placeholder="AT00 0000 0000 0000 0000"
                      />
                    ) : (
                      <p className="text-sm font-mono font-medium text-gray-900 dark:text-gray-100 tracking-wider">
                        {maskIban(editableBankData.iban)}
                      </p>
                    )}
                  </div>

                  {/* BIC */}
                  <div className="space-y-2">
                    <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
                      BIC
                    </label>
                    {isEditingBank ? (
                      <Input
                        type="text"
                        value={editableBankData.bic}
                        onChange={(e) => setEditableBankData(prev => ({ ...prev, bic: e.target.value }))}
                        className="text-sm font-mono !border-0 !ring-0 !ring-offset-0 focus-visible:!ring-0 focus-visible:!ring-offset-0 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 transition-all"
                        placeholder="BANKCODE"
                      />
                    ) : (
                      <p className="text-sm font-mono font-medium text-gray-900 dark:text-gray-100 tracking-wider">
                        {editableBankData.bic}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Personal Information */}
          <div className={`transition-all duration-300 rounded-lg ${
            isEditingPersonal 
              ? "bg-gradient-to-r from-blue-500 to-indigo-600 p-[2px]" 
              : "p-0"
          }`}>
                         <Card className="border-none shadow-lg shadow-green-500/20 bg-white dark:bg-gray-900 h-full">
               <CardHeader className="pb-3">
                 <CardTitle className="text-lg flex items-center justify-between">
                   <div className="flex items-center">
                     <User className="h-5 w-5 mr-2 text-green-500" />
                    Sonstige
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                    onClick={handlePersonalEditToggle}
                  >
                    {isEditingPersonal ? (
                      <Check className="h-1.5 w-1.5 text-green-500" />
                    ) : (
                      <Edit2 className="h-1.5 w-1.5 text-gray-400/60 hover:text-gray-600/80 dark:hover:text-gray-300/80" />
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {/* Birthday */}
                  <div className="space-y-2">
                    <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
                      Geburtstag
                    </label>
                    {isEditingPersonal ? (
                      <Input
                        type="text"
                        value={editablePersonalData.birthday}
                        onChange={(e) => setEditablePersonalData(prev => ({ ...prev, birthday: e.target.value }))}
                        className="text-sm !border-0 !ring-0 !ring-offset-0 focus-visible:!ring-0 focus-visible:!ring-offset-0 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 transition-all"
                        placeholder="TT.MM.JJJJ"
                      />
                    ) : (
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {editablePersonalData.birthday}
                      </p>
                    )}
                  </div>

                  {/* Social Security Number */}
                  <div className="space-y-2">
                    <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
                      SV Nummer
                    </label>
                    {isEditingPersonal ? (
                      <Input
                        type="text"
                        value={editablePersonalData.socialSecurityNumber}
                        onChange={(e) => setEditablePersonalData(prev => ({ ...prev, socialSecurityNumber: e.target.value }))}
                        className="text-sm font-mono !border-0 !ring-0 !ring-offset-0 focus-visible:!ring-0 focus-visible:!ring-offset-0 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 transition-all"
                        placeholder="1234 DDMMYY"
                      />
                    ) : (
                      <p className="text-sm font-mono font-medium text-gray-900 dark:text-gray-100 tracking-wider">
                        {editablePersonalData.socialSecurityNumber}
                      </p>
                    )}
                  </div>

                  {/* Citizenship */}
                  <div className="space-y-2">
                    <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
                      Staatsbürgerschaft
                    </label>
                    {isEditingPersonal ? (
                      <Input
                        type="text"
                        value={editablePersonalData.citizenship}
                        onChange={(e) => setEditablePersonalData(prev => ({ ...prev, citizenship: e.target.value }))}
                        className="text-sm !border-0 !ring-0 !ring-offset-0 focus-visible:!ring-0 focus-visible:!ring-offset-0 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 transition-all"
                        placeholder="Land der Staatsbürgerschaft"
                      />
                    ) : (
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {editablePersonalData.citizenship}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Empty space for shadow visibility */}
          <div className="h-4"></div>
          </div>
        </div>

        {/* Stats Tab */}
        <div className={`transition-all duration-500 ease-in-out ${
          activeTab === "stats" 
            ? "translate-x-0 opacity-100" 
            : "translate-x-full opacity-0 absolute top-0 left-0 w-full"
        }`}>
          <div className="space-y-4">
            {/* Einsätze Statistics */}
            <Card className="border-none shadow-md bg-white dark:bg-gray-900">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Briefcase className="h-5 w-5 mr-2 text-blue-500" />
                  Einsätze
                </CardTitle>
              </CardHeader>
                          <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-500/50 ring-2 ring-green-500/20"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">Absolvierte Einsätze</span>
                </div>
                <span className="text-xl font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                  {stats.totalEinsaetze}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-2 h-2 rounded-full bg-red-500 shadow-sm shadow-red-500/50 ring-2 ring-red-500/20"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">Verpasst (Krankheit)</span>
                </div>
                <span className="text-xl font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                  {stats.missedEinsaetzeDueSickness}
                </span>
              </div>
            </CardContent>
            </Card>

            {/* Buddy & Training Statistics */}
            <Card className="border-none shadow-md bg-white dark:bg-gray-900">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Users className="h-5 w-5 mr-2 text-purple-500" />
                  Zusammenarbeit
                </CardTitle>
              </CardHeader>
                          <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-2 h-2 rounded-full bg-purple-500 shadow-sm shadow-purple-500/50 ring-2 ring-purple-500/20"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">Buddy Tage</span>
                </div>
                <span className="text-xl font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                  {stats.buddyTage}
                </span>
              </div>
            </CardContent>
            </Card>

            {/* Learning Statistics */}
            <Card className="border-none shadow-md bg-white dark:bg-gray-900">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2 text-green-500" />
                  Weiterbildung
                </CardTitle>
              </CardHeader>
                          <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-500/50 ring-2 ring-green-500/20"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">Abgeschlossene Schulungen</span>
                </div>
                <span className="text-xl font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                  {stats.completedSchulungen}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50 ring-2 ring-blue-500/20"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">Abgeschlossene Quizzes</span>
                </div>
                <span className="text-xl font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                  {stats.completedQuizzes}
                </span>
              </div>
            </CardContent>
            </Card>

            {/* Performance Summary */}
            <Card className="border-none shadow-md bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-indigo-500" />
                  Leistungsübersicht
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {Math.round((stats.totalEinsaetze / (stats.totalEinsaetze + stats.missedEinsaetzeDueSickness)) * 100)}%
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Anwesenheitsrate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {stats.completedSchulungen + stats.completedQuizzes}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Lernaktivitäten</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dienstvertrag Popup */}
      {showDienstvertragPopup && (
        <>
          <div 
            className="fixed inset-0 bg-black/30 z-[60] backdrop-blur-sm"
            onClick={() => setShowDienstvertragPopup(false)}
          ></div>
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-xl shadow-xl z-[70] p-0 w-96 max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-t-xl">
              <h3 className="text-lg font-semibold text-center">Meine Dienstverträge</h3>
            </div>
            
            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* New Contract Available */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-red-500 text-lg font-black animate-pulse">!</span>
                    <span className="text-sm font-semibold text-green-700 dark:text-green-300">Neuer Vertrag verfügbar</span>
                  </div>
                  <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">Bereit</span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  <div>Wochenstunden: 20h → 32h</div>
                  <div>Gültig ab: 01.12.2024</div>
                </div>
                <button 
                  className="w-full p-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-sm font-medium rounded-lg transition-all duration-200"
                  onClick={handleDienstvertragSelect}
                >
                  Ansehen & Unterschreiben
                </button>
              </div>

              {/* Current Active Contract */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Aktiver Vertrag</span>
                  <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">Aktiv</span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  <div>Wochenstunden: 20h</div>
                  <div>Laufzeit: 01.08.2024 - unbefristet</div>
                  <div>Status: geringfügig</div>
                </div>
                <button 
                  className="w-full p-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-sm font-medium rounded-lg transition-all duration-200"
                  onClick={handleDienstvertragSelect}
                >
                  Vertrag ansehen
                </button>
              </div>

              {/* Previous Contracts */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 px-1">Frühere Verträge</h4>
                
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Vertrag v2.0</span>
                    <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">Beendet</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mb-2">
                    <div>Wochenstunden: 8h</div>
                    <div>Laufzeit: 01.02.2024 - 31.07.2024</div>
                  </div>
                  <button 
                    className="w-full p-2 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-all duration-200"
                    onClick={handleDienstvertragSelect}
                  >
                    Archiv ansehen
                  </button>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Vertrag v1.0</span>
                    <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">Beendet</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mb-2">
                    <div>Wochenstunden: 8h</div>
                    <div>Laufzeit: 01.02.2023 - 31.01.2024</div>
                  </div>
                  <button 
                    className="w-full p-2 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-all duration-200"
                    onClick={handleDienstvertragSelect}
                  >
                    Archiv ansehen
                  </button>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <button 
                onClick={() => setShowDienstvertragPopup(false)}
                className="w-full p-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Schließen
              </button>
            </div>
          </div>
        </>
        )}

        {/* Dienstvertrag Content Popup */}
        {showDienstvertragContent && (
          <>
            <div 
              className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm"
              onClick={() => setShowDienstvertragContent(false)}
            ></div>
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-lg shadow-xl z-[70] p-0 w-[90vw] max-w-4xl max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">Dienstvertrag</h3>
                  <div className="flex items-center space-x-2">
                    {/* Download PDF Button */}
                    <button 
                      onClick={exportDienstvertragAsPDF}
                      disabled={isDownloading}
                      className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200 disabled:opacity-50"
                      title="Als PDF herunterladen"
                    >
                      {downloadSuccess ? (
                        <Check className="h-5 w-5 text-green-400" />
                      ) : (
                        <Download className={`h-5 w-5 ${isDownloading ? 'animate-pulse' : ''}`} />
                      )}
                    </button>
                    
                    {/* Close Button */}
                    <button 
                      onClick={() => setShowDienstvertragContent(false)}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Content */}
              <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
                <div id="dienstvertrag-content">
                  <DienstvertragTemplate
                    promotorName={userProfile.name}
                    promotorBirthDate={editablePersonalData.birthday}
                    promotorAddress={userProfile.location}
                    hoursPerWeek={"32"}
                    monthlyGross={"2000"}
                    startDate={"01.02.2023"}
                    endDate={"30.06.2023"}
                    isTemporary={true}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    )
} 