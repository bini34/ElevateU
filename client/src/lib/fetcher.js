const Fetch = async (url, method, body) => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    const fullUrl = `${backendUrl}${url}`;
    const options = {
      method,
      headers: {},
    };

    if (body instanceof FormData) {
      options.body = body; // FormData is used directly as the body
    } else {
      options.headers['Content-Type'] = 'application/json';
      options.headers['Accept'] = 'application/json';
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(fullUrl, options);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Fetch Error:', error);
    }
  };
  
  export default Fetch;