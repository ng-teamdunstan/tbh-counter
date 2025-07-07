const SHOPIFY_API_TOKEN = process.env.SHOPIFY_API_TOKEN;
const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Schritt 1: Alle Produkte holen und "CD + Ticket Bundle" finden
    const productsUrl = `https://${SHOPIFY_STORE_URL}/admin/api/2023-10/products.json`;
    const productsResponse = await fetch(productsUrl, {
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_API_TOKEN,
        'Content-Type': 'application/json'
      }
    });

    if (!productsResponse.ok) {
      throw new Error(`Shopify API Error: ${productsResponse.status}`);
    }

    const productsData = await productsResponse.json();
    
    // "CD + Ticket Bundle" Produkt finden
    const bundleProduct = productsData.products.find(product => 
    product.title === 'CD + Ticket Bundle' ||
    product.title.includes('CD + Ticket Bundle')
    );

    if (!bundleProduct) {
      return res.status(404).json({ 
        error: 'CD + Ticket Bundle Produkt nicht gefunden',
        availableProducts: productsData.products.map(p => p.title)
      });
    }

    // Schritt 2: Varianten mit Inventory holen
    const variants = bundleProduct.variants || [];
    
    // Schritt 3: Für jede Variante das Inventory-Level holen
    const tourInventory = [];
    
    for (const variant of variants) {
      try {
        const inventoryUrl = `https://${SHOPIFY_STORE_URL}/admin/api/2023-10/inventory_levels.json?inventory_item_ids=${variant.inventory_item_id}`;
        const inventoryResponse = await fetch(inventoryUrl, {
          headers: {
            'X-Shopify-Access-Token': SHOPIFY_API_TOKEN,
            'Content-Type': 'application/json'
          }
        });

        let availableQuantity = 0;
        if (inventoryResponse.ok) {
          const inventoryData = await inventoryResponse.json();
          if (inventoryData.inventory_levels && inventoryData.inventory_levels.length > 0) {
            availableQuantity = inventoryData.inventory_levels
              .reduce((sum, level) => sum + (level.available || 0), 0);
          }
        }

        // Stadt und Datum aus Varianten-Titel extrahieren
        const variantTitle = variant.title || variant.option1 || 'Unbekannt';
        
        tourInventory.push({
          city: variantTitle,
          available: availableQuantity,
          variantId: variant.id,
          price: variant.price,
          sku: variant.sku
        });

      } catch (error) {
        console.error(`Fehler bei Variante ${variant.title}:`, error);
        tourInventory.push({
          city: variant.title || variant.option1 || 'Unbekannt',
          available: 0,
          variantId: variant.id,
          price: variant.price,
          sku: variant.sku,
          error: 'Inventory konnte nicht geladen werden'
        });
      }
    }

    // Schritt 4: Nach Datum sortieren (falls möglich)
    const sortedInventory = tourInventory.sort((a, b) => {
      // Versuche Datum aus Stadt-String zu extrahieren (z.B. "Hamburg 26.09.")
      const dateA = a.city.match(/(\d{2}\.\d{2}\.)/);
      const dateB = b.city.match(/(\d{2}\.\d{2}\.)/);
      
      if (dateA && dateB) {
        return dateA[1].localeCompare(dateB[1]);
      }
      return a.city.localeCompare(b.city);
    });

    // Schritt 5: Response zusammenstellen
    const response = {
      productTitle: bundleProduct.title,
      productId: bundleProduct.id,
      totalVariants: variants.length,
      lastUpdate: new Date().toISOString(),
      tour: sortedInventory
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Inventory API Error:', error);
    res.status(500).json({ 
      error: 'Fehler beim Laden der Inventory-Daten',
      details: error.message 
    });
  }
}
