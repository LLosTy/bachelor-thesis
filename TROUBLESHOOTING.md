# Troubleshooting Guide

## Database Connection Issues

### Error: "Database connection error"

This error typically occurs when the Directus database is not properly configured or accessible.

#### Steps to resolve:

1. **Check Environment Variables**

   - Ensure you have a `.env.local` file in your project root
   - Add the following variables:

   ```
   NEXT_PUBLIC_OPENAI_API_KEY="your-openai-api-key"
   NEXT_PUBLIC_DIRECTUS_URL="your-directus-url"
   NEXT_PUBLIC_DIRECTUS_TOKEN="your-directus-token"
   ```

2. **Verify Directus Server**

   - Make sure your Directus server is running
   - Check if the URL is accessible in your browser
   - Verify the server is running on the correct port

3. **Check Network Connectivity**

   - Ensure your application can reach the Directus server
   - Check for firewall or network restrictions
   - Verify CORS settings if applicable

4. **Test Connection**
   - In development mode, click "Show Diagnostics" to test the connection
   - Check the console for detailed error messages

### Common Error Codes

- **503 Service Unavailable**: Directus server is down or unreachable
- **401 Unauthorized**: Invalid or missing authentication token
- **403 Forbidden**: Insufficient permissions to access the database
- **404 Not Found**: Database or collection doesn't exist

## Pagination Issues

### Pagination not working correctly

1. **Check API Response**

   - Ensure the API returns proper pagination metadata
   - Verify `totalPages`, `totalItems`, and `currentPage` are correct

2. **State Management**

   - Clear browser cache and localStorage
   - Check if pagination state is being properly saved/restored

3. **Responsive Design**
   - Pagination adapts to screen size (3 items on mobile, 5 on desktop)
   - Test on different screen sizes

## Performance Issues

### Slow loading times

1. **Caching**

   - Results are cached in sessionStorage
   - Check if caching is working properly

2. **API Optimization**

   - Reduce the number of items per page
   - Check database query performance

3. **Network**
   - Check network latency
   - Consider using a CDN for static assets

## Development Tools

### Diagnostic Component

In development mode, you can access diagnostic information:

1. Click "Show Diagnostics" button
2. Review connection status
3. Check environment variable configuration
4. Test database connectivity

### Console Logging

Check the browser console for:

- API request/response logs
- Error details
- Performance metrics

## Environment Setup

### Required Environment Variables

```bash
# OpenAI API for natural language processing
NEXT_PUBLIC_OPENAI_API_KEY=sk-...

# Directus CMS configuration
NEXT_PUBLIC_DIRECTUS_URL=http://localhost:8055
NEXT_PUBLIC_DIRECTUS_TOKEN=your-token-here
```

### Example .env.local file

```env
NEXT_PUBLIC_OPENAI_API_KEY="sk-your-openai-api-key-here"
NEXT_PUBLIC_DIRECTUS_URL="http://localhost:8055"
NEXT_PUBLIC_DIRECTUS_TOKEN="your-directus-token-here"
```

## Getting Help

If you're still experiencing issues:

1. Check the browser console for detailed error messages
2. Use the diagnostic tools in development mode
3. Verify all environment variables are set correctly
4. Ensure your Directus server is running and accessible
5. Test with a simple query first before trying complex searches
