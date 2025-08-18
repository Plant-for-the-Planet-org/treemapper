'use client'

import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';

import useMediaQuery from '@/hooks/useMediaQuery';
import StatCardsContainer from './StatCardsContainer';
import TreePlantingChart from './TreePlantingChart';
import RecentAdditionsComponent from './RecentAdditionsComponent';
import { useAnalyticsStore } from '@shared-core/store/useAnalyticsStore'
import useProjectStore from '@shared-core/store/useProjectStore'
import { toast } from 'react-toastify'
import ForestProgressComponent from './ForestProgressComponent';
import { exportAllData } from '@shared-core/fetchApi/api.fetch';
import { useToken } from '@/context/useTokenContext'
import { downloadJsonAsCsv } from '@shared-core/utils/reportHelper';
import ChildTabs from './ChildTabs';
import ProjectMap from './GlobalMap';
import ForestLeaderboard from '../../leaderboard/page';

const AdvancedDateRangePicker = ({ onDateChange, initialStartDate, initialEndDate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [startDate, setStartDate] = useState(initialStartDate || '');
    const [endDate, setEndDate] = useState(initialEndDate || '');
    const [tempStartDate, setTempStartDate] = useState(initialStartDate || '');
    const [tempEndDate, setTempEndDate] = useState(initialEndDate || '');
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [previewEndDate, setPreviewEndDate] = useState('');
    const dropdownRef = useRef(null);
    const isLargeScreen = useMediaQuery('(min-width: 768px)');
    // Predefined date ranges
    const dateRanges = [
        { label: 'Today', getValue: () => ({ start: new Date(), end: new Date() }) },
        {
            label: 'Yesterday', getValue: () => {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                return { start: yesterday, end: yesterday };
            }
        },
        {
            label: 'Last 7 days', getValue: () => {
                const end = new Date();
                const start = new Date();
                start.setDate(start.getDate() - 6);
                return { start, end };
            }
        },
        {
            label: 'Last 30 days', getValue: () => {
                const end = new Date();
                const start = new Date();
                start.setDate(start.getDate() - 29);
                return { start, end };
            }
        },
        {
            label: 'This month', getValue: () => {
                const now = new Date();
                const start = new Date(now.getFullYear(), now.getMonth(), 1);
                const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                return { start, end };
            }
        },
        {
            label: 'Last month', getValue: () => {
                const now = new Date();
                const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const end = new Date(now.getFullYear(), now.getMonth(), 0);
                return { start, end };
            }
        },
        {
            label: 'Last 3 months', getValue: () => {
                const end = new Date();
                const start = new Date();
                start.setMonth(start.getMonth() - 3);
                return { start, end };
            }
        },
        {
            label: 'Last 6 months', getValue: () => {
                const end = new Date();
                const start = new Date();
                start.setMonth(start.getMonth() - 6);
                return { start, end };
            }
        },
        {
            label: 'This year', getValue: () => {
                const now = new Date();
                const start = new Date(now.getFullYear(), 0, 1);
                const end = new Date(now.getFullYear(), 11, 31);
                return { start, end };
            }
        },
        {
            label: 'All Time', getValue: () => {
                const now = new Date();
                const start = new Date(now.getFullYear() - 25, 0, 1);
                const end = new Date(now.getFullYear() - 1, 11, 31);
                return { start, end };
            }
        }
    ];

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatDateForInput = (date) => {
        if (!date) return '';
        return date.toISOString().split('T')[0];
    };

    const handlePresetSelect = (preset) => {
        const { start, end } = preset.getValue();
        const startStr = formatDateForInput(start);
        const endStr = formatDateForInput(end);
        setTempStartDate(startStr);
        setTempEndDate(endStr);
        setPreviewEndDate('');
    };

    const handleDateClick = (dateString) => {
        if (!tempStartDate || (tempStartDate && tempEndDate) || dateString < tempStartDate) {
            setTempStartDate(dateString);
            setTempEndDate('');
            setPreviewEndDate('');
        } else if (dateString >= tempStartDate) {
            setTempEndDate(dateString);
            setPreviewEndDate('');
        }
    };

    const handleDateHover = (dateString) => {
        if (tempStartDate && !tempEndDate && dateString > tempStartDate) {
            setPreviewEndDate(dateString);
        }
    };

    const handleApply = () => {
        setStartDate(tempStartDate);
        setEndDate(tempEndDate);
        setIsOpen(false);
        if (onDateChange) {
            onDateChange(tempStartDate, tempEndDate);
        }
    };

    const handleCancel = () => {
        setTempStartDate(startDate);
        setTempEndDate(endDate);
        setPreviewEndDate('');
        setIsOpen(false);
    };

    const handleClear = () => {
        setTempStartDate('');
        setTempEndDate('');
        setPreviewEndDate('');
    };

    const prevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const nextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    const generateDays = () => {
        const days = [];
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const today = new Date();
        const todayStr = formatDateForInput(today);

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
        }

        // Add days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(currentYear, currentMonth, i);
            const dateString = formatDateForInput(date);
            const isToday = dateString === todayStr;
            const isSelected = dateString === tempStartDate || dateString === tempEndDate;
            const isInRange = tempStartDate && tempEndDate && dateString > tempStartDate && dateString < tempEndDate;
            const isInPreviewRange = tempStartDate && previewEndDate && dateString > tempStartDate && dateString < previewEndDate;
            const isPreviewEnd = dateString === previewEndDate;

            days.push(
                <div
                    key={i}
                    className={`flex items-center justify-center h-8 w-8 rounded-md cursor-pointer text-sm transition-all duration-150 ${isToday ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
                        } ${isSelected ? 'bg-blue-600 text-white shadow-md' : ''
                        } ${isInRange ? 'bg-blue-100 text-blue-800' : ''
                        } ${isInPreviewRange || isPreviewEnd ? 'bg-blue-50 text-blue-700' : ''
                        } ${!isSelected && !isInRange && !isInPreviewRange && !isPreviewEnd ? 'hover:bg-gray-100' : ''
                        }`}
                    onClick={() => handleDateClick(dateString)}
                    onMouseEnter={() => handleDateHover(dateString)}
                >
                    {i}
                </div>
            );
        }

        return days;
    };


    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const displayValue = startDate && endDate
        ? `${formatDate(startDate)} - ${formatDate(endDate)}`
        : startDate
            ? `${formatDate(startDate)} - Select end date`
            : 'Select date range for report';


    return (
        <div className="relative" ref={dropdownRef}>
            <div
                className={`flex items-center justify-between bg-white border rounded-lg px-4 py-2.5 cursor-pointer transition-all duration-200 min-w-[280px] ${isOpen ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-300 hover:border-gray-400'
                    }`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700 truncate">{displayValue}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </div>


            {isOpen && (
                <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-0 w-[640px]">
                    <div className="flex">
                        {/* Presets sidebar */}
                        <div className="w-48 bg-gray-50 p-4 border-r border-gray-200 rounded-l-lg">
                            <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Select</h3>
                            <div className="space-y-1">
                                {dateRanges.map((preset, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handlePresetSelect(preset)}
                                        className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-white hover:text-gray-900 rounded-md transition-colors duration-150"
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Calendar */}
                        <div className="flex-1 p-4">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={prevMonth}
                                        className="p-1 hover:bg-gray-100 rounded-md transition-colors duration-150"
                                    >
                                        <ChevronLeft className="w-4 h-4 text-gray-600" />
                                    </button>
                                    <h2 className="text-sm font-medium text-gray-900 min-w-[120px] text-center">
                                        {monthNames[currentMonth]} {currentYear}
                                    </h2>
                                    <button
                                        onClick={nextMonth}
                                        className="p-1 hover:bg-gray-100 rounded-md transition-colors duration-150"
                                    >
                                        <ChevronRight className="w-4 h-4 text-gray-600" />
                                    </button>
                                </div>
                                <button
                                    onClick={handleClear}
                                    className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1"
                                >
                                    <X className="w-3 h-3" />
                                    <span>Clear</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                                    <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-1 mb-4">
                                {generateDays()}
                            </div>

                            <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                                <div className="text-sm text-gray-600">
                                    {tempStartDate && tempEndDate ? (
                                        <span>
                                            {formatDate(tempStartDate)} - {formatDate(tempEndDate)}
                                        </span>
                                    ) : tempStartDate ? (
                                        <span>{formatDate(tempStartDate)} - Select end date</span>
                                    ) : (
                                        <span>Select start date</span>
                                    )}
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={handleCancel}
                                        className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors duration-150"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleApply}
                                        disabled={!tempStartDate || !tempEndDate}
                                        className={`px-4 py-1.5 text-sm rounded-md transition-colors duration-150 ${tempStartDate && tempEndDate
                                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            }`}
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const Overview = () => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showCalendar, setShowCalendar] = useState(false);
    const calendarRef = useRef(null);
    const [totalTrees, setTotalTrees] = useState(0)
    const [dowloanding, setDownloading] = useState(false)
    const Target = useProjectStore(state => state.selectedProject?.target)
    const userRole = useProjectStore(state => state.selectedProject?.userRole)
    const selectedProject = useProjectStore(state => state.selectedProject?.uid)
    const projectRole = useProjectStore(state => state.selectedProject?.userRole)

    const [selectedTab, setSelectedTab] = useState('overview')

    const getMonthRange = () => {
        const now = new Date();
        const start = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0); // last day of the month
        return {
            startDate: start.toISOString().split('T')[0], // YYYY-MM-DD
            endDate: end.toISOString().split('T')[0],
        };
    };



    // Handle clicking outside to close the calendar
    useEffect(() => {
        function handleClickOutside(event) {
            if (calendarRef.current && !calendarRef.current.contains(event.target)) {
                setShowCalendar(false);
            }
        }

        const { startDate, endDate } = getMonthRange();
        setStartDate(startDate);
        setEndDate(endDate);

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);



    const { accessToken } = useToken()
    const handleDownload = async () => {
        try {
            console.log('Downloading data for range:', startDate, endDate);
            if (startDate === '') {
                toast.warn("Please select date range")
                return
            }
            setDownloading(true)
            const response = await exportAllData(accessToken, {
                "startDate": new Date(startDate),
                "endDate": new Date(endDate),
            }, selectedProject)
            console.log('Downloading data for range:', response.data.interventions);

            if (response.statusCode === 200 || response.statusCode === 201) {
                setDownloading(false)
                const interventionsData = response.data.interventions;
                downloadJsonAsCsv(interventionsData, 'TreeMapperReport');
                return;
            }
        } catch (error) {
            toast.error("Report not downloaded")
        } finally {
            setDownloading(false)
        }

    };

    const handleDateChange = (start, end) => {
        setStartDate(start);
        setEndDate(end);
        console.log('Date range changed:', start, end);
        // Your analytics logic here
    };
    return (
        <div className='w-full h-full pt-4'>
            <div className="flex justify-between items-center w-full mb-1 pl-5  pr-5">
                <h1 className="text-3xl font-bold" style={{ letterSpacing: 1 }}>Dashboard</h1>
                {projectRole !== 'admin' && projectRole !== 'owner' ? null : <div className="flex items-center gap-3">
                    <div className="relative" ref={calendarRef}>
                        <AdvancedDateRangePicker
                            onDateChange={handleDateChange}
                            initialStartDate={startDate}
                            initialEndDate={endDate}
                        />
                    </div>
                    <button
                        onClick={handleDownload}
                        disabled={dowloanding}
                        className="bg-black hover:bg-gray-700 text-white px-5 py-2 rounded text-sm"
                    >
                        {dowloanding ? "Downloading..." : "Download"}
                    </button>
                </div>}
            </div>
            {projectRole !== 'admin' && projectRole !== 'owner' ? <ProjectMap projectId={selectedProject} token={accessToken} /> : <>     <ChildTabs selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
                {selectedTab === 'overview' ? <>
                    <StatCardsContainer setTotalTrees={setTotalTrees} />
                    <div className="px-4 py-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="h-full flex" style={{ flexDirection: 'column' }}>
                                {Target && <ForestProgressComponent target={Target} treeCount={totalTrees} />}
                                <TreePlantingChart />

                            </div>
                            <div className="h-full flex">
                                <RecentAdditionsComponent />
                            </div>
                        </div>
                    </div></> : selectedTab === 'leaderboard' ? <ForestLeaderboard /> : <ProjectMap projectId={selectedProject} token={accessToken} />}</>}
        </div>
    );
};

export default Overview;
