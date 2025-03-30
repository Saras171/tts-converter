export const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }else{
  return res.status(401).json({ message: 'User not authenticated' });
}
};