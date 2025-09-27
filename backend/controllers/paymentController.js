const Flat = require('../models/Flat');

class InvoiceFactory {
    static createRentalInvoice(tenantData, flatData, amount, dueDate) {
        return {
            id: Date.now().toString(),
            type: 'rental',
            tenantName: tenantData.name,
            tenantEmail: tenantData.email,
            flatTitle: flatData.title,
            flatId: flatData._id,
            amount: amount,
            dueDate: dueDate,
            issueDate: new Date(),
            status: 'pending',
            description: `Monthly rent for ${flatData.title}`
        };
    }

    static createMaintenanceInvoice(flatData, amount, dueDate, description) {
        return {
            id: Date.now().toString(),
            type: 'maintenance',
            flatTitle: flatData.title,
            flatId: flatData._id,
            amount: amount,
            dueDate: dueDate,
            issueDate: new Date(),
            status: 'pending',
            description: description || 'Maintenance charges'
        };
    }
}

class ValidationStrategy {
    validate(data) {
        throw new Error('Must implement validate method');
    }
}

class PaymentValidationStrategy extends ValidationStrategy {
    validate(data) {
        if (!data.amount || data.amount <= 0) return 'Amount is required and must be greater than 0';
        if (!data.paymentDate) return 'Payment date is required';
        if (!data.paymentMethod) return 'Payment method is required';
        return null;
    }
}

class InvoiceValidationStrategy extends ValidationStrategy {
    validate(data) {
        if (!data.amount || data.amount <= 0) return 'Amount is required and must be greater than 0';
        if (!data.dueDate) return 'Due date is required';
        if (!data.type || !['rental', 'maintenance'].includes(data.type)) return 'Valid invoice type is required';
        return null;
    }
}

class PaymentEventNotifier {
    notifyInvoiceGenerated(invoiceData) {
        console.log('Invoice generated:', invoiceData);
    }

    notifyPaymentRecorded(paymentData) {
        console.log('Payment recorded:', paymentData);
    }

    notifyPaymentDeleted(paymentData) {
        console.log('Payment deleted:', paymentData);
    }

    notifyArrearsCalculated(arrearsData) {
        console.log('Arrears calculated for', arrearsData.totalFlatsInArrears, 'properties');
    }
}

class PaymentDataAdapter {
    static adaptPaymentData(rawData) {
        return {
            amount: Number(rawData.amount),
            paymentDate: rawData.paymentDate,
            paymentMethod: rawData.paymentMethod,
            description: rawData.description || '',
            invoiceId: rawData.invoiceId || null
        };
    }
}

class PaymentCommand {
    constructor(flatId, paymentData, userId) {
        this.flatId = flatId;
        this.paymentData = paymentData;
        this.userId = userId;
    }

    async execute() {
        const authResult = await AuthorizationProxy.validateFlatOwnership(this.flatId, this.userId);
        if (!authResult.authorized) {
            throw new Error(authResult.error);
        }

        const flat = authResult.flat;
        const payment = {
            id: Date.now().toString(),
            ...this.paymentData,
            recordedDate: new Date()
        };

        if (!flat.paymentLogs) flat.paymentLogs = [];
        flat.paymentLogs.push(payment);
        
        await flat.save();
        return { flat, payment };
    }
}

class InvoiceCommand {
    constructor(flatId, invoiceData, userId) {
        this.flatId = flatId;
        this.invoiceData = invoiceData;
        this.userId = userId;
    }

    async execute() {
        const authResult = await AuthorizationProxy.validateFlatOwnership(this.flatId, this.userId);
        if (!authResult.authorized) {
            throw new Error(authResult.error);
        }

        const flat = authResult.flat;
        let invoice;

        if (this.invoiceData.type === 'rental' && flat.tenantDetails) {
            invoice = InvoiceFactory.createRentalInvoice(
                flat.tenantDetails,
                flat,
                this.invoiceData.amount,
                this.invoiceData.dueDate
            );
        } else if (this.invoiceData.type === 'maintenance') {
            invoice = InvoiceFactory.createMaintenanceInvoice(
                flat,
                this.invoiceData.amount,
                this.invoiceData.dueDate,
                this.invoiceData.description
            );
        } else {
            throw new Error('Invalid invoice type or missing tenant data for rental invoice');
        }

        if (!flat.invoices) flat.invoices = [];
        flat.invoices.push(invoice);
        
        await flat.save();
        return { flat, invoice };
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

class BasePaymentController {
    constructor() {
        this.eventNotifier = new PaymentEventNotifier();
        this.paymentValidator = new PaymentValidationStrategy();
        this.invoiceValidator = new InvoiceValidationStrategy();
    }

    validateInput(data, type = 'payment') {
        if (type === 'invoice') {
            return this.invoiceValidator.validate(data);
        }
        return this.paymentValidator.validate(data);
    }

    handleError(res, error, operation) {
        console.error(`Error in ${operation}:`, error);
        return res.status(500).json({ message: error.message });
    }
}

class PaymentController extends BasePaymentController {
    constructor() {
        super();
    }

    validateInput(data, type = 'payment') {
        const error = super.validateInput(data, type);
        if (error) {
            console.log(`Validation failed for ${type}:`, error);
        }
        return error;
    }

    async executeGenerateInvoice(req, res) {
        try {
            const { flatId } = req.params;
            const { type, amount, dueDate, description } = req.body;
            
            console.log('Generate Invoice called with:', { flatId, type, amount, dueDate, description });
            
            const validationError = this.validateInput(req.body, 'invoice');
            if (validationError) {
                return res.status(400).json({ message: validationError });
            }
            
            const invoiceCommand = new InvoiceCommand(flatId, req.body, req.user.id);
            const result = await invoiceCommand.execute();
            
            this.eventNotifier.notifyInvoiceGenerated(result.invoice);
            
            res.status(201).json({
                message: 'Invoice generated successfully',
                invoice: result.invoice,
                flat: result.flat
            });
        } catch (error) {
            console.error('Error generating invoice:', error);
            res.status(500).json({ message: error.message });
        }
    }

    async executeRecordPayment(req, res) {
        try {
            const { flatId } = req.params;
            const { amount, paymentDate, paymentMethod, description, invoiceId } = req.body;
            
            console.log('Record Payment called with:', { flatId, amount, paymentDate, paymentMethod, description, invoiceId });
            
            const validationError = this.validateInput(req.body, 'payment');
            if (validationError) {
                return res.status(400).json({ message: validationError });
            }
            
            const paymentData = PaymentDataAdapter.adaptPaymentData(req.body);
            const paymentCommand = new PaymentCommand(flatId, paymentData, req.user.id);
            const result = await paymentCommand.execute();
            
            // Update invoice status if payment is linked to an invoice
            if (invoiceId && result.flat.invoices) {
                const invoice = result.flat.invoices.find(inv => inv.id === invoiceId);
                if (invoice) {
                    invoice.status = 'paid';
                    invoice.paidDate = new Date();
                    await result.flat.save();
                }
            }
            
            this.eventNotifier.notifyPaymentRecorded(result.payment);
            
            res.status(201).json({
                message: 'Payment recorded successfully',
                payment: result.payment,
                flat: result.flat
            });
        } catch (error) {
            console.error('Error recording payment:', error);
            res.status(500).json({ message: error.message });
        }
    }

    async executeGetPaymentLogs(req, res) {
        try {
            const { flatId } = req.params;
            
            const authResult = await AuthorizationProxy.validateFlatOwnership(flatId, req.user.id);
            if (!authResult.authorized) {
                return res.status(authResult.statusCode).json({ message: authResult.error });
            }

            const flat = authResult.flat;
            const paymentLogs = flat.paymentLogs || [];
            
            res.json({
                message: 'Payment logs retrieved successfully',
                flatId: flat._id,
                flatTitle: flat.title,
                payments: paymentLogs.sort((a, b) => new Date(b.recordedDate) - new Date(a.recordedDate))
            });
        } catch (error) {
            console.error('Error getting payment logs:', error);
            res.status(500).json({ message: error.message });
        }
    }

    async executeDeletePayment(req, res) {
        try {
            const { flatId, paymentId } = req.params;
            
            console.log('Delete Payment called with:', { flatId, paymentId });
            
            const authResult = await AuthorizationProxy.validateFlatOwnership(flatId, req.user.id);
            if (!authResult.authorized) {
                return res.status(authResult.statusCode).json({ message: authResult.error });
            }

            const flat = authResult.flat;
            
            if (!flat.paymentLogs) {
                return res.status(404).json({ message: 'No payment logs found for this flat' });
            }
            
            const paymentIndex = flat.paymentLogs.findIndex(payment => payment.id === paymentId);
            if (paymentIndex === -1) {
                return res.status(404).json({ message: 'Payment not found' });
            }
            
            const deletedPayment = flat.paymentLogs[paymentIndex];
            flat.paymentLogs.splice(paymentIndex, 1);
            await flat.save();
            
            this.eventNotifier.notifyPaymentDeleted(deletedPayment);
            
            res.json({
                message: 'Payment deleted successfully',
                flat: flat
            });
        } catch (error) {
            console.error('Error deleting payment:', error);
            res.status(500).json({ message: error.message });
        }
    }

    async executeGetArrearsTracking(req, res) {
        try {
            const flats = await Flat.find({ 
                userId: req.user.id,
                tenantDetails: { $exists: true, $ne: null }
            });
            
            const currentDate = new Date();
            const arrearsData = [];
            
            flats.forEach(flat => {
                if (flat.invoices && flat.invoices.length > 0) {
                    const overdueInvoices = flat.invoices.filter(invoice => 
                        invoice.status === 'pending' && new Date(invoice.dueDate) < currentDate
                    );
                    
                    if (overdueInvoices.length > 0) {
                        const totalArrears = overdueInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
                        const oldestOverdue = overdueInvoices.reduce((oldest, invoice) => 
                            new Date(invoice.dueDate) < new Date(oldest.dueDate) ? invoice : oldest
                        );
                        
                        arrearsData.push({
                            flatId: flat._id,
                            flatTitle: flat.title,
                            tenantName: flat.tenantDetails.name,
                            tenantEmail: flat.tenantDetails.email,
                            totalArrearsAmount: totalArrears,
                            overdueInvoicesCount: overdueInvoices.length,
                            oldestOverdueDate: oldestOverdue.dueDate,
                            daysPastDue: Math.floor((currentDate - new Date(oldestOverdue.dueDate)) / (1000 * 60 * 60 * 24)),
                            overdueInvoices: overdueInvoices
                        });
                    }
                }
            });
            
            const result = {
                message: 'Arrears tracking retrieved successfully',
                totalFlatsInArrears: arrearsData.length,
                totalArrearsAmount: arrearsData.reduce((sum, data) => sum + data.totalArrearsAmount, 0),
                arrearsData: arrearsData.sort((a, b) => b.totalArrearsAmount - a.totalArrearsAmount)
            };
            
            this.eventNotifier.notifyArrearsCalculated(result);
            
            res.json(result);
        } catch (error) {
            console.error('Error getting arrears tracking:', error);
            res.status(500).json({ message: error.message });
        }
    }

    async executeGetInvoices(req, res) {
        try {
            const { flatId } = req.params;
            
            const authResult = await AuthorizationProxy.validateFlatOwnership(flatId, req.user.id);
            if (!authResult.authorized) {
                return res.status(authResult.statusCode).json({ message: authResult.error });
            }

            const flat = authResult.flat;
            const invoices = flat.invoices || [];
            
            res.json({
                message: 'Invoices retrieved successfully',
                flatId: flat._id,
                flatTitle: flat.title,
                invoices: invoices.sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate))
            });
        } catch (error) {
            console.error('Error getting invoices:', error);
            res.status(500).json({ message: error.message });
        }
    }
}

const paymentController = new PaymentController();

const generateInvoice = async (req, res) => {
    await paymentController.executeGenerateInvoice(req, res);
};

const recordPayment = async (req, res) => {
    await paymentController.executeRecordPayment(req, res);
};

const getPaymentLogs = async (req, res) => {
    await paymentController.executeGetPaymentLogs(req, res);
};

const deletePayment = async (req, res) => {
    await paymentController.executeDeletePayment(req, res);
};

const getArrearsTracking = async (req, res) => {
    await paymentController.executeGetArrearsTracking(req, res);
};

const getInvoices = async (req, res) => {
    await paymentController.executeGetInvoices(req, res);
};

module.exports = {
    generateInvoice,
    recordPayment,
    getPaymentLogs,
    deletePayment,
    getArrearsTracking,
    getInvoices
};