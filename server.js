require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns');
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
	res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
	res.json({greeting: 'hello API'});
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

const urlSchema = new mongoose.Schema({
	url: {type: String, required: true},
	shortUrl: {type: Number, required: true},
});

const Url = mongoose.model('Url', urlSchema);

// const testUrl = new Url({url: 'https://www.google.com'});
// testUrl.save((err, data) => {
// 	if (err) return console.log(err);

// 	console.log({data});
// });

app.post('/api/shorturl', (req, res) => {
	const {url} = req.body;
	// console.log(url);

	let urlObject;
	try {
		urlObject = new URL(url);
	} catch (e) {
		return res.json({error: 'invalid URL'});
	}
	const urlOrigin = urlObject.origin;
	const urlHostName = urlObject.hostname;
	// console.log(urlOrigin);
	// console.log(urlObject.pathname);
	// console.log(urlObject.host, url);

	const httpRegex = /^(http|https)(:\/\/)/;
	if (!httpRegex.test(url)) {
		return res.json({error: 'invalid url'});
	}

	dns.lookup(urlHostName, (err, address, family) => {
		if (!address) {
			return res.json({error: 'invalid URL'});
		}
		// console.log(`address: ${address} family: IPv${family}`);

		Url.findOne({url}, (err, foundUrl) => {
			if (err) return console.log(err);

			// if it does not exist in the db yet, then add it
			if (!foundUrl) {
				// console.log('not found');
				Url.countDocuments({}, (err, docCount) => {
					if (err) return console.log(err);
					// console.log(docCount);

					new Url({url, shortUrl: docCount + 1}).save((err, savedUrl) => {
						if (err) return console.log(err);

						const {url, shortUrl} = savedUrl;

						return res.json({original_url: url, short_url: shortUrl});
					});
				});
			} else {
				const {url, shortUrl} = foundUrl;
				return res.json({original_url: url, short_url: shortUrl});
			}
		});
	});
});

// Url.find({}, (err, data) => console.log(data));
const findAll = async () => {
	const docs = await Url.find({}).exec();

	// console.log({docs});
	return docs;
};

// findAll().then(docs => console.log({docs}));

// remove all documents
// Url.remove({}, (err, data) => console.log(data));

app.get('/api/shorturl/:index', (req, res) => {
	// res.json({par: req.params.index});
	const {index} = req.params;

	Url.findOne({shortUrl: index}, (err, foundUrl) => {
		if (err) return console.log(err);

		// console.log({foundUrl}, 'found based on params');

		if (!foundUrl) {
			return res.json({error: 'No short URL found for the given input'});
		}

		// redirect to stored url
		return res.redirect(foundUrl.url);
	});
});

app.listen(port, function () {
	console.log(`Listening on port ${port}`);
});
