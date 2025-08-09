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
const addFlat = async (req,res) => {
    const { title, description, deadline } = req.body;
        try {
            const flat = await Flat.create({ userId: req.user.id, title, description, deadline });
            res.status(201).json(flat);
        } catch (error) {
    res.status(500).json({ message: error.message });
    }
};

//update
const updateFlat = async (req,res) => {
const { title, description, vacant, inspectionDate } = req.body;
try {
    const flat = await Flat.findById(req.params.id);
    if (!flat) return res.status(404).json({ message: 'Flat not found' });
    flat.title = title || flat.title;
    flat.description = description || flat.description;
    flat.vacant = vacant ?? flat.vacant;
    flat.inspectionDate = inspectionDate || flat.inspectionDate;
    const updatedFlat = await flat.save();
    res.json(updatedFlat);
} catch (error) {
res.status(500).json({ message: error.message });
}
};

//delete
const deleteFlat = async (req,res) => {
try {
    const flat = await Flat.findById(req.params.id);
    if (!flat) return res.status(404).json({ message: 'Flat not found' });
    
    await flat.remove();
    res.json({ message: 'Flat deleted' });
} catch (error) {
    res.status(500).json({ message: error.message });
}
};

module.exports = { getFlats, addFlat, updateFlat, deleteFlat };