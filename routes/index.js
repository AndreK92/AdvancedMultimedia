var express = require('express');
var router = express.Router();
const formidable = require('formidable');
const fs = require('fs');
const path = require('path');

var ejs = require('ejs');

var ffmpeg = require('fluent-ffmpeg');
var command = ffmpeg();

var valueFormats,valueCodecs,valueEncoders;

ffmpeg.getAvailableFormats((err, formats) => {
  // if (err) {
  //   console.error(err);
  //   return;
  // }
  console.log('GETTING FORMATS');
  valueFormats = formats;

  fs.writeFile('formats.txt', JSON.stringify(valueFormats, null, 2) + '\n', (err) => {
    if (err) throw err;
    console.log('The data was appended to file!');
  });
});

ffmpeg.getAvailableCodecs((err, codecs) => {
  if (err) {
    console.error(err);
  }
  console.log('GETTING CODECS');
  valueCodecs = codecs;

  fs.writeFile('codecs.txt', JSON.stringify(valueCodecs, null, 2) + '\n', (err) => {
    if (err) throw err;
    console.log('The data was appended to file!');
  });
});

ffmpeg.getAvailableEncoders(function(err, encoders) {
  if (err) {
    console.error(err);
  }
  console.log('GETTING ENCODERS');
  valueEncoders = encoders;

  fs.writeFile('encoders.txt', JSON.stringify(valueEncoders, null, 2) + '\n', (err) => {
    if (err) throw err;
    console.log('The data was appended to file!');
  });
});




// var upload = require('./scripts/upload');

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log("----- ROUTE HOME /")
  res.render('index', { body: '../views/home.ejs'});
});

router.get('/video', function(req, res, next) {
  console.log("----- ROUTE VIDEO /")
  res.render('index', { body: '../views/video.ejs'});
});

router.get('/audio', function(req, res, next) {
  console.log("----- ROUTE AUDIO /")
  res.render('index', { body: '../views/audio.ejs'});
});

router.get('/other', function(req, res, next) {
  console.log("----- ROUTE OTHER /")
  res.render('index', { body: '../views/other.ejs'});
});

router.get('/testimage', function(req, res, next) {
  console.log("----- ROUTE OTHER /")
  res.render('index', { body: '../views/previewFrames.ejs',
                        image1: 'origOutput',
                        image2: 'convOutput'});
});

router.get('/probe', (req, res) => {

  const filePath = req.query.file;
  console.log("RAW: " + filePath);

  console.log("REPLACED: " + filePath);

  ffmpeg.ffprobe(filePath, (err, metadata) => {
    if (err) {
      console.error(err);
      return res.status(500).send("An error occured while processing the file.");
    }
    
    let metadataString = JSON.stringify(metadata, null, 2);

    return res.json({metadataString});
  });
});

router.get('/image', (req, res) => {
  res.sendFile('E:\\Projekte/Studium\\AdvancedMultimedia\\TestVideos\\extracted.jpg');
});

const { spawn } = require('child_process');
router.get('/muxerinfo/:format', function(req, res, next) {
  console.log("----- ROUTE MUXERINFO /")

  var fileformat = req.params.format;

  const command = 'ffmpeg';
  const args = ['-h', 'muxer=' + fileformat];

  const process = spawn(command, args);


  var commonExtensions,defaultVideoCodec,defaultAudioCodec

  process.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);

    const regex = /Common extensions:\s*(\w+)\.(?:\s*Default video codec:\s*(\w+)\.(?:\s*Default audio codec:\s*(\w+)\.)?)?/;
    const match = regex.exec(`${data}`);
     commonExtensions = match[1];
     defaultVideoCodec = match[2];
     defaultAudioCodec = match[3];

  });

  process.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  process.on('close', (code) => {
    console.log(`child process exited with code ${code}`);

    console.log(`Common extensions: ${commonExtensions}`);
    console.log(`Default video codec: ${defaultVideoCodec}`);
    console.log(`Default audio codec: ${defaultAudioCodec}`);

    return res.send({ commonExtensions, defaultVideoCodec, defaultAudioCodec });
  });


});

// TODO Extract frames (source & converted video)
// TODO Show Images in Window
// TODO Create looking glass
router.post('/previewvideo', function(req, res, next) {
  console.log("----- ROUTE PREVIEW VIDEO /")
  
  var inputFile;
  var outputFile;

  if(req.method.toLowerCase() === 'post') {
    console.error("INSIDE");
    // create an incoming form object
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
      // if (err) {
      //   console.error("THROWING");
      //   console.error(err.message);
      //   return;
      // }

      var format = fields.format;
      var codec = fields.codec;
      var encoder = fields.encoder;

      var resolution = fields.resolution;
      var bitrate = fields.bitrate;
      var framerate = fields.framerate;
      var codec = fields.codec;
      // var startTime = fields.startTime;
      // var endTime = fields.endTime;
      
      console.log(files);
      console.log(fields);

      inputFile = files.file;
      outputFile = __dirname + "\\converted\\" + inputFile.newFilename + '.' + format.toLowerCase();
      console.log("OUTPUT: " + outputFile); // output the value of the selectedItem field
      
      if (!isEmpty(encoder)) {
        try {
          let cmd = ffmpeg(inputFile.filepath)
          // .logLevel('debug')
          .size(resolution)
          .fps(framerate)
          .videoBitrate(bitrate)
          .withVideoCodec(encoder)
          .on('start', (commandLine) => {
            console.log(`Command: ${commandLine}`);
          })
          .on('end', function() {
            res.render('index', { body: '../views/previewVideo.ejs', localfile: inputFile.filepath, remotefile: outputFile});
            console.log('conversion complete');
          })
          .save(outputFile);
        } catch (error) {
          console.log(error)
        }
      } else {
        try {
          let cmd = ffmpeg(inputFile.filepath)
          // .logLevel('debug')
          .size(resolution)
          .fps(framerate)
          .videoBitrate(bitrate)
          .on('start', (commandLine) => {
            console.log(`Command: ${commandLine}`);
          })
          .on('end', function() {
            res.render('index', { body: '../views/previewVideo.ejs', localfile: inputFile.filepath, remotefile: outputFile});
            console.log('conversion complete');
          })
          .save(outputFile);
        } catch (error) {
          console.log(error)
        }
      }


    });
  }

  
});

router.get('/previewframes', function(req, res, next) {
  console.log("----- ROUTE OTHER /")
  res.render('index', { body: '../views/previewFrames.ejs',
                        localfile: '',
                        remotefile: 'outputFile'});
});

const videoPath = 'E:/Projekte/Studium/AdvancedMultimedia/TestVideos/file_example_MP4_640_3MG.mp4';
const outputPath = 'E:/Projekte/Studium/AdvancedMultimedia/TestVideos/extracted.jpg';

router.get('/getimage', function(req, res, next) {
  console.log("----- ROUTE GETIMAGE /")
  const image = req.query.image;
  // const imageStatic = "req.query.image";

  console.log(image)

  try {
    res.set("Content-Type", "image/jpeg");
    res.sendFile(image);
  } catch (error) {
    console.error(error);
  }
});

router.post("/extractframes", function (req, res) {
  console.log('Extract frames');

  if (req.method == 'POST') {
    // console.log(req);

    var form = new formidable.IncomingForm();
      // parsing
      form.parse(req, async function (err, fields, files) {
        console.log(files, fields);

        var timestamp = fields.timestamp;
        var originalvideo = fields.originalvideo;
        var convertedvideo = fields.convertedvideo;

        var origOutput = __dirname + "\\converted\\" + path.parse(originalvideo).name + "_original.jpg";
        var convOutput = __dirname + "\\converted\\" + path.parse(convertedvideo).name + "_converted.jpg";

        console.log(origOutput,convOutput);

        // Extract frame from original video
        ffmpeg(originalvideo)
        .seekInput(timestamp)
        .frames(1)
        .on('end', function() {
          console.log('Extracted image at', timestamp);
        })
        .save(origOutput);

        
        // Extract frame from converted video
        ffmpeg(convertedvideo)
        .seekInput(timestamp)
        .frames(1)
        .on('end', function() {
          console.log('Extracted image at', timestamp);

          origOutput = origOutput.replace(/\\/g, "/");
          convOutput = convOutput.replace(/\\/g, "/");

          console.log("Extract1: " + origOutput)
          console.log("Extract2: " + convOutput)


          if (fs.existsSync(origOutput)) {
            console.log(`Original File exists: ${origOutput}`);
          } else {
            console.log(`Original File does not exist: ${origOutput}`);
          }

          if (fs.existsSync(convOutput)) {
            console.log(`Converted File exists: ${convOutput}`);
          } else {
            console.log(`Converted File does not exist: ${convOutput}`);
          }


          // PSNR
          const originalFrame = fs.readFileSync(origOutput);
          const convertedFrame = fs.readFileSync(convOutput);
          let mse = 0;
          for (let i = 0; i < originalFrame.length; i++) {
            mse += (originalFrame[i] - convertedFrame[i]) ** 2;
          }
          mse /= originalFrame.length;
          const max = 255;
          const psnr = 10 * Math.log10(max ** 2 / mse);
          console.log(`PSNR: ${psnr}`);
           // PSNR

          res.render('index', { body: '../views/previewFrames.ejs',
          image1: origOutput,
          image2: convOutput});
        })
        .save(convOutput);


    })
  }
});

router.get('/formatcodecs/:format', function (req, res) {

  ffmpeg.getAvailableFormats((err, formats) => {
    // if (err) {
    //   console.error(err);
    //   return;
    // }

    var fileformat = req.params.format;
    var formatNameLong;
    const keysFormat = Object.keys(formats);

    // console.log(keysFormat)
    // console.log(fileformat)

    keysFormat.forEach(format => {
      if (format == fileformat) {
        // console.log("FOUND")
        // console.log(formats[format])
        formatNameLong = formats[format].codec_long_name
      }
    });

    // console.log("Longname: " + formatNameLong)

    // console.log(formats)

    ffmpeg.getAvailableCodecs((err, codecs) => {
      if (err) {
        return res.status(500).send('Error getting codecs');
      }
  
      
      const videoCodecs = {};
      for (const codecName in codecs) {
        const codec = codecs[codecName];
        if (codec.type === 'video' && codec.description.includes(formatNameLong)) {
          videoCodecs[codecName] = codec;
        }
      }
      // console.log(codecs)
  
      return res.json(videoCodecs);
    });
  });
});

router.post("/metadata", function (req, res) {

  if(req.method.toLowerCase() === 'post') {
    console.error("INSIDE");
    // create an incoming form object
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
      // if (err) {
      //   console.error(err.message);
      //   return;
      // }
      
      console.log(files);
      console.log(fields);

      var type = fields.type
      inputFile = files.file;

      ffmpeg.ffprobe(inputFile.filepath, (err, metadata) => {
        if (err) {
          console.error(err);
          return res.status(500).send("An error occured while processing the file.");
        }
        
        console.log(metadata)
        var fileformat = metadata.format;
        console.log("Format: " + fileformat)

        var formats = valueFormats

        // console.log(valueCodecs)
        // console.log(valueEncoders)

        const codecs = {};
        for (const codecName in valueCodecs) {
          const codec = valueCodecs[codecName];
          if (codec.type === type) { //&& codec.description.includes(metadata.streams[0].codec_long_name)) {
            codecs[codecName] = codec;
          }
        }
        // console.log(videoCodecs)

        const encoders = {};
        for (const encoderName in valueEncoders) {
          const encoder = valueEncoders[encoderName];
          if (encoder.type === type) { //&& codec.description.includes(metadata.streams[0].codec_long_name)) {
            encoders[encoderName] = encoder;
          }
        }
        // console.log(videoEncoder)

        // console.log('Supported formats:', formats);
        extension = path.extname(inputFile.originalFilename).replace(/\./g, '');
        // const formatCodecs = codecs.filter(codec => codec.type === metadata.format);
        return res.json({metadata, formats, codecs, encoders, extension});
      });
    });
  }
});

const requestQueueVideo = [];
router.post('/convertvideo',async (req, res) => {
  console.log('----- CONVERT')
  requestQueueVideo.push({req, res});
  while(requestQueueVideo.length > 0) {
    const currentRequest = requestQueueVideo.shift();
    await processRequestVideo(currentRequest);
  }
});

const requestQueueAudio = [];
router.post('/convertaudio',async (req, res) => {
  console.log('----- CONVERT')
  requestQueueAudio.push({req, res});
  while(requestQueueAudio.length > 0) {
    const currentRequest = requestQueueAudio.shift();
    await processRequestAudio(currentRequest);
  }
});

router.get("/videostream", function (req, res) {
  const file = req.query.file;

  try {
    const range = req.headers.range;
    console.log("Range Header: " + range)
    console.log("Range Header parsed: " + range.replace(/\D/g, ""))
    if (!range) {
        res.status(400).send("Requires Range header");
    }

    // Bestimmen der Dateigröße
    const videoSize = fs.statSync(file).size;

    // Festlegen der Chunksize (10 hoch 6 --> 1000000 bytes (1MB))
    const CHUNK_SIZE = 10 ** 6;

    // Start byte des Range Strings wird geparst
    const start = Number(range.replace(/\D/g, ""));

    // Berechnung des end bytes
    const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

    // Länge der Daten
    const contentLength = end - start + 1;

    // Setzen der Headers
    const headers = {
        "Content-Range": `bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": "video/avi",
    };

    // HTTP status code to 206 (Partial Content).
    res.writeHead(206, headers);
    
    const videoStream = fs.createReadStream(file, { start, end });
    videoStream.pipe(res);


  } catch (error) {
    console.error(error);
    // Expected output: ReferenceError: nonExistentFunction is not defined
    // (Note: the exact output may be browser-dependent)
  }
});

function upload_file(req, res, next){
  console.log('----- UPLOAD')

  var command = new FfmpegCommand();

  if(req.method == "POST") {

  }
}

function testDownload(req, res, next) {
  var form = new formidable.IncomingForm();
  form.parse(req, function (err, fields, files) {
    // if (err) {
    //   console.error(err.message);
    //   return;
    // }

    console.log(fields); // will contain the selected item
    console.log(files); // will contain the uploaded files

    var file = files.file;
    console.log(file)

    var fileName = file.newFilename;
    var contentType = file.mimetype;
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'attachment; filename='+fileName);
    res.download(file.filepath, fileName);
  });
}


// function convertVideo(req, res, next) {

//   // TODO
//   // format conversion      DONE DONE
//   // change bit resolution  DONE DONE
//   // change audio frequency DONE
//   // change audio channels  DONE
//   // trim audio             DONE

//   // format conversion
//   // ffmpeg(inputFile)
//   //   .output(outputFile)
//   //   .on('error', (error) => {
//   //     console.error(`Error: ${error.message}`);
//   //     return callback(error);
//   //   })
//   //   .on('end', () => {
//   //     console.log('Video conversion completed!');
//   //     res.render('index', { title: 'Express' });
//   //   })
//   //   .run();

//   // change bit resolution
//   // ffmpeg(inputFile)
//   //   .output(outputFile)
//   //   .videoBitrate(bitResolution)
//   //   .on('error', (error) => {
//   //     console.error(`Error: ${error.message}`);
//   //     return callback(error);
//   //   })
//   // .on('end', () => {
//   //   console.log('Video conversion completed!');
//   //   res.render('index', { title: 'Express' });
//   // })
//   // .run();

//   // change audio frequency
//   // ffmpeg(inputFile)
//   // .output(outputFile)
//   // .audioFrequency(frequency)
//   // .on('error', (error) => {
//   //   console.error(`Error: ${error.message}`);
//   //   return callback(error);
//   // })
//   // .on('end', () => {
//   //   console.log('Video conversion completed!');
//   //   return callback(null);
//   // })
//   // .run();

//   //change audio channels 
//   // ffmpeg(inputFile)
//   // .output(outputFile)
//   // .audioChannels(channels)
//   // .on('error', (error) => {
//   //   console.error(`Error: ${error.message}`);
//   //   return callback(error);
//   // })
//   // .on('end', () => {
//   //   console.log('Video conversion completed!');
//   //   return callback(null);
//   // })
//   // .run();

//   // trim audio
//   // ffmpeg(inputFile)
//   // .output(outputFile)
//   // .audioTrim(startTime, endTime)
//   // .on('error', (error) => {
//   //   console.error(`Error: ${error.message}`);
//   //   return callback(error);
//   // })
//   // .on('end', () => {
//   //   console.log('Video conversion completed!');
//   //   return callback(null);
//   // })
//   // .run();
// }

function isEmpty(value) {
  return (
    value === undefined ||
    value === null ||
    (typeof value === 'object' && Object.keys(value).length === 0) ||
    (typeof value === 'string' && value.trim().length === 0)
  );
}

async function processRequestVideo(handleObject) {
  
  var req = handleObject.req;
  var res = handleObject.res;
  
  var inputFile;
  var outputFile;

  var error = new Error("Some error occurred");
  // console.log(res)

  // res.status(500).send("dsgsdgdsg");

  if(req.method.toLowerCase() === 'post') {
    console.error("INSIDE");
    // create an incoming form object
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
      // if (err) {
      //   console.log("PRINTING ERROR")
      //   console.error(err.message);
      //   return;
      // }

      var format = fields.format;
      var codec = fields.codec;
      var encoder = fields.encoder;

      var resolution = fields.resolution;
      var bitrate = fields.bitrate;
      var framerate = fields.framerate;
      var pixelformat = fields.pixelformat;
      var startTime = fields.startTime;
      var endTime = fields.endTime;
      
      console.log(files);
      console.log(fields);

      inputFile = files.file;
      outputFile = "./converted/" + inputFile.newFilename + '.' + format.toLowerCase();
      console.log("OUTPUT: " + outputFile); // output the value of the selectedItem field
      
      if (!isEmpty(encoder)) {
        try {
          let cmd = ffmpeg(inputFile.filepath)
          .size(resolution)
          .fps(framerate)
          .videoBitrate(bitrate)
          .withVideoCodec(encoder)
          .outputOptions(['-pix_fmt', pixelformat])
          .on('start', (commandLine) => {
            console.log(`Command: ${commandLine}`);
          })
          .on('end', function() {
              res.download(outputFile);
              console.log('conversion complete');
          })
          .save(outputFile);
        } catch (error) {
          console.log(error)
          res.status(500).send({ error: error.message });
        }
      } else {
        try {
          let cmd = ffmpeg(inputFile.filepath)
          .size(resolution)
          .fps(framerate)
          .videoBitrate(bitrate)
          .outputOptions(['-pix_fmt', pixelformat])
          .on('start', (commandLine) => {
            console.log(`Command: ${commandLine}`);
          })
          .on('end', function() {
              res.download(outputFile);
              console.log('conversion complete');
          })
          .save(outputFile);
        } catch (error) {
          console.log(error)
          res.status(500).send({ error: error.message });
        }
      }


    });
  }
}


async function processRequestAudio(handleObject) {
  
  var req = handleObject.req;
  var res = handleObject.res;
  
  var inputFile;
  var outputFile;

  if(req.method.toLowerCase() === 'post') {
    console.error("INSIDE");
    // create an incoming form object
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
      if (err) {
        console.error(err.message);
        return;
      }

      var format = fields.format;
      var codec = fields.codec;
      var encoder = fields.encoder;

      var bitrate = fields.bitrate;
      var frequency = fields.frequency;
      var audioChannels = fields.audioChannels;
      
      console.log(files);
      console.log(fields);

      inputFile = files.file;
      outputFile = "./converted/" + inputFile.newFilename + '.' + format.toLowerCase();
      console.log("OUTPUT: " + outputFile); // output the value of the selectedItem field
        
      let cmd = ffmpeg(inputFile.filepath)
      // .logLevel('debug')
      // .outputOptions(['-c:v ' + fields.videocodec, '-c:a ' + fields.audiocodec])
      // .outputOptions(fields.hasOwnProperty('bitrate') && fields.bitrate !== "" ? ['-b:a '+ bitrate +'k'] : [])
      // .outputOptions(fields.hasOwnProperty('frequency') && fields.frequency !== "" ? ['-ar '+ frequency] : [])
      // .outputOptions(fields.hasOwnProperty('audioChannels') && fields.audioChannels !== "" ? ['-ac '+ audioChannels] : [])
      .audioBitrate(bitrate)
      .audioFrequency(frequency)
      .audioChannels(audioChannels)
      .withAudioCodec(encoder)
      .on('start', (commandLine) => {
        console.log(`Command: ${commandLine}`);
      })
      .on('end', function() {
          res.download(outputFile);
          console.log('conversion complete');
      })
      .save(outputFile);

    });
  }
}


// async function processRequest(handleObject) {
  
//   var req = handleObject.req;
//   var res = handleObject.res;
  
//   var inputFile;
//   var outputFile;

//   if(req.method.toLowerCase() === 'post') {
//     console.error("INSIDE");
//     // create an incoming form object
//     var form = new formidable.IncomingForm();
//     form.parse(req, function (err, fields, files) {
//       if (err) {
//         console.error(err.message);
//         return;
//       }

//       console.log(fields); // will contain the selected item
//       console.log(files); // will contain the uploaded files

//       // The audio bitrate influences the video bitrate 
//       // See https://superuser.com/questions/319542/how-to-specify-audio-and-video-bitrate


//       // check if selectedItem and file fields have values
//       // if (fields.selectedItem && files.file) {
        
//         inputFile = files.file;
//         outputFile = "./converted/" + inputFile.newFilename + ( fields.hasOwnProperty('selectedItem') && fields.selectedItem !== "" && fields.selectedItem ? '.' + fields.selectedItem.toLowerCase() : path.extname(inputFile.originalFilename) );
//         console.log("OUTPUT: " + outputFile); // output the value of the selectedItem field
        
//         let cmd = ffmpeg(inputFile.filepath)
//         .outputOptions(fields.hasOwnProperty('audioBitRate') && fields.audioBitRate !== "" ? ['-b:a '+ fields.audioBitRate +'k'] : [])
//         .outputOptions(fields.hasOwnProperty('audioFrequency') && fields.audioFrequency !== "" ? ['-ar '+ fields.audioFrequency] : [])
//         .outputOptions(fields.hasOwnProperty('audioChannels') && fields.audioChannels !== "" ? ['-ac '+ fields.audioChannels] : [])
//         .outputOptions(fields.hasOwnProperty('startTrim') && fields.startTrim !== "" && fields.hasOwnProperty('endTrim') && fields.endTrim !== ""  ? ['-ss '+ fields.startTrim, '-to '+ fields.endTrim] : [])
//         .save(outputFile)
//         .on('error', (error) => {
//           console.error(`Error: ${error.message}`);
//           return callback(error);
//         })
//         .on('start', (commandLine) => {
//           console.log(`Command: ${commandLine}`);
//         })
//         .on('end', () => {
//             if(fields.hasOwnProperty('audioBitRate') && fields.audioBitRate !== "") {
//                 console.log("The audio bit rate has been changed to "+ fields.audioBitRate +"k");
//             }else {
//                 console.log("The audio bit rate has not been changed");
//             }
//             if(fields.hasOwnProperty('audioFrequency') && fields.audioFrequency !== "") {
//                 console.log("The audio frequency has been changed to "+ fields.audioFrequency);
//             }else {
//                 console.log("The audio frequency has not been changed");
//             }
//             if(fields.hasOwnProperty('audioChannels') && fields.audioChannels !== "") {
//                 console.log("The audio channels has been changed to "+ fields.audioChannels);
//             }else {
//                 console.log("The audio channels has not been changed");
//             }
//             if(fields.hasOwnProperty('startTrim') && fields.startTrim !== "" && fields.hasOwnProperty('endTrim') && fields.endTrim !== "") {
//                 console.log("The audio has been trimmed from "+ fields.startTrim + " to " + fields.endTrim);
//             }else {
//                 console.log("The audio has not been trimmed");
//             }
//             res.download(outputFile);
//         });

//       // } else {
//       //   console.log("Either selectedItem or file fields are empty");
//       // }

//     });
//   }
// }

function testConversion(req, res, next){
  console.log('----- TEST UPLOAD')
  console.log(req.method)

  if(req.method.toLowerCase() === 'post') {
    console.error("INSIDE");
    // create an incoming form object
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
      // if (err) {
      //   console.error(err.message);
      //   return;
      // }

      console.log(fields); // will contain the selected item
      console.log(files); // will contain the uploaded files


    });
  }
  console.error("ENDE");
}

// https://github.com/node-formidable/formidable
function upload_file(req, res, next){
    console.log('----- UPLOAD')

    if(req.method == "POST") {
      // create an incoming form object
      var form = new formidable.IncomingForm();

      // form.parse(req, (err, fields, files) => {
      //   console.log('fields:', fields);
      //   console.log('files:', files);
      // });

      // specify that we want to allow the user to upload multiple files in a single request
      // form.multiples = true;

      if (fs.existsSync('./uploads')) {
        console.log('EXISTSSSSS')
      }

      // store all uploads in the /uploads directory
      form.uploadDir = path.basename(path.dirname('/uploads/json_files/'))

      // every time a file has been uploaded successfully,
      // rename it to it's orignal name
      form.on('file', function(field, file) {
        console.log('----- FILE')
        console.log('----- PATH:' + file.filepath +' UPLOADDIR: ' + form.uploadDir + ' Filename: ' + file.originalFilename)
        fs.rename(file.filepath, path.join(form.uploadDir, file.originalFilename), function(err){
          if (err) throw err;
            console.log('renamed complete: '  + file.originalFilename)
            const file_path = '/uploads/'     + file.originalFilename
        });
      });

      // log any errors that occur
      form.on('error', function(err) {
          console.log('An error has occured: \n' + err);
      });

      // once all the files have been uploaded, send a response to the client
      form.on('end', function() {
          //res.end('success');
          res.statusMessage = "Process cashabck initiated";
          res.statusCode = 200;
          res.redirect('/')
          res.end()
      });

      // parse the incoming request containing the form data
      form.parse(req);
    }
}

module.exports = router;
