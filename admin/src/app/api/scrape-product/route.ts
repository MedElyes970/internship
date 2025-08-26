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

    // Debug: Log some basic HTML structure info
    console.log(`Page title: "${$('title').text().trim()}"`);
    console.log(`Number of H1 tags: ${$('h1').length}`);
    console.log(`Number of H2 tags: ${$('h2').length}`);
    console.log(`Number of H3 tags: ${$('h3').length}`);
    
    // Log all H1 tags for debugging
    $('h1').each((i, el) => {
      console.log(`H1[${i}]: "${$(el).text().trim()}"`);
    });

    // Extract product information based on common selectors
    // This is a generic approach - you may need to customize for specific websites
    const scrapedData: any = {};

    // Website-specific selectors for better accuracy
    const isTunisianet = normalizedUrl.includes('tunisianet.com.tn');
    const isMytek = normalizedUrl.includes('mytek.tn');
    const isJumia = normalizedUrl.includes('jumia.com.tn');
    const isElectroplanet = normalizedUrl.includes('electroplanet.tn');
    const isFnac = normalizedUrl.includes('fnac.tn');

    // Product name - try multiple common selectors with better targeting
    let nameSelectors = [];

    // Website-specific selectors (more targeted)
    if (isTunisianet) {
      nameSelectors = [
        'h1.product-name',
        'h1.product-title', 
        '.product-name h1',
        '.product-title h1',
        '.product-info h1',
        '.product-details h1',
        'h1[itemprop="name"]',
        '.product-name',
        '.product-title',
        '[data-testid="product-title"]',
        '.product-header h1',
        '.product-main h1'
      ];
    } else if (isMytek) {
      nameSelectors = [
        'h1.product-title',
        '.product-details h1',
        '.product-title h1',
        'h1[itemprop="name"]',
        '.product-name',
        '.product-title',
        '[data-testid="product-title"]',
        '.product-header h1'
      ];
    } else if (isJumia) {
      nameSelectors = [
        'h1.product-name',
        'h1.product-title',
        '.product-name h1',
        '.product-title h1',
        'h1[itemprop="name"]',
        '.product-name',
        '.product-title',
        '[data-testid="product-title"]',
        '.product-header h1'
      ];
    } else if (isElectroplanet) {
      nameSelectors = [
        'h1.product-title',
        'h1.product-name',
        '.product-title h1',
        '.product-name h1',
        'h1[itemprop="name"]',
        '.product-name',
        '.product-title',
        '[data-testid="product-title"]',
        '.product-header h1'
      ];
    } else if (isFnac) {
      nameSelectors = [
        'h1.product-title',
        'h1.product-name',
        '.product-title h1',
        '.product-name h1',
        'h1[itemprop="name"]',
        '.product-name',
        '.product-title',
        '[data-testid="product-title"]',
        '.product-header h1'
      ];
    } else {
      // Generic selectors for unknown websites
      nameSelectors = [
        'h1[itemprop="name"]',
        'h1.product-title',
        'h1.product-name',
        'h1.title',
        '.product-title h1',
        '.product-name h1',
        '.product-title',
        '.product-name',
        '.title',
        '[data-testid="product-title"]',
        '.product-header h1',
        '.product-main h1'
      ];
    }

    // Try to find the product name
    scrapedData.name = '';
    for (const selector of nameSelectors) {
      const name = $(selector).first().text().trim();
      console.log(`Trying selector "${selector}": "${name}"`);
      if (name && name.length > 3 && name.length < 200) {
        scrapedData.name = name;
        console.log(`Found product name: "${name}"`);
        break;
      }
    }

    // If still no name, try more aggressive selectors
    if (!scrapedData.name) {
      console.log('No name found with specific selectors, trying all H1 tags...');
      // Look for any h1 tag that might contain the product name
      $('h1').each((_, el) => {
        const text = $(el).text().trim();
        console.log(`Found H1 tag: "${text}"`);
        if (text && text.length > 3 && text.length < 200 && 
            !text.toLowerCase().includes('home') && 
            !text.toLowerCase().includes('welcome') &&
            !text.toLowerCase().includes('login') &&
            !text.toLowerCase().includes('register')) {
          scrapedData.name = text;
          console.log(`Selected H1 as product name: "${text}"`);
          return false; // break the loop
        }
      });
    }

    // If still no name, try H2 and H3 tags
    if (!scrapedData.name) {
      console.log('No name found in H1 tags, trying H2 and H3...');
      const headings = $('h2, h3');
      headings.each((_, el) => {
        const text = $(el).text().trim();
        console.log(`Found heading tag: "${text}"`);
        if (text && text.length > 3 && text.length < 200 && 
            !text.toLowerCase().includes('home') && 
            !text.toLowerCase().includes('welcome') &&
            !text.toLowerCase().includes('login') &&
            !text.toLowerCase().includes('register') &&
            !text.toLowerCase().includes('menu') &&
            !text.toLowerCase().includes('navigation')) {
          scrapedData.name = text;
          console.log(`Selected heading as product name: "${text}"`);
          return false; // break the loop
        }
      });
    }

    // Last resort: look for any element with common product name classes
    if (!scrapedData.name) {
      console.log('No name found in headings, trying common product name classes...');
      const commonNameSelectors = [
        '[class*="product-name"]',
        '[class*="product-title"]',
        '[class*="item-name"]',
        '[class*="goods-name"]',
        '[id*="product-name"]',
        '[id*="product-title"]'
      ];
      
      for (const selector of commonNameSelectors) {
        const element = $(selector).first();
        if (element.length > 0) {
          const text = element.text().trim();
          console.log(`Found element with selector "${selector}": "${text}"`);
          if (text && text.length > 3 && text.length < 200) {
            scrapedData.name = text;
            console.log(`Selected element as product name: "${text}"`);
            break;
          }
        }
      }
    }

    // Fallback to meta tags and title
    if (!scrapedData.name) {
      const ogTitle = $('meta[property="og:title"]').attr('content');
      const metaTitle = $('meta[name="title"]').attr('content');
      const pageTitle = $('title').text().trim();
      
      // Try to find the best title from meta tags
      if (ogTitle && ogTitle.length > 3 && ogTitle.length < 200) {
        scrapedData.name = ogTitle;
      } else if (metaTitle && metaTitle.length > 3 && metaTitle.length < 200) {
        scrapedData.name = metaTitle;
      } else if (pageTitle && pageTitle.length > 3 && pageTitle.length < 200) {
        // Clean up page title (remove site name, etc.)
        let cleanTitle = pageTitle;
        if (cleanTitle.includes('|')) {
          cleanTitle = cleanTitle.split('|')[0].trim();
        }
        if (cleanTitle.includes('-')) {
          cleanTitle = cleanTitle.split('-')[0].trim();
        }
        scrapedData.name = cleanTitle;
      }
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
      '[data-price]', '.price-value', '.product-price-value', '.price-current',
      '.product-price .price', '.price-wrapper .price', '.price-container .price'
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
      console.log(`Trying price selector "${selector}": "${price}"`);
      if (price) {
        priceText = price;
        console.log(`Found price with selector "${selector}": "${price}"`);
        break;
      }
    }
    
    if (priceText) {
      console.log(`Raw price text: "${priceText}"`);
      
      // Handle different price formats
      let cleanPrice = '';
      
      // Remove currency symbols and extra text (including DT, د.ت, etc.)
      const priceWithoutCurrency = priceText.replace(/[^\d\s,\.]/g, '').trim();
      console.log(`Price without currency: "${priceWithoutCurrency}"`);
      
      // Extract the numeric part - try multiple patterns
      let priceMatch = priceWithoutCurrency.match(/[\d\s,]+\.?\d*/);
      
      // If no match, try alternative patterns
      if (!priceMatch) {
        // Try to find price in format like "49,000 DT" or "99.99 DT"
        priceMatch = priceWithoutCurrency.match(/(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
      }
      
      // If still no match, try to find any sequence of digits with commas
      if (!priceMatch) {
        priceMatch = priceWithoutCurrency.match(/(\d+(?:,\d+)*)/);
      }
      
      if (priceMatch) {
        cleanPrice = priceMatch[0].replace(/[\s,]/g, '');
        console.log(`Cleaned price: "${cleanPrice}"`);
        
        // Parse the price
        scrapedData.price = parseFloat(cleanPrice);
        console.log(`Parsed price: ${scrapedData.price}`);
        
        // Also store the formatted price for display
        if (!isNaN(scrapedData.price)) {
          // Format with thousands separators
          scrapedData.formattedPrice = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
          }).format(scrapedData.price);
          console.log(`Formatted price: ${scrapedData.formattedPrice}`);
          
          // Also log the original vs processed for debugging
          console.log(`Price processing: "${priceText}" → "${priceWithoutCurrency}" → "${cleanPrice}" → ${scrapedData.price} → "${scrapedData.formattedPrice}"`);
        }
      } else {
        console.log('No price pattern matched');
        console.log(`Failed to extract price from: "${priceText}"`);
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
      console.log(`Final product name: "${scrapedData.name}"`);
    } else {
      console.log('No product name found after all attempts');
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
