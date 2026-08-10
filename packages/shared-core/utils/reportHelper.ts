export const downloadJsonAsCsv = (jsonData, filename, includeHeaders = true) => {
    // Return early if no data
    if (!jsonData || !jsonData.length) {
        console.error('No data provided for CSV download');
        return;
    }

    try {
        // Function to flatten nested objects with dot notation
        const flattenObject = (obj, prefix = '') => {
            const flattened = {};
            
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    const value = obj[key];
                    const newKey = prefix ? `${prefix}.${key}` : key;
                    
                    if (value === null || value === undefined) {
                        flattened[newKey] = '';
                    } else if (Array.isArray(value)) {
                        // Handle arrays - convert to JSON string or flatten if objects
                        if (value.length === 0) {
                            flattened[newKey] = '';
                        } else if (typeof value[0] === 'object' && value[0] !== null) {
                            // If array contains objects, create separate columns for each array item
                            value.forEach((item, index) => {
                                const arrayFlattened = flattenObject(item, `${newKey}.${index}`);
                                Object.assign(flattened, arrayFlattened);
                            });
                        } else {
                            // Simple array - join with semicolon
                            flattened[newKey] = value.join('; ');
                        }
                    } else if (typeof value === 'object') {
                        // Recursively flatten nested objects
                        const nestedFlattened = flattenObject(value, newKey);
                        Object.assign(flattened, nestedFlattened);
                    } else {
                        flattened[newKey] = value;
                    }
                }
            }
            
            return flattened;
        };

        // Flatten all objects in the array
        const flattenedData = jsonData.map(item => flattenObject(item));

        // Get all unique headers from all flattened objects
        const allHeaders = new Set();
        flattenedData.forEach(item => {
            Object.keys(item).forEach(key => allHeaders.add(key));
        });

        const headers = Array.from(allHeaders).sort();

        // Create CSV rows from the flattened data
        let csvRows = [];

        // Add headers row if requested
        if (includeHeaders) {
            csvRows.push(headers.join(','));
        }

        // Add data rows
        flattenedData.forEach(item => {
            const values = headers.map(header => {
                // Handle special cases (commas, quotes, undefined, null)
                const cellValue = item[header] === null || item[header] === undefined ? '' : item[header];
                const stringValue = String(cellValue)
                    .replace(/"/g, '""') // Escape double quotes with double quotes
                    .replace(/\n/g, ' ') // Replace newlines with spaces
                    .replace(/\r/g, ''); // Remove carriage returns

                // Wrap with quotes if contains comma, quote or newline
                return /[,"\n\r]/.test(stringValue) ? `"${stringValue}"` : stringValue;
            });

            csvRows.push(values.join(','));
        });

        // Combine rows into a CSV string
        const csvString = csvRows.join('\n');

        // Create a Blob containing the CSV data
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });

        // Create a link element to trigger the download
        const link = document.createElement('a');

        // Create a URL for the blob
        const url = URL.createObjectURL(blob);

        // Set link properties
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';

        // Add link to the document, trigger click, and remove it
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Release the blob URL
        URL.revokeObjectURL(url);

    } catch (error) {
        console.error('Error generating CSV download:', error);
    }
};
