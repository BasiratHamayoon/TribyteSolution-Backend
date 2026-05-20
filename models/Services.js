const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true 
    },
    slug: { 
        type: String, 
        required: true, 
        unique: true 
    },
    description: { 
        type: String, 
        required: true 
    },
    fullDescription: { 
        type: String 
    },
    image: { 
        type: String 
    },
    icon: { 
        type: String,
        default: "💼"
    },
    price: { 
        type: String 
    },
    category: {
        type: String,
        default: "Development"
    },
    popular: {
        type: Boolean,
        default: false
    },
    features: [String],
    keyBenefits: [String],
    whatweoffer: [String],
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});


ServiceSchema.pre('save', async function() {
    if (!this.slug && this.title) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
});




module.exports = mongoose.model('Service', ServiceSchema);