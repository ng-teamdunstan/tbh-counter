// Einfacher Counter-Speicher (für Demo)
let salesCounter = 0;
let lastReset = new Date();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  
  // Startzeit: Donnerstag 19.06. um 19:00 Uhr
  const START_TIME = new Date('2025-06-17T10:00:00Z'); // Heute früh - alles ab jetzt zählt!
  
  if (req.method === 'POST') {
    // Shopify Webhook - neue Bestellung
    try {
      const order = req.body;
      const orderTime = new Date(order.created_at);
      
      if (orderTime >= START_TIME) {
        salesCounter++; // Counter erhöhen!
        console.log(`Neue Bestellung gezählt! Total: ${salesCounter}, Order: ${order.order_number}`);
      }
      
      res.status(200).json({ success: true, count: salesCounter });
    } catch (error) {
      res.status(200).json({ success: true });
    }
  } 
  else if (req.method === 'GET') {
    // Echter Counter zurückgeben
    res.status(200).json({ 
      count: salesCounter,
      startTime: START_TIME,
      lastUpdate: new Date().toISOString()
    });
  }
}
