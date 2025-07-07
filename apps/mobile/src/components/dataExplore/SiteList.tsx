import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Modal,
    Image,
    Dimensions,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import * as turf from '@turf/turf';

// Types
interface Geometry {
    type: string;
    coordinates: number[][][];
}

interface Project {
    uid: string;
    name: string;
    slug: string;
}

interface CreatedBy {
    uid: string;
    name: string;
    email: string;
}

interface Site {
    uid: string;
    name: string;
    description: string;
    status: 'barren' | 'planted' | 'planting' | 'reforestation';
    originalGeometry: Geometry;
    metadata: any;
    createdAt: string;
    updatedAt: string;
    project: Project;
    createdBy: CreatedBy;
}

interface SitesListProps {
    sites: Site[];
    onSitePress: (site: Site) => void;
    loading?: boolean;
}

interface FilterState {
    searchText: string;
    selectedStatus: string;
    sortBy: 'name' | 'date' | 'status';
    sortOrder: 'asc' | 'desc';
}

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = screenWidth - 32; // 16px margin on each side

// Status color mapping
const statusColors = {
    barren: '#EF4444',      // Red
    planted: '#22C55E',     // Green
    planting: '#F59E0B',    // Orange
    reforestation: '#3B82F6' // Blue
};

const statusLabels = {
    barren: 'Barren',
    planted: 'Planted',
    planting: 'Planting',
    reforestation: 'Reforestation'
};

// Status Badge Component
const StatusBadge: React.FC<{ status: Site['status'] }> = ({ status }) => (
    <View style={[styles.statusBadge, { backgroundColor: statusColors[status] }]}>
        <Text style={styles.statusText}>{statusLabels[status]}</Text>
    </View>
);

// Site Card Component
const SiteCard: React.FC<{ site: Site; onPress: () => void }> = ({ site, onPress }) => {
    // Calculate area using Turf
    const calculateArea = (geometry: Geometry): string => {
        try {
            if (geometry.type === 'MultiPolygon') {
                let totalArea = 0;
                geometry.coordinates.forEach(polygon => {
                    const polygonFeature = turf.polygon(polygon);
                    totalArea += turf.area(polygonFeature);
                });
                return (totalArea / 10000).toFixed(2); // Convert to hectares
            } else if (geometry.type === 'Polygon') {
                const polygonFeature = turf.polygon(geometry.coordinates);
                const area = turf.area(polygonFeature);
                return (area / 10000).toFixed(2); // Convert to hectares
            }
            return '0';
        } catch (error) {
            console.error('Error calculating area:', error);
            return '0';
        }
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const area = calculateArea(site.originalGeometry);

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
            {/* Image Section */}
            <View style={styles.imageContainer}>
                <View style={styles.placeholderImage}>
                    <Ionicons name="leaf-outline" size={40} color="#9CA3AF" />
                </View>
                <View style={styles.statusBadgeContainer}>
                    <StatusBadge status={site.status} />
                </View>
            </View>

            {/* Content Section */}
            <View style={styles.cardContent}>
                <Text style={styles.siteName} numberOfLines={1}>
                    {site.name}
                </Text>

                <Text style={styles.projectName} numberOfLines={1}>
                    {site.project.name}
                </Text>

                <Text style={styles.description} numberOfLines={2}>
                    {site.description}
                </Text>

                {/* Details Row */}
                <View style={styles.detailsRow}>
                    <View style={styles.detailItem}>
                        <Ionicons name="resize-outline" size={14} color="#6B7280" />
                        <Text style={styles.detailText}>{area} ha</Text>
                    </View>

                    <View style={styles.detailItem}>
                        <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                        <Text style={styles.detailText}>{formatDate(site.createdAt)}</Text>
                    </View>
                </View>

                {/* Created By */}
                <View style={styles.createdByRow}>
                    <Ionicons name="person-outline" size={12} color="#9CA3AF" />
                    <Text style={styles.createdByText} numberOfLines={1}>
                        {site.createdBy.name}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

// Filter Modal Component
const FilterModal: React.FC<{
    visible: boolean;
    onClose: () => void;
    filters: FilterState;
    onFiltersChange: (filters: FilterState) => void;
}> = ({ visible, onClose, filters, onFiltersChange }) => {
    const [localFilters, setLocalFilters] = useState<FilterState>(filters);

    const statusOptions = [
        { label: 'All Status', value: '' },
        { label: 'Barren', value: 'barren' },
        { label: 'Planted', value: 'planted' },
        { label: 'Planting', value: 'planting' },
        { label: 'Reforestation', value: 'reforestation' },
    ];

    const sortOptions = [
        { label: 'Name', value: 'name' },
        { label: 'Date', value: 'date' },
        { label: 'Status', value: 'status' },
    ];

    const handleApply = () => {
        onFiltersChange(localFilters);
        onClose();
    };

    const handleReset = () => {
        const resetFilters: FilterState = {
            searchText: '',
            selectedStatus: '',
            sortBy: 'date',
            sortOrder: 'desc',
        };
        setLocalFilters(resetFilters);
        onFiltersChange(resetFilters);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Filter & Sort</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#374151" />
                        </TouchableOpacity>
                    </View>

                    {/* Status Filter */}
                    <View style={styles.filterSection}>
                        <Text style={styles.filterLabel}>Status</Text>
                        <View style={styles.statusOptionsContainer}>
                            {statusOptions.map((option) => (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[
                                        styles.statusOption,
                                        localFilters.selectedStatus === option.value && styles.statusOptionSelected
                                    ]}
                                    onPress={() =>
                                        setLocalFilters(prev => ({ ...prev, selectedStatus: option.value }))
                                    }
                                >
                                    <Text style={[
                                        styles.statusOptionText,
                                        localFilters.selectedStatus === option.value && styles.statusOptionTextSelected
                                    ]}>
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Sort Options */}
                    <View style={styles.filterSection}>
                        <Text style={styles.filterLabel}>Sort By</Text>
                        <View style={styles.sortContainer}>
                            {sortOptions.map((option) => (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[
                                        styles.sortOption,
                                        localFilters.sortBy === option.value && styles.sortOptionSelected
                                    ]}
                                    onPress={() =>
                                        setLocalFilters(prev => ({ ...prev, sortBy: option.value as any }))
                                    }
                                >
                                    <Text style={[
                                        styles.sortOptionText,
                                        localFilters.sortBy === option.value && styles.sortOptionTextSelected
                                    ]}>
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Sort Order */}
                        <View style={styles.sortOrderContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.sortOrderOption,
                                    localFilters.sortOrder === 'asc' && styles.sortOrderSelected
                                ]}
                                onPress={() =>
                                    setLocalFilters(prev => ({ ...prev, sortOrder: 'asc' }))
                                }
                            >
                                <Ionicons
                                    name="arrow-up"
                                    size={16}
                                    color={localFilters.sortOrder === 'asc' ? '#FFFFFF' : '#6B7280'}
                                />
                                <Text style={[
                                    styles.sortOrderText,
                                    localFilters.sortOrder === 'asc' && styles.sortOrderTextSelected
                                ]}>
                                    Ascending
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.sortOrderOption,
                                    localFilters.sortOrder === 'desc' && styles.sortOrderSelected
                                ]}
                                onPress={() =>
                                    setLocalFilters(prev => ({ ...prev, sortOrder: 'desc' }))
                                }
                            >
                                <Ionicons
                                    name="arrow-down"
                                    size={16}
                                    color={localFilters.sortOrder === 'desc' ? '#FFFFFF' : '#6B7280'}
                                />
                                <Text style={[
                                    styles.sortOrderText,
                                    localFilters.sortOrder === 'desc' && styles.sortOrderTextSelected
                                ]}>
                                    Descending
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.modalActions}>
                        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
                            <Text style={styles.resetButtonText}>Reset</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
                            <Text style={styles.applyButtonText}>Apply</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// Search Header Component
const SearchHeader: React.FC<{
    searchText: string;
    onSearchChange: (text: string) => void;
    onFilterPress: () => void;
    resultCount: number;
}> = ({ searchText, onSearchChange, onFilterPress, resultCount }) => (
    <View style={styles.searchHeader}>
        <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
                <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search sites by name or status..."
                    value={searchText}
                    onChangeText={onSearchChange}
                    placeholderTextColor="#9CA3AF"
                />
                {searchText.length > 0 && (
                    <TouchableOpacity onPress={() => onSearchChange('')}>
                        <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                )}
            </View>

            <TouchableOpacity style={styles.filterButton} onPress={onFilterPress}>
                <Ionicons name="options-outline" size={20} color="#007A49" />
            </TouchableOpacity>
        </View>

        <Text style={styles.resultCount}>
            {resultCount} site{resultCount !== 1 ? 's' : ''} found
        </Text>
    </View>
);

const sampleSitesData = [
    {
        "uid": "site_ybVo0Vn007jQl56",
        "name": "Las Américas 7a",
        "description": "The eastern half is entirely deforested. We are planting in the deforested and degraded sites in 2021 and 2022.",
        "status": "barren",
        "originalGeometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [-90.1423066869791, 18.6684857455352, 0],
                    [-90.1423244145065, 18.6697621275049, 0],
                    [-90.1430866981828, 18.6705598662359, 0],
                    // ... more coordinates (truncated for example)
                    [-90.1423066869791, 18.6684857455352, 0]
                ]
            ]
        },
        "metadata": null,
        "createdAt": "2025-07-04T03:06:26.997Z",
        "updatedAt": "2025-07-04T03:06:26.997Z",
        "project": {
            "uid": "proj_WZkyugryh35sMmZMmXCwq7YY",
            "name": "Yucatán Restoration",
            "slug": "yucatan"
        },
        "createdBy": {
            "uid": "tpo_gEZeQNxNhxZZ54zvYzCofsCr",
            "name": "Plant-for-the-Planet",
            "email": "info@plant-for-the-planet.org"
        }
    },
    {
        "uid": "site_35JSDplrP8o66lk",
        "name": "Las Américas 1",
        "description": "These sites experienced varying states of degradation. In the years 2015–2020, we reforested and implemented enrichment planting.",
        "status": "planted",
        "originalGeometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [-90.1139827774211, 18.7602599763071],
                    [-90.1301315934308, 18.7587892382068],
                    [-90.142897661326, 18.7546571884333],
                    // ... more coordinates (truncated for example)
                    [-90.1139827774211, 18.7602599763071]
                ]
            ]
        },
        "metadata": null,
        "createdAt": "2025-07-04T03:06:27.496Z",
        "updatedAt": "2025-07-04T03:06:27.496Z",
        "project": {
            "uid": "proj_WZkyugryh35sMmZMmXCwq7YY",
            "name": "Yucatán Restoration",
            "slug": "yucatan"
        },
        "createdBy": {
            "uid": "tpo_gEZeQNxNhxZZ54zvYzCofsCr",
            "name": "Plant-for-the-Planet",
            "email": "info@plant-for-the-planet.org"
        }
    },
    {
        "uid": "site_021znOxMoUaiJbJ",
        "name": "Las Américas 2",
        "description": "These sites experienced varying states of degradation. In the years 2015–2020, we reforested and implemented enrichment planting.",
        "status": "planting",
        "originalGeometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [-90.2237751432583, 18.7549558942788],
                    [-90.1849053328914, 18.7458379901162],
                    [-90.1912971861498, 18.7036519515497],
                    // ... more coordinates (truncated for example)
                    [-90.2237751432583, 18.7549558942788]
                ]
            ]
        },
        "metadata": null,
        "createdAt": "2025-07-04T03:06:28.121Z",
        "updatedAt": "2025-07-04T03:06:28.121Z",
        "project": {
            "uid": "proj_WZkyugryh35sMmZMmXCwq7YY",
            "name": "Yucatán Restoration",
            "slug": "yucatan"
        },
        "createdBy": {
            "uid": "tpo_gEZeQNxNhxZZ54zvYzCofsCr",
            "name": "Plant-for-the-Planet",
            "email": "info@plant-for-the-planet.org"
        }
    },
    {
        "uid": "site_4aY6oJghJWjkjNL",
        "name": "INIFAP Site A",
        "description": "San Felipe Bacalar A: 339 hectares of forest burned in 2019. However, many trees survived the blaze. We are conducting enrichment planting in 2021 to restore the lost species.",
        "status": "reforestation",
        "originalGeometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [-88.5045928571554, 18.7786478045779],
                    [-88.5104381915991, 18.778600189582],
                    [-88.5108068038467, 18.7785927148526],
                    // ... more coordinates (truncated for example)
                    [-88.5045928571554, 18.7786478045779]
                ]
            ]
        },
        "metadata": null,
        "createdAt": "2025-07-04T03:06:33.543Z",
        "updatedAt": "2025-07-04T03:06:33.543Z",
        "project": {
            "uid": "proj_WZkyugryh35sMmZMmXCwq7YY",
            "name": "Yucatán Restoration",
            "slug": "yucatan"
        },
        "createdBy": {
            "uid": "tpo_gEZeQNxNhxZZ54zvYzCofsCr",
            "name": "Plant-for-the-Planet",
            "email": "info@plant-for-the-planet.org"
        }
    }
];


// Main Sites List Component
const SitesList: React.FC<SitesListProps> = ({ sites = [...sampleSitesData], onSitePress, loading = false }) => {
    const [filters, setFilters] = useState<FilterState>({
        searchText: '',
        selectedStatus: '',
        sortBy: 'date',
        sortOrder: 'desc',
    });
    const [showFilterModal, setShowFilterModal] = useState(false);

    // Filter and sort sites
    const filteredAndSortedSites = useMemo(() => {
        let filtered = sites.filter(site => {
            // Search filter
            const searchMatch = filters.searchText === '' ||
                site.name.toLowerCase().includes(filters.searchText.toLowerCase()) ||
                site.status.toLowerCase().includes(filters.searchText.toLowerCase());

            // Status filter
            const statusMatch = filters.selectedStatus === '' || site.status === filters.selectedStatus;

            return searchMatch && statusMatch;
        });

        // Sort
        filtered.sort((a, b) => {
            let comparison = 0;

            switch (filters.sortBy) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'date':
                    comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                    break;
                case 'status':
                    comparison = a.status.localeCompare(b.status);
                    break;
            }

            return filters.sortOrder === 'asc' ? comparison : -comparison;
        });

        return filtered;
    }, [sites, filters]);

    const handleSearchChange = (text: string) => {
        setFilters(prev => ({ ...prev, searchText: text }));
    };

    const handleFiltersChange = (newFilters: FilterState) => {
        setFilters(newFilters);
    };

    const renderSite = ({ item }: { item: Site }) => (
        <SiteCard site={item} onPress={() => onSitePress(item)} />
    );

    return (
        <View style={styles.container}>
            <FlashList
                data={filteredAndSortedSites}
                renderItem={renderSite}
                keyExtractor={(item) => item.uid}
                estimatedItemSize={280}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                ListFooterComponent={<View style={styles.footer} />}
                ListHeaderComponent={<SearchHeader
                    searchText={filters.searchText}
                    onSearchChange={handleSearchChange}
                    onFilterPress={() => setShowFilterModal(true)}
                    resultCount={filteredAndSortedSites.length}
                />}
            />

            <FilterModal
                visible={showFilterModal}
                onClose={() => setShowFilterModal(false)}
                filters={filters}
                onFiltersChange={handleFiltersChange}
            />

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        marginTop: 20,
    },
    searchHeader: {
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E5E7EB',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 44,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#111827',
    },
    filterButton: {
        width: 44,
        height: 44,
        borderRadius: 8,
        backgroundColor: '#F0FDF4',
        borderWidth: 1,
        borderColor: '#007A49',
        alignItems: 'center',
        justifyContent: 'center',
    },
    resultCount: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 8,
    },
    listContent: {
    },
    card: {
        marginLeft:5,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
        overflow: 'hidden',
    },
    imageContainer: {
        height: 160,
        position: 'relative',
    },
    placeholderImage: {
        flex: 1,
        backgroundColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusBadgeContainer: {
        position: 'absolute',
        top: 12,
        right: 12,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    cardContent: {
        padding: 16,
    },
    siteName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    projectName: {
        fontSize: 14,
        color: '#007A49',
        fontWeight: '500',
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
        marginBottom: 12,
    },
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailText: {
        fontSize: 12,
        color: '#6B7280',
        marginLeft: 4,
    },
    createdByRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    createdByText: {
        fontSize: 11,
        color: '#9CA3AF',
        marginLeft: 4,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    filterSection: {
        marginBottom: 24,
    },
    filterLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 12,
    },
    statusOptionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    statusOption: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        backgroundColor: '#FFFFFF',
    },
    statusOptionSelected: {
        backgroundColor: '#007A49',
        borderColor: '#007A49',
    },
    statusOptionText: {
        fontSize: 14,
        color: '#374151',
    },
    statusOptionTextSelected: {
        color: '#FFFFFF',
    },
    sortContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    footer: {
        height: 200,
        width: '100%',
    },
    sortOption: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
    },
    sortOptionSelected: {
        backgroundColor: '#007A49',
        borderColor: '#007A49',
    },
    sortOptionText: {
        fontSize: 14,
        color: '#374151',
    },
    sortOptionTextSelected: {
        color: '#FFFFFF',
    },
    sortOrderContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    sortOrderOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        backgroundColor: '#FFFFFF',
    },
    sortOrderSelected: {
        backgroundColor: '#007A49',
        borderColor: '#007A49',
    },
    sortOrderText: {
        fontSize: 12,
        color: '#6B7280',
        marginLeft: 4,
    },
    sortOrderTextSelected: {
        color: '#FFFFFF',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },
    resetButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
    },
    resetButtonText: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
    },
    applyButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: '#007A49',
        alignItems: 'center',
    },
    applyButtonText: {
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '500',
    },
});

export default SitesList;