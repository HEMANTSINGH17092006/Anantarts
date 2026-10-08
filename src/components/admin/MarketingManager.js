'use client';
import { useState, useTransition, useEffect } from 'react';
import { formatPrice } from '@/lib/utils';
import ProductPickerModal from './ProductPickerModal';
import {
  saveMarketingCampaignAction,
  deleteMarketingCampaignAction,
  cancelMarketingCampaignAction,
  sendTestEmailCampaignAction,
  sendTestWhatsAppCampaignAction,
  launchCampaignAction,
  getCampaignDetailsAction,
  retryFailedRecipientsAction,
  saveMarketingTemplateAction,
  deleteMarketingTemplateAction,
  updateCustomerCommunicationPrefAction,
  getMarketingCustomersAction,
  getSegmentPreviewAction
} from '@/app/actions';

export default function MarketingManager({
  initialCampaigns = [],
  initialTemplates = [],
  initialCustomers = [],
  products = [],
  categories = [],
  analytics = {},
  currentUser = null
}) {
  const safeInitialCampaigns = Array.isArray(initialCampaigns) ? initialCampaigns : [];
  const safeInitialTemplates = Array.isArray(initialTemplates) ? initialTemplates : [];
  const safeInitialCustomers = Array.isArray(initialCustomers) ? initialCustomers : [];
  const safeProducts = Array.isArray(products) ? products : [];
  const safeCategories = Array.isArray(categories) ? categories : [];

  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'email' | 'whatsapp' | 'segments' | 'history' | 'templates' | 'customers'
  const [isPending, startTransition] = useTransition();

  // Core Data States
  const [campaigns, setCampaigns] = useState(safeInitialCampaigns);
  const [templates, setTemplates] = useState(safeInitialTemplates);
  const [customers, setCustomers] = useState(safeInitialCustomers);

  // Notification / Alert Banner
  const [alert, setAlert] = useState({ type: '', message: '' });
  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: '', message: '' }), 6000);
  };

  // ----------------------------------------------------
  // EMAIL CAMPAIGN BUILDER STATE
  // ----------------------------------------------------
  const [emailCampaignForm, setEmailCampaignForm] = useState({
    id: null,
    name: '',
    subject: '',
    preview_text: '',
    template_id: '',
    content_html: '',
    content_text: '',
    segment_type: 'all',
    min_spent: '',
    category_name: '',
    city: '',
    scheduled_at: ''
  });
  const [emailPreviewMode, setEmailPreviewMode] = useState('desktop'); // 'desktop' | 'mobile'
  const [testEmailAddress, setTestEmailAddress] = useState(currentUser?.email || 'admin@anantarts.in');
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [emailProductPickerOpen, setEmailProductPickerOpen] = useState(false);
  const [audiencePreview, setAudiencePreview] = useState({
    matching_count: safeInitialCustomers.length,
    email_eligible_count: safeInitialCustomers.length,
    whatsapp_eligible_count: safeInitialCustomers.length
  });
  const [confirmSendModal, setConfirmSendModal] = useState({ open: false, campaignId: null, count: 0, type: 'email' });

  // ----------------------------------------------------
  // WHATSAPP CAMPAIGN BUILDER STATE
  // ----------------------------------------------------
  const [waCampaignForm, setWaCampaignForm] = useState({
    id: null,
    name: '',
    template_id: '',
    content_text: '',
    segment_type: 'all',
    min_spent: '',
    category_name: '',
    city: '',
    scheduled_at: ''
  });
  const [testWhatsAppPhone, setTestWhatsAppPhone] = useState('917275819354');
  const [sendingTestWa, setSendingTestWa] = useState(false);
  const [waProductPickerOpen, setWaProductPickerOpen] = useState(false);

  // ----------------------------------------------------
  // SEGMENTS TAB STATE
  // ----------------------------------------------------
  const [segmentFilters, setSegmentFilters] = useState({
    segment_type: 'all',
    min_spent: '',
    max_spent: '',
    category_name: '',
    city: '',
    search_query: '',
    only_opted_in: true
  });
  const [filteredSegmentCustomers, setFilteredSegmentCustomers] = useState(safeInitialCustomers);
  const [loadingSegment, setLoadingSegment] = useState(false);

  // ----------------------------------------------------
  // CAMPAIGN HISTORY & DETAILS DRAWER STATE
  // ----------------------------------------------------
  const [historyFilterType, setHistoryFilterType] = useState('all');
  const [historyFilterStatus, setHistoryFilterStatus] = useState('all');
  const [selectedCampaignDetail, setSelectedCampaignDetail] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [processingCampaignId, setProcessingCampaignId] = useState(null);
  const [processingProgress, setProcessingProgress] = useState(null);

  // ----------------------------------------------------
  // TEMPLATES LIBRARY STATE
  // ----------------------------------------------------
  const [templateFilterCat, setTemplateFilterCat] = useState('all');
  const [previewTemplateModal, setPreviewTemplateModal] = useState(null);
  const [editTemplateModal, setEditTemplateModal] = useState({ open: false, data: null });

  // ----------------------------------------------------
  // CUSTOMER DATABASE & CONSENT TAB STATE
  // ----------------------------------------------------
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerTierFilter, setCustomerTierFilter] = useState('all');

  // Recalculate audience preview when email/whatsapp segment filters change
  const fetchAudienceCount = async (config, channel) => {
    try {
      const res = await getSegmentPreviewAction({ ...config, channel });
      if (res.success) {
        setAudiencePreview(res.data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchAudienceCount(
      {
        segment_type: emailCampaignForm.segment_type,
        min_spent: emailCampaignForm.min_spent ? Number(emailCampaignForm.min_spent) : 0,
        category_name: emailCampaignForm.category_name,
        city: emailCampaignForm.city
      },
      'email'
    );
  }, [emailCampaignForm.segment_type, emailCampaignForm.min_spent, emailCampaignForm.category_name, emailCampaignForm.city]);

  // Load Template into Email Builder
  const handleSelectEmailTemplate = (tplId) => {
    const tpl = templates.find(t => String(t.id) === String(tplId));
    if (tpl) {
      setEmailCampaignForm(prev => ({
        ...prev,
        template_id: tpl.id,
        subject: tpl.subject || prev.subject,
        preview_text: tpl.preview_text || prev.preview_text,
        content_html: tpl.body_html || '',
        content_text: tpl.body_text || ''
      }));
    }
  };

  // Load Template into WhatsApp Builder
  const handleSelectWaTemplate = (tplId) => {
    const tpl = templates.find(t => String(t.id) === String(tplId));
    if (tpl) {
      setWaCampaignForm(prev => ({
        ...prev,
        template_id: tpl.id,
        content_text: tpl.body_text || ''
      }));
    }
  };

  // Send Test Email
  const handleSendTestEmail = async () => {
    if (!testEmailAddress) {
      showAlert('danger', 'Please enter a test email address.');
      return;
    }
    if (!emailCampaignForm.subject || !emailCampaignForm.content_html) {
      showAlert('danger', 'Please provide a subject and email content first.');
      return;
    }
    setSendingTestEmail(true);
    try {
      const res = await sendTestEmailCampaignAction({
        subject: emailCampaignForm.subject,
        content_html: emailCampaignForm.content_html,
        content_text: emailCampaignForm.content_text
      }, testEmailAddress);

      if (res.success) {
        showAlert('success', `Test email sent successfully to ${testEmailAddress}`);
      } else {
        showAlert('danger', `Test email failed: ${res.error || 'Check SMTP configuration'}`);
      }
    } catch (err) {
      showAlert('danger', `Test email error: ${err.message}`);
    } finally {
      setSendingTestEmail(false);
    }
  };

  // Send Test WhatsApp
  const handleSendTestWhatsApp = async () => {
    if (!testWhatsAppPhone) {
      showAlert('danger', 'Please enter a test phone number.');
      return;
    }
    if (!waCampaignForm.content_text) {
      showAlert('danger', 'Please write WhatsApp message content first.');
      return;
    }
    setSendingTestWa(true);
    try {
      const res = await sendTestWhatsAppCampaignAction({
        content_text: waCampaignForm.content_text
      }, testWhatsAppPhone);

      if (res.success) {
        showAlert('success', `Test WhatsApp message dispatched to ${testWhatsAppPhone}`);
      } else {
        showAlert('danger', `Test WhatsApp failed: ${res.error || 'Check WhatsApp API credentials'}`);
      }
    } catch (err) {
      showAlert('danger', `Test WhatsApp error: ${err.message}`);
    } finally {
      setSendingTestWa(false);
    }
  };

  // Save Email Campaign Draft / Schedule / Send
  const handleSaveEmailCampaign = async (status = 'draft') => {
    if (!emailCampaignForm.name) {
      showAlert('danger', 'Please enter a campaign name.');
      return;
    }
    if (!emailCampaignForm.subject) {
      showAlert('danger', 'Please enter an email subject line.');
      return;
    }

    startTransition(async () => {
      try {
        const payload = {
          id: emailCampaignForm.id,
          name: emailCampaignForm.name,
          type: 'email',
          subject: emailCampaignForm.subject,
          preview_text: emailCampaignForm.preview_text,
          content_html: emailCampaignForm.content_html,
          content_text: emailCampaignForm.content_text,
          template_id: emailCampaignForm.template_id ? Number(emailCampaignForm.template_id) : null,
          segment_config: JSON.stringify({
            segment_type: emailCampaignForm.segment_type,
            min_spent: emailCampaignForm.min_spent ? Number(emailCampaignForm.min_spent) : 0,
            category_name: emailCampaignForm.category_name,
            city: emailCampaignForm.city
          }),
          status,
          scheduled_at: emailCampaignForm.scheduled_at || null
        };

        const res = await saveMarketingCampaignAction(payload);
        if (res.success) {
          showAlert('success', `Campaign saved as ${status}.`);
          if (res.campaign) {
            setCampaigns(prev => [res.campaign, ...prev.filter(c => c.id !== res.campaign.id)]);
          }

          if (status === 'processing' && res.campaign?.id) {
            // Trigger batch processing
            startBatchProcessing(res.campaign.id);
          } else {
            setActiveTab('history');
          }
        } else {
          showAlert('danger', res.error || 'Failed to save campaign.');
        }
      } catch (err) {
        showAlert('danger', err.message);
      }
    });
  };

  // Save WhatsApp Campaign Draft / Send
  const handleSaveWaCampaign = async (status = 'draft') => {
    if (!waCampaignForm.name) {
      showAlert('danger', 'Please enter a campaign name.');
      return;
    }
    if (!waCampaignForm.content_text) {
      showAlert('danger', 'Please enter WhatsApp message text.');
      return;
    }

    startTransition(async () => {
      try {
        const payload = {
          id: waCampaignForm.id,
          name: waCampaignForm.name,
          type: 'whatsapp',
          subject: 'WhatsApp Broadcast',
          preview_text: '',
          content_html: '',
          content_text: waCampaignForm.content_text,
          template_id: waCampaignForm.template_id ? Number(waCampaignForm.template_id) : null,
          segment_config: JSON.stringify({
            segment_type: waCampaignForm.segment_type,
            min_spent: waCampaignForm.min_spent ? Number(waCampaignForm.min_spent) : 0,
            category_name: waCampaignForm.category_name,
            city: waCampaignForm.city
          }),
          status,
          scheduled_at: waCampaignForm.scheduled_at || null
        };

        const res = await saveMarketingCampaignAction(payload);
        if (res.success) {
          showAlert('success', `WhatsApp campaign saved as ${status}.`);
          if (res.campaign) {
            setCampaigns(prev => [res.campaign, ...prev.filter(c => c.id !== res.campaign.id)]);
          }

          if (status === 'processing' && res.campaign?.id) {
            startBatchProcessing(res.campaign.id);
          } else {
            setActiveTab('history');
          }
        } else {
          showAlert('danger', res.error || 'Failed to save campaign.');
        }
      } catch (err) {
        showAlert('danger', err.message);
      }
    });
  };

  // Initiate Queue & Batch Processing Loop
  const startBatchProcessing = async (campaignId) => {
    setProcessingCampaignId(campaignId);
    setProcessingProgress({ status: 'Starting batch dispatch...', processed: 0, total: 0 });

    try {
      // 1. Enqueue
      const enqRes = await launchCampaignAction(campaignId);
      if (!enqRes.success) {
        showAlert('danger', enqRes.error || 'Failed to launch campaign');
        setProcessingCampaignId(null);
        return;
      }

      setProcessingProgress({ status: 'Processing recipients...', processed: 0, total: enqRes.total_recipients || 0 });

      // 2. Iterate batches until done
      let isDone = false;
      let iterations = 0;
      const MAX_ITERATIONS = 500; // safety brake

      while (!isDone && iterations < MAX_ITERATIONS) {
        iterations++;
        const res = await fetch('/api/admin/marketing/process-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ campaignId, batchSize: 20 })
        });
        const batchData = await res.json();

        if (!batchData.success) {
          showAlert('danger', `Batch error: ${batchData.error}`);
          break;
        }

        if (batchData.status === 'cancelled') {
          showAlert('info', 'Campaign processing was cancelled.');
          break;
        }

        setProcessingProgress({
          status: batchData.done ? 'Finished' : 'Processing...',
          processed: batchData.total_sent || 0,
          failed: batchData.total_failed || 0,
          remaining: batchData.remaining || 0
        });

        if (batchData.done) {
          isDone = true;
          showAlert('success', `Campaign complete! Sent: ${batchData.sent || batchData.total_sent}, Failed: ${batchData.failed || batchData.total_failed}`);
          break;
        }

        // Brief delay between polling
        await new Promise(r => setTimeout(r, 400));
      }

      // Refresh campaign list
      const details = await getCampaignDetailsAction(campaignId);
      if (details.success && details.campaign) {
        setCampaigns(prev => prev.map(c => c.id === campaignId ? details.campaign : c));
      }

    } catch (err) {
      showAlert('danger', `Processing failed: ${err.message}`);
    } finally {
      setProcessingCampaignId(null);
      setProcessingProgress(null);
    }
  };

  // Open Campaign Details Drawer
  const handleOpenCampaignDetails = async (camp) => {
    setDrawerOpen(true);
    setLoadingDetails(true);
    setSelectedCampaignDetail(camp);
    try {
      const res = await getCampaignDetailsAction(camp.id);
      if (res.success) {
        setSelectedCampaignDetail(res);
      }
    } catch (e) {
    } finally {
      setLoadingDetails(false);
    }
  };

  // Retry Failed Recipients
  const handleRetryFailed = async (campaignId) => {
    if (!confirm('Retry sending to all failed recipients in this campaign?')) return;
    try {
      const res = await retryFailedRecipientsAction(campaignId);
      if (res.success) {
        showAlert('success', 'Failed recipients reset to pending. Resuming queue processing...');
        startBatchProcessing(campaignId);
      } else {
        showAlert('danger', res.error || 'Retry failed');
      }
    } catch (err) {
      showAlert('danger', err.message);
    }
  };

  // Cancel Campaign
  const handleCancelCampaign = async (campaignId) => {
    if (!confirm('Are you sure you want to cancel this campaign? Pending messages will not be sent.')) return;
    try {
      const res = await cancelMarketingCampaignAction(campaignId);
      if (res.success) {
        showAlert('info', 'Campaign cancelled.');
        setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, status: 'cancelled' } : c));
        if (selectedCampaignDetail?.campaign?.id === campaignId) {
          setSelectedCampaignDetail(prev => ({ ...prev, campaign: { ...prev.campaign, status: 'cancelled' } }));
        }
      } else {
        showAlert('danger', res.error || 'Cancellation failed');
      }
    } catch (err) {
      showAlert('danger', err.message);
    }
  };

  // Toggle Customer Opt-In Consent
  const handleToggleConsent = async (c, channel, currentVal) => {
    const newVal = currentVal === 1 ? 0 : 1;
    const emailOpt = channel === 'email' ? newVal : c.email_marketing_opt_in;
    const waOpt = channel === 'whatsapp' ? newVal : c.whatsapp_marketing_opt_in;

    try {
      const res = await updateCustomerCommunicationPrefAction(c.email, c.phone, emailOpt, waOpt);
      if (res.success) {
        setCustomers(prev => prev.map(item => {
          if (item.key === c.key) {
            return { ...item, email_marketing_opt_in: emailOpt, whatsapp_marketing_opt_in: waOpt };
          }
          return item;
        }));
        showAlert('success', `Updated consent preferences for ${c.name || c.email}`);
      }
    } catch (err) {
      showAlert('danger', err.message);
    }
  };

  // Filter customers in segments tab
  useEffect(() => {
    let list = [...customers];

    if (segmentFilters.segment_type === 'new') list = list.filter(c => c.total_orders === 1);
    else if (segmentFilters.segment_type === 'repeat') list = list.filter(c => c.total_orders >= 2);
    else if (segmentFilters.segment_type === 'high_value') list = list.filter(c => c.total_spent >= (Number(segmentFilters.min_spent) || 5000));
    else if (segmentFilters.segment_type === 'inactive_30') list = list.filter(c => c.days_since_last_order !== null && c.days_since_last_order >= 30);
    else if (segmentFilters.segment_type === 'inactive_60') list = list.filter(c => c.days_since_last_order !== null && c.days_since_last_order >= 60);
    else if (segmentFilters.segment_type === 'inactive_90') list = list.filter(c => c.days_since_last_order !== null && c.days_since_last_order >= 90);
    else if (segmentFilters.segment_type === 'abandoned_pending') list = list.filter(c => c.has_pending_cart);
    else if (segmentFilters.segment_type === 'category_interest' && segmentFilters.category_name) {
      list = list.filter(c => c.preferred_category === segmentFilters.category_name || c.purchased_categories[segmentFilters.category_name]);
    } else if (segmentFilters.segment_type === 'location' && segmentFilters.city) {
      list = list.filter(c => c.city?.toLowerCase().includes(segmentFilters.city.toLowerCase()) || c.state?.toLowerCase().includes(segmentFilters.city.toLowerCase()));
    }

    if (segmentFilters.min_spent) list = list.filter(c => c.total_spent >= Number(segmentFilters.min_spent));
    if (segmentFilters.max_spent) list = list.filter(c => c.total_spent <= Number(segmentFilters.max_spent));
    if (segmentFilters.search_query) {
      const q = segmentFilters.search_query.toLowerCase();
      list = list.filter(c => c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.phone?.toLowerCase().includes(q) || c.city?.toLowerCase().includes(q));
    }
    if (segmentFilters.only_opted_in) {
      list = list.filter(c => c.email_marketing_opt_in !== 0 || c.whatsapp_marketing_opt_in !== 0);
    }

    setFilteredSegmentCustomers(list);
  }, [segmentFilters, customers]);

  // Export Segment to CSV
  const handleExportSegmentCSV = () => {
    const headers = ['Customer Name', 'Email Address', 'Phone Number', 'Customer Tier', 'Total Orders', 'Total Spent (₹)', 'Preferred Category', 'City', 'Email Opt-In', 'WhatsApp Opt-In'];
    const rows = filteredSegmentCustomers.map(c => [
      c.name || 'Devotee',
      c.email || '',
      c.phone || '',
      c.tier || 'Standard',
      c.total_orders,
      c.total_spent,
      c.preferred_category || 'Spiritual',
      c.city || '',
      c.email_marketing_opt_in !== 0 ? 'YES' : 'NO',
      c.whatsapp_marketing_opt_in !== 0 ? 'YES' : 'NO'
    ]);
    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `anant_arts_segment_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Safe array references
  const safeCampList = Array.isArray(campaigns) ? campaigns : [];
  const safeCustList = Array.isArray(customers) ? customers : [];

  // Filtered History
  const filteredCampaigns = safeCampList.filter(c => {
    const matchesType = historyFilterType === 'all' || c.type === historyFilterType;
    const matchesStatus = historyFilterStatus === 'all' || c.status === historyFilterStatus;
    return matchesType && matchesStatus;
  });

  // Filtered Customer Database
  const filteredCustomerDb = safeCustList.filter(c => {
    const matchesSearch = !customerSearch ||
      c.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.email?.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone?.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.city?.toLowerCase().includes(customerSearch.toLowerCase());

    const matchesTier = customerTierFilter === 'all' || c.tier === customerTierFilter;
    return matchesSearch && matchesTier;
  });

  // Calculate high-level metrics
  const totalCampaignsCount = safeCampList.length;
  const totalEmailsSent = safeCampList.filter(c => c.type === 'email').reduce((acc, c) => acc + (c.sent_count || 0), 0);
  const totalWaSent = safeCampList.filter(c => c.type === 'whatsapp').reduce((acc, c) => acc + (c.sent_count || 0), 0);
  const totalOpened = safeCampList.filter(c => c.type === 'email').reduce((acc, c) => acc + (c.opened_count || 0), 0);
  const totalClicked = safeCampList.reduce((acc, c) => acc + (c.clicked_count || 0), 0);
  const totalFailed = safeCampList.reduce((acc, c) => acc + (c.failed_count || 0), 0);

  const avgOpenRate = totalEmailsSent > 0 ? ((totalOpened / totalEmailsSent) * 100).toFixed(1) : '0.0';
  const avgClickRate = (totalEmailsSent + totalWaSent) > 0 ? ((totalClicked / (totalEmailsSent + totalWaSent)) * 100).toFixed(1) : '0.0';
  const activeAudienceCount = safeCustList.filter(c => c.email_marketing_opt_in !== 0 || c.whatsapp_marketing_opt_in !== 0).length;


  return (
    <div style={{ paddingBottom: '60px' }}>
      
      {/* Top Section Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px',
        background: '#FFFFFF',
        padding: '20px 24px',
        borderRadius: '12px',
        border: '1px solid rgba(212, 175, 55, 0.25)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.6rem', color: '#D4AF37' }}>🪷</span>
            <div>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.65rem', margin: 0, color: '#111' }}>
                Marketing &amp; Customer Communication
              </h1>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Enterprise Customer Intelligence, Automated Email &amp; WhatsApp Campaigns, Segments &amp; Analytics
              </span>
            </div>
          </div>
        </div>

        {/* Quick Launch Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('email')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #D4AF37 0%, #AA7C11 100%)',
              color: '#111',
              fontWeight: '700',
              fontSize: '0.82rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(212,175,55,0.3)'
            }}
          >
            <i className="fas fa-paper-plane"></i>
            <span>New Email Campaign</span>
          </button>
          <button
            onClick={() => setActiveTab('whatsapp')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '6px',
              background: '#25D366',
              color: '#FFF',
              fontWeight: '700',
              fontSize: '0.82rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37,211,102,0.3)'
            }}
          >
            <i className="fab fa-whatsapp"></i>
            <span>WhatsApp Broadcast</span>
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {alert.message && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '0.86rem',
          fontWeight: '500',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: alert.type === 'success' ? '#E8F5E9' : (alert.type === 'danger' ? '#FFEBEE' : '#FFF8E1'),
          border: `1px solid ${alert.type === 'success' ? '#A5D6A7' : (alert.type === 'danger' ? '#FFCDD2' : '#FFE082')}`,
          color: alert.type === 'success' ? '#2E7D32' : (alert.type === 'danger' ? '#C62828' : '#F57F17')
        }}>
          <span>{alert.message}</span>
          <button onClick={() => setAlert({ type: '', message: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'inherit' }}>
            &times;
          </button>
        </div>
      )}

      {/* Real-Time Processing Progress Bar */}
      {processingProgress && (
        <div style={{
          background: 'linear-gradient(180deg, #1A1918 0%, #111 100%)',
          color: 'white',
          padding: '16px 20px',
          borderRadius: '8px',
          marginBottom: '24px',
          border: '1px solid #D4AF37',
          boxShadow: '0 6px 20px rgba(0,0,0,0.2)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ animation: 'spin 1.5s infinite', display: 'inline-block' }}>⚡</span>
              <strong style={{ color: '#D4AF37', fontSize: '0.9rem' }}>Campaign Queue In Progress...</strong>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#CCC' }}>
              Sent: {processingProgress.processed} / Failed: {processingProgress.failed || 0}
            </span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, #D4AF37, #25D366)',
              width: `${Math.min(100, Math.max(10, ((processingProgress.processed || 1) / (processingProgress.total || 10)) * 100))}%`,
              transition: 'width 0.3s ease'
            }}></div>
          </div>
        </div>
      )}

      {/* Main Luxury Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '4px',
        borderBottom: '2px solid rgba(212, 175, 55, 0.25)',
        marginBottom: '28px',
        overflowX: 'auto',
        background: '#FFFFFF',
        padding: '6px 12px 0 12px',
        borderRadius: '8px 8px 0 0'
      }}>
        {[
          { id: 'analytics', label: 'Overview & Analytics', icon: 'fa-chart-line' },
          { id: 'email', label: 'Email Campaigns', icon: 'fa-envelope-open-text' },
          { id: 'whatsapp', label: 'WhatsApp / Messages', icon: 'fa-comment-dots' },
          { id: 'segments', label: 'Customer Segments', icon: 'fa-users-viewfinder' },
          { id: 'history', label: `Campaign History (${campaigns.length})`, icon: 'fa-clock-rotate-left' },
          { id: 'templates', label: `Templates (${templates.length})`, icon: 'fa-layer-group' },
          { id: 'customers', label: `Customer Database (${customers.length})`, icon: 'fa-address-book' }
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 18px',
                border: 'none',
                background: isActive ? 'linear-gradient(180deg, rgba(212,175,55,0.12) 0%, rgba(212,175,55,0.02) 100%)' : 'transparent',
                borderBottom: isActive ? '3px solid #AA7C11' : '3px solid transparent',
                color: isActive ? '#AA7C11' : 'var(--text-muted)',
                fontWeight: isActive ? '700' : '500',
                fontSize: '0.84rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <i className={`fas ${tab.icon}`} style={{ color: isActive ? '#AA7C11' : '#999' }}></i>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ANALYTICS & OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'analytics' && (
        <div>
          {/* Top KPI Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
            
            <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '10px', border: '1px solid rgba(212, 175, 55, 0.25)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Campaigns</span>
                <span style={{ color: '#D4AF37', fontSize: '1.1rem' }}>📢</span>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#111', fontFamily: 'var(--font-heading)' }}>
                {totalCampaignsCount}
              </div>
              <span style={{ fontSize: '0.72rem', color: '#666' }}>Email &amp; WhatsApp combined</span>
            </div>

            <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '10px', border: '1px solid rgba(212, 175, 55, 0.25)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Emails Dispatched</span>
                <span style={{ color: '#1565C0', fontSize: '1.1rem' }}>✉️</span>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1565C0', fontFamily: 'var(--font-heading)' }}>
                {totalEmailsSent.toLocaleString('en-IN')}
              </div>
              <span style={{ fontSize: '0.72rem', color: '#2E7D32' }}>Avg Open Rate: <strong>{avgOpenRate}%</strong></span>
            </div>

            <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '10px', border: '1px solid rgba(212, 175, 55, 0.25)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>WhatsApp Sent</span>
                <span style={{ color: '#25D366', fontSize: '1.1rem' }}>💬</span>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#2E7D32', fontFamily: 'var(--font-heading)' }}>
                {totalWaSent.toLocaleString('en-IN')}
              </div>
              <span style={{ fontSize: '0.72rem', color: '#666' }}>Opted-in VIP broadcasts</span>
            </div>

            <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '10px', border: '1px solid rgba(212, 175, 55, 0.25)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Click Engagement</span>
                <span style={{ color: '#E65100', fontSize: '1.1rem' }}>🖱️</span>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#E65100', fontFamily: 'var(--font-heading)' }}>
                {totalClicked}
              </div>
              <span style={{ fontSize: '0.72rem', color: '#666' }}>Overall CTR: <strong>{avgClickRate}%</strong></span>
            </div>

            <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '10px', border: '1px solid rgba(212, 175, 55, 0.25)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Opted-in Audience</span>
                <span style={{ color: '#AA7C11', fontSize: '1.1rem' }}>👥</span>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#AA7C11', fontFamily: 'var(--font-heading)' }}>
                {activeAudienceCount.toLocaleString('en-IN')}
              </div>
              <span style={{ fontSize: '0.72rem', color: '#666' }}>Out of {customers.length} total profiles</span>
            </div>

          </div>

          {/* Quick Action Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #1A1918 0%, #262422 100%)',
            color: '#FFFFFF',
            padding: '24px 28px',
            borderRadius: '12px',
            border: '1px solid #D4AF37',
            marginBottom: '28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <span style={{ fontSize: '0.72rem', letterSpacing: '2px', color: '#D4AF37', textTransform: 'uppercase', fontWeight: '700' }}>
                Auspicious Growth Hub
              </span>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: '#FFF', margin: '4px 0 6px 0' }}>
                Ready to announce new Sacred Idols or Festive Blessings?
              </h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255,255,255,0.75)', maxWidth: '600px' }}>
                Use our pre-designed luxury templates to reach your high-value patrons and repeat devotees with zero technical friction.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setActiveTab('email')}
                className="btn-gold"
                style={{ fontSize: '0.82rem', padding: '10px 18px' }}
              >
                Compose Email
              </button>
              <button
                onClick={() => setActiveTab('templates')}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  color: '#D4AF37',
                  border: '1px solid #D4AF37',
                  padding: '10px 18px',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Browse Templates
              </button>
            </div>
          </div>

          {/* Recent Campaigns Table */}
          <div style={{ background: '#FFFFFF', borderRadius: '10px', border: '1px solid rgba(212, 175, 55, 0.25)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #EEE', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontFamily: 'var(--font-heading)', color: '#111' }}>
                Recent Marketing Campaigns
              </h3>
              <button onClick={() => setActiveTab('history')} style={{ background: 'none', border: 'none', color: '#AA7C11', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}>
                View All Campaigns &rarr;
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#FAF9F6', color: 'var(--text-muted)', borderBottom: '1px solid #EEE' }}>
                    <th style={{ padding: '12px 16px' }}>Campaign Name</th>
                    <th style={{ padding: '12px 16px' }}>Channel</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Recipients</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Sent / Delivered</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Opens / Clicks</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ padding: '36px', textAlign: 'center', color: '#888', fontStyle: 'italic' }}>
                        No marketing campaigns created yet. Click "New Email Campaign" above to get started.
                      </td>
                    </tr>
                  ) : (
                    campaigns.slice(0, 5).map(c => {
                      const isEmail = c.type === 'email';
                      return (
                        <tr key={c.id} style={{ borderBottom: '1px solid #F0F0F0' }}>
                          <td style={{ padding: '14px 16px', fontWeight: '600', color: '#1E1A17' }}>
                            {c.name}
                            {c.subject && <div style={{ fontSize: '0.72rem', color: '#666', fontWeight: '400' }}>{c.subject}</div>}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '3px 8px',
                              borderRadius: '12px',
                              fontSize: '0.72rem',
                              fontWeight: '600',
                              background: isEmail ? '#E3F2FD' : '#E8F5E9',
                              color: isEmail ? '#1565C0' : '#2E7D32'
                            }}>
                              <i className={isEmail ? 'fas fa-envelope' : 'fab fa-whatsapp'}></i>
                              {isEmail ? 'Email' : 'WhatsApp'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              fontWeight: '700',
                              textTransform: 'uppercase',
                              background: c.status === 'completed' ? '#E8F5E9' : (c.status === 'processing' ? '#FFF3E0' : (c.status === 'draft' ? '#F5F5F5' : '#FFEBEE')),
                              color: c.status === 'completed' ? '#2E7D32' : (c.status === 'processing' ? '#E65100' : (c.status === 'draft' ? '#666' : '#C62828'))
                            }}>
                              {c.status}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '600' }}>
                            {c.total_recipients || 0}
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <span style={{ color: '#2E7D32', fontWeight: '600' }}>{c.sent_count || 0}</span>
                            {c.failed_count > 0 && <span style={{ color: '#C62828', fontSize: '0.72rem', marginLeft: '4px' }}>({c.failed_count} failed)</span>}
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            {isEmail ? (
                              <span>{c.opened_count || 0} opens &bull; {c.clicked_count || 0} clicks</span>
                            ) : (
                              <span>{c.clicked_count || 0} clicks</span>
                            )}
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                            <button
                              onClick={() => handleOpenCampaignDetails(c)}
                              style={{
                                background: 'none',
                                border: '1px solid #D4AF37',
                                color: '#AA7C11',
                                padding: '4px 10px',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: EMAIL CAMPAIGN BUILDER */}
      {/* ========================================================================= */}
      {activeTab === 'email' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
          
          {/* Left Form: Campaign Config & Content Builder */}
          <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '10px', border: '1px solid rgba(212, 175, 55, 0.25)', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', margin: '0 0 16px 0', color: '#111' }}>
              📧 Compose Luxury Email Campaign
            </h3>

            {/* Step 1: Campaign Metadata */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px' }}>Campaign Name (Internal)</label>
              <input
                type="text"
                placeholder="e.g. Diwali Blessings 2026 — 24K Gold Idols"
                value={emailCampaignForm.name}
                onChange={(e) => setEmailCampaignForm({ ...emailCampaignForm, name: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #D4AF37', fontSize: '0.84rem' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px' }}>Email Subject Line</label>
                <input
                  type="text"
                  placeholder="🪷 Discover Sacred 24K Gold Idols"
                  value={emailCampaignForm.subject}
                  onChange={(e) => setEmailCampaignForm({ ...emailCampaignForm, subject: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CCC', fontSize: '0.84rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px' }}>Preview Preheader Text</label>
                <input
                  type="text"
                  placeholder="Handcrafted divine masterpieces with certified gold plating"
                  value={emailCampaignForm.preview_text}
                  onChange={(e) => setEmailCampaignForm({ ...emailCampaignForm, preview_text: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CCC', fontSize: '0.84rem' }}
                />
              </div>
            </div>

            {/* Step 2: Choose Preset Template */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px' }}>
                Load Template from Luxury Library
              </label>
              <select
                value={emailCampaignForm.template_id}
                onChange={(e) => handleSelectEmailTemplate(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #D4AF37', fontSize: '0.84rem', background: '#FFFDF5' }}
              >
                <option value="">-- Choose a Luxury Brand Template --</option>
                {templates.filter(t => t.type === 'email').map(t => (
                  <option key={t.id} value={t.id}>[{t.category?.toUpperCase()}] {t.name}</option>
                ))}
              </select>
            </div>

            {/* Step 3: Audience Segment */}
            <div style={{ background: '#FAF9F6', padding: '16px', borderRadius: '8px', border: '1px solid #EAE3D2', marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <strong style={{ fontSize: '0.82rem', color: '#1E1A17' }}>Target Audience Segment</strong>
                <span style={{ fontSize: '0.78rem', background: '#E8F5E9', color: '#2E7D32', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>
                  {audiencePreview.email_eligible_count} Eligible Recipients
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <select
                    value={emailCampaignForm.segment_type}
                    onChange={(e) => setEmailCampaignForm({ ...emailCampaignForm, segment_type: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #CCC', fontSize: '0.8rem' }}
                  >
                    <option value="all">All Opted-in Customers</option>
                    <option value="new">New Customers (1st Order)</option>
                    <option value="repeat">Repeat Devotees (2+ Orders)</option>
                    <option value="high_value">High-Value VIPs (₹5,000+)</option>
                    <option value="inactive_30">Dormant (No purchase in 30 days)</option>
                    <option value="inactive_60">Dormant (No purchase in 60 days)</option>
                    <option value="inactive_90">Dormant (No purchase in 90 days)</option>
                    <option value="abandoned_pending">Pending Sanctuary / Unpaid Inquiries</option>
                    <option value="category_interest">Category Specific Affinity</option>
                    <option value="location">City / State Specific</option>
                  </select>
                </div>

                {emailCampaignForm.segment_type === 'category_interest' && (
                  <div>
                    <input
                      type="text"
                      placeholder="e.g. Spiritual Collection"
                      value={emailCampaignForm.category_name}
                      onChange={(e) => setEmailCampaignForm({ ...emailCampaignForm, category_name: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #CCC', fontSize: '0.8rem' }}
                    />
                  </div>
                )}

                {emailCampaignForm.segment_type === 'location' && (
                  <div>
                    <input
                      type="text"
                      placeholder="e.g. Mumbai, Delhi, Bangalore"
                      value={emailCampaignForm.city}
                      onChange={(e) => setEmailCampaignForm({ ...emailCampaignForm, city: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #CCC', fontSize: '0.8rem' }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Step 4: Content Builder & Rich Toolbar */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700' }}>Email Body HTML &amp; Modular Blocks</label>
                
                {/* Insert Tools */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setEmailProductPickerOpen(true)}
                    style={{
                      background: '#1E1A17',
                      color: '#D4AF37',
                      border: '1px solid #D4AF37',
                      borderRadius: '4px',
                      padding: '4px 10px',
                      fontSize: '0.74rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    + Insert Products
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const tokenTag = '{{name}}';
                      setEmailCampaignForm(prev => ({ ...prev, content_html: prev.content_html + tokenTag }));
                    }}
                    style={{
                      background: '#F0F0F0',
                      border: '1px solid #CCC',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontSize: '0.74rem',
                      cursor: 'pointer'
                    }}
                  >
                    + {"{{name}}"}
                  </button>
                </div>
              </div>

              <textarea
                rows="14"
                value={emailCampaignForm.content_html}
                onChange={(e) => setEmailCampaignForm({ ...emailCampaignForm, content_html: e.target.value })}
                placeholder="Write or paste your custom email HTML here..."
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #D4AF37',
                  fontFamily: 'monospace',
                  fontSize: '0.78rem',
                  lineHeight: '1.5'
                }}
              />
            </div>

            {/* Test Send Mode */}
            <div style={{ background: '#FAF9F6', padding: '14px', borderRadius: '8px', border: '1px solid #EEE', marginBottom: '20px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#666' }}>Test Mode Verification</span>
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <input
                  type="email"
                  placeholder="admin@anantarts.in"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  style={{ flex: 1, padding: '8px 10px', borderRadius: '4px', border: '1px solid #CCC', fontSize: '0.8rem' }}
                />
                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={sendingTestEmail}
                  style={{
                    background: '#1E1A17',
                    color: '#D4AF37',
                    border: '1px solid #D4AF37',
                    padding: '8px 14px',
                    borderRadius: '4px',
                    fontSize: '0.78rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {sendingTestEmail ? 'Sending...' : 'Send Test Email'}
                </button>
              </div>
            </div>

            {/* Launch Actions */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handleSaveEmailCampaign('draft')}
                disabled={isPending}
                style={{
                  padding: '10px 18px',
                  borderRadius: '6px',
                  border: '1px solid #CCC',
                  background: '#FFF',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Save as Draft
              </button>

              <button
                type="button"
                onClick={() => setConfirmSendModal({ open: true, count: audiencePreview.email_eligible_count, type: 'email' })}
                disabled={isPending || audiencePreview.email_eligible_count === 0}
                style={{
                  padding: '10px 22px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #D4AF37 0%, #AA7C11 100%)',
                  color: '#111',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: audiencePreview.email_eligible_count > 0 ? 'pointer' : 'not-allowed',
                  boxShadow: '0 4px 15px rgba(212,175,55,0.3)'
                }}
              >
                🚀 Send Campaign ({audiencePreview.email_eligible_count} Devotees)
              </button>
            </div>

          </div>

          {/* Right Live Preview: Desktop & Mobile Toggle */}
          <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '10px', border: '1px solid rgba(212, 175, 55, 0.25)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', margin: 0 }}>
                📱 Live Luxury Email Preview
              </h3>
              <div style={{ display: 'flex', background: '#F0F0F0', borderRadius: '6px', padding: '2px' }}>
                <button
                  type="button"
                  onClick={() => setEmailPreviewMode('desktop')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    border: 'none',
                    background: emailPreviewMode === 'desktop' ? '#FFFFFF' : 'transparent',
                    color: emailPreviewMode === 'desktop' ? '#111' : '#777',
                    fontWeight: '600',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  <i className="fas fa-desktop" style={{ marginRight: '4px' }}></i> Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setEmailPreviewMode('mobile')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    border: 'none',
                    background: emailPreviewMode === 'mobile' ? '#FFFFFF' : 'transparent',
                    color: emailPreviewMode === 'mobile' ? '#111' : '#777',
                    fontWeight: '600',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  <i className="fas fa-mobile-alt" style={{ marginRight: '4px' }}></i> Mobile
                </button>
              </div>
            </div>

            {/* Email Shell Mock */}
            <div style={{
              flex: 1,
              background: '#FAF9F6',
              border: '1px solid #EAEAEA',
              borderRadius: '8px',
              overflowY: 'auto',
              maxHeight: '650px',
              padding: '16px',
              display: 'flex',
              justifyContent: 'center'
            }}>
              <div style={{
                width: emailPreviewMode === 'mobile' ? '340px' : '100%',
                maxWidth: '560px',
                background: '#FFFFFF',
                borderRadius: '8px',
                border: '1px solid #EAE3D2',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
              }}>
                {/* Brand Header */}
                <div style={{ background: 'linear-gradient(180deg, #0A0A0A 0%, #171513 100%)', padding: '24px', textAlign: 'center', borderBottom: '2px solid #D4AF37' }}>
                  <span style={{ fontSize: '24px', display: 'block', marginBottom: '2px' }}>🪷</span>
                  <h2 style={{ fontFamily: 'Playfair Display, serif', color: '#D4AF37', margin: 0, fontSize: '20px', letterSpacing: '2px', textTransform: 'uppercase' }}>
                    Anant Arts
                  </h2>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '9px', letterSpacing: '1.5px', textTransform: 'uppercase', display: 'block', marginTop: '4px' }}>
                    Bringing Divine Art to Every Home
                  </span>
                </div>

                {/* Email Content */}
                <div style={{ padding: '24px', color: '#3B2F2F', fontSize: '13.5px', lineHeight: '1.6' }}>
                  {emailCampaignForm.content_html ? (
                    <div dangerouslySetInnerHTML={{ __html: emailCampaignForm.content_html.replace(/\{\{\s*name\s*\}\}/gi, 'Rajesh Sharma').replace(/\{\{\s*discount_code\s*\}\}/gi, 'DIVINE10') }} />
                  ) : (
                    <p style={{ color: '#999', fontStyle: 'italic', textAlign: 'center', margin: '40px 0' }}>
                      Select a luxury template or type your message to see the live rendering here.
                    </p>
                  )}
                </div>

                {/* Brand Footer */}
                <div style={{ background: '#FDFBF7', padding: '20px', textAlign: 'center', borderTop: '1px solid #EAE3D2', fontSize: '11px', color: '#6E5A5A' }}>
                  <p style={{ margin: '0 0 6px 0', fontWeight: '600' }}>Anant Arts &bull; Masterpiece Electroplated Idols</p>
                  <p style={{ margin: 0, color: '#8C827A' }}>Bhoirwadi, Dombivli East, Maharashtra &bull; <a href="#" style={{ color: '#AA7C11' }}>Visit Store</a></p>
                  <div style={{ marginTop: '12px', fontSize: '10px', color: '#AAA' }}>
                    <a href="#" style={{ color: '#AA7C11', textDecoration: 'underline' }}>Unsubscribe / Manage Preferences</a>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: WHATSAPP / MESSAGE CAMPAIGNS */}
      {/* ========================================================================= */}
      {activeTab === 'whatsapp' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
          
          {/* Form */}
          <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '10px', border: '1px solid rgba(212, 175, 55, 0.25)', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', margin: '0 0 16px 0', color: '#111' }}>
              💬 Compose WhatsApp Campaign
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px' }}>Campaign Name (Internal)</label>
              <input
                type="text"
                placeholder="e.g. VIP Festive Blessing & Exclusive Concession"
                value={waCampaignForm.name}
                onChange={(e) => setWaCampaignForm({ ...waCampaignForm, name: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #25D366', fontSize: '0.84rem' }}
              />
            </div>

            {/* Template Selector */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px' }}>
                Select Approved WhatsApp Template
              </label>
              <select
                value={waCampaignForm.template_id}
                onChange={(e) => handleSelectWaTemplate(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CCC', fontSize: '0.84rem' }}
              >
                <option value="">-- Choose WhatsApp Template --</option>
                {templates.filter(t => t.type === 'whatsapp').map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Audience */}
            <div style={{ background: '#FAF9F6', padding: '16px', borderRadius: '8px', border: '1px solid #EAE3D2', marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <strong style={{ fontSize: '0.82rem', color: '#1E1A17' }}>Target WhatsApp Audience</strong>
                <span style={{ fontSize: '0.78rem', background: '#E8F5E9', color: '#2E7D32', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>
                  {audiencePreview.whatsapp_eligible_count} Opted-in Phones
                </span>
              </div>

              <select
                value={waCampaignForm.segment_type}
                onChange={(e) => setWaCampaignForm({ ...waCampaignForm, segment_type: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #CCC', fontSize: '0.8rem' }}
              >
                <option value="all">All Opted-in WhatsApp Contacts</option>
                <option value="high_value">High-Value VIPs (₹5,000+)</option>
                <option value="repeat">Repeat Devotees (2+ Orders)</option>
                <option value="new">New Customers (1st Order)</option>
                <option value="inactive_30">Dormant (30+ Days)</option>
              </select>
            </div>

            {/* Message Text with Inserters */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700' }}>Message Body</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setWaProductPickerOpen(true)}
                    style={{ background: '#25D366', color: '#FFF', border: 'none', borderRadius: '4px', padding: '4px 10px', fontSize: '0.74rem', fontWeight: '700', cursor: 'pointer' }}
                  >
                    + Insert Product
                  </button>
                  <button
                    type="button"
                    onClick={() => setWaCampaignForm(prev => ({ ...prev, content_text: prev.content_text + ' {{name}}' }))}
                    style={{ background: '#F0F0F0', border: '1px solid #CCC', borderRadius: '4px', padding: '4px 8px', fontSize: '0.74rem', cursor: 'pointer' }}
                  >
                    + {"{{name}}"}
                  </button>
                </div>
              </div>

              <textarea
                rows="10"
                value={waCampaignForm.content_text}
                onChange={(e) => setWaCampaignForm({ ...waCampaignForm, content_text: e.target.value })}
                placeholder="Namaste {{name}}, Discover our latest handcrafted..."
                style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #25D366', fontSize: '0.85rem', lineHeight: '1.5' }}
              />
            </div>

            {/* Test WhatsApp Send */}
            <div style={{ background: '#FAF9F6', padding: '14px', borderRadius: '8px', border: '1px solid #EEE', marginBottom: '20px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#666' }}>Test Mode Phone Verification</span>
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <input
                  type="text"
                  placeholder="917275819354"
                  value={testWhatsAppPhone}
                  onChange={(e) => setTestWhatsAppPhone(e.target.value)}
                  style={{ flex: 1, padding: '8px 10px', borderRadius: '4px', border: '1px solid #CCC', fontSize: '0.8rem' }}
                />
                <button
                  type="button"
                  onClick={handleSendTestWhatsApp}
                  disabled={sendingTestWa}
                  style={{
                    background: '#25D366',
                    color: '#FFF',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '4px',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  {sendingTestWa ? 'Sending...' : 'Send Test WhatsApp'}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => handleSaveWaCampaign('draft')}
                style={{ padding: '10px 18px', borderRadius: '6px', border: '1px solid #CCC', background: '#FFF', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer' }}
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => setConfirmSendModal({ open: true, count: audiencePreview.whatsapp_eligible_count, type: 'whatsapp' })}
                disabled={audiencePreview.whatsapp_eligible_count === 0}
                style={{
                  padding: '10px 22px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#25D366',
                  color: '#FFF',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: audiencePreview.whatsapp_eligible_count > 0 ? 'pointer' : 'not-allowed',
                  boxShadow: '0 4px 15px rgba(37,211,102,0.3)'
                }}
              >
                🚀 Send WhatsApp Broadcast ({audiencePreview.whatsapp_eligible_count} Contacts)
              </button>
            </div>

          </div>

          {/* Right Chat Bubble Preview */}
          <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '10px', border: '1px solid rgba(212, 175, 55, 0.25)', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', margin: '0 0 16px 0' }}>
              💬 Authentic WhatsApp Bubble Preview
            </h3>

            {/* Mock Phone Container */}
            <div style={{
              background: '#ECE5DD',
              backgroundImage: 'radial-gradient(#D1C7B8 1px, transparent 1px)',
              backgroundSize: '16px 16px',
              borderRadius: '12px',
              padding: '20px 14px',
              minHeight: '400px',
              border: '1px solid #D1C7B8',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end'
            }}>
              
              {/* WhatsApp Bubble */}
              <div style={{
                alignSelf: 'flex-end',
                maxWidth: '85%',
                background: '#DCF8C6',
                borderRadius: '8px 0 8px 8px',
                padding: '12px 14px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                fontSize: '0.84rem',
                color: '#111',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap',
                position: 'relative'
              }}>
                {waCampaignForm.content_text ? (
                  waCampaignForm.content_text
                    .replace(/\{\{\s*name\s*\}\}/gi, 'Rajesh Ji')
                    .replace(/\{\{\s*product_link\s*\}\}/gi, 'https://anantarts.in/shop/divine-24k-gold-ganesha')
                    .replace(/\{\{\s*website_link\s*\}\}/gi, 'https://anantarts.in')
                    .replace(/\{\{\s*discount_code\s*\}\}/gi, 'DIVINE10')
                ) : (
                  <span style={{ color: '#888', fontStyle: 'italic' }}>
                    Type your WhatsApp campaign message to see the chat preview.
                  </span>
                )}

                <div style={{ textAlign: 'right', fontSize: '0.65rem', color: '#777', marginTop: '4px' }}>
                  {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} <span style={{ color: '#34B7F1' }}>✓✓</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CUSTOMER SEGMENTS */}
      {/* ========================================================================= */}
      {activeTab === 'segments' && (
        <div>
          {/* Filter Bar */}
          <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '10px', border: '1px solid rgba(212, 175, 55, 0.25)', boxShadow: 'var(--shadow-sm)', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.15rem' }}>
                  Customer Segmentation Engine
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Filter, analyze and export micro-targeted audiences from existing order transactions
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleExportSegmentCSV}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #D4AF37',
                    background: '#FFF',
                    color: '#AA7C11',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  <i className="fas fa-file-export" style={{ marginRight: '6px' }}></i> Export Segment CSV
                </button>
              </div>
            </div>

            {/* Filter Inputs Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '4px' }}>Preset Segment</label>
                <select
                  value={segmentFilters.segment_type}
                  onChange={(e) => setSegmentFilters({ ...segmentFilters, segment_type: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #CCC', fontSize: '0.82rem' }}
                >
                  <option value="all">All Customers</option>
                  <option value="new">New Customers (1 Order)</option>
                  <option value="repeat">Repeat Devotees (2+ Orders)</option>
                  <option value="high_value">High-Value VIPs (₹5,000+)</option>
                  <option value="inactive_30">Inactive &gt; 30 Days</option>
                  <option value="inactive_60">Inactive &gt; 60 Days</option>
                  <option value="inactive_90">Inactive &gt; 90 Days</option>
                  <option value="abandoned_pending">Pending / Incomplete Orders</option>
                  <option value="category_interest">Category Affinity</option>
                  <option value="location">City / Location</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '4px' }}>Min Spent (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={segmentFilters.min_spent}
                  onChange={(e) => setSegmentFilters({ ...segmentFilters, min_spent: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #CCC', fontSize: '0.82rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '4px' }}>Search Name / Email / Phone</label>
                <input
                  type="text"
                  placeholder="Search..."
                  value={segmentFilters.search_query}
                  onChange={(e) => setSegmentFilters({ ...segmentFilters, search_query: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #CCC', fontSize: '0.82rem' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', paddingTop: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={segmentFilters.only_opted_in}
                    onChange={(e) => setSegmentFilters({ ...segmentFilters, only_opted_in: e.target.checked })}
                    style={{ accentColor: '#AA7C11' }}
                  />
                  <span>Marketing Opt-in Only</span>
                </label>
              </div>
            </div>
          </div>

          {/* Segment Result Table */}
          <div style={{ background: '#FFFFFF', borderRadius: '10px', border: '1px solid rgba(212, 175, 55, 0.25)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', background: '#FAF9F6', borderBottom: '1px solid #EEE', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: '700', color: '#1E1A17' }}>
                Matching Devotees: <strong style={{ color: '#AA7C11' }}>{filteredSegmentCustomers.length}</strong>
              </span>
              <span style={{ fontSize: '0.75rem', color: '#666' }}>
                Total Lifetime Revenue: <strong>{formatPrice(filteredSegmentCustomers.reduce((a, c) => a + (c.total_spent || 0), 0))}</strong>
              </span>
            </div>

            <div style={{ overflowX: 'auto', maxHeight: '550px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#FFF' }}>
                  <tr style={{ color: 'var(--text-muted)', borderBottom: '2px solid #EEE' }}>
                    <th style={{ padding: '12px 14px' }}>Customer Name</th>
                    <th style={{ padding: '12px 14px' }}>Contact Details</th>
                    <th style={{ padding: '12px 14px' }}>Tier</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Orders</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Total Spent</th>
                    <th style={{ padding: '12px 14px' }}>Affinity Category</th>
                    <th style={{ padding: '12px 14px' }}>Location</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Consent Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSegmentCustomers.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: '#888', fontStyle: 'italic' }}>
                        No customers match this filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredSegmentCustomers.map((c, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #F0F0F0' }}>
                        <td style={{ padding: '12px 14px', fontWeight: '600', color: '#1E1A17' }}>
                          {c.name || 'Devotee'}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div>{c.email || '-'}</div>
                          {c.phone && <div style={{ fontSize: '0.72rem', color: '#666' }}>📞 {c.phone}</div>}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.7rem',
                            fontWeight: '700',
                            background: c.tier === 'VIP Patron' ? '#FFF8E1' : (c.tier === 'High Value' ? '#E8F5E9' : '#F5F5F5'),
                            color: c.tier === 'VIP Patron' ? '#AA7C11' : (c.tier === 'High Value' ? '#2E7D32' : '#555')
                          }}>
                            {c.tier}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: '600' }}>
                          {c.total_orders}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '700', color: '#AA7C11' }}>
                          {formatPrice(c.total_spent)}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#555' }}>
                          {c.preferred_category}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#555' }}>
                          {c.city || c.state || '-'}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.7rem', color: c.email_marketing_opt_in !== 0 ? '#2E7D32' : '#C62828', fontWeight: '600' }}>
                            ✉️ {c.email_marketing_opt_in !== 0 ? 'Opted-in' : 'Out'}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: c.whatsapp_marketing_opt_in !== 0 ? '#2E7D32' : '#C62828', fontWeight: '600', marginLeft: '6px' }}>
                            💬 {c.whatsapp_marketing_opt_in !== 0 ? 'Opted-in' : 'Out'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: CAMPAIGN HISTORY & DETAILS DRAWER */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div>
          {/* Filter Bar */}
          <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: '10px', border: '1px solid rgba(212, 175, 55, 0.25)', boxShadow: 'var(--shadow-sm)', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <select
                value={historyFilterType}
                onChange={(e) => setHistoryFilterType(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #CCC', fontSize: '0.82rem' }}
              >
                <option value="all">All Channels</option>
                <option value="email">Email Campaigns</option>
                <option value="whatsapp">WhatsApp Campaigns</option>
              </select>

              <select
                value={historyFilterStatus}
                onChange={(e) => setHistoryFilterStatus(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #CCC', fontSize: '0.82rem' }}
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="draft">Drafts</option>
                <option value="scheduled">Scheduled</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Showing <strong>{filteredCampaigns.length}</strong> campaigns
            </span>
          </div>

          {/* Campaigns History Table */}
          <div style={{ background: '#FFFFFF', borderRadius: '10px', border: '1px solid rgba(212, 175, 55, 0.25)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#FAF9F6', color: 'var(--text-muted)', borderBottom: '2px solid #EEE' }}>
                    <th style={{ padding: '14px 16px' }}>Campaign Name</th>
                    <th style={{ padding: '14px 16px' }}>Channel</th>
                    <th style={{ padding: '14px 16px' }}>Date</th>
                    <th style={{ padding: '14px 16px' }}>Status</th>
                    <th style={{ padding: '14px 16px', textAlign: 'center' }}>Recipients</th>
                    <th style={{ padding: '14px 16px', textAlign: 'center' }}>Delivery Stats</th>
                    <th style={{ padding: '14px 16px', textAlign: 'center' }}>Engagement</th>
                    <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCampaigns.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: '#888', fontStyle: 'italic' }}>
                        No campaigns found.
                      </td>
                    </tr>
                  ) : (
                    filteredCampaigns.map(c => {
                      const isEmail = c.type === 'email';
                      const createdDate = c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN') : '-';

                      return (
                        <tr key={c.id} style={{ borderBottom: '1px solid #F0F0F0' }}>
                          <td style={{ padding: '14px 16px', fontWeight: '600', color: '#1E1A17' }}>
                            {c.name}
                            {c.subject && <div style={{ fontSize: '0.72rem', color: '#666', fontWeight: '400' }}>{c.subject}</div>}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontSize: '0.72rem',
                              fontWeight: '600',
                              background: isEmail ? '#E3F2FD' : '#E8F5E9',
                              color: isEmail ? '#1565C0' : '#2E7D32'
                            }}>
                              <i className={isEmail ? 'fas fa-envelope' : 'fab fa-whatsapp'}></i>
                              {isEmail ? 'Email' : 'WhatsApp'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', color: '#666' }}>
                            {createdDate}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              fontWeight: '700',
                              textTransform: 'uppercase',
                              background: c.status === 'completed' ? '#E8F5E9' : (c.status === 'processing' ? '#FFF3E0' : (c.status === 'draft' ? '#F5F5F5' : '#FFEBEE')),
                              color: c.status === 'completed' ? '#2E7D32' : (c.status === 'processing' ? '#E65100' : (c.status === 'draft' ? '#666' : '#C62828'))
                            }}>
                              {c.status}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '600' }}>
                            {c.total_recipients || 0}
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <span style={{ color: '#2E7D32', fontWeight: '600' }}>{c.sent_count || 0} sent</span>
                            {c.failed_count > 0 && <span style={{ color: '#C62828', display: 'block', fontSize: '0.7rem' }}>{c.failed_count} failed</span>}
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            {isEmail ? (
                              <span>{c.opened_count || 0} opens &bull; {c.clicked_count || 0} clicks</span>
                            ) : (
                              <span>{c.clicked_count || 0} clicks</span>
                            )}
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => handleOpenCampaignDetails(c)}
                                style={{
                                  background: '#1E1A17',
                                  color: '#D4AF37',
                                  border: '1px solid #D4AF37',
                                  padding: '5px 10px',
                                  borderRadius: '4px',
                                  fontSize: '0.74rem',
                                  fontWeight: '600',
                                  cursor: 'pointer'
                                }}
                              >
                                View Details
                              </button>

                              {c.status === 'processing' && (
                                <button
                                  onClick={() => handleCancelCampaign(c.id)}
                                  style={{
                                    background: '#FFEBEE',
                                    color: '#C62828',
                                    border: '1px solid #FFCDD2',
                                    padding: '5px 8px',
                                    borderRadius: '4px',
                                    fontSize: '0.74rem',
                                    cursor: 'pointer'
                                  }}
                                  title="Cancel in-progress campaign"
                                >
                                  Cancel
                                </button>
                              )}

                              {c.failed_count > 0 && (
                                <button
                                  onClick={() => handleRetryFailed(c.id)}
                                  style={{
                                    background: '#FFF8E1',
                                    color: '#F57F17',
                                    border: '1px solid #FFE082',
                                    padding: '5px 8px',
                                    borderRadius: '4px',
                                    fontSize: '0.74rem',
                                    cursor: 'pointer'
                                  }}
                                  title="Retry failed recipients"
                                >
                                  Retry Failed
                                </button>
                              )}
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: TEMPLATES LIBRARY */}
      {/* ========================================================================= */}
      {activeTab === 'templates' && (
        <div>
          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {['all', 'new_arrival', 'festival', 'offer', 'welcome', 'follow_up', 'corporate', 'general', 'cart_recovery'].map(cat => (
              <button
                key={cat}
                onClick={() => setTemplateFilterCat(cat)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: '1px solid #D4AF37',
                  background: templateFilterCat === cat ? '#D4AF37' : '#FFFFFF',
                  color: templateFilterCat === cat ? '#111' : '#AA7C11',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {cat === 'all' ? 'All Templates' : cat.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>

          {/* Templates Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {templates
              .filter(t => templateFilterCat === 'all' || t.category === templateFilterCat)
              .map(tpl => {
                const isEmail = tpl.type === 'email';
                return (
                  <div
                    key={tpl.id}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '10px',
                      border: '1px solid rgba(212, 175, 55, 0.3)',
                      boxShadow: 'var(--shadow-sm)',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: '700',
                          letterSpacing: '1px',
                          textTransform: 'uppercase',
                          color: isEmail ? '#1565C0' : '#2E7D32',
                          background: isEmail ? '#E3F2FD' : '#E8F5E9',
                          padding: '2px 8px',
                          borderRadius: '10px'
                        }}>
                          {isEmail ? '✉️ Email Template' : '💬 WhatsApp Template'}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#999', textTransform: 'capitalize' }}>
                          {tpl.category}
                        </span>
                      </div>

                      <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', color: '#1E1A17', margin: '0 0 6px 0' }}>
                        {tpl.name}
                      </h4>
                      {tpl.subject && (
                        <p style={{ fontSize: '0.78rem', color: '#AA7C11', fontWeight: '600', margin: '0 0 8px 0' }}>
                          {tpl.subject}
                        </p>
                      )}
                      <p style={{ fontSize: '0.78rem', color: '#666', lineHeight: '1.5', margin: '0 0 16px 0' }}>
                        {tpl.preview_text || tpl.body_text?.substring(0, 100) + '...'}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #EEE', paddingTop: '14px' }}>
                      <button
                        onClick={() => {
                          if (isEmail) {
                            setEmailCampaignForm(prev => ({
                              ...prev,
                              template_id: tpl.id,
                              name: `${tpl.name} Campaign`,
                              subject: tpl.subject || '',
                              preview_text: tpl.preview_text || '',
                              content_html: tpl.body_html || '',
                              content_text: tpl.body_text || ''
                            }));
                            setActiveTab('email');
                          } else {
                            setWaCampaignForm(prev => ({
                              ...prev,
                              template_id: tpl.id,
                              name: `${tpl.name} Broadcast`,
                              content_text: tpl.body_text || ''
                            }));
                            setActiveTab('whatsapp');
                          }
                        }}
                        style={{
                          flex: 1,
                          background: 'linear-gradient(135deg, #D4AF37 0%, #AA7C11 100%)',
                          color: '#111',
                          border: 'none',
                          padding: '8px',
                          borderRadius: '4px',
                          fontSize: '0.78rem',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        Use Template &rarr;
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: CUSTOMER DATABASE & CONSENT PREFERENCES */}
      {/* ========================================================================= */}
      {activeTab === 'customers' && (
        <div>
          {/* Top Search & Filter Bar */}
          <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: '10px', border: '1px solid rgba(212, 175, 55, 0.25)', boxShadow: 'var(--shadow-sm)', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '10px', flex: 1, maxWidth: '600px' }}>
              <input
                type="text"
                placeholder="Search by client name, email, phone, city..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #D4AF37', fontSize: '0.82rem' }}
              />
              <select
                value={customerTierFilter}
                onChange={(e) => setCustomerTierFilter(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #CCC', fontSize: '0.82rem' }}
              >
                <option value="all">All Tiers</option>
                <option value="VIP Patron">VIP Patron (₹20K+)</option>
                <option value="High Value">High Value (₹8K+)</option>
                <option value="Repeat Devotee">Repeat Devotee</option>
                <option value="New Customer">New Customer</option>
                <option value="Subscriber / Lead">Subscriber / Lead</option>
              </select>
            </div>

            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Total Devotee Profiles: <strong>{filteredCustomerDb.length}</strong>
            </span>
          </div>

          {/* Customers Table */}
          <div style={{ background: '#FFFFFF', borderRadius: '10px', border: '1px solid rgba(212, 175, 55, 0.25)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', maxHeight: '600px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#FFF' }}>
                  <tr style={{ background: '#FAF9F6', color: 'var(--text-muted)', borderBottom: '2px solid #EEE' }}>
                    <th style={{ padding: '12px 16px' }}>Customer Name</th>
                    <th style={{ padding: '12px 16px' }}>Email Address</th>
                    <th style={{ padding: '12px 16px' }}>Phone Number</th>
                    <th style={{ padding: '12px 16px' }}>Tier</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Orders</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Total Spent</th>
                    <th style={{ padding: '12px 16px' }}>Location</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Email Marketing</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>WhatsApp Marketing</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomerDb.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ padding: '40px', textAlign: 'center', color: '#888', fontStyle: 'italic' }}>
                        No customers found matching search query.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomerDb.map((c, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #F0F0F0' }}>
                        <td style={{ padding: '12px 16px', fontWeight: '600', color: '#1E1A17' }}>
                          {c.name || 'Devotee'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {c.email || '-'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {c.phone || '-'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '0.7rem',
                            fontWeight: '700',
                            background: c.tier === 'VIP Patron' ? '#FFF8E1' : (c.tier === 'High Value' ? '#E8F5E9' : '#F5F5F5'),
                            color: c.tier === 'VIP Patron' ? '#AA7C11' : (c.tier === 'High Value' ? '#2E7D32' : '#555')
                          }}>
                            {c.tier}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600' }}>
                          {c.total_orders}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '700', color: '#AA7C11' }}>
                          {formatPrice(c.total_spent)}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#555' }}>
                          {c.city || c.state || '-'}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <button
                            onClick={() => handleToggleConsent(c, 'email', c.email_marketing_opt_in)}
                            style={{
                              border: 'none',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              background: c.email_marketing_opt_in !== 0 ? '#E8F5E9' : '#FFEBEE',
                              color: c.email_marketing_opt_in !== 0 ? '#2E7D32' : '#C62828'
                            }}
                          >
                            {c.email_marketing_opt_in !== 0 ? '✓ Opted In' : '✗ Opted Out'}
                          </button>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <button
                            onClick={() => handleToggleConsent(c, 'whatsapp', c.whatsapp_marketing_opt_in)}
                            style={{
                              border: 'none',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              background: c.whatsapp_marketing_opt_in !== 0 ? '#E8F5E9' : '#FFEBEE',
                              color: c.whatsapp_marketing_opt_in !== 0 ? '#2E7D32' : '#C62828'
                            }}
                          >
                            {c.whatsapp_marketing_opt_in !== 0 ? '✓ Opted In' : '✗ Opted Out'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CAMPAIGN DETAILS DRAWER */}
      {/* ========================================================================= */}
      {drawerOpen && selectedCampaignDetail && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(3px)',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '680px',
            background: '#FFFFFF',
            height: '100%',
            overflowY: 'auto',
            padding: '28px',
            boxShadow: '-10px 0 30px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid #EEE', paddingBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', color: '#AA7C11' }}>
                  Campaign Inspector &bull; {selectedCampaignDetail.campaign?.type?.toUpperCase()}
                </span>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: '#111', margin: '4px 0' }}>
                  {selectedCampaignDetail.campaign?.name}
                </h2>
                <span style={{ fontSize: '0.78rem', color: '#666' }}>
                  Created on {new Date(selectedCampaignDetail.campaign?.created_at).toLocaleString('en-IN')}
                </span>
              </div>
              <button onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#888' }}>
                &times;
              </button>
            </div>

            {loadingDetails ? (
              <p style={{ textAlign: 'center', color: '#888', fontStyle: 'italic', margin: '60px 0' }}>Loading campaign delivery records...</p>
            ) : (
              <div>
                {/* Stats Bar */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '24px' }}>
                  <div style={{ background: '#FAF9F6', padding: '12px', borderRadius: '6px', textAlign: 'center', border: '1px solid #EEE' }}>
                    <span style={{ fontSize: '0.7rem', color: '#666', display: 'block' }}>Recipients</span>
                    <strong style={{ fontSize: '1.2rem', color: '#111' }}>{selectedCampaignDetail.campaign?.total_recipients || 0}</strong>
                  </div>
                  <div style={{ background: '#E8F5E9', padding: '12px', borderRadius: '6px', textAlign: 'center', border: '1px solid #C8E6C9' }}>
                    <span style={{ fontSize: '0.7rem', color: '#2E7D32', display: 'block' }}>Sent</span>
                    <strong style={{ fontSize: '1.2rem', color: '#2E7D32' }}>{selectedCampaignDetail.campaign?.sent_count || 0}</strong>
                  </div>
                  <div style={{ background: '#E3F2FD', padding: '12px', borderRadius: '6px', textAlign: 'center', border: '1px solid #BBDEFB' }}>
                    <span style={{ fontSize: '0.7rem', color: '#1565C0', display: 'block' }}>Opens</span>
                    <strong style={{ fontSize: '1.2rem', color: '#1565C0' }}>{selectedCampaignDetail.campaign?.opened_count || 0}</strong>
                  </div>
                  <div style={{ background: '#FFEBEE', padding: '12px', borderRadius: '6px', textAlign: 'center', border: '1px solid #FFCDD2' }}>
                    <span style={{ fontSize: '0.7rem', color: '#C62828', display: 'block' }}>Failed</span>
                    <strong style={{ fontSize: '1.2rem', color: '#C62828' }}>{selectedCampaignDetail.campaign?.failed_count || 0}</strong>
                  </div>
                </div>

                {/* Recipient Logs Table */}
                <h4 style={{ fontSize: '0.9rem', marginBottom: '10px' }}>Delivery Logs by Recipient</h4>
                <div style={{ border: '1px solid #EEE', borderRadius: '6px', maxHeight: '350px', overflowY: 'auto', marginBottom: '24px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                    <thead>
                      <tr style={{ background: '#FAF9F6', borderBottom: '1px solid #EEE' }}>
                        <th style={{ padding: '8px 12px' }}>Recipient</th>
                        <th style={{ padding: '8px 12px' }}>Status</th>
                        <th style={{ padding: '8px 12px' }}>Sent At</th>
                        <th style={{ padding: '8px 12px' }}>Opened At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedCampaignDetail.recipients || []).map(r => (
                        <tr key={r.id} style={{ borderBottom: '1px solid #F0F0F0' }}>
                          <td style={{ padding: '8px 12px' }}>
                            <strong>{r.recipient_name}</strong>
                            <div style={{ fontSize: '0.7rem', color: '#666' }}>{r.recipient_email || r.recipient_phone}</div>
                            {r.error_message && <div style={{ color: '#C62828', fontSize: '0.68rem' }}>⚠️ {r.error_message}</div>}
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <span style={{
                              padding: '2px 6px',
                              borderRadius: '3px',
                              fontSize: '0.68rem',
                              fontWeight: '700',
                              background: r.status === 'sent' ? '#E8F5E9' : (r.status === 'failed' ? '#FFEBEE' : '#F5F5F5'),
                              color: r.status === 'sent' ? '#2E7D32' : (r.status === 'failed' ? '#C62828' : '#666')
                            }}>
                              {r.status}
                            </span>
                          </td>
                          <td style={{ padding: '8px 12px', color: '#666' }}>
                            {r.sent_at ? new Date(r.sent_at).toLocaleTimeString('en-IN') : '-'}
                          </td>
                          <td style={{ padding: '8px 12px', color: '#1565C0' }}>
                            {r.opened_at ? new Date(r.opened_at).toLocaleTimeString('en-IN') : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Technical Execution Logs */}
                <h4 style={{ fontSize: '0.9rem', marginBottom: '10px' }}>System Logs</h4>
                <div style={{ background: '#111', color: '#FFF', padding: '12px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.72rem', maxHeight: '180px', overflowY: 'auto' }}>
                  {(selectedCampaignDetail.logs || []).map(l => (
                    <div key={l.id} style={{ marginBottom: '4px', color: l.level === 'error' ? '#FF6B6B' : (l.level === 'warn' ? '#FFE082' : '#A5D6A7') }}>
                      [{new Date(l.created_at).toLocaleTimeString('en-IN')}] {l.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EXPLICIT SEND CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {confirmSendModal.open && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            maxWidth: '460px',
            width: '100%',
            padding: '28px',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            border: '1px solid rgba(212,175,55,0.4)'
          }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '10px' }}>🚀</span>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', color: '#1E1A17', margin: '0 0 8px 0' }}>
              Confirm Campaign Dispatch
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#6E5A5A', lineHeight: '1.6', marginBottom: '20px' }}>
              You are about to launch a live {confirmSendModal.type === 'email' ? 'Email' : 'WhatsApp'} campaign to <strong>{confirmSendModal.count} verified opted-in devotees</strong>.
            </p>

            <div style={{ background: '#FFF8F0', border: '1px solid #D4AF37', padding: '12px', borderRadius: '6px', fontSize: '0.78rem', color: '#3B2F2F', marginBottom: '24px' }}>
              ⚠️ Rate limits and queue batching are enabled. The campaign will process smoothly in background batches without blocking your admin view.
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => setConfirmSendModal({ open: false, campaignId: null, count: 0, type: 'email' })}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: '1px solid #CCC',
                  background: '#FFF',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  setConfirmSendModal({ open: false, campaignId: null, count: 0, type: 'email' });
                  if (confirmSendModal.type === 'email') {
                    handleSaveEmailCampaign('processing');
                  } else {
                    handleSaveWaCampaign('processing');
                  }
                }}
                style={{
                  padding: '10px 24px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #D4AF37 0%, #AA7C11 100%)',
                  color: '#111',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(212,175,55,0.3)'
                }}
              >
                Confirm &amp; Send Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Picker Modal */}
      <ProductPickerModal
        products={products}
        categories={categories}
        isOpen={emailProductPickerOpen || waProductPickerOpen}
        channel={emailProductPickerOpen ? 'email' : 'whatsapp'}
        onClose={() => {
          setEmailProductPickerOpen(false);
          setWaProductPickerOpen(false);
        }}
        onInsert={(content) => {
          if (emailProductPickerOpen) {
            setEmailCampaignForm(prev => ({
              ...prev,
              content_html: prev.content_html
                ? prev.content_html.replace('<!-- PRODUCT_CARDS_PLACEHOLDER -->', content) + (prev.content_html.includes('<!-- PRODUCT_CARDS_PLACEHOLDER -->') ? '' : '\n' + content)
                : content
            }));
          } else {
            setWaCampaignForm(prev => ({
              ...prev,
              content_text: prev.content_text + '\n\n' + content
            }));
          }
        }}
      />

    </div>
  );
}
