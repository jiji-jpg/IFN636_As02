import { useState, useEffect } from 'react';
import axiosInstance from '../axiosConfig';

const Listing = () => {
  const [flats, setFlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPublicFlats = async () => {
      try {
        setLoading(true);
        const apiUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/flats/public`;
        console.log('Calling API URL:', apiUrl); // Debug log
        
        const response = await axiosInstance.get('/api/flats/public');
        console.log('Public flats response:', response.data); // Debug log
        setFlats(response.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching public flats:', error);
        console.error('Error details:', error.response?.data); // More detailed error
        console.error('Error status:', error.response?.status); // HTTP status
        setError(`Failed to fetch property listings: ${error.response?.status || error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicFlats();
  }, []);

  // Function to get image URL
  const getImageUrl = (imagePath) => {
    return `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/uploads/flats/${imagePath}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <p className="text-lg">Loading property listings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <p className="text-red-500 text-lg">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Property Listings</h1>
        <p className="text-gray-600">Discover available properties for rent</p>
      </div>
      
      {flats.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-lg">No property listings available at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {flats.map((flat) => (
            <div key={flat._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {/* Property Images */}
              {flat.images && flat.images.length > 0 ? (
                <div className="relative">
                  <img
                    src={getImageUrl(flat.images[0])} // Show first image as main
                    alt={flat.title}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxIDlWN0MxOSA1IDEyIDUgMTIgNUM5IDUgMyA1IDMgN1Y5QzMgMTEgMyAxNyAzIDE5QzMgMjEgOSAyMSAxMiAyMUMxNSAyMSAyMSAyMSAyMSAxOUMyMSAxNyAyMSAxMSAyMSA5WiIgc3Ryb2tlPSIjY2NjIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8cGF0aCBkPSJNOSA5SDE1IiBzdHJva2U9IiNjY2MiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjwvcGF0aD4KPC9zdmc+';
                      e.target.alt = 'Property image';
                    }}
                  />
                  {flat.images.length > 1 && (
                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      +{flat.images.length - 1} more
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">No images available</span>
                </div>
              )}
              
              {/* Property Details */}
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2">{flat.title}</h2>
                
                {flat.description && (
                  <p className="text-gray-600 mb-3 line-clamp-2">{flat.description}</p>
                )}
                
                {flat.inspectionDate && (
                  <div className="mb-3">
                    <span className="text-sm font-medium text-blue-600">
                      Inspection: {new Date(flat.inspectionDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                
                {/* Contact Information */}
                {flat.userId && (
                  <div className="border-t pt-3">
                    <p className="text-sm text-gray-500">Listed by:</p>
                    <p className="font-medium">{flat.userId.name || 'Property Owner'}</p>
                    {flat.userId.email && (
                      <a 
                        href={`mailto:${flat.userId.email}?subject=Inquiry about ${flat.title}`}
                        className="text-blue-500 hover:text-blue-700 text-sm"
                      >
                        Contact Owner
                      </a>
                    )}
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="mt-4 flex gap-2">
                  <button 
                    onClick={() => {
                      // You can add a modal or detailed view here
                      alert('Detailed view coming soon!');
                    }}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors"
                  >
                    View Details
                  </button>
                  
                  {flat.images && flat.images.length > 1 && (
                    <button 
                      onClick={() => {
                        // You can add an image gallery modal here
                        alert(`This property has ${flat.images.length} photos. Gallery view coming soon!`);
                      }}
                      className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors"
                    >
                      Gallery ({flat.images.length})
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Stats */}
      {flats.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-gray-500">
            Showing {flats.length} propert{flats.length === 1 ? 'y' : 'ies'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Listing;