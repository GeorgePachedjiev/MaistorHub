const Master = require('../models/Master');

const getAll = async (req, res) => {
  try {
    const { city, services } = req.query;

    // Филтриране по city и/или services
    const filters = {};
    if (city) {
      filters.city = city.trim();
    }
    if (services) {
      filters.services = services.trim();
    }

    // Взимане на майстори с филтриране
    const masters = await Master.findWithFilters(filters);

    // Форматиране на отговора - само нужните полета
    const formattedMasters = masters.map(master => ({
      name: master.name,
      services: master.services,
      price_range: master.price_range,
      city: master.city,
      phone: master.phone
    }));

    res.json({
      success: true,
      count: formattedMasters.length,
      data: formattedMasters
    });

  } catch (error) {
    console.error('Get masters error:', error);
    res.status(500).json({
      success: false,
      error: 'Възникна грешка при взимането на майстори'
    });
  }
};

module.exports = {
  getAll
};
