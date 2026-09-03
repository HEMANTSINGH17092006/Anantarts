'use client';

import { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import JSZip from 'jszip';
import { 
  validateCsvRow, 
  findMatchedImagesForProduct, 
  generateSampleCsvContent, 
  generateImageNamingGuideContent, 
  exportErrorReportCsv,
  generateCsvHash
} from '@/lib/bulk-import-utils';

import { createClient as createBrowserSupabaseClient } from '@/lib/supabase/client';

/**
 * Safe Fetch JSON Wrapper
 * Guarantees that non-JSON server text responses (e.g. 413 Payload Too Large)
 * produce clean, informative Error objects instead of throwing SyntaxError "Unexpected token".
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

/**
 * Direct Binary FormData Image Upload
 * Sends extracted JSZip image Blobs as multipart/form-data to /api/admin/bulk-import/upload.
 * Completely bypasses Base64 encoding and JSON payload limits.
 */
async function uploadImageFile(filename, blob) {
  const formData = new FormData();
  const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
  formData.append('file', file);

  const res = await fetch('/api/admin/bulk-import/upload', {
    method: 'POST',
    body: formData
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    console.error(`[Upload Non-JSON Response HTTP ${res.status}]`, text);
    throw new Error(text || `Upload HTTP ${res.status}`);
  }

  if (!res.ok || !data.success) {
    throw new Error(data?.message || `Upload failed HTTP ${res.status}`);
  }

  return data.publicUrl;
}

/**
 * Direct Storage Uploader
 * Uploads extracted JSZip image Blobs directly to Supabase Storage.
 * Bypasses API JSON payload body limits completely.
 */
async function uploadZipImageToStorage(imgRef) {
  try {
    const blob = await imgRef.entry.async('blob');
    return await uploadImageFile(imgRef.filename, blob);
  } catch (err) {
    console.error('[Direct Image Upload Error]', imgRef.filename, err);
    return null;
  }
}

export default function BulkImportPage() {
  const [activeTab, setActiveTab] = useState('import'); // 'import' | 'history'

  // Files state
  const [csvFile, setCsvFile] = useState(null);
  const [zipFile, setZipFile] = useState(null);
  const [zipEntriesMap, setZipEntriesMap] = useState(new Map());
  const [zipLoading, setZipLoading] = useState(false);
  const [zipCount, setZipCount] = useState(0);

  // Options state
  const [inventoryMode, setInventoryMode] = useState('skip'); // 'skip' | 'update' | 'replace'
  const [isDryRun, setIsDryRun] = useState(false);
  const [batchSize, setBatchSize] = useState(50); // 25, 50, 100, 200

  // Execution state
  const [importing, setImporting] = useState(false);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentBatchNum, setCurrentBatchNum] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [speed, setSpeed] = useState(0); // items/sec
  const [etaSeconds, setEtaSeconds] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState('');

  // Results state
  const [summary, setSummary] = useState(null);
  const [reportRows, setReportRows] = useState([]);
  const [filterReport, setFilterReport] = useState('all'); // 'all' | 'failed' | 'missing_image' | 'duplicates'

  // History & Active Interrupted Session state
  const [historySessions, setHistorySessions] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [rollingBackId, setRollingBackId] = useState(null);
  const [interruptedSession, setInterruptedSession] = useState(null);

  // Cancellation / Pause ref
  const cancelRef = useRef(false);

  // Fetch History Sessions & Active Interrupted Session
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

  // Read ZIP Archive in Browser
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
    link.setAttribute('download', 'Image_Naming_Guide.txt');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Error Report CSV
  const handleDownloadErrorReport = (customRows) => {
    const rowsToExport = customRows || reportRows;
    if (rowsToExport.length === 0) {
      alert('No report data available to export.');
      return;
    }
    const csvStr = exportErrorReportCsv(rowsToExport);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Import_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Main Chunked Import Process
  const startBulkImport = () => {
    if (!csvFile) {
      alert('Please upload a CSV file to import.');
      return;
    }

    setImporting(true);
    setPaused(false);
    setProgress(0);
    setSummary(null);
    setReportRows([]);
    cancelRef.current = false;

    const startTime = Date.now();

    // Parse CSV file with PapaParse
    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rawRows = results.data || [];
        const totalRows = rawRows.length;

        if (totalRows === 0) {
          alert('Uploaded CSV file contains no product rows.');
          setImporting(false);
          return;
        }

        try {
          const csvText = await csvFile.text();
          const csvHash = await generateCsvHash(csvText);

          // 1. Initialize Session via API
          const initData = await safeFetchJson('/api/admin/bulk-import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'init',
              csv_file_name: csvFile.name,
              csv_hash: csvHash,
              total_rows: totalRows,
              inventory_mode: inventoryMode,
              is_dry_run: isDryRun,
              batch_size: batchSize
            })
          });

          const sessionId = initData.sessionId;
          const existingDbSkusSet = new Set(initData.existingDbSkus || []);
          const seenSkusInBatch = new Set();

          // 2. Validate Rows & Match Images in Browser Memory
          const validatedRows = [];
          const allReportDetails = [];

          for (let i = 0; i < rawRows.length; i++) {
            const rawRow = rawRows[i];
            const validation = validateCsvRow(rawRow, i, seenSkusInBatch, existingDbSkusSet);

            // Match Images against ZIP
            const imageMatch = findMatchedImagesForProduct(
              validation.data.sku,
              validation.data.name,
              zipEntriesMap
            );

            // Structure image references
            const imageReferences = [];
            if (imageMatch.primaryImage) {
              imageReferences.push({
                filename: imageMatch.primaryImage.name,
                is_primary: true,
                entry: imageMatch.primaryImage
              });
            }
            if (Array.isArray(imageMatch.galleryImages)) {
              imageMatch.galleryImages.forEach(gEntry => {
                imageReferences.push({
                  filename: gEntry.name,
                  is_primary: false,
                  entry: gEntry
                });
              });
            }

            validatedRows.push({
              rowIndex: validation.rowIndex,
              isValid: validation.isValid,
              isDuplicate: validation.isDuplicate,
              errors: validation.errors,
              data: validation.data,
              imageReferences,
              hasImage: imageMatch.hasImage
            });
          }

          // PHASE 1: PRE-UPLOAD MATCHED ZIP IMAGES DIRECTLY TO SUPABASE STORAGE
          const uniqueImageEntriesMap = new Map();
          validatedRows.forEach(row => {
            if (row.imageReferences && row.imageReferences.length > 0) {
              row.imageReferences.forEach(ref => {
                const key = ref.filename.toLowerCase();
                if (!uniqueImageEntriesMap.has(key)) {
                  uniqueImageEntriesMap.set(key, ref);
                }
              });
            }
          });

          const uniqueRefList = Array.from(uniqueImageEntriesMap.values());
          const totalImagesToUpload = uniqueRefList.length;
          const zipImageUrlsMap = new Map();

          if (!isDryRun && totalImagesToUpload > 0) {
            let uploadedImageCount = 0;
            const poolSize = 4; // Limited concurrency of 4 parallel image uploads

            for (let k = 0; k < totalImagesToUpload; k += poolSize) {
              if (cancelRef.current) break;

              const refChunk = uniqueRefList.slice(k, k + poolSize);
              await Promise.all(
                refChunk.map(async (imgRef) => {
                  try {
                    const blob = await imgRef.entry.async('blob');
                    const publicUrl = await uploadImageFile(imgRef.filename, blob);
                    if (publicUrl) {
                      zipImageUrlsMap.set(imgRef.filename.toLowerCase(), publicUrl);
                    }
                  } catch (uErr) {
                    console.error('[Image Upload Warning]', imgRef.filename, uErr);
                  } finally {
                    uploadedImageCount++;
                  }
                })
              );
            }
          }

          // Link pre-uploaded Storage URLs to product rows
          validatedRows.forEach(row => {
            const imageUrls = [];
            if (row.imageReferences && row.imageReferences.length > 0) {
              row.imageReferences.forEach(ref => {
                const publicUrl = zipImageUrlsMap.get(ref.filename.toLowerCase());
                if (publicUrl) {
                  imageUrls.push({
                    image_path: publicUrl,
                    is_primary: ref.is_primary ? 1 : 0
                  });
                }
              });
            }
            row.imageUrls = imageUrls;
          });

          // PHASE 2: BATCH CATALOG DATABASE IMPORT
          const effectiveBatchSize = parseInt(batchSize, 10) || 50;
          const numBatches = Math.ceil(validatedRows.length / effectiveBatchSize);
          setTotalBatches(numBatches);

          let processedCount = 0;
          let successCount = 0;
          let failedCount = 0;
          let duplicateCount = 0;
          let missingImagesCount = 0;

          for (let b = 0; b < numBatches; b++) {
            if (cancelRef.current) {
              break;
            }

            setCurrentBatchNum(b + 1);

            const batchSlice = validatedRows.slice(b * effectiveBatchSize, (b + 1) * effectiveBatchSize);

            // Clean rows payload: Strip internal JSZip binary objects (imageReferences) before stringifying
            const cleanRowsForBatch = batchSlice
              .filter(r => r.isValid || isDryRun)
              .map(r => ({
                rowIndex: r.rowIndex,
                isValid: r.isValid,
                isDuplicate: r.isDuplicate,
                errors: r.errors,
                data: r.data,
                imageUrls: r.imageUrls || []
              }));

            // Execute API batch with clean lightweight text payload (~12 KB for 100 rows)
            const batchData = await safeFetchJson('/api/admin/bulk-import', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'process_batch',
                sessionId,
                inventory_mode: inventoryMode,
                is_dry_run: isDryRun,
                rows: cleanRowsForBatch
              })
            });

            const batchResults = batchData.batchResults || [];

            // Combine results into final report
            batchSlice.forEach(item => {
              processedCount++;

              if (!item.isValid && !isDryRun) {
                failedCount++;
                allReportDetails.push({
                  rowIndex: item.rowIndex,
                  sku: item.data.sku,
                  name: item.data.name,
                  category_slug: item.data.category_slug,
                  isValid: false,
                  hasImage: item.hasImage,
                  status: 'Failed',
                  errors: item.errors
                });
              } else {
                const apiRes = batchResults.find(r => r.rowIndex === item.rowIndex);
                const status = apiRes ? apiRes.status : 'Success';
                if (status === 'Created' || status === 'Updated' || status === 'Replaced') {
                  successCount++;
                } else if (status.includes('Skipped')) {
                  duplicateCount++;
                } else if (status === 'Failed') {
                  failedCount++;
                }
                if (!item.hasImage) {
                  missingImagesCount++;
                }

                allReportDetails.push({
                  rowIndex: item.rowIndex,
                  sku: item.data.sku,
                  name: item.data.name,
                  category_slug: item.data.category_slug,
                  isValid: true,
                  hasImage: item.hasImage,
                  status,
                  errors: item.errors.concat(!item.hasImage ? ['Image Missing'] : [])
                });
              }
            });

            // Update Progress & Speed Metrics
            const currentProgress = Math.round((processedCount / totalRows) * 100);
            setProgress(currentProgress);

            const elapsedSec = (Date.now() - startTime) / 1000;
            const currentSpeed = Math.round((processedCount / (elapsedSec || 1)) * 10) / 10;
            setSpeed(currentSpeed);

            const remainingItems = totalRows - processedCount;
            const remainingEta = Math.round(remainingItems / (currentSpeed || 1));
            setEtaSeconds(remainingEta);

            if (window.performance && window.performance.memory) {
              const usedMb = Math.round(window.performance.memory.usedJSHeapSize / 1048576);
              setMemoryUsage(`${usedMb} MB`);
            }
          }

          // 4. Finish Session & Generate Summary Report
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
            successCount,
            failedCount,
            duplicateCount,
            missingImagesCount,
            durationSec: (totalDuration / 1000).toFixed(1)
          });

          setReportRows(allReportDetails);

        } catch (err) {
          alert('Bulk Import error: ' + err.message);
        } finally {
          setImporting(false);
        }
      },
      error: (err) => {
        alert('Failed to parse CSV file: ' + err.message);
        setImporting(false);
      }
    });
  };

  // Filter report rows
  const filteredReportRows = reportRows.filter(r => {
    if (filterReport === 'failed') return r.status === 'Failed' || !r.isValid;
    if (filterReport === 'missing_image') return !r.hasImage;
    if (filterReport === 'duplicates') return r.status && r.status.includes('Skipped');
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
              ANANT ARTS ENTERPRISE CATALOG ENGINE
            </span>
            <h1 style={{ fontSize: '2.2rem', fontFamily: "'Playfair Display', Georgia, serif", margin: '8px 0 4px', fontWeight: '600', color: '#FFFFFF' }}>
              Bulk Product Import System
            </h1>
            <p style={{ color: '#A0A0A0', fontSize: '0.95rem', margin: 0 }}>
              Batch upload catalog products, auto-match ZIP image archives, validate SKUs, and track execution.
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
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              📥 Download Sample CSV
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
              📖 Image Naming Guide
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
              cursor: 'pointer',
              transition: 'all 0.2s'
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
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            📜 Import History & Rollback
          </button>
        </div>
      </div>

      {/* TAB 1: IMPORT WORKSPACE */}
      {activeTab === 'import' && (
        <>
          {/* Interrupted Session Resume Banner */}
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
                  onClick={() => alert('Please re-select your CSV and ZIP file to resume batch processing from row #' + ((interruptedSession.processed_rows || 0) + 1))}
                  style={{
                    background: '#D97706',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  ▶️ Resume Interrupted Import
                </button>
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
                  ❌ Cancel & Clear Session
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px' }}>
          
          {/* Left Column: Dropzones & Configuration */}
          <div>
            
            {/* File Upload Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              
              {/* CSV Upload Dropzone */}
              <div style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                padding: '24px',
                border: csvFile ? '2px solid #2E7D32' : '2px dashed #CBD5E1',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                textAlign: 'center',
                position: 'relative'
              }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📄</div>
                <h3 style={{ fontSize: '1.05rem', margin: '0 0 6px', fontWeight: '600' }}>Product CSV File</h3>
                <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0 0 16px' }}>
                  Upload formatted .CSV file containing catalog columns.
                </p>

                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files[0])}
                  style={{ display: 'none' }}
                  id="csv-file-input"
                />

                <label
                  htmlFor="csv-file-input"
                  style={{
                    background: csvFile ? '#E8F5E9' : '#0D0D0D',
                    color: csvFile ? '#2E7D32' : '#FFFFFF',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'inline-block'
                  }}
                >
                  {csvFile ? `✓ ${csvFile.name}` : 'Choose CSV File'}
                </label>
              </div>

              {/* ZIP Upload Dropzone */}
              <div style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                padding: '24px',
                border: zipFile ? '2px solid #2E7D32' : '2px dashed #CBD5E1',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                textAlign: 'center',
                position: 'relative'
              }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🖼️</div>
                <h3 style={{ fontSize: '1.05rem', margin: '0 0 6px', fontWeight: '600' }}>Product Images Archive (.ZIP)</h3>
                <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0 0 16px' }}>
                  Upload .ZIP containing SKU or Name matched images.
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
                    background: zipFile ? '#E8F5E9' : '#0D0D0D',
                    color: zipFile ? '#2E7D32' : '#FFFFFF',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'inline-block'
                  }}
                >
                  {zipLoading ? 'Extracting ZIP...' : zipFile ? `✓ ${zipCount} Images Extracted` : 'Choose ZIP Archive'}
                </label>
              </div>
            </div>

            {/* Live Progress Bar (when importing) */}
            {importing && (
              <div style={{
                background: '#0D0D0D',
                borderRadius: '12px',
                padding: '24px',
                color: '#FFFFFF',
                marginBottom: '24px',
                border: '1px solid rgba(212, 175, 55, 0.3)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#D4AF37' }}>
                    Import Progress: Batch {currentBatchNum} of {totalBatches}
                  </span>
                  <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>{progress}%</span>
                </div>

                <div style={{ height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px', overflow: 'hidden', marginBottom: '16px' }}>
                  <div style={{
                    height: '100%',
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #D4AF37 0%, #F3E5AB 100%)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', fontSize: '0.8rem', color: '#A0A0A0', textAlign: 'center' }}>
                  <div>Speed: <strong style={{ color: '#FFF' }}>{speed} items/s</strong></div>
                  <div>ETA: <strong style={{ color: '#FFF' }}>{etaSeconds}s</strong></div>
                  <div>Batch Size: <strong style={{ color: '#FFF' }}>{batchSize}</strong></div>
                  <div>Memory: <strong style={{ color: '#FFF' }}>{memoryUsage || 'Optimal'}</strong></div>
                </div>
              </div>
            )}

            {/* Post Import Summary Cards */}
            {summary && (
              <div style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                marginBottom: '24px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>Import Execution Summary</h3>
                  <button
                    onClick={() => handleDownloadErrorReport()}
                    style={{
                      background: '#0D0D0D',
                      color: '#D4AF37',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontWeight: '600',
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    📥 Download Error Report CSV
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', textAlign: 'center' }}>
                  <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: '600' }}>Total Rows</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#0F172A', marginTop: '4px' }}>{summary.totalRows}</div>
                  </div>
                  <div style={{ background: '#F0FDF4', padding: '16px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#166534', textTransform: 'uppercase', fontWeight: '600' }}>Success</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#15803D', marginTop: '4px' }}>{summary.successCount}</div>
                  </div>
                  <div style={{ background: '#FEF2F2', padding: '16px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#991B1B', textTransform: 'uppercase', fontWeight: '600' }}>Failed Rows</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#DC2626', marginTop: '4px' }}>{summary.failedCount}</div>
                  </div>
                  <div style={{ background: '#FFFBEB', padding: '16px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#92400E', textTransform: 'uppercase', fontWeight: '600' }}>Missing Images</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#D97706', marginTop: '4px' }}>{summary.missingImagesCount}</div>
                  </div>
                  <div style={{ background: '#F1F5F9', padding: '16px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#475569', textTransform: 'uppercase', fontWeight: '600' }}>Duration</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#334155', marginTop: '4px' }}>{summary.durationSec}s</div>
                  </div>
                </div>
              </div>
            )}

            {/* Detailed Row Report Table */}
            {reportRows.length > 0 && (
              <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>Row Validation & Import Log</h3>

                  {/* Filter Pills */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['all', 'failed', 'missing_image', 'duplicates'].map(f => (
                      <button
                        key={f}
                        onClick={() => setFilterReport(f)}
                        style={{
                          background: filterReport === f ? '#0D0D0D' : '#F1F5F9',
                          color: filterReport === f ? '#D4AF37' : '#475569',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          textTransform: 'capitalize'
                        }}
                      >
                        {f.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', textAlign: 'left' }}>
                        <th style={{ padding: '10px' }}>Row</th>
                        <th style={{ padding: '10px' }}>SKU</th>
                        <th style={{ padding: '10px' }}>Product Name</th>
                        <th style={{ padding: '10px' }}>Import Status</th>
                        <th style={{ padding: '10px' }}>Image Status</th>
                        <th style={{ padding: '10px' }}>Details / Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReportRows.slice(0, 200).map((r, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '10px', fontWeight: '600' }}>#{r.rowIndex}</td>
                          <td style={{ padding: '10px', fontFamily: 'monospace' }}>{r.sku || '—'}</td>
                          <td style={{ padding: '10px', fontWeight: '500' }}>{r.name}</td>
                          <td style={{ padding: '10px' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              background: r.status === 'Created' || r.status === 'Updated' || r.status === 'Replaced' ? '#DCFCE7' : r.status === 'Failed' ? '#FEE2E2' : '#FEF3C7',
                              color: r.status === 'Created' || r.status === 'Updated' || r.status === 'Replaced' ? '#166534' : r.status === 'Failed' ? '#991B1B' : '#92400E'
                            }}>
                              {r.status}
                            </span>
                          </td>
                          <td style={{ padding: '10px' }}>
                            {r.hasImage ? (
                              <span style={{ color: '#16A34A', fontWeight: '600' }}>✓ Matched</span>
                            ) : (
                              <span style={{ color: '#D97706', fontWeight: '600' }}>⚠️ Missing</span>
                            )}
                          </td>
                          <td style={{ padding: '10px', color: '#64748B' }}>
                            {Array.isArray(r.errors) && r.errors.length > 0 ? r.errors.join(' | ') : r.message || 'OK'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Execution Controls Panel */}
          <div>
            <div style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
              position: 'sticky',
              top: '24px'
            }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: '700', color: '#0D0D0D' }}>
                Import Settings & Rules
              </h3>

              {/* Existing SKU Collision Rule */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: '600', fontSize: '0.85rem', marginBottom: '8px', color: '#334155' }}>
                  Existing SKU Inventory Rule:
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="inventoryMode"
                      value="skip"
                      checked={inventoryMode === 'skip'}
                      onChange={(e) => setInventoryMode(e.target.value)}
                    />
                    <strong>Skip Existing SKUs</strong> (Recommended)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="inventoryMode"
                      value="update"
                      checked={inventoryMode === 'update'}
                      onChange={(e) => setInventoryMode(e.target.value)}
                    />
                    <strong>Update Existing Products</strong>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="inventoryMode"
                      value="replace"
                      checked={inventoryMode === 'replace'}
                      onChange={(e) => setInventoryMode(e.target.value)}
                    />
                    <strong>Replace Existing Products</strong>
                  </label>
                </div>
              </div>

              {/* Dry Run Toggle */}
              <div style={{ marginBottom: '20px', padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isDryRun}
                    onChange={(e) => setIsDryRun(e.target.checked)}
                  />
                  <span>Dry Run Mode (&quot;Validate Only&quot;)</span>
                </label>
                <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '4px 0 0 24px' }}>
                  Validates CSV rows and image matching without saving to database.
                </p>
              </div>

              {/* Configurable Batch Size */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontWeight: '600', fontSize: '0.85rem', marginBottom: '8px', color: '#334155' }}>
                  Batch Chunk Size:
                </label>
                <select
                  value={batchSize}
                  onChange={(e) => setBatchSize(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.85rem',
                    fontWeight: '600'
                  }}
                >
                  <option value={25}>25 Products per Batch</option>
                  <option value={50}>50 Products per Batch (Recommended)</option>
                  <option value={100}>100 Products per Batch (Fast)</option>
                  <option value={200}>200 Products per Batch (High Volume)</option>
                </select>
              </div>

              {/* Primary Launch Button */}
              <button
                onClick={startBulkImport}
                disabled={importing || !csvFile}
                style={{
                  width: '100%',
                  background: importing ? '#94A3B8' : isDryRun ? '#475569' : 'linear-gradient(135deg, #0D0D0D 0%, #262626 100%)',
                  color: '#D4AF37',
                  border: '1px solid #D4AF37',
                  padding: '14px',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '0.95rem',
                  cursor: importing || !csvFile ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  transition: 'all 0.2s'
                }}
              >
                {importing ? 'Processing Import...' : isDryRun ? '🔍 Start Dry Run Validation' : '🚀 Start Bulk Import'}
              </button>
            </div>
          </div>
        </div>
      </>
    )}

      {/* TAB 2: IMPORT HISTORY & ROLLBACK */}
      {activeTab === 'history' && (
        <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '700' }}>Import Execution History</h2>
              <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: '0.85rem' }}>
                Review past catalog import sessions and trigger 1-click rollbacks if required.
              </p>
            </div>
            <button
              onClick={fetchHistory}
              style={{
                background: '#F1F5F9',
                color: '#334155',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              🔄 Refresh History
            </button>
          </div>

          {historyLoading ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748B' }}>Loading import history...</div>
          ) : historySessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748B' }}>No previous import sessions found.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', textAlign: 'left' }}>
                  <th style={{ padding: '12px' }}>ID</th>
                  <th style={{ padding: '12px' }}>Date</th>
                  <th style={{ padding: '12px' }}>Admin</th>
                  <th style={{ padding: '12px' }}>CSV File</th>
                  <th style={{ padding: '12px' }}>Status</th>
                  <th style={{ padding: '12px' }}>Total</th>
                  <th style={{ padding: '12px' }}>Success</th>
                  <th style={{ padding: '12px' }}>Failed</th>
                  <th style={{ padding: '12px' }}>Duration</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {historySessions.map(session => (
                  <tr key={session.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px', fontWeight: '700' }}>#{session.id}</td>
                    <td style={{ padding: '12px', color: '#64748B' }}>
                      {new Date(session.created_at).toLocaleDateString()} {new Date(session.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '12px' }}>{session.admin_email}</td>
                    <td style={{ padding: '12px', fontWeight: '500' }}>{session.csv_file_path}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        background: session.status === 'completed' ? '#DCFCE7' : session.status === 'rolled_back' ? '#F3E8FF' : '#FEF3C7',
                        color: session.status === 'completed' ? '#166534' : session.status === 'rolled_back' ? '#6B21A8' : '#92400E'
                      }}>
                        {session.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontWeight: '600' }}>{session.total_rows}</td>
                    <td style={{ padding: '12px', color: '#16A34A', fontWeight: '600' }}>{session.success_count}</td>
                    <td style={{ padding: '12px', color: '#DC2626', fontWeight: '600' }}>{session.failed_count}</td>
                    <td style={{ padding: '12px', color: '#64748B' }}>
                      {session.duration_ms ? `${(session.duration_ms / 1000).toFixed(1)}s` : '—'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      {session.status === 'completed' && (
                        <button
                          onClick={() => handleRollback(session.id)}
                          disabled={rollingBackId === session.id}
                          style={{
                            background: '#FEF2F2',
                            color: '#DC2626',
                            border: '1px solid #FCA5A5',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontWeight: '600',
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          {rollingBackId === session.id ? 'Reverting...' : '⏪ Rollback Import'}
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
