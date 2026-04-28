'use client';

import { useState } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle, Clock, Download } from 'lucide-react';
import { Button, Badge, Card, CardContent, CardHeader, CardTitle, Modal, Select, SelectItem } from './workspace-ui';

export function DataManagementSection() {
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState('all');
  const [exportFormat, setExportFormat] = useState('json');

  const handleExport = () => {
    console.log('Exporting data:', { type: exportType, format: exportFormat });
    setShowExportModal(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Export Data</h4>
            <p className="text-sm text-gray-600">Download workspace data in various formats</p>
            <Button onClick={() => setShowExportModal(true)} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Workspace Data
            </Button>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Migration Status</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Projects</span>
                <Badge variant="success">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Complete
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Members</span>
                <Badge variant="success">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Complete
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Images</span>
                <Badge variant="warning">
                  <Clock className="h-3 w-3 mr-1" />
                  In Progress
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h4 className="font-medium text-gray-900 mb-4">Flagged Content Review</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-sm">2 Projects flagged for review</p>
                  <p className="text-xs text-gray-600">Data quality issues detected</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Review
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-sm">1 User account flagged</p>
                  <p className="text-xs text-gray-600">Suspicious activity detected</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Review
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>

      <Modal isOpen={showExportModal} onClose={() => setShowExportModal(false)} title="Export Workspace Data">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data Type</label>
            <Select value={exportType} onValueChange={setExportType}>
              <SelectItem value="all">All Data</SelectItem>
              <SelectItem value="projects">Projects Only</SelectItem>
              <SelectItem value="members">Members Only</SelectItem>
              <SelectItem value="audit_logs">Audit Logs</SelectItem>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="xlsx">Excel</SelectItem>
            </Select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowExportModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport}>Export Data</Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}
