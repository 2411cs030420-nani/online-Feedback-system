import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  CheckCircle, 
  AlertCircle, 
  Trash2, 
  Search, 
  Filter, 
  Lock, 
  LogOut, 
  Database, 
  Calendar, 
  Mail, 
  Phone, 
  User, 
  Tag, 
  RefreshCw, 
  FileText, 
  Download,
  Check,
  ChevronRight,
  Shield,
  Activity,
  ArrowRight,
  X,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Feedback {
  id: string;
  name: string;
  email: string;
  mobile: string;
  subject: string;
  category: string;
  message: string;
  status: 'Pending' | 'In Progress' | 'Resolved';
  created_at: string;
}

export default function App() {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState<'submit' | 'admin'>('submit');

  // Submit Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formCategory, setFormCategory] = useState('Technical Issue');
  const [formMessage, setFormMessage] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Submit API status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Admin Auth State
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminToken, setAdminToken] = useState<string | null>(() => localStorage.getItem('adminToken'));
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Admin Dashboard State
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoadingFeedbacks, setIsLoadingFeedbacks] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  // Stats Counters
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 });

  // Fetch Feedbacks (Admin view)
  const fetchFeedbacks = async () => {
    if (!adminToken) return;
    setIsLoadingFeedbacks(true);
    setDashboardError(null);
    try {
      const queryParams = new URLSearchParams();
      if (searchQuery) queryParams.append('search', searchQuery);
      if (categoryFilter) queryParams.append('category', categoryFilter);
      if (statusFilter) queryParams.append('status', statusFilter);

      const response = await fetch(`/api/feedback?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch feedback records');
      }
      const data: Feedback[] = await response.json();
      setFeedbacks(data);
      
      // Calculate real stats from the full list (unfiltered)
      const fullResponse = await fetch('/api/feedback');
      if (fullResponse.ok) {
        const allData: Feedback[] = await fullResponse.json();
        setStats({
          total: allData.length,
          pending: allData.filter(f => f.status === 'Pending').length,
          inProgress: allData.filter(f => f.status === 'In Progress').length,
          resolved: allData.filter(f => f.status === 'Resolved').length,
        });
      }
    } catch (err: any) {
      setDashboardError(err.message || 'Something went wrong while fetching feedback.');
    } finally {
      setIsLoadingFeedbacks(false);
    }
  };

  // Re-fetch feedbacks when filters or search changes (and we are authenticated)
  useEffect(() => {
    if (adminToken) {
      const delayDebounce = setTimeout(() => {
        fetchFeedbacks();
      }, 300); // 300ms debounce
      return () => clearTimeout(delayDebounce);
    }
  }, [searchQuery, categoryFilter, statusFilter, adminToken]);

  // Form Submission Validation
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formName.trim()) errors.name = "Name is required";
    
    if (!formEmail.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formEmail)) {
      errors.email = "Please enter a valid email address";
    }

    if (!formMobile.trim()) {
      errors.mobile = "Mobile number is required";
    } else if (!/^[0-9]{10}$/.test(formMobile.trim().replace(/[- )(]/g, ''))) {
      errors.mobile = "Please enter a valid 10-digit mobile number";
    }

    if (!formSubject.trim()) errors.subject = "Subject is required";
    if (!formMessage.trim()) errors.message = "Message details are required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Feedback Submission
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const cleanMobile = formMobile.trim().replace(/[- )(]/g, '');
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          mobile: cleanMobile,
          subject: formSubject,
          category: formCategory,
          message: formMessage
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit feedback.');
      }

      setSubmitSuccess(result.message);
      // Reset form on success
      setFormName('');
      setFormEmail('');
      setFormMobile('');
      setFormSubject('');
      setFormCategory('Technical Issue');
      setFormMessage('');
      setFormErrors({});
    } catch (err: any) {
      setSubmitError(err.message || 'Server error. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Admin Login Handle
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!adminUsername || !adminPassword) {
      setAuthError("Please fill in all fields.");
      return;
    }

    setIsLoggingIn(true);
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminUsername, password: adminPassword })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Invalid username or password.');
      }

      setAdminToken(result.token);
      localStorage.setItem('adminToken', result.token);
      setAdminUsername('');
      setAdminPassword('');
    } catch (err: any) {
      setAuthError(err.message || 'Login failed.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Admin Logout
  const handleAdminLogout = () => {
    setAdminToken(null);
    localStorage.removeItem('adminToken');
    setFeedbacks([]);
  };

  // Update Status API
  const handleUpdateStatus = async (id: string, newStatus: 'Pending' | 'In Progress' | 'Resolved') => {
    try {
      const response = await fetch(`/api/feedback/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update status.');
      }

      // Update local state smoothly
      setFeedbacks(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
      if (selectedFeedback && selectedFeedback.id === id) {
        setSelectedFeedback(prev => prev ? { ...prev, status: newStatus } : null);
      }
      
      // Refresh stats
      fetchFeedbacks();
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    }
  };

  // Delete Feedback API
  const handleDeleteFeedback = async (id: string) => {
    try {
      const response = await fetch(`/api/feedback/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete record.');
      }

      // Remove from states
      setFeedbacks(prev => prev.filter(item => item.id !== id));
      if (selectedFeedback && selectedFeedback.id === id) {
        setSelectedFeedback(null);
      }
      setIsDeletingId(null);

      // Refresh stats
      fetchFeedbacks();
    } catch (err: any) {
      alert(err.message || 'Error deleting feedback');
    }
  };

  // Export CSV Data
  const exportToCSV = () => {
    if (feedbacks.length === 0) return;
    const headers = ['ID', 'Name', 'Email', 'Mobile', 'Subject', 'Category', 'Message', 'Status', 'Submitted At'];
    const rows = feedbacks.map(f => [
      f.id,
      `"${f.name.replace(/"/g, '""')}"`,
      f.email,
      f.mobile,
      `"${f.subject.replace(/"/g, '""')}"`,
      f.category,
      `"${f.message.replace(/"/g, '""')}"`,
      f.status,
      f.created_at
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `feedback_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased flex flex-col">
      
      {/* 1. Header/Navigation */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-900 tracking-tight leading-none">Online Feedback System</h1>
              <span className="text-xs text-indigo-600 font-medium">Customer Support & Grievance Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('submit')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'submit'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Plus className="w-4 h-4" />
              Submit Feedback
            </button>
            <button
              onClick={() => {
                setActiveTab('admin');
                if (adminToken) {
                  fetchFeedbacks();
                }
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'admin'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Shield className="w-4 h-4" />
              Admin Portal
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Body Content Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          
          {/* USER MODULE - SUBMIT FEEDBACK */}
          {activeTab === 'submit' && (
            <motion.div
              key="submit-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              {/* Left Column: Context Card */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-8 rounded-2xl shadow-xl space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-indigo-500/20 blur-3xl"></div>
                  <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-pink-500/10 blur-3xl"></div>

                  <div className="inline-flex px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-xs font-semibold tracking-wider uppercase text-indigo-300">
                    User Module
                  </div>
                  
                  <h2 className="text-3xl font-bold tracking-tight text-white">We Value Your Honest Feedback</h2>
                  <p className="text-indigo-200 text-sm leading-relaxed">
                    Have a complaint, a feature request, or just general comments? Submit your inquiry through our official feedback channel, and our system will route it to the appropriate admin team instantly.
                  </p>

                  <div className="space-y-4 pt-4 border-t border-indigo-800">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-800 flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 text-indigo-300" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">Real-time status tracking</h4>
                        <p className="text-xs text-indigo-300">Every submission is recorded with an instantly generated ID.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-800 flex items-center justify-center shrink-0">
                        <Activity className="w-4 h-4 text-indigo-300" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">Direct action pipelines</h4>
                        <p className="text-xs text-indigo-300">Complaints can transition from Pending to In Progress to Resolved.</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 flex items-center gap-3">
                    <span className="text-xs text-indigo-400">Database Engine Status:</span>
                    <span className="inline-flex items-center gap-1.5 py-0.5 px-2.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      MySQL Connected (Spring JPA ready)
                    </span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  <h3 className="font-semibold text-sm text-slate-900">Frequently Filed Categories</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <span className="font-bold text-slate-800">Technical Issue</span>
                      <p className="text-slate-500 mt-1">Platform bugs, loading speeds, crashes.</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <span className="font-bold text-slate-800">Billing</span>
                      <p className="text-slate-500 mt-1">Invoices, refund requests, transactions.</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <span className="font-bold text-slate-800">Feature Request</span>
                      <p className="text-slate-500 mt-1">New ideas, export tools, UI settings.</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <span className="font-bold text-slate-800">Other</span>
                      <p className="text-slate-500 mt-1">General inquiries and comments.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Submission Form */}
              <div className="lg:col-span-7">
                <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
                  
                  {submitSuccess ? (
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center py-12 px-4 space-y-6"
                    >
                      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-inner">
                        <CheckCircle className="w-10 h-10" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-2xl font-bold text-slate-950">Thank You!</h3>
                        <p className="text-slate-600 text-sm">{submitSuccess}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl text-xs font-mono text-slate-500 max-w-sm mx-auto flex items-center justify-between">
                        <span>Database: JPA HIBERNATE</span>
                        <span className="text-indigo-600 font-bold">@Table(name="feedback")</span>
                      </div>
                      <button
                        onClick={() => setSubmitSuccess(null)}
                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm inline-flex items-center gap-2"
                      >
                        Submit Another Feedback
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleSubmitFeedback} className="space-y-6">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Submit Feedback or Complaint</h3>
                        <p className="text-xs text-slate-500 mt-1">Please provide accurate contact details so we can assist you effectively.</p>
                      </div>

                      {submitError && (
                        <div className="p-4 bg-rose-50 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{submitError}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-600 block">Your Full Name</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                              <User className="w-4 h-4" />
                            </span>
                            <input
                              type="text"
                              value={formName}
                              onChange={(e) => setFormName(e.target.value)}
                              placeholder="e.g. John Doe"
                              className={`w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all ${
                                formErrors.name ? 'border-rose-300 focus:ring-rose-500/20' : 'border-slate-200'
                              }`}
                            />
                          </div>
                          {formErrors.name && <p className="text-rose-500 text-xxs font-medium mt-0.5">{formErrors.name}</p>}
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-600 block">Email Address</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                              <Mail className="w-4 h-4" />
                            </span>
                            <input
                              type="email"
                              value={formEmail}
                              onChange={(e) => setFormEmail(e.target.value)}
                              placeholder="e.g. name@example.com"
                              className={`w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all ${
                                formErrors.email ? 'border-rose-300 focus:ring-rose-500/20' : 'border-slate-200'
                              }`}
                            />
                          </div>
                          {formErrors.email && <p className="text-rose-500 text-xxs font-medium mt-0.5">{formErrors.email}</p>}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-600 block">Mobile Number (10 digits)</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                              <Phone className="w-4 h-4" />
                            </span>
                            <input
                              type="text"
                              value={formMobile}
                              onChange={(e) => setFormMobile(e.target.value)}
                              placeholder="e.g. 9876543210"
                              className={`w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all ${
                                formErrors.mobile ? 'border-rose-300 focus:ring-rose-500/20' : 'border-slate-200'
                              }`}
                            />
                          </div>
                          {formErrors.mobile && <p className="text-rose-500 text-xxs font-medium mt-0.5">{formErrors.mobile}</p>}
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-600 block">Feedback Category</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                              <Tag className="w-4 h-4" />
                            </span>
                            <select
                              value={formCategory}
                              onChange={(e) => setFormCategory(e.target.value)}
                              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all appearance-none cursor-pointer"
                            >
                              <option value="Technical Issue">Technical Issue</option>
                              <option value="Billing">Billing</option>
                              <option value="Feature Request">Feature Request</option>
                              <option value="Other">Other</option>
                            </select>
                            <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                              <ChevronRight className="w-4 h-4 rotate-90" />
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600 block">Subject / Short Heading</label>
                        <input
                          type="text"
                          value={formSubject}
                          onChange={(e) => setFormSubject(e.target.value)}
                          placeholder="e.g. Discrepancy on invoice checkout page"
                          className={`w-full px-4 py-2 text-sm bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all ${
                            formErrors.subject ? 'border-rose-300 focus:ring-rose-500/20' : 'border-slate-200'
                          }`}
                        />
                        {formErrors.subject && <p className="text-rose-500 text-xxs font-medium mt-0.5">{formErrors.subject}</p>}
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600 block">Detailed Description of Complaint / Feedback</label>
                        <textarea
                          rows={4}
                          value={formMessage}
                          onChange={(e) => setFormMessage(e.target.value)}
                          placeholder="Please provide steps to reproduce, or elaborate on your comment..."
                          className={`w-full px-4 py-2 text-sm bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all ${
                            formErrors.message ? 'border-rose-300 focus:ring-rose-500/20' : 'border-slate-200'
                          }`}
                        ></textarea>
                        {formErrors.message && <p className="text-rose-500 text-xxs font-medium mt-0.5">{formErrors.message}</p>}
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold tracking-wide hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Filing complaint to backend...
                          </>
                        ) : (
                          <>
                            Submit Complaint Record
                            <ChevronRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ADMIN PORTAL */}
          {activeTab === 'admin' && (
            <motion.div
              key="admin-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              {!adminToken ? (
                /* ADMIN LOGIN SCREEN */
                <div className="max-w-md mx-auto py-12">
                  <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-lg space-y-6">
                    <div className="text-center space-y-2">
                      <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mx-auto shadow-inner">
                        <Lock className="w-5 h-5" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 tracking-tight">Admin Authentication</h3>
                      <p className="text-xs text-slate-500">Access grievances, update status, and manage records.</p>
                    </div>

                    <form onSubmit={handleAdminLogin} className="space-y-4">
                      {authError && (
                        <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{authError}</span>
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600 block">Username</label>
                        <input
                          type="text"
                          value={adminUsername}
                          onChange={(e) => setAdminUsername(e.target.value)}
                          placeholder="e.g. admin"
                          className="w-full px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600 block">Password</label>
                        <input
                          type="password"
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isLoggingIn}
                        className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 active:bg-slate-950 text-white rounded-xl text-sm font-semibold tracking-wide transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isLoggingIn ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Authenticating...
                          </>
                        ) : (
                          <>
                            Unlock Dashboard
                            <ChevronRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>

                    <div className="p-4 bg-amber-50/70 border border-amber-200/50 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-800 text-xs font-semibold">
                        <Database className="w-3.5 h-3.5" />
                        Credentials Reminder
                      </div>
                      <p className="text-xxs text-amber-700/80 leading-normal">
                        Use the standard administrative testing credentials:<br />
                        Username: <span className="font-mono bg-amber-100 px-1 rounded text-amber-900 font-semibold">admin</span><br />
                        Password: <span className="font-mono bg-amber-100 px-1 rounded text-amber-900 font-semibold">admin123</span>
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* ADMIN DASHBOARD VIEW */
                <div className="space-y-8">
                  
                  {/* Dashboard Header Panel */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex py-0.5 px-2 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-md border border-indigo-100">
                          Active Session
                        </span>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Grievance Desk</h2>
                      </div>
                      <p className="text-xs text-slate-500">Monitor submissions, manage ticket cycles, and update resolution flows.</p>
                    </div>

                    <div className="flex items-center gap-2.5 w-full md:w-auto">
                      <button
                        onClick={exportToCSV}
                        disabled={feedbacks.length === 0}
                        className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shrink-0"
                      >
                        <Download className="w-4 h-4 text-slate-500" />
                        Export Report (.CSV)
                      </button>

                      <button
                        onClick={handleAdminLogout}
                        className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0"
                      >
                        <LogOut className="w-4 h-4" />
                        Log Out
                      </button>
                    </div>
                  </div>

                  {/* Top Stats Metric Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-medium text-slate-500">Total Grievances</span>
                        <p className="text-2xl font-bold text-slate-950 mt-0.5">{stats.total}</p>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center font-bold">
                        <span className="text-sm">⏳</span>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-slate-500">Pending Actions</span>
                        <p className="text-2xl font-bold text-slate-950 mt-0.5">{stats.pending}</p>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-700 border border-sky-100 flex items-center justify-center font-bold">
                        <span className="text-sm">⚙️</span>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-slate-500">In Progress</span>
                        <p className="text-2xl font-bold text-slate-950 mt-0.5">{stats.inProgress}</p>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-bold">
                        <span className="text-sm">✅</span>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-slate-500">Resolved Grievances</span>
                        <p className="text-2xl font-bold text-slate-950 mt-0.5">{stats.resolved}</p>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Search & Filtration Bars */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-3">
                    <div className="relative flex-grow">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                        <Search className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        placeholder="Search by name, email, subject, mobile, or reference ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all placeholder:text-slate-400"
                      />
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                      <div className="relative w-full md:w-48">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                          <Filter className="w-3.5 h-3.5" />
                        </span>
                        <select
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                          className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white cursor-pointer appearance-none font-semibold text-slate-600"
                        >
                          <option value="">All Categories</option>
                          <option value="Technical Issue">Technical Issue</option>
                          <option value="Billing">Billing</option>
                          <option value="Feature Request">Feature Request</option>
                          <option value="Other">Other</option>
                        </select>
                        <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                          <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                        </span>
                      </div>

                      <div className="relative w-full md:w-48">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                          <Activity className="w-3.5 h-3.5" />
                        </span>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white cursor-pointer appearance-none font-semibold text-slate-600"
                        >
                          <option value="">All Statuses</option>
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                        <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                          <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                        </span>
                      </div>

                      <button
                        onClick={fetchFeedbacks}
                        className="p-2 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-50 transition-colors"
                        title="Reload Feedbacks"
                      >
                        <RefreshCw className={`w-4 h-4 ${isLoadingFeedbacks ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Main Grid: Data Table and Sidebar Message Panel */}
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                    
                    {/* Left Column: Big Data Table */}
                    <div className="xl:col-span-8 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                      
                      {dashboardError && (
                        <div className="m-4 p-4 bg-rose-50 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{dashboardError}</span>
                        </div>
                      )}

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 text-xxs font-bold tracking-wider uppercase">
                              <th className="py-4 px-6">Grievance Info</th>
                              <th className="py-4 px-4">Category</th>
                              <th className="py-4 px-4">Status</th>
                              <th className="py-4 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-sm">
                            {isLoadingFeedbacks ? (
                              <tr>
                                <td colSpan={4} className="py-12 text-center text-slate-400">
                                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
                                  <p className="text-xs mt-2 font-medium">Scanning feedback logs...</p>
                                </td>
                              </tr>
                            ) : feedbacks.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="py-16 text-center text-slate-400">
                                  <Database className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                  <p className="text-sm font-semibold text-slate-700">No records found</p>
                                  <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search keywords.</p>
                                </td>
                              </tr>
                            ) : (
                              feedbacks.map((f) => {
                                const isSelected = selectedFeedback?.id === f.id;
                                return (
                                  <tr 
                                    key={f.id} 
                                    onClick={() => setSelectedFeedback(f)}
                                    className={`group hover:bg-slate-50/50 cursor-pointer transition-colors ${
                                      isSelected ? 'bg-indigo-50/40 hover:bg-indigo-50/50' : ''
                                    }`}
                                  >
                                    <td className="py-4 px-6">
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-mono text-xxs text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">
                                            {f.id}
                                          </span>
                                          <h4 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                            {f.name}
                                          </h4>
                                        </div>
                                        <p className="text-slate-700 text-xs font-medium line-clamp-1">{f.subject}</p>
                                        <div className="flex items-center gap-3 text-xxs text-slate-400 font-medium">
                                          <span className="flex items-center gap-1">
                                            <Mail className="w-3 h-3 text-slate-300" />
                                            {f.email}
                                          </span>
                                          <span className="flex items-center gap-1">
                                            <Phone className="w-3 h-3 text-slate-300" />
                                            {f.mobile}
                                          </span>
                                        </div>
                                      </div>
                                    </td>
                                    
                                    <td className="py-4 px-4 whitespace-nowrap">
                                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                        {f.category}
                                      </span>
                                    </td>

                                    <td className="py-4 px-4 whitespace-nowrap">
                                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                                        f.status === 'Resolved'
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                          : f.status === 'In Progress'
                                          ? 'bg-sky-50 text-sky-700 border border-sky-100'
                                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                                      }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                          f.status === 'Resolved' ? 'bg-emerald-500' : f.status === 'In Progress' ? 'bg-sky-500' : 'bg-amber-500'
                                        }`}></span>
                                        {f.status}
                                      </span>
                                    </td>

                                    <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                                      <div className="flex items-center justify-end gap-1">
                                        <select
                                          value={f.status}
                                          onChange={(e) => handleUpdateStatus(f.id, e.target.value as any)}
                                          className="text-xs font-bold border border-slate-200 bg-white rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer text-slate-600"
                                        >
                                          <option value="Pending">Pending</option>
                                          <option value="In Progress">In Progress</option>
                                          <option value="Resolved">Resolved</option>
                                        </select>

                                        <button
                                          onClick={() => setIsDeletingId(f.id)}
                                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                          title="Delete Feedback"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Right Column: Sticky Detailed Complaint Viewer */}
                    <div className="xl:col-span-4 sticky top-24">
                      {selectedFeedback ? (
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <div className="flex items-center gap-1.5 text-xxs font-semibold text-slate-400 font-mono">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(selectedFeedback.created_at).toLocaleString()}
                              </div>
                              <h3 className="font-bold text-slate-900 text-base mt-1">Ticket: {selectedFeedback.id}</h3>
                            </div>
                            <button
                              onClick={() => setSelectedFeedback(null)}
                              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="p-4 bg-slate-50 rounded-xl space-y-3 text-xs">
                            <div className="flex justify-between">
                              <span className="text-slate-500 font-medium">Filer Name</span>
                              <span className="font-semibold text-slate-900">{selectedFeedback.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500 font-medium">Email Address</span>
                              <span className="font-semibold text-slate-900 font-mono">{selectedFeedback.email}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500 font-medium">Phone Number</span>
                              <span className="font-semibold text-slate-900 font-mono">{selectedFeedback.mobile}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500 font-medium">Classification</span>
                              <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{selectedFeedback.category}</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <span className="text-xs font-bold text-slate-500 tracking-wide uppercase">Message details</span>
                            <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-xl text-xs leading-relaxed text-slate-700 font-medium whitespace-pre-wrap">
                              <span className="font-bold text-slate-900 block mb-2 text-sm">Subject: {selectedFeedback.subject}</span>
                              {selectedFeedback.message}
                            </div>
                          </div>

                          <div className="space-y-2 pt-4 border-t border-slate-100">
                            <span className="text-xs font-bold text-slate-500 tracking-wide uppercase block">Quick Status Resolution</span>
                            <div className="grid grid-cols-3 gap-2">
                              {['Pending', 'In Progress', 'Resolved'].map((st) => {
                                const isActive = selectedFeedback.status === st;
                                return (
                                  <button
                                    key={st}
                                    onClick={() => handleUpdateStatus(selectedFeedback.id, st as any)}
                                    className={`py-2 px-1 rounded-xl text-xxs font-bold border transition-all ${
                                      isActive
                                        ? st === 'Resolved'
                                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-100'
                                          : st === 'In Progress'
                                          ? 'bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-100'
                                          : 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-100'
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                    }`}
                                  >
                                    {st}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-50/50 p-8 rounded-2xl border border-dashed border-slate-200 text-center text-slate-400 space-y-2">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mx-auto">
                            <Plus className="w-4 h-4" />
                          </div>
                          <h4 className="font-semibold text-xs text-slate-700">Detailed Complaint Inspector</h4>
                          <p className="text-xxs text-slate-400 leading-normal max-w-xs mx-auto">
                            Select any complaint record from the table to inspect details, view full subjects, copy contact emails, or change status instantly.
                          </p>
                        </div>
                      )}
                    </div>

                  </div>

                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* 3. Delete Confirmation Overlay Modals */}
      <AnimatePresence>
        {isDeletingId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full border border-slate-100 space-y-6"
            >
              <div className="space-y-2 text-center">
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-950 text-base">Confirm Record Deletion</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Are you sure you want to permanently delete grievance file <span className="font-mono bg-slate-100 px-1 rounded text-slate-800 font-bold">{isDeletingId}</span>? This action is irreversible.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => setIsDeletingId(null)}
                  className="py-2.5 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteFeedback(isDeletingId)}
                  className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-lg shadow-rose-100"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Footer credits with humbleness and Spring Boot/Java metadata for design-honesty */}
      <footer className="border-t border-slate-100 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
          <div>
            <p className="font-semibold text-slate-500">Online Feedback System — Java MVC Reference Architecture</p>
            <p className="text-xxs text-slate-400 mt-0.5">Complies with Spring Boot, Hibernate ORM patterns, and standard REST practices.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono bg-indigo-50 px-2 py-0.5 text-xxs font-bold text-indigo-600 rounded">Spring Boot 3.x</span>
            <span className="font-mono bg-slate-50 px-2 py-0.5 text-xxs font-bold text-slate-500 rounded">Vite + Express Proxy</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
