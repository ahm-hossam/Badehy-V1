// Safe fetch utilities that handle JSON parsing errors

/**
 * Safely parses a Response as JSON with proper error handling
 * Returns null if the response is not JSON or cannot be parsed
 */
export async function safeJsonParse<T = any>(response: Response): Promise<T | null> {
  try {
    // Check content type first
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // Try to read the response to log what we got
      const text = await response.clone().text();
      console.error('[SafeFetch] Received non-JSON response:', {
        status: response.status,
        statusText: response.statusText,
        contentType,
        preview: text.substring(0, 200)
      });
      return null;
    }

    // Parse as JSON
    const text = await response.text();
    if (!text || text.trim() === '') {
      return null;
    }

    return JSON.parse(text) as T;
  } catch (error: any) {
    console.error('[SafeFetch] JSON parse error:', error);
    // Try to get the actual response text for debugging
    try {
      const text = await response.clone().text();
      console.error('[SafeFetch] Response text:', text.substring(0, 500));
    } catch (e) {
      // Ignore
    }
    throw new Error(`Failed to parse JSON: ${error.message}`);
  }
}

/**
 * Safely fetches and parses JSON with error handling
 */
export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<{ response: Response; data: T | null; error: string | null }> {
  try {
    const response = await fetch(url, options);
    const data = await safeJsonParse<T>(response);
    
    if (!data) {
      return {
        response,
        data: null,
        error: `Server returned non-JSON response (${response.status})`
      };
    }

    return { response, data, error: null };
  } catch (error: any) {
    return {
      response: new Response(),
      data: null,
      error: error.message || 'Network error'
    };
  }
}
