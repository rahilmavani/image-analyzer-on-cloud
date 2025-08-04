const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Configure multer to preserve file extension
const storage = multer.diskStorage({
  destination: 'public/uploads/',
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
  }
});
const upload = multer({ storage: storage });

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use('/uploads', express.static('uploads')); // Serve uploaded files
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
  res.render('index', { result: null, imageUrl: null });
});

app.post('/upload', upload.single('image'), async (req, res) => {
  const { email } = req.body;
  const imagePath = req.file.path;
  
  try {
    const image = fs.readFileSync(imagePath, { encoding: 'base64' });
    
    const response = await fetch(process.env.ML_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        filename: req.file.filename, // Use the stored filename
        imageData: image
      })
    });

    const data = await response.json();
    console.log(data);
    
    // Render with both result and image URL
    res.render('index', { 
      result: data.labels.join(', '),
      imageUrl: `/uploads/${req.file.filename}` // This now points to the actual file
    });
    
  } catch (error) {
    console.error("Error during fetch:", error);
    res.render('index', { 
      result: "Error processing image.",
      imageUrl: null
    });
  }
});

app.listen(process.env.PORT);