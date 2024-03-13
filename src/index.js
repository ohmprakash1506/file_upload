const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const sharp = require('sharp');

const app = express();
const PORT = process.env.PORT || 3000;

mongoose.connect('mongodb://localhost:27017/file_upload', { useNewUrlParser: true, useUnifiedTopology: true });

const filesSchema = new mongoose.Schema({
  pdfData: { type: String, required: true },
});

const Files = mongoose.model('Files', filesSchema);

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(express.json());

app.post('/upload', upload.single('pdfData'), async (req, res) => {
  try {
    // Check if req.file is present and contains the buffer
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const pdfData = req.file.buffer.toString('base64');

    const newFile = new Files({ pdfData });
    await newFile.save();

    res.status(200).json({ message: 'File uploaded successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/download/:id', async (req, res) => {
    try {
      const fileId = req.params.id;
      const file = await Files.findById(fileId);
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }
      const value = file.pdfData
      const url = value.split(';base64,')[1]
  
      const decodedPdfData = Buffer.from(url, 'base64');
  
      res.setHeader('Content-Disposition', `attachment; filename=file_${fileId}.pdf`);
      res.setHeader('Content-Type', 'application/pdf');
  
      // Send the decoded PDF file as the response
      res.send(decodedPdfData);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
  });

app.get('/download/image/:id', async (req, res) => {
  try {
    const fileId = req.params.id;
    const file = await Files.findById(fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    const value = file.pdfData
    const url = value

    const decodedImageData = Buffer.from(url, 'base64');

    const croppedImage = await sharp(decodedImageData).resize(50, 100).extract({ left: 0, top: 0, width: 50, height: 50 }).toBuffer()
    res.setHeader('Content-Type', 'image/jpeg'); 
    res.setHeader('Content-Disposition', 'attachment; filename=image.jpeg');

    res.send(croppedImage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

app.get('/getData', async (req, res) => {
  try {
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
