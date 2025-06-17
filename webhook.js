export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  
  if (req.method === 'POST') {
    // Shopify Webhook - neue Bestellung
    console.log('Neue Bestellung erhalten!');
    res.status(200).json({ success: true });
  } 
  else if (req.method === 'GET') {
    // Counter für Webflow
    res.status(200).json({ count: 5 }); // Test-Wert
  }
}