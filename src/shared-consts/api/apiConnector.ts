// import fetch from 'node-fetch';
export enum API_STATUS {
  SUCCESS = 'Success',
  ERROR = 'Error',
}

type BasicObject = { [key: string]: string | number | boolean };
type APIResult = {
  status: number | API_STATUS;
  data?: BasicObject | ReadableStream<Uint8Array> | string | null;
  headers?: Record<string, string>;
  filename?: string;
};

const defaultHeaders = {
  'Content-Type': 'application/json',
};

// A generic response handler to parse JSON, text, or blob as needed
async function handleResponse(
  response: Response
): Promise<BasicObject | string | ArrayBuffer> {
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  } else if (contentType && contentType.includes('text')) {
    return response.text();
  } else {
    return response.arrayBuffer();
  }
}

// Helper function to normalize URLs
async function handleURL(url: string): Promise<string> {
  url = url.trim();
  if (
    !url.includes('localhost') &&
    !url.includes('127.0.0.1') &&
    !url.startsWith('https://') &&
    !url.startsWith('http://')
  ) {
    return 'https://' + url;
  }
  if (url.startsWith('127.0.0.1') || url.startsWith('localhost')) {
    return 'http://' + url;
  }
  return url;
}

export async function get(
  url: string,
  // eslint-disable-next-line
  parameters: BasicObject = {},
  headers = defaultHeaders
): Promise<APIResult> {
  console.trace();
  url = await handleURL(url);

  const result: APIResult = { data: {}, status: 0, headers: {} };
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });
    result.status = response.status;
    response.headers.forEach((value, key) => {
      result.headers![key] = value;
    });

    if (response.ok) {
      result.data = (await handleResponse(response)) as BasicObject;
      if (response.headers.get('content-disposition')) {
        const filenameMatch = response.headers
          .get('content-disposition')
          ?.match(/filename="(.+)"/);
        result.filename = filenameMatch ? filenameMatch[1] : undefined;
      }
    } else {
      console.error('Error status:', response.status);
    }
  } catch (error) {
    console.error('Fetch error:', error);
    result.status = API_STATUS.ERROR;
  }
  return result;
}

export async function post(
  url: string,
  data: Record<string, unknown>,
  headers = defaultHeaders
): Promise<APIResult> {
  url = await handleURL(url);
  const result: APIResult = { data: {}, status: 0 };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    result.status = response.status;
    result.data = (await handleResponse(response)) as BasicObject;
  } catch (error) {
    console.error('Fetch error:', error);
    result.status = API_STATUS.ERROR;
  }
  return result;
}

export async function put(
  url: string,
  data: Record<string, unknown>,
  headers = defaultHeaders
): Promise<APIResult> {
  url = await handleURL(url);
  const result: APIResult = { data: {}, status: 0 };

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    result.status = response.status;
    result.data = (await handleResponse(response)) as BasicObject;
  } catch (error) {
    console.error('Fetch error:', error);
    result.status = API_STATUS.ERROR;
  }
  return result;
}

export async function patch(
  url: string,
  data: Record<string, unknown>,
  headers = defaultHeaders
): Promise<APIResult> {
  url = await handleURL(url);
  const result: APIResult = { data: {}, status: 0 };

  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });
    result.status = response.status;
    result.data = (await handleResponse(response)) as BasicObject;
  } catch (error) {
    console.error('Fetch error:', error);
    result.status = API_STATUS.ERROR;
  }
  return result;
}

export async function remove(
  url: string,
  data: Record<string, unknown>,
  headers = defaultHeaders
): Promise<APIResult> {
  url = await handleURL(url);
  const result: APIResult = { data: {}, status: 0 };

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers,
      body: JSON.stringify(data),
    });
    result.status = response.status;
    result.data = (await handleResponse(response)) as BasicObject;
  } catch (error) {
    console.error('Fetch error:', error);
    result.status = API_STATUS.ERROR;
  }
  return result;
}

export default { get, post, put, patch, remove };
