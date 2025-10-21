export const generateObjectId = (char = 4) => {
  const timestamp = Math.floor(Date.now() / 1000).toString(16);
  const random = 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, () =>
    Math.floor(Math.random() * 16).toString(16)
  );
  const objectId = (timestamp + random).substring(0, 24);
  return objectId.slice(-char);
};

export const generateNumericId = (length = 12) => {
  const timestamp = Date.now().toString(); 
  const randomPart = Array.from({ length: length })
    .map(() => Math.floor(Math.random() * 10))
    .join('');
  const numericId = (timestamp + randomPart).slice(-length);
  return numericId;
};
