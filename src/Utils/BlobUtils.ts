export const stringToBlob = (data: string, contentType: string, sliceSize = 512): Blob => {
  const byteArrays = [];

  for (let offset = 0; offset < data.length; offset += sliceSize) {
    const slice = data.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: contentType });
};
