require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:8080", "http://localhost:3000"], // Frontend URLs
    methods: ["GET", "POST"]
  }
});
const PORT = process.env.PORT || 5001;

// Import routes
const userRoutes = require('./routes/userRoutes');

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Attach io to req for controllers
app.use((req, res, next) => {
  req.io = io;
  next();
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => console.log('MongoDB connected'));

// Routes

// User routes
app.use('/api/users', userRoutes);

// Contact Schema (existing)
const contactSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  message: String,
  status: { type: String, default: 'new' },
  createdAt: { type: Date, default: Date.now },
});
const Contact = mongoose.model('Contact', contactSchema);

// Nodemailer Transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// CRUD Endpoints
// Create (Contact Form Submission)
app.post('/api/contacts', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    const contact = new Contact({ name, email, phone, message });
    await contact.save();

    // Send email to user
    // For user
 await transporter.sendMail({
  from: process.env.EMAIL_USER,
  to: email,
  subject: 'Thank you for contacting Powerfit Gym',
  html: `
 <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; border:1px solid hsl(220, 15%, 20%); border-radius:8px; overflow:hidden;">
   <div style="background: hsl(220, 15%, 8%); padding: 24px 0; text-align: center;">
     <img src="https://yourdomain.com/favicon.ico" alt="Powerfit Logo" style="width: 60px; height: 60px; border-radius: 8px; margin-bottom: 8px;" />
     <h2 style="color: hsl(0, 0%, 95%); margin: 0;">Powerfit Gym</h2>
   </div>
   <div style="padding: 24px; background: hsl(220, 15%, 12%);">
     <h3 style="color: hsl(0, 0%, 95%);">Hi ${name},</h3>
     <p style="color: hsl(0, 0%, 95%);">Thank you for reaching out to <b style="color: hsl(10, 85%, 55%);">Powerfit Gym</b>! We have received your message and will get back to you soon.</p>
     <div style="background: hsl(220, 15%, 15%); padding: 16px; border-radius: 6px; margin: 16px 0;">
       <b style="color: hsl(0, 0%, 95%);">Your message:</b>
       <div style="color: hsl(0, 0%, 65%); margin-top: 8px;">${message}</div>
     </div>
     <p style="color: hsl(0, 0%, 95%); margin-bottom: 0;">Best regards,<br/>Powerfit Team</p>
   </div>
   <div style="background: hsl(220, 15%, 15%); padding: 16px; text-align: center; font-size: 14px; color: hsl(0, 0%, 65%);">
     <div>
       <b style="color: hsl(0, 0%, 95%);">Contact us:</b><br/>
       <a href="tel:5551234567" style="color: hsl(10, 85%, 55%); text-decoration: none;">(555) 123-4567</a> |
       <a href="mailto:info@powerfit.com" style="color: hsl(10, 85%, 55%); text-decoration: none;">info@powerfit.com</a>
     </div>
     <div>
       <a href="https://powerfit.com" style="color: hsl(10, 85%, 55%); text-decoration: none;">www.powerfit.com</a>
     </div>
     <div style="margin-top: 8px;">
       <a href="https://facebook.com" style="margin: 0 4px;"><img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/facebook.svg" width="20" /></a>
       <a href="https://instagram.com" style="margin: 0 4px;"><img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/instagram.svg" width="20" /></a>
       <a href="https://twitter.com" style="margin: 0 4px;"><img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/twitter.svg" width="20" /></a>
     </div>
   </div>
 </div>
 `
});
    // Send email to admin
    // For admin
 await transporter.sendMail({
  from: process.env.EMAIL_USER,
  to: process.env.ADMIN_EMAIL,
  subject: 'New Contact Form Submission',
  html: `
 <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; border:1px solid hsl(220, 15%, 20%); border-radius:8px; overflow:hidden;">
   <div style="background: hsl(220, 15%, 8%); padding: 24px 0; text-align: center;">
     <img src="https://yourdomain.com/favicon.ico" alt="Powerfit Logo" style="width: 60px; height: 60px; border-radius: 8px; margin-bottom: 8px;" />
     <h2 style="color: hsl(0, 0%, 95%); margin: 0;">Powerfit Gym</h2>
   </div>
   <div style="padding: 24px; background: hsl(220, 15%, 12%);">
     <h3 style="color: hsl(0, 0%, 95%);">New Contact Submission</h3>
     <p style="color: hsl(0, 0%, 95%);"><b style="color: hsl(10, 85%, 55%);">Name:</b> ${name}</p>
     <p style="color: hsl(0, 0%, 95%);"><b style="color: hsl(10, 85%, 55%);">Email:</b> ${email}</p>
     <p style="color: hsl(0, 0%, 95%);"><b style="color: hsl(10, 85%, 55%);">Phone:</b> ${phone}</p>
     <div style="background: hsl(220, 15%, 15%); padding: 16px; border-radius: 6px; margin: 16px 0;">
       <b style="color: hsl(0, 0%, 95%);">Message:</b>
       <div style="color: hsl(0, 0%, 65%); margin-top: 8px;">${message}</div>
     </div>
     <p style="color: hsl(0, 0%, 95%); margin-bottom: 0;">Check the admin dashboard for more details.</p>
   </div>
   <div style="background: hsl(220, 15%, 15%); padding: 16px; text-align: center; font-size: 14px; color: hsl(0, 0%, 65%);">
     <div>
       <b style="color: hsl(0, 0%, 95%);">Contact us:</b><br/>
       <a href="tel:5551234567" style="color: hsl(10, 85%, 55%); text-decoration: none;">(555) 123-4567</a> |
       <a href="mailto:info@powerfit.com" style="color: hsl(10, 85%, 55%); text-decoration: none;">info@powerfit.com</a>
     </div>
     <div>
       <a href="https://powerfit.com" style="color: hsl(10, 85%, 55%); text-decoration: none;">www.powerfit.com</a>
     </div>
   </div>
 </div>
 `
});

    // Emit Socket.IO event for new contact
    io.emit('contactCreated', contact);

    res.status(201).json({ message: 'Contact saved and emails sent!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to save contact or send email' });
  }
});

// Read (All Contacts) with filtering and pagination
app.get('/api/contacts', async (req, res) => {
  try {
    console.log('GET /api/contacts - Query params:', req.query);
    const { 
      page = 1, 
      limit = 10, 
      status, 
      search 
    } = req.query;
    
    // Build filter object
    const filter = {};
    
    // Status filter
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    // Search filter (name, email, or message)
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Get total count for pagination
    const total = await Contact.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum);
    
    // Fetch contacts with filter, pagination, and sorting
    const contacts = await Contact.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    
    console.log(`Found ${contacts.length} contacts out of ${total} total`);
    console.log('Filter used:', filter);
    
    res.json({ 
      data: contacts,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (err) {
    console.error('Fetch contacts error:', err);
    res.status(500).json({ message: 'Failed to fetch contacts' });
  }
});

// Read (Single Contact)
app.get('/api/contacts/:id', async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) return res.status(404).json({ message: 'Contact not found' });
    res.json(contact);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch contact' });
  }
});

// Update
app.put('/api/contacts/:id', async (req, res) => {
  try {
    const { name, email, phone, message, status } = req.body;
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { name, email, phone, message, status },
      { new: true }
    );
    if (!contact) return res.status(404).json({ message: 'Contact not found' });

    // Emit Socket.IO event for updated contact
    io.emit('contactUpdated', contact);

    res.json({ message: 'Contact updated', contact });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update contact' });
  }
});

// Delete
app.delete('/api/contacts/:id', async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) return res.status(404).json({ message: 'Contact not found' });

    // Emit Socket.IO event for deleted contact
    io.emit('contactDeleted', contact._id);

    res.json({ message: 'Contact deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete contact' });
  }
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
