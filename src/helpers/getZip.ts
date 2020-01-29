import * as JSZip from 'jszip';

export async function getZip(url: string): Promise<JSZip> {
  const response = await fetch(url, {
    method: 'GET',
  });

  if (response.status !== 200) {
    new Error(response.statusText)
  }

  const result = await response.blob();

  return JSZip.loadAsync(result);
}
