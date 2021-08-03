require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns');

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// User Stories
// (1) I can POST a URL to [project_url]/api/shorturl/new and I will receive a shortened URL in the JSON response. Example : {"original_url":"www.google.com","short_url":1}
// (2) If I pass an invalid URL that doesn’t follow the valid http(s)://www.example.com(/more/routes) format, the JSON response will contain an error like {"error":"invalid URL"}. HINT: to be sure that the submitted url points to a valid site you can use the function dns.lookup(host, cb) from the dns core module.
// (3) When I visit the shortened URL, it will redirect me to my original link.

// app.use('/api', (req, res) => {
//   console.log(req.originalUrl)
//   res.json({url: req.originalUrl})
// })

app.use(express.urlencoded({extended: false}));

app.post('/api/shorturl', (req, res) => {

  const {url} = req.body;
  // console.log(url);

  const urlObject = new URL(url);
  const urlOrigin = urlObject.origin;
  const urlHostName = urlObject.hostname;
  // console.log(urlOrigin);
  // console.log(urlObject.pathname);
  console.log(urlObject.host, url);

  dns.lookup(urlHostName, (err, address, family) => {
    if(!address) {
      return res.json({error: 'invalid URL'});
    }
    // console.log(`address: ${address} family: IPv${family}`);

    res.json({original_url: url, short_url: 1})
  });

  // res.redirect('https://app.example.io');
});

app.get('/api/shorturl/:index', (req, res) => {
  res.json({par: req.params.index});

  // res.redirect('https://app.example.io');
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
