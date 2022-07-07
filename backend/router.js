const Amadeus = require("amadeus");
const router = require("express").Router();
// Getting env variables 
const { CLIENT_ID, CLIENT_SECRET } = require('./config');
const API = `api`;
// This is AMADEUS client for getting authToken that we need to make actual call to amadeus API 
const amadeus = new Amadeus({
  // clientId: CLIENT_ID,
  // clientSecret: CLIENT_SECRET
    // clientId: process.env.AMADEUS_CLIENT_ID,
    // clientSecret: process.env.AMADEUS_CLIENT_SECRET
    'clientId': '56mG9WkqzcEq6mmMwm0OBCndfxTR7QDA',
    'clientSecret': 'ueJ8RAc9HiSyRHVO'
});

const url='https://test.api.amadeus.com/v1'
// const API = 'https://test.api.amadeus.com/v2'
// Endpoint
router.get(`/${API}/airports`, async (req, res) => {
  const { page, subType, keyword } = req.query;
  // API call with params we requested from client app
  // const response = await amadeus.client.get(`${url}/reference-data/locations`, {
    const response = await amadeus.client.get("/v1/reference-data/locations", {  
  keyword,
    subType,
    "page[offset]": page * 10
  });
  // Sending response for client
  try {
    await res.json(JSON.parse(response.body));
  } catch (err) {
    await res.json(err);
  }
});


// City search suggestions with Airport & City Search API
router.get(`/${API}/search`, async (req, res) => {
  const { keyword } = req.query;
  const response = await amadeus.referenceData.locations.get({
    keyword,
    subType: Amadeus.location.city,
  });
  try {
    await res.json(JSON.parse(response.body));
  } catch (err) {
    await res.json(err);
  }
});

router.get(`/${API}/hotels`, async (req, res) => {
  const { cityCode } = req.query;
  const response = await amadeus.shopping.hotelOffers.get({
    cityCode,
  });
  try {
    await res.json(JSON.parse(response.body));
  } catch (err) {
    await res.json(err);
  }
});

module.exports = router;
