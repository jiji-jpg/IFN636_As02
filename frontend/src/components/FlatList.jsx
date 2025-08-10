import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';

const FlatList = ({ flats, setFlats, setEditingFlat }) => {
  const { user } = useAuth();

  const handleDelete = async (flatId) => {
    try {
      await axiosInstance.delete(`/api/flats/${flatId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setFlats(flats.filter((flat) => flat._id !== flatId));
    } catch (error) {
      alert('Failed to delete flat.');
    }
  };

  // Function to get image URL - adjust this based on your backend setup
  const getImageUrl = (imagePath) => {
    // If your backend serves images from /uploads route
    return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/uploads/flats/${imagePath}`;
    // Alternative if images are served from /api/images route:
    // return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/images/${imagePath}`;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">My Flat Listings</h1>
      {flats.map((flat) => (
        <div key={flat._id} className="bg-gray-100 p-4 mb-4 rounded shadow">
          <h2 className="font-bold text-lg mb-2">{flat.title}</h2>
          <p className="mb-2">{flat.description}</p>
          <p className="text-sm text-gray-500 mb-3">
            Inspection Date: {new Date(flat.inspectionDate).toLocaleDateString()}
          </p>
          
          {/* Image Gallery */}
          {flat.images && flat.images.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Property Images ({flat.images.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {flat.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={getImageUrl(image)}
                      alt={`${flat.title} - View ${index + 1}`}
                      className="w-full h-24 object-cover rounded border hover:shadow-md transition-shadow cursor-pointer"
                      onError={(e) => {
                        // Handle broken images
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxIDlWN0MxOSA1IDEyIDUgMTIgNUM5IDUgMyA1IDMgN1Y5QzMgMTEgMyAxNyAzIDE5QzMgMjEgOSAyMSAxMiAyMUMxNSAyMSAyMSAyMSAyMSAxOUMyMSAxNyAyMSAxMSAyMSA5WiIgc3Ryb2tlPSIjY2NjIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8cGF0aCBkPSJNOSA5SDE1IiBzdHJva2U9IiNjY2MiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjwvcGF0aD4KPC9zdmc+';
                        e.target.alt = 'Image not found';
                        e.target.className += ' opacity-50';
                      }}
                      onClick={() => {
                        // Optional: Open image in modal or new tab
                        window.open(getImageUrl(image), '_blank');
                      }}
                    />
                    {/* Optional: Image overlay with index */}
                    <div className="absolute top-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* No images message */}
          {(!flat.images || flat.images.length === 0) && (
            <div className="mb-4 p-3 bg-gray-200 rounded text-center text-gray-500 text-sm">
              No images uploaded for this property
            </div>
          )}
          
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => setEditingFlat(flat)}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(flat._id)}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
      
      {flats.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No flat listings found. Create your first listing above!</p>
        </div>
      )}
    </div>
  );
};

export default FlatList;