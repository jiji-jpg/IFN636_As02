const Flat = require('../models/Flat');
const fs = require('fs');
const path = require('path');

// ================== DESIGN PATTERNS START HERE ==================

// ================== STRATEGY PATTERN ==================
class ValidationStrategy {
    validate(data) {
        throw new Error('Must implement validate method');
    }
}

class FlatValidationStrategy extends ValidationStrategy {
    validate(data) {
        return !data.title ? 'Title is required' : null;
    }
}

class TenantValidationStrategy extends ValidationStrategy {
    validate(data) {
        if (!data.name) return 'Tenant name is required';
        if (!data.email) return 'Email is required';
        if (!data.phone) return 'Phone number is required';
        if (!data.moveInDate) return 'Move-in date is required';
        if (!data.rentAmount) return 'Monthly rent is required';
        return null;
    }
}

// ================== OBSERVER PATTERN ==================
class EventNotifier {
    notifyFlatCreated(flatData) {
        console.log('Flat created:', flatData);
    }

    notifyFlatUpdated(flatData) {
        console.log('Flat updated:', flatData);
    }

    notifyTenantAdded(tenantData) {
        console.log('Tenant added to flat:', tenantData);
    }

    notifyTenantUpdated(tenantData) {
        console.log('Tenant updated:', tenantData);
    }

    notifyTenantRemoved(tenantData) {
        console.log('Tenant removed from flat:', tenantData);
    }
}

// ================== FACADE PATTERN ==================
class FileManager {
    processUploadedImages(files) {
        return files ? files.map(file => file.filename) : [];
    }

    deleteImageFile(imageName) {
        const imagePath = path.join(__dirname, '../uploads/flats', imageName);
        fs.unlink(imagePath, (err) => {
            if (err) {
                console.error('Error deleting image file:', err);
            } else {
                console.log('Image file deleted successfully:', imagePath);
            }
        });
    }
}

// ================== ADAPTER PATTERN ==================
class TenantDataAdapter {
    static adaptTenantData(rawData) {
        return {
            name: rawData.name,
            email: rawData.email,
            phone: rawData.phone,
            moveInDate: rawData.moveInDate,
            rentAmount: rawData.rentAmount ? Number(rawData.rentAmount) : null
        };
    }
}

// ================== PROTOTYPE PATTERN ==================
class TenantPrototype {
    constructor(data) {
        this.name = data.name;
        this.email = data.email;
        this.phone = data.phone;
        this.moveInDate = data.moveInDate;
        this.rentAmount = data.rentAmount;
    }

    clone() {
        return new TenantPrototype(this);
    }

    updateFields(newData) {
        if (newData.name !== undefined) this.name = newData.name;
        if (newData.email !== undefined) this.email = newData.email;
        if (newData.phone !== undefined) this.phone = newData.phone;
        if (newData.moveInDate !== undefined) this.moveInDate = newData.moveInDate;
        if (newData.rentAmount !== undefined) this.rentAmount = newData.rentAmount ? Number(newData.rentAmount) : null;
    }
}

// ================== PROXY PATTERN ==================
class AuthorizationProxy {
    static async validateFlatOwnership(flatId, userId) {
        const flat = await Flat.findById(flatId);
        if (!flat) {
            return { authorized: false, flat: null, error: 'Flat not found', statusCode: 404 };
        }
        
        if (flat.userId.toString() !== userId) {
            return { authorized: false, flat: null, error: 'Not authorized', statusCode: 403 };
        }
        
        return { authorized: true, flat, error: null };
    }
}

// ================== BASE CONTROLLER CLASS (INHERITANCE) ==================
class BaseController {
    constructor() {
        this.fileManager = new FileManager();
        this.flatValidator = new FlatValidationStrategy();
        this.tenantValidator = new TenantValidationStrategy();
    }

    // Polymorphism - can be overridden in derived classes
    validateInput(data, type = 'flat') {
        if (type === 'tenant') {
            return this.tenantValidator.validate(data);
        }
        return this.flatValidator.validate(data);
    }

    // Template method for common error handling
    handleError(res, error, operation) {
        console.error(`Error in ${operation}:`, error);
        return res.status(500).json({ message: error.message });
    }
}

// ================== FLAT CONTROLLER (INHERITANCE + ENCAPSULATION) ==================
class FlatController extends BaseController {
    constructor() {
        super();
    }

    // Polymorphism - method overriding
    validateInput(data, type = 'flat') {
        const error = super.validateInput(data, type);
        if (error) {
            console.log(`Validation failed for ${type}:`, error);
        }
        return error;
    }

    async executeGetFlats(req, res) {
        try {
            const flats = await Flat.find({ userId: req.user.id });
            res.json(flats);
        } catch (error) {
            console.error('Error getting flats:', error);
            res.status(500).json({ message: error.message });
        }
    }

    async executeAddFlat(req, res) {
        try {
            const { title, description, inspectionDate } = req.body;
            console.log('Add Flat called with:', { title, description, inspectionDate, userId: req.user?.id });
            console.log('Files received:', req.files);

            const validationError = this.validateInput(req.body);
            if (validationError) {
                return res.status(400).json({ message: validationError });
            }

            const images = this.fileManager.processUploadedImages(req.files);
            console.log('Images to save:', images);
            
            const flat = await Flat.create({ 
                userId: req.user.id, 
                title, 
                description, 
                inspectionDate,
                images 
            });
            
            console.log('Flat created:', flat);
            res.status(201).json(flat);
        } catch (error) {
            console.error('Error creating flat:', error);
            res.status(500).json({ message: error.message });
        }
    }

    async executeUpdateFlat(req, res) {
        try {
            const { title, description, vacant, inspectionDate, tenantDetails } = req.body;
            console.log('Update Flat called with:', { title, description, vacant, inspectionDate, tenantDetails });
            console.log('Files received for update:', req.files);
            
            const authResult = await AuthorizationProxy.validateFlatOwnership(req.params.id, req.user.id);
            if (!authResult.authorized) {
                return res.status(authResult.statusCode).json({ message: authResult.error });
            }

            const flat = authResult.flat;
            
            // Update text fields
            flat.title = title || flat.title;
            flat.description = description || flat.description;
            flat.vacant = vacant ?? flat.vacant;
            flat.inspectionDate = inspectionDate || flat.inspectionDate;
            
            // Handle tenant details
            if (tenantDetails !== undefined) {
                flat.tenantDetails = tenantDetails;
            }
            
            // Handle images
            if (req.files && req.files.length > 0) {
                const newImages = this.fileManager.processUploadedImages(req.files);
                console.log('New images to add:', newImages);
                flat.images = [...(flat.images || []), ...newImages];
            }
            
            const updatedFlat = await flat.save();
            console.log('Flat updated:', updatedFlat);
            res.json(updatedFlat);
        } catch (error) {
            console.error('Error updating flat:', error);
            res.status(500).json({ message: error.message });
        }
    }

    async executeDeleteFlat(req, res) {
        try {
            const authResult = await AuthorizationProxy.validateFlatOwnership(req.params.id, req.user.id);
            if (!authResult.authorized) {
                return res.status(authResult.statusCode).json({ message: authResult.error });
            }
            
            await authResult.flat.remove();
            res.json({ message: 'Flat deleted' });
        } catch (error) {
            console.error('Error deleting flat:', error);
            res.status(500).json({ message: error.message });
        }
    }

    async executeDeleteImage(req, res) {
        try {
            const { id, imageName } = req.params;
            console.log('Deleting image:', imageName, 'from flat:', id);
            
            const authResult = await AuthorizationProxy.validateFlatOwnership(id, req.user.id);
            if (!authResult.authorized) {
                return res.status(authResult.statusCode).json({ message: authResult.error });
            }

            const flat = authResult.flat;
            
            // Remove image from flat's images array
            flat.images = flat.images.filter(img => img !== imageName);
            await flat.save();
            
            this.fileManager.deleteImageFile(imageName);
            
            res.json({ message: 'Image deleted successfully', flat });
        } catch (error) {
            console.error('Error deleting image:', error);
            res.status(500).json({ message: error.message });
        }
    }

    async executeGetPublicFlats(req, res) {
        try {
            const flats = await Flat.find()
                .populate('userId', 'name email') 
                .sort({ createdAt: -1 }); 
            res.json(flats);
        } catch (error) {
            console.error('Error getting public flats:', error);
            res.status(500).json({ message: error.message });
        }
    }

    async executeAddTenant(req, res) {
        try {
            const { flatId } = req.params;
            const { name, email, phone, moveInDate, rentAmount } = req.body;
            
            console.log('Add Tenant called with:', { flatId, name, email, phone, moveInDate, rentAmount });
            
            const validationError = this.validateInput(req.body, 'tenant');
            if (validationError) {
                return res.status(400).json({ message: validationError });
            }
            
            const authResult = await AuthorizationProxy.validateFlatOwnership(flatId, req.user.id);
            if (!authResult.authorized) {
                return res.status(authResult.statusCode).json({ message: authResult.error });
            }

            const flat = authResult.flat;
            
            // Check if flat already has a tenant
            if (!flat.vacant && flat.tenantDetails) {
                return res.status(400).json({ message: 'Flat already has a tenant. Update existing tenant or mark flat as vacant first.' });
            }

            // Back to your original simple approach
            const tenantData = {
                name,
                email,
                phone,
                moveInDate,
                rentAmount: rentAmount ? Number(rentAmount) : null
            };
            
            flat.tenantDetails = tenantData;
            flat.vacant = false;
            
            const updatedFlat = await flat.save();
            console.log('Tenant added to flat:', updatedFlat);
            
            res.status(201).json({
                message: 'Tenant added successfully',
                flat: updatedFlat,
                tenant: tenantData
            });
        } catch (error) {
            console.error('Error adding tenant:', error);
            res.status(500).json({ message: error.message });
        }
    }

    async executeGetTenant(req, res) {
        try {
            const { flatId } = req.params;
            
            const authResult = await AuthorizationProxy.validateFlatOwnership(flatId, req.user.id);
            if (!authResult.authorized) {
                return res.status(authResult.statusCode).json({ message: authResult.error });
            }

            const flat = authResult.flat;
            
            if (!flat.tenantDetails) {
                return res.status(404).json({ message: 'No tenant found for this flat' });
            }
            
            res.json({
                flatId: flat._id,
                flatTitle: flat.title,
                tenant: flat.tenantDetails,
                vacant: flat.vacant
            });
        } catch (error) {
            console.error('Error getting tenant:', error);
            res.status(500).json({ message: error.message });
        }
    }

    async executeUpdateTenant(req, res) {
        try {
            const { flatId } = req.params;
            const { name, email, phone, moveInDate, rentAmount } = req.body;
            
            console.log('Update Tenant called with:', { flatId, name, email, phone, moveInDate, rentAmount });
            
            const authResult = await AuthorizationProxy.validateFlatOwnership(flatId, req.user.id);
            if (!authResult.authorized) {
                return res.status(authResult.statusCode).json({ message: authResult.error });
            }

            const flat = authResult.flat;
            
            if (!flat.tenantDetails) {
                return res.status(404).json({ message: 'No tenant found for this flat to update' });
            }
            
            // Back to your original approach - direct field updates
            if (name !== undefined) flat.tenantDetails.name = name;
            if (email !== undefined) flat.tenantDetails.email = email;
            if (phone !== undefined) flat.tenantDetails.phone = phone;
            if (moveInDate !== undefined) flat.tenantDetails.moveInDate = moveInDate;
            if (rentAmount !== undefined) flat.tenantDetails.rentAmount = rentAmount ? Number(rentAmount) : null;
            
            const updatedFlat = await flat.save();
            console.log('Tenant updated:', updatedFlat.tenantDetails);
            
            res.json({
                message: 'Tenant updated successfully',
                flat: updatedFlat,
                tenant: updatedFlat.tenantDetails
            });
        } catch (error) {
            console.error('Error updating tenant:', error);
            res.status(500).json({ message: error.message });
        }
    }

    async executeRemoveTenant(req, res) {
        try {
            const { flatId } = req.params;
            
            console.log('Remove Tenant called for flatId:', flatId);
            
            const authResult = await AuthorizationProxy.validateFlatOwnership(flatId, req.user.id);
            if (!authResult.authorized) {
                return res.status(authResult.statusCode).json({ message: authResult.error });
            }

            const flat = authResult.flat;
            
            if (!flat.tenantDetails) {
                return res.status(404).json({ message: 'No tenant found for this flat' });
            }
            
            const removedTenant = { ...flat.tenantDetails };
            flat.tenantDetails = null;
            flat.vacant = true;
            
            const updatedFlat = await flat.save();
            console.log('Tenant removed from flat:', updatedFlat);
            
            res.json({
                message: 'Tenant removed successfully',
                flat: updatedFlat,
                removedTenant: removedTenant
            });
        } catch (error) {
            console.error('Error removing tenant:', error);
            res.status(500).json({ message: error.message });
        }
    }

    async executeGetAllTenants(req, res) {
        try {
            const flats = await Flat.find({ 
                userId: req.user.id,
                tenantDetails: { $exists: true, $ne: null }
            });
            
            const tenants = flats.map(flat => ({
                flatId: flat._id,
                flatTitle: flat.title,
                tenant: flat.tenantDetails,
                vacant: flat.vacant
            }));
            
            res.json({
                message: 'Tenants retrieved successfully',
                count: tenants.length,
                tenants: tenants
            });
        } catch (error) {
            console.error('Error getting all tenants:', error);
            res.status(500).json({ message: error.message });
        }
    }
}

// ================== CREATE CONTROLLER INSTANCE ==================
const flatController = new FlatController();

// ================== MIDDLEWARE PATTERN ==================
const logRequest = (req, res, next) => {
    console.log(`${req.method} ${req.path} - User: ${req.user?.id}`);
    next();
};

// ================== ORIGINAL FUNCTION IMPLEMENTATIONS ==================
const getFlats = async (req, res) => {
    await flatController.executeGetFlats(req, res);
};

const addFlat = async (req, res) => {
    await flatController.executeAddFlat(req, res);
};

const updateFlat = async (req, res) => {
    await flatController.executeUpdateFlat(req, res);
};

const deleteFlat = async (req, res) => {
    await flatController.executeDeleteFlat(req, res);
};

const deleteImage = async (req, res) => {
    await flatController.executeDeleteImage(req, res);
};

const getPublicFlats = async (req, res) => {
    await flatController.executeGetPublicFlats(req, res);
};

const addTenant = async (req, res) => {
    await flatController.executeAddTenant(req, res);
};

const getTenant = async (req, res) => {
    await flatController.executeGetTenant(req, res);
};

const updateTenant = async (req, res) => {
    await flatController.executeUpdateTenant(req, res);
};

const removeTenant = async (req, res) => {
    await flatController.executeRemoveTenant(req, res);
};

const getAllTenants = async (req, res) => {
    await flatController.executeGetAllTenants(req, res);
};

module.exports = { 
    getFlats, 
    addFlat, 
    updateFlat, 
    deleteFlat, 
    deleteImage, 
    getPublicFlats,
    addTenant,
    getTenant,
    updateTenant,
    removeTenant,
    getAllTenants
};