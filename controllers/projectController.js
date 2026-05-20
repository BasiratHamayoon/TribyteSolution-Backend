const Project = require('../models/Project');
const path = require('path');
const { deleteFile, getFileUrl, getFilenameFromUrl } = require('../middleware/upload');


exports.getProjects = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search = '',
      category = 'all',
      tag = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    
    const query = {};

    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { techStack: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    
    if (category && category !== 'all') {
      query.category = category;
    }

    
    if (tag && tag !== 'all') {
      query.tag = tag;
    }

    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    
    const [projects, totalCount, categories, tags] = await Promise.all([
      Project.find(query).sort(sort).skip(skip).limit(limitNum),
      Project.countDocuments(query),
      Project.distinct('category'),
      Project.distinct('tag')
    ]);

    res.json({
      data: projects,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalItems: totalCount,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < Math.ceil(totalCount / limitNum),
        hasPrevPage: pageNum > 1
      },
      filters: {
        categories: categories.filter(Boolean),
        tags: tags.filter(Boolean)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};


exports.getProjectBySlug = async (req, res) => {
  try {
    const project = await Project.findOne({ slug: req.params.slug });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};


exports.createProject = async (req, res) => {
  try {
    const { 
      title, 
      slug, 
      category, 
      tag, 
      description, 
      fullDescription, 
      techStack, 
      liveLink, 
      githubLink 
    } = req.body;

    
    let parsedTechStack = techStack;
    if (typeof techStack === 'string') {
      try {
        parsedTechStack = JSON.parse(techStack);
      } catch {
        parsedTechStack = techStack.split(',').map(t => t.trim()).filter(Boolean);
      }
    }

    
    const projectSlug = slug || title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    
    const existingProject = await Project.findOne({ slug: projectSlug });
    if (existingProject) {
      
      if (req.file) {
        deleteFile(req.file.path);
      }
      return res.status(400).json({ message: 'A project with this slug already exists' });
    }

    
    let image = null;
    if (req.file) {
      image = getFileUrl(req.file.filename, 'projects');
    }

    const newProject = await Project.create({
      title,
      slug: projectSlug,
      category,
      tag,
      description,
      fullDescription,
      techStack: parsedTechStack || [],
      image,
      liveLink,
      githubLink
    });

    res.status(201).json(newProject);
  } catch (error) {
    
    if (req.file) {
      deleteFile(req.file.path);
    }
    console.error(error);
    res.status(500).json({ message: 'Error creating project' });
  }
};


exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      if (req.file) {
        deleteFile(req.file.path);
      }
      return res.status(404).json({ message: 'Project not found' });
    }

    const { 
      title, 
      slug, 
      category, 
      tag, 
      description, 
      fullDescription, 
      techStack, 
      liveLink, 
      githubLink,
      removeImage 
    } = req.body;

    
    let parsedTechStack = techStack;
    if (typeof techStack === 'string') {
      try {
        parsedTechStack = JSON.parse(techStack);
      } catch {
        parsedTechStack = techStack.split(',').map(t => t.trim()).filter(Boolean);
      }
    }

    
    let image = project.image;
    
    
    if (req.file) {
      
      if (project.image) {
        const oldFilename = getFilenameFromUrl(project.image);
        deleteFile(path.join('uploads/projects', oldFilename));
      }
      image = getFileUrl(req.file.filename, 'projects');
    }
    
    
    if (removeImage === 'true' || removeImage === true) {
      if (project.image) {
        const oldFilename = getFilenameFromUrl(project.image);
        deleteFile(path.join('uploads/projects', oldFilename));
      }
      image = null;
    }

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      {
        title: title || project.title,
        slug: slug || project.slug,
        category: category || project.category,
        tag: tag !== undefined ? tag : project.tag,
        description: description || project.description,
        fullDescription: fullDescription !== undefined ? fullDescription : project.fullDescription,
        techStack: parsedTechStack || project.techStack,
        image,
        liveLink: liveLink !== undefined ? liveLink : project.liveLink,
        githubLink: githubLink !== undefined ? githubLink : project.githubLink
      },
      { new: true }
    );

    res.json(updatedProject);
  } catch (error) {
    if (req.file) {
      deleteFile(req.file.path);
    }
    console.error(error);
    res.status(500).json({ message: 'Error updating project' });
  }
};


exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    
    if (project.image) {
      const filename = getFilenameFromUrl(project.image);
      deleteFile(path.join('uploads/projects', filename));
    }

    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting project' });
  }
};