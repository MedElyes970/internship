import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Normalize URL
    let normalizedUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      normalizedUrl = `https://${url}`;
    }

    // Fetch the webpage
    const response = await fetch(normalizedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract product information based on common selectors
    // This is a generic approach - you may need to customize for specific websites
    const scrapedData: any = {};

    // Website-specific selectors for better accuracy
    const isTunisianet = normalizedUrl.includes('tunisianet.com.tn');
    const isMytek = normalizedUrl.includes('mytek.tn');
    const isJumia = normalizedUrl.includes('jumia.com.tn');
    const isElectroplanet = normalizedUrl.includes('electroplanet.tn');
    const isFnac = normalizedUrl.includes('fnac.tn');

    // Product name - try multiple common selectors
    let nameSelectors = [
      'h1.product-title', 'h1.product-name', 'h1.title', 
      '.product-title', '.product-name', '.title'
    ];

    // Website-specific selectors
    if (isTunisianet) {
      nameSelectors.unshift('.product-name h1', '.product-title h1', '.product-info h1');
    } else if (isMytek) {
      nameSelectors.unshift('.product-details h1', '.product-title h1');
    } else if (isJumia) {
      nameSelectors.unshift('.product-name h1', '.product-title h1');
    } else if (isElectroplanet) {
      nameSelectors.unshift('.product-title h1', '.product-name h1');
    } else if (isFnac) {
      nameSelectors.unshift('.product-title h1', '.product-name h1');
    }

    scrapedData.name = '';
    for (const selector of nameSelectors) {
      const name = $(selector).first().text().trim();
      if (name) {
        scrapedData.name = name;
        break;
      }
    }

    // Fallback to meta tags and title
    if (!scrapedData.name) {
      scrapedData.name = 
        $('meta[property="og:title"]').attr('content') ||
        $('title').text().trim();
    }

    // Product description
    scrapedData.description = 
      $('.product-description, .description, .product-details, .product-info').first().text().trim() ||
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      '';

    // Price - try multiple common selectors
    let priceSelectors = [
      '.price', '.product-price', '.current-price', '.regular-price', '.sale-price',
      '[data-price]', '.price-value', '.product-price-value'
    ];

    // Website-specific price selectors
    if (isTunisianet) {
      priceSelectors.unshift('.product-price .price', '.price-current', '.product-info .price');
    } else if (isMytek) {
      priceSelectors.unshift('.product-price .current-price', '.price-value');
    } else if (isJumia) {
      priceSelectors.unshift('.product-price .price', '.price-current');
    } else if (isElectroplanet) {
      priceSelectors.unshift('.product-price .price', '.price-current');
    } else if (isFnac) {
      priceSelectors.unshift('.product-price .price', '.price-current');
    }

    let priceText = '';
    for (const selector of priceSelectors) {
      const price = $(selector).first().text().trim() || $(selector).first().attr('data-price');
      if (price) {
        priceText = price;
        break;
      }
    }
    
    if (priceText) {
      // Extract numeric price from text (handle various formats)
      const priceMatch = priceText.match(/[\d\s,]+\.?\d*/);
      if (priceMatch) {
        const cleanPrice = priceMatch[0].replace(/[\s,]/g, '');
        scrapedData.price = parseFloat(cleanPrice);
      }
    }

    // Brand - try multiple common selectors
    scrapedData.brand = 
      $('.brand, .product-brand, .manufacturer, .vendor').first().text().trim() ||
      $('meta[property="product:brand"]').attr('content') ||
      '';

    // Images - try multiple common selectors
    const images: string[] = [];
    $('img.product-image, img.main-image, .product-gallery img, .gallery img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      if (src && !src.includes('placeholder') && !src.includes('logo')) {
        // Convert relative URLs to absolute
        const absoluteUrl = src.startsWith('http') ? src : new URL(src, normalizedUrl).href;
        images.push(absoluteUrl);
      }
    });

    // If no specific product images found, try general images
    if (images.length === 0) {
      $('img').each((_, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src');
        if (src && 
            !src.includes('placeholder') && 
            !src.includes('logo') && 
            !src.includes('icon') &&
            (src.includes('product') || src.includes('item') || src.includes('goods'))) {
          const absoluteUrl = src.startsWith('http') ? src : new URL(src, normalizedUrl).href;
          images.push(absoluteUrl);
        }
      });
    }

    // Limit to first 5 images
    scrapedData.images = images.slice(0, 5);

    // Specifications - try to extract from product details
    const specs: Record<string, any> = {};
    $('.specifications, .product-specs, .tech-specs, .features, .attributes').each((_, el) => {
      $(el).find('tr, .spec-item, .feature-item').each((_, specEl) => {
        const key = $(specEl).find('td:first-child, .spec-key, .feature-key').text().trim();
        const value = $(specEl).find('td:last-child, .spec-value, .feature-value').text().trim();
        if (key && value && key.length < 50 && value.length < 200) {
          specs[key] = value;
        }
      });
    });

    // Also try to extract from product details sections
    $('.product-details, .product-info, .details').each((_, el) => {
      $(el).find('p, li, div').each((_, detailEl) => {
        const text = $(detailEl).text().trim();
        if (text.includes(':') && text.length < 200) {
          const [key, ...valueParts] = text.split(':');
          const value = valueParts.join(':').trim();
          if (key && value && key.length < 50) {
            specs[key] = value;
          }
        }
      });
    });

    scrapedData.specs = specs;

    // Clean up the data
    if (scrapedData.name) {
      scrapedData.name = scrapedData.name.replace(/\s+/g, ' ').trim();
      if (scrapedData.name.length > 100) {
        scrapedData.name = scrapedData.name.substring(0, 97) + '...';
      }
    }

    if (scrapedData.description) {
      scrapedData.description = scrapedData.description.replace(/\s+/g, ' ').trim();
      if (scrapedData.description.length > 1000) {
        scrapedData.description = scrapedData.description.substring(0, 997) + '...';
      }
    }

    if (scrapedData.brand) {
      scrapedData.brand = scrapedData.brand.replace(/\s+/g, ' ').trim();
      if (scrapedData.brand.length > 50) {
        scrapedData.brand = scrapedData.brand.substring(0, 47) + '...';
      }
    }

    return NextResponse.json(scrapedData);

  } catch (error) {
    console.error('Error scraping product:', error);
    return NextResponse.json(
      { error: 'Failed to scrape product information' },
      { status: 500 }
    );
  }
}
