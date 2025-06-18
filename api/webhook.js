const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'ng-teamdunstan'; // ANPASSEN!
const REPO_NAME = 'shopify-counter';
const FILE_PATH = 'counter-data.json';

// GitHub API Funktionen
async function readCounterFromGitHub() {
  try {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (response.status === 404) {
      // Datei existiert noch nicht, erstelle sie
      await writeCounterToGitHub(0, null);
      return { count: 0, lastUpdate: new Date().toISOString() };
    }
    
    if (!response.ok) {
      throw new Error(`GitHub API Error: ${response.status}`);
    }
    
    const data = await response.json();
    const content = JSON.parse(Buffer.from(data.content, 'base64').toString());
    
    return {
      count: content.count || 0,
      lastUpdate: content.lastUpdate || new Date().toISOString(),
      sha: data.sha
    };
  } catch (error) {
    console.error('Error reading from GitHub:', error);
    return { count: 0, lastUpdate: new Date().toISOString(), sha: null };
  }
}

async function writeCounterToGitHub(count, sha) {
  try {
    const content = {
      count: count,
      lastUpdate: new Date().toISOString()
    };
    
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
    const body = {
      message: `Update counter to ${count}`,
      content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64')
    };
    
    if (sha) {
      body.sha = sha;
    }
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      throw new Error(`GitHub API Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error writing to GitHub:', error);
    throw error;
  }
}

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
        // Aktuellen Counter aus GitHub lesen
        const counterData = await readCounterFromGitHub();
        
        // Alle Produkte in der Bestellung zählen
        let totalProducts = 0;
        if (order.line_items && Array.isArray(order.line_items)) {
          totalProducts = order.line_items.reduce((sum, item) => {
            return sum + (item.quantity || 0);
          }, 0);
        }
        
        // Neuen Counter berechnen
        const newCount = counterData.count + totalProducts;
        
        // Zurück in GitHub speichern
        await writeCounterToGitHub(newCount, counterData.sha);
        
        console.log(`Neue Bestellung gezählt! +${totalProducts} Produkte. Gesamt: ${newCount}, Order: ${order.order_number || 'Test'}`);
        console.log('Line Items:', order.line_items ? order.line_items.map(item => `${item.title}: ${item.quantity}`) : 'Keine Items');
        
        res.status(200).json({ success: true, count: newCount });
      } else {
        console.log('Bestellung vor Startzeit ignoriert:', orderTime, 'Start:', START_TIME);
        res.status(200).json({ success: true, ignored: true });
      }
    } catch (error) {
      console.error('Webhook Error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  } 
  else if (req.method === 'GET') {
    // Counter aus GitHub lesen und zurückgeben
    try {
      const counterData = await readCounterFromGitHub();
      
      res.status(200).json({ 
        count: counterData.count,
        startTime: START_TIME,
        lastUpdate: counterData.lastUpdate,
        description: 'Gesamtanzahl verkaufter Produkte'
      });
    } catch (error) {
      console.error('GET Error:', error);
      res.status(500).json({ 
        count: 0, 
        error: error.message 
      });
    }
  }
}
