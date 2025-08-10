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

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">My Flat Listings</h1>
      {flats.map((flat) => (
        <div key={flat._id} className="bg-gray-100 p-4 mb-4 rounded shadow">
          <h2 className="font-bold">{flat.title}</h2>
          <p>{flat.description}</p>
          <p className="text-sm text-gray-500">InspectionDate: {new Date(flat.inspectionDate).toLocaleDateString()}</p>
          <div className="mt-2">
            <button
              onClick={() => setEditingFlat(flat)}
              className="mr-2 bg-yellow-500 text-white px-4 py-2 rounded"
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(flat._id)}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FlatList;
