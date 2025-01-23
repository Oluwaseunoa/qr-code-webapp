const express = require('express');
const qr = require('qr-image');
const fs = require('fs');
const path = require('path');
const validator = require('validator');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(express.static("public"));
app.set('view engine', 'ejs'); // Set EJS as the template engine
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Other Middleware
app.use(helmet());  // Security headers
app.use(compression()); // Compress response
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1d' }));
app.use(morgan('combined')); // Logging HTTP requests

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
});
app.use(limiter);

// Serve the homepage for the QR code form
app.get('/', (req, res) => {
    console.log("Rendering the index page");
    res.render('index');
});

// Handle the form submission and QR code generation
app.post('/generate', (req, res, next) => {
    const url = req.body.url;

    // Validate the URL
    if (!validator.isURL(url)) {
        return res.status(400).send('Please enter a valid URL!');
    }

    try {
        // Generate QR Code
        const qrImage = qr.imageSync(url, { type: 'png' });
        
        // Save the QR code to a file in the public folder for downloading
        const qrFilePath = path.join(__dirname, 'public', 'qr_code.png');
        fs.writeFileSync(qrFilePath, qrImage);

        // Render the result page with the download link
        res.render('result', { qrCodePath: '/qr_code.png', url });
    } catch (err) {
        console.error('Error generating QR code:', err);
        next(err); // Pass the error to the error-handling middleware
    }
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack); // Logs the error stack trace
    res.status(500).send('Something went wrong! Please try again later.');
});

// Start the Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
