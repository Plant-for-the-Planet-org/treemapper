// Create / edit form for a landmark. The location itself is never typed here:
// create gets it from the map click that opened the dialog, and an existing
// landmark is moved with the panel's Move action.
import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { Landmark } from './api';
import { LANDMARK_TYPES, LANDMARK_TYPE_CONFIG, type LandmarkType } from './config';

export interface LandmarkFormValues {
    name: string;
    type: LandmarkType;
    otherLabel?: string;
    description?: string;
    isPrivate: boolean;
}

export type LandmarkFormState =
    | { mode: 'create'; coords: { lat: number; lng: number } }
    | { mode: 'edit'; landmark: Landmark };

const LandmarkFormDialog: React.FC<{
    state: LandmarkFormState | null;
    onClose: () => void;
    onSubmit: (values: LandmarkFormValues) => Promise<void>;
}> = ({ state, onClose, onSubmit }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState<LandmarkType>('nursery');
    const [otherLabel, setOtherLabel] = useState('');
    const [description, setDescription] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Seed the fields each time the dialog opens.
    useEffect(() => {
        if (!state) return;
        if (state.mode === 'edit') {
            setName(state.landmark.name);
            setType(state.landmark.type);
            setOtherLabel(state.landmark.otherLabel ?? '');
            setDescription(state.landmark.description ?? '');
            setIsPublic(!state.landmark.isPrivate);
        } else {
            setName('');
            setType('nursery');
            setOtherLabel('');
            setDescription('');
            setIsPublic(false);
        }
        setError(null);
        setSubmitting(false);
    }, [state]);

    if (!state) return null;

    const coords = state.mode === 'create'
        ? state.coords
        : { lat: state.landmark.location.coordinates[1], lng: state.landmark.location.coordinates[0] };

    const canSave = name.trim().length > 0 && (type !== 'other' || otherLabel.trim().length > 0);

    const handleSubmit = async () => {
        if (!canSave || submitting) return;
        setSubmitting(true);
        setError(null);
        try {
            await onSubmit({
                name: name.trim(),
                type,
                otherLabel: type === 'other' ? otherLabel.trim() : undefined,
                // Always sent: an empty string clears the description on edit.
                description: description.trim(),
                isPrivate: !isPublic,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save the landmark');
            setSubmitting(false);
        }
    };

    return (
        <Dialog open onOpenChange={open => { if (!open && !submitting) onClose(); }}>
            <DialogContent className="sm:max-w-md">
                <DialogTitle>{state.mode === 'create' ? 'Add landmark' : 'Edit landmark'}</DialogTitle>
                <DialogDescription>
                    {state.mode === 'create'
                        ? 'Mark a point of interest on the project map, like a nursery or a meeting point.'
                        : 'Update the details of this landmark.'}
                </DialogDescription>

                <div className="grid gap-4 py-1">
                    <div className="grid gap-1.5">
                        <Label htmlFor="landmark-name">Name</Label>
                        <Input
                            id="landmark-name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Main nursery"
                            maxLength={255}
                            autoFocus
                        />
                    </div>

                    <div className="grid gap-1.5">
                        <Label>Type</Label>
                        <Select value={type} onValueChange={v => setType(v as LandmarkType)}>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {LANDMARK_TYPES.map(t => {
                                    const cfg = LANDMARK_TYPE_CONFIG[t];
                                    const Icon = cfg.icon;
                                    return (
                                        <SelectItem key={t} value={t}>
                                            <span className="flex items-center gap-2">
                                                <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                                                {cfg.label}
                                            </span>
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>

                    {type === 'other' && (
                        <div className="grid gap-1.5">
                            <Label htmlFor="landmark-other-label">Label</Label>
                            <Input
                                id="landmark-other-label"
                                value={otherLabel}
                                onChange={e => setOtherLabel(e.target.value)}
                                placeholder="e.g. Water tank"
                                maxLength={100}
                            />
                        </div>
                    )}

                    <div className="grid gap-1.5">
                        <Label htmlFor="landmark-description">Description (optional)</Label>
                        <Textarea
                            id="landmark-description"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Anything the team should know about this place"
                            maxLength={2000}
                            rows={3}
                        />
                    </div>

                    <label className="flex items-center justify-between gap-3 cursor-pointer">
                        <span className="grid gap-0.5">
                            <span className="text-sm font-medium text-foreground">Show publicly</span>
                            <span className="text-xs text-muted-foreground">
                                Public locations will appear on the public dashboard once it launches.
                            </span>
                        </span>
                        <Switch checked={isPublic} onCheckedChange={setIsPublic} />
                    </label>

                    <div className="text-xs text-muted-foreground">
                        Location: <span className="font-mono text-foreground/80">{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</span>
                        {state.mode === 'edit' && <> &middot; use Move on the card to change it</>}
                    </div>

                    {error && <p className="text-sm text-destructive">{error}</p>}
                </div>

                <DialogFooter>
                    <Button variant="outline" size="sm" disabled={submitting} onClick={onClose}>
                        Cancel
                    </Button>
                    <Button size="sm" disabled={!canSave || submitting} onClick={handleSubmit}>
                        {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        {state.mode === 'create' ? 'Add landmark' : 'Save changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default LandmarkFormDialog;
