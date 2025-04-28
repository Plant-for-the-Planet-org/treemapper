import React, { useState } from 'react';
import {
    Search,
    Download,
    PlusCircle,
    Edit2,
    Trash2,
    Leaf,
    Heart,
} from 'lucide-react';
import { motion } from 'framer-motion';
import SpeciesModal from './AddNewSpecies'; // Import the new modal component

const SpeciesManagementPage = () => {
    const [speciesList, setSpeciesList] = useState([
        {
            id: 1,
            scientificName: "Quercus robur",
            localName: "English Oak",
            imageUrl: "https://images.unsplash.com/photo-1728587370917-4a74d51c7734?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            favorite: true,
            lastUpdated: "2025-04-15T14:30:00",
        },
        {
            id: 2,
            scientificName: "Pinus sylvestris",
            localName: "Scots Pine",
            imageUrl: "",
            favorite: true,
            lastUpdated: "2025-04-10T09:15:00",
        },
        {
            id: 3,
            scientificName: "Betula pendula",
            localName: "Silver Birch",
            imageUrl: "https://plus.unsplash.com/premium_photo-1663962158789-0ab624c4f17d?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            favorite: false,
            lastUpdated: "2025-04-18T11:45:00",
        },
        {
            id: 4,
            scientificName: "Fagus sylvatica",
            localName: "European Beech",
            imageUrl: "https://images.unsplash.com/photo-1631687501186-6a8c81bd30dc?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            favorite: true,
            lastUpdated: "2025-04-05T16:20:00",
        },
        {
            id: 5,
            scientificName: "Uhes sylvestris",
            localName: "Scots Pine",
            imageUrl: "",
            favorite: true,
            lastUpdated: "2025-04-10T09:15:00",
        },
        {
            id: 6,
            scientificName: "Piwrs rlvris",
            localName: "Scots Pine",
            imageUrl: "https://plus.unsplash.com/premium_photo-1667419102563-e212046376c4?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            favorite: false,
            lastUpdated: "2025-04-10T09:15:00",
        },
    ]);

    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSpecies, setEditingSpecies] = useState(null);

    const filteredSpecies = speciesList.filter((species) =>
        species.scientificName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        species.localName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const favoriteCount = speciesList.filter((s) => s.favorite).length;

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    const downloadJsonAsCsv = (jsonData, filename, includeHeaders = true) => {
        // Return early if no data
        if (!jsonData || !jsonData.length) {
          console.error('No data provided for CSV download');
          return;
        }
      
        try {
          // Get headers from the first object in the array
          const headers = Object.keys(jsonData[0]);
          
          // Create CSV rows from the JSON data
          let csvRows = [];
          
          // Add headers row if requested
          if (includeHeaders) {
            csvRows.push(headers.join(','));
          }
          
          // Add data rows
          jsonData.forEach(item => {
            const values = headers.map(header => {
              // Handle special cases (commas, quotes, undefined, null)
              const cellValue = item[header] === null || item[header] === undefined ? '' : item[header];
              const escapedValue = String(cellValue)
                .replace(/"/g, '""') // Escape double quotes with double quotes
                .replace(/\n/g, ' '); // Replace newlines with spaces
                
              // Wrap with quotes if contains comma, quote or newline
              return /[,"\n]/.test(escapedValue) ? `"${escapedValue}"` : escapedValue;
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

    const handleExport = () => {
        // Export all species data instead of just a test entry
        downloadJsonAsCsv(speciesList, 'speciesList');
    };

    const handleAddSpecies = () => {
        setEditingSpecies(null); // Clear any editing state
        setIsModalOpen(true);
    };

    const handleEditSpecies = (id) => {
        const speciesToEdit = speciesList.find((s) => s.id === id);
        if (speciesToEdit) {
            setEditingSpecies(speciesToEdit);
            setIsModalOpen(true);
        }
    };

    const handleDeleteSpecies = (id) => {
        if (window.confirm("Are you sure you want to delete this species?")) {
            setSpeciesList(speciesList.filter((s) => s.id !== id));
        }
    };

    const handleToggleFavorite = (id) => {
        setSpeciesList(
            speciesList.map((species) =>
                species.id === id
                    ? { ...species, favorite: !species.favorite, lastUpdated: new Date().toISOString() }
                    : species
            )
        );
    };

    const handleSaveSpecies = (speciesData) => {
        if (speciesData.id && speciesList.some(s => s.id === speciesData.id)) {
            // Update existing species
            setSpeciesList(
                speciesList.map((species) =>
                    species.id === speciesData.id ? speciesData : species
                )
            );
        } else {
            // Add new species
            setSpeciesList([...speciesList, speciesData]);
        }
    };

    return (
        <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-12">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-2 text-gray-600">
                        <h2 className="text-md font-semibold">
                            Total: {speciesList.length}
                        </h2>
                        <h2 className="text-md font-semibold">
                            Favorite: {favoriteCount}
                        </h2>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search species..."
                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none"
                            />
                            <Search
                                size={18}
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                            />
                        </div>

                        <button
                            onClick={handleAddSpecies}
                            className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition"
                        >
                            <PlusCircle size={18} />
                            Add Species
                        </button>
                        <button
                            onClick={handleExport}
                            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition"
                        >
                            <Download size={18} />
                            Export
                        </button>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredSpecies.map((species) => (
                        <motion.div
                            key={species.id}
                            whileHover={{ scale: 1.02 }}
                            className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                        >
                            <div className="h-44 bg-gray-100 relative flex items-center justify-center">
                                {species.imageUrl ? (
                                    <img
                                        src={species.imageUrl}
                                        alt={species.scientificName}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <Leaf size={56} className="text-green-500" />
                                )}
                                <button 
                                    className="absolute top-2 right-2"
                                    onClick={() => handleToggleFavorite(species.id)}
                                >
                                    {species.favorite ? (
                                        <Heart size={22} fill="#ef4444" className="text-red-500" />
                                    ) : (
                                        <Heart size={22} className="text-white shadow-sm" />
                                    )}
                                </button>
                            </div>
                            <div className="p-4 space-y-2">
                                <h3 className="text-lg font-semibold italic text-gray-800">
                                    {species.scientificName}
                                </h3>
                                <p className="text-sm text-gray-600">{species.localName}</p>
                                <div className="flex justify-between items-center mt-4">
                                    <div className="flex">
                                        <button
                                            onClick={() => handleEditSpecies(species.id)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                                        >
                                            <Edit2 size={18} color='#262626'/>
                                        </button>
                                        <button
                                            onClick={() => handleDeleteSpecies(species.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <span className="text-xs text-gray-400">
                                        {formatDate(species.lastUpdated)}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Empty State */}
                {filteredSpecies.length === 0 && (
                    <div className="text-center py-12">
                        <Leaf size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700">
                            No species found
                        </h3>
                        <p className="text-gray-500 mt-2">
                            Try adjusting your search or add a new species
                        </p>
                    </div>
                )}
            </div>

            {/* Species Modal */}
            <SpeciesModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveSpecies}
                editingSpecies={editingSpecies}
            />
        </div>
    );
};

export default SpeciesManagementPage;