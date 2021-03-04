const epochTicks = 621355968000000000;
const ticksPerMillisecond = 10000;

export function getLocalDateTime(dateTime: string): string {
  const dateTimeObject: Date = new Date(dateTime);
  const year: number = dateTimeObject.getFullYear();
  const month: string = ensureDoubleDigits(dateTimeObject.getMonth() + 1); // Month ranges from 0 to 11
  const day: string = ensureDoubleDigits(dateTimeObject.getDate());
  const hours: string = ensureDoubleDigits(dateTimeObject.getHours());
  const minutes: string = ensureDoubleDigits(dateTimeObject.getMinutes());
  const seconds: string = ensureDoubleDigits(dateTimeObject.getSeconds());
  const milliseconds: string = ensureTripleDigits(dateTimeObject.getMilliseconds());

  const localDateTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}`;
  return localDateTime;
}

export function getUTCDateTime(dateTime: string): string {
  const dateTimeObject: Date = new Date(dateTime);
  return dateTimeObject.toISOString();
}

export function ensureDoubleDigits(num: number): string {
  let doubleDigitsString: string = num.toString();
  if (num < 10) {
    doubleDigitsString = `0${doubleDigitsString}`;
  } else if (num > 99) {
    doubleDigitsString = doubleDigitsString.substring(0, 2);
  }
  return doubleDigitsString;
}

export function ensureTripleDigits(num: number): string {
  let tripleDigitsString: string = num.toString();
  if (num < 10) {
    tripleDigitsString = `00${tripleDigitsString}`;
  } else if (num < 100) {
    tripleDigitsString = `0${tripleDigitsString}`;
  } else if (num > 999) {
    tripleDigitsString = tripleDigitsString.substring(0, 3);
  }
  return tripleDigitsString;
}

export function convertUnixToJSDate(unixTime: number): Date {
  return new Date(unixTime * 1000);
}

export function convertJSDateToUnix(dateTime: string): number {
  return Number((new Date(dateTime).getTime() / 1000).toFixed(0));
}

export function convertTicksToJSDate(ticks: string): Date {
  const ticksJSBased = Number(ticks) - epochTicks;
  const timeInMillisecond = ticksJSBased / ticksPerMillisecond;
  return new Date(timeInMillisecond);
}

export function convertJSDateToTicksWithPadding(dateTime: string): string {
  const ticks = epochTicks + new Date(dateTime).getTime() * ticksPerMillisecond;
  return padDateTicksWithZeros(ticks.toString());
}

function padDateTicksWithZeros(value: string): string {
  const s = "0000000000000000000" + value;
  return s.substr(s.length - 20);
}
