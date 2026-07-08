export interface BarcodeProductInfo {
  name: string;
  brand?: string;
  imageUrl?: string;
}

/**
 * Consulta a API pública do Open Food Facts usando um código de barras EAN.
 */
export async function fetchProductByBarcode(barcode: string): Promise<BarcodeProductInfo | null> {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    if (!res.ok) return null;
    
    const data = await res.json();
    if (data.status === 1 && data.product) {
      const p = data.product;
      const name = p.product_name || p.product_name_pt || p.generic_name;
      if (!name) return null;

      return {
        name,
        brand: p.brands ? p.brands.split(',')[0] : undefined,
        imageUrl: p.image_front_url || p.image_url,
      };
    }
    return null;
  } catch (err) {
    console.warn('Erro ao consultar OpenFoodFacts:', err);
    return null;
  }
}
