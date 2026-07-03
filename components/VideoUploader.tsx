import { useState, useRef, useCallback } from 'react';
import { Upload, FileVideo, X, CheckCircle2, AlertCircle, Link2 } from 'lucide-react';
import { SiYoutube } from 'react-icons/si';

interface Props {
  onUploadComplete: (url: string, fileName: string, source: 'file' | 'youtube', youtubeVideoId?: string) => void;
  disabled?: boolean;
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[&?/]|$)/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export default function VideoUploader({ onUploadComplete, disabled }: Props) {
  const [tab, setTab] = useState<'file' | 'youtube'>('file');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; url: string; source: 'file' | 'youtube'; videoId?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubePreview, setYoutubePreview] = useState<{ id: string; title: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
  const MAX_SIZE = 500 * 1024 * 1024; // 500 MB

  const uploadVideo = useCallback(async (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(`Unsupported format: ${file.type}. Use MP4, WebM, MOV, or AVI.`);
      return;
    }
    if (file.size > MAX_SIZE) {
      setError(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max 500 MB.`);
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Create a local blob URL for the video (no server upload needed for demo)
      const blobUrl = URL.createObjectURL(file);

      setUploadedFile({ name: file.name, url: blobUrl, source: 'file' });
      onUploadComplete(blobUrl, file.name, 'file');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [onUploadComplete]);

  const handleYoutubeSubmit = useCallback(() => {
    setError(null);
    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) {
      setError('Invalid YouTube URL. Use youtube.com/watch?v=... or youtu.be/...');
      return;
    }
    setYoutubePreview({ id: videoId, title: `YouTube Video (${videoId})` });
    setUploadedFile({ name: `youtube-${videoId}`, url: youtubeUrl, source: 'youtube', videoId });
    onUploadComplete(youtubeUrl, `YouTube Video (${videoId})`, 'youtube', videoId);
  }, [youtubeUrl, onUploadComplete]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadVideo(file);
  }, [uploadVideo]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadVideo(file);
  }, [uploadVideo]);

  const handleClear = useCallback(() => {
    setUploadedFile(null);
    setError(null);
    setYoutubeUrl('');
    setYoutubePreview(null);
  }, []);

  const handleClearYoutubeInput = useCallback(() => {
    setYoutubeUrl('');
    setYoutubePreview(null);
    setError(null);
  }, []);

  if (uploadedFile) {
    return (
      <div className="bg-surface border border-success/30 p-4">
        <div className="flex items-start gap-3">
          {uploadedFile.source === 'youtube' ? (
            <SiYoutube className="w-6 h-6 text-critical shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-6 h-6 text-success shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-success uppercase tracking-wider">
              {uploadedFile.source === 'youtube' ? 'YouTube Video Linked' : 'Uploaded'}
            </p>
            <p className="text-sm text-foreground font-mono truncate mt-1">{uploadedFile.name}</p>
            {uploadedFile.source === 'youtube' && uploadedFile.videoId && (
              <div className="mt-2">
                <img
                  src={`https://img.youtube.com/vi/${uploadedFile.videoId}/hqdefault.jpg`}
                  alt="YouTube thumbnail"
                  className="w-full max-w-[240px] h-auto border border-border rounded"
                />
              </div>
            )}
            {uploadedFile.source === 'file' && (
              <p className="text-[10px] text-foreground-muted font-mono mt-0.5 truncate">{uploadedFile.url}</p>
            )}
          </div>
          <button
            onClick={handleClear}
            className="p-1 text-foreground-muted hover:text-critical transition-colors cursor-pointer"
            title="Remove video"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => { setTab('file'); handleClearYoutubeInput(); }}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider
            transition-all duration-200 cursor-pointer
            ${tab === 'file'
              ? 'text-accent border-b-2 border-accent bg-accent/5'
              : 'text-foreground-muted hover:text-foreground hover:bg-surface-hover'
            }`}
          >
          <Upload className="w-3.5 h-3.5" />
          Upload File
        </button>
        <button
          onClick={() => setTab('youtube')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider
            transition-all duration-200 cursor-pointer
            ${tab === 'youtube'
              ? 'text-accent border-b-2 border-accent bg-accent/5'
              : 'text-foreground-muted hover:text-foreground hover:bg-surface-hover'
            }`}
        >
          <SiYoutube className="w-3.5 h-3.5" />
          YouTube URL
        </button>
      </div>
      {/* File upload tab */}
      {tab === 'file' && (
        <div
          ref={dropZoneRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed p-8 text-center cursor-pointer
            transition-all duration-200
            ${isDragging
              ? 'border-accent bg-accent/5'
              : 'border-border hover:border-accent/50 hover:bg-surface-hover'
            }
            ${disabled ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled}
          />

          {isUploading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-accent border-t-transparent animate-spin" />
              <p className="text-sm text-foreground-muted font-mono">Uploading to surgical AI...</p>
              <div className="w-48 h-1 bg-border overflow-hidden">
                <div className="h-full bg-accent animate-pulse w-2/3" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-accent/5 border border-accent/20 flex items-center justify-center">
                <Upload className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-foreground font-semibold">
                  Drop surgical video here
                </p>
                <p className="text-xs text-foreground-muted mt-1">
                  or click to browse — MP4, WebM, MOV, AVI (max 500 MB)
                </p>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-foreground-muted font-mono">
                <FileVideo className="w-3 h-3" />
                <span>Endoscopic / Laparoscopic recordings supported</span>
              </div>
            </div>
          )}
        </div>
      )}
      {tab === 'youtube' && (
        <div className="border border-border bg-surface p-4 space-y-3">
          <div className="flex items-start gap-2">
            <div className="w-10 h-10 bg-critical/10 border border-critical/30 flex items-center justify-center shrink-0">
              <SiYoutube className="w-5 h-5 text-critical" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider">YouTube Video URL</p>
              <p className="text-[10px] text-foreground-muted mt-0.5">
                Paste a link to any public surgical video on YouTube
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                onKeyDown={(e) => e.key === 'Enter' && handleYoutubeSubmit()}
                className="w-full pl-9 pr-3 py-2 bg-background border border-border text-xs font-mono
                  text-foreground placeholder:text-foreground-muted/40
                  focus:outline-none focus:border-accent transition-colors"
                disabled={disabled}
              />
            </div>
            <button
              onClick={handleYoutubeSubmit}
              disabled={!youtubeUrl.trim() || disabled}
              className="flex items-center gap-1.5 px-4 py-2 bg-critical/10 border border-critical/40
                text-critical text-xs font-semibold uppercase tracking-wider
                hover:bg-critical/20 transition-all duration-200 cursor-pointer
                disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Link2 className="w-3.5 h-3.5" />
              Link
            </button>
          </div>

          {/* YouTube preview */}
          {youtubePreview && (
            <div className="border border-critical/20 bg-critical/[0.03] p-2">
              <img
                src={`https://img.youtube.com/vi/${youtubePreview.id}/hqdefault.jpg`}
                alt="YouTube preview"
                className="w-full max-w-[280px] h-auto border border-border"
              />
              <p className="text-[10px] font-mono text-foreground-muted mt-1">
                ID: {youtubePreview.id}
              </p>
            </div>
          )}
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2 bg-critical/10 border border-critical/30 p-3">
          <AlertCircle className="w-4 h-4 text-critical shrink-0 mt-0.5" />
          <p className="text-xs text-critical font-mono">{error}</p>
        </div>
      )}
    </div>
  );
}