export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
};

export const notFound = (req, res) => {
  res.status(404).json({ 
    error: 'Not Found', 
    path: req.originalUrl 
  });
};