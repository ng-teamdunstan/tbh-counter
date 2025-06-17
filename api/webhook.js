// Einfacher Counter-Speicher (für Demo)
let salesCounter = 0;
let lastReset = new Date();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  
  // Startzeit: Momentan sofort (später auf Donnerstag 19.06. um 19:00 Uhr ändern)
  const START_TIME = new Date('2025-06-17T10:00:00Z');
  
  if (req.method === 'POST') {
    // Shopify Webhook - neue Bestellung
    try {
      const order = req.body;
      const orderTime = new Date(order.created_at);
      
      if (orderTime >= START_TIME) {
        // Alle Produkte in der Bestellung zählen
        let totalProducts = 0;
        
        if (order.line_items && Array.isArray(order.line_items)) {
          totalProducts = order.line_items.reduce((sum, item) => {
            return sum + (item.quantity || 0);
          }, 0);
        }
        
        // Counter um Produktanzahl erhöhen!
        salesCounter += totalProducts;
        
        console.log(`Neue Bestellung gezählt! +${totalProducts} Produkte. Gesamt: ${salesCounter}, Order: ${order.order_number || 'Test'}`);
        console.log('Line Items:', order.line_items ? order.line_items.map(item => `${item.title}: ${item.quantity}`) : 'Keine Items');
      } else {
        console.log('Bestellung vor Startzeit ignoriert:', orderTime, 'Start:', START_TIME);
      }
      
      res.status(200).json({ success: true, count: salesCounter });
    } catch (error) {
      console.error('Webhook Error:', error);
      res.status(200).json({ success: true, error: error.message });
    }
  } 
  else if (req.method === 'GET') {
    // Echter Counter zurückgeben
    res.status(200).json({ 
      count: salesCounter,
      startTime: START_TIME,
      lastUpdate: new Date().toISOString(),
      description: 'Gesamtanzahl verkaufter Produkte'
    });
  }
}
