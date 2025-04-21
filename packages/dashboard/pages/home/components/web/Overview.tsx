import React, { useState, useRef, useEffect } from 'react';
import { CalendarDays } from 'lucide-react';
import useMediaQuery from './useMediaQuery';
import ChildTabs from './ChildTabs';
import StatCardsContainer from './StatCardsContainer';

const Overview = () => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showCalendar, setShowCalendar] = useState(false);
    const calendarRef = useRef(null);
    const isLargeScreen = useMediaQuery('(min-width: 768px)');

    const getMonthRange = () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
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

    const handleDownload = () => {
        console.log('Downloading data for range:', startDate, 'to', endDate);
        // Implement actual download functionality here
    };

    // Format dates for display
    const formatDateForDisplay = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // Get current month and year for calendar
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());

    // Navigate months
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

    // Generate days for the current month
    const generateDays = () => {
        const days = [];
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
        }

        // Add days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(currentYear, currentMonth, i);
            const dateString = date.toISOString().split('T')[0];
            const isToday = date.toDateString() === today.toDateString();
            const isSelected = dateString === startDate || dateString === endDate;
            const isInRange = startDate && endDate && dateString > startDate && dateString < endDate;

            days.push(
                <div
                    key={i}
                    className={`flex items-center justify-center h-8 w-8 rounded-full cursor-pointer
            ${isToday ? 'border border-gray-500' : ''}
            ${isSelected ? 'bg-blue-600 text-white' : ''}
            ${isInRange ? 'bg-blue-100' : ''}
            ${!isSelected && !isInRange ? 'hover:bg-gray-200' : ''}
          `}
                    onClick={() => handleDateClick(dateString)}
                >
                    {i}
                </div>
            );
        }

        return days;
    };

    // Handle date selection
    const handleDateClick = (dateString) => {
        if (!startDate || (startDate && endDate) || dateString < startDate) {
            setStartDate(dateString);
            setEndDate('');
        } else if (dateString > startDate) {
            setEndDate(dateString);
        }
    };

    // Clear date selection
    const clearDates = () => {
        setStartDate('');
        setEndDate('');
    };

    const displayValue = startDate || endDate
        ? `${formatDateForDisplay(startDate)} ${endDate ? ' - ' + formatDateForDisplay(endDate) : ''}`
        : 'Select date range';

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return (
        <div className='w-full h-full'>
            <div className="flex justify-between items-center w-full mb-1 pl-5  pr-5">
                <h1 className="text-3xl font-bold" style={{ letterSpacing: 1 }}>Dashboard</h1>
                <div className="flex items-center gap-3">
                    <div className="relative" ref={calendarRef}>
                        <div
                            className="flex items-center border rounded px-3 py-2 cursor-pointer w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg transition-all duration-300"
                            onClick={() => setShowCalendar(!showCalendar)}
                        >
                            <CalendarDays className="w-4 h-4 text-muted-foreground flex-shrink-0" />

                            {isLargeScreen && (
                                <>
                                    <span className="text-sm truncate ml-2">{displayValue}</span>
                                    <svg
                                        className="w-4 h-4 ml-2 flex-shrink-0"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </>
                            )}
                        </div>

                        {showCalendar && (
                            <div className="absolute right-0 mt-2 bg-white border rounded shadow-lg z-10 p-4 w-64">
                                <div className="flex justify-between items-center mb-4">
                                    <button
                                        onClick={prevMonth}
                                        className="p-1 hover:bg-gray-200 rounded"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                                        </svg>
                                    </button>

                                    <div className="font-semibold">
                                        {monthNames[currentMonth]} {currentYear}
                                    </div>

                                    <button
                                        onClick={nextMonth}
                                        className="p-1 hover:bg-gray-200 rounded"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                        </svg>
                                    </button>
                                </div>

                                <div className="grid grid-cols-7 gap-1 mb-2">
                                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                                        <div key={day} className="text-center text-xs font-medium text-gray-500">{day}</div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-7 gap-1">
                                    {generateDays()}
                                </div>

                                <div className="flex justify-between items-center mt-4 text-sm">
                                    <button
                                        onClick={clearDates}
                                        className="text-gray-600 hover:text-gray-800"
                                    >
                                        Clear
                                    </button>
                                    <button
                                        onClick={() => setShowCalendar(false)}
                                        className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleDownload}
                        className="bg-black hover:bg-gray-700 text-white px-5 py-2 rounded text-sm"
                    >
                        Download
                    </button>
                </div>
            </div>
            <ChildTabs/>
            <StatCardsContainer/>
        </div>
    );
};

export default Overview;