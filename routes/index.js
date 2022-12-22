var express = require('express');
var router = express.Router();
const formidable = require('formidable');
const fs = require('fs');
const path = require('path');

// var upload = require('./scripts/upload');

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log("----- ROUTE /")
  res.render('index', { title: 'Express' });
});

//upload file api
router.post('/uploadfile',upload_file);

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
