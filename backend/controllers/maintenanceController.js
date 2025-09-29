const Flat = require('../models/Flat');
const fs = require('fs');
const path = require('path');

class ValidationStrategy {
    validate(data) {
        throw new Error('Must implement validate method');
    }
}

class MaintenanceValidationStrategy extends ValidationStrategy {
    validate(data) {
        if (!data.issueType) return 'Issue type is required';
        if (!data.description) return 'Description is required';
        if (!data.priority) return 'Priority is required';
        if (!data.contractorId) return 'Contractor selection is required';
        return null;
    }
}

class MaintenanceEventNotifier {
    notifyMaintenanceReported(maintenanceData) {
        console.log('Maintenance issue reported:', maintenanceData);
    }

    notifyMaintenanceUpdated(maintenanceData) {
        console.log('Maintenance issue updated:', maintenanceData);
    }

    notifyMaintenanceDeleted(maintenanceData) {
        console.log('Maintenance issue deleted:', maintenanceData);
    }

    notifyContractorAssigned(contractorData) {
        console.log('Contractor assigned:', contractorData);
    }
}

class MaintenanceFileManager {
    processUploadedImages(files) {
        return files ? files.map(file => file.filename) : [];
    }

    deleteMaintenanceImages(imageNames) {
        imageNames.forEach(imageName => {
            const imagePath = path.join(__dirname, '../uploads/maintenance', imageName);
            fs.unlink(imagePath, (err) => {
                if (err) {
                    console.error('Error deleting maintenance image file:', err);
                } else {
                    console.log('Maintenance image file deleted successfully:', imagePath);
                }
            });
        });
    }
}

class MaintenanceDataAdapter {
    static adaptMaintenanceData(rawData) {
        return {
            issueType: rawData.issueType,
            description: rawData.description,
            priority: rawData.priority,
            contractorId: rawData.contractorId,
            estimatedCost: rawData.estimatedCost ? Number(rawData.estimatedCost) : null,
            scheduledDate: rawData.scheduledDate || null,
            images: rawData.images || []
        };
    }
}

class MaintenancePrototype {
    constructor(data) {
        this.issueType = data.issueType;
        this.description = data.description;
        this.priority = data.priority;
        this.contractorId = data.contractorId;
        this.status = data.status || 'reported';
        this.estimatedCost = data.estimatedCost;
        this.scheduledDate = data.scheduledDate;
        this.images = data.images || [];
        this.reportedDate = data.reportedDate || new Date();
    }

    clone() {
        return new MaintenancePrototype(this);
    }

    updateFields(newData) {
        Object.keys(newData).forEach(key => {
            if (newData[key] !== undefined) {
                this[key] = newData[key];
            }
        });
    }
}

class ContractorService {
    static instance = null;
    
    static getInstance() {
        if (!ContractorService.instance) {
            ContractorService.instance = new ContractorService();
        }
        return ContractorService.instance;
    }

    getContractors() {
        return [
            { id: '1', name: 'ABC Plumbing Services', specialization: 'plumbing', phone: '+1234567890', email: 'contact@abcplumbing.com' },
            { id: '2', name: 'Quick Fix Electricians', specialization: 'electrical', phone: '+1234567891', email: 'info@quickfixelectric.com' },
            { id: '3', name: 'Elite Carpentry Works', specialization: 'carpentry', phone: '+1234567892', email: 'hello@elitecarpentry.com' },
            { id: '4', name: 'ProClean Maintenance', specialization: 'cleaning', phone: '+1234567893', email: 'service@proclean.com' },
            { id: '5', name: 'AllFix General Services', specialization: 'general', phone: '+1234567894', email: 'support@allfix.com' }
        ];
    }

    getContractorById(id) {
        return this.getContractors().find(contractor => contractor.id === id);
    }
}

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

class BaseMaintenanceController {
    constructor() {
        this.fileManager = new MaintenanceFileManager();
        this.eventNotifier = new MaintenanceEventNotifier();
        this.maintenanceValidator = new MaintenanceValidationStrategy();
        this.contractorService = ContractorService.getInstance();
    }

    validateInput(data, type = 'maintenance') {
        return this.maintenanceValidator.validate(data);
    }

    handleError(res, error, operation) {
        console.error(`Error in ${operation}:`, error);
        return res.status(500).json({ message: error.message });
    }
}

class MaintenanceController extends BaseMaintenanceController {
    constructor() {
        super();
    }

    validateInput(data, type = 'maintenance') {
        const error = super.validateInput(data, type);
        if (error) {
            console.log(`Validation failed for ${type}:`, error);
        }
        return error;
    }

    async executeReportMaintenance(req, res) {
        try {
            const { flatId } = req.params;
            const { issueType, description, priority, contractorId, estimatedCost, scheduledDate } = req.body;
            
            console.log('Report Maintenance called with:', { flatId, issueType, description, priority, contractorId });
            console.log('Files received for maintenance:', req.files);
            
            const validationError = this.validateInput(req.body, 'maintenance');
            if (validationError) {
                return res.status(400).json({ message: validationError });
            }
            
            const authResult = await AuthorizationProxy.validateFlatOwnership(flatId, req.user.id);
            if (!authResult.authorized) {
                return res.status(authResult.statusCode).json({ message: authResult.error });
            }

            const flat = authResult.flat;
            
            // Verify contractor exists
            const contractor = this.contractorService.getContractorById(contractorId);
            if (!contractor) {
                return res.status(400).json({ message: 'Invalid contractor selected' });
            }
            
            const images = this.fileManager.processUploadedImages(req.files);
            const maintenanceData = MaintenanceDataAdapter.adaptMaintenanceData({
                ...req.body,
                images
            });
            
            const maintenanceReport = new MaintenancePrototype({
                id: Date.now().toString(),
                ...maintenanceData,
                contractorName: contractor.name,
                contractorPhone: contractor.phone,
                reportedDate: new Date(),
                status: 'reported'
            });
            
            if (!flat.maintenanceReports) flat.maintenanceReports = [];
            flat.maintenanceReports.push(maintenanceReport);
            
            await flat.save();
            this.eventNotifier.notifyMaintenanceReported(maintenanceReport);
            this.eventNotifier.notifyContractorAssigned(contractor);
            
            res.status(201).json({
                message: 'Maintenance issue reported successfully',
                maintenanceReport: maintenanceReport,
                contractor: contractor,
                flat: flat
            });
        } catch (error) {
            console.error('Error reporting maintenance:', error);
            res.status(500).json({ message: error.message });
        }
    }

async executeGetMaintenanceReports(req, res) {
    try {
        const { flatId } = req.params;
        
        const authResult = await AuthorizationProxy.validateFlatOwnership(flatId, req.user.id);
        if (!authResult.authorized) {
            return res.status(authResult.statusCode).json({ message: authResult.error });
        }

        const flat = authResult.flat;
        const maintenanceReports = flat.maintenanceReports || [];
        
        // ADD THIS TO SEE WHAT IDs ARE IN THE DATABASE
        console.log('Raw maintenance reports:', JSON.stringify(maintenanceReports, null, 2));
        
        // Enhance reports with contractor details
        const enhancedReports = maintenanceReports.map(report => {
            const contractor = this.contractorService.getContractorById(report.contractorId);
            return {
                ...report.toObject(), // Convert Mongoose document to plain object
                contractorDetails: contractor
            };
        });
        
        res.json({
            message: 'Maintenance reports retrieved successfully',
            flatId: flat._id,
            flatTitle: flat.title,
            reports: enhancedReports.sort((a, b) => new Date(b.reportedDate) - new Date(a.reportedDate))
        });
    } catch (error) {
        console.error('Error getting maintenance reports:', error);
        res.status(500).json({ message: error.message });
    }
}

    async executeUpdateMaintenanceStatus(req, res) {
    try {
        const { flatId, reportId } = req.params;
        const { status, actualCost, completionDate, notes } = req.body;
        
        console.log('Update Maintenance Status called with:', { flatId, reportId, status, actualCost });
        
        const authResult = await AuthorizationProxy.validateFlatOwnership(flatId, req.user.id);
        if (!authResult.authorized) {
            return res.status(authResult.statusCode).json({ message: authResult.error });
        }

        const flat = authResult.flat;
        
        if (!flat.maintenanceReports) {
            return res.status(404).json({ message: 'No maintenance reports found for this flat' });
        }
        
        console.log('Looking for report with id:', reportId);
        console.log('Available reports:', flat.maintenanceReports.map(r => ({ id: r.id, _id: r._id })));
        
        // Try to find by custom id first, then by _id
        const reportIndex = flat.maintenanceReports.findIndex(report => 
            report.id === reportId || report._id.toString() === reportId
        );
        
        if (reportIndex === -1) {
            return res.status(404).json({ message: 'Maintenance report not found' });
        }
        
        const report = flat.maintenanceReports[reportIndex];
        
        if (status) report.status = status;
        if (actualCost !== undefined) report.actualCost = Number(actualCost);
        if (completionDate) report.completionDate = completionDate;
        if (notes) report.notes = notes;
        report.lastUpdated = new Date();
        
        await flat.save();
        this.eventNotifier.notifyMaintenanceUpdated(report);
        
        res.json({
            message: 'Maintenance status updated successfully',
            report: report,
            flat: flat
        });
    } catch (error) {
        console.error('Error updating maintenance status:', error);
        res.status(500).json({ message: error.message });
    }
}

    async executeGetAllMaintenanceReports(req, res) {
        try {
            const flats = await Flat.find({ 
                userId: req.user.id,
                maintenanceReports: { $exists: true, $ne: [] }
            });
            
            const allReports = [];
            
            flats.forEach(flat => {
                if (flat.maintenanceReports && flat.maintenanceReports.length > 0) {
                    flat.maintenanceReports.forEach(report => {
                        const contractor = this.contractorService.getContractorById(report.contractorId);
                        allReports.push({
                            ...report,
                            flatId: flat._id,
                            flatTitle: flat.title,
                            contractorDetails: contractor
                        });
                    });
                }
            });
            
            res.json({
                message: 'All maintenance reports retrieved successfully',
                totalReports: allReports.length,
                reports: allReports.sort((a, b) => new Date(b.reportedDate) - new Date(a.reportedDate))
            });
        } catch (error) {
            console.error('Error getting all maintenance reports:', error);
            res.status(500).json({ message: error.message });
        }
    }

    async executeGetContractors(req, res) {
        try {
            const contractors = this.contractorService.getContractors();
            
            res.json({
                message: 'Contractors retrieved successfully',
                contractors: contractors
            });
        } catch (error) {
            console.error('Error getting contractors:', error);
            res.status(500).json({ message: error.message });
        }
    }

    async executeDeleteMaintenanceReport(req, res) {
    try {
        const { flatId, reportId } = req.params;
        
        console.log('Delete Maintenance Report called with:', { flatId, reportId });
        
        const authResult = await AuthorizationProxy.validateFlatOwnership(flatId, req.user.id);
        if (!authResult.authorized) {
            return res.status(authResult.statusCode).json({ message: authResult.error });
        }

        const flat = authResult.flat;
        
        if (!flat.maintenanceReports || flat.maintenanceReports.length === 0) {
            return res.status(404).json({ message: 'No maintenance reports found for this flat' });
        }
        
        console.log('Looking for report with id:', reportId);
        console.log('Available reports:', flat.maintenanceReports.map(r => ({ id: r.id, _id: r._id })));
        
        // Try to find by custom id first, then by _id
        const reportIndex = flat.maintenanceReports.findIndex(report => 
            report.id === reportId || report._id.toString() === reportId
        );
        
        if (reportIndex === -1) {
            return res.status(404).json({ message: 'Maintenance report not found' });
        }
        
        const report = flat.maintenanceReports[reportIndex];
        
        // Delete associated images
        if (report.images && report.images.length > 0) {
            this.fileManager.deleteMaintenanceImages(report.images);
        }
        
        flat.maintenanceReports.splice(reportIndex, 1);
        await flat.save();
        
        this.eventNotifier.notifyMaintenanceDeleted(report);
        
        res.json({
            message: 'Maintenance report deleted successfully',
            flat: flat
        });
    } catch (error) {
        console.error('Error deleting maintenance report:', error);
        res.status(500).json({ message: error.message });
    }
}
}

const maintenanceController = new MaintenanceController();

const reportMaintenance = async (req, res) => {
    await maintenanceController.executeReportMaintenance(req, res);
};

const getMaintenanceReports = async (req, res) => {
    await maintenanceController.executeGetMaintenanceReports(req, res);
};

const updateMaintenanceStatus = async (req, res) => {
    await maintenanceController.executeUpdateMaintenanceStatus(req, res);
};

const getAllMaintenanceReports = async (req, res) => {
    await maintenanceController.executeGetAllMaintenanceReports(req, res);
};

const getContractors = async (req, res) => {
    await maintenanceController.executeGetContractors(req, res);
};

const deleteMaintenanceReport = async (req, res) => {
    await maintenanceController.executeDeleteMaintenanceReport(req, res);
};

module.exports = {
    reportMaintenance,
    getMaintenanceReports,
    updateMaintenanceStatus,
    getAllMaintenanceReports,
    getContractors,
    deleteMaintenanceReport
};