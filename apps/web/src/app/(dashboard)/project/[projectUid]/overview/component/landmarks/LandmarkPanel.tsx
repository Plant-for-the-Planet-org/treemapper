// Right-pane detail card for a selected landmark. Edit, move and delete are
// shown only to owners/admins (the same roles the server's write routes allow).
import React, { useState } from 'react';
import { X, MapPin, User, Copy, Check, Pencil, Move, Trash2, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import type { Landmark } from './api';
import { LANDMARK_TYPE_CONFIG, landmarkTypeLabel } from './config';

const CoordsCopy: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
    const [copied, setCopied] = useState(false);
    const value = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch { /* clipboard unavailable */ }
    };
    return (
        <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-foreground">{value}</span>
            <button
                type="button"
                onClick={copy}
                title={copied ? 'Copied' : 'Copy coordinates'}
                className="inline-flex items-center justify-center w-6 h-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
                {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
        </div>
    );
};

const LandmarkPanel: React.FC<{
    landmark: Landmark;
    canManage: boolean;
    onClose: () => void;
    onEdit: () => void;
    onMove: () => void;
    onDelete: () => Promise<void>;
}> = ({ landmark, canManage, onClose, onEdit, onMove, onDelete }) => {
    const cfg = LANDMARK_TYPE_CONFIG[landmark.type] ?? LANDMARK_TYPE_CONFIG.other;
    const Icon = cfg.icon;
    const [lng, lat] = landmark.location.coordinates;
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const handleDelete = async () => {
        setDeleting(true);
        setDeleteError(null);
        try {
            await onDelete();
            setConfirmOpen(false);
        } catch (err) {
            setDeleteError(err instanceof Error ? err.message : 'Failed to delete the landmark');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="w-full h-full bg-card text-card-foreground flex flex-col overflow-hidden">
            {/* Header */}
            <div className="shrink-0 px-4 py-3 border-b border-border">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                        <div
                            className="flex items-center justify-center w-9 h-9 rounded-full shrink-0 mt-0.5"
                            style={{ backgroundColor: cfg.color }}
                        >
                            <Icon className="w-4.5 h-4.5 text-white" strokeWidth={2.25} />
                        </div>
                        <div className="min-w-0">
                            <div className="font-semibold text-foreground truncate">{landmark.name}</div>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                <Badge variant="secondary">{landmarkTypeLabel(landmark.type, landmark.otherLabel)}</Badge>
                                <Badge variant="outline" className="gap-1 text-muted-foreground">
                                    {landmark.isPrivate
                                        ? <><EyeOff className="w-3 h-3" /> Private</>
                                        : <><Eye className="w-3 h-3" /> Public</>}
                                </Badge>
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={onClose}
                        title="Close"
                        className="rounded-full text-muted-foreground shrink-0"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
                {landmark.siteName && (
                    <div className="px-4 pt-3">
                        <div className="text-xs text-muted-foreground mb-0.5">Site</div>
                        <div className="flex items-center gap-1.5 text-sm text-foreground">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                            {landmark.siteName}
                        </div>
                    </div>
                )}

                <div className="px-4 pt-3">
                    <div className="text-xs text-muted-foreground mb-1">Coordinates</div>
                    <CoordsCopy lat={lat} lng={lng} />
                </div>

                {landmark.description && (
                    <div className="px-4 pt-3">
                        <div className="text-xs text-muted-foreground mb-0.5">Description</div>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{landmark.description}</p>
                    </div>
                )}

                {landmark.createdByName && (
                    <div className="flex items-center gap-2 px-4 pt-4 pb-3">
                        <div className="min-w-0">
                            <div className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                                <User className="w-3 h-3" /> Added by
                            </div>
                            <div className="text-sm text-foreground truncate">{landmark.createdByName}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer actions — owners/admins only */}
            {canManage && (
                <div className="shrink-0 border-t border-border p-3 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={onMove} title="Pick a new spot on the map">
                        <Move className="w-3.5 h-3.5" />
                        Move
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConfirmOpen(true)}
                        className="text-destructive hover:text-destructive"
                        title="Delete landmark"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                </div>
            )}

            {/* Delete confirm */}
            <Dialog open={confirmOpen} onOpenChange={open => { if (!deleting) setConfirmOpen(open); }}>
                <DialogContent className="sm:max-w-sm">
                    <DialogTitle>Delete this landmark?</DialogTitle>
                    <DialogDescription>
                        &quot;{landmark.name}&quot; will be removed from the map for everyone.
                    </DialogDescription>
                    {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
                    <DialogFooter>
                        <Button variant="outline" size="sm" disabled={deleting} onClick={() => setConfirmOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" size="sm" disabled={deleting} onClick={handleDelete}>
                            {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default LandmarkPanel;
