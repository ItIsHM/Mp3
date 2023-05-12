const express = require('express');
const app = express();
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs-extra');
const { promisify } = require('util');

const stat = promisify(fs.stat);
const unlink = promisify(fs.unlink);

app.get('/download/:filename', async (req, res) => {
  try {
    const { filename } = req.params;

    // Check if the file exists
    const fileStat = await stat(filename);
    if (!fileStat.isFile()) {
      return res.status(404).send('File not found');
    }

    // Convert the file using ffmpeg
    const outputPath = `${filename}.mp3`;
    ffmpeg(filename)
      .toFormat('mp3')
      .on('error', (err) => {
        console.error(err);
        res.status(500).send('Conversion failed');
      })
      .on('end', () => {
        // Stream the converted file for download
        res.download(outputPath, async (err) => {
          if (err) {
            console.error(err);
            res.status(500).send('Download failed');
          }

          // Cleanup: Delete the temporary output file
          await unlink(outputPath);
        });
      })
      .save(outputPath);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Start the server
const port = 3000; // Change this to the desired port number
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
