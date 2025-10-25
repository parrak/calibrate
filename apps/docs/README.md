# Calibrate API Documentation

Interactive API documentation for the Calibrate Smart Pricing Platform.

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Open http://localhost:3001
```

### Production Deployment

The documentation is automatically deployed to Vercel when changes are pushed to the `main` branch.

**Live Documentation:** https://docs.calibr.lat

## 📚 Documentation Structure

- **OpenAPI Specification:** `api/openapi.yaml` - Complete API specification
- **Swagger UI:** `index.html` - Interactive documentation interface
- **Static Assets:** All files served as static content

## 🔗 API Endpoints

### Production
- **API Base URL:** `https://api.calibr.lat`
- **Health Check:** `https://api.calibr.lat/api/health`
- **Webhooks:** `https://api.calibr.lat/api/v1/webhooks/price-suggestion`

### Development
- **API Base URL:** `https://calibrapi-production.up.railway.app`
- **Health Check:** `https://calibrapi-production.up.railway.app/api/health`

## 🛠️ Development

### Adding New Endpoints

1. Update `api/openapi.yaml` with new endpoint specification
2. Add examples and descriptions
3. Test locally with `npm run dev`
4. Deploy changes to see live updates

### Customizing the UI

Edit `index.html` to modify:
- Header styling and branding
- Quick links navigation
- Swagger UI configuration
- Custom CSS styling

## 📖 API Features

### Authentication
- HMAC signature verification for webhooks
- Project-based access control
- Rate limiting per endpoint

### Rate Limits
- **General API:** 1000 requests per 15 minutes
- **Webhooks:** 60 requests per minute per project
- **Price Changes:** 100 requests per 5 minutes per project

### Response Formats
- Consistent JSON responses
- Error handling with proper HTTP status codes
- Pagination for list endpoints
- Detailed error messages

## 🔧 Configuration

### Environment Variables
- `API_BASE_URL` - Base URL for API requests
- `PROJECT_SLUG` - Default project for testing

### CORS Headers
- Configured for cross-origin requests
- Supports all necessary headers for API integration

## 📝 Contributing

1. Make changes to the OpenAPI specification
2. Test locally with the development server
3. Create a pull request with your changes
4. Documentation will be automatically deployed on merge

## 🆘 Support

- **Documentation Issues:** Create an issue in this repository
- **API Support:** Contact support@calibr.lat
- **Integration Help:** Check the examples in the Swagger UI

## 📄 License

MIT License - see LICENSE file for details.
