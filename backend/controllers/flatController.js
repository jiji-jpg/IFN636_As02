//view
const Flat = require('../models/Flat');

const getFlats = async (req,res) => {
    try {
        const flats = await Flat.find({ userId: req.user.id });
        res.json(flats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//add
const addFlat = async (req, res) => {
  const { title, description, inspectionDate } = req.body;
  console.log('Add Flat called with:', { title, description, inspectionDate, userId: req.user?.id });
  console.log('Files received:', req.files); // Debug log

  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  try {
    // Handle uploaded images
    const images = req.files ? req.files.map(file => file.filename) : [];
    console.log('Images to save:', images); // Debug log
    
    const flat = await Flat.create({ 
      userId: req.user.id, 
      title, 
      description, 
      inspectionDate,
      images // Add images to the flat
    });
    console.log('Flat created:', flat);
    res.status(201).json(flat);
  } catch (error) {
    console.error('Error creating flat:', error);
    res.status(500).json({ message: error.message });
  }
};

//update
const updateFlat = async (req,res) => {
  const { title, description, vacant, inspectionDate } = req.body;
  console.log('Update Flat called with:', { title, description, vacant, inspectionDate });
  console.log('Files received for update:', req.files); // Debug log
  
  try {
    const flat = await Flat.findById(req.params.id);
    if (!flat) return res.status(404).json({ message: 'Flat not found' });
    
    // Update text fields
    flat.title = title || flat.title;
    flat.description = description || flat.description;
    flat.vacant = vacant ?? flat.vacant;
    flat.inspectionDate = inspectionDate || flat.inspectionDate;
    
    // Handle images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => file.filename);
      console.log('New images to add:', newImages); // Debug log
      
      // Option 1: Add new images to existing ones
      flat.images = [...(flat.images || []), ...newImages];
      
      // Option 2: Replace all images (uncomment if you prefer this)
      // flat.images = newImages;
    }
    
    const updatedFlat = await flat.save();
    console.log('Flat updated:', updatedFlat);
    res.json(updatedFlat);
  } catch (error) {
    console.error('Error updating flat:', error);
    res.status(500).json({ message: error.message });
  }
};

//delete
const deleteFlat = async (req,res) => {
  try {
    const flat = await Flat.findById(req.params.id);
    if (!flat) return res.status(404).json({ message: 'Flat not found' });
    
    // Optional: Delete associated image files
    // const fs = require('fs');
    // const path = require('path');
    // if (flat.images && flat.images.length > 0) {
    //   flat.images.forEach(image => {
    //     const imagePath = path.join(__dirname, '../uploads/flats', image);
    //     fs.unlink(imagePath, (err) => {
    //       if (err) console.error('Error deleting image:', err);
    //     });
    //   });
    // }
    
    await flat.remove();
    res.json({ message: 'Flat deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//delete image
const deleteImage = async (req, res) => {
  try {
    const { id, imageName } = req.params;
    console.log('Deleting image:', imageName, 'from flat:', id);
    
    const flat = await Flat.findById(id);
    if (!flat) {
      return res.status(404).json({ message: 'Flat not found' });
    }
    
    // Check if user owns this flat
    if (flat.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this image' });
    }
    
    // Remove image from flat's images array
    flat.images = flat.images.filter(img => img !== imageName);
    await flat.save();
    
    // Optional: Delete the actual file from server
    const fs = require('fs');
    const path = require('path');
    const imagePath = path.join(__dirname, '../uploads/flats', imageName);
    
    fs.unlink(imagePath, (err) => {
      if (err) {
        console.error('Error deleting image file:', err);
      } else {
        console.log('Image file deleted successfully:', imagePath);
      }
    });
    
    res.json({ message: 'Image deleted successfully', flat });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ message: error.message });
  }
};

//view all public listings (no authentication required)
const getPublicFlats = async (req, res) => {
    try {
        // Get all flats with basic user info (without sensitive data)
        const flats = await Flat.find()
            .populate('userId', 'name email') // Include user name and email only
            .sort({ createdAt: -1 }); // Show newest first
        res.json(flats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getFlats, addFlat, updateFlat, deleteFlat, deleteImage, getPublicFlats };