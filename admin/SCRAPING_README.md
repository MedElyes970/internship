# Web Scraping Feature for Product Import

## Overview
The admin product form now includes a web scraping feature that allows administrators to automatically import product information from rival websites. This feature helps streamline the product addition process by extracting key information like product names, descriptions, prices, images, and specifications.

## How It Works

### 1. URL Input Field
- Located at the top of the Add Product form
- Accepts URLs from rival e-commerce websites
- Supports both `http://` and `https://` protocols
- Automatically adds `https://` if no protocol is specified

### 2. Supported Websites
The scraping system is optimized for the following Tunisian e-commerce websites:
- **Tunisianet** (tunisianet.com.tn)
- **Mytek** (mytek.tn)
- **Jumia** (jumia.com.tn)
- **Electroplanet** (electroplanet.tn)
- **Fnac** (fnac.tn)

### 3. Data Extraction
The system automatically extracts:
- **Product Name**: From H1 tags, meta tags, and page titles
- **Description**: From product description sections and meta descriptions
- **Price**: From price elements with automatic currency detection
- **Brand**: From brand/manufacturer sections
- **Images**: Up to 5 product images (excluding logos and placeholders)
- **Specifications**: From product specs tables and feature lists

### 4. Smart Category Detection
The system attempts to suggest appropriate categories based on:
- Product name keywords
- Description content
- Common product patterns

## Usage Instructions

### Step 1: Navigate to Add Product
1. Go to the Products page in the admin dashboard
2. Click "Add Product" button
3. The form will open in a slide-out panel

### Step 2: Use the Scraping Feature
1. In the "Import from Rival Website" section, paste a product URL
2. Click the "Scrape" button or press Enter
3. Wait for the scraping process to complete
4. Review the extracted information

### Step 3: Review and Edit
1. All scraped fields will be automatically filled
2. Review and edit the information as needed
3. Add any missing information manually
4. Select appropriate category and subcategory
5. Submit the form

## Technical Details

### API Endpoint
- **Route**: `/api/scrape-product`
- **Method**: POST
- **Body**: `{ "url": "product_url_here" }`

### Dependencies
- **Cheerio**: HTML parsing and DOM manipulation
- **Next.js API Routes**: Server-side processing
- **User-Agent Spoofing**: To avoid blocking by websites

### Error Handling
- Invalid URL format validation
- Network request failures
- Unsupported website structures
- Empty or invalid data responses

## Best Practices

### 1. URL Format
- Use complete URLs when possible
- Ensure the URL points to a specific product page
- Avoid category or listing pages

### 2. Data Review
- Always review scraped data before submission
- Verify prices and specifications
- Check image quality and relevance
- Ensure category suggestions are appropriate

### 3. Legal Considerations
- Respect robots.txt files
- Don't overload target servers with requests
- Use this feature responsibly and ethically
- Consider rate limiting for bulk operations

## Troubleshooting

### Common Issues

#### "No product information found"
- The website structure might be different
- The page might be using JavaScript to load content
- The selectors might need updating for new websites

#### "Failed to scrape product information"
- Check if the URL is accessible
- Verify the website is not blocking requests
- Ensure the URL points to a valid product page

#### Images not loading
- Some websites use lazy loading
- Images might be blocked by CORS policies
- Check if the image URLs are valid

### Solutions
1. **Try different URLs** from the same website
2. **Check website accessibility** in a regular browser
3. **Update selectors** for new website structures
4. **Contact support** if issues persist

## Future Enhancements

### Planned Features
- **More website support**: Additional e-commerce platforms
- **Better image handling**: Automatic image optimization
- **Advanced category detection**: Machine learning-based suggestions
- **Bulk import**: Multiple products from category pages
- **Data validation**: Enhanced accuracy checking

### Customization
- **Website-specific selectors**: Easy addition of new sites
- **Field mapping**: Customizable data extraction
- **Template system**: Reusable scraping configurations

## Support

For technical support or feature requests related to the web scraping functionality, please contact the development team or create an issue in the project repository.

---

**Note**: This feature is designed for legitimate business use cases. Please ensure compliance with applicable laws and website terms of service when using this functionality.
