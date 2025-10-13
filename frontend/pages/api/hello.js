export default function handler(req, res) {
  res.status(200).json({ 
    status: 'ok',
    message: 'Affiliate Bot Frontend API',
    timestamp: new Date().toISOString()
  });
}