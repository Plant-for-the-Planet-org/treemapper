'use client';

import React, { useState, useEffect } from 'react';
import {
  InterventionApprovalData,
  SiteApprovalData,
  ApprovalData,
  ApprovalStatus,
  ApprovalHistoryEntry,
  ReviewThread,
  ReviewComment,
  isInterventionApproval,
  isSiteApproval,
} from '@shared-core/types/approval.types';
import {
  getInterventionReviewDetails,
  getCurrentThread,
  getCurrentSiteThread,
  getThreadComments,
} from '@shared-core/fetchApi/api.fetch';
import { useToken } from '@/context/useTokenContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import {
  CheckCircle2,
  XCircle,
  Eye,
  MessageSquare,
  User,
  Calendar,
  Image as ImageIcon,
  MapPin,
  ExternalLink,
  TreesIcon,
  Droplets,
} from 'lucide-react';
import { SiteMapView } from './SiteMapView';

interface ApprovalModalProps {
  intervention: ApprovalData | null;
  isOpen: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onStatusChange: (
    newStatus: ApprovalStatus,
    comment: string,
    isInternal: boolean
  ) => void;
  onCommentAdd: (comment: string, isInternal: boolean) => void;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  intervention,
  isOpen,
  isAdmin,
  onClose,
  onStatusChange,
  onCommentAdd,
}) => {
  const { accessToken } = useToken();
  const [comment, setComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [targetStatus, setTargetStatus] = useState<ApprovalStatus | null>(null);
  const [currentThread, setCurrentThread] = useState<ReviewThread | null>(null);
  const [threadComments, setThreadComments] = useState<ReviewComment[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [detailedData, setDetailedData] = useState<Record<string, any> | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Fetch review thread and comments when modal opens
  useEffect(() => {
    if (isOpen && intervention) {
      if (isInterventionApproval(intervention)) {
        loadReviewThread();
      } else if (isSiteApproval(intervention)) {
        loadSiteThread();
      }
    }
  }, [isOpen, intervention]);

  // Fetch richer intervention details when modal opens
  useEffect(() => {
    if (isOpen && intervention && isInterventionApproval(intervention)) {
      loadInterventionDetails();
    } else {
      setDetailedData(null);
    }
  }, [isOpen, intervention]);

  const loadInterventionDetails = async () => {
    if (!intervention || !isInterventionApproval(intervention) || !accessToken) return;
    try {
      setLoadingDetails(true);
      const resp = await getInterventionReviewDetails(accessToken, intervention.interventionUid);
      if (resp && resp.statusCode === 200 && resp.data) {
        setDetailedData(resp.data);
      } else {
        setDetailedData(null);
      }
    } catch (err) {
      console.error('Failed to load intervention details:', err);
      setDetailedData(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const loadReviewThread = async () => {
    if (!intervention || !isInterventionApproval(intervention) || !accessToken) return;

    try {
      setLoadingThread(true);
      const threadResponse = await getCurrentThread(
        accessToken,
        intervention.interventionUid
      );

      if (threadResponse.statusCode === 200 && threadResponse.data) {
        setCurrentThread(threadResponse.data);
        // Load comments for the thread
        const commentsResponse = await getThreadComments(
          accessToken,
          threadResponse.data.uid
        );
        if (commentsResponse.statusCode === 200 && commentsResponse.data) {
          setThreadComments(commentsResponse.data);
        }
      } else {
        setCurrentThread(null);
        setThreadComments([]);
      }
    } catch (err) {
      console.error('Failed to load review thread:', err);
      setCurrentThread(null);
      setThreadComments([]);
    } finally {
      setLoadingThread(false);
    }
  };

  const loadSiteThread = async () => {
    if (!intervention || !isSiteApproval(intervention) || !accessToken) return;
    try {
      setLoadingThread(true);
      const threadResponse = await getCurrentSiteThread(accessToken, intervention.siteUid);
      if (threadResponse.statusCode === 200 && threadResponse.data) {
        setCurrentThread(threadResponse.data);
        const commentsResponse = await getThreadComments(accessToken, threadResponse.data.uid);
        if (commentsResponse.statusCode === 200 && commentsResponse.data) {
          setThreadComments(commentsResponse.data);
        }
      } else {
        setCurrentThread(null);
        setThreadComments([]);
      }
    } catch (err) {
      console.error('Failed to load site review thread:', err);
      setCurrentThread(null);
      setThreadComments([]);
    } finally {
      setLoadingThread(false);
    }
  };

  if (!intervention) return null;

  // Type check
  const isIntervention = isInterventionApproval(intervention);
  const isSite = isSiteApproval(intervention);

  const formatType = (type: string) => {
    return type
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), 'MMM dd, yyyy');
    } catch {
      return date;
    }
  };

  const topSpeciesString = (() => {
    const dist = detailedData?.speciesDistribution;
    if (!dist) return '';
    const entries = Object.entries(dist).sort((a: any, b: any) => (b[1] as number) - (a[1] as number));
    return entries.slice(0, 3).map(([k, v]) => `${k} (${v})`).join(', ');
  })();
  // prefer detailedData location if available
  const mapLocation = isIntervention
    ? (detailedData?.location || intervention.interventionData.location)
    : (detailedData?.location || intervention.siteData.location);

  const getHistoryActionText = (action: ApprovalHistoryEntry['action']) => {
    const icons = {
      submitted: '📝',
      moved_to_review: '👁️',
      approved: '✅',
      rejected: '❌',
      requested_revision: '🔄',
      resubmitted: '📤',
      data_edited: '✏️',
    };
    const text = action.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    return `${icons[action] || ''} ${text}`;
  };

  const handleStatusClick = (newStatus: ApprovalStatus) => {
    setTargetStatus(newStatus);
    setShowCommentForm(true);
  };

  const handleSubmit = () => {
    if (targetStatus) {
      if (targetStatus === 'rejected' && !comment.trim()) {
        alert('Comment is required when rejecting');
        return;
      }
      onStatusChange(targetStatus, comment.trim(), isInternal);
    } else {
      if (!comment.trim()) return;
      onCommentAdd(comment.trim(), isInternal);
    }

    setComment('');
    setIsInternal(false);
    setShowCommentForm(false);
    setTargetStatus(null);
  };

  const canApprove = isAdmin && intervention.approvalStatus !== 'approved';
  const canReject = isAdmin && intervention.approvalStatus !== 'rejected';
  const canMoveToReview =
    isAdmin &&
    intervention.approvalStatus !== 'in_review' &&
    intervention.approvalStatus !== 'approved';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-[85vw] w-[85vw] max-h-[90vh] overflow-y-auto sm:!max-w-[85vw]">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-3">
              <TreesIcon className="h-5 w-5 text-green-700" />
              <div>
                <div className="font-semibold">{isIntervention ? 'Intervention Details' : 'Site Details'}</div>
                <div className="text-xs text-gray-500">
                  {isIntervention ? `#${intervention.interventionHid}` : `Site: ${intervention.siteUid}`}
                </div>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="text-sm font-bold text-[#007A49] mb-1">
              {isIntervention ? `#${intervention.interventionHid}` : `Site: ${intervention.siteUid}`}
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isIntervention ? formatType(intervention.type) : intervention.name}
            </h2>
          </div>

          {/* Two Column Layout - 60/40 split */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left Column - Details (60% width - 3 of 5 columns) */}
            <div className="lg:col-span-3 space-y-6">
              {/* Image + Map preview */}
              {(isIntervention || isSite) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Intervention image */}
                  {isIntervention && (detailedData?.image || intervention.interventionData.image) && (
                    <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden shadow-sm">
                      <img
                        src={detailedData?.image || intervention.interventionData.image}
                        alt="Intervention"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Map preview for intervention or site */}
                  {mapLocation ? (
                    <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden shadow-sm">
                      <SiteMapView
                        location={mapLocation}
                        className="w-full h-full"
                        markerInfo={
                          isIntervention
                            ? { title: `#${intervention.interventionHid}`, subtitle: topSpeciesString }
                            : { title: intervention.siteUid, subtitle: intervention.name || '' }
                        }
                      />
                    </div>
                  ) : (
                    /* If no map but site image exists, show site image in second column */
                    isSite && intervention.siteData.image && (
                      <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden shadow-sm">
                        <img
                          src={intervention.siteData.image}
                          alt="Site"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Overview */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Overview</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-600">Created by:</span>
                    <span className="ml-2 font-semibold">
                      {intervention.createdBy.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2 font-semibold">
                      {intervention.createdBy.email}
                    </span>
                  </div>
                  {isIntervention && (
                    <div>
                      <span className="text-gray-600">Intervention Type:</span>
                      <span className="ml-2 font-semibold">
                        {formatType(intervention.type)}
                      </span>
                    </div>
                  )}
                  {isSite && (
                    <div>
                      <span className="text-gray-600">Site Status:</span>
                      <Badge className="ml-2" variant="outline">
                        {formatType(intervention.siteData.status)}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Details Section */}
              {isIntervention && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Intervention Details</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Total Tree Count:</span>
                      <span className="ml-2 font-semibold">
                        {intervention.interventionData.totalTreeCount || 0}
                      </span>
                    </div>
                    {intervention.interventionData.totalSampleTreeCount !== undefined && (
                      <div>
                        <span className="text-gray-600">Sample Tree Count:</span>
                        <span className="ml-2 font-semibold">
                          {intervention.interventionData.totalSampleTreeCount}
                        </span>
                      </div>
                    )}
                    {intervention.interventionData.area && (
                      <div>
                        <span className="text-gray-600">Area:</span>
                        <span className="ml-2 font-semibold">
                          {intervention.interventionData.area.toFixed(2)} m²
                        </span>
                      </div>
                    )}
                    {intervention.interventionData.status && (
                      <div>
                        <span className="text-gray-600">Intervention Status:</span>
                        <Badge className="ml-2" variant="outline">
                          {formatType(intervention.interventionData.status)}
                        </Badge>
                      </div>
                    )}
                    {intervention.interventionData.captureMode && (
                      <div>
                        <span className="text-gray-600">Capture Mode:</span>
                        <span className="ml-2 font-semibold">
                          {formatType(intervention.interventionData.captureMode)}
                        </span>
                      </div>
                    )}
                    {intervention.interventionData.captureStatus && (
                      <div>
                        <span className="text-gray-600">Capture Status:</span>
                        <Badge
                          className="ml-2"
                          variant={
                            intervention.interventionData.captureStatus === 'complete'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {formatType(intervention.interventionData.captureStatus)}
                        </Badge>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600">Start Date:</span>
                      <span className="ml-2 font-semibold">
                        {formatDate(intervention.interventionData.interventionStartDate)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">End Date:</span>
                      <span className="ml-2 font-semibold">
                        {formatDate(intervention.interventionData.interventionEndDate)}
                      </span>
                    </div>
                    {intervention.interventionData.isPrivate !== undefined && (
                      <div>
                        <span className="text-gray-600">Visibility:</span>
                        <Badge className="ml-2" variant="outline">
                          {intervention.interventionData.isPrivate ? '🔒 Private' : '🌐 Public'}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Detailed data fetched on open (species, trees, canopy, etc.) */}
              {isIntervention && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Detailed Data</h3>
                  {loadingDetails ? (
                    <div className="text-sm text-gray-500">Loading detailed data...</div>
                  ) : detailedData ? (
                    <div className="space-y-3 text-sm">
                      {/* Canopy / cover / summary */}
                      {(detailedData.canopyCover || detailedData.totalTreeCount || detailedData.speciesDistribution) && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold">Summary</div>
                            <div className="text-xs text-gray-500">Source: detailed API</div>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                            {detailedData.totalTreeCount !== undefined && (
                              <div>
                                <div className="text-gray-600">Total Trees</div>
                                <div className="font-semibold">{detailedData.totalTreeCount}</div>
                              </div>
                            )}
                            {detailedData.canopyCover !== undefined && (
                              <div>
                                <div className="text-gray-600">Canopy Cover</div>
                                <div className="font-semibold">{`${detailedData.canopyCover}%`}</div>
                              </div>
                            )}
                            {detailedData.avgHeight !== undefined && (
                              <div>
                                <div className="text-gray-600">Avg Height</div>
                                <div className="font-semibold">{`${detailedData.avgHeight} m`}</div>
                              </div>
                            )}
                            {detailedData.avgDbh !== undefined && (
                              <div>
                                <div className="text-gray-600">Avg DBH</div>
                                <div className="font-semibold">{`${detailedData.avgDbh} cm`}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Species distribution */}
                      {detailedData.speciesDistribution && Object.keys(detailedData.speciesDistribution).length > 0 && (
                        <div>
                          <div className="text-sm font-medium mb-2">Top Species</div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {Object.entries(detailedData.speciesDistribution)
                              .sort((a: any, b: any) => (b[1] as number) - (a[1] as number))
                              .slice(0, 8)
                              .map(([speciesName, count]: [string, any]) => {
                                const total = detailedData.totalTreeCount || intervention.interventionData.totalTreeCount || 1;
                                const pct = Math.round(((count as number) / total) * 100);
                                return (
                                  <div key={speciesName} className="flex items-center justify-between p-2 bg-white border border-gray-100 rounded">
                                    <div className="truncate">{speciesName}</div>
                                    <div className="text-gray-500">{count} ({pct}%)</div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}

                      {/* Trees preview */}
                      {Array.isArray(detailedData.trees) && detailedData.trees.length > 0 && (
                        <div>
                          <div className="text-sm font-medium mb-2">Trees (preview)</div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {detailedData.trees.slice(0, 12).map((t: any) => (
                              <div key={t.treeId || t.uid || Math.random()} className="bg-white border rounded p-2 text-xs">
                                {t.image ? (
                                  <div className="mb-2">
                                    <img
                                      src={
                                        typeof t.image === 'string' && t.image.startsWith('http')
                                          ? t.image
                                          : `${process.env.NEXT_PUBLIC_CDN}/tree/${t.image}`
                                      }
                                      alt={t.species || t.hid || 'Tree image'}
                                      className="w-full h-24 object-cover rounded-md"
                                    />
                                  </div>
                                ) : null}
                                <div className="font-medium truncate">{t.species || 'Unknown'}</div>
                                <div className="text-gray-500">{t.tag ? `Tag: ${t.tag}` : t.hid ? `ID: ${t.hid}` : ''}</div>
                                <div className="mt-1 text-xs text-gray-700">
                                  {t.height !== undefined ? `${t.height} m` : '-'} · {t.width !== undefined ? `${t.width} m` : '-'}
                                </div>
                              </div>
                            ))}
                          </div>
                          {detailedData.trees.length > 12 && (
                            <div className="mt-2 text-xs text-gray-500 text-center">
                              Showing 12 of {detailedData.trees.length} trees
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No additional details available.</div>
                  )}
                </div>
              )}

              {isSite && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Site Details</h3>
                  <div className="space-y-2 text-sm">
                    {intervention.siteData.area && (
                      <div>
                        <span className="text-gray-600">Area:</span>
                        <span className="ml-2 font-semibold">
                          {(intervention.siteData.area / 10000).toFixed(2)} hectares
                        </span>
                      </div>
                    )}
                    {intervention.siteData.expectedTreeCount && (
                      <div>
                        <span className="text-gray-600">Expected Tree Count:</span>
                        <span className="ml-2 font-semibold">
                          {intervention.siteData.expectedTreeCount.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {intervention.siteData.soilType && (
                      <div>
                        <span className="text-gray-600">Soil Type:</span>
                        <span className="ml-2 font-semibold">
                          {intervention.siteData.soilType}
                        </span>
                      </div>
                    )}
                    {intervention.siteData.elevation !== null && (
                      <div>
                        <span className="text-gray-600">Elevation:</span>
                        <span className="ml-2 font-semibold">
                          {intervention.siteData.elevation} m
                        </span>
                      </div>
                    )}
                    {intervention.siteData.slope !== null && (
                      <div>
                        <span className="text-gray-600">Slope:</span>
                        <span className="ml-2 font-semibold">
                          {intervention.siteData.slope}°
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600">Water Access:</span>
                      <Badge className="ml-2" variant="outline">
                        {intervention.siteData.waterAccess ? '✓ Available' : '✗ Not Available'}
                      </Badge>
                    </div>
                    {intervention.siteData.accessibility && (
                      <div>
                        <span className="text-gray-600">Accessibility:</span>
                        <span className="ml-2 font-semibold">
                          {intervention.siteData.accessibility}
                        </span>
                      </div>
                    )}
                    {intervention.siteData.plannedPlantingDate && (
                      <div>
                        <span className="text-gray-600">Planned Planting Date:</span>
                        <span className="ml-2 font-semibold">
                          {formatDate(intervention.siteData.plannedPlantingDate)}
                        </span>
                      </div>
                    )}
                    {intervention.siteData.actualPlantingDate && (
                      <div>
                        <span className="text-gray-600">Actual Planting Date:</span>
                        <span className="ml-2 font-semibold">
                          {formatDate(intervention.siteData.actualPlantingDate)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sample Trees - Only for interventions with sample tree data */}
              {isIntervention && intervention.interventionData.sampleTrees && intervention.interventionData.sampleTrees.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Sample Trees ({intervention.interventionData.sampleTrees.length} of {intervention.interventionData.totalTreeCount})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-2 py-2 text-left font-semibold">Tag</th>
                          <th className="px-2 py-2 text-left font-semibold">Species</th>
                          <th className="px-2 py-2 text-left font-semibold">Height</th>
                          <th className="px-2 py-2 text-left font-semibold">DBH</th>
                          <th className="px-2 py-2 text-left font-semibold">Health</th>
                          <th className="px-2 py-2 text-left font-semibold">Image</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {intervention.interventionData.sampleTrees.slice(0, 10).map((tree) => (
                          <tr key={tree.treeId} className="hover:bg-gray-50">
                            <td className="px-2 py-2">{tree.treeTag || '-'}</td>
                            <td className="px-2 py-2">
                              <div className="font-medium">{tree.species}</div>
                              {tree.scientificName && (
                                <div className="text-gray-500 italic text-xs">{tree.scientificName}</div>
                              )}
                            </td>
                            <td className="px-2 py-2">{tree.height ? `${tree.height.toFixed(1)}m` : '-'}</td>
                            <td className="px-2 py-2">{tree.diameter ? `${tree.diameter.toFixed(1)}cm` : '-'}</td>
                            <td className="px-2 py-2">
                              {tree.health && (
                                <Badge
                                  variant="outline"
                                  className={
                                    tree.health === 'excellent'
                                      ? 'bg-green-50 text-green-700 border-green-200'
                                      : tree.health === 'good'
                                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                                      : tree.health === 'fair'
                                      ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                      : 'bg-red-50 text-red-700 border-red-200'
                                  }
                                >
                                  {tree.health}
                                </Badge>
                              )}
                            </td>
                            <td className="px-2 py-2">
                              {tree.image ? (
                                <a href={tree.image} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                  View
                                </a>
                              ) : (
                                '-'
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {intervention.interventionData.sampleTrees.length > 10 && (
                      <div className="mt-2 text-xs text-gray-500 text-center">
                        Showing 10 of {intervention.interventionData.sampleTrees.length} sample trees
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Location Information - Only for interventions with point locations */}
              {isIntervention && intervention.interventionData.location && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Location</h3>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <span className="text-gray-600">Coordinates:</span>
                      <span className="ml-2 font-mono text-xs">
                        {typeof intervention.interventionData.location === 'object' &&
                        intervention.interventionData.location.lat &&
                        intervention.interventionData.location.lng
                          ? `${intervention.interventionData.location.lat.toFixed(
                              6
                            )}, ${intervention.interventionData.location.lng.toFixed(6)}`
                          : 'N/A'}
                      </span>
                    </div>
                    {typeof intervention.interventionData.location === 'object' &&
                      intervention.interventionData.location.lat &&
                      intervention.interventionData.location.lng && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const lat = intervention.interventionData.location.lat;
                          const lng = intervention.interventionData.location.lng;
                          window.open(
                            `https://www.google.com/maps?q=${lat},${lng}`,
                            '_blank'
                          );
                        }}
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        Open in Maps
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              {isIntervention && intervention.interventionData.description && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-sm text-gray-700">
                    {intervention.interventionData.description}
                  </p>
                </div>
              )}

              {isSite && intervention.description && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-sm text-gray-700">
                    {intervention.description}
                  </p>
                </div>
              )}
            </div>

            {/* Right Column - Status, Comments & Actions (40% width - 2 of 5 columns) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Current Status */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">Current Status</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Approval Status:</span>
                    <Badge
                      className="ml-2"
                      variant={
                        intervention.approvalStatus === 'approved'
                          ? 'default'
                          : intervention.approvalStatus === 'rejected'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {formatType(intervention.approvalStatus)}
                    </Badge>
                  </div>
                  {intervention.submittedForReviewAt && (
                    <div>
                      <span className="text-gray-600">Submitted for Review:</span>
                      <span className="ml-2 font-semibold">
                        {formatDate(intervention.submittedForReviewAt)}
                      </span>
                    </div>
                  )}
                  {isIntervention && intervention.interventionData.editedAt && (
                    <div>
                      <span className="text-gray-600">Last Edited:</span>
                      <span className="ml-2 font-semibold">
                        {formatDate(intervention.interventionData.editedAt)}
                      </span>
                    </div>
                  )}
                  {isIntervention && intervention.interventionData.registrationDate && (
                    <div>
                      <span className="text-gray-600">Registration Date:</span>
                      <span className="ml-2 font-semibold">
                        {formatDate(intervention.interventionData.registrationDate)}
                      </span>
                    </div>
                  )}
                  {isSite && (
                    <>
                      <div>
                        <span className="text-gray-600">Created:</span>
                        <span className="ml-2 font-semibold">
                          {formatDate(intervention.siteData.createdAt)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Last Updated:</span>
                        <span className="ml-2 font-semibold">
                          {formatDate(intervention.siteData.updatedAt)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Approval Info */}
              {intervention.approvedBy && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-sm font-semibold text-green-800">
                    ✓ Approved by {intervention.approvedBy.name}
                  </div>
                  {intervention.approvedAt && (
                    <div className="text-xs text-green-700 mt-1">
                      on {formatDate(intervention.approvedAt)}
                    </div>
                  )}
                </div>
              )}

              {/* Review Thread & Comments */}
              {isIntervention && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Review Thread {currentThread && `#${currentThread.threadNumber}`}
                  </h3>
                  {loadingThread ? (
                    <div className="text-sm text-gray-500">Loading thread...</div>
                  ) : currentThread ? (
                    <div className="space-y-3">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                        <div className="flex items-center justify-between mb-2">
                          <Badge
                            variant={
                              currentThread.status === 'open'
                                ? 'default'
                                : currentThread.status === 'resolved'
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {currentThread.status}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatDate(
                              typeof currentThread.createdAt === 'string'
                                ? currentThread.createdAt
                                : currentThread.createdAt.toISOString()
                            )}
                          </span>
                        </div>
                        {currentThread.resolution && (
                          <div className="mt-2">
                            <span className="text-xs text-gray-600">Resolution: </span>
                            <Badge variant="outline">{currentThread.resolution}</Badge>
                          </div>
                        )}
                        {currentThread.unresolvedIssuesCount !== undefined &&
                          currentThread.unresolvedIssuesCount > 0 && (
                            <div className="mt-2 text-xs text-amber-600">
                              ⚠️ {currentThread.unresolvedIssuesCount} unresolved issue(s)
                            </div>
                          )}
                      </div>

                      {/* Review Comments */}
                      {threadComments.length > 0 && (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {threadComments.map((comment) => (
                            <div
                              key={comment.uid}
                              className={`rounded-lg p-3 text-sm border ${
                                comment.authorRole === 'admin'
                                  ? 'bg-blue-50 border-blue-200'
                                  : comment.authorRole === 'reviewer'
                                  ? 'bg-purple-50 border-purple-200'
                                  : 'bg-white border-gray-200'
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <div className="font-semibold text-gray-900">
                                    {comment.author.displayName}
                                    <Badge className="ml-2 text-xs" variant="outline">
                                      {comment.authorRole}
                                    </Badge>
                                    {comment.type !== 'general' && (
                                      <Badge className="ml-2 text-xs" variant="secondary">
                                        {comment.type}
                                      </Badge>
                                    )}
                                    {comment.severity && (
                                      <Badge
                                        className="ml-2 text-xs"
                                        variant={
                                          comment.severity === 'error'
                                            ? 'destructive'
                                            : comment.severity === 'warning'
                                            ? 'default'
                                            : 'secondary'
                                        }
                                      >
                                        {comment.severity}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {formatDate(
                                      typeof comment.createdAt === 'string'
                                        ? comment.createdAt
                                        : comment.createdAt.toISOString()
                                    )}
                                  </div>
                                </div>
                                {comment.isResolved && (
                                  <Badge variant="secondary" className="text-xs">
                                    ✓ Resolved
                                  </Badge>
                                )}
                              </div>
                              <p className="text-gray-700">{comment.message}</p>
                              {comment.targetField && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Field: {comment.targetField}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {threadComments.length === 0 && (
                        <div className="text-sm text-gray-500 text-center py-4">
                          No comments yet
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      No active review thread. Intervention may not be submitted for review yet.
                    </div>
                  )}
                </div>
              )}

              {/* Legacy Comments (fallback) */}
              {intervention.comments && intervention.comments.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Legacy Comments</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {intervention.comments.map((comment) => (
                      <div
                        key={comment.uid}
                        className={`rounded-lg p-3 text-sm border ${
                          comment.isInternal
                            ? 'bg-yellow-50 border-yellow-200'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-semibold text-gray-900">
                              {comment.userName}
                              {comment.isInternal && (
                                <Badge className="ml-2 text-xs" variant="outline">
                                  🔒 Internal
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {comment.userRole} • {formatDate(comment.createdAt)}
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-700">{comment.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* History */}
              {intervention.history && intervention.history.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">History</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {intervention.history.map((entry: ApprovalHistoryEntry) => (
                      <div
                        key={entry.uid}
                        className="bg-gray-50 rounded-lg p-3 text-sm"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold">
                            {getHistoryActionText(entry.action)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(entry.timestamp)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">{entry.userName}</div>
                        {entry.comment && (
                          <div className="text-xs text-gray-700 mt-2 italic">
                            "{entry.comment}"
                          </div>
                        )}
                        {entry.changedFields && entry.changedFields.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            Changed: {entry.changedFields.join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comment Form */}
              {showCommentForm && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">
                    {targetStatus
                      ? `Change Status to ${targetStatus.replace('_', ' ')}`
                      : 'Add Comment'}
                  </h3>

                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add your comment here..."
                    className="mb-3"
                    rows={4}
                  />

                  {isAdmin && (
                    <div className="flex items-center space-x-2 mb-3">
                      <Checkbox
                        id="internal"
                        checked={isInternal}
                        onCheckedChange={(checked) =>
                          setIsInternal(checked as boolean)
                        }
                      />
                      <Label htmlFor="internal" className="text-sm">
                        Internal Comment (only visible to admins and owners)
                      </Label>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCommentForm(false);
                        setTargetStatus(null);
                        setComment('');
                        setIsInternal(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={targetStatus === 'rejected' && !comment.trim()}
                    >
                      Submit
                    </Button>
                  </div>
                </div>
              )}

              {/* Actions */}
              {!showCommentForm && (
                <div className="border-t pt-4 space-y-3">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowCommentForm(true)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Add Comment
                  </Button>

                  {isAdmin && (
                    <div className="grid grid-cols-3 gap-2">
                      {canMoveToReview && (
                        <Button
                          onClick={() => handleStatusClick('in_review')}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      )}
                      {canApprove && (
                        <Button
                          onClick={() => handleStatusClick('approved')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      )}
                      {canReject && (
                        <Button
                          onClick={() => handleStatusClick('rejected')}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
