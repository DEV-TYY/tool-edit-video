import React from 'react';
import {
  Download,
  X,
  CheckCircle,
  AlertCircle,
  Film,
  Loader2,
} from 'lucide-react';
import type { ExportProgress } from '../types';

interface ExportModalProps {
  progress: ExportProgress;
  onCancel: () => void;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  progress,
  onCancel,
  onClose,
}) => {
  const { isExporting, progress: pct, currentTime, totalTime, exportedBlobUrl, error } =
    progress;

  const handleDownload = () => {
    if (!exportedBlobUrl) return;
    const a = document.createElement('a');
    a.href = exportedBlobUrl;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    a.download = `chromastudio-video-${timestamp}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog">
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-emerald-400" />
            <h2 className="modal-title">
              {isExporting
                ? 'Exporting Video...'
                : exportedBlobUrl
                ? 'Export Complete!'
                : error
                ? 'Export Failed'
                : 'Export Video'}
            </h2>
          </div>
          {!isExporting && (
            <button className="modal-close-btn" onClick={onClose}>
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="modal-body">
          {/* Export in progress state */}
          {isExporting && (
            <div className="export-status-panel">
              <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mb-4" />
              <p className="export-status-title">
                Compositing frames & encoding audio...
              </p>
              <p className="export-status-subtitle">
                {currentTime.toFixed(1)}s / {totalTime.toFixed(1)}s encoded
              </p>

              {/* Progress bar */}
              <div className="export-progress-track">
                <div
                  className="export-progress-fill"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="export-pct-text">{pct}%</span>

              <button className="btn-cancel-export mt-5" onClick={onCancel}>
                Cancel Export
              </button>
            </div>
          )}

          {/* Export successful preview & download */}
          {!isExporting && exportedBlobUrl && (
            <div className="export-result-panel">
              <div className="export-success-badge">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span>Your video was successfully generated with audio!</span>
              </div>

              <div className="exported-video-wrapper">
                <video
                  src={exportedBlobUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="exported-video-player"
                />
              </div>

              <div className="modal-actions-footer">
                <button className="btn-secondary" onClick={onClose}>
                  Back to Editor
                </button>
                <button className="btn-download-primary" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  <span>Download Video (.webm)</span>
                </button>
              </div>
            </div>
          )}

          {/* Error state */}
          {!isExporting && error && (
            <div className="export-error-panel">
              <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
              <p className="text-rose-300 font-medium mb-1">Export encountered an error</p>
              <p className="text-xs text-slate-400 mb-4">{error}</p>
              <button className="btn-secondary" onClick={onClose}>
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
