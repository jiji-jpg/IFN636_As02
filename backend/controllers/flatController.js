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
const deleteTask = async (req,res) => {
try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    await task.remove();
    res.json({ message: 'Task deleted' });
} catch (error) {
    res.status(500).json({ message: error.message });
}
};

module.exports = { getTasks, addTask, updateTask, deleteTask };