const Services = require('../models/Services');
const path = require('path');
const { deleteFile, getFileUrl, getFilenameFromUrl } = require('../middleware/upload');


exports.getServices = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 12,
            search = '',
            category = 'all',
            popular = 'all',
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        
        const query = {};

        
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } },
                { features: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        
        if (category && category !== 'all') {
            query.category = category;
        }

        
        if (popular === 'true') {
            query.popular = true;
        }

        
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        
        const [services, totalCount, categories] = await Promise.all([
            Services.find(query).sort(sort).skip(skip).limit(limitNum),
            Services.countDocuments(query),
            Services.distinct('category')
        ]);

        const popularCount = await Services.countDocuments({ popular: true });

        res.json({
            data: services,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(totalCount / limitNum) || 1,
                totalItems: totalCount,
                itemsPerPage: limitNum,
                hasNextPage: pageNum < Math.ceil(totalCount / limitNum),
                hasPrevPage: pageNum > 1
            },
            filters: {
                categories: categories.filter(Boolean),
                popularCount
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


exports.getServiceBySlug = async (req, res) => {
    try {
        const service = await Services.findOne({ slug: req.params.slug });
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }
        res.json(service);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


const parseArrayField = (field) => {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    if (typeof field === 'string') {
        
        try {
            const parsed = JSON.parse(field);
            if (Array.isArray(parsed)) return parsed;
        } catch {
            
        }
        
        return field.split(',').map(item => item.trim()).filter(Boolean);
    }
    return [];
};


const parseBoolean = (value) => {
    if (typeof value === 'boolean') return value;
    if (value === 'true' || value === '1') return true;
    if (value === 'false' || value === '0' || value === '') return false;
    return false;
};


exports.createService = async (req, res) => {
    try {
       

        const {
            title,
            slug,
            description,
            fullDescription,
            icon,
            price,
            category,
            popular,
            features,
            keyBenefits,
            whatweoffer
        } = req.body;

        
        if (!title || !title.trim()) {
            if (req.file) deleteFile(req.file.path);
            return res.status(400).json({ message: 'Title is required' });
        }

        if (!description || !description.trim()) {
            if (req.file) deleteFile(req.file.path);
            return res.status(400).json({ message: 'Description is required' });
        }

        
        let serviceSlug = slug || title;
        serviceSlug = serviceSlug
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        
        const existingService = await Services.findOne({ slug: serviceSlug });
        if (existingService) {
            if (req.file) deleteFile(req.file.path);
            return res.status(400).json({ message: 'A service with this slug already exists' });
        }

        
        let image = null;
        if (req.file) {
            image = getFileUrl(req.file.filename, 'services');
        }

        
        const parsedFeatures = parseArrayField(features);
        const parsedKeyBenefits = parseArrayField(keyBenefits);
        const parsedWhatweoffer = parseArrayField(whatweoffer);

        
        const serviceData = {
            title: title.trim(),
            slug: serviceSlug,
            description: description.trim(),
            fullDescription: fullDescription ? fullDescription.trim() : '',
            image,
            icon: icon || '💼',
            price: price || '',
            category: category || 'Development',
            popular: parseBoolean(popular),
            features: parsedFeatures,
            keyBenefits: parsedKeyBenefits,
            whatweoffer: parsedWhatweoffer
        };


        const newService = await Services.create(serviceData);


        res.status(201).json(newService);
    } catch (error) {
        
        if (req.file) {
            deleteFile(req.file.path);
        }
        res.status(500).json({ 
            message: 'Error creating service', 
            error: error.message,
            details: error.errors ? Object.keys(error.errors).map(key => ({
                field: key,
                message: error.errors[key].message
            })) : null
        });
    }
};


exports.updateService = async (req, res) => {
    try {
      

        const service = await Services.findById(req.params.id);
        if (!service) {
            if (req.file) deleteFile(req.file.path);
            return res.status(404).json({ message: 'Service not found' });
        }

        const {
            title,
            slug,
            description,
            fullDescription,
            icon,
            price,
            category,
            popular,
            features,
            keyBenefits,
            whatweoffer,
            removeImage
        } = req.body;

        
        let image = service.image;

        
        if (req.file) {
            
            if (service.image) {
                const oldFilename = getFilenameFromUrl(service.image);
                if (oldFilename) {
                    deleteFile(path.join('uploads/services', oldFilename));
                }
            }
            image = getFileUrl(req.file.filename, 'services');
        }

        
        if (removeImage === 'true' || removeImage === true) {
            if (service.image) {
                const oldFilename = getFilenameFromUrl(service.image);
                if (oldFilename) {
                    deleteFile(path.join('uploads/services', oldFilename));
                }
            }
            image = null;
        }

        
        const updateData = {};

        if (title !== undefined) updateData.title = title.trim();
        if (slug !== undefined) {
            updateData.slug = slug
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
        }
        if (description !== undefined) updateData.description = description.trim();
        if (fullDescription !== undefined) updateData.fullDescription = fullDescription.trim();
        if (icon !== undefined) updateData.icon = icon;
        if (price !== undefined) updateData.price = price;
        if (category !== undefined) updateData.category = category;
        if (popular !== undefined) updateData.popular = parseBoolean(popular);
        if (features !== undefined) updateData.features = parseArrayField(features);
        if (keyBenefits !== undefined) updateData.keyBenefits = parseArrayField(keyBenefits);
        if (whatweoffer !== undefined) updateData.whatweoffer = parseArrayField(whatweoffer);
        
        updateData.image = image;


        const updatedService = await Services.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );


        res.json(updatedService);
    } catch (error) {
        if (req.file) {
            deleteFile(req.file.path);
        }
        res.status(500).json({ 
            message: 'Error updating service', 
            error: error.message 
        });
    }
};


exports.deleteService = async (req, res) => {
    try {
        const service = await Services.findById(req.params.id);
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }

        
        if (service.image) {
            const filename = getFilenameFromUrl(service.image);
            if (filename) {
                deleteFile(path.join('uploads/services', filename));
            }
        }

        await Services.findByIdAndDelete(req.params.id);
        res.json({ message: 'Service deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting service', error: error.message });
    }
};