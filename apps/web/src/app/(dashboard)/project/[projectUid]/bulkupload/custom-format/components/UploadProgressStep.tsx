'use client';

// TODO: shadcn migration — follow apps/web/UI_MIGRATION_GUIDE.md (sibling /bulkupload main flow already migrated)
import React from 'react';
import { Loader2 } from 'lucide-react';

interface Props {
    current: number;
    total: number;
}

const UploadProgressStep = ({ total }: Props) => (
    <div className="flex flex-col items-center justify-center py-24 space-y-5">
        <Loader2 className="h-10 w-10 text-[#007A49] animate-spin" />
        <div className="text-center">
            <p className="text-lg font-semibold text-gray-900">Uploading {total} record{total !== 1 ? 's' : ''}...</p>
            <p className="text-sm text-gray-400 mt-1">This may take a moment. Please do not close this page.</p>
        </div>
    </div>
);

export default UploadProgressStep;
