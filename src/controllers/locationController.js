const { Location } = require('../models');

async function getLocations(req, res) {
  const locations = await Location.find({}).sort({ id: 1 });
  res.json(locations);
}

module.exports = { getLocations };
