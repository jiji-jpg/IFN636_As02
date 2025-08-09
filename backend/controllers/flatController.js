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
const updateTask = async (req,res) => {
const { title, description, completed, deadline } = req.body;
try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    task.title = title || task.title;
    task.description = description || task.description;
    task.completed = completed ?? task.completed;
    task.deadline = deadline || task.deadline;
    const updatedTask = await task.save();
    res.json(updatedTask);
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