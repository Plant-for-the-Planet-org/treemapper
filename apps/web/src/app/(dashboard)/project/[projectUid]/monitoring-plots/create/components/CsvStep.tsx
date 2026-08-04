'use client';

import { useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Download, FileText, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ColumnMapping, FieldSpec, autoMapColumns } from '../utils/csvFields';
import { readCsvSample } from '../utils/parseCsv';
import ColumnMappingDialog from './ColumnMappingDialog';

/**
 * Shared upload step for the tree and observation sheets.
 *
 * The flow is: pick a file, auto-map its headers, and go straight to parsing when
 * every required field was found. The mapping dialog only opens when something is
 * missing, so a downloaded template loads in one click. Both CSV steps are
 * optional; a plot with no trees and no observations is still a valid plot.
 */
const CsvStep = ({
  title,
  description,
  fields,
  onDownloadTemplate,
  onParse,
  loadedCount,
  loadedFileName,
  errorCount,
  onClear,
  children,
}: {
  title: string;
  description: string;
  fields: FieldSpec[];
  onDownloadTemplate: () => void;
  onParse: (file: File, mapping: ColumnMapping) => Promise<void>;
  loadedCount: number;
  loadedFileName: string | null;
  errorCount: number;
  onClear: () => void;
  /** Summary rendered under the dropzone once rows are loaded. */
  children?: React.ReactNode;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState<{
    file: File;
    headers: string[];
    sampleRows: Record<string, string>[];
    mapping: ColumnMapping;
  } | null>(null);

  const handleFile = async (file: File) => {
    setError('');
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      setError('Please choose a CSV file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('That file is over 10 MB. Split it into smaller sheets.');
      return;
    }

    setBusy(true);
    try {
      const { headers, sampleRows, rowCount } = await readCsvSample(file);
      if (headers.length === 0 || rowCount === 0) {
        setError('That file has no rows.');
        return;
      }
      const { mapping, missingRequired } = autoMapColumns(headers, fields);
      if (missingRequired.length > 0) {
        setPending({ file, headers, sampleRows, mapping });
        return;
      }
      await onParse(file, mapping);
    } catch (err: any) {
      setError(err?.message || 'Could not read that file.');
    } finally {
      setBusy(false);
    }
  };

  const confirmMapping = async (mapping: ColumnMapping) => {
    if (!pending) return;
    const { file } = pending;
    setPending(null);
    setBusy(true);
    try {
      await onParse(file, mapping);
    } catch (err: any) {
      setError(err?.message || 'Could not read that file.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-[860px] mx-auto space-y-4">
      {pending && (
        <ColumnMappingDialog
          open
          fields={fields}
          headers={pending.headers}
          initialMapping={pending.mapping}
          sampleRows={pending.sampleRows}
          onCancel={() => setPending(null)}
          onConfirm={confirmMapping}
        />
      )}

      <div className="border rounded-[3px] bg-card p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="text-[14px] font-semibold">{title}</h3>
            <p className="text-[12.5px] text-muted-foreground mt-0.5">{description}</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onDownloadTemplate}>
            <Download className="w-3.5 h-3.5 mr-1.5" /> Template
          </Button>
        </div>

        <div
          className={cn(
            'relative border-2 border-dashed rounded-lg p-7 text-center transition-colors',
            dragging || loadedCount > 0
              ? 'border-[#007A49] bg-[#007A49]/5'
              : 'border-border hover:border-[#007A49]',
          )}
          onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = '';
            }}
          />
          {busy ? (
            <p className="text-[13px] text-muted-foreground">Reading the file…</p>
          ) : loadedCount > 0 ? (
            <div className="space-y-2">
              <CheckCircle2 className="mx-auto h-7 w-7 text-[#007A49]" />
              <div className="flex items-center justify-center gap-2">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[13px] font-medium">{loadedFileName}</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Badge variant="secondary" className="text-[10.5px] font-normal">
                  {loadedCount} row{loadedCount === 1 ? '' : 's'} loaded
                </Badge>
                {errorCount > 0 && (
                  <Badge variant="outline" className="text-[10.5px] font-normal border-destructive text-destructive">
                    {errorCount} need attention
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">Click to replace this file</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="mx-auto h-7 w-7 text-muted-foreground" />
              <p className="text-[13px]">
                <span className="font-medium text-[#007A49]">Choose a CSV</span> or drop it here
              </p>
              <p className="text-[11.5px] text-muted-foreground">
                Any column names work. We match them for you.
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-3 flex items-start gap-2 text-[12.5px] text-destructive">
            <AlertCircle className="w-3.5 h-3.5 mt-px flex-none" />
            <span>{error}</span>
          </div>
        )}

        {loadedCount > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-3 h-7 px-2 text-[11px] text-muted-foreground"
            onClick={onClear}
          >
            <X className="w-3 h-3 mr-1" /> Remove these rows
          </Button>
        )}
      </div>

      {children}

      <p className="text-[11.5px] text-muted-foreground text-center">
        This step is optional. You can add trees and observations later from the device.
      </p>
    </div>
  );
};

export default CsvStep;
