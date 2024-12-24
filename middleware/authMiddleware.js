const getUserFromRequest = (req, res, next) => {
  const userEmail = req.headers['user-email'];
  if (!userEmail) {
    return res.status(401).json({ message: 'User email required' });
  }
  req.user = { email: userEmail };
  next();
};

module.exports = { getUserFromRequest }; 