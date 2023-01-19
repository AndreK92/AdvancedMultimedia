var express = require('express');
var router = express.Router();
const formidable = require('formidable');
const fs = require('fs');
const path = require('path');

var ejs = require('ejs');


// var upload = require('./scripts/upload');

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log("----- ROUTE HOME /")
  res.render('index', { body: '../views/home.ejs' });;
});

router.get('/video', function(req, res, next) {
  console.log("----- ROUTE VIDEO /")
  res.render('index', { body: '../views/video.ejs' });;
});

router.get('/audio', function(req, res, next) {
  console.log("----- ROUTE AUDIO /")
  res.render('index', { body: '../views/audio.ejs' });;
});

router.get('/other', function(req, res, next) {
  console.log("----- ROUTE OTHER /")
  res.render('index', { body: '../views/other.ejs' });;
});

//upload file api
router.post('/uploadfile',upload_file);

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

function upload_file(req, res, next){
  console.log('----- UPLOAD')

  var command = new FfmpegCommand();

  if(req.method == "POST") {

  }
}

var ffmpeg = require('fluent-ffmpeg');
var command = ffmpeg();

function testDownload(req, res, next) {
  var form = new formidable.IncomingForm();
  form.parse(req, function (err, fields, files) {
    if (err) {
      console.error(err.message);
      return;
    }

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


async function processRequestVideo(handleObject) {
  
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
      var resolution = fields.resolution;
      var bitrate = fields.bitrate;
      var framerate = fields.framerate;
      var startTime = fields.startTime;
      var endTime = fields.endTime;
      
      console.log(files);
      console.log(fields);

      inputFile = files.file;
      outputFile = "./converted/" + inputFile.newFilename + '.' + format.toLowerCase();
      console.log("OUTPUT: " + outputFile); // output the value of the selectedItem field
        
      let cmd = ffmpeg(inputFile.filepath)
      // .outputOptions(['-c:v ' + fields.videocodec, '-c:a ' + fields.audiocodec])
      .size(resolution)
      .fps(framerate)
      .videoBitrate(bitrate)
      // .audioChannels(fields.audiochannels)
      // .audioFrequency(fields.audiofrequency)
      // .audioBitrate(fields.audiobitrate)
      .seekInput(startTime)
      .duration(endTime)
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
      var bitrate = fields.bitrate;
      var frequency = fields.frequency;
      var audioChannels = fields.audioChannels;
      
      console.log(files);
      console.log(fields);

      inputFile = files.file;
      outputFile = "./converted/" + inputFile.newFilename + '.' + format.toLowerCase();
      console.log("OUTPUT: " + outputFile); // output the value of the selectedItem field
        
      let cmd = ffmpeg(inputFile.filepath)
      // .outputOptions(['-c:v ' + fields.videocodec, '-c:a ' + fields.audiocodec])
        .outputOptions(fields.hasOwnProperty('bitrate') && fields.bitrate !== "" ? ['-b:a '+ bitrate +'k'] : [])
        .outputOptions(fields.hasOwnProperty('frequency') && fields.frequency !== "" ? ['-ar '+ frequency] : [])
        .outputOptions(fields.hasOwnProperty('audioChannels') && fields.audioChannels !== "" ? ['-ac '+ audioChannels] : [])
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
      if (err) {
        console.error(err.message);
        return;
      }

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
