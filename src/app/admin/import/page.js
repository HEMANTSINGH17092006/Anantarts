'use client';

import { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import JSZip from 'jszip';
import { 
  validateCatalogRow, 
  parseWorkbookBuffer,
  findMatchedImagesForProduct, 
  generateSampleCsvContent, 
  generateImageNamingGuideContent, 
  exportErrorReportCsv,
  generateCsvHash
} from '@/lib/bulk-import-utils';

/**
 * Safe Fetch JSON Wrapper
 */
async function safeFetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (parseErr) {
    console.error(`[API Non-JSON Response HTTP ${res.status}]`, text);
    throw new Error(text || `Server returned non-JSON response (HTTP ${res.status})`);
  }
  if (!res.ok || !data.success) {
    throw new Error(data?.message || data?.error || text || `API Error (HTTP ${res.status})`);
  }
  return data;
}

export default function BulkImportPage() {
  const [activeTab, setActiveTab] = useState('import'); // 'import' | 'history'

  // Files state
  const [catalogFile, setCatalogFile] = useState(null);
  const [fileParsing, setFileParsing] = useState(false);
  const [parsedRows, setParsedRows] = useState([]);
  const [previewStats, setPreviewStats] = useState(null);

  // Optional ZIP File state (for local image matching)
  const [zipFile, setZipFile] = useState(null);
  const [zipEntriesMap, setZipEntriesMap] = useState(new Map());
  const [zipLoading, setZipLoading] = useState(false);
  const [zipCount, setZipCount] = useState(0);

  // Options state
  const [inventoryMode, setInventoryMode] = useState('update'); // 'update' | 'skip' | 'replace'
  const [isDryRun, setIsDryRun] = useState(false);
  const [batchSize, setBatchSize] = useState(25); // 10, 25, 50, 100

  // Execution state
  const [importing, setImporting] = useState(false);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentBatchNum, setCurrentBatchNum] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [speed, setSpeed] = useState(0); // items/sec
  const [etaSeconds, setEtaSeconds] = useState(0);

  // Live Counter state
  const [liveCounters, setLiveCounters] = useState({
    processed: 0,
    created: 0,
    updated: 0,
    failed: 0,
    imagesProcessed: 0,
    imagesFailed: 0
  });

  // Results state
  const [summary, setSummary] = useState(null);
  const [reportRows, setReportRows] = useState([]);
  const [imageFailuresList, setImageFailuresList] = useState([]);
  const [filterReport, setFilterReport] = useState('all'); // 'all' | 'failed' | 'duplicates' | 'images_failed'

  // History & Active Interrupted Session state
  const [historySessions, setHistorySessions] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [rollingBackId, setRollingBackId] = useState(null);
  const [interruptedSession, setInterruptedSession] = useState(null);

  // Cancellation ref
  const cancelRef = useRef(false);

  // Fetch History Sessions
  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await safeFetchJson('/api/admin/bulk-import/history');
      if (data.success) {
        const sessions = data.sessions || [];
        setHistorySessions(sessions);
        const active = sessions.find(s => s.status === 'processing');
        setInterruptedSession(active || null);
      }
    } catch (err) {
      console.error('[Fetch History Error]', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleRollback = async (sessionId) => {
    if (!confirm(`Are you sure you want to rollback session #${sessionId}? All created products will be deleted and updated products restored to pre-import snapshots.`)) {
      return;
    }
    setRollingBackId(sessionId);
    try {
      await safeFetchJson('/api/admin/bulk-import/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rollback', sessionId })
      });
      alert(`Import session #${sessionId} rolled back successfully.`);
      fetchHistory();
    } catch (err) {
      alert('Rollback failed: ' + err.message);
    } finally {
      setRollingBackId(null);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) fetchHistory();
    });
    return () => { active = false; };
  }, [activeTab]);

  // Read and parse uploaded catalog file (.xlsx, .xls, .csv)
  const handleCatalogFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCatalogFile(file);
    setFileParsing(true);
    setPreviewStats(null);
    setParsedRows([]);
    setSummary(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const rawRows = parseWorkbookBuffer(arrayBuffer);

      if (!rawRows || rawRows.length === 0) {
        alert('The uploaded file does not contain any product rows.');
        setFileParsing(false);
        return;
      }

      // Fetch DB categories and existing SKUs for preview validation
      const initData = await safeFetchJson('/api/admin/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'init',
          csv_file_name: file.name,
          is_dry_run: true
        })
      });

      const existingDbSkusSet = new Set(initData.existingDbSkus || []);
      const categoriesMap = new Map(Object.entries(initData.categoriesMap || {}));
      const seenSkusInFile = new Set();

      let newCount = 0;
      let existingCount = 0;
      let duplicateSkusCount = 0;
      let missingTitleCount = 0;
      let missingPriceCount = 0;
      let invalidCatCount = 0;
      let missingPrimaryImgCount = 0;
      let totalImagesCount = 0;

      const validated = [];

      rawRows.forEach((row, idx) => {
        const val = validateCatalogRow(row, idx, seenSkusInFile, existingDbSkusSet, categoriesMap);
        validated.push(val);

        if (val.isDuplicateInFile) duplicateSkusCount++;
        if (val.isExistingInDb) existingCount++;
        else newCount++;

        if (!val.data.name) missingTitleCount++;
        if (isNaN(val.data.price) || val.data.price <= 0) missingPriceCount++;
        if (val.isInvalidCategory) invalidCatCount++;
        if (!val.hasPrimaryImage) missingPrimaryImgCount++;
        totalImagesCount += val.totalImageCount;
      });

      setParsedRows(validated);
      setPreviewStats({
        totalProducts: validated.length,
        newProducts: newCount,
        existingProducts: existingCount,
        duplicateSkus: duplicateSkusCount,
        missingTitles: missingTitleCount,
        missingPrices: missingPriceCount,
        invalidCategories: invalidCatCount,
        missingPrimaryImages: missingPrimaryImgCount,
        totalImages: totalImagesCount
      });

    } catch (err) {
      console.error('[Catalog Parse Error]', err);
      alert('Failed to parse catalog file: ' + err.message);
      setCatalogFile(null);
    } finally {
      setFileParsing(false);
    }
  };

  // Read Optional ZIP Archive in Browser
  const handleZipChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setZipFile(file);
    setZipLoading(true);

    try {
      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(file);
      const entriesMap = new Map();
      let fileCount = 0;

      loadedZip.forEach((relativePath, zipEntry) => {
        if (!zipEntry.dir && !relativePath.includes('__MACOSX') && !relativePath.startsWith('.')) {
          entriesMap.set(relativePath.toLowerCase(), zipEntry);
          fileCount++;
        }
      });

      setZipEntriesMap(entriesMap);
      setZipCount(fileCount);
    } catch (err) {
      alert('Failed to parse ZIP archive. Please upload a valid .zip folder.');
      setZipFile(null);
      setZipEntriesMap(new Map());
      setZipCount(0);
    } finally {
      setZipLoading(false);
    }
  };

  // Download Sample CSV
  const handleDownloadSampleCsv = () => {
    const csvContent = generateSampleCsvContent();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Anant_Arts_Sample_Products.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Image Naming Guide
  const handleDownloadGuide = () => {
    const guideText = generateImageNamingGuideContent();
    const blob = new Blob([guideText], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Anant_Arts_Import_Guide.txt');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Error Report CSV
  const handleDownloadErrorReport = () => {
    if (reportRows.length === 0) {
      alert('No report data available to export.');
      return;
    }
    const csvStr = exportErrorReportCsv(reportRows);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Import_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Execute Confirmed Bulk Import
  const startBulkImport = async () => {
    if (!catalogFile || parsedRows.length === 0) {
      alert('Please upload and inspect an Excel or CSV file first.');
      return;
    }

    setImporting(true);
    setPaused(false);
    setProgress(0);
    setSummary(null);
    setReportRows([]);
    setImageFailuresList([]);
    cancelRef.current = false;

    setLiveCounters({
      processed: 0,
      created: 0,
      updated: 0,
      failed: 0,
      imagesProcessed: 0,
      imagesFailed: 0
    });

    const startTime = Date.now();
    const totalRows = parsedRows.length;

    try {
      const fileText = catalogFile.name;
      const fileHash = await generateCsvHash(fileText + '_' + totalRows);

      // 1. Initialize Active Import Session
      const initData = await safeFetchJson('/api/admin/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'init',
          csv_file_name: catalogFile.name,
          csv_hash: fileHash,
          total_rows: totalRows,
          inventory_mode: inventoryMode,
          is_dry_run: isDryRun,
          batch_size: batchSize
        })
      });

      const sessionId = initData.sessionId;

      // 2. Split Rows into Batches
      const batches = [];
      for (let i = 0; i < parsedRows.length; i += batchSize) {
        batches.push(parsedRows.slice(i, i + batchSize));
      }

      setTotalBatches(batches.length);

      let processedCount = 0;
      let successCount = 0;
      let createdCount = 0;
      let updatedCount = 0;
      let failedCount = 0;
      let duplicateCount = 0;
      let totalImagesDone = 0;
      let totalImagesErr = 0;

      const allReportDetails = [];
      const allImageFailures = [];

      // 3. Process Batches Sequentially
      for (let bIndex = 0; bIndex < batches.length; bIndex++) {
        if (cancelRef.current) {
          alert('Import process stopped by user.');
          break;
        }

        setCurrentBatchNum(bIndex + 1);
        const batch = batches[bIndex];

        // Format batch payload
        const batchPayloadRows = batch.map(row => ({
          rowIndex: row.rowIndex,
          data: row.data
        }));

        try {
          const batchResponse = await safeFetchJson('/api/admin/bulk-import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'process_batch',
              sessionId,
              inventory_mode: inventoryMode,
              is_dry_run: isDryRun,
              rows: batchPayloadRows
            })
          });

          const results = batchResponse.batchResults || [];
          results.forEach(res => {
            allReportDetails.push(res);
            if (res.status === 'Created') createdCount++;
            else if (res.status === 'Updated' || res.status === 'Replaced') updatedCount++;
            else if (res.status === 'Failed') failedCount++;
            else if (res.status && res.status.includes('Skipped')) duplicateCount++;
          });

          if (Array.isArray(batchResponse.imageFailures)) {
            batchResponse.imageFailures.forEach(f => {
              allImageFailures.push(f);
            });
            setImageFailuresList([...allImageFailures]);
          }

          totalImagesDone += (batchResponse.totalImagesProcessed || 0);
          totalImagesErr += (batchResponse.totalImagesFailed || 0);

        } catch (batchErr) {
          console.error(`[Batch ${bIndex + 1} Error]`, batchErr);
          batch.forEach(r => {
            failedCount++;
            allReportDetails.push({
              rowIndex: r.rowIndex,
              sku: r.data.sku,
              name: r.data.name,
              status: 'Failed',
              message: batchErr.message || 'Batch execution failed'
            });
          });
        }

        processedCount += batch.length;
        const currentProgress = Math.round((processedCount / totalRows) * 100);
        setProgress(currentProgress);

        // Update live counters
        setLiveCounters({
          processed: processedCount,
          created: createdCount,
          updated: updatedCount,
          failed: failedCount,
          imagesProcessed: totalImagesDone,
          imagesFailed: totalImagesErr
        });

        // Speed & ETA
        const elapsedSec = (Date.now() - startTime) / 1000;
        const currentSpeed = (processedCount / (elapsedSec || 1)).toFixed(1);
        setSpeed(currentSpeed);

        const remainingItems = totalRows - processedCount;
        const remainingEta = Math.round(remainingItems / (parseFloat(currentSpeed) || 1));
        setEtaSeconds(remainingEta);
      }

      // 4. Finalize Session
      const totalDuration = Date.now() - startTime;
      const reportCsv = exportErrorReportCsv(allReportDetails);

      if (!isDryRun && sessionId) {
        await safeFetchJson('/api/admin/bulk-import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'finish',
            sessionId,
            duration_ms: totalDuration,
            reportCsvContent: reportCsv
          })
        });
      }

      setSummary({
        totalRows,
        processedCount,
        createdCount,
        updatedCount,
        failedCount,
        duplicateCount,
        imagesProcessed: totalImagesDone,
        imagesFailed: totalImagesErr,
        durationSec: (totalDuration / 1000).toFixed(1)
      });

      setReportRows(allReportDetails);

    } catch (err) {
      alert('Import execution error: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  // Filter report rows
  const filteredReportRows = reportRows.filter(r => {
    if (filterReport === 'failed') return r.status === 'Failed';
    if (filterReport === 'duplicates') return r.status && r.status.includes('Skipped');
    if (filterReport === 'images_failed') return r.imagesUploadedCount === 0 || !r.hasImage;
    return true;
  });

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto', color: '#1A1A1A' }}>
      
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0D0D0D 0%, #1A1A1A 100%)',
        borderRadius: '16px',
        padding: '32px',
        color: '#FFFFFF',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.25)',
        border: '1px solid rgba(212, 175, 55, 0.3)',
        marginBottom: '32px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', letterSpacing: '2px', color: '#D4AF37', textTransform: 'uppercase' }}>
              ANANT ARTS CATALOG ENGINE
            </span>
            <h1 style={{ fontSize: '2.2rem', fontFamily: "'Playfair Display', Georgia, serif", margin: '8px 0 4px', fontWeight: '600', color: '#FFFFFF' }}>
              Bulk Product Importer
            </h1>
            <p style={{ color: '#A0A0A0', fontSize: '0.95rem', margin: 0 }}>
              Import catalog products directly from Excel (.xlsx, .xls) or CSV with automatic server-side image downloading to Supabase Storage.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleDownloadSampleCsv}
              style={{
                background: 'rgba(212, 175, 55, 0.12)',
                color: '#D4AF37',
                border: '1px solid #D4AF37',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              📥 Download Sample
            </button>
            <button
              onClick={handleDownloadGuide}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              📖 Importer Guide
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '28px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            onClick={() => setActiveTab('import')}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'import' ? '3px solid #D4AF37' : '3px solid transparent',
              color: activeTab === 'import' ? '#D4AF37' : '#A0A0A0',
              padding: '12px 16px',
              fontWeight: '600',
              fontSize: '0.95rem',
              cursor: 'pointer'
            }}
          >
            🚀 Import Workspace
          </button>
          <button
            onClick={() => setActiveTab('history')}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'history' ? '3px solid #D4AF37' : '3px solid transparent',
              color: activeTab === 'history' ? '#D4AF37' : '#A0A0A0',
              padding: '12px 16px',
              fontWeight: '600',
              fontSize: '0.95rem',
              cursor: 'pointer'
            }}
          >
            📜 Import History & Rollback
          </button>
        </div>
      </div>

      {/* TAB 1: IMPORT WORKSPACE */}
      {activeTab === 'import' && (
        <>
          {/* Interrupted Session Banner */}
          {interruptedSession && !importing && (
            <div style={{
              background: '#FFFBEB',
              border: '2px solid #F59E0B',
              borderRadius: '12px',
              padding: '20px 24px',
              marginBottom: '28px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: '1rem', color: '#92400E', fontWeight: '700' }}>
                  ⚠️ Interrupted Import Session Found
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#B45309' }}>
                  Session #{interruptedSession.id} ({interruptedSession.csv_file_path}) was interrupted. 
                  Processed {interruptedSession.processed_rows} of {interruptedSession.total_rows} rows.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={async () => {
                    await fetch('/api/admin/bulk-import/history', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'rollback', sessionId: interruptedSession.id })
                    });
                    setInterruptedSession(null);
                    fetchHistory();
                  }}
                  style={{
                    background: 'transparent',
                    color: '#B45309',
                    border: '1px solid #B45309',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  ❌ Clear Interrupted Session
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px' }}>
          
          {/* Left Column */}
          <div>
            {/* File Upload Dropzones */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              
              {/* Excel / CSV Upload Dropzone */}
              <div style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                padding: '28px 24px',
                border: catalogFile ? '2px solid #2E7D32' : '2px dashed #CBD5E1',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                textAlign: 'center',
                position: 'relative'
              }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📊</div>
                <h3 style={{ fontSize: '1.1rem', margin: '0 0 6px', fontWeight: '600' }}>Catalogue Excel or CSV</h3>
                <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0 0 16px' }}>
                  Select <strong>Anant_Arts_Bulk_Upload_Converted.xlsx</strong> (.xlsx, .xls, .csv).
                </p>

                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleCatalogFileChange}
                  style={{ display: 'none' }}
                  id="catalog-file-input"
                />

                <label
                  htmlFor="catalog-file-input"
                  style={{
                    background: catalogFile ? '#E8F5E9' : '#0D0D0D',
                    color: catalogFile ? '#2E7D32' : '#FFFFFF',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'inline-block'
                  }}
                >
                  {fileParsing ? 'Reading Workbook...' : catalogFile ? `✓ ${catalogFile.name}` : 'Choose Excel / CSV File'}
                </label>
              </div>

              {/* Optional ZIP Archive (Fallback) */}
              <div style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                padding: '28px 24px',
                border: zipFile ? '2px solid #2E7D32' : '2px dashed #CBD5E1',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                textAlign: 'center',
                position: 'relative'
              }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🖼️</div>
                <h3 style={{ fontSize: '1.1rem', margin: '0 0 6px', fontWeight: '600' }}>Images ZIP (Optional)</h3>
                <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0 0 16px' }}>
                  Not required if your Excel contains image URLs.
                </p>

                <input
                  type="file"
                  accept=".zip"
                  onChange={handleZipChange}
                  style={{ display: 'none' }}
                  id="zip-file-input"
                />

                <label
                  htmlFor="zip-file-input"
                  style={{
                    background: zipFile ? '#E8F5E9' : '#64748B',
                    color: '#FFFFFF',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'inline-block'
                  }}
                >
                  {zipLoading ? 'Extracting...' : zipFile ? `✓ ${zipCount} Images` : 'Optional Local ZIP'}
                </label>
              </div>
            </div>

            {/* STEP 6 & 7: IMPORT PREVIEW & ADMIN CONFIRMATION */}
            {previewStats && !importing && (
              <div style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                padding: '28px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                marginBottom: '28px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '1px', color: '#D4AF37', textTransform: 'uppercase' }}>
                      STEP 1 OF 2: VERIFICATION & PREVIEW
                    </span>
                    <h2 style={{ fontSize: '1.4rem', margin: '4px 0 0', fontWeight: '700' }}>
                      Import Catalog Preview
                    </h2>
                  </div>
                  <span style={{ background: '#F1F5F9', padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', color: '#475569' }}>
                    {catalogFile?.name}
                  </span>
                </div>

                {/* 9-Metric Preview Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '4px' }}>Total Products</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0F172A' }}>{previewStats.totalProducts}</div>
                  </div>

                  <div style={{ background: '#F0FDF4', padding: '16px', borderRadius: '10px', border: '1px solid #BBF7D0' }}>
                    <div style={{ fontSize: '0.8rem', color: '#166534', marginBottom: '4px' }}>New Products</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#15803D' }}>{previewStats.newProducts}</div>
                  </div>

                  <div style={{ background: '#EFF6FF', padding: '16px', borderRadius: '10px', border: '1px solid #BFDBFE' }}>
                    <div style={{ fontSize: '0.8rem', color: '#1E40AF', marginBottom: '4px' }}>Existing to Update</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2563EB' }}>{previewStats.existingProducts}</div>
                  </div>

                  <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '4px' }}>Total Images</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0F172A' }}>{previewStats.totalImages}</div>
                  </div>

                  <div style={{ background: previewStats.duplicateSkus > 0 ? '#FEF2F2' : '#F8FAFC', padding: '16px', borderRadius: '10px', border: previewStats.duplicateSkus > 0 ? '1px solid #FECACA' : '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.8rem', color: previewStats.duplicateSkus > 0 ? '#991B1B' : '#64748B', marginBottom: '4px' }}>Duplicate SKUs</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: previewStats.duplicateSkus > 0 ? '#DC2626' : '#0F172A' }}>{previewStats.duplicateSkus}</div>
                  </div>

                  <div style={{ background: previewStats.invalidCategories > 0 ? '#FEF2F2' : '#F8FAFC', padding: '16px', borderRadius: '10px', border: previewStats.invalidCategories > 0 ? '1px solid #FECACA' : '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.8rem', color: previewStats.invalidCategories > 0 ? '#991B1B' : '#64748B', marginBottom: '4px' }}>Invalid Categories</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: previewStats.invalidCategories > 0 ? '#DC2626' : '#0F172A' }}>{previewStats.invalidCategories}</div>
                  </div>

                  <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '4px' }}>Missing Titles</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: previewStats.missingTitles > 0 ? '#DC2626' : '#0F172A' }}>{previewStats.missingTitles}</div>
                  </div>

                  <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '4px' }}>Missing Prices</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: previewStats.missingPrices > 0 ? '#DC2626' : '#0F172A' }}>{previewStats.missingPrices}</div>
                  </div>

                  <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '4px' }}>Missing Cover Photos</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: previewStats.missingPrimaryImages > 0 ? '#DC2626' : '#0F172A' }}>{previewStats.missingPrimaryImages}</div>
                  </div>
                </div>

                {/* START IMPORT ACTION BOX */}
                <div style={{
                  background: '#0D0D0D',
                  color: '#FFFFFF',
                  borderRadius: '12px',
                  padding: '24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                  border: '1px solid rgba(212, 175, 55, 0.4)'
                }}>
                  <div>
                    <div style={{ color: '#D4AF37', fontWeight: '700', fontSize: '0.85rem', marginBottom: '4px' }}>
                      READY TO INGEST
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>
                      Ready to process {previewStats.totalProducts} products with {previewStats.totalImages} images
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '2px' }}>
                      Mode: {inventoryMode === 'update' ? 'Update Existing SKUs & Create New' : inventoryMode === 'skip' ? 'Skip Existing SKUs' : 'Replace Completely'} • Batch: {batchSize} per request
                    </div>
                  </div>

                  <button
                    onClick={startBulkImport}
                    style={{
                      background: 'linear-gradient(135deg, #D4AF37 0%, #AA7C11 100%)',
                      color: '#000000',
                      border: 'none',
                      padding: '14px 32px',
                      borderRadius: '8px',
                      fontWeight: '800',
                      fontSize: '1rem',
                      letterSpacing: '1px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(212, 175, 55, 0.35)',
                      transition: 'all 0.2s'
                    }}
                  >
                    START IMPORT 🚀
                  </button>
                </div>
              </div>
            )}

            {/* LIVE PROGRESS (When Importing) */}
            {importing && (
              <div style={{
                background: '#0D0D0D',
                borderRadius: '16px',
                padding: '28px',
                color: '#FFFFFF',
                marginBottom: '28px',
                border: '1px solid rgba(212, 175, 55, 0.4)',
                boxShadow: '0 12px 32px rgba(0,0,0,0.3)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#D4AF37', fontWeight: '700', letterSpacing: '1px' }}>
                      BATCH PROCESSING LIVE
                    </span>
                    <h3 style={{ margin: '4px 0 0', fontSize: '1.25rem', fontWeight: '600' }}>
                      Batch {currentBatchNum} of {totalBatches}
                    </h3>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: '800', color: '#D4AF37' }}>
                    {progress}%
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', overflow: 'hidden', marginBottom: '20px' }}>
                  <div style={{
                    height: '100%',
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #D4AF37 0%, #FFF2B2 100%)',
                    transition: 'width 0.4s ease'
                  }} />
                </div>

                {/* Live Processing Counters Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.06)', padding: '12px 16px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#A0A0A0' }}>Products Processed</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: '700' }}>
                      {liveCounters.processed} / {parsedRows.length}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(46, 125, 50, 0.15)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(46, 125, 50, 0.3)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#81C784' }}>Created / Updated</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: '700', color: '#A5D6A7' }}>
                      {liveCounters.created} created • {liveCounters.updated} updated
                    </div>
                  </div>

                  <div style={{ background: 'rgba(212, 175, 55, 0.15)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#F3E5AB' }}>Images Processed</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: '700', color: '#D4AF37' }}>
                      {liveCounters.imagesProcessed} uploaded {liveCounters.imagesFailed > 0 ? `(${liveCounters.imagesFailed} failed)` : ''}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#94A3B8' }}>
                  <span>Speed: ~{speed} items/sec</span>
                  <span>Estimated Time Remaining: {etaSeconds}s</span>
                </div>
              </div>
            )}

            {/* STEP 12: FINAL REPORT */}
            {summary && (
              <div style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                padding: '32px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
                marginBottom: '28px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', letterSpacing: '1px', color: '#2E7D32', textTransform: 'uppercase' }}>
                      IMPORT COMPLETED
                    </span>
                    <h2 style={{ fontSize: '1.6rem', margin: '4px 0 0', fontWeight: '700' }}>
                      Catalog Import Execution Summary
                    </h2>
                  </div>

                  <button
                    onClick={handleDownloadErrorReport}
                    style={{
                      background: '#0D0D0D',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      fontWeight: '700',
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    📥 Download Error Report (CSV)
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#64748B' }}>TOTAL ROWS</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: '700' }}>{summary.totalRows}</div>
                  </div>

                  <div style={{ background: '#F0FDF4', padding: '16px', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#166534' }}>CREATED</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#166534' }}>{summary.createdCount}</div>
                  </div>

                  <div style={{ background: '#EFF6FF', padding: '16px', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#1E40AF' }}>UPDATED</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#1E40AF' }}>{summary.updatedCount}</div>
                  </div>

                  <div style={{ background: summary.failedCount > 0 ? '#FEF2F2' : '#F8FAFC', padding: '16px', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.8rem', color: summary.failedCount > 0 ? '#991B1B' : '#64748B' }}>FAILED</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: '700', color: summary.failedCount > 0 ? '#DC2626' : '#0F172A' }}>{summary.failedCount}</div>
                  </div>

                  <div style={{ background: '#FFFBEB', padding: '16px', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#92400E' }}>IMAGES PROCESSED</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#B45309' }}>{summary.imagesProcessed}</div>
                  </div>

                  <div style={{ background: summary.imagesFailed > 0 ? '#FEF2F2' : '#F8FAFC', padding: '16px', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.8rem', color: summary.imagesFailed > 0 ? '#991B1B' : '#64748B' }}>IMAGES FAILED</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: '700', color: summary.imagesFailed > 0 ? '#DC2626' : '#0F172A' }}>{summary.imagesFailed}</div>
                  </div>

                  <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#64748B' }}>SKIPPED</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: '700' }}>{summary.duplicateCount}</div>
                  </div>

                  <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#64748B' }}>EXECUTION TIME</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: '700' }}>{summary.durationSec}s</div>
                  </div>
                </div>

                {/* Filterable Detailed Results Table */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0 }}>Itemized Execution Details</h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['all', 'failed', 'duplicates', 'images_failed'].map(flt => (
                      <button
                        key={flt}
                        onClick={() => setFilterReport(flt)}
                        style={{
                          background: filterReport === flt ? '#0D0D0D' : '#F1F5F9',
                          color: filterReport === flt ? '#FFFFFF' : '#475569',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        {flt.toUpperCase().replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ maxHeight: '380px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>
                        <th style={{ padding: '10px 14px' }}>Row</th>
                        <th style={{ padding: '10px 14px' }}>SKU</th>
                        <th style={{ padding: '10px 14px' }}>Product Title</th>
                        <th style={{ padding: '10px 14px' }}>Status</th>
                        <th style={{ padding: '10px 14px' }}>Images</th>
                        <th style={{ padding: '10px 14px' }}>Message / Errors</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReportRows.map((r, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '10px 14px' }}>{r.rowIndex}</td>
                          <td style={{ padding: '10px 14px', fontWeight: '600' }}>{r.sku || 'N/A'}</td>
                          <td style={{ padding: '10px 14px', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {r.name}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              background: r.status === 'Created' ? '#DCFCE7' : r.status === 'Updated' ? '#DBEAFE' : r.status === 'Failed' ? '#FEE2E2' : '#FEF3C7',
                              color: r.status === 'Created' ? '#166534' : r.status === 'Updated' ? '#1E40AF' : r.status === 'Failed' ? '#991B1B' : '#92400E'
                            }}>
                              {r.status}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            {r.hasImage ? `✓ ${r.imagesUploadedCount || 1}` : '❌ Missing'}
                          </td>
                          <td style={{ padding: '10px 14px', color: '#64748B' }}>
                            {r.message || (Array.isArray(r.errors) ? r.errors.join('; ') : '')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Image Failures Section if any */}
                {imageFailuresList.length > 0 && (
                  <div style={{ marginTop: '24px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '20px' }}>
                    <h4 style={{ margin: '0 0 12px', color: '#991B1B', fontSize: '0.95rem', fontWeight: '700' }}>
                      ⚠️ Individual Image Download Warnings ({imageFailuresList.length})
                    </h4>
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {imageFailuresList.map((f, idx) => (
                        <div key={idx} style={{ fontSize: '0.8rem', color: '#7F1D1D', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px dashed #FCA5A5' }}>
                          <strong>{f.sku}</strong> — {f.name}: <a href={f.url} target="_blank" rel="noreferrer" style={{ color: '#DC2626', textDecoration: 'underline' }}>{f.url.slice(0, 70)}...</a>
                          <div style={{ color: '#991B1B', fontStyle: 'italic', marginTop: '2px' }}>Reason: {f.reason}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Execution Configuration */}
          <div>
            <div style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              border: '1px solid #E2E8F0',
              position: 'sticky',
              top: '24px'
            }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '0 0 20px', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                ⚙️ Ingestion Settings
              </h3>

              {/* Inventory Mode */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px' }}>
                  SKU Collision Policy
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { id: 'update', title: 'Update Existing (Recommended)', desc: 'Updates fields, attaches images without duplication' },
                    { id: 'skip', title: 'Skip Existing', desc: 'Preserves existing product completely' },
                    { id: 'replace', title: 'Replace Completely', desc: 'Overwrites fields and replaces gallery images' }
                  ].map(mode => (
                    <label
                      key={mode.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: inventoryMode === mode.id ? '2px solid #D4AF37' : '1px solid #E2E8F0',
                        background: inventoryMode === mode.id ? '#FFFDF5' : '#FFFFFF',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="radio"
                        name="inventoryMode"
                        checked={inventoryMode === mode.id}
                        onChange={() => setInventoryMode(mode.id)}
                        style={{ marginTop: '3px' }}
                      />
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: '700' }}>{mode.title}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{mode.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Batch Chunk Size */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px' }}>
                  Batch Chunk Size
                </label>
                <select
                  value={batchSize}
                  onChange={(e) => setBatchSize(parseInt(e.target.value, 10))}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.88rem',
                    fontWeight: '600'
                  }}
                >
                  <option value={10}>10 Products per chunk (Gentle / Slower networks)</option>
                  <option value={25}>25 Products per chunk (Optimal / Recommended)</option>
                  <option value={50}>50 Products per chunk (Fast)</option>
                </select>
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
                  Smaller chunks prevent server timeouts when downloading high-res images.
                </div>
              </div>

              {/* Dry Run Toggle */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isDryRun}
                    onChange={(e) => setIsDryRun(e.target.checked)}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>Dry Run (Validation Only)</span>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Simulates execution without altering DB or storage.</div>
                  </div>
                </label>
              </div>

              {/* Storage Architecture Info */}
              <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.78rem', color: '#475569' }}>
                <strong style={{ color: '#0F172A' }}>Storage Architecture:</strong>
                <ul style={{ margin: '6px 0 0', paddingLeft: '16px', lineHeight: '1.4' }}>
                  <li>Bucket: <code style={{ color: '#B45309' }}>uploads</code></li>
                  <li>Images: <code style={{ color: '#B45309' }}>products/&#123;SKU&#125;/1.jpg</code></li>
                  <li>Auto-retries: 3 attempts per URL</li>
                  <li>Service-role key kept server-side</li>
                </ul>
              </div>

            </div>
          </div>

          </div>
        </>
      )}

      {/* TAB 2: IMPORT HISTORY & ROLLBACK */}
      {activeTab === 'history' && (
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          border: '1px solid #E2E8F0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '700', margin: '0 0 4px' }}>Historical Import Sessions</h2>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>
                Audit trail of past bulk import runs with 1-click non-destructive rollback.
              </p>
            </div>
            <button
              onClick={fetchHistory}
              style={{
                background: '#F1F5F9',
                color: '#334155',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              🔄 Refresh History
            </button>
          </div>

          {historyLoading ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#64748B' }}>Loading history...</div>
          ) : historySessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#64748B' }}>No historical import sessions recorded yet.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px' }}>Session</th>
                  <th style={{ padding: '12px 16px' }}>Admin</th>
                  <th style={{ padding: '12px 16px' }}>File</th>
                  <th style={{ padding: '12px 16px' }}>Mode</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px' }}>Processed</th>
                  <th style={{ padding: '12px 16px' }}>Success</th>
                  <th style={{ padding: '12px 16px' }}>Failed</th>
                  <th style={{ padding: '12px 16px' }}>Date</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {historySessions.map(sess => (
                  <tr key={sess.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '700' }}>#{sess.id}</td>
                    <td style={{ padding: '12px 16px', color: '#475569' }}>{sess.admin_email}</td>
                    <td style={{ padding: '12px 16px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {sess.csv_file_path}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', background: '#F1F5F9' }}>
                        {sess.inventory_mode}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: sess.status === 'completed' ? '#DCFCE7' : sess.status === 'rolled_back' ? '#FEE2E2' : '#FEF3C7',
                        color: sess.status === 'completed' ? '#166534' : sess.status === 'rolled_back' ? '#991B1B' : '#92400E'
                      }}>
                        {sess.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>{sess.processed_rows} / {sess.total_rows}</td>
                    <td style={{ padding: '12px 16px', color: '#166534', fontWeight: '600' }}>{sess.success_count}</td>
                    <td style={{ padding: '12px 16px', color: sess.failed_count > 0 ? '#DC2626' : '#64748B' }}>{sess.failed_count}</td>
                    <td style={{ padding: '12px 16px', color: '#64748B', fontSize: '0.8rem' }}>
                      {new Date(sess.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      {sess.status === 'completed' && (
                        <button
                          onClick={() => handleRollback(sess.id)}
                          disabled={rollingBackId === sess.id}
                          style={{
                            background: '#FEE2E2',
                            color: '#991B1B',
                            border: '1px solid #FCA5A5',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          {rollingBackId === sess.id ? 'Rolling back...' : '↩️ Rollback'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

    </div>
  );
}
