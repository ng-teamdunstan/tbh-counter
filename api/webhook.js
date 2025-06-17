export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  
  // Startzeit: JETZT (zum Testen)
  const START_TIME = new Date('2025-06-17T12:00:00Z'); // Anpassen auf aktuelle Zeit!
  
  if (req.method === 'POST') {
    // Shopify Webhook - neue Bestellung
    try {
      const order = req.body;
      const orderTime = new Date(order.created_at);
      
      if (orderTime >= START_TIME) {
        console.log('Neue Bestellung gezählt!', order.order_number);
        // Hier würden wir den Counter erhöhen (vereinfacht für Test)
      }
      
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(200).json({ success: true });
    }
  } 
  else if (req.method === 'GET') {
    // Test-Counter (später echte Zählung)
    res.status(200).json({ count: 12 }); // Simulierte Verkäufe
  }
}
