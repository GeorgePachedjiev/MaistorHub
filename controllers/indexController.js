const getHome = (req, res) => {
  res.json({ message: 'MaistorHub API работи' });
};

module.exports = {
  getHome
};
